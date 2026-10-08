import React, { useState } from 'react';
import { Footprints, Clock, Share2, Check, Radio, ChevronDown, ChevronUp } from 'lucide-react';
import type { RoutePlanResult } from '../../utils/routePlanner.ts';
import type { BusStop } from '../../types/bus.ts';

interface RoutePlanCardProps {
  plan: RoutePlanResult;
  index: number;
  onSelectStop?: (stop: BusStop) => void;
  stopMapByCode: Map<string, BusStop>;
}

export const RoutePlanCard: React.FC<RoutePlanCardProps> = ({
  plan,
  index,
  onSelectStop,
  stopMapByCode,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopy = () => {
    const textLines = [
      `📍 Ruta de ${plan.origin.name} a ${plan.destination.name}`,
      `⏱️ Duración: ~${plan.totalMinutes} min (Llegada aprox: ${plan.arrivalTime})`,
      ...plan.steps.map((s, idx) => `${idx + 1}. ${s.description}`),
    ];
    navigator.clipboard.writeText(textLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/30">
            {index === 0 ? 'Opción 1 • Más rápida' : `Opción ${index + 1}`}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {plan.isDirectWalkOnly
              ? 'Solo a pie'
              : plan.transfersCount === 0
              ? 'Autobús directo'
              : '1 trasbordo'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-base">
          <Clock className="w-4 h-4" />
          <span>~{plan.totalMinutes} min</span>
        </div>
      </div>

      {/* Visual Journey Overview Ribbon */}
      <div className="flex items-center gap-1.5 flex-wrap p-2.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">
          {plan.departureTime} → {plan.arrivalTime}
        </span>

        {plan.steps.map((step, sIdx) => {
          const stepKey = `${plan.id}_seg_${sIdx}`;
          return (
            <React.Fragment key={stepKey}>
              {sIdx > 0 && <span className="text-slate-400 text-xs">›</span>}

              {step.type === 'walk' ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
                  <Footprints className="w-3 h-3" />
                  <span>{step.estimatedMinutes}m</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-bold text-xs shadow-sm"
                  style={{
                    backgroundColor: step.lineColor || '#008075',
                    color: step.lineTextColor || '#FFFFFF',
                  }}
                >
                  <span>{step.lineShortName}</span>
                  <span className="text-[10px] font-normal opacity-90">{step.estimatedMinutes}m</span>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {plan.totalWalkMeters > 0 && (
          <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Footprints className="w-3 h-3" />
            <span>{plan.totalWalkMeters} m a pie</span>
          </span>
        )}
      </div>

      {/* Toggle steps visibility */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
        >
          <span>{isExpanded ? 'Ocultar itinerario paso a paso' : 'Ver itinerario paso a paso'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title="Copiar ruta al portapapeles"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? '¡Copiado!' : 'Compartir'}</span>
        </button>
      </div>

      {/* Step-by-Step Timeline */}
      {isExpanded && (
        <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
          {plan.steps.map((step, sIdx) => {
            const stepKey = `${plan.id}_step_${sIdx}`;
            return (
              <div key={stepKey} className="flex items-start gap-3">
                {step.type === 'bus' ? (
                  <div
                    className="w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-md"
                    style={{
                      backgroundColor: step.lineColor || '#008075',
                      color: step.lineTextColor || '#FFF',
                    }}
                  >
                    {step.lineShortName}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                    <Footprints className="w-4 h-4" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                    {step.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {step.fromStopCode && (
                      <button
                        type="button"
                        onClick={() => {
                          const stop = stopMapByCode.get(step.fromStopCode!);
                          if (stop && onSelectStop) onSelectStop(stop);
                        }}
                        className="text-teal-600 dark:text-teal-400 hover:underline cursor-pointer font-medium"
                      >
                        Ver parada #{step.fromStopCode}
                      </button>
                    )}

                    {step.stopsCount && (
                      <span className="font-mono text-slate-400 dark:text-slate-500">
                        • {step.stopsCount} paradas (~{step.estimatedMinutes} min)
                      </span>
                    )}

                    {step.isRealtime && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                        <Radio className="w-2.5 h-2.5 animate-pulse" />
                        Bus en vivo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
