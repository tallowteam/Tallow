/**
 * Transfer Templates Module
 *
 * Manages reusable transfer configuration templates that can be saved
 * and applied to transfers. Templates persist to localStorage.
 */

import { generateUUID } from '../utils/uuid';
import secureLog from '../utils/secure-logger';
import secureStorage from '../storage/secure-storage';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type EncryptionType = 'pqc' | 'standard' | 'none';

export interface TransferTemplateOptions {
  deviceId?: string;
  compression?: boolean;
  encryption?: EncryptionType;
  maxSize?: number;
  autoAccept?: boolean;
  stripMetadata?: boolean;
  enableOnionRouting?: boolean;
}

export interface TransferTemplate {
  id: string;
  name: string;
  description?: string;
  options: TransferTemplateOptions;
  createdAt: number;
  lastUsed: number | null;
  useCount: number;
}

// ============================================================================
// STORAGE
// ============================================================================

const STORAGE_KEY = 'tallow-transfer-templates';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function parseTemplates(payload: string): TransferTemplate[] {
  const parsed = JSON.parse(payload);
  return Array.isArray(parsed) ? parsed : getDefaultTemplates();
}

function loadTemplates(): TransferTemplate[] {
  if (!canUseStorage()) {
    return getDefaultTemplates();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {return getDefaultTemplates();}
    if (stored.startsWith('enc:')) {
      return getDefaultTemplates();
    }
    return parseTemplates(stored);
  } catch (error) {
    secureLog.error('Failed to load transfer templates', { error });
    return getDefaultTemplates();
  }
}

function saveTemplates(templates: TransferTemplate[]): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    const serialized = JSON.stringify(templates);
    localStorage.setItem(STORAGE_KEY, serialized);
    void secureStorage.setItem(STORAGE_KEY, serialized).catch((error) => {
      secureLog.error('Failed to encrypt transfer templates at rest', { error });
    });
  } catch (error) {
    secureLog.error('Failed to save transfer templates', { error });
  }
}

function getDefaultTemplates(): TransferTemplate[] {
  return [
    {
      id: 'default-quick',
      name: 'Quick Transfer',
      description: 'Fast transfer with basic encryption',
      options: {
        compression: false,
        encryption: 'standard',
        autoAccept: false,
        stripMetadata: false,
        enableOnionRouting: false,
      },
      createdAt: Date.now(),
      lastUsed: null,
      useCount: 0,
    },
    {
      id: 'default-secure',
      name: 'Secure Transfer',
      description: 'Maximum security with PQC encryption',
      options: {
        compression: true,
        encryption: 'pqc',
        autoAccept: false,
        stripMetadata: true,
        enableOnionRouting: false,
      },
      createdAt: Date.now(),
      lastUsed: null,
      useCount: 0,
    },
    {
      id: 'default-private',
      name: 'Private Transfer',
      description: 'Maximum privacy with onion routing',
      options: {
        compression: true,
        encryption: 'pqc',
        autoAccept: false,
        stripMetadata: true,
        enableOnionRouting: true,
      },
      createdAt: Date.now(),
      lastUsed: null,
      useCount: 0,
    },
  ];
}

// ============================================================================
// IN-MEMORY STATE
// ============================================================================

let templates: TransferTemplate[] = loadTemplates();
const listeners: Set<() => void> = new Set();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function notifyListeners(): void {
  listeners.forEach(listener => listener());
}

async function hydrateTemplatesFromSecureStorage(): Promise<void> {
  if (!canUseStorage()) {
    return;
  }

  try {
    const stored = await secureStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }
    templates = parseTemplates(stored);
    notifyListeners();
  } catch (error) {
    secureLog.error('[TransferTemplate] Failed to hydrate encrypted templates', { error });
  }
}

function validateTemplateName(name: string, excludeId?: string): boolean {
  return !templates.some(t => t.name === name && t.id !== excludeId);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Create a new transfer template
 */
export function createTemplate(
  name: string,
  options: TransferTemplateOptions,
  description?: string
): string | null {
  if (!name || name.trim().length === 0) {
    secureLog.error('Template name is required');
    return null;
  }

  if (!validateTemplateName(name)) {
    secureLog.error('Template name already exists', { name });
    return null;
  }

  const template: TransferTemplate = {
    id: generateUUID(),
    name: name.trim(),
    options: { ...options },
    createdAt: Date.now(),
    lastUsed: null,
    useCount: 0,
    ...(description !== undefined ? { description: description.trim() } : {}),
  };

  templates.push(template);
  saveTemplates(templates);
  notifyListeners();

  secureLog.log('[TransferTemplate] Template created', { id: template.id, name });

  return template.id;
}

/**
 * Get all templates
 */
export function getTemplates(): TransferTemplate[] {
  return [...templates];
}

/**
 * Get a specific template by ID
 */
export function getTemplate(id: string): TransferTemplate | null {
  return templates.find(t => t.id === id) || null;
}

/**
 * Get a template by name
 */
export function getTemplateByName(name: string): TransferTemplate | null {
  return templates.find(t => t.name === name) || null;
}

/**
 * Update a template
 */
export function updateTemplate(
  id: string,
  updates: {
    name?: string;
    description?: string;
    options?: Partial<TransferTemplateOptions>;
  }
): boolean {
  const index = templates.findIndex(t => t.id === id);
  if (index === -1) {return false;}

  const template = templates[index];
  if (!template) {return false;}

  // Check if new name conflicts with existing templates
  if (updates.name && updates.name !== template.name) {
    if (!validateTemplateName(updates.name, id)) {
      secureLog.error('Template name already exists', { name: updates.name });
      return false;
    }
    template.name = updates.name.trim();
  }

  if (updates.description !== undefined) {
    template.description = updates.description?.trim();
  }

  if (updates.options) {
    template.options = {
      ...template.options,
      ...updates.options,
    };
  }

  saveTemplates(templates);
  notifyListeners();

  secureLog.log('[TransferTemplate] Template updated', { id });

  return true;
}

/**
 * Apply template settings to a transfer
 * Returns the template options and updates usage statistics
 */
export function applyTemplate(templateId: string, files: File[]): TransferTemplateOptions | null {
  const template = templates.find(t => t.id === templateId);
  if (!template) {
    secureLog.error('Template not found', { templateId });
    return null;
  }

  // Update usage statistics
  template.lastUsed = Date.now();
  template.useCount++;
  saveTemplates(templates);
  notifyListeners();

  secureLog.log('[TransferTemplate] Template applied', {
    id: templateId,
    name: template.name,
    fileCount: files.length,
  });

  // Return a copy of the options
  return { ...template.options };
}

/**
 * Delete a template
 */
export function deleteTemplate(templateId: string): boolean {
  const index = templates.findIndex(t => t.id === templateId);
  if (index === -1) {return false;}

  // Prevent deleting default templates (they can be restored)
  const template = templates[index];
  if (!template) {return false;}
  const isDefault = template.id.startsWith('default-');

  if (isDefault) {
    secureLog.warn('[TransferTemplate] Cannot delete default template', { id: templateId });
    return false;
  }

  templates.splice(index, 1);
  saveTemplates(templates);
  notifyListeners();

  secureLog.log('[TransferTemplate] Template deleted', { id: templateId });

  return true;
}

/**
 * Duplicate an existing template
 */
export function duplicateTemplate(templateId: string, newName?: string): string | null {
  const template = templates.find(t => t.id === templateId);
  if (!template) {return null;}

  const baseName = newName || `${template.name} (Copy)`;
  let finalName = baseName;
  let counter = 1;

  // Find unique name
  while (!validateTemplateName(finalName)) {
    finalName = `${baseName} ${counter}`;
    counter++;
  }

  return createTemplate(finalName, template.options, template.description);
}

/**
 * Reset templates to defaults (removes all custom templates)
 */
export function resetToDefaults(): void {
  templates = getDefaultTemplates();
  saveTemplates(templates);
  notifyListeners();

  secureLog.log('[TransferTemplate] Templates reset to defaults');
}

/**
 * Export templates as JSON
 */
export function exportTemplates(): string {
  const customTemplates = templates.filter(t => !t.id.startsWith('default-'));
  return JSON.stringify(customTemplates, null, 2);
}

/**
 * Import templates from JSON
 */
export function importTemplates(json: string): number {
  try {
    const imported = JSON.parse(json) as TransferTemplate[];
    let importedCount = 0;

    for (const template of imported) {
      // Validate structure
      if (!template.name || !template.options) {continue;}

      // Generate new ID and ensure unique name
      const newId = generateUUID();
      let name = template.name;
      let counter = 1;

      while (!validateTemplateName(name)) {
        name = `${template.name} (${counter})`;
        counter++;
      }

      templates.push({
        ...template,
        id: newId,
        name,
        createdAt: Date.now(),
        lastUsed: null,
        useCount: 0,
      });

      importedCount++;
    }

    saveTemplates(templates);
    notifyListeners();

    secureLog.log('[TransferTemplate] Templates imported', { count: importedCount });

    return importedCount;
  } catch (error) {
    secureLog.error('[TransferTemplate] Failed to import templates', { error });
    return 0;
  }
}

/**
 * Subscribe to changes in templates
 */
export function onTemplatesChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Get template statistics
 */
export function getTemplateStats(): {
  total: number;
  custom: number;
  default: number;
  mostUsed: TransferTemplate | null;
} {
  const total = templates.length;
  const defaultTemplates = templates.filter(t => t.id.startsWith('default-'));
  const custom = total - defaultTemplates.length;

  const mostUsed = templates
    .filter(t => t.useCount > 0)
    .sort((a, b) => b.useCount - a.useCount)[0] || null;

  return {
    total,
    custom,
    default: defaultTemplates.length,
    mostUsed,
  };
}

if (typeof window !== 'undefined') {
  void hydrateTemplatesFromSecureStorage();
}
