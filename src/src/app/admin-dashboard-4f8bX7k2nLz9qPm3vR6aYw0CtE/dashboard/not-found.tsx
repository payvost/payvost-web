
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileWarning } from 'lucide-react';

export default function AdminNotFound() {
    const router = useRouter();
  return (
    <div className="flex flex-col flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-4 text-center">
        <FileWarning className="h-16 w-16 text-destructive mb-4" strokeWidth={1.5} />
        <h1 className="text-2xl font-bold tracking-tight">404 - Page Not Found</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
            The resource you're looking for within the admin panel doesn't exist. Please check the URL or navigate using the sidebar.
        </p>
        <div className="mt-6 flex gap-4">
             <Button onClick={() => router.back()} variant="outline">
                Go Back
            </Button>
            <Button asChild>
                <Link href="/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard">Go to Dashboard</Link>
            </Button>
        </div>
    </div>
  );
}
