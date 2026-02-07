'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type GatedActionModalState = {
  open: boolean;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function GatedActionModal({
  state,
  onOpenChange,
}: {
  state: GatedActionModalState;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state.title}</DialogTitle>
          <DialogDescription>{state.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {state.secondaryHref && state.secondaryLabel ? (
            <Button asChild variant="outline">
              <Link href={state.secondaryHref}>{state.secondaryLabel}</Link>
            </Button>
          ) : null}
          {state.primaryHref && state.primaryLabel ? (
            <Button asChild>
              <Link href={state.primaryHref}>{state.primaryLabel}</Link>
            </Button>
          ) : (
            <Button variant="default" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

