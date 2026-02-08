"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup } from "@/components/ui/input-otp";
import { OTPInputContext } from "input-otp";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { isValidPinFormat, isWeakPin } from "@/lib/security/pin-policy";
import { Shield, ShieldCheck, ArrowLeft } from "lucide-react";

interface Props {
  userId: string;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onCompleted?: () => void;
  force?: boolean; // if true, hide cancel button
}

// Local masked slot to render bullets instead of showing raw digits.
const MaskedSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number; isError?: boolean }
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
MaskedSlot.displayName = "MaskedSlot";

export function TransactionPinSetupDialog({ userId, open, onOpenChange, onCompleted, force = false }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorShake, setErrorShake] = useState(false);

  useEffect(() => {
    if (open) {
      setStep('create');
      setPin("");
      setConfirmPin("");
      setSaving(false);
      setErrorShake(false);
    }
  }, [open]);

  const triggerError = () => {
    setErrorShake(true);
    setTimeout(() => setErrorShake(false), 500);
  };

  const handleCreateSubmit = () => {
    if (pin.length !== 4) return;
    if (isWeakPin(pin)) {
      triggerError();
      toast({ title: "Weak PIN", description: "This PIN is too common. Please choose a more secure PIN.", variant: "destructive" });
      return;
    }
    setStep('confirm');
  };

  const handleConfirmSubmit = async () => {
    if (confirmPin.length !== 4) return;

    if (confirmPin !== pin) {
      triggerError();
      toast({ title: "PINs do not match", description: "Please re-enter to confirm.", variant: "destructive" });
      setConfirmPin('');
      return;
    }

    if (!userId) return;
    if (!user || user.uid !== userId) {
      toast({ title: "Not authenticated", description: "Please sign in again.", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const token = await user.getIdToken();
      const res = await fetch("/api/security/pin/set", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to set PIN");
      }

      toast({
        title: "PIN Set",
        description: "Your transaction PIN has been saved.",
        className: 'bg-green-50 border-green-200 text-green-800'
      });

      onOpenChange?.(false);
      onCompleted?.();

    } catch (err: any) {
      console.error("Failed to save transaction PIN", err);
      triggerError();
      toast({ title: "Failed to save PIN", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Auto-advance
  useEffect(() => {
    if (step === 'create' && pin.length === 4) {
      const t = setTimeout(() => handleCreateSubmit(), 400);
      return () => clearTimeout(t);
    }
  }, [pin, step]);

  useEffect(() => {
    if (step === 'confirm' && confirmPin.length === 4) {
      const t = setTimeout(() => handleConfirmSubmit(), 400);
      return () => clearTimeout(t);
    }
  }, [confirmPin, step]);


  return (
    <Dialog open={open} onOpenChange={force ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-xl" onInteractOutside={force ? (e) => e.preventDefault() : undefined}>
        <div className="bg-primary/5 p-6 flex flex-col items-center justify-center border-b border-border/50">
          <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center shadow-sm mb-3">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold text-center tracking-tight">
            {step === 'create' ? 'Create Transaction PIN' : 'Confirm Transaction PIN'}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground mt-1.5 max-w-[260px]">
            {step === 'create'
              ? "You'll use this PIN to authorize sensitive actions."
              : "Re-enter your PIN to verify."}
          </DialogDescription>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center gap-6">

            {step === 'create' && (
              <div className={cn("transition-all duration-300", errorShake && "animate-shake")}>
                <InputOTP
                  maxLength={4}
                  value={pin}
                  onChange={(val) => setPin(val.replace(/[^0-9]/g, ''))}
                  className="gap-4"
                  disabled={saving}
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
                  disabled={saving}
                  autoFocus
                >
                  <InputOTPGroup className="gap-3">
                    {[0, 1, 2, 3].map((i) => <MaskedSlot key={i} index={i} isError={errorShake} />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}

            <div className="flex gap-1.5 mt-2">
              <div className={cn("h-1.5 w-1.5 rounded-full transition-colors", step === 'create' ? "bg-primary" : "bg-primary/20", step === 'confirm' && "bg-primary/20")} />
              <div className={cn("h-1.5 w-1.5 rounded-full transition-colors", step === 'confirm' ? "bg-primary" : "bg-primary/20")} />
            </div>

          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/30 flex items-center justify-between sm:justify-between border-t">
          {step === 'confirm' ? (
            <Button variant="ghost" size="sm" onClick={() => { setStep('create'); setPin(''); setConfirmPin(''); }} disabled={saving} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : (
            !force ? (
              <Button variant="ghost" size="sm" onClick={() => onOpenChange?.(false)} disabled={saving} className="text-muted-foreground hover:text-foreground">
                Not now
              </Button>
            ) : <div />
          )}

          {saving && <span className="text-xs text-muted-foreground animate-pulse">Processing...</span>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

