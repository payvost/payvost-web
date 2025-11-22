
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionCookie, isSupportTeam } from '@/lib/auth-helpers';
import SupportDashboardLayout from '@/components/support-dashboard-layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side session and role verification
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('support_session')?.value;
  const basePath = '/customer-support-W19KouHGlew7_jf2ds';

  if (!sessionCookie) {
    redirect(`${basePath}/login`);
  }

  try {
    const decoded = await verifySessionCookie(sessionCookie!);
    const hasSupportRole = await isSupportTeam(decoded.uid);
    if (!hasSupportRole) {
      redirect(`${basePath}/unauthorized`);
    }
  } catch {
    redirect(`${basePath}/login`);
  }

  return <SupportDashboardLayout>{children}</SupportDashboardLayout>;
}

