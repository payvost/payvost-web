'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { LanguagePreference } from '@/types/language';
import { DashboardLayout } from '@/components/dashboard-layout';
import { SettingsShell } from '@/components/settings/settings-shell';
import { useUserPreferences } from '@/hooks/use-user-preferences';

export function SettingsLayoutClient({ children }: { children: ReactNode }) {
  const { preferences, updatePreferences } = useUserPreferences();
  const [language, setLanguage] = useState<LanguagePreference>('en');

  useEffect(() => {
    if (preferences.language && preferences.language !== language) {
      setLanguage(preferences.language);
    }
  }, [preferences.language, language]);

  const setLanguagePersisted: Dispatch<SetStateAction<LanguagePreference>> = (next) => {
    setLanguage((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      void updatePreferences({ language: resolved });
      return resolved;
    });
  };

  const shell = useMemo(() => <SettingsShell>{children}</SettingsShell>, [children]);

  return (
    <DashboardLayout language={language} setLanguage={setLanguagePersisted}>
      {shell}
    </DashboardLayout>
  );
}
