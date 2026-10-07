import React from 'react';
import { ChevronUp, BellRing, Gauge, Flag } from 'lucide-react';
import type { OnboardTrip, OnboardMetrics } from '../../types/onboard.ts';

interface OnboardMiniBarProps {
  trip: OnboardTrip | null;
  metrics: OnboardMetrics;
  onExpand: () => void;
}

const MiniBarStatusBadge: React.FC<{ isReached: boolean; isApproaching: boolean }> = ({
  isReached,
  isApproaching,
}) => {
  if (isReached) {
    return (
      <span className="flex items-center gap-1 text-white">
        <Flag className="w-3 h-3" />
        <span>¡Has llegado!</span>
      </span>
    );
  }
  if (isApproaching) {
    return (
      <span className="flex items-center gap-1 text-white">
        <BellRing className="w-3 h-3 animate-bounce" />
        <span>¡Próxima parada es tu destino!</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-teal-400">
      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
      <span>A Bordo • Próxima</span>
    </span>
  );
};

export const OnboardMiniBar: React.FC<OnboardMiniBarProps> = ({
  trip,
  metrics,
  onExpand,
}) => {
  if (!trip) return null;

  const currentStop = trip.stops[trip.currentStopIndex] || null;
  const isApproaching = metrics.isApproachingDestination && !metrics.isDestinationReached;
  const isReached = metrics.isDestinationReached;

  const getBarColorClass = () => {
    if (isReached) {
      return 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-600/40';
    }
    if (isApproaching) {
      return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-orange-400 shadow-orange-500/40 animate-pulse';
    }
    return 'bg-slate-900/95 dark:bg-slate-850/95 text-white border-slate-700/80 shadow-slate-950/60';
  };

  const stopLabel = isReached
    ? trip.destinationStop?.name
    : isApproaching
    ? trip.destinationStop?.name
    : currentStop?.name || 'Avanzando...';

  return (
    <button
      type="button"
      aria-label="Abrir panel de viaje en curso"
      onClick={onExpand}
      className={`fixed bottom-[4.5rem] md:bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-40 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-md cursor-pointer transition-colors border text-left transform hover:-translate-y-0.5 active:scale-99 animate-in slide-in-from-bottom duration-300 ${getBarColorClass()}`}
    >
      <div className="flex items-center justify-between gap-2.5 w-full">
        {/* Left: Line chip */}
        <span
          className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm"
          style={{ backgroundColor: trip.route.color, color: trip.route.textColor }}
        >
          {trip.route.shortName}
        </span>

        {/* Center: Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider opacity-85">
            <MiniBarStatusBadge isReached={isReached} isApproaching={isApproaching} />
          </div>

          <p className="text-xs font-black truncate leading-tight mt-0.5">
            {stopLabel}
          </p>
        </div>

        {/* Right: Metrics & Expand Icon */}
        <div className="flex items-center gap-2 shrink-0">
          {metrics.currentSpeedKmh !== null && metrics.currentSpeedKmh > 0 && !isApproaching && (
            <span className="text-[10px] font-mono font-bold bg-white/10 px-1.5 py-0.5 rounded-md flex items-center gap-1">
              <Gauge className="w-3 h-3 text-teal-300" />
              <span>{metrics.currentSpeedKmh}k</span>
            </span>
          )}

          {trip.destinationStop && !isReached && (
            <span className="text-[11px] font-bold bg-white/15 px-2 py-0.5 rounded-lg">
              {metrics.stopsRemaining} {metrics.stopsRemaining === 1 ? 'parada' : 'paradas'}
            </span>
          )}

          <div className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronUp className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </button>
  );
};
