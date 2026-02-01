'use client';

/**
 * Transfer History Storage (IndexedDB)
 * Persistent storage for transfer records
 */

export interface TransferRecord {
    id: string;
    direction: 'send' | 'receive';
    files: Array<{
        name: string;
        size: number;
        type: string;
    }>;
    totalSize: number;
    peerName: string;
    peerEmail?: string;
    peerId: string;
    status: 'completed' | 'failed' | 'cancelled';
    startedAt: Date;
    completedAt: Date;
    duration: number; // ms
    speed: number; // bytes/sec average
}

const DB_NAME = 'TallowDB';
const DB_VERSION = 1;
const STORE_NAME = 'transfers';

/**
 * Serialized format stored in IndexedDB
 */
interface SerializedTransferRecord {
    id: string;
    direction: 'send' | 'receive';
    files: Array<{
        name: string;
        size: number;
        type: string;
    }>;
    totalSize: number;
    peerName: string;
    peerEmail?: string;
    peerId: string;
    status: 'completed' | 'failed' | 'cancelled';
    startedAt: string;
    completedAt: string;
    duration: number;
    speed: number;
}

let db: IDBDatabase | null = null;

// Open database
async function openDB(): Promise<IDBDatabase> {
    if (db) {return db;}

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('direction', 'direction', { unique: false });
                store.createIndex('status', 'status', { unique: false });
                store.createIndex('startedAt', 'startedAt', { unique: false });
                store.createIndex('peerEmail', 'peerEmail', { unique: false });
            }
        };
    });
}

// Add a transfer record
export async function addTransferRecord(record: TransferRecord): Promise<void> {
    const database = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.add({
            ...record,
            startedAt: record.startedAt.toISOString(),
            completedAt: record.completedAt.toISOString(),
        });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Get all transfer records
export async function getAllTransfers(): Promise<TransferRecord[]> {
    const database = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const records = (request.result as SerializedTransferRecord[]).map((r: SerializedTransferRecord) => ({
                ...r,
                startedAt: new Date(r.startedAt),
                completedAt: new Date(r.completedAt),
            }));
            // Sort by date, newest first
            records.sort((a: TransferRecord, b: TransferRecord) =>
                b.startedAt.getTime() - a.startedAt.getTime()
            );
            resolve(records);
        };
        request.onerror = () => reject(request.error);
    });
}

// Get transfers by direction
export async function getTransfersByDirection(direction: 'send' | 'receive'): Promise<TransferRecord[]> {
    const all = await getAllTransfers();
    return all.filter(r => r.direction === direction);
}

// Get transfers by date range
export async function getTransfersByDateRange(start: Date, end: Date): Promise<TransferRecord[]> {
    const all = await getAllTransfers();
    return all.filter(r => r.startedAt >= start && r.startedAt <= end);
}

// Get recent transfers (last N)
export async function getRecentTransfers(limit: number = 20): Promise<TransferRecord[]> {
    const all = await getAllTransfers();
    return all.slice(0, limit);
}

// Get transfer statistics
export async function getTransferStats(): Promise<{
    totalTransfers: number;
    totalSent: number;
    totalReceived: number;
    totalDataSent: number;
    totalDataReceived: number;
    averageSpeed: number;
}> {
    const all = await getAllTransfers();

    const sent = all.filter(r => r.direction === 'send');
    const received = all.filter(r => r.direction === 'receive');

    const totalDataSent = sent.reduce((acc, r) => acc + r.totalSize, 0);
    const totalDataReceived = received.reduce((acc, r) => acc + r.totalSize, 0);

    const totalSpeed = all.reduce((acc, r) => acc + r.speed, 0);

    return {
        totalTransfers: all.length,
        totalSent: sent.length,
        totalReceived: received.length,
        totalDataSent,
        totalDataReceived,
        averageSpeed: all.length > 0 ? totalSpeed / all.length : 0,
    };
}

// Delete a transfer record
export async function deleteTransfer(id: string): Promise<void> {
    const database = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Clear all history
export async function clearHistory(): Promise<void> {
    const database = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Export history as JSON
export async function exportHistory(): Promise<string> {
    const all = await getAllTransfers();
    return JSON.stringify(all, null, 2);
}

// Format data size for display
export function formatDataSize(bytes: number): string {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default {
    addTransferRecord,
    getAllTransfers,
    getTransfersByDirection,
    getTransfersByDateRange,
    getRecentTransfers,
    getTransferStats,
    deleteTransfer,
    clearHistory,
    exportHistory,
    formatDataSize,
};
