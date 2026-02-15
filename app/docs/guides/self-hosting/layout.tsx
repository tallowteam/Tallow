import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Self-Hosting Guide',
  description: 'Host Tallow yourself with Docker — signaling server, TURN relay, Cloudflare Tunnel, and Synology NAS setup.',
  alternates: { canonical: '/docs/guides/self-hosting' },
  openGraph: {
    title: 'Self-Hosting | Tallow Docs',
    description: 'Deploy your own Tallow instance with Docker.',
    url: '/docs/guides/self-hosting',
  },
};

export default function SelfHostingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
