import { metadata as donationsMetadata } from './metadata';

export const metadata = donationsMetadata;

export default function DonationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

