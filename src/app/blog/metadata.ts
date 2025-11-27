import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | News, Updates & Insights - Payvost',
  description: 'Read the latest news, updates, and insights from Payvost. Learn about money transfers, financial technology, international payments, and more.',
  keywords: [
    'payvost blog',
    'money transfer blog',
    'fintech blog',
    'financial technology',
    'payment news',
    'remittance blog',
    'financial insights',
    'payment updates',
  ],
  openGraph: {
    title: 'Blog | News, Updates & Insights',
    description: 'Read the latest news, updates, and insights from Payvost about money transfers and financial technology.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | News, Updates & Insights',
    description: 'Read the latest news, updates, and insights from Payvost.',
  },
  alternates: {
    canonical: '/blog',
  },
};

