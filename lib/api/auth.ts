/**
 * API Authentication Utilities
 * Provides API key validation for protected endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { secureLog } from '@/lib/utils/secure-logger';
import { timingSafeStringCompare } from '@/lib/security/timing-safe';

/**
 * Validate API key from request headers
 * Returns true if valid, false otherwise
 *
 * SECURITY: API authentication is ALWAYS required in all environments.
 * Set API_SECRET_KEY in your .env file to enable API access.
 */
export function validateApiKey(request: NextRequest): boolean {
    const apiKey = request.headers.get('x-api-key');
    const validKey = process.env['API_SECRET_KEY'];

    // SECURITY FIX: Always require API_SECRET_KEY - no development bypass
    // This prevents staging/test environments from being unprotected
    if (!validKey) {
        secureLog.error('API_SECRET_KEY not configured - rejecting request. Set API_SECRET_KEY in .env');
        return false;
    }

    // Validate API key exists and use constant-time comparison
    if (!apiKey) {
        secureLog.warn('Missing X-API-Key header in request');
        return false;
    }

    // Use cryptographically-secure timing-safe comparison
    return timingSafeStringCompare(apiKey, validKey);
}

/**
 * Middleware to require API key authentication
 * Returns 401 Unauthorized response if invalid
 */
export function requireApiKey(request: NextRequest): NextResponse | null {
    if (!validateApiKey(request)) {
        return NextResponse.json(
            { error: 'Unauthorized - Invalid or missing API key' },
            { status: 401 }
        );
    }
    return null; // Valid - continue processing
}

/**
 * Generate a secure random API key
 * Use this to create API_SECRET_KEY for .env
 */
export function generateApiKey(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
