import React from 'react';
import { SearchBar } from './SearchBar.tsx';
import { NearbyStops } from './NearbyStops.tsx';
import { DailyRoutineCard } from './DailyRoutineCard.tsx';
import type { BusStop, BusRoute } from '../types/bus.ts';
import type { ActiveTab } from './Header.tsx';
import { Radio, Compass, Route, Hash, AlertCircle, Bus, Star } from 'lucide-react';

interface HomeSearchViewProps {
  stops: BusStop[];
  routes: BusRoute[];
  vehiclesCount: number;
  popularLines: BusRoute[];
  nearbyStops: BusStop[];
  hasLocation: boolean;
  loadingLocation: boolean;
  locationError: string | null;
  onRequestLocation: () => void;
  onSelectStop: (stop: BusStop) => void;
  onSelectRouteFromSearch: (route: BusRoute) => void;
  onOpenMap: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const HomeSearchView: React.FC<HomeSearchViewProps> = ({
  stops,
  routes,
  vehiclesCount,
  popularLines,
  nearbyStops,
  hasLocation,
  loadingLocation,
  locationError,
  onRequestLocation,
  onSelectStop,
  onSelectRouteFromSearch,
  onOpenMap,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Search & Quick Lines */}
      <div className="max-w-2xl mx-auto pt-1">
        <SearchBar
          stops={stops}
          routes={routes}
          onSelectStop={onSelectStop}
          onSelectRoute={onSelectRouteFromSearch}
        />

        {/* Quick Popular Lines Pills */}
        {popularLines.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
            <span className="text-xs text-slate-500 font-semibold mr-1">Líneas rápidas:</span>
            {popularLines.map(line => (
              <button
                key={line.id}
                type="button"
                onClick={() => onSelectRouteFromSearch(line)}
                className="px-2.5 py-1 rounded-lg font-black text-xs transition-transform hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                style={{ backgroundColor: line.color, color: line.textColor }}
              >
                {line.shortName}
              </button>
            ))}
          </div>
        )}

        {/* Quick Tools & Options Shortcut Grid */}
        {onNavigateTab && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
            <button
              type="button"
              onClick={() => onNavigateTab('lines')}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group text-center"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <Bus className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">Líneas</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden xs:inline">54 rutas</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('map')}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group text-center"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">Mapa</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden xs:inline">En directo</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('routes')}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group text-center"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <Route className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">Cómo llegar</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden xs:inline">Puerta a puerta</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('marquesina')}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group text-center"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <Hash className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">Marquesina</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden xs:inline">Poste rápido</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('favorites')}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group text-center"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <Star className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">Favoritos</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden xs:inline">Guardados</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('alerts')}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group text-center"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">Avisos</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden xs:inline">Incidencias</span>
            </button>
          </div>
        )}
      </div>

      {/* Nearby Stops Section */}
      <NearbyStops
        nearbyStops={nearbyStops}
        hasLocation={hasLocation}
        loadingLocation={loadingLocation}
        locationError={locationError}
        onRequestLocation={onRequestLocation}
        onSelectStop={onSelectStop}
      />

      {/* Quick Map Preview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
            Mapa Interactivo Satelital
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Mira {vehiclesCount} autobuses moviéndose por Valladolid
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg">
            Consulta el mapa completo con las 54 líneas, sentidos de recorrido, paradas y la posición exacta de cada autobús con su matrícula y velocidad en directo.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenMap}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-bold px-6 py-3.5 rounded-2xl transition-transform shadow-lg shadow-teal-700/30 active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Compass className="w-5 h-5" />
          <span>Abrir Mapa en Directo</span>
        </button>
      </div>

      {/* Daily Routine Commute Card */}
      <DailyRoutineCard
        stops={stops}
        routes={routes}
        onSelectStop={onSelectStop}
      />
    </div>
  );
};
