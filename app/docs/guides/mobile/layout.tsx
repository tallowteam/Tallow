import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mobile App Guide',
  description:
    'Use Tallow on iOS and Android — PWA installation, native app features, and mobile-optimized transfers.',
  alternates: {
    canonical: '/docs/guides/mobile',
  },
  openGraph: {
    title: 'Mobile App | Tallow Docs',
    description: 'Install and use Tallow on mobile devices.',
    url: '/docs/guides/mobile',
  },
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
