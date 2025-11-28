import { metadata as settingsMetadata } from './metadata';

export const metadata = settingsMetadata;

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

