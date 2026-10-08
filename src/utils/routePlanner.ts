import type { BusStop, BusRoute, LiveVehicle } from '../types/bus.ts';
import { getDistanceMeters } from '../hooks/useGeolocation.ts';

export interface LocationPoint {
  id: string;
  name: string;
  secondaryText?: string;
  lat: number;
  lon: number;
  type?: 'poi' | 'stop' | 'address' | 'gps';
  stopCode?: string;
}

export interface RouteStep {
  type: 'walk' | 'bus';
  description: string;
  lineShortName?: string;
  lineColor?: string;
  lineTextColor?: string;
  headsign?: string;
  fromName: string;
  fromStopCode?: string;
  toName: string;
  toStopCode?: string;
  estimatedMinutes: number;
  distanceMeters?: number;
  stopsCount?: number;
  isRealtime?: boolean;
}

export interface RoutePlanResult {
  id: string;
  totalMinutes: number;
  totalWalkMeters: number;
  transfersCount: number;
  origin: LocationPoint;
  destination: LocationPoint;
  steps: RouteStep[];
  departureTime: string;
  arrivalTime: string;
  isDirectWalkOnly?: boolean;
  originStop?: BusStop;
  destinationStop?: BusStop;
}

function formatClockTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Calculates door-to-door transit plans between any two points in Valladolid
 * (addresses, POIs, GPS location, or bus stops) including first-mile and
 * last-mile walking legs.
 */
export function findDoorToDoorPlans(
  origin: LocationPoint,
  destination: LocationPoint,
  stops: BusStop[],
  routes: BusRoute[],
  vehicles: LiveVehicle[]
): RoutePlanResult[] {
  const directDistance = getDistanceMeters(origin.lat, origin.lon, destination.lat, destination.lon);
  if (directDistance < 30) return []; // Same location

  const now = new Date();
  const results: RoutePlanResult[] = [];

  // 1. Direct Walking Option (if reasonable distance, e.g. <= 1400m)
  if (directDistance <= 1400) {
    const walkMin = Math.max(2, Math.round(directDistance / 75)); // ~4.5 km/h walking pace
    const arrivalDate = new Date(now.getTime() + walkMin * 60000);

    results.push({
      id: 'direct_walk',
      totalMinutes: walkMin,
      totalWalkMeters: directDistance,
      transfersCount: 0,
      origin,
      destination,
      departureTime: formatClockTime(now),
      arrivalTime: formatClockTime(arrivalDate),
      isDirectWalkOnly: true,
      steps: [
        {
          type: 'walk',
          description: `Camina directo desde ${origin.name} hasta ${destination.name}`,
          fromName: origin.name,
          toName: destination.name,
          distanceMeters: directDistance,
          estimatedMinutes: walkMin,
        },
      ],
    });
  }

  // 2. Find candidate boarding stops near origin (within 800m)
  let originCandidateStops: Array<{ stop: BusStop; dist: number; walkMin: number }> = [];

  if (origin.stopCode) {
    const found = stops.find(s => s.code === origin.stopCode);
    if (found) originCandidateStops = [{ stop: found, dist: 0, walkMin: 0 }];
  }

  if (originCandidateStops.length === 0) {
    const scored = stops
      .map(s => {
        const dist = getDistanceMeters(origin.lat, origin.lon, s.lat, s.lon);
        return { stop: s, dist, walkMin: Math.ceil(dist / 75) };
      })
      .filter(item => item.dist <= 800)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 6);
    originCandidateStops = scored;
  }

  // 3. Find candidate alighting stops near destination (within 800m)
  let destCandidateStops: Array<{ stop: BusStop; dist: number; walkMin: number }> = [];

  if (destination.stopCode) {
    const found = stops.find(s => s.code === destination.stopCode);
    if (found) destCandidateStops = [{ stop: found, dist: 0, walkMin: 0 }];
  }

  if (destCandidateStops.length === 0) {
    const scored = stops
      .map(s => {
        const dist = getDistanceMeters(destination.lat, destination.lon, s.lat, s.lon);
        return { stop: s, dist, walkMin: Math.ceil(dist / 75) };
      })
      .filter(item => item.dist <= 800)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 6);
    destCandidateStops = scored;
  }

  if (originCandidateStops.length === 0 || destCandidateStops.length === 0) {
    // If no stops found in 800m (e.g. outskirts), take the single closest stop to each
    const closestOrig = findClosestStop(origin.lat, origin.lon, stops);
    const closestDest = findClosestStop(destination.lat, destination.lon, stops);
    if (closestOrig) {
      const dist = getDistanceMeters(origin.lat, origin.lon, closestOrig.lat, closestOrig.lon);
      originCandidateStops = [{ stop: closestOrig, dist, walkMin: Math.ceil(dist / 75) }];
    }
    if (closestDest) {
      const dist = getDistanceMeters(destination.lat, destination.lon, closestDest.lat, closestDest.lon);
      destCandidateStops = [{ stop: closestDest, dist, walkMin: Math.ceil(dist / 75) }];
    }
  }

  // Build Route lookup
  const routeMap = new Map<string, BusRoute>();
  for (const r of routes) {
    routeMap.set(r.shortName.toUpperCase(), r);
    routeMap.set(r.id, r);
  }

  // 4. Evaluate DIRECT bus connections between candidate origin stops and candidate destination stops
  const directPlansSeen = new Set<string>();

  for (const origItem of originCandidateStops) {
    for (const destItem of destCandidateStops) {
      if (origItem.stop.code === destItem.stop.code) continue;

      for (const route of routes) {
        for (const [dirKey, dir] of Object.entries(route.directions || {})) {
          const stopsList = dir.stops;
          const idxA = stopsList.findIndex(s => s.stopCode === origItem.stop.code);
          const idxB = stopsList.findIndex(s => s.stopCode === destItem.stop.code);

          if (idxA !== -1 && idxB !== -1 && idxA < idxB) {
            const stopsBetween = idxB - idxA;
            const busMinutes = Math.max(3, Math.round(stopsBetween * 1.8));

            // Check if there is an active live bus approaching
            const lineVehicle = vehicles.find(
              v => v.lineName.toUpperCase() === route.shortName.toUpperCase()
            );
            const waitMinutes = lineVehicle ? 3 : 5;
            const totalMinutes = origItem.walkMin + waitMinutes + busMinutes + destItem.walkMin;
            const totalWalkMeters = origItem.dist + destItem.dist;

            // Deduplication key by line & direction
            const planKey = `direct_${route.shortName}_${dirKey}`;
            if (directPlansSeen.has(planKey)) continue;
            directPlansSeen.add(planKey);

            const steps: RouteStep[] = [];

            // First-mile walking leg
            if (origItem.dist > 40) {
              steps.push({
                type: 'walk',
                description: `Camina ${origItem.dist} m (~${origItem.walkMin} min) hasta la parada #${origItem.stop.code} ${origItem.stop.name}`,
                fromName: origin.name,
                toName: origItem.stop.name,
                toStopCode: origItem.stop.code,
                distanceMeters: origItem.dist,
                estimatedMinutes: origItem.walkMin,
              });
            }

            // Bus leg
            const headsign = dir.headsign || route.destination;
            steps.push({
              type: 'bus',
              description: `Sube a la Línea ${route.shortName} dirección ${headsign} en parada #${origItem.stop.code}`,
              lineShortName: route.shortName,
              lineColor: route.color || '#008075',
              lineTextColor: route.textColor || '#FFFFFF',
              headsign,
              fromName: origItem.stop.name,
              fromStopCode: origItem.stop.code,
              toName: destItem.stop.name,
              toStopCode: destItem.stop.code,
              estimatedMinutes: busMinutes,
              stopsCount: stopsBetween,
              isRealtime: !!lineVehicle,
            });

            // Last-mile walking leg
            if (destItem.dist > 40) {
              steps.push({
                type: 'walk',
                description: `Camina ${destItem.dist} m (~${destItem.walkMin} min) desde parada #${destItem.stop.code} hasta tu destino: ${destination.name}`,
                fromName: destItem.stop.name,
                fromStopCode: destItem.stop.code,
                toName: destination.name,
                distanceMeters: destItem.dist,
                estimatedMinutes: destItem.walkMin,
              });
            }

            const arrivalDate = new Date(now.getTime() + totalMinutes * 60000);

            results.push({
              id: `direct_${route.shortName}_${origItem.stop.code}_${destItem.stop.code}`,
              totalMinutes,
              totalWalkMeters,
              transfersCount: 0,
              origin,
              destination,
              originStop: origItem.stop,
              destinationStop: destItem.stop,
              departureTime: formatClockTime(now),
              arrivalTime: formatClockTime(arrivalDate),
              steps,
            });
          }
        }
      }
    }
  }

  // 5. Evaluate 1-TRANSFER connections if needed (or to find better connections)
  // Only search transfers if we have fewer than 3 direct options
  if (results.filter(r => !r.isDirectWalkOnly).length < 3) {
    const topOrigItem = originCandidateStops[0];
    const topDestItem = destCandidateStops[0];

    if (topOrigItem && topDestItem) {
      const origRoutes = new Set(topOrigItem.stop.routes.map(r => r.toUpperCase()));
      const destRoutes = new Set(topDestItem.stop.routes.map(r => r.toUpperCase()));

      let transferCount = 0;

      for (const r1Name of origRoutes) {
        const route1 = routeMap.get(r1Name);
        if (!route1) continue;

        for (const [, dir1] of Object.entries(route1.directions || {})) {
          const idxA = dir1.stops.findIndex(s => s.stopCode === topOrigItem.stop.code);
          if (idxA === -1) continue;

          // Check candidate transfer stops along route1
          for (let i = idxA + 1; i < dir1.stops.length; i++) {
            const transferStopCand = dir1.stops[i];

            for (const r2Name of destRoutes) {
              if (r1Name === r2Name) continue;
              const route2 = routeMap.get(r2Name);
              if (!route2) continue;

              for (const [, dir2] of Object.entries(route2.directions || {})) {
                const idxT = dir2.stops.findIndex(s => s.stopCode === transferStopCand.stopCode);
                const idxB = dir2.stops.findIndex(s => s.stopCode === topDestItem.stop.code);

                if (idxT !== -1 && idxB !== -1 && idxT < idxB) {
                  const stops1 = i - idxA;
                  const stops2 = idxB - idxT;
                  const leg1Min = Math.max(3, Math.round(stops1 * 1.8));
                  const leg2Min = Math.max(3, Math.round(stops2 * 1.8));
                  const transferWaitMin = 5;

                  const totalMinutes =
                    topOrigItem.walkMin +
                    3 + // wait leg 1
                    leg1Min +
                    transferWaitMin +
                    leg2Min +
                    topDestItem.walkMin;

                  const totalWalkMeters = topOrigItem.dist + topDestItem.dist;
                  const steps: RouteStep[] = [];

                  // First-mile walk
                  if (topOrigItem.dist > 40) {
                    steps.push({
                      type: 'walk',
                      description: `Camina ${topOrigItem.dist} m hasta parada #${topOrigItem.stop.code} ${topOrigItem.stop.name}`,
                      fromName: origin.name,
                      toName: topOrigItem.stop.name,
                      toStopCode: topOrigItem.stop.code,
                      distanceMeters: topOrigItem.dist,
                      estimatedMinutes: topOrigItem.walkMin,
                    });
                  }

                  // Bus leg 1
                  steps.push({
                    type: 'bus',
                    description: `Línea ${route1.shortName} dirección ${dir1.headsign || route1.destination}`,
                    lineShortName: route1.shortName,
                    lineColor: route1.color || '#008075',
                    lineTextColor: route1.textColor || '#FFFFFF',
                    headsign: dir1.headsign,
                    fromName: topOrigItem.stop.name,
                    fromStopCode: topOrigItem.stop.code,
                    toName: transferStopCand.name,
                    toStopCode: transferStopCand.stopCode,
                    estimatedMinutes: leg1Min,
                    stopsCount: stops1,
                  });

                  // Transfer step
                  steps.push({
                    type: 'walk',
                    description: `Trasbordo en parada #${transferStopCand.stopCode} ${transferStopCand.name} (espera ~${transferWaitMin} min)`,
                    fromName: transferStopCand.name,
                    fromStopCode: transferStopCand.stopCode,
                    toName: transferStopCand.name,
                    toStopCode: transferStopCand.stopCode,
                    estimatedMinutes: transferWaitMin,
                  });

                  // Bus leg 2
                  steps.push({
                    type: 'bus',
                    description: `Línea ${route2.shortName} dirección ${dir2.headsign || route2.destination}`,
                    lineShortName: route2.shortName,
                    lineColor: route2.color || '#008075',
                    lineTextColor: route2.textColor || '#FFFFFF',
                    headsign: dir2.headsign,
                    fromName: transferStopCand.name,
                    fromStopCode: transferStopCand.stopCode,
                    toName: topDestItem.stop.name,
                    toStopCode: topDestItem.stop.code,
                    estimatedMinutes: leg2Min,
                    stopsCount: stops2,
                  });

                  // Last-mile walk
                  if (topDestItem.dist > 40) {
                    steps.push({
                      type: 'walk',
                      description: `Camina ${topDestItem.dist} m hasta ${destination.name}`,
                      fromName: topDestItem.stop.name,
                      fromStopCode: topDestItem.stop.code,
                      toName: destination.name,
                      distanceMeters: topDestItem.dist,
                      estimatedMinutes: topDestItem.walkMin,
                    });
                  }

                  const arrivalDate = new Date(now.getTime() + totalMinutes * 60000);

                  results.push({
                    id: `transfer_${route1.shortName}_${route2.shortName}_${transferStopCand.stopCode}`,
                    totalMinutes,
                    totalWalkMeters,
                    transfersCount: 1,
                    origin,
                    destination,
                    originStop: topOrigItem.stop,
                    destinationStop: topDestItem.stop,
                    departureTime: formatClockTime(now),
                    arrivalTime: formatClockTime(arrivalDate),
                    steps,
                  });

                  transferCount++;
                  if (transferCount >= 2) break;
                }
              }
              if (transferCount >= 2) break;
            }
            if (transferCount >= 2) break;
          }
          if (transferCount >= 2) break;
        }
        if (transferCount >= 2) break;
      }
    }
  }

  // Sort by total travel duration
  return results.sort((a, b) => a.totalMinutes - b.totalMinutes).slice(0, 4);
}

/**
 * Backward-compatible helper for legacy stop-to-stop routing.
 */
export function findRoutePlans(
  originStop: BusStop,
  destinationStop: BusStop,
  routes: BusRoute[],
  vehicles: LiveVehicle[]
): RoutePlanResult[] {
  const origin: LocationPoint = {
    id: `stop_${originStop.code}`,
    name: originStop.name,
    lat: originStop.lat,
    lon: originStop.lon,
    type: 'stop',
    stopCode: originStop.code,
  };

  const destination: LocationPoint = {
    id: `stop_${destinationStop.code}`,
    name: destinationStop.name,
    lat: destinationStop.lat,
    lon: destinationStop.lon,
    type: 'stop',
    stopCode: destinationStop.code,
  };

  return findDoorToDoorPlans(origin, destination, [originStop, destinationStop], routes, vehicles);
}

/**
 * Helper to locate the closest bus stop to given coordinates.
 */
export function findClosestStop(
  lat: number,
  lon: number,
  stops: BusStop[]
): BusStop | null {
  if (stops.length === 0) return null;
  let closest: BusStop | null = null;
  let minDistance = Infinity;

  for (const s of stops) {
    const dist = getDistanceMeters(lat, lon, s.lat, s.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = s;
    }
  }

  return closest;
}
