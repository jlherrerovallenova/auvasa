import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import type { BusStop, BusRoute, LiveVehicle } from '../types/bus.ts';
import { MapControls } from './map/MapControls.tsx';
import { SelectedRouteBanner } from './map/SelectedRouteBanner.tsx';
import { useMapLayers } from './map/useMapLayers.ts';

interface LiveMapProps {
  stops: BusStop[];
  routes: BusRoute[];
  vehicles: LiveVehicle[];
  selectedStop: BusStop | null;
  selectedRoute: BusRoute | null;
  userLat: number | null;
  userLon: number | null;
  theme?: 'light' | 'dark';
  onSelectStop: (stop: BusStop) => void;
  onRequestLocation: () => void;
}

const VALLADOLID_CENTER: [number, number] = [41.6523, -4.7245];

export const LiveMap: React.FC<LiveMapProps> = ({
  stops,
  vehicles,
  selectedStop,
  selectedRoute,
  userLat,
  userLon,
  theme,
  onSelectStop,
  onRequestLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [vehiclesLayer, setVehiclesLayer] = useState<L.LayerGroup | null>(null);
  const [stopsLayer, setStopsLayer] = useState<L.LayerGroup | null>(null);
  const [showStops, setShowStops] = useState(true);
  const [mapTheme, setMapTheme] = useState<'dark' | 'streets'>(
    theme === 'light' ? 'streets' : 'dark'
  );

  useEffect(() => {
    if (theme) {
      setMapTheme(theme === 'light' ? 'streets' : 'dark');
    }
  }, [theme]);

  const baseTilesRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: VALLADOLID_CENTER,
      zoom: 13,
      zoomControl: false,
    });

    baseTilesRef.current = L.layerGroup().addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const vLayer = L.layerGroup().addTo(map);
    const sLayer = L.layerGroup().addTo(map);

    setMapInstance(map);
    setVehiclesLayer(vLayer);
    setStopsLayer(sLayer);

    return () => {
      map.remove();
      setMapInstance(null);
      setVehiclesLayer(null);
      setStopsLayer(null);
    };
  }, []);

  // Update Tile Layers when mapTheme changes (No watermarks, fast CloudFront / OSM)
  useEffect(() => {
    const tileGroup = baseTilesRef.current;
    if (!tileGroup) return;

    tileGroup.clearLayers();

    if (mapTheme === 'dark') {
      const darkMatter = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
        }
      );
      tileGroup.addLayer(darkMatter);
    } else {
      const positron = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
        }
      );
      tileGroup.addLayer(positron);
    }

    return () => {
      tileGroup.clearLayers();
    };
  }, [mapTheme, mapInstance]);

  // Hook managing dynamic map layers and subscriptions with cleanup
  useMapLayers({
    map: mapInstance,
    vehiclesLayer,
    stopsLayer,
    stops,
    vehicles,
    selectedStop,
    selectedRoute,
    showStops,
    userLat,
    userLon,
    onSelectStop,
  });

  // Center on Selected Stop
  useEffect(() => {
    if (!mapInstance || !selectedStop) return;

    mapInstance.flyTo([selectedStop.lat, selectedStop.lon], 16, {
      duration: 1.2,
    });
  }, [mapInstance, selectedStop]);

  const handleCenterValladolid = useCallback(() => {
    mapInstance?.flyTo(VALLADOLID_CENTER, 13);
  }, [mapInstance]);

  const handleLocateMe = useCallback(() => {
    if (userLat !== null && userLon !== null && mapInstance) {
      mapInstance.flyTo([userLat, userLon], 16);
    } else {
      onRequestLocation();
    }
  }, [userLat, userLon, mapInstance, onRequestLocation]);

  const handleToggleTheme = useCallback(() => {
    setMapTheme(prev => (prev === 'dark' ? 'streets' : 'dark'));
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] flex-1 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-slate-100 dark:bg-slate-950 transition-colors">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Controls */}
      <MapControls
        showStops={showStops}
        mapTheme={mapTheme}
        onToggleStops={() => setShowStops(prev => !prev)}
        onToggleMapTheme={handleToggleTheme}
        onLocateMe={handleLocateMe}
        onCenterValladolid={handleCenterValladolid}
      />

      {/* Selected Line Banner Overlay */}
      {selectedRoute && (
        <SelectedRouteBanner
          selectedRoute={selectedRoute}
          vehicles={vehicles}
          onClearRoute={handleCenterValladolid}
        />
      )}
    </div>
  );
};
