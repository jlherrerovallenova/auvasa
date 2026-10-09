import { getDistanceMeters } from '../hooks/useGeolocation.ts';
import type { StopArrival } from '../types/bus.ts';

export type WalkingCatchStatus = 'at_stop' | 'relaxed' | 'tight' | 'missed';

export interface WalkingRadarResult {
  hasLocation: boolean;
  distanceMeters: number;
  walkingMinutes: number;
  status: WalkingCatchStatus;
  marginMinutes: number;
  label: string;
  shortLabel: string;
  subLabel: string;
  badgeClass: string;
  nextBusMinutes?: number | null;
}

/**
 * Calcula si el usuario llega a tiempo a pie para tomar un autobús en tiempo real
 * basado en su posición GPS actual, la posición de la parada y los minutos restantes del bus.
 */
export function calculateWalkingRadar(
  userLat: number | null,
  userLon: number | null,
  stopLat: number,
  stopLon: number,
  arrival: StopArrival,
  allArrivals: StopArrival[] = []
): WalkingRadarResult | null {
  if (userLat === null || userLon === null || !stopLat || !stopLon) {
    return null;
  }

  const directDistance = getDistanceMeters(userLat, userLon, stopLat, stopLon);
  // Factor de desvío urbano real por calles de Valladolid (~1.25x en línea recta)
  const walkingDistance = Math.round(directDistance * 1.25);
  // Velocidad peatonal promedio ~4.8 km/h = 80 metros por minuto
  const walkingMinutes = Math.max(1, Math.round(walkingDistance / 80));

  // Si está a menos de 45 metros, se considera físicamente en la parada
  if (directDistance <= 45) {
    return {
      hasLocation: true,
      distanceMeters: directDistance,
      walkingMinutes: 0,
      status: 'at_stop',
      marginMinutes: arrival.minutesRemaining,
      label: 'Ya estás en la marquesina',
      shortLabel: 'En marquesina',
      subLabel: `${directDistance}m`,
      badgeClass: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
    };
  }

  const marginMinutes = arrival.minutesRemaining - walkingMinutes;

  // Buscar el siguiente autobús de la misma línea para avisar al usuario si no llega
  const nextSameLineArrival = allArrivals.find(
    a => a.routeShortName === arrival.routeShortName && a.timestamp > arrival.timestamp
  );
  const nextBusMinutes = nextSameLineArrival ? nextSameLineArrival.minutesRemaining : null;

  if (marginMinutes >= 2) {
    // 🟢 Margen holgado
    return {
      hasLocation: true,
      distanceMeters: walkingDistance,
      walkingMinutes,
      status: 'relaxed',
      marginMinutes,
      label: `Llegas con calma (+${marginMinutes} min de margen)`,
      shortLabel: `Llegas (+${marginMinutes}m)`,
      subLabel: `${walkingMinutes} min a pie (${walkingDistance}m)`,
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      nextBusMinutes,
    };
  }

  if (marginMinutes >= -1 && marginMinutes < 2) {
    // 🟡 Paso ligero
    return {
      hasLocation: true,
      distanceMeters: walkingDistance,
      walkingMinutes,
      status: 'tight',
      marginMinutes,
      label: marginMinutes < 0 ? 'Apura el paso (llegas muy justo)' : 'Paso ligero (llegas a tiempo)',
      shortLabel: marginMinutes < 0 ? 'Apura el paso' : 'Paso ligero',
      subLabel: `${walkingMinutes} min a pie (${walkingDistance}m)`,
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse',
      nextBusMinutes,
    };
  }

  // 🔴 No llegas a pie
  const label =
    nextBusMinutes !== null
      ? `No corras: no llegas (el siguiente pasa en ${nextBusMinutes} min)`
      : `No llegas a pie (-${Math.abs(marginMinutes)} min de margen)`;

  return {
    hasLocation: true,
    distanceMeters: walkingDistance,
    walkingMinutes,
    status: 'missed',
    marginMinutes,
    label,
    shortLabel: nextBusMinutes !== null ? `No llegas (sig. ${nextBusMinutes}m)` : 'No llegas',
    subLabel: `${walkingMinutes} min a pie (${walkingDistance}m)`,
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    nextBusMinutes,
  };
}
