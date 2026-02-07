'use client';

import { useEffect } from 'react';
import { useUserPreferences } from '@/hooks/use-user-preferences';

export function UserPreferencesApplier() {
  const { preferences } = useUserPreferences();

  useEffect(() => {
    // Apply to <html> so Tailwind rem-based sizing scales consistently.
    const root = document.documentElement;
    root.style.setProperty('--font-scale', String(preferences.fontScale ?? 1));

    if (preferences.highContrast) root.dataset.contrast = 'high';
    else delete root.dataset.contrast;

    root.lang = preferences.language || 'en';
  }, [preferences.fontScale, preferences.highContrast, preferences.language]);

  return null;
}

