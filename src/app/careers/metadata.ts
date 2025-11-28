import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers | Join Our Team',
  description: 'Join the Payvost team and help shape the future of global money transfers. Explore open positions, learn about our culture, and discover opportunities to grow your career.',
  keywords: [
    'payvost careers',
    'jobs at payvost',
    'career opportunities',
    'fintech jobs',
    'financial services jobs',
    'join our team',
    'open positions',
    'job openings',
  ],
  openGraph: {
    title: 'Careers | Join Our Team',
    description: 'Join the Payvost team and help shape the future of global money transfers.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Careers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Careers | Join Our Team',
    description: 'Join the Payvost team and help shape the future of global money transfers.',
  },
  alternates: {
    canonical: '/careers',
  },
};

