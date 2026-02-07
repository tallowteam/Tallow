/**
 * Keyboard Shortcuts Help Dialog
 * WCAG 2.1 compliant keyboard shortcuts documentation
 */

'use client';

import { useState, useEffect } from 'react';
import { useFocusTrap } from '@/lib/accessibility/use-focus-trap';
import { keyboardShortcuts, type KeyboardShortcut } from '@/lib/accessibility/keyboard-shortcuts';
import styles from './KeyboardShortcutsHelp.module.css';

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const focusTrapRef = useFocusTrap({ enabled: isOpen });

  useEffect(() => {
    setShortcuts(keyboardShortcuts.getAll());
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && !isOpen) {
        event.preventDefault();
        setIsOpen(true);
      } else if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {return null;}

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = getShortcutCategory(shortcut.id);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <>
      {/* Overlay */}
      <div
        className={styles.overlay}
        onClick={() => setIsOpen(false)}
        role="presentation"
      />

      {/* Dialog */}
      <div
        ref={focusTrapRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className={styles.header}>
          <h2 id="shortcuts-title" className={styles.title}>
            Keyboard Shortcuts
          </h2>
          <button
            className={styles.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Close keyboard shortcuts dialog"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className={styles.group}>
              <h3 className={styles.groupTitle}>{category}</h3>
              <dl className={styles.shortcutsList}>
                {categoryShortcuts.map((shortcut) => (
                  <div key={shortcut.id} className={styles.shortcutItem}>
                    <dt className={styles.keys}>
                      <kbd>{formatShortcut(shortcut)}</kbd>
                    </dt>
                    <dd className={styles.description}>{shortcut.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <p className={styles.hint}>
            Press <kbd>?</kbd> to toggle this help dialog
          </p>
        </div>
      </div>
    </>
  );
}

function getShortcutCategory(id: string): string {
  if (id.includes('command') || id.includes('search')) {return 'Search & Navigation';}
  if (id.includes('modal') || id.includes('dialog') || id.includes('close')) {return 'Dialogs & Panels';}
  if (id.includes('arrow') || id.includes('navigate')) {return 'Navigation';}
  return 'Other';
}

function formatShortcut(shortcut: KeyboardShortcut): string {
  const modifiers = shortcut.modifiers
    .map(m => m === 'cmd' ? 'Cmd' : m === 'ctrl' ? 'Ctrl' : m.charAt(0).toUpperCase() + m.slice(1))
    .join(' + ');

  const key = shortcut.keys
    .map(k => {
      if (k === ' ') {return 'Space';}
      if (k.length === 1) {return k.toUpperCase();}
      return k;
    })
    .join(' / ');

  return modifiers ? `${modifiers} + ${key}` : key;
}
