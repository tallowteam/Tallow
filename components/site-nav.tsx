"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Menu, X, Sun, Moon, ArrowUpRight } from "lucide-react";
import { useTheme } from "next-themes";
import { LanguageDropdown } from "@/components/language-dropdown";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";
import { useSyncExternalStore } from "react";

// Custom hook to handle hydration safely without triggering ESLint warnings
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

// Navigation links configuration
const navLinks = [
  { href: "/features", labelKey: "nav.features", fallback: "Features" },
  { href: "/how-it-works", labelKey: "nav.howItWorks", fallback: "How it works" },
  { href: "/security", labelKey: "nav.security", fallback: "Security" },
  { href: "/docs", labelKey: "nav.docs", fallback: "Docs" },
];

// Animation variants for mobile menu
const menuVariants: Variants = {
  closed: {
    x: "100%",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40,
    },
  },
  open: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40,
    },
  },
};

const backdropVariants: Variants = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
};

const linkVariants: Variants = {
  closed: { x: 50, opacity: 0 },
  open: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      delay: i * 0.1,
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  }),
};

// Brand Logo Component
function BrandLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md",
        className
      )}
      aria-label="tallow - Home"
    >
      {/* Logo mark: Black circle with white triangle */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-foreground dark:bg-white transition-transform duration-300 group-hover:scale-110" />
        <svg
          viewBox="0 0 24 24"
          className="relative w-4 h-4 fill-background dark:fill-[#0d0d0d]"
          aria-hidden="true"
        >
          <polygon points="8,6 18,12 8,18" />
        </svg>
      </div>
      {/* Wordmark */}
      <span className="text-xl font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-accent">
        tallow
      </span>
    </Link>
  );
}

// Desktop Navigation Link with underline animation
function DesktopNavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative py-2 text-sm font-medium transition-colors duration-300",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {/* Animated underline */}
      <motion.span
        className="absolute bottom-0 left-0 h-[2px] bg-accent"
        initial={false}
        animate={{
          width: isActive ? "100%" : "0%",
        }}
        whileHover={{
          width: "100%",
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
      />
    </Link>
  );
}

// Theme Toggle with Sun/Moon transition
function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHydrated();

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  if (!mounted) {
    return (
      <button
        className="relative w-10 h-10 flex items-center justify-center rounded-full bg-muted/50 transition-colors"
        aria-label="Toggle theme"
        disabled
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className={cn(
        "relative w-10 h-10 flex items-center justify-center rounded-full",
        "bg-muted/50 hover:bg-muted transition-colors duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {resolvedTheme === "dark" ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Moon className="w-5 h-5 text-foreground" aria-hidden="true" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Sun className="w-5 h-5 text-foreground" aria-hidden="true" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// CTA Button with glow effect
function CTAButton({ className, onClick }: { className?: string; onClick?: () => void }) {
  const { t } = useLanguage();

  const linkClassName = cn(
    "inline-flex items-center gap-2 px-5 py-2.5 rounded-full",
    "text-sm font-semibold text-white",
    "bg-[#0066FF] hover:bg-[#0052CC]",
    "transition-all duration-300",
    "hover:-translate-y-0.5",
    "shadow-[0_0_20px_rgba(0,102,255,0.3)]",
    "hover:shadow-[0_0_30px_rgba(0,102,255,0.5)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className
  );

  const content = (
    <>
      {t("nav.getStarted") || "Get Started"}
      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
    </>
  );

  if (onClick) {
    return (
      <Link href="/app" onClick={() => onClick()} className={linkClassName}>
        {content}
      </Link>
    );
  }

  return (
    <Link href="/app" className={linkClassName}>
      {content}
    </Link>
  );
}

// Mobile Menu Link with staggered animation
function MobileNavLink({
  href,
  label,
  isActive,
  index,
  onClick,
}: {
  href: string;
  label: string;
  isActive: boolean;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.div
      custom={index}
      variants={linkVariants}
      initial="closed"
      animate="open"
      exit="closed"
    >
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "block text-3xl sm:text-4xl font-semibold transition-colors duration-300",
          "hover:translate-x-2 transform",
          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="flex items-center gap-4">
          {isActive && (
            <span className="w-2 h-2 rounded-full bg-[#0066FF] shadow-[0_0_10px_rgba(0,102,255,0.8)]" />
          )}
          {label}
        </span>
      </Link>
    </motion.div>
  );
}

// Main SiteNav Component
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);

  // Scroll listener for glass morphism effect
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: sync menu state with route changes
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [mobileOpen]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const toggleMenu = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <>
      {/* Main Header */}
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-background/80 dark:bg-[#0d0d0d]/80 backdrop-blur-xl border-b border-border/50"
            : "bg-transparent"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        role="banner"
      >
        <nav
          className="container mx-auto flex h-16 lg:h-20 items-center justify-between px-4 sm:px-6 lg:px-8"
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Left: Brand Logo */}
          <BrandLogo />

          {/* Center: Desktop Navigation Links */}
          <div className="hidden lg:flex items-center justify-center gap-8">
            {navLinks.map((link) => (
              <DesktopNavLink
                key={link.href}
                href={link.href}
                label={t(link.labelKey) || link.fallback}
                isActive={pathname === link.href}
              />
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Language Selector */}
            <LanguageDropdown />

            {/* Theme Toggle */}
            <ThemeToggleButton />

            {/* CTA Button - Hidden on mobile */}
            <div className="hidden sm:block">
              <CTAButton />
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={toggleMenu}
              className={cn(
                "lg:hidden relative w-10 h-10 flex items-center justify-center rounded-full",
                "bg-muted/50 hover:bg-muted transition-colors duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" aria-hidden="true" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm lg:hidden"
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={closeMenu}
              aria-hidden="true"
            />

            {/* Slide-in Menu Panel */}
            <motion.div
              ref={menuRef}
              id="mobile-menu"
              className={cn(
                "fixed top-0 right-0 bottom-0 z-[70] w-full max-w-md lg:hidden",
                "bg-background dark:bg-[#0d0d0d]",
                "border-l border-border/50",
                "shadow-2xl"
              )}
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              <div className="flex flex-col h-full px-6 sm:px-8">
                {/* Menu Header */}
                <div className="flex items-center justify-between h-16 border-b border-border/50">
                  <BrandLogo />
                  <motion.button
                    onClick={closeMenu}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-full",
                      "bg-muted/50 hover:bg-muted transition-colors duration-300",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    )}
                    aria-label="Close menu"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </motion.button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 flex flex-col justify-center gap-6 sm:gap-8 py-8">
                  {/* Home Link */}
                  <MobileNavLink
                    href="/"
                    label="Home"
                    isActive={pathname === "/"}
                    index={0}
                    onClick={closeMenu}
                  />
                  {navLinks.map((link, index) => (
                    <MobileNavLink
                      key={link.href}
                      href={link.href}
                      label={t(link.labelKey) || link.fallback}
                      isActive={pathname === link.href}
                      index={index + 1}
                      onClick={closeMenu}
                    />
                  ))}
                </nav>

                {/* Menu Footer */}
                <div className="pb-8 space-y-6 border-t border-border/50 pt-6">
                  {/* CTA Button */}
                  <CTAButton className="w-full justify-center py-4 text-base" onClick={closeMenu} />

                  {/* Tagline */}
                  <p className="text-center text-muted-foreground text-xs uppercase tracking-[0.2em]">
                    Secure File Transfer
                  </p>

                  {/* Decorative line */}
                  <div className="flex justify-center">
                    <div className="w-24 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#0066FF]/50 to-transparent" />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Glassmorphism glow effect at top when scrolled */}
      <motion.div
        className={cn(
          "fixed top-0 left-0 right-0 h-32 pointer-events-none z-40",
          "bg-[radial-gradient(ellipse_50%_100%_at_50%_-20%,_rgba(0,102,255,0.12)_0%,_transparent_100%)]"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: scrolled ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        aria-hidden="true"
      />
    </>
  );
}
