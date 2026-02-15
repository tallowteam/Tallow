import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CLI Tool Guide',
  description: 'Use Tallow from the command line — send files with code phrases, pipe support, and cross-platform binaries.',
  alternates: { canonical: '/docs/guides/cli' },
  openGraph: {
    title: 'CLI Tool | Tallow Docs',
    description: 'Command-line file transfers with Tallow CLI.',
    url: '/docs/guides/cli',
  },
};

export default function CLILayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
