import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Keyboard Shortcuts',
  description: 'Complete keyboard shortcut reference for Tallow — navigation, transfer controls, and power user shortcuts.',
  alternates: { canonical: '/docs/guides/keyboard-shortcuts' },
  openGraph: {
    title: 'Keyboard Shortcuts | Tallow Docs',
    description: 'All keyboard shortcuts for Tallow file transfer.',
    url: '/docs/guides/keyboard-shortcuts',
  },
};

export default function KeyboardShortcutsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
