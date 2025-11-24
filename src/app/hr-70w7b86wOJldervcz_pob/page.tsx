'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HrRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/hr-70w7b86wOJldervcz_pob/login');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

