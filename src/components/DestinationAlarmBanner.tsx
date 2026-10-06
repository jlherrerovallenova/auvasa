import React from 'react';
import { BellRing, X, CheckCircle2 } from 'lucide-react';
import type { BusStop } from '../types/bus.ts';

interface DestinationAlarmBannerProps {
  targetStop: BusStop | null;
  distanceMeters: number | null;
  isTriggered: boolean;
  onCancel: () => void;
}

export const DestinationAlarmBanner: React.FC<DestinationAlarmBannerProps> = ({
  targetStop,
  distanceMeters,
  isTriggered,
  onCancel,
}) => {
  if (!targetStop) return null;

  if (isTriggered) {
    return (
      <dialog
        open
        aria-labelledby="alarm-modal-title"
        className="fixed inset-0 z-50 m-0 p-0 w-full h-full max-w-none max-h-none bg-black/80 backdrop-blur-md flex items-center justify-center border-none text-slate-800 dark:text-slate-100"
      >
        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl text-center space-y-4 animate-bounce">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
            <BellRing className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <h3 id="alarm-modal-title" className="text-2xl font-black text-slate-900 dark:text-white">
              ¡Prepárate para bajar!
            </h3>
            <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-1">
              Estás a menos de 350 metros de tu destino
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-left">
            <span className="font-mono text-xs text-teal-700 dark:text-teal-400 font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              #{targetStop.code}
            </span>
            <p className="font-bold text-slate-900 dark:text-white text-sm mt-1">{targetStop.name}</p>
            {distanceMeters !== null && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Distancia aproximada: {distanceMeters} m</p>
            )}
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-2xl transition-colors shadow-lg shadow-emerald-900/40 cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>¡Entendido! Desactivar alarma</span>
          </button>
        </div>
      </dialog>
    );
  }

  return (
    <aside
      aria-label="Alarma de destino activa"
      className="bg-teal-50/90 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-500/40 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-md dark:shadow-lg max-w-2xl mx-auto transition-colors"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="relative flex h-3 w-3 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-teal-800 dark:text-teal-300 truncate">
            Alarma de destino activa: #{targetStop.code} {targetStop.name}
          </p>
          {distanceMeters !== null && (
            <p className="text-[11px] text-teal-700/90 dark:text-teal-400/80">
              A {distanceMeters} metros de distancia • Te avisaremos a 350m
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="p-1.5 rounded-lg bg-teal-100 hover:bg-teal-200 dark:bg-teal-900/80 dark:hover:bg-teal-800 text-teal-700 dark:text-teal-200 transition-colors flex-shrink-0 cursor-pointer"
        aria-label="Cancelar alarma de parada"
      >
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
};
