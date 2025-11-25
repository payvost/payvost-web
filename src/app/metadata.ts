import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://payvost.com';

export const metadata: Metadata = {
  title: 'Fast, Secure Global Remittance | Send Money Internationally',
  description: 'Move money in minutes with enterprise-grade FX infrastructure. Send and receive money across 70+ countries with competitive exchange rates, real-time tracking, and 24/7 support.',
  keywords: [
    'money transfer online',
    'send money abroad',
    'international remittance',
    'global money transfer',
    'wire transfer service',
    'foreign exchange',
    'currency transfer',
    'cross-border payments',
    'online remittance',
    'international money transfer service',
  ],
  openGraph: {
    title: 'Payvost | Fast, Secure Global Remittance',
    description: 'Move money in minutes with enterprise-grade FX infrastructure. Send money across 70+ countries with competitive exchange rates and real-time tracking.',
    type: 'website',
    url: '/',
    siteName: 'Payvost',
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
    description: 'Move money in minutes with enterprise-grade FX infrastructure. Send money across 70+ countries.',
    images: ['/og-image.jpg'],
    // creator: '@payvost',
    // site: '@payvost',
  },
  alternates: {
    canonical: '/',
  },
};
