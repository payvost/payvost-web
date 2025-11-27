import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Get in Touch - Payvost',
  description: 'Get in touch with Payvost support team. We\'re here to help with any questions or issues. Contact us via email, phone, or submit a support ticket. 24/7 customer support available.',
  keywords: [
    'contact payvost',
    'customer support',
    'get in touch',
    'support contact',
    'help center',
    'customer service',
    'contact information',
    'support email',
  ],
  openGraph: {
    title: 'Contact Us | Get in Touch',
    description: 'Get in touch with Payvost support team. We\'re here to help with any questions or issues.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact Payvost',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us | Get in Touch',
    description: 'Get in touch with Payvost support team for any questions or issues.',
  },
  alternates: {
    canonical: '/contact',
  },
};

