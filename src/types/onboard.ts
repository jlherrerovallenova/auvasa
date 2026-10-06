import type { BusRoute, RouteStop, BusStop } from './bus.ts';

export interface OnboardTrip {
  id: string;
  route: BusRoute;
  directionKey: string;
  directionHeadsign: string;
  originStop: RouteStop | BusStop;
  destinationStop: RouteStop | null;
  stops: RouteStop[];
  currentStopIndex: number;
  destinationStopIndex: number; // -1 if no destination selected
  vehicleId: string | null;
  isMuted: boolean;
  startedAt: number;
}

export interface OnboardMetrics {
  currentSpeedKmh: number | null;
  distanceToNextMeters: number | null;
  distanceToDestinationMeters: number | null;
  stopsRemaining: number;
  estimatedMinutesRemaining: number;
  isApproachingDestination: boolean; // 1 stop remaining or < 400m
  isDestinationReached: boolean; // 0 stops or < 120m
}
