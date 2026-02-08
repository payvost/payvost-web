
import { LoginForm } from '@/components/login-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { Suspense } from 'react';
import { LoginSlideshow } from '@/components/login-slideshow';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader showLogin={false} />
      <main className="flex-1 flex items-center justify-center px-4 py-10 lg:px-8">
        <div className="w-full max-w-none">
          <div className="grid w-full items-stretch gap-8 lg:grid-cols-2">
            {/* Left: Slideshow */}
            <div className="hidden lg:block h-full min-h-[600px] w-full rounded-2xl overflow-hidden">
              <LoginSlideshow />
            </div>

            {/* Right: Form */}
            <Card className="w-full justify-self-center bg-card/80 shadow-none ring-1 ring-border/60 backdrop-blur supports-[backdrop-filter]:bg-card/65 lg:w-9/12 xl:w-8/12 lg:justify-self-center animate-in fade-in zoom-in-95 duration-700">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="font-display text-2xl tracking-tight sm:text-3xl">Sign in</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Use your email or username. If your account has MFA enabled, we'll ask for your verification code.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Loading...</div>}>
                  <LoginForm />
                </Suspense>

                <div className="mt-5 rounded-xl border bg-background/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    Tip: Use a password manager. It's the easiest way to stay secure and avoid lockouts.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3 border-t bg-background/30 p-4 text-center text-sm">
                <p className="text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
                    Create one
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  By continuing, you agree to our{' '}
                  <Link href="/terms" className="underline underline-offset-4">Terms</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
