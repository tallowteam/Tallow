'use client';

import {
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { FocusTrap, KeyboardKeys } from '@/lib/utils/accessibility';
import styles from './Modal.module.css';

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;
  /** Modal title (for accessibility) */
  title?: string;
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
  /** Z-index for modal */
  zIndex?: number;
  /** Prevent body scroll when modal is open */
  preventScroll?: boolean;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Custom portal container */
  container?: HTMLElement;
}

export function Modal({
  open,
  onClose,
  children,
  title,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  size = 'md',
  className = '',
  backdropClassName = '',
  zIndex = 500,
  preventScroll = true,
  animationDuration = 200,
  container,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<FocusTrap | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const isClosingRef = useRef(false);

  // Handle body scroll lock
  useEffect(() => {
    if (!preventScroll) {return;}

    if (open) {
      // Store current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [open, preventScroll]);

  // Setup focus trap
  useEffect(() => {
    if (!open || !modalRef.current) {return;}

    // Store previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Create focus trap
    focusTrapRef.current = new FocusTrap(modalRef.current);
    focusTrapRef.current.activate();

    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate();
        focusTrapRef.current = null;
      }
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    if (!open || !closeOnEscape) {return;}

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === KeyboardKeys.ESCAPE && !isClosingRef.current) {
        isClosingRef.current = true;
        onClose();
        // Reset after animation
        setTimeout(() => {
          isClosingRef.current = false;
        }, animationDuration);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closeOnEscape, onClose, animationDuration]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (
        closeOnBackdropClick &&
        event.target === event.currentTarget &&
        !isClosingRef.current
      ) {
        isClosingRef.current = true;
        onClose();
        // Reset after animation
        setTimeout(() => {
          isClosingRef.current = false;
        }, animationDuration);
      }
    },
    [closeOnBackdropClick, onClose, animationDuration]
  );

  // Handle close button click
  const handleCloseClick = useCallback(() => {
    if (!isClosingRef.current) {
      isClosingRef.current = true;
      onClose();
      // Reset after animation
      setTimeout(() => {
        isClosingRef.current = false;
      }, animationDuration);
    }
  }, [onClose, animationDuration]);

  // Don't render if not open
  if (!open) {return null;}

  const modalContent = (
    <div
      className={`${styles.backdrop} ${backdropClassName}`}
      onClick={handleBackdropClick}
      style={{ zIndex }}
      data-modal-backdrop
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        ref={modalRef}
        className={`${styles.modal} ${styles[size]} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
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
          <h2 id="modal-title" className={styles.title}>
            {title}
          </h2>
        )}

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );

  // Use portal to render at document root
  if (typeof document === 'undefined') {return null;}

  const portalContainer = container || document.body;
  return createPortal(modalContent, portalContainer);
}

// Subcomponents for better composition
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
