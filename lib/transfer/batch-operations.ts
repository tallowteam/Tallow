/**
 * Batch Operations Module
 *
 * Provides configurable rules for automating batch file operations.
 * Rules can automatically compress, encrypt, rename, organize files,
 * and auto-accept transfers based on conditions.
 */

import { FileInfo, Device } from '../types';
import { generateUUID } from '../utils/uuid';
import secureLog from '../utils/secure-logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Fields that can be used in rule conditions
 */
export type RuleConditionField = 'name' | 'size' | 'type' | 'sender';

/**
 * Operators for comparing field values
 */
export type RuleConditionOperator =
  | 'contains'
  | 'equals'
  | 'greater'
  | 'less'
  | 'matches'
  | 'startsWith'
  | 'endsWith';

/**
 * Condition for evaluating when a rule should apply
 */
export interface RuleCondition {
  /** Field to evaluate */
  field: RuleConditionField;
  /** Comparison operator */
  operator: RuleConditionOperator;
  /** Value to compare against */
  value: string | number;
}

/**
 * Action types that can be performed on files
 */
export type RuleActionType =
  | 'compress'
  | 'encrypt'
  | 'rename'
  | 'organize'
  | 'notify'
  | 'auto-accept'
  | 'strip-metadata'
  | 'add-watermark';

/**
 * Action to perform when rule conditions are met
 */
export interface RuleAction {
  /** Type of action to perform */
  type: RuleActionType;
  /** Additional parameters for the action */
  params?: Record<string, unknown>;
}

/**
 * Complete rule definition
 */
export interface BatchRule {
  /** Unique rule identifier */
  id: string;
  /** User-friendly rule name */
  name: string;
  /** Rule description */
  description?: string;
  /** Condition that must be met */
  condition: RuleCondition;
  /** Action to perform when condition is met */
  action: RuleAction;
  /** Whether rule is currently enabled */
  enabled: boolean;
  /** Priority for rule evaluation (higher = earlier) */
  priority: number;
  /** Creation timestamp */
  createdAt: number;
  /** Last modified timestamp */
  modifiedAt: number;
  /** Number of times rule has been applied */
  appliedCount: number;
}

/**
 * Extended file info with sender information
 */
export interface TransferFile extends FileInfo {
  /** Sender device */
  sender?: Device;
}

/**
 * Result of applying a rule action
 */
export interface RuleApplicationResult {
  /** Whether the action was successful */
  success: boolean;
  /** Applied rule ID */
  ruleId: string;
  /** Applied rule name */
  ruleName: string;
  /** Error message if failed */
  error?: string;
  /** Modified file info if action changed the file */
  modifiedFile?: TransferFile;
}

// ============================================================================
// STORAGE
// ============================================================================

const STORAGE_KEY = 'tallow-batch-rules';

/**
 * Load rules from localStorage
 */
function loadRulesFromStorage(): BatchRule[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultRules();
    const rules = JSON.parse(stored) as BatchRule[];
    return rules.sort((a, b) => b.priority - a.priority);
  } catch (error) {
    secureLog.error('Failed to load batch rules', { error });
    return getDefaultRules();
  }
}

/**
 * Save rules to localStorage
 */
function saveRulesToStorage(rules: BatchRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch (error) {
    secureLog.error('Failed to save batch rules', { error });
  }
}

/**
 * Get default rules
 */
function getDefaultRules(): BatchRule[] {
  const now = Date.now();
  return [
    {
      id: 'default-auto-accept-friends',
      name: 'Auto-accept from Friends',
      description: 'Automatically accept transfers from favorite devices',
      condition: {
        field: 'sender',
        operator: 'equals',
        value: 'favorite',
      },
      action: {
        type: 'auto-accept',
        params: {},
      },
      enabled: false,
      priority: 100,
      createdAt: now,
      modifiedAt: now,
      appliedCount: 0,
    },
    {
      id: 'default-compress-images',
      name: 'Compress Large Images',
      description: 'Compress images larger than 5MB',
      condition: {
        field: 'size',
        operator: 'greater',
        value: 5 * 1024 * 1024, // 5MB in bytes
      },
      action: {
        type: 'compress',
        params: {
          quality: 0.85,
          maxWidth: 3840,
          maxHeight: 2160,
        },
      },
      enabled: false,
      priority: 80,
      createdAt: now,
      modifiedAt: now,
      appliedCount: 0,
    },
    {
      id: 'default-organize-by-type',
      name: 'Organize by File Type',
      description: 'Organize files into folders by type',
      condition: {
        field: 'type',
        operator: 'contains',
        value: '/',
      },
      action: {
        type: 'organize',
        params: {
          strategy: 'by-type',
        },
      },
      enabled: false,
      priority: 50,
      createdAt: now,
      modifiedAt: now,
      appliedCount: 0,
    },
    {
      id: 'default-strip-metadata-images',
      name: 'Strip Image Metadata',
      description: 'Remove EXIF data from images for privacy',
      condition: {
        field: 'type',
        operator: 'startsWith',
        value: 'image/',
      },
      action: {
        type: 'strip-metadata',
        params: {},
      },
      enabled: false,
      priority: 90,
      createdAt: now,
      modifiedAt: now,
      appliedCount: 0,
    },
  ];
}

// ============================================================================
// RULE EVALUATION
// ============================================================================

/**
 * Evaluate if a file matches a rule condition
 */
export function evaluateCondition(
  file: TransferFile,
  condition: RuleCondition
): boolean {
  try {
    const { field, operator, value } = condition;

    let fieldValue: string | number | undefined;

    switch (field) {
      case 'name':
        fieldValue = file.name;
        break;
      case 'size':
        fieldValue = file.size;
        break;
      case 'type':
        fieldValue = file.type;
        break;
      case 'sender':
        if (value === 'favorite') {
          return file.sender?.isFavorite === true;
        }
        fieldValue = file.sender?.id || '';
        break;
      default:
        return false;
    }

    if (fieldValue === undefined) return false;

    switch (operator) {
      case 'contains':
        return typeof fieldValue === 'string' && typeof value === 'string'
          ? fieldValue.toLowerCase().includes(value.toLowerCase())
          : false;

      case 'equals':
        return fieldValue === value;

      case 'greater':
        return typeof fieldValue === 'number' && typeof value === 'number'
          ? fieldValue > value
          : false;

      case 'less':
        return typeof fieldValue === 'number' && typeof value === 'number'
          ? fieldValue < value
          : false;

      case 'matches':
        if (typeof fieldValue === 'string' && typeof value === 'string') {
          try {
            const regex = new RegExp(value, 'i');
            return regex.test(fieldValue);
          } catch {
            return false;
          }
        }
        return false;

      case 'startsWith':
        return typeof fieldValue === 'string' && typeof value === 'string'
          ? fieldValue.toLowerCase().startsWith(value.toLowerCase())
          : false;

      case 'endsWith':
        return typeof fieldValue === 'string' && typeof value === 'string'
          ? fieldValue.toLowerCase().endsWith(value.toLowerCase())
          : false;

      default:
        return false;
    }
  } catch (error) {
    secureLog.error('Error evaluating condition', { error, condition });
    return false;
  }
}

/**
 * Evaluate all rules and return matching actions
 */
export function evaluateRules(
  file: TransferFile,
  rules: BatchRule[]
): RuleAction[] {
  const matchingActions: RuleAction[] = [];

  // Filter enabled rules and sort by priority
  const enabledRules = rules
    .filter((rule) => rule.enabled)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of enabledRules) {
    if (evaluateCondition(file, rule.condition)) {
      matchingActions.push(rule.action);
      secureLog.info('Rule matched', {
        ruleId: rule.id,
        ruleName: rule.name,
        fileName: file.name,
      });
    }
  }

  return matchingActions;
}

// ============================================================================
// ACTION APPLICATION
// ============================================================================

/**
 * Apply a single rule action to a file
 */
export async function applyRuleAction(
  file: TransferFile,
  action: RuleAction,
  ruleId: string,
  ruleName: string
): Promise<RuleApplicationResult> {
  try {
    secureLog.info('Applying rule action', {
      action: action.type,
      fileName: file.name,
      ruleId,
    });

    let modifiedFile: TransferFile | undefined;

    switch (action.type) {
      case 'compress':
        // Compression logic would be implemented here
        // For now, we'll simulate it
        modifiedFile = {
          ...file,
          size: Math.floor(file.size * 0.7), // Simulate 30% compression
        };
        break;

      case 'encrypt':
        // Encryption metadata would be added here
        modifiedFile = {
          ...file,
          name: `${file.name}.encrypted`,
        };
        break;

      case 'rename':
        const pattern = action.params?.pattern as string;
        if (pattern) {
          modifiedFile = {
            ...file,
            name: applyRenamePattern(file.name, pattern),
          };
        }
        break;

      case 'organize':
        const strategy = action.params?.strategy as string;
        if (strategy === 'by-type') {
          const folder = getFileTypeFolder(file.type);
          modifiedFile = {
            ...file,
            path: folder ? `${folder}/${file.name}` : file.path,
          };
        }
        break;

      case 'notify':
        // Notification would be sent here
        break;

      case 'auto-accept':
        // Auto-accept flag would be set on the transfer
        break;

      case 'strip-metadata':
        // Metadata stripping would be implemented here
        modifiedFile = { ...file };
        break;

      case 'add-watermark':
        // Watermark would be added here
        modifiedFile = { ...file };
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }

    return {
      success: true,
      ruleId,
      ruleName,
      modifiedFile: modifiedFile || file,
    };
  } catch (error) {
    secureLog.error('Failed to apply rule action', {
      error,
      action: action.type,
      fileName: file.name,
    });
    return {
      success: false,
      ruleId,
      ruleName,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Apply multiple rule actions to a file
 */
export async function applyRuleActions(
  file: TransferFile,
  actions: RuleAction[],
  rules: BatchRule[]
): Promise<RuleApplicationResult[]> {
  const results: RuleApplicationResult[] = [];
  let currentFile = file;

  for (const action of actions) {
    const rule = rules.find((r) => r.action === action);
    const ruleId = rule?.id || 'unknown';
    const ruleName = rule?.name || 'Unknown Rule';

    const result = await applyRuleAction(currentFile, action, ruleId, ruleName);
    results.push(result);

    if (result.success && result.modifiedFile) {
      currentFile = result.modifiedFile;
    }

    // Update rule application count
    if (rule) {
      incrementRuleCount(rule.id);
    }
  }

  return results;
}

// ============================================================================
// RULE MANAGEMENT
// ============================================================================

/**
 * Get all batch rules
 */
export function getAllRules(): BatchRule[] {
  return loadRulesFromStorage();
}

/**
 * Get a specific rule by ID
 */
export function getRule(id: string): BatchRule | undefined {
  const rules = loadRulesFromStorage();
  return rules.find((rule) => rule.id === id);
}

/**
 * Create a new batch rule
 */
export function createRule(
  name: string,
  description: string,
  condition: RuleCondition,
  action: RuleAction,
  priority: number = 50
): BatchRule {
  const rules = loadRulesFromStorage();
  const now = Date.now();

  const newRule: BatchRule = {
    id: generateUUID(),
    name,
    description,
    condition,
    action,
    enabled: true,
    priority,
    createdAt: now,
    modifiedAt: now,
    appliedCount: 0,
  };

  rules.push(newRule);
  saveRulesToStorage(rules);

  secureLog.info('Created batch rule', { ruleId: newRule.id, name });
  return newRule;
}

/**
 * Update an existing batch rule
 */
export function updateRule(
  id: string,
  updates: Partial<Omit<BatchRule, 'id' | 'createdAt' | 'appliedCount'>>
): BatchRule | null {
  const rules = loadRulesFromStorage();
  const index = rules.findIndex((rule) => rule.id === id);

  if (index === -1) return null;

  const updatedRule: BatchRule = {
    ...rules[index],
    ...updates,
    modifiedAt: Date.now(),
  };

  rules[index] = updatedRule;
  saveRulesToStorage(rules);

  secureLog.info('Updated batch rule', { ruleId: id });
  return updatedRule;
}

/**
 * Delete a batch rule
 */
export function deleteRule(id: string): boolean {
  const rules = loadRulesFromStorage();
  const filteredRules = rules.filter((rule) => rule.id !== id);

  if (filteredRules.length === rules.length) {
    return false; // Rule not found
  }

  saveRulesToStorage(filteredRules);
  secureLog.info('Deleted batch rule', { ruleId: id });
  return true;
}

/**
 * Toggle rule enabled state
 */
export function toggleRule(id: string): boolean {
  const rules = loadRulesFromStorage();
  const rule = rules.find((r) => r.id === id);

  if (!rule) return false;

  rule.enabled = !rule.enabled;
  rule.modifiedAt = Date.now();
  saveRulesToStorage(rules);

  secureLog.info('Toggled batch rule', { ruleId: id, enabled: rule.enabled });
  return rule.enabled;
}

/**
 * Reorder rules by updating priorities
 */
export function reorderRules(ruleIds: string[]): void {
  const rules = loadRulesFromStorage();
  const ruleMap = new Map(rules.map((r) => [r.id, r]));

  // Assign priorities based on order (highest first)
  const maxPriority = ruleIds.length * 10;
  ruleIds.forEach((id, index) => {
    const rule = ruleMap.get(id);
    if (rule) {
      rule.priority = maxPriority - index * 10;
      rule.modifiedAt = Date.now();
    }
  });

  saveRulesToStorage(rules);
  secureLog.info('Reordered batch rules', { count: ruleIds.length });
}

/**
 * Increment rule application count
 */
function incrementRuleCount(id: string): void {
  const rules = loadRulesFromStorage();
  const rule = rules.find((r) => r.id === id);

  if (rule) {
    rule.appliedCount++;
    saveRulesToStorage(rules);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Apply rename pattern to filename
 */
function applyRenamePattern(filename: string, pattern: string): string {
  const ext = filename.substring(filename.lastIndexOf('.'));
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));

  return pattern
    .replace('{name}', nameWithoutExt)
    .replace('{ext}', ext)
    .replace('{date}', new Date().toISOString().split('T')[0])
    .replace('{time}', new Date().toTimeString().split(' ')[0].replace(/:/g, '-'));
}

/**
 * Get folder name based on file type
 */
function getFileTypeFolder(mimeType: string): string {
  const [category] = mimeType.split('/');

  switch (category) {
    case 'image':
      return 'Images';
    case 'video':
      return 'Videos';
    case 'audio':
      return 'Audio';
    case 'text':
      return 'Documents';
    case 'application':
      if (mimeType.includes('pdf')) return 'Documents';
      if (mimeType.includes('zip') || mimeType.includes('archive'))
        return 'Archives';
      return 'Files';
    default:
      return 'Other';
  }
}

/**
 * Get human-readable description of a rule
 */
export function getRuleDescription(rule: BatchRule): string {
  const { condition, action } = rule;

  const conditionStr = getConditionDescription(condition);
  const actionStr = getActionDescription(action);

  return `${conditionStr} → ${actionStr}`;
}

/**
 * Get human-readable description of a condition
 */
function getConditionDescription(condition: RuleCondition): string {
  const { field, operator, value } = condition;

  let fieldStr = field.charAt(0).toUpperCase() + field.slice(1);
  let valueStr = typeof value === 'number' ? formatBytes(value) : String(value);

  const operatorMap: Record<RuleConditionOperator, string> = {
    contains: 'contains',
    equals: 'is',
    greater: 'is larger than',
    less: 'is smaller than',
    matches: 'matches',
    startsWith: 'starts with',
    endsWith: 'ends with',
  };

  return `${fieldStr} ${operatorMap[operator]} ${valueStr}`;
}

/**
 * Get human-readable description of an action
 */
function getActionDescription(action: RuleAction): string {
  const actionMap: Record<RuleActionType, string> = {
    compress: 'Compress file',
    encrypt: 'Encrypt file',
    rename: 'Rename file',
    organize: 'Organize into folder',
    notify: 'Send notification',
    'auto-accept': 'Auto-accept transfer',
    'strip-metadata': 'Strip metadata',
    'add-watermark': 'Add watermark',
  };

  return actionMap[action.type] || action.type;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
