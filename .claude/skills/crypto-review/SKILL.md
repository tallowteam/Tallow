---
name: crypto-review
description: >
  Post-quantum cryptography implementation review for Tallow. Auto-invoke
  when working with: ML-KEM, FIPS 203, Kyber, X25519, Diffie-Hellman,
  AES-GCM, AES-256, AEAD, nonce, initialization vector, HKDF, key derivation,
  key exchange, key encapsulation, KEM, hybrid crypto, encryption, decryption,
  symmetric key, shared secret, post-quantum, lattice-based, session key,
  handshake, protocol, ciphertext, plaintext, authentication tag, or any
  code changes in crates/tallow-crypto/.
allowed-tools: Read, Grep, Glob
---

# Cryptographic Review Skill

## Tallow's Crypto Architecture

```
Sender                          Relay (untrusted)               Receiver
  |                                |                              |
  +- Generate ephemeral keypair ---+                              |
  |  (ML-KEM-1024 + X25519)       |                              |
  +- Send encaps key ------------->+----------------------------->|
  |                                |<--- Encapsulate (both KEMs) -|
  |<-------------------------------+<--- Send ciphertexts --------|
  +- Decapsulate both             |                              |
  +- Combine shared secrets       |                              |
  +- HKDF derive session key      |                              |
  +- AES-256-GCM encrypt chunks -->+----------------------------->|
  |                                |         +- Decrypt chunks ---|
```

### Algorithm Stack

| Layer | Algorithm | Standard | Rust Crate | Key Size |
|-------|-----------|----------|------------|----------|
| PQ KEM | ML-KEM-1024 | FIPS 203 | `ml-kem` or `fips203` | Encaps: 1568B, Decaps: 3168B |
| Classical KEM | X25519 | RFC 7748 | `x25519-dalek` | 32B public, 32B private |
| KDF | HKDF-SHA256 | RFC 5869 | `hkdf` + `sha2` | Variable output |
| AEAD | AES-256-GCM | SP 800-38D | `aes-gcm` | 256-bit key, 96-bit nonce |

### Hybrid KEM Combiner

**Critical**: Both KEM shared secrets MUST be combined before deriving the session key.

```
ml_kem_ss = ML-KEM-1024.Decaps(ml_kem_dk, ml_kem_ct)  // 32 bytes
x25519_ss = X25519(our_sk, their_pk)                    // 32 bytes
ikm = ml_kem_ss || x25519_ss                            // 64 bytes
session_key = HKDF-SHA256(
    salt = nil,
    ikm  = ikm,
    info = b"tallow-v1-session-key",
    len  = 32
)
```

### Review Checklist

**ML-KEM-1024**:
- [ ] Using ML-KEM-1024 (not 512 or 768)
- [ ] Encapsulation key validated before use
- [ ] Decapsulation key stored in SecretBox and zeroized on drop
- [ ] Both keygen and encaps use OsRng
- [ ] Shared secret zeroized after being fed to HKDF

**X25519**:
- [ ] Checking for all-zero shared secret
- [ ] Private key stored in SecretBox and zeroized on drop

**HKDF-SHA256**:
- [ ] Both shared secrets concatenated as IKM
- [ ] `info` parameter contains domain separator
- [ ] Different `info` strings for different derived keys
- [ ] PRK value zeroized after key extraction

**AES-256-GCM**:
- [ ] 96-bit nonce, NEVER repeated under same key
- [ ] Counter-based nonces (preferred for streaming)
- [ ] Auth tag verified BEFORE plaintext returned
- [ ] Full 128-bit tag (not truncated)
- [ ] Key material in SecretBox, zeroized on drop

**General**:
- [ ] No timing side-channels
- [ ] Error messages don't leak secret info
- [ ] All intermediate crypto values zeroized

### Anti-Patterns to Flag

| Anti-Pattern | Why Dangerous | Fix |
|-------------|--------------|-----|
| `nonce = [0u8; 12]` | Nonce reuse = complete GCM break | Counter or OsRng |
| `if shared_secret == expected` | Timing side-channel | `subtle::ConstantTimeEq` |
| `ml_kem_ss` used directly as AES key | Skips hybrid | Combine via HKDF |
| `println!("{:?}", key)` | Leaks key material | `secrecy::SecretBox` |
| Missing zeroize on key struct | Key persists in memory | Derive Zeroize + ZeroizeOnDrop |

### Reference Files
- `references/ml-kem-1024.md`
- `references/x25519-key-exchange.md`
- `references/aes-256-gcm.md`
- `references/hkdf-sha256.md`
- `references/hybrid-kem-combiner.md`
