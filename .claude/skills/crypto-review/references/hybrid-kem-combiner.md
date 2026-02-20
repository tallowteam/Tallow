# Hybrid KEM Combiner Reference

## Why Hybrid
- If ML-KEM has a catastrophic bug -> X25519 still protects
- If quantum computers break X25519 -> ML-KEM still protects
- The combination is at least as strong as the stronger component

## Tallow's Combiner Construction
```
ss_combined = HKDF-SHA256(
    salt = None,
    ikm  = ml_kem_ss || x25519_ss,     // 64 bytes total
    info = b"tallow-v1-session-key",
    len  = 32
)
```

### Security Argument
For the combiner to fail, an attacker must:
1. Break ML-KEM-1024 to recover ml_kem_ss, AND
2. Break X25519 to recover x25519_ss, AND
3. Break HKDF-SHA256

Any one of these being secure is sufficient.

## Implementation Requirements
1. **Both KEMs must be executed**: Never skip either KEM.
2. **Concatenation order is fixed**: `ml_kem_ss || x25519_ss`. Part of protocol spec.
3. **Both ciphertexts transmitted**: Receiver needs both to derive same shared secret.
4. **Ephemeral keys**: Both keypairs generated per transfer session (forward secrecy).
5. **All-zero check on X25519**: Verify not all zeros (small-subgroup attack):
   ```rust
   if x25519_ss.ct_eq(&[0u8; 32]).into() {
       return Err(CryptoError::InvalidSharedSecret);
   }
   ```
