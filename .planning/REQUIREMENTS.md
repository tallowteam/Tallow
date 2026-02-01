# Tallow Security Fix - Requirements

## v1 Requirements (This Milestone)

### Cryptography Core
- [ ] **CRYPTO-01**: Hash function returns actual SHA-256 digest
- [ ] **CRYPTO-02**: Kyber keypair generation works correctly
- [ ] **CRYPTO-03**: Kyber encapsulation produces valid ciphertext
- [ ] **CRYPTO-04**: Kyber decapsulation recovers shared secret
- [ ] **CRYPTO-05**: Hybrid key exchange combines Kyber + X25519
- [ ] **CRYPTO-06**: HKDF derives encryption and auth keys properly
- [ ] **CRYPTO-07**: Key exchange includes authentication (signatures)

### Serialization
- [ ] **SERIAL-01**: Public key serialization includes both Kyber and X25519 keys
- [ ] **SERIAL-02**: Public key deserialization recovers correct key structure
- [ ] **SERIAL-03**: Ciphertext serialization includes all components
- [ ] **SERIAL-04**: Buffer bounds checked before deserialization

### File Encryption
- [ ] **FILE-01**: File encryption uses properly derived keys
- [ ] **FILE-02**: Per-chunk integrity verification works
- [ ] **FILE-03**: Full file hash verification works
- [ ] **FILE-04**: Decryption recovers original file exactly

### Transfer Integration
- [ ] **XFER-01**: PQC transfer manager uses fixed crypto
- [ ] **XFER-02**: Chunk acknowledgment works correctly
- [ ] **XFER-03**: Error recovery handles failed chunks

### Validation
- [ ] **VALID-01**: Input validation on all crypto functions
- [ ] **VALID-02**: File size limits enforced
- [ ] **VALID-03**: Type safety for all message payloads

---

## v2 Requirements (Deferred)
- Production WebSocket signaling server
- Unit test framework and coverage
- Performance optimization for large files
- Mobile browser compatibility testing

## Out of Scope
- UI redesign
- New features
- Backend/database

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CRYPTO-01 | 1 | Pending |
| CRYPTO-02 | 1 | Pending |
| CRYPTO-03 | 1 | Pending |
| CRYPTO-04 | 1 | Pending |
| CRYPTO-05 | 1 | Pending |
| CRYPTO-06 | 1 | Pending |
| CRYPTO-07 | 2 | Pending |
| SERIAL-01 | 1 | Pending |
| SERIAL-02 | 1 | Pending |
| SERIAL-03 | 1 | Pending |
| SERIAL-04 | 2 | Pending |
| FILE-01 | 2 | Pending |
| FILE-02 | 2 | Pending |
| FILE-03 | 2 | Pending |
| FILE-04 | 2 | Pending |
| XFER-01 | 3 | Pending |
| XFER-02 | 3 | Pending |
| XFER-03 | 3 | Pending |
| VALID-01 | 2 | Pending |
| VALID-02 | 2 | Pending |
| VALID-03 | 2 | Pending |
