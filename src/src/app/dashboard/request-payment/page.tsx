
'use client';

import { Suspense } from 'react';
import RequestPaymentPageContent from '@/components/request-payment-page-content';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = "force-dynamic";

function Loading() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Skeleton className="h-[500px] w-full" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        </div>
    )
}

export default function Page() {
  return (
    <Suspense fallback={<Loading/>}>
      <RequestPaymentPageContent />
    </Suspense>
  );
}
