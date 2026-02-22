// transfer.ts — File transfer UI logic
// Handles drag-and-drop, file chunking, send/receive orchestration, and progress display

import { getContext, getWebSocket } from './app.js';
import {
    blake3Hash,
    computeFileManifest,
    parseFileManifest,
    TransferSession,
    sanitizeDisplayText,
    encodeFileAccept,
} from './wasm.js';

// ============================================================================
// Constants
// ============================================================================

const CHUNK_SIZE = 65536; // 64 KiB — must match CLI
const SIZE_WARN = 1024 * 1024 * 1024; // 1 GiB soft warning
const SIZE_BLOCK = 4 * 1024 * 1024 * 1024; // 4 GiB hard block

// ============================================================================
// State
// ============================================================================

interface TransferState {
    files: File[];
    totalSize: number;
    totalChunks: number;
    chunksTransferred: number;
    startTime: number;
    lastUpdateTime: number;
    lastUpdateBytes: number;
    receivedChunks: Map<number, Uint8Array>;
    receiveManifest: any | null;
    isReceiving: boolean;
    isSending: boolean;
    transferHistory: TransferRecord[];
}

interface TransferRecord {
    timestamp: number;
    files: number;
    totalSize: number;
    duration: number;
    speed: number;
    direction: 'sent' | 'received';
}

const state: TransferState = {
    files: [],
    totalSize: 0,
    totalChunks: 0,
    chunksTransferred: 0,
    startTime: 0,
    lastUpdateTime: 0,
    lastUpdateBytes: 0,
    receivedChunks: new Map(),
    receiveManifest: null,
    isReceiving: false,
    isSending: false,
    transferHistory: [],
};

// ============================================================================
// Initialization
// ============================================================================

export function initTransferUI(): void {
    wireDropZone();
    wireFileInputs();
    wireSendButton();
    loadTransferHistory();
}

// ============================================================================
// Drop Zone
// ============================================================================

function wireDropZone(): void {
    const dropZone = document.getElementById('drop-zone');
    if (!dropZone) return;

    dropZone.addEventListener('dragover', (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');

        if (e.dataTransfer?.files) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    });

    dropZone.addEventListener('click', () => {
        const input = document.getElementById('file-input') as HTMLInputElement;
        if (input) input.click();
    });
}

// ============================================================================
// File Inputs
// ============================================================================

function wireFileInputs(): void {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const folderInput = document.getElementById('folder-input') as HTMLInputElement;
    const btnAddFiles = document.getElementById('btn-add-files');
    const btnAddFolder = document.getElementById('btn-add-folder');

    if (fileInput) {
        fileInput.addEventListener('change', () => {
            if (fileInput.files) {
                addFiles(Array.from(fileInput.files));
                fileInput.value = ''; // Reset for re-selection
            }
        });
    }

    if (folderInput) {
        folderInput.addEventListener('change', () => {
            if (folderInput.files) {
                addFiles(Array.from(folderInput.files));
                folderInput.value = '';
            }
        });
    }

    if (btnAddFiles) {
        btnAddFiles.addEventListener('click', (e) => {
            e.stopPropagation();
            if (fileInput) fileInput.click();
        });
    }

    if (btnAddFolder) {
        btnAddFolder.addEventListener('click', (e) => {
            e.stopPropagation();
            if (folderInput) folderInput.click();
        });
    }
}

// ============================================================================
// File Management
// ============================================================================

function addFiles(newFiles: File[]): void {
    // Validate sizes
    let hasWarning = false;
    let hasBlock = false;

    for (const file of newFiles) {
        if (file.size > SIZE_BLOCK) {
            hasBlock = true;
        } else if (file.size > SIZE_WARN) {
            hasWarning = true;
        }
    }

    if (hasBlock) {
        showSizeWarning('error', 'Files larger than 4 GiB are not supported in the browser. Use the CLI for large transfers.');
        return;
    }

    state.files.push(...newFiles);
    state.totalSize = state.files.reduce((sum, f) => sum + f.size, 0);
    state.totalChunks = state.files.reduce((sum, f) => sum + Math.ceil(f.size / CHUNK_SIZE) || 1, 0);

    if (state.totalSize > SIZE_BLOCK) {
        showSizeWarning('error', 'Total size exceeds 4 GiB. Use the CLI for large transfers.');
        state.files = state.files.slice(0, -newFiles.length); // Remove added files
        return;
    }

    if (hasWarning || state.totalSize > SIZE_WARN) {
        showSizeWarning('warning', `Large transfer (${formatBytes(state.totalSize)}). Consider using the CLI for better performance.`);
    }

    renderFileList();
}

function removeFile(index: number): void {
    state.files.splice(index, 1);
    state.totalSize = state.files.reduce((sum, f) => sum + f.size, 0);
    state.totalChunks = state.files.reduce((sum, f) => sum + Math.ceil(f.size / CHUNK_SIZE) || 1, 0);
    renderFileList();
}

function renderFileList(): void {
    const listEl = document.getElementById('file-list');
    const dropZone = document.getElementById('drop-zone');
    const sendControls = document.getElementById('send-controls');
    const warningEl = document.getElementById('file-size-warning');

    if (!listEl) return;

    if (state.files.length === 0) {
        listEl.classList.add('hidden');
        if (dropZone) dropZone.classList.remove('hidden');
        if (sendControls) sendControls.classList.add('hidden');
        return;
    }

    // Show file list, keep drop zone visible for adding more
    listEl.classList.remove('hidden');
    if (sendControls) sendControls.classList.remove('hidden');

    listEl.innerHTML = '';
    for (let i = 0; i < state.files.length; i++) {
        const file = state.files[i];
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <span class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
            <span class="file-size">${formatBytes(file.size)}</span>
            <span class="file-remove" data-index="${i}" title="Remove">&times;</span>
        `;
        listEl.appendChild(item);
    }

    // Add total
    if (state.files.length > 1) {
        const total = document.createElement('div');
        total.className = 'file-item';
        total.style.borderTop = '1px solid var(--border)';
        total.style.marginTop = '0.25rem';
        total.style.paddingTop = '0.625rem';
        total.innerHTML = `
            <span class="file-name" style="font-weight: 600;">${state.files.length} files</span>
            <span class="file-size" style="font-weight: 600;">${formatBytes(state.totalSize)}</span>
        `;
        listEl.appendChild(total);
    }

    // Wire remove buttons
    listEl.querySelectorAll('.file-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt((e.target as HTMLElement).dataset.index || '0');
            removeFile(idx);
        });
    });
}

function showSizeWarning(type: 'warning' | 'error', message: string): void {
    const el = document.getElementById('file-size-warning');
    if (!el) return;
    el.className = type === 'error' ? 'size-error' : 'size-warning';
    el.textContent = message;
    el.classList.remove('hidden');
}

// ============================================================================
// Send Button
// ============================================================================

function wireSendButton(): void {
    const btn = document.getElementById('btn-send-files');
    if (btn) {
        btn.addEventListener('click', () => {
            if (state.files.length > 0 && !state.isSending) {
                startSend();
            }
        });
    }
}

// ============================================================================
// Send Flow
// ============================================================================

async function startSend(): Promise<void> {
    const ctx = getContext();
    if (!ctx.transferSession || !ctx.ws) return;

    state.isSending = true;
    state.chunksTransferred = 0;
    state.startTime = Date.now();
    state.lastUpdateTime = state.startTime;
    state.lastUpdateBytes = 0;

    // Build manifest
    const fileDescs = state.files.map(f => ({
        name: f.name,
        size: f.size,
        path: (f as any).webkitRelativePath || f.name,
    }));

    const manifestBytes = computeFileManifest(JSON.stringify(fileDescs));

    // Send FileOffer
    const offerMsg = ctx.transferSession.prepareFileOffer(manifestBytes);
    sendWsBytes(offerMsg);

    // Show progress UI
    const dropZone = document.getElementById('drop-zone');
    const sendControls = document.getElementById('send-controls');
    const progress = document.getElementById('transfer-progress');
    if (dropZone) dropZone.classList.add('hidden');
    if (sendControls) sendControls.classList.add('hidden');
    if (progress) progress.classList.remove('hidden');
}

/**
 * Called when peer accepts our file offer — actually send the chunks.
 */
export async function handleFileSend(): Promise<void> {
    const ctx = getContext();
    if (!ctx.transferSession || !ctx.ws) return;

    let globalChunkIndex = 0;
    let totalBytes = 0;

    for (const file of state.files) {
        let offset = 0;
        while (offset < file.size || (file.size === 0 && offset === 0)) {
            const end = Math.min(offset + CHUNK_SIZE, file.size);
            const slice = file.slice(offset, end);
            const buffer = await slice.arrayBuffer();
            const plaintext = new Uint8Array(buffer);

            const isLast = offset + CHUNK_SIZE >= file.size &&
                file === state.files[state.files.length - 1];
            const total = isLast ? state.totalChunks : undefined;

            const chunkMsg = ctx.transferSession.prepareChunk(
                globalChunkIndex,
                total,
                plaintext
            );

            sendWsBytes(chunkMsg);

            globalChunkIndex++;
            offset += CHUNK_SIZE;
            totalBytes += plaintext.length;

            // Update progress
            state.chunksTransferred = globalChunkIndex;
            updateProgress(globalChunkIndex, state.totalChunks, totalBytes);

            // Yield to UI thread periodically
            if (globalChunkIndex % 16 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            // Handle empty file (single iteration)
            if (file.size === 0) break;
        }
    }

    // Compute overall hash
    // For now, use a simple hash of the total bytes sent
    const hashBytes = blake3Hash(new Uint8Array([...new TextEncoder().encode(String(totalBytes))]));
    const completeMsg = ctx.transferSession.prepareTransferComplete(hashBytes, undefined);
    sendWsBytes(completeMsg);

    // Show completion
    showTransferSummary('sent', state.files.length, state.totalSize, Date.now() - state.startTime);
    state.isSending = false;
}

// ============================================================================
// Receive Flow
// ============================================================================

export function handleFileOffer(offer: any): void {
    const ctx = getContext();
    const manifestBytes = new Uint8Array(offer.manifest);
    const transferId = new Uint8Array(offer.transfer_id);

    // Update transfer session with the offer's transfer ID
    if (ctx.sessionKey) {
        ctx.transferId = transferId;
        ctx.transferSession = new TransferSession(ctx.sessionKey, transferId);
    }

    try {
        const manifest = parseFileManifest(manifestBytes);
        state.receiveManifest = manifest;
        state.totalChunks = manifest.total_chunks || 0;
        state.totalSize = manifest.total_size || 0;
        state.receivedChunks.clear();
        state.chunksTransferred = 0;
        state.isReceiving = true;

        // Show accept/reject UI
        const offerEl = document.getElementById('receive-offer');
        const detailsEl = document.getElementById('offer-details');
        if (offerEl) offerEl.classList.remove('hidden');
        if (detailsEl) {
            const files = manifest.files || [];
            let html = `<p style="font-weight: 600; margin-bottom: 0.5rem;">Incoming Transfer</p>`;
            html += `<p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">`;
            html += `${files.length} file${files.length !== 1 ? 's' : ''} &middot; ${formatBytes(state.totalSize)}`;
            html += `</p>`;
            for (const file of files.slice(0, 10)) {
                const safeName = sanitizeDisplayText(file.path || file.name || 'unknown');
                html += `<div class="file-item"><span class="file-name">${escapeHtml(safeName)}</span>`;
                html += `<span class="file-size">${formatBytes(file.size || 0)}</span></div>`;
            }
            if (files.length > 10) {
                html += `<p style="color: var(--text-muted); font-size: 0.8rem;">... and ${files.length - 10} more</p>`;
            }
            detailsEl.innerHTML = html;
        }
    } catch (e) {
        console.error('Failed to parse manifest:', e);
    }
}

export function handleChunkReceived(chunk: any): void {
    const ctx = getContext();
    if (!ctx.transferSession) return;

    try {
        const index = chunk.index;
        const encryptedData = new Uint8Array(chunk.data);

        // Decrypt chunk
        const plaintext = ctx.transferSession.decryptChunk(index, encryptedData);
        state.receivedChunks.set(index, plaintext);

        // Send ack
        const ackMsg = ctx.transferSession.prepareAck(index);
        sendWsBytes(ackMsg);

        // Update progress
        state.chunksTransferred++;
        const totalBytes = Array.from(state.receivedChunks.values())
            .reduce((sum, c) => sum + c.length, 0);
        updateProgress(state.chunksTransferred, state.totalChunks, totalBytes);

        // Start time tracking on first chunk
        if (state.chunksTransferred === 1) {
            state.startTime = Date.now();
            state.lastUpdateTime = state.startTime;
            state.lastUpdateBytes = 0;

            // Show progress bar
            const progress = document.getElementById('transfer-progress');
            if (progress) progress.classList.remove('hidden');
        }
    } catch (e) {
        console.error('Failed to decrypt chunk:', e);
    }
}

export function handleTransferComplete(complete: any): void {
    state.isReceiving = false;

    // Assemble file from chunks
    if (state.receiveManifest) {
        assembleAndDownload();
    }

    showTransferSummary('received',
        state.receiveManifest?.files?.length || 0,
        state.totalSize,
        Date.now() - state.startTime
    );
}

function assembleAndDownload(): void {
    if (!state.receiveManifest || !state.receiveManifest.files) return;

    const files = state.receiveManifest.files;
    let chunkOffset = 0;

    for (const file of files) {
        const chunkCount = file.chunk_count || 1;
        const parts: Uint8Array[] = [];

        for (let i = 0; i < chunkCount; i++) {
            const chunk = state.receivedChunks.get(chunkOffset + i);
            if (chunk) parts.push(chunk);
        }

        chunkOffset += chunkCount;

        // Create blob and download
        const blob = new Blob(parts as BlobPart[]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.path || file.name || `file_${chunkOffset}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    // Clear received chunks to free memory
    state.receivedChunks.clear();
}

// ============================================================================
// Progress Display
// ============================================================================

function updateProgress(chunksComplete: number, totalChunks: number, bytesTransferred: number): void {
    const now = Date.now();

    // Throttle UI updates to ~4 per second
    if (now - state.lastUpdateTime < 250 && chunksComplete < totalChunks) return;

    const percent = totalChunks > 0 ? Math.round((chunksComplete / totalChunks) * 100) : 0;
    const elapsed = (now - state.startTime) / 1000; // seconds
    const speed = elapsed > 0 ? bytesTransferred / elapsed : 0;
    const remaining = speed > 0 ? (state.totalSize - bytesTransferred) / speed : 0;

    // Update DOM
    const barEl = document.getElementById('progress-bar');
    const percentEl = document.getElementById('progress-percent');
    const speedEl = document.getElementById('progress-speed');
    const etaEl = document.getElementById('progress-eta');

    if (barEl) barEl.style.width = `${percent}%`;
    if (percentEl) percentEl.textContent = `${percent}%`;
    if (speedEl) speedEl.textContent = `${formatBytes(speed)}/s`;
    if (etaEl) etaEl.textContent = formatTime(remaining);

    state.lastUpdateTime = now;
    state.lastUpdateBytes = bytesTransferred;
}

// ============================================================================
// Transfer Summary
// ============================================================================

function showTransferSummary(direction: 'sent' | 'received', fileCount: number, totalSize: number, durationMs: number): void {
    const summaryEl = document.getElementById('transfer-summary');
    const progressEl = document.getElementById('transfer-progress');
    if (!summaryEl) return;

    const speed = durationMs > 0 ? totalSize / (durationMs / 1000) : 0;
    const durationSec = durationMs / 1000;

    summaryEl.innerHTML = `
        <h3>Transfer Complete</h3>
        <div class="summary-row">
            <span class="summary-label">Direction</span>
            <span class="summary-value">${direction === 'sent' ? 'Sent' : 'Received'}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Files</span>
            <span class="summary-value">${fileCount}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Total Size</span>
            <span class="summary-value">${formatBytes(totalSize)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Duration</span>
            <span class="summary-value">${durationSec.toFixed(1)}s</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Average Speed</span>
            <span class="summary-value">${formatBytes(speed)}/s</span>
        </div>
    `;

    summaryEl.classList.remove('hidden');
    if (progressEl) progressEl.classList.add('hidden');

    // Save to history
    saveTransferRecord({
        timestamp: Date.now(),
        files: fileCount,
        totalSize,
        duration: durationMs,
        speed,
        direction,
    });
}

// ============================================================================
// Transfer History
// ============================================================================

function loadTransferHistory(): void {
    try {
        const stored = localStorage.getItem('tallow-transfer-history');
        if (stored) {
            state.transferHistory = JSON.parse(stored);
            renderTransferHistory();
        }
    } catch (e) {
        state.transferHistory = [];
    }
}

function saveTransferRecord(record: TransferRecord): void {
    state.transferHistory.unshift(record);
    // Keep last 50 entries
    if (state.transferHistory.length > 50) {
        state.transferHistory = state.transferHistory.slice(0, 50);
    }
    localStorage.setItem('tallow-transfer-history', JSON.stringify(state.transferHistory));
    renderTransferHistory();
}

function renderTransferHistory(): void {
    const listEl = document.getElementById('history-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    for (const record of state.transferHistory.slice(0, 10)) {
        const item = document.createElement('div');
        item.className = 'history-item';
        const date = new Date(record.timestamp);
        item.innerHTML = `
            <span>${record.direction === 'sent' ? '\u{2B06}' : '\u{2B07}'} ${record.files} file${record.files !== 1 ? 's' : ''} (${formatBytes(record.totalSize)})</span>
            <span>${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        `;
        listEl.appendChild(item);
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, Math.min(i, units.length - 1));
    return `${value.toFixed(i > 0 ? 2 : 0)} ${units[Math.min(i, units.length - 1)]}`;
}

function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function sendWsBytes(bytes: Uint8Array): void {
    const ws = getWebSocket();
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(bytes);
    }
}
