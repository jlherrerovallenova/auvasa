import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { OnboardTrip, OnboardMetrics } from '../types/onboard.ts';
import type { BusRoute, RouteStop, LiveVehicle, BusStop } from '../types/bus.ts';
import { getDistanceMeters } from './useGeolocation.ts';
import { playBusChime, playStopRequestBell, triggerVibration, getAudioContext } from '../utils/audioAlert.ts';

const STORAGE_KEY = 'vallabus_onboard_trip_v1';

export function useOnboardTrip(liveVehicles: LiveVehicle[] = []) {
  const [trip, setTrip] = useState<OnboardTrip | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(() => trip !== null);
  const [userSpeedKmh, setUserSpeedKmh] = useState<number | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isBellActive, setIsBellActive] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const lastAlarmStopCodeRef = useRef<string | null>(null);

  // Sync trip state with localStorage
  useEffect(() => {
    try {
      if (trip) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [trip]);

  // Track live vehicle if vehicleId is linked
  const matchedVehicle = useMemo(() => {
    if (!trip) return null;
    if (trip.vehicleId) {
      const v = liveVehicles.find(item => item.vehicleId === trip.vehicleId || item.id === trip.vehicleId);
      if (v) return v;
    }
    // Fallback: match vehicle by lineName and direction/headsign
    return liveVehicles.find(
      item => item.lineName.toUpperCase() === trip.route.shortName.toUpperCase()
    ) || null;
  }, [trip, liveVehicles]);

  // High-accuracy Geolocation watch when trip is active
  useEffect(() => {
    if (!trip) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setUserCoords(null);
      setUserSpeedKmh(null);
      return;
    }

    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserCoords({ lat, lon });

        // Calculate speed in km/h
        if (pos.coords.speed !== null && pos.coords.speed !== undefined && pos.coords.speed >= 0) {
          setUserSpeedKmh(Math.round(pos.coords.speed * 3.6));
        }

        // Automatic Stop Progression
        setTrip(prevTrip => {
          if (!prevTrip || prevTrip.stops.length === 0) return prevTrip;

          const currIdx = prevTrip.currentStopIndex;
          const currStop = prevTrip.stops[currIdx];
          if (!currStop) return prevTrip;

          // Check distance to upcoming stops
          const distToCurr = getDistanceMeters(lat, lon, currStop.lat, currStop.lon);

          // If close to next stop or already moving towards subsequent stop
          const nextIdx = currIdx + 1;
          if (nextIdx < prevTrip.stops.length) {
            const nextStop = prevTrip.stops[nextIdx];
            const distToNext = getDistanceMeters(lat, lon, nextStop.lat, nextStop.lon);

            // Advance if we are significantly closer to the next stop or within arrival radius
            if (distToCurr <= 90 || (distToNext < distToCurr && distToNext < 250)) {
              return {
                ...prevTrip,
                currentStopIndex: nextIdx,
              };
            }
          }

          return prevTrip;
        });
      },
      err => {
        console.warn('Onboard GPS watch warning:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [trip !== null]);

  // Derive metrics
  const metrics: OnboardMetrics = useMemo(() => {
    if (!trip) {
      return {
        currentSpeedKmh: null,
        distanceToNextMeters: null,
        distanceToDestinationMeters: null,
        stopsRemaining: 0,
        estimatedMinutesRemaining: 0,
        isApproachingDestination: false,
        isDestinationReached: false,
      };
    }

    const currentStop = trip.stops[trip.currentStopIndex];
    const destinationStop = trip.destinationStop;

    let distToNext: number | null = null;
    let distToDest: number | null = null;

    if (userCoords && currentStop) {
      distToNext = getDistanceMeters(userCoords.lat, userCoords.lon, currentStop.lat, currentStop.lon);
    }
    if (userCoords && destinationStop) {
      distToDest = getDistanceMeters(userCoords.lat, userCoords.lon, destinationStop.lat, destinationStop.lon);
    }

    const stopsRemaining =
      trip.destinationStopIndex >= 0
        ? Math.max(0, trip.destinationStopIndex - trip.currentStopIndex)
        : 0;

    // Approaching: 1 stop away or within 400m
    const isApproaching =
      trip.destinationStopIndex >= 0 &&
      (stopsRemaining === 1 || (distToDest !== null && distToDest <= 400 && stopsRemaining <= 2));

    // Reached: 0 stops away or within 130m
    const isReached =
      trip.destinationStopIndex >= 0 &&
      (stopsRemaining === 0 || (distToDest !== null && distToDest <= 130));

    // Determine speed
    let speed = userSpeedKmh;
    if ((speed === null || speed === 0) && matchedVehicle?.speed) {
      speed = Math.round(matchedVehicle.speed);
    }

    return {
      currentSpeedKmh: speed,
      distanceToNextMeters: distToNext,
      distanceToDestinationMeters: distToDest,
      stopsRemaining,
      estimatedMinutesRemaining: Math.max(1, Math.round(stopsRemaining * 1.8)),
      isApproachingDestination: isApproaching,
      isDestinationReached: isReached,
    };
  }, [trip, userCoords, userSpeedKmh, matchedVehicle]);

  // Trigger alarms when 1 stop remains (or reached destination)
  useEffect(() => {
    if (!trip || !trip.destinationStop) return;

    if (metrics.isApproachingDestination && !metrics.isDestinationReached) {
      const destCode = trip.destinationStop.stopCode;
      if (lastAlarmStopCodeRef.current !== destCode) {
        lastAlarmStopCodeRef.current = destCode;
        if (!trip.isMuted) {
          playBusChime();
          triggerVibration([400, 150, 400, 150, 600]);
        }
        // Auto-open dashboard if it was minimized so user sees the alert
        setIsDashboardOpen(true);
      }
    } else if (metrics.isDestinationReached) {
      if (lastAlarmStopCodeRef.current !== 'reached_' + trip.destinationStop.stopCode) {
        lastAlarmStopCodeRef.current = 'reached_' + trip.destinationStop.stopCode;
        if (!trip.isMuted) {
          playBusChime();
          triggerVibration([600]);
        }
        setIsDashboardOpen(true);
      }
    }
  }, [metrics.isApproachingDestination, metrics.isDestinationReached, trip]);

  // Start trip action
  const startTrip = useCallback(
    ({
      route,
      directionKey,
      originStop,
      destinationStop = null,
      vehicleId = null,
    }: {
      route: BusRoute;
      directionKey?: string;
      originStop: RouteStop | BusStop;
      destinationStop?: RouteStop | null;
      vehicleId?: string | null;
    }) => {
      // Warm up AudioContext from user click gesture
      getAudioContext();

      // Determine origin code
      const originCode = 'code' in originStop ? originStop.code : originStop.stopCode;

      // Determine direction
      const dirKey =
        directionKey ||
        Object.keys(route.directions || {}).find(k => {
          const dir = route.directions[k];
          return dir.stops?.some(s => s.stopCode === originCode);
        }) ||
        '0';

      const dirInfo = route.directions[dirKey] || { headsign: route.destination, stops: [] };
      const allStops = dirInfo.stops || [];

      // Find origin index
      let originIdx = allStops.findIndex(s => s.stopCode === originCode);
      if (originIdx < 0) originIdx = 0;

      // Find destination index
      let destIdx = -1;
      if (destinationStop) {
        destIdx = allStops.findIndex(s => s.stopCode === destinationStop.stopCode);
      }

      const newTrip: OnboardTrip = {
        id: `trip_${Date.now()}`,
        route,
        directionKey: dirKey,
        directionHeadsign: dirInfo.headsign || route.destination,
        originStop,
        destinationStop,
        stops: allStops,
        currentStopIndex: Math.min(originIdx + 1, allStops.length - 1),
        destinationStopIndex: destIdx,
        vehicleId,
        isMuted: false,
        startedAt: Date.now(),
      };

      lastAlarmStopCodeRef.current = null;
      setTrip(newTrip);
      setIsDashboardOpen(true);
      triggerVibration([100]);
    },
    []
  );

  // End trip action
  const endTrip = useCallback(() => {
    setTrip(null);
    setIsDashboardOpen(false);
    setUserCoords(null);
    setUserSpeedKmh(null);
    lastAlarmStopCodeRef.current = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Set or change destination stop
  const setDestinationStop = useCallback((stop: RouteStop) => {
    setTrip(prev => {
      if (!prev) return null;
      const idx = prev.stops.findIndex(s => s.stopCode === stop.stopCode);
      lastAlarmStopCodeRef.current = null;
      return {
        ...prev,
        destinationStop: stop,
        destinationStopIndex: idx,
      };
    });
  }, []);

  // Manual next stop advance
  const advanceToNextStop = useCallback(() => {
    setTrip(prev => {
      if (!prev) return null;
      if (prev.currentStopIndex < prev.stops.length - 1) {
        triggerVibration([50]);
        return {
          ...prev,
          currentStopIndex: prev.currentStopIndex + 1,
        };
      }
      return prev;
    });
  }, []);

  // Manual prev stop
  const rewindToPrevStop = useCallback(() => {
    setTrip(prev => {
      if (!prev) return null;
      if (prev.currentStopIndex > 0) {
        triggerVibration([50]);
        return {
          ...prev,
          currentStopIndex: prev.currentStopIndex - 1,
        };
      }
      return prev;
    });
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setTrip(prev => (prev ? { ...prev, isMuted: !prev.isMuted } : null));
  }, []);

  // Ring the bus bell
  const ringBell = useCallback(() => {
    playStopRequestBell();
    triggerVibration([80, 50, 80]);
    setIsBellActive(true);
    setTimeout(() => setIsBellActive(false), 2500);
  }, []);

  return {
    trip,
    metrics,
    isDashboardOpen,
    setIsDashboardOpen,
    matchedVehicle,
    isBellActive,
    startTrip,
    endTrip,
    setDestinationStop,
    advanceToNextStop,
    rewindToPrevStop,
    toggleMute,
    ringBell,
  };
}
