import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { BusStop, BusRoute, LiveVehicle } from '../../types/bus.ts';
import type { CityTrafficSummary } from '../../types/traffic.ts';
import { VALLADOLID_TRAFFIC_CAMERAS } from '../../utils/traffic.ts';
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
  showTraffic?: boolean;
  showCameras?: boolean;
  trafficSummary?: CityTrafficSummary;
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
  showTraffic = false,
  showCameras = false,
  trafficSummary,
  userLat,
  userLon,
  onSelectStop,
}: MapLayersProps) {
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const trafficTileLayerRef = useRef<L.TileLayer | null>(null);
  const trafficSlowSpotsLayerRef = useRef<L.LayerGroup | null>(null);
  const trafficCamerasLayerRef = useRef<L.LayerGroup | null>(null);

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

    return () => {
      if (userMarkerRef.current && map) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (accuracyCircleRef.current && map) {
        map.removeLayer(accuracyCircleRef.current);
        accuracyCircleRef.current = null;
      }
    };
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

      const markerWidth = 36;
      const markerHeight = 36;

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
        entry.duration = 8500;
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

    // Clean up vehicles no longer in data
    for (const [key, entry] of tracker.entries()) {
      if (!activeVehicleIds.has(key)) {
        vehiclesLayer.removeLayer(entry.marker);
        tracker.delete(key);
      }
    }

    // Animation frame loop for buttery-smooth movement
    const animateVehicles = (timestamp: number) => {
      for (const entry of tracker.values()) {
        const elapsed = timestamp - entry.startTime;
        const progress = Math.min(elapsed / entry.duration, 1);

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

    const markers: L.Marker[] = [];

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

      const handleClick = (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        onSelectStopRef.current(stop);
      };

      marker.on('click', handleClick);
      stopsLayer.addLayer(marker);
      markers.push(marker);
    }

    return () => {
      for (const m of markers) {
        m.off('click');
      }
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

  // Live Traffic Flow Overlay Layer
  useEffect(() => {
    if (!map) return;

    if (trafficTileLayerRef.current) {
      map.removeLayer(trafficTileLayerRef.current);
      trafficTileLayerRef.current = null;
    }

    if (showTraffic) {
      const trafficLayer = L.tileLayer('https://mt1.google.com/vt?lyrs=traffic&x={x}&y={y}&z={z}', {
        opacity: 0.85,
        zIndex: 10,
        maxZoom: 20,
      }).addTo(map);

      trafficTileLayerRef.current = trafficLayer;
    }

    return () => {
      if (trafficTileLayerRef.current && map) {
        map.removeLayer(trafficTileLayerRef.current);
        trafficTileLayerRef.current = null;
      }
    };
  }, [map, showTraffic]);

  // Traffic Slow Spots & Congestion Badges Layer
  useEffect(() => {
    if (!map) return;

    if (trafficSlowSpotsLayerRef.current) {
      map.removeLayer(trafficSlowSpotsLayerRef.current);
      trafficSlowSpotsLayerRef.current = null;
    }

    if (showTraffic && trafficSummary && trafficSummary.slowSpots.length > 0) {
      const group = L.layerGroup().addTo(map);

      for (const spot of trafficSummary.slowSpots) {
        const isSevere = spot.level === 'congested';
        const spotIcon = L.divIcon({
          className: 'traffic-slow-spot-icon',
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 4px;
              background: ${isSevere ? '#dc2626' : '#d97706'};
              color: #ffffff;
              font-size: 10px;
              font-weight: 800;
              padding: 2px 6px;
              border-radius: 9999px;
              border: 1.5px solid #ffffff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              white-space: nowrap;
              animation: ${isSevere ? 'pulse 1.5s infinite' : 'none'};
            ">
              <span>⚠️</span>
              <span>Línea ${spot.busLine} (${spot.speed} km/h)</span>
            </div>
          `,
          iconSize: [120, 24],
          iconAnchor: [60, 12],
        });

        const marker = L.marker([spot.lat, spot.lon], { icon: spotIcon });
        marker.bindTooltip(
          `<strong>Tramo lento detectado</strong><br/>Línea ${spot.busLine} circulando a ${spot.speed} km/h (${spot.locationName})`,
          { direction: 'top', offset: [0, -10] }
        );
        group.addLayer(marker);
      }

      trafficSlowSpotsLayerRef.current = group;
    }

    return () => {
      if (trafficSlowSpotsLayerRef.current && map) {
        map.removeLayer(trafficSlowSpotsLayerRef.current);
        trafficSlowSpotsLayerRef.current = null;
      }
    };
  }, [map, showTraffic, trafficSummary]);

  // Traffic Cameras Layer
  useEffect(() => {
    if (!map) return;

    if (trafficCamerasLayerRef.current) {
      map.removeLayer(trafficCamerasLayerRef.current);
      trafficCamerasLayerRef.current = null;
    }

    if (showTraffic && showCameras) {
      const group = L.layerGroup().addTo(map);

      for (const cam of VALLADOLID_TRAFFIC_CAMERAS) {
        const camIcon = L.divIcon({
          className: 'traffic-camera-icon',
          html: `
            <div style="
              width: 28px;
              height: 28px;
              background: #0284c7;
              color: #ffffff;
              border: 2px solid #ffffff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              cursor: pointer;
              font-size: 14px;
            ">
              📷
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const popupContent = `
          <div style="min-width: 210px; font-family: -apple-system, sans-serif;">
            <div style="font-weight: 800; font-size: 13px; color: #ffffff; margin-bottom: 2px;">${cam.name}</div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">${cam.location}</div>
            <img src="${cam.imageUrl}" alt="${cam.name}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; border: 1px solid #334155;" />
            <div style="font-size: 10px; color: #38bdf8; font-weight: 700; margin-top: 4px; text-align: right;">Cámara en directo • Valladolid</div>
          </div>
        `;

        const marker = L.marker([cam.lat, cam.lon], { icon: camIcon });
        marker.bindPopup(popupContent);
        group.addLayer(marker);
      }

      trafficCamerasLayerRef.current = group;
    }

    return () => {
      if (trafficCamerasLayerRef.current && map) {
        map.removeLayer(trafficCamerasLayerRef.current);
        trafficCamerasLayerRef.current = null;
      }
    };
  }, [map, showTraffic, showCameras]);
}
