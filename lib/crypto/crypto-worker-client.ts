'use client';

/**
 * Crypto Worker Client
 * Provides a clean API for using the crypto WebWorker
 */

import { generateUUID } from '../utils/uuid';

type WorkerResponse = {
    id: string;
    success: boolean;
    result?: unknown;
    error?: string;
};

class CryptoWorkerClient {
    private worker: Worker | null = null;
    private pendingRequests: Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }> = new Map();
    private isReady = false;
    private readyPromise: Promise<void> | null = null;

    /**
     * Initialize the worker
     */
    async init(): Promise<void> {
        if (this.worker) return;
        if (typeof window === 'undefined') return;

        // Create worker
        this.worker = new Worker(
            new URL('../workers/crypto.worker.ts', import.meta.url),
            { type: 'module' }
        );

        // Set up message handler
        this.worker.onmessage = (event: MessageEvent<WorkerResponse | { type: 'ready' }>) => {
            if ('type' in event.data && event.data.type === 'ready') {
                this.isReady = true;
                return;
            }

            const { id, success, result, error } = event.data as WorkerResponse;
            const pending = this.pendingRequests.get(id);

            if (pending) {
                this.pendingRequests.delete(id);
                if (success) {
                    pending.resolve(result);
                } else {
                    pending.reject(new Error(error || 'Worker error'));
                }
            }
        };

        // Wait for ready signal
        this.readyPromise = new Promise((resolve) => {
            const checkReady = () => {
                if (this.isReady) {
                    resolve();
                } else {
                    setTimeout(checkReady, 10);
                }
            };
            checkReady();
        });

        await this.readyPromise;
    }

    /**
     * Send a request to the worker
     */
    private async request<T>(type: string, payload: unknown): Promise<T> {
        if (!this.worker) {
            await this.init();
        }

        const id = generateUUID();

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, {
                resolve: resolve as (value: unknown) => void,
                reject
            });
            this.worker?.postMessage({ type, id, payload });
        });
    }

    /**
     * Encrypt data using AES-256-GCM
     */
    async encrypt(data: ArrayBuffer, key: ArrayBuffer): Promise<{ ciphertext: ArrayBuffer; nonce: ArrayBuffer }> {
        return this.request('encrypt', { data, key });
    }

    /**
     * Decrypt data using AES-256-GCM
     */
    async decrypt(ciphertext: ArrayBuffer, key: ArrayBuffer, nonce: ArrayBuffer): Promise<ArrayBuffer> {
        return this.request('decrypt', { ciphertext, key, nonce });
    }

    /**
     * Hash data using SHA-256
     */
    async hash(data: ArrayBuffer): Promise<ArrayBuffer> {
        return this.request('hash', { data });
    }

    /**
     * Derive key from password
     */
    async deriveKey(password: string, salt: ArrayBuffer): Promise<ArrayBuffer> {
        return this.request('derive-key', { password, salt });
    }

    /**
     * Terminate the worker
     */
    terminate(): void {
        this.worker?.terminate();
        this.worker = null;
        this.isReady = false;
        this.pendingRequests.clear();
    }
}

// Export singleton instance
export const cryptoWorker = new CryptoWorkerClient();

// Export for testing
export default CryptoWorkerClient;
