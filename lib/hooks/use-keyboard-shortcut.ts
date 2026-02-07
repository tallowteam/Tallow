/**
 * Hook for using keyboard shortcuts
 */

import { useEffect } from 'react';
import { keyboardShortcuts, type KeyboardShortcut } from '@/lib/accessibility/keyboard-shortcuts';

export function useKeyboardShortcut(
  shortcutId: string,
  shortcut: Omit<KeyboardShortcut, 'id'> | null
) {
  useEffect(() => {
    if (!shortcut) {return;}

    const fullShortcut: KeyboardShortcut = {
      id: shortcutId,
      ...shortcut,
    };

    keyboardShortcuts.register(fullShortcut);

    return () => {
      keyboardShortcuts.unregister(shortcutId);
    };
  }, [shortcutId, shortcut]);
}
