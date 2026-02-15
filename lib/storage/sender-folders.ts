/**
 * Sender Folder Manager
 *
 * Manages custom folder assignments per sender for file organization.
 * Automatically creates folders when receiving files from known senders.
 */

export interface SenderFolderConfig {
  senderId: string;
  senderName: string;
  folderName: string;
  autoCreate: boolean;
  createdAt: number;
  lastUpdated: number;
}

export interface SenderFolderSettings {
  autoCreateForNewSenders: boolean;
  defaultFolderTemplate: 'sender_name' | 'sender_name_date' | 'custom';
  customTemplate?: string;
  folders: Record<string, SenderFolderConfig>;
}

const STORAGE_KEY = 'tallow-sender-folders';
const DEFAULT_SETTINGS: SenderFolderSettings = {
  autoCreateForNewSenders: true,
  defaultFolderTemplate: 'sender_name',
  folders: {},
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sanitize folder name to be filesystem-safe
 */
function sanitizeFolderName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/\.+$/g, '') // Remove trailing dots
    .substring(0, 255); // Limit length
}

/**
 * Generate date string for folder naming
 */
function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if folder name exists in config
 */
function folderExists(folderName: string, folders: Record<string, SenderFolderConfig>, excludeSenderId?: string): boolean {
  return Object.values(folders).some(
    config => config.folderName === folderName && config.senderId !== excludeSenderId
  );
}

/**
 * Resolve folder name conflicts by appending (2), (3), etc.
 */
function resolveConflict(baseName: string, folders: Record<string, SenderFolderConfig>, excludeSenderId?: string): string {
  let folderName = baseName;
  let counter = 2;

  while (folderExists(folderName, folders, excludeSenderId)) {
    folderName = `${baseName} (${counter})`;
    counter++;
  }

  return folderName;
}

// ============================================================================
// SENDER FOLDER MANAGER CLASS
// ============================================================================

export class SenderFolderManager {
  private settings: SenderFolderSettings;
  private isInitialized: boolean = false;

  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
  }

  /**
   * Initialize manager and load settings from localStorage
   */
  initialize(): void {
    if (this.isInitialized) {return;}

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SenderFolderSettings;
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load sender folder settings:', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }

    this.isInitialized = true;
  }

  /**
   * Save settings to localStorage
   */
  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save sender folder settings:', error);
    }
  }

  /**
   * Set custom folder for a specific sender
   */
  setSenderFolder(senderId: string, senderName: string, folderName: string): void {
    this.initialize();

    const sanitized = sanitizeFolderName(folderName);
    if (!sanitized) {
      throw new Error('Invalid folder name');
    }

    // Resolve conflicts (exclude current sender)
    const resolvedName = resolveConflict(sanitized, this.settings.folders, senderId);

    this.settings.folders[senderId] = {
      senderId,
      senderName,
      folderName: resolvedName,
      autoCreate: true,
      createdAt: this.settings.folders[senderId]?.createdAt || Date.now(),
      lastUpdated: Date.now(),
    };

    this.save();
  }

  /**
   * Get folder name for a specific sender
   */
  getSenderFolder(senderId: string): string | null {
    this.initialize();
    return this.settings.folders[senderId]?.folderName || null;
  }

  /**
   * Get default folder name for a sender (auto-generated)
   */
  getDefaultFolder(senderName: string): string {
    this.initialize();

    const sanitized = sanitizeFolderName(senderName) || 'Unknown_Sender';

    switch (this.settings.defaultFolderTemplate) {
      case 'sender_name':
        return sanitized;

      case 'sender_name_date':
        return `${sanitized}_${getDateString()}`;

      case 'custom':
        if (this.settings.customTemplate) {
          return this.settings.customTemplate
            .replace('{sender_name}', sanitized)
            .replace('{date}', getDateString())
            .replace('{year}', String(new Date().getFullYear()))
            .replace('{month}', String(new Date().getMonth() + 1).padStart(2, '0'));
        }
        return sanitized;

      default:
        return sanitized;
    }
  }

  /**
   * Get or create folder for sender
   * If no folder is assigned and auto-create is enabled, creates one
   */
  getOrCreateFolder(senderId: string, senderName: string): string {
    this.initialize();

    // Check if folder already assigned
    const existing = this.getSenderFolder(senderId);
    if (existing) {return existing;}

    // Auto-create if enabled
    if (this.settings.autoCreateForNewSenders) {
      const defaultFolder = this.getDefaultFolder(senderName);
      const resolvedFolder = resolveConflict(defaultFolder, this.settings.folders);

      this.settings.folders[senderId] = {
        senderId,
        senderName,
        folderName: resolvedFolder,
        autoCreate: true,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };

      this.save();
      return resolvedFolder;
    }

    // No folder assigned and auto-create disabled
    return 'Downloads'; // Default fallback
  }

  /**
   * Get all sender folder configurations
   */
  getAllSenderFolders(): Map<string, string> {
    this.initialize();
    const map = new Map<string, string>();

    for (const [senderId, config] of Object.entries(this.settings.folders)) {
      map.set(senderId, config.folderName);
    }

    return map;
  }

  /**
   * Get all sender folder configs with full details
   */
  getAllConfigs(): SenderFolderConfig[] {
    this.initialize();
    return Object.values(this.settings.folders);
  }

  /**
   * Remove folder assignment for a sender
   */
  removeSenderFolder(senderId: string): void {
    this.initialize();
    delete this.settings.folders[senderId];
    this.save();
  }

  /**
   * Clear all sender folder assignments
   */
  clearAllFolders(): void {
    this.initialize();
    this.settings.folders = {};
    this.save();
  }

  /**
   * Get auto-create setting
   */
  getAutoCreateSetting(): boolean {
    this.initialize();
    return this.settings.autoCreateForNewSenders;
  }

  /**
   * Set auto-create setting
   */
  setAutoCreateSetting(enabled: boolean): void {
    this.initialize();
    this.settings.autoCreateForNewSenders = enabled;
    this.save();
  }

  /**
   * Get folder template setting
   */
  getFolderTemplate(): 'sender_name' | 'sender_name_date' | 'custom' {
    this.initialize();
    return this.settings.defaultFolderTemplate;
  }

  /**
   * Set folder template setting
   */
  setFolderTemplate(template: 'sender_name' | 'sender_name_date' | 'custom', customTemplate?: string): void {
    this.initialize();
    this.settings.defaultFolderTemplate = template;
    if (template === 'custom' && customTemplate) {
      this.settings.customTemplate = customTemplate;
    }
    this.save();
  }

  /**
   * Get custom template
   */
  getCustomTemplate(): string | undefined {
    this.initialize();
    return this.settings.customTemplate;
  }

  /**
   * Update sender name (in case it changes)
   */
  updateSenderName(senderId: string, newName: string): void {
    this.initialize();

    if (this.settings.folders[senderId]) {
      this.settings.folders[senderId].senderName = newName;
      this.settings.folders[senderId].lastUpdated = Date.now();
      this.save();
    }
  }

  /**
   * Check if sender has a custom folder
   */
  hasSenderFolder(senderId: string): boolean {
    this.initialize();
    return senderId in this.settings.folders;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalFolders: number;
    autoCreated: number;
    manuallySet: number;
    recentlyUpdated: number;
  } {
    this.initialize();

    const configs = Object.values(this.settings.folders);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return {
      totalFolders: configs.length,
      autoCreated: configs.filter(c => c.autoCreate).length,
      manuallySet: configs.filter(c => !c.autoCreate).length,
      recentlyUpdated: configs.filter(c => c.lastUpdated > weekAgo).length,
    };
  }

  /**
   * Export settings (for backup)
   */
  exportSettings(): string {
    this.initialize();
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings (from backup)
   */
  importSettings(jsonString: string): void {
    try {
      const imported = JSON.parse(jsonString) as SenderFolderSettings;
      this.settings = { ...DEFAULT_SETTINGS, ...imported };
      this.save();
    } catch (_error) {
      throw new Error('Invalid settings format');
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let managerInstance: SenderFolderManager | null = null;

/**
 * Get singleton instance of SenderFolderManager
 */
export function getSenderFolderManager(): SenderFolderManager {
  if (!managerInstance) {
    managerInstance = new SenderFolderManager();
  }
  return managerInstance;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getSenderFolderManager,
  SenderFolderManager,
};
