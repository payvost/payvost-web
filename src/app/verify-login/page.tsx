'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailCheck, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function VerifyLoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (loading) return;

    // If no user, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    let interval: NodeJS.Timeout | null = null;

    // Reload user to get latest verification status
    user.reload().then(() => {
      // If user is already verified, track login and redirect immediately
      if (user.emailVerified) {
        setIsVerified(true);
        
        // Track login event
        user.getIdToken().then((idToken) => {
          axios.post('/api/auth/track-login', { idToken }).catch((trackError) => {
            // Non-critical error, continue with login
            console.warn('Failed to track login:', trackError);
          });
        });

        toast({
          title: 'Login Verified!',
          description: 'Your email is already verified. Redirecting to dashboard...',
        });
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
        return;
      }

      // If not verified, check periodically for verification
      interval = setInterval(async () => {
        if (user) {
          await user.reload();
          if (user.emailVerified) {
            if (interval) clearInterval(interval);
            setIsVerified(true);
            
            // Track login event
            try {
              const idToken = await user.getIdToken();
              await axios.post('/api/auth/track-login', { idToken });
            } catch (trackError) {
              // Non-critical error, continue with login
              console.warn('Failed to track login:', trackError);
            }

            toast({
              title: 'Login Verified!',
              description: 'Your login has been verified. Redirecting to dashboard...',
            });
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
          }
        }
      }, 3000);
    });

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, router, toast, loading]);

  const handleResendVerification = async () => {
    if (!user || !user.email) return;

    setIsSending(true);
    try {
      // Use Firebase's built-in sendEmailVerification method
      const { sendEmailVerification } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      
      // Reload user to get latest auth state
      await user.reload();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not found');
      }
      
      await sendEmailVerification(currentUser);
      
      toast({
        title: 'Verification email sent',
        description: 'Please check your email and click the verification link.',
      });
    } catch (error: any) {
      console.error('Failed to send verification email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send verification email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center">
          <Icons.logo className="h-8" />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card text-center">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
              {isVerified ? (
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              ) : (
                <MailCheck className="h-10 w-10 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl mt-4">
              {isVerified ? 'Login Verified!' : 'Verify Your Login'}
            </CardTitle>
            <CardDescription>
              {isVerified ? (
                'Your login has been successfully verified.'
              ) : (
                <>
                  A verification link has been sent to your email address:
                  <br />
                  <strong className="text-foreground">{user.email}</strong>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isVerified ? (
              <p className="text-muted-foreground text-sm">
                Redirecting you to your dashboard...
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Please click the link in the email to verify your login. Once verified, you will be automatically redirected to your dashboard.
              </p>
            )}
          </CardContent>
          {!isVerified && (
            <CardFooter className="flex-col space-y-4">
              <Button onClick={handleResendVerification} disabled={isSending} className="w-full">
                {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resend Verification Email
              </Button>
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or resend.
              </p>
              <Link href="/login" className="text-sm underline">
                Back to Login
              </Link>
            </CardFooter>
          )}
        </Card>
      </main>
    </div>
  );
}

