import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Architecture',
  description: 'Tallow system architecture — post-quantum cryptography stack, WebRTC peer-to-peer topology, and security model overview.',
  alternates: {
    canonical: '/docs/architecture',
  },
  openGraph: {
    title: 'Architecture | Tallow Docs',
    description: 'System architecture overview for Tallow quantum-safe file transfer.',
    url: '/docs/architecture',
  },
};

export default function ArchitectureDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
