import type { Metadata, Viewport } from 'next';
import { ThemeProvider, ThemeScript } from '@/components/theme';
import { SkipLink } from '@/components/a11y';
import { AccessibilityProvider } from '@/components/a11y/AccessibilityProvider';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { PerformanceInit } from '@/lib/performance/PerformanceInit';
import { geistSans, fontClassNames } from '@/lib/fonts/geist';
import './globals.css';

// Using Geist Sans (Vercel's official font) as primary
// Inter remains as fallback for gradual migration
// Fonts are automatically optimized and self-hosted by Next.js

export const metadata: Metadata = {
  title: 'Tallow',
  description: 'Secure peer-to-peer file transfers with post-quantum encryption.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontClassNames} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={geistSans.className}>
        <SkipLink targetId="main-content" label="Skip to main content" />
        <ThemeProvider>
          <AccessibilityProvider>
            <ToastProvider position="bottom-right" maxToasts={5}>
              {children}
            </ToastProvider>
          </AccessibilityProvider>
        </ThemeProvider>
        <PerformanceInit />
      </body>
    </html>
  );
}
