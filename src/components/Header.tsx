import React from 'react';
import { Bus, Star, AlertCircle, Compass, Search, Route, Hash } from 'lucide-react';

export type ActiveTab = 'search' | 'routes' | 'lines' | 'map' | 'marquesina' | 'favorites' | 'alerts';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  vehiclesCount: number;
  alertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  vehiclesCount,
  alertsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 transition-colors">
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
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Valla<span className="text-teal-400">Bus</span>
                </span>
                <span className="bg-teal-950/80 text-teal-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-teal-500/30 uppercase tracking-wider">
                  AUVASA RT
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Red de Autobuses de Valladolid
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Navegación principal">
            <button
              type="button"
              onClick={() => onTabChange('search')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Buscador
            </button>

            <button
              type="button"
              onClick={() => onTabChange('routes')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'routes'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              Rutas A-B
            </button>

            <button
              type="button"
              onClick={() => onTabChange('lines')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'lines'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              Líneas
            </button>

            <button
              type="button"
              onClick={() => onTabChange('map')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Mapa en Vivo
            </button>

            <button
              type="button"
              onClick={() => onTabChange('marquesina')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'marquesina'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              Marquesina
            </button>

            <button
              type="button"
              onClick={() => onTabChange('favorites')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'favorites'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              Favoritos
            </button>

            <button
              type="button"
              onClick={() => onTabChange('alerts')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer relative ${
                activeTab === 'alerts'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Avisos
              {alertsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5" />
              )}
            </button>
          </nav>

          {/* Real-time Indicator Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span>
                <strong className="text-emerald-400">{vehiclesCount}</strong>{' '}
                <span className="hidden sm:inline">buses en tiempo real</span>
                <span className="sm:hidden">en ruta</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 px-1 py-1 flex justify-around items-center"
        aria-label="Navegación móvil"
      >
        <button
          type="button"
          onClick={() => onTabChange('search')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-[11px] font-medium transition-colors ${
            activeTab === 'search' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Buscar</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('routes')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-[11px] font-medium transition-colors ${
            activeTab === 'routes' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Route className="w-4 h-4" />
          <span>Rutas</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('lines')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-[11px] font-medium transition-colors ${
            activeTab === 'lines' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bus className="w-4 h-4" />
          <span>Líneas</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('map')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-[11px] font-medium transition-colors ${
            activeTab === 'map' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Mapa</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('marquesina')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-[11px] font-medium transition-colors ${
            activeTab === 'marquesina' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Marquesina</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('favorites')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-[11px] font-medium transition-colors ${
            activeTab === 'favorites' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Favoritos</span>
        </button>
      </nav>
    </header>
  );
};
