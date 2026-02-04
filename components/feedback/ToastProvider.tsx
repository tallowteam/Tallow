'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Toast, ToastProps } from './Toast';
import styles from './ToastProvider.module.css';

type ToastConfig = Omit<ToastProps, 'id' | 'onDismiss'>;

interface ToastContextValue {
  addToast: (config: ToastConfig) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastProvider({
  children,
  maxToasts = 5,
  position = 'top-right',
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);
  const [mounted, setMounted] = useState(false);

  // Track mounted state
  useState(() => {
    setMounted(true);
  });

  const addToast = useCallback(
    (config: ToastConfig): string => {
      const id = Math.random().toString(36).substring(2, 11);

      setToasts((currentToasts) => {
        const newToasts = [
          ...currentToasts,
          {
            ...config,
            id,
            onDismiss: (toastId: string) => removeToast(toastId),
          },
        ];

        // Limit the number of toasts
        if (newToasts.length > maxToasts) {
          return newToasts.slice(-maxToasts);
        }

        return newToasts;
      });

      return id;
    },
    [maxToasts]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextValue = {
    addToast,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            className={`${styles.toastContainer} ${styles[position]}`}
            aria-live="polite"
            aria-atomic="false"
            role="region"
            aria-label="Notifications"
          >
            {toasts.map((toast) => (
              <Toast key={toast.id} {...toast} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

// Convenience hooks for specific toast types
export function useToastHelpers() {
  const { addToast, removeToast, clearAllToasts } = useToast();

  const success = useCallback(
    (message: string, config?: Partial<ToastConfig>) => {
      return addToast({ ...config, message, variant: 'success' });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, config?: Partial<ToastConfig>) => {
      return addToast({ ...config, message, variant: 'error' });
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string, config?: Partial<ToastConfig>) => {
      return addToast({ ...config, message, variant: 'warning' });
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, config?: Partial<ToastConfig>) => {
      return addToast({ ...config, message, variant: 'info' });
    },
    [addToast]
  );

  return {
    success,
    error,
    warning,
    info,
    remove: removeToast,
    clearAll: clearAllToasts,
  };
}
