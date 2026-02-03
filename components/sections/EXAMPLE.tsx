/**
 * Example Landing Page Implementation
 *
 * This file demonstrates how to use all section components
 * to create a complete marketing landing page.
 *
 * Copy this to app/page.tsx to replace the existing homepage.
 */

import {
  Hero,
  Features,
  HowItWorks,
  Security,
  Stats,
  Testimonials,
  CTA,
} from '@/components/sections';

export default function LandingPage() {
  return (
    <main className="relative bg-black">
      {/* 1. Hero Section - Main headline and CTA */}
      <Hero />

      {/* 2. Features Section - Feature grid showcase */}
      <Features />

      {/* 3. How It Works - Step-by-step explanation */}
      <HowItWorks />

      {/* 4. Security Section - Privacy and encryption details */}
      <Security />

      {/* 5. Stats Section - Numbers and metrics */}
      <Stats />

      {/* 6. Testimonials - Social proof and reviews */}
      <Testimonials />

      {/* 7. CTA Section - Final call-to-action */}
      <CTA />

      {/* Optional: Add navigation between sections */}
      <ScrollNav />
    </main>
  );
}

/**
 * Optional: Floating scroll navigation
 * Shows section indicators on the side
 */
function ScrollNav() {
  const sections = [
    { id: 'hero', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <nav
      className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden lg:block"
      aria-label="Section navigation"
    >
      <ul className="space-y-4">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="group relative flex items-center gap-3"
              aria-label={`Navigate to ${section.label}`}
            >
              {/* Indicator dot */}
              <div className="w-2 h-2 rounded-full bg-gray-700 group-hover:bg-emerald-500 transition-colors duration-300" />

              {/* Label (shows on hover) */}
              <span className="absolute right-6 px-3 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {section.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Alternative: With custom navigation bar
 */
export function LandingPageWithNav() {
  return (
    <>
      <NavigationBar />
      <main className="relative bg-black">
        <Hero />
        <Features />
        <HowItWorks />
        <Security />
        <Stats />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

/**
 * Navigation bar component
 */
function NavigationBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-bold text-white">
          Tallow
        </a>

        <ul className="hidden md:flex items-center gap-8 text-sm">
          <li>
            <a href="#features" className="text-gray-400 hover:text-white transition-colors">
              Features
            </a>
          </li>
          <li>
            <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">
              How It Works
            </a>
          </li>
          <li>
            <a href="#security" className="text-gray-400 hover:text-white transition-colors">
              Security
            </a>
          </li>
          <li>
            <a
              href="https://github.com/yourusername/tallow"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </li>
        </ul>

        <a
          href="/app"
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
        >
          Launch App
        </a>
      </div>
    </nav>
  );
}

/**
 * Footer component
 */
function Footer() {
  return (
    <footer className="relative bg-black border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Tallow</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Secure, encrypted file transfers. No cloud storage, no tracking.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="text-gray-500 hover:text-emerald-400 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#security" className="text-gray-500 hover:text-emerald-400 transition-colors">
                  Security
                </a>
              </li>
              <li>
                <a href="/app" className="text-gray-500 hover:text-emerald-400 transition-colors">
                  Get Started
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/docs" className="text-gray-500 hover:text-emerald-400 transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/yourusername/tallow"
                  className="text-gray-500 hover:text-emerald-400 transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a href="/api" className="text-gray-500 hover:text-emerald-400 transition-colors">
                  API
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/privacy" className="text-gray-500 hover:text-emerald-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-500 hover:text-emerald-400 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/security" className="text-gray-500 hover:text-emerald-400 transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Tallow. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a
              href="https://twitter.com/yourhandle"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
              aria-label="Twitter"
            >
              Twitter
            </a>
            <a
              href="https://github.com/yourusername/tallow"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
              aria-label="GitHub"
            >
              GitHub
            </a>
            <a
              href="https://discord.gg/yourserver"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
              aria-label="Discord"
            >
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
