import React, { useState, useMemo } from 'react';
import { Route, Locate, Footprints, Clock, Sparkles } from 'lucide-react';
import type { BusStop, BusRoute, LiveVehicle } from '../types/bus.ts';
import { findRoutePlans, findClosestStop, type RoutePlanResult } from '../utils/routePlanner.ts';

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
  const [originCode, setOriginCode] = useState<string>('');
  const [destCode, setDestCode] = useState<string>('');
  const [plans, setPlans] = useState<RoutePlanResult[] | null>(null);

  const stopMap = useMemo(() => {
    const map = new Map<string, BusStop>();
    for (const s of stops) map.set(s.code, s);
    return map;
  }, [stops]);

  const handleUseMyLocation = () => {
    if (userLat !== null && userLon !== null) {
      const closest = findClosestStop(userLat, userLon, stops);
      if (closest) {
        setOriginCode(closest.code);
      }
    } else {
      onRequestLocation();
    }
  };

  const handleCalculate = () => {
    const orig = stopMap.get(originCode);
    const dest = stopMap.get(destCode);

    if (orig && dest) {
      const results = findRoutePlans(orig, dest, routes, vehicles);
      setPlans(results);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
          <Route className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">Planificador de Rutas en Tiempo Real</h3>
          <p className="text-xs text-slate-400">Rutas óptimas en Valladolid con tiempos y trasbordos en directo</p>
        </div>
      </div>

      {/* Input Origin & Destination */}
      <div className="space-y-3">
        {/* Origin */}
        <div>
          <label htmlFor="origin-stop-select" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Punto de Origen
          </label>
          <div className="flex gap-2">
            <select
              id="origin-stop-select"
              value={originCode}
              onChange={e => setOriginCode(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="">Selecciona parada de origen...</option>
              {stops.map(s => (
                <option key={s.code} value={s.code}>
                  #{s.code} — {s.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleUseMyLocation}
              className="p-3 bg-slate-800 hover:bg-slate-750 text-teal-400 border border-slate-700/80 rounded-2xl transition-colors cursor-pointer flex items-center justify-center"
              title="Usar mi ubicación actual"
              aria-label="Usar mi ubicación actual"
            >
              <Locate className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Destination */}
        <div>
          <label htmlFor="dest-stop-select" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Punto de Destino
          </label>
          <select
            id="dest-stop-select"
            value={destCode}
            onChange={e => setDestCode(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          >
            <option value="">Selecciona parada de destino...</option>
            {stops.map(s => (
              <option key={s.code} value={s.code}>
                #{s.code} — {s.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleCalculate}
          disabled={!originCode || !destCode || originCode === destCode}
          className="w-full mt-2 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl transition-transform shadow-lg shadow-teal-700/30 cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          <span>Calcular Mejor Ruta</span>
        </button>
      </div>

      {/* Results */}
      {plans !== null && (
        <div className="space-y-4 pt-4 border-t border-slate-800 animate-in fade-in">
          {plans.length === 0 ? (
            <div className="p-6 text-center text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
              <p className="text-sm">No se encontró una conexión directa o de 1 trasbordo entre estas paradas.</p>
              <p className="text-xs text-slate-500 mt-1">Prueba con paradas más céntricas (ej. Plaza España, Doctrinos).</p>
            </div>
          ) : (
            plans.map((plan, planIdx) => (
              <div
                key={plan.id}
                className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-colors shadow-lg"
              >
                {/* Plan Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30">
                      Opción {planIdx + 1}
                    </span>
                    <span className="text-xs text-slate-400">
                      {plan.transfersCount === 0 ? 'Trayecto directo' : '1 trasbordo'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                    <Clock className="w-4 h-4" />
                    <span>~{plan.totalMinutes} min</span>
                  </div>
                </div>

                {/* Steps Timeline */}
                <div className="space-y-3">
                  {plan.steps.map((step, sIdx) => {
                    const stepKey = `${plan.id}_step_${sIdx}`;
                    return (
                      <div key={stepKey} className="flex items-start gap-3">
                        {step.type === 'bus' ? (
                          <div
                            className="w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0 shadow-md"
                            style={{ backgroundColor: step.lineColor || '#008075', color: step.lineTextColor || '#FFF' }}
                          >
                            {step.lineShortName}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0">
                            <Footprints className="w-4 h-4" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white leading-snug">{step.description}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                const fromStop = stopMap.get(step.fromStopCode);
                                if (fromStop) onSelectStop(fromStop);
                              }}
                              className="text-teal-400 hover:underline cursor-pointer"
                            >
                              #{step.fromStopCode} {step.fromStopName}
                            </button>
                            <span>→</span>
                            <span>{step.toStopName}</span>
                            <span className="text-slate-500 font-mono">({step.estimatedMinutes} min)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
