'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Signup page - redirects to /register with referral code preserved
 * This maintains backward compatibility for referral links that use /signup
 */
function SignupRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Build redirect URL with all query parameters preserved
    const params = new URLSearchParams();
    
    // Preserve all query parameters (especially 'ref' for referral code)
    searchParams.forEach((value, key) => {
      params.set(key, value);
    });

    // Redirect to /register with query parameters
    const redirectUrl = `/register${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(redirectUrl);
  }, [router, searchParams]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to registration...</p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SignupRedirect />
    </Suspense>
  );
}

