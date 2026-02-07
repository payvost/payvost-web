'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import {
  buildPreferencesUpdate,
  DEFAULT_USER_PREFERENCES,
  normalizeUserPreferences,
  type UserPreferences,
} from '@/lib/user-preferences';

export type { UserPreferences } from '@/lib/user-preferences';

export function useUserPreferences() {
  const { user, loading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [userData, setUserData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setUserData(null);
      setPreferences(DEFAULT_USER_PREFERENCES);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        const data = (snap.data() as Record<string, any> | undefined) || null;
        setUserData(data);
        setPreferences(normalizeUserPreferences(data?.preferences));
        setLoading(false);
      },
      (err) => {
        console.error('useUserPreferences snapshot error:', err);
        setUserData(null);
        setPreferences(DEFAULT_USER_PREFERENCES);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, authLoading]);

  const updatePreferences = useCallback(
    async (partial: Partial<UserPreferences>) => {
      if (!user) return false;

      const updateData = buildPreferencesUpdate(partial);
      if (Object.keys(updateData).length === 0) return true;

      // Optimistic local update for snappier UX.
      setPreferences((prev) => ({ ...prev, ...partial } as UserPreferences));

      try {
        await updateDoc(doc(db, 'users', user.uid), updateData);
        return true;
      } catch (err) {
        console.error('updatePreferences failed:', err);
        return false;
      }
    },
    [user]
  );

  const derived = useMemo(() => ({ preferences, userData, loading, updatePreferences }), [preferences, userData, loading, updatePreferences]);
  return derived;
}
