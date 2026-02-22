// clipboard.ts -- Browser clipboard sharing integration
// Reads/writes clipboard via Clipboard API, with textarea fallback
// Sends clipboard content as encrypted data interoperable with `tallow clip`
import { getContext, sendWsBytesExport } from './app.js';
import { detectContentType, prepareClipboardManifest, parseClipboardContent, encryptChunk, encodeFileOffer, encodeChunk, sanitizeDisplayText, } from './wasm.js';
const clipState = {
    lastSharedTime: 0,
    lastSharedType: '',
    lastSharedSize: 0,
    isReceiving: false,
    fallbackVisible: false,
};
// ============================================================================
// Initialize clipboard UI
// ============================================================================
export function initClipboardUI() {
    // Wire fallback textarea paste handler
    const fallbackArea = document.getElementById('clipboard-fallback-area');
    if (fallbackArea) {
        fallbackArea.addEventListener('paste', async (e) => {
            e.preventDefault();
            const text = e.clipboardData?.getData('text/plain');
            if (text) {
                await sendClipboardText(text);
            }
        });
    }
}
// ============================================================================
// Share Clipboard (reading from browser clipboard)
// ============================================================================
/**
 * Read the clipboard and send its contents encrypted to the peer.
 * Requires user gesture (button click). Falls back to textarea if
 * Clipboard API permission is denied.
 */
export async function shareClipboard() {
    const statusEl = document.getElementById('clipboard-status');
    const ctx = getContext();
    if (!ctx.sessionKey || !ctx.ws) {
        if (statusEl)
            statusEl.textContent = 'Not connected.';
        return;
    }
    try {
        // Try text first
        const text = await navigator.clipboard.readText();
        if (text) {
            await sendClipboardText(text);
            return;
        }
        // Try images
        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                if (item.types.includes('image/png')) {
                    const blob = await item.getType('image/png');
                    const buffer = await blob.arrayBuffer();
                    await sendClipboardImage(new Uint8Array(buffer));
                    return;
                }
            }
        }
        catch (_imgErr) {
            // Image clipboard read not supported or denied
        }
        if (statusEl)
            statusEl.textContent = 'Clipboard is empty.';
    }
    catch (_err) {
        // Clipboard API denied -- show fallback textarea
        showClipboardFallback();
        if (statusEl)
            statusEl.textContent = 'Clipboard access denied. Paste content below.';
    }
}
/**
 * Send clipboard text content as an encrypted transfer.
 */
async function sendClipboardText(text) {
    const ctx = getContext();
    const statusEl = document.getElementById('clipboard-status');
    if (!ctx.sessionKey || !ctx.transferId)
        return;
    const contentType = detectContentType(text);
    const data = new TextEncoder().encode(text);
    // Build clipboard manifest
    const manifest = prepareClipboardManifest(contentType, BigInt(data.length));
    // Generate transfer ID for this clipboard transfer
    const clipTransferId = new Uint8Array(16);
    crypto.getRandomValues(clipTransferId);
    // Send FileOffer with manifest
    const offerMsg = encodeFileOffer(clipTransferId, manifest);
    sendWsBytesExport(offerMsg);
    // Encrypt and send data as a single chunk
    // Build AAD: transferId || chunkIndex(0).to_be_bytes()
    const aad = new Uint8Array(24); // 16 + 8
    aad.set(clipTransferId, 0);
    // chunkIndex 0: last 8 bytes are already zero
    const ciphertext = encryptChunk(ctx.sessionKey, BigInt(0), aad, data);
    const chunkMsg = encodeChunk(clipTransferId, BigInt(0), BigInt(1), ciphertext);
    sendWsBytesExport(chunkMsg);
    // Update state and UI
    clipState.lastSharedTime = Date.now();
    clipState.lastSharedType = contentType;
    clipState.lastSharedSize = data.length;
    updateClipboardStatus();
}
/**
 * Send clipboard image data as an encrypted transfer.
 */
async function sendClipboardImage(imageData) {
    const ctx = getContext();
    const statusEl = document.getElementById('clipboard-status');
    if (!ctx.sessionKey || !ctx.transferId)
        return;
    // Build clipboard manifest for image
    const manifest = prepareClipboardManifest('image/png', BigInt(imageData.length));
    // Generate transfer ID
    const clipTransferId = new Uint8Array(16);
    crypto.getRandomValues(clipTransferId);
    // Send FileOffer
    const offerMsg = encodeFileOffer(clipTransferId, manifest);
    sendWsBytesExport(offerMsg);
    // Encrypt and send image as single chunk (images are usually small enough)
    const aad = new Uint8Array(24);
    aad.set(clipTransferId, 0);
    const ciphertext = encryptChunk(ctx.sessionKey, BigInt(0), aad, imageData);
    const chunkMsg = encodeChunk(clipTransferId, BigInt(0), BigInt(1), ciphertext);
    sendWsBytesExport(chunkMsg);
    clipState.lastSharedTime = Date.now();
    clipState.lastSharedType = 'image/png';
    clipState.lastSharedSize = imageData.length;
    updateClipboardStatus();
}
// ============================================================================
// Receive Clipboard (writing to browser clipboard)
// ============================================================================
/**
 * Handle received clipboard content. Auto-copies to the browser clipboard.
 *
 * @param decryptedData - The decrypted clipboard content bytes
 * @param contentType - The content type from the manifest
 */
export async function receiveClipboard(decryptedData, contentType) {
    const statusEl = document.getElementById('clipboard-status');
    try {
        if (contentType === 'text' || contentType === 'url' || contentType === 'code') {
            const text = new TextDecoder().decode(decryptedData);
            const sanitized = sanitizeDisplayText(text);
            await navigator.clipboard.writeText(sanitized);
            if (statusEl) {
                statusEl.textContent = `Received ${contentType} (${formatClipSize(decryptedData.length)}) -- copied to clipboard!`;
                statusEl.style.color = 'var(--success)';
            }
        }
        else if (contentType.startsWith('image')) {
            const blob = new Blob([decryptedData], { type: 'image/png' });
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            if (statusEl) {
                statusEl.textContent = `Received image (${formatClipSize(decryptedData.length)}) -- copied to clipboard!`;
                statusEl.style.color = 'var(--success)';
            }
        }
    }
    catch (_err) {
        // Clipboard write failed -- provide download link instead
        if (statusEl) {
            statusEl.textContent = 'Received clipboard content. Clipboard write denied.';
            statusEl.style.color = 'var(--warning)';
        }
        // Show content in the received area
        showReceivedContent(decryptedData, contentType);
    }
}
/**
 * Check if a FileOffer manifest represents a clipboard transfer.
 * Returns the content type if it is, or null if it's a regular file transfer.
 */
export function checkClipboardManifest(manifestBytes) {
    try {
        const result = parseClipboardContent(manifestBytes);
        if (result && result.is_clipboard) {
            return {
                isClipboard: true,
                contentType: result.content_type || 'text',
            };
        }
    }
    catch (_e) {
        // Not a clipboard manifest
    }
    return null;
}
// ============================================================================
// Fallback (when Clipboard API is denied)
// ============================================================================
function showClipboardFallback() {
    const fallback = document.getElementById('clipboard-fallback');
    if (fallback) {
        fallback.classList.remove('hidden');
        clipState.fallbackVisible = true;
        const area = document.getElementById('clipboard-fallback-area');
        if (area)
            area.focus();
    }
}
export function hideClipboardFallback() {
    const fallback = document.getElementById('clipboard-fallback');
    if (fallback) {
        fallback.classList.add('hidden');
        clipState.fallbackVisible = false;
    }
}
function showReceivedContent(data, contentType) {
    const receivedEl = document.getElementById('clipboard-received');
    if (!receivedEl)
        return;
    receivedEl.classList.remove('hidden');
    if (contentType.startsWith('image')) {
        const blob = new Blob([data], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        receivedEl.innerHTML = `<img src="${url}" alt="Received clipboard image" style="max-width: 100%; border-radius: var(--radius-md);">`;
    }
    else {
        const text = new TextDecoder().decode(data);
        const safe = escapeHtml(sanitizeDisplayText(text));
        receivedEl.innerHTML = `<pre style="white-space: pre-wrap; word-break: break-all; font-size: 0.85rem; max-height: 200px; overflow-y: auto;">${safe}</pre>`;
    }
}
// ============================================================================
// Status Display
// ============================================================================
function updateClipboardStatus() {
    const statusEl = document.getElementById('clipboard-status');
    if (!statusEl)
        return;
    const elapsed = Math.round((Date.now() - clipState.lastSharedTime) / 1000);
    const timeStr = elapsed < 60 ? `${elapsed}s ago` : `${Math.round(elapsed / 60)}m ago`;
    statusEl.textContent = `Shared: ${timeStr} (${clipState.lastSharedType}, ${formatClipSize(clipState.lastSharedSize)})`;
    statusEl.style.color = 'var(--success)';
}
// ============================================================================
// Utilities
// ============================================================================
function formatClipSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KiB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
