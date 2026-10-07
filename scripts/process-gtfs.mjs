import fs from 'fs';
import path from 'path';
import readline from 'readline';

const RAW_DIR = path.resolve('gtfs_raw');
const DATA_DIR = path.resolve('server/data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function processGTFS() {
  console.log('--- Iniziando procesamiento GTFS Valladolid (AUVASA) ---');
  console.time('Procesamiento completado en');

  // 1. Process routes
  console.log('1. Procesando routes.txt...');
  const routes = {};
  {
    const rl = readline.createInterface({
      input: fs.createReadStream(path.join(RAW_DIR, 'routes.txt'), { encoding: 'utf-8' }),
    });
    let isHeader = true;
    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }
      if (!line.trim()) continue;
      const parts = line.split(',');
      const id = parts[0].trim();
      const shortName = parts[2].trim();
      const name = parts[3].trim();
      const color = parts[7]?.trim() ? `#${parts[7].trim()}` : '#008075';
      const textColor = parts[8]?.trim() ? `#${parts[8].trim()}` : '#FFFFFF';

      let category = 'ordinaria';
      if (shortName.startsWith('C')) category = 'circular';
      else if (shortName.startsWith('B')) category = 'buho';
      else if (shortName.startsWith('L') || shortName.startsWith('H')) category = 'lanzadera';
      else if (shortName.startsWith('F') || shortName.startsWith('E') || shortName.startsWith('PSC') || shortName.startsWith('U')) category = 'especial';

      const nameParts = name.split(' - ');
      const origin = nameParts[0]?.trim() || name;
      const destination = nameParts[1]?.trim() || nameParts[0]?.trim() || name;

      routes[id] = {
        id,
        shortName,
        name,
        color,
        textColor,
        category,
        origin,
        destination,
        directions: {}
      };
    }
  }

  // 2. Process stops
  console.log('2. Procesando stops.txt...');
  const stops = {};
  const stopIdToCode = {};
  const stopCodeToId = {};
  {
    const rl = readline.createInterface({
      input: fs.createReadStream(path.join(RAW_DIR, 'stops.txt'), { encoding: 'utf-8' }),
    });
    let isHeader = true;
    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }
      if (!line.trim()) continue;
      const parts = line.split(',');
      const stopId = parts[0].trim();
      const stopCode = parts[1].trim();
      const stopName = parts[2].trim();
      const lat = parseFloat(parts[4]);
      const lon = parseFloat(parts[5]);

      stops[stopId] = {
        stopId,
        stopCode,
        stopName,
        lat,
        lon,
        routes: new Set()
      };
      stopIdToCode[stopId] = stopCode;
      stopCodeToId[stopCode] = stopId;
    }
  }

  // 3. Process trips
  console.log('3. Procesando trips.txt...');
  const tripMap = {}; // tripId -> { routeId, directionId, headsign, shapeId }
  const routeDirTrips = {}; // `${routeId}_${dir}` -> [tripId]
  const sampleTripPerRouteDir = {}; // `${routeId}_${dir}` -> tripId
  {
    const rl = readline.createInterface({
      input: fs.createReadStream(path.join(RAW_DIR, 'trips.txt'), { encoding: 'utf-8' }),
    });
    let isHeader = true;
    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }
      if (!line.trim()) continue;
      const parts = line.split(',');
      const routeId = parts[0].trim();
      const serviceId = parts[1].trim();
      const tripId = parts[2].trim();
      const headsign = parts[3]?.trim() || '';
      const directionId = parts[4]?.trim() || '0';
      const shapeId = parts[6]?.trim() || '';

      tripMap[tripId] = { routeId, serviceId, directionId, headsign, shapeId };

      const key = `${routeId}_${directionId}`;
      if (!routeDirTrips[key]) routeDirTrips[key] = [];
      routeDirTrips[key].push(tripId);

      if (!sampleTripPerRouteDir[key]) {
        sampleTripPerRouteDir[key] = { tripId, headsign, shapeId, routeId, directionId };
      }
    }
  }

  // 3b. Process calendar_dates.txt
  console.log('3b. Procesando calendar_dates.txt...');
  const dateToServices = {};
  const dowToServices = { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set(), 6: new Set() };
  if (fs.existsSync(path.join(RAW_DIR, 'calendar_dates.txt'))) {
    const rlCal = readline.createInterface({
      input: fs.createReadStream(path.join(RAW_DIR, 'calendar_dates.txt'), { encoding: 'utf-8' }),
    });
    let isHeaderCal = true;
    for await (const line of rlCal) {
      if (isHeaderCal) { isHeaderCal = false; continue; }
      if (!line.trim()) continue;
      const [sid, date, exc] = line.split(',').map(s => s.trim());
      if (exc === '1') {
        if (!dateToServices[date]) dateToServices[date] = [];
        dateToServices[date].push(sid);

        const y = +date.slice(0, 4);
        const m = +date.slice(4, 6) - 1;
        const d = +date.slice(6, 8);
        const dow = new Date(Date.UTC(y, m, d, 12, 0, 0)).getUTCDay();
        dowToServices[dow].add(sid);
      }
    }
  }

  const dowFallback = {};
  for (const [k, v] of Object.entries(dowToServices)) {
    dowFallback[k] = Array.from(v);
  }

  const calendarData = {
    dates: dateToServices,
    dow: dowFallback
  };
  fs.writeFileSync(path.join(DATA_DIR, 'calendar_services.json'), JSON.stringify(calendarData));

  // 4. Process stop_times.txt
  console.log('4. Procesando stop_times.txt...');
  const tripStopSeqMap = {}; // tripId -> { seq: stopId }
  const sampleStopsPerRouteDir = {}; // `${routeId}_${dir}` -> Map(seq -> stopId)
  const scheduledArrivalsByStop = {}; // stopCode -> [ { routeShort, dir, departureTime, tripId } ]

  {
    const sampleTripIds = new Set(Object.values(sampleTripPerRouteDir).map(s => s.tripId));

    const rl = readline.createInterface({
      input: fs.createReadStream(path.join(RAW_DIR, 'stop_times.txt'), { encoding: 'utf-8' }),
    });
    let isHeader = true;
    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }
      if (!line.trim()) continue;
      const parts = line.split(',');
      const tripId = parts[0].trim();
      const depTime = parts[2].trim();
      const stopId = parts[3].trim();
      const seq = parseInt(parts[4].trim(), 10);

      const tripInfo = tripMap[tripId];
      if (tripInfo) {
        // Map trip stop sequences for RT lookup
        if (!tripStopSeqMap[tripId]) tripStopSeqMap[tripId] = {};
        tripStopSeqMap[tripId][seq] = {
          stopId,
          stopCode: stopIdToCode[stopId] || stopId
        };

        // Add line to stop
        const routeObj = routes[tripInfo.routeId];
        if (routeObj && stops[stopId]) {
          stops[stopId].routes.add(routeObj.shortName);
        }

        // Collect sample route stops
        if (sampleTripIds.has(tripId)) {
          const key = `${tripInfo.routeId}_${tripInfo.directionId}`;
          if (!sampleStopsPerRouteDir[key]) sampleStopsPerRouteDir[key] = [];
          sampleStopsPerRouteDir[key].push({ seq, stopId });
        }

        // Index scheduled arrivals per stopCode (sample for fast lookup, only first 20 per day or sorted)
        const stopCode = stopIdToCode[stopId];
        if (stopCode && routeObj) {
          if (!scheduledArrivalsByStop[stopCode]) scheduledArrivalsByStop[stopCode] = [];
          // Store compact schedule record
          scheduledArrivalsByStop[stopCode].push({
            r: routeObj.shortName,
            c: routeObj.color,
            h: tripInfo.headsign,
            d: depTime,
            t: tripId,
            s: tripInfo.serviceId,
          });
        }
      }
    }
  }

  // Sort and deduplicate scheduled arrivals per stop
  console.log('4b. Optimizando horarios programados por parada...');
  for (const stopCode of Object.keys(scheduledArrivalsByStop)) {
    scheduledArrivalsByStop[stopCode].sort((a, b) => a.d.localeCompare(b.d));
  }

  // Build route directions details
  console.log('5. Ensamblando direcciones y paradas de líneas...');
  for (const [key, sample] of Object.entries(sampleTripPerRouteDir)) {
    const { routeId, directionId, headsign, shapeId } = sample;
    const rawStops = sampleStopsPerRouteDir[key] || [];
    rawStops.sort((a, b) => a.seq - b.seq);
    const stopList = rawStops.map(s => {
      const stopObj = stops[s.stopId];
      return {
        seq: s.seq,
        stopId: s.stopId,
        stopCode: stopObj?.stopCode || '',
        name: stopObj?.stopName || '',
        lat: stopObj?.lat || 0,
        lon: stopObj?.lon || 0
      };
    });

    if (routes[routeId]) {
      routes[routeId].directions[directionId] = {
        headsign,
        shapeId,
        stopCount: stopList.length,
        stops: stopList
      };
    }
  }

  // 6. Process shapes.txt
  console.log('6. Procesando shapes.txt (polilíneas para mapa)...');
  const neededShapeIds = new Set(
    Object.values(sampleTripPerRouteDir).map(s => s.shapeId).filter(Boolean)
  );

  const shapes = {}; // shapeId -> [ [lat, lon], ... ]
  {
    const rl = readline.createInterface({
      input: fs.createReadStream(path.join(RAW_DIR, 'shapes.txt'), { encoding: 'utf-8' }),
    });
    let isHeader = true;
    for await (const line of rl) {
      if (isHeader) { isHeader = false; continue; }
      if (!line.trim()) continue;
      const parts = line.split(',');
      const shapeId = parts[0].trim();

      if (neededShapeIds.has(shapeId)) {
        const lat = Math.round(parseFloat(parts[1]) * 100000) / 100000;
        const lon = Math.round(parseFloat(parts[2]) * 100000) / 100000;
        const seq = parseInt(parts[3].trim(), 10);

        if (!shapes[shapeId]) shapes[shapeId] = [];
        shapes[shapeId].push({ seq, pt: [lat, lon] });
      }
    }
  }

  // Format shapes into sorted coordinate arrays
  const finalShapes = {};
  for (const [shapeId, pts] of Object.entries(shapes)) {
    pts.sort((a, b) => a.seq - b.seq);
    finalShapes[shapeId] = pts.map(p => p.pt);
  }

  // Convert Set of routes in stops to sorted array
  const finalStops = Object.values(stops).map(s => ({
    id: s.stopId,
    code: s.stopCode,
    name: s.stopName,
    lat: s.lat,
    lon: s.lon,
    routes: Array.from(s.routes).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    })
  }));

  finalStops.sort((a, b) => parseInt(a.code, 10) - parseInt(b.code, 10));

  // Write files
  console.log('7. Guardando archivos procesados en server/data/...');
  fs.writeFileSync(path.join(DATA_DIR, 'routes.json'), JSON.stringify(Object.values(routes), null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'stops.json'), JSON.stringify(finalStops, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'shapes.json'), JSON.stringify(finalShapes));
  fs.writeFileSync(path.join(DATA_DIR, 'trip_stop_seq_map.json'), JSON.stringify(tripStopSeqMap));
  fs.writeFileSync(path.join(DATA_DIR, 'scheduled_arrivals.json'), JSON.stringify(scheduledArrivalsByStop));

  console.timeEnd('Procesamiento completado en');
  console.log(`✅ ${Object.keys(routes).length} Líneas guardadas`);
  console.log(`✅ ${finalStops.length} Paradas guardadas`);
  console.log(`✅ ${Object.keys(finalShapes).length} Trazados de ruta (shapes) guardados`);
  console.log(`✅ Mapa de secuencias de viaje indexado`);
}

processGTFS().catch(console.error);
