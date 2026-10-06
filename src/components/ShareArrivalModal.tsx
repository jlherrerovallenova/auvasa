import React, { useState } from 'react';
import { Share2, MessageCircle, Copy, Check, X } from 'lucide-react';
import type { BusStop, StopArrival } from '../types/bus.ts';

interface ShareArrivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  stop: BusStop;
  arrival: StopArrival;
}

export const ShareArrivalModal: React.FC<ShareArrivalModalProps> = ({
  isOpen,
  onClose,
  stop,
  arrival,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `¡Hola! Voy en el bus de la Línea ${arrival.routeShortName} hacia ${arrival.destination || stop.name} (AUVASA Valladolid). Llego aproximadamente en ${arrival.minutesRemaining} min (${arrival.exactTime}).`;
  const shareUrl = `${window.location.origin}/?share=1&line=${arrival.routeShortName}&stop=${stop.code}&eta=${arrival.minutesRemaining}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleWhatsApp = () => {
    const fullMsg = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${fullMsg}`, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `VallaBus — Voy en camino en la Línea ${arrival.routeShortName}`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <dialog
      open
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 m-0 p-0 w-full h-full max-w-none max-h-none bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center border-none text-slate-800 dark:text-slate-100"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="share-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Compartir &ldquo;Voy en Camino&rdquo;
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Envía tu tiempo estimado a amigos o familia</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar modal de compartir"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Card */}
        <div className="my-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-left space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded-lg text-xs font-black"
              style={{ backgroundColor: arrival.routeColor, color: arrival.routeTextColor }}
            >
              Línea {arrival.routeShortName}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              • Llego en {arrival.minutesRemaining} min ({arrival.exactTime})
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Destino / Parada: <strong className="text-slate-900 dark:text-white">{stop.name}</strong>
          </p>
          {arrival.licensePlate && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Matrícula bus: {arrival.licensePlate}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-2xl transition-colors shadow-lg shadow-emerald-900/30 cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Compartir por WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-teal-700 dark:text-teal-300 font-semibold py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir enlace nativo</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium py-2.5 px-4 rounded-2xl transition-colors cursor-pointer text-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado al portapapeles!' : 'Copiar texto y enlace'}</span>
          </button>
        </div>
      </div>
    </dialog>
  );
};
