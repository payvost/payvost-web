
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { CookieConsentBanner } from '@/components/cookie-consent-banner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Payvost',
  description: 'Fast and secure global remittance.',
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
        <link rel="icon" href="/clay-logo.png" type="image/png" />
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
            <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
