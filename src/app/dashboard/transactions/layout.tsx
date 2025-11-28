import { metadata as transactionsMetadata } from './metadata';

export const metadata = transactionsMetadata;

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

