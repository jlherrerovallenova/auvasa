import React from 'react';
import { Locate, RotateCcw, Layers, Sun, Moon } from 'lucide-react';

interface MapControlsProps {
  showStops: boolean;
  mapTheme: 'dark' | 'streets';
  onToggleStops: () => void;
  onToggleMapTheme: () => void;
  onLocateMe: () => void;
  onCenterValladolid: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  showStops,
  mapTheme,
  onToggleStops,
  onToggleMapTheme,
  onLocateMe,
  onCenterValladolid,
}) => {
  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
      <button
        type="button"
        onClick={onLocateMe}
        className="w-10 h-10 rounded-xl bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-600 dark:text-teal-400 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shadow-lg backdrop-blur-md transition-colors active:scale-95 cursor-pointer"
        title="Mi Ubicación"
        aria-label="Ir a mi ubicación GPS"
      >
        <Locate className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={onCenterValladolid}
        className="w-10 h-10 rounded-xl bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shadow-lg backdrop-blur-md transition-colors active:scale-95 cursor-pointer"
        title="Centrar en Valladolid"
        aria-label="Centrar mapa en Valladolid"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onToggleStops}
        className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-lg backdrop-blur-md transition-colors active:scale-95 cursor-pointer ${
          showStops
            ? 'bg-teal-600 text-white border-teal-500 shadow-teal-700/20'
            : 'bg-white/90 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/80 hover:text-slate-900 dark:hover:text-white'
        }`}
        title={showStops ? 'Ocultar Paradas' : 'Mostrar Paradas'}
        aria-label="Alternar visualización de paradas"
      >
        <Layers className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onToggleMapTheme}
        className="w-10 h-10 rounded-xl bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-500 dark:text-amber-400 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shadow-lg backdrop-blur-md transition-colors active:scale-95 cursor-pointer"
        title={mapTheme === 'dark' ? 'Cambiar a mapa de calles claras' : 'Cambiar a mapa oscuro'}
        aria-label="Cambiar estilo de mapa"
      >
        {mapTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </div>
  );
};
