
import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';

export const metadata = {
  title: 'Payvost - Customer Support Panel',
  description: 'Customer support management dashboard for Payvost.',
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

