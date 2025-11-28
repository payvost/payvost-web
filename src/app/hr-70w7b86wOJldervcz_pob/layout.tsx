import { ReactNode } from 'react';
import { metadata as hrMetadata } from './metadata';

export const metadata = hrMetadata;

export default function HrAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

