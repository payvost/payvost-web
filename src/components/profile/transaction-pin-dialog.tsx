'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup } from '@/components/ui/input-otp';
import { OTPInputContext } from 'input-otp';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { isValidPinFormat, isWeakPin } from '@/lib/security/pin-policy';
import { ShieldCheck, Lock, ArrowLeft, Check, AlertCircle } from 'lucide-react';

type PinStatus = { hasPin: boolean; lockedUntil: string | null };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

const MaskedSlot = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & { index: number; isError?: boolean }
>(({ index, className, isError, ...props }, ref) => {
  const inputOTPContext: any = React.useContext(OTPInputContext) ?? {};
  const slot = inputOTPContext.slots?.[index] ?? {};
  const char = slot.char as string | undefined;
  const hasFakeCaret = slot.hasFakeCaret as boolean | undefined;
  const isActive = slot.isActive as boolean | undefined;

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex h-14 w-12 items-center justify-center text-2xl font-bold transition-all duration-300',
        'border-b-2 border-border/50 bg-transparent',
        isActive && 'border-primary scale-110',
        isActive && isError && 'border-destructive',
        !isActive && char && 'border-foreground/50',
        isError && !isActive && 'border-destructive/50',
        className
      )}
      {...props}
    >
      <div className={cn(
        "h-3 w-3 rounded-full bg-foreground transition-all duration-300",
        char ? "scale-100 opacity-100" : "scale-0 opacity-0",
        isError && "bg-destructive"
      )} />
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-0.5 animate-caret-blink bg-primary/80 duration-1000" />
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

  // Stepped Flow State
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('new'); // 'current' is only for changing PIN
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      // If user has a PIN, start at 'current' step, else 'new'
      setStep(status.hasPin ? 'current' : 'new');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setErrorShake(false);
    }
  }, [open, status.hasPin]);

  // Fetch status on mount/open
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!open || !user) return;
      try {
        setLoadingStatus(true);
        const token = await user.getIdToken();
        const s = await fetchPinStatus(token);
        if (!cancelled) {
          setStatus(s);
          if (s.hasPin && step === 'new' && !currentPin) {
            setStep('current');
          }
        }
      } catch (err) {
        console.error('PIN status load error:', err);
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [open, user]);

  const isLocked = useMemo(() => {
    if (!status.lockedUntil) return false;
    const t = new Date(status.lockedUntil).getTime();
    return Number.isFinite(t) && t > Date.now();
  }, [status.lockedUntil]);

  // Trigger shake animation helper
  const triggerError = () => {
    setErrorShake(true);
    setTimeout(() => setErrorShake(false), 500); // Reset after animation
  };

  // Step Transitions
  const handleCurrentPinSubmit = () => {
    if (currentPin.length !== 4) return;
    setStep('new');
  };

  const handleNewPinSubmit = () => {
    if (newPin.length !== 4) return;
    if (isWeakPin(newPin)) {
      triggerError();
      toast({ title: 'Weak PIN', description: 'This PIN is too common. Try a harder one.', variant: 'destructive' });
      return;
    }
    if (status.hasPin && newPin === currentPin) {
      triggerError();
      toast({ title: 'New PIN must be different', description: 'You cannot reuse your old PIN.', variant: 'destructive' });
      return;
    }
    setStep('confirm');
  };

  const handleConfirmPinSubmit = async () => {
    if (confirmPin.length !== 4) return;

    if (confirmPin !== newPin) {
      triggerError();
      toast({ title: 'PINs do not match', description: 'Please try again.', variant: 'destructive' });
      setConfirmPin(''); // Clear confirm input
      // Optionally go back to 'new' step if we want them to re-type both, 
      // but usually just clearing confirm is enough. 
      // Let's keep them on confirm to retry, or if they forgot, they can go back.
      return;
    }

    // Determine action: Set or Change
    const isChange = status.hasPin;

    try {
      setSaving(true);
      const token = await user.getIdToken();

      let res;
      let body;

      if (isChange) {
        res = await fetch('/api/security/pin/change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ currentPin, newPin }),
        });
      } else {
        res = await fetch('/api/security/pin/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ pin: newPin }),
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 423 && data.lockedUntil) {
          setStatus(prev => ({ ...prev, lockedUntil: data.lockedUntil }));
          throw new Error('Too many attempts. PIN locked.');
        }
        throw new Error(data?.error || 'Operation failed');
      }

      // Success
      try {
        const { notifyPinChanged } = await import('@/lib/unified-notifications');
        await notifyPinChanged(user.uid);
      } catch (e) { console.error(e); }

      toast({
        title: isChange ? 'PIN Changed' : 'PIN Set',
        description: 'Your transaction PIN has been successfully updated.',
        className: 'bg-green-50 border-green-200 text-green-800' // Custom success style if supported
      });

      onOpenChange(false);
      onChanged?.();

    } catch (err: any) {
      console.error('PIN error:', err);
      triggerError();
      toast({ title: 'Error', description: err.message, variant: 'destructive' });

      // If it failed due to incorrect current PIN (403/401 typically, but mostly business logic error), 
      // we might want to send them back to the start.
      if (err.message.toLowerCase().includes('current') || err.message.toLowerCase().includes('incorrect')) {
        setStep('current');
        setCurrentPin('');
      }

    } finally {
      setSaving(false);
    }
  };

  // Auto-advance logic
  useEffect(() => {
    if (step === 'current' && currentPin.length === 4) handleCurrentPinSubmit();
  }, [currentPin, step]);

  useEffect(() => {
    // For new PIN, we might want to wait a split second or user interaction to avoid jumpiness, 
    // but standard pattern is often auto-advance. Let's add a small delay.
    if (step === 'new' && newPin.length === 4) {
      const t = setTimeout(() => handleNewPinSubmit(), 400);
      return () => clearTimeout(t);
    }
  }, [newPin, step]);

  useEffect(() => {
    if (step === 'confirm' && confirmPin.length === 4) {
      // Don't auto-submit for final action usually, to let user see what they typed? 
      // Actually for PINs (dots), they can't see it. So auto-submitting is fine if it matches.
      // However, triggering an API call automatically can be jarring if they mistyped.
      // Let's auto-submit for seamlessness, as requested.
      const t = setTimeout(() => handleConfirmPinSubmit(), 400);
      return () => clearTimeout(t);
    }
  }, [confirmPin, step]);


  const getStepTitle = () => {
    if (loadingStatus) return 'Checking status...';
    if (step === 'current') return 'Enter Current PIN';
    if (step === 'new') return status.hasPin ? 'Enter New PIN' : 'Create PIN';
    if (step === 'confirm') return 'Confirm PIN';
    return '';
  };

  const getStepDescription = () => {
    if (step === 'current') return 'To verify it\'s you, please enter your current PIN.';
    if (step === 'new') return 'Choose a secure 4-digit PIN for your transactions.';
    if (step === 'confirm') return 'Re-enter your PIN to verify.';
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-xl">
        <div className="bg-primary/5 p-6 flex flex-col items-center justify-center border-b border-border/50">
          <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center shadow-sm mb-3">
            {isLocked ? <Lock className="h-6 w-6 text-destructive" /> : <ShieldCheck className="h-6 w-6 text-primary" />}
          </div>
          <DialogTitle className="text-xl font-bold text-center tracking-tight">
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground mt-1.5 max-w-[260px]">
            {getStepDescription()}
          </DialogDescription>
        </div>

        <div className="p-6 space-y-6">
          {isLocked && (
            <div className="rounded-md bg-destructive/10 p-3 flex items-start gap-3 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Account locked until {status.lockedUntil && new Date(status.lockedUntil).toLocaleTimeString()}.
              </span>
            </div>
          )}

          <div className={cn("flex flex-col items-center gap-6", isLocked && "opacity-50 pointer-events-none")}>

            {step === 'current' && (
              <div className={cn("transition-all duration-300", errorShake && "animate-shake")}>
                <InputOTP
                  maxLength={4}
                  value={currentPin}
                  onChange={(val) => setCurrentPin(val.replace(/[^0-9]/g, ''))}
                  className="gap-4"
                  disabled={isLocked || saving}
                  autoFocus
                >
                  <InputOTPGroup className="gap-3">
                    {[0, 1, 2, 3].map((i) => <MaskedSlot key={i} index={i} isError={errorShake} />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}

            {step === 'new' && (
              <div className={cn("transition-all duration-300", errorShake && "animate-shake")}>
                <InputOTP
                  maxLength={4}
                  value={newPin}
                  onChange={(val) => setNewPin(val.replace(/[^0-9]/g, ''))}
                  className="gap-4"
                  disabled={isLocked || saving}
                  autoFocus
                >
                  <InputOTPGroup className="gap-3">
                    {[0, 1, 2, 3].map((i) => <MaskedSlot key={i} index={i} isError={errorShake} />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}

            {step === 'confirm' && (
              <div className={cn("transition-all duration-300", errorShake && "animate-shake")}>
                <InputOTP
                  maxLength={4}
                  value={confirmPin}
                  onChange={(val) => setConfirmPin(val.replace(/[^0-9]/g, ''))}
                  className="gap-4"
                  disabled={isLocked || saving}
                  autoFocus
                >
                  <InputOTPGroup className="gap-3">
                    {[0, 1, 2, 3].map((i) => <MaskedSlot key={i} index={i} isError={errorShake} />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}

            {/* Step Indicators */}
            <div className="flex gap-1.5 mt-2">
              {status.hasPin && <div className={cn("h-1.5 w-1.5 rounded-full transition-colors", step === 'current' ? "bg-primary" : "bg-primary/20")} />}
              <div className={cn("h-1.5 w-1.5 rounded-full transition-colors", step === 'new' ? "bg-primary" : "bg-primary/20", step === 'current' && "bg-primary/20", !status.hasPin && step === 'new' && "bg-primary")} />
              <div className={cn("h-1.5 w-1.5 rounded-full transition-colors", step === 'confirm' ? "bg-primary" : "bg-primary/20")} />
            </div>

          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/30 flex items-center justify-between sm:justify-between border-t">
          {step !== 'current' && !(step === 'new' && !status.hasPin) ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(prev => prev === 'confirm' ? 'new' : 'current')} disabled={saving} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={saving} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
          )}

          {/* 
              We rely on auto-advance, but keeping a hidden or disabled button can be useful for accessibility 
              or if auto-advance fails. For cleaner UI, we can show a status indicator or small action.
            */}
          {saving && <span className="text-xs text-muted-foreground animate-pulse">Processing...</span>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
