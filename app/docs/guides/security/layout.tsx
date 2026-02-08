import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Guide',
  description: 'Tallow security guide — post-quantum cryptography, end-to-end encryption, zero-knowledge architecture, and threat model.',
  alternates: {
    canonical: '/docs/guides/security',
  },
  openGraph: {
    title: 'Security Guide | Tallow Docs',
    description: 'Security model and encryption details for Tallow.',
    url: '/docs/guides/security',
  },
};

export default function SecurityGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
