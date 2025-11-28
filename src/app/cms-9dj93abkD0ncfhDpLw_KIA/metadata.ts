import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Content Management',
    template: '%s',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

