'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { Toast, TOAST_DURATIONS, type ToastProps, type ToastVariant } from './Toast';
import styles from './ToastProvider.module.css';

type ToastOptions = Omit<ToastProps, 'id' | 'onClose'>;

/**
 * Priority weight per variant. Higher = more important.
 * Used to decide which toasts to keep when at capacity.
 * error > warning > info > success
 */
const VARIANT_PRIORITY: Record<ToastVariant, number> = {
  error: 4,
  warning: 3,
  info: 2,
  success: 1,
};

/** Maximum number of toasts allowed in the queue (visible + queued). */
const MAX_QUEUE_SIZE = 50;

/** Window (ms) within which identical message+variant is considered a duplicate. */
const DEDUP_WINDOW_MS = 5000;

interface ToastContextValue {
  toasts: ToastProps[];
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  success: (message: string, options?: Partial<ToastOptions>) => string;
  error: (message: string, options?: Partial<ToastOptions>) => string;
  warning: (message: string, options?: Partial<ToastOptions>) => string;
  info: (message: string, options?: Partial<ToastOptions>) => string;
  /** Count of unread/active notifications. */
  unreadCount: number;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export interface ToastProviderProps {
  children: ReactNode;
  /** Maximum visible toasts at once. Oldest auto-dismissed when exceeded. Default 5. */
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

let toastCounter = 0;

export const ToastProvider = ({
  children,
  maxToasts = 5,
  position = 'bottom-right'
}: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((options: ToastOptions): string => {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    const variant = options.variant || 'info';
    const now = Date.now();

    setToasts((prev) => {
      // -- De-duplication: skip if same message+variant was added within DEDUP_WINDOW_MS --
      const isDuplicate = prev.some(
        (t) =>
          t.message === options.message &&
          (t.variant || 'info') === variant &&
          t.createdAt &&
          now - t.createdAt < DEDUP_WINDOW_MS
      );
      if (isDuplicate) {
        return prev;
      }

      const newToast: ToastProps = {
        ...options,
        id,
        variant,
        createdAt: now,
        onClose: (toastId: string) => removeToast(toastId),
      };

      let newToasts = [...prev, newToast];

      // -- Enforce visible limit: auto-dismiss oldest non-error toasts first --
      if (newToasts.length > maxToasts) {
        // Sort by priority (keep higher-priority toasts) then by time (keep newer)
        // We remove the oldest, lowest-priority toast(s) to get back to maxToasts
        const excess = newToasts.length - maxToasts;
        // Find candidates to remove: prefer lower priority and older
        const candidates = [...newToasts].sort((a, b) => {
          const aPri = VARIANT_PRIORITY[a.variant || 'info'];
          const bPri = VARIANT_PRIORITY[b.variant || 'info'];
          if (aPri !== bPri) return aPri - bPri; // lower priority first
          return (a.createdAt || 0) - (b.createdAt || 0); // older first
        });

        const idsToRemove = new Set(
          candidates.slice(0, excess).map((t) => t.id)
        );
        newToasts = newToasts.filter((t) => !idsToRemove.has(t.id));
      }

      // -- Hard cap on total queue to prevent memory leaks --
      if (newToasts.length > MAX_QUEUE_SIZE) {
        newToasts = newToasts.slice(newToasts.length - MAX_QUEUE_SIZE);
      }

      return newToasts;
    });

    return id;
  }, [maxToasts, removeToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback(
    (message: string, options?: Partial<ToastOptions>): string => {
      return addToast({
        message,
        variant: 'success',
        duration: TOAST_DURATIONS.success,
        ...options,
      });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: Partial<ToastOptions>): string => {
      return addToast({
        message,
        variant: 'error',
        duration: TOAST_DURATIONS.error, // Infinity -- errors persist until manually closed
        ...options,
      });
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string, options?: Partial<ToastOptions>): string => {
      return addToast({
        message,
        variant: 'warning',
        duration: TOAST_DURATIONS.warning,
        ...options,
      });
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: Partial<ToastOptions>): string => {
      return addToast({
        message,
        variant: 'info',
        duration: TOAST_DURATIONS.info,
        ...options,
      });
    },
    [addToast]
  );

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
    unreadCount: toasts.length,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={`${styles.toastContainer} ${styles[position]}`}
        aria-live="polite"
        aria-label="Notifications"
        role="region"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
