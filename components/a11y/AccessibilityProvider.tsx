/**
 * Accessibility Provider
 * Sets up global accessibility features and keyboard shortcuts
 */

'use client';

import { useEffect } from 'react';
import { keyboardShortcuts } from '@/lib/accessibility/keyboard-shortcuts';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize keyboard shortcuts registry
    keyboardShortcuts.init();

    // Register help shortcut
    keyboardShortcuts.register({
      id: 'help-shortcuts',
      keys: ['?'],
      modifiers: [],
      description: 'Show keyboard shortcuts',
      handler: () => {
        // This is handled by KeyboardShortcutsHelp component
      },
      enabled: true,
      preventDefault: true,
    });

    return () => {
      keyboardShortcuts.destroy();
    };
  }, []);

  return (
    <>
      <KeyboardShortcutsHelp />
      {children}
    </>
  );
}
