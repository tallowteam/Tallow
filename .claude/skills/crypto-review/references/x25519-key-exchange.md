# X25519 Key Exchange Reference

## Standard
RFC 7748: Elliptic Curves for Security

## Rust Crate: `x25519-dalek`

## Key Properties
- 32-byte public key, 32-byte private key
- Clamped scalar multiplication (handled by x25519-dalek)
- Contributory behavior (public key validated)

## Critical Checks
1. **All-zero shared secret**: Must check and reject (small-subgroup attack)
   ```rust
   if x25519_ss.ct_eq(&[0u8; 32]).into() {
       return Err(CryptoError::InvalidSharedSecret);
   }
   ```
2. **Private key storage**: SecretBox + Zeroize
3. **Ephemeral**: Generate per session for forward secrecy
