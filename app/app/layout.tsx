'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { TooltipProvider } from '@/components/ui/Tooltip';
import type { NavItem } from '@/components/layout/Sidebar';

// Map pathnames to nav IDs
function getActiveNavId(pathname: string): string {
  if (pathname === '/app' || pathname === '/app/') {return 'transfer';}
  if (pathname.startsWith('/app/devices')) {return 'devices';}
  if (pathname.startsWith('/app/history')) {return 'history';}
  if (pathname.startsWith('/app/settings')) {return 'settings';}
  return 'transfer';
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeNavId = getActiveNavId(pathname);

  // Mock connection status - will be replaced with real hook
  const [connectionStatus] = React.useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const handleNavigate = React.useCallback((item: NavItem) => {
    // In real app, would use router.push(item.href)
    window.location.href = item.href;
  }, []);

  return (
    <TooltipProvider>
      <AppShell
        activeNavId={activeNavId}
        onNavigate={handleNavigate}
        connectionStatus={connectionStatus}
      >
        {children}
      </AppShell>
    </TooltipProvider>
  );
}
