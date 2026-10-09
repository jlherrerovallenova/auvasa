import React from 'react';
import { Bus, Route, Hash, AlertCircle, Watch, X, ChevronRight } from 'lucide-react';
import type { ActiveTab } from './Header.tsx';
import type { OnboardTrip } from '../types/onboard.ts';

export interface MoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  alertsCount: number;
  activeTrip?: OnboardTrip | null;
  onOpenOnboard?: () => void;
  onOpenWatchModal?: () => void;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  alertsCount,
  activeTrip,
  onOpenOnboard,
  onOpenWatchModal,
}) => {
  if (!isOpen) return null;

  return (
    <dialog
      open
      aria-labelledby="more-menu-title"
      className="fixed inset-0 z-50 m-0 p-0 w-full h-full h-[100dvh] max-w-none max-h-none bg-black/60 dark:bg-black/75 backdrop-blur-sm flex flex-col justify-end items-center border-none overflow-hidden text-slate-800 dark:text-slate-100"
    >
      {/* Accessible Backdrop Button (fills upper space, closes on tap) */}
      <button
        type="button"
        aria-label="Cerrar modal"
        className="w-full flex-1 cursor-default border-none p-0 bg-transparent shrink-0"
        onClick={onClose}
      />

      <div className="relative z-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl w-full max-w-lg p-5 shadow-2xl flex flex-col space-y-4 max-h-[85dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] shrink-0 animate-in slide-in-from-bottom duration-200 text-slate-800 dark:text-slate-100">
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-1 shrink-0" />

        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 id="more-menu-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Más Opciones
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Herramientas y servicios de VallaBus
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {/* Copiloto A Bordo (Si hay viaje en curso) */}
          {activeTrip && onOpenOnboard && (
            <button
              type="button"
              onClick={() => {
                onOpenOnboard();
                onClose();
              }}
              className="w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer bg-teal-50 dark:bg-teal-950/60 border-teal-500/80 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow">
                  <Bus className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Copiloto A Bordo (En viaje)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Viaje activo en Línea {activeTrip.route.shortName} • Toca para abrir</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-teal-600 shrink-0" />
            </button>
          )}

          {/* 1. Rutas A-B */}
          <button
            type="button"
            onClick={() => {
              onTabChange('routes');
              onClose();
            }}
            className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
              activeTab === 'routes'
                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500/80 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Route className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Rutas A-B</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Planificador con transbordos y tiempos en directo</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
          </button>

          {/* 2. Marquesina Rápida */}
          <button
            type="button"
            onClick={() => {
              onTabChange('marquesina');
              onClose();
            }}
            className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
              activeTab === 'marquesina'
                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500/80 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Marquesina / Poste</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Teclado numérico táctil de una mano para paradas</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
          </button>

          {/* 3. Avisos e Incidencias */}
          <button
            type="button"
            onClick={() => {
              onTabChange('alerts');
              onClose();
            }}
            className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer relative ${
              activeTab === 'alerts'
                ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500/80 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Avisos e Incidencias</h4>
                  {alertsCount > 0 && (
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {alertsCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cortes de tráfico, desvíos y alteraciones AUVASA</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
          </button>

          {/* 4. Apple Watch */}
          {onOpenWatchModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWatchModal();
              }}
              className="w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Watch className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Apple Watch ⌚</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Modo ultraligero OLED para la muñeca</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
};
