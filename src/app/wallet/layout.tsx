import { metadata as walletMetadata } from './metadata';

export const metadata = walletMetadata;

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

