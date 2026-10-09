import React, { useState } from 'react';
import { Bus, Star, AlertCircle, Compass, Route, Hash, Sun, Moon, MoreHorizontal, Watch } from 'lucide-react';
import type { Theme } from '../hooks/useTheme.ts';
import type { OnboardTrip } from '../types/onboard.ts';
import { MoreMenuModal } from './MoreMenuModal.tsx';

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

const HeaderBrand: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => (
  <button
    type="button"
    onClick={onGoHome}
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
);

interface HeaderRightControlsProps {
  activeTab: ActiveTab;
  alertsCount: number;
  vehiclesCount: number;
  theme: Theme;
  onToggleTheme: () => void;
  onTabChange: (tab: ActiveTab) => void;
  activeTrip?: OnboardTrip | null;
  onOpenOnboard?: () => void;
  onOpenWatchModal?: () => void;
}

const HeaderRightControls: React.FC<HeaderRightControlsProps> = ({
  activeTab,
  alertsCount,
  vehiclesCount,
  theme,
  onToggleTheme,
  onTabChange,
  activeTrip,
  onOpenOnboard,
  onOpenWatchModal,
}) => (
  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
);

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
            <HeaderBrand onGoHome={() => onTabChange('search')} />

            <DesktopNav
              activeTab={activeTab}
              alertsCount={alertsCount}
              onTabChange={onTabChange}
            />

            <HeaderRightControls
              activeTab={activeTab}
              alertsCount={alertsCount}
              vehiclesCount={vehiclesCount}
              theme={theme}
              onToggleTheme={onToggleTheme}
              onTabChange={onTabChange}
              activeTrip={activeTrip}
              onOpenOnboard={onOpenOnboard}
              onOpenWatchModal={onOpenWatchModal}
            />
          </div>
        </div>
      </header>

      <MobileNav
        activeTab={activeTab}
        alertsCount={alertsCount}
        onTabChange={onTabChange}
        onOpenMore={() => setIsMoreOpen(true)}
      />

      <MoreMenuModal
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        activeTab={activeTab}
        onTabChange={onTabChange}
        alertsCount={alertsCount}
        activeTrip={activeTrip}
        onOpenOnboard={onOpenOnboard}
        onOpenWatchModal={onOpenWatchModal}
      />
    </>
  );
};
