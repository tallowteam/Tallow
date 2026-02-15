import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Features',
  description: 'Tallow privacy deep dive — metadata stripping, zero tracking, traffic analysis resistance, and onion routing.',
  alternates: { canonical: '/docs/guides/privacy' },
  openGraph: {
    title: 'Privacy Features | Tallow Docs',
    description: 'How Tallow protects your privacy beyond encryption.',
    url: '/docs/guides/privacy',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
