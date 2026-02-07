'use client';

import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { computeCapabilities, type Capabilities } from '@/lib/capabilities';

type CapabilitiesState = {
  loading: boolean;
  capabilities: Capabilities;
};

export function useCapabilities(): CapabilitiesState {
  const { user, loading: authLoading } = useAuth();
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [accountRestricted, setAccountRestricted] = useState(false);
  const [countryCode, setCountryCode] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (!snap.exists()) return;
      const data: any = snap.data();
      setKycStatus(typeof data?.kycStatus === 'string' ? data.kycStatus : null);
      setCountryCode(typeof data?.countryCode === 'string' ? data.countryCode : null);

      // Some environments use explicit “restricted”; others store it on nested objects.
      const restricted =
        (typeof data?.accountStatus === 'string' && data.accountStatus.toLowerCase() === 'restricted') ||
        (typeof data?.status === 'string' && data.status.toLowerCase() === 'restricted') ||
        (typeof data?.kycStatus === 'string' && data.kycStatus.toLowerCase() === 'restricted') ||
        Boolean(data?.isRestricted);
      setAccountRestricted(Boolean(restricted));
    });

    return () => unsub();
  }, [authLoading, user]);

  const capabilities = useMemo(
    () => computeCapabilities({ kycStatus, accountRestricted, countryCode }),
    [kycStatus, accountRestricted, countryCode]
  );

  return {
    loading: authLoading || (Boolean(user) && kycStatus === null),
    capabilities,
  };
}

