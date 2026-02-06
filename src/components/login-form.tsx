
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, TotpMultiFactorGenerator, PhoneMultiFactorGenerator, PhoneAuthProvider, RecaptchaVerifier, getMultiFactorResolver, type MultiFactorResolver, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
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
        try { verifier.clear(); } catch (e) {}
        throw { code: 'auth/sms-send-failed', message: 'Failed to send SMS code. Please try again.' };
      }
    }

    throw { code: 'auth/unsupported-mfa', message: 'Unsupported MFA method' };
  };

  const finalizeLogin = async (user: any) => {
    // Track login event (non-blocking)
    try {
      const idToken = await user.getIdToken();
      await axios.post('/api/auth/track-login', { idToken }).catch(() => {});
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
      let emailToUse = data.credential;
      if (!data.credential.includes('@')) {
        // Resolve username -> email via Firestore
        const q = query(collection(db, 'users'), where('username', '==', data.credential), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
          throw { code: 'auth/user-not-found', message: 'Username does not exist' };
        }
        const docData: any = snap.docs[0].data();
        if (!docData.email) {
          throw { code: 'auth/user-not-found', message: 'No email associated with this username' };
        }
        emailToUse = docData.email;
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
        await axios.post('/api/auth/track-login', { idToken }).catch(() => {});
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
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signInWithGoogle}
        disabled={isLoading || isGoogleLoading || mfaVerifying}
      >
        {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.222 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.009 6.053 29.238 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 12 24 12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.009 6.053 29.238 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.135 0 9.835-1.971 13.389-5.183l-6.185-5.238C29.18 35.091 26.715 36 24 36c-5.201 0-9.62-3.318-11.283-7.946l-6.52 5.02C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.793 2.206-2.231 4.083-4.099 5.579l.003-.002 6.185 5.238C36.956 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
        )}
        Sign in with Google
      </Button>

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
                  } catch (e) {}
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
