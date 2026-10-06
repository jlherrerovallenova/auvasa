import React from 'react';
import { X, Star, RefreshCw, Radio, Clock, MapPin, AlertCircle, Bell, Share2, Zap, Accessibility } from 'lucide-react';
import type { BusStop, StopArrival } from '../types/bus.ts';
import { useStopArrivals } from '../hooks/useStopArrivals.ts';
import { getBusFleetInfo, parseOccupancy } from '../utils/fleet.ts';

interface StopArrivalsModalProps {
  stop: BusStop | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (stopCode: string) => void;
  onViewOnMap: (stop: BusStop) => void;
  onSetAlarm?: (stop: BusStop) => void;
  onShareArrival?: (stop: BusStop, arrival: StopArrival) => void;
}

interface ArrivalItemProps {
  arr: StopArrival;
  stop: BusStop;
  onShareArrival?: (stop: BusStop, arrival: StopArrival) => void;
}

const ArrivalItem: React.FC<ArrivalItemProps> = ({ arr, stop, onShareArrival }) => {
  const isArriving = arr.minutesRemaining <= 0;
  const fleet = getBusFleetInfo(arr.vehicleId);
  const occupancy = parseOccupancy(arr.occupancy);

  return (
    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/70 transition-colors space-y-2 shadow-sm dark:shadow-md">
      <div className="flex items-center justify-between gap-2.5">
        {/* Left: Line and Destination */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <span
            className="w-11 h-9 rounded-xl font-black text-sm flex items-center justify-center shadow-md flex-shrink-0 tracking-tight"
            style={{ backgroundColor: arr.routeColor, color: arr.routeTextColor }}
          >
            {arr.routeShortName}
          </span>
          <div className="min-w-0 flex-1">
            <span className="font-bold text-slate-900 dark:text-white text-sm block truncate">
              {arr.destination || `Línea ${arr.routeShortName}`}
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-xs">
              {arr.isRealtime ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>GPS Real</span>
                  {arr.licensePlate && (
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] ml-1 shrink-0">
                      ({arr.licensePlate})
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400/90 flex items-center gap-1 font-medium truncate">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>Programado ({arr.exactTime})</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Arrival Time Badge & Share Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onShareArrival && (
            <button
              type="button"
              onClick={() => onShareArrival(stop, arr)}
              className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="Compartir hora de llegada"
              aria-label="Compartir hora de llegada"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          <div className="text-right shrink-0">
            <div
              className={`inline-flex items-center px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm shadow-sm ${
                isArriving
                  ? 'bg-emerald-500 text-slate-950 animate-pulse font-extrabold'
                  : arr.isRealtime
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
              }`}
            >
              {isArriving ? 'Llegando' : `${arr.minutesRemaining} min`}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">
              Hora: {arr.exactTime}
            </div>
          </div>
        </div>
      </div>

      {/* Fleet and Occupancy Radar Badges */}
      {arr.isRealtime && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-750/70 text-[10px]">
          <span className={`px-2 py-0.5 rounded-md font-medium border ${occupancy.bgClass} ${occupancy.colorClass}`}>
            {occupancy.label}
          </span>

          <span className="px-2 py-0.5 rounded-md font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750 flex items-center gap-1">
            {fleet.propulsion === '100% Eléctrico' && <Zap className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />}
            <span>{fleet.model}</span>
          </span>

          {fleet.hasPMR && (
            <span className="px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-slate-900 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-slate-750 flex items-center gap-0.5" title="Rampa accesible para movilidad reducida">
              <Accessibility className="w-3 h-3" />
              <span>PMR</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

interface StopArrivalsBodyProps {
  data: ReturnType<typeof useStopArrivals>['data'];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  stop: BusStop;
  onShareArrival?: (stop: BusStop, arrival: StopArrival) => void;
}

const StopArrivalsBody: React.FC<StopArrivalsBodyProps> = ({
  data,
  loading,
  error,
  refresh,
  stop,
  onShareArrival,
}) => {
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

      {loading && !data && (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-teal-500" />
          <p className="text-sm">Consultando satélites GPS y horarios...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 dark:text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">No se pudo cargar la información</p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {data && data.arrivals.length === 0 && !loading && (
        <div className="py-10 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Clock className="w-10 h-10 mx-auto mb-2 text-slate-400 dark:text-slate-500 opacity-60" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Sin paso de autobuses previsto en los próximos minutos
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
            No hay servicios activos o en camino para las líneas de esta parada en este momento.
          </p>
        </div>
      )}

      {data && data.arrivals.length > 0 && (
        <div className="space-y-2.5">
          {data.arrivals.map(arr => {
            const uniqueKey = `${arr.routeShortName}_${arr.timestamp}_${arr.exactTime}_${arr.isRealtime ? 'rt' : 'sc'}`;
            return (
              <ArrivalItem
                key={uniqueKey}
                arr={arr}
                stop={stop}
                onShareArrival={onShareArrival}
              />
            );
          })}
        </div>
      )}
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
}) => {
  const { data, loading, error, refresh } = useStopArrivals(stop?.code || null);

  if (!stop) return null;

  return (
    <dialog
      open
      aria-labelledby="stop-modal-title"
      className="fixed inset-0 z-50 m-0 p-0 w-full h-full max-w-none max-h-none bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center border-none text-slate-800 dark:text-slate-100"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[88dvh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/90 relative">
          <div className="flex items-start justify-between gap-2.5 sm:gap-3">
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
              <span className="bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30 font-mono font-black text-sm px-2.5 py-1 rounded-xl shrink-0 mt-0.5">
                #{stop.code}
              </span>
              <div className="min-w-0 flex-1">
                <h3 id="stop-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug truncate">
                  {stop.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>AUVASA Valladolid</span>
                  <span>•</span>
                  <span>{stop.routes.length} líneas</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onToggleFavorite(stop.code)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isFavorite
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              >
                <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick passing lines badges */}
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/60">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold self-center mr-1">
              Líneas:
            </span>
            {stop.routes.map(r => (
              <span
                key={r}
                className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-700"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Modal Body: Arrivals list */}
        <StopArrivalsBody
          data={data}
          loading={loading}
          error={error}
          refresh={refresh}
          stop={stop}
          onShareArrival={onShareArrival}
        />

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 flex items-center justify-between gap-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          {onSetAlarm && (
            <button
              type="button"
              onClick={() => {
                onSetAlarm(stop);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-teal-700 dark:text-teal-300 text-xs font-bold transition-colors border border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
            >
              <Bell className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="hidden xs:inline sm:inline">Avisarme al llegar</span>
              <span className="xs:hidden sm:hidden">Avisar</span>
            </button>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onViewOnMap(stop);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors shadow-md shadow-teal-700/30 cursor-pointer shrink-0"
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
