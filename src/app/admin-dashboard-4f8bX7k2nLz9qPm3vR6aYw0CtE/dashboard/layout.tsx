
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionCookie, isAdmin } from '@/lib/auth-helpers';
import AdminDashboardLayout from '@/components/admin-dashboard-layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side session and role verification
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const basePath = '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE';

  if (!sessionCookie) {
    redirect(`${basePath}/login`);
  }

  try {
    const decoded = await verifySessionCookie(sessionCookie!);
    const admin = await isAdmin(decoded.uid);
    if (!admin) {
      redirect(`${basePath}/unauthorized`);
    }
  } catch {
    redirect(`${basePath}/login`);
  }

  return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
}
