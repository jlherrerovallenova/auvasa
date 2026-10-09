import { useState, useCallback, useMemo, useEffect } from 'react';
import type { ActiveTab } from '../components/Header.tsx';
import type { BusStop, BusRoute, StopArrival, LiveVehicle } from '../types/bus.ts';

interface UseAppNavigationProps {
  stops: BusStop[];
  routes: BusRoute[];
  routeMapById: Map<string, BusRoute>;
  stopMapByCode: Map<string, BusStop>;
  vehicles: LiveVehicle[];
  fetchRouteDetail: (id: string) => Promise<BusRoute | null>;
  getNearbyStops: (allStops: BusStop[], maxDistance?: number, maxResults?: number) => BusStop[];
}

export const useAppNavigation = ({
  stops,
  routes,
  routeMapById,
  stopMapByCode,
  vehicles,
  fetchRouteDetail,
  getNearbyStops,
}: UseAppNavigationProps) => {
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

  const handleSelectRouteFromSearch = useCallback(
    async (route: BusRoute) => {
      const detailed = await fetchRouteDetail(route.id);
      setSelectedRoute(detailed || route);
      setActiveTab('lines');
    },
    [fetchRouteDetail]
  );

  const handleSelectRouteForMap = useCallback(
    async (route: BusRoute) => {
      const detailed = await fetchRouteDetail(route.id);
      setSelectedRoute(detailed || route);
      setActiveTab('map');
    },
    [fetchRouteDetail]
  );

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

  return {
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
  };
};
