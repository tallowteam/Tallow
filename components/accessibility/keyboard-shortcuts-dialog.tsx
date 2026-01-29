'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Keyboard className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle>Keyboard Shortcuts</DialogTitle>
                <DialogDescription>
                  Use these keyboard shortcuts to navigate and interact with Tallow
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close keyboard shortcuts"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut, index) => (
                      <Card
                        key={index}
                        className="p-3 flex items-center justify-between gap-4"
                      >
                        <p className="text-sm flex-1">{shortcut.description}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          {shortcut.keys.map((key, keyIndex) => (
                            <span key={keyIndex} className="flex items-center">
                              {keyIndex > 0 && (
                                <span className="text-xs text-muted-foreground mx-1">
                                  +
                                </span>
                              )}
                              <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded">
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

        <div className="pt-4 border-t text-center">
          <p className="text-sm text-muted-foreground">
            Press <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded">?</kbd> anytime to show this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export a trigger button component
export function KeyboardShortcutsTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            aria-label="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-5 h-5" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Keyboard Shortcuts (?)</TooltipContent>
      </Tooltip>
      <KeyboardShortcutsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export default KeyboardShortcutsDialog;
