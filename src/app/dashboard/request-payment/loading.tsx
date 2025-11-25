'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/dashboard-layout';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';

export default function RequestPaymentLoading() {
    const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
    
    return (
        <DashboardLayout language={language} setLanguage={setLanguage}>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </main>
        </DashboardLayout>
    );
}

