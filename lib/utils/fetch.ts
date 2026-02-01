'use client';

/**
 * Fetch Utilities
 * Secure fetch wrapper with CSRF protection
 */

import { withCSRF } from '../security/csrf';

/**
 * Secure fetch wrapper that automatically includes CSRF token
 * Use this instead of native fetch for all API requests
 */
export async function secureFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // Add CSRF token to request headers
  const secureInit = withCSRF(init);

  // Perform fetch
  return fetch(input, secureInit);
}

/**
 * Secure fetch with JSON parsing
 */
export async function secureFetchJSON<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await secureFetch(input, init);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

/**
 * POST request with JSON body
 */
export async function securePost<T = unknown, B = unknown>(
  url: string,
  body: B
): Promise<T> {
  return secureFetchJSON<T>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/**
 * PUT request with JSON body
 */
export async function securePut<T = unknown, B = unknown>(
  url: string,
  body: B
): Promise<T> {
  return secureFetchJSON<T>(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request
 */
export async function secureDelete<T = unknown>(
  url: string
): Promise<T> {
  return secureFetchJSON<T>(url, {
    method: 'DELETE',
  });
}

/**
 * GET request with JSON parsing
 */
export async function secureGet<T = any>(
  url: string
): Promise<T> {
  return secureFetchJSON<T>(url, {
    method: 'GET',
  });
}

export default {
  secureFetch,
  secureFetchJSON,
  securePost,
  securePut,
  secureDelete,
  secureGet,
};
