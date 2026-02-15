/**
 * Form Policy Utilities
 * Agent 036 -- FORM-ARCHITECT
 *
 * Provides standardized error message formatting and focus management
 * for all form components in Tallow.
 */

// ============================================================================
// ERROR MESSAGE FORMATTING
// ============================================================================

/** Generates a "required" error message for a given field label. */
export function requiredFieldMessage(fieldLabel: string): string {
  return `${fieldLabel} is required.`;
}

/** Generates an "invalid" error message with optional guidance. */
export function invalidFieldMessage(fieldLabel: string, guidance: string): string {
  const normalizedGuidance = guidance.trim();
  if (normalizedGuidance.length === 0) {
    return `${fieldLabel} is invalid.`;
  }

  return `${fieldLabel} is invalid. ${normalizedGuidance}`;
}

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/** Focuses an element by its DOM id. Safe to call during SSR. */
export function focusFieldById(fieldId: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const element = document.getElementById(fieldId);
  if (element instanceof HTMLElement) {
    element.focus();
  }
}

/**
 * Focuses the first field that has an error, given a map of field IDs to
 * error messages. Returns the ID of the focused field, or null if none.
 */
export function focusFirstError(
  errors: Record<string, string | undefined>,
  fieldOrder: string[]
): string | null {
  for (const fieldId of fieldOrder) {
    if (errors[fieldId]) {
      focusFieldById(fieldId);
      return fieldId;
    }
  }
  return null;
}

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Derives consistent aria IDs for a form field.
 * Example: fieldId="device-name" produces:
 *   errorId = "device-name-error"
 *   helpId  = "device-name-help"
 */
export function deriveAriaIds(fieldId: string): {
  errorId: string;
  helpId: string;
} {
  return {
    errorId: `${fieldId}-error`,
    helpId: `${fieldId}-help`,
  };
}

/**
 * Builds the aria-describedby attribute value from error and help IDs.
 * Returns undefined if neither error nor help text is present.
 */
export function buildDescribedBy(
  fieldId: string,
  hasError: boolean,
  hasHelpText: boolean
): string | undefined {
  const ids = deriveAriaIds(fieldId);
  if (hasError) return ids.errorId;
  if (hasHelpText) return ids.helpId;
  return undefined;
}

// ============================================================================
// FORM POLICY CONSTANTS
// ============================================================================

/** Maximum lengths for common field types. */
export const FIELD_LIMITS = {
  deviceName: 32,
  roomCode: 6,
  fileName: 255,
  saveLocation: 1024,
  password: 128,
} as const;

/** Minimum lengths for common field types. */
export const FIELD_MINIMUMS = {
  deviceName: 1,
  roomCode: 6,
  password: 8,
} as const;
