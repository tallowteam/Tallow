'use client';

import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
import {
  addAnnotation,
  getAnnotations,
  editAnnotation,
  deleteAnnotation,
  getMaxAnnotationLength,
  type TransferAnnotation as AnnotationType,
} from '@/lib/storage/transfer-annotations';
import styles from './TransferAnnotation.module.css';

interface TransferAnnotationProps {
  transferId: string;
  onAnnotationCountChange?: (count: number) => void;
}

export function TransferAnnotation({ transferId, onAnnotationCountChange }: TransferAnnotationProps) {
  const [annotations, setAnnotations] = useState<AnnotationType[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newAnnotationText, setNewAnnotationText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const MAX_LENGTH = getMaxAnnotationLength();

  // Load annotations
  useEffect(() => {
    loadAnnotations();
  }, [transferId]);

  // Focus input when adding/editing
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
    }
  }, [editingId]);

  const loadAnnotations = () => {
    const loaded = getAnnotations(transferId);
    setAnnotations(loaded);
    onAnnotationCountChange?.(loaded.length);
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setError(null);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewAnnotationText('');
    setError(null);
  };

  const handleSaveNew = () => {
    try {
      if (!newAnnotationText.trim()) {
        setError('Annotation cannot be empty');
        return;
      }

      addAnnotation(transferId, newAnnotationText);
      setNewAnnotationText('');
      setIsAdding(false);
      setError(null);
      loadAnnotations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add annotation');
    }
  };

  const handleEditClick = (annotation: AnnotationType) => {
    setEditingId(annotation.id);
    setEditText(annotation.text);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setError(null);
  };

  const handleSaveEdit = () => {
    if (!editingId) {return;}

    try {
      if (!editText.trim()) {
        setError('Annotation cannot be empty');
        return;
      }

      const updated = editAnnotation(editingId, editText);
      if (updated) {
        setEditingId(null);
        setEditText('');
        setError(null);
        loadAnnotations();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update annotation');
    }
  };

  const handleDelete = (annotationId: string) => {
    if (window.confirm('Delete this annotation?')) {
      deleteAnnotation(annotationId);
      loadAnnotations();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>, action: 'save-new' | 'save-edit') => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (action === 'save-new') {
        handleSaveNew();
      } else {
        handleSaveEdit();
      }
    } else if (e.key === 'Escape') {
      if (action === 'save-new') {
        handleCancelAdd();
      } else {
        handleCancelEdit();
      }
    }
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {return 'just now';}
    if (diffMins < 60) {return `${diffMins}m ago`;}
    if (diffHours < 24) {return `${diffHours}h ago`;}
    if (diffDays < 7) {return `${diffDays}d ago`;}

    return date.toLocaleDateString();
  };

  const annotationCount = annotations.length;
  const hasAnnotations = annotationCount > 0;

  return (
    <div className={styles.container}>
      {/* Add Note Button */}
      {!isAdding && (
        <button
          className={styles.addButton}
          onClick={handleAddClick}
          aria-label="Add note"
          title="Add note"
        >
          <PlusIcon />
          <span>Add note</span>
          {hasAnnotations && (
            <span className={styles.badge}>{annotationCount}</span>
          )}
        </button>
      )}

      {/* New Annotation Input */}
      {isAdding && (
        <div className={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            className={styles.textarea}
            value={newAnnotationText}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewAnnotationText(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'save-new')}
            placeholder="Add a note about this transfer..."
            maxLength={MAX_LENGTH}
            rows={2}
            aria-label="New annotation"
          />
          <div className={styles.inputActions}>
            <span className={styles.charCount}>
              {newAnnotationText.length}/{MAX_LENGTH}
            </span>
            <div className={styles.buttonGroup}>
              <button
                className={styles.cancelButton}
                onClick={handleCancelAdd}
                type="button"
              >
                Cancel
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSaveNew}
                type="button"
                disabled={!newAnnotationText.trim()}
              >
                Save
              </button>
            </div>
          </div>
          {error && <div className={styles.error}>{error}</div>}
        </div>
      )}

      {/* Existing Annotations */}
      {hasAnnotations && (
        <div className={styles.annotationList}>
          {annotations.map((annotation) => (
            <div key={annotation.id} className={styles.annotation}>
              {editingId === annotation.id ? (
                // Edit Mode
                <div className={styles.editWrapper}>
                  <textarea
                    ref={editRef}
                    className={styles.textarea}
                    value={editText}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditText(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'save-edit')}
                    maxLength={MAX_LENGTH}
                    rows={2}
                    aria-label="Edit annotation"
                  />
                  <div className={styles.inputActions}>
                    <span className={styles.charCount}>
                      {editText.length}/{MAX_LENGTH}
                    </span>
                    <div className={styles.buttonGroup}>
                      <button
                        className={styles.cancelButton}
                        onClick={handleCancelEdit}
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        className={styles.saveButton}
                        onClick={handleSaveEdit}
                        type="button"
                        disabled={!editText.trim()}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                  {error && <div className={styles.error}>{error}</div>}
                </div>
              ) : (
                // View Mode
                <>
                  <div className={styles.annotationText}>{annotation.text}</div>
                  <div className={styles.annotationMeta}>
                    <span className={styles.timestamp}>
                      {formatRelativeTime(annotation.createdAt)}
                      {annotation.updatedAt.getTime() !== annotation.createdAt.getTime() && (
                        <span className={styles.edited}> (edited)</span>
                      )}
                    </span>
                    <div className={styles.annotationActions}>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleEditClick(annotation)}
                        aria-label="Edit annotation"
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleDelete(annotation.id)}
                        aria-label="Delete annotation"
                        title="Delete"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Icons
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
