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

function findDataDir() {
  const candidates = [
    path.resolve(process.cwd(), 'server/data'),
    path.resolve(process.cwd(), 'data'),
    path.resolve(import.meta.dirname || '', 'data'),
    path.resolve(import.meta.dirname || '', '../server/data'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.existsSync(path.join(c, 'routes.json'))) {
      return c;
    }
  }
  return path.resolve('server/data');
}

const DATA_DIR = findDataDir();

// Load static GTFS data into memory
console.log(`Cargando datos estáticos de AUVASA desde ${DATA_DIR}...`);
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
      timeout: 5000,
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
        speed: Math.round((pos.speed || 0) * 3.6),
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
      timeout: 5000,
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
      timeout: 5000,
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

// On-demand caching for serverless environments
async function ensureRealtimeData() {
  const now = Date.now();
  const lastUpdate = rtState.lastVehiclesUpdate ? new Date(rtState.lastVehiclesUpdate).getTime() : 0;
  if (now - lastUpdate > 12000 || rtState.vehicles.length === 0) {
    await Promise.allSettled([fetchRealtimeVehicles(), fetchRealtimeTripUpdates()]);
  }
}

async function ensureAlertsData() {
  const now = Date.now();
  const lastUpdate = rtState.lastAlertsUpdate ? new Date(rtState.lastAlertsUpdate).getTime() : 0;
  if (now - lastUpdate > 30000 || rtState.alerts.length === 0) {
    await fetchRealtimeAlerts();
  }
}

// Poller loop for persistent background execution (local/container environments)
if (!process.env.VERCEL) {
  const pollLoop = async () => {
    await Promise.allSettled([fetchRealtimeVehicles(), fetchRealtimeTripUpdates()]);
  };
  pollLoop();
  fetchRealtimeAlerts();
  setInterval(pollLoop, 10000);
  setInterval(fetchRealtimeAlerts, 30000);
}

// --- REST API ROUTES ---
const router = express.Router();

// Health & status
router.get('/health', async (req, res) => {
  await ensureRealtimeData();
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
router.get('/lines', (req, res) => {
  res.json({
    routes: routesData,
    total: routesData.length,
  });
});

// Single route details
router.get('/lines/:lineId', async (req, res) => {
  await ensureRealtimeData();
  const lineId = req.params.lineId;
  const route = routeById.get(lineId) || routeByShortName.get(lineId);
  if (!route) {
    return res.status(404).json({ error: 'Línea no encontrada' });
  }

  const liveBuses = rtState.vehicles.filter(
    v => v.routeId === route.id || v.lineName.toUpperCase() === route.shortName.toUpperCase()
  );

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
router.get('/stops', (req, res) => {
  res.json({
    stops: stopsData,
    total: stopsData.length,
  });
});

// Real-time arrivals for a stop
router.get('/stops/:stopCode/arrivals', async (req, res) => {
  await ensureRealtimeData();
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

  const scheduledList = scheduledArrivals[stopCode] || [];
  const scheduledArrivalsOutput = [];

  for (const s of scheduledList) {
    if (s.d >= currentTimeStr) {
      const [h, m, sec] = s.d.split(':').map(Number);
      const schedDate = new Date();
      schedDate.setHours(h, m, sec || 0, 0);
      const schedTimestamp = Math.floor(schedDate.getTime() / 1000);
      const diffSec = schedTimestamp - nowSec;

      if (diffSec >= 0 && diffSec <= 5400) {
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
router.get('/realtime/vehicles', async (req, res) => {
  await ensureRealtimeData();
  res.json({
    count: rtState.vehicles.length,
    updatedAt: rtState.lastVehiclesUpdate,
    vehicles: rtState.vehicles,
  });
});

// Service alerts
router.get('/realtime/alerts', async (req, res) => {
  await ensureAlertsData();
  res.json({
    count: rtState.alerts.length,
    updatedAt: rtState.lastAlertsUpdate,
    alerts: rtState.alerts,
  });
});

// Mount router on both /api and / to handle direct and rewritten requests seamlessly
app.use('/api', router);
app.use('/', router);

// Serve frontend in standalone production build
const DIST_DIR = path.resolve('dist');
if (fs.existsSync(DIST_DIR) && !process.env.VERCEL) {
  app.use(express.static(DIST_DIR));
  app.use((req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Start listening only in standalone server mode (not in Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor AUVASA VallaBus API activo en http://localhost:${PORT}`);
  });
}

export default app;
