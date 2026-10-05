import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.resolve('server/data');

// Load static GTFS data into memory
console.log('Cargando datos estáticos de AUVASA en memoria...');
const routesData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'routes.json'), 'utf-8'));
const stopsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'stops.json'), 'utf-8'));
const shapesData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'shapes.json'), 'utf-8'));
const tripStopSeqMap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'trip_stop_seq_map.json'), 'utf-8'));
const scheduledArrivals = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'scheduled_arrivals.json'), 'utf-8'));

// Indexes for ultra-fast lookups
const routeById = new Map();
const routeByShortName = new Map();
for (const r of routesData) {
  routeById.set(r.id, r);
  routeByShortName.set(r.shortName, r);
}

const stopByCode = new Map();
const stopById = new Map();
for (const s of stopsData) {
  stopByCode.set(s.code, s);
  stopById.set(s.id, s);
}

console.log(`Memoria inicializada: ${routesData.length} líneas, ${stopsData.length} paradas.`);

// Realtime state in memory
let rtState = {
  vehicles: [],
  tripUpdates: [],
  alerts: [],
  lastVehiclesUpdate: null,
  lastTripUpdate: null,
  lastAlertsUpdate: null,
  isSyncing: false,
  errorCount: 0,
};

const AUVASA_ENDPOINTS = {
  vehicles: 'http://212.170.201.204:50080/GTFSRTapi/api/vehicleposition',
  tripUpdates: 'http://212.170.201.204:50080/GTFSRTapi/api/tripupdate',
  alerts: 'http://212.170.201.204:50080/GTFSRTapi/api/alert',
};

async function fetchRealtimeVehicles() {
  try {
    const res = await axios.get(AUVASA_ENDPOINTS.vehicles, {
      responseType: 'arraybuffer',
      timeout: 8000,
    });
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(res.data));

    const list = feed.entity.map(entity => {
      const v = entity.vehicle;
      if (!v) return null;
      const trip = v.trip || {};
      const pos = v.position || {};
      const vehicleInfo = v.vehicle || {};
      const route = routeById.get(trip.routeId) || routeByShortName.get(trip.routeId);

      return {
        id: entity.id,
        vehicleId: vehicleInfo.id || entity.id,
        licensePlate: vehicleInfo.licensePlate || '',
        routeId: trip.routeId || '',
        lineName: route?.shortName || trip.routeId || '?',
        routeColor: route?.color || '#008075',
        routeTextColor: route?.textColor || '#FFFFFF',
        headsign: route?.name || '',
        tripId: trip.tripId || '',
        lat: pos.latitude || 0,
        lon: pos.longitude || 0,
        speed: Math.round((pos.speed || 0) * 3.6), // convert m/s to km/h
        bearing: pos.bearing || 0,
        timestamp: v.timestamp ? Number(v.timestamp) : Math.floor(Date.now() / 1000),
        occupancy: v.occupancyStatus || 'UNKNOWN',
      };
    }).filter(Boolean);

    rtState.vehicles = list;
    rtState.lastVehiclesUpdate = new Date().toISOString();
  } catch (err) {
    console.warn(`[RT Vehicles Warning] ${err.message}`);
    rtState.errorCount++;
  }
}

async function fetchRealtimeTripUpdates() {
  try {
    const res = await axios.get(AUVASA_ENDPOINTS.tripUpdates, {
      responseType: 'arraybuffer',
      timeout: 8000,
    });
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(res.data));

    const updates = [];
    for (const entity of feed.entity) {
      const tu = entity.tripUpdate;
      if (!tu) continue;
      updates.push({
        id: entity.id,
        tripId: tu.trip?.tripId || '',
        routeId: tu.trip?.routeId || '',
        vehicleId: tu.vehicle?.id || '',
        licensePlate: tu.vehicle?.licensePlate || '',
        timestamp: tu.timestamp ? Number(tu.timestamp) : Math.floor(Date.now() / 1000),
        stopTimeUpdates: (tu.stopTimeUpdate || []).map(stu => ({
          stopSequence: stu.stopSequence,
          stopId: stu.stopId,
          arrival: stu.arrival ? Number(stu.arrival.time) : null,
          departure: stu.departure ? Number(stu.departure.time) : null,
        })),
      });
    }

    rtState.tripUpdates = updates;
    rtState.lastTripUpdate = new Date().toISOString();
  } catch (err) {
    console.warn(`[RT TripUpdates Warning] ${err.message}`);
    rtState.errorCount++;
  }
}

async function fetchRealtimeAlerts() {
  try {
    const res = await axios.get(AUVASA_ENDPOINTS.alerts, {
      responseType: 'arraybuffer',
      timeout: 8000,
    });
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(res.data));

    const list = feed.entity.map(entity => {
      const a = entity.alert;
      if (!a) return null;
      const getLang = (obj) => {
        if (!obj || !obj.translation || obj.translation.length === 0) return '';
        return obj.translation[0].text;
      };

      return {
        id: entity.id,
        cause: a.cause || 'UNKNOWN',
        effect: a.effect || 'UNKNOWN',
        header: getLang(a.headerText) || 'Aviso de servicio',
        description: getLang(a.descriptionText) || '',
        url: getLang(a.url) || 'https://www.auvasa.es',
      };
    }).filter(Boolean);

    rtState.alerts = list;
    rtState.lastAlertsUpdate = new Date().toISOString();
  } catch (err) {
    console.warn(`[RT Alerts Warning] ${err.message}`);
  }
}

// Poller loop: vehicle & trip updates every 10s, alerts every 30s
async function pollLoop() {
  await Promise.allSettled([fetchRealtimeVehicles(), fetchRealtimeTripUpdates()]);
}

pollLoop();
fetchRealtimeAlerts();
setInterval(pollLoop, 10000);
setInterval(fetchRealtimeAlerts, 30000);

// --- REST API ROUTES ---

// Health & status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    vehiclesCount: rtState.vehicles.length,
    tripUpdatesCount: rtState.tripUpdates.length,
    alertsCount: rtState.alerts.length,
    lastVehiclesUpdate: rtState.lastVehiclesUpdate,
    lastTripUpdate: rtState.lastTripUpdate,
    stopsCount: stopsData.length,
    routesCount: routesData.length,
  });
});

// All routes
app.get('/api/lines', (req, res) => {
  res.json({
    routes: routesData,
    total: routesData.length,
  });
});

// Single route details
app.get('/api/lines/:lineId', (req, res) => {
  const lineId = req.params.lineId;
  const route = routeById.get(lineId) || routeByShortName.get(lineId);
  if (!route) {
    return res.status(404).json({ error: 'Línea no encontrada' });
  }

  // Find live vehicles currently running this line
  const liveBuses = rtState.vehicles.filter(
    v => v.routeId === route.id || v.lineName.toUpperCase() === route.shortName.toUpperCase()
  );

  // Attach shape coordinates if available
  const directionsWithShapes = {};
  for (const [dirKey, dirInfo] of Object.entries(route.directions || {})) {
    const shapeCoords = dirInfo.shapeId ? shapesData[dirInfo.shapeId] || [] : [];
    directionsWithShapes[dirKey] = {
      ...dirInfo,
      coordinates: shapeCoords,
    };
  }

  res.json({
    ...route,
    directions: directionsWithShapes,
    liveBuses,
  });
});

// All stops
app.get('/api/stops', (req, res) => {
  res.json({
    stops: stopsData,
    total: stopsData.length,
  });
});

// Real-time arrivals for a stop
app.get('/api/stops/:stopCode/arrivals', (req, res) => {
  const { stopCode } = req.params;
  const stopObj = stopByCode.get(stopCode);

  if (!stopObj) {
    return res.status(404).json({ error: 'Parada no encontrada con código ' + stopCode });
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const nowMadrid = new Date();
  const currentHours = String(nowMadrid.getHours()).padStart(2, '0');
  const currentMinutes = String(nowMadrid.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}:00`;

  const realTimeArrivals = [];

  // Match active tripUpdates
  for (const tu of rtState.tripUpdates) {
    const tripSeqMap = tripStopSeqMap[tu.tripId];
    if (!tripSeqMap) continue;

    for (const stu of tu.stopTimeUpdates) {
      const mappedStop = tripSeqMap[stu.stopSequence];
      if (!mappedStop) continue;

      if (mappedStop.stopCode === stopCode || mappedStop.stopId === stopObj.id) {
        const arrivalTimestamp = stu.arrival || stu.departure;
        if (!arrivalTimestamp) continue;

        const diffSeconds = arrivalTimestamp - nowSec;
        // Include buses within -60s (just arrived) up to 60 minutes
        if (diffSeconds >= -90 && diffSeconds <= 3600) {
          const route = routeById.get(tu.routeId) || routeByShortName.get(tu.routeId);
          const vehicle = rtState.vehicles.find(v => v.tripId === tu.tripId || (tu.vehicleId && v.vehicleId === tu.vehicleId));

          const arrivalDate = new Date(arrivalTimestamp * 1000);
          const timeFormatted = arrivalDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Madrid'
          });

          realTimeArrivals.push({
            routeShortName: route?.shortName || tu.routeId,
            routeColor: route?.color || '#008075',
            routeTextColor: route?.textColor || '#FFFFFF',
            destination: route?.name || '',
            exactTime: timeFormatted,
            timestamp: arrivalTimestamp,
            secondsRemaining: diffSeconds,
            minutesRemaining: Math.max(0, Math.round(diffSeconds / 60)),
            isRealtime: true,
            vehicleId: tu.vehicleId || vehicle?.vehicleId || null,
            licensePlate: tu.licensePlate || vehicle?.licensePlate || null,
            speed: vehicle?.speed || null,
            occupancy: vehicle?.occupancy || 'UNKNOWN',
          });
        }
      }
    }
  }

  // Fallback to scheduled arrivals if needed
  const scheduledList = scheduledArrivals[stopCode] || [];
  const scheduledArrivalsOutput = [];

  for (const s of scheduledList) {
    if (s.d >= currentTimeStr) {
      // Parse dep time
      const [h, m, sec] = s.d.split(':').map(Number);
      const schedDate = new Date();
      schedDate.setHours(h, m, sec || 0, 0);
      const schedTimestamp = Math.floor(schedDate.getTime() / 1000);
      const diffSec = schedTimestamp - nowSec;

      if (diffSec >= 0 && diffSec <= 5400) { // next 90 mins
        // Check if there is already an active real-time bus for this line within 5 mins of this time
        const hasRealtimeNearby = realTimeArrivals.some(
          rta => rta.routeShortName === s.r && Math.abs(rta.timestamp - schedTimestamp) < 300
        );

        if (!hasRealtimeNearby) {
          scheduledArrivalsOutput.push({
            routeShortName: s.r,
            routeColor: s.c,
            routeTextColor: '#FFFFFF',
            destination: s.h || '',
            exactTime: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
            timestamp: schedTimestamp,
            secondsRemaining: diffSec,
            minutesRemaining: Math.round(diffSec / 60),
            isRealtime: false,
            vehicleId: null,
            licensePlate: null,
            occupancy: 'UNKNOWN',
          });
        }
      }
    }
  }

  // Combine and sort by seconds remaining
  const allArrivals = [...realTimeArrivals, ...scheduledArrivalsOutput]
    .sort((a, b) => a.secondsRemaining - b.secondsRemaining)
    .slice(0, 15);

  res.json({
    stopCode: stopObj.code,
    stopName: stopObj.name,
    lat: stopObj.lat,
    lon: stopObj.lon,
    routes: stopObj.routes,
    updatedAt: new Date().toISOString(),
    realtimeCount: realTimeArrivals.length,
    arrivals: allArrivals,
  });
});

// All active vehicles
app.get('/api/realtime/vehicles', (req, res) => {
  res.json({
    count: rtState.vehicles.length,
    updatedAt: rtState.lastVehiclesUpdate,
    vehicles: rtState.vehicles,
  });
});

// Service alerts
app.get('/api/realtime/alerts', (req, res) => {
  res.json({
    count: rtState.alerts.length,
    updatedAt: rtState.lastAlertsUpdate,
    alerts: rtState.alerts,
  });
});

// Serve frontend in production build
const DIST_DIR = path.resolve('dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor AUVASA VallaBus API activo en http://localhost:${PORT}`);
});
