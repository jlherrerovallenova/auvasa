import { useState, useEffect, useCallback, useRef } from 'react';
import type { BusStop } from '../types/bus.ts';
import { getDistanceMeters } from './useGeolocation.ts';

function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Melodic two-tone alert
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.0, now + 0.15); // A5
    osc.frequency.setValueAtTime(1174.66, now + 0.3); // D6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  } catch {
    // Audio context may be restricted before user gesture
  }
}

export function useDestinationAlarm() {
  const [targetStop, setTargetStop] = useState<BusStop | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isTriggered, setIsTriggered] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const cancelAlarm = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTargetStop(null);
    setDistanceMeters(null);
    setIsTriggered(false);
  }, []);

  const setAlarmForStop = useCallback((stop: BusStop) => {
    cancelAlarm();
    setTargetStop(stop);
    setIsTriggered(false);

    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const dist = getDistanceMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          stop.lat,
          stop.lon
        );
        setDistanceMeters(dist);

        // Alert threshold: within 350 meters
        if (dist <= 350) {
          setIsTriggered(true);
          playNotificationChime();
          if (navigator.vibrate) {
            navigator.vibrate([400, 200, 400, 200, 600]);
          }
        }
      },
      err => {
        console.warn('Geolocation alarm watch error:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 20000,
      }
    );
  }, [cancelAlarm]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    targetStop,
    distanceMeters,
    isTriggered,
    isActive: targetStop !== null,
    setAlarmForStop,
    cancelAlarm,
  };
}
