import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { BusStop, BusRoute, LiveVehicle } from '../../types/bus.ts';
import { getBusFleetInfo, parseOccupancy } from '../../utils/fleet.ts';
import { getBusMarkerHtml } from '../../utils/busIcons.ts';

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

interface InterpolatedVehicle {
  marker: L.Marker;
  startLat: number;
  startLon: number;
  targetLat: number;
  targetLon: number;
  startTime: number;
  duration: number;
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

  // Persistent vehicle markers for smooth kinematic interpolation
  const vehicleTrackerRef = useRef<Map<string, InterpolatedVehicle>>(new Map());
  const animFrameRef = useRef<number | null>(null);

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

  // Real-time vehicles with Kinematic Smooth Interpolation
  useEffect(() => {
    if (!vehiclesLayer) return;

    const tracker = vehicleTrackerRef.current;
    const now = performance.now();
    const activeVehicleIds = new Set<string>();

    const vehiclesToDisplay = selectedRoute
      ? vehicles.filter(
          v => v.routeId === selectedRoute.id || v.lineName.toUpperCase() === selectedRoute.shortName.toUpperCase()
        )
      : vehicles;

    for (const v of vehiclesToDisplay) {
      if (!v.lat || !v.lon) continue;

      const vehicleKey = v.id || v.vehicleId;
      activeVehicleIds.add(vehicleKey);

      const fleet = getBusFleetInfo(v.vehicleId);
      const occupancy = parseOccupancy(v.occupancy);

      const isArticulated = fleet.isArticulated || fleet.typeKey === 'irizar-ie-tram-articulated' || fleet.typeKey === 'articulated-gnc';
      const markerWidth = isArticulated ? 54 : 40;
      const markerHeight = 20;

      const markerHtml = getBusMarkerHtml({
        fleet,
        lineName: v.lineName,
        routeColor: v.routeColor || '#008075',
        routeTextColor: v.routeTextColor || '#FFFFFF',
        vehicleId: v.vehicleId,
        speed: v.speed,
        bearing: v.bearing,
      });

      const icon = L.divIcon({
        className: 'bus-vehicle-pin',
        html: markerHtml,
        iconSize: [markerWidth, markerHeight],
        iconAnchor: [markerWidth / 2, markerHeight / 2],
      });

      const popupContent = `
        <div style="font-size: 13px; font-weight: 500; line-height: 1.4; padding: 4px; min-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 6px;">
            <span style="background: ${v.routeColor || '#008075'}; color: ${v.routeTextColor || '#FFFFFF'}; padding: 2px 8px; border-radius: 8px; font-weight: 900; font-size: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
              Línea ${v.lineName}
            </span>
            <span style="color: ${occupancy.iconColor}; font-weight: 700; font-size: 11px;">
              ● ${occupancy.label}
            </span>
          </div>
          <div style="font-weight: 800; color: #ffffff; font-size: 14px; margin-bottom: 6px;">${v.headsign || 'En servicio'}</div>
          
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(51, 65, 85, 0.6); border-radius: 8px; padding: 6px 8px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Modelo:</span>
              <strong style="color: #38bdf8;">${fleet.model}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Propulsión:</span>
              <strong style="color: ${fleet.propulsion === '100% Eléctrico' ? '#34d399' : '#a78bfa'};">${fleet.propulsion}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Coche / Matrícula:</span>
              <strong style="color: #cbd5e1;">#${v.vehicleId || 'N/D'} (${v.licensePlate || 'N/D'})</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Velocidad actual:</span>
              <strong style="color: #facc15;">${v.speed} km/h</strong>
            </div>
          </div>
        </div>
      `;

      if (tracker.has(vehicleKey)) {
        // Vehicle already exists: smoothly interpolate to new target GPS point
        const entry = tracker.get(vehicleKey)!;
        entry.startLat = entry.marker.getLatLng().lat;
        entry.startLon = entry.marker.getLatLng().lng;
        entry.targetLat = v.lat;
        entry.targetLon = v.lon;
        entry.startTime = now;
        entry.duration = 8500; // interpolate over 8.5 seconds
        entry.marker.setIcon(icon);
        entry.marker.setPopupContent(popupContent);
      } else {
        // New vehicle entering route
        const marker = L.marker([v.lat, v.lon], { icon });
        marker.bindPopup(popupContent);
        vehiclesLayer.addLayer(marker);

        tracker.set(vehicleKey, {
          marker,
          startLat: v.lat,
          startLon: v.lon,
          targetLat: v.lat,
          targetLon: v.lon,
          startTime: now,
          duration: 8500,
        });
      }
    }

    // Remove obsolete vehicles
    for (const [key, entry] of tracker.entries()) {
      if (!activeVehicleIds.has(key)) {
        vehiclesLayer.removeLayer(entry.marker);
        tracker.delete(key);
      }
    }

    // Kinematic Animation Loop (Smooth Lerp)
    const animateVehicles = (currentTime: number) => {
      for (const entry of tracker.values()) {
        const elapsed = currentTime - entry.startTime;
        const progress = Math.min(1, Math.max(0, elapsed / entry.duration));

        // Smooth cubic ease-out
        const ease = 1 - Math.pow(1 - progress, 3);
        const curLat = entry.startLat + (entry.targetLat - entry.startLat) * ease;
        const curLon = entry.startLon + (entry.targetLon - entry.startLon) * ease;

        entry.marker.setLatLng([curLat, curLon]);
      }

      animFrameRef.current = requestAnimationFrame(animateVehicles);
    };

    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(animateVehicles);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
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

    for (const stop of stopsToRender) {
      const isSelected = selectedStop?.code === stop.code;

      const stopIcon = L.divIcon({
        className: 'bus-stop-pin',
        html: `
          <div style="
            width: ${isSelected ? '16px' : '10px'};
            height: ${isSelected ? '16px' : '10px'};
            background: ${isSelected ? '#0d9488' : '#475569'};
            border: 2px solid ${isSelected ? '#ffffff' : '#0f172a'};
            border-radius: 50%;
            cursor: pointer;
            box-shadow: ${isSelected ? '0 0 14px rgba(13, 148, 136, 0.9)' : 'none'};
            transition: transform 0.2s;
          "></div>
        `,
        iconSize: [isSelected ? 16 : 10, isSelected ? 16 : 10],
        iconAnchor: [isSelected ? 8 : 5, isSelected ? 8 : 5],
      });

      const marker = L.marker([stop.lat, stop.lon], { icon: stopIcon });

      marker.bindTooltip(
        `<div style="font-size: 11px; font-weight: 600; line-height: 1.3;">
          <div><strong style="color: #0d9488;">#${stop.code}</strong> ${stop.name}</div>
          <div style="font-size: 10px; color: #64748b; font-weight: 500; margin-top: 1px;">Pulsa para ver autobuses y tiempos</div>
        </div>`,
        { direction: 'top', offset: [0, -6] }
      );

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectStopRef.current(stop);
      });

      stopsLayer.addLayer(marker);
    }

    return () => {
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
