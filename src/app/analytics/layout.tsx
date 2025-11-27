import { metadata as analyticsMetadata } from './metadata';

export const metadata = analyticsMetadata;

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

