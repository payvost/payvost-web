import { metadata as blogMetadata } from './metadata';

export const metadata = blogMetadata;

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

