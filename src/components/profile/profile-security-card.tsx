'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Eye, EyeOff, Fingerprint, KeyRound, ShieldCheck } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { TransactionPinDialog } from '@/components/profile/transaction-pin-dialog';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

type PinStatus = { hasPin: boolean; lockedUntil: string | null };

async function loadPinStatus(token: string): Promise<PinStatus> {
  const res = await fetch('/api/security/pin/status', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load PIN status');
  const data = (await res.json()) as Partial<PinStatus>;
  return {
    hasPin: Boolean(data.hasPin),
    lockedUntil: typeof data.lockedUntil === 'string' ? data.lockedUntil : null,
  };
}

export function ProfileSecurityCard() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [pinStatus, setPinStatus] = useState<PinStatus>({ hasPin: false, lockedUntil: null });
  const [pinStatusLoading, setPinStatusLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  const refreshPinStatus = async () => {
    if (!user) return;
    try {
      setPinStatusLoading(true);
      const token = await user.getIdToken();
      const status = await loadPinStatus(token);
      setPinStatus(status);
    } catch (err) {
      console.error('PIN status refresh error:', err);
      setPinStatus({ hasPin: false, lockedUntil: null });
    } finally {
      setPinStatusLoading(false);
    }
  };

  useEffect(() => {
    void refreshPinStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onPasswordSubmit: SubmitHandler<PasswordFormValues> = async (data) => {
    if (!user || !user.email) {
      toast({ title: 'Error', description: 'Not authenticated.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, data.newPassword);

      try {
        const { notifyPasswordChanged } = await import('@/lib/unified-notifications');
        await notifyPasswordChanged(user.uid);
      } catch (notifError) {
        console.error('Password notification error:', notifError);
      }

      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
      reset();
      setPasswordOpen(false);
    } catch (error) {
      console.error('Password update error:', error);
      toast({
        title: 'Error updating password',
        description: 'Your current password may be incorrect.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const lockedUntilText =
    pinStatus.lockedUntil && Number.isFinite(new Date(pinStatus.lockedUntil).getTime())
      ? new Date(pinStatus.lockedUntil).toLocaleString()
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <KeyRound className="mr-2 h-4 w-4" />
              Change password
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit(onPasswordSubmit)}>
              <DialogHeader>
                <DialogTitle>Change password</DialogTitle>
                <DialogDescription>Enter your current password and a new password.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input id="currentPassword" type="password" {...register('currentPassword')} />
                  {errors.currentPassword && (
                    <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <div className="relative">
                    <Input id="newPassword" type={showPassword ? 'text' : 'password'} {...register('newPassword')} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowPassword((p) => !p)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      {...register('confirmPassword')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowConfirm((p) => !p)}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setPasswordOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Update password'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={async () => {
            if (pinStatusLoading) return;
            await refreshPinStatus();
            setPinOpen(true);
          }}
        >
          <Fingerprint className="mr-2 h-4 w-4" />
          {pinStatus.hasPin ? 'Change transaction PIN' : 'Set transaction PIN'}
        </Button>

        {lockedUntilText && (
          <p className="text-xs text-muted-foreground">
            PIN locked until {lockedUntilText}.
          </p>
        )}

        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/dashboard/settings/security">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Two-factor authentication (2FA)
          </Link>
        </Button>

        <TransactionPinDialog
          open={pinOpen}
          onOpenChange={(o) => setPinOpen(o)}
          onChanged={async () => {
            await refreshPinStatus();
          }}
        />
      </CardContent>
    </Card>
  );
}

