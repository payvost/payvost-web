
import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Customer Support Panel',
    template: '%s',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function SupportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No auth check here - it's handled by the dashboard subdirectory layout
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}

