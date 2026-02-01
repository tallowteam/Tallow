import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";
import "./toast-styles.css";

// =============================================================================
// FONTS
// =============================================================================

// Inter - Clean sans-serif for body text and UI
const inter = localFont({
  src: "../public/fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
  preload: true,
});

// Cormorant Garamond - Elegant thin serif for display headings
const cormorant = localFont({
  src: [
    {
      path: "../public/fonts/cormorant-garamond-latin-300-normal.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/cormorant-garamond-latin-300-italic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/cormorant-garamond-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/cormorant-garamond-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/cormorant-garamond-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/cormorant-garamond-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});

// Geist Mono - Monospace for code blocks
const geistMono = localFont({
  src: "../public/fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  preload: false,
});

// =============================================================================
// METADATA
// =============================================================================

export const metadata: Metadata = {
  title: {
    default: "Tallow - Secure File Transfer",
    template: "%s | Tallow",
  },
  description:
    "Transfer files securely with end-to-end encryption. No accounts, no cloud storage, no tracking. Your files go directly from device to device with post-quantum cryptography protection.",
  keywords: [
    "secure file transfer",
    "end-to-end encryption",
    "peer-to-peer",
    "P2P",
    "private file sharing",
    "post-quantum cryptography",
    "WebRTC",
    "no account required",
    "privacy-first",
  ],
  authors: [{ name: "Tallow" }],
  creator: "Tallow",
  publisher: "Tallow",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tallow",
  },
  applicationName: "Tallow",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tallow.app",
    siteName: "Tallow",
    title: "Tallow - Secure File Transfer",
    description:
      "Transfer files securely with end-to-end encryption. No accounts, no cloud storage, no tracking. Privacy-first file sharing.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tallow - Secure File Transfer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tallow - Secure File Transfer",
    description:
      "Transfer files securely with end-to-end encryption. No accounts, no cloud storage, no tracking.",
    images: ["/og-image.png"],
    creator: "@tallow_app",
  },
  metadataBase: new URL(
    process.env["NEXT_PUBLIC_APP_URL"] || "https://tallow.app"
  ),
  alternates: {
    canonical: "/",
  },
  category: "technology",
};

// =============================================================================
// VIEWPORT
// =============================================================================

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
  colorScheme: "dark light",
};

// =============================================================================
// ROOT LAYOUT
// =============================================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        {/* DNS Prefetch for known domains */}
        <link rel="dns-prefetch" href="https://signaling.manisahome.com" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />

        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://signaling.manisahome.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Preload critical images */}
        <link
          rel="preload"
          href="/icon-192.png"
          as="image"
          type="image/png"
        />

        {/* Module preload for critical chunks (will be added by Next.js automatically) */}

        {/* Resource hints for performance */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
      </head>
      <body
        className={`${inter.variable} ${cormorant.variable} ${geistMono.variable} font-sans bg-background text-foreground antialiased`}
      >
        {/* Skip links for accessibility - WCAG 2.1 AA compliant */}
        <div className="skip-links">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-[#191610] dark:focus:bg-[#fefefc] focus:px-6 focus:py-3 focus:text-[#fefefc] dark:focus:text-[#191610] focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#fefefc] dark:focus:ring-[#191610] focus:ring-offset-2 focus:ring-offset-background"
          >
            Skip to main content
          </a>
          <a
            href="#site-navigation"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-16 focus:z-[9999] focus:rounded-lg focus:bg-[#191610] dark:focus:bg-[#fefefc] focus:px-6 focus:py-3 focus:text-[#fefefc] dark:focus:text-[#191610] focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#fefefc] dark:focus:ring-[#191610] focus:ring-offset-2 focus:ring-offset-background"
          >
            Skip to navigation
          </a>
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
