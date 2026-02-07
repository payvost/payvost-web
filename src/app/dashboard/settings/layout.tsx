import { metadata as settingsMetadata } from './metadata';
import { SettingsLayoutClient } from '@/components/settings/settings-layout-client';

export const metadata = settingsMetadata;

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsLayoutClient>{children}</SettingsLayoutClient>;
}

