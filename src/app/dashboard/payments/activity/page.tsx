import { Suspense } from 'react';
import PaymentsActivityPageClient from './payments-activity.client';

export default function PaymentsActivityPage() {
  // Next.js requires a Suspense boundary when using `useSearchParams()` in routes
  // that can be statically prerendered.
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Loading activity...</div>}>
      <PaymentsActivityPageClient />
    </Suspense>
  );
}

