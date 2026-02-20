# ML-KEM-1024 Implementation Reference

## Standard
FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism Standard (August 2024)

## Parameter Sizes
| Parameter | Size |
|-----------|------|
| Encapsulation key (public) | 1568 bytes |
| Decapsulation key (private) | 3168 bytes |
| Ciphertext | 1568 bytes |
| Shared secret | 32 bytes (256 bits) |

## Rust Implementation

### Recommended Crate: `ml-kem` (RustCrypto)
```toml
[dependencies]
ml-kem = { version = "0.2", features = ["std"] }
```

### Alternative: `fips203` (IntegrityChain/NCC Group)
```toml
[dependencies]
fips203 = { version = "0.4", features = ["ml-kem-1024", "default-rng"] }
```

## Critical Implementation Notes

1. **Input validation**: Always use `try_from_bytes` (validates) not `from_bytes`.
2. **RNG quality**: Use `OsRng` only. Never `thread_rng()` for key material.
3. **Fixed shared secret size**: 32 bytes at ALL security levels (512, 768, 1024).
4. **Implicit rejection**: Invalid CT returns pseudorandom SS (not error). Prevents chosen-ciphertext attacks.
5. **Side-channel considerations**: Both recommended crates aim for constant-time.
