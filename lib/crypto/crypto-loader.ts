/**
 * Unified Crypto Module Loader
 * Performance-optimized lazy loading for all cryptographic modules
 *
 * Reduces initial bundle size by ~250KB through dynamic imports
 * and request idle callback preloading strategy.
 */

// Type imports removed - not needed for lazy loading

/**
 * Lazy load PQC crypto module (ML-KEM-768 + ML-DSA-65)
 * Bundle size: ~150KB
 */
export const loadPQCCrypto = () =>
  import('./pqc-crypto-lazy').then((m) => m);

/**
 * Lazy load file encryption module (ChaCha20-Poly1305)
 * Bundle size: ~50KB
 */
export const loadFileEncryption = () =>
  import('./file-encryption-pqc-lazy').then((m) => m);

/**
 * Lazy load digital signatures (Ed25519)
 * Bundle size: ~30KB
 */
export const loadDigitalSignatures = () =>
  import('./digital-signatures').then((m) => m);

/**
 * Lazy load password-based file encryption (Argon2 + AES)
 * Bundle size: ~80KB
 */
export const loadPasswordEncryption = () =>
  import('./password-file-encryption').then((m) => m);

/**
 * Lazy load PQ signatures (Dilithium/Falcon)
 * Bundle size: ~120KB
 */
export const loadPQSignatures = () =>
  import('./pq-signatures').then((m) => m);

/**
 * Lazy load triple ratchet protocol
 * Bundle size: ~40KB
 */
export const loadTripleRatchet = () =>
  import('./triple-ratchet').then((m) => m);

/**
 * Lazy load sparse PQ ratchet
 * Bundle size: ~35KB
 */
export const loadSparsePQRatchet = () =>
  import('./sparse-pq-ratchet').then((m) => m);

/**
 * Lazy load key management utilities
 * Bundle size: ~25KB
 */
export const loadKeyManagement = () =>
  import('./key-management').then((m) => m);

/**
 * Lazy load peer authentication
 * Bundle size: ~30KB
 */
export const loadPeerAuthentication = () =>
  import('./peer-authentication').then((m) => m);

/**
 * Preload crypto modules on idle
 * Call this on user interaction (hover, focus) to warm up cache
 */
export const preloadCrypto = () => {
  if (typeof window === 'undefined') {return;}

  // Use requestIdleCallback for non-blocking preload
  const preload = () => {
    // Preload most commonly used modules first
    loadPQCCrypto();
    loadFileEncryption();

    // Preload other modules on subsequent idle callbacks
    requestIdleCallback(() => {
      loadDigitalSignatures();
      loadKeyManagement();
    });

    requestIdleCallback(() => {
      loadPasswordEncryption();
      loadPeerAuthentication();
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(preload, { timeout: 2000 });
  } else {
    // Fallback for Safari
    setTimeout(preload, 100);
  }
};

/**
 * Preload on user interaction (button hover, focus)
 * Best practice: Call on transfer button mouseenter/focus
 */
export const preloadOnInteraction = () => {
  let preloaded = false;

  const preloadOnce = () => {
    if (!preloaded) {
      preloaded = true;
      preloadCrypto();
    }
  };

  // Attach to common interaction points
  if (typeof window !== 'undefined') {
    document.addEventListener('mouseenter', preloadOnce, {
      once: true,
      passive: true,
      capture: true,
    });
    document.addEventListener('focus', preloadOnce, {
      once: true,
      passive: true,
      capture: true,
    });
    document.addEventListener('touchstart', preloadOnce, {
      once: true,
      passive: true,
    });
  }
};

import { secureLog } from '../utils/secure-logger';

/**
 * Get crypto module with loading state
 * Usage: const [crypto, loading] = useCrypto()
 */
export async function getCryptoModule(): Promise<Awaited<ReturnType<typeof loadPQCCrypto>> | null> {
  try {
    const module = await loadPQCCrypto();
    return module;
  } catch (error) {
    secureLog.error('Failed to load crypto module:', error);
    return null;
  }
}

/**
 * Crypto loader hook interface
 * For use in React components
 */
export interface CryptoLoader {
  pqc: () => ReturnType<typeof loadPQCCrypto>;
  fileEncryption: () => ReturnType<typeof loadFileEncryption>;
  signatures: () => ReturnType<typeof loadDigitalSignatures>;
  password: () => ReturnType<typeof loadPasswordEncryption>;
  pqSignatures: () => ReturnType<typeof loadPQSignatures>;
  tripleRatchet: () => ReturnType<typeof loadTripleRatchet>;
  keyManagement: () => ReturnType<typeof loadKeyManagement>;
  peerAuth: () => ReturnType<typeof loadPeerAuthentication>;
}

/**
 * Get all crypto loaders
 */
export const cryptoLoaders: CryptoLoader = {
  pqc: loadPQCCrypto,
  fileEncryption: loadFileEncryption,
  signatures: loadDigitalSignatures,
  password: loadPasswordEncryption,
  pqSignatures: loadPQSignatures,
  tripleRatchet: loadTripleRatchet,
  keyManagement: loadKeyManagement,
  peerAuth: loadPeerAuthentication,
};

// Module size estimates for performance budgeting
export const MODULE_SIZES = {
  pqc: 150_000, // bytes
  fileEncryption: 50_000,
  signatures: 30_000,
  password: 80_000,
  pqSignatures: 120_000,
  tripleRatchet: 40_000,
  sparsePQRatchet: 35_000,
  keyManagement: 25_000,
  peerAuth: 30_000,
} as const;

export const TOTAL_CRYPTO_SIZE = Object.values(MODULE_SIZES).reduce(
  (sum, size) => sum + size,
  0
);

// Performance marker for tracking
if (typeof performance !== 'undefined' && performance.mark) {
  performance.mark('crypto-loader:initialized');
}
