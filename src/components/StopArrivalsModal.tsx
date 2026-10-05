import React from 'react';
import { X, Star, RefreshCw, Radio, Clock, MapPin, AlertCircle, ShieldCheck } from 'lucide-react';
import type { BusStop } from '../types/bus.ts';
import { useStopArrivals } from '../hooks/useStopArrivals.ts';

interface StopArrivalsModalProps {
  stop: BusStop | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (stopCode: string) => void;
  onViewOnMap: (stop: BusStop) => void;
}

export const StopArrivalsModal: React.FC<StopArrivalsModalProps> = ({
  stop,
  onClose,
  isFavorite,
  onToggleFavorite,
  onViewOnMap,
}) => {
  const { data, loading, error, refresh } = useStopArrivals(stop?.code || null);

  if (!stop) return null;

  return (
    <dialog
      open
      aria-labelledby="stop-modal-title"
      className="fixed inset-0 z-50 m-0 p-0 w-full h-full max-w-none max-h-none bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center border-none text-slate-100"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl overflow-hidden transition-opacity">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-900/90 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="bg-teal-500/10 text-teal-400 border border-teal-500/30 font-mono font-black text-sm px-2.5 py-1 rounded-xl flex-shrink-0 mt-0.5">
                #{stop.code}
              </span>
              <div>
                <h3 id="stop-modal-title" className="text-lg font-bold text-white leading-snug">
                  {stop.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <span>AUVASA Valladolid</span>
                  <span>•</span>
                  <span>{stop.routes.length} líneas</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => onToggleFavorite(stop.code)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isFavorite
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              >
                <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick passing lines badges */}
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-400 font-semibold self-center mr-1">
              Líneas:
            </span>
            {stop.routes.map(r => (
              <span
                key={r}
                className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Modal Body: Arrivals list */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              Próximas Llegadas
            </span>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-1 text-teal-400 hover:text-teal-300 font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>

          {loading && !data && (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-teal-500" />
              <p className="text-sm">Consultando satélites GPS y horarios...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">No se pudo cargar la información</p>
                <p className="text-xs text-red-400 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {data && data.arrivals.length === 0 && !loading && (
            <div className="py-10 text-center text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-800">
              <Clock className="w-10 h-10 mx-auto mb-2 text-slate-500 opacity-60" />
              <p className="text-sm font-medium text-slate-300">
                Sin paso de autobuses previsto en los próximos minutos
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                No hay servicios activos o en camino para las líneas de esta parada en este momento.
              </p>
            </div>
          )}

          {data && data.arrivals.length > 0 && (
            <div className="space-y-2.5">
              {data.arrivals.map(arr => {
                const isArriving = arr.minutesRemaining <= 0;
                const uniqueKey = `${arr.routeShortName}_${arr.timestamp}_${arr.exactTime}_${arr.isRealtime ? 'rt' : 'sc'}`;
                return (
                  <div
                    key={uniqueKey}
                    className="p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 transition-colors flex items-center justify-between gap-3 shadow-md"
                  >
                    {/* Left: Line and Destination */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-11 h-9 rounded-xl font-black text-sm flex items-center justify-center shadow-md flex-shrink-0 tracking-tight"
                        style={{ backgroundColor: arr.routeColor, color: arr.routeTextColor }}
                      >
                        {arr.routeShortName}
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-white text-sm block truncate">
                          {arr.destination || `Línea ${arr.routeShortName}`}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-xs">
                          {arr.isRealtime ? (
                            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              GPS Real
                              {arr.licensePlate && (
                                <span className="text-slate-400 font-mono text-[11px] ml-1">
                                  ({arr.licensePlate})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-amber-400/90 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" />
                              Programado ({arr.exactTime})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Arrival Time Badge */}
                    <div className="text-right flex-shrink-0">
                      <div
                        className={`inline-flex items-center px-3 py-1.5 rounded-xl font-black text-sm shadow-sm ${
                          isArriving
                            ? 'bg-emerald-500 text-slate-950 animate-pulse font-extrabold'
                            : arr.isRealtime
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isArriving ? 'Llegando' : `${arr.minutesRemaining} min`}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        Hora: {arr.exactTime}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Datos GTFS AUVASA certificados</span>
          </div>

          <button
            type="button"
            onClick={() => {
              onViewOnMap(stop);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors shadow-md shadow-teal-700/30 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Ver en el Mapa</span>
          </button>
        </div>
      </div>
    </dialog>
  );
};
