import React from 'react';
import { Sparkles } from 'lucide-react';
import type { LocationItem } from '../../services/geocoding.ts';
import { VALLADOLID_POIS } from '../../utils/valladolidPois.ts';

interface QuickDestinationChipsProps {
  onSelect: (item: LocationItem) => void;
}

const FEATURED_POI_IDS = [
  'poi_hosp_rio_hortega',
  'poi_hosp_clinico',
  'poi_estacion_campo_grande',
  'poi_cc_vallsur',
  'poi_plaza_mayor',
  'poi_campus_miguel_delibes',
  'poi_estadio_zorrilla',
  'poi_cc_rio_shopping',
];

export const QuickDestinationChips: React.FC<QuickDestinationChipsProps> = ({ onSelect }) => {
  const featured = FEATURED_POI_IDS.map(id => VALLADOLID_POIS.find(p => p.id === id)).filter(
    (p): p is (typeof VALLADOLID_POIS)[number] => !!p
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Destinos frecuentes en Valladolid:</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none -mx-1 px-1">
        {featured.map(poi => (
          <button
            key={poi.id}
            type="button"
            onClick={() => {
              onSelect({
                id: poi.id,
                name: poi.shortName,
                secondaryText: poi.address,
                lat: poi.lat,
                lon: poi.lon,
                type: 'poi',
                category: poi.category,
              });
            }}
            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer hover:border-teal-500/40"
          >
            {poi.shortName}
          </button>
        ))}
      </div>
    </div>
  );
};
