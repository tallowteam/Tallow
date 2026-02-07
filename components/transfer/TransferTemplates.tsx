'use client';

import { useState, useEffect } from 'react';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  getTemplateStats,
  onTemplatesChange,
  type TransferTemplate,
  type TransferTemplateOptions,
  type EncryptionType,
} from '@/lib/transfer/transfer-templates';
import styles from './TransferTemplates.module.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TransferTemplatesProps {
  onApplyTemplate?: (options: TransferTemplateOptions) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function TransferTemplates({ onApplyTemplate }: TransferTemplatesProps) {
  const [templates, setTemplates] = useState<TransferTemplate[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TransferTemplate | null>(null);

  // Load templates
  useEffect(() => {
    setTemplates(getTemplates());

    // Subscribe to changes
    const unsubscribe = onTemplatesChange(() => {
      setTemplates(getTemplates());
    });

    return unsubscribe;
  }, []);

  const stats = getTemplateStats();

  const handleApplyTemplate = (template: TransferTemplate) => {
    if (onApplyTemplate) {
      // In a real implementation, you'd pass the files here
      onApplyTemplate(template.options);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(templateId);
    }
  };

  const handleDuplicateTemplate = (templateId: string) => {
    duplicateTemplate(templateId);
  };

  const isDefaultTemplate = (template: TransferTemplate) => {
    return template.id.startsWith('default-');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.icon}>📋</span>
          Transfer Templates
        </h2>
        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={() => setShowCreateModal(true)}
          >
            <span>+</span>
            Create Template
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Templates</div>
          <div className={styles.statValue}>{stats.total}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Custom Templates</div>
          <div className={styles.statValue}>{stats.custom}</div>
        </div>
        {stats.mostUsed && (
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Most Used</div>
            <div className={styles.statValue} style={{ fontSize: '1.25rem' }}>
              {stats.mostUsed.name}
            </div>
          </div>
        )}
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📋</div>
          <div className={styles.emptyTitle}>No Templates Yet</div>
          <div className={styles.emptyText}>
            Create your first transfer template to save time on recurring transfers
          </div>
          <button
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={() => setShowCreateModal(true)}
          >
            Create Your First Template
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              isDefault={isDefaultTemplate(template)}
              onApply={() => handleApplyTemplate(template)}
              onEdit={() => setEditingTemplate(template)}
              onDelete={() => handleDeleteTemplate(template.id)}
              onDuplicate={() => handleDuplicateTemplate(template.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTemplate) && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// TEMPLATE CARD COMPONENT
// ============================================================================

interface TemplateCardProps {
  template: TransferTemplate;
  isDefault: boolean;
  onApply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function TemplateCard({
  template,
  isDefault,
  onApply,
  onEdit,
  onDelete,
  onDuplicate,
}: TemplateCardProps) {
  const { options } = template;

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={`${styles.templateCard} ${isDefault ? styles.defaultTemplate : ''}`}>
      <div className={styles.templateHeader}>
        <div className={styles.templateInfo}>
          <h3 className={styles.templateName}>{template.name}</h3>
          {isDefault && <span className={styles.templateBadge}>Default</span>}
          {template.description && (
            <p className={styles.templateDescription}>{template.description}</p>
          )}
        </div>
        <div className={styles.templateActions}>
          <button
            className={styles.iconButton}
            onClick={onEdit}
            title="Edit template"
            aria-label="Edit template"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          {!isDefault && (
            <button
              className={`${styles.iconButton} ${styles.deleteButton}`}
              onClick={onDelete}
              title="Delete template"
              aria-label="Delete template"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className={styles.options}>
        {options.deviceId && (
          <div className={styles.optionItem}>
            <span className={styles.optionLabel}>📱 Device</span>
            <span className={styles.optionValue}>{options.deviceId}</span>
          </div>
        )}
        <div className={styles.optionItem}>
          <span className={styles.optionLabel}>🔐 Encryption</span>
          <span className={styles.optionValue}>
            {options.encryption === 'pqc' ? 'Post-Quantum' :
             options.encryption === 'standard' ? 'Standard' : 'None'}
          </span>
        </div>
        <div className={styles.optionItem}>
          <span className={styles.optionLabel}>🗜️ Compression</span>
          <span className={`${styles.optionValue} ${options.compression ? styles.enabled : styles.disabled}`}>
            {options.compression ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        {options.stripMetadata && (
          <div className={styles.optionItem}>
            <span className={styles.optionLabel}>🧹 Strip Metadata</span>
            <span className={`${styles.optionValue} ${styles.enabled}`}>Enabled</span>
          </div>
        )}
        {options.enableOnionRouting && (
          <div className={styles.optionItem}>
            <span className={styles.optionLabel}>🧅 Onion Routing</span>
            <span className={`${styles.optionValue} ${styles.enabled}`}>Enabled</span>
          </div>
        )}
        {options.maxSize && (
          <div className={styles.optionItem}>
            <span className={styles.optionLabel}>📦 Max Size</span>
            <span className={styles.optionValue}>
              {(options.maxSize / (1024 * 1024)).toFixed(0)} MB
            </span>
          </div>
        )}
      </div>

      <div className={styles.templateFooter}>
        <button className={styles.applyButton} onClick={onApply}>
          Apply Template
        </button>
        <button className={styles.duplicateButton} onClick={onDuplicate} title="Duplicate template">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
      </div>

      {template.useCount > 0 && (
        <div className={styles.usageStats}>
          <span>Used {template.useCount} times</span>
          <span>•</span>
          <span>Last used: {formatDate(template.lastUsed)}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TEMPLATE MODAL COMPONENT
// ============================================================================

interface TemplateModalProps {
  template: TransferTemplate | null;
  onClose: () => void;
}

function TemplateModal({ template, onClose }: TemplateModalProps) {
  const isEditing = !!template;
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [encryption, setEncryption] = useState<EncryptionType>(
    template?.options.encryption || 'standard'
  );
  const [compression, setCompression] = useState(template?.options.compression ?? true);
  const [stripMetadata, setStripMetadata] = useState(template?.options.stripMetadata ?? false);
  const [enableOnionRouting, setEnableOnionRouting] = useState(
    template?.options.enableOnionRouting ?? false
  );
  const [autoAccept, setAutoAccept] = useState(template?.options.autoAccept ?? false);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }

    const options: TransferTemplateOptions = {
      encryption,
      compression,
      stripMetadata,
      enableOnionRouting,
      autoAccept,
    };

    if (isEditing && template) {
      updateTemplate(template.id, { name, description, options });
    } else {
      createTemplate(name, options, description);
    }

    onClose();
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>
          {isEditing ? 'Edit Template' : 'Create Template'}
        </h3>

        <div className={styles.formGroup}>
          <label className={styles.label}>Template Name *</label>
          <input
            type="text"
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Quick Share"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description..."
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Encryption</label>
          <select
            className={styles.select}
            value={encryption}
            onChange={e => setEncryption(e.target.value as EncryptionType)}
          >
            <option value="none">None</option>
            <option value="standard">Standard (AES-256)</option>
            <option value="pqc">Post-Quantum (ML-KEM-768)</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Options</label>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={compression}
                onChange={e => setCompression(e.target.checked)}
              />
              <span>Enable compression</span>
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={stripMetadata}
                onChange={e => setStripMetadata(e.target.checked)}
              />
              <span>Strip file metadata</span>
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={enableOnionRouting}
                onChange={e => setEnableOnionRouting(e.target.checked)}
              />
              <span>Enable onion routing (maximum privacy)</span>
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={autoAccept}
                onChange={e => setAutoAccept(e.target.checked)}
              />
              <span>Auto-accept transfers</span>
            </label>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={`${styles.button} ${styles.secondaryButton}`} onClick={onClose}>
            Cancel
          </button>
          <button className={`${styles.button} ${styles.primaryButton}`} onClick={handleSave}>
            {isEditing ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
