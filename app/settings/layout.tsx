import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Configure your Tallow experience. Manage transfer preferences, security settings, and notification options.',
  alternates: {
    canonical: '/settings',
  },
  openGraph: {
    title: 'Settings | Tallow',
    description: 'Configure your Tallow experience. Manage transfer preferences, security settings, and notification options.',
    url: '/settings',
  },
  twitter: {
    card: 'summary',
    title: 'Settings | Tallow',
    description: 'Configure your Tallow file transfer preferences.',
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
