import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events | Collect Payments & Manage Tickets - Payvost',
  description: 'Collect payments easily for that event you want to organize and manage your tickets from one place. Streamline event payments and ticket sales.',
  keywords: [
    'event payments',
    'ticket management',
    'event ticketing',
    'event organization',
    'collect event payments',
    'event ticket sales',
    'event management',
    'paid events',
    'ticket payments',
    'event registration',
  ],
  openGraph: {
    title: 'Events | Collect Payments & Manage Tickets',
    description: 'Collect payments easily for that event you want to organize and manage your tickets from one place.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Events',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Events | Collect Payments & Manage Tickets',
    description: 'Collect payments easily for that event you want to organize and manage your tickets from one place.',
  },
  alternates: {
    canonical: '/events',
  },
};

