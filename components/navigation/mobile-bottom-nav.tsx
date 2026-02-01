/**
 * Mobile Bottom Navigation Component - EUVEKA Styled
 *
 * EUVEKA Design Specifications:
 * - Clean minimal design
 * - Border: subtle #e5dac7 (light) / #544a36 (dark)
 * - Height: 64px with safe area padding
 * - Active state with EUVEKA accent colors
 * - Touch targets: minimum 44px
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Home,
  Send,
  History,
  Settings,
  Users,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const navItems: NavItem[] = [
  { href: '/app', label: 'Home', icon: Home },
  { href: '/app/transfer', label: 'Transfer', icon: Send },
  { href: '/app/history', label: 'History', icon: History },
  { href: '/app/friends', label: 'Friends', icon: Users },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        // EUVEKA: theme-aware background
        "bg-[#fefefc] dark:bg-[#191610]",
        // EUVEKA: subtle border
        "border-t border-[#e5dac7] dark:border-[#544a36]",
        // Safe area for mobile devices
        "safe-area-bottom"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1",
                // EUVEKA: 44px minimum touch target
                "h-full min-h-[56px] py-2 px-1",
                "text-xs font-medium transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b2987d]/50 focus-visible:ring-offset-2",
                "touch-manipulation",
                isActive
                  // EUVEKA: active state with accent
                  ? "text-[#191610] dark:text-[#fefefc]"
                  // EUVEKA: muted inactive state
                  : "text-[#b2987d] hover:text-[#191610] dark:hover:text-[#fefefc]"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2",
                    "w-8 h-0.5 rounded-full",
                    "bg-[#191610] dark:bg-[#fefefc]"
                  )}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <Icon
                className={cn(
                  "w-5 h-5 mb-1 transition-all duration-300",
                  isActive && "scale-110"
                )}
                aria-hidden="true"
              />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// =============================================================================
// EUVEKA STYLED VARIANT WITH PILL BACKGROUND
// =============================================================================

export function MobileBottomNavPill() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50",
        // EUVEKA: pill shape
        "rounded-[60px]",
        // EUVEKA: theme-aware background with border
        "bg-[#fefefc]/95 dark:bg-[#191610]/95",
        "border border-[#e5dac7] dark:border-[#544a36]",
        "backdrop-blur-xl",
        "shadow-lg"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center",
                // EUVEKA: touch target
                "h-12 w-12 rounded-full",
                "text-xs font-medium transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b2987d]/50",
                "touch-manipulation",
                isActive
                  // EUVEKA: active with subtle background
                  ? "text-[#191610] dark:text-[#fefefc] bg-[#e5dac7]/30 dark:bg-[#544a36]/30"
                  : "text-[#b2987d] hover:text-[#191610] dark:hover:text-[#fefefc]"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-all duration-300",
                  isActive && "scale-110"
                )}
                aria-hidden="true"
              />
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default MobileBottomNav;
