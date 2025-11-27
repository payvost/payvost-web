import { metadata as invoicingMetadata } from './metadata';

export const metadata = invoicingMetadata;

export default function InvoicingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

