'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const COOKIE_CONSENT_KEY = 'payvost_cookie_consent';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent === null) {
      setIsVisible(true);
    }
  }, []);

  const handleConsent = (consent: 'accept' | 'decline') => {
    localStorage.setItem(COOKIE_CONSENT_KEY, consent);
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
          className="fixed bottom-0 left-0 right-0 z-[200] p-4"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border rounded-lg shadow-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full hidden sm:block">
                        <Cookie className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-semibold">We Use Cookies</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                            Read our <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={() => handleConsent('decline')} className="flex-1 sm:flex-initial">Decline</Button>
                        <Button onClick={() => handleConsent('accept')} className="flex-1 sm:flex-initial">Accept All</Button>
                    </div>
                </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
