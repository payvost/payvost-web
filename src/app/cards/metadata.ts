import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Virtual & Physical Cards | Debit Cards - Payvost',
  description: 'Create instant virtual cards for online purchases or order physical debit cards. Full spending control with real-time notifications, multi-currency support, and bank-level security.',
  keywords: [
    'virtual card',
    'physical card',
    'debit card',
    'prepaid card',
    'virtual credit card',
    'card management',
    'spending controls',
    'multi-currency card',
    'instant card',
    'card security',
  ],
  openGraph: {
    title: 'Virtual & Physical Cards | Debit Cards',
    description: 'Create instant virtual cards or order physical debit cards. Full spending control and bank-level security.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Cards',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Virtual & Physical Cards | Debit Cards',
    description: 'Create instant virtual cards or order physical debit cards with full spending control.',
  },
  alternates: {
    canonical: '/cards',
  },
};

