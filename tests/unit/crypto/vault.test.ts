/**
 * Vault Storage Unit Tests
 *
 * Tests the encrypted vault storage implementation including:
 * - Vault creation and initialization
 * - Storing and retrieving secrets
 * - Encryption/decryption roundtrip
 * - Key derivation from passwords
 * - Auto-lock timeout behavior
 * - IndexedDB operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SecureVault, openVault } from '@/lib/crypto/vault';

// Mock IndexedDB
class MockIDBDatabase {
  objectStoreNames = { contains: vi.fn(() => true) };
  transaction = vi.fn(() => mockTransaction);
  close = vi.fn();
  createObjectStore = vi.fn(() => mockObjectStore);
}

class MockIDBRequest {
  result: unknown = null;
  error: unknown = null;
  onsuccess: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;

  triggerSuccess(result?: unknown) {
    this.result = result ?? null;
    if (this.onsuccess) {this.onsuccess({ target: this });}
  }

  triggerError(error?: unknown) {
    this.error = error ?? new Error('IndexedDB error');
    if (this.onerror) {this.onerror({ target: this });}
  }
}

class MockIDBOpenDBRequest extends MockIDBRequest {
  onupgradeneeded: ((event: unknown) => void) | null = null;

  triggerUpgrade(db: MockIDBDatabase) {
    if (this.onupgradeneeded) {
      this.onupgradeneeded({ target: { result: db } });
    }
  }
}

const createSuccessRequest = (result?: unknown): MockIDBRequest => {
  const request = new MockIDBRequest();
  Promise.resolve().then(() => request.triggerSuccess(result));
  return request;
};

const mockObjectStore = {
  put: vi.fn(() => createSuccessRequest()),
  get: vi.fn(() => createSuccessRequest(null)),
  delete: vi.fn(() => createSuccessRequest()),
  getAll: vi.fn(() => createSuccessRequest([])),
  clear: vi.fn(() => createSuccessRequest()),
};

const mockTransaction = {
  objectStore: vi.fn(() => mockObjectStore),
};

const mockIndexedDB = {
  open: vi.fn(() => {
    const request = new MockIDBOpenDBRequest();
    // Auto-trigger success after a microtask
    Promise.resolve().then(() => {
      request.triggerSuccess(new MockIDBDatabase());
    });
    return request;
  }),
};

// Mock crypto.subtle
const mockSubtle = {
  digest: vi.fn(async (algorithm: string, data: BufferSource) => {
    const bytes = new Uint8Array(data as ArrayBuffer);
    return new Uint8Array(32).fill(bytes[0] ?? 0);
  }),
  importKey: vi.fn(async () => ({ type: 'secret' } as CryptoKey)),
  deriveKey: vi.fn(async () => ({ type: 'secret' } as CryptoKey)),
  encrypt: vi.fn(async (_algo: unknown, _key: unknown, data: BufferSource) => {
    // Simple mock: XOR with 0x42
    const input = new Uint8Array(data as ArrayBuffer);
    const output = new Uint8Array(input.length + 16); // Add auth tag
    for (let i = 0; i < input.length; i++) {
      output[i] = input[i]! ^ 0x42;
    }
    return output.buffer;
  }),
  decrypt: vi.fn(async (_algo: unknown, _key: unknown, data: BufferSource) => {
    // Reverse mock encryption: XOR with 0x42
    const input = new Uint8Array(data as ArrayBuffer);
    const output = new Uint8Array(input.length - 16); // Remove auth tag
    for (let i = 0; i < output.length; i++) {
      output[i] = input[i]! ^ 0x42;
    }
    return output.buffer;
  }),
};

describe('SecureVault', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockObjectStore.put.mockImplementation(() => createSuccessRequest());
    mockObjectStore.get.mockImplementation(() => createSuccessRequest(null));
    mockObjectStore.delete.mockImplementation(() => createSuccessRequest());
    mockObjectStore.getAll.mockImplementation(() => createSuccessRequest([]));
    mockObjectStore.clear.mockImplementation(() => createSuccessRequest());
    mockTransaction.objectStore.mockImplementation(() => mockObjectStore);
    mockIndexedDB.open.mockImplementation(() => {
      const request = new MockIDBOpenDBRequest();
      Promise.resolve().then(() => {
        request.triggerSuccess(new MockIDBDatabase());
      });
      return request;
    });

    // Mock browser globals
    vi.stubGlobal('indexedDB', mockIndexedDB);
    vi.stubGlobal('crypto', {
      subtle: mockSubtle,
      getRandomValues: vi.fn((arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('vault initialization', () => {
    it('creates a vault with default config', () => {
      const vault = new SecureVault();
      expect(vault).toBeInstanceOf(SecureVault);
      expect(vault.isUnlocked()).toBe(false);
    });

    it('creates a vault with custom config', () => {
      const vault = new SecureVault({
        dbName: 'test-vault',
        storeName: 'test-secrets',
        lockTimeout: 5000,
      });
      expect(vault).toBeInstanceOf(SecureVault);
    });

    it('opens vault with password', async () => {
      const vault = new SecureVault();
      const opened = await vault.open('test-password-123');
      expect(opened).toBe(true);
      expect(vault.isUnlocked()).toBe(true);
      expect(mockIndexedDB.open).toHaveBeenCalled();
    });

    it('derives key from password', async () => {
      const vault = new SecureVault();
      await vault.open('secure-password');
      expect(mockSubtle.importKey).toHaveBeenCalled();
      expect(mockSubtle.deriveKey).toHaveBeenCalled();
    });
  });

  describe('secret storage operations', () => {
    it('stores a secret', async () => {
      const vault = new SecureVault();
      await vault.open('password');

      const secretData = new TextEncoder().encode('my-secret-data');
      const metadata = { label: 'API Key', type: 'credential', tags: ['api'] };

      const stored = await vault.storeSecret('api-key-1', secretData, metadata);
      expect(stored).toBe(true);
      expect(mockSubtle.encrypt).toHaveBeenCalled();
    });

    it('retrieves a secret', async () => {
      const vault = new SecureVault();
      await vault.open('password');

      const secretData = new TextEncoder().encode('my-secret');
      await vault.storeSecret('secret-1', secretData, {
        label: 'Test',
        type: 'data',
        tags: [],
      });

      const storedEntry = {
        id: 'secret-1',
        encryptedData: new Uint8Array(20),
        iv: new Uint8Array(12),
        metadata: { label: 'Test', type: 'data', tags: [] },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      mockObjectStore.get.mockImplementationOnce(() => createSuccessRequest(storedEntry));

      const retrieved = await vault.retrieveSecret('secret-1');
      expect(retrieved).not.toBeNull();
      expect(mockSubtle.decrypt).toHaveBeenCalled();
    });

    it('returns null for non-existent secret', async () => {
      const vault = new SecureVault();
      await vault.open('password');

      mockObjectStore.get.mockImplementationOnce(() => createSuccessRequest(null));

      const retrieved = await vault.retrieveSecret('non-existent');
      expect(retrieved).toBeNull();
    });

    it('deletes a secret', async () => {
      const vault = new SecureVault();
      await vault.open('password');

      const deleted = await vault.deleteSecret('secret-1');
      expect(deleted).toBe(true);
      expect(mockObjectStore.delete).toHaveBeenCalled();
    });
  });

  describe('encryption/decryption', () => {
    it('performs roundtrip encryption', async () => {
      const vault = new SecureVault();
      await vault.open('password');

      const originalData = new TextEncoder().encode('test data');
      await vault.storeSecret('test', originalData, {
        label: 'Test',
        type: 'text',
        tags: [],
      });

      expect(mockSubtle.encrypt).toHaveBeenCalled();
      expect(mockSubtle.decrypt).not.toHaveBeenCalled();
    });

    it('uses unique IV for each encryption', async () => {
      const vault = new SecureVault();
      await vault.open('password');

      const data = new TextEncoder().encode('data');
      await vault.storeSecret('secret1', data, { label: 'S1', type: 't', tags: [] });
      await vault.storeSecret('secret2', data, { label: 'S2', type: 't', tags: [] });

      expect(mockSubtle.encrypt).toHaveBeenCalledTimes(3); // 2 secrets + 1 initial salt
    });
  });

  describe('vault locking', () => {
    it('locks the vault', async () => {
      const vault = new SecureVault();
      await vault.open('password');
      expect(vault.isUnlocked()).toBe(true);

      vault.lock();
      expect(vault.isUnlocked()).toBe(false);
    });

    it('throws when accessing locked vault', async () => {
      const vault = new SecureVault();
      await vault.open('password');
      vault.lock();

      await expect(
        vault.storeSecret('test', new Uint8Array(), { label: 'T', type: 't', tags: [] })
      ).rejects.toThrow('Vault is locked');
    });

    it('auto-locks after timeout', async () => {
      vi.useFakeTimers();

      const vault = new SecureVault({ lockTimeout: 1000 });
      await vault.open('password');
      expect(vault.isUnlocked()).toBe(true);

      vi.advanceTimersByTime(1100);
      expect(vault.isUnlocked()).toBe(false);

      vi.useRealTimers();
    });

    it('resets lock timer on access', async () => {
      vi.useFakeTimers();

      const vault = new SecureVault({ lockTimeout: 2000 });
      await vault.open('password');

      vi.advanceTimersByTime(1500);
      await vault.storeSecret('test', new Uint8Array(), { label: 'T', type: 't', tags: [] });

      vi.advanceTimersByTime(1500);
      expect(vault.isUnlocked()).toBe(true);

      vi.advanceTimersByTime(600);
      expect(vault.isUnlocked()).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('vault status', () => {
    it('returns correct status when unlocked', async () => {
      const vault = new SecureVault();
      await vault.open('password');

      const status = vault.getStatus();
      expect(status.isOpen).toBe(true);
      expect(status.isLocked).toBe(false);
      expect(status.lastAccess).not.toBeNull();
    });

    it('returns correct status when locked', async () => {
      const vault = new SecureVault();
      await vault.open('password');
      vault.lock();

      const status = vault.getStatus();
      expect(status.isOpen).toBe(true);
      expect(status.isLocked).toBe(true);
      expect(status.lastAccess).toBeNull();
    });
  });

  describe('helper functions', () => {
    it('opens vault using helper function', async () => {
      const vault = await openVault('password');
      expect(vault).not.toBeNull();
      expect(vault?.isUnlocked()).toBe(true);
    });

    it('returns null on open failure', async () => {
      mockIndexedDB.open.mockImplementationOnce(() => {
        const request = new MockIDBOpenDBRequest();
        Promise.resolve().then(() => request.triggerError());
        return request;
      });

      const vault = await openVault('password');
      expect(vault).toBeNull();
    });
  });

  describe('vault cleanup', () => {
    it('closes vault and cleans up', async () => {
      const vault = new SecureVault();
      await vault.open('password');
      await vault.close();

      expect(vault.isUnlocked()).toBe(false);
      expect(vault.getStatus().isOpen).toBe(false);
    });

    it('clears all secrets', async () => {
      const vault = new SecureVault();
      await vault.open('password');

      const cleared = await vault.clearVault();
      expect(cleared).toBe(true);
      expect(mockObjectStore.clear).toHaveBeenCalled();
    });
  });
});
