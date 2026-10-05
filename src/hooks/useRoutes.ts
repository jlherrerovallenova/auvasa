import { useState, useEffect, useMemo, useCallback } from 'react';
import type { BusRoute } from '../types/bus.ts';

const LOCAL_STORAGE_ROUTES_KEY = 'vallabus_routes_cache_v1';

export function useRoutes() {
  const [routes, setRoutes] = useState<BusRoute[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_ROUTES_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(routes.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRoutes() {
      try {
        const res = await fetch('/api/lines', { signal: controller.signal });
        if (!res.ok) throw new Error('Error al cargar líneas');
        const data = await res.json();
        setRoutes(data.routes || []);
        setLoading(false);
        try {
          localStorage.setItem(LOCAL_STORAGE_ROUTES_KEY, JSON.stringify(data.routes || []));
        } catch {
          // ignore cache quota
        }
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message);
          setLoading(false);
        }
      }
    }

    loadRoutes();
    return () => controller.abort();
  }, []);

  const routeMapById = useMemo(() => {
    const map = new Map<string, BusRoute>();
    for (const r of routes) {
      map.set(r.id, r);
      map.set(r.shortName, r);
    }
    return map;
  }, [routes]);

  const fetchRouteDetail = useCallback(async (lineId: string): Promise<BusRoute | null> => {
    try {
      const res = await fetch(`/api/lines/${lineId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  return {
    routes,
    routeMapById,
    loading,
    error,
    fetchRouteDetail,
  };
}
