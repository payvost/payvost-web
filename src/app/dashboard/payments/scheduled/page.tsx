'use client';

import { useEffect, useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { paymentsService } from '@/services/paymentsService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type PaymentSchedule = {
  id: string;
  type: string;
  status: string;
  cron: string;
  timezone: string;
  nextRunAt: string;
  lastRunAt?: string | null;
  createdAt: string;
};

export default function PaymentsScheduledPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PaymentSchedule[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await paymentsService.schedules({ status: 'ACTIVE', limit: 100 });
        if (!cancelled) setItems((res.items || []) as PaymentSchedule[]);
      } catch (error: any) {
        console.error('Failed to load schedules:', error);
        toast({
          title: 'Failed to load schedules',
          description: error?.message || 'Please try again later',
          variant: 'destructive',
        });
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-5 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-base font-semibold sm:text-lg md:text-2xl">Scheduled Payments</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Schedules</CardTitle>
            <CardDescription>Schedules are stored in Prisma and executed by a server-side runner (next step).</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading schedules...</div>
            ) : items.length ? (
              <div className="space-y-3">
                {items.map((s) => (
                  <div key={s.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold">{s.type.replaceAll('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground">{s.status}</div>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Next run: {format(new Date(s.nextRunAt), 'MMM dd, yyyy HH:mm')} ({s.timezone})
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground font-mono">cron: {s.cron}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">No active schedules.</div>
            )}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  );
}

