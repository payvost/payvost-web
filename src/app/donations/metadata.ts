import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Donations | Raise Funding for a Cause - Payvost',
  description: 'Raise funding for a cause with ease and share with the world. Create donation campaigns and accept contributions from supporters globally.',
  keywords: [
    'donations',
    'fundraising',
    'charity',
    'crowdfunding',
    'donation campaign',
    'raise funds',
    'charitable giving',
    'fundraising platform',
    'donation page',
    'accept donations',
  ],
  openGraph: {
    title: 'Donations | Raise Funding for a Cause',
    description: 'Raise funding for a cause with ease and share with the world.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Donations',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Donations | Raise Funding for a Cause',
    description: 'Raise funding for a cause with ease and share with the world.',
  },
  alternates: {
    canonical: '/donations',
  },
};

