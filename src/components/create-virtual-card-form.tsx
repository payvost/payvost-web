'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DollarSign } from 'lucide-react';

import type { Account } from '@/services/walletService';
import type { CreateCardRequest, WorkspaceType } from '@/types/cards-v2';
import type { WorkspaceMember } from '@/services/workspacesService';

const formSchema = z.object({
  type: z.enum(['VIRTUAL', 'PHYSICAL']),
  accountId: z.string().min(1, 'Select a funding account'),
  label: z.string().min(2, 'Card label must be at least 2 characters').max(64),
  network: z.enum(['VISA', 'MASTERCARD']),
  assignedToUserId: z.string().optional(),
  spendLimitAmount: z.preprocess((v) => (v === '' || v === undefined || v === null ? undefined : Number(v)), z.number().positive().optional()),
  spendLimitInterval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'ALL_TIME']),
  onlineAllowed: z.boolean(),
  atmAllowed: z.boolean(),
  contactlessAllowed: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateVirtualCardForm(props: {
  workspaceType: WorkspaceType;
  workspaceId?: string | null;
  accounts: Account[];
  members?: WorkspaceMember[];
  currentUserId?: string | null;
  isKycVerified: boolean;
  onSubmit: (data: CreateCardRequest) => void;
  onCancel: () => void;
}) {
  const filteredAccounts = useMemo(
    () => props.accounts.filter((a) => a.type === (props.workspaceType === 'BUSINESS' ? 'BUSINESS' : 'PERSONAL')),
    [props.accounts, props.workspaceType]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'VIRTUAL',
      accountId: filteredAccounts[0]?.id || '',
      label: '',
      network: 'VISA',
      assignedToUserId: props.currentUserId || undefined,
      spendLimitAmount: 500,
      spendLimitInterval: 'MONTHLY',
      onlineAllowed: true,
      atmAllowed: false,
      contactlessAllowed: true,
    },
  });

  // Keep account selection in sync when accounts load/change.
  const firstAccountId = filteredAccounts[0]?.id || '';
  useEffect(() => {
    if (!form.getValues('accountId') && firstAccountId) {
      form.setValue('accountId', firstAccountId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstAccountId]);

  const disabled = !props.isKycVerified;

  const submit = (values: FormValues) => {
    const payload: CreateCardRequest = {
      workspaceId: props.workspaceId || undefined,
      workspaceType: props.workspaceType,
      accountId: values.accountId,
      label: values.label,
      network: values.network,
      type: values.type,
      ...(props.workspaceType === 'BUSINESS' && values.assignedToUserId ? { assignedToUserId: values.assignedToUserId } : {}),
      controls: {
        spendLimitAmount: values.spendLimitAmount ?? null,
        spendLimitInterval: values.spendLimitInterval,
        onlineAllowed: values.onlineAllowed,
        atmAllowed: values.atmAllowed,
        contactlessAllowed: values.contactlessAllowed,
      },
    };
    props.onSubmit(payload);
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Create Card</CardTitle>
        <CardDescription>
          Issue a card linked to a funding account. Card details (PAN/CVV) are only available via secure reveal and are never stored.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)}>
          <CardContent className="space-y-6">
            {!props.isKycVerified && (
              <div className="rounded-md border p-4 text-sm">
                <div className="font-medium">KYC required</div>
                <div className="text-muted-foreground">
                  Complete identity verification to issue cards. This is required for compliance and to protect your account.
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-4"
                      disabled={disabled}
                    >
                      <div>
                        <RadioGroupItem value="VIRTUAL" id="type-virtual" className="peer sr-only" />
                        <Label
                          htmlFor="type-virtual"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
                        >
                          Virtual
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="PHYSICAL" id="type-physical" className="peer sr-only" />
                        <Label
                          htmlFor="type-physical"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
                        >
                          Physical
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Physical cards may require additional fulfillment setup (shipping address, program rules). If issuance fails, switch to Virtual.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding Account</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredAccounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.type} {a.currency} (Balance: {Number(a.balance).toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>Cards are issued against a single-currency funding account.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Label</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Online Subscriptions" disabled={disabled} {...field} />
                  </FormControl>
                  <FormDescription>Use a label you can recognize later.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {props.workspaceType === 'BUSINESS' && (
              <FormField
                control={form.control}
                name="assignedToUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Cardholder</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={disabled || !(props.members && props.members.length > 0)}>
                        <SelectTrigger>
                          <SelectValue placeholder={props.members && props.members.length > 0 ? 'Select member' : 'No members found'} />
                        </SelectTrigger>
                        <SelectContent>
                          {(props.members || []).map((m) => (
                            <SelectItem key={m.userId} value={m.userId}>
                              {(m.user?.name || m.user?.email || m.userId).toString()} ({m.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>Business cards must be assigned to a workspace member.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Separator />

            <FormField
              control={form.control}
              name="network"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Network</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-4"
                      disabled={disabled}
                    >
                      <div>
                        <RadioGroupItem value="VISA" id="network-visa" className="peer sr-only" />
                        <Label
                          htmlFor="network-visa"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
                        >
                          Visa
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="MASTERCARD" id="network-mastercard" className="peer sr-only" />
                        <Label
                          htmlFor="network-mastercard"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
                        >
                          Mastercard
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-4">
              <div className="text-sm font-medium">Controls</div>

              <FormField
                control={form.control}
                name="spendLimitAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spending Limit</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            className="pl-8"
                            placeholder="500"
                            disabled={disabled}
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormField
                        control={form.control}
                        name="spendLimitInterval"
                        render={({ field }) => (
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
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
                    <FormDescription>Limits are enforced via controls and transaction monitoring.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="onlineAllowed"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <FormLabel className="text-sm">Online</FormLabel>
                        <div className="text-xs text-muted-foreground">Allow online payments</div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={disabled} />
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
                        <div className="text-xs text-muted-foreground">Allow ATM withdrawals</div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={disabled} />
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
                        <div className="text-xs text-muted-foreground">Allow tap to pay</div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={disabled} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={props.onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={disabled}>
              Issue Card
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
