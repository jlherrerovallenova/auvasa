import React from 'react';
import { Navigation, MapPin, Footprints, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import type { BusStop } from '../types/bus.ts';

interface NearbyStopsProps {
  nearbyStops: BusStop[];
  hasLocation: boolean;
  loadingLocation: boolean;
  locationError: string | null;
  onRequestLocation: () => void;
  onSelectStop: (stop: BusStop) => void;
}

export const NearbyStops: React.FC<NearbyStopsProps> = ({
  nearbyStops,
  hasLocation,
  loadingLocation,
  locationError,
  onRequestLocation,
  onSelectStop,
}) => {
  if (!hasLocation) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/10">
          <Navigation className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Paradas más cercanas a ti</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-5 leading-relaxed">
          Activa la localización de tu dispositivo para ver automáticamente las paradas de Valladolid a las que puedes llegar caminando y sus autobuses en tiempo real.
        </p>

        {locationError && (
          <div className="mb-4 p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center justify-center gap-2 max-w-sm mx-auto">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{locationError}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onRequestLocation}
          disabled={loadingLocation}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-3 rounded-2xl transition-transform shadow-lg shadow-teal-700/30 active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {loadingLocation ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Detectando posición...</span>
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5" />
              <span>Localizar paradas cercanas</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-teal-400" />
          <h3 className="font-bold text-white text-base">Paradas a tu alrededor</h3>
        </div>
        <button
          type="button"
          onClick={onRequestLocation}
          className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
        >
          Actualizar GPS
        </button>
      </div>

      {nearbyStops.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-500" />
          <p className="text-sm font-medium">No se encontraron paradas en un radio de 2 km.</p>
          <p className="text-xs text-slate-500 mt-1">¿Estás fuera del término municipal de Valladolid?</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {nearbyStops.map(stop => (
            <button
              key={stop.code}
              type="button"
              onClick={() => onSelectStop(stop)}
              className="p-4 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/50 rounded-2xl text-left transition-colors group shadow-md cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-teal-400 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                    #{stop.code}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <Footprints className="w-3.5 h-3.5" />
                    <span>
                      {stop.distanceMeters}m • ~{stop.walkingMinutes} min
                    </span>
                  </div>
                </div>

                <h4 className="font-bold text-white text-sm group-hover:text-teal-300 transition-colors line-clamp-2">
                  {stop.name}
                </h4>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {stop.routes.slice(0, 5).map(r => (
                    <span
                      key={r}
                      className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {r}
                    </span>
                  ))}
                  {stop.routes.length > 5 && (
                    <span className="text-[10px] text-slate-500 self-center">
                      +{stop.routes.length - 5}
                    </span>
                  )}
                </div>

                <span className="text-xs font-semibold text-teal-400 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Ver tiempos
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
