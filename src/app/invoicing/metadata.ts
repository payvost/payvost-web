import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Professional Invoicing | Invoice Management',
  description: 'Create, send, and track professional invoices. Get paid faster with automated reminders, multiple payment options, and comprehensive invoice management tools for your business.',
  keywords: [
    'invoice',
    'invoicing',
    'invoice management',
    'invoice software',
    'online invoicing',
    'invoice tracking',
    'payment reminders',
    'invoice templates',
    'business invoicing',
    'invoice automation',
  ],
  openGraph: {
    title: 'Professional Invoicing | Invoice Management',
    description: 'Create, send, and track professional invoices. Get paid faster with automated reminders.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Invoicing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Professional Invoicing | Invoice Management',
    description: 'Create, send, and track professional invoices with automated reminders.',
  },
  alternates: {
    canonical: '/invoicing',
  },
};

