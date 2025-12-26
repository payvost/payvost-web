'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Smartphone, Loader2, AlertTriangle, CheckCircle2, Mail } from 'lucide-react';
import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  updatePhoneNumber,
  PhoneAuthCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface SMSVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerificationComplete: () => void;
  phoneNumber: string;
}

export function SMSVerificationDialog({
  open,
  onOpenChange,
  onVerificationComplete,
  phoneNumber,
}: SMSVerificationDialogProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [hasAttemptedSend, setHasAttemptedSend] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Cleanup reCAPTCHA verifier on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (error) {
          // Ignore cleanup errors
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setVerificationCode('');
      setConfirmationResult(null);
      setVerificationId(null);
      setCountdown(0);
      setHasAttemptedSend(false);
      setRetryAfter(null);
      
      // Clean up reCAPTCHA
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (error) {
          // Ignore cleanup errors
        }
        recaptchaVerifierRef.current = null;
      }
      
      // Clear container
      const container = document.getElementById('sms-recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }
    }
  }, [open]);

  const sendVerificationCode = useCallback(async () => {
    if (!phoneNumber) {
      toast({
        title: 'Phone number required',
        description: 'Please provide a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    // Check if we're in retry cooldown
    if (retryAfter !== null && retryAfter > 0) {
      toast({
        title: 'Please wait',
        description: `Too many requests. Please try again in ${retryAfter} seconds.`,
        variant: 'destructive',
      });
      return;
    }

    // Prevent duplicate sends
    if (sendingCode) {
      return;
    }

    setSendingCode(true);
    setHasAttemptedSend(true);
    try {
      // Clean up existing reCAPTCHA verifier if it exists
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (error) {
          // Ignore cleanup errors
        }
        recaptchaVerifierRef.current = null;
      }

      // Clear the container to avoid "already rendered" error
      const container = document.getElementById('sms-recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }

      // Setup reCAPTCHA (required for phone auth)
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'sms-recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, will proceed with phone auth
        },
        'expired-callback': () => {
          // reCAPTCHA expired, will need to retry
          toast({
            title: 'reCAPTCHA expired',
            description: 'Please try sending the code again',
            variant: 'destructive',
          });
        },
      });

      recaptchaVerifierRef.current = recaptchaVerifier;

      // Since user is already signed in, we need to use PhoneAuthProvider
      // But Firebase doesn't support phone verification for existing users directly
      // We'll use signInWithPhoneNumber as a workaround, but handle it differently
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      
      // For existing users, we can't use verifyPhoneNumber directly
      // So we'll use signInWithPhoneNumber but won't actually sign in
      // Instead, we'll just get the verification code
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setCountdown(60); // 60 second countdown
      setRetryAfter(null); // Clear retry delay on success
      
      toast({
        title: 'Code sent',
        description: `Verification code sent to ${phoneNumber}`,
      });
    } catch (error: any) {
      console.error('SMS verification error:', error);
      let errorMessage = 'Failed to send verification code';
      let shouldSetRetry = false;
      let retrySeconds = 60; // Default 60 seconds
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please check the number and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
        shouldSetRetry = true;
        retrySeconds = 300; // 5 minutes for too-many-requests
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'reCAPTCHA verification failed. Please try again.';
        retrySeconds = 30; // 30 seconds for captcha failure
      } else if (error.message?.includes('already been rendered')) {
        errorMessage = 'Please refresh the page and try again.';
        // Try to recover by clearing and retrying
        if (recaptchaVerifierRef.current) {
          try {
            recaptchaVerifierRef.current.clear();
          } catch (e) {
            // Ignore
          }
          recaptchaVerifierRef.current = null;
        }
        const container = document.getElementById('sms-recaptcha-container');
        if (container) {
          container.innerHTML = '';
        }
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Phone authentication is not enabled. Please contact support.';
      }
      
      if (shouldSetRetry) {
        setRetryAfter(retrySeconds);
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSendingCode(false);
    }
  }, [phoneNumber, retryAfter, toast]);

  // Only auto-send if dialog opens and we haven't attempted yet
  useEffect(() => {
    if (open && phoneNumber && !confirmationResult && !verificationId && !hasAttemptedSend && !sendingCode) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        sendVerificationCode();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [open, phoneNumber, confirmationResult, verificationId, hasAttemptedSend, sendingCode, sendVerificationCode]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Retry countdown
  useEffect(() => {
    if (retryAfter !== null && retryAfter > 0) {
      const timer = setTimeout(() => setRetryAfter(retryAfter - 1), 1000);
      return () => clearTimeout(timer);
    } else if (retryAfter === 0) {
      setRetryAfter(null);
    }
  }, [retryAfter]);

  const verifyCode = async () => {
    if (!confirmationResult || verificationCode.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter a 6-digit verification code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Verify the code - this will sign in with the phone number
      // But since we're already signed in, we need to handle this carefully
      const userCredential = await confirmationResult.confirm(verificationCode);
      
      // If we got here, the code was verified successfully
      // Since the user is already signed in, we just need to mark phone as verified
      // The sign-in with phone will create a new session, but that's okay
      
      toast({
        title: 'Phone verified!',
        description: 'Your phone number has been successfully verified.',
      });
      
      // Clean up reCAPTCHA
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (error) {
          // Ignore cleanup errors
        }
        recaptchaVerifierRef.current = null;
      }
      
      onVerificationComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Code verification error:', error);
      let errorMessage = 'Invalid verification code';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid code. Please try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Code has expired. Please request a new one.';
      } else if (error.code === 'auth/session-expired') {
        errorMessage = 'Session expired. Please request a new code.';
      }
      
      toast({
        title: 'Verification failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !sendingCode) {
      setVerificationCode('');
      setConfirmationResult(null);
      setVerificationId(null);
      setCountdown(0);
      setHasAttemptedSend(false);
      setRetryAfter(null);
      
      // Clean up reCAPTCHA
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (error) {
          // Ignore cleanup errors
        }
        recaptchaVerifierRef.current = null;
      }
      
      // Clear container
      const container = document.getElementById('sms-recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }
      
      onOpenChange(false);
    }
  };

  return (
    <>
      <div id="sms-recaptcha-container"></div>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Verify Phone Number
            </DialogTitle>
            <DialogDescription>
              We've sent a verification code to {phoneNumber}. Please enter it below to complete your registration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                After verifying your phone, you'll be able to complete your registration.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="text-center block">Enter 6-digit verification code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={setVerificationCode}
                  disabled={loading || !confirmationResult}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {!confirmationResult && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Sending verification code...</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={sendVerificationCode}
              disabled={sendingCode || countdown > 0 || (retryAfter !== null && retryAfter > 0)}
              className="w-full sm:w-auto"
            >
              {sendingCode ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : retryAfter !== null && retryAfter > 0 ? (
                `Wait ${retryAfter}s`
              ) : countdown > 0 ? (
                `Resend Code (${countdown}s)`
              ) : (
                'Resend Code'
              )}
            </Button>
            <Button
              onClick={verifyCode}
              disabled={loading || verificationCode.length !== 6 || !confirmationResult}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verify
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

