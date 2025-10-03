
'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function RequestPaymentLoading() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    )
}

export default function RequestPaymentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <Suspense fallback={<RequestPaymentLoading />}>{children}</Suspense>;
}
