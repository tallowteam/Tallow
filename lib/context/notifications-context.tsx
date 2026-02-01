'use client';

/**
 * Notifications Context
 * Centralized state management for notifications and toasts
 */

import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { toast as sonnerToast } from 'sonner';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  description?: string;
  priority: NotificationPriority;
  timestamp: Date;
  duration?: number;
  persistent?: boolean;
  action?: NotificationAction;
  onUndo?: () => void;
  groupId?: string;
  dismissed: boolean;
}

export interface NotificationGroup {
  id: string;
  type: NotificationType;
  baseMessage: string;
  count: number;
  notifications: Notification[];
  latestTimestamp: Date;
  collapsed: boolean;
}

export interface ToastOptions {
  type?: NotificationType;
  priority?: NotificationPriority;
  duration?: number;
  persistent?: boolean;
  action?: NotificationAction;
  onUndo?: () => void;
  groupId?: string;
  description?: string;
}

export interface NotificationState {
  // Notifications
  notifications: Notification[];
  groups: NotificationGroup[];

  // Alert banners
  banners: Notification[];

  // Queue
  queue: Notification[];

  // Settings
  maxNotifications: number;
  maxConcurrentToasts: number;
  enableGrouping: boolean;
  maxGroupSize: number;
}

interface NotificationsContextValue extends NotificationState {
  // Add notifications
  notify: (message: string, options?: ToastOptions) => string;
  success: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
  error: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
  warning: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
  info: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
  loading: (message: string, options?: Omit<ToastOptions, 'type'>) => string;

  // Notification with undo
  notifyWithUndo: (message: string, onUndo: () => void, options?: Omit<ToastOptions, 'onUndo'>) => string;

  // Banner notifications
  showBanner: (message: string, options?: ToastOptions) => string;
  dismissBanner: (id: string) => void;
  dismissAllBanners: () => void;

  // Dismiss
  dismiss: (id: string) => void;
  dismissAll: () => void;
  dismissGroup: (groupId: string) => void;

  // History
  getNotificationHistory: () => Notification[];
  clearHistory: () => void;

  // Groups
  toggleGroup: (groupId: string) => void;
  collapseAllGroups: () => void;
  expandAllGroups: () => void;

  // Settings
  setMaxNotifications: (max: number) => void;
  setMaxConcurrentToasts: (max: number) => void;
  setEnableGrouping: (enabled: boolean) => void;
  setMaxGroupSize: (max: number) => void;

  // Promise handling
  promise: typeof sonnerToast.promise;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

// Generate unique ID
let notificationIdCounter = 0;
function generateNotificationId(): string {
  return `notification-${Date.now()}-${++notificationIdCounter}`;
}

/**
 * Notifications Provider
 */
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [banners, setBanners] = useState<Notification[]>([]);
  const [queue, setQueue] = useState<Notification[]>([]);

  const [maxNotifications, setMaxNotifications] = useState(50);
  const [maxConcurrentToasts, setMaxConcurrentToasts] = useState(3);
  const [enableGrouping, setEnableGrouping] = useState(true);
  const [maxGroupSize, setMaxGroupSize] = useState(5);

  const activeToastCount = useRef(0);

  // Check if we should group a notification
  const shouldGroup = useCallback((notification: Notification): NotificationGroup | null => {
    if (!enableGrouping || !notification.groupId) {
      return null;
    }

    const existingGroup = groups.find(g => g.id === notification.groupId);
    if (existingGroup && existingGroup.notifications.length < maxGroupSize) {
      return existingGroup;
    }

    return null;
  }, [enableGrouping, groups, maxGroupSize]);

  // Add to group or create new group
  const addToGroup = useCallback((notification: Notification) => {
    const group = shouldGroup(notification);

    if (group) {
      // Add to existing group
      setGroups(prev => prev.map(g => {
        if (g.id === group.id) {
          return {
            ...g,
            count: g.count + 1,
            notifications: [...g.notifications, notification],
            latestTimestamp: notification.timestamp,
          };
        }
        return g;
      }));
    } else if (notification.groupId) {
      // Create new group
      const newGroup: NotificationGroup = {
        id: notification.groupId,
        type: notification.type,
        baseMessage: notification.message,
        count: 1,
        notifications: [notification],
        latestTimestamp: notification.timestamp,
        collapsed: false,
      };
      setGroups(prev => [...prev, newGroup]);
    }
  }, [shouldGroup]);

  // Core notification function
  const notify = useCallback((message: string, options: ToastOptions = {}): string => {
    const id = generateNotificationId();
    const type = options.type || 'info';
    const priority = options.priority || 'medium';

    const notification: Notification = {
      id,
      type,
      message,
      ...(options.description ? { description: options.description } : {}),
      priority,
      timestamp: new Date(),
      ...(options.duration !== undefined ? { duration: options.duration } : {}),
      ...(options.persistent !== undefined ? { persistent: options.persistent } : {}),
      ...(options.action ? { action: options.action } : {}),
      ...(options.onUndo ? { onUndo: options.onUndo } : {}),
      ...(options.groupId ? { groupId: options.groupId } : {}),
      dismissed: false,
    };

    // Add to history
    setNotifications(prev => {
      const updated = [notification, ...prev];
      // Keep only the most recent notifications
      return updated.slice(0, maxNotifications);
    });

    // Handle grouping
    if (enableGrouping && options.groupId) {
      addToGroup(notification);
    }

    // Show toast if under concurrent limit
    if (activeToastCount.current < maxConcurrentToasts || priority === 'critical') {
      activeToastCount.current++;

      const toastOptions: any = {
        id,
        duration: options.duration,
        description: options.description,
      };

      if (options.action) {
        toastOptions.action = {
          label: options.action.label,
          onClick: options.action.onClick,
        };
      }

      if (options.onUndo) {
        toastOptions.action = {
          label: 'Undo',
          onClick: () => {
            options.onUndo!();
            sonnerToast.dismiss(id);
          },
        };
      }

      if (options.persistent) {
        toastOptions.duration = Infinity;
      }

      // Show the toast
      switch (type) {
        case 'success':
          sonnerToast.success(message, toastOptions);
          break;
        case 'error':
          sonnerToast.error(message, toastOptions);
          break;
        case 'warning':
          sonnerToast.warning(message, toastOptions);
          break;
        case 'loading':
          sonnerToast.loading(message, toastOptions);
          break;
        default:
          sonnerToast.info(message, toastOptions);
      }

      // Decrement active count when toast is dismissed
      setTimeout(() => {
        activeToastCount.current = Math.max(0, activeToastCount.current - 1);
      }, options.duration || 4000);
    } else {
      // Add to queue
      setQueue(prev => [...prev, notification]);
    }

    return id;
  }, [maxNotifications, maxConcurrentToasts, enableGrouping, addToGroup]);

  // Typed notification methods
  const success = useCallback((message: string, options?: Omit<ToastOptions, 'type'>) => {
    return notify(message, { ...options, type: 'success' });
  }, [notify]);

  const error = useCallback((message: string, options?: Omit<ToastOptions, 'type'>) => {
    return notify(message, { ...options, type: 'error', persistent: options?.persistent ?? true });
  }, [notify]);

  const warning = useCallback((message: string, options?: Omit<ToastOptions, 'type'>) => {
    return notify(message, { ...options, type: 'warning' });
  }, [notify]);

  const info = useCallback((message: string, options?: Omit<ToastOptions, 'type'>) => {
    return notify(message, { ...options, type: 'info' });
  }, [notify]);

  const loading = useCallback((message: string, options?: Omit<ToastOptions, 'type'>) => {
    return notify(message, { ...options, type: 'loading' });
  }, [notify]);

  // Notification with undo
  const notifyWithUndo = useCallback((
    message: string,
    onUndo: () => void,
    options?: Omit<ToastOptions, 'onUndo'>
  ) => {
    return notify(message, {
      ...options,
      type: options?.type || 'success',
      onUndo,
      duration: 5000,
    });
  }, [notify]);

  // Banner notifications
  const showBanner = useCallback((message: string, options: ToastOptions = {}): string => {
    const id = generateNotificationId();
    const banner: Notification = {
      id,
      type: options.type || 'info',
      message,
      ...(options.description ? { description: options.description } : {}),
      priority: options.priority || 'high',
      timestamp: new Date(),
      persistent: options.persistent ?? true,
      ...(options.action ? { action: options.action } : {}),
      dismissed: false,
    };

    setBanners(prev => [...prev, banner]);
    return id;
  }, []);

  const dismissBanner = useCallback((id: string) => {
    setBanners(prev => prev.filter(b => b.id !== id));
  }, []);

  const dismissAllBanners = useCallback(() => {
    setBanners([]);
  }, []);

  // Dismiss notifications
  const dismiss = useCallback((id: string) => {
    sonnerToast.dismiss(id);
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, dismissed: true } : n
    ));
  }, []);

  const dismissAll = useCallback(() => {
    sonnerToast.dismiss();
    setNotifications(prev => prev.map(n => ({ ...n, dismissed: true })));
    setQueue([]);
    activeToastCount.current = 0;
  }, []);

  const dismissGroup = useCallback((groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.notifications.forEach(n => dismiss(n.id));
      setGroups(prev => prev.filter(g => g.id !== groupId));
    }
  }, [groups, dismiss]);

  // History
  const getNotificationHistory = useCallback((): Notification[] => {
    return notifications;
  }, [notifications]);

  const clearHistory = useCallback(() => {
    setNotifications([]);
    setGroups([]);
  }, []);

  // Group management
  const toggleGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
    ));
  }, []);

  const collapseAllGroups = useCallback(() => {
    setGroups(prev => prev.map(g => ({ ...g, collapsed: true })));
  }, []);

  const expandAllGroups = useCallback(() => {
    setGroups(prev => prev.map(g => ({ ...g, collapsed: false })));
  }, []);

  // Memoize context value to prevent unnecessary re-renders (React 18 optimization)
  const contextValue = useMemo<NotificationsContextValue>(() => ({
    // State
    notifications,
    groups,
    banners,
    queue,
    maxNotifications,
    maxConcurrentToasts,
    enableGrouping,
    maxGroupSize,

    // Core methods
    notify,
    success,
    error,
    warning,
    info,
    loading,
    notifyWithUndo,

    // Banners
    showBanner,
    dismissBanner,
    dismissAllBanners,

    // Dismiss
    dismiss,
    dismissAll,
    dismissGroup,

    // History
    getNotificationHistory,
    clearHistory,

    // Groups
    toggleGroup,
    collapseAllGroups,
    expandAllGroups,

    // Settings
    setMaxNotifications,
    setMaxConcurrentToasts,
    setEnableGrouping,
    setMaxGroupSize,

    // Promise
    promise: sonnerToast.promise,
  }), [
    notifications,
    groups,
    banners,
    queue,
    maxNotifications,
    maxConcurrentToasts,
    enableGrouping,
    maxGroupSize,
    notify,
    success,
    error,
    warning,
    info,
    loading,
    notifyWithUndo,
    showBanner,
    dismissBanner,
    dismissAllBanners,
    dismiss,
    dismissAll,
    dismissGroup,
    getNotificationHistory,
    clearHistory,
    toggleGroup,
    collapseAllGroups,
    expandAllGroups,
    setMaxNotifications,
    setMaxConcurrentToasts,
    setEnableGrouping,
    setMaxGroupSize,
  ]);

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
}

/**
 * Hook to use notifications context
 */
export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}

export default NotificationsContext;
