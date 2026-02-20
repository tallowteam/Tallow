# AES-256-GCM Implementation Reference

## Standard
NIST SP 800-38D

## Rust Crate: `aes-gcm` (RustCrypto)

## Key Parameters
| Parameter | Value |
|-----------|-------|
| Key size | 256 bits (32 bytes) |
| Nonce size | 96 bits (12 bytes) |
| Tag size | 128 bits (16 bytes) — NEVER truncate |
| Max plaintext per message | ~64 GB |
| Max messages per key (random nonce) | ~2^32 |

## Nonce Management — THE CRITICAL CONCERN

AES-GCM is catastrophically broken if a nonce repeats under the same key. A nonce collision allows:
1. Recovery of the authentication key (GHASH key H)
2. Forgery of arbitrary ciphertexts
3. Decryption of messages

### Strategy: Counter-Based Nonces (Recommended for Tallow)
96-bit nonce = 8-byte counter + 4-byte random prefix per session.
Counter guarantees uniqueness. Random prefix differentiates sessions.

### Strategy: Random Nonces (Acceptable for low-volume)
Birthday bound: collision probability exceeds 2^-32 after ~2^32 messages.

## Critical Notes
1. **Tag verification is automatic** in `aes-gcm` crate — plaintext never returned for unauthenticated ciphertext.
2. **AAD**: Include chunk index to bind ciphertext to its intended position.
3. **Key zeroization**: `Key` type doesn't auto-zeroize. Wrap in SecretBox.
4. **In-place**: Use `encrypt_in_place`/`decrypt_in_place` for large files.
