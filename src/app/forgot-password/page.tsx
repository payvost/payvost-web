import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader showLogin={false} />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card">
          <CardHeader>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
          <CardFooter className="flex-col text-center text-sm p-4 pt-4 border-t">
            <Link href="/login" className="inline-flex items-center gap-2 underline">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
