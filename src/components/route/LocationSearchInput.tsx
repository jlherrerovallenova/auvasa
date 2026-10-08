import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Locate, Loader2, Landmark, HeartPulse, ShoppingBag, GraduationCap, Trophy, Building2 } from 'lucide-react';
import type { BusStop } from '../../types/bus.ts';
import { searchLocations, type LocationItem } from '../../services/geocoding.ts';

interface LocationSearchInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: LocationItem | null;
  stops: BusStop[];
  onSelect: (item: LocationItem) => void;
  onClear: () => void;
  onRequestMyLocation?: () => void;
  hasGpsButton?: boolean;
  disabled?: boolean;
}

function getCategoryIcon(type: LocationItem['type'], category?: string) {
  if (type === 'stop') {
    return <span className="w-5 h-5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-black text-[10px] flex items-center justify-center shrink-0">BUS</span>;
  }
  if (type === 'gps') {
    return <Locate className="w-4 h-4 text-emerald-500 shrink-0" />;
  }

  switch (category) {
    case 'hospital':
      return <HeartPulse className="w-4 h-4 text-rose-500 shrink-0" />;
    case 'comercial':
      return <ShoppingBag className="w-4 h-4 text-amber-500 shrink-0" />;
    case 'universidad':
      return <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />;
    case 'deporte':
      return <Trophy className="w-4 h-4 text-orange-500 shrink-0" />;
    case 'servicios':
      return <Building2 className="w-4 h-4 text-blue-500 shrink-0" />;
    case 'monumento':
      return <Landmark className="w-4 h-4 text-purple-500 shrink-0" />;
    default:
      return <MapPin className="w-4 h-4 text-slate-400 shrink-0" />;
  }
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  id,
  label,
  placeholder,
  value,
  stops,
  onSelect,
  onClear,
  onRequestMyLocation,
  hasGpsButton = false,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState(value ? value.name : '');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setInputText(value ? value.name : '');
  }

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (text.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setIsOpen(true);
    setLoading(true);

    debounceRef.current = window.setTimeout(async () => {
      try {
        const found = await searchLocations(text, stops);
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const handleSelectItem = (item: LocationItem) => {
    onSelect(item);
    setInputText(item.name);
    setIsOpen(false);
  };

  const handleClearClick = () => {
    setInputText('');
    onClear();
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>

      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-teal-600 dark:text-teal-400" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          id={id}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputText.trim().length > 0 && results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="w-full pl-10 pr-20 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-colors"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {inputText && (
            <button
              type="button"
              onClick={handleClearClick}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Borrar texto"
              aria-label="Borrar texto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {hasGpsButton && onRequestMyLocation && (
            <button
              type="button"
              onClick={onRequestMyLocation}
              className="p-1.5 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-xl transition-colors cursor-pointer"
              title="Usar mi ubicación actual"
              aria-label="Usar mi ubicación actual"
            >
              <Locate className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-1.5 divide-y divide-slate-100 dark:divide-slate-800/60 animate-in fade-in">
          {results.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectItem(item)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-start gap-2.5 transition-colors cursor-pointer"
            >
              <div className="mt-0.5">{getCategoryIcon(item.type, item.category)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {item.name}
                </p>
                {item.secondaryText && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {item.secondaryText}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
