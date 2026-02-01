'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  // Navigation
  { keys: ['Tab'], description: 'Navigate forward through interactive elements', category: 'Navigation' },
  { keys: ['Shift', 'Tab'], description: 'Navigate backward through interactive elements', category: 'Navigation' },
  { keys: ['Enter'], description: 'Activate buttons and links', category: 'Navigation' },
  { keys: ['Space'], description: 'Activate buttons, toggle checkboxes', category: 'Navigation' },
  { keys: ['Escape'], description: 'Close dialogs and menus', category: 'Navigation' },
  { keys: ['?'], description: 'Show this keyboard shortcuts dialog', category: 'Navigation' },

  // Transfer Mode
  { keys: ['1'], description: 'Switch to Send mode', category: 'Transfer' },
  { keys: ['2'], description: 'Switch to Receive mode', category: 'Transfer' },

  // Connection Type
  { keys: ['Arrow Keys'], description: 'Navigate between connection types', category: 'Selection' },
  { keys: ['Enter'], description: 'Select highlighted option', category: 'Selection' },

  // File Selection
  { keys: ['Ctrl/Cmd', 'Click'], description: 'Select multiple files', category: 'Files' },
  { keys: ['Shift', 'Click'], description: 'Select range of files', category: 'Files' },

  // General
  { keys: ['Ctrl/Cmd', 'C'], description: 'Copy connection code', category: 'General' },
  { keys: ['Ctrl/Cmd', 'V'], description: 'Paste connection code', category: 'General' },
];

interface KeyboardShortcutsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open: controlledOpen,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen;

  // Listen for '?' key to open shortcuts dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not in an input field
      if (
        e.key === '?' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col" showCloseButton={false}>
        <DialogHeader className="pr-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#b2987d]/10 dark:bg-[#b2987d]/20 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-[#b2987d]" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
              <DialogDescription>
                Use these keyboard shortcuts to navigate and interact with Tallow
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* EUVEKA close button */}
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Close keyboard shortcuts"
          className="absolute top-6 right-6 flex items-center justify-center w-10 h-10 rounded-full
            text-[#b2987d] hover:text-[#191610] dark:hover:text-[#fefefc]
            hover:bg-[#e5dac7]/50 dark:hover:bg-[#544a36]/50
            transition-all duration-300
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b2987d]/50"
        >
          <X className="w-[18px] h-[18px] stroke-[1.5]" aria-hidden="true" />
        </button>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-[#b2987d] uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut, index) => (
                      <Card
                        key={index}
                        className="p-3 flex items-center justify-between gap-4
                          bg-[#fefefc] dark:bg-[#191610]
                          border-[#e5dac7] dark:border-[#544a36]"
                      >
                        <p className="text-sm flex-1 text-[#191610] dark:text-[#fefefc]">{shortcut.description}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          {shortcut.keys.map((key, keyIndex) => (
                            <span key={keyIndex} className="flex items-center">
                              {keyIndex > 0 && (
                                <span className="text-xs text-[#b2987d] mx-1">
                                  +
                                </span>
                              )}
                              <kbd className="px-2 py-1 text-xs font-semibold
                                bg-[#e5dac7]/50 dark:bg-[#544a36]/50
                                border border-[#e5dac7] dark:border-[#544a36]
                                rounded text-[#191610] dark:text-[#fefefc]">
                                {key}
                              </kbd>
                            </span>
                          ))}
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-[#e5dac7] dark:border-[#544a36] text-center">
          <p className="text-sm text-[#b2987d]">
            Press <kbd className="px-2 py-1 text-xs font-semibold
              bg-[#e5dac7]/50 dark:bg-[#544a36]/50
              border border-[#e5dac7] dark:border-[#544a36]
              rounded text-[#191610] dark:text-[#fefefc]">?</kbd> anytime to show this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export a trigger button component - icon only for header
export function KeyboardShortcutsTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen(true)}
            aria-label="Keyboard shortcuts (press ? key)"
            className="hidden lg:flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
          >
            <Keyboard className="w-5 h-5" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Keyboard Shortcuts (?)</TooltipContent>
      </Tooltip>
      <KeyboardShortcutsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export default KeyboardShortcutsDialog;
