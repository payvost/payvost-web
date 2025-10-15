
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { LocationPermissionBanner } from '@/components/location-permission-banner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Payvost | Fast, Secure Global Remittance',
    template: '%s | Payvost',
  },
  description: 'Payvost offers fast, secure, and low-cost global money transfers. Send and receive money internationally with competitive exchange rates and track your transfers in real-time.',
  manifest: '/manifest.json',
  icons: {
    icon: '/clay-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3CB371" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
        suppressHydrationWarning
      >
        <Providers>
            {children}
            <Toaster />
            <LocationPermissionBanner />
            <CookieConsentBanner />
            <SpeedInsights />
            <Analytics />
        </Providers>
      </body>
    </html>
  );
}
