import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings & Configuration',
  description: 'Configure Tallow to your preferences — themes, privacy, network, notifications, and advanced settings.',
  alternates: { canonical: '/docs/guides/settings' },
  openGraph: {
    title: 'Settings & Configuration | Tallow Docs',
    description: 'Customize Tallow themes, privacy, and network settings.',
    url: '/docs/guides/settings',
  },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
