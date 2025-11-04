import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ResetPasswordSentPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader showLogin={false} />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent you password reset instructions to your email address. 
              Please check your inbox (and spam folder) and follow the link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="font-semibold mb-2">Didn't receive the email?</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>Wait a few minutes for the email to arrive</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Link href="/forgot-password" className="w-full">
              <Button variant="outline" className="w-full">
                Resend Reset Link
              </Button>
            </Link>
            <Link href="/login" className="w-full">
              <Button variant="default" className="w-full">
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
