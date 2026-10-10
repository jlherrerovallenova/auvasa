import React, { useState } from 'react';
import { X, Star, RefreshCw, Radio, Clock, MapPin, AlertCircle, Bell, ChevronDown, Bus, Footprints } from 'lucide-react';
import type { BusStop, StopArrival } from '../types/bus.ts';
import { useStopArrivals } from '../hooks/useStopArrivals.ts';
import { getBusFleetInfo, parseOccupancy } from '../utils/fleet.ts';
import { calculateWalkingRadar } from '../utils/walkingRadar.ts';
import { BusDrawing } from './BusDrawing.tsx';

interface StopArrivalsModalProps {
  stop: BusStop | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (stopCode: string) => void;
  onViewOnMap: (stop: BusStop) => void;
  onSetAlarm?: (stop: BusStop) => void;
  onShareArrival?: (stop: BusStop, arrival: StopArrival) => void;
  onStartOnboard?: (stop: BusStop, arrival: StopArrival) => void;
  onLocateBus?: (arrival: StopArrival) => void;
  userLat?: number | null;
  userLon?: number | null;
  onRequestLocation?: () => void;
}

interface ArrivalItemProps {
  arr: StopArrival;
  allArrivals: StopArrival[];
  stop: BusStop;
  userLat?: number | null;
  userLon?: number | null;
  onShareArrival?: (stop: BusStop, arrival: StopArrival) => void;
  onStartOnboard?: (stop: BusStop, arrival: StopArrival) => void;
  onLocateBus?: (arrival: StopArrival) => void;
}

interface RadarBadgeProps {
  radar: NonNullable<ReturnType<typeof calculateWalkingRadar>>;
}

const RadarBadge: React.FC<RadarBadgeProps> = ({ radar }) => (
  <span
    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold text-[10px] border shrink-0 ${radar.badgeClass}`}
    title={`${radar.label} • ${radar.subLabel}`}
  >
    {radar.status === 'relaxed' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
    {radar.status === 'tight' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />}
    {radar.status === 'missed' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
    {radar.status === 'at_stop' && <Footprints className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400 shrink-0" />}
    <span>{radar.shortLabel}</span>
  </span>
);

const ArrivalRealtimeStatus: React.FC<{
  arr: StopArrival;
}> = ({ arr }) => {
  const isGpsLive = arr.liveStatus === 'gps_live' || (arr.isRealtime && !!arr.vehicleId);
  const isSae = arr.liveStatus === 'scheduled_sae';

  if (isGpsLive) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span>GPS ({arr.exactTime})</span>
        {arr.licensePlate && (
          <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px] ml-0.5 shrink-0">
            ({arr.licensePlate})
          </span>
        )}
        {arr.speed !== undefined && arr.speed !== null && arr.speed > 0 && (
          <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-0.5">
            • {arr.speed} km/h
          </span>
        )}
      </span>
    );
  }

  if (isSae) {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-sky-600 dark:text-sky-400">
        <Radio className="w-3 h-3 shrink-0 text-sky-500" />
        <span>Estimado Central ({arr.exactTime})</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
      <Clock className="w-3 h-3 shrink-0" />
      <span>{arr.exactTime}</span>
    </span>
  );
};

const ArrivalActionButtons: React.FC<{
  stop: BusStop;
  arr: StopArrival;
  onLocateBus?: (arrival: StopArrival) => void;
  onStartOnboard?: (stop: BusStop, arrival: StopArrival) => void;
}> = ({ stop, arr, onLocateBus, onStartOnboard }) => {
  if (!onLocateBus && !onStartOnboard) return null;

  return (
    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
      {onLocateBus && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onLocateBus(arr);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 text-xs font-bold transition-colors active:scale-98 cursor-pointer shadow-2xs"
          title="Ver mapa de posición de este autobús"
        >
          <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>Posición en mapa</span>
        </button>
      )}

      {onStartOnboard && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onStartOnboard(stop, arr);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-2xs transition-colors active:scale-98 cursor-pointer"
          title="Subirme a este autobús (Copiloto a bordo)"
        >
          <Bus className="w-3.5 h-3.5 shrink-0" />
          <span>Subir</span>
        </button>
      )}
    </div>
  );
};

const ArrivalItem: React.FC<ArrivalItemProps> = ({
  arr,
  allArrivals,
  stop,
  userLat,
  userLon,
  onStartOnboard,
  onLocateBus,
}) => {
  const isArriving = arr.minutesRemaining <= 0;
  const isGpsLive = arr.liveStatus === 'gps_live' || (arr.isRealtime && !!arr.vehicleId);
  const isSae = arr.liveStatus === 'scheduled_sae';
  const fleet = getBusFleetInfo(arr.vehicleId);
  const occupancy = parseOccupancy(arr.occupancy);
  const radar = calculateWalkingRadar(
    userLat ?? null,
    userLon ?? null,
    stop.lat,
    stop.lon,
    arr,
    allArrivals
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onLocateBus?.(arr)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onLocateBus?.(arr);
        }
      }}
      className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-850 hover:bg-teal-50/40 dark:hover:bg-slate-800 border border-slate-200/90 hover:border-teal-400/80 dark:border-slate-750 dark:hover:border-teal-500/60 transition-colors shadow-2xs space-y-2.5 cursor-pointer group text-left"
      title="Toca para ver este autobús en el mapa"
    >
      {/* 1. LÍNEA 1: nº de línea - nombre de la línea - tiempo restante */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <BusDrawing
            fleet={fleet}
            lineName={arr.routeShortName}
            routeColor={arr.routeColor}
            routeTextColor={arr.routeTextColor}
            vehicleId={arr.vehicleId}
            size="sm"
            className="shrink-0 drop-shadow-2xs transition-transform group-hover:scale-105"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
              {arr.destination ? `${arr.routeShortName} • ${arr.destination}` : `Línea ${arr.routeShortName}`}
            </h4>
          </div>
        </div>

        {/* Tiempo restante */}
        <div className="text-right shrink-0">
          <div
            className={`inline-flex items-center px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm shadow-2xs ${
              isArriving
                ? 'bg-emerald-500 text-slate-950 animate-pulse font-extrabold'
                : isGpsLive
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : isSae
                ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
            }`}
          >
            {isArriving ? 'Llegando' : `${arr.minutesRemaining} min`}
          </div>
        </div>
      </div>

      {/* Fleet and Occupancy Radar Badges */}
      {isGpsLive && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-200/80 dark:border-slate-750/70 text-[10px]">
          <span className={`px-2 py-0.5 rounded-md font-medium border ${occupancy.bgClass} ${occupancy.colorClass}`}>
            {occupancy.label}
          </span>
          <span className="px-2 py-0.5 rounded-md font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750 flex items-center gap-1">
            <span>{fleet.model}</span>
          </span>
          {fleet.hasPMR && (
            <span className="px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-slate-900 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-slate-750 flex items-center gap-0.5" title="Rampa accesible para movilidad reducida">
              <span>PMR</span>
            </span>
          )}
        </div>
      )}

      {/* 2. LÍNEA 2: mapa de posición del bus · subir */}
      <ArrivalActionButtons
        stop={stop}
        arr={arr}
        onLocateBus={onLocateBus}
        onStartOnboard={onStartOnboard}
      />

      {/* 3. LÍNEA 3: hora de llegada - indicación de si llegas a tiempo o no en función de la posición */}
      <div className="flex items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex items-center gap-1.5 shrink-0">
          <ArrivalRealtimeStatus arr={arr} />
        </div>

        {radar && (
          <div className="min-w-0 flex items-center justify-end shrink-0">
            <RadarBadge radar={radar} />
          </div>
        )}
      </div>
    </div>
  );
};

interface RealtimeFilterTabsProps {
  onlyRealtime: boolean;
  onToggle: (val: boolean) => void;
  realTimeCount: number;
  totalCount: number;
}

const RealtimeFilterTabs: React.FC<RealtimeFilterTabsProps> = ({
  onlyRealtime,
  onToggle,
  realTimeCount,
  totalCount,
}) => (
  <div className="flex items-center gap-1 p-0.5 sm:p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs">
    <button
      type="button"
      onClick={() => onToggle(true)}
      className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-colors cursor-pointer text-center flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
        onlyRealtime
          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs font-bold'
          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      <span>Solo GPS ({realTimeCount})</span>
    </button>
    <button
      type="button"
      onClick={() => onToggle(false)}
      className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-colors cursor-pointer text-center text-[11px] sm:text-xs ${
        !onlyRealtime
          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
      }`}
    >
      <span>Todos ({totalCount})</span>
    </button>
  </div>
);

const StopArrivalsLoadingState: React.FC = () => (
  <div className="py-12 text-center text-slate-500 dark:text-slate-400">
    <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-teal-500" />
    <p className="text-sm">Consultando satélites GPS y horarios...</p>
  </div>
);

const StopArrivalsEmptyState: React.FC = () => (
  <div className="py-10 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800">
    <Clock className="w-10 h-10 mx-auto mb-2 text-slate-400 dark:text-slate-500 opacity-60" />
    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
      Sin paso de autobuses previsto en los próximos minutos
    </p>
    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
      No hay servicios activos o en camino para las líneas de esta parada en este momento.
    </p>
  </div>
);

const StopArrivalsNoGpsState: React.FC<{ totalCount: number; onShowScheduled: () => void }> = ({
  totalCount,
  onShowScheduled,
}) => (
  <div className="py-7 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
    <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
      <Radio className="w-5 h-5 opacity-70" />
    </div>
    <div>
      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
        Sin autobuses con GPS en ruta ahora mismo
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
        Los vehículos de estas líneas aún no han iniciado su viaje desde cabecera o están fuera de servicio.
      </p>
    </div>
    <button
      type="button"
      onClick={onShowScheduled}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
    >
      <Clock className="w-3.5 h-3.5" />
      <span>Ver salidas teóricas programadas ({totalCount})</span>
    </button>
  </div>
);

interface StopArrivalsListContentProps {
  data: ReturnType<typeof useStopArrivals>['data'];
  loading: boolean;
  error: string | null;
  onlyRealtime: boolean;
  displayedArrivals: StopArrival[];
  stop: BusStop;
  userLat?: number | null;
  userLon?: number | null;
  onRequestLocation?: () => void;
  onShowScheduled: () => void;
  onShareArrival?: (stop: BusStop, arrival: StopArrival) => void;
  onStartOnboard?: (stop: BusStop, arrival: StopArrival) => void;
  onLocateBus?: (arrival: StopArrival) => void;
}

const StopArrivalsListContent: React.FC<StopArrivalsListContentProps> = ({
  data,
  loading,
  error,
  onlyRealtime,
  displayedArrivals,
  stop,
  userLat,
  userLon,
  onRequestLocation,
  onShowScheduled,
  onShareArrival,
  onStartOnboard,
  onLocateBus,
}) => {
  if (loading && !data) {
    return <StopArrivalsLoadingState />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 dark:text-red-300 text-sm flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">No se pudo cargar la información</p>
          <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  if (data && data.arrivals.length === 0 && !loading) {
    return <StopArrivalsEmptyState />;
  }

  if (onlyRealtime && displayedArrivals.length === 0 && data && data.arrivals.length > 0) {
    return (
      <StopArrivalsNoGpsState
        totalCount={data.arrivals.length}
        onShowScheduled={onShowScheduled}
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Prompt to enable location if missing */}
      {!userLat && onRequestLocation && (
        <button
          type="button"
          onClick={onRequestLocation}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-teal-200/80 dark:border-slate-700 text-teal-700 dark:text-teal-300 text-xs font-bold transition-colors cursor-pointer shadow-2xs mb-1"
        >
          <Footprints className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>Activar GPS para calcular si llegas a tiempo a pie</span>
        </button>
      )}

      {displayedArrivals.map(arr => {
        const uniqueKey = `${arr.routeShortName}_${arr.timestamp}_${arr.exactTime}_${arr.isRealtime ? 'rt' : 'sc'}`;
        return (
          <ArrivalItem
            key={uniqueKey}
            arr={arr}
            allArrivals={data?.arrivals || []}
            stop={stop}
            userLat={userLat}
            userLon={userLon}
            onShareArrival={onShareArrival}
            onStartOnboard={onStartOnboard}
            onLocateBus={onLocateBus}
          />
        );
      })}
    </div>
  );
};

interface StopArrivalsBodyProps {
  data: ReturnType<typeof useStopArrivals>['data'];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  stop: BusStop;
  userLat?: number | null;
  userLon?: number | null;
  onRequestLocation?: () => void;
  onShareArrival?: (stop: BusStop, arrival: StopArrival) => void;
  onStartOnboard?: (stop: BusStop, arrival: StopArrival) => void;
  onLocateBus?: (arrival: StopArrival) => void;
}

const StopArrivalsBody: React.FC<StopArrivalsBodyProps> = ({
  data,
  loading,
  error,
  refresh,
  stop,
  userLat,
  userLon,
  onRequestLocation,
  onShareArrival,
  onStartOnboard,
  onLocateBus,
}) => {
  const [onlyRealtime, setOnlyRealtime] = React.useState<boolean>(() => {
    const saved = localStorage.getItem('vallabus_only_realtime');
    return saved !== null ? saved === 'true' : true;
  });
  const [selectedLineFilter, setSelectedLineFilter] = React.useState<string | null>(null);

  const updateRealtimeFilter = (val: boolean) => {
    setOnlyRealtime(val);
    try {
      localStorage.setItem('vallabus_only_realtime', String(val));
    } catch {
      // ignore
    }
  };

  const realTimeCount = data?.arrivals.filter(a => a.isRealtime).length || 0;
  const hasScheduled = (data?.arrivals.length || 0) > realTimeCount;

  // Extract unique lines available in this stop's arrivals
  const availableLines = React.useMemo(() => {
    if (!data?.arrivals) return [];
    const map = new Map<string, number>();
    for (const a of data.arrivals) {
      if (a.routeShortName) {
        map.set(a.routeShortName, (map.get(a.routeShortName) || 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([line, count]) => ({ line, count }));
  }, [data?.arrivals]);

  const displayedArrivals = React.useMemo(() => {
    if (!data?.arrivals) return [];
    let list = data.arrivals;
    if (selectedLineFilter) {
      list = list.filter(a => a.routeShortName.toUpperCase() === selectedLineFilter.toUpperCase());
    }
    if (onlyRealtime) {
      return list.filter(a => a.isRealtime);
    }
    return list;
  }, [data?.arrivals, selectedLineFilter, onlyRealtime]);

  return (
    <div className="p-5 overflow-y-auto flex-1 space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
        <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          Próximas Llegadas
        </span>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Selector de líneas por píldoras si la parada tiene más de 1 línea */}
      {availableLines.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedLineFilter(null)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 text-xs ${
              selectedLineFilter === null
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todas ({data?.arrivals.length || 0})
          </button>
          {availableLines.map(({ line, count }) => (
            <button
              key={line}
              type="button"
              onClick={() => setSelectedLineFilter(line === selectedLineFilter ? null : line)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 text-xs ${
                selectedLineFilter === line
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-750'
              }`}
            >
              <span>Línea {line}</span>
              <span className="text-[10px] opacity-75 font-mono">({count})</span>
            </button>
          ))}
        </div>
      )}

      {hasScheduled && data && data.arrivals.length > 0 && (
        <RealtimeFilterTabs
          onlyRealtime={onlyRealtime}
          onToggle={updateRealtimeFilter}
          realTimeCount={realTimeCount}
          totalCount={data.arrivals.length}
        />
      )}

      <StopArrivalsListContent
        data={data}
        loading={loading}
        error={error}
        onlyRealtime={onlyRealtime}
        displayedArrivals={displayedArrivals}
        stop={stop}
        userLat={userLat}
        userLon={userLon}
        onRequestLocation={onRequestLocation}
        onShowScheduled={() => updateRealtimeFilter(false)}
        onShareArrival={onShareArrival}
        onStartOnboard={onStartOnboard}
        onLocateBus={onLocateBus}
      />
    </div>
  );
};

export const StopArrivalsModal: React.FC<StopArrivalsModalProps> = ({
  stop,
  onClose,
  isFavorite,
  onToggleFavorite,
  onViewOnMap,
  onSetAlarm,
  onShareArrival,
  onStartOnboard,
  onLocateBus,
  userLat,
  userLon,
  onRequestLocation,
}) => {
  const { data, loading, error, refresh } = useStopArrivals(stop?.code || null);
  const [expandedStopCode, setExpandedStopCode] = useState<string | null>(null);
  const showRoutes = Boolean(stop && expandedStopCode === stop.code);

  const toggleRoutes = () => {
    if (!stop) return;
    setExpandedStopCode(prev => (prev === stop.code ? null : stop.code));
  };

  if (!stop) return null;

  return (
    <dialog
      open
      aria-labelledby="stop-modal-title"
      className="fixed inset-0 z-50 m-0 p-0 w-full h-full max-w-none max-h-none bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center border-none text-slate-800 dark:text-slate-100"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[88dvh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/90 relative">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex items-start gap-2 sm:gap-2.5 min-w-0 flex-1">
              <span className="bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30 font-mono font-black text-xs sm:text-sm px-2 py-0.5 rounded-lg shrink-0 mt-0.5">
                #{stop.code}
              </span>
              <div className="min-w-0 flex-1">
                <h3 id="stop-modal-title" className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">
                  {stop.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>AUVASA Valladolid</span>
                  <span>•</span>
                  <span>{stop.routes.length} líneas</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onToggleFavorite(stop.code)}
                className={`p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer ${
                  isFavorite
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              >
                <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Collapsible passing lines */}
          {stop.routes && stop.routes.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/60">
              <button
                type="button"
                onClick={toggleRoutes}
                className="flex items-center justify-between w-full py-0.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group"
                aria-expanded={showRoutes}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Líneas ({stop.routes.length})</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-500 transition-colors">
                  <span>{showRoutes ? 'Recoger líneas' : 'Desplegar líneas'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showRoutes ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {showRoutes && (
                <div className="flex flex-wrap gap-1 mt-2 pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-800/60 max-h-32 overflow-y-auto">
                  {stop.routes.map(r => (
                    <span
                      key={r}
                      className="text-[11px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-700"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Body: Arrivals list */}
        <StopArrivalsBody
          data={data}
          loading={loading}
          error={error}
          refresh={refresh}
          stop={stop}
          userLat={userLat}
          userLon={userLon}
          onRequestLocation={onRequestLocation}
          onShareArrival={onShareArrival}
          onStartOnboard={onStartOnboard}
          onLocateBus={onLocateBus}
        />

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 flex items-center justify-between gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          {onSetAlarm && (
            <button
              type="button"
              onClick={() => {
                onSetAlarm(stop);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer shrink-0 active:scale-95"
            >
              <Bell className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Avisar al llegar</span>
            </button>
          )}

          <div className="flex items-center gap-2 flex-1 justify-end">
            <button
              type="button"
              onClick={() => {
                onViewOnMap(stop);
              }}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors shadow-sm shadow-teal-700/20 cursor-pointer active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Ver en el Mapa</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};
