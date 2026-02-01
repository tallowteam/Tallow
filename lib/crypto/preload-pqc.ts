'use client';

import { secureLog } from '../utils/secure-logger';

/**
 * PQC Module Preloading
 * Preloads heavy PQC modules in the background
 *
 * Usage:
 * - Call preloadAllPQC() when user hovers over "Send Files" button
 * - Call preloadAllPQC() on app page mount to start loading early
 * - Call on route navigation to /app to prepare for file transfers
 */

import { preloadPQCCrypto, lazyPQCrypto } from './pqc-crypto-lazy';
import { preloadFileEncryption } from './file-encryption-pqc-lazy';

export interface PreloadStatus {
  pqcCrypto: boolean;
  allLoaded: boolean;
}

/**
 * Get current preload status
 */
export function getPreloadStatus(): PreloadStatus {
  return {
    pqcCrypto: lazyPQCrypto.isLoaded(),
    allLoaded: lazyPQCrypto.isLoaded(),
  };
}

/**
 * Preload all PQC modules in the background
 * Call this early to reduce latency when user starts a transfer
 */
export async function preloadAllPQC(): Promise<void> {
  await Promise.all([
    preloadPQCCrypto(),
    preloadFileEncryption(),
  ]);
}

/**
 * Preload on hover (for button interactions)
 * Usage: onMouseEnter={preloadOnHover}
 */
export function preloadOnHover(): void {
  preloadAllPQC().catch(err => {
    secureLog.error('Failed to preload PQC modules:', err);
  });
}

/**
 * Preload on route navigation
 * Usage: useEffect(() => { preloadOnMount(); }, []);
 */
export function preloadOnMount(): void {
  // Start preloading after a short delay to not block initial render
  setTimeout(() => {
    preloadAllPQC().catch(err => {
      secureLog.error('Failed to preload PQC modules:', err);
    });
  }, 100);
}

/**
 * Check if PQC modules are ready
 * Returns true if all modules are loaded and ready
 */
export function isPQCReady(): boolean {
  return getPreloadStatus().allLoaded;
}

export default {
  preloadAllPQC,
  preloadOnHover,
  preloadOnMount,
  getPreloadStatus,
  isPQCReady,
};
