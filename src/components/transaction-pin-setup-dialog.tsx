"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

  const pinValid = useMemo(() => /^\d{4}$/.test(pin), [pin]);
  const pinsMatch = pinValid && pin === confirmPin;

  const handleSave = async () => {
    if (!userId) return;
    if (!pinValid) {
      toast({ title: "Invalid PIN", description: "PIN must be exactly 4 digits.", variant: "destructive" });
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
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="pin">Enter PIN</label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\\d{4}"
              placeholder="••••"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="confirmPin">Confirm PIN</label>
            <Input
              id="confirmPin"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\\d{4}"
              placeholder="••••"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            />
            {!pinsMatch && (pin.length > 0 || confirmPin.length > 0) && (
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
