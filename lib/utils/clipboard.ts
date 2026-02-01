'use client';

/**
 * Clipboard Integration Utilities
 * Enhanced clipboard support for transfer codes, phrases, and links
 */

import secureLog from './secure-logger';

export interface ClipboardResult {
    success: boolean;
    method: 'modern' | 'fallback' | 'none';
    error?: string;
}

/**
 * Copy text to clipboard with automatic fallback
 */
export async function copyToClipboard(text: string): Promise<ClipboardResult> {
    // Try modern Clipboard API first
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return { success: true, method: 'modern' };
        } catch (error) {
            secureLog.debug('Modern clipboard failed, trying fallback:', error);
        }
    }

    // Fallback to execCommand
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);

        textArea.select();
        textArea.setSelectionRange(0, text.length);

        const success = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (success) {
            return { success: true, method: 'fallback' };
        }
        return { success: false, method: 'fallback', error: 'execCommand returned false' };
    } catch (error) {
        return {
            success: false,
            method: 'none',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Read text from clipboard
 */
export async function readFromClipboard(): Promise<string | null> {
    if (navigator.clipboard?.readText) {
        try {
            return await navigator.clipboard.readText();
        } catch (error) {
            secureLog.debug('Clipboard read failed:', error);
            return null;
        }
    }
    return null;
}

/**
 * Check if clipboard API is available
 */
export function isClipboardAvailable(): boolean {
    return (
        typeof navigator !== 'undefined' &&
        (!!navigator.clipboard?.writeText || !!document.execCommand)
    );
}

/**
 * Copy transfer code with automatic formatting
 */
export async function copyTransferCode(code: string): Promise<ClipboardResult> {
    // Clean and format the code
    const formattedCode = code.trim().toUpperCase();
    return copyToClipboard(formattedCode);
}

/**
 * Copy word phrase code with proper formatting
 */
export async function copyWordPhrase(words: string[]): Promise<ClipboardResult> {
    const phrase = words.join('-').toLowerCase();
    return copyToClipboard(phrase);
}

/**
 * Copy share link
 */
export async function copyShareLink(baseUrl: string, shareId: string): Promise<ClipboardResult> {
    const link = `${baseUrl}/share/${shareId}`;
    return copyToClipboard(link);
}

/**
 * Copy room link
 */
export async function copyRoomLink(baseUrl: string, roomCode: string): Promise<ClipboardResult> {
    const link = `${baseUrl}/room/${roomCode}`;
    return copyToClipboard(link);
}

/**
 * Share content using Web Share API or clipboard fallback
 */
export async function shareContent(options: {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
}): Promise<{ shared: boolean; method: 'webshare' | 'clipboard' | 'none' }> {
    // Check for Web Share API support
    if (navigator.share) {
        try {
            // Build share data object with only defined values
            const shareData: ShareData = {};
            if (options.title) {shareData.title = options.title;}
            if (options.text) {shareData.text = options.text;}
            if (options.url) {shareData.url = options.url;}

            // Check file sharing capability
            if (options.files && options.files.length > 0 && navigator.canShare?.({ files: options.files })) {
                shareData.files = options.files;
                await navigator.share(shareData);
                return { shared: true, method: 'webshare' };
            }

            // Share without files
            await navigator.share(shareData);
            return { shared: true, method: 'webshare' };
        } catch (error) {
            // User cancelled or share failed
            if ((error as Error).name === 'AbortError') {
                return { shared: false, method: 'webshare' };
            }
            secureLog.debug('Web Share failed:', error);
        }
    }

    // Fallback to clipboard
    const textToShare = [
        options.title,
        options.text,
        options.url,
    ].filter((item): item is string => Boolean(item)).join('\n');

    if (textToShare) {
        const result = await copyToClipboard(textToShare);
        return { shared: result.success, method: 'clipboard' };
    }

    return { shared: false, method: 'none' };
}

/**
 * Check if Web Share API is available
 */
export function isWebShareAvailable(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.share;
}

/**
 * Check if Web Share can share files
 */
export function canShareFiles(): boolean {
    if (!isWebShareAvailable()) {return false;}

    try {
        // Create a test file
        const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
        return navigator.canShare?.({ files: [testFile] }) ?? false;
    } catch {
        return false;
    }
}

/**
 * Generate and copy a shareable connection phrase
 */
export async function generateAndCopyConnectionInfo(options: {
    code: string;
    phrase?: string[];
    link?: string;
}): Promise<ClipboardResult> {
    const parts: string[] = [];

    if (options.phrase && options.phrase.length > 0) {
        parts.push(`Phrase: ${options.phrase.join('-')}`);
    }

    if (options.code) {
        parts.push(`Code: ${options.code}`);
    }

    if (options.link) {
        parts.push(`Link: ${options.link}`);
    }

    const text = parts.join('\n');
    return copyToClipboard(text);
}

/**
 * Monitor clipboard for transfer codes (with permission)
 */
export function watchClipboard(
    onCodeDetected: (code: string) => void,
    options: {
        interval?: number;
        codePattern?: RegExp;
    } = {}
): () => void {
    const { interval = 1000, codePattern = /^[A-Z0-9]{6,8}$/ } = options;
    let lastValue = '';
    let timerId: ReturnType<typeof setInterval> | null = null;

    const check = async () => {
        const text = await readFromClipboard();
        if (text && text !== lastValue) {
            lastValue = text;
            const cleaned = text.trim().toUpperCase();
            if (codePattern.test(cleaned)) {
                onCodeDetected(cleaned);
            }
        }
    };

    // Only watch if clipboard reading is available
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        timerId = setInterval(check, interval);
    }

    return () => {
        if (timerId) {
            clearInterval(timerId);
        }
    };
}

export default {
    copyToClipboard,
    readFromClipboard,
    isClipboardAvailable,
    copyTransferCode,
    copyWordPhrase,
    copyShareLink,
    copyRoomLink,
    shareContent,
    isWebShareAvailable,
    canShareFiles,
    generateAndCopyConnectionInfo,
    watchClipboard,
};
