'use client';

import React from 'react';
import { BusinessLayoutProvider } from '@/components/business-layout-provider';

// Client component wrapper - metadata is handled by metadata.ts file
export default function BusinessDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     <BusinessLayoutProvider>
        {children}
    </BusinessLayoutProvider>
  );
}
