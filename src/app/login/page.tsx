
import { LoginForm } from '@/components/login-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { Suspense } from 'react';
import { LoginSlideshow } from '@/components/login-slideshow';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden relative">
      <SiteHeader showLogin={false} />
      <main className="flex-1 flex items-center justify-center px-4 lg:px-8 py-2.5">
        <div className="w-full max-w-none h-full grid lg:grid-cols-2 gap-8 items-center">
          {/* Left: Slideshow - Full height minus header/margins */}
          <div className="hidden lg:block w-full h-[calc(100vh-100px)] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-primary/20 relative">
            <LoginSlideshow />
          </div>

          {/* Right: Form - Centered vertically */}
          <div className="w-full flex flex-col items-center justify-center">
            <Card className="w-full justify-self-center bg-card/95 shadow-xl ring-1 ring-border/60 backdrop-blur supports-[backdrop-filter]:bg-card/85 lg:w-9/12 xl:w-8/12 lg:justify-self-center animate-in fade-in zoom-in-95 duration-700">
              <CardHeader className="p-6 pb-2 text-center">
                <CardTitle className="font-display text-3xl font-bold tracking-tight">Sign in</CardTitle>
                <CardDescription className="text-base mt-2">
                  Access your secure dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-4">
                <Suspense fallback={<div className="py-8 text-sm text-muted-foreground text-center">Loading...</div>}>
                  <LoginForm />
                </Suspense>

                <div className="mt-6 rounded-lg border bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    For your protection, we recommend using a password manager and enabling two-factor authentication.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4 border-t bg-muted/20 p-6 text-center text-sm">
                <p className="text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="font-semibold text-primary hover:underline underline-offset-4 transition-colors">
                    Create one
                  </Link>
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
                  <span>&middot;</span>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
