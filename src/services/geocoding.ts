import type { BusStop } from '../types/bus.ts';
import { VALLADOLID_POIS } from '../utils/valladolidPois.ts';

export interface LocationItem {
  id: string;
  name: string;
  secondaryText?: string;
  lat: number;
  lon: number;
  type: 'poi' | 'stop' | 'address' | 'gps';
  stopCode?: string;
  category?: string;
}

// Memory cache for geocoded queries to avoid repeat network requests
const geocodeCache = new Map<string, LocationItem[]>();
const reverseCache = new Map<string, string>();

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Clean up Nominatim display names to be readable and concise.
 */
function cleanNominatimDisplayName(item: {
  name?: string;
  display_name: string;
  address?: Record<string, string>;
}): { title: string; subtitle: string } {
  const addr = item.address || {};
  const road = addr.road || addr.pedestrian || addr.footway || addr.cycleway || addr.path || addr.square || '';
  const house = addr.house_number || '';
  const suburb = addr.suburb || addr.neighbourhood || addr.city_district || '';
  const city = addr.city || addr.town || addr.municipality || 'Valladolid';

  let title = item.name || '';
  if (road) {
    title = house ? `${road}, ${house}` : road;
  }
  if (!title) {
    const parts = item.display_name.split(',');
    title = parts[0]?.trim() || item.display_name;
  }

  const subtitleParts: string[] = [];
  if (suburb && suburb !== title) subtitleParts.push(suburb);
  if (city && !subtitleParts.includes(city)) subtitleParts.push(city);

  return {
    title,
    subtitle: subtitleParts.length > 0 ? subtitleParts.join(', ') : 'Valladolid',
  };
}

/**
 * Searches locations in Valladolid combining:
 * 1. Curated POIs (Hospitals, Train stations, Shopping centers, Universities)
 * 2. AUVASA Bus Stops (codes & names)
 * 3. OpenStreetMap Nominatim geocoder (bounded strictly to Valladolid municipality)
 */
export async function searchLocations(
  query: string,
  stops: BusStop[],
  signal?: AbortSignal
): Promise<LocationItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const normQuery = normalizeText(trimmed);
  const results: LocationItem[] = [];
  const seenKeys = new Set<string>();

  // 1. Search Curated POIs
  const matchedPois = VALLADOLID_POIS.filter(poi => {
    const normName = normalizeText(poi.name);
    const normShort = normalizeText(poi.shortName);
    const normAddr = normalizeText(poi.address);
    if (normName.includes(normQuery) || normShort.includes(normQuery) || normAddr.includes(normQuery)) {
      return true;
    }
    return poi.keywords.some(k => normalizeText(k).includes(normQuery) || normQuery.includes(normalizeText(k)));
  });

  for (const poi of matchedPois.slice(0, 5)) {
    const key = `${poi.lat.toFixed(4)}_${poi.lon.toFixed(4)}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      results.push({
        id: poi.id,
        name: poi.shortName,
        secondaryText: poi.address,
        lat: poi.lat,
        lon: poi.lon,
        type: 'poi',
        category: poi.category,
      });
    }
  }

  // 2. Search AUVASA Stops (matched by name or stop code)
  const isNumericQuery = /^\d+$/.test(normQuery);
  const matchedStops = stops.filter(s => {
    if (isNumericQuery) {
      return s.code.startsWith(normQuery);
    }
    return normalizeText(s.name).includes(normQuery);
  });

  for (const stop of matchedStops.slice(0, 4)) {
    const key = `${stop.lat.toFixed(4)}_${stop.lon.toFixed(4)}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      results.push({
        id: `stop_${stop.code}`,
        name: `Parada #${stop.code} — ${stop.name}`,
        secondaryText: `Líneas AUVASA: ${stop.routes.slice(0, 5).join(', ')}${stop.routes.length > 5 ? '...' : ''}`,
        lat: stop.lat,
        lon: stop.lon,
        type: 'stop',
        stopCode: stop.code,
      });
    }
  }

  // 3. Search via OpenStreetMap Nominatim for exact street addresses (bounded to Valladolid)
  if (trimmed.length >= 3) {
    const cacheKey = normQuery;
    if (geocodeCache.has(cacheKey)) {
      const cached = geocodeCache.get(cacheKey) || [];
      for (const item of cached) {
        const key = `${item.lat.toFixed(4)}_${item.lon.toFixed(4)}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          results.push(item);
        }
      }
      return results;
    }

    try {
      // Bounding box for Valladolid municipality:
      // minLon: -4.82, maxLat: 41.72, maxLon: -4.64, minLat: 41.57
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        trimmed
      )}&viewbox=-4.82,41.72,-4.64,41.57&bounded=1&format=json&addressdetails=1&limit=5&countrycodes=es`;

      const abortTimeout = AbortSignal.timeout ? AbortSignal.timeout(3500) : undefined;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
        signal: signal || abortTimeout,
      });

      if (response.ok) {
        const data = (await response.json()) as Array<{
          place_id: number;
          lat: string;
          lon: string;
          name?: string;
          display_name: string;
          address?: Record<string, string>;
        }>;

        const streetResults: LocationItem[] = [];

        for (const item of data) {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          if (isNaN(lat) || isNaN(lon)) continue;

          const key = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);

          const { title, subtitle } = cleanNominatimDisplayName(item);
          const locItem: LocationItem = {
            id: `osm_${item.place_id}`,
            name: title,
            secondaryText: subtitle,
            lat,
            lon,
            type: 'address',
          };
          streetResults.push(locItem);
          results.push(locItem);
        }

        geocodeCache.set(cacheKey, streetResults);
      }
    } catch {
      // Network error or rate limiting: fallback gracefully to local POIs and stops
    }
  }

  return results;
}

/**
 * Reverse geocodes coordinates to a human-readable street or area name in Valladolid.
 */
export async function reverseGeocodeLocation(
  lat: number,
  lon: number
): Promise<string> {
  const cacheKey = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
  if (reverseCache.has(cacheKey)) {
    return reverseCache.get(cacheKey)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const abortTimeout = AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: abortTimeout,
    });

    if (response.ok) {
      const data = await response.json();
      const { title, subtitle } = cleanNominatimDisplayName(data);
      const formatted = subtitle ? `${title} (${subtitle})` : title;
      reverseCache.set(cacheKey, formatted);
      return formatted;
    }
  } catch {
    // Graceful fallback
  }

  return 'Mi ubicación actual';
}
