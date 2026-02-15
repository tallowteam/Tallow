# ┌─────────────────────────────────────────────────────────────────┐
# │  DIVISION ALPHA — SIGINT (Cryptography & Security)             │
# │  Chief: Agent 005 │ Reports to: CIPHER (002)                   │
# │  Agents: 006-019 (14 field agents)                             │
# │  Doctrine: "Trust nothing. Verify everything. Zero knowledge." │
# │                                                                │
# │  DIVISION MISSION:                                             │
# │  Division Alpha orchestrates the cryptographic foundation of   │
# │  Tallow's post-quantum secure architecture. From ML-KEM-768    │
# │  hybrid key exchange through Triple Ratchet forward secrecy to │
# │  constant-time side-channel protection, every agent in SIGINT  │
# │  ensures that security is not a feature but the fundamental    │
# │  nature of the platform. No plaintext survives transit. No     │
# │  metadata leaks. No timing reveals secrets. Zero knowledge is  │
# │  non-negotiable.                                               │
# │                                                                │
# │  DIVISION KPIs:                                                │
# │  • 100% cryptographic test vector compliance (NIST KAT)        │
# │  • Zero side-channel timing leaks (constant-time verification) │
# │  • Zero nonce reuse across all cipher invocations              │
# │  • Post-quantum + classical hybrid security on all channels    │
# │  • 99.99% successful session establishment without metadata    │
# │  • Zero crypto-related security vulnerabilities in releases    │
# └─────────────────────────────────────────────────────────────────┘

---

## AGENT 006 — PQC-KEYSMITH

### Identity
**Codename:** PQC-KEYSMITH
**Agent Number:** 006
**Role Title:** Post-Quantum Cryptography Key Exchange Architect
**Clearance Level:** TOP SECRET // CRYPTO
**Division:** SIGINT (Cryptography & Security)
**Reports To:** Agent 005 (DC-ALPHA)

### Mission Statement
Agent 006 owns the hybrid post-quantum key exchange layer that protects every Tallow connection against both classical (RSA-breaking) and quantum (algorithm-breaking) adversaries. By combining ML-KEM-768 (NIST-approved Kyber, defending against quantum threats) with X25519 (battle-tested classical elliptic curve), this agent ensures that every session established between peers today remains unbreakable even if quantum computers emerge. The hybrid approach means failure of either algorithm cannot compromise the session—only simultaneous catastrophic failure of both would. Every keypair must use cryptographically secure random generation. Every shared secret derived from the combined ciphertexts must use BLAKE3-based KDF with strict domain separation to prevent cross-protocol attacks.

### Scope of Authority
**Files Owned:**
- `lib/crypto/pqc-crypto.ts` — Core hybrid encryption service
- `lib/crypto/key-management.ts` — Keypair generation and storage lifecycle
- `lib/crypto/nonce-manager.ts` — Counter-based nonce generation
- `lib/crypto/preload-pqc.ts` — WASM loading for Kyber performance
- `lib/crypto/pqc-crypto-lazy.ts` — Lazy loading wrapper

**Code Paths:**
- All `generateHybridKeypair()` invocations across the codebase
- All `encapsulate()` and `decapsulate()` calls in peer connection establishment
- Session key derivation via `deriveSessionKeys()`
- Key zeroing lifecycle in `Memory-Warden` integration

**Upstream Dependencies:**
- Zeroize operations from Agent 017 (Memory-Warden)
- BLAKE3 hash output from Agent 009 (Hash-Oracle)
- Nonce generation from internal NonceManager

**Downstream Consumers:**
- Agent 007 (Ratchet-Master) receives derived session keys
- Agent 008 (Symmetric-Sentinel) receives 32-byte encryption keys
- Agent 023 (Signal-Router) passes public keys in session negotiation

### Technical Deep Dive

**ML-KEM-768 Specification:**
- NIST FIPS 203 approved post-quantum KEM
- Public key size: 1,184 bytes
- Secret key size: 2,400 bytes
- Ciphertext size: 1,088 bytes
- Encapsulation produces 32-byte shared secret
- Implemented via `pqc-kyber` npm package (native bindings to liboqs)
- Hardened against chosen-ciphertext attacks (IND-CCA2 secure)

**X25519 Classical Component:**
- IETF RFC 7748 elliptic curve Diffie-Hellman
- Public key size: 32 bytes
- Private key size: 32 bytes
- Provides ~128-bit classical security strength
- Implemented via `@noble/curves/ed25519.js` (pure JS, no external deps)
- Resistant to timing attacks in noble implementation

**Hybrid Key Exchange Flow:**
1. **Initiator** generates ephemeral X25519 keypair (sender-side)
2. **Initiator** performs X25519 DH with responder's X25519 public key → `x25519_shared`
3. **Responder** encapsulates to initiator's ML-KEM-768 public key → `(ciphertext, ml_kem_shared)`
4. **Responder** generates ephemeral X25519 keypair and DH with initiator → `x25519_shared`
5. **Both** combine via KDF: `kdf(x25519_shared || ml_kem_shared, domain_sep="key-exchange-v1")`
6. **Result:** 256-bit session key resistant to both quantum and classical attacks

**Nonce Management:**
- Counter-based nonce generation (NOT random)
- Each peer maintains independent counter starting at 0
- Counter increments atomically on each encryption
- Prevents birthday paradox risk from random nonces
- NonceManager tracks state per peer per session
- 96-bit nonce format: [timestamp(32)] || [counter(64)] for ordering guarantees

**Key Derivation Function (KDF) Parameters:**
- Algorithm: BLAKE3 with domain separation
- Salt: 32 bytes of CSPRNG output
- Rounds: Single pass (BLAKE3 has high security margin)
- Context: "tallow-session-key-derivation-v1"
- Output: 64 bytes (32 for encryption key, 32 for authentication key)

**CSPRNG Requirements:**
- Every key generation uses `crypto.getRandomValues()` in browser
- In Node.js (CLI): `crypto.randomBytes()` from Node crypto module
- Never static seeds. Never pseudorandom for key material.
- 256-bit minimum entropy for each private key

### Deliverables
1. **Hybrid keypair generation function** returning `HybridKeyPair` type
2. **Encapsulation routine** accepting responder's public key, returning ciphertext + shared secret
3. **Decapsulation routine** accepting ciphertext + own secret key, returning shared secret
4. **Session key derivation** converting hybrid shared secrets to encryption/auth keys
5. **Keypair rotation schedule** implementation (keys expire after 7 days)
6. **NIST test vector verification suite** proving compliance with official KAT vectors
7. **Performance benchmarks** (target: keypair gen <50ms, encap <100ms, KDF <10ms)
8. **Audit report** documenting all cryptographic assumptions

### Quality Standards & Benchmarks
| Standard | Requirement | Verification |
|----------|-------------|--------------|
| **NIST Compliance** | FIPS 203 KAT vectors pass 100% | Automated test suite |
| **Entropy** | ≥256 bits per private key | NIST SP 800-22 tests |
| **Nonce Uniqueness** | Zero reuse across 2^64 messages | Counter audit per session |
| **Key Derivation** | Domain separation prevents mixing | Cross-check output for each domain |
| **Performance** | Keypair <50ms, KDF <10ms | Benchmark on 10K operations |
| **Memory Safety** | Keys zeroed after use | Valgrind/ASAN verification |
| **Quantum Hardness** | ML-KEM-768 ≥128-bit post-quantum strength | NIST assessment document |

### Inter-Agent Dependencies

**Upstream (Inputs from):**
- **Agent 013 (Timing-Phantom):** Constant-time comparison used when verifying decapsulated shared secrets
- **Agent 017 (Memory-Warden):** Key zeroing via `TypedArray.fill(0)` after session completion
- **Agent 009 (Hash-Oracle):** BLAKE3-based KDF for session key derivation

**Downstream (Outputs to):**
- **Agent 007 (Ratchet-Master):** Provides initial root key for Triple Ratchet initialization
- **Agent 008 (Symmetric-Sentinel):** Supplies 256-bit AES key from KDF
- **Agent 023 (Signal-Router):** Public keys transmitted in initial handshake
- **Agent 011 (Signature-Authority):** Hybrid keys signed with Ed25519 to bind identity

**Data Flow:**
```
[Keypair Gen] → X25519 key + ML-KEM key
[Encapsulation] → Peer receives ciphertext
[Decapsulation] → Recover shared secret
[KDF] → Session encryption key
[Agent 007] → Feed root key to Triple Ratchet
```

### Contribution to the Whole
Without Agent 006's hybrid key exchange, the entire security architecture collapses. Every transfer connection begins with this agent's key derivation. The moment a peer connects, Agent 006 must have already generated a keypair that can survive the emergence of quantum computers. This agent converts a theoretical post-quantum security goal into cryptographic reality at the connection layer. By anchoring all subsequent encryption (Agent 008), ratcheting (Agent 007), and authentication (Agent 011) to this hybrid foundation, Agent 006 ensures that Tallow's "post-quantum secure" claim is not marketing but mathematics.

### Failure Impact Assessment
**If Agent 006 fails:**
- Hybrid key exchange breaks → No secure session establishment
- Initiators cannot encapsulate to responder keys → Handshake fails
- Fallback to classical-only encryption (severe quantum threat)
- Private keys not zeroed → Memory disclosure if process crashes
- Test vectors fail → NIST compliance lost
- All downstream crypto operations (Agent 007, 008, 011) receive invalid keys
- Platform degrades to insecure fallback or stops functioning entirely

**Cascade failure points:**
- Agent 007 receives garbage root keys → All message-level encryption fails
- Agent 023 cannot negotiate session → Signaling server cannot route peers
- Agent 011 cannot sign keypairs → Identity binding breaks
- Agent 017 cannot zero keys → Memory attacks become viable

### Operational Rules
1. **ZERO random numbers for classical attacks.** Counter-based nonces only.
2. **EVERY keypair generation must use cryptographic RNG.** No pseudorandom seeds.
3. **Domain separation strings MUST differ per use case.** No KDF output reuse across different purposes.
4. **Keys rotated every 7 days.** Old keys destroyed immediately via Agent 017.
5. **NIST test vectors PASS before release.** Zero exceptions.
6. **Hybrid design is non-negotiable.** No "classical-only" fallback. No "quantum-only" variant.
7. **All encapsulation/decapsulation errors logged to security audit trail.** Handled gracefully, never silent.
8. **Session keys derived once per peer connection.** Never reused across multiple peers.

---

## AGENT 007 — RATCHET-MASTER

### Identity
**Codename:** RATCHET-MASTER
**Agent Number:** 007
**Role Title:** Forward Secrecy & Post-Compromise Recovery Protocol Engineer
**Clearance Level:** TOP SECRET // CRYPTO
**Division:** SIGINT (Cryptography & Security)
**Reports To:** Agent 005 (DC-ALPHA)

### Mission Statement
Agent 007 implements the Double Ratchet protocol—a sophisticated forward secrecy mechanism ensuring that compromise of long-term keys does NOT retroactively expose past messages. By combining classical Diffie-Hellman ratcheting (Agent 006's X25519) with sparse post-quantum ratcheting (Agent 006's ML-KEM), this agent guarantees that an adversary stealing a peer's current keys can read only future messages, not the historical transcript. Every message gets a unique key derived from ratcheted state. Every 1,000 classical messages, a full DH ratchet step regenerates the root key. Every 100 messages, a PQ ratchet step adds quantum-resistant evolution. Skipped message keys are stored temporarily for out-of-order delivery but destroyed immediately after use, leaving zero evidence of old messages.

### Scope of Authority
**Files Owned:**
- `lib/crypto/triple-ratchet.ts` — Core Triple Ratchet (DH + Symmetric + PQ)
- `lib/crypto/sparse-pq-ratchet.ts` — Post-quantum ratchet stepping
- `lib/chat/encryption/triple-ratchet.ts` — Message-level Triple Ratchet wrapper
- All `TripleRatchetState` management and persistence

**Code Paths:**
- Session initialization: `initializeTripleRatchet()`
- Message encryption: `encryptMessage()` (triggers sym ratchet + periodic DH ratchet)
- Message decryption: `decryptMessage()` (handles out-of-order + skipped keys)
- Ratchet stepping: `stepRatchet()` every N messages
- State serialization for IndexedDB persistence

**Upstream Dependencies:**
- Agent 006 (PQC-Keysmith) provides initial root key + hybrid public keys
- Agent 009 (Hash-Oracle) provides HKDF-SHA256 for ratchet key derivation
- Agent 017 (Memory-Warden) zeros old chain keys after use

**Downstream Consumers:**
- Agent 008 (Symmetric-Sentinel) receives message keys from ratchet output
- Chat encryption layer uses derived keys for actual message encryption

### Technical Deep Dive

**Triple Ratchet Architecture:**
- **Double Ratchet** (classical): DH chain + symmetric chain
  - DH chain: `rootKey = HKDF(rootKey || DH(ownPrivate, peerPublic))`
  - Symmetric chain: `(chainKey, messageKey) = HKDF(chainKey)` per message
- **Sparse PQ Ratchet** (post-quantum): ML-KEM at sparse intervals
  - Triggers every 100 messages (or every 10 DH ratchet steps)
  - PQ ratchet output: `(pqRootKey, pqMessageKey) = PQ_KDF(ml_kem_shared_secret)`
  - Provides quantum-resistant evolution independent of DH

**DH Ratchet Timing:**
- Initiates on every received peer DH public key update
- Occurs at least once per 1,000 messages (or 10 minutes, whichever first)
- When triggered: `newRootKey = HKDF(rootKey || freshDH(ourKey, peerKey))`
- Generates new ephemeral keypair → send to peer
- `previousChainLength` field allows skipped key recovery

**Symmetric Ratchet Chain:**
- Per-message key derivation: `(chainKey_new, messageKey) = HKDF(chainKey)`
- 32-byte inputs, 32-byte per output
- Unidirectional: sender chain independent from receiver chain
- `MAX_SKIP = 1000` prevents storing infinite skipped keys
- Skipped keys deleted immediately after message decryption

**PQ Ratchet Sparse Stepping:**
```
Every 100 messages:
  pq_ciphertext = Encapsulate(peerPQPublicKey)
  pq_shared = Decapsulate(pq_ciphertext, ownPQSecretKey)
  pq_root_key = HKDF(previous_pq_root || pq_shared, context="pq-ratchet")
  Include pq_ciphertext in message header for peer recovery
```

**Skipped Message Key Storage:**
- Stored as: `{ skippedKeys: Map<"<senderChainKey>-<messageNumber>", messageKey> }`
- Limited to `MAX_SKIP = 1000` entries per peer
- Each key stored ≤24 hours then auto-deleted
- If peer sends message #5000 and we're at #1000, keys #1000-#4999 lost (cannot decrypt)
- This is acceptable trade-off: prevents memory explosion

**Key Derivation Parameters:**
- Algorithm: HKDF-SHA256
- Input key material: 32 bytes (chainKey)
- Salt: 32 bytes (from rootKey)
- Info: "tallow-tr-chain-v1" or "tallow-tr-message-v1" (domain separation)
- Output: 32 bytes (chainKey) + 32 bytes (messageKey)

**State Persistence:**
- Full `TripleRatchetState` serialized to IndexedDB per peer session
- Encrypted at rest by Agent 017 (Memory-Warden)
- Restored on tab refresh, device reconnect, or app restart
- Session survives network interruption + reconnection

### Deliverables
1. **Triple Ratchet initialization** from Agent 006's hybrid key
2. **Message encryption** returning (DH public key, message number, ciphertext)
3. **Message decryption** accepting (DH public key, message number, ciphertext), handling out-of-order
4. **DH ratchet stepping** every 1,000 messages
5. **PQ ratchet stepping** every 100 messages with encapsulation
6. **Skipped key management** with 24-hour auto-deletion
7. **State serialization/deserialization** for persistence
8. **Test suite** with 10K+ message sequences, reordering, packet loss simulation

### Quality Standards & Benchmarks
| Standard | Requirement | Verification |
|----------|-------------|--------------|
| **Forward Secrecy** | Old message keys unrecoverable after ratchet | Prove keys not stored post-deletion |
| **DH Ratchet Frequency** | Every ≤1,000 messages | Counter-based logging |
| **PQ Ratchet Frequency** | Every ≤100 messages | PQ ciphertext presence in headers |
| **Skipped Key Limit** | MAX_SKIP = 1000 entries | Memory bound verification |
| **Message Reordering** | Handle up to 1,000 out-of-order messages | E2E test with packet loss |
| **State Persistence** | Survive app restart | IndexedDB round-trip test |
| **Timing Resistance** | Key derivation constant-time | Agent 013 audit |

### Inter-Agent Dependencies

**Upstream:**
- **Agent 006 (PQC-Keysmith):** Initial root key + public keys for ratcheting
- **Agent 009 (Hash-Oracle):** HKDF for chain key derivation
- **Agent 013 (Timing-Phantom):** Constant-time comparison in skipped key lookup
- **Agent 017 (Memory-Warden):** Key zeroing after use + state encryption

**Downstream:**
- **Agent 008 (Symmetric-Sentinel):** Message keys fed to AES-GCM per message
- **Chat layer:** Receives encrypted messages with ratchet headers

### Contribution to the Whole
The Triple Ratchet is Tallow's message-level security heartbeat. Without it, a single stolen session key would expose the entire message history. With it, each message becomes independently secure. An attacker breaking into a peer's device mid-conversation loses ability to read old messages (forward secrecy) AND is detected by integrity checks when ratchet state diverges (break-in recovery). This agent transforms Tallow from "encrypt the connection" to "encrypt every message with unique keys."

### Failure Impact Assessment
**If Agent 007 fails:**
- Message keys don't derive → All messages unencryptable
- DH ratchet never triggers → Forward secrecy lost (old keys compromised = old messages readable)
- PQ ratchet never triggers → Quantum threat degrades security over time
- Skipped keys accumulate infinitely → Memory exhaustion, crash
- State doesn't persist → Every app restart loses message history access
- Out-of-order messages unreadable → Only in-order delivery works (fragile)

### Operational Rules
1. **DH ratchet MUST trigger every ≤1,000 messages.** No exceptions.
2. **PQ ratchet MUST trigger every ≤100 messages.** Sparse stepping is mandatory.
3. **Skipped keys NEVER exceed `MAX_SKIP = 1000` entries.** Trim older messages.
4. **Every message key different.** Derived fresh from chain.
5. **Chain keys ZEROED immediately after messageKey derivation.** No copies stored.
6. **Ratchet state encrypted in IndexedDB.** See Agent 017 requirements.
7. **Out-of-order tolerance: 1,000 message gap.** Beyond that, message lost.
8. **All ratchet stepping logged for forensics.** DH ratchet events timestamped.

---

## AGENT 008 — SYMMETRIC-SENTINEL

### Identity
**Codename:** SYMMETRIC-SENTINEL
**Agent Number:** 008
**Role Title:** Authenticated Encryption Layer Operator
**Clearance Level:** TOP SECRET // CRYPTO
**Division:** SIGINT (Cryptography & Security)
**Reports To:** Agent 005 (DC-ALPHA)

### Mission Statement
Agent 008 owns the actual encryption of every file chunk, message, and metadata packet traveling through Tallow. While Agent 006 (PQC-Keysmith) establishes hybrid session keys and Agent 007 (Ratchet-Master) derives per-message keys, Agent 008 *applies* those keys to plaintext using authenticated encryption—ensuring ciphertext cannot be forged, reordered, or tampered with. This agent selects the best symmetric cipher per device (AEGIS-256 if AES-NI available, ChaCha20-Poly1305 as fallback, AES-256-GCM as legacy) and manages nonce generation to guarantee zero reuse across billions of messages. Authentication tag verification occurs BEFORE decryption, preventing oracle attacks.

### Scope of Authority
**Files Owned:**
- `lib/crypto/file-encryption-pqc.ts` — File-level encryption wrapper
- `lib/crypto/chacha20-poly1305.ts` — ChaCha20-Poly1305 AEAD implementation
- `lib/crypto/aegis256.ts` — AEGIS-256 hardware-accelerated variant
- `lib/crypto/nonce-manager.ts` — Nonce generation and tracking
- All symmetric encryption invocations across codebase

**Code Paths:**
- File chunking + encryption: `encryptFileChunk(plaintext, key, nonce)`
- Chunk decryption: `decryptFileChunk(ciphertext, key, nonce, aad)`
- Nonce generation: `generateNonce()` per chunk
- Cipher selection: `selectCipher()` based on platform capabilities

**Upstream Dependencies:**
- Agent 006 (PQC-Keysmith) provides session encryption keys
- Agent 007 (Ratchet-Master) provides per-message keys
- Agent 009 (Hash-Oracle) provides BLAKE3 for authenticated data
- Agent 013 (Timing-Phantom) provides constant-time comparison for auth tags

**Downstream Consumers:**
- File transfer system encrypts chunks before sending
- Network layer sends ciphertext packets
- Chat encryption encrypts messages

### Technical Deep Dive

**Cipher Variants:**
1. **AEGIS-256** (Preferred if AES-NI available)
   - NIST lightweight cipher competition finalist
   - 256-bit key, 256-bit nonce, 128-bit tag
   - Rate: 2 blocks per 256-bit state (2× faster than AES-GCM)
   - Hardware acceleration via AES-NI instructions
   - Authenticated encryption in single pass

2. **ChaCha20-Poly1305** (RFC 7539 fallback)
   - 256-bit key, 96-bit nonce (12 bytes), 128-bit tag
   - Pure software, no hardware requirements
   - Two passes: ChaCha20 for encryption, Poly1305 for authentication
   - Nonce increments per message

3. **AES-256-GCM** (Legacy support)
   - 256-bit key, 96-bit nonce, 128-bit tag
   - WebCrypto API standard (guaranteed availability)
   - 8 auth tag bits leaked per message (timing side-channel risk)
   - Fallback only

**Nonce Generation and Management:**
- **Counter-based nonces** (NOT random): `nonce = timestamp_32bit || counter_64bit`
- Each peer maintains independent counter per session
- Counter increments atomically, never resets within session
- 96-bit total: ensures uniqueness across 2^64 messages per peer
- 32-bit timestamp allows 136 years before overflow (acceptable)
- NonceManager tracks state in memory, persists to IndexedDB via Agent 017

**Per-Chunk Encryption Parameters:**
```
Input: plaintext (file chunk, ≤16MB)
Input: encryptionKey (32 bytes from Agent 007)
Input: nonce (12 bytes, unique per message)
Input: aad (additional authenticated data: chunk number, sender ID, timestamp)

Encrypt: ciphertext = AE(plaintext, aad, encryptionKey, nonce)
Output: (ciphertext, nonce, authTag)
```

**Authentication Tag Verification:**
- Tag is **verified BEFORE decryption** (prevents oracle attacks)
- Verification is constant-time via Agent 013
- Mismatch → reject immediately, do not attempt decryption
- Mismatch logged to security audit trail (potential tampering)
- Tag size: 128 bits (2^128 brute force attempts required)

**Associated Authenticated Data (AAD):**
- Protects metadata without encrypting it
- Includes: chunk number, sender ID, receiver ID, timestamp
- Prevents reordering of chunks by attacker
- Prevents replaying old chunks
- AAD = `sha256(senderID || receiverID || chunkNumber || timestamp)`

**Performance Targets:**
- Encryption rate: >100 MB/s on modern CPU (AEGIS-256 with AES-NI)
- Nonce generation: <1µs per chunk
- Auth tag verification: <10µs constant-time comparison
- Adaptive chunk size: 4KB - 256KB based on bandwidth

### Deliverables
1. **Symmetric encryption function** supporting AEGIS-256, ChaCha20-Poly1305, AES-GCM
2. **Cipher auto-selection** based on platform (AEGIS if AES-NI, else ChaCha20)
3. **Nonce generation** with counter-based uniqueness
4. **Nonce tracking per peer session** to prevent reuse
5. **Authenticated encryption wrapper** enforcing tag verification before decrypt
6. **AAD generation** binding metadata to ciphertext
7. **Performance benchmarks** (target >100 MB/s)
8. **Test vectors** from NIST test suites for each cipher

### Quality Standards & Benchmarks
| Standard | Requirement | Verification |
|----------|-------------|--------------|
| **Nonce Reuse** | Zero reuse across 2^64 messages | Counter-based proof + testing |
| **Tag Verification** | Always verified BEFORE decrypt | Code inspection + E2E tests |
| **Cipher Security** | 256-bit keys, 128-bit tags | NIST approval documentation |
| **Performance** | >100 MB/s encryption throughput | Benchmark on 1GB file transfer |
| **Platform Support** | AEGIS (AES-NI), ChaCha20 (fallback) | Cross-device testing |
| **Timing Resistance** | All comparisons constant-time | Agent 013 audit |
| **AAD Integrity** | Metadata unforgeably bound | Test tampering detection |

### Inter-Agent Dependencies

**Upstream:**
- **Agent 006 (PQC-Keysmith):** Session encryption keys
- **Agent 007 (Ratchet-Master):** Per-message keys
- **Agent 009 (Hash-Oracle):** AAD generation via BLAKE3
- **Agent 013 (Timing-Phantom):** Constant-time tag verification

**Downstream:**
- **File transfer system:** Encrypted chunks for network transmission
- **Chat system:** Encrypted messages
- **Network layer:** Receives ciphertext packets

### Contribution to the Whole
Agent 008 is where cryptography meets reality. Without it, all the key exchange and ratcheting from Agents 006-007 would be theoretical. Agent 008 guarantees that every byte traveling over the network is encrypted AND authenticated, preventing both eavesdropping and tampering. By intelligently selecting the fastest available cipher per device, this agent ensures Tallow maintains both security and performance—100 MB/s transfers without compromising on crypto.

### Failure Impact Assessment
**If Agent 008 fails:**
- No symmetric encryption → all plaintext exposed on network
- Nonce reuse → ciphertext patterns leak plaintext (fatal for AEAD)
- Auth tag verification skipped → ciphertext forgery possible
- Cipher selection fails → defaults to insecure fallback or stops
- AAD not checked → chunks reordered undetectably
- Performance degradation → transfers slow to crawl

### Operational Rules
1. **Nonces NEVER reused.** Counter-based generation mandatory.
2. **Auth tag verified BEFORE decryption.** No exceptions, ever.
3. **AEGIS-256 prioritized if AES-NI available.** Maximum performance + security.
4. **AAD ALWAYS included.** Metadata binding non-negotiable.
5. **All comparison operations constant-time.** Agent 013 enforces.
6. **Cipher selection deterministic per platform.** No randomization.
7. **Nonce state persisted across sessions.** IndexedDB via Agent 017.
8. **Performance monitored per release.** Must maintain >100 MB/s throughput.

---

## AGENT 009 — HASH-ORACLE

### Identity
**Codename:** HASH-ORACLE
**Agent Number:** 009
**Role Title:** Integrity Verification & Key Derivation Function Architect
**Clearance Level:** TOP SECRET // CRYPTO
**Division:** SIGINT (Cryptography & Security)
**Reports To:** Agent 005 (DC-ALPHA)

### Mission Statement
Agent 009 is the keeper of cryptographic hashes and key derivation across Tallow. Using BLAKE3 (modern, parallel, quantum-resistant), this agent ensures every file chunk has a provably correct hash, every file transfer produces a complete integrity verification, and every symmetric key is derived deterministically from session secrets. The agent implements streaming hash for gigabyte-scale files without memory explosion, keyed hashing for authentication, and hierarchical key derivation using domain separation strings to prevent cryptographic confusion attacks. When the hash function fails, the entire integrity chain collapses—so BLAKE3 verification against official test vectors is absolute.

### Scope of Authority
**Files Owned:**
- `lib/crypto/blake3.ts` — Core BLAKE3 streaming hash implementation
- `lib/crypto/sha3.ts` — SHA3-256 fallback for compatibility
- All KDF operations using HKDF pattern
- Per-chunk integrity hashing in file transfer
- Full-file merkle tree verification

**Code Paths:**
- File chunking: `hashChunk(plaintext)` produces per-chunk hash
- Full file hash: `hashFile(fileContent)` merkle tree
- KDF: `deriveKey(password, salt, info)` using HKDF-SHA256
- Session KDF: `deriveSessionKey(sharedSecret, domain)`
- Integrity verification: `verifyFileIntegrity(fileHash, receivedFile)`

**Upstream Dependencies:**
- Agent 006 (PQC-Keysmith) provides shared secrets for KDF
- BLAKE3 WASM for performance (Agent 059)
- All hash inputs from plaintext streams

**Downstream Consumers:**
- Agent 008 (Symmetric-Sentinel) uses derived keys
- Agent 010 (Password-Fortress) uses HKDF for password derivation
- File transfer layer uses chunk hashes for integrity verification
- Agent 016 (Metadata-Eraser) uses BLAKE3 for filename hashing

### Technical Deep Dive

**BLAKE3 Specification:**
- Modern cryptographic hash function (RFC pending, IETF standard track)
- Output: 256-bit (32-byte) hashes by default
- Quantum-resistant (hash functions inherit QR via Grover's algorithm limit)
- Parallelizable: 64-byte blocks, tree hashing for large inputs
- Streaming support: No need to buffer entire file in memory
- Keyed mode: `BLAKE3(key || message)` for HMAC-like functionality
- Derive-key mode: Secure domain-separated subkey generation

**BLAKE3 Parameters:**
- Block size: 64 bytes (512 bits)
- Chunk size: 1,024 bytes (16 blocks per chunk)
- Tree node size: 32 bytes (256 bits)
- IV: 8 × 32-bit constants (fractional parts of √2)
- Rounds: 7 per block (unrolled for performance)

**Streaming Hash for Large Files:**
```
For 1GB file transfer:
  1. Split into 1MB chunks
  2. Hash each chunk: blake3(chunk_i) → 32-byte hash
  3. Concatenate all chunk hashes: combined = hash1 || hash2 || ... || hashN
  4. Final hash: fileHash = blake3(combined) → 32-byte file hash
  5. Transmit: (chunk + hash) pairs alongside metadata hash
  6. Receiver verifies each chunk hash BEFORE decryption
```

**HKDF-SHA256 for Key Derivation:**
- Algorithm: HKDF as per RFC 5869
- Hash function: SHA256 (used instead of BLAKE3 for compatibility)
- Extract phase: `prk = HMAC-SHA256(salt, IKM)`
- Expand phase: `T(i) = HMAC-SHA256(prk, T(i-1) || info || i)`
- Multiple keys derived via different `info` contexts (domain separation)

**Domain Separation Strings (Critical):**
- Prevents KDF output reuse across different purposes
- Each use case gets unique info string:
  - "tallow-session-key-v1" → session encryption key
  - "tallow-chain-key-v1" → ratchet chain key
  - "tallow-message-key-v1" → per-message key
  - "tallow-auth-key-v1" → message authentication key
- No two different keys can be mistakenly swapped

**Merkle Tree Verification:**
```
File with 4 chunks (each 1MB):
  chunk1 → h1 = blake3(chunk1)
  chunk2 → h2 = blake3(chunk2)
  chunk3 → h3 = blake3(chunk3)
  chunk4 → h4 = blake3(chunk4)

  Level 1: blake3(h1 || h2) → h12, blake3(h3 || h4) → h34
  Level 2: blake3(h12 || h34) → root (file hash)

  Verification: recompute root, compare
```

**Password Derivation (Argon2id used by Agent 010):**
- Not owned by Agent 009, but uses HKDF output as final step
- Argon2id produces 32-byte output
- HKDF-SHA256 stretches to desired key length with domain sep

### Deliverables
1. **BLAKE3 streaming hash implementation** with WASM fallback
2. **Per-chunk hashing** for file integrity during transfer
3. **Merkle tree hashing** for full-file verification
4. **HKDF-based KDF** with domain separation
5. **Session key derivation** from hybrid shared secrets
6. **NIST test vector verification** (BLAKE3 vectors + HKDF)
7. **Performance benchmarks** (target >1 GB/s hashing via WASM)
8. **Streaming hash for multi-gigabyte files** without memory explosion

### Quality Standards & Benchmarks
| Standard | Requirement | Verification |
|----------|-------------|--------------|
| **BLAKE3 Test Vectors** | All official KAT vectors pass | Automated suite |
| **Output Uniqueness** | Different inputs → different hashes | Collision resistance tests |
| **Streaming Correctness** | Chunked hash = full buffer hash | Compare outputs |
| **Domain Separation** | No key reuse across contexts | Verify info strings |
| **Performance** | >1 GB/s hashing (WASM) | 1GB file benchmark |
| **Quantum Resistance** | BLAKE3 resists Grover's algorithm | NIST assessment |
| **Merkle Tree** | All branches correctly computed | Tree rebuild + verify |

### Inter-Agent Dependencies

**Upstream:**
- **Agent 006 (PQC-Keysmith):** Shared secrets for KDF
- **Agent 013 (Timing-Phantom):** Constant-time hash comparison (if needed)
- **Agent 059 (WASM-Alchemist):** BLAKE3 WASM module for performance

**Downstream:**
- **Agent 008 (Symmetric-Sentinel):** Uses KDF output for encryption keys
- **Agent 010 (Password-Fortress):** Uses HKDF in password derivation
- **File transfer system:** Uses chunk hashes for integrity
- **Agent 016 (Metadata-Eraser):** Uses BLAKE3 for filename encryption

### Contribution to the Whole
Without Agent 009, files could be silently corrupted in transit without detection, keys could be accidentally reused across different purposes, and large-file transfers would require gigabytes of RAM to compute hashes. By implementing streaming BLAKE3, this agent enables integrity verification of terabyte-scale transfers while using only megabytes of memory. Every file leaving Tallow has an unforgeable hash; every session key is deterministically derived; every chunk is independently verified.

### Failure Impact Assessment
**If Agent 009 fails:**
- File integrity unverifiable → silent corruption possible
- Keys derived incorrectly → all encryption fails
- HKDF without domain separation → keys reused across purposes
- Hash collisions undetected → forged file hashes possible
- Streaming hash fails → gigabyte files require gigabytes RAM
- Test vectors fail → BLAKE3 implementation broken

### Operational Rules
1. **Domain separation MANDATORY in every KDF.** Different contexts = different info strings.
2. **Every file chunk hashed.** No exceptions.
3. **Merkle tree verification BEFORE decryption.** Integrity first.
4. **BLAKE3 streaming for files >1MB.** No buffering entire file.
5. **Test vectors PASS on every release.** Zero tolerance for hash function bugs.
6. **HKDF outputs never reused.** Each purpose gets unique derivation.
7. **Hash comparison constant-time if comparing secret material.** Defer to Agent 013.
8. **Performance monitored.** Must maintain >1 GB/s hashing throughput.

---

## AGENT 010 — PASSWORD-FORTRESS

### Identity
**Codename:** PASSWORD-FORTRESS
**Agent Number:** 010
**Role Title:** Password-Protected Transfer & Authentication Protocol Architect
**Clearance Level:** TOP SECRET // CRYPTO
**Division:** SIGINT (Cryptography & Security)
**Reports To:** Agent 005 (DC-ALPHA)

### Mission Statement
Agent 010 enables password-protected file transfers and password-protected rooms where peers authenticate using a simple human-memorable secret rather than device keys. This agent implements Argon2id (NIST-approved password hashing), CPace (secure password-authenticated key exchange), and OPAQUE (asymmetric PAKE preventing offline brute-force), ensuring that passwords never travel the network and are computationally expensive to attack. Every password derives a key using 600K+ iterations, 64MB memory, and 4 parallelism—requirements that make brute-forcing a single attempt take seconds even on specialized hardware. The agent also detects and throttles rapid authentication attempts, adding additional protection against timing-based attacks.

### Scope of Authority
**Files Owned:**
- `lib/crypto/argon2-browser.ts` — Argon2id password hashing
- All password-based transfer logic
- Password-protected room creation and joining
- PAKE exchange protocols (CPace for CLI, OPAQUE for web)

**Code Paths:**
- Password-to-key derivation: `deriveKeyFromPassword(password, salt)`
- PAKE initiation: `initiatePasswordAuth(password)`
- PAKE verification: `verifyPasswordAuthResponse(credential)`
- Brute-force throttling: Track failed attempts per IP
- Password strength meter: Entropy calculation

**Upstream Dependencies:**
- Agent 009 (Hash-Oracle) provides HKDF for final key expansion
- Agent 013 (Timing-Phantom) ensures constant-time password comparison
- Agent 006 (PQC-Keysmith) provides session key to wrap password-derived key

**Downstream Consumers:**
- File transfer system for password-protected mode
- Room system for password-protected room joining
- CLI tool for password authentication

### Technical Deep Dive

**Argon2id Parameters:**
- Algorithm: Argon2id (memory-hard + time-hard hybrid)
- Iterations: 3 (recommended OWASP 2024)
- Memory: 64 MB per derivation (prevents GPU/ASIC attacks)
- Parallelism: 4 threads
- Salt: 16+ bytes, CSPRNG-generated
- Output: 32 bytes
- **Total cost per derivation:** ~600K+ CPU cycles + 64MB RAM
  - Single attempt on modern CPU: ~500ms
  - Brute-forcing 1M passwords: ~138 hours (serial), ~35 hours (4-threaded)
  - GPU attack infeasible due to memory requirement

**Argon2id Defense Properties:**
- **Memory-hardness:** GPU/ASIC attacks need 64MB per thread (prohibitive)
- **Time-hardness:** 3 iterations ensure minimum computation time
- **Parallelism-resistance:** 4 threads prevent massive parallelization
- **Salt uniqueness:** Different salt per user prevents rainbow tables
- **No timing leaks:** Constant-time operation (via underlying libargon2)

**CPace (Password-Authenticated Diffie-Hellman Exchange):**
Used in CLI tool for password-based peer authentication:
```
Client: knows password P
Server: stores H = Argon2id(P, salt)

1. Client initiates: send salt + nonce
2. Server responds: returns server-side PAKE commitment
3. Both compute: shared_secret = CPace(P, server_commitment)
4. Both derive: session_key = HKDF(shared_secret)
5. Client/Server exchange authenticated messages using session_key
```
- **Never transmits password.** Only authenticated key exchange.
- **Offline dictionary attack infeasible.** Attacker needs Argon2id cost per guess.
- **Forward secrecy:** Session key independent of long-term password.

**OPAQUE (Asymmetric PAKE for Web):**
For browser-based password-protected room joining:
```
Client: knows password P, wants to authenticate
Server: stores (salt, verifier) = OPAQUE_Register(P)

Implicit authentication without client credentials:
1. Client sends username
2. Server returns salt + OPAQUE response
3. Client computes: Argon2id(P, salt) → password_key
4. Client exchanges via OPAQUE (1-RTT)
5. Derives session key, proves knowledge of P without revealing it
```
- **Client privacy:** Server never learns password or long-term client keys
- **Offline brute-force resistance:** Argon2id cost per guess
- **Server compromise resilience:** Even stolen verifier doesn't leak password (hashed)

**Brute-Force Throttling:**
- Track failed auth attempts per IP address
- Exponential backoff: delay = 2^(attempt_count) seconds
  - Attempt 1-3: no delay
  - Attempt 4: 16s delay
  - Attempt 5: 32s delay
  - Attempt 6+: 60s delay + IP temporary block
- Reset counter after 24 hours without failed attempts

**Password Strength Meter:**
- Entropy calculation via Shannon entropy (bits of entropy)
- Feedback: weak (<50 bits), fair (50-80), strong (>80)
- Minimum requirement: 50 bits (for password-protected transfer)
- Recommendations: suggest passphrase (4 words ≥ 50 bits)

### Deliverables
1. **Argon2id password derivation** with configurable parameters
2. **CPace PAKE exchange** for CLI password authentication
3. **OPAQUE asymmetric PAKE** for web password authentication
4. **Brute-force throttling** with exponential backoff
5. **Password strength meter** with entropy calculation
6. **Salt generation** (16+ bytes CSPRNG)
7. **Test vectors** from official Argon2id test suites
8. **Timing attack resistance** verification with Agent 013

### Quality Standards & Benchmarks
| Standard | Requirement | Verification |
|----------|-------------|--------------|
| **Argon2id Cost** | 600K+ iterations + 64MB memory | Measure single derivation |
| **Derivation Time** | ≥500ms per password attempt | Benchmark on reference hardware |
| **Entropy Strength** | >50 bits minimum requirement | Entropy meter tests |
| **Throttling** | Exponential backoff on failures | Failed auth attempt logging |
| **Salt Uniqueness** | ≥16 bytes, CSPRNG per user | Salt audit trail |
| **Offline Resistance** | No precomputation feasible | Argon2id memory hardness |
| **Timing Resistance** | Constant-time comparison | Agent 013 audit |

### Inter-Agent Dependencies

**Upstream:**
- **Agent 009 (Hash-Oracle):** HKDF for final key expansion from password-derived key
- **Agent 006 (PQC-Keysmith):** Hybrid session key wraps password-derived key
- **Agent 013 (Timing-Phantom):** Constant-time password verification

**Downstream:**
- **File transfer system:** Password-protected mode uses password key
- **Room system:** Password-protected room joining uses PAKE

### Contribution to the Whole
Agent 010 democratizes Tallow's security. Not every transfer requires exchanging device keys beforehand; users can simply agree on a password out-of-band (spoken, texted, etc.) and the agent handles making that password secure against GPU-powered brute-force attacks. By implementing memory-hard Argon2id, the agent ensures a password is as strong as its entropy, not its length. This enables non-technical users to share files securely without understanding cryptographic key exchange.

### Failure Impact Assessment
**If Agent 010 fails:**
- Password-protected transfer mode unavailable
- Argon2id derivation fails → password authentication impossible
- Throttling disabled → brute-force attacks viable (1M attempts in hours)
- Entropy check skipped → weak passwords accepted
- PAKE exchange fails → password leaks or is transmitted plaintext

### Operational Rules
1. **Argon2id NEVER weakened.** 3 iterations, 64MB, 4 parallelism minimum.
2. **Passwords NEVER transmitted.** PAKE exchange only.
3. **Salt ALWAYS CSPRNG-generated.** Different per user.
4. **Brute-force throttling ENFORCED.** Exponential backoff on failures.
5. **Timing attacks prevented.** Constant-time password comparison (Agent 013).
6. **Entropy minimum: 50 bits.** Reject weaker passwords.
7. **Test vectors PASS.** Argon2id official compliance.
8. **Password never logged.** No plaintext in error messages or logs.

---

## AGENT 011 — SIGNATURE-AUTHORITY

### Identity
**Codename:** SIGNATURE-AUTHORITY
**Agent Number:** 011
**Role Title:** Digital Signature & Identity Binding Protocol Architect
**Clearance Level:** TOP SECRET // CRYPTO
**Division:** SIGINT (Cryptography & Security)
**Reports To:** Agent 005 (DC-ALPHA)

### Mission Statement
Agent 011 proves that Alice is truly Alice using digital signatures. This agent implements Ed25519 (classical signatures proven secure for decades), ML-DSA-65 (FIPS 204 post-quantum digital signature), and SLH-DSA (FIPS 205 stateless backup signature), ensuring every peer can cryptographically prove their identity and that transferred files haven't been tampered with en route. Prekeys (long-term public signing keys) are rotated every 7 days, forcing an attacker to compromise fresh keys rather than leveraging historical breaches. All signatures are verified before accepting peer connections, preventing a compromised relay server from forging false identities. The agent binds identity to hybrid public keys (Agent 006), creating an unforgeable chain: Agent 011 signs the Kyber + X25519 public keys, proving "this device is device X, and these are its encryption keys."

### Scope of Authority
**Files Owned:**
- `lib/crypto/digital-signatures.ts` — Ed25519 and ML-DSA-65 signing
- `lib/crypto/pq-signatures.ts` — Post-quantum signature protocols
- `lib/crypto/signed-prekeys.ts` — Prekey management and rotation
- All signature verification in peer authentication
- Identity binding to public encryption keys

**Code Paths:**
- Prekey generation: `generateSignedPrekey()` returns (public key + Ed25519 signature)
- Prekey publication: Upload to signaling server with signature
- Signature verification: `verifyPrekeySignature(prekey, signature)` before accepting
- File signing: `signFile(file, privateSigningKey)` for attestation
- Identity binding: Sign encryption public keys with signing key

**Upstream Dependencies:**
- Agent 006 (PQC-Keysmith) provides encryption public keys to sign
- Agent 009 (Hash-Oracle) provides BLAKE3 for message digest before signing
- Agent 013 (Timing-Phantom) ensures constant-time signature comparison
- Agent 017 (Memory-Warden) zeros signing private keys after use

**Downstream Consumers:**
- Peer connection establishment verifies signatures before trusting identity
- File transfer system optionally includes file signatures
- Agent 012 (SAS-Verifier) uses signature trust level in MITM detection

### Technical Deep Dive

**Ed25519 Specification:**
- IETF RFC 8032 standardized elliptic curve signature scheme
- Private key: 32 bytes (secret scalar)
- Public key: 32 bytes (curve point)
- Signature: 64 bytes (r + s values)
- Hash function: SHA-512 (used internally for key derivation)
- **Security strength:** 128 bits (brute force requires 2^128 operations)
- **Resistance to side-channel attacks:** Deterministic signatures, constant-time verification

**ML-DSA-65 (NIST FIPS 204):**
- Post-quantum digital signature (lattice-based)
- NIST-approved replacement for RSA/ECDSA in quantum era
- Key sizes:
  - Public key: 1,952 bytes (larger than Ed25519)
  - Secret key: 4,032 bytes
  - Signature: 3,309 bytes
- **Security strength:** ≥192 bits post-quantum (quantum-resistant)
- Trade-off: Larger signatures + slower signing/verification than Ed25519
- Used for critical identity binding (prekeys, device registration)

**SLH-DSA (FIPS 205):**
- Stateless hash-based signature (backup to ML-DSA)
- No state management required (unlike Merkle signature trees)
- Signature size: ~17 KB (extremely large)
- **Use case:** Disaster recovery if ML-DSA broken (2-of-3 multisig)
- Not used in normal operation due to size, but available as emergency backup

**Prekey Rotation Schedule:**
```
Day 1: Generate SignedPrekey #1, publish, activate
Day 7: Generate SignedPrekey #2, publish, activate (PreKey #1 archived)
Day 14: Generate SignedPrekey #3, publish, activate (PreKey #2 revoked, deleted)
...
At any time:
  - Active prekey: used for new peer connections
  - Archive prekeys (up to 30 days old): still acceptable for incoming messages
  - Revoked prekeys (>30 days old): rejected, force re-handshake
```

**Hybrid Signature Scheme:**
For maximum assurance, critical identity proofs use dual signatures:
```
Prekey bundle contains:
  - prekey_public_key: Kyber + X25519
  - ed25519_sig: Ed25519(prekey_public_key)
  - ml_dsa_sig: ML-DSA-65(prekey_public_key)

Verification:
  - Both signatures MUST verify (conjunction)
  - If either fails, prekey rejected
  - Provides classical + quantum-resistant proof simultaneously
```

**Message Digesting Before Signing:**
- Large files are BLAKE3-hashed before signing (prevents hash function collisions)
- Signature covers `blake3(file_content)`, not file itself
- Reduces signature overhead for large files
- BLAKE3 output: 32 bytes (digestible by any signature scheme)

**Prekey Revocation:**
- Prekey marked revoked if:
  - Age >30 days (rotated out of service)
  - Explicitly revoked (device compromise detected)
  - Next prekey in chain published (automatic retirement)
- Revocation list published to signaling server
- Clients reject revoked prekeys on connection

### Deliverables
1. **Ed25519 key generation** and signature operations
2. **ML-DSA-65 key generation** and signature operations
3. **SLH-DSA backup signature** generation (emergency only)
4. **Prekey management** with 7-day rotation schedule
5. **Signed prekey bundles** for peer authentication
6. **Signature verification** (Ed25519 + ML-DSA simultaneously)
7. **Prekey revocation** with age-based cleanup
8. **Test vectors** from NIST official suites

### Quality Standards & Benchmarks
| Standard | Requirement | Verification |
|----------|-------------|--------------|
| **Ed25519 Vectors** | Official IETF test vectors pass | Test suite |
| **ML-DSA-65 Vectors** | NIST FIPS 204 KAT pass | Test suite |
| **Signature Uniqueness** | Ed25519 deterministic (same message = same sig) | Verify determinism |
| **Verification Timing** | Constant-time, <100µs | Agent 013 audit |
| **Prekey Rotation** | Every ≤7 days | Audit trail |
| **Revocation Enforcement** | Rejected within 1 second of revocation | Integration test |
| **Hybrid Verification** | Both Ed25519 + ML-DSA verify (conjunction) | Signature verification tests |

### Inter-Agent Dependencies

**Upstream:**
- **Agent 006 (PQC-Keysmith):** Hybrid public keys to sign
- **Agent 009 (Hash-Oracle):** BLAKE3 for message digesting
- **Agent 013 (Timing-Phantom):** Constant-time signature comparison
- **Agent 017 (Memory-Warden):** Signing private key lifecycle

**Downstream:**
- **Peer connection establishment:** Verifies peer signatures before trusting identity
- **File transfer system:** Optionally signs files for attestation
- **Agent 012 (SAS-Verifier):** Incorporates signature trust in MITM detection

### Contribution to the Whole
Without Agent 011, Tallow has encryption but no identity. Any attacker could pose as any peer. Agent 011 creates a cryptographic identity layer: every device has a signing keypair, every long-term public key is signed, and every signature is verifiable by anyone. This enables trust chains: "I trust Alice's device because I verified her Ed25519 signature, which is bound to her ML-DSA-65 public key." Over time (via Agent 012's SAS verification), trust becomes persistent—future connections with Alice's device are instantly trusted.

### Failure Impact Assessment
**If Agent 011 fails:**
- Peer identity unverifiable → anyone can pose as anyone
- Signatures don't verify → prekeys rejected, connections fail
- Prekey rotation fails → old compromised keys remain active
- Revocation not enforced → revoked prekeys still accepted
- File signatures unavailable → no attestation of file origin

### Operational Rules
1. **Ed25519 + ML-DSA hybrid signing for critical prekeys.** Both must verify.
2. **Prekeys rotated every ≤7 days.** No exceptions.
3. **Signatures verified BEFORE accepting peer identity.** No unverified connections.
4. **Revocation enforced within 1 second.** Stale prekeys rejected.
5. **Signing keys NEVER logged or transmitted.** Only public keys.
6. **BLAKE3 digest before signing large files.** No full-file signing.
7. **Deterministic signatures (Ed25519).** Same message = same signature (for auditability).
8. **Test vectors PASS on every release.** Ed25519 + ML-DSA compliance verified.

---

## AGENT 012 — SAS-VERIFIER

### Identity
**Codename:** SAS-VERIFIER
**Agent Number:** 012
**Role Title:** Short Authentication String & Out-of-Band Verification Protocol Architect
**Clearance Level:** TOP SECRET // CRYPTO
**Division:** SIGINT (Cryptography & Security)
**Reports To:** Agent 005 (DC-ALPHA)

### Mission Statement
Agent 012 implements the last-mile defense against man-in-the-middle (MITM) attacks: Short Authentication String (SAS) verification. While Agent 006 exchanges keys and Agent 011 signs identities, neither prevents a compromised signaling server from silently swapping peer public keys. Agent 012 generates a short, human-comparable string (6 emoji or 5-word phrase) derived from the shared session secret and requires peers to manually compare them out-of-band (verbally, video call, or in-person). Mismatch immediately terminates the connection and alerts both peers to the attack. The SAS is secure because computing a collision requires breaking the underlying hash function (BLAKE3), making MITM practically impossible. UI makes the comparison prominent—no buried options, no "skip verification" button—ensuring users see and compare.

### Scope of Authority
**Files Owned:**
- All SAS generation and verification logic
- SAS emoji/word mapping tables
- Out-of-band verification UI and flow
- QR code generation for SAS codes
- SAS verification modal and comparison UI

**Code Paths:**
- SAS generation: `generateSAS(sharedSecret)` → emoji array or word list
- SAS display: UI shows 6 emoji or 5 words, large and prominent
- SAS comparison: User manually verifies match with peer
- Mismatch handling: `handleSASMismatch()` → terminate connection + alert
- QR code: Encode SAS + device identity for visual transfer

**Upstream Dependencies:**
- Agent 006 (PQC-Keysmith) provides session shared secret
- Agent 009 (Hash-Oracle) provides BLAKE3 for SAS derivation
- Agent 011 (Signature-Authority) optional identity binding

**Downstream Consumers:**
- Transfer UI displays SAS before beginning transfer
- Chat UI displays SAS before messaging
- Agent 048 (Trust-Builder) incorporates SAS verification into trust levels

### Technical Deep Dive

**SAS Generation Algorithm:**
```
Input: sessionSecret (32 bytes from Agent 006)
Input: direction ("initiator" or "responder")

domain_sep = blake3_keyed(domain="sas-generation-v1", key=sessionSecret)
sas_hash = blake3(sessionSecret || direction, context=domain_sep)

For emoji SAS (6 characters):
  emoji_index = sas_hash[0:2] mod 64 (emoji_table has 64 emojis)
  emoji_sas = [emoji_table[index] for index in emoji_indices]
  → Result: 6 emoji (64^6 ≈ 2^36 possibilities)

For word SAS (5 words):
  word_index = sas_hash[0:3] mod 2048 (BIP39 wordlist has 2048 words)
  word_sas = [word_table[index] for index in word_indices]
  → Result: 5 words (2048^5 ≈ 2^55 possibilities)
```

**Emoji Selection (64 emojis chosen for:**
- **Distinctiveness:** No similar-looking pairs (🔴 vs 🔵 clearly different)
- **Recognizability:** All common enough that non-technical users recognize them
- **Memorability:** Choose iconic, memorable emojis (🎯 🔒 🌟 🎁 etc.)
- **Gender-neutral:** Avoid gendered emojis
- **Cross-platform:** Support all major emoji sets (iOS, Android, Windows)

**Sample emoji set:**
🎯 🔒 🌟 🎁 🚀 💎 🏆 ⚡ 🔥 🌈 🎨 🎭 🎪 🎸 🎬 🎯
(36 more carefully selected emojis for 64 total)

**Word Selection (BIP39 wordlist):**
- Standard 2,048-word English list (widely recognized from Bitcoin)
- Examples: "apple", "building", "canyon", "diamond", "eagle"
- All 4-7 characters (easy to spell)
- No homophones (e.g., no "pear" + "pair")

**QR Code Encoding:**
- Encode: SAS code + device identity + session ID
- Format: `device-id:sas-code:session-id:timestamp`
- Error correction: Level H (30% correction)
- Allows visual transfer of SAS code via device camera
- Scanned QR → SAS automatically populated (eliminates typing)

**Out-of-Band Verification Flow:**
```
1. Initiator displays: "Compare these emoji with your peer"
   Shows 6 emoji in large, colorful format

2. Responder displays: "Compare these emoji with your peer"
   Shows same 6 emoji (deterministically derived)

3. Both peers compare out-of-band:
   - Verbal: "Do you see a rocket, star, diamond, fire, trophy, and cake?"
   - Video call: Show screen to peer
   - In-person: Show phone screen to peer
   - QR code: Scan QR to auto-populate

4. If match:
   - Both tap "Verified" button
   - Connection marked "verified + encrypted"
   - Device trust level increases (Agent 048)

5. If mismatch:
   - Either peer taps "Mismatch!"
   - Connection immediately terminated
   - Alert: "Someone may be intercepting your connection"
   - Both peers notified, session logged for forensics
```

**Collision Resistance:**
- Emoji SAS: 6 emoji × 64 possibilities = 2^36 ≈ 68 billion
- Word SAS: 5 words × 2048 possibilities = 2^55 ≈ 36 quadrillion
- Probability of accidental collision: ~2^-36 (1 in 68 billion)
- Probability of attacker forging collision: requires breaking BLAKE3 hash function (infeasible)

**Mismatch Detection:**
- Automatically detected when peers exchange SAS hashes during protocol
- Either side can initiate comparison challenge
- Challenge-response: Both must agree on SAS value
- Disagreement → connection termination + security alert

### Deliverables
1. **SAS generation** from session secret (deterministic, collision-resistant)
2. **Emoji SAS display** UI (6 emoji, large, colorful)
3. **Word SAS display** UI (5 words, easy to spell)
4. **QR code generation** encoding SAS + device identity
5. **Out-of-band verification flow** (guided comparison)
6. **Mismatch detection and response** (immediate termination + alert)
7. **Trust level tracking** (verified connections persistent)
8. **Test vectors** verifying SAS determinism and collision resistance

### Quality Standards & Benchmarks
| Standard | Requirement | Verification |
|----------|-------------|--------------|
| **SAS Uniqueness** | Different secrets → different SAS | Test 10K SAS generations |
| **Determinism** | Same secret → same SAS | Verify repeatability |
| **Collision Probability** | <2^-36 (emoji) or <2^-55 (words) | Mathematical proof |
| **UI Prominence** | SAS displayed front-and-center | Design review |
| **Comparison Latency** | Display <500ms, comparison flow <5s | UI responsiveness test |
| **Mismatch Detection** | Detected within 1s of peer disagreement | Integration test |
| **Emoji Distinctiveness** | No ambiguous pairs | Visual audit |
| **Word Recognition** | BIP39 list, all common words | Vocabulary test |

### Inter-Agent Dependencies

**Upstream:**
- **Agent 006 (PQC-Keysmith):** Session shared secret for SAS derivation
- **Agent 009 (Hash-Oracle):** BLAKE3 for SAS hash computation

**Downstream:**
- **Agent 048 (Trust-Builder):** Incorporates SAS verification into device trust levels
- **Transfer UI:** Displays SAS before transfer begins
- **Chat UI:** Displays SAS before messaging starts

### Contribution to the Whole
Agent 012 is the human-layer defense against sophisticated MITM attacks. Even if every algorithmic defense (Agents 006, 007, 008) is perfectly implemented, a compromised signaling server could swap public keys and silently MITM the connection. Agent 012 adds a verification step that cannot be automated or spoofed: human comparison of a short string. By making this comparison prominent and requiring explicit user action, Agent 012 ensures that users see security warnings and consciously verify peer identity. This transforms Tallow from "encrypted, maybe compromised" to "encrypted and verified by me."

### Failure Impact Assessment
**If Agent 012 fails:**
- SAS not generated → no MITM detection available
- SAS not displayed → users can't verify peer identity
- Mismatch not detected → MITM attack silently succeeds
- QR code fails → users must manually type long codes (error-prone)
- UI buried → users skip verification step

### Operational Rules
1. **SAS displayed before ANY data transfer.** No exceptions.
2. **Comparison MANDATORY, not optional.** No "skip" button.
3. **Mismatch = immediate connection termination.** No "proceed anyway."
4. **SAS deterministic.** Same peer = same SAS every time (for out-of-band verification).
5. **Emoji used by default (easier than words).** Words as fallback.
6. **QR code encoded with SAS + device ID.** Allows visual transfer.
7. **Verified connections persistent.** Future connections to same peer pre-verified.
8. **Mismatch logged to security audit.** Investigation trail for forensics.

---

## AGENT 013 — TIMING-PHANTOM

### Identity
**Codename:** TIMING-PHANTOM
**Agent Number:** 013
**Role Title:** Side-Channel & Constant-Time Operations Auditor
**Clearance Level:** TOP SECRET // CRYPTO
**Division:** SIGINT (Cryptography & Security)
**Reports To:** Agent 005 (DC-ALPHA)

### Mission Statement
Agent 013 hunts timing leaks—microsecond variations in code execution that reveal secrets to patient adversaries. While other agents implement strong algorithms, Agent 013 ensures those algorithms execute in constant time, independent of secret values. A password comparison that completes faster for correct letters than wrong ones leaks information. A signature verification that executes quicker for valid than invalid signatures reveals the signature format. Agent 013 scans the codebase for timing-sensitive operations, rewrites them with branch-free conditionals, and audits every PR before merge. This agent uses both static analysis (code inspection) and dynamic analysis (timing measurement) to ensure no secret-dependent path has measurably different execution time.

### Scope of Authority
**Files Owned:**
- All constant-time comparison functions across codebase
- Constant-time conditional execution patterns
- Side-channel auditing and testing framework
- Timing-resistant implementations of crypto operations
- Cache-timing analysis tools

**Code Paths:**
- Password comparison: `constantTimeCompare(password, stored_hash)`
- Auth tag verification: `constantTimeVerify(expected_tag, computed_tag)` BEFORE decrypt
- Signature comparison: Verify full signature regardless of format
- All branches dependent on secret values (flagged and rewritten)
- Cache-timing in hash table lookups (if secret-keyed)

**Upstream Dependencies:**
- All crypto agents (006-011) use constant-time functions provided by Agent 013
- No direct inputs; audits outputs of other agents

**Downstream Consumers:**
- Agent 008 (Symmetric-Sentinel) uses constant-time tag verification
- Agent 010 (Password-Fortress) uses constant-time password comparison
- Agent 011 (Signature-Authority) uses constant-time signature comparison
- All crypto modules route comparisons through Agent 013

### Technical Deep Dive

**Constant-Time Comparison:**
```javascript
// WRONG — timing leak!
function compare_bad(a, b) {
  if (a.length !== b.length) return false; // Early exit!
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false; // Early exit!
  }
  return true;
}
// Attack: measure execution time → infer how many bytes match

// CORRECT — constant-time
function constantTimeCompare(a, b) {
  let result = a.length === b.length ? 0 : 1;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    result |= (a[i] ^ b[i]); // XOR accumulates differences, never branches
  }
  return result === 0;
}
// Timing: same regardless of matching bytes or lengths
```

**Branch-Free Conditionals:**
```javascript
// WRONG — timing leak!
if (secret_value === 0) {
  key_a = derivation_a(); // Expensive
} else {
  key_a = derivation_b(); // Expensive
}
// Timing: different paths, different execution time

// CORRECT — branch-free
const is_zero = 1 & ((secret_value === 0) ? 0xFFFFFFFF : 0);
const key_a = (derivation_a() & ~is_zero) | (derivation_b() & is_zero);
// Timing: both derivations always execute, XOR selects result
```

**Timing Analysis Methodology:**
1. **Static analysis:** Code inspection for:
   - Secret-dependent conditionals: `if (secret) ...`
   - Secret-dependent array indexing: `array[secret_index]`
   - Secret-dependent loop bounds: `for (i = 0; i < secret_count; ...)`
   - Function calls dependent on secrets: `foo(secret) ? bar() : baz()`

2. **Dynamic analysis:** Timing measurement
   - Measure execution time 10,000× with identical secrets
   - Measure execution time 10,000× with different secrets
   - Compute standard deviation and p-value
   - If timing significantly differs: FLAG AND REWRITE

3. **Cache-timing analysis:** Cache-based side-channels
   - Flush CPU cache before sensitive operation
   - Measure memory access patterns (via cache line timing)
   - Ensure access patterns independent of secret

**Constant-Time Crypto Primitives:**
- Ed25519 signature verification: @noble/curves implementation is constant-time
- HMAC computation: All iterations always execute (no early return)
- Key comparison: Use provided `constantTimeCompare()` function
- Nonce management: Counter increment never branches

**Timing Attack Scenarios:**
1. **Password verification timing leak:**
   - Adversary tries 10M passwords, times authentication
   - Faster responses → more correct letters matched
   - Fix: Always execute Argon2id fully, no early exit

2. **Signature verification timing leak:**
   - Adversary tries 10M signatures, times verification
   - Faster responses → signature format recognized earlier
   - Fix: Verify full signature, constant-time comparison

3. **Cache-timing in hash function:**
   - Adversary measures CPU cache hits/misses
   - Patterns reveal secret bytes accessed
   - Fix: Ensure memory access pattern independent of secret

### Deliverables
1. **Constant-time comparison function** for all secret comparisons
2. **Static analysis audit framework** flagging timing-sensitive patterns
3. **Dynamic timing measurement suite** measuring execution time variance
4. **Cache-timing analysis tools** detecting cache-based side-channels
5. **Branch-free conditional patterns** for common use cases
6. **Timing attack test vectors** (artificial adversaries timing operations)
7. **PR review checklist** for timing-sensitive code
8. **Audit report** documenting all constant-time refactorings

### Quality Standards & Benchmarks
| Standard | Requirement | Verification |
|----------|-------------|--------------|
| **Constant-Time Comparison** | ≤1% timing variation across secret values | Measure 10K iterations |
| **Branch-Free Conditionals** | No secret-dependent branches | Static analysis + code review |
| **Cache-Timing Resistance** | Memory access patterns independent of secret | Cache-timing simulation |
| **Timing Attack Resilience** | Cannot infer secrets from timing | Formal analysis + testing |
| **Coverage** | 100% of crypto comparison operations audited | Checklist verification |
| **Performance Overhead** | <5% overhead vs. non-constant-time | Benchmark comparison |

### Inter-Agent Dependencies

**Upstream (Audits/Consumes):**
- All crypto agents (006-011): Audits their timing behavior
- Every PR touching crypto: Inspected for timing leaks

**Downstream (Provides to):**
- Agent 008 (Symmetric-Sentinel): constant-time tag verification
- Agent 010 (Password-Fortress): constant-time password comparison
- Agent 011 (Signature-Authority): constant-time signature comparison
- All crypto modules: Use constantTimeCompare() for secret comparisons

### Contribution to the Whole
Agent 013 ensures that Tallow's cryptographic implementations are not just mathematically sound but also practically secure against timing-based attacks. A perfectly implemented hash function that leaks information through timing is worse than useless—it creates false confidence while remaining vulnerable. By making constant-time a non-negotiable requirement, Agent 013 transforms Tallow from "locally secure" to "globally secure"—secure not just in a theoretical adversary model, but against real-world attackers with access to timing information.

### Failure Impact Assessment
**If Agent 013 fails:**
- Timing leaks in password verification → brute-force attacks feasible via timing
- Timing leaks in signature verification → forgery attacks feasible
- Timing leaks in nonce comparison → reuse detection bypassed
- Branch-free conditionals not enforced → secret values leak through timing
- Cache-timing attacks possible → secret bytes recovered from memory patterns

### Operational Rules
1. **ZERO secret-dependent conditionals.** All branches pre-computed.
2. **ZERO secret-dependent array indexing.** Use masked indices.
3. **ZERO secret-dependent loop bounds.** Loops always maximum length.
4. **constantTimeCompare() for all secret comparisons.** No exceptions.
5. **Timing analysis before every release.** Static + dynamic analysis pass.
6. **Cache-timing audit every 6 months.** Or when CPU architecture changes.
7. **No early returns on secrets.** Always complete full operation.
8. **Performance overhead acceptable if ≤5%.** Security > speed.

(Continued in next message due to length...)

