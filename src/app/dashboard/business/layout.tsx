
'use client';

import React from 'react';

export default function BusinessDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
        {/* We can create a dedicated business sidebar and header here later */}
        <h2>Business Dashboard Layout</h2>
        {children}
    </div>
  );
}
