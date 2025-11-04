'use client';

import { useState } from 'react';
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit: SubmitHandler<ForgotPasswordValues> = async (data) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, data.email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      
      toast({
        title: "Reset Email Sent",
        description: "Check your email for instructions to reset your password.",
      });
      
      // Redirect to confirmation page
      router.push('/reset-password-sent');
    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";
      
      if (error.code === 'auth/user-not-found') {
        // For security, we still show success message even if user doesn't exist
        // This prevents enumeration attacks
        toast({
          title: "Reset Email Sent",
          description: "If an account exists with this email, you will receive password reset instructions.",
        });
        router.push('/reset-password-sent');
        return;
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please try again later.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="jane@example.com" 
            {...register('email')} 
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Reset Link
        </Button>
      </div>
    </form>
  );
}
