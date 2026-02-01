/**
 * Request Validation Schemas
 * Zod schemas for API request validation
 *
 * INSTALLATION REQUIRED:
 * npm install zod
 */

import { z } from 'zod';

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email format').min(5).max(255);

/**
 * Name validation schema
 */
export const nameSchema = z.string().min(1, 'Name is required').max(100, 'Name too long').trim();

/**
 * Amount validation schema (in cents)
 */
export const amountSchema = z
  .number()
  .int('Amount must be an integer')
  .min(100, 'Minimum amount is $1.00')
  .max(99999900, 'Amount exceeds maximum');

/**
 * Share ID validation schema
 */
export const shareIdSchema = z
  .string()
  .min(8, 'Share ID too short')
  .max(64, 'Share ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid share ID format');

/**
 * File count validation schema
 */
export const fileCountSchema = z
  .number()
  .int('File count must be an integer')
  .min(1, 'At least one file required')
  .max(1000, 'Too many files');

/**
 * File size validation schema (in bytes)
 */
export const fileSizeSchema = z
  .number()
  .int('File size must be an integer')
  .min(0, 'File size cannot be negative')
  .max(4 * 1024 * 1024 * 1024, 'File too large'); // 4GB max

/**
 * Welcome Email Request Schema
 * POST /api/v1/send-welcome
 */
export const welcomeEmailRequestSchema = z.object({
  email: emailSchema,
  name: nameSchema,
});

export type WelcomeEmailRequest = z.infer<typeof welcomeEmailRequestSchema>;

/**
 * Share Email Request Schema
 * POST /api/v1/send-share-email
 */
export const shareEmailRequestSchema = z.object({
  email: emailSchema,
  shareId: shareIdSchema,
  senderName: nameSchema.optional(),
  fileCount: fileCountSchema,
  totalSize: fileSizeSchema,
});

export type ShareEmailRequest = z.infer<typeof shareEmailRequestSchema>;

/**
 * Stripe Checkout Request Schema
 * POST /api/v1/stripe/create-checkout-session
 */
export const stripeCheckoutRequestSchema = z.object({
  amount: amountSchema,
});

export type StripeCheckoutRequest = z.infer<typeof stripeCheckoutRequestSchema>;

/**
 * Generic validation error response
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate request body against schema
 * Returns parsed data if valid, throws with validation errors if invalid
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors
  const zodError = result.error;
  const errors: ValidationError[] = zodError.issues.map((err) => ({
    field: err.path.filter((p): p is string | number => typeof p === 'string' || typeof p === 'number').join('.'),
    message: err.message,
  }));

  return { success: false, errors };
}

/**
 * Middleware to validate request body
 * Returns null if valid, error response if invalid
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: Response }> {
  try {
    const body = await request.json();
    const result = validateRequest(schema, body);

    if (!result.success) {
      return {
        data: null,
        error: Response.json(
          {
            error: 'Validation failed',
            details: result.errors,
          },
          { status: 400 }
        ),
      };
    }

    return { data: result.data, error: null };
  } catch (_error) {
    return {
      data: null,
      error: Response.json(
        {
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      ),
    };
  }
}

export default {
  welcomeEmailRequestSchema,
  shareEmailRequestSchema,
  stripeCheckoutRequestSchema,
  validateRequest,
  validateRequestBody,
};
