export type TrafficLevel = 'fluid' | 'moderate' | 'slow' | 'congested';

export interface TrafficCamera {
  id: string;
  name: string;
  location: string;
  lat: number;
  lon: number;
  imageUrl: string;
}

export interface TrafficSlowSpot {
  id: string;
  busLine: string;
  vehicleId: string;
  speed: number;
  lat: number;
  lon: number;
  locationName: string;
  level: 'slow' | 'congested';
}

export interface CityTrafficSummary {
  level: TrafficLevel;
  levelLabel: string;
  levelColor: string;
  avgSpeedKmh: number;
  fluidPercentage: number;
  activeBusesCount: number;
  congestedSpotsCount: number;
  slowSpots: TrafficSlowSpot[];
}
