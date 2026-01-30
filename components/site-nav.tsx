"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// CONSTANTS
// ============================================================================

const NAV_HEIGHT = 64;

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/security", label: "Security" },
  { href: "/docs", label: "Docs" },
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
      <span className="text-xl 3xl:text-2xl 4xl:text-3xl font-medium text-[#fefefc] group-hover:text-white/70 transition-colors">
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
          ? "text-[#fefefc]"
          : "text-[#a8a29e] hover:text-[#fefefc]"
      )}
    >
      {label}
      {isActive && (
        <motion.div
          layoutId="nav-underline"
          className="absolute -bottom-1 left-0 right-0 h-px bg-[#fefefc]"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
}

// ============================================================================
// CTA BUTTON COMPONENT
// ============================================================================

function CTAButton({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href="/app"
      {...(onClick ? { onClick } : {})}
      className={cn(
        "inline-flex items-center justify-center",
        "px-6 py-2.5 3xl:px-8 3xl:py-3 4xl:px-10 4xl:py-4 rounded-[60px]",
        "text-sm 3xl:text-base 4xl:text-lg font-medium",
        "border border-[#fefefc] text-[#fefefc]",
        "hover:bg-[#fefefc] hover:text-[#0a0a08]",
        "transition-all duration-300",
        className
      )}
    >
      Get Started
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
          "block text-3xl font-medium py-4 transition-colors duration-200",
          isActive
            ? "text-[#fefefc]"
            : "text-[#a8a29e] hover:text-[#fefefc]"
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
      {/* Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "transition-all duration-300",
          scrolled
            ? "bg-[#0a0a08]/80 backdrop-blur-xl border-b border-[#262626]"
            : "bg-transparent border-b border-transparent"
        )}
        style={{ height: NAV_HEIGHT }}
      >
        <nav className="h-full max-w-[1400px] 3xl:max-w-[1800px] 4xl:max-w-[2200px] mx-auto px-6 3xl:px-10 4xl:px-12 flex items-center justify-between">
          {/* Logo */}
          <TallowLogo />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10 3xl:gap-14 4xl:gap-16">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                isActive={pathname === link.href}
              />
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <CTAButton />
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -mr-2"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="w-6 h-6 text-[#fefefc]" />
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

            {/* Menu Panel */}
            <motion.div
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className={cn(
                "fixed top-0 right-0 bottom-0 z-50",
                "w-full max-w-md",
                "bg-[#0a0a08]",
                "md:hidden"
              )}
            >
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div
                  className="flex items-center justify-between px-6 border-b border-[#262626]"
                  style={{ height: NAV_HEIGHT }}
                >
                  <TallowLogo />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={closeMobileMenu}
                    className="p-2 -mr-2"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6 text-[#fefefc]" />
                  </motion.button>
                </div>

                {/* Mobile Links */}
                <motion.div
                  variants={linkContainerVariants}
                  initial="closed"
                  animate="open"
                  className="flex-1 px-6 py-8"
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
                </motion.div>

                {/* Mobile CTA */}
                <div className="px-6 pb-8">
                  <CTAButton
                    onClick={closeMobileMenu}
                    className="w-full"
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from going under fixed header */}
      <div style={{ height: NAV_HEIGHT }} />
    </>
  );
}

export default SiteNav;
