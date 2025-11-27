'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DashboardLayout } from '@/components/dashboard-layout';
import { BusinessSidebar } from '@/components/business-sidebar';
import { BusinessHeader } from '@/components/business-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';

export function BusinessLayoutProvider({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [businessStatus, setBusinessStatus] = useState<'loading' | 'approved' | 'unapproved'>('loading');
    const router = useRouter();

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                const businessProfile = doc.data().businessProfile;
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

    // Show loading state while checking auth or business status
    if (authLoading || businessStatus === 'loading') {
        return (
            <SidebarProvider className="block min-h-screen w-full">
                <div className="min-h-screen w-full bg-background">
                    <BusinessSidebar />
                    <BusinessHeader />
                     <div className="sm:pl-14 md:pl-[14rem]">
                         <main className="px-4 pb-4 sm:px-6 md:px-6 md:pb-6 space-y-4 pt-16">
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
                    </main>
                </div>
            </div>
        </SidebarProvider>
        );
    }

    return (
        <SidebarProvider className="block min-h-screen w-full">
            <div className="min-h-screen w-full bg-background">
                <BusinessSidebar />
                <BusinessHeader />
                <div className="sm:pl-14 md:pl-[14rem]">
                    <main className="px-4 pb-4 sm:px-6 md:px-6 md:pb-6 space-y-4 pt-16">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
};
