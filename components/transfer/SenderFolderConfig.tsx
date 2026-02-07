'use client';

/**
 * Sender Folder Configuration Component
 *
 * Allows users to manage custom folder assignments per sender.
 * Features:
 * - List all senders with their assigned folders
 * - Edit folder names inline
 * - Toggle auto-create for new senders
 * - Configure default folder naming template
 * - Search and filter senders
 * - Bulk operations
 */

import { useState, useEffect, useMemo } from 'react';
import {
  getSenderFolderManager,
  type SenderFolderConfig,
} from '@/lib/storage/sender-folders';
import { useFriendsStore } from '@/lib/stores/friends-store';
import styles from './SenderFolderConfig.module.css';

interface SenderFolderConfigProps {
  className?: string;
}

export default function SenderFolderConfigComponent({
  className,
}: SenderFolderConfigProps) {
  const manager = getSenderFolderManager();
  useFriendsStore((state) => state.friends);

  const [configs, setConfigs] = useState<SenderFolderConfig[]>([]);
  const [autoCreate, setAutoCreate] = useState(false);
  const [template, setTemplate] = useState<'sender_name' | 'sender_name_date' | 'custom'>('sender_name');
  const [customTemplate, setCustomTemplate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load initial settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    setConfigs(manager.getAllConfigs());
    setAutoCreate(manager.getAutoCreateSetting());
    setTemplate(manager.getFolderTemplate());
    setCustomTemplate(manager.getCustomTemplate() || '');
  };

  // Get statistics
  const stats = useMemo(() => {
    return manager.getStats();
  }, [configs]);

  // Filter configs based on search
  const filteredConfigs = useMemo(() => {
    if (!searchQuery.trim()) return configs;

    const query = searchQuery.toLowerCase();
    return configs.filter(
      (config) =>
        config.senderName.toLowerCase().includes(query) ||
        config.folderName.toLowerCase().includes(query)
    );
  }, [configs, searchQuery]);

  // Handle auto-create toggle
  const handleAutoCreateToggle = () => {
    const newValue = !autoCreate;
    setAutoCreate(newValue);
    manager.setAutoCreateSetting(newValue);
  };

  // Handle template change
  const handleTemplateChange = (newTemplate: 'sender_name' | 'sender_name_date' | 'custom') => {
    setTemplate(newTemplate);
    manager.setFolderTemplate(newTemplate, customTemplate);
  };

  // Handle custom template change
  const handleCustomTemplateChange = (value: string) => {
    setCustomTemplate(value);
    if (template === 'custom') {
      manager.setFolderTemplate('custom', value);
    }
  };

  // Handle edit start
  const handleEditStart = (config: SenderFolderConfig) => {
    setEditingId(config.senderId);
    setEditValue(config.folderName);
  };

  // Handle edit save
  const handleEditSave = (senderId: string, senderName: string) => {
    if (editValue.trim()) {
      manager.setSenderFolder(senderId, senderName, editValue.trim());
      loadSettings();
    }
    setEditingId(null);
    setEditValue('');
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  // Handle delete
  const handleDelete = (senderId: string) => {
    if (confirm('Remove folder assignment for this sender?')) {
      manager.removeSenderFolder(senderId);
      loadSettings();
    }
  };

  // Handle clear all
  const handleClearAll = () => {
    if (confirm('Clear all folder assignments? This cannot be undone.')) {
      manager.clearAllFolders();
      loadSettings();
    }
  };

  // Get sender initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2 className={styles.title}>Sender Folder Settings</h2>
          <p className={styles.description}>
            Organize received files by automatically saving them to sender-specific folders
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Total Folders</div>
          <div className={styles.statValue}>{stats.totalFolders}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Auto-Created</div>
          <div className={styles.statValue}>{stats.autoCreated}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Manual</div>
          <div className={styles.statValue}>{stats.manuallySet}</div>
        </div>
      </div>

      {/* Settings Section */}
      <div className={styles.settingsSection}>
        {/* Auto-create toggle */}
        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <div className={styles.settingTitle}>Auto-create folders for new senders</div>
            <div className={styles.settingDescription}>
              Automatically create a folder when receiving files from a new sender
            </div>
          </div>
          <button
            type="button"
            className={styles.toggle}
            data-checked={autoCreate}
            onClick={handleAutoCreateToggle}
            aria-label="Toggle auto-create folders"
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        {/* Template selector */}
        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <div className={styles.settingTitle}>Default folder name template</div>
            <div className={styles.settingDescription}>
              Choose how folder names are generated for new senders
            </div>
          </div>
        </div>

        <div className={styles.templateSelector}>
          <div className={styles.templateOptions}>
            <button
              type="button"
              className={styles.templateOption}
              data-selected={template === 'sender_name'}
              onClick={() => handleTemplateChange('sender_name')}
            >
              Sender Name
            </button>
            <button
              type="button"
              className={styles.templateOption}
              data-selected={template === 'sender_name_date'}
              onClick={() => handleTemplateChange('sender_name_date')}
            >
              Sender Name + Date
            </button>
            <button
              type="button"
              className={styles.templateOption}
              data-selected={template === 'custom'}
              onClick={() => handleTemplateChange('custom')}
            >
              Custom Template
            </button>
          </div>

          {template === 'custom' && (
            <>
              <input
                type="text"
                className={styles.customTemplateInput}
                placeholder="e.g., {sender_name}_{date}"
                value={customTemplate}
                onChange={(e) => handleCustomTemplateChange(e.target.value)}
              />
              <div className={styles.templateHint}>
                Available variables: {'{sender_name}'}, {'{date}'}, {'{year}'}, {'{month}'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Senders List */}
      <div className={styles.sendersSection}>
        <div className={styles.header}>
          <h3 className={styles.sectionTitle}>
            Sender Folders ({filteredConfigs.length})
          </h3>
          {configs.length > 0 && (
            <div className={styles.bulkActions}>
              <button
                type="button"
                className={`${styles.bulkButton} ${styles.danger}`}
                onClick={handleClearAll}
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        {configs.length > 3 && (
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search senders or folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* List */}
        {filteredConfigs.length > 0 ? (
          <div className={styles.sendersList}>
            {filteredConfigs.map((config) => {
              const isEditing = editingId === config.senderId;

              return (
                <div key={config.senderId} className={styles.senderCard}>
                  <div className={styles.senderAvatar}>
                    {getInitials(config.senderName)}
                  </div>

                  <div className={styles.senderInfo}>
                    <div className={styles.senderName}>{config.senderName}</div>
                    {isEditing ? (
                      <input
                        type="text"
                        className={styles.editInput}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditSave(config.senderId, config.senderName);
                          } else if (e.key === 'Escape') {
                            handleEditCancel();
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <div className={styles.senderFolder}>
                        📁 {config.folderName}
                      </div>
                    )}
                  </div>

                  <div className={styles.senderActions}>
                    {isEditing ? (
                      <div className={styles.editActions}>
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={() => handleEditSave(config.senderId, config.senderName)}
                          aria-label="Save"
                          title="Save"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={handleEditCancel}
                          aria-label="Cancel"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={() => handleEditStart(config)}
                          aria-label="Edit folder name"
                          title="Edit folder name"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionButton} ${styles.danger}`}
                          onClick={() => handleDelete(config.senderId)}
                          aria-label="Remove folder assignment"
                          title="Remove folder assignment"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📂</div>
            {searchQuery ? (
              <p>No senders found matching &quot;{searchQuery}&quot;</p>
            ) : (
              <p>
                No sender folders configured yet.
                <br />
                Folders will be created automatically when you receive files.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
