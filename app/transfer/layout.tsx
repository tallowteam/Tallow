import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transfer Files',
  description: 'Transfer files securely with Tallow. Choose local network, internet P2P, or friends mode for quantum-safe file sharing.',
  alternates: {
    canonical: '/transfer',
  },
  openGraph: {
    title: 'Transfer Files | Tallow',
    description: 'Transfer files securely with Tallow. Choose local network, internet P2P, or friends mode for quantum-safe file sharing.',
    url: '/transfer',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Transfer Files | Tallow',
    description: 'Transfer files securely with quantum-safe encryption.',
  },
};

export default function TransferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="transfer-app-layout">{children}</div>;
}
