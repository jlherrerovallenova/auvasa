import React from 'react';
import { SearchBar } from './SearchBar.tsx';
import { LinesList } from './LinesList.tsx';
import type { BusStop, BusRoute, LiveVehicle } from '../types/bus.ts';

interface LinesExplorerTabProps {
  stops: BusStop[];
  routes: BusRoute[];
  vehicles: LiveVehicle[];
  stopsMapByCode: Map<string, BusStop>;
  onSelectStop: (stop: BusStop) => void;
  onSelectRouteFromSearch: (route: BusRoute) => void;
  onSelectRouteForMap: (route: BusRoute) => void;
}

export const LinesExplorerTab: React.FC<LinesExplorerTabProps> = ({
  stops,
  routes,
  vehicles,
  stopsMapByCode,
  onSelectStop,
  onSelectRouteFromSearch,
  onSelectRouteForMap,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Líneas de Autobús de Valladolid
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Red completa de AUVASA: recorridos, sentidos, paradas y buses en tiempo real.
          </p>
        </div>

        <div className="w-full md:w-80">
          <SearchBar
            stops={stops}
            routes={routes}
            onSelectStop={onSelectStop}
            onSelectRoute={onSelectRouteFromSearch}
          />
        </div>
      </div>

      <LinesList
        routes={routes}
        vehicles={vehicles}
        onSelectRouteForMap={onSelectRouteForMap}
        onSelectStop={onSelectStop}
        stopsMapByCode={stopsMapByCode}
      />
    </div>
  );
};
