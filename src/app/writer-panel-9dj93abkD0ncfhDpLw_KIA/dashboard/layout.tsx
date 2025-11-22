import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionCookie, isWriter } from '@/lib/auth-helpers';
import WriterDashboardLayout from '@/components/writer-dashboard-layout';

export default async function WriterDashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side session and role verification
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('writer_session')?.value;
  const basePath = '/writer-panel-9dj93abkD0ncfhDpLw_KIA';

  if (!sessionCookie) {
    redirect(`${basePath}/login`);
  }

  try {
    const decoded = await verifySessionCookie(sessionCookie!);
    const writer = await isWriter(decoded.uid);
    if (!writer) {
      redirect(`${basePath}/unauthorized`);
    }
  } catch {
    redirect(`${basePath}/login`);
  }

  return <WriterDashboardLayout>{children}</WriterDashboardLayout>;
}

