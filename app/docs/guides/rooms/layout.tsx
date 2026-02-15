import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Room System Guide',
  description: 'Learn how to use Tallow rooms for group file transfers — create rooms, share codes, manage permissions.',
  alternates: { canonical: '/docs/guides/rooms' },
  openGraph: {
    title: 'Room System | Tallow Docs',
    description: 'Master Tallow room codes and group transfers.',
    url: '/docs/guides/rooms',
  },
};

export default function RoomsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
