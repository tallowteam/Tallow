/**
 * Euveka-Style Minimal Navigation Component
 *
 * EUVEKA Design Specifications:
 * - Fixed, minimal header with clean design
 * - Logo left, single CTA right
 * - Transparent background, becomes solid on scroll
 * - Underlined links on hover
 * - Button radius: 60px (rounded-[60px])
 * - Border: subtle #e5dac7 (light) / #544a36 (dark)
 * - Nav button height: 56-64px
 * - Mobile: slide-in menu or bottom sheet
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Menu, X, ArrowRight } from 'lucide-react';

/**
 * EUVEKA Design Constants Reference:
 * - Border: #e5dac7 (light) / #544a36 (dark)
 * - Background: #fefefc (light) / #191610 (dark)
 * - Text primary: #191610 (light) / #fefefc (dark)
 * - Text muted: #b2987d
 * - Button radius: 60px (rounded-[60px])
 * - Button height: 56-64px range
 */

// =============================================================================
// TYPES
// =============================================================================

export interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

export interface EuvekaNavProps {
  /** Navigation links to display */
  links?: NavLink[];
  /** CTA button configuration */
  cta?: {
    label: string;
    href: string;
    external?: boolean;
  };
  /** Scroll threshold for background transition (in pixels) */
  scrollThreshold?: number;
  /** Additional class name */
  className?: string;
  /** Whether to show mobile menu toggle */
  showMobileMenu?: boolean;
  /** Logo size variant */
  logoSize?: 'xs' | 'sm' | 'default' | 'lg';
  /** Hide on scroll down, show on scroll up */
  hideOnScroll?: boolean;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const defaultLinks: NavLink[] = [
  { href: '/features', label: 'Features' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/security', label: 'Security' },
  { href: '/docs', label: 'Docs' },
];

const defaultCTA = {
  label: 'Get Started',
  href: '/app',
};

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const navVariants = {
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
  hidden: {
    y: -100,
    opacity: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
};

const mobileMenuVariants = {
  closed: {
    opacity: 0,
    x: '100%',
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 40,
    },
  },
  open: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 40,
    },
  },
};

const linkContainerVariants = {
  closed: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
  open: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const linkItemVariants = {
  closed: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2 },
  },
  open: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

// =============================================================================
// NAV LINK COMPONENT
// =============================================================================

interface NavLinkItemProps {
  link: NavLink;
  isActive: boolean;
  onClick?: () => void;
  variant?: 'desktop' | 'mobile';
}

const NavLinkItem = ({ link, isActive, onClick, variant = 'desktop' }: NavLinkItemProps) => {
  const baseStyles = cn(
    'relative inline-block transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    variant === 'desktop'
      ? 'text-sm font-medium text-foreground/70 hover:text-foreground'
      : 'text-3xl font-light text-foreground/80 hover:text-foreground tracking-tight font-display'
  );

  const content = (
    <span className="group relative">
      <span className={baseStyles}>{link.label}</span>
      <span
        className={cn(
          'absolute bottom-0 left-0 w-full bg-foreground origin-left transition-transform duration-300',
          variant === 'mobile' ? 'h-0.5' : 'h-px',
          isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        )}
        style={{ transformOrigin: 'left' }}
      />
    </span>
  );

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className="group"
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={link.href} {...(onClick ? { onClick } : {})} className="group">
      {content}
    </Link>
  );
};

// =============================================================================
// UNDERLINE LINK COMPONENT (Exportable)
// =============================================================================

export interface UnderlineLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
  underlineColor?: string;
}

export const UnderlineLink = ({
  href,
  children,
  external = false,
  className,
  underlineColor = 'bg-foreground',
}: UnderlineLinkProps) => {
  const linkContent = (
    <span className="group relative inline-block">
      <span className={cn('transition-colors duration-200', className)}>{children}</span>
      <span
        className={cn(
          'absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100',
          underlineColor
        )}
      />
    </span>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block">
        {linkContent}
      </a>
    );
  }

  return (
    <Link href={href} className="inline-block">
      {linkContent}
    </Link>
  );
};

// =============================================================================
// MOBILE MENU COMPONENT
// =============================================================================

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: NavLink[];
  cta?: EuvekaNavProps['cta'];
  pathname: string | null;
}

const MobileMenu = ({ isOpen, onClose, links, cta, pathname }: MobileMenuProps) => {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          {/* EUVEKA: Clean panel with subtle border */}
          <motion.div
            className={cn(
              "fixed inset-y-0 right-0 z-50 w-full max-w-sm shadow-2xl",
              "bg-[#fefefc] dark:bg-[#191610]",
              "border-l border-[#e5dac7] dark:border-[#544a36]"
            )}
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <div className="flex flex-col h-full">
              {/* Close Button */}
              <div className="flex items-center justify-end h-20 px-6">
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" aria-hidden="true" />
                </button>
              </div>

              {/* Navigation Links */}
              <motion.nav
                className="flex-1 px-6 py-8"
                variants={linkContainerVariants}
                initial="closed"
                animate="open"
                exit="closed"
              >
                <ul className="space-y-6">
                  {links.map((link) => (
                    <motion.li key={link.href} variants={linkItemVariants}>
                      <NavLinkItem
                        link={link}
                        isActive={pathname === link.href}
                        onClick={onClose}
                        variant="mobile"
                      />
                    </motion.li>
                  ))}
                </ul>
              </motion.nav>

              {/* CTA Button */}
              {cta && (
                <motion.div
                  className="p-6 border-t border-border"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    asChild
                    size="lg"
                    className={cn(
                      "w-full rounded-[60px]",
                      "min-h-[56px] h-14",
                      "border border-[#e5dac7] dark:border-[#544a36]",
                      "bg-[#fefefc] dark:bg-[#191610]",
                      "text-[#191610] dark:text-[#fefefc]",
                      "hover:bg-[#f3ede2] dark:hover:bg-[#242018]",
                      "transition-all duration-300"
                    )}
                    onClick={onClose}
                  >
                    {cta.external ? (
                      <a href={cta.href} target="_blank" rel="noopener noreferrer">
                        {cta.label}
                        <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
                      </a>
                    ) : (
                      <Link href={cta.href}>
                        {cta.label}
                        <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
                      </Link>
                    )}
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EuvekaNav({
  links = defaultLinks,
  cta = defaultCTA,
  scrollThreshold = 50,
  className,
  showMobileMenu = true,
  logoSize = 'default',
  hideOnScroll = false,
}: EuvekaNavProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll for background transition and hide-on-scroll
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    // Background transition
    setIsScrolled(currentScrollY > scrollThreshold);

    // Hide on scroll down, show on scroll up
    if (hideOnScroll) {
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    }

    setLastScrollY(currentScrollY);
  }, [scrollThreshold, hideOnScroll, lastScrollY]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          'transition-all duration-300 ease-out',
          isScrolled
            ? 'bg-background/90 backdrop-blur-md border-b border-border/50 shadow-sm'
            : 'bg-transparent border-b border-transparent',
          className
        )}
        variants={navVariants}
        initial="visible"
        animate={isVisible ? 'visible' : 'hidden'}
      >
        <div className="container mx-auto px-4">
          <nav
            className={cn(
              'flex items-center justify-between transition-all duration-300',
              isScrolled ? 'h-16' : 'h-20'
            )}
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Logo */}
            <BrandLogo
              href="/"
              size={logoSize}
              showText
              hoverAnimation="pulse"
            />

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-8">
              {links.map((link) => (
                <NavLinkItem
                  key={link.href}
                  link={link}
                  isActive={pathname === link.href}
                  variant="desktop"
                />
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Desktop CTA - EUVEKA: 60px radius, 56-64px height */}
              {cta && (
                <div className="hidden lg:block">
                  <Button
                    asChild
                    size="lg"
                    className={cn(
                      "rounded-[60px] px-8",
                      "min-h-[56px] h-14 3xl:h-16 3xl:min-h-[64px]",
                      "border border-[#e5dac7] dark:border-[#544a36]",
                      "bg-[#fefefc] dark:bg-[#191610]",
                      "text-[#191610] dark:text-[#fefefc]",
                      "hover:bg-[#f3ede2] dark:hover:bg-[#242018]",
                      "transition-all duration-300"
                    )}
                  >
                    {cta.external ? (
                      <a href={cta.href} target="_blank" rel="noopener noreferrer">
                        {cta.label}
                      </a>
                    ) : (
                      <Link href={cta.href}>{cta.label}</Link>
                    )}
                  </Button>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              {showMobileMenu && (
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className={cn(
                    'lg:hidden p-2 rounded-lg transition-colors',
                    'text-foreground/70 hover:text-foreground hover:bg-foreground/5',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50'
                  )}
                  aria-label="Open menu"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  <Menu className="w-6 h-6" aria-hidden="true" />
                </button>
              )}
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          links={links}
          cta={cta}
          pathname={pathname}
        />
      )}

      {/* Spacer to prevent content from being hidden under fixed nav */}
      <div
        className={cn(
          'transition-all duration-300',
          isScrolled ? 'h-16' : 'h-20'
        )}
        aria-hidden="true"
      />
    </>
  );
}

// =============================================================================
// MINIMAL VARIANT (Logo + Single CTA only)
// =============================================================================

export interface EuvekaNavMinimalProps {
  cta?: {
    label: string;
    href: string;
    external?: boolean;
  };
  scrollThreshold?: number;
  className?: string;
  logoSize?: 'xs' | 'sm' | 'default' | 'lg';
}

export function EuvekaNavMinimal({
  cta = defaultCTA,
  scrollThreshold = 50,
  className,
  logoSize = 'default',
}: EuvekaNavMinimalProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          'transition-all duration-300 ease-out',
          isScrolled
            ? 'bg-background/90 backdrop-blur-md border-b border-border/50 shadow-sm'
            : 'bg-transparent border-b border-transparent',
          className
        )}
      >
        <div className="container mx-auto px-4">
          <nav
            className={cn(
              'flex items-center justify-between transition-all duration-300',
              isScrolled ? 'h-16' : 'h-20'
            )}
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Logo */}
            <BrandLogo
              href="/"
              size={logoSize}
              showText
              hoverAnimation="pulse"
            />

            {/* CTA */}
            {/* EUVEKA: 60px radius, 56-64px height */}
            {cta && (
              <Button
                asChild
                size="lg"
                className={cn(
                  "rounded-[60px] px-8",
                  "min-h-[56px] h-14",
                  "border border-[#e5dac7] dark:border-[#544a36]",
                  "bg-[#fefefc] dark:bg-[#191610]",
                  "text-[#191610] dark:text-[#fefefc]",
                  "hover:bg-[#f3ede2] dark:hover:bg-[#242018]",
                  "transition-all duration-300"
                )}
              >
                {cta.external ? (
                  <a href={cta.href} target="_blank" rel="noopener noreferrer">
                    {cta.label}
                  </a>
                ) : (
                  <Link href={cta.href}>{cta.label}</Link>
                )}
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Spacer */}
      <div
        className={cn(
          'transition-all duration-300',
          isScrolled ? 'h-16' : 'h-20'
        )}
        aria-hidden="true"
      />
    </>
  );
}

// =============================================================================
// TRANSPARENT VARIANT (No background even on scroll)
// =============================================================================

export interface EuvekaNavTransparentProps extends Omit<EuvekaNavProps, 'scrollThreshold'> {
  /** Whether to show a subtle border on scroll */
  showBorderOnScroll?: boolean;
}

export function EuvekaNavTransparent({
  links = defaultLinks,
  cta = defaultCTA,
  showBorderOnScroll = true,
  className,
  showMobileMenu = true,
  logoSize = 'default',
}: EuvekaNavTransparentProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          'transition-all duration-300 ease-out',
          'bg-transparent',
          isScrolled && showBorderOnScroll && 'border-b border-foreground/10',
          className
        )}
      >
        <div className="container mx-auto px-4">
          <nav
            className={cn(
              'flex items-center justify-between transition-all duration-300',
              isScrolled ? 'h-16' : 'h-20'
            )}
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Logo */}
            <BrandLogo
              href="/"
              size={logoSize}
              showText
              hoverAnimation="pulse"
            />

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-8">
              {links.map((link) => (
                <NavLinkItem
                  key={link.href}
                  link={link}
                  isActive={pathname === link.href}
                  variant="desktop"
                />
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Desktop CTA - EUVEKA: 60px radius, subtle border */}
              {cta && (
                <div className="hidden lg:block">
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className={cn(
                      "rounded-[60px] px-8",
                      "min-h-[56px] h-14 3xl:h-16 3xl:min-h-[64px]",
                      "border border-[#e5dac7] dark:border-[#544a36]",
                      "bg-transparent",
                      "text-[#191610] dark:text-[#fefefc]",
                      "hover:bg-[#e5dac7]/20 dark:hover:bg-[#544a36]/20",
                      "transition-all duration-300"
                    )}
                  >
                    {cta.external ? (
                      <a href={cta.href} target="_blank" rel="noopener noreferrer">
                        {cta.label}
                      </a>
                    ) : (
                      <Link href={cta.href}>{cta.label}</Link>
                    )}
                  </Button>
                </div>
              )}

              {/* Mobile Menu Toggle - EUVEKA: subtle styling */}
              {showMobileMenu && (
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className={cn(
                    'lg:hidden p-3 rounded-[60px] transition-all duration-300',
                    'min-h-[44px] min-w-[44px]',
                    'text-[#191610] dark:text-[#fefefc]',
                    'hover:bg-[#e5dac7]/30 dark:hover:bg-[#544a36]/30',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b2987d]/50'
                  )}
                  aria-label="Open menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  <Menu className="w-6 h-6" aria-hidden="true" />
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          links={links}
          cta={cta}
          pathname={pathname}
        />
      )}

      {/* Spacer */}
      <div
        className={cn(
          'transition-all duration-300',
          isScrolled ? 'h-16' : 'h-20'
        )}
        aria-hidden="true"
      />
    </>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default EuvekaNav;
