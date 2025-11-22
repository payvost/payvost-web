'use client';

import React from 'react';
import { WriterSidebar } from '@/components/writer-sidebar';
import { WriterHeader } from '@/components/writer-header';

export default function WriterDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-muted/40">
      <WriterSidebar />
      <div className="flex flex-col sm:pl-14 md:pl-[280px]">
        <WriterHeader />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6 space-y-4">
          {children}
        </main>
      </div>
    </div>
  );
}

