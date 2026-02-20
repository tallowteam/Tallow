# Tallow Transfer Protocol Specification

## Version
v1 (draft)

## Overview
The Tallow Transfer Protocol enables end-to-end encrypted file transfer between two parties via an untrusted relay.

## Key Exchange
1. Both parties connect to relay using room code (BLAKE3 hash of code phrase)
2. Hybrid KEM: ML-KEM-1024 + X25519
3. Session key derived via HKDF-SHA256 with domain separation

## Data Transfer
1. File chunked into 64 KB segments
2. Each chunk encrypted with AES-256-GCM (counter-based nonces)
3. Chunk AAD binds chunk index to prevent reordering
4. Final chunk authenticates total chunk count

## Wire Format
- Serialization: postcard (Serde-compatible, compact binary)
- Version negotiation on connection
- TLV extension mechanism for future features
