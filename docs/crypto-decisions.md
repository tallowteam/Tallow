# Cryptographic Decision Record

## ML-KEM-1024 (not 512 or 768)
- Rationale: Security Level 5, 15-year threat horizon against quantum computers
- Trade-off: Larger keys (1568B encaps, 3168B decaps) but acceptable for file transfer

## X25519 as Hybrid Partner
- Rationale: Well-studied, constant-time implementations widely available
- Trade-off: Adds 32 bytes to key exchange, negligible overhead

## HKDF-SHA256 (not SHA3)
- Rationale: Broader compatibility, HKDF wrapper is cryptographically sound
- Trade-off: SHA3 recommended by IETF composite ML-KEM draft for X-Wing

## AES-256-GCM Primary
- Rationale: Hardware acceleration (AES-NI), NIST standard, well-audited
- Fallback: ChaCha20-Poly1305 for platforms without AES-NI
- Future: AEGIS-256 (feature-gated) for higher throughput

## Counter-Based Nonces (not random)
- Rationale: Guaranteed uniqueness (no birthday bound), 2^64 messages per session
- Trade-off: Requires state (counter), but simpler than managing random nonce collisions

## BLAKE3 for Hashing (not SHA-256)
- Rationale: Faster, parallelizable, built-in keyed hashing and MAC
- Exception: SHA3-256 used only where NIST compliance specifically required

## Argon2id for Passwords (not PBKDF2/bcrypt)
- Rationale: Memory-hard, resistant to GPU/ASIC attacks
- Parameters: 3 iterations, 256 MB memory, 4 parallel lanes
