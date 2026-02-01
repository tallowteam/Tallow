import { Metadata } from 'next';
import { FeaturesContent } from './features-content';

// =============================================================================
// METADATA - Server Component
// =============================================================================

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Explore all the security and privacy features that make Tallow the most secure file transfer solution. Post-quantum encryption, end-to-end security, peer-to-peer transfers, and more.',
  keywords: [
    'post-quantum encryption',
    'ML-KEM-1024',
    'AES-256-GCM',
    'end-to-end encryption',
    'peer-to-peer transfer',
    'secure file sharing',
    'group transfers',
    'screen sharing',
    'offline support',
    'metadata stripping',
    'privacy features',
  ],
  openGraph: {
    title: 'Features | Tallow - Secure File Transfer',
    description:
      'Explore all the security and privacy features that make Tallow the most secure file transfer solution. Post-quantum encryption, end-to-end security, and more.',
    type: 'website',
    images: [
      {
        url: '/og-features.png',
        width: 1200,
        height: 630,
        alt: 'Tallow Features - Security, Privacy, Speed',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Features | Tallow',
    description:
      'Discover post-quantum encryption, peer-to-peer transfers, and 16+ security features.',
  },
  alternates: {
    canonical: '/features',
  },
};

// =============================================================================
// PAGE COMPONENT - Server Component that renders Client Islands
// =============================================================================

export default function FeaturesPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <FeaturesContent />
    </main>
  );
}
