import React from 'react';
import {
  ChevronDown,
  Volume2,
  VolumeX,
  Bus,
  Gauge,
  MapPin,
  Clock,
  Bell,
  BellRing,
  Flag,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import type { OnboardTrip, OnboardMetrics } from '../../types/onboard.ts';
import type { RouteStop } from '../../types/bus.ts';

interface OnboardDashboardModalProps {
  isOpen: boolean;
  onClose: () => void; // minimize
  onEndTrip: () => void;
  trip: OnboardTrip | null;
  metrics: OnboardMetrics;
  isBellActive: boolean;
  onRingBell: () => void;
  onAdvanceStop: () => void;
  onRewindStop: () => void;
  onToggleMute: () => void;
  onSelectDestination: (stop: RouteStop) => void;
}

// 1. Header
const OnboardDashboardHeader: React.FC<{
  trip: OnboardTrip;
  onToggleMute: () => void;
  onClose: () => void;
  onEndTrip: () => void;
}> = ({ trip, onToggleMute, onClose, onEndTrip }) => (
  <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-850/95 flex items-center justify-between gap-2 shrink-0">
    <div className="flex items-center gap-2.5 min-w-0 flex-1">
      <span
        className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md shrink-0 tracking-tight"
        style={{ backgroundColor: trip.route.color, color: trip.route.textColor }}
      >
        {trip.route.shortName}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>En ruta</span>
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
            → {trip.directionHeadsign}
          </span>
        </div>
        <h3 id="onboard-dashboard-title" className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
          Copiloto A Bordo
        </h3>
      </div>
    </div>

    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={onToggleMute}
        className={`p-2 rounded-xl transition-colors cursor-pointer ${
          trip.isMuted
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400'
            : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
        }`}
        title={trip.isMuted ? 'Activar sonido de avisos' : 'Silenciar avisos'}
        aria-label={trip.isMuted ? 'Activar sonido de avisos' : 'Silenciar avisos'}
      >
        {trip.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      <button
        type="button"
        onClick={onClose}
        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="Minimizar panel a barra inferior"
        aria-label="Minimizar panel"
      >
        <ChevronDown className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={onEndTrip}
        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-colors cursor-pointer"
        title="Bajarme del bus y finalizar viaje"
        aria-label="Finalizar viaje"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// 2. Hero Banner
const OnboardHeroBanner: React.FC<{
  trip: OnboardTrip;
  metrics: OnboardMetrics;
  onRingBell: () => void;
  onEndTrip: () => void;
}> = ({ trip, metrics, onRingBell, onEndTrip }) => {
  const currentStop = trip.stops[trip.currentStopIndex] || null;
  const isApproaching = metrics.isApproachingDestination && !metrics.isDestinationReached;
  const isReached = metrics.isDestinationReached;

  if (isReached) {
    return (
      <div className="p-4 rounded-3xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 text-center space-y-2 animate-bounce">
        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-white" />
          <span className="font-black text-sm tracking-wide uppercase">¡HAS LLEGADO A TU PARADA!</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black">{trip.destinationStop?.name}</h2>
        <p className="text-xs text-emerald-100 font-medium">
          Has alcanzado tu destino. ¡Esperamos que hayas tenido un buen viaje!
        </p>
        <button
          type="button"
          onClick={onEndTrip}
          className="mt-2 w-full py-2.5 px-4 bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs rounded-xl shadow transition-colors cursor-pointer"
        >
          He bajado del autobús • Finalizar
        </button>
      </div>
    );
  }

  if (isApproaching) {
    return (
      <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-orange-500/30 space-y-2.5 animate-pulse">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-lg">
            <BellRing className="w-4 h-4 animate-bounce" />
            <span>¡ATENCIÓN! PRÓXIMA PARADA: TU DESTINO</span>
          </span>
          <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-lg">
            1 parada
          </span>
        </div>
        <div>
          <span className="text-[11px] font-mono font-bold opacity-80">
            #{trip.destinationStop?.stopCode}
          </span>
          <h2 className="text-xl sm:text-2xl font-black leading-tight">
            {trip.destinationStop?.name}
          </h2>
        </div>
        <div className="pt-1 flex items-center justify-between gap-2 border-t border-white/20 text-xs font-semibold">
          <span>Toca el timbre del bus para solicitar parada</span>
          <button
            type="button"
            onClick={onRingBell}
            className="px-3 py-1.5 rounded-xl bg-white text-orange-600 font-black text-xs hover:bg-orange-50 transition-colors shadow-sm cursor-pointer"
          >
            🔔 Tocar Timbre
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1 relative overflow-hidden">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
        <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
          <Bus className="w-4 h-4" />
          <span>PRÓXIMA PARADA</span>
        </span>
        {currentStop && (
          <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-teal-700 dark:text-teal-400">
            #{currentStop.stopCode}
          </span>
        )}
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">
        {currentStop?.name || 'Avanzando en ruta...'}
      </h2>

      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1 font-medium">
        {metrics.distanceToNextMeters !== null && (
          <span>a ~{metrics.distanceToNextMeters} m</span>
        )}
        <span>•</span>
        <span>AUVASA Valladolid</span>
      </div>
    </div>
  );
};

// 3. Metrics Ribbon
const OnboardMetricsRibbon: React.FC<{
  trip: OnboardTrip;
  metrics: OnboardMetrics;
}> = ({ trip, metrics }) => (
  <div className="px-4 sm:px-5 pb-3 grid grid-cols-3 gap-2 shrink-0">
    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
        <Gauge className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
        <span>Velocidad</span>
      </div>
      <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
        {metrics.currentSpeedKmh !== null && metrics.currentSpeedKmh > 0 ? (
          <>
            {metrics.currentSpeedKmh} <span className="text-[10px] font-normal text-slate-400">km/h</span>
          </>
        ) : (
          <span className="text-xs text-slate-400">-- km/h</span>
        )}
      </div>
    </div>

    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
        <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
        <span>Restantes</span>
      </div>
      <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
        {trip.destinationStop ? (
          <>
            {metrics.stopsRemaining}{' '}
            <span className="text-[10px] font-normal text-slate-400">
              {metrics.stopsRemaining === 1 ? 'parada' : 'paradas'}
            </span>
          </>
        ) : (
          <span className="text-xs text-slate-400">Sin destino</span>
        )}
      </div>
    </div>

    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
        <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
        <span>Tiempo</span>
      </div>
      <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
        {trip.destinationStop ? (
          <>
            ~{metrics.estimatedMinutesRemaining}{' '}
            <span className="text-[10px] font-normal text-slate-400">min</span>
          </>
        ) : (
          <span className="text-xs text-slate-400">En ruta</span>
        )}
      </div>
    </div>
  </div>
);

// 4. Stops Timeline
const OnboardStopsTimeline: React.FC<{
  trip: OnboardTrip;
  onSelectDestination: (stop: RouteStop) => void;
}> = ({ trip, onSelectDestination }) => (
  <div className="px-4 sm:px-5 flex-1 overflow-y-auto space-y-1.5 min-h-0 border-t border-slate-200 dark:border-slate-800/80 pt-3">
    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold mb-2">
      <span>Recorrido de la línea</span>
      <span className="text-[11px] font-normal text-slate-400">Toca una parada para fijar destino</span>
    </div>

    <div className="space-y-1 relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {trip.stops.map((stop, idx) => {
        const isPast = idx < trip.currentStopIndex;
        const isCurrent = idx === trip.currentStopIndex;
        const isDest = trip.destinationStop?.stopCode === stop.stopCode;

        let itemStyle = 'hover:bg-slate-100 dark:hover:bg-slate-800/60';
        if (isCurrent) {
          itemStyle = 'bg-teal-500/15 border border-teal-500/30 shadow-sm';
        } else if (isDest) {
          itemStyle = 'bg-amber-500/15 border border-amber-500/30';
        } else if (isPast) {
          itemStyle = 'opacity-40 hover:opacity-75';
        }

        let bulletStyle = 'bg-white dark:bg-slate-900 border-slate-400 dark:border-slate-600';
        if (isCurrent) {
          bulletStyle = 'bg-teal-500 border-white ring-4 ring-teal-500/30 scale-125';
        } else if (isDest) {
          bulletStyle = 'bg-amber-500 border-white ring-2 ring-amber-500/30';
        } else if (isPast) {
          bulletStyle = 'bg-slate-400 border-slate-300 dark:border-slate-700';
        }

        return (
          <button
            key={stop.stopCode}
            type="button"
            onClick={() => onSelectDestination(stop)}
            className={`w-full text-left relative p-2 rounded-xl transition-colors flex items-center justify-between gap-2 cursor-pointer group ${itemStyle}`}
          >
            <div
              className={`absolute -left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${bulletStyle}`}
            />

            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 font-bold shrink-0">
                #{stop.stopCode}
              </span>
              <span
                className={`text-xs truncate ${
                  isCurrent
                    ? 'font-black text-teal-700 dark:text-teal-300'
                    : isDest
                    ? 'font-black text-amber-600 dark:text-amber-400'
                    : 'font-medium text-slate-800 dark:text-slate-200'
                }`}
              >
                {stop.name}
              </span>
            </div>

            <div className="shrink-0 flex items-center gap-1">
              {isCurrent && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white flex items-center gap-1">
                  <Bus className="w-3 h-3" />
                  <span>Aquí</span>
                </span>
              )}
              {isDest && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1">
                  <Flag className="w-3 h-3" />
                  <span>Destino</span>
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

// 5. Main Component
export const OnboardDashboardModal: React.FC<OnboardDashboardModalProps> = ({
  isOpen,
  onClose,
  onEndTrip,
  trip,
  metrics,
  isBellActive,
  onRingBell,
  onAdvanceStop,
  onRewindStop,
  onToggleMute,
  onSelectDestination,
}) => {
  if (!isOpen || !trip) return null;

  return (
    <dialog
      open
      aria-labelledby="onboard-dashboard-title"
      className="fixed inset-0 z-50 m-0 p-0 w-full h-full max-w-none max-h-none bg-black/75 dark:bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center border-none text-slate-800 dark:text-slate-100 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[94dvh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        <OnboardDashboardHeader
          trip={trip}
          onToggleMute={onToggleMute}
          onClose={onClose}
          onEndTrip={onEndTrip}
        />

        <div className="p-4 sm:p-5 shrink-0 transition-colors">
          <OnboardHeroBanner
            trip={trip}
            metrics={metrics}
            onRingBell={onRingBell}
            onEndTrip={onEndTrip}
          />
        </div>

        <OnboardMetricsRibbon trip={trip} metrics={metrics} />

        {/* Physical-style Stop Request Bell */}
        <div className="px-4 sm:px-5 pb-3 shrink-0">
          <button
            type="button"
            onClick={onRingBell}
            className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors transform active:scale-98 cursor-pointer shadow-lg ${
              isBellActive
                ? 'bg-amber-400 text-slate-950 shadow-amber-400/50 ring-4 ring-amber-300'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
            }`}
          >
            <Bell className={`w-5 h-5 ${isBellActive ? 'animate-bounce' : ''}`} />
            <span>
              {isBellActive ? '🔔 ¡PARADA SOLICITADA! (TIMBRE SONANDO)' : 'SOLICITAR PARADA (TIMBRE DEL BUS)'}
            </span>
          </button>
        </div>

        <OnboardStopsTimeline trip={trip} onSelectDestination={onSelectDestination} />

        {/* Footer: Manual stop adjust & finish */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 flex items-center justify-between gap-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))] shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRewindStop}
              disabled={trip.currentStopIndex <= 0}
              className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors disabled:opacity-30 cursor-pointer"
              title="Parada anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 px-1">
              {trip.currentStopIndex + 1}/{trip.stops.length}
            </span>
            <button
              type="button"
              onClick={onAdvanceStop}
              disabled={trip.currentStopIndex >= trip.stops.length - 1}
              className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors disabled:opacity-30 cursor-pointer"
              title="Siguiente parada"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onEndTrip}
            className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors border border-slate-300 dark:border-slate-700 cursor-pointer"
          >
            Bajarme del bus
          </button>
        </div>
      </div>
    </dialog>
  );
};
