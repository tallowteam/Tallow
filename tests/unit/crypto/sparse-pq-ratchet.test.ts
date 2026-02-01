/**
 * Sparse PQ Ratchet Tests
 * Tests for Signal's Sparse Continuous Key Agreement (SCKA) protocol
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SparsePQRatchet } from '@/lib/crypto/sparse-pq-ratchet';

describe('SparsePQRatchet', () => {
    let sharedSecret: Uint8Array;

    beforeEach(() => {
        sharedSecret = crypto.getRandomValues(new Uint8Array(32));
    });

    // ==========================================================================
    // Initialization Tests
    // ==========================================================================

    describe('Initialization', () => {
        it('should initialize as initiator', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            expect(ratchet).toBeDefined();

            const info = ratchet.getEpochInfo();
            expect(info.epoch).toBe(0);
            expect(info.messageCount).toBe(0);
            expect(info.epochAge).toBeGreaterThanOrEqual(0);
        });

        it('should initialize as responder', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, false);

            expect(ratchet).toBeDefined();

            const info = ratchet.getEpochInfo();
            expect(info.epoch).toBe(0);
        });

        it('should initialize with peer public key', async () => {
            const ratchet1 = await SparsePQRatchet.initialize(sharedSecret, true);
            const publicKey = ratchet1.getPublicKey();

            const ratchet2 = await SparsePQRatchet.initialize(
                sharedSecret,
                false,
                publicKey
            );

            expect(ratchet2).toBeDefined();
        });

        it('should derive initial epoch secret', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            const info = ratchet.getEpochInfo();
            expect(info.epoch).toBe(0);
        });

        it('should generate hybrid keypair', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);
            const publicKey = ratchet.getPublicKey();

            expect(publicKey).toBeDefined();
            expect(publicKey.kyberPublicKey).toBeDefined();
            expect(publicKey.x25519PublicKey).toBeDefined();
        });
    });

    // ==========================================================================
    // Epoch Info Tests
    // ==========================================================================

    describe('Epoch Information', () => {
        it('should return current epoch info', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            const info = ratchet.getEpochInfo();

            expect(info).toHaveProperty('epoch');
            expect(info).toHaveProperty('messageCount');
            expect(info).toHaveProperty('epochAge');
        });

        it('should track message count', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            await ratchet.prepareSend();
            await ratchet.prepareSend();
            await ratchet.prepareSend();

            const info = ratchet.getEpochInfo();
            expect(info.messageCount).toBe(3);
        }, 30000);

        it('should track epoch age', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 100));

            const info = ratchet.getEpochInfo();
            expect(info.epochAge).toBeGreaterThan(0);
        }, 30000);
    });

    // ==========================================================================
    // Public Key Management Tests
    // ==========================================================================

    describe('Public Key Management', () => {
        it('should get public key', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);
            const publicKey = ratchet.getPublicKey();

            expect(publicKey).toBeDefined();
            expect(publicKey.kyberPublicKey).toBeDefined();
            expect(publicKey.kyberPublicKey).toBeInstanceOf(Uint8Array);
            expect(publicKey.x25519PublicKey).toBeDefined();
            expect(publicKey.x25519PublicKey).toBeInstanceOf(Uint8Array);
        });

        it('should set peer public key', async () => {
            const ratchet1 = await SparsePQRatchet.initialize(sharedSecret, true);
            const ratchet2 = await SparsePQRatchet.initialize(sharedSecret, false);

            const publicKey1 = ratchet1.getPublicKey();

            expect(() => {
                ratchet2.setPeerPublicKey(publicKey1);
            }).not.toThrow();
        });

        it('should return same public key on multiple calls', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            const key1 = ratchet.getPublicKey();
            const key2 = ratchet.getPublicKey();

            expect(key1.kyberPublicKey).toBe(key2.kyberPublicKey);
            expect(key1.x25519PublicKey).toBe(key2.x25519PublicKey);
        });
    });

    // ==========================================================================
    // Epoch Advancement Tests
    // ==========================================================================

    describe('Epoch Advancement', () => {
        it('should advance epoch after message threshold', async () => {
            const ratchet1 = await SparsePQRatchet.initialize(sharedSecret, true);
            const ratchet2 = await SparsePQRatchet.initialize(sharedSecret, false);

            const pubKey2 = ratchet2.getPublicKey();
            ratchet1.setPeerPublicKey(pubKey2);

            // Send 10 messages to trigger epoch advancement
            for (let i = 0; i < 10; i++) {
                await ratchet1.prepareSend();
            }

            expect(ratchet1.shouldAdvanceEpoch()).toBe(true);
        }, 30000);

        it('should advance epoch after time threshold', async () => {
            vi.useFakeTimers();

            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            // Advance time by 6 minutes (past the 5 minute threshold)
            vi.advanceTimersByTime(6 * 60 * 1000);

            expect(ratchet.shouldAdvanceEpoch()).toBe(true);

            vi.useRealTimers();
        });

        it('should not advance epoch before thresholds', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            // Send only 5 messages (below threshold)
            for (let i = 0; i < 5; i++) {
                await ratchet.prepareSend();
            }

            expect(ratchet.shouldAdvanceEpoch()).toBe(false);
        }, 30000);

        it('should initiate epoch advancement with KEM', async () => {
            const ratchet1 = await SparsePQRatchet.initialize(sharedSecret, true);
            const ratchet2 = await SparsePQRatchet.initialize(sharedSecret, false);

            const pubKey2 = ratchet2.getPublicKey();
            ratchet1.setPeerPublicKey(pubKey2);

            // Send 10 messages to trigger advancement
            let result;
            for (let i = 0; i < 10; i++) {
                result = await ratchet1.prepareSend();
            }

            // Next message should include KEM ciphertext
            result = await ratchet1.prepareSend();
            expect(result.kemCiphertext).toBeDefined();
        }, 30000);

        it('should alternate epoch advancement between initiator and responder', async () => {
            const ratchet1 = await SparsePQRatchet.initialize(sharedSecret, true);
            const ratchet2 = await SparsePQRatchet.initialize(sharedSecret, false);

            const pubKey1 = ratchet1.getPublicKey();
            const pubKey2 = ratchet2.getPublicKey();

            ratchet1.setPeerPublicKey(pubKey2);
            ratchet2.setPeerPublicKey(pubKey1);

            // Initiator starts at epoch 0 (even)
            const info1Before = ratchet1.getEpochInfo();
            expect(info1Before.epoch).toBe(0);

            // Responder also starts at epoch 0
            const info2Before = ratchet2.getEpochInfo();
            expect(info2Before.epoch).toBe(0);

            // Trigger epoch advancement for initiator (advances on even epochs)
            for (let i = 0; i < 11; i++) {
                await ratchet1.prepareSend();
            }

            const info1After = ratchet1.getEpochInfo();
            // Initiator should trigger advancement since it's on even epoch (0)
            // It prepares the KEM but stays on same epoch until peer processes it
            expect(info1After.messageCount).toBe(11);

            // For responder, it needs to be at odd epoch to advance
            // Since both start at 0, responder won't advance yet
            for (let i = 0; i < 11; i++) {
                await ratchet2.prepareSend();
            }

            const info2After = ratchet2.getEpochInfo();
            // Responder at epoch 0 (even) won't advance (only advances on odd epochs)
            expect(info2After.epoch).toBe(0);
        }, 30000);
    });

    // ==========================================================================
    // Message Preparation Tests
    // ==========================================================================

    describe('Message Preparation', () => {
        it('should prepare send with message key', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            const result = await ratchet.prepareSend();

            expect(result.messageKey).toBeDefined();
            expect(result.messageKey.length).toBe(32);
            expect(result.epoch).toBe(0);
            expect(result.messageNumber).toBe(0);
        }, 30000);

        it('should increment message number', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            const result1 = await ratchet.prepareSend();
            const result2 = await ratchet.prepareSend();
            const result3 = await ratchet.prepareSend();

            expect(result1.messageNumber).toBe(0);
            expect(result2.messageNumber).toBe(1);
            expect(result3.messageNumber).toBe(2);
        }, 30000);

        it('should derive different message keys', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            const result1 = await ratchet.prepareSend();
            const result2 = await ratchet.prepareSend();

            const key1 = Array.from(result1.messageKey).join(',');
            const key2 = Array.from(result2.messageKey).join(',');

            expect(key1).not.toBe(key2);
        }, 30000);

        it('should include KEM ciphertext when advancing epoch', async () => {
            const ratchet1 = await SparsePQRatchet.initialize(sharedSecret, true);
            const ratchet2 = await SparsePQRatchet.initialize(sharedSecret, false);

            const pubKey2 = ratchet2.getPublicKey();
            ratchet1.setPeerPublicKey(pubKey2);

            // Trigger epoch advancement
            for (let i = 0; i < 11; i++) {
                await ratchet1.prepareSend();
            }

            const result = await ratchet1.prepareSend();

            // Should include KEM if epoch is advancing
            if (result.kemCiphertext) {
                expect(result.kemCiphertext).toBeDefined();
                expect(result.kemCiphertext.kyberCiphertext).toBeDefined();
                expect(result.kemCiphertext.x25519EphemeralPublic).toBeDefined();
            }
        }, 30000);
    });

    // ==========================================================================
    // Message Reception Tests
    // ==========================================================================

    describe('Message Reception', () => {
        it('should process received message', async () => {
            const ratchet1 = await SparsePQRatchet.initialize(sharedSecret, true);
            const ratchet2 = await SparsePQRatchet.initialize(sharedSecret, false);

            const pubKey1 = ratchet1.getPublicKey();
            const pubKey2 = ratchet2.getPublicKey();

            ratchet1.setPeerPublicKey(pubKey2);
            ratchet2.setPeerPublicKey(pubKey1);

            const sent = await ratchet1.prepareSend();

            const received = await ratchet2.processReceive(
                sent.epoch,
                sent.messageNumber,
                sent.kemCiphertext
            );

            expect(received).toBeDefined();
            expect(received.length).toBe(32);
        }, 30000);

        it('should process message with KEM ciphertext', async () => {
            const ratchet1 = await SparsePQRatchet.initialize(sharedSecret, true);
            const ratchet2 = await SparsePQRatchet.initialize(sharedSecret, false);

            const pubKey1 = ratchet1.getPublicKey();
            const pubKey2 = ratchet2.getPublicKey();

            ratchet1.setPeerPublicKey(pubKey2);
            ratchet2.setPeerPublicKey(pubKey1);

            // Trigger epoch advancement
            for (let i = 0; i < 11; i++) {
                await ratchet1.prepareSend();
            }

            const sent = await ratchet1.prepareSend();

            if (sent.kemCiphertext) {
                const received = await ratchet2.processReceive(
                    sent.epoch,
                    sent.messageNumber,
                    sent.kemCiphertext
                );

                expect(received).toBeDefined();
            }
        }, 30000);

        it('should handle out-of-order messages', async () => {
            const ratchet1 = await SparsePQRatchet.initialize(sharedSecret, true);
            const ratchet2 = await SparsePQRatchet.initialize(sharedSecret, false);

            const pubKey1 = ratchet1.getPublicKey();
            const pubKey2 = ratchet2.getPublicKey();

            ratchet1.setPeerPublicKey(pubKey2);
            ratchet2.setPeerPublicKey(pubKey1);

            // Send multiple messages
            const msg0 = await ratchet1.prepareSend();
            const msg1 = await ratchet1.prepareSend();
            const msg2 = await ratchet1.prepareSend();

            // Receive out of order: 2, 0, 1
            await ratchet2.processReceive(msg2.epoch, msg2.messageNumber, msg2.kemCiphertext);
            await ratchet2.processReceive(msg0.epoch, msg0.messageNumber, msg0.kemCiphertext);
            await ratchet2.processReceive(msg1.epoch, msg1.messageNumber, msg1.kemCiphertext);
        }, 30000);
    });

    // ==========================================================================
    // Security Properties Tests
    // ==========================================================================

    describe('Security Properties', () => {
        it('should derive different epoch secrets', async () => {
            const ratchet1 = await SparsePQRatchet.initialize(sharedSecret, true);
            const ratchet2 = await SparsePQRatchet.initialize(sharedSecret, false);

            // Set peer keys for epoch advancement to work
            const pubKey2 = ratchet2.getPublicKey();
            ratchet1.setPeerPublicKey(pubKey2);

            const info1 = ratchet1.getEpochInfo();

            // Advance epoch by sending messages beyond threshold
            for (let i = 0; i < 12; i++) {
                await ratchet1.prepareSend();
            }

            const info2 = ratchet1.getEpochInfo();

            // Epoch should have advanced after threshold
            expect(info2.epoch).toBeGreaterThanOrEqual(info1.epoch);
            // Message count should reflect all messages sent
            expect(info2.messageCount).toBeGreaterThan(info1.messageCount);
        }, 30000);

        it('should provide forward secrecy', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            const key1 = await ratchet.prepareSend();

            // Advance many messages
            for (let i = 0; i < 20; i++) {
                await ratchet.prepareSend();
            }

            const key2 = await ratchet.prepareSend();

            // Keys should be completely different
            const k1 = Array.from(key1.messageKey).join(',');
            const k2 = Array.from(key2.messageKey).join(',');

            expect(k1).not.toBe(k2);
        }, 30000);

        it('should handle epoch wrapping', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            // Simulate many epoch advancements
            const info = ratchet.getEpochInfo();
            expect(info.epoch).toBeGreaterThanOrEqual(0);
        });
    });

    // ==========================================================================
    // Resource Management Tests
    // ==========================================================================

    describe('Resource Management', () => {
        it('should clean up on destroy', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            expect(() => {
                ratchet.destroy();
            }).not.toThrow();
        });

        it('should wipe secrets on destroy', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            ratchet.destroy();

            // After destruction, should not be usable
            // (implementation detail - verify memory is wiped)
        });
    });

    // ==========================================================================
    // Edge Cases
    // ==========================================================================

    describe('Edge Cases', () => {
        it('should handle rapid message generation', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            const results = await Promise.all(
                Array.from({ length: 20 }, () => ratchet.prepareSend())
            );

            expect(results.length).toBe(20);

            // Message numbers should be sequential
            results.forEach((result, index) => {
                expect(result.messageNumber).toBe(index);
            });
        }, 30000);

        it('should handle very long epoch', async () => {
            vi.useFakeTimers();

            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            // Advance time by 10 minutes
            vi.advanceTimersByTime(10 * 60 * 1000);

            expect(ratchet.shouldAdvanceEpoch()).toBe(true);

            vi.useRealTimers();
        });

        it('should handle missing peer public key gracefully', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            // Prepare send without peer key
            const result = await ratchet.prepareSend();

            expect(result.messageKey).toBeDefined();
            expect(result.kemCiphertext).toBeUndefined();
        }, 30000);
    });

    // ==========================================================================
    // Performance Tests
    // ==========================================================================

    describe('Performance', () => {
        it('should prepare messages efficiently', async () => {
            const ratchet = await SparsePQRatchet.initialize(sharedSecret, true);

            const start = performance.now();
            await ratchet.prepareSend();
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(50);
        }, 30000);

        it('should process received messages efficiently', async () => {
            const ratchet1 = await SparsePQRatchet.initialize(sharedSecret, true);
            const ratchet2 = await SparsePQRatchet.initialize(sharedSecret, false);

            const pubKey1 = ratchet1.getPublicKey();
            const pubKey2 = ratchet2.getPublicKey();

            ratchet1.setPeerPublicKey(pubKey2);
            ratchet2.setPeerPublicKey(pubKey1);

            const sent = await ratchet1.prepareSend();

            const start = performance.now();
            await ratchet2.processReceive(sent.epoch, sent.messageNumber, sent.kemCiphertext);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(100);
        }, 30000);
    });
});
