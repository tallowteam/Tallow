# Tallow WASM Security

## Cryptographic Guarantees

### Post-Quantum Security

#### ML-KEM-768 (Kyber768)
- **Status**: NIST PQC Standard (FIPS 203)
- **Security Level**: NIST Level 3 (~192-bit classical security)
- **Security Model**: IND-CCA2 (Indistinguishability under Adaptive Chosen Ciphertext Attack)
- **Parameters**: n=768, q=3329, η₁=2, η₂=2

#### X25519
- **Status**: IRTF RFC 7748
- **Security Level**: ~128-bit security
- **Security Model**: Computational Diffie-Hellman (CDH) hardness
- **Curve**: Curve25519 with Montgomery form

#### Hybrid Mode
- **Security**: Secure if either ML-KEM or X25519 is secure
- **Rationale**: Defense against quantum computers breaking either algorithm
- **Key Derivation**: HKDF-SHA256 combining both shared secrets

### Symmetric Encryption

#### AES-256-GCM
- **Status**: NIST FIPS 197 + SP 800-38D
- **Security Level**: 256-bit key security
- **Security Model**: IND-CCA2 with 128-bit authentication
- **Nonce Management**: Counter-based with random component (never reused)

#### ChaCha20-Poly1305
- **Status**: IRTF RFC 8439
- **Security Level**: 256-bit key security
- **Security Model**: IND-CCA2 with 128-bit authentication
- **Use Case**: Alternative to AES-GCM

### Hash Functions

#### BLAKE3
- **Status**: Modern cryptographic hash (successor to BLAKE2)
- **Security Level**: 256-bit collision resistance, 128-bit preimage resistance
- **Security Model**: Collision-resistant, preimage-resistant, second preimage-resistant
- **Features**: Parallelizable, tree-based

#### Argon2id
- **Status**: Password Hashing Competition winner (PHC)
- **Security Model**: Memory-hard (resistant to GPU/ASIC attacks)
- **Parameters**: Configurable memory, time, parallelism
- **Use Case**: Password-based key derivation

## Security Features

### Memory Safety

```rust
// All sensitive data zeroized after use
use zeroize::Zeroize;

let mut secret_key = vec![...];
secret_key.zeroize(); // Guaranteed memory clearing
```

### Constant-Time Operations

```rust
// Timing-safe comparisons
use subtle::ConstantTimeEq;

let valid = hash1.ct_eq(&hash2);
```

### No Unsafe Code

All cryptographic operations use safe Rust:
- No `unsafe` blocks in crypto code
- No manual memory management
- Compiler-enforced memory safety

### Side-Channel Resistance

1. **Constant-time comparisons**: All hash/MAC verifications
2. **Constant-time crypto**: X25519, AES-GCM implementations
3. **No data-dependent branches**: In sensitive operations
4. **Memory clearing**: Automatic zeroization

## Threat Model

### In Scope

1. **Passive Network Attacker**
   - Cannot read encrypted traffic
   - Cannot forge authentication tags
   - Cannot derive session keys

2. **Active Network Attacker**
   - Cannot modify ciphertext undetected (authenticated encryption)
   - Cannot perform MITM (authenticated key exchange)
   - Cannot replay old messages (nonce protection)

3. **Quantum Computer**
   - Cannot break ML-KEM-768 (post-quantum secure)
   - Hybrid mode provides defense in depth

4. **Side-Channel Attacks**
   - Constant-time operations prevent timing attacks
   - Zeroization prevents memory dumps
   - No cache-timing vulnerabilities

### Out of Scope

1. **Browser Security**
   - Browser must be trusted
   - JavaScript environment security not guaranteed
   - Extension-based attacks possible

2. **Physical Access**
   - No protection against physical memory access
   - No secure enclave/TEE usage
   - No protection if device compromised

3. **Implementation Bugs**
   - Rely on audited crates (pqcrypto, aes-gcm, etc.)
   - Regular dependency updates required
   - Security advisories must be monitored

## Security Recommendations

### Key Management

```javascript
// Generate fresh keys per session
const sessionKey = aes_generate_key();

// Never reuse keys across sessions
const session1 = new TransferSession(key1, 'session-1');
const session2 = new TransferSession(key2, 'session-2'); // Different key!

// Derive keys properly
const derivedKey = blake3_derive_key('context', ikm, 32);
```

### Nonce Management

```javascript
// AES-GCM handles nonces automatically
const cipher = new AesGcmCipher(key);
cipher.encrypt(plaintext); // Nonce auto-generated

// Never reuse nonces manually
const nonce = crypto.getRandomValues(new Uint8Array(12));
aes_encrypt_with_nonce(key, nonce, plaintext); // Only if you know what you're doing!
```

### Password Security

```javascript
// Use Argon2id for passwords
const hash = argon2_hash_password(password);

// Use high-security config for sensitive data
const config = Argon2Config.high_security();
const hash = argon2_hash_password_with_config(password, config);

// Always use unique salts
const salt = argon2_generate_salt();
const key = argon2_derive_key(password, salt, 32);
```

### Session Management

```javascript
// Unique session IDs
const sessionId = generate_session_id();

// Use context for key derivation
const context = `tallow-${sessionId}-${timestamp}`;
const result = hybrid_encapsulate(mlkemPub, x25519Pub, context);

// Clear sessions after use
session = null;
```

## Audit Status

### External Audits
- [ ] Independent security audit (planned)
- [ ] Cryptographic review (planned)
- [ ] Penetration testing (planned)

### Dependency Audits
- [x] pqcrypto-kyber: Well-tested, reference implementation
- [x] x25519-dalek: Audited, widely used
- [x] aes-gcm: NIST-certified algorithm
- [x] blake3: Peer-reviewed, modern design
- [x] argon2: PHC winner, extensively analyzed

### Automated Checks
```bash
# Run security audit
cargo audit

# Check for vulnerabilities
cargo deny check advisories
```

## Vulnerability Disclosure

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email: security@tallow.app
3. Include:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours.

## Security Updates

### Current Version: 0.1.0
- No known vulnerabilities

### Update Policy
- Critical: Patch within 24 hours
- High: Patch within 1 week
- Medium: Patch in next release
- Low: Patch when convenient

### Dependency Updates

```bash
# Check for updates
cargo update

# Audit dependencies
cargo audit

# Update and test
cargo test
```

## Best Practices

### Application Integration

1. **Initialize Once**
```javascript
await init(); // Call once at startup
```

2. **Check Capabilities**
```javascript
const caps = capabilities();
if (!caps.mlkem768) {
  throw new Error('Post-quantum crypto not available');
}
```

3. **Handle Errors**
```javascript
try {
  const encrypted = aes_encrypt(key, plaintext);
} catch (error) {
  console.error('Encryption failed:', error);
  // Handle gracefully
}
```

4. **Clear Sensitive Data**
```javascript
const key = aes_generate_key();
// Use key...
secure_zero(key); // Clear when done
```

### Testing Security

```javascript
// Test key uniqueness
const key1 = aes_generate_key();
const key2 = aes_generate_key();
assert(key1 !== key2);

// Test encryption randomness
const ct1 = aes_encrypt(key, plaintext);
const ct2 = aes_encrypt(key, plaintext);
assert(ct1 !== ct2); // Different nonces

// Test authentication
const tampered = ct1.slice();
tampered[50] ^= 1; // Flip bit
assert.throws(() => aes_decrypt(key, tampered));
```

## Compliance

### Standards
- NIST FIPS 203 (ML-KEM)
- NIST FIPS 197 (AES)
- IRTF RFC 7748 (X25519)
- IRTF RFC 8439 (ChaCha20-Poly1305)

### Certifications
- [ ] FIPS 140-3 (planned)
- [ ] Common Criteria (planned)

## Resources

- [NIST PQC](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [Cryptographic Right Answers](https://latacora.micro.blog/2018/04/03/cryptographic-right-answers.html)
- [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
