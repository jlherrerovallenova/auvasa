import { useState, useEffect, useCallback, useRef } from 'react';
import type { LiveVehicle } from '../types/bus.ts';

export function useRealtime() {
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchVehicles = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await fetch('/api/realtime/vehicles');
      if (!res.ok) throw new Error('Error al sincronizar vehículos');
      const data = await res.json();
      setVehicles(data.vehicles || []);
      setLastUpdated(data.updatedAt || new Date().toISOString());
      setError(null);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchVehicles();

    // Auto-refresh interval
    const interval = setInterval(() => {
      // Pause polling if tab is hidden
      if (document.visibilityState === 'visible') {
        fetchVehicles();
      }
    }, 9000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchVehicles();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchVehicles]);

  return {
    vehicles,
    lastUpdated,
    loading,
    error,
    refresh: fetchVehicles,
  };
}
