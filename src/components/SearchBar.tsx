import React, { useState, useMemo } from 'react';
import { Search, X, MapPin, ArrowRight } from 'lucide-react';
import type { BusStop, BusRoute } from '../types/bus.ts';

interface SearchBarProps {
  stops: BusStop[];
  routes: BusRoute[];
  onSelectStop: (stop: BusStop) => void;
  onSelectRoute: (route: BusRoute) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  stops,
  routes,
  onSelectStop,
  onSelectRoute,
}) => {
  const [query, setQuery] = useState('');

  const trimmed = query.trim().toLowerCase();

  const filteredRoutes = useMemo(() => {
    if (!trimmed) return [];
    return routes
      .filter(
        r =>
          r.shortName.toLowerCase().includes(trimmed) ||
          r.name.toLowerCase().includes(trimmed) ||
          r.origin.toLowerCase().includes(trimmed) ||
          r.destination.toLowerCase().includes(trimmed)
      )
      .slice(0, 5);
  }, [trimmed, routes]);

  const filteredStops = useMemo(() => {
    if (!trimmed) return [];
    return stops
      .filter(
        s =>
          s.code.toLowerCase().includes(trimmed) ||
          s.name.toLowerCase().includes(trimmed) ||
          s.routes.some(r => r.toLowerCase() === trimmed)
      )
      .slice(0, 10);
  }, [trimmed, stops]);

  const hasResults = filteredRoutes.length > 0 || filteredStops.length > 0;

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Search Input Container */}
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Busca por parada (ej. 1002), calle (ej. Zorrilla) o línea (ej. C1)..."
          className="w-full pl-11 pr-11 py-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50"
          aria-label="Buscar parada o línea de autobús"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Auto-suggest dropdown */}
      {query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/98 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[75vh] overflow-y-auto">
          {!hasResults && (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400">
              <p className="text-sm">No se encontraron líneas ni paradas para &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Prueba con el número de parada (ej. 550) o calle (ej. Zorrilla)</p>
            </div>
          )}

          {/* Routes results */}
          {filteredRoutes.length > 0 && (
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 px-3 py-1 block">
                Líneas de Autobús ({filteredRoutes.length})
              </span>
              <div className="space-y-1 mt-1">
                {filteredRoutes.map(route => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => {
                      onSelectRoute(route);
                      setQuery('');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-9 h-7 rounded-lg font-black text-sm flex items-center justify-center shadow-md flex-shrink-0"
                        style={{ backgroundColor: route.color, color: route.textColor }}
                      >
                        {route.shortName}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white text-sm block group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                          {route.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {route.origin} ↔ {route.destination}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stops results */}
          {filteredStops.length > 0 && (
            <div className="p-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 px-3 py-1 block">
                Paradas ({filteredStops.length})
              </span>
              <div className="space-y-1 mt-1">
                {filteredStops.map(stop => (
                  <button
                    key={stop.code}
                    type="button"
                    onClick={() => {
                      onSelectStop(stop);
                      setQuery('');
                    }}
                    className="w-full flex items-start justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left transition-colors group cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-500/40 text-teal-700 dark:text-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 font-mono font-bold text-xs px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            #{stop.code}
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white text-sm group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                            {stop.name}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {stop.routes.slice(0, 8).map(r => (
                            <span
                              key={r}
                              className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                              {r}
                            </span>
                          ))}
                          {stop.routes.length > 8 && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center">
                              +{stop.routes.length - 8}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-transform group-hover:translate-x-0.5 flex-shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
