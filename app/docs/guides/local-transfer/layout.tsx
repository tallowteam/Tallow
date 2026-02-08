import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Local Transfer Guide',
  description: 'Transfer files on your local network with Tallow — fast, encrypted transfers between nearby devices without internet.',
  alternates: {
    canonical: '/docs/guides/local-transfer',
  },
  openGraph: {
    title: 'Local Transfer Guide | Tallow Docs',
    description: 'Local network file transfer with Tallow.',
    url: '/docs/guides/local-transfer',
  },
};

export default function LocalTransferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
