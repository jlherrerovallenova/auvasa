import React from 'react';
import { Locate, RotateCcw, Layers } from 'lucide-react';

interface MapControlsProps {
  showStops: boolean;
  onToggleStops: () => void;
  onLocateMe: () => void;
  onCenterValladolid: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  showStops,
  onToggleStops,
  onLocateMe,
  onCenterValladolid,
}) => {
  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
      <button
        type="button"
        onClick={onLocateMe}
        className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-teal-400 border border-slate-700/80 flex items-center justify-center shadow-lg backdrop-blur-md transition-colors active:scale-95 cursor-pointer"
        title="Mi Ubicación"
        aria-label="Ir a mi ubicación GPS"
      >
        <Locate className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={onCenterValladolid}
        className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 flex items-center justify-center shadow-lg backdrop-blur-md transition-colors active:scale-95 cursor-pointer"
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
            ? 'bg-teal-600/90 text-white border-teal-500'
            : 'bg-slate-900/90 text-slate-400 border-slate-700/80 hover:text-white'
        }`}
        title={showStops ? 'Ocultar Paradas' : 'Mostrar Paradas'}
        aria-label="Alternar visualización de paradas"
      >
        <Layers className="w-4 h-4" />
      </button>
    </div>
  );
};
