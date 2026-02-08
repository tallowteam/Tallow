import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/theme/theme-provider';
import './globals.css';

// Font Configuration — self-hosted, no external dependencies
const playfairDisplay = localFont({
  src: [
    {
      path: '../public/fonts/playfair-display/playfair-display-normal-latin.woff2',
      style: 'normal',
    },
    {
      path: '../public/fonts/playfair-display/playfair-display-italic-latin.woff2',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-playfair',
});

const inter = localFont({
  src: '../public/fonts/inter/inter-latin.woff2',
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = localFont({
  src: '../public/fonts/jetbrains-mono/jetbrains-mono-latin.woff2',
  display: 'swap',
  variable: '--font-jetbrains',
});

// Metadata
export const metadata: Metadata = {
  title: {
    default: 'Tallow — Quantum-Safe File Transfer',
    template: '%s | Tallow',
  },
  description:
    'Secure peer-to-peer file transfer with post-quantum encryption. No servers, no accounts, no compromise. Transfer files directly between devices with military-grade security.',
  keywords: [
    'file transfer',
    'P2P',
    'quantum-safe',
    'post-quantum encryption',
    'secure transfer',
    'peer-to-peer',
    'end-to-end encryption',
    'privacy',
  ],
  authors: [{ name: 'Tallow' }],
  creator: 'Tallow',
  publisher: 'Tallow',
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL('https://tallow.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tallow.app',
    title: 'Tallow — Quantum-Safe File Transfer',
    description:
      'Secure peer-to-peer file transfer with post-quantum encryption. No servers, no accounts, no compromise.',
    siteName: 'Tallow',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Tallow — Quantum-Safe File Transfer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tallow — Quantum-Safe File Transfer',
    description:
      'Secure peer-to-peer file transfer with post-quantum encryption. No servers, no accounts, no compromise.',
    images: ['/og-image.png'],
    creator: '@tallow',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#6366f1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="dark"
      className={`${playfairDisplay.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Tallow',
              applicationCategory: 'UtilitiesApplication',
              operatingSystem: 'Web, macOS, Windows, Linux, iOS, Android',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              description: 'Post-quantum encrypted peer-to-peer file transfer. Send files directly between devices with zero-knowledge security.',
              url: 'https://tallow.app',
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Tallow',
              url: 'https://tallow.app',
              logo: 'https://tallow.app/icon.svg',
            }),
          }}
        />
        <ThemeProvider>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Header />
          <div id="main-content">{children}</div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
