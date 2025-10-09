'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const LOCATION_CONSENT_KEY = 'payvost_location_consent';

export function LocationPermissionBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given or denied
    const consent = localStorage.getItem(LOCATION_CONSENT_KEY);
    if (consent === null && navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
            if (permissionStatus.state === 'prompt') {
                 setIsVisible(true);
            }
        });
    }
  }, []);

  const handleAllow = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          localStorage.setItem(LOCATION_CONSENT_KEY, 'granted');
          setIsVisible(false);
        },
        () => {
          // User denied in the browser prompt
          localStorage.setItem(LOCATION_CONSENT_KEY, 'denied');
          setIsVisible(false);
        }
      );
    }
  };

  const handleDecline = () => {
    localStorage.setItem(LOCATION_CONSENT_KEY, 'denied');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed bottom-16 left-0 right-0 z-[199] p-4" // Positioned above cookie banner
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border rounded-lg shadow-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full hidden sm:block">
                        <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-semibold">Help us personalize your experience</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Allow location access to automatically set your country and provide relevant services.
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={handleDecline} className="flex-1 sm:flex-initial">Decline</Button>
                        <Button onClick={handleAllow} className="flex-1 sm:flex-initial">Allow</Button>
                    </div>
                </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
