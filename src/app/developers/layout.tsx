import { metadata as developersMetadata } from './metadata';

export const metadata = developersMetadata;

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

