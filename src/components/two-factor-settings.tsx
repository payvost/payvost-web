'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ShieldCheck, Shield, Mail, Smartphone, Loader2, CheckCircle2, X } from 'lucide-react';
import { FirebaseMFASetupDialog } from './firebase-mfa-setup-dialog';
import { multiFactor } from 'firebase/auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TwoFactorStatus {
  enabled: boolean;
  method: string | null;
  verified: boolean;
  hasBackupCodes: boolean;
}

export function TwoFactorSettings() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStatus();
    }
  }, [user]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/2fa/status', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!user) return;
    
    setDisabling(true);
    try {
      // Get enrolled factors
      const enrolledFactors = multiFactor(user).enrolledFactors;
      
      if (enrolledFactors.length === 0) {
        toast({
          title: 'No 2FA Enrolled',
          description: '2FA is not enabled on your account',
          variant: 'destructive',
        });
        setDisableDialogOpen(false);
        return;
      }

      // Unenroll all factors (usually just one)
      for (const factor of enrolledFactors) {
        await multiFactor(user).unenroll(factor);
      }

      // Record unenrollment in Firestore
      const idToken = await user.getIdToken();
      const response = await fetch('/api/2fa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to record unenrollment');
      }

      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled. Check your email for confirmation.',
      });

      await fetchStatus();
      setDisableDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disable 2FA',
        variant: 'destructive',
      });
    } finally {
      setDisabling(false);
    }
  };

  const getMethodIcon = (method: string | null) => {
    switch (method) {
      case 'authenticator':
        return <Shield className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <ShieldCheck className="h-4 w-4" />;
    }
  };

  const getMethodLabel = (method: string | null) => {
    switch (method) {
      case 'authenticator':
        return 'Authenticator App';
      case 'email':
        return 'Email';
      case 'sms':
        return 'SMS';
      default:
        return 'Not configured';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
            {status?.enabled ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary">
                <X className="h-3 w-3 mr-1" />
                Disabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.enabled ? (
            <>
              <Alert>
                <AlertDescription className="flex items-center gap-2">
                  {getMethodIcon(status.method)}
                  <span>
                    2FA is enabled using <strong>{getMethodLabel(status.method)}</strong>
                  </span>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSetupDialogOpen(true)}
                  className="flex-1"
                >
                  Change Method
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDisableDialogOpen(true)}
                  className="flex-1"
                >
                  Disable 2FA
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in.
              </p>
              
              <Button onClick={() => setSetupDialogOpen(true)} className="w-full">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Enable Two-Factor Authentication
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <FirebaseMFASetupDialog
        open={setupDialogOpen}
        onOpenChange={setSetupDialogOpen}
        onSetupComplete={fetchStatus}
      />

      <AlertDialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make your account less secure. You'll only need your password to sign in.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisable} disabled={disabling}>
              {disabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
