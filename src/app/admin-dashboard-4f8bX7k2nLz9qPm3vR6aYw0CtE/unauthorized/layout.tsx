import { Toaster } from '@/components/ui/toaster';

export const metadata = {
  title: 'Unauthorized - Payvost',
  description: 'Access denied.',
};

export default function UnauthorizedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No auth check for unauthorized page
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
