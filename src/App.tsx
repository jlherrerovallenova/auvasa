import React, { useState, useMemo, useCallback } from 'react';
import { Header, type ActiveTab } from './components/Header.tsx';
import { SearchBar } from './components/SearchBar.tsx';
import { LiveMap } from './components/LiveMap.tsx';
import { StopArrivalsModal } from './components/StopArrivalsModal.tsx';
import { LinesList } from './components/LinesList.tsx';
import { NearbyStops } from './components/NearbyStops.tsx';
import { FavoritesView } from './components/FavoritesView.tsx';
import { AlertsView } from './components/AlertsView.tsx';
import { useStops } from './hooks/useStops.ts';
import { useRoutes } from './hooks/useRoutes.ts';
import { useRealtime } from './hooks/useRealtime.ts';
import { useGeolocation } from './hooks/useGeolocation.ts';
import { useFavorites } from './hooks/useFavorites.ts';
import type { BusStop, BusRoute } from './types/bus.ts';
import { Radio, Sparkles, Map, Compass } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('search');
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);

  // Custom Hooks
  const { stops, stopMapByCode } = useStops();
  const { routes, routeMapById, fetchRouteDetail } = useRoutes();
  const { vehicles } = useRealtime();
  const {
    lat: userLat,
    lon: userLon,
    loading: loadingLocation,
    error: locationError,
    requestLocation,
    getNearbyStops,
  } = useGeolocation();

  const {
    favoriteStops,
    favoriteLines,
    toggleFavoriteStop,
    toggleFavoriteLine,
    isFavoriteStop,
  } = useFavorites();

  const nearbyStops = useMemo(() => {
    return getNearbyStops(stops, 1500, 6);
  }, [getNearbyStops, stops]);

  const handleSelectStop = useCallback((stop: BusStop) => {
    setSelectedStop(stop);
  }, []);

  const handleCloseStopModal = useCallback(() => {
    setSelectedStop(null);
  }, []);

  const handleSelectRouteFromSearch = useCallback(async (route: BusRoute) => {
    const detailed = await fetchRouteDetail(route.id);
    setSelectedRoute(detailed || route);
    setActiveTab('lines');
  }, [fetchRouteDetail]);

  const handleSelectRouteForMap = useCallback(async (route: BusRoute) => {
    const detailed = await fetchRouteDetail(route.id);
    setSelectedRoute(detailed || route);
    setActiveTab('map');
  }, [fetchRouteDetail]);

  const handleViewStopOnMap = useCallback((stop: BusStop) => {
    setSelectedStop(stop);
    setActiveTab('map');
  }, []);

  // Quick popular lines for Valladolid
  const popularLines = useMemo(() => {
    const popularKeys = ['1', '2', 'C1', 'C2', '8', 'B1'];
    return routes.filter(r => popularKeys.includes(r.shortName)).slice(0, 6);
  }, [routes]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20 md:pb-8 selection:bg-teal-500 selection:text-white">
      {/* Top Navbar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        vehiclesCount={vehicles.length}
        alertsCount={0}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Tab 1: Search & Home */}
        {activeTab === 'search' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Hero Banner */}
            <div className="text-center max-w-2xl mx-auto pt-2 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tiempo Real Infalible • Valladolid AUVASA</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Control Total de tu <span className="text-teal-400">Autobús</span>
              </h1>
              <p className="text-sm md:text-base text-slate-400 mt-2.5">
                Localización GPS satelital en directo, horarios exactos y búsqueda ultrarrápida sin esperas ni errores.
              </p>

              {/* Universal Instant Search Bar */}
              <div className="mt-6">
                <SearchBar
                  stops={stops}
                  routes={routes}
                  onSelectStop={handleSelectStop}
                  onSelectRoute={handleSelectRouteFromSearch}
                />
              </div>

              {/* Quick Popular Lines Pills */}
              {popularLines.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  <span className="text-xs text-slate-500 font-semibold mr-1">Líneas rápidas:</span>
                  {popularLines.map(line => (
                    <button
                      key={line.id}
                      type="button"
                      onClick={() => handleSelectRouteFromSearch(line)}
                      className="px-2.5 py-1 rounded-lg font-black text-xs transition-transform hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                      style={{ backgroundColor: line.color, color: line.textColor }}
                    >
                      {line.shortName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nearby Stops Section */}
            <NearbyStops
              nearbyStops={nearbyStops}
              hasLocation={userLat !== null && userLon !== null}
              loadingLocation={loadingLocation}
              locationError={locationError}
              onRequestLocation={requestLocation}
              onSelectStop={handleSelectStop}
            />

            {/* Quick Map Preview Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 uppercase tracking-wider">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Mapa Interactivo Satelital
                </div>
                <h3 className="text-xl font-bold text-white">
                  Mira {vehicles.length} autobuses moviéndose por Valladolid
                </h3>
                <p className="text-sm text-slate-400 max-w-lg">
                  Consulta el mapa completo con las 54 líneas, sentidos de recorrido, paradas y la posición exacta de cada autobús con su matrícula y velocidad en directo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-bold px-6 py-3.5 rounded-2xl transition-transform shadow-lg shadow-teal-700/30 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Compass className="w-5 h-5" />
                <span>Abrir Mapa en Directo</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Lines Explorer */}
        {activeTab === 'lines' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Líneas de Autobús de Valladolid
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Red completa de AUVASA: recorridos, sentidos, paradas y buses en tiempo real.
                </p>
              </div>

              <div className="w-full md:w-80">
                <SearchBar
                  stops={stops}
                  routes={routes}
                  onSelectStop={handleSelectStop}
                  onSelectRoute={handleSelectRouteFromSearch}
                />
              </div>
            </div>

            <LinesList
              routes={routes}
              vehicles={vehicles}
              onSelectRouteForMap={handleSelectRouteForMap}
              onSelectStop={handleSelectStop}
              stopsMapByCode={stopMapByCode}
            />
          </div>
        )}

        {/* Tab 3: Fullscreen Live Map */}
        {activeTab === 'map' && (
          <div className="h-[calc(100vh-140px)] flex flex-col space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-teal-400" />
                <h2 className="text-lg font-bold text-white">Mapa en Tiempo Real</h2>
                <span className="text-xs text-slate-400">• {vehicles.length} buses en ruta</span>
              </div>

              {selectedRoute && (
                <button
                  type="button"
                  onClick={() => setSelectedRoute(null)}
                  className="text-xs text-teal-400 hover:text-teal-300 font-bold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Quitar filtro de línea ({selectedRoute.shortName})
                </button>
              )}
            </div>

            <LiveMap
              stops={stops}
              routes={routes}
              vehicles={vehicles}
              selectedStop={selectedStop}
              selectedRoute={selectedRoute}
              userLat={userLat}
              userLon={userLon}
              onSelectStop={handleSelectStop}
              onRequestLocation={requestLocation}
            />
          </div>
        )}

        {/* Tab 4: Favorites */}
        {activeTab === 'favorites' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="pb-2 border-b border-slate-800">
              <h2 className="text-2xl font-black text-white tracking-tight">Tus Favoritos</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Acceso directo a tus paradas y líneas guardadas.
              </p>
            </div>

            <FavoritesView
              favoriteStops={favoriteStops}
              favoriteLines={favoriteLines}
              stopsMapByCode={stopMapByCode}
              routeMapById={routeMapById}
              onSelectStop={handleSelectStop}
              onSelectRoute={handleSelectRouteFromSearch}
              onToggleFavoriteStop={toggleFavoriteStop}
              onToggleFavoriteLine={toggleFavoriteLine}
            />
          </div>
        )}

        {/* Tab 5: Alerts & Disruptions */}
        {activeTab === 'alerts' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <AlertsView />
          </div>
        )}
      </main>

      {/* Stop Arrivals Modal */}
      <StopArrivalsModal
        stop={selectedStop}
        onClose={handleCloseStopModal}
        isFavorite={selectedStop ? isFavoriteStop(selectedStop.code) : false}
        onToggleFavorite={toggleFavoriteStop}
        onViewOnMap={handleViewStopOnMap}
      />
    </div>
  );
};
