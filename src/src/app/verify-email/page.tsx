
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { sendEmailVerification } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailCheck } from 'lucide-react';

export default function VerifyEmailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(interval);
          toast({
            title: 'Success!',
            description: 'Your email has been verified. Redirecting to dashboard...',
          });
          router.push('/dashboard');
        }
      }
    }, 3000);

    // If user is already verified (e.g. they refresh the page after verifying), redirect them
    if (user && user.emailVerified) {
        clearInterval(interval);
        router.push('/dashboard');
    }

    // If there is no user, redirect to login
    if (!loading && !user) {
        router.push('/login');
    }

    return () => clearInterval(interval);
  }, [user, router, toast, loading]);
  
  const handleResendVerification = async () => {
    if (!user) {
        toast({ title: 'Error', description: 'You are not logged in.', variant: 'destructive' });
        return;
    }
    setIsSending(true);
    try {
        await sendEmailVerification(user);
        toast({
            title: 'Verification Email Sent',
            description: 'A new verification link has been sent to your email.',
        });
    } catch (error) {
        toast({
            title: 'Error',
            description: 'Failed to send verification email. Please try again later.',
            variant: 'destructive',
        });
    } finally {
        setIsSending(false);
    }
  };


  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
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
                <MailCheck className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl mt-4">Verify Your Email</CardTitle>
            <CardDescription>
              A verification link has been sent to your email address:
              <br />
              <strong className="text-foreground">{user.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
                Please click the link in the email to activate your account. Once verified, you will be automatically redirected to your dashboard.
            </p>
          </CardContent>
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
        </Card>
      </main>
    </div>
  );
}
