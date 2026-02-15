'use client';

/**
 * Transfer Annotations Storage
 * Persistent storage for transfer comments/notes using localStorage
 */

export interface TransferAnnotation {
  /** Unique annotation identifier */
  id: string;
  /** Associated transfer ID */
  transferId: string;
  /** Annotation text content */
  text: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Serialized format stored in localStorage
 */
interface SerializedAnnotation {
  id: string;
  transferId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'tallow_transfer_annotations';
const MAX_ANNOTATION_LENGTH = 500;

/**
 * Get all annotations from localStorage
 */
function getAllAnnotationsRaw(): SerializedAnnotation[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load annotations:', error);
    return [];
  }
}

/**
 * Save annotations to localStorage
 */
function saveAnnotations(annotations: SerializedAnnotation[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
  } catch (error) {
    console.error('Failed to save annotations:', error);
  }
}

/**
 * Deserialize annotation from storage format
 */
function deserializeAnnotation(serialized: SerializedAnnotation): TransferAnnotation {
  return {
    ...serialized,
    createdAt: new Date(serialized.createdAt),
    updatedAt: new Date(serialized.updatedAt),
  };
}

/**
 * Serialize annotation for storage
 */
function serializeAnnotation(annotation: TransferAnnotation): SerializedAnnotation {
  return {
    ...annotation,
    createdAt: annotation.createdAt.toISOString(),
    updatedAt: annotation.updatedAt.toISOString(),
  };
}

/**
 * Add a new annotation to a transfer
 */
export function addAnnotation(transferId: string, text: string): TransferAnnotation {
  // Validate input
  if (!transferId || typeof transferId !== 'string') {
    throw new Error('Invalid transfer ID');
  }

  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error('Annotation text cannot be empty');
  }

  if (trimmedText.length > MAX_ANNOTATION_LENGTH) {
    throw new Error(`Annotation text cannot exceed ${MAX_ANNOTATION_LENGTH} characters`);
  }

  const now = new Date();
  const annotation: TransferAnnotation = {
    id: crypto.randomUUID(),
    transferId,
    text: trimmedText,
    createdAt: now,
    updatedAt: now,
  };

  const annotations = getAllAnnotationsRaw();
  annotations.push(serializeAnnotation(annotation));
  saveAnnotations(annotations);

  return annotation;
}

/**
 * Get all annotations for a specific transfer
 */
export function getAnnotations(transferId: string): TransferAnnotation[] {
  if (!transferId || typeof transferId !== 'string') {
    return [];
  }

  const annotations = getAllAnnotationsRaw();
  return annotations
    .filter((a) => a.transferId === transferId)
    .map(deserializeAnnotation)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

/**
 * Get all annotations across all transfers
 */
export function getAllAnnotations(): TransferAnnotation[] {
  const annotations = getAllAnnotationsRaw();
  return annotations
    .map(deserializeAnnotation)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Update an existing annotation
 */
export function editAnnotation(annotationId: string, newText: string): TransferAnnotation | null {
  if (!annotationId || typeof annotationId !== 'string') {
    throw new Error('Invalid annotation ID');
  }

  const trimmedText = newText.trim();
  if (!trimmedText) {
    throw new Error('Annotation text cannot be empty');
  }

  if (trimmedText.length > MAX_ANNOTATION_LENGTH) {
    throw new Error(`Annotation text cannot exceed ${MAX_ANNOTATION_LENGTH} characters`);
  }

  const annotations = getAllAnnotationsRaw();
  const index = annotations.findIndex((a) => a.id === annotationId);

  if (index === -1) {
    return null;
  }
  const current = annotations[index];
  if (!current) {
    return null;
  }

  const updated: SerializedAnnotation = {
    ...current,
    text: trimmedText,
    updatedAt: new Date().toISOString(),
  };

  annotations[index] = updated;
  saveAnnotations(annotations);

  return deserializeAnnotation(updated);
}

/**
 * Delete an annotation
 */
export function deleteAnnotation(annotationId: string): boolean {
  if (!annotationId || typeof annotationId !== 'string') {
    throw new Error('Invalid annotation ID');
  }

  const annotations = getAllAnnotationsRaw();
  const filteredAnnotations = annotations.filter((a) => a.id !== annotationId);

  if (filteredAnnotations.length === annotations.length) {
    // No annotation was removed
    return false;
  }

  saveAnnotations(filteredAnnotations);
  return true;
}

/**
 * Delete all annotations for a specific transfer
 */
export function deleteAnnotationsForTransfer(transferId: string): number {
  if (!transferId || typeof transferId !== 'string') {
    return 0;
  }

  const annotations = getAllAnnotationsRaw();
  const beforeCount = annotations.length;
  const filteredAnnotations = annotations.filter((a) => a.transferId !== transferId);
  const deletedCount = beforeCount - filteredAnnotations.length;

  if (deletedCount > 0) {
    saveAnnotations(filteredAnnotations);
  }

  return deletedCount;
}

/**
 * Clear all annotations
 */
export function clearAllAnnotations(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear annotations:', error);
  }
}

/**
 * Get annotation count for a transfer
 */
export function getAnnotationCount(transferId: string): number {
  if (!transferId || typeof transferId !== 'string') {
    return 0;
  }

  const annotations = getAllAnnotationsRaw();
  return annotations.filter((a) => a.transferId === transferId).length;
}

/**
 * Export annotations as JSON
 */
export function exportAnnotations(): string {
  const annotations = getAllAnnotations();
  return JSON.stringify(annotations, null, 2);
}

/**
 * Get the maximum allowed annotation length
 */
export function getMaxAnnotationLength(): number {
  return MAX_ANNOTATION_LENGTH;
}

export default {
  addAnnotation,
  getAnnotations,
  getAllAnnotations,
  editAnnotation,
  deleteAnnotation,
  deleteAnnotationsForTransfer,
  clearAllAnnotations,
  getAnnotationCount,
  exportAnnotations,
  getMaxAnnotationLength,
};
