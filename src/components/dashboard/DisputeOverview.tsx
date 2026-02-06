import React, { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowUpRight, ShieldCheck } from 'lucide-react';
import type { DocumentData } from 'firebase/firestore';

export function DisputeOverview({
  disputes,
  loading,
}: {
  disputes: DocumentData[];
  loading: boolean;
}) {
  const { openCount, resolvedCount } = useMemo(() => {
    const counts = { openCount: 0, resolvedCount: 0 };

    for (const d of disputes) {
      const raw = (d?.status ?? d?.state ?? d?.resolution ?? '').toString().toLowerCase();
      const isResolved =
        raw.includes('resolved') ||
        raw.includes('closed') ||
        raw.includes('won') ||
        raw.includes('lost');

      if (isResolved) counts.resolvedCount += 1;
      else counts.openCount += 1;
    }

    return counts;
  }, [disputes]);

  return (
    <Card className="border-muted-foreground/15 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="grid gap-1">
          <CardTitle className="text-sm font-semibold">Disputes</CardTitle>
          <CardDescription className="text-xs">Track issues and resolutions in one place.</CardDescription>
        </div>
        <Button asChild size="sm" variant="outline" className="ml-auto gap-1">
          <Link href="/dashboard/dispute">
            Open center <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="rounded-lg bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
            Loading disputes...
          </div>
        ) : disputes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
            No disputes opened yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-amber-700">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase">Open</p>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <p className="text-xl font-semibold">{openCount}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase">Resolved</p>
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-xl font-semibold">{resolvedCount}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[11px]">
                {disputes.length} total
              </Badge>
              <Badge variant="secondary" className="text-[11px]">
                {openCount > 0 ? 'Needs attention' : 'All clear'}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

