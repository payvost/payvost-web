'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup } from '@/components/ui/input-otp';
import { OTPInputContext } from 'input-otp';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { isValidPinFormat, isWeakPin } from '@/lib/security/pin-policy';

type PinStatus = { hasPin: boolean; lockedUntil: string | null };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

const MaskedSlot = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext: any = React.useContext(OTPInputContext) ?? {};
  const slot = inputOTPContext.slots?.[index] ?? {};
  const char = slot.char as string | undefined;
  const hasFakeCaret = slot.hasFakeCaret as boolean | undefined;
  const isActive = slot.isActive as boolean | undefined;

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex h-12 w-12 items-center justify-center border-y border-r border-input text-xl font-semibold transition-all first:rounded-l-md first:border-l last:rounded-r-md',
        isActive && 'z-10 ring-2 ring-ring ring-offset-background',
        className
      )}
      aria-label={`PIN slot ${index + 1}`}
      {...props}
    >
      {char ? '\u2022' : null}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});
MaskedSlot.displayName = 'MaskedSlot';

async function fetchPinStatus(token: string): Promise<PinStatus> {
  const res = await fetch('/api/security/pin/status', { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to load PIN status');
  const data = (await res.json()) as Partial<PinStatus>;
  return { hasPin: Boolean(data.hasPin), lockedUntil: typeof data.lockedUntil === 'string' ? data.lockedUntil : null };
}

export function TransactionPinDialog({ open, onOpenChange, onChanged }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [status, setStatus] = useState<PinStatus>({ hasPin: false, lockedUntil: null });
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [saving, setSaving] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!open || !user) return;
      try {
        setLoadingStatus(true);
        const token = await user.getIdToken();
        const s = await fetchPinStatus(token);
        if (!cancelled) setStatus(s);
      } catch (err) {
        console.error('PIN status load error:', err);
        if (!cancelled) setStatus({ hasPin: false, lockedUntil: null });
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  useEffect(() => {
    if (!open) {
      setSaving(false);
      setPin('');
      setConfirmPin('');
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
    }
  }, [open]);

  const isLocked = useMemo(() => {
    if (!status.lockedUntil) return false;
    const t = new Date(status.lockedUntil).getTime();
    return Number.isFinite(t) && t > Date.now();
  }, [status.lockedUntil]);

  const setPinsMatch = isValidPinFormat(pin) && pin === confirmPin && !isWeakPin(pin);
  const changePinsValid =
    isValidPinFormat(currentPin) &&
    isValidPinFormat(newPin) &&
    newPin === confirmNewPin &&
    currentPin !== newPin &&
    !isWeakPin(newPin);

  const handleSet = async () => {
    if (!user) {
      toast({ title: 'Not authenticated', description: 'Please sign in again.', variant: 'destructive' });
      return;
    }
    if (!isValidPinFormat(pin)) {
      toast({ title: 'Invalid PIN', description: 'PIN must be exactly 4 digits.', variant: 'destructive' });
      return;
    }
    if (isWeakPin(pin)) {
      toast({ title: 'Weak PIN', description: 'This PIN is too common or predictable.', variant: 'destructive' });
      return;
    }
    if (pin !== confirmPin) {
      toast({ title: 'PINs do not match', description: 'Please re-enter to confirm.', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const token = await user.getIdToken();
      const res = await fetch('/api/security/pin/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to set PIN');

      try {
        const { notifyPinChanged } = await import('@/lib/unified-notifications');
        await notifyPinChanged(user.uid);
      } catch (notifErr) {
        console.error('PIN notification error:', notifErr);
      }

      toast({ title: 'PIN set', description: 'Your transaction PIN has been saved.' });
      onOpenChange(false);
      onChanged?.();
    } catch (err: any) {
      console.error('PIN set error:', err);
      toast({ title: 'Failed to set PIN', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = async () => {
    if (!user) {
      toast({ title: 'Not authenticated', description: 'Please sign in again.', variant: 'destructive' });
      return;
    }
    if (!isValidPinFormat(currentPin) || !isValidPinFormat(newPin)) {
      toast({ title: 'Invalid PIN', description: 'PINs must be exactly 4 digits.', variant: 'destructive' });
      return;
    }
    if (currentPin === newPin) {
      toast({ title: 'Invalid PIN', description: 'New PIN must be different.', variant: 'destructive' });
      return;
    }
    if (isWeakPin(newPin)) {
      toast({ title: 'Weak PIN', description: 'This PIN is too common or predictable.', variant: 'destructive' });
      return;
    }
    if (newPin !== confirmNewPin) {
      toast({ title: 'PINs do not match', description: 'Please re-enter to confirm.', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      const token = await user.getIdToken();
      const res = await fetch('/api/security/pin/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.ok === true) {
        try {
          const { notifyPinChanged } = await import('@/lib/unified-notifications');
          await notifyPinChanged(user.uid);
        } catch (notifErr) {
          console.error('PIN notification error:', notifErr);
        }

        toast({ title: 'PIN updated', description: 'Your transaction PIN has been changed.' });
        onOpenChange(false);
        onChanged?.();
        return;
      }

      if (res.status === 423) {
        toast({
          title: 'PIN locked',
          description: data?.lockedUntil
            ? `Too many attempts. Try again after ${new Date(String(data.lockedUntil)).toLocaleString()}.`
            : 'Too many attempts. Try again later.',
          variant: 'destructive',
        });
        return;
      }

      throw new Error(data?.error || 'Failed to change PIN');
    } catch (err: any) {
      console.error('PIN change error:', err);
      toast({ title: 'Failed to change PIN', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const lockedBanner = status.lockedUntil ? (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
      <div className="font-medium">PIN temporarily locked</div>
      <div className="text-muted-foreground">
        {`Too many attempts. Try again after ${new Date(status.lockedUntil).toLocaleString()}.`}
      </div>
    </div>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{status.hasPin ? 'Change transaction PIN' : 'Create transaction PIN'}</DialogTitle>
          <DialogDescription>
            Your 4-digit PIN is used to authorize sensitive actions like transfers or withdrawals.
          </DialogDescription>
        </DialogHeader>

        {loadingStatus ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-4">
            {lockedBanner}

            {!status.hasPin ? (
              <div className={cn('space-y-5', isLocked && 'opacity-60 pointer-events-none')}>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-center">Enter new PIN</div>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={4}
                      value={pin}
                      onChange={(val) => setPin(val.replace(/[^0-9]/g, '').slice(0, 4))}
                      containerClassName="gap-3"
                      aria-label="Enter 4 digit transaction PIN"
                    >
                      <InputOTPGroup>
                        <MaskedSlot index={0} />
                        <MaskedSlot index={1} />
                        <MaskedSlot index={2} />
                        <MaskedSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {isWeakPin(pin) && isValidPinFormat(pin) && (
                    <p className="text-xs text-destructive text-center">This PIN is too common or predictable.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-center">Confirm PIN</div>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={4}
                      value={confirmPin}
                      onChange={(val) => setConfirmPin(val.replace(/[^0-9]/g, '').slice(0, 4))}
                      containerClassName="gap-3"
                      aria-label="Confirm 4 digit transaction PIN"
                    >
                      <InputOTPGroup>
                        <MaskedSlot index={0} />
                        <MaskedSlot index={1} />
                        <MaskedSlot index={2} />
                        <MaskedSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {confirmPin.length === 4 && pin !== confirmPin && (
                    <p className="text-xs text-destructive text-center">PINs do not match.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className={cn('space-y-5', isLocked && 'opacity-60 pointer-events-none')}>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-center">Current PIN</div>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={4}
                      value={currentPin}
                      onChange={(val) => setCurrentPin(val.replace(/[^0-9]/g, '').slice(0, 4))}
                      containerClassName="gap-3"
                      aria-label="Enter current transaction PIN"
                    >
                      <InputOTPGroup>
                        <MaskedSlot index={0} />
                        <MaskedSlot index={1} />
                        <MaskedSlot index={2} />
                        <MaskedSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-center">New PIN</div>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={4}
                      value={newPin}
                      onChange={(val) => setNewPin(val.replace(/[^0-9]/g, '').slice(0, 4))}
                      containerClassName="gap-3"
                      aria-label="Enter new transaction PIN"
                    >
                      <InputOTPGroup>
                        <MaskedSlot index={0} />
                        <MaskedSlot index={1} />
                        <MaskedSlot index={2} />
                        <MaskedSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {isWeakPin(newPin) && isValidPinFormat(newPin) && (
                    <p className="text-xs text-destructive text-center">This PIN is too common or predictable.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-center">Confirm new PIN</div>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={4}
                      value={confirmNewPin}
                      onChange={(val) => setConfirmNewPin(val.replace(/[^0-9]/g, '').slice(0, 4))}
                      containerClassName="gap-3"
                      aria-label="Confirm new transaction PIN"
                    >
                      <InputOTPGroup>
                        <MaskedSlot index={0} />
                        <MaskedSlot index={1} />
                        <MaskedSlot index={2} />
                        <MaskedSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {confirmNewPin.length === 4 && newPin !== confirmNewPin && (
                    <p className="text-xs text-destructive text-center">PINs do not match.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          {!status.hasPin ? (
            <Button onClick={handleSet} disabled={saving || loadingStatus || isLocked || !setPinsMatch}>
              {saving ? 'Saving...' : 'Save PIN'}
            </Button>
          ) : (
            <Button onClick={handleChange} disabled={saving || loadingStatus || isLocked || !changePinsValid}>
              {saving ? 'Saving...' : 'Change PIN'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
