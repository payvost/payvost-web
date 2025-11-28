import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recurring Payments | Automated Remittances - Payvost',
  description: 'Set your recurring payments and let payvost handle continuous remittances. Automate your regular payments and never miss a deadline.',
  keywords: [
    'recurring payments',
    'automated payments',
    'subscription payments',
    'recurring remittances',
    'auto-pay',
    'scheduled payments',
    'recurring transfers',
    'payment automation',
    'regular payments',
    'continuous remittances',
  ],
  openGraph: {
    title: 'Recurring Payments | Automated Remittances',
    description: 'Set your recurring payments and let payvost handle continuous remittances.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Recurring Payments',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recurring Payments | Automated Remittances',
    description: 'Set your recurring payments and let payvost handle continuous remittances.',
  },
  alternates: {
    canonical: '/recurring-payments',
  },
};

