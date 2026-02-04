'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface SidebarItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: SidebarItem[];
  onClick?: () => void;
}

export interface SidebarProps {
  items: SidebarItem[];
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

/**
 * Sidebar - Collapsible sidebar navigation component
 *
 * Features:
 * - Nested menu items
 * - Active state detection
 * - Collapse/expand functionality
 * - Icons and badges
 * - Keyboard navigation
 * - ARIA compliant
 *
 * @example
 * ```tsx
 * <Sidebar
 *   items={[
 *     {
 *       id: 'dashboard',
 *       label: 'Dashboard',
 *       href: '/dashboard',
 *       icon: <Icon />,
 *       children: [
 *         { id: 'overview', label: 'Overview', href: '/dashboard/overview' }
 *       ]
 *     }
 *   ]}
 * />
 * ```
 */
export function Sidebar({
  items,
  defaultCollapsed = false,
  onCollapsedChange,
  className = '',
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);

    // Collapse all nested items when sidebar collapses
    if (newCollapsed) {
      setExpandedItems(new Set());
    }
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href?: string): boolean => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const hasActiveChild = (item: SidebarItem): boolean => {
    if (item.href && isActive(item.href)) return true;
    if (item.children) {
      return item.children.some(child => hasActiveChild(child));
    }
    return false;
  };

  const renderItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const itemIsActive = isActive(item.href);
    const hasActiveDescendant = hasActiveChild(item);

    const itemContent = (
      <div
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200
          ${itemIsActive
            ? 'bg-white text-black'
            : hasActiveDescendant
            ? 'text-white'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }
          ${level > 0 ? 'text-sm' : ''}
        `}
      >
        {item.icon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {item.icon}
          </span>
        )}

        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>

            {item.badge !== undefined && (
              <span
                className={`
                  px-2 py-0.5 text-xs font-medium rounded-full
                  ${itemIsActive
                    ? 'bg-black text-white'
                    : 'bg-zinc-800 text-zinc-300'
                  }
                `}
              >
                {item.badge}
              </span>
            )}

            {hasChildren && (
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </>
        )}
      </div>
    );

    return (
      <li key={item.id} className={level > 0 ? 'ml-6' : ''}>
        {item.href ? (
          <Link
            href={item.href}
            onClick={item.onClick}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg"
            aria-current={itemIsActive ? 'page' : undefined}
          >
            {itemContent}
          </Link>
        ) : (
          <button
            onClick={() => {
              if (hasChildren && !isCollapsed) {
                toggleExpanded(item.id);
              }
              item.onClick?.();
            }}
            className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg"
            aria-expanded={hasChildren ? isExpanded : undefined}
          >
            {itemContent}
          </button>
        )}

        {hasChildren && isExpanded && !isCollapsed && (
          <ul className="mt-1 space-y-1">
            {item.children!.map(child => renderItem(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside
      className={`
        bg-black border-r border-zinc-800 transition-all duration-300
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${className}
      `}
      aria-label="Sidebar navigation"
    >
      <div className="h-full flex flex-col">
        {/* Header with collapse toggle */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-white">Menu</h2>
          )}
          <button
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
            className="p-2 text-zinc-400 hover:text-white rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {items.map(item => renderItem(item))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
