'use client';

import { useState, useEffect } from 'react';
import {
  BatchRule,
  RuleCondition,
  RuleAction,
  RuleConditionField,
  RuleConditionOperator,
  RuleActionType,
  getAllRules,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  reorderRules,
  getRuleDescription,
} from '@/lib/transfer/batch-operations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import styles from './BatchRuleEditor.module.css';

interface BatchRuleEditorProps {
  /** Callback when rules change */
  onRulesChange?: (rules: BatchRule[]) => void;
  /** Maximum number of rules allowed */
  maxRules?: number;
}

export function BatchRuleEditor({ onRulesChange, maxRules = 50 }: BatchRuleEditorProps) {
  const [rules, setRules] = useState<BatchRule[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BatchRule | null>(null);
  const [draggedRuleId, setDraggedRuleId] = useState<string | null>(null);

  // Load rules on mount
  useEffect(() => {
    loadRules();
  }, []);

  // Notify parent when rules change
  useEffect(() => {
    if (onRulesChange) {
      onRulesChange(rules);
    }
  }, [rules, onRulesChange]);

  const loadRules = () => {
    const loadedRules = getAllRules();
    setRules(loadedRules);
  };

  const handleToggleRule = (id: string) => {
    toggleRule(id);
    loadRules();
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteRule(id);
      loadRules();
    }
  };

  const handleEditRule = (rule: BatchRule) => {
    setEditingRule(rule);
    setIsAddModalOpen(true);
  };

  const handleDragStart = (ruleId: string) => {
    setDraggedRuleId(ruleId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetRuleId: string) => {
    if (!draggedRuleId || draggedRuleId === targetRuleId) {
      setDraggedRuleId(null);
      return;
    }

    const draggedIndex = rules.findIndex((r) => r.id === draggedRuleId);
    const targetIndex = rules.findIndex((r) => r.id === targetRuleId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedRuleId(null);
      return;
    }

    // Reorder rules array
    const newRules = [...rules];
    const [draggedRule] = newRules.splice(draggedIndex, 1);
    if (draggedRule) newRules.splice(targetIndex, 0, draggedRule);

    // Update priorities based on new order
    reorderRules(newRules.map((r) => r.id));
    loadRules();
    setDraggedRuleId(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Batch Rules</h2>
          <p className={styles.subtitle}>
            Automate file operations with configurable rules
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRule(null);
            setIsAddModalOpen(true);
          }}
          disabled={rules.length >= maxRules}
        >
          Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No rules configured yet.</p>
          <p className={styles.emptyStateHint}>
            Create rules to automate batch file operations
          </p>
        </div>
      ) : (
        <div className={styles.ruleList}>
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`${styles.ruleCard} ${!rule.enabled ? styles.disabled : ''} ${
                draggedRuleId === rule.id ? styles.dragging : ''
              }`}
              draggable
              onDragStart={() => handleDragStart(rule.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(rule.id)}
            >
              <div className={styles.ruleCardHeader}>
                <div className={styles.dragHandle}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="4" cy="4" r="1.5" />
                    <circle cx="12" cy="4" r="1.5" />
                    <circle cx="4" cy="8" r="1.5" />
                    <circle cx="12" cy="8" r="1.5" />
                    <circle cx="4" cy="12" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                  </svg>
                </div>
                <div className={styles.ruleInfo}>
                  <h3 className={styles.ruleName}>{rule.name}</h3>
                  {rule.description && (
                    <p className={styles.ruleDescription}>{rule.description}</p>
                  )}
                  <p className={styles.rulePreview}>{getRuleDescription(rule)}</p>
                </div>
                <div className={styles.ruleActions}>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleEditRule(rule)}
                    title="Edit rule"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                      <path d="M11.5 2.5l2 2-7 7H4.5v-2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 4l2 2" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleDeleteRule(rule.id)}
                    title="Delete rule"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                      <path d="M3 4h10M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v4M10 7v4M4 4h8v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
              {rule.appliedCount > 0 && (
                <div className={styles.ruleStats}>
                  Applied {rule.appliedCount} times
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isAddModalOpen && (
        <RuleFormModal
          rule={editingRule}
          onSave={(ruleData) => {
            if (editingRule) {
              updateRule(editingRule.id, ruleData);
            } else {
              createRule(
                ruleData.name,
                ruleData.description || '',
                ruleData.condition,
                ruleData.action,
                ruleData.priority
              );
            }
            loadRules();
            setIsAddModalOpen(false);
            setEditingRule(null);
          }}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingRule(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// RULE FORM MODAL
// ============================================================================

interface RuleFormModalProps {
  rule: BatchRule | null;
  onSave: (ruleData: {
    name: string;
    description?: string;
    condition: RuleCondition;
    action: RuleAction;
    priority: number;
  }) => void;
  onClose: () => void;
}

function RuleFormModal({ rule, onSave, onClose }: RuleFormModalProps) {
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [priority, setPriority] = useState(rule?.priority || 50);

  // Condition state
  const [conditionField, setConditionField] = useState<RuleConditionField>(
    rule?.condition.field || 'name'
  );
  const [conditionOperator, setConditionOperator] = useState<RuleConditionOperator>(
    rule?.condition.operator || 'contains'
  );
  const [conditionValue, setConditionValue] = useState<string>(
    String(rule?.condition.value || '')
  );

  // Action state
  const [actionType, setActionType] = useState<RuleActionType>(
    rule?.action.type || 'compress'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a rule name');
      return;
    }

    if (!conditionValue.trim()) {
      alert('Please enter a condition value');
      return;
    }

    const condition: RuleCondition = {
      field: conditionField,
      operator: conditionOperator,
      value: conditionField === 'size' ? parseFloat(conditionValue) : conditionValue,
    };

    const action: RuleAction = {
      type: actionType,
      params: getActionParams(actionType),
    };

    onSave({
      name,
      description,
      condition,
      action,
      priority,
    });
  };

  const getActionParams = (type: RuleActionType): Record<string, unknown> => {
    switch (type) {
      case 'compress':
        return { quality: 0.85 };
      case 'organize':
        return { strategy: 'by-type' };
      default:
        return {};
    }
  };

  const getOperatorsForField = (field: RuleConditionField): RuleConditionOperator[] => {
    switch (field) {
      case 'name':
        return ['contains', 'equals', 'startsWith', 'endsWith', 'matches'];
      case 'size':
        return ['equals', 'greater', 'less'];
      case 'type':
        return ['contains', 'equals', 'startsWith', 'endsWith'];
      case 'sender':
        return ['equals'];
      default:
        return ['contains', 'equals'];
    }
  };

  const getValueInputType = (): string => {
    if (conditionField === 'size') return 'number';
    return 'text';
  };

  const getValuePlaceholder = (): string => {
    switch (conditionField) {
      case 'name':
        return 'e.g., report, document.pdf';
      case 'size':
        return 'Size in bytes (e.g., 5242880 for 5MB)';
      case 'type':
        return 'e.g., image/, video/mp4';
      case 'sender':
        return 'favorite or device ID';
      default:
        return '';
    }
  };

  return (
    <Modal open onClose={onClose} title={rule ? 'Edit Rule' : 'Add Rule'}>
      <form className={styles.ruleForm} onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Basic Information</h3>

          <div className={styles.formField}>
            <label htmlFor="rule-name" className={styles.formLabel}>
              Rule Name
            </label>
            <Input
              id="rule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Rule"
              required
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="rule-description" className={styles.formLabel}>
              Description (Optional)
            </label>
            <Input
              id="rule-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this rule do?"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="rule-priority" className={styles.formLabel}>
              Priority (Higher = Earlier)
            </label>
            <Input
              id="rule-priority"
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
              min={0}
              max={100}
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Condition</h3>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label htmlFor="condition-field" className={styles.formLabel}>
                Field
              </label>
              <select
                id="condition-field"
                className={styles.select}
                value={conditionField}
                onChange={(e) => {
                  setConditionField(e.target.value as RuleConditionField);
                  setConditionOperator(getOperatorsForField(e.target.value as RuleConditionField)[0] ?? 'equals');
                }}
              >
                <option value="name">File Name</option>
                <option value="size">File Size</option>
                <option value="type">File Type</option>
                <option value="sender">Sender</option>
              </select>
            </div>

            <div className={styles.formField}>
              <label htmlFor="condition-operator" className={styles.formLabel}>
                Operator
              </label>
              <select
                id="condition-operator"
                className={styles.select}
                value={conditionOperator}
                onChange={(e) => setConditionOperator(e.target.value as RuleConditionOperator)}
              >
                {getOperatorsForField(conditionField).map((op) => (
                  <option key={op} value={op}>
                    {op.charAt(0).toUpperCase() + op.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formField}>
            <label htmlFor="condition-value" className={styles.formLabel}>
              Value
            </label>
            <Input
              id="condition-value"
              type={getValueInputType()}
              value={conditionValue}
              onChange={(e) => setConditionValue(e.target.value)}
              placeholder={getValuePlaceholder()}
              required
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>Action</h3>

          <div className={styles.formField}>
            <label htmlFor="action-type" className={styles.formLabel}>
              Action Type
            </label>
            <select
              id="action-type"
              className={styles.select}
              value={actionType}
              onChange={(e) => setActionType(e.target.value as RuleActionType)}
            >
              <option value="compress">Compress File</option>
              <option value="encrypt">Encrypt File</option>
              <option value="rename">Rename File</option>
              <option value="organize">Organize into Folder</option>
              <option value="notify">Send Notification</option>
              <option value="auto-accept">Auto-accept Transfer</option>
              <option value="strip-metadata">Strip Metadata</option>
              <option value="add-watermark">Add Watermark</option>
            </select>
          </div>
        </div>

        <div className={styles.formActions}>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {rule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
