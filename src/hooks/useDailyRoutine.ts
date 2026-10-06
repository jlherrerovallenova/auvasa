import { useState, useEffect, useCallback } from 'react';

const ROUTINE_STORAGE_KEY = 'vallabus_daily_routine_v1';

export interface DailyRoutine {
  name: string;
  originStopCode: string;
  originStopName: string;
  targetLine: string;
  destinationName?: string;
  timeHour: number;
  timeMinute: number;
  enabled: boolean;
}

export function useDailyRoutine() {
  const [routine, setRoutine] = useState<DailyRoutine | null>(() => {
    try {
      const saved = localStorage.getItem(ROUTINE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (routine) {
        localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(routine));
      } else {
        localStorage.removeItem(ROUTINE_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [routine]);

  const saveRoutine = useCallback((newRoutine: DailyRoutine) => {
    setRoutine(newRoutine);
  }, []);

  const clearRoutine = useCallback(() => {
    setRoutine(null);
  }, []);

  return {
    routine,
    saveRoutine,
    clearRoutine,
  };
}
