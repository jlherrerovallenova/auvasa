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
const calendarServicesData = fs.existsSync(path.join(DATA_DIR, 'calendar_services.json'))
  ? JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'calendar_services.json'), 'utf-8'))
  : { dates: {}, dow: {} };

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
        occupancy: v.occupancyStatus !== undefined && v.occupancyStatus !== null ? v.occupancyStatus : 'UNKNOWN',
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

// Helper for searching stops by name
function searchStopsByName(query) {
  if (!query) return [];
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return stopsData.filter(s => {
    const nameNorm = s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return nameNorm.includes(q);
  });
}

// Calculate real-time arrivals for a stop with GTFS-RT Delay Interpolation & GPS Matching
async function calculateStopArrivals(stopCode) {
  await ensureRealtimeData();
  const stopObj = stopByCode.get(stopCode);
  if (!stopObj) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const nowMadrid = new Date();
  const todayMidnight = new Date(nowMadrid);
  todayMidnight.setHours(0, 0, 0, 0);
  const midnightSec = Math.floor(todayMidnight.getTime() / 1000);

  const currentHours = String(nowMadrid.getHours()).padStart(2, '0');
  const currentMinutes = String(nowMadrid.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}:00`;

  const coveredTripIds = new Set();
  const realTimeArrivals = [];
  const seenRTKeys = new Set();

  for (const tu of rtState.tripUpdates) {
    const tripData = tripStopSeqMap[tu.tripId];
    if (!tripData) continue;
    const staticStops = Array.isArray(tripData) ? tripData : tripData.stops || [];
    if (staticStops.length === 0) continue;

    const tripHeadsign = tripData.headsign || '';

    // Collect known prediction times from GTFS-RT stopTimeUpdates
    const knownPreds = new Map();
    let minUpcomingSeq = 999999;
    for (const stu of tu.stopTimeUpdates) {
      const arr = stu.arrival || stu.departure;
      if (arr && stu.stopSequence !== undefined) {
        knownPreds.set(stu.stopSequence, Number(arr));
        if (stu.stopSequence < minUpcomingSeq) {
          minUpcomingSeq = stu.stopSequence;
        }
      }
    }

    if (knownPreds.size === 0) continue;

    const knownSeqs = Array.from(knownPreds.keys()).sort((a, b) => a - b);
    const knownDelays = new Map();
    for (const seq of knownSeqs) {
      const stopInfo = staticStops.find(s => s.seq === seq);
      if (stopInfo) {
        const schedTimestamp = midnightSec + stopInfo.schedSec;
        const delay = knownPreds.get(seq) - schedTimestamp;
        knownDelays.set(seq, delay);
      }
    }

    // Check if this trip serves the target stop
    const matchingStop = staticStops.find(s => s.stopCode === stopCode || s.stopId === stopObj.id);
    if (!matchingStop) continue;

    // Strict vehicle matching:
    // A live GPS vehicle only belongs to this arrival if it is actively broadcasting GPS on this specific tripId
    const liveVehicle = rtState.vehicles.find(v => v.tripId === tu.tripId);
    const hasLiveVehicle = !!liveVehicle;

    // If bus is actively running on the road, don't show arrivals for stops it has already passed
    if (hasLiveVehicle && matchingStop.seq < minUpcomingSeq && minUpcomingSeq !== 999999) {
      continue;
    }

    // Deduplicate: same trip visiting the same stop only once
    const rtKey = `${tu.tripId}|${matchingStop.stopCode || stopCode}`;
    if (seenRTKeys.has(rtKey)) continue;
    seenRTKeys.add(rtKey);

    let estArrivalTimestamp;
    const schedTimestamp = midnightSec + matchingStop.schedSec;

    if (knownPreds.has(matchingStop.seq)) {
      estArrivalTimestamp = knownPreds.get(matchingStop.seq);
    } else {
      // Standard GTFS-RT delay interpolation & propagation across intermediate stops
      let delay = 0;
      const firstKnownSeq = knownSeqs[0];
      const lastKnownSeq = knownSeqs[knownSeqs.length - 1];

      if (matchingStop.seq <= firstKnownSeq) {
        delay = knownDelays.get(firstKnownSeq) || 0;
      } else if (matchingStop.seq >= lastKnownSeq) {
        delay = knownDelays.get(lastKnownSeq) || 0;
      } else {
        let seqA = firstKnownSeq;
        let seqB = lastKnownSeq;
        for (let i = 0; i < knownSeqs.length - 1; i++) {
          if (knownSeqs[i] <= matchingStop.seq && knownSeqs[i + 1] >= matchingStop.seq) {
            seqA = knownSeqs[i];
            seqB = knownSeqs[i + 1];
            break;
          }
        }
        const delayA = knownDelays.get(seqA) || 0;
        const delayB = knownDelays.get(seqB) || 0;
        const stopA = staticStops.find(s => s.seq === seqA);
        const stopB = staticStops.find(s => s.seq === seqB);
        if (stopA && stopB && stopB.schedSec > stopA.schedSec) {
          const factor = (matchingStop.schedSec - stopA.schedSec) / (stopB.schedSec - stopA.schedSec);
          delay = delayA + factor * (delayB - delayA);
        } else {
          delay = delayA;
        }
      }
      estArrivalTimestamp = Math.round(schedTimestamp + delay);
    }

    const diffSeconds = estArrivalTimestamp - nowSec;
    // Window: from -45s (just arriving / at stop) up to 75 minutes ahead
    if (diffSeconds >= -45 && diffSeconds <= 4500) {
      coveredTripIds.add(tu.tripId);
      const route = routeById.get(tu.routeId) || routeByShortName.get(tu.routeId);
      const arrivalDate = new Date(estArrivalTimestamp * 1000);
      const timeFormatted = arrivalDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Madrid'
      });

      // Exact trip headsign from GTFS
      const destination = tripHeadsign || route?.destination || route?.name || '';
      const liveStatus = hasLiveVehicle ? 'gps_live' : 'scheduled_sae';

      realTimeArrivals.push({
        tripId: tu.tripId,
        routeShortName: route?.shortName || tu.routeId,
        routeColor: route?.color || '#008075',
        routeTextColor: route?.textColor || '#FFFFFF',
        destination,
        exactTime: timeFormatted,
        timestamp: estArrivalTimestamp,
        secondsRemaining: diffSeconds,
        minutesRemaining: Math.max(0, Math.round(diffSeconds / 60)),
        isRealtime: hasLiveVehicle,
        liveStatus,
        delaySeconds: Math.round(estArrivalTimestamp - schedTimestamp),
        vehicleId: liveVehicle?.vehicleId || null,
        licensePlate: liveVehicle?.licensePlate || null,
        speed: liveVehicle?.speed || null,
        occupancy: liveVehicle?.occupancy ?? 'UNKNOWN',
      });
    }
  }

  // Exact tripId set of active GPS vehicles for 100% precise deduplication
  const activeRTTripIds = new Set(realTimeArrivals.map(r => r.tripId).filter(Boolean));

  // Complement with scheduled static arrivals for trips not covered in RT
  const scheduledList = scheduledArrivals[stopCode] || [];
  const scheduledArrivalsOutput = [];

  const yyyy = nowMadrid.getFullYear();
  const mm = String(nowMadrid.getMonth() + 1).padStart(2, '0');
  const dd = String(nowMadrid.getDate()).padStart(2, '0');
  const todayDateStr = `${yyyy}${mm}${dd}`;
  const dow = nowMadrid.getDay();

  const activeServicesList = (calendarServicesData.dates && calendarServicesData.dates[todayDateStr])
    || (calendarServicesData.dow && calendarServicesData.dow[String(dow)])
    || [];
  const activeServicesSet = new Set(activeServicesList);

  for (const s of scheduledList) {
    if (s.t && coveredTripIds.has(s.t)) continue;
    if (s.s && activeServicesSet.size > 0 && !activeServicesSet.has(s.s)) continue;

    // Exact tripId match: if this specific trip is already running in real-time, skip static schedule
    if (s.t && activeRTTripIds.has(s.t)) {
      continue;
    }

    // Parse departure as seconds since midnight — robust against GTFS hours >= 24
    const [rawH, rawM, rawSec] = s.d.split(':').map(Number);
    const depSecOfDay = (rawH || 0) * 3600 + (rawM || 0) * 60 + (rawSec || 0);
    const currentSecOfDay = nowMadrid.getHours() * 3600 + nowMadrid.getMinutes() * 60 + nowMadrid.getSeconds();

    // Only show departures that haven't happened yet (30s grace for buses leaving right now)
    if (depSecOfDay < currentSecOfDay - 30) {
      continue;
    }

    // Build actual timestamp: start of today + depSecOfDay (setSeconds handles >86400 correctly)
    const schedDate = new Date();
    schedDate.setHours(0, 0, 0, 0);
    schedDate.setSeconds(depSecOfDay);
    const schedTimestamp = Math.floor(schedDate.getTime() / 1000);
    const diffSec = schedTimestamp - nowSec;

    if (diffSec >= -30 && diffSec <= 5400) {
      // Fallback dedup only if tripId was missing or unmatched: tight 4-minute window and same route
      const hasRealtimeNearby = realTimeArrivals.some(
        rta => rta.routeShortName === s.r && Math.abs(rta.timestamp - schedTimestamp) < 240
      );

      if (!hasRealtimeNearby) {
        const displayH = rawH % 24; // normalize hour for display (24→0, 25→1, etc.)
        scheduledArrivalsOutput.push({
          routeShortName: s.r,
          routeColor: s.c,
          routeTextColor: '#FFFFFF',
          destination: s.h || '',
          exactTime: `${String(displayH).padStart(2, '0')}:${String(rawM || 0).padStart(2, '0')}`,
          timestamp: schedTimestamp,
          secondsRemaining: diffSec,
          minutesRemaining: Math.max(0, Math.round(diffSec / 60)),
          isRealtime: false,
          liveStatus: 'scheduled',
          delaySeconds: 0,
          vehicleId: null,
          licensePlate: null,
          occupancy: 'UNKNOWN',
        });
      }
    }
  }

  // Deduplicate scheduled arrivals by (routeShortName, timestamp)
  const seenSchedKeys = new Set();
  const dedupedSchedArrivals = scheduledArrivalsOutput.filter(s => {
    const key = `${s.routeShortName}|${s.timestamp}`;
    if (seenSchedKeys.has(key)) return false;
    seenSchedKeys.add(key);
    return true;
  });

  const allArrivals = [...realTimeArrivals, ...dedupedSchedArrivals]
    .sort((a, b) => a.secondsRemaining - b.secondsRemaining)
    .slice(0, 15);

  return {
    stopCode: stopObj.code,
    stopName: stopObj.name,
    lat: stopObj.lat,
    lon: stopObj.lon,
    routes: stopObj.routes,
    updatedAt: new Date().toISOString(),
    realtimeCount: realTimeArrivals.filter(a => a.liveStatus === 'gps_live').length,
    arrivals: allArrivals,
  };
}

// Real-time arrivals for a stop
router.get('/stops/:stopCode/arrivals', async (req, res) => {
  const { stopCode } = req.params;
  const data = await calculateStopArrivals(stopCode);
  if (!data) {
    return res.status(404).json({ error: 'Parada no encontrada con código ' + stopCode });
  }
  res.json(data);
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

// Initialize Alexa Skill Integration
import { createAlexaSkill } from './alexa.mjs';

const { handler: alexaHandler } = createAlexaSkill({
  getStopArrivals: calculateStopArrivals,
  getStopByCode: (code) => stopByCode.get(code),
  searchStopsByName,
  getAlerts: async () => {
    await ensureAlertsData();
    return rtState.alerts;
  },
  getLines: () => routesData,
});

// Alexa Webhook Endpoint
app.post('/api/alexa', alexaHandler);
app.post('/alexa', alexaHandler);

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
