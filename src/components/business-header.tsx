'use client';

import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { DashboardSwitcher } from '@/components/dashboard-switcher';
import { DashboardHeader } from '@/components/dashboard-header';

interface BusinessHeaderProps {
  scrolled?: boolean;
}

export function BusinessHeader({ scrolled = false }: BusinessHeaderProps) {
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setLogoUrl(docSnap.data().businessProfile?.logoUrl || null);
      }
    });
    return () => unsub();
  }, [user]);

  return (
    <DashboardHeader
      context="business"
      user={user}
      scrolled={scrolled}
      businessLogoUrl={logoUrl}
      rightSlot={<DashboardSwitcher />}
    />
  );
}

