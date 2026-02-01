/**
 * Responsive Navigation Component
 * Adapts navigation pattern based on device breakpoint
 */

'use client';

import React from 'react';


import { useBreakpoint } from '@/lib/hooks/use-breakpoint';
import { MobileBottomNav } from './mobile-bottom-nav';
import { TabletSidebarNav } from './tablet-sidebar-nav';
import { DesktopSidebar } from './desktop-sidebar';
import { TVNavigation } from './tv-navigation';

export interface ResponsiveNavProps {
  children?: React.ReactNode;
}

/**
 * Main responsive navigation component that renders appropriate nav for device
 */
export function ResponsiveNav({ children }: ResponsiveNavProps) {
  const { breakpoint } = useBreakpoint();

  return (
    <>
      {/* Mobile: Bottom navigation bar */}
      {breakpoint === 'mobile' && <MobileBottomNav />}

      {/* Tablet: Collapsible sidebar */}
      {breakpoint === 'tablet' && (
        <div className="flex h-screen">
          <TabletSidebarNav />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      )}

      {/* Laptop & Desktop: Persistent sidebar */}
      {(breakpoint === 'laptop' || breakpoint === 'desktop') && (
        <div className="flex h-screen">
          <DesktopSidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      )}

      {/* TV: Full-screen grid navigation */}
      {breakpoint === 'tv' && <TVNavigation>{children}</TVNavigation>}
    </>
  );
}

/**
 * Hook to get navigation height for current device
 */
export function useNavHeight(): number {
  const { breakpoint } = useBreakpoint();

  const navHeights = {
    mobile: 64,    // Bottom nav height
    tablet: 0,     // Sidebar (no top offset)
    laptop: 0,     // Sidebar (no top offset)
    desktop: 0,    // Sidebar (no top offset)
    tv: 0,         // Full-screen nav
  };

  return navHeights[breakpoint];
}

/**
 * Component to add appropriate padding for nav on mobile
 */
export function NavSpacer() {
  const navHeight = useNavHeight();

  if (navHeight === 0) {return null;}

  return <div style={{ height: navHeight }} aria-hidden="true" />;
}
