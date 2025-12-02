"use client";

import { useEffect, useRef, useState } from 'react';

type UseAutoLogoutOptions = {
  timeoutMs?: number;
  onTimeout?: () => void;
  enabled?: boolean;
};

/**
 * useAutoLogout
 * - Listens for common user activity events and resets a timeout.
 * - When the timeout elapses it calls `onTimeout`.
 * - Pauses timer when offline and resumes when online to ensure effective logout.
 *
 * Default timeout is 3 minutes (180_000 ms).
 */
export function useAutoLogout({ timeoutMs = 180_000, onTimeout, enabled = true }: UseAutoLogoutOptions = {}) {
  const timerRef = useRef<number | null>(null);
  const cbRef = useRef<(() => void) | undefined>(onTimeout);
  const startTimeRef = useRef<number | null>(null);
  const remainingTimeRef = useRef<number>(timeoutMs);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    cbRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!enabled) return;

    const resetTimer = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      remainingTimeRef.current = timeoutMs;
      startTimeRef.current = Date.now();
      
      timerRef.current = window.setTimeout(() => {
        cbRef.current && cbRef.current();
      }, timeoutMs) as unknown as number;
    };

    const pauseTimer = () => {
      if (timerRef.current && startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
        startTimeRef.current = null;
      }
    };

    const resumeTimer = () => {
      if (remainingTimeRef.current > 0 && !timerRef.current) {
        startTimeRef.current = Date.now();
        timerRef.current = window.setTimeout(() => {
          cbRef.current && cbRef.current();
        }, remainingTimeRef.current) as unknown as number;
      } else if (remainingTimeRef.current <= 0) {
        // Time already expired while offline, trigger logout immediately
        cbRef.current && cbRef.current();
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      resumeTimer();
    };

    const handleOffline = () => {
      setIsOnline(false);
      pauseTimer();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handler = () => {
      if (isOnline) {
        resetTimer();
      }
    };

    // Listen to online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Attach activity listeners
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));

    // Start timer if online
    if (isOnline) {
      resetTimer();
    }

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [timeoutMs, enabled, isOnline]);
}

export default useAutoLogout;
