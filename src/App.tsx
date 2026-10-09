import React, { useState, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { AppTabContent } from './components/AppTabContent.tsx';
import { DestinationAlarmBanner } from './components/DestinationAlarmBanner.tsx';
import { SharedArrivalBanner } from './components/SharedArrivalBanner.tsx';
import { AppModals } from './components/AppModals.tsx';
import { WatchCompanionView } from './components/watch/WatchCompanionView.tsx';
import { useStops } from './hooks/useStops.ts';
import { useRoutes } from './hooks/useRoutes.ts';
import { useRealtime } from './hooks/useRealtime.ts';
import { useGeolocation } from './hooks/useGeolocation.ts';
import { useFavorites } from './hooks/useFavorites.ts';
import { useDestinationAlarm } from './hooks/useDestinationAlarm.ts';
import { useAlerts } from './hooks/useAlerts.ts';
import { useTheme } from './hooks/useTheme.ts';
import { useOnboardTrip } from './hooks/useOnboardTrip.ts';
import { useAppNavigation } from './hooks/useAppNavigation.ts';
import type { BusStop, StopArrival } from './types/bus.ts';

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isWatchMode, setIsWatchMode] = useState<boolean>(() => {
    try {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      return path.startsWith('/watch') || params.get('mode') === 'watch';
    } catch {
      return false;
    }
  });
  const [isWatchShareModalOpen, setIsWatchShareModalOpen] = useState(false);

  // Custom Hooks
  const { stops, stopMapByCode } = useStops();
  const { routes, routeMapById, fetchRouteDetail } = useRoutes();
  const { vehicles } = useRealtime();
  const { alerts } = useAlerts();
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

  // Geofencing Destination Alarm
  const {
    targetStop: alarmTargetStop,
    distanceMeters: alarmDistanceMeters,
    isTriggered: alarmIsTriggered,
    setAlarmForStop,
    cancelAlarm,
  } = useDestinationAlarm();

  // Modo A Bordo (Copiloto en viaje)
  const {
    trip: onboardTrip,
    metrics: onboardMetrics,
    isDashboardOpen: isOnboardDashboardOpen,
    setIsDashboardOpen: setIsOnboardDashboardOpen,
    isBellActive,
    startTrip,
    endTrip,
    setDestinationStop: setOnboardDestinationStop,
    advanceToNextStop,
    rewindToPrevStop,
    toggleMute: toggleOnboardMute,
    ringBell,
  } = useOnboardTrip(vehicles);

  const [onboardSetup, setOnboardSetup] = useState<{
    route: Parameters<typeof startTrip>[0]['route'];
    originStop: BusStop;
    vehicleId?: string | null;
  } | null>(null);

  const handleStartOnboardFromArrival = useCallback(
    (stop: BusStop, arr: StopArrival) => {
      const route = routeMapById.get(arr.routeShortName) || routeMapById.get(arr.routeShortName.toUpperCase());
      if (route) {
        setOnboardSetup({
          route,
          originStop: stop,
          vehicleId: arr.vehicleId,
        });
      }
    },
    [routeMapById]
  );

  const {
    activeTab,
    selectedStop,
    setSelectedStop,
    selectedRoute,
    setSelectedRoute,
    focusedVehicle,
    nearbyStops,
    popularLines,
    handleSelectStop,
    handleCloseStopModal,
    handleSelectRouteFromSearch,
    handleSelectRouteForMap,
    handleViewStopOnMap,
    handleLocateBus,
    handleTabChange,
  } = useAppNavigation({
    stops,
    routes,
    routeMapById,
    stopMapByCode,
    vehicles,
    fetchRouteDetail,
    getNearbyStops,
  });

  // Shared arrival URL payload (?share=1&line=...&stop=...&eta=...)
  const [sharedArrivalBanner, setSharedArrivalBanner] = useState<{ line: string; stop: string; eta: string } | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('share') === '1' && params.get('line') && params.get('stop')) {
        return {
          line: params.get('line') || '',
          stop: params.get('stop') || '',
          eta: params.get('eta') || '',
        };
      }
    } catch {
      // ignore
    }
    return null;
  });

  const handleOpenSharedStop = useCallback(() => {
    if (!sharedArrivalBanner) return;
    const s = stopMapByCode.get(sharedArrivalBanner.stop);
    if (s) {
      setSelectedStop(s);
    }
  }, [sharedArrivalBanner, stopMapByCode, setSelectedStop]);

  if (isWatchMode) {
    return (
      <WatchCompanionView
        stops={stops}
        stopMapByCode={stopMapByCode}
        favoriteStops={favoriteStops}
        userLat={userLat}
        userLon={userLon}
        onExitWatchMode={() => {
          setIsWatchMode(false);
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete('mode');
            const targetPath = url.pathname === '/watch' ? '/' : url.pathname;
            window.history.pushState({}, '', targetPath + (url.search ? url.search : ''));
          } catch {
            // ignore
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8 selection:bg-teal-500 selection:text-white transition-colors">
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        vehiclesCount={vehicles.length}
        alertsCount={alerts.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        activeTrip={onboardTrip}
        onOpenOnboard={() => setIsOnboardDashboardOpen(true)}
        onOpenWatchModal={() => setIsWatchShareModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">
        <DestinationAlarmBanner
          targetStop={alarmTargetStop}
          distanceMeters={alarmDistanceMeters}
          isTriggered={alarmIsTriggered}
          onCancel={cancelAlarm}
        />

        <SharedArrivalBanner
          info={sharedArrivalBanner}
          onOpenStop={handleOpenSharedStop}
          onClose={() => setSharedArrivalBanner(null)}
        />

        <AppTabContent
          activeTab={activeTab}
          stops={stops}
          routes={routes}
          vehicles={vehicles}
          popularLines={popularLines}
          nearbyStops={nearbyStops}
          userLat={userLat}
          userLon={userLon}
          loadingLocation={loadingLocation}
          locationError={locationError}
          selectedStop={selectedStop}
          selectedRoute={selectedRoute}
          theme={theme}
          favoriteStops={favoriteStops}
          favoriteLines={favoriteLines}
          stopMapByCode={stopMapByCode}
          routeMapById={routeMapById}
          isFavoriteStop={isFavoriteStop}
          onTabChange={handleTabChange}
          onRequestLocation={requestLocation}
          onSelectStop={handleSelectStop}
          onCloseStopModal={handleCloseStopModal}
          onSelectRouteFromSearch={handleSelectRouteFromSearch}
          onSelectRouteForMap={handleSelectRouteForMap}
          onToggleFavoriteStop={toggleFavoriteStop}
          onToggleFavoriteLine={toggleFavoriteLine}
          onSetAlarm={setAlarmForStop}
          onStartOnboard={handleStartOnboardFromArrival}
          onLocateBus={handleLocateBus}
          focusedVehicle={focusedVehicle}
          onClearRouteFilter={() => setSelectedRoute(null)}
        />
      </main>

      <AppModals
        activeTab={activeTab}
        selectedStop={selectedStop}
        onCloseStopModal={handleCloseStopModal}
        isFavoriteStop={isFavoriteStop}
        onToggleFavoriteStop={toggleFavoriteStop}
        onViewStopOnMap={handleViewStopOnMap}
        onSetAlarm={setAlarmForStop}
        onStartOnboardFromArrival={handleStartOnboardFromArrival}
        onLocateBus={handleLocateBus}
        userLat={userLat}
        userLon={userLon}
        onRequestLocation={requestLocation}
        onboardSetup={onboardSetup}
        onCloseOnboardSetup={() => setOnboardSetup(null)}
        onStartTrip={startTrip}
        onboardTrip={onboardTrip}
        onboardMetrics={onboardMetrics}
        isOnboardDashboardOpen={isOnboardDashboardOpen}
        onCloseOnboardDashboard={() => setIsOnboardDashboardOpen(false)}
        onEndTrip={endTrip}
        isBellActive={isBellActive}
        onRingBell={ringBell}
        onAdvanceStop={advanceToNextStop}
        onRewindStop={rewindToPrevStop}
        onToggleOnboardMute={toggleOnboardMute}
        onSetOnboardDestinationStop={setOnboardDestinationStop}
        onOpenOnboardDashboard={() => setIsOnboardDashboardOpen(true)}
        isWatchShareModalOpen={isWatchShareModalOpen}
        onCloseWatchShareModal={() => setIsWatchShareModalOpen(false)}
        onLaunchWatchView={() => {
          setIsWatchShareModalOpen(false);
          setIsWatchMode(true);
          try {
            const url = new URL(window.location.href);
            url.searchParams.set('mode', 'watch');
            window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
          } catch {
            // ignore
          }
        }}
      />
    </div>
  );
};
