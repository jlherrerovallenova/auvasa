import React from 'react';
import { AlertCircle, ExternalLink, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts.ts';

export const AlertsView: React.FC = () => {
  const { alerts, loading, refresh } = useAlerts();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-1 sm:pt-2">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Avisos e Incidencias AUVASA</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Información oficial en directo sobre la red de Valladolid</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold cursor-pointer disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {loading && alerts.length === 0 && (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-teal-500" />
          <p className="text-sm">Consultando avisos de la central AUVASA...</p>
        </div>
      )}

      {alerts.length === 0 && !loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-md dark:shadow-xl transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Servicio Operando con Normalidad</h4>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
            Actualmente no hay cortes de tráfico, desvíos ni incidencias relevantes registradas en la red de AUVASA.
          </p>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden transition-colors"
            >
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500" />

              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">{alert.header}</h4>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{alert.description}</p>

                  {alert.url && (
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold pt-1 transition-colors"
                    >
                      <span>Más información en auvasa.es</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
