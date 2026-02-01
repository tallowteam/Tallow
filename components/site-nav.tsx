"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggleMinimal } from "@/components/theme-toggle";
import { LanguageDropdown } from "@/components/language-dropdown";
import { useLanguage } from "@/lib/i18n/language-context";

// ============================================================================
// EUVEKA DESIGN CONSTANTS
// ============================================================================

/**
 * EUVEKA Navigation Design Specifications:
 * - Clean minimal design
 * - Button radius: 60px (rounded-[60px])
 * - Border: subtle #e5dac7 (light) / #544a36 (dark)
 * - Height: 56-64px for nav buttons
 * - Nav Heights: Mobile 64px, Tablet 72px, Desktop 80px, 3xl 88px, 4xl 96px
 *
 * Color Reference:
 * - Border: #e5dac7 (light) / #544a36 (dark)
 * - Background: #fefefc (light) / #191610 (dark)
 * - Text primary: #191610 (light) / #fefefc (dark)
 * - Text muted: #666666 (light) / #a3a3a3 (dark)
 */

// Navigation link configuration - labels are translation keys
const NAV_LINK_CONFIG = [
  { href: "/features", labelKey: "nav.features" },
  { href: "/how-it-works", labelKey: "nav.howItWorks" },
  { href: "/security", labelKey: "nav.security" },
  { href: "/docs", labelKey: "nav.docs" },
] as const;

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const mobileMenuVariants: Variants = {
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
  closed: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
  open: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

const linkContainerVariants: Variants = {
  closed: {},
  open: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const mobileLinkVariants: Variants = {
  closed: {
    x: 50,
    opacity: 0,
  },
  open: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

// ============================================================================
// LOGO COMPONENT
// ============================================================================

function TallowLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 3xl:gap-4 group">
      <div className="w-10 h-10 3xl:w-14 3xl:h-14 4xl:w-16 4xl:h-16 rounded-full bg-white flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 3xl:w-6 3xl:h-6 4xl:w-7 4xl:h-7 text-[#0a0a08] -rotate-90"
          fill="currentColor"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <span className="text-xl 3xl:text-2xl 4xl:text-3xl font-medium dark:text-[#fefefc] text-[#0a0a08] dark:group-hover:text-white/70 group-hover:text-[#0a0a08]/70 transition-colors">
        tallow
      </span>
    </Link>
  );
}

// ============================================================================
// NAV LINK COMPONENT
// ============================================================================

function NavLink({
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
        "relative text-sm 3xl:text-base 4xl:text-lg font-medium transition-colors duration-200",
        isActive
          ? "dark:text-[#fefefc] text-[#0a0a08]"
          : "dark:text-[#a3a3a3] text-[#666666] dark:hover:text-[#fefefc] hover:text-[#0a0a08]"
      )}
    >
      {label}
      {isActive && (
        <motion.div
          layoutId="nav-underline"
          className="absolute -bottom-1 left-0 right-0 h-px dark:bg-[#fefefc] bg-[#0a0a08]"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
}

// ============================================================================
// CTA BUTTON COMPONENT
// ============================================================================

/**
 * CTA Button - EUVEKA Styled
 * - 60px border radius
 * - 56-64px height range
 * - Subtle border with theme-aware colors
 */
function CTAButton({
  className,
  onClick,
  label,
}: {
  className?: string;
  onClick?: () => void;
  label: string;
}) {
  return (
    <Link
      href="/app"
      {...(onClick ? { onClick } : {})}
      className={cn(
        "inline-flex items-center justify-center",
        // EUVEKA: 60px radius, 56-64px height
        "px-6 py-3 md:px-8 md:py-3 3xl:px-10 3xl:py-4 4xl:px-12 4xl:py-4",
        "rounded-[60px]",
        "min-h-[56px] md:min-h-[56px] 3xl:min-h-[60px] 4xl:min-h-[64px]",
        "text-sm 3xl:text-base 4xl:text-lg font-semibold",
        // EUVEKA: subtle border
        "border border-[#e5dac7] dark:border-[#544a36]",
        // EUVEKA: theme colors
        "bg-[#fefefc] dark:bg-[#191610]",
        "text-[#191610] dark:text-[#fefefc]",
        // EUVEKA: hover state
        "hover:bg-[#f3ede2] dark:hover:bg-[#242018]",
        "hover:shadow-[0_0_20px_rgba(229,218,199,0.4)] dark:hover:shadow-[0_0_20px_rgba(84,74,54,0.4)]",
        "transition-all duration-300",
        className
      )}
    >
      {label}
    </Link>
  );
}

// ============================================================================
// MOBILE NAV LINK COMPONENT
// ============================================================================

function MobileNavLink({
  href,
  label,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div variants={mobileLinkVariants}>
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          // EUVEKA Touch Target: 44px minimum height for mobile links
          "block text-2xl sm:text-3xl font-medium py-4 min-h-[56px] flex items-center transition-colors duration-200",
          isActive
            ? "dark:text-[#fefefc] text-[#0a0a08]"
            : "dark:text-[#a3a3a3] text-[#666666] dark:hover:text-[#fefefc] hover:text-[#0a0a08]"
        )}
      >
        {label}
      </Link>
    </motion.div>
  );
}

// ============================================================================
// MAIN NAVIGATION COMPONENT
// ============================================================================

export function SiteNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLanguage();

  // Memoize translated nav links to prevent unnecessary re-renders
  const navLinks = useMemo(
    () =>
      NAV_LINK_CONFIG.map((link) => ({
        href: link.href,
        label: t(link.labelKey),
      })),
    [t]
  );

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Header - EUVEKA Responsive: Mobile 64px, Tablet 72px, Desktop 80px, 3xl 88px, 4xl 96px */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "h-16 md:h-[72px] lg:h-20 3xl:h-[88px] 4xl:h-24",
          "transition-all duration-300",
          scrolled
            // EUVEKA: theme-aware background with subtle border
            ? "bg-[#fefefc]/95 dark:bg-[#191610]/95 backdrop-blur-xl border-b border-[#e5dac7] dark:border-[#544a36]"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <nav id="site-navigation" aria-label="Main navigation" className="h-full max-w-[1320px] lg:max-w-[1376px] xl:max-w-[1400px] 3xl:max-w-[1800px] 4xl:max-w-[2200px] mx-auto px-5 sm:px-6 md:px-8 lg:px-10 3xl:px-12 4xl:px-16 flex items-center justify-between">
          {/* Logo */}
          <TallowLogo />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 md:gap-8 3xl:gap-10 4xl:gap-12">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                isActive={pathname === link.href}
              />
            ))}
          </div>

          {/* Desktop CTA + Theme/Language */}
          <div className="hidden md:flex items-center gap-4 3xl:gap-6">
            <LanguageDropdown />
            <ThemeToggleMinimal />
            <CTAButton label={t("nav.getStarted")} />
          </div>

          {/* Mobile Menu Button - EUVEKA Touch Target: 44px minimum */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-3 -mr-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/5 dark:hover:bg-white/5 transition-colors"
            aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <Menu className="w-6 h-6 dark:text-[#fefefc] text-[#0a0a08]" aria-hidden="true" />
          </motion.button>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={closeMobileMenu}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              aria-hidden="true"
            />

            {/* Menu Panel - EUVEKA styled */}
            <motion.div
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
              className={cn(
                "fixed top-0 right-0 bottom-0 z-50",
                "w-full max-w-md",
                // EUVEKA: theme colors with subtle border
                "bg-[#fefefc] dark:bg-[#191610]",
                "border-l border-[#e5dac7] dark:border-[#544a36]",
                "md:hidden"
              )}
            >
              <div className="flex flex-col h-full">
                {/* Mobile Header - EUVEKA styled border */}
                <div
                  className="flex items-center justify-between px-5 sm:px-6 border-b border-[#e5dac7] dark:border-[#544a36] h-16"
                >
                  <TallowLogo />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={closeMobileMenu}
                    className="p-3 -mr-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/5 dark:hover:bg-white/5 transition-colors"
                    aria-label={t("nav.closeMenu")}
                  >
                    <X className="w-6 h-6 dark:text-[#fefefc] text-[#0a0a08]" aria-hidden="true" />
                  </motion.button>
                </div>

                {/* Mobile Links */}
                <motion.nav
                  variants={linkContainerVariants}
                  initial="closed"
                  animate="open"
                  className="flex-1 px-6 py-8"
                  aria-label="Mobile navigation"
                >
                  {navLinks.map((link) => (
                    <MobileNavLink
                      key={link.href}
                      href={link.href}
                      label={link.label}
                      isActive={pathname === link.href}
                      onClick={closeMobileMenu}
                    />
                  ))}
                </motion.nav>

                {/* Mobile Settings Row - EUVEKA styled border */}
                <div className="px-6 pb-6 flex items-center justify-between border-t border-[#e5dac7] dark:border-[#544a36] pt-6">
                  <span className="text-sm dark:text-[#a3a3a3] text-[#666666]">{t("app.settings")}</span>
                  <div className="flex items-center gap-4">
                    <LanguageDropdown />
                    <ThemeToggleMinimal />
                  </div>
                </div>

                {/* Mobile CTA */}
                <div className="px-6 pb-8">
                  <CTAButton
                    onClick={closeMobileMenu}
                    className="w-full"
                    label={t("nav.getStarted")}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from going under fixed header - Responsive */}
      <div className="h-16 md:h-[72px] lg:h-20 3xl:h-[88px] 4xl:h-24" />
    </>
  );
}

export default SiteNav;
