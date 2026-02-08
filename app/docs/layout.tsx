import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Tallow Docs',
    default: 'Documentation',
  },
  description: 'Tallow documentation — guides, API reference, architecture overview, and developer resources for quantum-safe file transfer.',
  alternates: {
    canonical: '/docs',
  },
  openGraph: {
    title: 'Documentation | Tallow',
    description: 'Tallow documentation — guides, API reference, architecture overview, and developer resources.',
    url: '/docs',
  },
  twitter: {
    card: 'summary',
    title: 'Documentation | Tallow',
    description: 'Guides, API reference, and developer resources for Tallow.',
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
