"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup } from "@/components/ui/input-otp";
import { OTPInputContext } from "input-otp";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { generateSalt, hashPinWithSalt } from "@/lib/crypto";

interface Props {
  userId: string;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onCompleted?: () => void;
  force?: boolean; // if true, hide cancel button
}

// Local masked slot to render bullets instead of showing raw digits
const MaskedSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
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
        "relative flex h-14 w-14 items-center justify-center border-y border-r border-input text-2xl font-semibold transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      )}
      aria-label={`PIN slot ${index + 1}`}
      {...props}
    >
      {char ? '•' : null}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});
MaskedSlot.displayName = "MaskedSlot";

export function TransactionPinSetupDialog({ userId, open, onOpenChange, onCompleted, force = false }: Props) {
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setPin("");
      setConfirmPin("");
      setSaving(false);
    }
  }, [open]);

  // Common/weak PINs that should be rejected
  const WEAK_PINS = [
    '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
    '1234', '4321', '0123', '3210',
    '1010', '2020', '3030', '4040', '5050', '6060', '7070', '8080', '9090',
    '1122', '2211', '1212', '2121',
    '0001', '1000', '1233', '3211',
    '2468', '1357', '9753', '8642',
  ];

  const pinValid = useMemo(() => /^\d{4}$/.test(pin), [pin]);
  const pinsMatch = pinValid && pin === confirmPin;
  const isWeakPin = useMemo(() => {
    if (!pinValid) return false;
    return WEAK_PINS.includes(pin);
  }, [pin, pinValid]);

  const handleSave = async () => {
    if (!userId) return;
    if (!pinValid) {
      toast({ title: "Invalid PIN", description: "PIN must be exactly 4 digits.", variant: "destructive" });
      return;
    }
    if (isWeakPin) {
      toast({ 
        title: "Weak PIN", 
        description: "This PIN is too common or predictable. Please choose a more secure PIN.", 
        variant: "destructive" 
      });
      return;
    }
    if (!pinsMatch) {
      toast({ title: "PINs do not match", description: "Please re-enter to confirm.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const salt = generateSalt(16);
      const hash = await hashPinWithSalt(pin, salt);
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        transactionPinSalt: salt,
        transactionPinHash: hash,
        transactionPinUpdatedAt: new Date(),
      });
      toast({ title: "PIN set", description: "Your transaction PIN has been saved." });
      onOpenChange?.(false);
      onCompleted?.();
    } catch (err: any) {
      console.error("Failed to save transaction PIN", err);
      toast({ title: "Failed to save PIN", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create your 4-digit transaction PIN</DialogTitle>
          <DialogDescription>
            You’ll use this PIN to confirm sensitive actions like transfers or withdrawals. Do not share it with anyone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Enter PIN */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-center block" htmlFor="pin-input">Enter PIN</label>
            <div id="pin-input" className="flex justify-center">
              <InputOTP
                maxLength={4}
                value={pin}
                onChange={(val) => setPin(val.replace(/[^0-9]/g, '').slice(0, 4))}
                containerClassName="gap-3"
                aria-label="Enter 4 digit transaction PIN"
              >
                  <InputOTPGroup>
                    <MaskedSlot index={0} className="h-12 w-12 text-xl" />
                    <MaskedSlot index={1} className="h-12 w-12 text-xl" />
                    <MaskedSlot index={2} className="h-12 w-12 text-xl" />
                    <MaskedSlot index={3} className="h-12 w-12 text-xl" />
                  </InputOTPGroup>
              </InputOTP>
            </div>
            {isWeakPin && (
              <p className="text-xs text-destructive mt-1">
                This PIN is too common or predictable. Please choose a more secure PIN.
              </p>
            )}
          </div>
          {/* Confirm PIN */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-center block" htmlFor="pin-confirm-input">Confirm PIN</label>
            <div id="pin-confirm-input" className="flex justify-center">
              <InputOTP
                maxLength={4}
                value={confirmPin}
                onChange={(val) => setConfirmPin(val.replace(/[^0-9]/g, '').slice(0, 4))}
                containerClassName="gap-3"
                aria-label="Confirm 4 digit transaction PIN"
              >
                <InputOTPGroup>
                  <MaskedSlot index={0} className="h-12 w-12 text-xl" />
                  <MaskedSlot index={1} className="h-12 w-12 text-xl" />
                  <MaskedSlot index={2} className="h-12 w-12 text-xl" />
                  <MaskedSlot index={3} className="h-12 w-12 text-xl" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {!pinsMatch && (pin.length === 4 || confirmPin.length === 4) && (
              <p className="text-xs text-destructive">PINs must be 4 digits and match exactly.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          {!force && (
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={saving}>
              Not now
            </Button>
          )}
          <Button onClick={handleSave} disabled={!pinsMatch || saving}>
            {saving ? 'Saving…' : 'Save PIN'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
