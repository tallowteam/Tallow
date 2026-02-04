/**
 * Navigation Components - Usage Examples
 *
 * This file contains complete examples for all navigation components.
 * Copy and adapt these examples for your use cases.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Tabs,
  Breadcrumb,
  Pagination,
  Sidebar,
  Dropdown,
  CommandPalette,
  Stepper,
} from './index';

// ========================================
// Icons (replace with your icon library)
// ========================================

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// ========================================
// 1. Tabs Example
// ========================================

export function TabsExample() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <HomeIcon />,
      content: (
        <div className="p-4 bg-zinc-900 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-2">Overview</h3>
          <p className="text-zinc-400">
            This is the overview tab content. Navigate with arrow keys.
          </p>
        </div>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      content: (
        <div className="p-4 bg-zinc-900 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-2">Settings</h3>
          <p className="text-zinc-400">Configure your preferences here.</p>
        </div>
      ),
    },
    {
      id: 'advanced',
      label: 'Advanced',
      content: (
        <div className="p-4 bg-zinc-900 rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-2">Advanced</h3>
          <p className="text-zinc-400">Advanced settings and options.</p>
        </div>
      ),
    },
    {
      id: 'disabled',
      label: 'Disabled',
      disabled: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Default variant */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Tabs - Default</h2>
        <Tabs items={tabItems} defaultValue="overview" />
      </div>

      {/* Pills variant - Controlled */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Tabs - Pills (Controlled)</h2>
        <Tabs
          items={tabItems}
          value={activeTab}
          onValueChange={setActiveTab}
          variant="pills"
        />
        <p className="mt-4 text-zinc-400">Current tab: {activeTab}</p>
      </div>
    </div>
  );
}

// ========================================
// 2. Breadcrumb Example
// ========================================

export function BreadcrumbExample() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Breadcrumb</h2>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Projects', href: '/projects' },
            { label: 'Tallow', href: '/projects/tallow' },
            { label: 'Components', href: '/projects/tallow/components' },
            { label: 'Navigation' },
          ]}
          showHomeIcon
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Breadcrumb - Truncated</h2>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Level 1', href: '/level1' },
            { label: 'Level 2', href: '/level1/level2' },
            { label: 'Level 3', href: '/level1/level2/level3' },
            { label: 'Level 4', href: '/level1/level2/level3/level4' },
            { label: 'Current Page' },
          ]}
          showHomeIcon
          maxItems={4}
        />
      </div>
    </div>
  );
}

// ========================================
// 3. Pagination Example
// ========================================

export function PaginationExample() {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Pagination</h2>
        <Pagination
          currentPage={page}
          totalPages={20}
          onPageChange={setPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={200}
          showItemsPerPage
          showTotal
          siblingCount={1}
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Pagination - Simple</h2>
        <Pagination
          currentPage={page}
          totalPages={10}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

// ========================================
// 4. Sidebar Example
// ========================================

export function SidebarExample() {
  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: <HomeIcon />,
      badge: 3,
      children: [
        { id: 'overview', label: 'Overview', href: '/dashboard/overview' },
        { id: 'analytics', label: 'Analytics', href: '/dashboard/analytics', badge: 'New' },
        { id: 'reports', label: 'Reports', href: '/dashboard/reports' },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: <SettingsIcon />,
      children: [
        { id: 'general', label: 'General', href: '/settings/general' },
        { id: 'security', label: 'Security', href: '/settings/security' },
        { id: 'notifications', label: 'Notifications', href: '/settings/notifications' },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      onClick: () => alert('Help clicked'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Sidebar</h2>
      <div className="h-[600px] border border-zinc-800 rounded-xl overflow-hidden">
        <Sidebar items={sidebarItems} />
      </div>
    </div>
  );
}

// ========================================
// 5. Dropdown Example
// ========================================

export function DropdownExample() {
  const handleAction = (action: string) => {
    alert(`${action} clicked`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Dropdown</h2>
        <Dropdown
          trigger={
            <button className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors">
              Actions
            </button>
          }
          items={[
            {
              id: 'edit',
              label: 'Edit',
              icon: <EditIcon />,
              onClick: () => handleAction('Edit'),
            },
            {
              id: 'duplicate',
              label: 'Duplicate',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ),
              onClick: () => handleAction('Duplicate'),
            },
            { id: 'divider1', type: 'divider' },
            {
              id: 'delete',
              label: 'Delete',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              ),
              danger: true,
              onClick: () => handleAction('Delete'),
            },
          ]}
        />
      </div>
    </div>
  );
}

// ========================================
// 6. CommandPalette Example
// ========================================

export function CommandPaletteExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  // Listen for ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const commands = [
    {
      id: 'new-file',
      label: 'New File',
      description: 'Create a new file',
      icon: <EditIcon />,
      group: 'File',
      shortcut: ['⌘', 'N'],
      keywords: ['create', 'add'],
      onSelect: () => alert('New file'),
    },
    {
      id: 'open',
      label: 'Open',
      description: 'Open a file or folder',
      icon: <HomeIcon />,
      group: 'File',
      shortcut: ['⌘', 'O'],
      onSelect: () => alert('Open'),
    },
    {
      id: 'search',
      label: 'Search',
      description: 'Search for files',
      icon: <SearchIcon />,
      group: 'Navigation',
      shortcut: ['⌘', 'F'],
      onSelect: () => alert('Search'),
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Open settings',
      icon: <SettingsIcon />,
      group: 'Navigation',
      shortcut: ['⌘', ','],
      onSelect: () => alert('Settings'),
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Command Palette</h2>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
      >
        Press <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs mx-1">⌘K</kbd> to open
      </button>

      <CommandPalette
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={commands}
        recentCommands={recentCommands}
        onRecentUpdate={(id) => {
          setRecentCommands((prev) =>
            [id, ...prev.filter((x) => x !== id)].slice(0, 5)
          );
        }}
      />
    </div>
  );
}

// ========================================
// 7. Stepper Example
// ========================================

export function StepperExample() {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      id: '1',
      label: 'Account',
      description: 'Create your account',
    },
    {
      id: '2',
      label: 'Profile',
      description: 'Complete your profile',
    },
    {
      id: '3',
      label: 'Verification',
      description: 'Verify your email',
    },
    {
      id: '4',
      label: 'Done',
      description: 'Start using the app',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Horizontal */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Stepper - Horizontal</h2>
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          allowClickNavigation
          orientation="horizontal"
        />
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
            disabled={currentStep === steps.length - 1}
            className="px-4 py-2 bg-white text-black rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Vertical */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Stepper - Vertical</h2>
        <Stepper
          steps={steps}
          currentStep={currentStep}
          orientation="vertical"
        />
      </div>
    </div>
  );
}

// ========================================
// Complete Demo Page
// ========================================

export function NavigationComponentsDemo() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto space-y-16">
        <header>
          <h1 className="text-4xl font-bold text-white mb-2">Navigation Components</h1>
          <p className="text-zinc-400">
            Production-ready navigation components for Tallow
          </p>
        </header>

        <TabsExample />
        <BreadcrumbExample />
        <PaginationExample />
        <SidebarExample />
        <DropdownExample />
        <CommandPaletteExample />
        <StepperExample />
      </div>
    </div>
  );
}
