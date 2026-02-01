/**
 * Vitest setup file
 * Polyfills browser globals needed by pqc-kyber WASM module
 */
import { webcrypto } from 'crypto';
import '@testing-library/jest-dom/vitest';

// pqc-kyber WASM module expects `self` to exist (browser global)
if (typeof globalThis.self === 'undefined') {
  (globalThis as any).self = globalThis;
}

// Ensure crypto.getRandomValues is available (Node 18+ has it, but WASM expects it on self)
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

// Mock localStorage for tests
class LocalStorageMock {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] || null;
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new LocalStorageMock();
}

// Mock indexedDB for tests (fully functional implementation)
if (typeof globalThis.indexedDB === 'undefined') {
  // In-memory storage for IndexedDB mock
  const stores = new Map<string, Map<string, any>>();

  const indexedDBMock = {
    open: (name: string, version?: number) => {
      const request = {
        result: null as any,
        error: null as any,
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any,
      };

      // Simulate async operation
      setTimeout(() => {
        // Initialize store if needed
        if (!stores.has(name)) {
          stores.set(name, new Map());
        }

        const db = {
          name,
          version: version || 1,
          objectStoreNames: {
            contains: (storeName: string) => stores.get(name)?.has(storeName) || false,
          },
          createObjectStore: (storeName: string) => {
            const store = stores.get(name);
            if (store && !store.has(storeName)) {
              store.set(storeName, new Map());
            }
            return {};
          },
          transaction: (storeName: string | string[], _mode: string) => {
            const storeNames = Array.isArray(storeName) ? storeName : [storeName];
            const dbStores = stores.get(name);

            // Ensure all stores exist
            storeNames.forEach(sn => {
              if (dbStores && !dbStores.has(sn)) {
                dbStores.set(sn, new Map());
              }
            });

            const transaction = {
              objectStore: (sn: string) => {
                const storeData = dbStores?.get(sn) || new Map();

                return {
                  get: (key: string) => {
                    const getRequest = {
                      result: storeData.get(key) || null,
                      error: null as any,
                      onsuccess: null as any,
                      onerror: null as any,
                    };
                    setTimeout(() => {
                      if (getRequest.onsuccess) {
                        getRequest.onsuccess();
                      }
                      // Trigger transaction complete after operation
                      setTimeout(() => {
                        if (transaction.oncomplete) {
                          transaction.oncomplete();
                        }
                      }, 0);
                    }, 0);
                    return getRequest;
                  },
                  put: (value: any, key: string) => {
                    const putRequest = {
                      result: key,
                      error: null as any,
                      onsuccess: null as any,
                      onerror: null as any,
                    };
                    setTimeout(() => {
                      storeData.set(key, value);
                      if (putRequest.onsuccess) {
                        putRequest.onsuccess();
                      }
                      // Trigger transaction complete after operation
                      setTimeout(() => {
                        if (transaction.oncomplete) {
                          transaction.oncomplete();
                        }
                      }, 0);
                    }, 0);
                    return putRequest;
                  },
                  delete: (key: string) => {
                    const deleteRequest = {
                      result: undefined,
                      error: null as any,
                      onsuccess: null as any,
                      onerror: null as any,
                    };
                    setTimeout(() => {
                      storeData.delete(key);
                      if (deleteRequest.onsuccess) {
                        deleteRequest.onsuccess();
                      }
                      // Trigger transaction complete after operation
                      setTimeout(() => {
                        if (transaction.oncomplete) {
                          transaction.oncomplete();
                        }
                      }, 0);
                    }, 0);
                    return deleteRequest;
                  },
                  clear: () => {
                    const clearRequest = {
                      result: undefined,
                      error: null as any,
                      onsuccess: null as any,
                      onerror: null as any,
                    };
                    setTimeout(() => {
                      storeData.clear();
                      if (clearRequest.onsuccess) {
                        clearRequest.onsuccess();
                      }
                      // Trigger transaction complete after operation
                      setTimeout(() => {
                        if (transaction.oncomplete) {
                          transaction.oncomplete();
                        }
                      }, 0);
                    }, 0);
                    return clearRequest;
                  },
                };
              },
              oncomplete: null as any,
            };

            return transaction;
          },
          close: () => {},
        };

        request.result = db;

        // Trigger upgrade if needed (first time or version change)
        if (request.onupgradeneeded) {
          request.onupgradeneeded();
        }

        // Then trigger success
        if (request.onsuccess) {
          request.onsuccess();
        }
      }, 0);

      return request;
    },
  };

  (globalThis as any).indexedDB = indexedDBMock;
}
