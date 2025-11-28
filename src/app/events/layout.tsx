import { metadata as eventsMetadata } from './metadata';

export const metadata = eventsMetadata;

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

