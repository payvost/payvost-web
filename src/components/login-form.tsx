
'use client';

import { useState } from 'react';
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, TotpMultiFactorGenerator, PhoneMultiFactorGenerator, PhoneAuthProvider, RecaptchaVerifier, getMultiFactorResolver, type MultiFactorResolver } from 'firebase/auth';
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


const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.84-4.24 1.84-3.53 0-6.47-2.94-6.47-6.57s2.94-6.57 6.47-6.57c2.02 0 3.34.82 4.14 1.62l2.33-2.33c-1.49-1.39-3.41-2.22-5.48-2.22-4.64 0-8.41 3.77-8.41 8.41s3.77 8.41 8.41 8.41c2.58 0 4.61-1.12 6.13-2.66 1.58-1.58 2.22-3.83 2.22-5.63 0-.6-.07-1.15-.17-1.69h-8.19z"
      />
    </svg>
  );
  
const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
      <svg role="img" viewBox="0 0 24 24" {...props} className="h-5 w-5">
          <path
          fill="currentColor"
          d="M12.01,16.23c-1.69,0-2.34-0.86-3.87-0.86c-1.57,0-2.43,0.85-3.9,0.85c-1.05,0-2.03-0.55-2.88-1.54   c-1.25-1.46-2.1-3.94-1.02-6.59c0.75-1.85,2.4-3.05,4.28-3.05c1.03,0,2.1,0.53,2.83,1.42c0.91-0.95,2.18-1.55,3.58-1.55   c0.55,0,1.38,0.2,2.05,0.59c-0.61,0.92-1.63,2.25-1.63,3.87c0,2.23,2.03,3.22,2.15,3.28c0.03,0.01-1.2,1.83-3.44,1.78"
          />
          <path
          fill="currentColor"
          d="M15.93,4.52c0.74-0.91,1.32-2.15,1.18-3.47c-1.21,0.05-2.44,0.76-3.2,1.67c-0.69,0.84-1.34,2.06-1.18,3.32   C13.95,6.09,15.1,5.33,15.93,4.52"
          />
      </svg>
  );

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
        // If MFA is required, extract resolver and show dialog
        if (error?.code === 'auth/multi-factor-auth-required') {
          // Use getMultiFactorResolver to extract resolver from error
          let resolver: MultiFactorResolver;
          try {
            resolver = getMultiFactorResolver(auth, error);
          } catch (resolverError: any) {
            console.error('Failed to get MFA resolver:', resolverError);
            console.error('Original error:', error);
            throw { 
              code: 'auth/multi-factor-auth-required', 
              message: 'Multi-factor authentication is enabled on this account. Please disable MFA in your account settings or contact support.' 
            };
          }
          
          // Check if resolver exists and has hints
          if (!resolver) {
            console.error('MFA resolver is missing from error:', error);
            throw { 
              code: 'auth/multi-factor-auth-required', 
              message: 'Multi-factor authentication is enabled on this account. Please disable MFA in your account settings or contact support.' 
            };
          }
          
          if (!resolver.hints || !Array.isArray(resolver.hints)) {
            console.error('MFA resolver hints are missing or invalid:', resolver);
            throw { 
              code: 'auth/multi-factor-auth-required', 
              message: 'Multi-factor authentication is enabled on this account. Please disable MFA in your account settings or contact support.' 
            };
          }
          
          const hints = resolver.hints;
          
          if (hints.length === 0) {
            throw { code: 'auth/multi-factor-auth-required', message: 'No MFA factors found' };
          }
          
          const selectedHint = hints[0];
          
          // Determine MFA method
          if (selectedHint.factorId === TotpMultiFactorGenerator.FACTOR_ID) {
            setMfaMethod('totp');
            setMfaResolver(resolver);
            setShowMfaDialog(true);
            setIsLoading(false);
            return; // Don't throw error, show dialog instead
          } else if (selectedHint.factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
            setMfaMethod('sms');
            setMfaResolver(resolver);
            // Initialize reCAPTCHA for SMS
            const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              size: 'invisible',
            });
            setRecaptchaVerifier(verifier);
            // Send SMS code using resolver's session
            try {
              const phoneInfo = selectedHint as any;
              const phoneNumber = phoneInfo.phoneNumber || phoneInfo.phone || (phoneInfo as any).displayName;
              
              if (!phoneNumber) {
                throw new Error('Phone number not found in MFA hint');
              }
              
              // Use resolver's session for SMS verification during sign-in
              if (!resolver.session) {
                throw new Error('MFA resolver session is missing');
              }
              
              const phoneAuthProvider = new PhoneAuthProvider(auth);
              const phoneInfoOptions = {
                phoneNumber,
                session: resolver.session,
              };
              
              const verificationId = await phoneAuthProvider.verifyPhoneNumber(
                phoneInfoOptions,
                verifier
              );
              setSmsVerificationId(verificationId);
              setShowMfaDialog(true);
              setIsLoading(false);
              return;
            } catch (smsError: any) {
              console.error('SMS send error:', smsError);
              // Clean up reCAPTCHA on error
              try {
                verifier.clear();
              } catch (e) {
                // Ignore cleanup errors
              }
              throw { code: 'auth/sms-send-failed', message: 'Failed to send SMS code. Please try again.' };
            }
          } else {
            throw { code: 'auth/unsupported-mfa', message: 'Unsupported MFA method' };
          }
        }
        throw error;
      }

      const user = userCredential.user;

      // Track login event (non-blocking)
      try {
        const idToken = await user.getIdToken();
        await axios.post('/api/auth/track-login', { idToken }).catch(() => {
          // Non-critical, continue even if tracking fails
        });
      } catch (trackError) {
        console.warn('Failed to track login:', trackError);
      }

      // Success - go directly to dashboard
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting to dashboard...",
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      // Log error details for debugging
      console.error('❌ Login error details:', {
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
        description: "Welcome back! Redirecting to dashboard...",
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
      
      router.push('/dashboard');
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={isLoading}>
              <GoogleIcon className="mr-2 h-4 w-4" /> Google
          </Button>
          <Button variant="outline" disabled={isLoading}>
              <AppleIcon className="mr-2 h-4 w-4" /> Apple
          </Button>
      </div>

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
