"use client";

import { useEffect, useRef } from 'react';

type UseAutoLogoutOptions = {
  timeoutMs?: number;
  onTimeout?: () => void;
  enabled?: boolean;
};

/**
 * useAutoLogout
 * - Listens for common user activity events and resets a timeout.
 * - When the timeout elapses it calls `onTimeout`.
 *
 * Default timeout is 3 minutes (180_000 ms).
 */
export function useAutoLogout({ timeoutMs = 180_000, onTimeout, enabled = true }: UseAutoLogoutOptions = {}) {
  const timerRef = useRef<number | null>(null);
  const cbRef = useRef<(() => void) | undefined>(onTimeout);

  useEffect(() => {
    cbRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!enabled) return;

    const resetTimer = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        cbRef.current && cbRef.current();
      }, timeoutMs) as unknown as number;
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handler = () => resetTimer();

    // Attach listeners
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));

    // Start timer
    resetTimer();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [timeoutMs, enabled]);
}

export default useAutoLogout;
