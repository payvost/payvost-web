"use client";

import React, { useEffect, useState } from 'react';

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
      if (isChrome) {
        setShowInstall(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.error('SW registration failed:', err));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener);
    };
  }, []);

  const onInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setShowInstall(false);
    setDeferredPrompt(null);
    console.log('PWA install choice', choice);
  };

  // Install button removed — keep prompt/sw logic but don't render the install UI
  if (!showInstall) return null;

  return null;
}
