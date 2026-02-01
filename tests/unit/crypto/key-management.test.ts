/**
 * Ephemeral Key Management Tests
 * Tests for key rotation, ratcheting, and secure deletion
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EphemeralKeyManager } from '@/lib/crypto/key-management';
import type { SessionKeyPair } from '@/lib/crypto/key-management';

describe('EphemeralKeyManager', () => {
    let keyManager: EphemeralKeyManager;

    beforeEach(() => {
        keyManager = EphemeralKeyManager.getInstance();
        vi.useFakeTimers();
    });

    afterEach(() => {
        keyManager.destroyAll();
        vi.useRealTimers();
    });

    // ==========================================================================
    // Session Key Generation Tests
    // ==========================================================================

    describe('Session Key Generation', () => {
        it('should generate valid session keys', async () => {
            const sessionKey = await keyManager.generateSessionKeys();

            expect(sessionKey).toBeDefined();
            expect(sessionKey.id).toBeDefined();
            expect(sessionKey.keyPair).toBeDefined();
            expect(sessionKey.keyPair.kyber).toBeDefined();
            expect(sessionKey.keyPair.x25519).toBeDefined();
            expect(sessionKey.createdAt).toBeDefined();
            expect(sessionKey.expiresAt).toBeGreaterThan(sessionKey.createdAt);
            expect(sessionKey.messageCount).toBe(0);
        });

        it('should generate unique key IDs', async () => {
            const key1 = await keyManager.generateSessionKeys();
            const key2 = await keyManager.generateSessionKeys();

            expect(key1.id).not.toBe(key2.id);
        });

        it('should set custom lifetime', async () => {
            const lifetime = 60000; // 1 minute
            const sessionKey = await keyManager.generateSessionKeys(lifetime);

            expect(sessionKey.expiresAt - sessionKey.createdAt).toBe(lifetime);
        });

        it('should schedule automatic key deletion', async () => {
            const lifetime = 1000; // 1 second
            const sessionKey = await keyManager.generateSessionKeys(lifetime);

            // Verify key exists
            let key = keyManager.getSessionKey(sessionKey.id);
            expect(key).not.toBeNull();

            // Fast forward time
            vi.advanceTimersByTime(lifetime + 100);

            // Verify key is deleted
            key = keyManager.getSessionKey(sessionKey.id);
            expect(key).toBeNull();
        });

        it('should handle multiple session keys', async () => {
            const keys: SessionKeyPair[] = [];
            for (let i = 0; i < 5; i++) {
                keys.push(await keyManager.generateSessionKeys());
            }

            // All keys should be accessible
            for (const key of keys) {
                const retrieved = keyManager.getSessionKey(key.id);
                expect(retrieved).not.toBeNull();
                expect(retrieved?.id).toBe(key.id);
            }

            const stats = keyManager.getStats();
            expect(stats.activeKeys).toBe(5);
        });
    });

    // ==========================================================================
    // Key Retrieval Tests
    // ==========================================================================

    describe('Key Retrieval', () => {
        it('should retrieve existing session key', async () => {
            const sessionKey = await keyManager.generateSessionKeys();
            const retrieved = keyManager.getSessionKey(sessionKey.id);

            expect(retrieved).not.toBeNull();
            expect(retrieved?.id).toBe(sessionKey.id);
        });

        it('should return null for non-existent key', () => {
            const retrieved = keyManager.getSessionKey('non-existent-id');
            expect(retrieved).toBeNull();
        });

        it('should return null for expired key', async () => {
            const sessionKey = await keyManager.generateSessionKeys(1000);

            // Fast forward past expiration
            vi.advanceTimersByTime(1100);

            const retrieved = keyManager.getSessionKey(sessionKey.id);
            expect(retrieved).toBeNull();
        });

        it('should auto-delete expired key on retrieval', async () => {
            const sessionKey = await keyManager.generateSessionKeys(1000);
            const stats1 = keyManager.getStats();
            expect(stats1.activeKeys).toBe(1);

            // Fast forward past expiration
            vi.advanceTimersByTime(1100);
            keyManager.getSessionKey(sessionKey.id);

            const stats2 = keyManager.getStats();
            expect(stats2.activeKeys).toBe(0);
        });
    });

    // ==========================================================================
    // Message Count Tests
    // ==========================================================================

    describe('Message Count Tracking', () => {
        it('should increment message count', async () => {
            const sessionKey = await keyManager.generateSessionKeys();

            const shouldRatchet = keyManager.incrementMessageCount(sessionKey.id);
            expect(shouldRatchet).toBe(false);

            const retrieved = keyManager.getSessionKey(sessionKey.id);
            expect(retrieved?.messageCount).toBe(1);
        });

        it('should signal ratchet when max messages reached', async () => {
            const sessionKey = await keyManager.generateSessionKeys();

            // Increment to max (100 messages)
            let shouldRatchet = false;
            for (let i = 0; i < 100; i++) {
                shouldRatchet = keyManager.incrementMessageCount(sessionKey.id);
            }

            expect(shouldRatchet).toBe(true);
            const retrieved = keyManager.getSessionKey(sessionKey.id);
            expect(retrieved?.messageCount).toBe(100);
        });

        it('should return true for non-existent key', () => {
            const shouldRatchet = keyManager.incrementMessageCount('non-existent');
            expect(shouldRatchet).toBe(true);
        });
    });

    // ==========================================================================
    // Key Deletion Tests
    // ==========================================================================

    describe('Key Deletion', () => {
        it('should delete existing key', async () => {
            const sessionKey = await keyManager.generateSessionKeys();

            const deleted = keyManager.deleteKey(sessionKey.id);
            expect(deleted).toBe(true);

            const retrieved = keyManager.getSessionKey(sessionKey.id);
            expect(retrieved).toBeNull();
        });

        it('should return false when deleting non-existent key', () => {
            const deleted = keyManager.deleteKey('non-existent');
            expect(deleted).toBe(false);
        });

        it('should cancel deletion timer', async () => {
            const sessionKey = await keyManager.generateSessionKeys(5000);

            keyManager.deleteKey(sessionKey.id);

            // Timer should not fire
            vi.advanceTimersByTime(6000);

            const stats = keyManager.getStats();
            expect(stats.activeKeys).toBe(0);
        });

        it('should securely wipe key material', async () => {
            const sessionKey = await keyManager.generateSessionKeys();
            const kyberSecret = sessionKey.keyPair.kyber.secretKey;

            keyManager.deleteKey(sessionKey.id);

            // Verify secret is zeroed (best effort check)
            const isZeroed = Array.from(kyberSecret).every(b => b === 0 || b === 0xFF);
            expect(isZeroed).toBe(true);
        });
    });

    // ==========================================================================
    // Double Ratchet Tests
    // ==========================================================================

    describe('Double Ratchet', () => {
        it('should initialize ratchet state', async () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sessionId = 'test-session';

            const state = await keyManager.initializeRatchet(
                sessionId,
                sharedSecret,
                true // isInitiator
            );

            expect(state).toBeDefined();
            expect(state.rootKey).toBeDefined();
            expect(state.sendChainKey).toBeDefined();
            expect(state.receiveChainKey).toBeDefined();
            expect(state.dhRatchetKeyPair).toBeDefined();
            expect(state.sendMessageNumber).toBe(0);
            expect(state.receiveMessageNumber).toBe(0);
        });

        it('should derive different chain keys for initiator and responder', async () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));

            const initiatorState = await keyManager.initializeRatchet(
                'initiator-session',
                sharedSecret,
                true
            );

            const responderState = await keyManager.initializeRatchet(
                'responder-session',
                sharedSecret,
                false
            );

            // Initiator's send should match responder's receive
            expect(
                Array.from(initiatorState.sendChainKey).join(',')
            ).toBe(
                Array.from(responderState.receiveChainKey).join(',')
            );

            expect(
                Array.from(initiatorState.receiveChainKey).join(',')
            ).toBe(
                Array.from(responderState.sendChainKey).join(',')
            );
        });

        it('should get next send key', async () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sessionId = 'test-session';

            await keyManager.initializeRatchet(sessionId, sharedSecret, true);

            const key1 = keyManager.getNextSendKey(sessionId);
            const key2 = keyManager.getNextSendKey(sessionId);

            expect(key1.key).toBeDefined();
            expect(key1.index).toBe(0);
            expect(key2.index).toBe(1);

            // Keys should be different
            expect(
                Array.from(key1.key).join(',')
            ).not.toBe(
                Array.from(key2.key).join(',')
            );
        });

        it('should get receive key for current message', async () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sessionId = 'test-session';

            await keyManager.initializeRatchet(sessionId, sharedSecret, false);

            const key = keyManager.getReceiveKey(sessionId, 0);

            expect(key).not.toBeNull();
            expect(key?.index).toBe(0);
        });

        it('should handle out-of-order messages', async () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sessionId = 'test-session';

            // Create peer keypair and initialize with peer public key
            const peerKeyPair = await keyManager.generateSessionKeys();
            const peerPublicKey = {
                kyberPublicKey: peerKeyPair.keyPair.kyber.publicKey,
                x25519PublicKey: peerKeyPair.keyPair.x25519.publicKey,
            };

            await keyManager.initializeRatchet(sessionId, sharedSecret, false, peerPublicKey);

            // Request message 2 (skipping 0 and 1)
            const key = keyManager.getReceiveKey(sessionId, 2);

            expect(key).not.toBeNull();
            expect(key?.index).toBe(2);

            const stats = keyManager.getStats();
            expect(stats.skippedKeys).toBe(2); // Messages 0 and 1
        });

        it('should retrieve skipped message key', async () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sessionId = 'test-session';

            // Create peer keypair and initialize with peer public key
            const peerKeyPair = await keyManager.generateSessionKeys();
            const peerPublicKey = {
                kyberPublicKey: peerKeyPair.keyPair.kyber.publicKey,
                x25519PublicKey: peerKeyPair.keyPair.x25519.publicKey,
            };

            await keyManager.initializeRatchet(sessionId, sharedSecret, false, peerPublicKey);

            // Skip to message 2
            keyManager.getReceiveKey(sessionId, 2);

            // Now retrieve skipped message 1
            const key = keyManager.getReceiveKey(sessionId, 1);

            expect(key).not.toBeNull();
            expect(key?.index).toBe(1);
        });

        it('should throw error for non-existent session', () => {
            expect(() => {
                keyManager.getNextSendKey('non-existent');
            }).toThrow();
        });

        it('should get current public key', async () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sessionId = 'test-session';

            await keyManager.initializeRatchet(sessionId, sharedSecret, true);

            const publicKey = keyManager.getCurrentPublicKey(sessionId);

            expect(publicKey).not.toBeNull();
            expect(publicKey?.kyberPublicKey).toBeDefined();
            expect(publicKey?.x25519PublicKey).toBeDefined();
        });

        it('should return null for non-existent session public key', () => {
            const publicKey = keyManager.getCurrentPublicKey('non-existent');
            expect(publicKey).toBeNull();
        });
    });

    // ==========================================================================
    // Symmetric Ratchet Tests
    // ==========================================================================

    describe('Symmetric Ratchet', () => {
        it('should ratchet chain key forward', () => {
            const chainKey = crypto.getRandomValues(new Uint8Array(32));
            const ratcheted = keyManager.ratchetKeys(chainKey);

            expect(ratcheted).toBeDefined();
            expect(ratcheted.length).toBe(32);

            // Should produce different key
            expect(
                Array.from(ratcheted).join(',')
            ).not.toBe(
                Array.from(chainKey).join(',')
            );
        });

        it('should produce deterministic ratchets', () => {
            const chainKey = crypto.getRandomValues(new Uint8Array(32));

            const ratchet1 = keyManager.ratchetKeys(chainKey);
            const ratchet2 = keyManager.ratchetKeys(chainKey);

            expect(
                Array.from(ratchet1).join(',')
            ).toBe(
                Array.from(ratchet2).join(',')
            );
        });

        it('should create ratchet chain', () => {
            let key = crypto.getRandomValues(new Uint8Array(32));
            const chain: Uint8Array[] = [new Uint8Array(key)];

            for (let i = 0; i < 5; i++) {
                key = keyManager.ratchetKeys(key);
                chain.push(new Uint8Array(key));
            }

            // All keys should be different
            const uniqueKeys = new Set(chain.map(k => Array.from(k).join(',')));
            expect(uniqueKeys.size).toBe(6);
        });
    });

    // ==========================================================================
    // Secure Memory Wiping Tests
    // ==========================================================================

    describe('Secure Memory Wiping', () => {
        it('should securely delete single key', () => {
            const key = crypto.getRandomValues(new Uint8Array(32));
            const original = new Uint8Array(key);

            keyManager.secureDelete(key);

            // Should be different from original
            expect(
                Array.from(key).join(',')
            ).not.toBe(
                Array.from(original).join(',')
            );

            // Should be zeroed (final pass)
            const isZeroed = Array.from(key).every(b => b === 0);
            expect(isZeroed).toBe(true);
        });

        it('should handle empty array', () => {
            const key = new Uint8Array(0);
            expect(() => {
                keyManager.secureDelete(key);
            }).not.toThrow();
        });

        it('should handle null/undefined', () => {
            expect(() => {
                keyManager.secureDelete(null as any);
            }).not.toThrow();

            expect(() => {
                keyManager.secureDelete(undefined as any);
            }).not.toThrow();
        });

        it('should wipe multiple passes', () => {
            const key = new Uint8Array(32);
            key.fill(0xAA); // Fill with known pattern

            const passes: string[] = [];
            const originalFill = key.fill;
            key.fill = vi.fn((value: number) => {
                passes.push(`0x${value.toString(16)}`);
                return originalFill.call(key, value);
            }) as any;

            keyManager.secureDelete(key);

            // Verify final zero pass
            expect(passes[passes.length - 1]).toBe('0x0');
        });
    });

    // ==========================================================================
    // Session Destruction Tests
    // ==========================================================================

    describe('Session Destruction', () => {
        it('should destroy session and all keys', async () => {
            const sessionId = 'test-session';
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));

            await keyManager.initializeRatchet(sessionId, sharedSecret, true);
            const stats1 = keyManager.getStats();
            expect(stats1.ratchetSessions).toBe(1);

            keyManager.destroySession(sessionId);

            const stats2 = keyManager.getStats();
            expect(stats2.ratchetSessions).toBe(0);
        });

        it('should wipe ratchet state securely', async () => {
            const sessionId = 'test-session';
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));

            const state = await keyManager.initializeRatchet(sessionId, sharedSecret, true);
            const rootKey = state.rootKey;

            keyManager.destroySession(sessionId);

            // Verify keys are wiped
            const isZeroed = Array.from(rootKey).every(b => b === 0 || b === 0xFF);
            expect(isZeroed).toBe(true);
        });

        it('should destroy all sessions', async () => {
            // Create multiple sessions
            for (let i = 0; i < 3; i++) {
                const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
                await keyManager.initializeRatchet(`session-${i}`, sharedSecret, true);
            }

            // Create session keys
            for (let i = 0; i < 3; i++) {
                await keyManager.generateSessionKeys();
            }

            const stats1 = keyManager.getStats();
            expect(stats1.activeKeys).toBe(3);
            expect(stats1.ratchetSessions).toBe(3);

            keyManager.destroyAll();

            const stats2 = keyManager.getStats();
            expect(stats2.activeKeys).toBe(0);
            expect(stats2.ratchetSessions).toBe(0);
            expect(stats2.skippedKeys).toBe(0);
        });
    });

    // ==========================================================================
    // Statistics Tests
    // ==========================================================================

    describe('Statistics', () => {
        it('should return accurate statistics', async () => {
            await keyManager.generateSessionKeys();
            await keyManager.generateSessionKeys();

            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            await keyManager.initializeRatchet('session-1', sharedSecret, true);

            const stats = keyManager.getStats();

            expect(stats.activeKeys).toBe(2);
            expect(stats.ratchetSessions).toBe(1);
            expect(stats.skippedKeys).toBe(0);
        });

        it('should track skipped keys', async () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));

            // Create peer keypair and initialize with peer public key
            const peerKeyPair = await keyManager.generateSessionKeys();
            const peerPublicKey = {
                kyberPublicKey: peerKeyPair.keyPair.kyber.publicKey,
                x25519PublicKey: peerKeyPair.keyPair.x25519.publicKey,
            };

            await keyManager.initializeRatchet('session-1', sharedSecret, false, peerPublicKey);

            // Skip to message 5
            keyManager.getReceiveKey('session-1', 5);

            const stats = keyManager.getStats();
            expect(stats.skippedKeys).toBe(5);
        });
    });

    // ==========================================================================
    // Singleton Pattern Tests
    // ==========================================================================

    describe('Singleton Pattern', () => {
        it('should return same instance', () => {
            const instance1 = EphemeralKeyManager.getInstance();
            const instance2 = EphemeralKeyManager.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('should share state between getInstance calls', async () => {
            const instance1 = EphemeralKeyManager.getInstance();
            await instance1.generateSessionKeys();

            const instance2 = EphemeralKeyManager.getInstance();
            const stats = instance2.getStats();

            expect(stats.activeKeys).toBeGreaterThan(0);
        });
    });

    // ==========================================================================
    // Edge Cases
    // ==========================================================================

    describe('Edge Cases', () => {
        it('should handle rapid key generation', async () => {
            const keys = await Promise.all(
                Array.from({ length: 20 }, () => keyManager.generateSessionKeys())
            );

            expect(keys.length).toBe(20);

            const uniqueIds = new Set(keys.map(k => k.id));
            expect(uniqueIds.size).toBe(20);
        });

        it('should limit skipped keys to MAX_SKIP', async () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            await keyManager.initializeRatchet('session-1', sharedSecret, false);

            // Try to skip more than MAX_SKIP (1000)
            keyManager.getReceiveKey('session-1', 1500);

            const stats = keyManager.getStats();
            expect(stats.skippedKeys).toBeLessThanOrEqual(1000);
        });

        it('should handle timer cleanup on destroy', async () => {
            const _sessionKey = await keyManager.generateSessionKeys(10000);
            void _sessionKey; // Suppress unused variable warning

            keyManager.destroyAll();

            // Advance timers - should not crash
            vi.advanceTimersByTime(15000);

            const stats = keyManager.getStats();
            expect(stats.activeKeys).toBe(0);
        });

        it('should handle DH ratchet step', async () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sessionId = 'test-session';

            // Initialize as initiator
            const _state = await keyManager.initializeRatchet(sessionId, sharedSecret, true);
            void _state; // Suppress unused variable warning

            // Create peer public key
            const _peerState = await keyManager.initializeRatchet('peer-session', sharedSecret, false);
            void _peerState; // Suppress unused variable warning
            const peerPublicKey = keyManager.getCurrentPublicKey('peer-session');

            // Perform DH ratchet step
            await keyManager.dhRatchetStep(sessionId, peerPublicKey!);

            // State should be updated
            const newPublicKey = keyManager.getCurrentPublicKey(sessionId);
            expect(newPublicKey).not.toBeNull();
        });
    });

    // ==========================================================================
    // Cleanup Periodic Tests
    // ==========================================================================

    describe('Periodic Cleanup', () => {
        it('should cleanup expired keys periodically', async () => {
            // Create keys with short lifetime
            await keyManager.generateSessionKeys(500);
            await keyManager.generateSessionKeys(500);

            const stats1 = keyManager.getStats();
            expect(stats1.activeKeys).toBe(2);

            // Fast forward past expiration and cleanup interval
            vi.advanceTimersByTime(61000);

            const stats2 = keyManager.getStats();
            expect(stats2.activeKeys).toBe(0);
        });
    });
});
