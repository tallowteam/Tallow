/**
 * Keyboard Shortcuts Registry and Management
 * WCAG 2.1 compliant keyboard shortcuts with conflict detection
 */

export type KeyboardModifier = 'ctrl' | 'cmd' | 'alt' | 'shift';
export type KeyboardKey = string;

export interface KeyboardShortcut {
  id: string;
  keys: KeyboardKey[];
  modifiers: KeyboardModifier[];
  description: string;
  handler: (event: KeyboardEvent) => void;
  enabled: boolean;
  preventDefault?: boolean;
}

class KeyboardShortcutsRegistry {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isEnabled = true;
  private listeners: Set<(event: KeyboardEvent) => void> = new Set();

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): void {
    if (this.shortcuts.has(shortcut.id)) {
      console.warn(`Keyboard shortcut '${shortcut.id}' already exists`);
      return;
    }
    this.shortcuts.set(shortcut.id, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(id: string): void {
    this.shortcuts.delete(id);
  }

  /**
   * Enable/disable all shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Enable/disable a specific shortcut
   */
  setShortcutEnabled(id: string, enabled: boolean): void {
    const shortcut = this.shortcuts.get(id);
    if (shortcut) {
      shortcut.enabled = enabled;
    }
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.isEnabled) {return;}

    const pressedModifiers: KeyboardModifier[] = [];
    if (event.ctrlKey || event.metaKey) {pressedModifiers.push(event.metaKey ? 'cmd' : 'ctrl');}
    if (event.altKey) {pressedModifiers.push('alt');}
    if (event.shiftKey) {pressedModifiers.push('shift');}

    for (const shortcut of this.shortcuts.values()) {
      if (!shortcut.enabled) {continue;}

      const keyMatches = shortcut.keys.some(key => 
        event.key.toLowerCase() === key.toLowerCase() ||
        event.code.toLowerCase() === key.toLowerCase()
      );

      const modifiersMatch = shortcut.modifiers.every(modifier => 
        pressedModifiers.includes(modifier)
      ) && pressedModifiers.length === shortcut.modifiers.length;

      if (keyMatches && modifiersMatch) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler(event);
        break;
      }
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(event));
  };

  /**
   * Add a listener to all keyboard events
   */
  addListener(listener: (event: KeyboardEvent) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listener: (event: KeyboardEvent) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Get all shortcuts
   */
  getAll(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcut by ID
   */
  get(id: string): KeyboardShortcut | undefined {
    return this.shortcuts.get(id);
  }

  /**
   * Initialize keyboard shortcut listener
   */
  init(): void {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Cleanup keyboard shortcut listener
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.shortcuts.clear();
    this.listeners.clear();
  }
}

// Export singleton instance
export const keyboardShortcuts = new KeyboardShortcutsRegistry();

/**
 * Common keyboard shortcuts
 */
export const COMMON_SHORTCUTS = {
  COMMAND_PALETTE: {
    keys: ['k'],
    modifiers: ['ctrl'] as const,
    description: 'Open command palette or search',
  },
  ESCAPE: {
    keys: ['Escape'],
    modifiers: [] as const,
    description: 'Close modals and sidebars',
  },
  ARROW_UP: {
    keys: ['ArrowUp'],
    modifiers: [] as const,
    description: 'Navigate up in lists',
  },
  ARROW_DOWN: {
    keys: ['ArrowDown'],
    modifiers: [] as const,
    description: 'Navigate down in lists',
  },
  ARROW_LEFT: {
    keys: ['ArrowLeft'],
    modifiers: [] as const,
    description: 'Navigate left',
  },
  ARROW_RIGHT: {
    keys: ['ArrowRight'],
    modifiers: [] as const,
    description: 'Navigate right',
  },
  ENTER: {
    keys: ['Enter'],
    modifiers: [] as const,
    description: 'Activate selected item',
  },
  SPACE: {
    keys: [' '],
    modifiers: [] as const,
    description: 'Toggle selected item',
  },
  TAB: {
    keys: ['Tab'],
    modifiers: [] as const,
    description: 'Navigate forward through focusable elements',
  },
  SHIFT_TAB: {
    keys: ['Tab'],
    modifiers: ['shift'] as const,
    description: 'Navigate backward through focusable elements',
  },
};
