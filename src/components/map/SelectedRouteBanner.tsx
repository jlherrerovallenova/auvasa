import React from 'react';
import type { BusRoute, LiveVehicle } from '../../types/bus.ts';

interface SelectedRouteBannerProps {
  selectedRoute: BusRoute;
  vehicles: LiveVehicle[];
  onClearRoute: () => void;
}

export const SelectedRouteBanner: React.FC<SelectedRouteBannerProps> = ({
  selectedRoute,
  vehicles,
  onClearRoute,
}) => {
  const lineVehiclesCount = vehicles.filter(
    v => v.lineName.toUpperCase() === selectedRoute.shortName.toUpperCase()
  ).length;

  return (
    <div className="absolute bottom-6 left-4 right-4 md:left-6 md:right-auto z-20 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/90 rounded-2xl p-4 shadow-xl dark:shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 max-w-md transition-colors">
      <div className="flex items-center gap-3">
        <span
          className="w-12 h-9 rounded-xl font-black text-base flex items-center justify-center shadow-md flex-shrink-0"
          style={{ backgroundColor: selectedRoute.color, color: selectedRoute.textColor }}
        >
          {selectedRoute.shortName}
        </span>
        <div>
          <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedRoute.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {lineVehiclesCount} buses en ruta ahora
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClearRoute}
        className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer"
      >
        Ver todo
      </button>
    </div>
  );
};
