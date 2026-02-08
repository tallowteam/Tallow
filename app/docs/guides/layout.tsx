import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guides',
  description: 'Step-by-step guides for Tallow — getting started, local transfers, internet P2P transfers, and security best practices.',
  alternates: {
    canonical: '/docs/guides',
  },
  openGraph: {
    title: 'Guides | Tallow Docs',
    description: 'Step-by-step guides for using Tallow file transfer.',
    url: '/docs/guides',
  },
};

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
