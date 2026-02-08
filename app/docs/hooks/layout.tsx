import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'React Hooks',
  description: 'Tallow React hooks reference — useTransfer, useDeviceDiscovery, useCrypto, and other hooks for building on Tallow.',
  alternates: {
    canonical: '/docs/hooks',
  },
  openGraph: {
    title: 'React Hooks | Tallow Docs',
    description: 'React hooks reference for Tallow developers.',
    url: '/docs/hooks',
  },
};

export default function HooksDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
