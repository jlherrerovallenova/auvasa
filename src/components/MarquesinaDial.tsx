import React, { useState, useMemo } from 'react';
import { Delete, Search, Hash, ArrowRight } from 'lucide-react';
import type { BusStop } from '../types/bus.ts';

interface MarquesinaDialProps {
  stops: BusStop[];
  onSelectStop: (stop: BusStop) => void;
}

export const MarquesinaDial: React.FC<MarquesinaDialProps> = ({
  stops,
  onSelectStop,
}) => {
  const [code, setCode] = useState('');

  const handleDigit = (digit: string) => {
    if (code.length < 5) {
      setCode(prev => prev + digit);
    }
  };

  const handleDelete = () => {
    setCode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setCode('');
  };

  // Matched stops based on entered code
  const matchedStops = useMemo(() => {
    if (!code) return [];
    return stops.filter(s => s.code.startsWith(code)).slice(0, 4);
  }, [code, stops]);

  const exactMatch = useMemo(() => {
    return stops.find(s => s.code === code) || null;
  }, [code, stops]);

  const handleConsultar = () => {
    if (exactMatch) {
      onSelectStop(exactMatch);
      setCode('');
    } else if (matchedStops.length > 0) {
      onSelectStop(matchedStops[0]);
      setCode('');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl max-w-md mx-auto">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold mb-2">
          <Hash className="w-3.5 h-3.5" />
          <span>Modo Marquesina Rápida</span>
        </div>
        <h3 className="text-lg font-bold text-white">Marca el Código de Parada</h3>
        <p className="text-xs text-slate-400">
          Usa el teclado numérico para consultar los tiempos de tu poste o marquesina con una sola mano.
        </p>
      </div>

      {/* Code Display Screen */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-4 flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono text-xl font-bold">#</span>
          <span className="font-mono text-3xl font-black tracking-widest text-teal-300 min-h-[36px]">
            {code || <span className="text-slate-600 animate-pulse">____</span>}
          </span>
        </div>

        {code && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800 transition-colors cursor-pointer"
          >
            Borrar todo
          </button>
        )}
      </div>

      {/* Matching stops preview pill */}
      {matchedStops.length > 0 && (
        <div className="mb-4 space-y-1.5 animate-in fade-in">
          {matchedStops.map(s => (
            <button
              key={s.code}
              type="button"
              onClick={() => {
                onSelectStop(s);
                setCode('');
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-xs font-bold text-teal-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                  #{s.code}
                </span>
                <span className="text-xs font-semibold text-white truncate">{s.name}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Large Touch Keypad (3x4 Grid) */}
      <div className="grid grid-cols-3 gap-2.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-750 active:bg-slate-700 border border-slate-700/80 text-white font-mono font-bold text-2xl transition-colors shadow-md active:scale-95 cursor-pointer flex items-center justify-center"
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          onClick={handleDelete}
          className="h-14 rounded-2xl bg-slate-850 hover:bg-slate-800 active:bg-slate-750 border border-slate-700/80 text-rose-400 font-bold transition-colors shadow-md active:scale-95 cursor-pointer flex items-center justify-center"
          aria-label="Borrar último dígito"
        >
          <Delete className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-750 active:bg-slate-700 border border-slate-700/80 text-white font-mono font-bold text-2xl transition-colors shadow-md active:scale-95 cursor-pointer flex items-center justify-center"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleConsultar}
          disabled={!code}
          className="h-14 rounded-2xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors shadow-lg shadow-teal-700/30 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Search className="w-4 h-4" />
          <span>Ver</span>
        </button>
      </div>
    </div>
  );
};
