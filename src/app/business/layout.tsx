'use client';

import React from 'react';
import { BusinessLayoutProvider } from '@/components/business-layout-provider';

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
