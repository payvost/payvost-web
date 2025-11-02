'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, MapPin } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

const COOKIE_CONSENT_KEY = 'payvost_cookie_consent';
const LOCATION_CONSENT_KEY = 'payvost_location_consent';

export function UnifiedConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showCookie, setShowCookie] = useState(false);

  useEffect(() => {
    const cookieConsent = typeof window !== 'undefined' ? localStorage.getItem(COOKIE_CONSENT_KEY) : 'accepted';
    const locationConsent = typeof window !== 'undefined' ? localStorage.getItem(LOCATION_CONSENT_KEY) : 'granted';

    if (cookieConsent === null) {
      setShowCookie(true);
    }

    if (locationConsent === null && typeof navigator !== 'undefined' && (navigator as any).permissions) {
      (navigator as any).permissions.query({ name: 'geolocation' as any }).then((permissionStatus: any) => {
        if (permissionStatus.state === 'prompt') {
          setShowLocation(true);
        }
      }).catch(() => {
        // If permissions API is unavailable or fails, default to not prompting
      });
    }

    if (cookieConsent === null || locationConsent === null) {
      setIsVisible(true);
    }
  }, []);

  const handleCookieConsent = (consent: 'accept' | 'decline') => {
    localStorage.setItem(COOKIE_CONSENT_KEY, consent);
    setShowCookie(false);
  };

  const handleLocationConsent = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          localStorage.setItem(LOCATION_CONSENT_KEY, 'granted');
          setShowLocation(false);
        },
        () => {
          localStorage.setItem(LOCATION_CONSENT_KEY, 'denied');
          setShowLocation(false);
        }
      );
    }
  };

  const handleAcceptAll = () => {
    handleCookieConsent('accept');
    handleLocationConsent();
    setIsVisible(false);
  };

  const handleDeclineAll = () => {
    handleCookieConsent('decline');
    localStorage.setItem(LOCATION_CONSENT_KEY, 'denied');
    setShowLocation(false);
    setShowCookie(false);
    setIsVisible(false);
  };

  if (!isVisible || (!showCookie && !showLocation)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: '0%' }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-[200] p-4"
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border rounded-lg shadow-2xl p-4 sm:p-6 space-y-4">
            <h3 className="font-semibold text-lg text-center sm:text-left">Your Privacy Choices</h3>

            {showCookie && (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full hidden sm:block">
                  <Cookie className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-semibold">Cookies</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    We use cookies to enhance your browsing experience and analyze our traffic.
                    Read our <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
                  </p>
                </div>
              </div>
            )}

            {showLocation && (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full hidden sm:block">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-semibold">Location</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow location access to automatically set your country and provide relevant services.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button variant="outline" onClick={handleDeclineAll} className="flex-1">Decline All</Button>
              <Button onClick={handleAcceptAll} className="flex-1">Accept All</Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
