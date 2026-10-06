import React from 'react';
import { Star, Bus, MapPin, Trash2, ArrowRight } from 'lucide-react';
import type { BusStop, BusRoute } from '../types/bus.ts';

interface FavoritesViewProps {
  favoriteStops: string[];
  favoriteLines: string[];
  stopsMapByCode: Map<string, BusStop>;
  routeMapById: Map<string, BusRoute>;
  onSelectStop: (stop: BusStop) => void;
  onSelectRoute: (route: BusRoute) => void;
  onToggleFavoriteStop: (stopCode: string) => void;
  onToggleFavoriteLine: (lineId: string) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favoriteStops,
  favoriteLines,
  stopsMapByCode,
  routeMapById,
  onSelectStop,
  onSelectRoute,
  onToggleFavoriteStop,
  onToggleFavoriteLine,
}) => {
  const hasFavorites = favoriteStops.length > 0 || favoriteLines.length > 0;

  if (!hasFavorites) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center max-w-lg mx-auto shadow-xl transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tus Favoritos de Valladolid</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
          Guarda tus paradas y líneas habituales pulsando el icono de estrella para consultar sus tiempos de llegada al instante sin tener que buscar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Favorite Lines Section */}
      {favoriteLines.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Bus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Líneas Favoritas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {favoriteLines.map(lineId => {
              const route = routeMapById.get(lineId);
              if (!route) return null;

              return (
                <div
                  key={lineId}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onSelectRoute(route)}
                    className="flex items-center gap-3 min-w-0 text-left flex-1 cursor-pointer"
                  >
                    <span
                      className="w-11 h-9 rounded-xl font-black text-sm flex items-center justify-center shadow-md shrink-0"
                      style={{ backgroundColor: route.color, color: route.textColor }}
                    >
                      {route.shortName}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 dark:text-white text-sm block truncate">
                        {route.name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                        {route.origin} ↔ {route.destination}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleFavoriteLine(lineId)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    aria-label={`Eliminar línea ${route.shortName} de favoritos`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Favorite Stops Section */}
      {favoriteStops.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Paradas Favoritas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {favoriteStops.map(stopCode => {
              const stop = stopsMapByCode.get(stopCode);
              if (!stop) return null;

              return (
                <div
                  key={stopCode}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onSelectStop(stop)}
                    className="flex items-start gap-3 min-w-0 text-left flex-1 cursor-pointer"
                  >
                    <span className="bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400 font-mono font-bold text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 mt-0.5 shrink-0">
                      #{stop.code}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 dark:text-white text-sm block truncate">
                        {stop.name}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {stop.routes.slice(0, 6).map(r => (
                          <span
                            key={r}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectStop(stop)}
                      className="p-2 rounded-xl text-teal-600 dark:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      aria-label="Ver tiempos"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleFavoriteStop(stopCode)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      aria-label={`Eliminar parada ${stop.code} de favoritos`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
