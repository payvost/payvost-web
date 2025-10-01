
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/site-header';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center text-center p-4">
        <div className="flex flex-col items-center gap-4">
          <SearchX className="h-24 w-24 text-primary" strokeWidth={1} />
          <h1 className="text-4xl font-bold tracking-tight">404 - Page Not Found</h1>
          <p className="max-w-md text-muted-foreground">
            Sorry, we couldn't find the page you were looking for. It might have been moved, deleted, or maybe you just mistyped the URL.
          </p>
          <div className="flex gap-4 mt-4">
            <Button onClick={() => router.back()} variant="outline">
                Go Back
            </Button>
            <Button asChild size="lg">
                <Link href="/">Go Back Home</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
