import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider, themeScript } from '@/lib/theme';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://tallow.app'),
  title: {
    default: 'Tallow - Secure File Transfers. Quantum-Safe.',
    template: '%s | Tallow',
  },
  description: 'Transfer files directly between devices with post-quantum encryption. No cloud storage, no compromises.',
  keywords: ['secure file transfer', 'quantum-safe', 'post-quantum encryption', 'peer-to-peer', 'p2p', 'zero knowledge', 'encrypted file sharing'],
  authors: [{ name: 'Tallow' }],
  creator: 'Tallow',
  publisher: 'Tallow',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tallow.app',
    siteName: 'Tallow',
    title: 'Tallow - Secure File Transfers. Quantum-Safe.',
    description: 'Transfer files directly between devices with post-quantum encryption. No cloud storage, no compromises.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tallow - Secure File Transfers. Quantum-Safe.',
    description: 'Transfer files directly between devices with post-quantum encryption.',
    creator: '@tallow',
  },
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
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
          suppressHydrationWarning
        />
      </head>
      <body>
        <ThemeProvider defaultTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
