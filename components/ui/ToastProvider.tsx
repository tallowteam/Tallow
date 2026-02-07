'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { Toast, type ToastProps } from './Toast';
import styles from './ToastProvider.module.css';

type ToastOptions = Omit<ToastProps, 'id' | 'onClose'>;

interface ToastContextValue {
  toasts: ToastProps[];
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  success: (message: string, options?: Partial<ToastOptions>) => string;
  error: (message: string, options?: Partial<ToastOptions>) => string;
  warning: (message: string, options?: Partial<ToastOptions>) => string;
  info: (message: string, options?: Partial<ToastOptions>) => string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export interface ToastProviderProps {
  children: ReactNode;
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

    setToasts((prev) => {
      const newToasts = [
        ...prev,
        {
          ...options,
          id,
          onClose: (toastId: string) => removeToast(toastId),
        },
      ];

      // Limit the number of toasts
      if (newToasts.length > maxToasts) {
        // Remove the oldest toast(s)
        return newToasts.slice(newToasts.length - maxToasts);
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
        duration: 7000, // Errors stay longer by default
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
