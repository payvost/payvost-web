
'use client';

import { useState } from 'react';
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, multiFactor, TotpMultiFactorGenerator, PhoneMultiFactorGenerator, PhoneAuthProvider, MultiFactorResolver } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit: SubmitHandler<LoginValues> = async (data) => {
    setIsLoading(true);
    try {
      let emailToUse = data.credential;
      if (!data.credential.includes('@')) {
        // Resolve username -> email via Firestore
        const { db } = await import('@/lib/firebase');
        const { collection, query, where, limit, getDocs } = await import('firebase/firestore');
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

      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, data.password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        toast({
          title: "Email Not Verified",
          description: "Please verify your email before logging in. Redirecting...",
          variant: "destructive"
        });
        await auth.signOut();
        router.push('/verify-email');
        return;
      }

      // No MFA enrolled, proceed with login
      toast({
          title: "Login Successful!",
          description: "Redirecting you to the dashboard...",
      });
      router.push('/dashboard');
    } catch (error: any) {
      // Handle MFA required
      if (error.code === 'auth/multi-factor-auth-required') {
        setMfaResolver(error.resolver);
        setShow2FADialog(true);
        setIsLoading(false);
        return;
      }
      
      let errorMessage = "An unknown error occurred.";
       if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later."
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
        setIsLoading(false);
    }
  }

  const verify2FA = async () => {
    if (!mfaResolver || twoFactorCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const selectedHint = mfaResolver.hints[0];
      let multiFactorAssertion;

      if (selectedHint.factorId === TotpMultiFactorGenerator.FACTOR_ID) {
        // TOTP verification
        multiFactorAssertion = TotpMultiFactorGenerator.assertionForSignIn(
          selectedHint.uid,
          twoFactorCode
        );
      } else if (selectedHint.factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
        // Phone verification (this would need additional SMS flow)
        // For now, we'll just show an error
        throw new Error('Phone MFA verification not yet fully implemented in login');
      } else {
        throw new Error('Unsupported MFA method');
      }

      // Resolve sign-in with MFA
      const userCredential = await mfaResolver.resolveSignIn(multiFactorAssertion);
      const user = userCredential.user;

      if (!user.emailVerified) {
        toast({
          title: "Email Not Verified",
          description: "Please verify your email before logging in.",
          variant: "destructive"
        });
        await auth.signOut();
        router.push('/verify-email');
        return;
      }

      // 2FA successful
      toast({
        title: "Login Successful!",
        description: "Redirecting you to the dashboard...",
      });
      setShow2FADialog(false);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

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

      {/* 2FA Verification Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from your authenticator app or the code sent to your email/phone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={twoFactorCode}
                onChange={setTwoFactorCode}
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
            
            <Button 
              className="w-full" 
              onClick={verify2FA} 
              disabled={isLoading || twoFactorCode.length !== 6}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
