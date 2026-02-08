import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Reference',
  description: 'Tallow API reference — WebRTC signaling, transfer protocols, encryption endpoints, and developer integration guides.',
  alternates: {
    canonical: '/docs/api',
  },
  openGraph: {
    title: 'API Reference | Tallow Docs',
    description: 'Complete API reference for Tallow WebRTC signaling and transfer protocols.',
    url: '/docs/api',
  },
};

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
