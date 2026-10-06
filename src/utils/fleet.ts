export interface BusFleetInfo {
  model: string;
  propulsion: '100% Eléctrico' | 'Híbrido GNC' | 'Híbrido' | 'Diésel Euro VI' | 'Estándar';
  isArticulated: boolean;
  hasPMR: boolean;
  badgeColor: string;
}

export function getBusFleetInfo(vehicleId?: string | null): BusFleetInfo {
  if (!vehicleId) {
    return {
      model: 'AUVASA Urbano',
      propulsion: 'Estándar',
      isArticulated: false,
      hasPMR: true,
      badgeColor: '#008075',
    };
  }

  const num = parseInt(vehicleId, 10);

  // 300-399: Irizar ie Tram 100% Eléctricos (Flota Cero Emisiones Valladolid)
  if (num >= 300 && num <= 399) {
    return {
      model: 'Irizar ie Tram Eléctrico',
      propulsion: '100% Eléctrico',
      isArticulated: num >= 350,
      hasPMR: true,
      badgeColor: '#10b981',
    };
  }

  // 700-799: Articulados Oruga 18m (C1, C2, Línea 1, 8)
  if (num >= 700 && num <= 799) {
    return {
      model: 'Articulado Oruga 18m',
      propulsion: 'Híbrido GNC',
      isArticulated: true,
      hasPMR: true,
      badgeColor: '#3b82f6',
    };
  }

  // 600-699: MAN Lion's City GNC Híbrido
  if (num >= 600 && num <= 699) {
    return {
      model: "MAN Lion's City GNC",
      propulsion: 'Híbrido GNC',
      isArticulated: false,
      hasPMR: true,
      badgeColor: '#06b6d4',
    };
  }

  // 400-499: Solaris Urbino Híbrido
  if (num >= 400 && num <= 499) {
    return {
      model: 'Solaris Urbino Híbrido',
      propulsion: 'Híbrido',
      isArticulated: false,
      hasPMR: true,
      badgeColor: '#8b5cf6',
    };
  }

  return {
    model: 'AUVASA Estándar',
    propulsion: 'Diésel Euro VI',
    isArticulated: false,
    hasPMR: true,
    badgeColor: '#64748b',
  };
}

export interface OccupancyInfo {
  label: string;
  colorClass: string;
  bgClass: string;
  iconColor: string;
}

export function parseOccupancy(occupancy?: string | number): OccupancyInfo {
  const occStr = String(occupancy).toUpperCase();

  if (occStr === 'MANY_SEATS_AVAILABLE' || occStr === '0') {
    return {
      label: 'Muchos asientos libres',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10 border-emerald-500/30',
      iconColor: '#10b981',
    };
  }

  if (occStr === 'FEW_SEATS_AVAILABLE' || occStr === '1') {
    return {
      label: 'Plazas de pie disponibles',
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10 border-amber-500/30',
      iconColor: '#f59e0b',
    };
  }

  if (occStr === 'STANDING_ROOM_ONLY' || occStr === 'FULL' || occStr === '2') {
    return {
      label: 'Autobús lleno',
      colorClass: 'text-rose-400',
      bgClass: 'bg-rose-500/10 border-rose-500/30',
      iconColor: '#f43f5e',
    };
  }

  return {
    label: 'Aforo disponible',
    colorClass: 'text-slate-400',
    bgClass: 'bg-slate-800/60 border-slate-700/60',
    iconColor: '#94a3b8',
  };
}
