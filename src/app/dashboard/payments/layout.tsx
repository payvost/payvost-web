import { metadata as paymentsMetadata } from './metadata';

export const metadata = paymentsMetadata;

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

