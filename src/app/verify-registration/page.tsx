'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { sendEmailVerification, reload } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailCheck, Smartphone, CheckCircle2 } from 'lucide-react';
import { SMSVerificationDialog } from '@/components/sms-verification-dialog';
import { TransactionPinSetupDialog } from '@/components/transaction-pin-setup-dialog';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function VerifyRegistrationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      checkVerificationStatus();
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || emailVerified) return;

    const interval = setInterval(async () => {
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          setEmailVerified(true);
          clearInterval(interval);
          // Get phone number from Firestore
          await loadPhoneNumber();
          // Open SMS verification dialog
          setSmsDialogOpen(true);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, emailVerified]);

  const checkVerificationStatus = async () => {
    if (!user) return;
    
    setCheckingStatus(true);
    try {
      await user.reload();
      const isEmailVerified = user.emailVerified;
      setEmailVerified(isEmailVerified);

      if (isEmailVerified) {
        // Check if phone is already verified
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setPhoneNumber(userData.phone || '');
          const isPhoneVerified = userData.phoneVerified || false;
          setPhoneVerified(isPhoneVerified);

          if (!isPhoneVerified && userData.phone) {
            setSmsDialogOpen(true);
          } else if (isPhoneVerified) {
            // Both verified, redirect to dashboard
            router.push('/dashboard');
          }
        }
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const loadPhoneNumber = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const phone = userData.phone || '';
        setPhoneNumber(phone);
      }
    } catch (error) {
      console.error('Error loading phone number:', error);
    }
  };

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

  const handleSMSVerificationComplete = async () => {
    if (!user) return;
    
    try {
      // Mark phone as verified in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        phoneVerified: true,
        updatedAt: new Date(),
      });
      
      setPhoneVerified(true);
      setSmsDialogOpen(false);
      
      toast({
        title: 'Phone verified!',
        description: 'Please set up your transaction PIN to complete registration.',
      });
      
      // Open PIN setup dialog
      setPinDialogOpen(true);
    } catch (error) {
      console.error('Error updating phone verification status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePinSetupComplete = () => {
    setPinDialogOpen(false);
    toast({
      title: 'Registration complete!',
      description: 'Your account is ready. Redirecting to dashboard...',
    });
    
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  if (checkingStatus || loading) {
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
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {emailVerified && phoneVerified ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Verification Complete
              </>
            ) : emailVerified ? (
              <>
                <Smartphone className="h-5 w-5" />
                Verify Phone Number
              </>
            ) : (
              <>
                <MailCheck className="h-5 w-5" />
                Verify Your Email
              </>
            )}
          </CardTitle>
          <CardDescription>
            {emailVerified && phoneVerified
              ? 'Your account has been successfully verified!'
              : emailVerified
              ? 'Please verify your phone number to complete registration.'
              : 'Please verify your email address to continue with registration.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!emailVerified ? (
            <>
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
            </>
          ) : !phoneVerified ? (
            <>
              <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
                <Smartphone className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {phoneNumber
                  ? `We'll send a verification code to ${phoneNumber}.`
                  : 'Please provide your phone number to receive a verification code.'}
              </p>
              {!phoneNumber && (
                <p className="text-xs text-center text-destructive">
                  No phone number found. Please contact support.
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to Login</Link>
          </Button>
        </CardFooter>
      </Card>

      {emailVerified && !phoneVerified && phoneNumber && (
        <SMSVerificationDialog
          open={smsDialogOpen}
          onOpenChange={setSmsDialogOpen}
          onVerificationComplete={handleSMSVerificationComplete}
          phoneNumber={phoneNumber}
        />
      )}

      {emailVerified && phoneVerified && user && (
        <TransactionPinSetupDialog
          open={pinDialogOpen}
          onOpenChange={setPinDialogOpen}
          userId={user.uid}
          onCompleted={handlePinSetupComplete}
        />
      )}
    </div>
  );
}

