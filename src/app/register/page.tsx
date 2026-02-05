
import { RegistrationForm } from '@/components/registration-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col">
       <SiteHeader showRegister={false} />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl bg-card">
          <CardHeader>
            <CardTitle className="text-2xl">Create an Account</CardTitle>
            <CardDescription>
              Complete 3 short steps below to set up your secure account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegistrationForm />
          </CardContent>
          <CardFooter className="flex-col text-center text-sm p-4 pt-4 border-t">
             <p className="mt-2">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                Login
                </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
