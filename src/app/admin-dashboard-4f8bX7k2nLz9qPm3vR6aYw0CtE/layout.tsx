

import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';

export const metadata = {
  title: 'Payvost - Admin Panel',
  description: 'Management dashboard for Payvost.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
        {children}
        <Toaster />
    </AuthProvider>
  )
}

    