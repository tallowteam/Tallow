# HKDF-SHA256 Implementation Reference

## Standard
RFC 5869: HMAC-based Extract-and-Expand Key Derivation Function (HKDF)

## Rust Crate
```toml
[dependencies]
hkdf = "0.12"
sha2 = "0.10"
```

## Two-Phase Operation
1. **Extract**: IKM + optional salt -> PRK
2. **Expand**: PRK + info -> OKM

## Domain Separation

| Purpose | Info String | Output Length |
|---------|------------|--------------|
| Session encryption key | `b"tallow-v1-session-key"` | 32 bytes |
| Chunk MAC key | `b"tallow-v1-chunk-mac"` | 32 bytes |
| Nonce prefix derivation | `b"tallow-v1-nonce-prefix"` | 4 bytes |

The `v1` version tag ensures future protocol versions produce different keys.

## Critical Notes
1. **Zeroize the PRK**: Intermediate PRK is just as sensitive as final keys.
2. **Output length limits**: Max 255 x 32 = 8160 bytes.
3. **IKM ordering**: `ml_kem_ss || x25519_ss` — fixed, documented, never swap.
4. **SHA2 vs SHA3**: IETF composite ML-KEM draft recommends SHA3. Tallow uses HKDF-SHA256 for broader compatibility. Documented in docs/crypto-decisions.md.
