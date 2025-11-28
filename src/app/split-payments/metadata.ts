import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Split Payments | Share Expenses with Friends & Family - Payvost',
  description: 'Split payments between friends and family at a go. Share expenses, split bills, and collect money from multiple people effortlessly.',
  keywords: [
    'split payments',
    'split bills',
    'share expenses',
    'group payments',
    'split cost',
    'bill splitting',
    'expense sharing',
    'group expenses',
    'shared payments',
    'split money',
  ],
  openGraph: {
    title: 'Split Payments | Share Expenses with Friends & Family',
    description: 'Split payments between friends and family at a go.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Split Payments',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Split Payments | Share Expenses with Friends & Family',
    description: 'Split payments between friends and family at a go.',
  },
  alternates: {
    canonical: '/split-payments',
  },
};

