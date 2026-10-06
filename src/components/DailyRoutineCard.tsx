import React, { useState } from 'react';
import { CalendarClock, Settings2, Trash2, ArrowRight } from 'lucide-react';
import type { BusStop, BusRoute } from '../types/bus.ts';
import { useDailyRoutine } from '../hooks/useDailyRoutine.ts';

interface DailyRoutineCardProps {
  stops: BusStop[];
  routes: BusRoute[];
  onSelectStop: (stop: BusStop) => void;
}

export const DailyRoutineCard: React.FC<DailyRoutineCardProps> = ({
  stops,
  routes,
  onSelectStop,
}) => {
  const { routine, saveRoutine, clearRoutine } = useDailyRoutine();
  const [isEditing, setIsEditing] = useState(false);
  const [stopCode, setStopCode] = useState(routine?.originStopCode || '');
  const [lineName, setLineName] = useState(routine?.targetLine || '');
  const [routineName, setRoutineName] = useState(routine?.name || 'Mi Trayecto Diario');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedStop = stops.find(s => s.code === stopCode);
    if (!matchedStop || !lineName) return;

    saveRoutine({
      name: routineName,
      originStopCode: stopCode,
      originStopName: matchedStop.name,
      targetLine: lineName,
      timeHour: 8,
      timeMinute: 0,
      enabled: true,
    });
    setIsEditing(false);
  };

  if (!routine && !isEditing) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center flex-shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Modo Rutina Diario</h4>
            <p className="text-xs text-slate-400">Configura tu trayecto habitual (casa ↔ trabajo o uni) para verlo al instante.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors shadow-md shadow-teal-700/30 cursor-pointer flex-shrink-0"
        >
          Configurar
        </button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h4 className="font-bold text-white text-sm">Configurar Rutina Diaria</h4>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label htmlFor="routine-name-input" className="block text-xs text-slate-400 mb-1">Nombre</label>
            <input
              id="routine-name-input"
              type="text"
              value={routineName}
              onChange={e => setRoutineName(e.target.value)}
              placeholder="Ej. Ir al Trabajo / Universidad"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label htmlFor="routine-stop-select" className="block text-xs text-slate-400 mb-1">Parada de Inicio</label>
            <select
              id="routine-stop-select"
              value={stopCode}
              onChange={e => setStopCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
            >
              <option value="">Selecciona parada...</option>
              {stops.map(s => (
                <option key={s.code} value={s.code}>
                  #{s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="routine-line-select" className="block text-xs text-slate-400 mb-1">Línea habitual</label>
            <select
              id="routine-line-select"
              value={lineName}
              onChange={e => setLineName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
            >
              <option value="">Selecciona línea...</option>
              {routes.map(r => (
                <option key={r.id} value={r.shortName}>
                  Línea {r.shortName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors cursor-pointer"
        >
          Guardar Mi Rutina
        </button>
      </form>
    );
  }

  const routineStop = stops.find(s => s.code === routine?.originStopCode);

  return (
    <div className="bg-gradient-to-r from-teal-950/70 to-slate-900 border border-teal-500/30 rounded-3xl p-5 shadow-xl flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center flex-shrink-0">
          <CalendarClock className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
              {routine?.name}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-mono font-bold text-slate-300">
              Línea {routine?.targetLine}
            </span>
          </div>
          <p className="font-bold text-white text-sm truncate mt-0.5">
            Parada #{routine?.originStopCode} {routine?.originStopName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {routineStop && (
          <button
            type="button"
            onClick={() => onSelectStop(routineStop)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-teal-700/30"
          >
            <span>Ver tiempos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 transition-colors cursor-pointer"
          aria-label="Editar rutina"
        >
          <Settings2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={clearRoutine}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 bg-slate-800 transition-colors cursor-pointer"
          aria-label="Eliminar rutina"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
