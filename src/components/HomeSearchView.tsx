import React from 'react';
import { SearchBar } from './SearchBar.tsx';
import { NearbyStops } from './NearbyStops.tsx';
import { DailyRoutineCard } from './DailyRoutineCard.tsx';
import type { BusStop, BusRoute } from '../types/bus.ts';
import { Radio, Compass } from 'lucide-react';

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
      </div>

      {/* Daily Routine Commute Card */}
      <DailyRoutineCard
        stops={stops}
        routes={routes}
        onSelectStop={onSelectStop}
      />

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
    </div>
  );
};
