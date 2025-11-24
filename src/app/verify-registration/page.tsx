'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { sendEmailVerification } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailCheck, CheckCircle2 } from 'lucide-react';

export default function VerifyRegistrationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    if (loading) return; // Wait for auth to finish loading
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if email is already verified
    if (user && user.emailVerified) {
      setEmailVerified(true);
      // Redirect to dashboard immediately
      toast({
        title: 'Email Verified!',
        description: 'Your registration is complete. Redirecting to dashboard...',
      });
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      return;
    }

    // Check periodically for email verification
    const interval = setInterval(async () => {
      if (user) {
        try {
          await user.reload();
          if (user.emailVerified) {
            setEmailVerified(true);
            clearInterval(interval);
            // Email verified - redirect to dashboard
            toast({
              title: 'Email Verified!',
              description: 'Your registration is complete. Redirecting to dashboard...',
            });
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
          }
        } catch (error) {
          console.error('Error reloading user:', error);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, loading, router, toast]);


  const handleResendEmailVerification = async () => {
    if (!user) return;
    
    setIsSendingEmail(true);
    try {
      await sendEmailVerification(user);
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
      setIsSendingEmail(false);
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

  if (emailVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailCheck className="h-5 w-5" />
            Verify Your Email
          </CardTitle>
          <CardDescription>
            Please verify your email address to complete registration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
            <MailCheck className="h-12 w-12 text-muted-foreground" />
          </div>
          <p className="text-sm text-center text-muted-foreground">
            We've sent a verification email to <strong>{user.email}</strong>.
            Please check your inbox and click the verification link.
          </p>
          <div className="space-y-2">
            <Button
              onClick={handleResendEmailVerification}
              disabled={isSendingEmail}
              variant="outline"
              className="w-full"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

