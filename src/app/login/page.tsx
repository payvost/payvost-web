
import { LoginForm } from '@/components/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader showLogin={false} />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Login to your account to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="flex-col text-center text-sm p-4 pt-4 border-t">
             <p className="mt-2">
                Don't have an account?{" "}
                <Link href="/register" className="underline">
                Sign Up
                </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
