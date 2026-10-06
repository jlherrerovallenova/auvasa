import React from 'react';
import { Map } from 'lucide-react';
import { LiveMap } from './LiveMap.tsx';
import { MapStopArrivalsCard } from './map/MapStopArrivalsCard.tsx';
import type { BusStop, BusRoute, LiveVehicle, StopArrival } from '../types/bus.ts';

interface MapViewTabProps {
  stops: BusStop[];
  routes: BusRoute[];
  vehicles: LiveVehicle[];
  selectedStop: BusStop | null;
  selectedRoute: BusRoute | null;
  userLat: number | null;
  userLon: number | null;
  theme?: 'light' | 'dark';
  onSelectStop: (stop: BusStop) => void;
  onCloseStop: () => void;
  isFavoriteStop?: (stopCode: string) => boolean;
  onToggleFavoriteStop?: (stopCode: string) => void;
  onSetAlarm?: (stop: BusStop) => void;
  onShareArrival?: (stop: BusStop, arrival: StopArrival) => void;
  onStartOnboard?: (stop: BusStop, arrival: StopArrival) => void;
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
  theme,
  onSelectStop,
  onCloseStop,
  isFavoriteStop,
  onToggleFavoriteStop,
  onSetAlarm,
  onShareArrival,
  onStartOnboard,
  onRequestLocation,
  onClearRouteFilter,
}) => {
  return (
    <div className="h-[calc(100dvh-185px)] min-h-[420px] flex flex-col space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-1 gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Map className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">Mapa en Vivo</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 hidden xs:inline">• {vehicles.length} buses en ruta</span>
        </div>

        {selectedRoute && (
          <button
            type="button"
            onClick={onClearRouteFilter}
            className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-xl shadow-sm transition-colors cursor-pointer shrink-0 truncate max-w-[150px]"
          >
            Quitar ({selectedRoute.shortName})
          </button>
        )}
      </div>

      <div className="relative flex-1 min-h-0 rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
        <LiveMap
          stops={stops}
          routes={routes}
          vehicles={vehicles}
          selectedStop={selectedStop}
          selectedRoute={selectedRoute}
          userLat={userLat}
          userLon={userLon}
          theme={theme}
          onSelectStop={onSelectStop}
          onRequestLocation={onRequestLocation}
        />

        {/* Floating In-Map Stop Arrivals Card */}
        {selectedStop && (
          <MapStopArrivalsCard
            stop={selectedStop}
            onClose={onCloseStop}
            isFavorite={isFavoriteStop ? isFavoriteStop(selectedStop.code) : false}
            onToggleFavorite={onToggleFavoriteStop || (() => {})}
            onSetAlarm={onSetAlarm}
            onShareArrival={onShareArrival}
            onStartOnboard={onStartOnboard}
          />
        )}
      </div>
    </div>
  );
};
