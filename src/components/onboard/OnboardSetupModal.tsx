import React, { useState, useMemo } from 'react';
import { X, Bus, Search, ArrowRight, Flag } from 'lucide-react';
import type { BusRoute, RouteStop, BusStop } from '../../types/bus.ts';

interface OnboardSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: BusRoute | null;
  originStop: BusStop | RouteStop | null;
  vehicleId?: string | null;
  onConfirmTrip: (params: {
    route: BusRoute;
    directionKey: string;
    originStop: RouteStop | BusStop;
    destinationStop: RouteStop | null;
    vehicleId?: string | null;
  }) => void;
}

export const OnboardSetupModal: React.FC<OnboardSetupModalProps> = ({
  isOpen,
  onClose,
  route,
  originStop,
  vehicleId,
  onConfirmTrip,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestStop, setSelectedDestStop] = useState<RouteStop | null>(null);

  // Determine direction that contains originStop
  const { directionKey, dirInfo, availableStops } = useMemo(() => {
    if (!route || !originStop) {
      return { directionKey: '0', dirInfo: null, availableStops: [] };
    }

    const originCode = 'code' in originStop ? originStop.code : originStop.stopCode;
    let foundDirKey = '0';
    let foundIndex = -1;

    for (const [k, d] of Object.entries(route.directions || {})) {
      const idx = d.stops?.findIndex(s => s.stopCode === originCode);
      if (idx !== -1) {
        foundDirKey = k;
        foundIndex = idx;
        break;
      }
    }

    const dInfo = route.directions[foundDirKey] || { headsign: route.destination, stops: [] };
    const allStops = dInfo.stops || [];

    // Filter to stops occurring AFTER origin stop
    const stopsAfterOrigin = foundIndex >= 0 ? allStops.slice(foundIndex + 1) : allStops;

    return {
      directionKey: foundDirKey,
      dirInfo: dInfo,
      availableStops: stopsAfterOrigin,
    };
  }, [route, originStop]);

  const filteredStops = useMemo(() => {
    if (!searchQuery.trim()) return availableStops;
    const q = searchQuery.toLowerCase();
    return availableStops.filter(
      s => s.name.toLowerCase().includes(q) || s.stopCode.includes(q)
    );
  }, [availableStops, searchQuery]);

  if (!isOpen || !route || !originStop) return null;

  const originCode = 'code' in originStop ? originStop.code : originStop.stopCode;
  const originName = originStop.name;

  const handleStart = (destination: RouteStop | null) => {
    onConfirmTrip({
      route,
      directionKey,
      originStop,
      destinationStop: destination,
      vehicleId,
    });
    onClose();
  };

  return (
    <dialog
      open
      aria-labelledby="setup-modal-title"
      className="fixed inset-0 z-50 m-0 p-0 w-full h-full max-w-none max-h-none bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center border-none text-slate-800 dark:text-slate-100 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shadow-md shrink-0"
              style={{ backgroundColor: route.color, color: route.textColor }}
            >
              {route.shortName}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Modo Copiloto A Bordo
                </span>
              </div>
              <h3 id="setup-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                Línea {route.shortName} → {dirInfo?.headsign || route.destination}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Boarding Info Card */}
        <div className="p-4 bg-teal-500/10 border-b border-teal-500/20 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-700 dark:text-teal-300 shrink-0 mt-0.5">
            <Bus className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <span className="text-teal-700 dark:text-teal-300 font-bold block">
              Parada de subida confirmada
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5">
              <span className="font-mono font-bold text-teal-600 dark:text-teal-400 mr-1">#{originCode}</span>
              {originName}
            </p>
          </div>
        </div>

        {/* Destination Stop Selector */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
          <div>
            <label htmlFor="dest-stop-search" className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              ¿En qué parada te quieres bajar?
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Te avisaremos con sonido y vibración cuando quede <strong>1 parada</strong> para que toques el timbre a tiempo.
            </p>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                id="dest-stop-search"
                name="dest-stop-search"
                type="text"
                aria-label="Buscar parada de destino"
                placeholder="Buscar parada de destino..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Stops List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {filteredStops.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No hay más paradas coincidentes en este sentido.
              </div>
            ) : (
              filteredStops.map((stop, idx) => {
                const isSelected = selectedDestStop?.stopCode === stop.stopCode;
                const stopsAway = idx + 1;
                return (
                  <button
                    key={stop.stopCode}
                    type="button"
                    onClick={() => setSelectedDestStop(stop)}
                    className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/15 border-teal-500 dark:border-teal-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                        #{stop.stopCode}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {stop.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                      <span>a {stopsAway} {stopsAway === 1 ? 'parada' : 'paradas'}</span>
                      {isSelected && <Flag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 ml-1" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 flex flex-col sm:flex-row items-center gap-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            onClick={() => handleStart(null)}
            className="w-full sm:w-1/2 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
          >
            Elegir sobre la marcha
          </button>

          <button
            type="button"
            onClick={() => handleStart(selectedDestStop)}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors shadow-md shadow-teal-700/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>{selectedDestStop ? 'Confirmar y Subir' : 'Subirme al bus'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </dialog>
  );
};
