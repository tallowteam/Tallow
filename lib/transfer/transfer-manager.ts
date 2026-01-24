'use client';

import { Transfer, TransferEvent, FileInfo, Device } from '../types';
import { generateUUID } from '../utils/uuid';

// Maximum completed transfers to keep in memory
const MAX_COMPLETED_TRANSFERS = 100;

// Fields that cannot be overridden via updateTransfer
const PROTECTED_FIELDS = new Set(['id', 'from', 'to', 'files', 'direction', 'totalSize']);

// Valid state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
    pending: ['transferring', 'connecting', 'cancelled', 'failed'],
    connecting: ['transferring', 'failed', 'cancelled'],
    transferring: ['completed', 'failed', 'paused', 'cancelled'],
    paused: ['transferring', 'cancelled', 'failed'],
    // Terminal states: no transitions out
    completed: [],
    failed: [],
    cancelled: [],
};

class TransferManager {
    private static instance: TransferManager;
    private transfers: Map<string, Transfer> = new Map();
    private listeners: Set<(event: TransferEvent) => void> = new Set();

    private constructor() { }

    static getInstance(): TransferManager {
        if (!TransferManager.instance) {
            TransferManager.instance = new TransferManager();
        }
        return TransferManager.instance;
    }

    addTransfer(files: FileInfo[], from: Device, to: Device, direction: 'send' | 'receive'): Transfer {
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);

        const transfer: Transfer = {
            id: generateUUID(),
            files,
            from,
            to,
            status: 'pending',
            progress: 0,
            speed: 0,
            direction,
            totalSize,
            transferredSize: 0,
        };

        this.transfers.set(transfer.id, transfer);
        this.emit({ type: 'progress', transfer });
        return transfer;
    }

    getTransfer(id: string): Transfer | undefined {
        return this.transfers.get(id);
    }

    getAllTransfers(): Transfer[] {
        return Array.from(this.transfers.values());
    }

    getActiveTransfers(): Transfer[] {
        return this.getAllTransfers().filter(
            (t) => t.status === 'transferring' || t.status === 'connecting' || t.status === 'pending'
        );
    }

    updateTransfer(id: string, updates: Partial<Transfer>) {
        const transfer = this.transfers.get(id);
        if (!transfer) return;

        // Validate state transition if status is being changed
        if (updates.status && updates.status !== transfer.status) {
            const allowed = VALID_TRANSITIONS[transfer.status] || [];
            if (!allowed.includes(updates.status)) {
                return; // Invalid transition, ignore silently
            }
        }

        // Apply updates while protecting immutable fields
        for (const [key, value] of Object.entries(updates)) {
            if (!PROTECTED_FIELDS.has(key)) {
                (transfer as any)[key] = value;
            }
        }

        // Calculate ETA
        if (transfer.speed > 0 && transfer.status === 'transferring') {
            const remaining = transfer.totalSize - transfer.transferredSize;
            transfer.eta = Math.ceil(remaining / transfer.speed);
        }

        this.emit({ type: 'progress', transfer });
    }

    pauseTransfer(id: string) {
        const transfer = this.transfers.get(id);
        if (transfer && transfer.status === 'transferring') {
            this.updateTransfer(id, { status: 'paused' });
            this.emit({ type: 'paused', transfer: transfer });
        }
    }

    resumeTransfer(id: string) {
        const transfer = this.transfers.get(id);
        if (transfer && transfer.status === 'paused') {
            this.updateTransfer(id, { status: 'transferring' });
            this.emit({ type: 'resumed', transfer: transfer });
        }
    }

    cancelTransfer(id: string) {
        const transfer = this.transfers.get(id);
        if (transfer) {
            this.updateTransfer(id, { status: 'cancelled', endTime: new Date() });
            this.emit({ type: 'cancelled', transfer: transfer });
        }
    }

    completeTransfer(id: string) {
        const transfer = this.transfers.get(id);
        if (transfer) {
            this.updateTransfer(id, {
                status: 'completed',
                progress: 100,
                transferredSize: transfer.totalSize,
                endTime: new Date()
            });
            this.emit({ type: 'completed', transfer: transfer });
            this.trimOldTransfers();
        }
    }

    failTransfer(id: string, error: string) {
        const transfer = this.transfers.get(id);
        if (transfer) {
            this.updateTransfer(id, { status: 'failed', error, endTime: new Date() });
            this.emit({ type: 'failed', transfer: transfer });
        }
    }

    deleteTransfer(id: string) {
        this.transfers.delete(id);
    }

    clearCompleted() {
        const completed = this.getAllTransfers().filter(
            (t) => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled'
        );
        completed.forEach((t) => this.transfers.delete(t.id));
    }

    // Event listener system
    on(listener: (event: TransferEvent) => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private emit(event: TransferEvent) {
        this.listeners.forEach((listener) => listener(event));
    }

    // Calculate total progress across all active transfers
    getTotalProgress(): number {
        const active = this.getActiveTransfers();
        if (active.length === 0) return 0;

        const totalSize = active.reduce((acc, t) => acc + t.totalSize, 0);
        const transferred = active.reduce((acc, t) => acc + t.transferredSize, 0);

        return totalSize > 0 ? (transferred / totalSize) * 100 : 0;
    }

    // Calculate total speed across all active transfers
    getTotalSpeed(): number {
        return this.getActiveTransfers().reduce((acc, t) => acc + (t.speed || 0), 0);
    }

    // Remove oldest completed/failed/cancelled transfers if over limit
    private trimOldTransfers(): void {
        const terminal = this.getAllTransfers().filter(
            (t) => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled'
        );

        if (terminal.length > MAX_COMPLETED_TRANSFERS) {
            // Sort by endTime ascending (oldest first)
            terminal.sort((a, b) => {
                const aTime = a.endTime ? new Date(a.endTime).getTime() : 0;
                const bTime = b.endTime ? new Date(b.endTime).getTime() : 0;
                return aTime - bTime;
            });

            const toRemove = terminal.slice(0, terminal.length - MAX_COMPLETED_TRANSFERS);
            toRemove.forEach(t => this.transfers.delete(t.id));
        }
    }
}

export default TransferManager;
