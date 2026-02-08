import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Playground',
  description: 'Interactive Tallow playground — test file transfers, explore the API, and experiment with encryption in your browser.',
  alternates: {
    canonical: '/docs/playground',
  },
  openGraph: {
    title: 'Playground | Tallow Docs',
    description: 'Interactive playground for testing Tallow features.',
    url: '/docs/playground',
  },
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
