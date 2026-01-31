'use client';

/**
 * Settings Context
 * Centralized state management for application settings
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { secureLog } from '../utils/secure-logger';
import { secureStorage } from '../storage/secure-storage';
import { toast } from '../utils/toast';

export type ThemeMode = 'light' | 'dark' | 'high-contrast' | 'system';
export type LanguageCode = 'en' | 'es' | 'zh' | 'hi' | 'ar' | 'pt' | 'bn' | 'ru' | 'ja' | 'de' | 'fr' | 'ko' | 'tr' | 'it' | 'vi' | 'pl' | 'nl' | 'th' | 'id' | 'uk' | 'ur';

export interface PrivacySettings {
  // Metadata stripping
  stripMetadataEnabled: boolean;
  stripMetadataByDefault: boolean;
  preserveOrientation: boolean;
  showMetadataWarnings: boolean;
  trustedContacts: string[];
  stripFromImages: boolean;
  stripFromVideos: boolean;
  notifyOnSensitiveData: boolean;
  requireConfirmationBeforeStrip: boolean;

  // Relay and routing
  relayModeEnabled: boolean;
  useOnionRouting: boolean;
  preferDirectConnection: boolean;
}

export interface NotificationPreferences {
  // Desktop notifications
  enableDesktopNotifications: boolean;
  notifyOnTransferComplete: boolean;
  notifyOnTransferRequest: boolean;
  notifyOnConnectionEstablished: boolean;
  notifyOnConnectionLost: boolean;

  // Sound notifications
  enableSound: boolean;
  soundVolume: number; // 0-100

  // Notification grouping
  groupSimilarNotifications: boolean;
  maxNotificationsPerGroup: number;
}

export interface AccessibilitySettings {
  // Motion
  reducedMotion: boolean;
  disableAnimations: boolean;

  // Voice
  enableVoiceCommands: boolean;
  enableScreenReader: boolean;
  announceTransferProgress: boolean;

  // Visual
  highContrast: boolean;
  largeText: boolean;
  focusIndicators: boolean;

  // Keyboard
  enableKeyboardShortcuts: boolean;
  tabTrapEnabled: boolean;
}

export interface AppSettings {
  // Appearance
  theme: ThemeMode;
  language: LanguageCode;

  // Privacy
  privacy: PrivacySettings;

  // Notifications
  notifications: NotificationPreferences;

  // Accessibility
  accessibility: AccessibilitySettings;

  // Device
  deviceName: string;
  deviceAvatar?: string;

  // Transfers
  autoAcceptFromFriends: boolean;
  requirePinForTransfers: boolean;
  defaultDownloadPath: string;

  // Advanced
  enableTelemetry: boolean;
  enableCrashReports: boolean;
  maxConcurrentTransfers: number;
}

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  stripMetadataEnabled: true,
  stripMetadataByDefault: true,
  preserveOrientation: true,
  showMetadataWarnings: true,
  trustedContacts: [],
  stripFromImages: true,
  stripFromVideos: true,
  notifyOnSensitiveData: true,
  requireConfirmationBeforeStrip: false,
  relayModeEnabled: false,
  useOnionRouting: false,
  preferDirectConnection: true,
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationPreferences = {
  enableDesktopNotifications: true,
  notifyOnTransferComplete: true,
  notifyOnTransferRequest: true,
  notifyOnConnectionEstablished: true,
  notifyOnConnectionLost: true,
  enableSound: true,
  soundVolume: 50,
  groupSimilarNotifications: true,
  maxNotificationsPerGroup: 5,
};

const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  reducedMotion: false,
  disableAnimations: false,
  enableVoiceCommands: false,
  enableScreenReader: false,
  announceTransferProgress: true,
  highContrast: false,
  largeText: false,
  focusIndicators: true,
  enableKeyboardShortcuts: true,
  tabTrapEnabled: true,
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  privacy: DEFAULT_PRIVACY_SETTINGS,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  accessibility: DEFAULT_ACCESSIBILITY_SETTINGS,
  deviceName: 'Web Device',
  autoAcceptFromFriends: false,
  requirePinForTransfers: false,
  defaultDownloadPath: '',
  enableTelemetry: false,
  enableCrashReports: true,
  maxConcurrentTransfers: 3,
};

const STORAGE_KEY = 'tallow_app_settings';

export interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
}

interface SettingsContextValue extends SettingsState {
  // Update settings
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  updatePrivacySettings: (updates: Partial<PrivacySettings>) => Promise<void>;
  updateNotificationSettings: (updates: Partial<NotificationPreferences>) => Promise<void>;
  updateAccessibilitySettings: (updates: Partial<AccessibilitySettings>) => Promise<void>;

  // Theme
  setTheme: (theme: ThemeMode) => Promise<void>;

  // Language
  setLanguage: (language: LanguageCode) => Promise<void>;

  // Reset
  resetSettings: () => Promise<void>;
  resetToDefaults: (category?: 'privacy' | 'notifications' | 'accessibility') => Promise<void>;

  // Privacy helpers
  addTrustedContact: (contactId: string) => Promise<void>;
  removeTrustedContact: (contactId: string) => Promise<void>;
  isTrustedContact: (contactId: string) => boolean;

  // Validation
  validateSettings: (settings: Partial<AppSettings>) => boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

/**
 * Settings Provider
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load settings from secure storage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const saved = await secureStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppSettings;
        // Merge with defaults to handle new settings
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          privacy: { ...DEFAULT_PRIVACY_SETTINGS, ...parsed.privacy },
          notifications: { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed.notifications },
          accessibility: { ...DEFAULT_ACCESSIBILITY_SETTINGS, ...parsed.accessibility },
        });
      }
    } catch (error) {
      secureLog.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    setIsSaving(true);
    try {
      await secureStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setLastSaved(new Date());
    } catch (error) {
      secureLog.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Validate settings
  const validateSettings = useCallback((updates: Partial<AppSettings>): boolean => {
    // Theme validation
    if (updates.theme && !['light', 'dark', 'high-contrast', 'system'].includes(updates.theme)) {
      return false;
    }

    // Sound volume validation
    if (updates.notifications?.soundVolume !== undefined) {
      const volume = updates.notifications.soundVolume;
      if (volume < 0 || volume > 100) {
        return false;
      }
    }

    // Max concurrent transfers validation
    if (updates.maxConcurrentTransfers !== undefined) {
      if (updates.maxConcurrentTransfers < 1 || updates.maxConcurrentTransfers > 10) {
        return false;
      }
    }

    return true;
  }, []);

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    if (!validateSettings(updates)) {
      toast.error('Invalid settings');
      return;
    }

    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveSettings(newSettings);
    toast.success('Settings saved');
  }, [settings, validateSettings, saveSettings]);

  const updatePrivacySettings = useCallback(async (updates: Partial<PrivacySettings>) => {
    // CRITICAL: Warn users if they try to enable onion routing
    if (updates.useOnionRouting === true) {
      toast.error(
        'Onion routing is not available',
        {
          description: 'This feature is experimental and the relay network infrastructure has not been implemented yet. Please use direct P2P connections.',
          duration: 8000,
        }
      );
      // Prevent enabling the feature
      updates.useOnionRouting = false;
      secureLog.warn('[Settings] Attempted to enable onion routing - feature not available');
    }

    const newSettings = {
      ...settings,
      privacy: { ...settings.privacy, ...updates },
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
    toast.success('Privacy settings updated');
  }, [settings, saveSettings]);

  const updateNotificationSettings = useCallback(async (updates: Partial<NotificationPreferences>) => {
    const newSettings = {
      ...settings,
      notifications: { ...settings.notifications, ...updates },
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
    toast.success('Notification settings updated');
  }, [settings, saveSettings]);

  const updateAccessibilitySettings = useCallback(async (updates: Partial<AccessibilitySettings>) => {
    const newSettings = {
      ...settings,
      accessibility: { ...settings.accessibility, ...updates },
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
    toast.success('Accessibility settings updated');
  }, [settings, saveSettings]);

  // Theme
  const setTheme = useCallback(async (theme: ThemeMode) => {
    await updateSettings({ theme });
  }, [updateSettings]);

  // Language
  const setLanguage = useCallback(async (language: LanguageCode) => {
    await updateSettings({ language });
  }, [updateSettings]);

  // Reset
  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await saveSettings(DEFAULT_SETTINGS);
    toast.success('Settings reset to defaults');
  }, [saveSettings]);

  const resetToDefaults = useCallback(async (category?: 'privacy' | 'notifications' | 'accessibility') => {
    if (!category) {
      await resetSettings();
      return;
    }

    const updates: Partial<AppSettings> = {};
    switch (category) {
      case 'privacy':
        updates.privacy = DEFAULT_PRIVACY_SETTINGS;
        break;
      case 'notifications':
        updates.notifications = DEFAULT_NOTIFICATION_SETTINGS;
        break;
      case 'accessibility':
        updates.accessibility = DEFAULT_ACCESSIBILITY_SETTINGS;
        break;
    }

    await updateSettings(updates);
    toast.success(`${category.charAt(0).toUpperCase() + category.slice(1)} settings reset`);
  }, [resetSettings, updateSettings]);

  // Privacy helpers
  const addTrustedContact = useCallback(async (contactId: string) => {
    if (!settings.privacy.trustedContacts.includes(contactId)) {
      await updatePrivacySettings({
        trustedContacts: [...settings.privacy.trustedContacts, contactId],
      });
    }
  }, [settings.privacy.trustedContacts, updatePrivacySettings]);

  const removeTrustedContact = useCallback(async (contactId: string) => {
    await updatePrivacySettings({
      trustedContacts: settings.privacy.trustedContacts.filter(id => id !== contactId),
    });
  }, [settings.privacy.trustedContacts, updatePrivacySettings]);

  const isTrustedContact = useCallback((contactId: string): boolean => {
    return settings.privacy.trustedContacts.includes(contactId);
  }, [settings.privacy.trustedContacts]);

  // Memoize context value to prevent unnecessary re-renders (React 18 optimization)
  const contextValue = useMemo<SettingsContextValue>(() => ({
    // State
    settings,
    isLoading,
    isSaving,
    lastSaved,

    // Actions
    updateSettings,
    updatePrivacySettings,
    updateNotificationSettings,
    updateAccessibilitySettings,
    setTheme,
    setLanguage,
    resetSettings,
    resetToDefaults,
    addTrustedContact,
    removeTrustedContact,
    isTrustedContact,
    validateSettings,
  }), [
    settings,
    isLoading,
    isSaving,
    lastSaved,
    updateSettings,
    updatePrivacySettings,
    updateNotificationSettings,
    updateAccessibilitySettings,
    setTheme,
    setLanguage,
    resetSettings,
    resetToDefaults,
    addTrustedContact,
    removeTrustedContact,
    isTrustedContact,
    validateSettings,
  ]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Hook to use settings context
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

export default SettingsContext;
