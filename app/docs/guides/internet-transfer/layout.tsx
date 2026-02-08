import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Internet Transfer Guide',
  description: 'Learn how to transfer files over the internet with Tallow using peer-to-peer WebRTC connections with post-quantum encryption.',
  alternates: {
    canonical: '/docs/guides/internet-transfer',
  },
  openGraph: {
    title: 'Internet Transfer Guide | Tallow Docs',
    description: 'P2P internet file transfer with quantum-safe encryption.',
    url: '/docs/guides/internet-transfer',
  },
};

export default function InternetTransferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
