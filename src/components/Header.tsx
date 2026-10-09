import React, { useState } from 'react';
import { Bus, Star, AlertCircle, Compass, Route, Hash, Sun, Moon, MoreHorizontal, X, ChevronRight, Watch } from 'lucide-react';
import type { Theme } from '../hooks/useTheme.ts';
import type { OnboardTrip } from '../types/onboard.ts';

export type ActiveTab = 'search' | 'routes' | 'lines' | 'map' | 'marquesina' | 'favorites' | 'alerts';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  vehiclesCount: number;
  alertsCount: number;
  theme: Theme;
  onToggleTheme: () => void;
  activeTrip?: OnboardTrip | null;
  onOpenOnboard?: () => void;
  onOpenWatchModal?: () => void;
}

interface NavItemDef {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DESKTOP_NAV_ITEMS: NavItemDef[] = [
  { id: 'routes', label: 'Cómo llegar', icon: Route },
  { id: 'lines', label: 'Líneas', icon: Bus },
  { id: 'map', label: 'Mapa', icon: Compass },
  { id: 'marquesina', label: 'Marquesina', icon: Hash },
  { id: 'favorites', label: 'Favoritos', icon: Star },
  { id: 'alerts', label: 'Avisos', icon: AlertCircle },
];

const MAIN_MOBILE_TABS = [
  { id: 'lines' as const, label: 'Líneas', icon: Bus },
  { id: 'routes' as const, label: 'Cómo llegar', icon: Route },
  { id: 'map' as const, label: 'Mapa', icon: Compass },
  { id: 'favorites' as const, label: 'Favoritos', icon: Star },
];

interface DesktopNavProps {
  activeTab: ActiveTab;
  alertsCount: number;
  onTabChange: (tab: ActiveTab) => void;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ activeTab, alertsCount, onTabChange }) => (
  <nav
    className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-755 shadow-inner shrink-0"
    aria-label="Menú principal de opciones"
  >
    {DESKTOP_NAV_ITEMS.map(item => {
      const Icon = item.icon;
      const isActive = activeTab === item.id;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onTabChange(item.id)}
          className={`flex items-center gap-1 lg:gap-1.5 px-1.5 md:max-xl:px-2 xl:px-3 py-1.5 rounded-xl text-xs md:max-lg:text-[11px] font-bold transition-colors cursor-pointer relative shrink-0 ${
            isActive
              ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/80'
          }`}
          title={item.label}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" />
          <span>{item.label}</span>
          {item.id === 'alerts' && alertsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5 animate-pulse" />
          )}
        </button>
      );
    })}
  </nav>
);

interface MobileNavProps {
  activeTab: ActiveTab;
  alertsCount: number;
  onTabChange: (tab: ActiveTab) => void;
  onOpenMore: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, alertsCount, onTabChange, onOpenMore }) => {
  const isSubTabActive = activeTab === 'marquesina' || activeTab === 'alerts';

  // Dynamic label & icon for 5th tab
  const FifthIcon = activeTab === 'marquesina' ? Hash : activeTab === 'alerts' ? AlertCircle : MoreHorizontal;
  const fifthLabel = activeTab === 'marquesina' ? 'Marques.' : activeTab === 'alerts' ? 'Avisos' : 'Más';

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800/80 px-2 pt-1 pb-[max(0.6rem,env(safe-area-inset-bottom,0px))] flex items-center justify-between"
      aria-label="Navegación móvil"
    >
      {MAIN_MOBILE_TABS.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`flex-1 min-w-0 max-w-[20%] flex flex-col items-center justify-center py-1 px-0.5 rounded-xl text-[10px] sm:text-[11px] font-medium transition-colors ${
              isActive
                ? 'text-teal-600 dark:text-teal-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="truncate max-w-[60px] text-center tracking-tight leading-none mt-1">
              {item.label}
            </span>
          </button>
        );
      })}

      {/* 5th Tab: "Más" / Subtab */}
      <button
        type="button"
        onClick={onOpenMore}
        className={`flex-1 min-w-0 max-w-[20%] flex flex-col items-center justify-center py-1 px-0.5 rounded-xl text-[10px] sm:text-[11px] font-medium transition-colors relative ${
          isSubTabActive
            ? 'text-teal-600 dark:text-teal-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <FifthIcon className="w-5 h-5 shrink-0" />
          {alertsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5 animate-pulse" />
          )}
        </div>
        <span className="truncate max-w-[60px] text-center tracking-tight leading-none mt-1">
          {fifthLabel}
        </span>
      </button>
    </nav>
  );
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  vehiclesCount,
  alertsCount,
  theme,
  onToggleTheme,
  activeTrip,
  onOpenOnboard,
  onOpenWatchModal,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-1 sm:gap-2">
            {/* Logo and Brand */}
            <button
              type="button"
              onClick={() => onTabChange('search')}
              className="flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg p-1 -ml-1 transition-transform active:scale-95 shrink-0"
              aria-label="Ir a inicio de VallaBus"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
                <Bus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                    Valla<span className="text-teal-600 dark:text-teal-400">Bus</span>
                  </span>
                  <span className="bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-500/30 uppercase tracking-wider hidden lg:inline-flex">
                    AUVASA RT
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden 2xl:block truncate">
                  Red de Autobuses de Valladolid
                </p>
              </div>
            </button>

            {/* Desktop Navigation Menu (Opciones) */}
            <DesktopNav
              activeTab={activeTab}
              alertsCount={alertsCount}
              onTabChange={onTabChange}
            />

            {/* Right Controls: Theme Toggle & Live Indicator Pill */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Active Trip Onboard Pill */}
              {activeTrip && onOpenOnboard && (
                <button
                  type="button"
                  onClick={onOpenOnboard}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-transform active:scale-95 cursor-pointer shrink-0 animate-pulse"
                  title="Abrir Copiloto A Bordo"
                >
                  <Bus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">A Bordo: L{activeTrip.route.shortName}</span>
                  <span className="sm:hidden">L{activeTrip.route.shortName}</span>
                </button>
              )}

              {/* Quick Alerts Button (shown on mobile, hidden on desktop where Avisos is already in DesktopNav) */}
              <button
                type="button"
                onClick={() => onTabChange('alerts')}
                className={`p-2 rounded-xl transition-colors cursor-pointer shadow-sm md:hidden flex items-center justify-center shrink-0 relative ${
                  activeTab === 'alerts'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80'
                }`}
                aria-label="Ver avisos e incidencias"
                title="Avisos e incidencias de tráfico"
              >
                <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                {alertsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5 animate-pulse" />
                )}
              </button>

              {/* Apple Watch Mode Button */}
              {onOpenWatchModal && (
                <button
                  type="button"
                  onClick={onOpenWatchModal}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                  aria-label="Apple Watch Companion"
                  title="Apple Watch Companion"
                >
                  <Watch className="w-4 h-4" />
                </button>
              )}

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-750 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>

              {/* Realtime Buses Pill */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 px-2 sm:px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 shadow-inner shrink-0">
                <span className="relative flex h-2 w-2 xl:h-2.5 xl:w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 xl:h-2.5 xl:w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold">
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{vehiclesCount}</strong>{' '}
                  <span className="hidden xl:inline font-normal">buses en tiempo real</span>
                  <span className="hidden lg:inline xl:hidden font-normal">buses</span>
                  <span className="md:max-lg:hidden sm:inline lg:hidden font-normal">en ruta</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (5 Clean Tabs) - Sibling to avoid backdrop-blur fixed bug */}
      <MobileNav
        activeTab={activeTab}
        alertsCount={alertsCount}
        onTabChange={onTabChange}
        onOpenMore={() => setIsMoreOpen(true)}
      />

      {/* iOS Style "Más Opciones" Bottom Sheet Modal - Sibling to avoid backdrop-blur fixed bug */}
      {isMoreOpen && (
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
            onClick={() => setIsMoreOpen(false)}
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
                onClick={() => setIsMoreOpen(false)}
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
                    setIsMoreOpen(false);
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
                  setIsMoreOpen(false);
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
                  setIsMoreOpen(false);
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
                  setIsMoreOpen(false);
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
                    setIsMoreOpen(false);
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
      )}
    </>
  );
};
