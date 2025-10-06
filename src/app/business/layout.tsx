
'use client';

import React from 'react';
import { BusinessSidebar } from '@/components/business-sidebar';
import { BusinessHeader } from '@/components/business-header';
import { ProtectBusinessRoute } from '@/hooks/use-auth';

export default function BusinessDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <ProtectBusinessRoute>
        <div className="min-h-screen w-full bg-muted/40">
        <BusinessSidebar />
        <div className="flex flex-col sm:pl-14 md:pl-[220px]">
            <BusinessHeader />
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6 space-y-4">
            {children}
            </main>
        </div>
        </div>
    </ProtectBusinessRoute>
  );
}
