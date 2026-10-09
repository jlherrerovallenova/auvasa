import React from 'react';
import type { ActiveTab } from './Header.tsx';
import { HomeSearchView } from './HomeSearchView.tsx';
import { RoutePlanner } from './RoutePlanner.tsx';
import { LinesExplorerTab } from './LinesExplorerTab.tsx';
import { MapViewTab } from './MapViewTab.tsx';
import { MarquesinaDial } from './MarquesinaDial.tsx';
import { FavoritesView } from './FavoritesView.tsx';
import { AlertsView } from './AlertsView.tsx';
import type { BusStop, BusRoute, StopArrival, LiveVehicle } from '../types/bus.ts';

interface AppTabContentProps {
  activeTab: ActiveTab;
  stops: BusStop[];
  routes: BusRoute[];
  vehicles: LiveVehicle[];
  popularLines: BusRoute[];
  nearbyStops: BusStop[];
  userLat: number | null;
  userLon: number | null;
  loadingLocation: boolean;
  locationError: string | null;
  selectedStop: BusStop | null;
  selectedRoute: BusRoute | null;
  theme: 'light' | 'dark';
  favoriteStops: string[];
  favoriteLines: string[];
  stopMapByCode: Map<string, BusStop>;
  routeMapById: Map<string, BusRoute>;
  isFavoriteStop: (code: string) => boolean;
  onTabChange: (tab: ActiveTab) => void;
  onRequestLocation: () => void;
  onSelectStop: (stop: BusStop) => void;
  onCloseStopModal: () => void;
  onSelectRouteFromSearch: (route: BusRoute) => void;
  onSelectRouteForMap: (route: BusRoute) => void;
  onToggleFavoriteStop: (code: string) => void;
  onToggleFavoriteLine: (id: string) => void;
  onSetAlarm: (stop: BusStop) => void;
  onShareArrival: (stop: BusStop, arr: StopArrival) => void;
  onStartOnboard: (stop: BusStop, arr: StopArrival) => void;
  onLocateBus?: (arr: StopArrival) => void;
  focusedVehicle?: LiveVehicle | null;
  onClearRouteFilter: () => void;
}

export const AppTabContent: React.FC<AppTabContentProps> = ({
  activeTab,
  stops,
  routes,
  vehicles,
  popularLines,
  nearbyStops,
  userLat,
  userLon,
  loadingLocation,
  locationError,
  selectedStop,
  selectedRoute,
  theme,
  favoriteStops,
  favoriteLines,
  stopMapByCode,
  routeMapById,
  isFavoriteStop,
  onTabChange,
  onRequestLocation,
  onSelectStop,
  onCloseStopModal,
  onSelectRouteFromSearch,
  onSelectRouteForMap,
  onToggleFavoriteStop,
  onToggleFavoriteLine,
  onSetAlarm,
  onShareArrival,
  onStartOnboard,
  onLocateBus,
  focusedVehicle,
  onClearRouteFilter,
}) => {
  switch (activeTab) {
    case 'search':
      return (
        <HomeSearchView
          stops={stops}
          routes={routes}
          vehiclesCount={vehicles.length}
          popularLines={popularLines}
          nearbyStops={nearbyStops}
          hasLocation={userLat !== null && userLon !== null}
          loadingLocation={loadingLocation}
          locationError={locationError}
          onRequestLocation={onRequestLocation}
          onSelectStop={onSelectStop}
          onSelectRouteFromSearch={onSelectRouteFromSearch}
          onOpenMap={() => onTabChange('map')}
          onNavigateTab={onTabChange}
        />
      );

    case 'routes':
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <RoutePlanner
            stops={stops}
            routes={routes}
            vehicles={vehicles}
            userLat={userLat}
            userLon={userLon}
            onRequestLocation={onRequestLocation}
            onSelectStop={onSelectStop}
            onSelectRoute={onSelectRouteFromSearch}
          />
        </div>
      );

    case 'lines':
      return (
        <LinesExplorerTab
          stops={stops}
          routes={routes}
          vehicles={vehicles}
          stopsMapByCode={stopMapByCode}
          onSelectStop={onSelectStop}
          onSelectRouteFromSearch={onSelectRouteFromSearch}
          onSelectRouteForMap={onSelectRouteForMap}
        />
      );

    case 'map':
      return (
        <MapViewTab
          stops={stops}
          routes={routes}
          vehicles={vehicles}
          selectedStop={selectedStop}
          selectedRoute={selectedRoute}
          userLat={userLat}
          userLon={userLon}
          focusedVehicle={focusedVehicle}
          theme={theme}
          onSelectStop={onSelectStop}
          onCloseStop={onCloseStopModal}
          isFavoriteStop={isFavoriteStop}
          onToggleFavoriteStop={onToggleFavoriteStop}
          onSetAlarm={onSetAlarm}
          onShareArrival={onShareArrival}
          onStartOnboard={onStartOnboard}
          onLocateBus={onLocateBus}
          onRequestLocation={onRequestLocation}
          onClearRouteFilter={onClearRouteFilter}
        />
      );

    case 'marquesina':
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <MarquesinaDial
            stops={stops}
            onSelectStop={onSelectStop}
          />
        </div>
      );

    case 'favorites':
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Tus Favoritos</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Acceso directo a tus paradas y líneas guardadas.
            </p>
          </div>

          <FavoritesView
            favoriteStops={favoriteStops}
            favoriteLines={favoriteLines}
            stopsMapByCode={stopMapByCode}
            routeMapById={routeMapById}
            onSelectStop={onSelectStop}
            onSelectRoute={onSelectRouteFromSearch}
            onToggleFavoriteStop={onToggleFavoriteStop}
            onToggleFavoriteLine={onToggleFavoriteLine}
          />
        </div>
      );

    case 'alerts':
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <AlertsView />
        </div>
      );

    default:
      return null;
  }
};
