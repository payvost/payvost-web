'use client';

import * as React from 'react';
import type { LanguagePreference } from '@/types/language';
import { DashboardLayout } from '@/components/dashboard-layout';

const LANGUAGE_STORAGE_KEY = 'dashboard.languagePreference';

function readStoredLanguage(): LanguagePreference | null {
  try {
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (raw === 'en' || raw === 'es' || raw === 'fr') return raw;
  } catch {
    // no-op
  }
  return null;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = React.useState<LanguagePreference>('en');

  React.useEffect(() => {
    const persisted = readStoredLanguage();
    if (persisted) setLanguage(persisted);
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // no-op
    }
  }, [language]);

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      {children}
    </DashboardLayout>
  );
}

