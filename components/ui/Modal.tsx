'use client';

import {
  useEffect,
  useRef,
  useCallback,
  useId,
  type ReactNode,
  type MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { FocusTrap, KeyboardKeys, announce } from '@/lib/utils/accessibility';
import styles from './Modal.module.css';

// ---------------------------------------------------------------------------
// Modal Stack Registry
// Tracks all open modals in a LIFO stack so that:
//  - Escape key closes only the topmost modal
//  - Backdrop click only affects the topmost modal
//  - Focus trap activates only on the topmost modal
//  - Body scroll lock persists until ALL modals are closed
// ---------------------------------------------------------------------------

interface StackEntry {
  /** Unique identifier for this modal instance */
  id: string;
  /** Close handler for this modal */
  onClose: () => void;
  /** Whether this modal responds to Escape */
  closeOnEscape: boolean;
  /** Whether this modal responds to backdrop click */
  closeOnBackdropClick: boolean;
  /** FocusTrap instance for this modal */
  focusTrap: FocusTrap | null;
}

const modalStack: StackEntry[] = [];
let scrollLockCount = 0;
let savedScrollY = 0;

function lockBodyScroll(): void {
  scrollLockCount++;
  if (scrollLockCount === 1) {
    savedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = '100%';
  }
}

function unlockBodyScroll(): void {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, savedScrollY);
  }
}

function pushModal(entry: StackEntry): void {
  // Deactivate focus trap on the previously topmost modal
  const previous = modalStack[modalStack.length - 1];
  if (previous?.focusTrap) {
    previous.focusTrap.deactivate();
  }
  modalStack.push(entry);
}

function popModal(id: string): StackEntry | undefined {
  const index = modalStack.findIndex((e) => e.id === id);
  if (index === -1) return undefined;

  const [removed] = modalStack.splice(index, 1);

  // Re-activate focus trap on the new topmost modal
  const newTop = modalStack[modalStack.length - 1];
  if (newTop?.focusTrap) {
    newTop.focusTrap.activate();
  }

  return removed;
}

function isTopModal(id: string): boolean {
  return modalStack.length > 0 && modalStack[modalStack.length - 1]?.id === id;
}

/**
 * Returns the current depth of the modal stack.
 * Useful for testing and debugging.
 */
export function getModalStackDepth(): number {
  return modalStack.length;
}

/**
 * Resets the modal stack. ONLY for use in tests.
 */
export function __resetModalStack(): void {
  modalStack.length = 0;
  scrollLockCount = 0;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
}

// ---------------------------------------------------------------------------
// Global Escape key handler (installed once, delegates to topmost modal)
// ---------------------------------------------------------------------------

let globalEscapeInstalled = false;

function installGlobalEscapeHandler(): void {
  if (globalEscapeInstalled) return;
  globalEscapeInstalled = true;

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key !== KeyboardKeys.ESCAPE) return;
    const top = modalStack[modalStack.length - 1];
    if (top && top.closeOnEscape) {
      event.stopPropagation();
      top.onClose();
    }
  });
}

// ---------------------------------------------------------------------------
// ModalProps
// ---------------------------------------------------------------------------

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;
  /** Modal title (for accessibility) */
  title?: string;
  /** Modal description (for accessibility) */
  description?: string;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether clicking backdrop closes modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes modal */
  closeOnEscape?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Custom className for modal content */
  className?: string;
  /** Custom className for backdrop */
  backdropClassName?: string;
  /** Z-index for modal (auto-incremented per stack level when not set) */
  zIndex?: number;
  /** Prevent body scroll when modal is open */
  preventScroll?: boolean;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Custom portal container */
  container?: HTMLElement;
}

// ---------------------------------------------------------------------------
// Modal Component
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  size = 'md',
  className = '',
  backdropClassName = '',
  zIndex,
  preventScroll = true,
  animationDuration = 200,
  container,
}: ModalProps) {
  // React useId() guarantees unique IDs across concurrent renders and SSR
  const reactId = useId();
  const instanceId = `modal${reactId.replace(/:/g, '')}`;
  const titleId = `${instanceId}-title`;
  const descriptionId = `${instanceId}-desc`;

  const modalRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<FocusTrap | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const isClosingRef = useRef(false);
  const stackEntryIdRef = useRef(instanceId);

  // Keep stable reference to latest onClose for the stack entry
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Install the global escape handler once
  useEffect(() => {
    installGlobalEscapeHandler();
  }, []);

  // ---------------------------------------------------------------------------
  // Stack registration + focus trap + scroll lock
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!open) return;

    // Store previously focused element for restoration on close
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Create focus trap
    let trap: FocusTrap | null = null;
    if (modalRef.current) {
      trap = new FocusTrap(modalRef.current);
      focusTrapRef.current = trap;
    }

    // Push onto stack
    const entryId = stackEntryIdRef.current;
    const entry: StackEntry = {
      id: entryId,
      onClose: () => onCloseRef.current(),
      closeOnEscape,
      closeOnBackdropClick,
      focusTrap: trap,
    };
    pushModal(entry);

    // Activate focus trap (pushModal deactivated the previous top)
    if (trap) {
      trap.activate();
    }

    // Lock scroll
    if (preventScroll) {
      lockBodyScroll();
    }

    // Announce modal title to screen readers
    if (title) {
      announce(`Dialog opened: ${title}`, 'assertive');
    }

    return () => {
      // Pop from stack
      popModal(entryId);

      // Deactivate focus trap
      if (trap) {
        trap.deactivate();
        focusTrapRef.current = null;
      }

      // Unlock scroll
      if (preventScroll) {
        unlockBodyScroll();
      }

      // Restore focus to previously focused element
      if (previousActiveElement.current?.focus) {
        previousActiveElement.current.focus();
      }
    };
    // We intentionally exclude onClose and functions that use refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, closeOnEscape, closeOnBackdropClick, preventScroll, title]);

  // ---------------------------------------------------------------------------
  // Update the stack entry when escape/backdrop props change while open
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const entryId = stackEntryIdRef.current;
    const entry = modalStack.find((e) => e.id === entryId);
    if (entry) {
      entry.closeOnEscape = closeOnEscape;
      entry.closeOnBackdropClick = closeOnBackdropClick;
      entry.onClose = () => onCloseRef.current();
    }
  }, [closeOnEscape, closeOnBackdropClick]);

  // ---------------------------------------------------------------------------
  // Backdrop click handler
  // ---------------------------------------------------------------------------
  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      // Only the topmost modal responds to backdrop clicks
      if (!isTopModal(stackEntryIdRef.current)) return;
      if (
        closeOnBackdropClick &&
        event.target === event.currentTarget &&
        !isClosingRef.current
      ) {
        isClosingRef.current = true;
        onClose();
        setTimeout(() => {
          isClosingRef.current = false;
        }, animationDuration);
      }
    },
    [closeOnBackdropClick, onClose, animationDuration]
  );

  // ---------------------------------------------------------------------------
  // Close button handler
  // ---------------------------------------------------------------------------
  const handleCloseClick = useCallback(() => {
    if (!isClosingRef.current) {
      isClosingRef.current = true;
      onClose();
      setTimeout(() => {
        isClosingRef.current = false;
      }, animationDuration);
    }
  }, [onClose, animationDuration]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (!open) return null;

  // Compute z-index: explicit prop wins, otherwise base + stack position
  const computedZIndex =
    zIndex ?? 500 + (modalStack.findIndex((e) => e.id === stackEntryIdRef.current)) * 10;

  const modalContent = (
    <div
      className={`${styles.backdrop} ${backdropClassName}`}
      onClick={handleBackdropClick}
      style={{ zIndex: computedZIndex }}
      data-modal-backdrop
      data-modal-id={instanceId}
    >
      <div
        ref={modalRef}
        className={`${styles.modal} ${styles[size]} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleCloseClick}
            aria-label="Close modal"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {title && (
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
        )}

        {description && (
          <p id={descriptionId} className="sr-only">
            {description}
          </p>
        )}

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );

  // Use portal to render at document root
  if (typeof document === 'undefined') return null;

  const portalContainer = container || document.body;
  return createPortal(modalContent, portalContainer);
}

// ---------------------------------------------------------------------------
// Subcomponents for better composition
// ---------------------------------------------------------------------------

export function ModalHeader({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${styles.header} ${className}`}>{children}</div>;
}

export function ModalBody({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${styles.body} ${className}`}>{children}</div>;
}

export function ModalFooter({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${styles.footer} ${className}`}>{children}</div>;
}
