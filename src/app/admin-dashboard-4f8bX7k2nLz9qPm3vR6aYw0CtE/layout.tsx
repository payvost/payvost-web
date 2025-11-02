

import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';

export const metadata = {
  title: 'Payvost - Admin Panel',
  description: 'Management dashboard for Payvost.',
};

export default async function AdminLayout({
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
    