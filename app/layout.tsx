import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter, JetBrains_Mono } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

// Font Configuration
const playfairDisplay = Playfair_Display({
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

const inter = Inter({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['400'],
  subsets: ['latin'],
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
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
