import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics & Automation | Business Intelligence - Payvost',
  description: 'Make data-driven decisions with comprehensive analytics, automated workflows, and powerful reporting tools. Real-time dashboards, revenue insights, and custom reports for modern businesses.',
  keywords: [
    'payment analytics',
    'business analytics',
    'financial analytics',
    'revenue analytics',
    'payment reporting',
    'business intelligence',
    'data analytics',
    'automated reports',
    'custom dashboards',
    'payment insights',
  ],
  openGraph: {
    title: 'Analytics & Automation | Business Intelligence',
    description: 'Comprehensive analytics, automated workflows, and powerful reporting tools for data-driven decisions.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Analytics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Analytics & Automation | Business Intelligence',
    description: 'Comprehensive analytics and automated workflows for data-driven decisions.',
  },
  alternates: {
    canonical: '/analytics',
  },
};

