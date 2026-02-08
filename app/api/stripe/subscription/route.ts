/**
 * Stripe Subscription Status API Route
 * GET /api/stripe/subscription
 *
 * Retrieves current subscription status for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { jsonResponse, ApiErrors } from '@/lib/api/response';
import { withAPIMetrics } from '@/lib/middleware/api-metrics';
import { generousRateLimiter } from '@/lib/middleware/rate-limit';
import { getStripeService } from '@/lib/payments/stripe-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// HANDLER
// ============================================================================

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const rateLimitResult = generousRateLimiter.check(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // SECURITY: Require authentication via API key or session
    // This prevents IDOR vulnerability where anyone could query any customer's subscription
    const apiKey = request.headers.get('x-api-key');
    const internalApiKey = process.env['INTERNAL_API_KEY'];

    if (!apiKey || !internalApiKey || apiKey !== internalApiKey) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'API Key required',
          'Content-Type': 'text/plain',
        }
      });
    }

    // Check if Stripe is configured
    const stripeService = getStripeService();
    if (!stripeService.isConfigured()) {
      return ApiErrors.serviceUnavailable(
        'Payment service is not configured',
        60
      );
    }

    // Get customer ID from query params
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return ApiErrors.badRequest('Customer ID is required');
    }

    // Validate customer exists
    const customer = await stripeService.getCustomer(customerId);
    if (!customer) {
      return ApiErrors.notFound('Customer not found');
    }

    // Get active subscription
    const subscription = await stripeService.getActiveSubscription(customerId);

    if (!subscription) {
      return jsonResponse({
        hasSubscription: false,
        plan: 'free',
      }, 200);
    }

    return jsonResponse({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    }, 200);
  } catch (error) {
    console.error('Subscription status check error:', error);
    return ApiErrors.internalError('Failed to retrieve subscription status');
  }
}

// ============================================================================
// METHOD NOT ALLOWED HANDLER
// ============================================================================

async function handleOtherMethods(_request: NextRequest): Promise<NextResponse> {
  return ApiErrors.methodNotAllowed(['GET']);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const GET = withAPIMetrics(handleGET);
export const POST = withAPIMetrics(handleOtherMethods);
export const PUT = withAPIMetrics(handleOtherMethods);
export const DELETE = withAPIMetrics(handleOtherMethods);
export const PATCH = withAPIMetrics(handleOtherMethods);
