/**
 * Contacts / Friends API Route
 * Agent 099 — CONTACTS-FRIENDS-AGENT
 *
 * CRUD operations for the user's contact list.
 * Contacts are stored client-side (IndexedDB via secure storage)
 * and can be exported/imported via this API for backup.
 *
 * POST /api/contacts — Add a contact
 * GET /api/contacts — List contacts (from encrypted payload)
 * DELETE /api/contacts — Remove a contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { jsonResponse, ApiErrors } from '@/lib/api/response';
import { withAPIMetrics } from '@/lib/middleware/api-metrics';
import { moderateRateLimiter } from '@/lib/middleware/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ContactSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  name: z.string().min(1, 'Name is required').max(100),
  publicKey: z.string().optional(),
  lastSeen: z.number().optional(),
  trusted: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

const DeleteContactSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * POST /api/contacts — Validate and echo back a contact for client storage.
 * Server does NOT persist contacts — this is for validation only.
 * Client stores contacts in encrypted IndexedDB.
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const rateLimitResult = moderateRateLimiter.check(request);
    if (rateLimitResult) {return rateLimitResult;}

    let body;
    try {
      const rawBody = await request.json();
      body = ContactSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ApiErrors.badRequest('Validation failed', {
          errors: error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return ApiErrors.badRequest('Invalid request body');
    }

    return jsonResponse({
      success: true,
      contact: {
        ...body,
        addedAt: Date.now(),
        trusted: body.trusted ?? false,
      },
    }, 201);
  } catch (error) {
    console.error('Contact creation error:', error);
    return ApiErrors.internalError('Failed to process contact');
  }
}

/**
 * GET /api/contacts — Return contact list format specification.
 * Actual contacts are stored client-side; this endpoint provides schema info.
 */
async function handleGET(_request: NextRequest): Promise<NextResponse> {
  return jsonResponse({
    success: true,
    schema: {
      version: '1.0.0',
      fields: ['deviceId', 'name', 'publicKey', 'lastSeen', 'trusted', 'notes'],
      storage: 'client-side-encrypted',
      exportFormat: 'application/json',
    },
  }, 200);
}

/**
 * DELETE /api/contacts — Validate contact deletion request.
 */
async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const rateLimitResult = moderateRateLimiter.check(request);
    if (rateLimitResult) {return rateLimitResult;}

    let body;
    try {
      const rawBody = await request.json();
      body = DeleteContactSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ApiErrors.badRequest('Validation failed', {
          errors: error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return ApiErrors.badRequest('Invalid request body');
    }

    return jsonResponse({
      success: true,
      deleted: body.deviceId,
    }, 200);
  } catch (error) {
    console.error('Contact deletion error:', error);
    return ApiErrors.internalError('Failed to process deletion');
  }
}

async function handleMethodNotAllowed(_request: NextRequest): Promise<NextResponse> {
  return ApiErrors.methodNotAllowed(['GET', 'POST', 'DELETE']);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const GET = withAPIMetrics(handleGET);
export const POST = withAPIMetrics(handlePOST);
export const DELETE = withAPIMetrics(handleDELETE);
export const PUT = withAPIMetrics(handleMethodNotAllowed);
export const PATCH = withAPIMetrics(handleMethodNotAllowed);
