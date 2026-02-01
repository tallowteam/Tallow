/**
 * Desktop Sidebar Navigation Component
 * Persistent sidebar for laptop and desktop devices
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
  FileText,
  Lock,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  description?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { href: '/app', label: 'Home', icon: Home, description: 'Dashboard' },
      { href: '/app/transfer', label: 'Transfer', icon: Send, description: 'Send files' },
      { href: '/app/history', label: 'History', icon: History, description: 'Transfer history' },
      { href: '/app/friends', label: 'Friends', icon: Users, description: 'Manage contacts' },
    ],
  },
  {
    title: 'Settings & Info',
    items: [
      { href: '/app/settings', label: 'Settings', icon: Settings },
      { href: '/app/privacy-settings', label: 'Privacy', icon: Lock },
      { href: '/help', label: 'Help', icon: HelpCircle },
      { href: '/docs', label: 'Docs', icon: FileText },
    ],
  },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col h-screen w-64 bg-background border-r border-border"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-border">
        <Shield className="w-7 h-7 text-primary" />
        <span className="ml-2 font-bold text-xl">Tallow</span>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            {section.title && (
              <h3 className="px-6 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1 px-3">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                      <div className="flex flex-col">
                        <span className="text-sm">{item.label}</span>
                        {item.description && !isActive && (
                          <span className="text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 text-green-500" />
          <span>Post-Quantum Encrypted</span>
        </div>
      </div>
    </aside>
  );
}
