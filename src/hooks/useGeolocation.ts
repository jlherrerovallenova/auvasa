import { useState, useCallback } from 'react';
import type { BusStop } from '../types/bus.ts';

interface GeoState {
  lat: number | null;
  lon: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

// Haversine distance in meters
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    lat: null,
    lon: null,
    accuracy: null,
    loading: false,
    error: null,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocalización no soportada en este navegador', loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      pos => {
        setState({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          loading: false,
          error: null,
        });
      },
      err => {
        let msg = 'No se pudo obtener la ubicación';
        if (err.code === 1) msg = 'Permiso de ubicación denegado';
        else if (err.code === 2) msg = 'Posición no disponible';
        else if (err.code === 3) msg = 'Tiempo de espera agotado al obtener ubicación';
        setState(prev => ({ ...prev, loading: false, error: msg }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  // Sort stops by distance to user location
  const getNearbyStops = useCallback(
    (allStops: BusStop[], maxDistance = 2000, limit = 15): BusStop[] => {
      if (state.lat === null || state.lon === null) return [];

      const userLat = state.lat;
      const userLon = state.lon;

      return allStops
        .map(stop => {
          const dist = getDistanceMeters(userLat, userLon, stop.lat, stop.lon);
          return {
            ...stop,
            distanceMeters: dist,
            walkingMinutes: Math.max(1, Math.round(dist / 80)), // ~80m/min
          };
        })
        .filter(s => s.distanceMeters !== undefined && s.distanceMeters <= maxDistance)
        .sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0))
        .slice(0, limit);
    },
    [state.lat, state.lon]
  );

  return {
    ...state,
    requestLocation,
    getNearbyStops,
  };
}
