
'use client';

import React from 'react';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminHeader } from '@/components/admin-header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-muted/40">
      <AdminSidebar />
      <div className="flex flex-col sm:pl-14 md:pl-[220px]">
        <AdminHeader />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6 space-y-4">
          {children}
        </main>
      </div>
    </div>
  );
}
