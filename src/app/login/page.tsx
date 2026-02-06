
import { LoginForm } from '@/components/login-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import Image from 'next/image';
import { Globe2, ShieldCheck, Zap } from 'lucide-react';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader showLogin={false} />
      <main className="relative flex-1 overflow-hidden">
        {/* Backdrop */}
        <div aria-hidden className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_15%,hsl(var(--primary)_/_0.20),transparent_55%),radial-gradient(900px_circle_at_90%_20%,rgba(16,185,129,0.18),transparent_55%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(15,23,42,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="absolute -left-40 top-24 h-[28rem] w-[28rem] rounded-full bg-emerald-500/20 blur-3xl animate-auth-float" />
          <div className="absolute -right-48 -top-24 h-[34rem] w-[34rem] rounded-full bg-sky-500/20 blur-3xl animate-auth-float-2" />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-10 lg:px-8">
          <div className="grid w-full items-stretch gap-8 lg:grid-cols-2">
            {/* Left: Brand / Value */}
            <section className="relative overflow-hidden rounded-2xl border bg-card/70 p-7 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/55 lg:p-10 animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-xl border bg-background">
                  <Image
                    src="/clay-logo.png"
                    alt="Payvost"
                    fill
                    className="object-contain p-1.5"
                    priority
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-lg leading-none tracking-tight">Payvost</p>
                  <p className="mt-1 text-xs text-muted-foreground">Global transfers, payouts, invoicing</p>
                </div>
                <div className="ml-auto hidden items-center gap-2 sm:flex">
                  <Badge variant="outline" className="bg-background/60">Secure sign-in</Badge>
                  <Badge variant="outline" className="bg-background/60">MFA-ready</Badge>
                </div>
              </div>

              <h1 className="mt-7 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                Welcome back.
                <span className="block text-muted-foreground">Sign in to keep money moving.</span>
              </h1>
              <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
                A cleaner, faster way to manage transfers, payouts, invoices, and balances. Designed to feel calm, modern, and trustworthy.
              </p>

              <ul className="mt-7 grid gap-3 sm:mt-9">
                <li className="flex gap-3 rounded-xl border bg-background/50 p-4">
                  <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-5">Security-forward by default</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Built with strong authentication and optional two-factor verification.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 rounded-xl border bg-background/50 p-4">
                  <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-700">
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-5">Global-first experience</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Clear language, strong hierarchy, and mobile-ready layout.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 rounded-xl border bg-background/50 p-4">
                  <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-700">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-5">Less friction, more flow</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Smart defaults, helpful microcopy, and consistent interactions.
                    </p>
                  </div>
                </li>
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="bg-background/60">Encrypted in transit</Badge>
                <Badge variant="outline" className="bg-background/60">Session protected</Badge>
                <Badge variant="outline" className="bg-background/60">Privacy controls</Badge>
              </div>
            </section>

            {/* Right: Form */}
            <Card className="w-full max-w-md justify-self-center bg-card/80 shadow-[0_20px_70px_-35px_rgba(2,6,23,0.45)] ring-1 ring-border/60 backdrop-blur supports-[backdrop-filter]:bg-card/65 animate-in fade-in zoom-in-95 duration-700">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-2xl tracking-tight sm:text-3xl">Sign in</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Use your email or username. If your account has MFA enabled, we’ll ask for your verification code.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Loading...</div>}>
                  <LoginForm />
                </Suspense>

                <div className="mt-6 rounded-xl border bg-background/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Tip: Use a password manager. It’s the easiest way to stay secure and avoid lockouts.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3 border-t bg-background/30 p-6 text-center text-sm">
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
