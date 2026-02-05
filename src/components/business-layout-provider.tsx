'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BusinessSidebar } from '@/components/business-sidebar';
import { BusinessHeader } from '@/components/business-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ErrorBoundary } from '@/components/error-boundary';

export function BusinessLayoutProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [businessStatus, setBusinessStatus] = useState<'loading' | 'approved' | 'unapproved'>('loading');
  const router = useRouter();
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const businessProfile = docSnap.data().businessProfile;
        // Check for both 'approved' (lowercase) and 'Approved' (capitalized) for compatibility
        if (businessProfile && (businessProfile.status === 'approved' || businessProfile.status === 'Approved')) {
          setBusinessStatus('approved');
        } else {
          setBusinessStatus('unapproved');
        }
      } else {
        setBusinessStatus('unapproved');
      }
    });

    return () => unsub();
  }, [user, authLoading, router]);

  useEffect(() => {
    // Only redirect if we're sure the status is unapproved (not still loading)
    if (businessStatus === 'unapproved' && !authLoading) {
      router.push('/dashboard/get-started');
    }
  }, [businessStatus, router, authLoading]);

  useEffect(() => {
    const mainEl = mainContentRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      setScrolled(mainEl.scrollTop > 10);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  const loadingContent = (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-6 w-6" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-1" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  );

  const mainContent = (
    <ErrorBoundary>
      <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </ErrorBoundary>
  );

  const isLoading = authLoading || businessStatus === 'loading';

  return (
    <SidebarProvider style={{ '--sidebar-width': '12rem' } as React.CSSProperties}>
      <BusinessSidebar />
      <SidebarInset ref={mainContentRef}>
        <BusinessHeader scrolled={scrolled} />
        {isLoading ? loadingContent : mainContent}
      </SidebarInset>
    </SidebarProvider>
  );
}
