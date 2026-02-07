/**
 * Stripe Create Checkout Session API Route
 * POST /api/stripe/create-checkout-session
 *
 * Creates a Stripe Checkout session for subscription purchase
 */

import { NextRequest, NextResponse } from 'next/server';
import { jsonResponse, ApiErrors } from '@/lib/api/response';
import { withAPIMetrics } from '@/lib/middleware/api-metrics';
import { moderateRateLimiter } from '@/lib/middleware/rate-limit';
import { getStripeService } from '@/lib/payments/stripe-service';
import { isValidPriceId } from '@/lib/payments/pricing-config';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// REQUEST VALIDATION SCHEMA
// ============================================================================

const CreateCheckoutSessionSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url('Success URL must be a valid URL'),
  cancelUrl: z.string().url('Cancel URL must be a valid URL'),
  customerEmail: z.string().email('Invalid email address').optional(),
  customerId: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

type CreateCheckoutSessionRequest = z.infer<typeof CreateCheckoutSessionSchema>;

// ============================================================================
// HANDLER
// ============================================================================

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const rateLimitResult = moderateRateLimiter.check(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Check if Stripe is configured
    const stripeService = getStripeService();
    if (!stripeService.isConfigured()) {
      return ApiErrors.serviceUnavailable(
        'Payment service is not configured. Please contact support.',
        60
      );
    }

    // Parse request body
    let body: CreateCheckoutSessionRequest;
    try {
      const rawBody = await request.json();
      body = CreateCheckoutSessionSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ApiErrors.badRequest('Validation failed', {
          errors: (error as z.ZodError).issues.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return ApiErrors.badRequest('Invalid request body');
    }

    // Validate price ID against known prices
    if (!isValidPriceId(body.priceId)) {
      return ApiErrors.badRequest('Invalid price ID', {
        priceId: body.priceId,
        message: 'The provided price ID is not recognized. Please select a valid plan.',
      });
    }

    // Validate that either customerEmail or customerId is provided
    if (!body.customerEmail && !body.customerId) {
      return ApiErrors.badRequest('Either customerEmail or customerId must be provided');
    }

    // Create checkout session
    let sessionResult;
    try {
      sessionResult = await stripeService.createCheckoutSession({
        priceId: body.priceId,
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl,
        ...(body.customerEmail ? { customerEmail: body.customerEmail } : {}),
        ...(body.customerId ? { customerId: body.customerId } : {}),
        ...(body.metadata ? { metadata: body.metadata } : {}),
      });
    } catch (error) {
      console.error('Failed to create checkout session:', error);

      if (error instanceof Error) {
        // Check for specific Stripe errors
        if (error.message.includes('price')) {
          return ApiErrors.badRequest('Invalid price configuration', {
            message: 'The selected price is not valid or has been deleted.',
          });
        }
        if (error.message.includes('customer')) {
          return ApiErrors.badRequest('Invalid customer', {
            message: 'The provided customer ID is not valid.',
          });
        }
      }

      return ApiErrors.internalError('Failed to create checkout session');
    }

    // Return session details
    return jsonResponse(
      {
        success: true,
        sessionId: sessionResult.sessionId,
        url: sessionResult.url,
      },
      200
    );
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return ApiErrors.internalError('An unexpected error occurred');
  }
}

// ============================================================================
// METHOD NOT ALLOWED HANDLER
// ============================================================================

async function handleOtherMethods(_request: NextRequest): Promise<NextResponse> {
  return ApiErrors.methodNotAllowed(['POST']);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const POST = withAPIMetrics(handlePOST);
export const GET = withAPIMetrics(handleOtherMethods);
export const PUT = withAPIMetrics(handleOtherMethods);
export const DELETE = withAPIMetrics(handleOtherMethods);
export const PATCH = withAPIMetrics(handleOtherMethods);
