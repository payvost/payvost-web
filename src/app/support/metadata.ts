import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Center | Help & FAQs - Payvost',
  description: 'Get help with Payvost. Find answers to frequently asked questions, access support resources, and contact our customer support team. 24/7 assistance available.',
  keywords: [
    'payvost support',
    'customer support',
    'help center',
    'FAQs',
    'support help',
    'customer service',
    'support resources',
    'help documentation',
  ],
  openGraph: {
    title: 'Support Center | Help & FAQs',
    description: 'Get help with Payvost. Find answers to FAQs and access support resources.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Support',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Support Center | Help & FAQs',
    description: 'Get help with Payvost. Find answers to FAQs and access support resources.',
  },
  alternates: {
    canonical: '/support',
  },
};

