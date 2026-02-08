import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Getting Started',
  description: 'Get started with Tallow — install, configure, and send your first quantum-safe file transfer in minutes.',
  alternates: {
    canonical: '/docs/guides/getting-started',
  },
  openGraph: {
    title: 'Getting Started | Tallow Docs',
    description: 'Quick start guide for Tallow file transfer.',
    url: '/docs/guides/getting-started',
  },
};

export default function GettingStartedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
