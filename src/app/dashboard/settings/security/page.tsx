'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Mail, ShieldCheck, X, AlertTriangle, ArrowRight } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TwoFactorSettings } from '@/components/two-factor-settings';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [emailVerified, setEmailVerified] = useState<boolean>(Boolean(user?.emailVerified));
  const [sendingVerification, setSendingVerification] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setEmailVerified(Boolean(user?.emailVerified));
  }, [user?.emailVerified]);

  const refreshEmailVerification = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      await user.reload();
      setEmailVerified(Boolean(user.emailVerified));
      toast({ title: 'Updated', description: 'Email verification status refreshed.' });
    } catch (err) {
      console.error('Failed to refresh email verification:', err);
      toast({
        title: 'Refresh failed',
        description: 'Could not refresh verification status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const resendVerification = async () => {
    if (!user?.email) return;
    setSendingVerification(true);
    try {
      const res = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          displayName: user.displayName || 'User',
          appName: 'Payvost',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to send verification email');
      }
      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox and follow the link to verify your email.',
      });
    } catch (err: any) {
      console.error('Failed to send verification email:', err);
      toast({
        title: 'Send failed',
        description: err?.message || 'Failed to send verification email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground">Protect your account with email verification and 2FA.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Verification
              </CardTitle>
              <CardDescription>Verify your email address for account security.</CardDescription>
            </div>
            {emailVerified ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Verified
              </Badge>
            ) : (
              <Badge variant="secondary">
                <X className="mr-1 h-3 w-3" /> Not verified
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailVerified ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Your email address <strong>{user?.email || '—'}</strong> is verified.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your email address <strong>{user?.email || '—'}</strong> is not verified.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={refreshEmailVerification} variant="outline" disabled={!user || refreshing}>
              {refreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing...
                </>
              ) : (
                'Refresh status'
              )}
            </Button>
            {!emailVerified && (
              <Button onClick={resendVerification} disabled={!user || sendingVerification} className="sm:flex-1">
                {sendingVerification ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" /> Resend verification email
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <TwoFactorSettings />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Account Security Shortcuts
          </CardTitle>
          <CardDescription>Manage password and transaction PIN from your profile page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild variant="outline" className="w-full justify-between">
            <Link href="/dashboard/profile">
              <span>Change password</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-between">
            <Link href="/dashboard/profile">
              <span>Manage transaction PIN</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

