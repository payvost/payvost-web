import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionCookie, isHrAdmin } from '@/lib/auth-helpers';
import HrDashboardLayout from '@/components/hr-dashboard-layout';

export default async function HrDashboardLayoutRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side session and role verification
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('hr_session')?.value;
  const basePath = '/hr-admin';

  if (!sessionCookie) {
    redirect(`${basePath}/login`);
  }

  try {
    const decoded = await verifySessionCookie(sessionCookie!);
    const hrAdmin = await isHrAdmin(decoded.uid);
    if (!hrAdmin) {
      redirect(`${basePath}/unauthorized`);
    }
  } catch {
    redirect(`${basePath}/login`);
  }

  return <HrDashboardLayout>{children}</HrDashboardLayout>;
}

