import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Our Mission & Team - Payvost',
  description: 'Learn about Payvost\'s mission to democratize financial services and make global money transfers accessible to everyone. Meet our team and discover our core values.',
  keywords: [
    'about payvost',
    'company mission',
    'financial services company',
    'money transfer company',
    'team',
    'company values',
    'our story',
    'about us',
  ],
  openGraph: {
    title: 'About Us | Our Mission & Team',
    description: 'Learn about Payvost\'s mission to democratize financial services and make global money transfers accessible.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'About Payvost',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | Our Mission & Team',
    description: 'Learn about Payvost\'s mission to democratize financial services.',
  },
  alternates: {
    canonical: '/about',
  },
};

