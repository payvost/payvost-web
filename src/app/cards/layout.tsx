import { metadata as cardsMetadata } from './metadata';

export const metadata = cardsMetadata;

export default function CardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

