import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Find answers to every question about Tallow — FAQs, troubleshooting, contact support, and community resources.',
  alternates: { canonical: '/docs/help' },
  openGraph: {
    title: 'Help Center | Tallow Docs',
    description: 'Find answers to every question about Tallow.',
    url: '/docs/help',
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
