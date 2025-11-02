import { Toaster } from '@/components/ui/toaster';

export const metadata = {
  title: 'Admin Login - Payvost',
  description: 'Admin panel login for Payvost.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No auth check for login page
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
