import React, { useState, useMemo } from 'react';
import { ArrowRightLeft, Radio, ChevronRight, Map } from 'lucide-react';
import type { BusRoute, RouteCategory, BusStop, LiveVehicle } from '../types/bus.ts';

interface LinesListProps {
  routes: BusRoute[];
  vehicles: LiveVehicle[];
  onSelectRouteForMap: (route: BusRoute) => void;
  onSelectStop: (stop: BusStop) => void;
  stopsMapByCode: Map<string, BusStop>;
}

export const LinesList: React.FC<LinesListProps> = ({
  routes,
  vehicles,
  onSelectRouteForMap,
  onSelectStop,
  stopsMapByCode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RouteCategory | 'todas'>('todas');
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [directionIndex, setDirectionIndex] = useState<'0' | '1'>('0');

  const filteredRoutes = useMemo(() => {
    if (selectedCategory === 'todas') return routes;
    return routes.filter(r => r.category === selectedCategory);
  }, [routes, selectedCategory]);

  const activeLine = useMemo(() => {
    if (!expandedRouteId) return null;
    return routes.find(r => r.id === expandedRouteId) || null;
  }, [routes, expandedRouteId]);

  // Live vehicles running on the currently selected route
  const activeLineVehicles = useMemo(() => {
    if (!activeLine) return [];
    return vehicles.filter(
      v => v.routeId === activeLine.id || v.lineName.toUpperCase() === activeLine.shortName.toUpperCase()
    );
  }, [activeLine, vehicles]);

  const categories: { key: RouteCategory | 'todas'; label: string }[] = [
    { key: 'todas', label: 'Todas las Líneas' },
    { key: 'ordinaria', label: 'Ordinarias (1-26)' },
    { key: 'circular', label: 'Circulares (C1, C2)' },
    { key: 'buho', label: 'Nocturnas (Búho)' },
    { key: 'lanzadera', label: 'Lanzaderas (LP, LC, H)' },
    { key: 'especial', label: 'Especiales / Polígonos' },
  ];

  return (
    <div className="space-y-6">
      {/* Category Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.key);
                setExpandedRouteId(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-700/30'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white shadow-sm'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid & Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Routes Cards List */}
        <div className={`space-y-3 ${activeLine ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            {filteredRoutes.length} líneas encontradas
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredRoutes.map(route => {
              const lineVehicles = vehicles.filter(
                v => v.routeId === route.id || v.lineName.toUpperCase() === route.shortName.toUpperCase()
              );
              const isSelected = expandedRouteId === route.id;

              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setExpandedRouteId(null);
                    } else {
                      setExpandedRouteId(route.id);
                      setDirectionIndex('0');
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 shadow-sm dark:shadow-md ${
                    isSelected
                      ? 'bg-teal-50/70 dark:bg-slate-800/90 border-teal-500/80 shadow-teal-500/10'
                      : 'bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className="w-12 h-10 rounded-xl font-black text-base flex items-center justify-center shadow-md flex-shrink-0"
                      style={{ backgroundColor: route.color, color: route.textColor }}
                    >
                      {route.shortName}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white text-sm block truncate">
                        {route.name}
                      </span>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {lineVehicles.length > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {lineVehicles.length} en ruta
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Sin buses en directo</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform flex-shrink-0 ${
                      isSelected ? 'rotate-90 text-teal-600 dark:text-teal-400' : ''
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Line Route Explorer & Stops Progression */}
        {activeLine && (
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl h-fit transition-colors">
            {/* Header of Active Line */}
            <div className="flex items-start justify-between gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span
                  className="w-12 h-10 sm:w-14 sm:h-12 rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center shadow-lg shrink-0"
                  style={{ backgroundColor: activeLine.color, color: activeLine.textColor }}
                >
                  {activeLine.shortName}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight truncate">
                    {activeLine.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                      <Radio className="w-3.5 h-3.5 shrink-0" />
                      <span>{activeLineVehicles.length} autobuses activos en GPS</span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectRouteForMap(activeLine)}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-md shadow-teal-700/30 cursor-pointer shrink-0"
                aria-label={`Ver mapa de la línea ${activeLine.shortName}`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>Ver Mapa</span>
              </button>
            </div>

            {/* Direction Selector (Sentido 0 vs Sentido 1) */}
            <div className="flex gap-2 my-4">
              {activeLine.directions['0'] && (
                <button
                  type="button"
                  onClick={() => setDirectionIndex('0')}
                  className={`flex-1 min-w-0 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors text-left flex items-center gap-2 cursor-pointer ${
                    directionIndex === '0'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">
                    Ida: {activeLine.directions['0'].headsign || activeLine.destination}
                  </span>
                </button>
              )}

              {activeLine.directions['1'] && (
                <button
                  type="button"
                  onClick={() => setDirectionIndex('1')}
                  className={`flex-1 min-w-0 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors text-left flex items-center gap-2 cursor-pointer ${
                    directionIndex === '1'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">
                    Vuelta: {activeLine.directions['1'].headsign || activeLine.origin}
                  </span>
                </button>
              )}
            </div>

            {/* Subway Style Stop Progression Timeline */}
            <div className="space-y-1 max-h-[550px] overflow-y-auto pr-1">
              {activeLine.directions[directionIndex]?.stops.map((stopItem, index, arr) => {
                const fullStop = stopsMapByCode.get(stopItem.stopCode);
                const isLast = index === arr.length - 1;
                const uniqueKey = `${stopItem.stopCode}_${stopItem.seq}_${directionIndex}`;

                return (
                  <div key={uniqueKey} className="relative flex items-start gap-3 group">
                    {/* Vertical timeline line */}
                    {!isLast && (
                      <div
                        className="absolute left-[13px] top-[18px] bottom-[-10px] w-0.5"
                        style={{ backgroundColor: activeLine.color }}
                      />
                    )}

                    {/* Timeline dot */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white dark:border-slate-900 shadow-md text-[10px] font-bold"
                      style={{ backgroundColor: activeLine.color, color: activeLine.textColor }}
                    >
                      {index + 1}
                    </div>

                    {/* Stop Details Card */}
                    <button
                      type="button"
                      onClick={() => {
                        if (fullStop) onSelectStop(fullStop);
                      }}
                      className="flex-1 min-w-0 p-2 sm:p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs text-teal-700 dark:text-teal-400 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                            #{stopItem.stopCode}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors truncate">
                            {stopItem.name}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 font-medium whitespace-nowrap shrink-0 flex items-center gap-0.5">
                        <span className="hidden sm:inline">Ver tiempos</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400" />
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
