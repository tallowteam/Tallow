'use client';

import secureLog from '@/lib/utils/secure-logger';
import { secureStorage } from './secure-storage';

/**
 * Transfer State Storage
 * Enables resumable transfers by persisting transfer progress
 */

const TRANSFER_STATE_KEY = 'Tallow_transfer_states';

export interface ChunkInfo {
    index: number;
    size: number;
    hash?: string; // SHA-256 hash for verification
    received: boolean;
}

export interface TransferState {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    totalChunks: number;
    chunkSize: number;
    receivedChunks: number[];
    receivedBytes: number;
    senderDeviceId: string;
    startedAt: Date;
    lastUpdated: Date;
    status: 'in-progress' | 'paused' | 'completed' | 'failed';
    chunks: ArrayBuffer[]; // Stored chunks (for IndexedDB migration later)
}

// Get all transfer states
export async function getTransferStates(): Promise<Record<string, TransferState>> {
    if (typeof window === 'undefined') return {};

    try {
        const stored = await secureStorage.getItem(TRANSFER_STATE_KEY);
        if (stored) {
            const states = JSON.parse(stored);
            // Convert dates
            Object.values(states).forEach((state: any) => {
                state.startedAt = new Date(state.startedAt);
                state.lastUpdated = new Date(state.lastUpdated);
            });
            return states;
        }
    } catch { }

    return {};
}

// Get a specific transfer state
export async function getTransferState(transferId: string): Promise<TransferState | null> {
    const states = await getTransferStates();
    return states[transferId] || null;
}

// Save transfer state
export async function saveTransferState(state: TransferState): Promise<void> {
    if (typeof window === 'undefined') return;

    const states = await getTransferStates();
    states[state.id] = {
        ...state,
        lastUpdated: new Date(),
        chunks: [], // Don't store chunks in localStorage (too large)
    };

    try {
        await secureStorage.setItem(TRANSFER_STATE_KEY, JSON.stringify(states));
    } catch (e) {
        secureLog.error('Failed to save transfer state');
    }
}

// Create new transfer state
export async function createTransferState(
    transferId: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    chunkSize: number,
    senderDeviceId: string
): Promise<TransferState> {
    const totalChunks = Math.ceil(fileSize / chunkSize);

    const state: TransferState = {
        id: transferId,
        fileName,
        fileType,
        fileSize,
        totalChunks,
        chunkSize,
        receivedChunks: [],
        receivedBytes: 0,
        senderDeviceId,
        startedAt: new Date(),
        lastUpdated: new Date(),
        status: 'in-progress',
        chunks: new Array(totalChunks).fill(null),
    };

    await saveTransferState(state);
    return state;
}

// Update transfer progress
export async function updateTransferProgress(
    transferId: string,
    chunkIndex: number,
    chunkData: ArrayBuffer
): Promise<TransferState | null> {
    const state = await getTransferState(transferId);
    if (!state) return null;

    if (!state.receivedChunks.includes(chunkIndex)) {
        state.receivedChunks.push(chunkIndex);
        state.receivedBytes += chunkData.byteLength;
    }

    state.chunks[chunkIndex] = chunkData;
    state.lastUpdated = new Date();

    if (state.receivedChunks.length === state.totalChunks) {
        state.status = 'completed';
    }

    await saveTransferState(state);
    return state;
}

// Mark transfer as paused (for resume later)
export async function pauseTransfer(transferId: string): Promise<void> {
    const state = await getTransferState(transferId);
    if (state && state.status === 'in-progress') {
        state.status = 'paused';
        await saveTransferState(state);
    }
}

// Get missing chunks for resume
export async function getMissingChunks(transferId: string): Promise<number[]> {
    const state = await getTransferState(transferId);
    if (!state) return [];

    const missing: number[] = [];
    for (let i = 0; i < state.totalChunks; i++) {
        if (!state.receivedChunks.includes(i)) {
            missing.push(i);
        }
    }
    return missing;
}

// Check if transfer can be resumed
export async function canResumeTransfer(transferId: string): Promise<boolean> {
    const state = await getTransferState(transferId);
    return state !== null &&
        (state.status === 'paused' || state.status === 'in-progress') &&
        state.receivedChunks.length < state.totalChunks;
}

// Get resumable transfers
export async function getResumableTransfers(): Promise<TransferState[]> {
    const states = await getTransferStates();
    return Object.values(states).filter(
        s => s.status === 'paused' || s.status === 'in-progress'
    );
}

// Remove transfer state
export async function removeTransferState(transferId: string): Promise<void> {
    const states = await getTransferStates();
    delete states[transferId];
    await secureStorage.setItem(TRANSFER_STATE_KEY, JSON.stringify(states));
}

// Clear all transfer states
export function clearAllTransferStates(): void {
    if (typeof window === 'undefined') return;
    secureStorage.removeItem(TRANSFER_STATE_KEY);
}

// Generate SHA-256 hash for chunk verification
export async function hashChunk(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default {
    getTransferStates,
    getTransferState,
    saveTransferState,
    createTransferState,
    updateTransferProgress,
    pauseTransfer,
    getMissingChunks,
    canResumeTransfer,
    getResumableTransfers,
    removeTransferState,
    clearAllTransferStates,
    hashChunk,
};
