import React, { useState, useMemo } from 'react';
import { Route, Sparkles, ArrowUpDown, Loader2 } from 'lucide-react';
import type { BusStop, BusRoute, LiveVehicle } from '../types/bus.ts';
import { findDoorToDoorPlans, type RoutePlanResult } from '../utils/routePlanner.ts';
import { LocationSearchInput } from './route/LocationSearchInput.tsx';
import { QuickDestinationChips } from './route/QuickDestinationChips.tsx';
import { RoutePlanCard } from './route/RoutePlanCard.tsx';
import type { LocationItem } from '../services/geocoding.ts';

interface RoutePlannerProps {
  stops: BusStop[];
  routes: BusRoute[];
  vehicles: LiveVehicle[];
  userLat: number | null;
  userLon: number | null;
  onRequestLocation: () => void;
  onSelectStop: (stop: BusStop) => void;
  onSelectRoute: (route: BusRoute) => void;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  stops,
  routes,
  vehicles,
  userLat,
  userLon,
  onRequestLocation,
  onSelectStop,
}) => {
  const [origin, setOrigin] = useState<LocationItem | null>(null);
  const [destination, setDestination] = useState<LocationItem | null>(null);
  const [plans, setPlans] = useState<RoutePlanResult[] | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const stopMapByCode = useMemo(() => {
    const map = new Map<string, BusStop>();
    for (const s of stops) map.set(s.code, s);
    return map;
  }, [stops]);

  // When userLat/Lon becomes available after requesting, if origin was set to GPS or requested
  const handleUseMyLocationForOrigin = () => {
    if (userLat !== null && userLon !== null) {
      setOrigin({
        id: 'user_gps_origin',
        name: 'Mi ubicación actual',
        secondaryText: 'Posición GPS detectada',
        lat: userLat,
        lon: userLon,
        type: 'gps',
      });
    } else {
      onRequestLocation();
    }
  };

  const effectiveOrigin = useMemo(() => {
    if (origin?.type === 'gps' && userLat !== null && userLon !== null) {
      return { ...origin, lat: userLat, lon: userLon };
    }
    return origin;
  }, [origin, userLat, userLon]);

  const handleSwap = () => {
    const oldOrigin = origin;
    const oldDest = destination;
    setOrigin(oldDest);
    setDestination(oldOrigin);
    if (plans) {
      setPlans(null);
    }
  };

  const handleCalculate = () => {
    if (!effectiveOrigin || !destination) return;

    setIsCalculating(true);
    // Short timeout to guarantee smooth rendering
    setTimeout(() => {
      try {
        const results = findDoorToDoorPlans(effectiveOrigin, destination, stops, routes, vehicles);
        setPlans(results);
      } finally {
        setIsCalculating(false);
      }
    }, 50);
  };

  const handleSelectQuickDestination = (poi: LocationItem) => {
    setDestination(poi);
    if (effectiveOrigin) {
      setIsCalculating(true);
      setTimeout(() => {
        try {
          const results = findDoorToDoorPlans(effectiveOrigin, poi, stops, routes, vehicles);
          setPlans(results);
        } finally {
          setIsCalculating(false);
        }
      }, 50);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-6 max-w-2xl mx-auto transition-colors">
      {/* Title */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
          <Route className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white text-lg">Cómo llegar en Valladolid</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Itinerarios puerta a puerta por dirección, lugar o parada con autobuses en directo
          </p>
        </div>
      </div>

      {/* Origin & Destination Inputs */}
      <div className="space-y-4">
        {/* Origin */}
        <LocationSearchInput
          id="route-origin-input"
          label="Punto de Origen"
          placeholder="Escribe calle, plaza, hospital o usa tu GPS..."
          value={origin}
          stops={stops}
          onSelect={item => {
            setOrigin(item);
            setPlans(null);
          }}
          onClear={() => {
            setOrigin(null);
            setPlans(null);
          }}
          onRequestMyLocation={handleUseMyLocationForOrigin}
          hasGpsButton={true}
        />

        {/* Swap Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            type="button"
            onClick={handleSwap}
            disabled={!origin && !destination}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm transition-transform duration-200 cursor-pointer hover:rotate-180"
            title="Invertir origen y destino"
            aria-label="Invertir origen y destino"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* Destination */}
        <LocationSearchInput
          id="route-destination-input"
          label="Punto de Destino"
          placeholder="Escribe calle, hospital, estación, centro comercial..."
          value={destination}
          stops={stops}
          onSelect={item => {
            setDestination(item);
            setPlans(null);
          }}
          onClear={() => {
            setDestination(null);
            setPlans(null);
          }}
        />

        {/* Popular Shortcuts */}
        <QuickDestinationChips onSelect={handleSelectQuickDestination} />

        {/* Calculate Button */}
        <button
          type="button"
          onClick={handleCalculate}
          disabled={!effectiveOrigin || !destination || isCalculating}
          className="w-full mt-2 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-lg shadow-teal-700/20 cursor-pointer flex items-center justify-center gap-2"
        >
          {isCalculating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Calculando itinerarios...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Calcular Cómo Llegar</span>
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {plans !== null && (
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
          {plans.length === 0 ? (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 rounded-3xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No se encontró una conexión óptima entre estos dos puntos.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-md mx-auto">
                Prueba buscando una parada o calle más próxima al centro o a avenidas principales
                como Paseo Zorrilla, Plaza España o López Gómez.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>Itinerarios recomendados ({plans.length})</span>
                <span>Tiempos estimados con tráfico y espera</span>
              </div>

              {plans.map((plan, planIdx) => (
                <RoutePlanCard
                  key={plan.id}
                  plan={plan}
                  index={planIdx}
                  onSelectStop={onSelectStop}
                  stopMapByCode={stopMapByCode}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
