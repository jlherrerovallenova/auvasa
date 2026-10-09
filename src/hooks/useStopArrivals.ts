import { useState, useEffect, useCallback } from 'react';
import type { StopArrivalsResponse } from '../types/bus.ts';

export function useStopArrivals(stopCode: string | null) {
  const [data, setData] = useState<StopArrivalsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArrivals = useCallback(async (code: string, isSilent = false, signal?: AbortSignal) => {
    if (isSilent) {
      try {
        const res = await fetch(`/api/stops/${code}/arrivals`, { signal });
        if (!res.ok) return;
        const json: StopArrivalsResponse = await res.json();
        setData(json);
        setError(null);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/stops/${code}/arrivals`, { signal });
      if (!res.ok) throw new Error('No se pudieron obtener llegadas');
      const json: StopArrivalsResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!stopCode) {
      setData(null);
      setError(null);
      return;
    }

    const controller = new AbortController();

    // Initial fetch shows loading spinner
    fetchArrivals(stopCode, false, controller.signal);

    // Background interval does silent updates without flashing full-screen loaders
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchArrivals(stopCode, true);
      }
    }, 12000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [stopCode, fetchArrivals]);

  return {
    data,
    loading,
    error,
    refresh: () => {
      if (stopCode) fetchArrivals(stopCode, false);
    },
  };
}
