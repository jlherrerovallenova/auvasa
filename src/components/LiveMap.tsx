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
  onSelectStop,
  onRequestLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [vehiclesLayer, setVehiclesLayer] = useState<L.LayerGroup | null>(null);
  const [stopsLayer, setStopsLayer] = useState<L.LayerGroup | null>(null);
  const [showStops, setShowStops] = useState(true);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: VALLADOLID_CENTER,
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

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

  return (
    <div className="relative w-full h-full min-h-[500px] flex-1 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Controls */}
      <MapControls
        showStops={showStops}
        onToggleStops={() => setShowStops(prev => !prev)}
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
