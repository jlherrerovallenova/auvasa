import { useState, useEffect, useCallback } from 'react';
import type { ServiceAlert } from '../types/bus.ts';

export function useAlerts() {
  const [alerts, setAlerts] = useState<ServiceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const res = await fetch('/api/realtime/alerts', { signal });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAlerts(controller.signal);
    return () => controller.abort();
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    refresh: () => fetchAlerts(),
  };
}
