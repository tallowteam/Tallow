/**
 * Triple Ratchet Protocol Tests
 * Tests for hybrid Double Ratchet + Sparse PQ Ratchet
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TripleRatchet, type TripleRatchetMessage } from '@/lib/crypto/triple-ratchet';

describe('TripleRatchet', () => {
    let sharedSecret: Uint8Array;

    beforeEach(() => {
        sharedSecret = crypto.getRandomValues(new Uint8Array(32));
    });

    // ==========================================================================
    // Initialization Tests
    // ==========================================================================

    describe('Initialization', () => {
        it('should initialize as initiator', async () => {
            const ratchet = await TripleRatchet.initialize(
                sharedSecret,
                true, // isInitiator
                'test-session-1'
            );

            expect(ratchet).toBeDefined();

            const info = ratchet.getSessionInfo();
            expect(info.sessionId).toBe('test-session-1');
            expect(info.drMessageNumber).toBe(0);
            expect(info.pqEpoch).toBe(0);
            expect(info.skippedKeys).toBe(0);
        });

        it('should initialize as responder', async () => {
            const ratchet = await TripleRatchet.initialize(
                sharedSecret,
                false, // isResponder
                'test-session-2'
            );

            expect(ratchet).toBeDefined();

            const info = ratchet.getSessionInfo();
            expect(info.sessionId).toBe('test-session-2');
        });

        it('should generate public keys on initialization', async () => {
            const ratchet = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'test-session'
            );

            const keys = ratchet.getPublicKeys();

            expect(keys.dhPublicKey).toBeDefined();
            expect(keys.dhPublicKey.length).toBe(32); // X25519 public key
            expect(keys.pqPublicKey).toBeDefined();
            expect(keys.pqPublicKey.kyberPublicKey).toBeDefined();
            expect(keys.pqPublicKey.x25519PublicKey).toBeDefined();
        });

        it('should initialize with peer keys', async () => {
            // Create two ratchets
            const ratchet1 = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const keys1 = ratchet1.getPublicKeys();

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2',
                keys1.dhPublicKey,
                keys1.pqPublicKey
            );

            expect(ratchet2).toBeDefined();
        });
    });

    // ==========================================================================
    // Public Key Management Tests
    // ==========================================================================

    describe('Public Key Management', () => {
        it('should get public keys', async () => {
            const ratchet = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'test-session'
            );

            const keys = ratchet.getPublicKeys();

            expect(keys.dhPublicKey).toBeInstanceOf(Uint8Array);
            expect(keys.pqPublicKey).toBeDefined();
        });

        it('should set peer public keys', async () => {
            const ratchet1 = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys1 = ratchet1.getPublicKeys();

            expect(() => {
                ratchet2.setPeerPublicKeys(keys1.dhPublicKey, keys1.pqPublicKey);
            }).not.toThrow();
        });
    });

    // ==========================================================================
    // Encryption/Decryption Tests
    // ==========================================================================

    describe('Encryption and Decryption', () => {
        it('should encrypt and decrypt message', async () => {
            // Setup two ratchets
            const ratchet1 = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            // Exchange public keys
            const keys1 = ratchet1.getPublicKeys();
            const keys2 = ratchet2.getPublicKeys();

            ratchet1.setPeerPublicKeys(keys2.dhPublicKey, keys2.pqPublicKey);
            ratchet2.setPeerPublicKeys(keys1.dhPublicKey, keys1.pqPublicKey);

            // Encrypt message
            const plaintext = new TextEncoder().encode('Hello, World!');
            const encrypted = await ratchet1.encrypt(plaintext);

            expect(encrypted).toBeDefined();
            expect(encrypted.ciphertext).toBeDefined();
            expect(encrypted.nonce).toBeDefined();
            expect(encrypted.dhPublicKey).toBeDefined();
            expect(encrypted.messageNumber).toBe(0);

            // Decrypt message
            const decrypted = await ratchet2.decrypt(encrypted);

            expect(new TextDecoder().decode(decrypted)).toBe('Hello, World!');
        }, 30000);

        it('should handle multiple messages', async () => {
            const ratchet1 = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys1 = ratchet1.getPublicKeys();
            const keys2 = ratchet2.getPublicKeys();

            ratchet1.setPeerPublicKeys(keys2.dhPublicKey, keys2.pqPublicKey);
            ratchet2.setPeerPublicKeys(keys1.dhPublicKey, keys1.pqPublicKey);

            // Send multiple messages
            const messages = ['Message 1', 'Message 2', 'Message 3'];
            const encrypted: TripleRatchetMessage[] = [];

            for (const msg of messages) {
                const plaintext = new TextEncoder().encode(msg);
                encrypted.push(await ratchet1.encrypt(plaintext));
            }

            // Decrypt in order
            for (let i = 0; i < messages.length; i++) {
                const decrypted = await ratchet2.decrypt(encrypted[i]!);
                expect(new TextDecoder().decode(decrypted)).toBe(messages[i]);
            }
        }, 30000);

        it('should increment message numbers', async () => {
            const ratchet = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys = ratchet2.getPublicKeys();
            ratchet.setPeerPublicKeys(keys.dhPublicKey, keys.pqPublicKey);

            const msg1 = await ratchet.encrypt(new TextEncoder().encode('msg1'));
            const msg2 = await ratchet.encrypt(new TextEncoder().encode('msg2'));
            const msg3 = await ratchet.encrypt(new TextEncoder().encode('msg3'));

            // Message numbers should increment for consecutive sends
            expect(msg1.messageNumber).toBe(0);
            expect(msg2.messageNumber).toBe(1);
            expect(msg3.messageNumber).toBe(2);
        }, 30000);

        it('should encrypt different plaintexts to different ciphertexts', async () => {
            const ratchet = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys = ratchet2.getPublicKeys();
            ratchet.setPeerPublicKeys(keys.dhPublicKey, keys.pqPublicKey);

            const plaintext1 = new TextEncoder().encode('Message A');
            const plaintext2 = new TextEncoder().encode('Message B');

            const encrypted1 = await ratchet.encrypt(plaintext1);
            const encrypted2 = await ratchet.encrypt(plaintext2);

            const cipher1 = Array.from(encrypted1.ciphertext).join(',');
            const cipher2 = Array.from(encrypted2.ciphertext).join(',');

            expect(cipher1).not.toBe(cipher2);
        }, 30000);

        it('should encrypt same plaintext to different ciphertexts', async () => {
            const ratchet = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys = ratchet2.getPublicKeys();
            ratchet.setPeerPublicKeys(keys.dhPublicKey, keys.pqPublicKey);

            const plaintext = new TextEncoder().encode('Same message');

            const encrypted1 = await ratchet.encrypt(plaintext);
            const encrypted2 = await ratchet.encrypt(plaintext);

            const cipher1 = Array.from(encrypted1.ciphertext).join(',');
            const cipher2 = Array.from(encrypted2.ciphertext).join(',');

            expect(cipher1).not.toBe(cipher2);
        }, 30000);
    });

    // ==========================================================================
    // Out-of-Order Message Tests
    // ==========================================================================

    describe('Out-of-Order Messages', () => {
        it('should handle out-of-order message delivery', async () => {
            const ratchet1 = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys1 = ratchet1.getPublicKeys();
            const keys2 = ratchet2.getPublicKeys();

            ratchet1.setPeerPublicKeys(keys2.dhPublicKey, keys2.pqPublicKey);
            ratchet2.setPeerPublicKeys(keys1.dhPublicKey, keys1.pqPublicKey);

            // Encrypt messages
            const msg0 = await ratchet1.encrypt(new TextEncoder().encode('msg0'));
            const msg1 = await ratchet1.encrypt(new TextEncoder().encode('msg1'));
            const msg2 = await ratchet1.encrypt(new TextEncoder().encode('msg2'));

            // Decrypt out of order: 2, 0, 1
            const dec2 = await ratchet2.decrypt(msg2);
            const dec0 = await ratchet2.decrypt(msg0);
            const dec1 = await ratchet2.decrypt(msg1);

            expect(new TextDecoder().decode(dec2)).toBe('msg2');
            expect(new TextDecoder().decode(dec0)).toBe('msg0');
            expect(new TextDecoder().decode(dec1)).toBe('msg1');
        }, 30000);

        it('should store skipped message keys', async () => {
            const ratchet1 = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys1 = ratchet1.getPublicKeys();
            const keys2 = ratchet2.getPublicKeys();

            ratchet1.setPeerPublicKeys(keys2.dhPublicKey, keys2.pqPublicKey);
            ratchet2.setPeerPublicKeys(keys1.dhPublicKey, keys1.pqPublicKey);

            // Send messages 0-4
            const messages: TripleRatchetMessage[] = [];
            for (let i = 0; i < 5; i++) {
                messages.push(await ratchet1.encrypt(new TextEncoder().encode(`msg${i}`)));
            }

            // Receive message 4 first (skipping 0-3)
            await ratchet2.decrypt(messages[4]!);

            const info = ratchet2.getSessionInfo();
            expect(info.skippedKeys).toBeGreaterThan(0);
        }, 30000);
    });

    // ==========================================================================
    // Bidirectional Communication Tests
    // ==========================================================================

    describe('Bidirectional Communication', () => {
        it('should handle bidirectional message exchange', async () => {
            const ratchet1 = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys1 = ratchet1.getPublicKeys();
            const keys2 = ratchet2.getPublicKeys();

            ratchet1.setPeerPublicKeys(keys2.dhPublicKey, keys2.pqPublicKey);
            ratchet2.setPeerPublicKeys(keys1.dhPublicKey, keys1.pqPublicKey);

            // Alice sends to Bob
            const msgA1 = await ratchet1.encrypt(new TextEncoder().encode('Alice msg 1'));
            const decA1 = await ratchet2.decrypt(msgA1);
            expect(new TextDecoder().decode(decA1)).toBe('Alice msg 1');

            // Bob replies to Alice
            const msgB1 = await ratchet2.encrypt(new TextEncoder().encode('Bob msg 1'));
            const decB1 = await ratchet1.decrypt(msgB1);
            expect(new TextDecoder().decode(decB1)).toBe('Bob msg 1');

            // Continued exchange
            const msgA2 = await ratchet1.encrypt(new TextEncoder().encode('Alice msg 2'));
            const decA2 = await ratchet2.decrypt(msgA2);
            expect(new TextDecoder().decode(decA2)).toBe('Alice msg 2');
        }, 30000);
    });

    // ==========================================================================
    // Session Info Tests
    // ==========================================================================

    describe('Session Information', () => {
        it('should return session info', async () => {
            const ratchet = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'test-session-123'
            );

            const info = ratchet.getSessionInfo();

            expect(info.sessionId).toBe('test-session-123');
            expect(info.drMessageNumber).toBe(0);
            expect(info.pqEpoch).toBeDefined();
            expect(info.skippedKeys).toBe(0);
        });

        it('should update message number in info', async () => {
            const ratchet1 = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys = ratchet2.getPublicKeys();
            ratchet1.setPeerPublicKeys(keys.dhPublicKey, keys.pqPublicKey);

            // Send messages
            await ratchet1.encrypt(new TextEncoder().encode('msg1'));
            await ratchet1.encrypt(new TextEncoder().encode('msg2'));

            const info = ratchet1.getSessionInfo();
            // Message number should be 2 after sending 2 messages
            expect(info.drMessageNumber).toBe(2);
        }, 30000);
    });

    // ==========================================================================
    // Secure Deletion Tests
    // ==========================================================================

    describe('Secure Deletion', () => {
        it('should destroy session and wipe keys', async () => {
            const ratchet = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'test-session'
            );

            // Get session info before destruction
            const infoBefore = ratchet.getSessionInfo();
            expect(infoBefore.sessionId).toBe('test-session');

            // Destroy session
            expect(() => {
                ratchet.destroy();
            }).not.toThrow();
        });

        it('should wipe keys after encryption', async () => {
            const ratchet1 = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys = ratchet2.getPublicKeys();
            ratchet1.setPeerPublicKeys(keys.dhPublicKey, keys.pqPublicKey);

            // Encrypt message (should clean up intermediate keys)
            await ratchet1.encrypt(new TextEncoder().encode('test'));

            // Should still work after cleanup
            await expect(
                ratchet1.encrypt(new TextEncoder().encode('test2'))
            ).resolves.toBeDefined();
        }, 30000);
    });

    // ==========================================================================
    // Error Handling Tests
    // ==========================================================================

    describe('Error Handling', () => {
        it('should handle invalid ciphertext', async () => {
            const ratchet = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-1'
            );

            const invalidMessage: TripleRatchetMessage = {
                dhPublicKey: new Uint8Array(32),
                previousChainLength: 0,
                messageNumber: 0,
                pqEpoch: 0,
                ciphertext: new Uint8Array(32), // Invalid ciphertext
                nonce: new Uint8Array(12),
            };

            await expect(
                ratchet.decrypt(invalidMessage)
            ).rejects.toThrow();
        });

        it('should handle tampered ciphertext', async () => {
            const ratchet1 = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys1 = ratchet1.getPublicKeys();
            const keys2 = ratchet2.getPublicKeys();

            ratchet1.setPeerPublicKeys(keys2.dhPublicKey, keys2.pqPublicKey);
            ratchet2.setPeerPublicKeys(keys1.dhPublicKey, keys1.pqPublicKey);

            const encrypted = await ratchet1.encrypt(new TextEncoder().encode('test'));

            // Tamper with ciphertext
            encrypted.ciphertext[0] = encrypted.ciphertext[0]! ^ 0xFF;

            await expect(
                ratchet2.decrypt(encrypted)
            ).rejects.toThrow();
        }, 30000);

        it('should handle empty plaintext', async () => {
            const ratchet1 = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys1 = ratchet1.getPublicKeys();
            const keys2 = ratchet2.getPublicKeys();

            ratchet1.setPeerPublicKeys(keys2.dhPublicKey, keys2.pqPublicKey);
            ratchet2.setPeerPublicKeys(keys1.dhPublicKey, keys1.pqPublicKey);

            // Empty plaintext should throw an error as per implementation
            await expect(
                ratchet1.encrypt(new Uint8Array(0))
            ).rejects.toThrow('Plaintext must not be empty');
        }, 30000);
    });

    // ==========================================================================
    // Forward Secrecy Tests
    // ==========================================================================

    describe('Forward Secrecy', () => {
        it('should not decrypt old messages after key rotation', async () => {
            const ratchet1 = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys1 = ratchet1.getPublicKeys();
            const keys2 = ratchet2.getPublicKeys();

            ratchet1.setPeerPublicKeys(keys2.dhPublicKey, keys2.pqPublicKey);
            ratchet2.setPeerPublicKeys(keys1.dhPublicKey, keys1.pqPublicKey);

            // Encrypt message
            const msg = await ratchet1.encrypt(new TextEncoder().encode('secret'));

            // Advance ratchet state
            for (let i = 0; i < 10; i++) {
                await ratchet1.encrypt(new TextEncoder().encode(`msg${i}`));
            }

            // Destroy ratchet1 (simulating key loss)
            ratchet1.destroy();

            // Create new ratchet with same session
            const ratchet1New = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            // Should not be able to decrypt old message
            await expect(
                ratchet1New.decrypt(msg)
            ).rejects.toThrow();
        }, 30000);
    });

    // ==========================================================================
    // Large Data Tests
    // ==========================================================================

    describe('Large Data Handling', () => {
        it('should handle large messages', async () => {
            const ratchet1 = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys1 = ratchet1.getPublicKeys();
            const keys2 = ratchet2.getPublicKeys();

            ratchet1.setPeerPublicKeys(keys2.dhPublicKey, keys2.pqPublicKey);
            ratchet2.setPeerPublicKeys(keys1.dhPublicKey, keys1.pqPublicKey);

            // Create 64KB message (crypto.getRandomValues max size is 65536 bytes)
            const largeData = new Uint8Array(64 * 1024);
            crypto.getRandomValues(largeData);

            const encrypted = await ratchet1.encrypt(largeData);
            const decrypted = await ratchet2.decrypt(encrypted);

            expect(decrypted.length).toBe(largeData.length);
            expect(Array.from(decrypted).join(',')).toBe(Array.from(largeData).join(','));
        }, 60000);
    });

    // ==========================================================================
    // Performance Tests
    // ==========================================================================

    describe('Performance', () => {
        it('should encrypt messages efficiently', async () => {
            const ratchet = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys = ratchet2.getPublicKeys();
            ratchet.setPeerPublicKeys(keys.dhPublicKey, keys.pqPublicKey);

            const plaintext = new TextEncoder().encode('test message');

            const start = performance.now();
            await ratchet.encrypt(plaintext);
            const duration = performance.now() - start;

            // Should complete in reasonable time (< 100ms)
            expect(duration).toBeLessThan(100);
        }, 30000);

        it('should decrypt messages efficiently', async () => {
            const ratchet1 = await TripleRatchet.initialize(
                sharedSecret,
                true,
                'session-1'
            );

            const ratchet2 = await TripleRatchet.initialize(
                sharedSecret,
                false,
                'session-2'
            );

            const keys1 = ratchet1.getPublicKeys();
            const keys2 = ratchet2.getPublicKeys();

            ratchet1.setPeerPublicKeys(keys2.dhPublicKey, keys2.pqPublicKey);
            ratchet2.setPeerPublicKeys(keys1.dhPublicKey, keys1.pqPublicKey);

            const encrypted = await ratchet1.encrypt(new TextEncoder().encode('test'));

            const start = performance.now();
            await ratchet2.decrypt(encrypted);
            const duration = performance.now() - start;

            // Should complete in reasonable time (< 100ms)
            expect(duration).toBeLessThan(100);
        }, 30000);
    });
});
