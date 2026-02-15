import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advanced Features',
  description: 'Master Tallow advanced features — batch operations, scheduled transfers, clipboard sync, delta sync, and templates.',
  alternates: { canonical: '/docs/guides/advanced-features' },
  openGraph: {
    title: 'Advanced Features | Tallow Docs',
    description: 'Batch ops, scheduling, clipboard sync, and more.',
    url: '/docs/guides/advanced-features',
  },
};

export default function AdvancedFeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
