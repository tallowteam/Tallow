import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Friends & Contacts',
  description: 'Manage trusted devices in Tallow — add friends, set trust levels, verify with SAS, and organize contacts.',
  alternates: { canonical: '/docs/guides/friends' },
  openGraph: {
    title: 'Friends & Contacts | Tallow Docs',
    description: 'Manage trusted devices and contacts in Tallow.',
    url: '/docs/guides/friends',
  },
};

export default function FriendsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
