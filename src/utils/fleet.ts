export type BusTypeKey =
  | 'irizar-ie-tram-articulated'
  | 'irizar-ie-tram-standard'
  | 'solaris-urbino-hybrid'
  | 'man-lions-city-gnc'
  | 'mercedes-citaro-gnc'
  | 'vectia-hybrid'
  | 'articulated-gnc'
  | 'standard-urban';

export interface BusFleetInfo {
  typeKey: BusTypeKey;
  model: string;
  propulsion: '100% Eléctrico' | 'Híbrido GNC' | 'Híbrido' | 'Gas Natural (GNC)' | 'Diésel Euro VI' | 'Estándar';
  isArticulated: boolean;
  hasPMR: boolean;
  badgeColor: string;
  propulsionIcon: 'zap' | 'leaf' | 'flame' | 'bus';
}

export function getBusFleetInfo(vehicleId?: string | null): BusFleetInfo {
  if (!vehicleId) {
    return {
      typeKey: 'standard-urban',
      model: 'AUVASA Urbano GNC',
      propulsion: 'Gas Natural (GNC)',
      isArticulated: false,
      hasPMR: true,
      badgeColor: '#008075',
      propulsionIcon: 'flame',
    };
  }

  const num = parseInt(vehicleId, 10);

  // 337-352: Irizar ie Tram 18m Articulado 100% Eléctrico (C1, C2, etc.)
  if (num >= 337 && num <= 352) {
    return {
      typeKey: 'irizar-ie-tram-articulated',
      model: 'Irizar ie Tram 18m Eléctrico',
      propulsion: '100% Eléctrico',
      isArticulated: true,
      hasPMR: true,
      badgeColor: '#10b981',
      propulsionIcon: 'zap',
    };
  }

  // 353-399: Irizar ie Tram 12m Estándar 100% Eléctrico (Líneas 2, 6, etc.)
  if (num >= 353 && num <= 399) {
    return {
      typeKey: 'irizar-ie-tram-standard',
      model: 'Irizar ie Tram 12m Eléctrico',
      propulsion: '100% Eléctrico',
      isArticulated: false,
      hasPMR: true,
      badgeColor: '#10b981',
      propulsionIcon: 'zap',
    };
  }

  // 301-336: Vectia Teris / Veris Híbridos / Eléctricos
  if (num >= 300 && num <= 336) {
    return {
      typeKey: 'vectia-hybrid',
      model: 'Vectia Híbrido Eléctrico',
      propulsion: 'Híbrido',
      isArticulated: false,
      hasPMR: true,
      badgeColor: '#14b8a6',
      propulsionIcon: 'leaf',
    };
  }

  // 400-499: Solaris Urbino Híbrido (Líneas 1, 2, 5, 8, etc.)
  if (num >= 400 && num <= 499) {
    return {
      typeKey: 'solaris-urbino-hybrid',
      model: 'Solaris Urbino Híbrido',
      propulsion: 'Híbrido',
      isArticulated: false,
      hasPMR: true,
      badgeColor: '#8b5cf6',
      propulsionIcon: 'leaf',
    };
  }

  // 600-699: MAN Lion's City 18 G / GNC Híbrido (Línea 1, etc.)
  if (num >= 600 && num <= 699) {
    return {
      typeKey: 'man-lions-city-gnc',
      model: "MAN Lion's City GNC",
      propulsion: 'Gas Natural (GNC)',
      isArticulated: true,
      hasPMR: true,
      badgeColor: '#06b6d4',
      propulsionIcon: 'flame',
    };
  }

  // 700-799 or 75: Articulados Oruga 18m
  if ((num >= 700 && num <= 799) || num === 75) {
    return {
      typeKey: 'articulated-gnc',
      model: 'Articulado Oruga 18m',
      propulsion: 'Híbrido GNC',
      isArticulated: true,
      hasPMR: true,
      badgeColor: '#3b82f6',
      propulsionIcon: 'bus',
    };
  }

  // 200-299: Mercedes Citaro C2 GNC
  if (num >= 200 && num <= 299) {
    return {
      typeKey: 'mercedes-citaro-gnc',
      model: 'Mercedes Citaro C2 GNC',
      propulsion: 'Gas Natural (GNC)',
      isArticulated: false,
      hasPMR: true,
      badgeColor: '#0284c7',
      propulsionIcon: 'flame',
    };
  }

  return {
    typeKey: 'standard-urban',
    model: 'AUVASA Castrosua GNC',
    propulsion: 'Gas Natural (GNC)',
    isArticulated: false,
    hasPMR: true,
    badgeColor: '#64748b',
    propulsionIcon: 'flame',
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
