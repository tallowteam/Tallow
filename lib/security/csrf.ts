'use client';

/**
 * CSRF Protection
 * Prevents Cross-Site Request Forgery attacks on API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import secureLog from '@/lib/utils/secure-logger';

const CSRF_TOKEN_HEADER = 'X-CSRF-Token';
const CSRF_COOKIE_NAME = 'csrf_token';
const TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  const buffer = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {return false;}

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validate CSRF token from request
 * Compares token in header against token in cookie
 */
export function validateCSRFToken(request: NextRequest): boolean {
  // Skip CSRF check for GET, HEAD, OPTIONS (read-only methods)
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  if (!headerToken) {
    secureLog.error('[CSRF] Missing CSRF token in header');
    return false;
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!cookieToken) {
    secureLog.error('[CSRF] Missing CSRF token in cookie');
    return false;
  }

  // Constant-time comparison
  const isValid = timingSafeEqual(headerToken, cookieToken);
  if (!isValid) {
    secureLog.error('[CSRF] Token mismatch');
  }

  return isValid;
}

/**
 * Middleware to require CSRF token validation
 * Returns null if valid, error response if invalid
 */
export function requireCSRFToken(request: NextRequest): NextResponse | null {
  if (!validateCSRFToken(request)) {
    return NextResponse.json(
      { error: 'CSRF token validation failed' },
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  return null;
}

/**
 * Get or create CSRF token for the session
 * Returns token that should be included in requests
 */
export function getCSRFToken(): string {
  if (typeof document === 'undefined') {
    return ''; // Server-side, return empty
  }

  // Check if token exists in cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME && value) {
      return value;
    }
  }

  // Generate new token
  const token = generateCSRFToken();

  // Set cookie (httpOnly: false so JS can read it)
  document.cookie = `${CSRF_COOKIE_NAME}=${token}; path=/; SameSite=Strict; Secure`;

  return token;
}

/**
 * Hook for React components to get CSRF token
 */
export function useCSRFToken(): string {
  if (typeof window === 'undefined') {return '';}

  // Ensure token exists
  return getCSRFToken();
}

/**
 * Add CSRF token to fetch request headers
 * @param init - RequestInit object
 * @param token - Optional token to use (for testing), otherwise fetches from cookie
 */
export function withCSRF(init?: RequestInit, token?: string): RequestInit {
  const csrfToken = token || getCSRFToken();

  // Convert existing headers to plain object if needed
  const existingHeaders: Record<string, string> = {};
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        existingHeaders[key] = value;
      });
    } else if (Array.isArray(init.headers)) {
      // Handle [string, string][] format
      init.headers.forEach(([key, value]) => {
        existingHeaders[key] = value;
      });
    } else {
      // Already a plain object
      Object.assign(existingHeaders, init.headers);
    }
  }

  return {
    ...init,
    headers: {
      ...existingHeaders,
      [CSRF_TOKEN_HEADER]: csrfToken,
    },
  };
}

/**
 * Server-side: Set CSRF token cookie in response
 */
export function setCSRFCookie(response: NextResponse, token?: string): NextResponse {
  const csrfToken = token || generateCSRFToken();

  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: csrfToken,
    path: '/',
    httpOnly: false, // Must be readable by JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}

/**
 * Initialize CSRF protection on page load
 */
export function initializeCSRF(): void {
  if (typeof window === 'undefined') {return;}

  // Ensure CSRF token exists
  getCSRFToken();
}

export default {
  generateCSRFToken,
  validateCSRFToken,
  requireCSRFToken,
  getCSRFToken,
  useCSRFToken,
  withCSRF,
  setCSRFCookie,
  initializeCSRF,
  CSRF_TOKEN_HEADER,
  CSRF_COOKIE_NAME,
};
