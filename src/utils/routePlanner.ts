import type { BusStop, BusRoute, LiveVehicle } from '../types/bus.ts';
import { getDistanceMeters } from '../hooks/useGeolocation.ts';

export interface RouteStep {
  type: 'walk' | 'bus';
  description: string;
  lineShortName?: string;
  lineColor?: string;
  lineTextColor?: string;
  headsign?: string;
  fromStopName: string;
  fromStopCode: string;
  toStopName: string;
  toStopCode: string;
  estimatedMinutes: number;
  stopsCount?: number;
  isRealtime?: boolean;
}

export interface RoutePlanResult {
  id: string;
  totalMinutes: number;
  transfersCount: number;
  steps: RouteStep[];
  originStop: BusStop;
  destinationStop: BusStop;
}

export function findRoutePlans(
  originStop: BusStop,
  destinationStop: BusStop,
  routes: BusRoute[],
  vehicles: LiveVehicle[]
): RoutePlanResult[] {
  if (originStop.code === destinationStop.code) return [];

  const results: RoutePlanResult[] = [];

  // Helper map: routeId -> route
  const routeMap = new Map<string, BusRoute>();
  for (const r of routes) {
    routeMap.set(r.shortName, r);
    routeMap.set(r.id, r);
  }

  // 1. Direct routes
  for (const route of routes) {
    for (const [dirKey, dir] of Object.entries(route.directions || {})) {
      const stops = dir.stops;
      const idxA = stops.findIndex(s => s.stopCode === originStop.code);
      const idxB = stops.findIndex(s => s.stopCode === destinationStop.code);

      if (idxA !== -1 && idxB !== -1 && idxA < idxB) {
        const stopsBetween = idxB - idxA;
        // Travel time estimate: ~1.5 - 2 mins per stop in Valladolid
        const busMinutes = Math.max(3, Math.round(stopsBetween * 1.8));

        // Check if there is an active live bus approaching originStop on this line
        const lineVehicle = vehicles.find(
          v => v.lineName.toUpperCase() === route.shortName.toUpperCase()
        );

        results.push({
          id: `direct_${route.shortName}_${dirKey}`,
          totalMinutes: busMinutes + 3, // +3 min buffer
          transfersCount: 0,
          originStop,
          destinationStop,
          steps: [
            {
              type: 'bus',
              description: `Toma la Línea ${route.shortName} dirección ${dir.headsign || route.destination}`,
              lineShortName: route.shortName,
              lineColor: route.color,
              lineTextColor: route.textColor,
              headsign: dir.headsign || route.destination,
              fromStopName: originStop.name,
              fromStopCode: originStop.code,
              toStopName: destinationStop.name,
              toStopCode: destinationStop.code,
              estimatedMinutes: busMinutes,
              stopsCount: stopsBetween,
              isRealtime: !!lineVehicle,
            },
          ],
        });
      }
    }
  }

  // If direct routes exist, sort by total minutes
  if (results.length > 0) {
    return results.sort((a, b) => a.totalMinutes - b.totalMinutes).slice(0, 3);
  }

  // 2. One-transfer routes (Connect via hub stops like Plaza España, Doctrinos, Zorrilla)
  // Find lines passing through origin
  const originRoutes = new Set(originStop.routes);
  const destRoutes = new Set(destinationStop.routes);

  for (const r1Name of originRoutes) {
    const route1 = routeMap.get(r1Name);
    if (!route1) continue;

    for (const [, dir1] of Object.entries(route1.directions || {})) {
      const idxA = dir1.stops.findIndex(s => s.stopCode === originStop.code);
      if (idxA === -1) continue;

      // Check remaining stops on route1 after origin
      for (let i = idxA + 1; i < dir1.stops.length; i++) {
        const transferStopCandidate = dir1.stops[i];

        // Check if candidate transfer stop connects to any line going to destination
        for (const r2Name of destRoutes) {
          if (r1Name === r2Name) continue;
          const route2 = routeMap.get(r2Name);
          if (!route2) continue;

          for (const [, dir2] of Object.entries(route2.directions || {})) {
            const idxT = dir2.stops.findIndex(s => s.stopCode === transferStopCandidate.stopCode);
            const idxB = dir2.stops.findIndex(s => s.stopCode === destinationStop.code);

            if (idxT !== -1 && idxB !== -1 && idxT < idxB) {
              const stops1 = i - idxA;
              const stops2 = idxB - idxT;
              const leg1Min = Math.max(3, Math.round(stops1 * 1.8));
              const leg2Min = Math.max(3, Math.round(stops2 * 1.8));
              const transferWaitMin = 5; // average wait
              const totalMin = leg1Min + leg2Min + transferWaitMin;

              results.push({
                id: `transfer_${route1.shortName}_${route2.shortName}_${transferStopCandidate.stopCode}`,
                totalMinutes: totalMin,
                transfersCount: 1,
                originStop,
                destinationStop,
                steps: [
                  {
                    type: 'bus',
                    description: `Línea ${route1.shortName} hasta ${transferStopCandidate.name}`,
                    lineShortName: route1.shortName,
                    lineColor: route1.color,
                    lineTextColor: route1.textColor,
                    headsign: dir1.headsign,
                    fromStopName: originStop.name,
                    fromStopCode: originStop.code,
                    toStopName: transferStopCandidate.name,
                    toStopCode: transferStopCandidate.stopCode,
                    estimatedMinutes: leg1Min,
                    stopsCount: stops1,
                  },
                  {
                    type: 'walk',
                    description: `Trasbordo en parada #${transferStopCandidate.stopCode}`,
                    fromStopName: transferStopCandidate.name,
                    fromStopCode: transferStopCandidate.stopCode,
                    toStopName: transferStopCandidate.name,
                    toStopCode: transferStopCandidate.stopCode,
                    estimatedMinutes: transferWaitMin,
                  },
                  {
                    type: 'bus',
                    description: `Línea ${route2.shortName} hasta ${destinationStop.name}`,
                    lineShortName: route2.shortName,
                    lineColor: route2.color,
                    lineTextColor: route2.textColor,
                    headsign: dir2.headsign,
                    fromStopName: transferStopCandidate.name,
                    fromStopCode: transferStopCandidate.stopCode,
                    toStopName: destinationStop.name,
                    toStopCode: destinationStop.code,
                    estimatedMinutes: leg2Min,
                    stopsCount: stops2,
                  },
                ],
              });

              if (results.length >= 4) break;
            }
          }
          if (results.length >= 4) break;
        }
        if (results.length >= 4) break;
      }
    }
    if (results.length >= 4) break;
  }

  // Sort by total travel duration
  return results.sort((a, b) => a.totalMinutes - b.totalMinutes).slice(0, 3);
}

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
