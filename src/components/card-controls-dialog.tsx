'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import type { CardControls, CardSummary, SpendingInterval } from '@/types/cards-v2';
import { updateCardControls } from '@/services/cardsService';
import { useToast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const schema = z.object({
  spendLimitAmount: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? null : Number(v)),
    z.number().positive().nullable()
  ),
  spendLimitInterval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'ALL_TIME']),
  onlineAllowed: z.boolean(),
  atmAllowed: z.boolean(),
  contactlessAllowed: z.boolean(),
});

type Values = z.infer<typeof schema>;

function toNumberOrNull(v: any) {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

export function CardControlsDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CardSummary | null;
  onUpdated?: (next: CardControls) => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const defaults = useMemo<Values>(() => {
    const c = props.card?.controls;
    return {
      spendLimitAmount: toNumberOrNull(c?.spendLimitAmount ?? null),
      spendLimitInterval: (c?.spendLimitInterval || 'MONTHLY') as SpendingInterval,
      onlineAllowed: c?.onlineAllowed ?? true,
      atmAllowed: c?.atmAllowed ?? false,
      contactlessAllowed: c?.contactlessAllowed ?? true,
    };
  }, [props.card?.controls]);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const save = async (values: Values) => {
    if (!props.card) return;
    try {
      setSaving(true);
      const resp = await updateCardControls(props.card.id, {
        spendLimitAmount: values.spendLimitAmount,
        spendLimitInterval: values.spendLimitInterval,
        onlineAllowed: values.onlineAllowed,
        atmAllowed: values.atmAllowed,
        contactlessAllowed: values.contactlessAllowed,
      });

      toast({ title: 'Controls updated', description: 'Your card controls have been saved.' });
      props.onUpdated?.(resp.controls);
      props.onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Update failed', description: e?.message || 'Could not update card controls.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Card Controls</DialogTitle>
          <DialogDescription>
            Set limits and usage rules. Controls are versioned and audited. Provider enforcement varies; we also monitor transactions server-side.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(save)} className="space-y-5">
            <FormField
              control={form.control}
              name="spendLimitAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spending Limit</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="500"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormField
                      control={form.control}
                      name="spendLimitInterval"
                      render={({ field }) => (
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange as any}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DAILY">Per Day</SelectItem>
                              <SelectItem value="WEEKLY">Per Week</SelectItem>
                              <SelectItem value="MONTHLY">Per Month</SelectItem>
                              <SelectItem value="YEARLY">Per Year</SelectItem>
                              <SelectItem value="ALL_TIME">All Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </div>
                  <FormDescription>Set to empty to remove the limit.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="onlineAllowed"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel className="text-sm">Online</FormLabel>
                      <div className="text-xs text-muted-foreground">E-commerce</div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="atmAllowed"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel className="text-sm">ATM</FormLabel>
                      <div className="text-xs text-muted-foreground">Withdrawals</div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactlessAllowed"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel className="text-sm">Contactless</FormLabel>
                      <div className="text-xs text-muted-foreground">Tap to pay</div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !props.card}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
