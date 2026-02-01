/**
 * Privacy Settings Manager
 *
 * Manages privacy-related settings including metadata stripping preferences
 */

import { getSecureStorage } from '../storage/secure-storage';
import { secureLog } from '../utils/secure-logger';

export interface PrivacySettings {
  // Metadata stripping
  stripMetadataEnabled: boolean;
  stripMetadataByDefault: boolean;
  preserveOrientation: boolean;
  showMetadataWarnings: boolean;

  // Trusted contacts (skip metadata stripping)
  trustedContacts: string[]; // Friend IDs

  // File type preferences
  stripFromImages: boolean;
  stripFromVideos: boolean;

  // Privacy notifications
  notifyOnSensitiveData: boolean;
  requireConfirmationBeforeStrip: boolean;
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
};

const STORAGE_KEY = 'privacy_settings';

/**
 * Get current privacy settings
 */
export async function getPrivacySettings(): Promise<PrivacySettings> {
  try {
    const storage = await getSecureStorage();
    const saved = await storage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_PRIVACY_SETTINGS, ...parsed };
    }

    return DEFAULT_PRIVACY_SETTINGS;
  } catch (error) {
    secureLog.error('Failed to load privacy settings:', error);
    return DEFAULT_PRIVACY_SETTINGS;
  }
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(
  updates: Partial<PrivacySettings>
): Promise<PrivacySettings> {
  try {
    const current = await getPrivacySettings();
    const updated = { ...current, ...updates };

    const storage = await getSecureStorage();
    await storage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return updated;
  } catch (error) {
    secureLog.error('Failed to save privacy settings:', error);
    throw error;
  }
}

/**
 * Add a trusted contact (skip metadata stripping)
 */
export async function addTrustedContact(friendId: string): Promise<void> {
  const settings = await getPrivacySettings();

  if (!settings.trustedContacts.includes(friendId)) {
    settings.trustedContacts.push(friendId);
    await updatePrivacySettings(settings);
  }
}

/**
 * Remove a trusted contact
 */
export async function removeTrustedContact(friendId: string): Promise<void> {
  const settings = await getPrivacySettings();
  settings.trustedContacts = settings.trustedContacts.filter(id => id !== friendId);
  await updatePrivacySettings(settings);
}

/**
 * Check if a contact is trusted
 */
export async function isTrustedContact(friendId: string): Promise<boolean> {
  const settings = await getPrivacySettings();
  return settings.trustedContacts.includes(friendId);
}

/**
 * Check if metadata stripping should be applied
 */
export async function shouldStripMetadata(
  fileType: string,
  recipientId?: string
): Promise<boolean> {
  const settings = await getPrivacySettings();

  // Check if feature is enabled
  if (!settings.stripMetadataEnabled) {
    return false;
  }

  // Check if recipient is trusted
  if (recipientId && settings.trustedContacts.includes(recipientId)) {
    return false;
  }

  // Check file type preferences
  if (fileType.startsWith('image/') && !settings.stripFromImages) {
    return false;
  }

  if (fileType.startsWith('video/') && !settings.stripFromVideos) {
    return false;
  }

  return settings.stripMetadataByDefault;
}

/**
 * Reset privacy settings to defaults
 */
export async function resetPrivacySettings(): Promise<PrivacySettings> {
  const storage = await getSecureStorage();
  await storage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRIVACY_SETTINGS));
  return DEFAULT_PRIVACY_SETTINGS;
}
