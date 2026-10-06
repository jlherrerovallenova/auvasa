import React from 'react';
import { Bus, Star, AlertCircle, Compass, Search, Route, Hash, Sun, Moon } from 'lucide-react';
import type { Theme } from '../hooks/useTheme.ts';

export type ActiveTab = 'search' | 'routes' | 'lines' | 'map' | 'marquesina' | 'favorites' | 'alerts';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  vehiclesCount: number;
  alertsCount: number;
  theme: Theme;
  onToggleTheme: () => void;
}

interface NavItemDef {
  id: ActiveTab;
  label: string;
  mobileLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  showOnMobile: boolean;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'search', label: 'Buscador', mobileLabel: 'Buscar', icon: Search, showOnMobile: true },
  { id: 'routes', label: 'Rutas A-B', mobileLabel: 'Rutas', icon: Route, showOnMobile: true },
  { id: 'lines', label: 'Líneas', mobileLabel: 'Líneas', icon: Bus, showOnMobile: true },
  { id: 'map', label: 'Mapa en Vivo', mobileLabel: 'Mapa', icon: Compass, showOnMobile: true },
  { id: 'marquesina', label: 'Marquesina', mobileLabel: 'Marquesina', icon: Hash, showOnMobile: true },
  { id: 'favorites', label: 'Favoritos', mobileLabel: 'Favoritos', icon: Star, showOnMobile: true },
  { id: 'alerts', label: 'Avisos', mobileLabel: 'Avisos', icon: AlertCircle, showOnMobile: false },
];

interface DesktopNavProps {
  activeTab: ActiveTab;
  alertsCount: number;
  onTabChange: (tab: ActiveTab) => void;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ activeTab, alertsCount, onTabChange }) => (
  <nav className="hidden lg:flex items-center gap-1" aria-label="Navegación principal">
    {NAV_ITEMS.map(item => {
      const Icon = item.icon;
      const isActive = activeTab === item.id;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onTabChange(item.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer relative ${
            isActive
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{item.label}</span>
          {item.id === 'alerts' && alertsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5" />
          )}
        </button>
      );
    })}
  </nav>
);

interface MobileNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => (
  <nav
    className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800/80 px-1 py-1 flex justify-around items-center"
    aria-label="Navegación móvil"
  >
    {NAV_ITEMS.filter(item => item.showOnMobile).map(item => {
      const Icon = item.icon;
      const isActive = activeTab === item.id;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onTabChange(item.id)}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-[11px] font-medium transition-colors ${
            isActive
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span>{item.mobileLabel}</span>
        </button>
      );
    })}
  </nav>
);

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  vehiclesCount,
  alertsCount,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <button
            type="button"
            onClick={() => onTabChange('search')}
            className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg p-1 -ml-1 transition-transform active:scale-95"
            aria-label="Ir a inicio de VallaBus"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  Valla<span className="text-teal-600 dark:text-teal-400">Bus</span>
                </span>
                <span className="bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-500/30 uppercase tracking-wider">
                  AUVASA RT
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Red de Autobuses de Valladolid
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <DesktopNav
            activeTab={activeTab}
            alertsCount={alertsCount}
            onTabChange={onTabChange}
          />

          {/* Right Controls: Theme Toggle & Live Indicator Pill */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-750 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer shadow-sm flex items-center justify-center"
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span>
                <strong className="text-emerald-600 dark:text-emerald-400">{vehiclesCount}</strong>{' '}
                <span className="hidden sm:inline">buses en tiempo real</span>
                <span className="sm:hidden">en ruta</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={onTabChange} />
    </header>
  );
};
