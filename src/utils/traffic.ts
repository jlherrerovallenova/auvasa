import type { LiveVehicle } from '../types/bus.ts';
import type { TrafficCamera, TrafficSlowSpot, CityTrafficSummary, TrafficLevel } from '../types/traffic.ts';

/**
 * Puntos de cámaras de tráfico municipales y de accesos en Valladolid
 */
export const VALLADOLID_TRAFFIC_CAMERAS: TrafficCamera[] = [
  {
    id: 'cam_poniente',
    name: 'Plaza de Poniente',
    location: 'Pº Isabel la Católica - Poniente',
    lat: 41.6528,
    lon: -4.7328,
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: 'cam_zorrilla_campo',
    name: 'Paseo Zorrilla - Campo Grande',
    location: 'Pº Zorrilla cruce Plaza Colón',
    lat: 41.6445,
    lon: -4.7315,
    imageUrl: 'https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: 'cam_salamanca',
    name: 'Avenida de Salamanca',
    location: 'Avda. Salamanca cruce Pte. Colgante',
    lat: 41.6421,
    lon: -4.7412,
    imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: 'cam_puente_mayor',
    name: 'Paseo Isabel la Católica - Pte. Mayor',
    location: 'Pte. Mayor hacia Rondilla / Centro',
    lat: 41.6582,
    lon: -4.7305,
    imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: 'cam_plaza_espana',
    name: 'Plaza de España',
    location: 'C/ Duque de la Victoria - Plaza España',
    lat: 41.6496,
    lon: -4.7262,
    imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: 'cam_plaza_circular',
    name: 'Plaza Circular',
    location: 'Plaza Circular - Delicias',
    lat: 41.6468,
    lon: -4.718,
    imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&auto=format&fit=crop&q=60',
  },
  {
    id: 'cam_ronda_este',
    name: 'Ronda Este VA-20',
    location: 'VA-20 cruce Juan Carlos I',
    lat: 41.6441,
    lon: -4.7032,
    imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=400&auto=format&fit=crop&q=60',
  },
];

/**
 * Analiza la velocidad en tiempo real de toda la flota de autobuses AUVASA
 * para determinar el flujo de tráfico en Valladolid y detectar posibles retenciones.
 */
export function analyzeFleetTraffic(vehicles: LiveVehicle[]): CityTrafficSummary {
  if (!vehicles || vehicles.length === 0) {
    return {
      level: 'fluid',
      levelLabel: 'Fluido',
      levelColor: '#10b981',
      avgSpeedKmh: 24,
      fluidPercentage: 95,
      activeBusesCount: 0,
      congestedSpotsCount: 0,
      slowSpots: [],
    };
  }

  // Filtrar vehículos activos con datos de velocidad
  const validVehicles = vehicles.filter(v => typeof v.speed === 'number' && v.speed >= 0);

  if (validVehicles.length === 0) {
    return {
      level: 'fluid',
      levelLabel: 'Fluido',
      levelColor: '#10b981',
      avgSpeedKmh: 22,
      fluidPercentage: 90,
      activeBusesCount: vehicles.length,
      congestedSpotsCount: 0,
      slowSpots: [],
    };
  }

  // Velocidad media de la flota (ponderada descartando paradas en marquesina a 0 km/h)
  const movingVehicles = validVehicles.filter(v => v.speed > 2);
  const totalSpeed = (movingVehicles.length > 0 ? movingVehicles : validVehicles).reduce(
    (acc, v) => acc + v.speed,
    0
  );
  const avgSpeed = Math.round(totalSpeed / Math.max(1, (movingVehicles.length > 0 ? movingVehicles.length : validVehicles.length)));

  // Detectar tramos lentos (velocidad entre 3 km/h y 12 km/h estando en ruta)
  const slowSpots: TrafficSlowSpot[] = [];

  for (const v of validVehicles) {
    if (v.speed >= 3 && v.speed <= 12) {
      slowSpots.push({
        id: `slow_${v.id || v.vehicleId}`,
        busLine: v.lineName || 'AUVASA',
        vehicleId: v.vehicleId || '',
        speed: v.speed,
        lat: v.lat,
        lon: v.lon,
        locationName: v.headsign ? `Hacia ${v.headsign}` : 'Tramo urbano',
        level: v.speed <= 7 ? 'congested' : 'slow',
      });
    }
  }

  // Calcular porcentaje de fluidez
  const fluidCount = validVehicles.filter(v => v.speed > 14).length;
  const fluidPercentage = Math.round((fluidCount / validVehicles.length) * 100);

  // Clasificar nivel de tráfico general
  let level: TrafficLevel = 'fluid';
  let levelLabel = 'Tráfico Fluido';
  let levelColor = '#10b981'; // green-500

  if (avgSpeed < 12 || fluidPercentage < 50 || slowSpots.length >= 8) {
    level = 'congested';
    levelLabel = 'Congestión / Retenciones';
    levelColor = '#ef4444'; // red-500
  } else if (avgSpeed < 17 || fluidPercentage < 70 || slowSpots.length >= 4) {
    level = 'slow';
    levelLabel = 'Tráfico Lento / Denso';
    levelColor = '#f97316'; // orange-500
  } else if (avgSpeed < 21 || fluidPercentage < 85) {
    level = 'moderate';
    levelLabel = 'Tráfico Moderado';
    levelColor = '#eab308'; // yellow-500
  }

  return {
    level,
    levelLabel,
    levelColor,
    avgSpeedKmh: avgSpeed,
    fluidPercentage,
    activeBusesCount: validVehicles.length,
    congestedSpotsCount: slowSpots.length,
    slowSpots,
  };
}
