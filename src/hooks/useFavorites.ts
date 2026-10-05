import { useState, useEffect, useCallback } from 'react';

const FAVORITES_STOPS_KEY = 'vallabus_fav_stops';
const FAVORITES_LINES_KEY = 'vallabus_fav_lines';

export function useFavorites() {
  const [favoriteStops, setFavoriteStops] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STOPS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favoriteLines, setFavoriteLines] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_LINES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STOPS_KEY, JSON.stringify(favoriteStops));
    } catch {
      // localStorage error fallback
    }
  }, [favoriteStops]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_LINES_KEY, JSON.stringify(favoriteLines));
    } catch {
      // localStorage error fallback
    }
  }, [favoriteLines]);

  const toggleFavoriteStop = useCallback((stopCode: string) => {
    setFavoriteStops(prev =>
      prev.includes(stopCode) ? prev.filter(c => c !== stopCode) : [...prev, stopCode]
    );
  }, []);

  const toggleFavoriteLine = useCallback((lineId: string) => {
    setFavoriteLines(prev =>
      prev.includes(lineId) ? prev.filter(id => id !== lineId) : [...prev, lineId]
    );
  }, []);

  const isFavoriteStop = useCallback((stopCode: string) => {
    return favoriteStops.includes(stopCode);
  }, [favoriteStops]);

  const isFavoriteLine = useCallback((lineId: string) => {
    return favoriteLines.includes(lineId);
  }, [favoriteLines]);

  return {
    favoriteStops,
    favoriteLines,
    toggleFavoriteStop,
    toggleFavoriteLine,
    isFavoriteStop,
    isFavoriteLine,
  };
}
