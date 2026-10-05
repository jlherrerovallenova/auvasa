import { useState, useEffect, useMemo } from 'react';
import type { BusStop } from '../types/bus.ts';

const LOCAL_STORAGE_STOPS_KEY = 'vallabus_stops_cache_v1';

export function useStops() {
  const [stops, setStops] = useState<BusStop[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_STOPS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(stops.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStops() {
      try {
        const res = await fetch('/api/stops', { signal: controller.signal });
        if (!res.ok) throw new Error('Error al cargar paradas');
        const data = await res.json();
        setStops(data.stops || []);
        setLoading(false);
        try {
          localStorage.setItem(LOCAL_STORAGE_STOPS_KEY, JSON.stringify(data.stops || []));
        } catch {
          // Ignore cache quota exceeded
        }
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message);
          setLoading(false);
        }
      }
    }

    loadStops();
    return () => controller.abort();
  }, []);

  // Quick Map lookup by code
  const stopMapByCode = useMemo(() => {
    const map = new Map<string, BusStop>();
    for (const stop of stops) {
      map.set(stop.code, stop);
    }
    return map;
  }, [stops]);

  return {
    stops,
    stopMapByCode,
    loading,
    error,
  };
}
