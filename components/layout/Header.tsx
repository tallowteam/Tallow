'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Container } from './Container';
import { MobileNav } from './MobileNav';
interface NavLink {
  href: string;
  label: string;
}

const navLinks: NavLink[] = [
  { href: '/features', label: 'Features' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/security', label: 'Security' },
  { href: '/privacy', label: 'Privacy' },
];

/**
 * Site header with navigation, logo, and mobile menu
 * Features sticky behavior and glassmorphism effect on scroll
 *
 * @example
 * ```tsx
 * <Header />
 * ```
 */
export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Detect scroll for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full transition-all duration-300',
          isScrolled
            ? 'border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        )}
      >
        <Container>
          <div className="flex h-16 items-center justify-between lg:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center space-x-2 transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 font-bold text-white">
                T
              </div>
              <span className="text-xl font-bold text-zinc-100">Tallow</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center space-x-1 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    isActive(link.href)
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA and Mobile Menu */}
            <div className="flex items-center space-x-4">
              <Link
                href="/app"
                className="hidden rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 sm:inline-flex"
              >
                Launch App
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      >
        <nav className="flex flex-col space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'rounded-lg px-4 py-3 text-base font-medium transition-colors',
                isActive(link.href)
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
              )}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-4">
            <Link
              href="/app"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full rounded-lg bg-zinc-100 px-4 py-3 text-center text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              Launch App
            </Link>
          </div>
        </nav>
      </MobileNav>
    </>
  );
}
