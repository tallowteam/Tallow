/**
 * TV Navigation Component
 * Full-screen grid navigation for TV/large displays
 */

'use client';

import React from 'react';


import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Send,
  History,
  Settings,
  Users,
  Shield,
  HelpCircle,
  Lock,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
}

const navItems: NavItem[] = [
  {
    href: '/app',
    label: 'Home',
    icon: Home,
    description: 'Dashboard and overview',
    color: 'from-white/20 to-white/30',
  },
  {
    href: '/app/transfer',
    label: 'Transfer',
    icon: Send,
    description: 'Send files securely',
    color: 'from-purple-500 to-purple-600',
  },
  {
    href: '/app/history',
    label: 'History',
    icon: History,
    description: 'View past transfers',
    color: 'from-green-500 to-green-600',
  },
  {
    href: '/app/friends',
    label: 'Friends',
    icon: Users,
    description: 'Manage your contacts',
    color: 'from-orange-500 to-orange-600',
  },
  {
    href: '/app/settings',
    label: 'Settings',
    icon: Settings,
    description: 'Configure preferences',
    color: 'from-gray-500 to-gray-600',
  },
  {
    href: '/app/privacy-settings',
    label: 'Privacy',
    icon: Lock,
    description: 'Privacy controls',
    color: 'from-red-500 to-red-600',
  },
  {
    href: '/help',
    label: 'Help',
    icon: HelpCircle,
    description: 'Get assistance',
    color: 'from-teal-500 to-teal-600',
  },
];

interface TVNavigationProps {
  children?: React.ReactNode;
}

export function TVNavigation({ children }: TVNavigationProps) {
  const pathname = usePathname();
  const isMainNav = pathname === '/app' || pathname === '/';

  // Show grid navigation on main app page
  if (isMainNav) {
    return (
      <div className="min-h-screen bg-background p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Shield className="w-12 h-12 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">Tallow</h1>
              <p className="text-muted-foreground text-lg">
                Quantum-Secure File Transfer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-6 h-6 text-green-500" />
            <span className="text-lg">Post-Quantum Encrypted</span>
          </div>
        </header>

        {/* Navigation Grid */}
        <nav
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto"
          role="navigation"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex flex-col items-center justify-center p-8 rounded-2xl',
                  'bg-gradient-to-br transition-all duration-300',
                  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary',
                  'hover:scale-105 hover:shadow-2xl',
                  item.color
                )}
              >
                <Icon
                  className="w-16 h-16 text-white mb-4 group-hover:scale-110 transition-transform"
                  aria-hidden="true"
                />
                <span className="text-2xl font-bold text-white mb-2">
                  {item.label}
                </span>
                <span className="text-white/80 text-center">
                  {item.description}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  // Show content with minimal nav for other pages
  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="flex items-center justify-between h-20 px-8 border-b border-border">
        <Link href="/app" className="flex items-center gap-3 hover:opacity-80">
          <Shield className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold">Tallow</span>
        </Link>
        <nav className="flex items-center gap-4">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-lg">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Content */}
      <main className="p-8">{children}</main>
    </div>
  );
}
