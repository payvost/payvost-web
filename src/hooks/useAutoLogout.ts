'use client';

import { useEffect, useRef, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const INACTIVITY_LIMIT = 3 * 60 * 1000; // 3 minutes

export function useAutoLogout() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const logout = useCallback(() => {
    signOut(auth).then(() => {
      toast({
        title: "Session Expired",
        description: "You have been logged out due to inactivity for security reasons.",
        variant: "destructive"
      });
      router.push("/login");
    });
  }, [router, toast]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, INACTIVITY_LIMIT);
  }, [logout]);

  useEffect(() => {
    // Events that reset inactivity timer
    const events: (keyof WindowEventMap)[] = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

    const eventHandler = () => resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, eventHandler);
    });

    resetTimer(); // Start the timer on mount

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, eventHandler);
      });
    };
  }, [resetTimer]);

  return null; // This hook doesn't render anything
}
