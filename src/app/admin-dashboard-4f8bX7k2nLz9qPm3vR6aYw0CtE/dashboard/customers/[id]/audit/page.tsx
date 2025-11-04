'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ListTree } from 'lucide-react';

export default function AuditTrailPage() {
  const params = useParams();
  const id = params?.id as string;

  const rows = [
    { ts: new Date().toISOString(), actor: 'system', action: 'KYC_SUBMISSION_CREATED', detail: 'User submitted KYC Level: Full (NG)' },
    { ts: new Date(Date.now() - 3600_000).toISOString(), actor: 'admin:ops@payvost.com', action: 'LIMITS_UPDATED', detail: 'Daily=2000, FX=5000, Withdraw=2500' },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
          <Link href={`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold md:text-2xl">Audit Trail</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListTree className="h-5 w-5"/>User Activity</CardTitle>
          <CardDescription>Chronological view of administrative changes and system events.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {rows.map((r, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">{new Date(r.ts).toLocaleString()}</div>
                  <div className="font-medium">{r.action}</div>
                  <div className="text-muted-foreground">{r.detail}</div>
                </div>
                <div className="text-xs">{r.actor}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
