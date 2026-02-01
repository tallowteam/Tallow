'use client';

/**
 * Clipboard Sync Feature (KDE Connect-style)
 * Share clipboard content between connected devices
 */

import { generateUUID } from '../utils/uuid';
import { secureStorage } from '../storage/secure-storage';

// Clipboard message type
export interface ClipboardMessage {
    type: 'clipboard';
    content: string;
    timestamp: number;
    senderId: string;
    senderName: string;
}

// Clipboard history item
export interface ClipboardHistoryItem {
    id: string;
    content: string;
    fromDevice: string;
    fromName: string;
    receivedAt: Date;
    isLocal: boolean;
}

const HISTORY_KEY = 'Tallow_clipboard_history';
const MAX_HISTORY = 20;

/**
 * Serialized format stored in local storage
 */
interface SerializedClipboardHistoryItem {
    id: string;
    content: string;
    fromDevice: string;
    fromName: string;
    receivedAt: string;
    isLocal: boolean;
}

// Get clipboard history from storage
export async function getClipboardHistory(): Promise<ClipboardHistoryItem[]> {
    if (typeof window === 'undefined') {return [];}

    try {
        const stored = await secureStorage.getItem(HISTORY_KEY);
        if (!stored) {return [];}

        const items = JSON.parse(stored) as SerializedClipboardHistoryItem[];
        return items.map((item: SerializedClipboardHistoryItem) => ({
            ...item,
            receivedAt: new Date(item.receivedAt),
        }));
    } catch {
        return [];
    }
}

// Add to clipboard history
export async function addToClipboardHistory(item: Omit<ClipboardHistoryItem, 'id' | 'receivedAt'>): Promise<void> {
    const history = await getClipboardHistory();

    const newItem: ClipboardHistoryItem = {
        ...item,
        id: generateUUID(),
        receivedAt: new Date(),
    };

    // Add to front, remove duplicates, limit size
    const filtered = history.filter(h => h.content !== item.content);
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);

    await secureStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

// Clear clipboard history
export function clearClipboardHistory(): void {
    secureStorage.removeItem(HISTORY_KEY);
}

// Read from system clipboard
export async function readClipboard(): Promise<string | null> {
    try {
        if (!navigator.clipboard) {return null;}
        const text = await navigator.clipboard.readText();
        return text || null;
    } catch {
        return null;
    }
}

// Write to system clipboard
export async function writeClipboard(text: string): Promise<boolean> {
    try {
        if (!navigator.clipboard) {return false;}
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

// Create a clipboard sync message
export function createClipboardMessage(
    content: string,
    senderId: string,
    senderName: string
): ClipboardMessage {
    return {
        type: 'clipboard',
        content,
        timestamp: Date.now(),
        senderId,
        senderName,
    };
}

// Parse incoming clipboard message
export function parseClipboardMessage(data: unknown): ClipboardMessage | null {
    if (!data || typeof data !== 'object') {return null;}
    const msg = data as Record<string, unknown>;
    if (msg['type'] !== 'clipboard') {return null;}
    if (typeof msg['content'] !== 'string') {return null;}

    return {
        type: 'clipboard',
        content: msg['content'] as string,
        timestamp: (msg['timestamp'] as number) || Date.now(),
        senderId: (msg['senderId'] as string) || 'unknown',
        senderName: (msg['senderName'] as string) || 'Unknown Device',
    };
}

// Truncate long clipboard content for display
export function truncateContent(content: string, maxLength: number = 50): string {
    if (content.length <= maxLength) {return content;}
    return content.slice(0, maxLength) + '...';
}

// Check if content is a URL
export function isUrl(content: string): boolean {
    try {
        new URL(content);
        return true;
    } catch {
        return false;
    }
}

export default {
    getClipboardHistory,
    addToClipboardHistory,
    clearClipboardHistory,
    readClipboard,
    writeClipboard,
    createClipboardMessage,
    parseClipboardMessage,
    truncateContent,
    isUrl,
};
