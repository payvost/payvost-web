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
            if (doc.exists() && doc.data().businessProfile?.status === 'Approved') {
                setBusinessStatus('approved');
            } else {
                setBusinessStatus('unapproved');
            }
        });

        return () => unsub();
    }, [user, authLoading, router]);

    useEffect(() => {
        if (businessStatus === 'unapproved') {
            router.push('/dashboard/get-started');
        }
    }, [businessStatus, router]);

    if (authLoading || businessStatus !== 'approved') {
        return (
            <div className="min-h-screen w-full bg-muted/40">
                <BusinessSidebar />
                 <div className="flex flex-col sm:pl-14 md:pl-[220px]">
                    <BusinessHeader />
                     <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6 space-y-4">
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
        );
    }

    return (
        <div className="min-h-screen w-full bg-muted/40">
            <BusinessSidebar />
            <div className="flex flex-col sm:pl-14 md:pl-[220px]">
                <BusinessHeader />
                <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6 space-y-4">
                    {children}
                </main>
            </div>
        </div>
    );
};
