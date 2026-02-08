import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feature Gallery | Tallow',
  description: 'Explore Tallow features in detail — visual demos of quantum-safe encryption, P2P transfers, and collaboration tools.',
  alternates: {
    canonical: '/features/gallery',
  },
  openGraph: {
    title: 'Feature Gallery | Tallow',
    description: 'Visual showcase of Tallow file transfer features.',
    url: '/features/gallery',
  },
};

export default function FeatureGalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
