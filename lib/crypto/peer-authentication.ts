'use client';

/**
 * Peer Authentication Module
 * Implements Short Authentication String (SAS) for MITM protection
 *
 * SAS allows users to verify they're connected to the right person
 * by comparing a short, human-readable code derived from the shared secret.
 */

import { generateUUID } from '../utils/uuid';
import { secureStorage } from '../storage/secure-storage';

import { pqCrypto } from './pqc-crypto';

// Word list for generating memorable phrases (BIP39-style, but shorter)
const WORD_LIST = [
    // Animals (easy to visualize)
    'TIGER', 'EAGLE', 'WHALE', 'HORSE', 'SNAKE', 'SHARK', 'ZEBRA', 'PANDA',
    'KOALA', 'OTTER', 'RAVEN', 'CAMEL', 'BISON', 'CRANE', 'GECKO', 'LEMUR',
    // Nature
    'RIVER', 'STORM', 'MAPLE', 'CEDAR', 'CORAL', 'FLAME', 'FROST', 'CLOUD',
    'OCEAN', 'STONE', 'PEARL', 'AMBER', 'RUBY', 'OPAL', 'JADE', 'ONYX',
    // Objects
    'CROWN', 'ARROW', 'BLADE', 'GLOBE', 'WHEEL', 'PRISM', 'CHAIN', 'TOWER',
    'BELL', 'CLOCK', 'BRUSH', 'FLASK', 'HARP', 'LENS', 'MASK', 'SCROLL',
    // Actions/Concepts
    'SWIFT', 'BRAVE', 'QUIET', 'VIVID', 'NOBLE', 'CLEAR', 'GRAND', 'PRIME',
    'SOLAR', 'LUNAR', 'POLAR', 'ROYAL', 'CYBER', 'ULTRA', 'MICRO', 'HYPER',
];

// Number of words in SAS phrase
const SAS_WORD_COUNT = 3;

// Verification status
export type VerificationStatus = 'unverified' | 'verified' | 'failed' | 'skipped';

export interface SASResult {
    phrase: string;           // e.g., "TIGER-RIVER-CROWN"
    words: string[];          // ["TIGER", "RIVER", "CROWN"]
    hash: string;             // Full hash for comparison (hex)
    timestamp: number;
}

export interface VerificationSession {
    id: string;
    peerId: string;
    peerName: string;
    sas: SASResult;
    status: VerificationStatus;
    createdAt: number;
    verifiedAt?: number;
}

/**
 * Generate SAS from shared secret
 * Uses HKDF to derive a deterministic code both peers will generate
 */
export function generateSAS(sharedSecret: Uint8Array, sessionId?: string): SASResult {
    // Create deterministic input with optional session binding
    const encoder = new TextEncoder();
    let context: Uint8Array;
    if (sessionId) {
        const sessionBytes = encoder.encode(sessionId);
        context = new Uint8Array(sharedSecret.length + sessionBytes.length);
        context.set(sharedSecret, 0);
        context.set(sessionBytes, sharedSecret.length);
    } else {
        context = sharedSecret;
    }

    // Hash to get deterministic bytes
    const hash = pqCrypto.hash(context);

    // Convert first bytes to word indices
    const words: string[] = [];
    for (let i = 0; i < SAS_WORD_COUNT; i++) {
        // Use 2 bytes per word for better distribution
        const byte1 = hash[i * 2];
        const byte2 = hash[i * 2 + 1];
        if (byte1 === undefined || byte2 === undefined) {continue;}
        const index = (byte1 << 8 | byte2) % WORD_LIST.length;
        const word = WORD_LIST[index];
        if (word) {words.push(word);}
    }

    return {
        phrase: words.join('-'),
        words,
        hash: Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join(''),
        timestamp: Date.now(),
    };
}

/**
 * Verify two SAS results match
 * Uses constant-time comparison for security
 */
export function verifySAS(local: SASResult, remote: SASResult): boolean {
    // Compare the full hashes using constant-time comparison
    const localBytes = new Uint8Array(local.hash.match(/.{2}/g)!.map(b => parseInt(b, 16)));
    const remoteBytes = new Uint8Array(remote.hash.match(/.{2}/g)!.map(b => parseInt(b, 16)));

    return pqCrypto.constantTimeEqual(localBytes, remoteBytes);
}

/**
 * Generate a numeric SAS (for simpler display)
 * 6 digits, collision probability ~1 in 1 million
 */
export function generateNumericSAS(sharedSecret: Uint8Array): string {
    const hash = pqCrypto.hash(sharedSecret);

    // Use first 3 bytes to generate 6 digits
    const byte0 = hash[0];
    const byte1 = hash[1];
    const byte2 = hash[2];
    if (byte0 === undefined || byte1 === undefined || byte2 === undefined) {
        return '000000'; // fallback
    }
    const num = (byte0 << 16 | byte1 << 8 | byte2) % 1000000;
    return num.toString().padStart(6, '0');
}

/**
 * Format SAS for display with emoji indicators
 */
export function formatSASWithEmoji(sas: SASResult): string {
    const emojiMap: Record<string, string> = {
        'TIGER': '🐯', 'EAGLE': '🦅', 'WHALE': '🐋', 'HORSE': '🐴',
        'RIVER': '🏞️', 'STORM': '⛈️', 'MAPLE': '🍁', 'OCEAN': '🌊',
        'CROWN': '👑', 'ARROW': '🏹', 'GLOBE': '🌍', 'FLAME': '🔥',
    };

    const parts = sas.words.map(word => {
        const emoji = emojiMap[word] || '🔷';
        return `${emoji} ${word}`;
    });

    return parts.join('  ');
}

// Storage key for verification sessions
const VERIFICATION_STORAGE_KEY = 'tallow_verification_sessions';

// In-memory cache for synchronous access
let sessionsCache: VerificationSession[] | null = null;
let cacheLoading: Promise<void> | null = null;

/**
 * Load sessions from secure storage into cache
 */
async function loadSessionsCache(): Promise<VerificationSession[]> {
    if (sessionsCache !== null) {return sessionsCache;}

    if (typeof window === 'undefined') {
        sessionsCache = [];
        return sessionsCache;
    }

    try {
        const stored = await secureStorage.getItem(VERIFICATION_STORAGE_KEY);
        sessionsCache = stored ? JSON.parse(stored) : [];
    } catch {
        sessionsCache = [];
    }
    return sessionsCache!;
}

/**
 * Initialize the verification cache (call on app startup)
 */
export function initVerificationCache(): Promise<void> {
    if (!cacheLoading) {
        cacheLoading = loadSessionsCache().then(() => {});
    }
    return cacheLoading;
}

/**
 * Save verification session (async, updates cache)
 */
export async function saveVerificationSession(session: VerificationSession): Promise<void> {
    if (typeof window === 'undefined') {return;}

    const sessions = await loadSessionsCache();
    const existingIndex = sessions.findIndex(s => s.id === session.id);

    if (existingIndex >= 0) {
        sessions[existingIndex] = session;
    } else {
        sessions.push(session);
    }

    // Keep only last 50 sessions
    sessionsCache = sessions.slice(-50);
    await secureStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(sessionsCache));
}

/**
 * Get all verification sessions
 */
export function getVerificationSessions(): VerificationSession[] {
    // Return from cache (synchronous). Cache should be initialized at startup.
    return sessionsCache || [];
}

/**
 * Get verification session for a peer
 */
export function getVerificationForPeer(peerId: string): VerificationSession | null {
    const sessions = getVerificationSessions();
    return sessions.find(s => s.peerId === peerId && s.status === 'verified') || null;
}

/**
 * Check if peer was previously verified (synchronous, uses cache)
 */
export function isPeerVerified(peerId: string): boolean {
    return getVerificationForPeer(peerId) !== null;
}

/**
 * Create a new verification session
 */
export function createVerificationSession(
    peerId: string,
    peerName: string,
    sharedSecret: Uint8Array
): VerificationSession {
    const session: VerificationSession = {
        id: generateUUID(),
        peerId,
        peerName,
        sas: generateSAS(sharedSecret, peerId),
        status: 'unverified',
        createdAt: Date.now(),
    };

    // Fire-and-forget save (cache is updated synchronously inside)
    saveVerificationSession(session);
    return session;
}

/**
 * Mark session as verified
 */
export async function markSessionVerified(sessionId: string): Promise<void> {
    const sessions = getVerificationSessions();
    const session = sessions.find(s => s.id === sessionId);

    if (session) {
        session.status = 'verified';
        session.verifiedAt = Date.now();
        await saveVerificationSession(session);
    }
}

/**
 * Mark session as failed
 */
export async function markSessionFailed(sessionId: string): Promise<void> {
    const sessions = getVerificationSessions();
    const session = sessions.find(s => s.id === sessionId);

    if (session) {
        session.status = 'failed';
        await saveVerificationSession(session);
    }
}

/**
 * Mark session as skipped
 */
export async function markSessionSkipped(sessionId: string): Promise<void> {
    const sessions = getVerificationSessions();
    const session = sessions.find(s => s.id === sessionId);

    if (session) {
        session.status = 'skipped';
        await saveVerificationSession(session);
    }
}

export default {
    generateSAS,
    verifySAS,
    generateNumericSAS,
    formatSASWithEmoji,
    createVerificationSession,
    markSessionVerified,
    markSessionFailed,
    markSessionSkipped,
    isPeerVerified,
    getVerificationForPeer,
};
