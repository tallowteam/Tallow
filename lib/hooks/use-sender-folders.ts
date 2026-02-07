'use client';

/**
 * useSenderFolders Hook
 *
 * React hook for managing sender folder assignments.
 * Provides reactive state management for folder configurations.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getSenderFolderManager,
  type SenderFolderConfig,
} from '@/lib/storage/sender-folders';

export interface UseSenderFoldersReturn {
  // State
  configs: SenderFolderConfig[];
  autoCreate: boolean;
  template: 'sender_name' | 'sender_name_date' | 'custom';
  customTemplate: string;
  stats: {
    totalFolders: number;
    autoCreated: number;
    manuallySet: number;
    recentlyUpdated: number;
  };

  // Actions
  setSenderFolder: (senderId: string, senderName: string, folderName: string) => void;
  getSenderFolder: (senderId: string) => string | null;
  getOrCreateFolder: (senderId: string, senderName: string) => string;
  removeSenderFolder: (senderId: string) => void;
  clearAllFolders: () => void;
  setAutoCreate: (enabled: boolean) => void;
  setTemplate: (
    template: 'sender_name' | 'sender_name_date' | 'custom',
    customTemplate?: string
  ) => void;
  hasSenderFolder: (senderId: string) => boolean;
  refresh: () => void;
}

/**
 * Hook for managing sender folder assignments
 */
export function useSenderFolders(): UseSenderFoldersReturn {
  const manager = getSenderFolderManager();

  const [configs, setConfigs] = useState<SenderFolderConfig[]>([]);
  const [autoCreate, setAutoCreateState] = useState(false);
  const [template, setTemplateState] = useState<'sender_name' | 'sender_name_date' | 'custom'>('sender_name');
  const [customTemplate, setCustomTemplateState] = useState('');

  // Load settings
  const loadSettings = useCallback(() => {
    setConfigs(manager.getAllConfigs());
    setAutoCreateState(manager.getAutoCreateSetting());
    setTemplateState(manager.getFolderTemplate());
    setCustomTemplateState(manager.getCustomTemplate() || '');
  }, [manager]);

  // Initialize on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Set sender folder
  const setSenderFolder = useCallback(
    (senderId: string, senderName: string, folderName: string) => {
      manager.setSenderFolder(senderId, senderName, folderName);
      loadSettings();
    },
    [manager, loadSettings]
  );

  // Get sender folder
  const getSenderFolder = useCallback(
    (senderId: string) => {
      return manager.getSenderFolder(senderId);
    },
    [manager]
  );

  // Get or create folder
  const getOrCreateFolder = useCallback(
    (senderId: string, senderName: string) => {
      const folder = manager.getOrCreateFolder(senderId, senderName);
      loadSettings(); // Refresh if new folder was created
      return folder;
    },
    [manager, loadSettings]
  );

  // Remove sender folder
  const removeSenderFolder = useCallback(
    (senderId: string) => {
      manager.removeSenderFolder(senderId);
      loadSettings();
    },
    [manager, loadSettings]
  );

  // Clear all folders
  const clearAllFolders = useCallback(() => {
    manager.clearAllFolders();
    loadSettings();
  }, [manager, loadSettings]);

  // Set auto-create
  const setAutoCreate = useCallback(
    (enabled: boolean) => {
      manager.setAutoCreateSetting(enabled);
      setAutoCreateState(enabled);
    },
    [manager]
  );

  // Set template
  const setTemplate = useCallback(
    (
      newTemplate: 'sender_name' | 'sender_name_date' | 'custom',
      newCustomTemplate?: string
    ) => {
      manager.setFolderTemplate(newTemplate, newCustomTemplate);
      setTemplateState(newTemplate);
      if (newCustomTemplate) {
        setCustomTemplateState(newCustomTemplate);
      }
    },
    [manager]
  );

  // Check if sender has folder
  const hasSenderFolder = useCallback(
    (senderId: string) => {
      return manager.hasSenderFolder(senderId);
    },
    [manager]
  );

  // Get statistics
  const stats = manager.getStats();

  return {
    configs,
    autoCreate,
    template,
    customTemplate,
    stats,
    setSenderFolder,
    getSenderFolder,
    getOrCreateFolder,
    removeSenderFolder,
    clearAllFolders,
    setAutoCreate,
    setTemplate,
    hasSenderFolder,
    refresh: loadSettings,
  };
}

/**
 * Hook for a single sender's folder
 */
export function useSenderFolder(senderId: string, senderName: string) {
  const manager = getSenderFolderManager();
  const [folder, setFolder] = useState<string | null>(null);

  useEffect(() => {
    setFolder(manager.getSenderFolder(senderId));
  }, [senderId, manager]);

  const updateFolder = useCallback(
    (newFolder: string) => {
      manager.setSenderFolder(senderId, senderName, newFolder);
      setFolder(newFolder);
    },
    [senderId, senderName, manager]
  );

  const removeFolder = useCallback(() => {
    manager.removeSenderFolder(senderId);
    setFolder(null);
  }, [senderId, manager]);

  const getOrCreate = useCallback(() => {
    const folderPath = manager.getOrCreateFolder(senderId, senderName);
    setFolder(folderPath);
    return folderPath;
  }, [senderId, senderName, manager]);

  return {
    folder,
    updateFolder,
    removeFolder,
    getOrCreate,
  };
}

export default useSenderFolders;
