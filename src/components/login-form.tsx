
'use client';

import { useState } from 'react';
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
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
  const [showEmailCodeDialog, setShowEmailCodeDialog] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  
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

      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, data.password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        toast({
          title: "Email Not Verified",
          description: "Please verify your email before logging in. Redirecting...",
          variant: "destructive"
        });
        await signOut(auth);
        router.push('/verify-email');
        return;
      }

      // Email and password verified, now send email verification code for login
      try {
        const idToken = await user.getIdToken();
        
        // Send email verification code
        setIsSendingCode(true);
        await axios.post('/api/auth/send-login-code', { idToken });
        
        // Store user for after code verification
        setPendingUser(user);
        setShowEmailCodeDialog(true);
        setIsLoading(false);
        setIsSendingCode(false);
        
        toast({
          title: "Verification Code Sent",
          description: "Please check your email for the verification code.",
        });
      } catch (codeError: any) {
        console.error('Failed to send verification code:', codeError);
        await signOut(auth);
        toast({
          title: "Failed to Send Code",
          description: "Unable to send verification code. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        setIsSendingCode(false);
      }
    } catch (error: any) {
      
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

  const verifyEmailCode = async () => {
    if (!pendingUser || emailVerificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const idToken = await pendingUser.getIdToken();
      
      // Verify the code
      const response = await axios.post('/api/auth/verify-login-code', {
        idToken,
        code: emailVerificationCode
      });

      if (response.data.success) {
        // Track login event
        try {
          await axios.post('/api/auth/track-login', { idToken });
        } catch (trackError) {
          // Non-critical error, continue with login
          console.warn('Failed to track login:', trackError);
        }

        // Login successful
        toast({
          title: "Login Successful!",
          description: "Redirecting you to the dashboard...",
        });
        setShowEmailCodeDialog(false);
        setEmailVerificationCode('');
        setPendingUser(null);
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Email code verification error:', error);
      toast({
        title: "Verification Failed",
        description: error.response?.data?.error || error.message || "Invalid verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  const resendEmailCode = async () => {
    if (!pendingUser) return;

    setIsSendingCode(true);
    try {
      const idToken = await pendingUser.getIdToken();
      await axios.post('/api/auth/send-login-code', { idToken });
      
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      console.error('Failed to resend code:', error);
      toast({
        title: "Failed to Resend",
        description: "Unable to resend verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSendingCode(false);
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

      {/* Email Verification Code Dialog */}
      <Dialog open={showEmailCodeDialog} onOpenChange={(open) => {
        if (!open) {
          // If dialog is closed, sign out the user
          if (pendingUser) {
            signOut(auth);
            setPendingUser(null);
            setEmailVerificationCode('');
          }
        }
        setShowEmailCodeDialog(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Verification</DialogTitle>
            <DialogDescription>
              Enter the 6-digit verification code sent to your email address.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={emailVerificationCode}
                onChange={setEmailVerificationCode}
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
            
            <div className="flex flex-col gap-2">
              <Button 
                className="w-full" 
                onClick={verifyEmailCode} 
                disabled={isLoading || emailVerificationCode.length !== 6}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
              </Button>
              
              <Button 
                variant="outline"
                className="w-full" 
                onClick={resendEmailCode} 
                disabled={isSendingCode || isLoading}
              >
                {isSendingCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resend Code
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              Didn't receive the code? Check your spam folder or click "Resend Code".
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
