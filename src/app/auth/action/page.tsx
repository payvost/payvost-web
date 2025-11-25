'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode, checkActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertCircle, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

type ActionMode = 'verifyEmail' | 'resetPassword' | 'recoverEmail' | 'unknown';

function AuthActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [actionMode, setActionMode] = useState<ActionMode>('unknown');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const handleAction = async () => {
      const mode = searchParams.get('mode');
      const oobCode = searchParams.get('oobCode');
      const continueUrl = searchParams.get('continueUrl');

      if (!mode || !oobCode) {
        setStatus('error');
        setMessage('Invalid action link. Missing required parameters.');
        return;
      }

      try {
        switch (mode) {
          case 'verifyEmail':
            setActionMode('verifyEmail');
            // Verify the action code first
            await checkActionCode(auth, oobCode);
            // Apply the action code to verify the email
            await applyActionCode(auth, oobCode);
            setStatus('success');
            setMessage('Your email has been successfully verified!');
            // Redirect after 2 seconds
            setTimeout(() => {
              router.push(continueUrl || '/dashboard');
            }, 2000);
            break;

          case 'resetPassword':
            setActionMode('resetPassword');
            // Verify the reset code is valid
            await verifyPasswordResetCode(auth, oobCode);
            setStatus('success');
            setMessage('Please enter your new password below.');
            break;

          case 'recoverEmail':
            setActionMode('recoverEmail');
            setStatus('error');
            setMessage('Email recovery is not yet implemented.');
            break;

          default:
            setStatus('error');
            setMessage(`Unknown action mode: ${mode}`);
        }
      } catch (error: any) {
        console.error('Action error:', error);
        setStatus('error');
        
        let errorMessage = 'An error occurred while processing your request.';
        switch (error.code) {
          case 'auth/expired-action-code':
            errorMessage = 'This link has expired. Please request a new verification email.';
            break;
          case 'auth/invalid-action-code':
            errorMessage = 'This link is invalid or has already been used.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
        setMessage(errorMessage);
      }
    };

    handleAction();
  }, [searchParams, router]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const oobCode = searchParams.get('oobCode');
    
    if (!oobCode) {
      setMessage('Invalid reset link.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsResetting(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
      setMessage('Your password has been reset successfully! Redirecting to login...');
      toast({
        title: 'Success',
        description: 'Your password has been reset successfully!',
      });
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      const errorMsg = error.message || 'Failed to reset password. Please try again.';
      setMessage(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/10">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Processing your request...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-background">
        <Link href="/" className="flex items-center justify-center">
          <Icons.logo className="h-8" />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
              {status === 'success' ? (
                actionMode === 'verifyEmail' ? (
                  <MailCheck className="h-10 w-10 text-primary" />
                ) : (
                  <CheckCircle className="h-10 w-10 text-primary" />
                )
              ) : (
                <AlertCircle className="h-10 w-10 text-destructive" />
              )}
            </div>
            <CardTitle className="text-2xl mt-4 text-center">
              {status === 'success' 
                ? actionMode === 'verifyEmail' 
                  ? 'Email Verified!' 
                  : 'Reset Password'
                : 'Error'}
            </CardTitle>
            <CardDescription className="text-center">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'success' && actionMode === 'resetPassword' && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Enter your new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Confirm your new password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isResetting}>
                  {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </form>
            )}
            {status === 'error' && (
              <div className="text-center space-y-4">
                <Link href="/login">
                  <Button variant="outline" className="w-full">Go to Login</Button>
                </Link>
                <Link href="/register">
                  <Button variant="ghost" className="w-full">Create Account</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-muted/10">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <AuthActionContent />
    </Suspense>
  );
}

