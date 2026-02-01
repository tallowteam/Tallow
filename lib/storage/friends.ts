'use client';

/**
 * Enhanced Friends List Storage
 * Manage saved contacts for quick file sharing with trust levels and passcode settings
 */

import { generateUUID } from '../utils/uuid';
import secureLog from '../utils/secure-logger';
import { secureStorage } from './secure-storage';

export type TrustLevel = 'pending' | 'trusted' | 'blocked';

// Limits
const MAX_FRIENDS = 500;
const MAX_FRIEND_REQUESTS = 200;
const MAX_NAME_LENGTH = 64;
const MAX_EMAIL_LENGTH = 128;
const FRIEND_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FRIEND_CODE_LENGTH = 8;

export interface ConnectionPreferences {
    autoAccept: boolean;
    notifications: boolean;
}

export interface Friend {
    id: string;
    name: string;
    email?: string;
    deviceId?: string;
    friendCode: string;  // Unique shareable code for this friend
    publicKey?: string;  // For establishing direct connections
    requirePasscode: boolean;  // Whether passcode is required for transfers
    trustLevel: TrustLevel;
    connectionPreferences: ConnectionPreferences;
    addedAt: Date;
    lastConnected?: Date;
    avatar?: string;
}

export interface FriendRequest {
    id: string;
    fromCode: string;  // Sender's friend code
    fromName: string;
    fromEmail?: string;
    toCode: string;  // Recipient's friend code
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
    expiresAt: Date;
}

const FRIENDS_KEY = 'tallow_friends';
const MY_FRIEND_CODE_KEY = 'tallow_my_friend_code';
const FRIEND_REQUESTS_KEY = 'tallow_friend_requests';

// In-memory cache for synchronous reads
let friendsCache: Friend[] | null = null;
let friendCodeCache: string | null = null;
let requestsCache: FriendRequest[] | null = null;

/**
 * Initialize friends cache from secure storage (call on app startup)
 */
export async function initFriendsCache(): Promise<void> {
    if (typeof window === 'undefined') {return;}

    try {
        const stored = await secureStorage.getItem(FRIENDS_KEY);
        friendsCache = stored ? JSON.parse(stored).map((f: Friend) => ({
            ...f,
            addedAt: new Date(f.addedAt),
            lastConnected: f.lastConnected ? new Date(f.lastConnected) : undefined,
        })) : [];
    } catch {
        friendsCache = [];
    }

    try {
        friendCodeCache = await secureStorage.getItem(MY_FRIEND_CODE_KEY);
    } catch {
        friendCodeCache = null;
    }

    try {
        const stored = await secureStorage.getItem(FRIEND_REQUESTS_KEY);
        requestsCache = stored ? JSON.parse(stored).map((r: FriendRequest) => ({
            ...r,
            createdAt: new Date(r.createdAt),
            expiresAt: new Date(r.expiresAt),
        })) : [];
    } catch {
        requestsCache = [];
    }
}

/**
 * Generate a unique friend code (8 characters, alphanumeric)
 * Uses crypto.getRandomValues for unpredictable codes
 */
export function generateFriendCode(): string {
    const values = new Uint8Array(FRIEND_CODE_LENGTH);
    crypto.getRandomValues(values);
    let code = '';
    for (let i = 0; i < FRIEND_CODE_LENGTH; i++) {
        const value = values[i];
        if (value !== undefined) {
            code += FRIEND_CODE_CHARS[value % FRIEND_CODE_CHARS.length];
        }
    }
    return code;
}

/**
 * Validate friend code format
 */
export function isValidFriendCode(code: string): boolean {
    const normalized = code.replace(/-/g, '').toUpperCase();
    if (normalized.length !== FRIEND_CODE_LENGTH) {return false;}
    const validCharsRegex = new RegExp(`^[${FRIEND_CODE_CHARS}]+$`);
    return validCharsRegex.test(normalized);
}

/**
 * Sanitize a display name to prevent XSS
 */
function sanitizeName(name: string): string {
    return name
        .replace(/[<>&"']/g, '')
        .trim()
        .slice(0, MAX_NAME_LENGTH);
}

/**
 * Get current user's friend code (generates one if doesn't exist)
 */
export function getMyFriendCode(): string {
    if (typeof window === 'undefined') {return '';}

    if (friendCodeCache) {return friendCodeCache;}

    // Generate new code if not cached
    const code = generateFriendCode();
    friendCodeCache = code;
    // Persist asynchronously
    secureStorage.setItem(MY_FRIEND_CODE_KEY, code).catch(() => {});
    return code;
}

/**
 * Format friend code for display (XXXX-XXXX)
 */
export function formatFriendCode(code: string): string {
    if (code.length !== 8) {return code;}
    return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Parse friend code (remove dashes, validate format)
 * Returns normalized code or throws on invalid input
 */
export function parseFriendCode(code: string): string {
    const normalized = code.replace(/-/g, '').toUpperCase().trim();
    if (!isValidFriendCode(normalized)) {
        throw new Error('Invalid friend code format');
    }
    return normalized;
}

/**
 * Get all saved friends (synchronous, reads from cache)
 */
export function getFriends(): Friend[] {
    if (typeof window === 'undefined') {return [];}
    return friendsCache || [];
}

/**
 * Get only trusted friends
 */
export function getTrustedFriends(): Friend[] {
    return getFriends().filter(f => f.trustLevel === 'trusted');
}

/**
 * Get pending friends (incoming requests accepted but not yet mutually confirmed)
 */
export function getPendingFriends(): Friend[] {
    return getFriends().filter(f => f.trustLevel === 'pending');
}

/**
 * Save friends to storage (updates cache and persists encrypted)
 */
function saveFriends(friends: Friend[]): void {
    friendsCache = friends;
    secureStorage.setItem(FRIENDS_KEY, JSON.stringify(friends)).catch((e) => {
        secureLog.error('[Friends] Failed to save:', e);
    });
}

/**
 * Add a new friend
 */
export function addFriend(friend: Omit<Friend, 'id' | 'addedAt' | 'connectionPreferences'> & { connectionPreferences?: ConnectionPreferences }): Friend {
    const friends = getFriends();

    // Enforce limit
    if (friends.length >= MAX_FRIENDS) {
        throw new Error(`Cannot add more than ${MAX_FRIENDS} friends`);
    }

    // Validate friend code format
    if (!isValidFriendCode(friend.friendCode)) {
        throw new Error('Invalid friend code format');
    }

    // Validate name
    if (!friend.name || friend.name.trim().length === 0) {
        throw new Error('Friend name is required');
    }

    // Check if friend already exists by code
    const normalizedCode = friend.friendCode.replace(/-/g, '').toUpperCase();
    const existing = friends.find(f => f.friendCode === normalizedCode);
    if (existing) {
        return existing;
    }

    // Prevent adding own code
    const myCode = getMyFriendCode();
    if (normalizedCode === myCode) {
        throw new Error('Cannot add yourself as a friend');
    }

    const trimmedEmail = friend.email ? friend.email.trim().slice(0, MAX_EMAIL_LENGTH) : undefined;
    const newFriend: Friend = {
        ...friend,
        id: generateUUID(),
        name: sanitizeName(friend.name),
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
        friendCode: normalizedCode,
        addedAt: new Date(),
        requirePasscode: friend.requirePasscode ?? false,
        trustLevel: friend.trustLevel ?? 'trusted',
        connectionPreferences: friend.connectionPreferences ?? {
            autoAccept: false,
            notifications: true,
        },
    };

    friends.push(newFriend);
    saveFriends(friends);

    return newFriend;
}

/**
 * Remove a friend by ID
 */
export function removeFriend(id: string): boolean {
    const friends = getFriends();
    const filtered = friends.filter(f => f.id !== id);

    if (filtered.length === friends.length) {return false;}

    saveFriends(filtered);
    return true;
}

/**
 * Update friend's last connected time
 */
export function updateFriendConnection(id: string): void {
    const friends = getFriends();
    const friend = friends.find(f => f.id === id);

    if (friend) {
        friend.lastConnected = new Date();
        saveFriends(friends);
    }
}

/**
 * Update friend settings
 */
export function updateFriendSettings(
    id: string,
    settings: Partial<Pick<Friend, 'requirePasscode' | 'trustLevel' | 'connectionPreferences' | 'name'>>
): Friend | null {
    const friends = getFriends();
    const friendIndex = friends.findIndex(f => f.id === id);

    if (friendIndex === -1) {return null;}

    // Sanitize name if provided
    const sanitizedSettings = { ...settings };
    if (sanitizedSettings.name) {
        sanitizedSettings.name = sanitizeName(sanitizedSettings.name);
        if (sanitizedSettings.name.length === 0) {
            delete sanitizedSettings.name; // Keep existing name
        }
    }

    const existingFriend = friends[friendIndex];
    if (!existingFriend) {return null;}

    friends[friendIndex] = {
        ...existingFriend,
        ...sanitizedSettings,
    } as Friend;

    saveFriends(friends);
    return friends[friendIndex] || null;
}

/**
 * Find friend by device ID
 */
export function findFriendByDeviceId(deviceId: string): Friend | undefined {
    return getFriends().find(f => f.deviceId === deviceId);
}

/**
 * Find friend by friend code
 */
export function findFriendByCode(friendCode: string): Friend | undefined {
    try {
        const normalizedCode = parseFriendCode(friendCode);
        return getFriends().find(f => f.friendCode === normalizedCode);
    } catch {
        return undefined; // Invalid code format
    }
}

/**
 * Check if device is a trusted friend
 */
export function isFriend(deviceId: string): boolean {
    const friend = findFriendByDeviceId(deviceId);
    return friend?.trustLevel === 'trusted';
}

/**
 * Check if passcode is required for friend
 */
export function requiresPasscode(deviceId: string): boolean {
    const friend = findFriendByDeviceId(deviceId);
    return friend?.requirePasscode ?? true;  // Default to requiring passcode
}

// ==================== Friend Requests ====================

/**
 * Get all friend requests (synchronous, reads from cache)
 */
export function getFriendRequests(): FriendRequest[] {
    if (typeof window === 'undefined') {return [];}
    return requestsCache || [];
}

/**
 * Get pending incoming friend requests
 */
export function getPendingFriendRequests(): FriendRequest[] {
    const myCode = getMyFriendCode();
    const now = new Date();
    return getFriendRequests().filter(r =>
        r.toCode === myCode &&
        r.status === 'pending' &&
        new Date(r.expiresAt) > now
    );
}

/**
 * Save friend requests (updates cache and persists encrypted)
 */
function saveFriendRequests(requests: FriendRequest[]): void {
    requestsCache = requests;
    secureStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(requests)).catch((e) => {
        secureLog.error('[Friends] Failed to save requests:', e);
    });
}

/**
 * Create a friend request
 */
export function createFriendRequest(toCode: string, fromName: string, fromEmail?: string): FriendRequest {
    // Auto-cleanup before adding new requests
    cleanupExpiredRequests();

    const requests = getFriendRequests();

    if (requests.length >= MAX_FRIEND_REQUESTS) {
        throw new Error('Too many pending friend requests');
    }

    const myCode = getMyFriendCode();
    const normalizedToCode = parseFriendCode(toCode); // Throws on invalid

    if (normalizedToCode === myCode) {
        throw new Error('Cannot send friend request to yourself');
    }

    // Check for duplicate pending request
    const existing = requests.find(r =>
        r.toCode === normalizedToCode && r.fromCode === myCode && r.status === 'pending'
    );
    if (existing) {
        return existing;
    }

    const trimmedFromEmail = fromEmail?.trim().slice(0, MAX_EMAIL_LENGTH);
    const request: FriendRequest = {
        id: generateUUID(),
        fromCode: myCode,
        fromName: sanitizeName(fromName),
        ...(trimmedFromEmail ? { fromEmail: trimmedFromEmail } : {}),
        toCode: normalizedToCode,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    requests.push(request);
    saveFriendRequests(requests);

    return request;
}

/**
 * Accept a friend request
 */
export function acceptFriendRequest(requestId: string): Friend | null {
    const requests = getFriendRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex === -1) {return null;}

    const request = requests[requestIndex];
    if (!request) {return null;}

    request.status = 'accepted';
    saveFriendRequests(requests);

    // Add as friend
    const friend = addFriend({
        name: request.fromName,
        ...(request.fromEmail ? { email: request.fromEmail } : {}),
        friendCode: request.fromCode,
        requirePasscode: false,
        trustLevel: 'trusted',
    });

    return friend;
}

/**
 * Reject a friend request
 */
export function rejectFriendRequest(requestId: string): boolean {
    const requests = getFriendRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex === -1) {return false;}

    const request = requests[requestIndex];
    if (!request) {return false;}

    request.status = 'rejected';
    saveFriendRequests(requests);

    return true;
}

/**
 * Clean up expired requests
 */
export function cleanupExpiredRequests(): void {
    const requests = getFriendRequests();
    const now = new Date();
    const valid = requests.filter(r => new Date(r.expiresAt) > now);
    saveFriendRequests(valid);
}

export default {
    getFriends,
    getTrustedFriends,
    getPendingFriends,
    addFriend,
    removeFriend,
    updateFriendConnection,
    updateFriendSettings,
    findFriendByDeviceId,
    findFriendByCode,
    isFriend,
    requiresPasscode,
    getMyFriendCode,
    formatFriendCode,
    parseFriendCode,
    generateFriendCode,
    isValidFriendCode,
    getFriendRequests,
    getPendingFriendRequests,
    createFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cleanupExpiredRequests,
};
