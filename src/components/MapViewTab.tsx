import React from 'react';
import { Map } from 'lucide-react';
import { LiveMap } from './LiveMap.tsx';
import type { BusStop, BusRoute, LiveVehicle } from '../types/bus.ts';

interface MapViewTabProps {
  stops: BusStop[];
  routes: BusRoute[];
  vehicles: LiveVehicle[];
  selectedStop: BusStop | null;
  selectedRoute: BusRoute | null;
  userLat: number | null;
  userLon: number | null;
  onSelectStop: (stop: BusStop) => void;
  onRequestLocation: () => void;
  onClearRouteFilter: () => void;
}

export const MapViewTab: React.FC<MapViewTabProps> = ({
  stops,
  routes,
  vehicles,
  selectedStop,
  selectedRoute,
  userLat,
  userLon,
  onSelectStop,
  onRequestLocation,
  onClearRouteFilter,
}) => {
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-teal-400" />
          <h2 className="text-lg font-bold text-white">Mapa en Tiempo Real</h2>
          <span className="text-xs text-slate-400">• {vehicles.length} buses en ruta</span>
        </div>

        {selectedRoute && (
          <button
            type="button"
            onClick={onClearRouteFilter}
            className="text-xs text-teal-400 hover:text-teal-300 font-bold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
          >
            Quitar filtro de línea ({selectedRoute.shortName})
          </button>
        )}
      </div>

      <LiveMap
        stops={stops}
        routes={routes}
        vehicles={vehicles}
        selectedStop={selectedStop}
        selectedRoute={selectedRoute}
        userLat={userLat}
        userLon={userLon}
        onSelectStop={onSelectStop}
        onRequestLocation={onRequestLocation}
      />
    </div>
  );
};
