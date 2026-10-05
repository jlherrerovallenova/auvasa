import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { BusStop, BusRoute, LiveVehicle } from '../../types/bus.ts';

interface MapLayersProps {
  map: L.Map | null;
  vehiclesLayer: L.LayerGroup | null;
  stopsLayer: L.LayerGroup | null;
  stops: BusStop[];
  vehicles: LiveVehicle[];
  selectedStop: BusStop | null;
  selectedRoute: BusRoute | null;
  showStops: boolean;
  userLat: number | null;
  userLon: number | null;
  onSelectStop: (stop: BusStop) => void;
}

export function useMapLayers({
  map,
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
}: MapLayersProps) {
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const onSelectStopRef = useRef(onSelectStop);
  useEffect(() => {
    onSelectStopRef.current = onSelectStop;
  }, [onSelectStop]);

  // User location marker
  useEffect(() => {
    if (!map || userLat === null || userLon === null) return;

    if (!userMarkerRef.current) {
      const userIcon = L.divIcon({
        className: 'user-geo-icon',
        html: `<div style="
          width: 18px;
          height: 18px;
          background: #0ea5e9;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(14, 165, 233, 0.8);
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      userMarkerRef.current = L.marker([userLat, userLon], { icon: userIcon }).addTo(map);
      accuracyCircleRef.current = L.circle([userLat, userLon], {
        radius: 80,
        color: '#0ea5e9',
        fillColor: '#0ea5e9',
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([userLat, userLon]);
      accuracyCircleRef.current?.setLatLng([userLat, userLon]);
    }
  }, [map, userLat, userLon]);

  // Real-time vehicles layer
  useEffect(() => {
    if (!vehiclesLayer) return;

    vehiclesLayer.clearLayers();

    const vehiclesToDisplay = selectedRoute
      ? vehicles.filter(
          v => v.routeId === selectedRoute.id || v.lineName.toUpperCase() === selectedRoute.shortName.toUpperCase()
        )
      : vehicles;

    for (const v of vehiclesToDisplay) {
      if (!v.lat || !v.lon) continue;

      const markerHtml = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${v.routeColor || '#008075'};
          color: ${v.routeTextColor || '#FFFFFF'};
          border: 2px solid #ffffff;
          border-radius: 8px;
          padding: 2px 6px;
          font-weight: 800;
          font-size: 11px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          cursor: pointer;
          white-space: nowrap;
        ">
          <span>${v.lineName}</span>
        </div>
      `;

      const icon = L.divIcon({
        className: 'bus-vehicle-pin',
        html: markerHtml,
        iconSize: [32, 22],
        iconAnchor: [16, 11],
      });

      const marker = L.marker([v.lat, v.lon], { icon });

      const popupContent = `
        <div style="font-size: 13px; font-weight: 500; line-height: 1.4; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="background: ${v.routeColor}; color: ${v.routeTextColor}; padding: 1px 6px; border-radius: 6px; font-weight: 800; font-size: 11px;">
              Línea ${v.lineName}
            </span>
            <span style="color: #10b981; font-weight: 700; font-size: 11px;">● En Vivo</span>
          </div>
          <div style="font-weight: 700; color: #ffffff; margin-bottom: 2px;">${v.headsign || 'En servicio'}</div>
          <div style="font-size: 11px; color: #94a3b8;">
            Matrícula: <strong style="color: #cbd5e1;">${v.licensePlate || 'N/D'}</strong><br/>
            Velocidad: <strong style="color: #cbd5e1;">${v.speed} km/h</strong>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      vehiclesLayer.addLayer(marker);
    }

    return () => {
      vehiclesLayer.clearLayers();
    };
  }, [vehiclesLayer, vehicles, selectedRoute]);

  // Stops layer
  useEffect(() => {
    if (!stopsLayer) return;

    stopsLayer.clearLayers();

    if (!showStops) return;

    let stopsToRender = stops;
    if (selectedRoute) {
      const routeStopCodes = new Set<string>();
      for (const dir of Object.values(selectedRoute.directions || {})) {
        for (const s of dir.stops) {
          routeStopCodes.add(s.stopCode);
        }
      }
      stopsToRender = stops.filter(s => routeStopCodes.has(s.code));
    }

    // Map each stop to marker
    const stopByLatLng = new Map<string, BusStop>();

    for (const stop of stopsToRender) {
      const isSelected = selectedStop?.code === stop.code;
      const key = `${stop.lat}_${stop.lon}`;
      stopByLatLng.set(key, stop);

      const stopIcon = L.divIcon({
        className: 'bus-stop-pin',
        html: `
          <div style="
            width: ${isSelected ? '14px' : '9px'};
            height: ${isSelected ? '14px' : '9px'};
            background: ${isSelected ? '#14b8a6' : '#475569'};
            border: 2px solid ${isSelected ? '#ffffff' : '#0f172a'};
            border-radius: 50%;
            cursor: pointer;
            box-shadow: ${isSelected ? '0 0 10px #14b8a6' : 'none'};
            transition: transform 0.2s;
          "></div>
        `,
        iconSize: [isSelected ? 14 : 9, isSelected ? 14 : 9],
        iconAnchor: [isSelected ? 7 : 4.5, isSelected ? 7 : 4.5],
      });

      const marker = L.marker([stop.lat, stop.lon], { icon: stopIcon });

      marker.bindTooltip(
        `<strong>#${stop.code}</strong> ${stop.name}`,
        { direction: 'top', offset: [0, -6] }
      );

      stopsLayer.addLayer(marker);
    }

    // Delegated click handler on the layer group with guaranteed cleanup
    const handleLayerClick = (e: L.LeafletEvent) => {
      const latlng = (e as L.LeafletMouseEvent).latlng;
      if (!latlng) return;
      const matched = stopByLatLng.get(`${latlng.lat}_${latlng.lng}`);
      if (matched) {
        onSelectStopRef.current(matched);
      }
    };

    stopsLayer.addEventListener('click', handleLayerClick);

    return () => {
      stopsLayer.removeEventListener('click', handleLayerClick);
      stopsLayer.clearLayers();
    };
  }, [stopsLayer, stops, selectedRoute, selectedStop, showStops]);

  // Route polyline layer
  useEffect(() => {
    if (!map) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (selectedRoute) {
      const dir0 = selectedRoute.directions['0'];
      const dir1 = selectedRoute.directions['1'];
      const coords = dir0?.coordinates || dir1?.coordinates || [];

      if (coords.length > 0) {
        const polyline = L.polyline(coords, {
          color: selectedRoute.color || '#008075',
          weight: 5,
          opacity: 0.85,
          lineJoin: 'round',
        }).addTo(map);

        routePolylineRef.current = polyline;
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      }
    }

    return () => {
      if (routePolylineRef.current && map) {
        map.removeLayer(routePolylineRef.current);
        routePolylineRef.current = null;
      }
    };
  }, [map, selectedRoute]);
}
