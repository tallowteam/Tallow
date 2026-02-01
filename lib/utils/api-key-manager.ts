/**
 * Client-Side API Key Manager
 * Manages API key storage and retrieval for client-side API calls
 */

const API_KEY_STORAGE_KEY = 'tallow_api_key';

/**
 * Get API key from environment or localStorage
 */
export function getApiKey(): string | null {
  // First try environment variable (for server-side or build-time config)
  if (typeof process !== 'undefined' && process.env['NEXT_PUBLIC_API_KEY']) {
    return process.env['NEXT_PUBLIC_API_KEY'];
  }

  // Fall back to localStorage (for client-side config)
  if (typeof window !== 'undefined') {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  }

  return null;
}

/**
 * Set API key in localStorage
 */
export function setApiKey(apiKey: string): void {
  if (typeof window === 'undefined') {
    throw new Error('Cannot set API key on server-side');
  }

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API key cannot be empty');
  }

  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
}

/**
 * Remove API key from localStorage
 */
export function clearApiKey(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
}

/**
 * Check if API key is configured
 */
export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

/**
 * Get API key for fetch requests
 * Throws error if not configured
 */
export function requireApiKey(): string {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API key not configured. Please set API_SECRET_KEY in environment or configure in settings.');
  }
  return apiKey;
}

/**
 * Create headers with API key for fetch requests
 */
export function createApiHeaders(additionalHeaders: Record<string, string> = {}): Headers {
  const headers = new Headers(additionalHeaders);

  const apiKey = getApiKey();
  if (apiKey) {
    headers.set('x-api-key', apiKey);
  }

  return headers;
}

/**
 * Fetch with automatic API key injection
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiKey = requireApiKey();

  const headers = new Headers(options.headers);
  headers.set('x-api-key', apiKey);

  return fetch(url, {
    ...options,
    headers,
  });
}
