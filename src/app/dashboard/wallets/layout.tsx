import { metadata as walletsMetadata } from './metadata';

export const metadata = walletsMetadata;

export default function WalletsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

