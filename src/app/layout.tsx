
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { UnifiedConsentBanner } from '@/components/unified-consent-banner';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import PWARegister from '../components/pwa-register';
import { StructuredData } from '@/components/structured-data';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

import { siteUrl } from '@/lib/constants';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  
  title: {
    default: 'Payvost | Fast, Secure Global Remittance & Money Transfer',
    template: '%s - Payvost',
  },
  
  description: 'Payvost offers fast, secure, and low-cost global money transfers. Send and receive money internationally across 70+ countries with competitive exchange rates. Track your transfers in real-time with enterprise-grade security.',
  
  keywords: [
    'money transfer',
    'international remittance',
    'global money transfer',
    'foreign exchange',
    'wire transfer',
    'send money abroad',
    'cross-border payments',
    'FX rates',
    'currency exchange',
    'remittance services',
    'online money transfer',
    'international payments',
  ],
  
  authors: [{ name: 'Payvost' }],
  creator: 'Payvost',
  publisher: 'Payvost',
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Payvost',
    title: 'Payvost | Fast, Secure Global Remittance',
    description: 'Send and receive money internationally across 70+ countries with competitive exchange rates and real-time tracking.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost - Global Money Transfer Platform',
      },
    ],
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Payvost | Fast, Secure Global Remittance',
    description: 'Send money internationally across 70+ countries with competitive rates and real-time tracking.',
    images: ['/og-image.jpg'],
    // creator: '@payvost', // Uncomment and add actual Twitter handle
    // site: '@payvost',
  },
  
  alternates: {
    canonical: '/',
  },
  
  verification: {
    // google: 'your-google-verification-code', // Add from Search Console
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
  
  category: 'Financial Services',
  
  manifest: '/manifest.json',
  
  icons: {
    icon: [
      { url: '/clay-logo.png' },
    ],
    apple: [
      { url: '/clay-logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Payvost',
  },
  
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
    url: true,
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/clay-logo.png" />
        <link rel="apple-touch-icon" href="/clay-logo.png" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
        suppressHydrationWarning
      >
    <Providers>
      <StructuredData />
      {children}
      
      <PWARegister />
            <Toaster />
            <UnifiedConsentBanner />
            <SpeedInsights />
            <Analytics />
        </Providers>
      </body>
    </html>
  );
}
