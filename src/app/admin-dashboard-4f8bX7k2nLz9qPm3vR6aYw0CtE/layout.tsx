

import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';

export const metadata = {
  title: 'Qwibik - Admin Panel',
  description: 'Management dashboard for Qwibik.',
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

    