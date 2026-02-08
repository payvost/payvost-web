
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, TotpMultiFactorGenerator, PhoneMultiFactorGenerator, PhoneAuthProvider, RecaptchaVerifier, getMultiFactorResolver, type MultiFactorResolver, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Shield } from 'lucide-react';
import axios from 'axios';

const loginSchema = z.object({
  credential: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMfaDialog, setShowMfaDialog] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<'totp' | 'sms' | null>(null);
  const [smsVerificationId, setSmsVerificationId] = useState<string | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema)
  });

  const getSafeRedirect = () => {
    const raw = searchParams.get('redirect');
    if (!raw) return null;
    // Prevent open-redirects: only allow relative internal paths.
    if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
    return null;
  };

  const handleMfaRequired = async (error: any) => {
    if (error?.code !== 'auth/multi-factor-auth-required') return false;

    // Try to get resolver from error - try direct access first, then getMultiFactorResolver.
    let resolver: MultiFactorResolver | null = null;
    if (error?.resolver) {
      resolver = error.resolver;
    } else {
      try {
        resolver = getMultiFactorResolver(auth, error);
      } catch (resolverError: any) {
        console.error('Failed to get MFA resolver:', resolverError);
        throw {
          code: 'auth/multi-factor-auth-required',
          message: 'Multi-factor authentication is enabled on this account. Please complete verification, or contact support for assistance.'
        };
      }
    }

    if (!resolver?.hints || !Array.isArray(resolver.hints) || resolver.hints.length === 0) {
      throw { code: 'auth/multi-factor-auth-required', message: 'No MFA factors found' };
    }

    const selectedHint = resolver.hints[0];

    if (selectedHint.factorId === TotpMultiFactorGenerator.FACTOR_ID) {
      setMfaMethod('totp');
      setMfaResolver(resolver);
      setShowMfaDialog(true);
      return true;
    }

    if (selectedHint.factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
      setMfaMethod('sms');
      setMfaResolver(resolver);

      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      setRecaptchaVerifier(verifier);

      try {
        const phoneInfo = selectedHint as any;
        const phoneNumber = phoneInfo.phoneNumber || phoneInfo.phone || (phoneInfo as any).displayName;

        if (!phoneNumber) throw new Error('Phone number not found in MFA hint');
        if (!resolver.session) throw new Error('MFA resolver session is missing');

        const phoneAuthProvider = new PhoneAuthProvider(auth);
        const verificationId = await phoneAuthProvider.verifyPhoneNumber(
          { phoneNumber, session: resolver.session },
          verifier
        );
        setSmsVerificationId(verificationId);
        setShowMfaDialog(true);
        return true;
      } catch (smsError: any) {
        console.error('SMS send error:', smsError);
        try { verifier.clear(); } catch (e) { }
        throw { code: 'auth/sms-send-failed', message: 'Failed to send SMS code. Please try again.' };
      }
    }

    throw { code: 'auth/unsupported-mfa', message: 'Unsupported MFA method' };
  };

  const finalizeLogin = async (user: any) => {
    // Track login event (non-blocking)
    try {
      const idToken = await user.getIdToken();
      await axios.post('/api/auth/track-login', { idToken }).catch(() => { });
    } catch (trackError) {
      console.warn('Failed to track login:', trackError);
    }

    toast({
      title: "Login Successful",
      description: "Welcome back! Redirecting...",
    });

    router.push(getSafeRedirect() ?? '/dashboard');
  };

  const signInWithGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await finalizeLogin(result.user);
    } catch (error: any) {
      try {
        const handled = await handleMfaRequired(error);
        if (handled) return;
      } catch (mfaError: any) {
        error = mfaError;
      }

      console.error('Google login error details:', {
        code: error?.code,
        message: error?.message,
        error,
      });

      let errorMessage = "An unknown error occurred.";
      let errorTitle = "Login Failed";

      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in was cancelled.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup was blocked by the browser. Please allow popups and try again.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit: SubmitHandler<LoginValues> = async (data) => {
    setIsLoading(true);

    try {
      let emailToUse = data.credential.trim();
      if (!emailToUse.includes('@')) {
        // Resolve username -> email via server route (avoids client-side Firestore list permissions).
        const resp = await axios.post('/api/auth/resolve-credential', { credential: emailToUse });
        emailToUse = resp.data?.resolvedEmail || emailToUse;
      }

      // Sign in - if MFA is required, we'll handle it
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, emailToUse, data.password);
      } catch (error: any) {
        const handled = await handleMfaRequired(error);
        if (handled) {
          setIsLoading(false);
          return;
        }
        throw error;
      }

      const user = userCredential.user;
      await finalizeLogin(user);
    } catch (error: any) {
      // Log error details for debugging
      console.error('Login error details:', {
        code: error?.code,
        message: error?.message,
        error: error,
        hasResolver: !!error?.resolver,
        resolverType: error?.resolver ? typeof error.resolver : 'none'
      });

      let errorMessage = "An unknown error occurred.";
      let errorTitle = "Login Failed";

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled. Please contact support.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address format.";
      } else if (error.code === 'auth/multi-factor-auth-required') {
        errorMessage = "Multi-factor authentication is enabled on this account. Please disable MFA in your account settings or contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Always show error to user
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleMfaVerification = async () => {
    if (!mfaResolver || mfaCode.length !== 6) return;

    setMfaVerifying(true);
    try {
      let assertion;

      if (mfaMethod === 'totp') {
        // Get the TOTP hint
        if (!mfaResolver.hints || !Array.isArray(mfaResolver.hints)) {
          throw new Error('MFA resolver hints are missing or invalid');
        }

        const hints = mfaResolver.hints;
        const totpHint = hints.find(h => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);

        if (!totpHint) {
          throw new Error('TOTP factor not found');
        }

        // Create assertion for sign-in
        assertion = TotpMultiFactorGenerator.assertionForSignIn(
          totpHint.uid,
          mfaCode
        );
      } else if (mfaMethod === 'sms' && smsVerificationId) {
        // Create phone credential
        const cred = PhoneAuthProvider.credential(smsVerificationId, mfaCode);
        assertion = PhoneMultiFactorGenerator.assertion(cred);
      } else {
        throw new Error('Invalid MFA method');
      }

      // Resolve sign-in with assertion
      const userCredential = await mfaResolver.resolveSignIn(assertion);
      const user = userCredential.user;

      // Track login event (non-blocking)
      try {
        const idToken = await user.getIdToken();
        await axios.post('/api/auth/track-login', { idToken }).catch(() => { });
      } catch (trackError) {
        console.warn('Failed to track login:', trackError);
      }

      // Success
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting...",
      });

      setShowMfaDialog(false);
      setMfaCode('');
      setMfaResolver(null);
      setMfaMethod(null);
      setSmsVerificationId(null);

      // Clean up reCAPTCHA
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
        setRecaptchaVerifier(null);
      }

      router.push(getSafeRedirect() ?? '/dashboard');
    } catch (error: any) {
      console.error('MFA verification error:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid verification code. Please try again.',
        variant: 'destructive',
      });
      setMfaCode('');
    } finally {
      setMfaVerifying(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={signInWithGoogle}
          disabled={isLoading || isGoogleLoading || mfaVerifying}
        >
          {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.21-1.19-1.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
          )}
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => toast({ title: "Coming soon", description: "Apple sign in is currently in development." })}
          disabled={isLoading || isGoogleLoading || mfaVerifying}
        >
          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.24.75-.46 1.42-.89 2.33-.79 1.6-1.58 2.76-1.64 1.75zm-2.08-14.24c.54-1.28 1.44-1.95 2.56-2.04.14 1.34-.35 2.8-1.09 3.71-.85 1.09-2.03 1.65-3.03 1.42-.14-1.39.54-2.45 1.56-3.09z" />
          </svg>
          Apple
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="credential">Email or Username</Label>
            <Input id="credential" type="text" placeholder="jane or jane@example.com" {...register('credential')} />
            {errors.credential && <p className="text-sm text-destructive">{errors.credential.message}</p>}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="ml-auto inline-block text-sm underline">
                Forgot your password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
              </Button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </div>
      </form>

      {/* MFA Verification Dialog */}
      <Dialog open={showMfaDialog} onOpenChange={setShowMfaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              {mfaMethod === 'totp'
                ? 'Enter the 6-digit code from your authenticator app'
                : 'Enter the 6-digit code sent to your phone'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                {mfaMethod === 'totp'
                  ? 'Open your authenticator app and enter the current code.'
                  : 'Check your phone for the verification code.'}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="text-center block">Enter 6-digit code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={mfaCode}
                  onChange={setMfaCode}
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
          </div>

          {/* Hidden reCAPTCHA container for SMS */}
          {mfaMethod === 'sms' && <div id="recaptcha-container"></div>}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMfaDialog(false);
                setMfaCode('');
                setMfaResolver(null);
                setMfaMethod(null);
                setSmsVerificationId(null);
                if (recaptchaVerifier) {
                  try {
                    recaptchaVerifier.clear();
                  } catch (e) { }
                  setRecaptchaVerifier(null);
                }
              }}
              disabled={mfaVerifying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMfaVerification}
              disabled={mfaVerifying || mfaCode.length !== 6}
            >
              {mfaVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
