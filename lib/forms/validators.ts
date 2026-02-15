/**
 * Form Validation Schemas and Utilities
 * Agent 036 -- FORM-ARCHITECT
 *
 * Comprehensive Zod-based validation for all Tallow form inputs.
 * Provides reusable schemas, individual validator functions, and
 * a type-safe validation runner.
 *
 * Validation rules:
 * - Room codes: 6 alphanumeric characters
 * - Device names: 1-32 characters, no special chars
 * - Passwords: min 8 chars, at least one letter and one number
 * - File names: no special chars, max 255 chars
 * - Save paths: non-empty, no null bytes
 * - Concurrent transfers: 1 | 2 | 3 | 5
 * - Silent hours times: HH:MM format
 */

import { z } from 'zod';

// ============================================================================
// PRIMITIVE VALIDATORS
// ============================================================================

/** Validates a value is not empty after trimming. */
export function required(fieldLabel: string): z.ZodString {
  return z.string().min(1, { message: `${fieldLabel} is required.` });
}

/** Validates a string meets a minimum length. */
export function minLength(fieldLabel: string, min: number): z.ZodString {
  return z.string().min(min, {
    message: `${fieldLabel} must be at least ${min} character${min === 1 ? '' : 's'}.`,
  });
}

/** Validates a string does not exceed a maximum length. */
export function maxLength(fieldLabel: string, max: number): z.ZodString {
  return z.string().max(max, {
    message: `${fieldLabel} must be at most ${max} character${max === 1 ? '' : 's'}.`,
  });
}

/** Validates a string matches a regex pattern. */
export function pattern(
  fieldLabel: string,
  regex: RegExp,
  guidance: string
): z.ZodString {
  return z.string().regex(regex, {
    message: `${fieldLabel} is invalid. ${guidance}`,
  });
}

/** Validates a string is a well-formed email address. */
export function email(fieldLabel: string = 'Email'): z.ZodString {
  return z.string().email({ message: `${fieldLabel} must be a valid email address.` });
}

// ============================================================================
// DOMAIN SCHEMAS
// ============================================================================

/**
 * Room code: exactly 6 alphanumeric characters, case-insensitive.
 * Displayed uppercase but user may type lowercase.
 */
export const roomCodeSchema = z
  .string()
  .trim()
  .min(1, { message: 'Room code is required.' })
  .transform((val) => val.toUpperCase())
  .pipe(
    z
      .string()
      .length(6, { message: 'Room code must be exactly 6 characters.' })
      .regex(/^[A-Z0-9]{6}$/, {
        message: 'Room code must contain only letters and numbers.',
      })
  );

/**
 * Device name: 1-32 characters. Letters, numbers, spaces, hyphens, underscores.
 * No leading/trailing whitespace.
 */
export const deviceNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'Device name is required.' })
  .max(32, { message: 'Device name must be at most 32 characters.' })
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9 _-]*$/, {
    message:
      'Device name must start with a letter or number and contain only letters, numbers, spaces, hyphens, and underscores.',
  });

/**
 * Password: minimum 8 characters, at least one letter and one number.
 * Suitable for crypto-related inputs (room passwords, export passwords).
 */
export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters.' })
  .refine((val) => /[a-zA-Z]/.test(val), {
    message: 'Password must contain at least one letter.',
  })
  .refine((val) => /[0-9]/.test(val), {
    message: 'Password must contain at least one number.',
  });

/**
 * File name: 1-255 characters, no path separators or null bytes.
 * Allows dots, hyphens, underscores, spaces, and most unicode.
 * Rejects characters that are unsafe on common filesystems.
 */
export const fileNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'File name is required.' })
  .max(255, { message: 'File name must be at most 255 characters.' })
  .refine((val) => !/[<>:"/\\|?*\x00-\x1f]/.test(val), {
    message:
      'File name contains invalid characters. Avoid < > : " / \\ | ? * and control characters.',
  });

/**
 * Save location: non-empty path, no null bytes.
 */
export const saveLocationSchema = z
  .string()
  .trim()
  .min(1, { message: 'Save location is required.' })
  .max(1024, { message: 'Save location path is too long.' })
  .refine((val) => !val.includes('\x00'), {
    message: 'Save location contains invalid characters.',
  });

/**
 * Maximum concurrent transfers: must be one of the allowed values.
 */
export const maxConcurrentTransfersSchema = z
  .number()
  .refine((val): val is 1 | 2 | 3 | 5 => [1, 2, 3, 5].includes(val), {
    message: 'Maximum concurrent transfers must be 1, 2, 3, or 5.',
  });

/**
 * Time string in HH:MM format for silent hours.
 */
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Time must be in HH:MM format (24-hour).',
  });

// ============================================================================
// COMPOSITE SCHEMAS (for full form validation)
// ============================================================================

/** Profile section of Settings */
export const profileSettingsSchema = z.object({
  deviceName: deviceNameSchema,
});

/** Connection section of Settings */
export const connectionSettingsSchema = z.object({
  saveLocation: saveLocationSchema,
  maxConcurrentTransfers: maxConcurrentTransfersSchema,
});

/** Silent hours validation */
export const silentHoursSchema = z
  .object({
    silentHoursStart: timeSchema,
    silentHoursEnd: timeSchema,
  })
  .refine(
    (data) => data.silentHoursStart !== data.silentHoursEnd,
    {
      message: 'Start time and end time must be different.',
      path: ['silentHoursEnd'],
    }
  );

// ============================================================================
// PASSWORD STRENGTH
// ============================================================================

export type PasswordStrength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number; // 0-4
  feedback: string[];
}

/**
 * Evaluates password strength on a 0-4 scale.
 * Criteria:
 * - Length >= 8 (+1), >= 12 (+1), >= 16 (+1)
 * - Has lowercase letter (+0.5)
 * - Has uppercase letter (+0.5)
 * - Has digit (+0.5)
 * - Has special character (+0.5)
 * - No common patterns (sequential, repeated) (-0.5 each)
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (password.length === 0) {
    return { strength: 'empty', score: 0, feedback: [] };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length scoring
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters.');
  }

  if (password.length >= 12) {
    score += 0.5;
  }

  if (password.length >= 16) {
    score += 0.5;
  }

  // Character variety
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  if (hasLower) score += 0.25;
  if (hasUpper) score += 0.25;
  if (hasDigit) score += 0.25;
  if (hasSpecial) score += 0.25;

  if (!hasLower && !hasUpper) {
    feedback.push('Add letters for a stronger password.');
  } else if (!hasUpper) {
    feedback.push('Add uppercase letters.');
  } else if (!hasLower) {
    feedback.push('Add lowercase letters.');
  }

  if (!hasDigit) {
    feedback.push('Add numbers.');
  }

  if (!hasSpecial) {
    feedback.push('Add special characters for extra strength.');
  }

  // Penalize common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 0.5;
    feedback.push('Avoid repeated characters.');
  }

  if (/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)/i.test(password)) {
    score -= 0.5;
    feedback.push('Avoid sequential characters.');
  }

  // Clamp score
  const clampedScore = Math.max(0, Math.min(4, Math.round(score)));

  const strengthMap: Record<number, PasswordStrength> = {
    0: 'weak',
    1: 'weak',
    2: 'fair',
    3: 'good',
    4: 'strong',
  };

  return {
    strength: strengthMap[clampedScore] ?? 'weak',
    score: clampedScore,
    feedback,
  };
}

// ============================================================================
// VALIDATION RUNNER
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
}

/**
 * Runs a Zod schema against data and returns a normalized result
 * with field-level errors suitable for form display.
 */
export function validateWithSchema<T>(
  schema: z.ZodType<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data, errors: [] };
  }

  const errors: ValidationError[] = result.error.issues.map((issue) => ({
    field: issue.path.join('.') || '_root',
    message: issue.message,
  }));

  return { success: false, errors };
}

/**
 * Validates a single field value against a Zod schema.
 * Returns null if valid, or the first error message if invalid.
 */
export function validateField<T>(
  schema: z.ZodType<T>,
  value: unknown
): string | null {
  const result = schema.safeParse(value);
  if (result.success) {
    return null;
  }
  return result.error.issues[0]?.message ?? 'Invalid value.';
}
