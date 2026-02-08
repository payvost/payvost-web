'use client';

import { useEffect, useState } from 'react';
import type { CardAuditItem, CardSummary } from '@/types/cards-v2';
import { fetchCardEvents } from '@/services/cardsService';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

function shortId(id: string | null) {
  if (!id) return 'system';
  return `${id.slice(0, 8)}…`;
}

export function CardAuditDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CardSummary | null;
}) {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<CardAuditItem[]>([]);

  useEffect(() => {
    if (!props.open || !props.card) return;
    const cardId = props.card.id;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const resp = await fetchCardEvents(cardId, { limit: 50 });
        if (!cancelled) setEvents(resp.events || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [props.open, props.card?.id]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Audit Trail</DialogTitle>
          <DialogDescription>Security and lifecycle events for this card.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length ? (
                  events.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.type}</TableCell>
                      <TableCell className="font-mono text-xs">{shortId(e.actorUserId)}</TableCell>
                      <TableCell>{new Date(e.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No audit events yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
