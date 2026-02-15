import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Troubleshooting',
  description: 'Fix common Tallow issues — connection problems, slow transfers, firewall blocks, and browser compatibility.',
  alternates: { canonical: '/docs/guides/troubleshooting' },
  openGraph: {
    title: 'Troubleshooting | Tallow Docs',
    description: 'Fix common Tallow issues and connection problems.',
    url: '/docs/guides/troubleshooting',
  },
};

export default function TroubleshootingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
