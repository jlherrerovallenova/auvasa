import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Clock, AlertCircle, ChevronDown, Check, ArrowLeft } from 'lucide-react';
import type { BusStop, StopArrival } from '../../types/bus.ts';
import { useStopArrivals } from '../../hooks/useStopArrivals.ts';
import { calculateWalkingRadar } from '../../utils/walkingRadar.ts';

interface WatchArrivalRowProps {
  arr: StopArrival;
  allArrivals: StopArrival[];
  activeStop: BusStop | null;
  userLat: number | null;
  userLon: number | null;
}

const WATCH_RADAR_CONFIG = {
  relaxed: { cls: 'text-emerald-400 bg-emerald-950/60', text: '🟢 Llegas' },
  tight: { cls: 'text-amber-400 bg-amber-950/60 animate-pulse', text: '🟡 Apura' },
  at_stop: { cls: 'text-teal-400 bg-teal-950/60', text: '📍 En parada' },
  missed: { cls: 'text-rose-400 bg-rose-950/60', text: '🔴 No llegas' },
} as const;

const WatchRadarBadge: React.FC<{ status: 'relaxed' | 'tight' | 'missed' | 'at_stop' }> = ({ status }) => {
  const cfg = WATCH_RADAR_CONFIG[status] || WATCH_RADAR_CONFIG.missed;
  return (
    <span className={`text-[8px] font-bold px-1 rounded ${cfg.cls}`}>
      {cfg.text}
    </span>
  );
};

const WatchEtaBadge: React.FC<{
  isArriving: boolean;
  isRealtime: boolean;
  minutesRemaining: number;
}> = ({ isArriving, isRealtime, minutesRemaining }) => {
  if (isArriving) {
    return (
      <div className="px-2 py-1 rounded-xl font-black text-xs bg-emerald-500 text-black animate-pulse">
        LLEGANDO
      </div>
    );
  }

  const cls = isRealtime
    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30'
    : 'bg-amber-950/70 text-amber-300 border-amber-500/30';

  return (
    <div className={`px-2 py-1 rounded-xl font-black text-xs border ${cls}`}>
      {minutesRemaining}m
    </div>
  );
};

const WatchArrivalRow: React.FC<WatchArrivalRowProps> = ({
  arr,
  allArrivals,
  activeStop,
  userLat,
  userLon,
}) => {
  const isArriving = arr.minutesRemaining <= 0;
  const radar = activeStop
    ? calculateWalkingRadar(userLat, userLon, activeStop.lat, activeStop.lon, arr, allArrivals)
    : null;

  return (
    <div className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-2 shadow-sm">
      {/* Left: Line number badge and headsign */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm border border-white/20"
          style={{ backgroundColor: arr.routeColor || '#008075' }}
        >
          {arr.routeShortName}
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-bold text-[11px] text-white block truncate leading-tight">
            {arr.destination || `Línea ${arr.routeShortName}`}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            {arr.isRealtime ? (
              <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                GPS
              </span>
            ) : (
              <span className="text-[9px] text-amber-400 font-medium">
                {arr.exactTime}
              </span>
            )}
            {radar && <WatchRadarBadge status={radar.status} />}
          </div>
        </div>
      </div>

      {/* Right: ETA Badge */}
      <div className="text-right shrink-0">
        <WatchEtaBadge
          isArriving={isArriving}
          isRealtime={arr.isRealtime}
          minutesRemaining={arr.minutesRemaining}
        />
      </div>
    </div>
  );
};

interface WatchStopPickerProps {
  availableStops: BusStop[];
  activeStopCode: string;
  customCodeInput: string;
  onSelectStop: (code: string) => void;
  onClose: () => void;
  onDialDigit: (digit: string) => void;
  onDialClear: () => void;
  onDialSubmit: () => void;
}

const WatchStopPicker: React.FC<WatchStopPickerProps> = ({
  availableStops,
  activeStopCode,
  customCodeInput,
  onSelectStop,
  onClose,
  onDialDigit,
  onDialClear,
  onDialSubmit,
}) => {
  return (
    <div className="flex-1 flex flex-col space-y-2.5 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-300">Elige Parada:</span>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] text-teal-400 font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Volver</span>
        </button>
      </div>

      {/* Favorites & Quick Stops List */}
      <div className="space-y-1.5 max-h-[50dvh] overflow-y-auto">
        {availableStops.map(s => {
          const isSelected = s.code === activeStopCode;
          return (
            <button
              key={s.code}
              type="button"
              onClick={() => onSelectStop(s.code)}
              className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-left border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-teal-950/70 border-teal-500/60 text-white'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-850'
              }`}
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-black text-teal-400">#{s.code}</span>
                  <span className="text-[11px] font-bold truncate text-white">{s.name}</span>
                </div>
              </div>
              {isSelected && <Check className="w-4 h-4 text-teal-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Quick Dial Pad for Watch */}
      <div className="pt-2 border-t border-neutral-850">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-neutral-400 font-semibold">O teclea poste:</span>
          <span className="font-mono text-xs font-bold text-teal-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            {customCodeInput || '____'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map(key => (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (key === 'C') onDialClear();
                else if (key === 'OK') onDialSubmit();
                else onDialDigit(key);
              }}
              className="py-1.5 bg-neutral-900 active:bg-neutral-800 border border-neutral-800 text-white rounded-xl font-bold text-xs"
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface WatchCompanionViewProps {
  stops: BusStop[];
  stopMapByCode: Map<string, BusStop>;
  favoriteStops: string[];
  userLat: number | null;
  userLon: number | null;
  onExitWatchMode: () => void;
}

export const WatchCompanionView: React.FC<WatchCompanionViewProps> = ({
  stops,
  stopMapByCode,
  favoriteStops,
  userLat,
  userLon,
  onExitWatchMode,
}) => {
  // Parada por defecto: la primera favorita o una céntrica de Valladolid (ej. 550 o 554)
  const [activeStopCode, setActiveStopCode] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const stopParam = params.get('stop');
      if (stopParam && stopMapByCode.has(stopParam)) return stopParam;
    } catch {
      // ignore
    }
    return favoriteStops[0] || '554';
  });

  const [isChangingStop, setIsChangingStop] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [currentTimeStr, setCurrentTimeStr] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  // Reloj de muñeca en vivo
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTimeStr(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const activeStop = useMemo(() => {
    return stopMapByCode.get(activeStopCode) || stops[0] || null;
  }, [stopMapByCode, activeStopCode, stops]);

  const { data, loading, error, refresh } = useStopArrivals(activeStop?.code || null);

  const handleRefresh = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(35);
    }
    refresh();
  };

  const handleSelectStop = (code: string) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    setActiveStopCode(code);
    setIsChangingStop(false);
    setCustomCodeInput('');
  };

  const handleDialDigit = (digit: string) => {
    if (customCodeInput.length < 4) {
      setCustomCodeInput(prev => prev + digit);
    }
  };

  const handleDialSubmit = () => {
    if (customCodeInput && stopMapByCode.has(customCodeInput)) {
      handleSelectStop(customCodeInput);
    }
  };

  // Lista de paradas seleccionables en el reloj: favoritos primero, luego paradas populares
  const availableStops = useMemo(() => {
    const list: BusStop[] = [];
    for (const code of favoriteStops) {
      const s = stopMapByCode.get(code);
      if (s) list.push(s);
    }
    const defaults = ['554', '550', '998', '1276', '131'];
    for (const d of defaults) {
      if (!list.some(s => s.code === d)) {
        const s = stopMapByCode.get(d);
        if (s) list.push(s);
      }
    }
    return list;
  }, [favoriteStops, stopMapByCode]);

  return (
    <div className="bg-black text-white min-h-[100dvh] w-full max-w-sm mx-auto flex flex-col justify-between font-sans selection:bg-teal-500 overflow-x-hidden p-2.5 sm:p-3 select-none">
      {/* Watch Top Bar */}
      <header className="flex items-center justify-between border-b border-neutral-850 pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider text-teal-400">
            VallaBus Watch
          </span>
        </div>
        <div className="text-xs font-mono font-bold text-neutral-300">
          {currentTimeStr}
        </div>
      </header>

      {/* Main View or Stop Selection Screen */}
      {isChangingStop ? (
        <WatchStopPicker
          availableStops={availableStops}
          activeStopCode={activeStopCode}
          customCodeInput={customCodeInput}
          onSelectStop={handleSelectStop}
          onClose={() => setIsChangingStop(false)}
          onDialDigit={handleDialDigit}
          onDialClear={() => setCustomCodeInput('')}
          onDialSubmit={handleDialSubmit}
        />
      ) : (
        <div className="flex-1 flex flex-col space-y-2">
          {/* Active Stop Selector Banner */}
          {activeStop && (
            <button
              type="button"
              onClick={() => setIsChangingStop(true)}
              className="w-full p-2 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between gap-2 text-left active:bg-neutral-850 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-black text-teal-400 shrink-0">
                    #{activeStop.code}
                  </span>
                  <span className="font-bold text-xs text-white truncate block">
                    {activeStop.name}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            </button>
          )}

          {/* Arrivals List */}
          <div className="flex-1 space-y-1.5 overflow-y-auto min-h-[140px] max-h-[58dvh]">
            {loading && !data && (
              <div className="py-8 text-center text-neutral-400 space-y-2">
                <RefreshCw className="w-5 h-5 mx-auto animate-spin text-teal-400" />
                <p className="text-[11px] font-medium">Buscando autobuses...</p>
              </div>
            )}

            {error && (
              <div className="p-2.5 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span className="text-[10px] leading-tight flex-1">{error}</span>
              </div>
            )}

            {data && data.arrivals.length === 0 && (
              <div className="py-6 text-center text-neutral-400 bg-neutral-900/60 rounded-2xl border border-neutral-800/80 p-3">
                <Clock className="w-5 h-5 mx-auto mb-1 text-neutral-500" />
                <p className="text-[11px] font-semibold text-neutral-300">Sin autobuses ahora</p>
                <p className="text-[9px] text-neutral-500 mt-0.5">No hay salidas próximas para esta parada.</p>
              </div>
            )}

            {data && data.arrivals.map(arr => (
              <WatchArrivalRow
                key={`${arr.routeShortName}_${arr.timestamp}_${arr.exactTime}`}
                arr={arr}
                allArrivals={data.arrivals}
                activeStop={activeStop}
                userLat={userLat}
                userLon={userLon}
              />
            ))}
          </div>
        </div>
      )}

      {/* Watch Bottom Ergonomic Tap Actions */}
      <footer className="pt-2 mt-1 border-t border-neutral-850 flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="flex-1 py-2.5 px-3 rounded-2xl bg-teal-600 active:bg-teal-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>

        <button
          type="button"
          onClick={onExitWatchMode}
          className="p-2.5 rounded-2xl bg-neutral-900 active:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 text-[10px] font-bold"
          title="Salir a versión móvil completa"
        >
          Móvil
        </button>
      </footer>
    </div>
  );
};
