/**
 * Form System Barrel Export
 * Agent 036 -- FORM-ARCHITECT
 */

// Validators and schemas
export {
  // Primitive validators
  required,
  minLength,
  maxLength,
  pattern,
  email,
  // Domain schemas
  roomCodeSchema,
  deviceNameSchema,
  passwordSchema,
  fileNameSchema,
  saveLocationSchema,
  maxConcurrentTransfersSchema,
  timeSchema,
  // Composite schemas
  profileSettingsSchema,
  connectionSettingsSchema,
  silentHoursSchema,
  // Password strength
  evaluatePasswordStrength,
  // Validation runner
  validateWithSchema,
  validateField,
  // Types
  type PasswordStrength,
  type PasswordStrengthResult,
  type ValidationError,
  type ValidationResult,
} from './validators';

// Form policy
export {
  requiredFieldMessage,
  invalidFieldMessage,
  focusFieldById,
  focusFirstError,
  deriveAriaIds,
  buildDescribedBy,
  FIELD_LIMITS,
  FIELD_MINIMUMS,
} from './form-policy';

// Hook
export {
  useFormValidation,
  type FieldSchemaMap,
  type FieldErrors,
  type FieldTouched,
  type UseFormValidationReturn,
} from './use-form-validation';
