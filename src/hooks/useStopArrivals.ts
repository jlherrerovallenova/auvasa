import { useState, useEffect, useCallback } from 'react';
import type { StopArrivalsResponse } from '../types/bus.ts';

export function useStopArrivals(stopCode: string | null) {
  const [data, setData] = useState<StopArrivalsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArrivals = useCallback(async (code: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/stops/${code}/arrivals`);
      if (!res.ok) throw new Error('No se pudieron obtener llegadas');
      const json: StopArrivalsResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err: unknown) {
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

    fetchArrivals(stopCode);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchArrivals(stopCode);
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [stopCode, fetchArrivals]);

  return {
    data,
    loading,
    error,
    refresh: () => {
      if (stopCode) fetchArrivals(stopCode);
    },
  };
}
