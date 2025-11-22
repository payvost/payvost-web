'use client';

import React from 'react';
import { HrSidebar } from '@/components/hr-sidebar';
import { HrHeader } from '@/components/hr-header';

export default function HrDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-muted/40">
      <HrSidebar />
      <div className="flex flex-col sm:pl-14 md:pl-[220px]">
        <HrHeader />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6 space-y-4">
          {children}
        </main>
      </div>
    </div>
  );
}

