import React from 'react';
import { Activity, Gauge, AlertTriangle, Video, X } from 'lucide-react';
import type { CityTrafficSummary } from '../../types/traffic.ts';

interface TrafficStatusCardProps {
  summary: CityTrafficSummary;
  showCameras: boolean;
  onToggleCameras: () => void;
  onClose: () => void;
}

export const TrafficStatusCard: React.FC<TrafficStatusCardProps> = ({
  summary,
  showCameras,
  onToggleCameras,
  onClose,
}) => {
  const getBadgeClass = () => {
    switch (summary.level) {
      case 'congested':
        return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
      case 'slow':
        return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
      case 'moderate':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="absolute top-4 left-3 right-3 sm:left-4 sm:right-auto sm:w-80 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 sm:p-3.5 space-y-2.5 animate-in slide-in-from-top duration-200 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Activity className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
              Tráfico en Tiempo Real
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Sensorizado por la flota AUVASA
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Ocultar panel de tráfico"
          aria-label="Ocultar panel de tráfico"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Traffic Level Badge */}
      <div className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${getBadgeClass()}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
            style={{ backgroundColor: summary.levelColor }}
          />
          <span className="text-xs font-black truncate">{summary.levelLabel}</span>
        </div>
        <span className="text-[11px] font-bold shrink-0">{summary.fluidPercentage}% fluido</span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-1.5 text-center">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
            <Gauge className="w-3 h-3 text-teal-600 dark:text-teal-400" />
            <span>Vel. Media</span>
          </div>
          <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
            {summary.avgSpeedKmh} <span className="text-[10px] font-normal text-slate-400">km/h</span>
          </p>
        </div>

        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Puntos Lentos</span>
          </div>
          <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
            {summary.congestedSpotsCount}{' '}
            <span className="text-[10px] font-normal text-slate-400">
              {summary.congestedSpotsCount === 1 ? 'tramo' : 'tramos'}
            </span>
          </p>
        </div>
      </div>

      {/* Toggle Traffic Cameras & Legend */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/80 dark:border-slate-800 text-[10px]">
        {/* Color Legend */}
        <div className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Fluido
          </span>
          <span className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Lento
          </span>
          <span className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Atasco
          </span>
        </div>

        {/* Camera Toggle */}
        <button
          type="button"
          onClick={onToggleCameras}
          className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 transition-colors cursor-pointer ${
            showCameras
              ? 'bg-teal-600 text-white border-teal-500 shadow-2xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Video className="w-3 h-3" />
          <span>Cámaras</span>
        </button>
      </div>
    </div>
  );
};
