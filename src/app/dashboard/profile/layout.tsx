import { metadata as profileMetadata } from './metadata';

export const metadata = profileMetadata;

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

