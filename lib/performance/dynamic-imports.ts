/**
 * Dynamic Import Helpers for Code Splitting
 *
 * Provides lazy-loaded wrappers for heavy components that are not needed
 * on initial render. Uses React.lazy + Suspense with Skeleton fallbacks
 * to improve LCP and reduce initial bundle size.
 *
 * @module lib/performance/dynamic-imports
 */

import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface DynamicImportOptions {
  /** Retry count on import failure */
  retries?: number;
  /** Delay between retries in ms */
  retryDelay?: number;
}

// ============================================================================
// GENERIC LAZY LOADER WITH RETRY
// ============================================================================

/**
 * Create a lazy-loaded component with retry logic for network failures.
 * Retries the dynamic import up to `retries` times before throwing.
 */
function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: DynamicImportOptions = {}
): LazyExoticComponent<T> {
  const { retries = 2, retryDelay = 1500 } = options;

  return lazy(async () => {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError;
  });
}

// ============================================================================
// TRANSFER PAGE COMPONENTS (heavy, not needed on initial render)
// ============================================================================

/**
 * ChatPanel - Lazy loaded because it includes message parsing, emoji support,
 * and socket integration. Not visible until user opens the chat drawer.
 */
export const LazyChatPanel = lazyWithRetry(
  () => import('@/components/transfer/ChatPanel')
);

/**
 * FriendsList - Lazy loaded because friends tab is not the default view.
 * Only loaded when user switches to the "Friends" tab.
 */
export const LazyFriendsList = lazyWithRetry(
  () => import('@/components/transfer/FriendsList').then((mod) => ({
    default: mod.FriendsList,
  }))
);

/**
 * TransferHistory - Lazy loaded because history sidebar is hidden by default.
 * Only loaded when user clicks "History" button.
 */
export const LazyTransferHistory = lazyWithRetry(
  () => import('@/components/transfer/TransferHistory').then((mod) => ({
    default: mod.TransferHistory,
  }))
);

// ============================================================================
// CRYPTO WORKER LOADER
// ============================================================================

let cryptoWorkerInstance: Worker | null = null;
let cryptoWorkerPromise: Promise<Worker> | null = null;

/**
 * Lazily create the crypto web worker. The worker is only instantiated
 * when a transfer actually begins, avoiding the cost of loading WASM
 * crypto modules on page load.
 *
 * @example
 * const worker = await getCryptoWorker();
 * worker.postMessage({ type: 'encrypt', id: '1', payload: { data, key, nonce } });
 */
export function getCryptoWorker(): Promise<Worker> {
  if (cryptoWorkerInstance) {
    return Promise.resolve(cryptoWorkerInstance);
  }

  if (cryptoWorkerPromise) {
    return cryptoWorkerPromise;
  }

  cryptoWorkerPromise = new Promise<Worker>((resolve, reject) => {
    try {
      const worker = new Worker(
        new URL('@/lib/workers/crypto.worker.ts', import.meta.url),
        { type: 'module' }
      );

      const handleReady = (event: MessageEvent) => {
        if (event.data?.type === 'ready') {
          worker.removeEventListener('message', handleReady);
          cryptoWorkerInstance = worker;
          resolve(worker);
        }
      };

      const handleError = (error: ErrorEvent) => {
        worker.removeEventListener('error', handleError);
        cryptoWorkerPromise = null;
        reject(new Error(`Crypto worker failed to load: ${error.message}`));
      };

      worker.addEventListener('message', handleReady);
      worker.addEventListener('error', handleError);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!cryptoWorkerInstance) {
          worker.removeEventListener('message', handleReady);
          worker.removeEventListener('error', handleError);
          worker.terminate();
          cryptoWorkerPromise = null;
          reject(new Error('Crypto worker load timed out'));
        }
      }, 10_000);
    } catch (error) {
      cryptoWorkerPromise = null;
      reject(error);
    }
  });

  return cryptoWorkerPromise;
}

/**
 * Terminate the crypto worker to free resources.
 * Call this when the user navigates away from the transfer page.
 */
export function terminateCryptoWorker(): void {
  if (cryptoWorkerInstance) {
    cryptoWorkerInstance.terminate();
    cryptoWorkerInstance = null;
    cryptoWorkerPromise = null;
  }
}

// ============================================================================
// HEAVY LIBRARY LOADERS
// ============================================================================

/**
 * Dynamically import QR code library only when needed.
 * Used for room code display - not needed on initial page load.
 */
export async function loadQRCodeLib(): Promise<typeof import('qrcode')> {
  const mod = await import('qrcode');
  return mod;
}

/**
 * Dynamically import JSZip only when user wants to send/receive folders.
 */
export async function loadJSZip(): Promise<typeof import('jszip')> {
  const mod = await import('jszip');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (mod as any).default ?? mod;
}

/**
 * Dynamically import the EXIF reader only when metadata stripping is needed.
 */
export async function loadExifReader(): Promise<typeof import('exifreader')> {
  const mod = await import('exifreader');
  return mod;
}

// ============================================================================
// PRELOAD HELPERS
// ============================================================================

const preloadedModules = new Set<string>();

/**
 * Preload a component module in the background during idle time.
 * Call this on hover or when the user shows intent to navigate.
 *
 * @example
 * <button onMouseEnter={() => preloadComponent('transfer-history')}>
 *   History
 * </button>
 */
export function preloadComponent(
  componentId: 'chat-panel' | 'friends-list' | 'transfer-history' | 'qrcode' | 'jszip'
): void {
  if (preloadedModules.has(componentId)) {
    return;
  }

  preloadedModules.add(componentId);

  const load = () => {
    switch (componentId) {
      case 'chat-panel':
        import('@/components/transfer/ChatPanel').catch(() => {
          preloadedModules.delete(componentId);
        });
        break;
      case 'friends-list':
        import('@/components/transfer/FriendsList').catch(() => {
          preloadedModules.delete(componentId);
        });
        break;
      case 'transfer-history':
        import('@/components/transfer/TransferHistory').catch(() => {
          preloadedModules.delete(componentId);
        });
        break;
      case 'qrcode':
        import('qrcode').catch(() => {
          preloadedModules.delete(componentId);
        });
        break;
      case 'jszip':
        import('jszip').catch(() => {
          preloadedModules.delete(componentId);
        });
        break;
    }
  };

  // Use requestIdleCallback to avoid blocking the main thread
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(load, { timeout: 3000 });
  } else if (typeof window !== 'undefined') {
    setTimeout(load, 200);
  }
}
