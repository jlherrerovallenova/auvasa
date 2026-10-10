export type RouteCategory = 'ordinaria' | 'circular' | 'buho' | 'lanzadera' | 'especial';

export interface RouteStop {
  seq: number;
  stopId: string;
  stopCode: string;
  name: string;
  lat: number;
  lon: number;
}

export interface RouteDirection {
  headsign: string;
  shapeId: string;
  stopCount: number;
  stops: RouteStop[];
  coordinates?: [number, number][];
}

export interface BusRoute {
  id: string;
  shortName: string;
  name: string;
  color: string;
  textColor: string;
  category: RouteCategory;
  origin: string;
  destination: string;
  directions: Record<string, RouteDirection>;
  liveBuses?: LiveVehicle[];
}

export interface BusStop {
  id: string;
  code: string;
  name: string;
  lat: number;
  lon: number;
  routes: string[];
  distanceMeters?: number;
  walkingMinutes?: number;
}

export interface LiveVehicle {
  id: string;
  vehicleId: string;
  licensePlate: string;
  routeId: string;
  lineName: string;
  routeColor: string;
  routeTextColor: string;
  headsign: string;
  tripId: string;
  lat: number;
  lon: number;
  speed: number;
  bearing: number;
  timestamp: number;
  occupancy: string | number;
}

export interface StopArrival {
  routeShortName: string;
  routeColor: string;
  routeTextColor: string;
  destination: string;
  exactTime: string;
  timestamp: number;
  secondsRemaining: number;
  minutesRemaining: number;
  isRealtime: boolean;
  liveStatus?: 'gps_live' | 'scheduled_sae' | 'scheduled';
  delaySeconds?: number;
  vehicleId: string | null;
  licensePlate: string | null;
  speed?: number | null;
  occupancy?: string | number;
}

export interface StopArrivalsResponse {
  stopCode: string;
  stopName: string;
  lat: number;
  lon: number;
  routes: string[];
  updatedAt: string;
  realtimeCount: number;
  arrivals: StopArrival[];
}

export interface ServiceAlert {
  id: string;
  cause: string;
  effect: string;
  header: string;
  description: string;
  url: string;
}

export interface SystemHealth {
  status: string;
  uptime: number;
  vehiclesCount: number;
  tripUpdatesCount: number;
  alertsCount: number;
  lastVehiclesUpdate: string | null;
  lastTripUpdate: string | null;
  stopsCount: number;
  routesCount: number;
}
