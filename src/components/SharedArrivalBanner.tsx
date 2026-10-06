import React from 'react';
import { Share2, X } from 'lucide-react';

interface SharedArrivalBannerProps {
  info: { line: string; stop: string; eta: string } | null;
  onOpenStop: () => void;
  onClose: () => void;
}

export const SharedArrivalBanner: React.FC<SharedArrivalBannerProps> = ({
  info,
  onOpenStop,
  onClose,
}) => {
  if (!info) return null;

  return (
    <div className="bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md dark:shadow-lg transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
          <Share2 className="w-4 h-4" />
        </div>
        <div className="text-xs sm:text-sm">
          <span className="font-bold text-slate-900 dark:text-white">¡Aviso de llegada compartido! </span>
          <span className="text-teal-800 dark:text-teal-200">
            Línea {info.line} hacia parada #{info.stop} (aprox. {info.eta} min).
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          onClick={onOpenStop}
          className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          Ver Parada #{info.stop}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Cerrar aviso compartido"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
