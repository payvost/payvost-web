import { Suspense } from 'react';
import PaymentsHubClient from './payments-hub.client';

export default function PaymentsHubPage() {
  // Next.js requires a Suspense boundary when using `useSearchParams()` in routes
  // that can be statically prerendered.
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Loading payments...</div>}>
      <PaymentsHubClient />
    </Suspense>
  );
}

