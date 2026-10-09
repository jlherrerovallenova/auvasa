import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Header, type ActiveTab } from './components/Header.tsx';
import { AppTabContent } from './components/AppTabContent.tsx';
import { DestinationAlarmBanner } from './components/DestinationAlarmBanner.tsx';
import { SharedArrivalBanner } from './components/SharedArrivalBanner.tsx';
import { StopArrivalsModal } from './components/StopArrivalsModal.tsx';
import { ShareArrivalModal } from './components/ShareArrivalModal.tsx';
import { OnboardSetupModal } from './components/onboard/OnboardSetupModal.tsx';
import { OnboardDashboardModal } from './components/onboard/OnboardDashboardModal.tsx';
import { OnboardMiniBar } from './components/onboard/OnboardMiniBar.tsx';
import { useStops } from './hooks/useStops.ts';
import { useRoutes } from './hooks/useRoutes.ts';
import { useRealtime } from './hooks/useRealtime.ts';
import { useGeolocation } from './hooks/useGeolocation.ts';
import { useFavorites } from './hooks/useFavorites.ts';
import { useDestinationAlarm } from './hooks/useDestinationAlarm.ts';
import { useAlerts } from './hooks/useAlerts.ts';
import { useTheme } from './hooks/useTheme.ts';
import { useOnboardTrip } from './hooks/useOnboardTrip.ts';
import type { BusStop, BusRoute, StopArrival, LiveVehicle } from './types/bus.ts';

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab') as ActiveTab;
      if (t && ['search', 'routes', 'lines', 'map', 'marquesina', 'favorites', 'alerts'].includes(t)) {
        return t;
      }
    } catch {
      // ignore
    }
    return 'search';
  });
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);
  const [focusedVehicle, setFocusedVehicle] = useState<LiveVehicle | null>(null);

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

  // Live ETA Sharing Modal
  const [sharingData, setSharingData] = useState<{ stop: BusStop; arrival: StopArrival } | null>(null);

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
    route: BusRoute;
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
  }, [sharedArrivalBanner, stopMapByCode]);

  // Support ?stop=CODE URL parameter (e.g. ?tab=map&stop=1002)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const stopCode = params.get('stop');
      if (stopCode && stopMapByCode.size > 0 && !selectedStop) {
        const s = stopMapByCode.get(stopCode);
        if (s) {
          setSelectedStop(s);
        }
      }
    } catch {
      // ignore
    }
  }, [stopMapByCode, selectedStop]);

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

  const handleLocateBus = useCallback(
    (arr: StopArrival) => {
      // 1. Try to find the exact live GPS vehicle
      let found = vehicles.find(
        v => arr.vehicleId && (v.vehicleId === arr.vehicleId || v.id === arr.vehicleId)
      );

      // 2. Fallback: find any live vehicle active on this line
      if (!found && arr.routeShortName) {
        const lineBuses = vehicles.filter(
          v => v.lineName.toUpperCase() === arr.routeShortName.toUpperCase() || v.routeId === arr.routeShortName
        );
        if (lineBuses.length > 0) {
          found = lineBuses[0];
        }
      }

      if (found && found.lat && found.lon) {
        setFocusedVehicle(found);
        setActiveTab('map');
      } else {
        // Scheduled bus without active GPS yet: highlight line route on map
        const route =
          routeMapById.get(arr.routeShortName) ||
          routes.find(r => r.shortName.toUpperCase() === arr.routeShortName.toUpperCase());
        if (route) {
          handleSelectRouteForMap(route);
        } else {
          setActiveTab('map');
        }
      }
    },
    [vehicles, routes, routeMapById, handleSelectRouteForMap]
  );

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Quick popular lines for Valladolid
  const popularLines = useMemo(() => {
    const popularKeys = ['1', '2', '7', '9', '18', '19'];
    return popularKeys
      .map(key => routes.find(r => r.shortName === key))
      .filter((r): r is BusRoute => Boolean(r));
  }, [routes]);

  return (
    <div className="min-h-[100dvh] bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8 selection:bg-teal-500 selection:text-white transition-colors">
      {/* Top Navbar */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        vehiclesCount={vehicles.length}
        alertsCount={alerts.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        activeTrip={onboardTrip}
        onOpenOnboard={() => setIsOnboardDashboardOpen(true)}
      />

      {/* Main Content Area */}
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
          onShareArrival={(stop, arrival) => setSharingData({ stop, arrival })}
          onStartOnboard={handleStartOnboardFromArrival}
          onLocateBus={handleLocateBus}
          focusedVehicle={focusedVehicle}
          onClearRouteFilter={() => setSelectedRoute(null)}
        />
      </main>

      {/* Stop Arrivals Modal (Shown when outside map tab; in map tab, the in-map card is used) */}
      <StopArrivalsModal
        stop={activeTab !== 'map' ? selectedStop : null}
        onClose={handleCloseStopModal}
        isFavorite={selectedStop ? isFavoriteStop(selectedStop.code) : false}
        onToggleFavorite={toggleFavoriteStop}
        onViewOnMap={handleViewStopOnMap}
        onSetAlarm={setAlarmForStop}
        onShareArrival={(stop, arrival) => setSharingData({ stop, arrival })}
        onStartOnboard={handleStartOnboardFromArrival}
        onLocateBus={handleLocateBus}
        userLat={userLat}
        userLon={userLon}
        onRequestLocation={requestLocation}
      />

      {/* Live ETA Sharing Modal */}
      {sharingData && (
        <ShareArrivalModal
          isOpen={Boolean(sharingData)}
          onClose={() => setSharingData(null)}
          stop={sharingData.stop}
          arrival={sharingData.arrival}
        />
      )}

      {/* Onboard Setup Modal (Choose destination stop when boarding) */}
      {onboardSetup && (
        <OnboardSetupModal
          isOpen={Boolean(onboardSetup)}
          onClose={() => setOnboardSetup(null)}
          route={onboardSetup.route}
          originStop={onboardSetup.originStop}
          vehicleId={onboardSetup.vehicleId}
          onConfirmTrip={startTrip}
        />
      )}

      {/* Onboard Dashboard Full HUD Modal */}
      <OnboardDashboardModal
        isOpen={isOnboardDashboardOpen}
        onClose={() => setIsOnboardDashboardOpen(false)}
        onEndTrip={endTrip}
        trip={onboardTrip}
        metrics={onboardMetrics}
        isBellActive={isBellActive}
        onRingBell={ringBell}
        onAdvanceStop={advanceToNextStop}
        onRewindStop={rewindToPrevStop}
        onToggleMute={toggleOnboardMute}
        onSelectDestination={setOnboardDestinationStop}
      />

      {/* Onboard Minimized Floating Bottom Bar */}
      {onboardTrip && !isOnboardDashboardOpen && (
        <OnboardMiniBar
          trip={onboardTrip}
          metrics={onboardMetrics}
          onExpand={() => setIsOnboardDashboardOpen(true)}
        />
      )}
    </div>
  );
};
