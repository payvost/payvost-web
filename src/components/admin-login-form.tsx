
'use client';

import { useState } from 'react';
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, UserCog } from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().min(1, 'Please select a role'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function AdminLoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit: SubmitHandler<LoginValues> = async (data) => {
    setIsLoading(true);
    try {
      // In a real app, you would use custom claims with Firebase to verify the role
      // after authentication. For now, we just simulate the login.
      // This part ensures we are authenticating against Firebase Auth.
      console.log('Attempting to log in as admin:', data.email);
      
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // TODO: Add role verification logic here.
      // For now, any successful login will proceed.

      toast({
          title: "Admin Login Successful!",
          description: "Redirecting you to the admin dashboard...",
      });
      
      router.push('/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard'); 
    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";
      // Handle specific Firebase auth errors for better user feedback
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid credentials. Please check your email, password, and role.";
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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="admin@payvost.com" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register('password')} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Controller
                name="role"
                control={control}
                render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Select your access level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="super-admin">
                            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Super Admin</div>
                        </SelectItem>
                        <SelectItem value="support-staff">
                            <div className="flex items-center gap-2"><UserCog className="h-4 w-4" />Support Staff</div>
                        </SelectItem>
                    </SelectContent>
                </Select>
                )}
            />
            {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>

         <div className="text-right text-sm">
            <Link href="#" className="underline">
                Forgot password?
            </Link>
        </div>
      </div>
    </form>
  )
}
