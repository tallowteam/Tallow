/**
 * Peer Authentication Tests
 * Tests for SAS generation, verification, and session management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
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
    getVerificationSessions,
    initVerificationCache,
    saveVerificationSession,
    type SASResult,
    type VerificationSession,
} from '@/lib/crypto/peer-authentication';

// Mock pqCrypto to control hash output for testing
vi.mock('@/lib/crypto/pqc-crypto', () => {
    // Simple deterministic hash for testing - XOR fold the input
    const deterministicHash = (input: Uint8Array): Uint8Array => {
        const result = new Uint8Array(32);
        for (let i = 0; i < input.length; i++) {
            const inputByte = input[i]!;
            const resultIndex = i % 32;
            result[resultIndex] = result[resultIndex]! ^ inputByte;
        }
        // Add some additional mixing to make it more "hash-like"
        for (let i = 0; i < 32; i++) {
            const resultByte = result[i]!;
            result[i] = (resultByte * 31 + i) & 0xFF;
        }
        return result;
    };

    return {
        pqCrypto: {
            hash: vi.fn((input: Uint8Array) => {
                return deterministicHash(input);
            }),
            constantTimeEqual: vi.fn((a: Uint8Array, b: Uint8Array) => {
                if (a.length !== b.length) {return false;}
                let diff = 0;
                for (let i = 0; i < a.length; i++) {
                    diff |= a[i]! ^ b[i]!;
                }
                return diff === 0;
            }),
        },
    };
});

describe('Peer Authentication', () => {
    beforeEach(async () => {
        // Clean up localStorage mock and reset cache before each test
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
        // Reset the internal cache by re-initializing after clearing storage
        // This forces a fresh load from empty storage
        await initVerificationCache();
    });

    afterEach(() => {
        // Clean up localStorage mock
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
    });

    // ==========================================================================
    // SAS Generation Tests
    // ==========================================================================

    describe('SAS Generation', () => {
        it('should generate valid SAS from shared secret', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sas = generateSAS(sharedSecret);

            expect(sas).toBeDefined();
            expect(sas.phrase).toBeDefined();
            expect(sas.words).toHaveLength(3);
            expect(sas.hash).toBeDefined();
            expect(sas.timestamp).toBeDefined();
        });

        it('should generate deterministic SAS', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));

            const sas1 = generateSAS(sharedSecret);
            const sas2 = generateSAS(sharedSecret);

            expect(sas1.phrase).toBe(sas2.phrase);
            expect(sas1.hash).toBe(sas2.hash);
            expect(sas1.words).toEqual(sas2.words);
        });

        it('should generate different SAS for different secrets', () => {
            const secret1 = crypto.getRandomValues(new Uint8Array(32));
            const secret2 = crypto.getRandomValues(new Uint8Array(32));

            const sas1 = generateSAS(secret1);
            const sas2 = generateSAS(secret2);

            expect(sas1.phrase).not.toBe(sas2.phrase);
            expect(sas1.hash).not.toBe(sas2.hash);
        });

        it('should generate SAS with session binding', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sessionId = 'test-session-123';

            const sas1 = generateSAS(sharedSecret);
            const sas2 = generateSAS(sharedSecret, sessionId);

            // Should be different due to session binding
            expect(sas1.hash).not.toBe(sas2.hash);
        });

        it('should produce same SAS with same session ID', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sessionId = 'test-session-123';

            const sas1 = generateSAS(sharedSecret, sessionId);
            const sas2 = generateSAS(sharedSecret, sessionId);

            expect(sas1.phrase).toBe(sas2.phrase);
            expect(sas1.hash).toBe(sas2.hash);
        });

        it('should generate phrase with 3 words separated by hyphens', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sas = generateSAS(sharedSecret);

            const parts = sas.phrase.split('-');
            expect(parts).toHaveLength(3);

            parts.forEach(word => {
                expect(word.length).toBeGreaterThan(0);
                expect(word).toMatch(/^[A-Z]+$/);
            });
        });

        it('should generate words array matching phrase', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sas = generateSAS(sharedSecret);

            expect(sas.words.join('-')).toBe(sas.phrase);
        });

        it('should generate valid hex hash', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sas = generateSAS(sharedSecret);

            expect(sas.hash).toMatch(/^[0-9a-f]+$/);
            expect(sas.hash.length).toBeGreaterThan(0);
            expect(sas.hash.length % 2).toBe(0); // Valid hex string
        });

        it('should include recent timestamp', () => {
            const before = Date.now();
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sas = generateSAS(sharedSecret);
            const after = Date.now();

            expect(sas.timestamp).toBeGreaterThanOrEqual(before);
            expect(sas.timestamp).toBeLessThanOrEqual(after);
        });
    });

    // ==========================================================================
    // SAS Verification Tests
    // ==========================================================================

    describe('SAS Verification', () => {
        it('should verify matching SAS', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));

            const sas1 = generateSAS(sharedSecret);
            const sas2 = generateSAS(sharedSecret);

            expect(verifySAS(sas1, sas2)).toBe(true);
        });

        it('should reject non-matching SAS', () => {
            const secret1 = crypto.getRandomValues(new Uint8Array(32));
            const secret2 = crypto.getRandomValues(new Uint8Array(32));

            const sas1 = generateSAS(secret1);
            const sas2 = generateSAS(secret2);

            expect(verifySAS(sas1, sas2)).toBe(false);
        });

        it('should use constant-time comparison', () => {
            // Generate two different SAS
            const secret1 = crypto.getRandomValues(new Uint8Array(32));
            const secret2 = crypto.getRandomValues(new Uint8Array(32));

            const sas1 = generateSAS(secret1);
            const sas2 = generateSAS(secret2);

            // Measure time for matching
            const start1 = performance.now();
            verifySAS(sas1, sas1);
            const time1 = performance.now() - start1;

            // Measure time for non-matching
            const start2 = performance.now();
            verifySAS(sas1, sas2);
            const time2 = performance.now() - start2;

            // Times should be similar (constant-time)
            // Allow for some variance
            const ratio = time1 / time2;
            expect(ratio).toBeGreaterThan(0.5);
            expect(ratio).toBeLessThan(2);
        });

        it('should verify with session-bound SAS', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sessionId = 'test-session';

            const sas1 = generateSAS(sharedSecret, sessionId);
            const sas2 = generateSAS(sharedSecret, sessionId);

            expect(verifySAS(sas1, sas2)).toBe(true);
        });
    });

    // ==========================================================================
    // Numeric SAS Tests
    // ==========================================================================

    describe('Numeric SAS', () => {
        it('should generate 6-digit numeric SAS', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const numericSAS = generateNumericSAS(sharedSecret);

            expect(numericSAS).toMatch(/^\d{6}$/);
        });

        it('should generate deterministic numeric SAS', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));

            const sas1 = generateNumericSAS(sharedSecret);
            const sas2 = generateNumericSAS(sharedSecret);

            expect(sas1).toBe(sas2);
        });

        it('should generate different numeric SAS for different secrets', () => {
            const secret1 = crypto.getRandomValues(new Uint8Array(32));
            const secret2 = crypto.getRandomValues(new Uint8Array(32));

            const sas1 = generateNumericSAS(secret1);
            const sas2 = generateNumericSAS(secret2);

            expect(sas1).not.toBe(sas2);
        });

        it('should pad with zeros', () => {
            // Create a secret that will produce a small number after hashing
            // Note: We can't predict exact hash output, so test padding format
            const sharedSecret = new Uint8Array(32);
            sharedSecret[0] = 0;
            sharedSecret[1] = 0;
            sharedSecret[2] = 5;

            const numericSAS = generateNumericSAS(sharedSecret);

            // Should always be 6 digits (padded if necessary)
            expect(numericSAS).toMatch(/^\d{6}$/);
            expect(numericSAS.length).toBe(6);
        });

        it('should handle edge case with zero bytes', () => {
            const sharedSecret = new Uint8Array(32);
            const numericSAS = generateNumericSAS(sharedSecret);

            // Should produce a valid 6-digit number even with all zeros
            expect(numericSAS).toMatch(/^\d{6}$/);
            expect(numericSAS.length).toBe(6);
        });
    });

    // ==========================================================================
    // Emoji Formatting Tests
    // ==========================================================================

    describe('Emoji Formatting', () => {
        it('should format SAS with emojis', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sas = generateSAS(sharedSecret);
            const formatted = formatSASWithEmoji(sas);

            expect(formatted).toBeDefined();
            expect(formatted.length).toBeGreaterThan(0);

            // Should contain at least some words from the SAS
            sas.words.forEach(word => {
                expect(formatted).toContain(word);
            });
        });

        it('should include emojis in formatted output', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sas = generateSAS(sharedSecret);
            const formatted = formatSASWithEmoji(sas);

            // Check for emoji presence (rough check)
            const hasEmoji = /[\u{1F000}-\u{1F9FF}]/u.test(formatted);
            expect(hasEmoji || formatted.includes('🔷')).toBe(true);
        });

        it('should separate words with double space', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const sas = generateSAS(sharedSecret);
            const formatted = formatSASWithEmoji(sas);

            expect(formatted).toContain('  ');
        });
    });

    // ==========================================================================
    // Verification Session Tests
    // ==========================================================================

    describe('Verification Sessions', () => {
        it('should create verification session', () => {
            const peerId = 'peer-123';
            const peerName = 'Alice';
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));

            const session = createVerificationSession(peerId, peerName, sharedSecret);

            expect(session.id).toBeDefined();
            expect(session.peerId).toBe(peerId);
            expect(session.peerName).toBe(peerName);
            expect(session.sas).toBeDefined();
            expect(session.status).toBe('unverified');
            expect(session.createdAt).toBeDefined();
            expect(session.verifiedAt).toBeUndefined();
        });

        it('should generate unique session IDs', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));

            const session1 = createVerificationSession('peer-1', 'Alice', sharedSecret);
            const session2 = createVerificationSession('peer-2', 'Bob', sharedSecret);

            expect(session1.id).not.toBe(session2.id);
        });

        it('should mark session as verified', async () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const session = createVerificationSession('peer-123', 'Alice', sharedSecret);

            // Wait for save to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            await markSessionVerified(session.id);

            const sessions = getVerificationSessions();
            const updated = sessions.find(s => s.id === session.id);

            expect(updated?.status).toBe('verified');
            expect(updated?.verifiedAt).toBeDefined();
        });

        it('should mark session as failed', async () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const session = createVerificationSession('peer-123', 'Alice', sharedSecret);

            await new Promise(resolve => setTimeout(resolve, 100));
            await markSessionFailed(session.id);

            const sessions = getVerificationSessions();
            const updated = sessions.find(s => s.id === session.id);

            expect(updated?.status).toBe('failed');
        });

        it('should mark session as skipped', async () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const session = createVerificationSession('peer-123', 'Alice', sharedSecret);

            await new Promise(resolve => setTimeout(resolve, 100));
            await markSessionSkipped(session.id);

            const sessions = getVerificationSessions();
            const updated = sessions.find(s => s.id === session.id);

            expect(updated?.status).toBe('skipped');
        });

        it('should check if peer is verified', async () => {
            // Use unique peer ID to avoid conflicts with other tests
            const uniquePeerId = `peer-verify-test-${Date.now()}`;
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const session = createVerificationSession(uniquePeerId, 'Alice', sharedSecret);

            await new Promise(resolve => setTimeout(resolve, 100));

            // Initially not verified
            let isVerified = isPeerVerified(uniquePeerId);
            expect(isVerified).toBe(false);

            // After verification
            await markSessionVerified(session.id);
            await new Promise(resolve => setTimeout(resolve, 100));

            isVerified = isPeerVerified(uniquePeerId);
            expect(isVerified).toBe(true);
        });

        it('should get verification for peer', async () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const session = createVerificationSession('peer-123', 'Alice', sharedSecret);

            await new Promise(resolve => setTimeout(resolve, 100));
            await markSessionVerified(session.id);
            await new Promise(resolve => setTimeout(resolve, 100));

            const verification = getVerificationForPeer('peer-123');

            expect(verification).not.toBeNull();
            expect(verification?.peerId).toBe('peer-123');
            expect(verification?.status).toBe('verified');
        });

        it('should return null for unverified peer', () => {
            const verification = getVerificationForPeer('unknown-peer');
            expect(verification).toBeNull();
        });

        it('should get all verification sessions', async () => {
            const secret1 = crypto.getRandomValues(new Uint8Array(32));
            const secret2 = crypto.getRandomValues(new Uint8Array(32));

            createVerificationSession('peer-1', 'Alice', secret1);
            createVerificationSession('peer-2', 'Bob', secret2);

            await new Promise(resolve => setTimeout(resolve, 100));

            const sessions = getVerificationSessions();
            expect(sessions.length).toBeGreaterThanOrEqual(2);
        });
    });

    // ==========================================================================
    // Session Storage Tests
    // ==========================================================================

    describe('Session Storage', () => {
        it('should save and load session', async () => {
            const session: VerificationSession = {
                id: 'test-session',
                peerId: 'peer-123',
                peerName: 'Alice',
                sas: {
                    phrase: 'TEST-PHRASE-DATA',
                    words: ['TEST', 'PHRASE', 'DATA'],
                    hash: 'abcd1234',
                    timestamp: Date.now(),
                },
                status: 'verified',
                createdAt: Date.now(),
                verifiedAt: Date.now(),
            };

            await saveVerificationSession(session);
            await new Promise(resolve => setTimeout(resolve, 100));

            const sessions = getVerificationSessions();
            const loaded = sessions.find(s => s.id === session.id);

            expect(loaded).toBeDefined();
            expect(loaded?.peerId).toBe(session.peerId);
            expect(loaded?.peerName).toBe(session.peerName);
            expect(loaded?.status).toBe(session.status);
        });

        it('should update existing session', async () => {
            const session: VerificationSession = {
                id: 'test-session',
                peerId: 'peer-123',
                peerName: 'Alice',
                sas: {
                    phrase: 'TEST-PHRASE-DATA',
                    words: ['TEST', 'PHRASE', 'DATA'],
                    hash: 'abcd1234',
                    timestamp: Date.now(),
                },
                status: 'unverified',
                createdAt: Date.now(),
            };

            await saveVerificationSession(session);
            await new Promise(resolve => setTimeout(resolve, 100));

            // Update status
            session.status = 'verified';
            session.verifiedAt = Date.now();

            await saveVerificationSession(session);
            await new Promise(resolve => setTimeout(resolve, 100));

            const sessions = getVerificationSessions();
            const updated = sessions.find(s => s.id === session.id);

            expect(updated?.status).toBe('verified');
            expect(updated?.verifiedAt).toBeDefined();
        });

        it('should limit stored sessions to 50', async () => {
            // Create 60 sessions
            for (let i = 0; i < 60; i++) {
                const session: VerificationSession = {
                    id: `session-${i}`,
                    peerId: `peer-${i}`,
                    peerName: `User ${i}`,
                    sas: {
                        phrase: 'TEST-PHRASE-DATA',
                        words: ['TEST', 'PHRASE', 'DATA'],
                        hash: 'abcd1234',
                        timestamp: Date.now(),
                    },
                    status: 'verified',
                    createdAt: Date.now() + i,
                };
                await saveVerificationSession(session);
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            const sessions = getVerificationSessions();
            expect(sessions.length).toBeLessThanOrEqual(50);

            // Should keep the most recent ones
            const hasRecent = sessions.some(s => s.id === 'session-59');
            expect(hasRecent).toBe(true);
        });
    });

    // ==========================================================================
    // Cache Initialization Tests
    // ==========================================================================

    describe('Cache Initialization', () => {
        it('should initialize cache on startup', async () => {
            await initVerificationCache();

            // Should not throw and cache should be ready
            const sessions = getVerificationSessions();
            expect(Array.isArray(sessions)).toBe(true);
        });

        it('should only initialize cache once', async () => {
            await initVerificationCache();
            await initVerificationCache();
            await initVerificationCache();

            // Multiple calls should not cause issues
            const sessions = getVerificationSessions();
            expect(Array.isArray(sessions)).toBe(true);
        });

        it('should handle server-side rendering', async () => {
            // Should not crash in SSR environment
            await expect(initVerificationCache()).resolves.toBeUndefined();
        });
    });

    // ==========================================================================
    // Edge Cases
    // ==========================================================================

    describe('Edge Cases', () => {
        it('should handle empty shared secret', () => {
            const sharedSecret = new Uint8Array(0);
            const sas = generateSAS(sharedSecret);

            expect(sas.phrase).toBeDefined();
            expect(sas.words.length).toBeGreaterThan(0);
        });

        it('should handle very large shared secret', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(1024));
            const sas = generateSAS(sharedSecret);

            expect(sas.phrase).toBeDefined();
            expect(sas.words).toHaveLength(3);
        });

        it('should handle concurrent session creation', async () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));

            const sessions = await Promise.all(
                Array.from({ length: 10 }, (_, i) =>
                    Promise.resolve(createVerificationSession(`peer-${i}`, `User ${i}`, sharedSecret))
                )
            );

            expect(sessions.length).toBe(10);

            const uniqueIds = new Set(sessions.map(s => s.id));
            expect(uniqueIds.size).toBe(10);
        });

        it('should handle marking non-existent session', async () => {
            await expect(
                markSessionVerified('non-existent-id')
            ).resolves.toBeUndefined();

            await expect(
                markSessionFailed('non-existent-id')
            ).resolves.toBeUndefined();

            await expect(
                markSessionSkipped('non-existent-id')
            ).resolves.toBeUndefined();
        });

        it('should handle corrupted SAS data', () => {
            const sas1: SASResult = {
                phrase: 'VALID-PHRASE-HERE',
                words: ['VALID', 'PHRASE', 'HERE'],
                hash: 'abcd',
                timestamp: Date.now(),
            };

            const sas2: SASResult = {
                phrase: 'DIFFERENT-PHRASE-HERE',
                words: ['DIFFERENT', 'PHRASE', 'HERE'],
                hash: 'xyz', // Invalid hex, too short
                timestamp: Date.now(),
            };

            // Should handle gracefully without crashing
            expect(() => verifySAS(sas1, sas2)).not.toThrow();
        });
    });

    // ==========================================================================
    // Security Tests
    // ==========================================================================

    describe('Security Properties', () => {
        it('should produce different SAS for similar but different secrets', () => {
            const secret1 = new Uint8Array(32);
            secret1.fill(0x01);

            const secret2 = new Uint8Array(32);
            secret2.fill(0x01);
            secret2[31] = 0x02; // Only last byte different

            const sas1 = generateSAS(secret1);
            const sas2 = generateSAS(secret2);

            expect(sas1.hash).not.toBe(sas2.hash);
        });

        it('should not expose raw shared secret in SAS', () => {
            const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
            const secretHex = Array.from(sharedSecret)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            const sas = generateSAS(sharedSecret);

            // SAS phrase should not contain secret data
            expect(sas.phrase).not.toContain(secretHex);
            expect(sas.hash).not.toBe(secretHex);
        });

        it('should provide high entropy in word selection', () => {
            const results = new Set<string>();

            // Generate 100 SAS phrases
            for (let i = 0; i < 100; i++) {
                const secret = crypto.getRandomValues(new Uint8Array(32));
                const sas = generateSAS(secret);
                results.add(sas.phrase);
            }

            // Should have high uniqueness
            expect(results.size).toBeGreaterThan(95);
        });
    });
});
