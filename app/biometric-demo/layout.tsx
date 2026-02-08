import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Biometric Authentication Demo | Tallow',
  description: 'Demo of Tallow biometric authentication — WebAuthn, fingerprint, and face recognition for secure file transfer.',
  alternates: {
    canonical: '/biometric-demo',
  },
  openGraph: {
    title: 'Biometric Auth Demo | Tallow',
    description: 'Experience Tallow biometric authentication in your browser.',
    url: '/biometric-demo',
  },
};

export default function BiometricDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
