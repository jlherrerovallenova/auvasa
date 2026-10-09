import React, { useState } from 'react';
import { X, Copy, Check, Watch } from 'lucide-react';

interface WatchShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchWatchView: () => void;
}

export const WatchShareModal: React.FC<WatchShareModalProps> = ({
  isOpen,
  onClose,
  onLaunchWatchView,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const watchUrl = `${window.location.origin}/watch`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(watchUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <dialog
      open
      aria-labelledby="watch-modal-title"
      className="fixed inset-0 z-50 m-0 p-0 w-full h-full max-w-none max-h-none bg-black/70 backdrop-blur-sm flex items-center justify-center border-none p-4 text-slate-800 dark:text-slate-100"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-5 md:p-6 space-y-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Watch className="w-5 h-5" />
            </div>
            <div>
              <h3 id="watch-modal-title" className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Usar en Apple Watch
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vista ligera ultra compacta para watchOS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-2.5 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
              1
            </span>
            <p className="text-slate-600 dark:text-slate-300">
              Copia el enlace de abajo y <strong>envíatelo por iMessage, WhatsApp o una Nota de Apple</strong>.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
              2
            </span>
            <p className="text-slate-600 dark:text-slate-300">
              Abre el mensaje en tu <strong>Apple Watch</strong> y pulsa sobre el enlace.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
              3
            </span>
            <p className="text-slate-600 dark:text-slate-300">
              ¡Listo! Se abrirá la vista oscura OLED con tus paradas y minutos en grande.
            </p>
          </div>
        </div>

        {/* URL Box */}
        <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <input
            type="text"
            readOnly
            value={watchUrl}
            aria-label="Enlace para Apple Watch"
            className="bg-transparent border-none text-xs font-mono text-slate-800 dark:text-slate-200 flex-1 px-2 focus:outline-none truncate"
          />
          <button
            type="button"
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-teal-600 hover:bg-teal-500 text-white'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLaunchWatchView();
            }}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <Watch className="w-4 h-4" />
            <span>Probar vista Apple Watch aquí</span>
          </button>
        </div>
      </div>
    </dialog>
  );
};
