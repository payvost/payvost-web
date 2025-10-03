
"use client";

import { useEffect, useRef, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";

const INACTIVITY_LIMIT = 3 * 60 * 1000; // 3 minutes

export function useAutoLogout() {
  const { user } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const logout = useCallback(() => {
    signOut(auth).then(() => {
      toast({
        title: "Session Expired",
        description: "You have been logged out due to inactivity.",
        variant: "destructive",
      });
      router.push("/login");
    });
  }, [router, toast]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, INACTIVITY_LIMIT);
  }, [logout]);

  useEffect(() => {
    if (!user) {
      // If there's no user, no need for the timer.
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events: (keyof WindowEventMap)[] = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

    const eventListener = () => resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, eventListener);
    });

    resetTimer(); // Initialize timer on mount or user change

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, eventListener);
      });
    };
  }, [user, resetTimer]);

  return null; // This hook does not render anything
}
