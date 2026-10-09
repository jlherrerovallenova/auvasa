import React, { useState } from 'react';
import { X, Star, RefreshCw, Clock, AlertCircle, ChevronDown, Bus, MapPin, Minimize2, Maximize2, Footprints } from 'lucide-react';
import type { BusStop, StopArrival } from '../../types/bus.ts';
import { useStopArrivals } from '../../hooks/useStopArrivals.ts';
import { getBusFleetInfo } from '../../utils/fleet.ts';
import { calculateWalkingRadar } from '../../utils/walkingRadar.ts';
import { BusDrawing } from '../BusDrawing.tsx';

interface MapStopArrivalsCardProps {
  stop: BusStop;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (stopCode: string) => void;
  onSetAlarm?: (stop: BusStop) => void;
  onShareArrival?: (stop: BusStop, arrival: StopArrival) => void;
  onStartOnboard?: (stop: BusStop, arrival: StopArrival) => void;
  onLocateBus?: (arrival: StopArrival) => void;
  userLat?: number | null;
  userLon?: number | null;
  onRequestLocation?: () => void;
}

interface MapArrivalRowProps {
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

const ArrivalRealtimeStatus: React.FC<{ isRealtime: boolean; exactTime: string }> = ({
  isRealtime,
  exactTime,
}) => (
  isRealtime ? (
    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      <span>GPS ({exactTime})</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
      <Clock className="w-3 h-3 shrink-0" />
      <span>{exactTime}</span>
    </span>
  )
);

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
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/80 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 text-xs font-bold transition-colors active:scale-98 cursor-pointer shadow-2xs"
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

const MapArrivalRow: React.FC<MapArrivalRowProps> = ({
  arr,
  allArrivals,
  stop,
  userLat,
  userLon,
  onStartOnboard,
  onLocateBus,
}) => {
  const isArriving = arr.minutesRemaining <= 0;
  const fleet = getBusFleetInfo(arr.vehicleId);
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
      className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-850 hover:bg-teal-50/50 dark:hover:bg-slate-800 border border-slate-200/90 hover:border-teal-400 dark:border-slate-750 dark:hover:border-teal-500/60 transition-colors shadow-2xs space-y-2.5 cursor-pointer group text-left"
      title="Toca para ver la ubicación de este autobús en el mapa"
    >
      {/* 1. LÍNEA 1: nº de línea - nombre de la línea - tiempo restante */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <BusDrawing
            fleet={fleet}
            lineName={arr.routeShortName}
            routeColor={arr.routeColor || '#008075'}
            routeTextColor={arr.routeTextColor || '#FFFFFF'}
            vehicleId={arr.vehicleId}
            size="sm"
            className="shrink-0 drop-shadow-2xs transition-transform group-hover:scale-105"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
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
                : arr.isRealtime
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
            }`}
          >
            {isArriving ? 'Llegando' : `${arr.minutesRemaining} min`}
          </div>
        </div>
      </div>

      {/* 2. LÍNEA 2: hora de llegada - indicación de si llegas a tiempo o no en función de la posición */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 shrink-0">
          <ArrivalRealtimeStatus isRealtime={arr.isRealtime} exactTime={arr.exactTime} />
        </div>

        {radar && (
          <div className="min-w-0 flex items-center justify-end shrink-0">
            <RadarBadge radar={radar} />
          </div>
        )}
      </div>

      {/* 3. LÍNEA 3: mapa de posición del bus · subir */}
      <ArrivalActionButtons
        stop={stop}
        arr={arr}
        onLocateBus={onLocateBus}
        onStartOnboard={onStartOnboard}
      />
    </div>
  );
};

interface MapHeaderActionButtonsProps {
  loading: boolean;
  isFavorite: boolean;
  isMinimized: boolean;
  onRefresh: () => void;
  onToggleFavorite: () => void;
  onSetAlarm?: () => void;
  onToggleMinimize: () => void;
  onClose: () => void;
}

const MapHeaderActionButtons: React.FC<MapHeaderActionButtonsProps> = ({
  loading,
  isFavorite,
  isMinimized,
  onRefresh,
  onToggleFavorite,
  onToggleMinimize,
  onClose,
}) => (
  <div className="flex items-center gap-0.5 shrink-0">
    <button
      type="button"
      onClick={onRefresh}
      disabled={loading}
      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      title="Actualizar tiempos en directo"
      aria-label="Actualizar tiempos en directo"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
    </button>

    <button
      type="button"
      onClick={onToggleFavorite}
      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
        isFavorite
          ? 'text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 bg-amber-500/10'
          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
      }`}
      title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
    >
      <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
    </button>

    <button
      type="button"
      onClick={onToggleMinimize}
      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      title={isMinimized ? 'Expandir tarjeta' : 'Minimizar tarjeta para ver el mapa'}
      aria-label={isMinimized ? 'Expandir tarjeta' : 'Minimizar tarjeta'}
    >
      {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
    </button>

    <button
      type="button"
      onClick={onClose}
      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      title="Cerrar panel de parada"
      aria-label="Cerrar panel de parada"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  </div>
);

interface MapStopCardHeaderProps {
  stop: BusStop;
  loading: boolean;
  isFavorite: boolean;
  showRoutes: boolean;
  isMinimized: boolean;
  onRefresh: () => void;
  onToggleFavorite: () => void;
  onSetAlarm?: () => void;
  onClose: () => void;
  onToggleRoutes: () => void;
  onToggleMinimize: () => void;
}

const MapStopCardHeader: React.FC<MapStopCardHeaderProps> = ({
  stop,
  loading,
  isFavorite,
  showRoutes,
  isMinimized,
  onRefresh,
  onToggleFavorite,
  onSetAlarm,
  onClose,
  onToggleRoutes,
  onToggleMinimize,
}) => (
  <div className="p-3 sm:p-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-850/90 shrink-0">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <span className="bg-teal-600 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-lg shadow-sm shrink-0 mt-0.5">
          #{stop.code}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
            {stop.name}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            AUVASA • {stop.routes.length} {stop.routes.length === 1 ? 'línea' : 'líneas'}
          </p>
        </div>
      </div>

      <MapHeaderActionButtons
        loading={loading}
        isFavorite={isFavorite}
        isMinimized={isMinimized}
        onRefresh={onRefresh}
        onToggleFavorite={onToggleFavorite}
        onSetAlarm={onSetAlarm}
        onToggleMinimize={onToggleMinimize}
        onClose={onClose}
      />
    </div>

    {stop.routes && stop.routes.length > 0 && (
      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
        <button
          type="button"
          onClick={onToggleRoutes}
          className="flex items-center justify-between w-full text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group"
          aria-expanded={showRoutes}
        >
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Líneas ({stop.routes.length})</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-500 transition-colors">
            <span>{showRoutes ? 'Recoger líneas' : 'Desplegar líneas'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showRoutes ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {showRoutes && (
          <div className="flex flex-wrap gap-1 mt-2 pt-1.5 border-t border-dashed border-slate-200/80 dark:border-slate-800/80 max-h-28 overflow-y-auto">
            {stop.routes.map(r => (
              <span
                key={r}
                className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
);

interface MapStopCardBodyProps {
  data: ReturnType<typeof useStopArrivals>['data'];
  loading: boolean;
  error: string | null;
  stop: BusStop;
  userLat?: number | null;
  userLon?: number | null;
  onRequestLocation?: () => void;
  onRefresh: () => void;
  onShareArrival?: (stop: BusStop, arrival: StopArrival) => void;
  onStartOnboard?: (stop: BusStop, arrival: StopArrival) => void;
  onLocateBus?: (arrival: StopArrival) => void;
}

const MapStopCardBody: React.FC<MapStopCardBodyProps> = ({
  data,
  loading,
  error,
  stop,
  userLat,
  userLon,
  onRequestLocation,
  onRefresh,
  onShareArrival,
  onStartOnboard,
  onLocateBus,
}) => {
  if (loading && !data) {
    return (
      <div className="p-3 sm:p-3.5 overflow-y-auto flex-1 space-y-2">
        <div className="py-8 text-center text-slate-500 dark:text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin text-teal-600 dark:text-teal-400" />
          <p className="text-xs font-medium">Buscando autobuses en tiempo real...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-3.5 overflow-y-auto flex-1 space-y-2">
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 dark:text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">No se pudieron cargar llegadas</p>
            <p className="text-[11px] text-red-500 dark:text-red-400 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded-lg cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (data && data.arrivals.length === 0) {
    return (
      <div className="p-3 sm:p-3.5 overflow-y-auto flex-1 space-y-2">
        <div className="py-6 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3">
          <Clock className="w-8 h-8 mx-auto mb-1.5 text-slate-400 dark:text-slate-500 opacity-60" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Sin autobuses en los próximos minutos
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-xs mx-auto">
            No hay servicios activos o en camino para las líneas de esta parada en este momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-3.5 overflow-y-auto flex-1 space-y-2">
      {/* Prompt to enable location if missing */}
      {!userLat && onRequestLocation && (
        <button
          type="button"
          onClick={onRequestLocation}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-teal-200/80 dark:border-slate-700 text-teal-700 dark:text-teal-300 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
        >
          <Footprints className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>Activar GPS para calcular si llegas a pie</span>
        </button>
      )}

      {data && data.arrivals.length > 0 && (
        <div className="space-y-1.5">
          {data.arrivals.map(arr => {
            const uniqueKey = `${arr.routeShortName}_${arr.timestamp}_${arr.exactTime}_${arr.isRealtime ? 'rt' : 'sc'}`;
            return (
              <MapArrivalRow
                key={uniqueKey}
                arr={arr}
                allArrivals={data.arrivals}
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
      )}
    </div>
  );
};

export const MapStopArrivalsCard: React.FC<MapStopArrivalsCardProps> = ({
  stop,
  onClose,
  isFavorite,
  onToggleFavorite,
  onSetAlarm,
  onShareArrival,
  onStartOnboard,
  onLocateBus,
  userLat,
  userLon,
  onRequestLocation,
}) => {
  const { data, loading, error, refresh } = useStopArrivals(stop.code);
  const [expandedStopCode, setExpandedStopCode] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const showRoutes = expandedStopCode === stop.code;

  return (
    <div className={`absolute bottom-3 left-2 right-2 sm:left-4 sm:right-auto sm:bottom-4 sm:w-[420px] max-w-[calc(100%-1rem)] sm:max-w-md z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col ${isMinimized ? 'max-h-[72px]' : 'max-h-[55dvh] sm:max-h-[480px]'} overflow-hidden animate-in slide-in-from-bottom duration-200 text-slate-800 dark:text-slate-100 transition-[max-height]`}>
      <MapStopCardHeader
        stop={stop}
        loading={loading}
        isFavorite={isFavorite}
        showRoutes={showRoutes}
        isMinimized={isMinimized}
        onRefresh={refresh}
        onToggleFavorite={() => onToggleFavorite(stop.code)}
        onSetAlarm={onSetAlarm ? () => onSetAlarm(stop) : undefined}
        onClose={onClose}
        onToggleRoutes={() => setExpandedStopCode(prev => (prev === stop.code ? null : stop.code))}
        onToggleMinimize={() => setIsMinimized(prev => !prev)}
      />

      {!isMinimized && (
        <MapStopCardBody
          data={data}
          loading={loading}
          error={error}
          stop={stop}
          userLat={userLat}
          userLon={userLon}
          onRequestLocation={onRequestLocation}
          onRefresh={refresh}
          onShareArrival={onShareArrival}
          onStartOnboard={onStartOnboard}
          onLocateBus={onLocateBus}
        />
      )}
    </div>
  );
};
