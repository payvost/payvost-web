'use client';

import React from 'react';
import { SupportSidebar } from '@/components/support-sidebar';
import { SupportHeader } from '@/components/support-header';

export default function SupportDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-muted/40">
      <SupportSidebar />
      <div className="flex flex-col sm:pl-14 md:pl-64">
        <SupportHeader />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6 space-y-4">
          {children}
        </main>
      </div>
    </div>
  );
}

