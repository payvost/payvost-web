import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";

export const useAnalytics = () => {
  const track = (eventName: string, params?: Record<string, any>) => {
    if (analytics) {
      logEvent(analytics, eventName, params);
    } else {
      console.warn("Analytics not initialized yet");
    }
  };

  return { track };
};
