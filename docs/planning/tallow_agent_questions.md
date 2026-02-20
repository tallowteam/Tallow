# TALLOW AGENT COLLECTIVE — CUSTOMIZATION QUESTIONNAIRE

## PROJECT CANDLEWICK — 50 AGENT CONFIGURATION

> Answer the ABCD questions below to customize each agent's behavior, priorities, tooling, and philosophy. Your answers will be used to update every agent's profile to match your exact vision for Tallow.

---

## UPDATED DEPENDENCY VERSIONS (Latest as of Feb 2026)

Before we configure the agents, here is the updated Rust crate stack with the latest verified versions:

### Core Dependencies

| Layer | Crate | Latest Version | Previous | Purpose |
|-------|-------|---------------|----------|---------|
| CLI Framework | `clap` | **v4.5.58** | v4 | Argument parsing, subcommands, completions |
| Async Runtime | `tokio` | **v1.43** | v1 | Multi-threaded async I/O |
| Serialization | `serde` | **v1.0.217** | v1 | Serialization framework |
| Binary Encoding | `bincode` | **v2.0.0** | v1 | Efficient binary protocol serialization |
| Config | `toml` | **v0.8.20** | — | TOML config file parsing |
| Error Handling | `thiserror` | **v2.0** | v1 | Structured errors for libraries |
| Error Handling | `anyhow` | **v1.0.95** | v1 | Ad-hoc errors for applications |

### Cryptography

| Layer | Crate | Latest Version | Previous | Purpose |
|-------|-------|---------------|----------|---------|
| Post-Quantum KEM | `pqcrypto-kyber` | **v0.8.1** | — | ML-KEM-768 / ML-KEM-1024 |
| Post-Quantum Sig | `pqcrypto-dilithium` | **v0.5.1** | — | ML-DSA-65 / ML-DSA-87 |
| PQ Hash Sig | `pqcrypto-sphincsplus` | **v0.7.1** | — | SLH-DSA (FIPS 205) |
| X25519 | `x25519-dalek` | **v2.0.1** | v2 | Classical key exchange |
| Ed25519 | `ed25519-dalek` | **v2.1.1** | v2 | Classical digital signatures |
| AES-256-GCM | `aes-gcm` | **v0.10.3** | v0.10 | Symmetric encryption (AES-NI accelerated) |
| ChaCha20-Poly1305 | `chacha20poly1305` | **v0.10.1** | v0.10 | Alternative symmetric encryption |
| AEGIS-256 | `aegis` | **v0.6.7** | — | High-performance AEAD |
| BLAKE3 | `blake3` | **v1.8.2** | v1 | Hashing, KDF, MAC, Merkle tree |
| SHA3 | `sha3` | **v0.10.8** | v0.10 | NIST-compliant hashing |
| Argon2id | `argon2` | **v0.5.3** | v0.5 | Password hashing |
| HKDF | `hkdf` | **v0.12.4** | v0.12 | Key derivation |
| OPAQUE | `opaque-ke` | **v3.0.0** | v2 | Zero-knowledge PAKE |
| Key Zeroing | `zeroize` | **v1.8.1** | v1 | Guaranteed memory zeroing |
| Secret Wrapping | `secrecy` | **v0.10.3** | v0.8 | Prevent accidental key exposure |
| Constant-Time | `subtle` | **v2.6.1** | v2 | Side-channel resistant operations |
| Random | `rand` | **v0.9.0** | v0.8 | CSPRNG |
| Random (OS) | `getrandom` | **v0.3.1** | v0.2 | OS random source |

### Networking

| Layer | Crate | Latest Version | Previous | Purpose |
|-------|-------|---------------|----------|---------|
| QUIC | `quinn` | **v0.11.9** | v0.10 | Primary transport protocol |
| TLS | `rustls` | **v0.23.22** | v0.21 | TLS 1.3 for TCP fallback |
| DNS Resolver | `hickory-resolver` | **v0.25.1** | trust-dns v0.23 | DNS-over-HTTPS/TLS (renamed from trust-dns) |
| mDNS | `mdns-sd` | **v0.12.1** | v0.10 | LAN peer discovery |
| SOCKS5 | `tokio-socks` | **v0.5.2** | v0.5 | Proxy support (Tor, I2P) |

### Compression

| Layer | Crate | Latest Version | Previous | Purpose |
|-------|-------|---------------|----------|---------|
| Zstandard | `zstd` | **v0.13.3** | v0.12 | General-purpose compression |
| Brotli | `brotli` | **v7.0.0** | v3 | Text-optimized compression |
| LZ4 | `lz4_flex` | **v0.11.3** | v0.9 | Fast compression |
| LZMA | `lzma-rs` | **v0.3.0** | v0.2 | Maximum compression |

### TUI Framework

| Layer | Crate | Latest Version | Previous | Purpose |
|-------|-------|---------------|----------|---------|
| TUI Rendering | `ratatui` | **v0.30.0** | v0.29 | Immediate-mode terminal UI (modular workspace) |
| TUI Core | `ratatui-core` | **v0.1.0** | NEW | Core traits/types for widget libraries |
| TUI Widgets | `ratatui-widgets` | **v0.3.0** | NEW | Widget library (charts, tables, gauges) |
| Terminal Backend | `crossterm` | **v0.29** | v0.28 | Pure Rust cross-platform terminal I/O |
| Error Recovery | `color-eyre` | **v0.6.3** | v0.6 | Panic handler that restores terminal state |

### Interactive CLI

| Layer | Crate | Latest Version | Previous | Purpose |
|-------|-------|---------------|----------|---------|
| Interactive Prompts | `dialoguer` | **v0.11.0** | v0.10 | Password input, confirmations, select menus |
| Progress Bars | `indicatif` | **v0.17.11** | v0.17 | Multi-bar transfer progress, spinners |
| Terminal Colors | `owo-colors` | **v4.1.0** | v3 | Zero-allocation colored output |
| QR Code | `qrcode` | **v0.14.1** | v0.13 | Terminal QR code display |
| Tables | `comfy-table` | **v7.1.3** | v7 | Formatted output tables |
| Clipboard | `arboard` | **v3.4.1** | v3 | Clipboard read/write |
| File Watcher | `notify` | **v7.0.0** | v6 | Watch mode file system events |
| Logging | `tracing` | **v0.1.41** | v0.1 | Structured logging |
| Logging Subscriber | `tracing-subscriber` | **v0.3.19** | v0.3 | Log formatting and filtering |

### NEW Recommended Additions

| Layer | Crate | Version | Purpose |
|-------|-------|---------|---------|
| Noise Protocol | `snow` | **v0.9.6** | Noise framework for secure channels |
| Tor Client | `arti-client` | **v0.26.0** | Pure-Rust Tor client (replaces C tor) |
| SQLite Encryption | `rusqlite` | **v0.32.1** | Local database with SQLCipher support |
| Wire Format | `postcard` | **v1.1.1** | `#![no_std]` friendly serialization (lighter than bincode) |
| Terminal Graphics | `ratatui-image` | **v5.0.0** | Sixel/Kitty image rendering in TUI |
| Fuzzy Search | `nucleo` | **v0.5.0** | Fast fuzzy matching (Helix editor's engine) |
| Config Dirs | `directories` | **v6.0.0** | XDG/platform config paths |
| HTTP Client | `reqwest` | **v0.12.12** | Relay health checks, update checking |
| PQ Hybrid | `ml-kem` | **v0.2.1** | NIST FIPS 203 pure Rust ML-KEM |
| PQ Signatures | `ml-dsa` | **v0.2.0** | NIST FIPS 204 pure Rust ML-DSA |
| Merkle Tree | `rs_merkle` | **v1.4.2** | File chunk integrity verification |
| Terminal Styling | `ratatui-macros` | **v0.7.0** | Convenience macros for building TUI layouts |

---

# FACTION 01: NSA — AGENT QUESTIONS

---

## AGENT 01 — LATTICE (Post-Quantum Cryptography)

**Q1: What should be Tallow's PRIMARY post-quantum KEM library?**
- A) `pqcrypto-kyber` v0.8.1 — C bindings to reference implementation, battle-tested, widest adoption
- B) `ml-kem` v0.2.1 — Pure Rust FIPS 203 from RustCrypto, no C/FFI, fully memory-safe
- C) `aws-lc-rs` — AWS LibCrypto bindings with FIPS-validated ML-KEM, production-grade
- D) Both B + C — Use `ml-kem` as default, `aws-lc-rs` as FIPS-mode backend for enterprise

**Q2: What ML-KEM security level should be the MINIMUM default?**
- A) ML-KEM-512 (Level 1, AES-128 equivalent) — Fastest, smallest ciphertexts
- B) ML-KEM-768 (Level 3, AES-192 equivalent) — Balanced performance/security
- C) ML-KEM-1024 (Level 5, AES-256 equivalent) — Maximum security, no compromise
- D) Configurable per-transfer — Let users choose per connection based on sensitivity

**Q3: How should Tallow handle the hybrid classical + PQ key exchange?**
- A) ML-KEM-1024 + X25519 always — Both MUST succeed or transfer fails (AND composition)
- B) ML-KEM-1024 || X25519 — Either surviving is sufficient (OR composition)
- C) ML-KEM-1024 + X448 — Use the stronger X448 instead of X25519 for the classical component
- D) ML-KEM-1024 + X25519 + Classic McEliece — Triple hybrid for maximum paranoia

**Q4: What key combiner function for the hybrid shared secret?**
- A) `HKDF-SHA-512(ML-KEM-ss || X25519-ss)` — Standard, proven, NIST-recommended
- B) `BLAKE3(ML-KEM-ss || X25519-ss || ML-KEM-ct || X25519-pk)` — Binds ciphertext context
- C) `TupleHash(ML-KEM-ss, X25519-ss, "tallow-v1")` — SHA-3 family with domain separation
- D) `KMAC256("tallow-v1", ML-KEM-ss || X25519-ss)` — NIST SP 800-185, strongest provenance

---

## AGENT 02 — ENTROPY (Random Number Generation)

**Q1: What should be Tallow's PRIMARY CSPRNG source?**
- A) `getrandom` v0.3.1 → OS entropy only — Maximum trust in kernel RNG (getrandom() / SecRandomCopyBytes)
- B) `rand` v0.9 ChaCha12Rng — Seeded from OS, then deterministic fast CSPRNG
- C) `rand` v0.9 ChaCha20Rng — Seeded from OS, uses full 20 rounds for extra security margin
- D) Custom: OS entropy → HKDF-BLAKE3 → ChaCha20 — Defense-in-depth with Tallow-specific extraction

**Q2: How should Tallow handle entropy at first run on low-entropy systems?**
- A) Block until sufficient entropy is available (may delay startup)
- B) Mix OS entropy with timing jitter, keystroke timing, and disk access times
- C) Refuse to generate keys if entropy quality check fails, show diagnostic
- D) Use CPU instruction jitter (rdrand/rdseed) mixed with OS entropy as immediate fallback

**Q3: What key derivation function chain for session keys?**
- A) HKDF-SHA-512 — NIST standard, proven, widely analyzed
- B) HKDF-BLAKE3 — Faster, modern, keyed/extendable output
- C) HKDF-SHA3-256 — Quantum-resistant hash family, FIPS 202 compliant
- D) Double extraction: HKDF-SHA-512 then HKDF-BLAKE3 — Defense-in-depth with different hash families

**Q4: Domain separation strategy for derived keys?**
- A) Simple string labels: `"tallow-file-enc"`, `"tallow-chat-enc"`, `"tallow-auth"`
- B) Structured labels: `"tallow-v1-file-enc-aes256gcm-session"` with version + algorithm
- C) Numeric IDs: `0x01`, `0x02`, `0x03` — Compact, no parsing ambiguity
- D) Concatenated: `version || purpose || algorithm || counter` as fixed-length byte arrays

---

## AGENT 03 — BULKHEAD (Symmetric Encryption)

**Q1: What should be Tallow's PRIMARY AEAD cipher?**
- A) AES-256-GCM — Universal hardware acceleration, NIST standard, most audited
- B) ChaCha20-Poly1305 — Constant-time in software, no hardware dependency, NaCl/libsodium standard
- C) AEGIS-256 — 2-4x faster than AES-GCM, emerging standard, AES-NI based
- D) Auto-negotiate: AEGIS-256 → AES-256-GCM → ChaCha20-Poly1305 (best available)

**Q2: What chunk size for the streaming AEAD construction?**
- A) 16 KB — Minimum latency, fastest first-byte, higher per-chunk overhead
- B) 64 KB — Balanced: good streaming performance, reasonable overhead
- C) 256 KB — Optimized for large files, fewer authentication tags
- D) Adaptive: 16KB for files < 1MB, 64KB for 1MB-1GB, 256KB for > 1GB

**Q3: Nonce management strategy?**
- A) Random 96-bit nonces per chunk — Simple, standard, tiny collision probability
- B) Counter-based: `session_key || chunk_index` — Deterministic, zero collision possible
- C) Synthetic nonce: `BLAKE3(session_key, chunk_index, direction)` — Derived, misuse-resistant
- D) AES-GCM-SIV with synthetic nonces — Nonce-misuse resistant AEAD for maximum safety

**Q4: What cipher should be available for FIPS-compliance enterprise mode?**
- A) AES-256-GCM only (via `aws-lc-rs` FIPS module) — Standard FIPS 140-3 path
- B) AES-256-GCM + AES-256-GCM-SIV — Both FIPS-approved, SIV for misuse-resistance
- C) AES-256-CBC-HMAC-SHA-256 — Legacy FIPS approved, maximum compatibility
- D) Whatever `aws-lc-rs` FIPS-validated module supports — Let the validation drive choices

---

## AGENT 04 — WATCHFIRE (Traffic Analysis Resistance)

**Q1: What onion routing model should Tallow implement?**
- A) Tor-style telescopic circuit building with 3 hops — Proven, deeply analyzed
- B) Sphinx packet format — Single-pass, more compact, used by Nym and Katzenpost
- C) Mixnet with Loopix-style cover traffic — Stronger anonymity, higher latency
- D) Configurable: Tor-style for low-latency transfers, Sphinx for maximum anonymity

**Q2: Default packet padding strategy?**
- A) Pad to nearest power-of-2 (512B, 1KB, 2KB, 4KB) — Simple, reasonable overhead
- B) Fixed 1500-byte cells (MTU-sized) — Mimics regular network traffic
- C) Pad all packets to uniform 1KB cells — Maximum uniformity, ~50% overhead
- D) Adaptive: power-of-2 padding by default, constant-size cells when `--stealth` is active

**Q3: How aggressive should Tallow's timing obfuscation be?**
- A) No jitter by default (fastest transfers), opt-in with `--jitter`
- B) Random 0-10ms jitter always — Subtle, minimal performance impact
- C) Random 0-50ms jitter always — Moderate protection against correlation attacks
- D) Configurable profiles: `none` / `light` (0-10ms) / `moderate` (0-50ms) / `aggressive` (0-200ms)

**Q4: Should Tallow generate cover/decoy traffic?**
- A) Never — Users don't want unexpected bandwidth usage
- B) Only when `--stealth` or `--constant-rate` mode is active
- C) Light background pings to relays to maintain connection, but no data decoys
- D) Opt-in levels: `--cover none` / `--cover light` / `--cover full`

---

## AGENT 05 — TEMPEST (Side-Channel Resistance)

**Q1: How should Tallow verify constant-time behavior?**
- A) Manual audit + `subtle` crate usage throughout — Developer discipline
- B) Runtime verification with `dudect` (statistical timing leak detection) in CI
- C) Compile-time checks using Rust type system (SecretU8 types that prevent branching)
- D) All of the above — Manual, runtime, and type-system verification in layers

**Q2: Memory protection strategy for key material?**
- A) `zeroize` on drop + `mlock()` — Standard best practice
- B) `zeroize` + `mlock()` + guard pages (mprotect PROT_NONE around key regions)
- C) All of B + encrypted memory regions (XOR with ephemeral mask while at rest in RAM)
- D) Hardware isolation: use platform secure enclave (macOS SEP, Linux Keyring, TPM) when available

**Q3: Core dump and swap prevention?**
- A) `prctl(PR_SET_DUMPABLE, 0)` on Linux + platform equivalents
- B) A + MADV_DONTFORK + MADV_DONTDUMP on all key pages
- C) All of B + disable swap for the entire Tallow process (mlockall)
- D) All of C + clear terminal alternate screen buffer on exit

**Q4: Speculative execution attack mitigations?**
- A) Rely on OS/kernel mitigations (Spectre patches, KPTI)
- B) Compile with `-C target-feature=+retpoline` + speculation barriers around crypto
- C) Avoid lookup tables entirely (bitsliced AES, NTT without table access)
- D) All of the above — Belt and suspenders for security-critical code

---

## AGENT 06 — PRISM (Key Management & Identity)

**Q1: How should Tallow store long-term identity keys?**
- A) Encrypted file with Argon2id(passphrase) → XChaCha20-Poly1305 — Portable, cross-platform
- B) Platform keychain integration: macOS Keychain, GNOME Keyring, Windows Credential Manager
- C) Both A + B — Keychain as default, encrypted file as fallback/export
- D) Hardware-first: YubiKey/FIDO2 when available, then keychain, then encrypted file

**Q2: Contact verification model?**
- A) Emoji fingerprint only (4 emojis from public key hash) — Simple, visual
- B) Emoji fingerprint + numeric safety number (like Signal) — Dual verification methods
- C) Emoji fingerprint + QR code scanning — Supports in-person and remote verification
- D) All of the above — Users choose their preferred verification method

**Q3: Key rotation strategy?**
- A) Manual rotation only (`tallow keys rotate`) — User-initiated
- B) Automatic rotation every 90 days with signed transition records
- C) Rotation triggered by events: key age > 180 days OR device compromise suspected
- D) Continuous ratcheting — Session keys always forward, long-term key manual rotation

**Q4: Identity model for Tallow users?**
- A) Keypair only — No usernames, no accounts, pure cryptographic identity
- B) Keypair + optional human-readable display name (stored locally by contacts)
- C) Keypair + optional username (unique, registerable, discoverable)
- D) Keypair + optional username + optional linkable proofs (GitHub, DNS, Keybase-style)

---

## AGENT 07 — MERIDIAN (Formal Verification)

**Q1: What formal verification tools should validate Tallow's protocol?**
- A) ProVerif — Automated symbolic model checking, proven for crypto protocols
- B) Tamarin Prover — More expressive than ProVerif, handles stateful protocols
- C) Both ProVerif AND Tamarin — Cross-validate with different tools for higher confidence
- D) ProVerif + Tamarin + CryptoVerif (computational soundness proofs)

**Q2: What security properties MUST be formally verified?**
- A) Secrecy + Authentication only — The fundamentals
- B) Secrecy + Authentication + Forward Secrecy + Post-Compromise Security
- C) All of B + Key Confirmation + Deniability + Anonymity
- D) All of C + Resistance to Key Compromise Impersonation (KCI) attacks

**Q3: Should formal verification block releases?**
- A) No — Formal verification runs in parallel, findings addressed in next release
- B) Yes for protocol changes — Any protocol modification requires re-verification before merge
- C) Yes for all security-critical code — Crypto + protocol + key management
- D) Yes, and verification artifacts (proofs) published alongside each release

**Q4: How should verification results be communicated?**
- A) Internal documentation only — For developers and auditors
- B) Published technical report with each release
- C) Academic paper submission for peer review (IACR ePrint, USENIX Security)
- D) All of the above — Internal docs + public report + academic submission

---

## AGENT 08 — CROSSFIRE (Cryptographic Rust Implementation)

**Q1: What cryptographic library ecosystem should Tallow primarily use?**
- A) RustCrypto (`aes-gcm`, `blake3`, `ed25519-dalek`, `ml-kem`) — Pure Rust, no C/FFI
- B) `ring` — Audited, proven, used by `rustls`, but includes C/asm
- C) `aws-lc-rs` — FIPS-validated, production-grade, AWS-backed
- D) Hybrid: RustCrypto by default, `aws-lc-rs` behind `--fips` feature flag for enterprise

**Q2: How should Tallow handle platforms WITHOUT AES-NI hardware?**
- A) Software AES-GCM (constant-time bitsliced) — Slower but same algorithm
- B) Auto-fallback to ChaCha20-Poly1305 — Designed for software, equally secure
- C) Auto-fallback to AEGIS-256 if AES-NI present, else ChaCha20-Poly1305
- D) Negotiate: fastest mutually-supported AEAD at connection time

**Q3: Fuzzing strategy for crypto code?**
- A) `cargo-fuzz` with libFuzzer — Standard, integrated with Rust toolchain
- B) `cargo-fuzz` + AFL++ — Dual fuzzer for better coverage
- C) `cargo-fuzz` + AFL++ + Honggfuzz + property-based tests (proptest) — Maximum coverage
- D) All of C + integration with Google OSS-Fuzz for continuous community fuzzing

**Q4: Performance optimization priority for crypto operations?**
- A) Correctness only — No manual optimization, trust the compiler
- B) SIMD intrinsics for hot paths: AVX2/AVX-512 NTT, NEON acceleration
- C) All of B + assembly for critical inner loops (AES key schedule, polynomial multiplication)
- D) All of B only — SIMD yes, hand-written assembly no (too hard to audit)

---

## AGENT 09 — ECHELON (Compliance & Export Control)

**Q1: What open-source license should Tallow use?**
- A) AGPL-3.0 — Strongest copyleft, forces SaaS providers to share modifications
- B) GPL-3.0 — Strong copyleft but without AGPL's network clause
- C) BSL (Business Source License) — Source available, production use requires commercial license
- D) AGPL-3.0 for core + proprietary for enterprise features (dual-license)

**Q2: How should Tallow handle export control classification?**
- A) File BIS notification under TSU exception (like Signal) — Standard for open-source crypto
- B) A + maintain per-country compliance matrix updated quarterly
- C) A + B + legal review before publishing in countries with crypto restrictions (China, Russia)
- D) All of C + implement pluggable crypto to allow compliant builds without restricted algorithms

**Q3: What should Tallow do when served with a lawful intercept order?**
- A) Comply with valid court orders but publish a transparency report annually
- B) Prove mathematically that decryption is impossible (zero-knowledge architecture)
- C) Maintain a warrant canary that goes silent if a secret order is received
- D) All of the above — Legal compliance + mathematical impossibility + canary

**Q4: CLA (Contributor License Agreement) approach?**
- A) Full CLA granting relicensing rights (like Signal's) — Maximum flexibility
- B) DCO (Developer Certificate of Origin) only — Lighter, more contributor-friendly
- C) CLA with open-source guarantee — Relicensing allowed but must remain OSI-approved
- D) No CLA — Rely on the AGPL license itself for all contribution terms

---

## AGENT 10 — KEYSTONE (Cryptographic Architecture)

**Q1: Algorithm agility — how should Tallow support cipher suite negotiation?**
- A) Fixed cipher suite — Everyone uses the same algorithms, no negotiation overhead
- B) Version-based suites — v1 = specific algorithms, v2 = new algorithms, negotiate version
- C) Full negotiation — Client advertises supported algorithms, server selects best mutual
- D) Hybrid: fixed default suite + optional upgrade negotiation for advanced deployments

**Q2: What's the emergency algorithm replacement strategy?**
- A) Patch release disabling the broken algorithm, require immediate update
- B) Protocol-level "algorithm kill switch" — Relays broadcast algorithm deprecation notices
- C) Built-in algorithm priority system — Client skips compromised algorithms automatically
- D) All of the above — Patch + relay broadcast + automatic client skip

**Q3: Post-quantum migration timeline assumption?**
- A) Conservative: Assume CRQC by 2030 — Aggressive PQ migration now
- B) Moderate: Assume CRQC by 2035 — PQ as default, classical as defense-in-depth
- C) Aggressive: Assume CRQC by 2040+ — PQ available but not forced
- D) Threat-model-driven: User selects based on their adversary (nation-state = aggressive, personal = moderate)

**Q4: How should Tallow handle backward compatibility with older versions?**
- A) Strict — Only support current and previous major version
- B) Moderate — Support last 3 versions, warn on older, refuse on ancient
- C) Flexible — Best-effort compatibility with all versions, graceful degradation
- D) Configurable — Enterprise can lock to specific version ranges, personal is flexible

---

# FACTION 02: UNIT 8200 — AGENT QUESTIONS

---

## AGENT 11 — IRON DOME (Red Team Lead)

**Q1: How frequently should red team campaigns run?**
- A) Before every major release — Pre-release security gate
- B) Continuous — Rolling red team operations, findings flow in weekly
- C) Quarterly structured campaigns + continuous automated scanning
- D) Before releases + quarterly deep-dives + annual full-scope engagement

**Q2: What threat model should the red team prioritize?**
- A) Script kiddie → organized crime → nation-state (progressive difficulty)
- B) Nation-state first — Always assume the strongest adversary
- C) Realistic tiered: default users face criminal adversaries, activists/journalists face nation-states
- D) All adversary classes simultaneously — Parallel tracks for different threat levels

**Q3: Red team tooling stack?**
- A) Custom tools only — Nothing off-the-shelf, unique attack capabilities
- B) Industry standard: Burp Suite, Wireshark, custom Rust fuzzers, AFL++
- C) Combination: custom crypto attack tools + industry standard network tools
- D) Open-source only — Ensure all tooling is reproducible and auditable

**Q4: Should red team findings be published?**
- A) Never — Internal only, competitive advantage in secrecy
- B) After remediation — Full disclosure once patched
- C) Redacted summaries — Share methodology without exploit details
- D) Full transparency — Publish complete findings (post-remediation) as trust signal

---

## AGENT 12 — STINGER (Protocol Attack Research)

**Q1: Priority attack class to focus on?**
- A) Downgrade attacks — Forcing weaker algorithm negotiation
- B) Key commitment problems — Ciphertext decrypting to different plaintexts under different keys
- C) PAKE attacks — Offline dictionary attacks against code phrases
- D) All equally weighted — No single attack class is more important

**Q2: Minimum code phrase entropy?**
- A) 4 words from EFF diceware list (~51 bits) — Easy to remember, moderate security
- B) 6 words (~77 bits) — Strong protection against offline brute force
- C) 8 words (~103 bits) — Maximum security for high-value transfers
- D) Configurable: 4 words default, warn below 6, enforce 6+ for `--high-security` mode

**Q3: How should Tallow resist replay attacks?**
- A) Timestamp + nonce in every protocol message
- B) Monotonic sequence numbers + session binding
- C) Challenge-response with fresh randomness at each protocol step
- D) All combined — Timestamps + sequence numbers + challenge-response

**Q4: Protocol state machine validation approach?**
- A) Manual code review of all state transitions
- B) Automatically generated state machine from formal specification
- C) Model checking with TLA+ or Alloy
- D) B + C — Generated from spec AND model-checked for correctness

---

## AGENT 13 — PHANTOM (Network Penetration)

**Q1: Relay infrastructure attack priority?**
- A) TLS configuration weaknesses — Certificate validation, cipher suites, pinning
- B) Resource exhaustion — Connection limits, memory usage, bandwidth saturation
- C) Sybil attacks on onion routing — Operating malicious relay nodes
- D) All simultaneously — Comprehensive network attack surface

**Q2: NAT traversal security assessment focus?**
- A) STUN/TURN server integrity — Can they be spoofed to redirect connections?
- B) Hole-punching timing attacks — Can adversaries predict/manipulate hole-punching?
- C) LAN discovery spoofing — Can attackers impersonate local Tallow peers?
- D) All attack surfaces for every connectivity method

**Q3: DNS security testing approach?**
- A) DNS hijacking resistance only — Can relay addresses be redirected?
- B) Full DNS stack: hijacking + cache poisoning + DNSSEC validation + DoH/DoT bypass
- C) DNS + relay discovery + bootstrap + directory authority consensus
- D) B + test all DNS resolution paths including fallback and emergency bootstrapping

**Q4: Should Tallow implement certificate pinning for relay connections?**
- A) Yes, hard-pin to known relay certificates — Maximum protection, harder to update
- B) Yes, pin to intermediate CA — Allows certificate rotation without client update
- C) TOFU (Trust On First Use) + pinning — Learn on first connection, alert on changes
- D) Pin relay public keys in the protocol, not TLS certificates — Protocol-level security

---

## AGENT 14 — SANDSTORM (Fuzzing & Exploitation)

**Q1: Fuzzing framework priority?**
- A) `cargo-fuzz` (libFuzzer) only — Simple, integrated, effective
- B) `cargo-fuzz` + AFL++ — Complementary strategies for maximum coverage
- C) `cargo-fuzz` + AFL++ + Honggfuzz + `cargo-bolero` (property-based)
- D) All of C + OSS-Fuzz integration for continuous community fuzzing

**Q2: What deserves the most fuzzing attention?**
- A) Protocol message parser — Most exposed to untrusted input
- B) Cryptographic operations — Any bug here is critical
- C) File format handling — Streaming AEAD, chunking, metadata parsing
- D) Weighted by attack surface: protocol parser (40%), file handling (30%), crypto (20%), config (10%)

**Q3: How should Tallow handle `unsafe` Rust code?**
- A) Zero `unsafe` — Pure safe Rust everywhere, accept performance trade-offs
- B) Minimal `unsafe` — Only for hardware acceleration (AES-NI intrinsics, SIMD)
- C) `unsafe` permitted with mandatory safety comments, review, and miri testing
- D) Zero `unsafe` in Tallow's code, `unsafe` only inside audited dependency crates

**Q4: Crash handling in production?**
- A) Panic = process exit + error message — Clean, simple, secure
- B) Panic hook that zeroes key material THEN exits — Security-first crash handling
- C) B + restore terminal state + clear screen before exit
- D) All of C + optional anonymized crash report (stack trace only, no user data)

---

## AGENT 15 — VIPER (Social Engineering & Human Factors)

**Q1: How prominent should the "unverified contact" warning be?**
- A) Subtle icon indicator — Don't alarm casual users
- B) Persistent warning banner until verification is completed
- C) Full-screen warning on first contact that requires explicit "I understand" acknowledgment
- D) Configurable: subtle by default, aggressive warnings when `--high-security` is active

**Q2: Code phrase sharing guidance?**
- A) No guidance — Users figure it out
- B) Brief tooltip: "Share this code through a separate channel (text, call, in-person)"
- C) Step-by-step secure sharing guide shown on first transfer
- D) Active warnings: detect if code phrase appears in clipboard from a messaging app and warn

**Q3: Impersonation protection?**
- A) Display names only — No protection against similar names
- B) Display name + emoji fingerprint always visible together
- C) B + highlight when a new contact's name is similar to an existing verified contact
- D) All of C + phonetic similarity detection ("alice" vs "a1ice" vs "alicee")

**Q4: Anti-phishing measures for Tallow itself?**
- A) Code signing only — Users verify the binary signature
- B) A + official download URLs hardcoded in documentation
- C) All of B + domain monitoring for lookalike domains (tall0w.dev, talllow.dev)
- D) All of C + in-app verification: `tallow verify-install` checks binary against signed manifest

---

## AGENT 16 — MOSSAD (Supply Chain Security)

**Q1: Reproducible build strategy?**
- A) Docker-based build environment with pinned toolchain — Good enough for most
- B) Nix-based hermetic builds — Fully reproducible, bit-for-bit identical
- C) Both Docker AND Nix — Multiple independent reproducible build paths
- D) C + third-party verification: independent builders verify each release matches

**Q2: Dependency management approach?**
- A) Audit all direct dependencies, trust transitive dependencies
- B) Audit ALL dependencies (direct + transitive) with `cargo-vet`
- C) B + lock to exact versions, review every version bump manually
- D) All of C + maintain a vetted fork of all security-critical dependencies

**Q3: Release signing model?**
- A) Single maintainer GPG/Ed25519 signature
- B) Threshold signature (2-of-3 maintainers must sign)
- C) B + timestamped signatures anchored to a transparency log (Sigstore/Rekor)
- D) All of C + deterministic build verification by multiple independent parties

**Q4: How should Tallow handle compromised dependencies?**
- A) `cargo-audit` in CI — Block builds with known CVEs
- B) A + `cargo-deny` — Block specific licenses, sources, and known-bad crates
- C) All of B + daily automated dependency scanning + maintainer alerts
- D) All of C + pre-approved dependency allowlist — No new crate enters without review

---

## AGENT 17 — SABRA (Cross-Platform Attack Surface)

**Q1: What platforms should Tallow support at launch?**
- A) Linux x86_64 only — Focus on one platform, do it perfectly
- B) Linux + macOS (x86_64 + ARM64) — The two major developer platforms
- C) Linux + macOS + Windows (x86_64 + ARM64 for all) — Full desktop coverage
- D) C + FreeBSD + Linux ARM (Raspberry Pi) — Maximum reach

**Q2: Platform keychain integration priority?**
- A) Encrypted file only — Same behavior on all platforms, simplest
- B) Keychain preferred: macOS Keychain, Secret Service (Linux), Credential Manager (Windows)
- C) B + hardware key support (YubiKey/FIDO2) where available
- D) B + C + platform secure enclave (macOS SEP, Windows TPM) for key storage

**Q3: Clipboard security on different platforms?**
- A) Copy to clipboard freely, user manages their own clipboard
- B) Auto-clear clipboard after 30 seconds when sensitive data is copied
- C) B + clipboard history bypass (tell macOS/Windows not to log the entry)
- D) All of C + option to never touch clipboard (`--no-clipboard`)

**Q4: Terminal emulator compatibility priority?**
- A) Common terminals: iTerm2, Terminal.app, GNOME Terminal, Windows Terminal
- B) A + power-user terminals: WezTerm, Kitty, Alacritty, foot
- C) B + legacy: xterm, rxvt, Linux console, screen/tmux
- D) All of C + accessibility: ensure screen readers work with all terminal outputs

---

## AGENT 18 — MASADA (Denial of Service Resistance)

**Q1: Relay connection rate limiting strategy?**
- A) Per-IP connection limits — Simple, effective against naive DoS
- B) Per-IP + proof-of-work puzzle for new connections — Raises cost of attack
- C) B + progressive rate limiting (limits tighten as load increases)
- D) All of C + geographic load balancing + anycast for volumetric DDoS resilience

**Q2: PAKE computational DoS protection?**
- A) Rate limit PAKE attempts per IP (max 10/minute)
- B) A + proof-of-work token required before PAKE exchange begins
- C) B + server-side resource limits (max concurrent PAKE operations)
- D) All of C + client reputation system (verified clients get priority during attacks)

**Q3: How should Tallow handle resource exhaustion attacks on clients?**
- A) Limit concurrent incoming transfer requests (default: 5)
- B) A + limit total pending data (reject new transfers if > 10GB queued)
- C) B + require sender verification/contact status before accepting large transfers
- D) All of C + automatic throttling: reduce accept rate as system resources decrease

**Q4: Relay failover during DDoS?**
- A) Client automatically retries next relay from known list
- B) A + relay publishes real-time health status for client-side load balancing
- C) B + emergency fallback to direct P2P mode (bypass relays entirely)
- D) All of C + CDN-fronted relay endpoints that absorb volumetric attacks

---

## AGENT 19 — KIDON (Zero-Day Research)

**Q1: Code review depth for security-critical modules?**
- A) Line-by-line manual review by a single expert
- B) Two independent reviews (four-eyes principle)
- C) Two reviews + automated analysis (SAST with semgrep/clippy/miri)
- D) All of C + weekly review rotation so fresh eyes examine each module periodically

**Q2: Vulnerability research lab configuration?**
- A) Standard development environment with debug builds
- B) A + sanitizers enabled (ASan, MSan, TSan, UBSan via C FFI boundaries)
- C) B + symbolic execution (KLEE or similar) on critical paths
- D) All of C + custom instrumentation for crypto timing measurement

**Q3: Bug bounty program structure?**
- A) No formal bounty — Accept reports via security@tallow.dev
- B) Structured bounty: Critical $5,000 / High $2,000 / Medium $500 / Low $100
- C) Progressive bounty: increases over time as the product matures and funding grows
- D) B + invite-only program for top researchers with higher payouts

**Q4: Dependency vulnerability monitoring?**
- A) `cargo-audit` weekly — Check for known CVEs
- B) Daily automated `cargo-audit` + RustSec advisory monitoring
- C) B + subscribe to individual dependency repos for real-time security notifications
- D) All of C + maintain private vulnerability database for unpublished findings

---

## AGENT 20 — BERESHEET (Threat Intelligence)

**Q1: Primary threat model for the average Tallow user?**
- A) Passive network observer (ISP, WiFi snooper) — Encryption defeats this
- B) Active MitM attacker (nation-state, corporate network) — PAKE + verification defeats this
- C) Compromised relay operator — Zero-knowledge design defeats this
- D) All of the above simultaneously — Every user faces all three

**Q2: Quantum computing threat timeline assumption?**
- A) CRQC possible by 2028-2030 — Urgent, deploy PQ now
- B) CRQC possible by 2033-2035 — Significant threat, PQ important
- C) CRQC possible by 2040+ — Long-term concern, PQ is forward-looking
- D) Assume "harvest now, decrypt later" is happening TODAY — PQ is already urgent

**Q3: How should Tallow track emerging threats?**
- A) Manual monitoring of security conferences and publications
- B) A + automated keyword monitoring of IACR ePrint, CVE databases, and security feeds
- C) B + dark web monitoring for Tallow-specific exploit discussions
- D) All of C + relationships with CERT teams and vulnerability coordination centers

**Q4: Threat intelligence sharing approach?**
- A) Internal only — Keep all threat data confidential
- B) Share generic threat assessments publicly (quarterly blog posts)
- C) B + participate in ISACs (Information Sharing and Analysis Centers)
- D) All of C + publish Tallow-specific threat indicators for the community

---

# FACTION 03: MSS — AGENT QUESTIONS

---

## AGENT 21 — GREAT WALL (Relay Architecture)

**Q1: Relay implementation technology?**
- A) Pure Rust relay server using `tokio` + `quinn` — Same language as client
- B) Go relay server — Simpler concurrency model, faster development
- C) Rust relay with embedded `arti` (Tor) for built-in onion routing
- D) A + optional Tor bridge mode: Tallow relays can also serve as Tor bridge nodes

**Q2: Relay discovery mechanism?**
- A) Hardcoded relay list compiled into the binary — Simple, censorship-resistant
- B) DNS-based discovery: `_tallow._tcp.relay.tallow.dev` SRV records
- C) Directory authority consensus (Tor-style): 3+ independent authorities, 2/3 majority
- D) Hybrid: hardcoded bootstrap list + DNS discovery + directory consensus + relay gossip

**Q3: Self-hosted relay requirements?**
- A) Single binary: `tallow relay serve` — Zero configuration needed
- B) A + Docker image + Docker Compose + Helm chart for Kubernetes
- C) B + Terraform modules for AWS/GCP/Azure one-click deployment
- D) All of C + relay federation protocol for mesh networking between self-hosted relays

**Q4: Censorship resistance strategy?**
- A) Domain fronting through major CDNs (Cloudflare, AWS CloudFront)
- B) Pluggable transports: obfs4, meek, Snowflake (from Tor ecosystem)
- C) WebSocket relay facade: Tallow traffic looks like regular WebSocket connections
- D) All of the above, selected automatically based on network environment detection

---

## AGENT 22 — SILK ROAD (Transport Protocol)

**Q1: Primary transport protocol?**
- A) QUIC via `quinn` v0.11.9 — Modern, multiplexed, built-in encryption
- B) TCP + TLS 1.3 via `rustls` — Universally supported, simpler
- C) QUIC primary, TCP+TLS fallback — Best of both worlds
- D) QUIC primary, TCP+TLS fallback, raw UDP for LAN transfers — Maximum flexibility

**Q2: Congestion control algorithm?**
- A) CUBIC — Default, well-understood, good for most networks
- B) BBR v2 — Google's algorithm, better for high-bandwidth-delay networks
- C) QUIC default (New Reno) — Conservative, safe choice
- D) Adaptive: BBR for high-latency paths, CUBIC for LAN, configurable

**Q3: Connection migration support?**
- A) No migration — New connection on network change (simple, secure)
- B) QUIC connection migration — Transfers survive WiFi→cellular switches
- C) B + multi-path: stripe data across WiFi AND cellular simultaneously
- D) B only — Multi-path is complex and adds attack surface

**Q4: Maximum concurrent streams per connection?**
- A) 1 stream per file — Simple, predictable
- B) 4 parallel streams — Saturate bandwidth on high-latency links
- C) Unlimited — QUIC handles multiplexing efficiently
- D) Adaptive: 1 for small files, 4 for large files, configurable ceiling

---

## AGENT 23 — DRAGON (P2P & NAT Traversal)

**Q1: NAT traversal stack?**
- A) STUN only — Works for most NATs, no relay dependency
- B) STUN + TURN fallback — Complete connectivity coverage
- C) Full ICE (STUN + TURN + direct + relay candidates) — Industry standard
- D) ICE + UPnP/NAT-PMP + mDNS discovery — Maximum connectivity options

**Q2: LAN discovery protocol?**
- A) mDNS/DNS-SD via `mdns-sd` — Standard, works everywhere
- B) UDP broadcast on subnet — Simple, works without multicast
- C) Both mDNS AND UDP broadcast — Maximum discovery probability
- D) C + Bluetooth Low Energy for nearby device discovery

**Q3: When should Tallow attempt direct P2P vs relay?**
- A) Always try P2P first, fall back to relay — Minimize relay dependency
- B) Always start via relay, upgrade to P2P mid-transfer if possible — Reliable start
- C) Parallel: attempt both simultaneously, use whichever connects first
- D) User choice: `--direct` for P2P-first, `--relay` for relay-first, default is relay-first

**Q4: LAN transfer speed target?**
- A) Saturate gigabit Ethernet (~940 Mbps) — Good enough for most
- B) Saturate 10 GbE (~9.4 Gbps) — Future-proof for prosumer networks
- C) Hardware limited — Tallow should never be the bottleneck
- D) C but with configurable throttling for shared network environments

---

## AGENT 24 — TERRACOTTA (Scalability)

**Q1: Relay server target concurrent connections?**
- A) 1,000 — Small deployment, single relay
- B) 10,000 — Medium deployment, regional relay
- C) 100,000 — Large deployment, global relay
- D) 1,000,000+ — Platform scale, using `io_uring` and kernel bypass

**Q2: Horizontal scaling model?**
- A) Independent stateless relays behind DNS round-robin
- B) A + shared session state via Redis for seamless failover
- C) B + consistent hashing for session affinity
- D) Fully stateless: each relay handles connections independently, no shared state

**Q3: Free tier resource limits?**
- A) No limits on free tier — P2P transfers don't use relay resources
- B) Relay-routed transfers: 5 GB/day, 50 MB/s speed cap
- C) Relay-routed: 10 GB/day, 100 MB/s, max 5 concurrent transfers
- D) Unlimited P2P, relay-routed: generous but capped (configurable per-deployment)

**Q4: Monitoring stack?**
- A) Prometheus + Grafana — Industry standard, excellent dashboards
- B) OpenTelemetry → Prometheus/Grafana — Future-proof, vendor-neutral
- C) B + Jaeger for distributed tracing across relay hops
- D) All of C + PagerDuty/OpsGenie alerting integration

---

## AGENT 25 — JADE (Database & Storage)

**Q1: Client-side local database?**
- A) `rusqlite` v0.32 (SQLite) — Proven, feature-rich, wide ecosystem
- B) `rusqlite` with SQLCipher — Encrypted SQLite, transparent encryption at rest
- C) `sled` — Pure Rust embedded database, no C dependency
- D) B for default, C as compile-time option for fully C-free builds

**Q2: Transfer history retention?**
- A) Keep all history forever — Users decide when to prune
- B) Default 90-day retention, configurable (30 days to unlimited)
- C) Ephemeral by default (no history), opt-in to persistent history
- D) B + automatic encrypted backup of history with key rotation

**Q3: Config file format?**
- A) TOML — Human-readable, Rust ecosystem standard
- B) JSON — Universal, easy to generate programmatically
- C) TOML for human config + `postcard` binary for internal state
- D) TOML primary + JSON import/export for interoperability

**Q4: Relay-side data retention?**
- A) Zero retention — Relays store nothing, pure pass-through
- B) Connection metadata kept 1 hour for abuse prevention, then deleted
- C) B + aggregate bandwidth statistics (no per-user data) retained 30 days
- D) Configurable per-deployment: zero for privacy relays, B+C for managed relays

---

## AGENT 26 — PHOENIX (Fault Tolerance)

**Q1: Transfer resume granularity?**
- A) Full file restart on failure — Simple, no state to manage
- B) Chunk-level resume — Resume from the last successfully received chunk
- C) Byte-level resume — Resume from exact byte position
- D) Chunk-level with integrity verification — Resume from last verified chunk

**Q2: Client crash recovery?**
- A) Clean start on crash — No persistent state between runs
- B) WAL (Write-Ahead Log) for active transfers — Survive clean crashes
- C) B + periodic state snapshots for active transfers (every 10 seconds)
- D) B + C + graceful shutdown handler that saves state on SIGTERM/SIGINT

**Q3: Multi-relay failover?**
- A) Sequential: try next relay from list on failure
- B) A + remember relay latency/reliability for smarter selection
- C) Parallel connection to 2 relays, use the faster one, keep backup warm
- D) B + circuit breaker pattern: temporarily blacklist failing relays

**Q4: What happens when ALL relays are unreachable?**
- A) Error message and exit — User must troubleshoot
- B) Automatic switch to LAN-only mode with local peer discovery
- C) B + queue transfers for retry when connectivity returns (daemon mode)
- D) All of C + display network diagnostic (like `tallow doctor --network`)

---

## AGENT 27 — BAMBOO (Compression)

**Q1: Default compression algorithm?**
- A) `zstd` level 3 — Balanced speed/ratio, excellent for most content
- B) `zstd` level 1 — Fastest with still-good ratios
- C) `lz4` — Maximum speed, lower ratios, best for fast networks
- D) Adaptive: `lz4` for LAN transfers, `zstd` level 3 for relay transfers

**Q2: File type detection for compression decisions?**
- A) Extension-based: skip .zip, .jpg, .mp4, .gz — Simple, fast
- B) Magic bytes detection — Check file headers regardless of extension
- C) B + content sampling — Read first 4KB and test compressibility
- D) All of C — Magic bytes for known types, content sampling for unknowns

**Q3: Compression level for maximum mode (`--compress max`)?**
- A) `zstd` level 19 — High compression, reasonable speed
- B) `zstd` level 22 — Maximum zstd compression
- C) `lzma` level 9 — Absolute maximum ratio, very slow
- D) Auto-select: `zstd 19` for files < 100MB, `zstd 9` for larger (time-bound)

**Q4: Delta/incremental transfer implementation?**
- A) rsync-style rolling checksums — Proven, well-understood
- B) Content-defined chunking (CDC) with BLAKE3 fingerprints — More flexible
- C) `fast-rsync` crate (pure Rust rsync implementation)
- D) B + Rabin fingerprinting for variable-size chunks, BLAKE3 for integrity

---

## AGENT 28 — MANDARIN (Internationalization)

**Q1: Code phrase language support?**
- A) English EFF diceware only — Universal, simplest
- B) English + top 10 languages (Spanish, Chinese, Arabic, Hindi, French, etc.)
- C) Any language — Community-contributed wordlists with entropy validation
- D) B at launch, expand to C over time with community contributions

**Q2: TUI language for interface text?**
- A) English only — Reduce complexity, focus on security
- B) English + community-contributed translations via `fluent` (Mozilla i18n)
- C) English + professionally translated for top 5 languages
- D) B — Community translations, but with professional review for security-sensitive strings

**Q3: Character encoding handling?**
- A) UTF-8 everywhere, reject non-UTF-8 filenames
- B) UTF-8 for wire protocol, platform-native for local filenames
- C) B + lossy conversion with warning for incompatible filenames
- D) B + preserve original encoding bytes, display with replacement characters

**Q4: RTL (Right-to-Left) language support in TUI?**
- A) Not at launch — Complex, handle later
- B) Basic RTL: text direction correct, layout may have issues
- C) Full RTL: mirrored layouts, correct text alignment, bidirectional support
- D) C + thorough testing with native RTL speakers before release

---

## AGENT 29 — QILIN (CI/CD)

**Q1: CI platform?**
- A) GitHub Actions only — Simplest, free for open source
- B) GitHub Actions + self-hosted runners for ARM and FreeBSD
- C) GitHub Actions + Buildkite for reproducible builds + self-hosted for cross-platform
- D) B + Woodpecker CI as backup (self-hosted, open-source) for sovereignty

**Q2: Cross-compilation targets at launch?**
- A) Linux x86_64 + macOS x86_64/ARM64 — Core platforms
- B) A + Windows x86_64 — Full desktop
- C) B + Linux ARM64 + FreeBSD x86_64 — Extended platform support
- D) C + Linux ARM (32-bit, Raspberry Pi) + WASM (web client) — Maximum reach

**Q3: Release cadence?**
- A) Monthly minor releases, patch releases as needed
- B) 6-week cycle (like Firefox/Rust) — Predictable, frequent
- C) Feature-driven: release when significant features are ready
- D) A for stable channel + continuous nightly builds for testing

**Q4: Reproducible build verification?**
- A) Single CI build, publish hashes for manual verification
- B) CI builds + independent builder verification (Nix-based)
- C) B + community verification: anyone can rebuild and verify
- D) All of C + build transparency log (Sigstore) for every release artifact

---

## AGENT 30 — COMPASS (Telemetry & Analytics)

**Q1: Telemetry policy?**
- A) ZERO telemetry, ever — No phone-home, no analytics, no crash reports
- B) Opt-in anonymous usage statistics only (transfer count, OS, Tallow version)
- C) Opt-in with differential privacy — Aggregate stats that can't identify individuals
- D) A as default + opt-in for B/C for users who want to help improve Tallow

**Q2: Crash reporting?**
- A) No crash reports — Users report bugs manually
- B) Opt-in crash reports: anonymized stack trace + OS + version only
- C) Opt-in via `tallow config set crash-reports true`, with clear privacy explanation
- D) Crash dump saved locally, user can choose to submit via `tallow report-crash`

**Q3: Relay operator visibility?**
- A) Zero visibility — Relays see nothing about traffic content
- B) Aggregate bandwidth and connection count only (for capacity planning)
- C) B + error rates and protocol version distribution
- D) B + C but with data aggregated to 1-hour buckets minimum (no per-second granularity)

**Q4: Update checking?**
- A) No automatic check — Manual only: `tallow update check`
- B) Check once per week, show subtle indicator if update available
- C) Check once per day, show indicator, never auto-download
- D) Configurable: `never` / `weekly` / `daily`, default `weekly`, never auto-update

---

# FACTION 04: GCHQ — AGENT QUESTIONS

---

## AGENT 31 — TURING (Protocol Design)

**Q1: Protocol specification format?**
- A) RFC-style document (like TLS 1.3 RFC 8446) — Industry standard, rigorous
- B) Markdown specification in the repository — Accessible, version-controlled
- C) Both A + B — Formal RFC-style + developer-friendly markdown version
- D) A + B + machine-readable protocol description (ASN.1 or Protobuf schema)

**Q2: Protocol versioning scheme?**
- A) Simple integer versions: v1, v2, v3 — Clear, unambiguous
- B) Semantic versioning: 1.0, 1.1, 2.0 — Minor versions for compatible additions
- C) Cipher-suite based: clients negotiate capabilities, no explicit version number
- D) A + capability flags — Version number for protocol structure, flags for optional features

**Q3: Extension mechanism for future features?**
- A) Protocol extensions via TLV (Type-Length-Value) fields — Flexible, backward-compatible
- B) Feature negotiation handshake — Client/server exchange supported features lists
- C) Both TLV extensions AND feature negotiation
- D) Fixed protocol + new versions for new features — Simpler, no negotiation complexity

**Q4: Wire format encoding?**
- A) Custom binary format — Minimum overhead, maximum efficiency
- B) `postcard` (Serde-compatible, `no_std`, compact) — Rust ecosystem, well-tested
- C) Protocol Buffers — Language-agnostic, good tooling, slightly larger
- D) B for Rust clients, C for cross-language SDK compatibility

---

## AGENT 32 — BLETCHLEY (Standards Compliance)

**Q1: FIPS 140-3 certification priority?**
- A) Not a priority — Focus on open-source community users first
- B) Design for FIPS from the start, certify when funding allows
- C) Use FIPS-validated backend (`aws-lc-rs`) behind a feature flag
- D) B + C — FIPS-ready architecture with `aws-lc-rs` backend, certify for enterprise tier

**Q2: Which standards should Tallow conform to?**
- A) FIPS 203/204/205 (PQC) + RFC 7748 (X25519) + RFC 8032 (Ed25519) — Minimum
- B) A + FIPS 197 (AES) + NIST SP 800-38D (GCM) + RFC 5869 (HKDF) + RFC 9106 (Argon2)
- C) All of B + RFC 9497 (OPAQUE) + RFC 9420 (MLS for group features)
- D) All of C + compliance with relevant ISO/IEC 27001 controls

**Q3: Interoperability targets?**
- A) Tallow-to-Tallow only — No cross-protocol compatibility needed
- B) A + export keys in OpenPGP/SSH format for interoperability
- C) B + accept files from magic-wormhole/croc via gateway protocol
- D) A primarily, B as optional feature, C as future roadmap

**Q4: NIST algorithm test vector validation?**
- A) Run NIST KAT (Known Answer Test) vectors in CI
- B) A + ACVP (Automated Cryptographic Validation Protocol) testing
- C) B + compare output against reference implementations
- D) All of C — KAT + ACVP + reference comparison + caveat testing

---

## AGENT 33 — ENIGMA (Security Audit)

**Q1: First external security audit scope?**
- A) Cryptographic protocol only — Most critical, highest impact
- B) Protocol + key management + client-side crypto implementation
- C) Full scope: protocol + crypto + relay + client + TUI + dependencies
- D) B first, then C for the next audit — Phased approach based on budget

**Q2: Audit firm preference?**
- A) Trail of Bits — Strong Rust and crypto expertise
- B) NCC Group — Broad security expertise, large team
- C) Cure53 — Excellent for protocol analysis and web security
- D) Competitive selection: RFP to all three, select based on proposal quality

**Q3: Bug bounty program timing?**
- A) Launch with the first public release
- B) After the first external audit (so known issues are already fixed)
- C) After v1.0 stable release — Product must be mature enough
- D) B — Start after first audit, expand scope and rewards over time

**Q4: Audit result publication?**
- A) Full report published immediately after remediation
- B) Full report with 90-day delay for remediation
- C) Redacted report (remove unpatchable issues) + full report after all fixes
- D) A — Full transparency, immediate publication post-remediation

---

## AGENT 34 — COLOSSUS (Documentation)

**Q1: Documentation platform?**
- A) `mdBook` — Rust ecosystem standard, simple, effective
- B) Docusaurus — React-based, richer features, better search
- C) `mdBook` for developer docs + custom landing page for users
- D) Starlight (Astro-based) — Modern, fast, good DX, great search

**Q2: Security whitepaper depth?**
- A) 10-page overview — Accessible to non-experts
- B) 30-page technical document — Detailed enough for security researchers
- C) Full academic paper — Peer-reviewable, formally structured
- D) B + C — Technical whitepaper for general audience + academic paper for researchers

**Q3: In-TUI help system?**
- A) Static help text per screen — Simple, fast
- B) Contextual help that changes based on current action and state
- C) B + interactive tutorials for first-time users
- D) B + searchable help with `?` overlay + link to online docs

**Q4: Changelog and migration guide approach?**
- A) Standard CHANGELOG.md generated from conventional commits
- B) A + dedicated migration guide for every breaking change
- C) B + version-specific upgrade instructions in the CLI: `tallow upgrade-guide v0.2`
- D) All of C + video walkthroughs for major version upgrades

---

## AGENT 35 — SOVEREIGN (Regulatory Compliance)

**Q1: GDPR compliance architecture?**
- A) Privacy-by-design: minimize data, encrypt everything, no server-side personal data
- B) A + formal DPIA (Data Protection Impact Assessment) published
- C) B + DPA (Data Processing Agreement) template for enterprise customers
- D) All of C + appointed Data Protection Officer for the Tallow organization

**Q2: SOC 2 Type II certification priority?**
- A) Not needed — Tallow is end-to-end encrypted, compliance is inherent
- B) Design for SOC 2 controls from the start, certify when enterprise customers demand it
- C) SOC 2 for the managed relay infrastructure only (not the client)
- D) B + C — Enterprise controls baked in, relay infrastructure certified

**Q3: Data residency / sovereignty support?**
- A) Not at launch — All relays used equally regardless of location
- B) Relay geo-fencing: `--geo eu` ensures data only routes through EU relays
- C) B + configurable per-contact: "always route through EU when sending to alice"
- D) All of C + data residency documentation for each relay region

**Q4: HIPAA/healthcare compliance path?**
- A) Not applicable — Tallow is a file transfer tool, not a healthcare product
- B) BAA (Business Associate Agreement) template available for enterprise tier
- C) B + HIPAA-specific configuration profile that enforces required controls
- D) B + C + documentation mapping Tallow's controls to HIPAA requirements

---

## AGENT 36 — WELLINGTON (API Design)

**Q1: CLI command style?**
- A) Verb-noun: `tallow send`, `tallow receive`, `tallow chat` — Action-oriented
- B) Git-style subcommands: `tallow transfer send`, `tallow identity rotate` — Hierarchical
- C) Flat: `tallow send`, `tallow recv`, `tallow keys` — Minimal typing
- D) A for common actions, B for advanced/admin operations

**Q2: CLI output format options?**
- A) Human-readable only — Focus on terminal users
- B) Human-readable + `--json` flag for scripting
- C) B + `--csv` and `--yaml` output options
- D) B + `--output` flag accepting `human`, `json`, `jsonl` (streaming)

**Q3: REST API authentication for enterprise admin?**
- A) API key with scoped permissions — Simple, effective
- B) OAuth 2.0 / OIDC — Enterprise standard, SSO compatible
- C) Mutual TLS (mTLS) — Certificate-based, no passwords
- D) A for simple deployments, B for SSO environments, C for zero-trust architectures

**Q4: SDK / library naming?**
- A) `libtallow` — Classic C-style library name
- B) `tallow-sdk` — Modern SDK naming
- C) `tallow-core` (Rust) + `tallow-ffi` (C bindings) + `tallow-py` (Python) etc.
- D) C — Clear separation of Rust core, FFI bridge, and language-specific wrappers

---

## AGENT 37 — CROMWELL (Testing)

**Q1: Code coverage requirement?**
- A) 80% line coverage overall — Good baseline
- B) 90% line coverage + 80% branch coverage — High standard
- C) 100% branch coverage for crypto code, 90% line coverage elsewhere
- D) C + mutation testing (cargo-mutants) to verify test quality, not just coverage

**Q2: Integration test infrastructure?**
- A) Docker Compose test network — Multiple relays, simulated NAT
- B) A + network condition simulation (packet loss, latency, bandwidth limits)
- C) B + chaos testing: random process kills, network partitions, disk failures
- D) All of C + cross-platform CI testing on actual macOS/Windows/Linux

**Q3: Compatibility testing matrix?**
- A) Current version → current version only
- B) Current ↔ previous version (N and N-1)
- C) Current ↔ last 3 versions (N through N-3)
- D) B + cross-platform pairs: Linux↔macOS, Linux↔Windows, macOS↔Windows

**Q4: Performance regression testing?**
- A) Manual benchmarks before release
- B) Automated `criterion` benchmarks in CI, fail on > 5% regression
- C) B + end-to-end transfer speed benchmarks on reference hardware
- D) All of C + performance trends dashboard tracking speed over releases

---

## AGENT 38 — BABBAGE (Performance)

**Q1: Target startup time?**
- A) < 500ms — Reasonable for a CLI tool
- B) < 200ms — Snappy, feels instant
- C) < 100ms — On par with native Unix tools
- D) < 50ms for CLI commands, < 200ms for TUI launch — Different targets per mode

**Q2: Target transfer speed vs raw throughput?**
- A) > 50% of raw network speed — Encryption overhead is understandable
- B) > 80% of raw network speed — Competitive with unencrypted tools
- C) > 90% of raw network speed — Negligible crypto overhead
- D) C for AES-NI/AEGIS hardware, B for software-only crypto

**Q3: TUI rendering performance target?**
- A) 30 FPS — Smooth enough for terminal UIs
- B) 60 FPS — Butter-smooth, no perceptible lag
- C) < 16ms draw cycle — Guaranteed 60 FPS with headroom
- D) Adaptive: 60 FPS when interacting, throttle to 10 FPS when idle (save CPU)

**Q4: Memory usage target for large transfers?**
- A) < 50MB regardless of file size — Streaming architecture
- B) < 20MB — Viable on Raspberry Pi and containers
- C) < 10MB — Ultra-lean, suitable for embedded
- D) B as default, C achievable with `--low-memory` flag

---

## AGENT 39 — OXFORD (Academic Liaison)

**Q1: Should Tallow publish academic papers?**
- A) No — Focus on shipping software, not publishing papers
- B) Yes — Submit the protocol design to a security workshop (USENIX, IACR)
- C) B + seek formal peer review of the PQC parameter choices
- D) All of C + establish academic advisory board for ongoing crypto guidance

**Q2: Research collaboration scope?**
- A) None — Keep development independent
- B) Informal: engage with researchers who show interest
- C) Formal partnerships with 1-2 university crypto research groups
- D) C + funded research grants for specific Tallow-related problems

**Q3: How should Tallow contribute back to research?**
- A) Open-source code is contribution enough
- B) A + publish benchmarks and real-world PQC performance data
- C) B + share anonymized network measurement data (transfer sizes, latency distributions)
- D) All of C + maintain a public research bibliography crediting all influences

**Q4: Conference presence?**
- A) Not a priority — Focus development resources on code
- B) Present at 1-2 security conferences per year (DEF CON, CCC)
- C) B + open-source conferences (FOSDEM, All Things Open)
- D) All of C + crypto-specific venues (Real World Crypto, CHES)

---

## AGENT 40 — LANCASTER (Incident Response)

**Q1: Vulnerability disclosure timeline?**
- A) 90 days standard (like Google Project Zero)
- B) 90 days standard, 14-day extension for complex fixes
- C) 60 days — Faster disclosure builds more trust
- D) Coordinated: work with reporter on timeline, default 90 days

**Q2: Severity classification system?**
- A) CVSS score only — Industry standard, objective
- B) Custom severity: Critical / High / Medium / Low + CVSS as supplementary
- C) B + Impact classification: Confidentiality / Integrity / Availability
- D) B + C + affected component tagging: Protocol / Crypto / Client / Relay

**Q3: Post-incident review format?**
- A) Internal-only blameless retrospective
- B) A + public incident report (post-remediation)
- C) B + timeline of events + root cause analysis + prevention measures
- D) All of C published within 30 days of resolution

**Q4: Emergency response SLA?**
- A) Best effort — Small team, no guarantees
- B) P0 (critical security): initial response within 4 hours
- C) P0: 4 hours, P1 (high): 24 hours, P2 (medium): 72 hours
- D) C for community/Pro, custom SLAs for Enterprise customers

---

# FACTION 05: INDEPENDENT CELL — AGENT QUESTIONS

---

## AGENT 41 — CYPHERPUNK (Open Source Strategy)

**Q1: Community platform?**
- A) Discord — Largest reach, most developers already use it
- B) Matrix — Open-source, decentralized, aligns with Tallow's values
- C) Both Discord AND Matrix (bridged) — Maximum reach + values alignment
- D) C + GitHub Discussions for searchable technical questions

**Q2: Contribution model?**
- A) Open to all — Anyone can submit PRs, reviewed by maintainers
- B) A + tiered maintainership: contributor → reviewer → maintainer → core team
- C) B + security-critical code requires core team member approval
- D) All of C + CLA required for all contributions

**Q3: How should Tallow handle the open-source vs commercial tension?**
- A) 100% open source, monetize through support and services only
- B) Open core: full CLI open source, enterprise admin features proprietary
- C) B but with BSL: enterprise features source-available, convert to open after 3 years
- D) B — Clean separation, open core is genuinely complete for individual users

**Q4: Governance model?**
- A) BDFL (Benevolent Dictator For Life) — You as sole decision-maker
- B) Small steering committee (3-5 people) — Shared decision-making
- C) A initially, transition to B as community grows
- D) Technical decisions by maintainers, strategic decisions by BDFL

---

## AGENT 42 — PIXEL (TUI Design)

**Q1: Default color theme?**
- A) Catppuccin Mocha — Popular, beautiful, excellent contrast
- B) Tokyo Night — Developer favorite, purple-blue aesthetic
- C) Custom Tallow theme — Unique brand identity, purple/cyan accent
- D) C + ship with 12 themes, user selects during onboarding

**Q2: TUI layout model?**
- A) Tab-based: single content area with tabs (Transfers, Contacts, Chat, Keys, Settings)
- B) Split-pane: sidebar navigation + main content area
- C) B with collapsible sidebar — Full-screen content when sidebar collapsed
- D) Adaptive: split-pane at ≥120 cols, tab-based at < 120 cols

**Q3: Animation and visual effects approach?**
- A) No animations — Maximum performance, accessibility-safe
- B) Subtle transitions only — Tab switches, progress bar fills
- C) B + micro-animations: toast entrances, completion celebrations, handshake steps
- D) C as default, all animations disableable with `--reduce-motion`

**Q4: Border and box-drawing style?**
- A) Rounded borders — Modern, friendly
- B) Sharp single-line — Clean, professional
- C) Double-line — Bold, distinctive
- D) Configurable: ship rounded as default, user can change in settings

---

## AGENT 43 — SHERPA (UX Research)

**Q1: Target "time to first transfer" for a new user?**
- A) < 60 seconds — Under a minute from install to complete transfer
- B) < 30 seconds — Lightning fast, zero friction
- C) < 2 minutes — Realistic including reading the code phrase
- D) B for sender, C for receiver (receiver needs to install + enter code)

**Q2: Error message philosophy?**
- A) What happened + what to do — Two-part messages
- B) What happened + why + what to do — Three-part messages
- C) B + error code for searchability
- D) All of C + `tallow doctor` suggestion when error seems systemic

**Q3: Onboarding flow?**
- A) Zero onboarding — `tallow send file.txt` works immediately, first run generates keys silently
- B) Minimal: first run shows "Generating your keys..." + one-line explanation
- C) Interactive wizard: name, relay preference, notification settings (3 steps, skippable)
- D) A for CLI mode, C for TUI mode — Different experiences for different users

**Q4: How should Tallow handle technically complex concepts?**
- A) Hide complexity entirely — Users don't need to know about encryption
- B) Surface-level: "Encrypted with post-quantum cryptography" — One line, no detail
- C) Progressive disclosure: simple by default, `--verbose` or `i` key for technical details
- D) C + "Learn more" links to documentation for each concept

---

## AGENT 44 — RUSTACEAN (Rust Architecture)

**Q1: Crate workspace structure?**
- A) Single crate — Simple, fast compilation, easy to navigate
- B) 3 crates: `tallow-core` (protocol + crypto), `tallow-cli`, `tallow-relay`
- C) 5 crates: `tallow-crypto`, `tallow-protocol`, `tallow-transport`, `tallow-cli`, `tallow-tui`
- D) C + `tallow-relay` + `tallow-sdk` — Full separation of concerns

**Q2: Error handling strategy?**
- A) `anyhow` everywhere — Simple, good error messages
- B) `thiserror` for libraries, `anyhow` for application — Standard Rust best practice
- C) B + custom error types with error codes for programmatic handling
- D) C + `color-eyre` for panic handling with terminal state restoration

**Q3: Async runtime?**
- A) `tokio` multi-threaded — Maximum throughput, industry standard
- B) `tokio` single-threaded — Lower resource usage, simpler debugging
- C) `tokio` with `current_thread` for CLI, `multi_thread` for daemon/relay
- D) C — Different runtime configurations for different operational modes

**Q4: Minimum Supported Rust Version (MSRV) policy?**
- A) Latest stable only — Simplest, access to newest features
- B) Stable - 2 (current stable minus 2 releases, ~12 weeks old)
- C) Stable - 4 (~6 months old) — Aligns with Tokio/Quinn MSRV policy
- D) C — Match the ecosystem's MSRV policy for maximum compatibility

---

## AGENT 45 — HERALD (Developer Relations)

**Q1: Developer onboarding priority?**
- A) README + basic docs — Sufficient for experienced Rust developers
- B) A + getting-started tutorial + example projects
- C) B + video walkthroughs + conference talks
- D) All of C + interactive playground (web-based WASM demo)

**Q2: Plugin ecosystem approach?**
- A) No plugins — Keep Tallow focused, avoid complexity
- B) Lua scripting for hooks (pre-send, post-receive) — Lightweight, embeddable
- C) WASM plugins — Sandboxed, language-agnostic, secure
- D) C — WASM plugins with a curated registry and security review process

**Q3: Integration examples priority?**
- A) CI/CD (GitHub Actions, GitLab CI) — Developers' most common automation
- B) A + Slack/Discord bot integration
- C) B + S3/cloud storage backup integration
- D) All of C + Zapier/n8n webhook integrations for no-code users

**Q4: SDK language bindings priority?**
- A) Rust only — Other languages can use the CLI or FFI
- B) Rust + Python (via PyO3) — Covers most developer needs
- C) Rust + Python + Node.js (via napi-rs) + Go (via CGO)
- D) B first, expand to C based on community demand

---

## AGENT 46 — SPECTER (Privacy Engineering)

**Q1: Tor integration approach?**
- A) No built-in Tor — Users can route through external Tor proxy (`--socks5`)
- B) `arti-client` v0.26 embedded — Pure Rust Tor client built into Tallow
- C) B but optional at compile time — `--features tor` to include, reduces binary size
- D) C as default, with runtime flag: `tallow send --tor file.txt`

**Q2: DNS privacy?**
- A) System DNS — Use whatever the OS is configured with
- B) DNS-over-HTTPS (DoH) to Cloudflare/Quad9 — Default encrypted DNS
- C) B + DNS-over-TLS (DoT) fallback + refuse plaintext DNS entirely
- D) C + option to use Tor for DNS resolution when in high-security mode

**Q3: IP address exposure policy?**
- A) P2P connections reveal IPs to each other — Accepted trade-off for speed
- B) A + warn users that P2P reveals IPs, suggest relay for privacy
- C) Relay mode by default — IPs only shared with relay, never with peer
- D) C for default, P2P opt-in with explicit warning about IP exposure

**Q4: Metadata minimization in the protocol?**
- A) Encrypt filenames and sizes in transit — Basic metadata protection
- B) A + pad encrypted metadata to uniform sizes
- C) B + no Tallow version string in protocol messages (prevent fingerprinting)
- D) All of C + randomize protocol timing patterns to prevent protocol fingerprinting

---

## AGENT 47 — FORGE (DevOps)

**Q1: Relay hosting infrastructure?**
- A) Single cloud provider (e.g., Hetzner) — Simple, cost-effective
- B) Multi-cloud: Hetzner + DigitalOcean + Vultr — Redundancy, cost optimization
- C) B + CDN-fronted endpoints (Cloudflare) for DDoS protection
- D) C + independent hosting in privacy-friendly jurisdictions (Switzerland, Iceland, Romania)

**Q2: Infrastructure as Code tool?**
- A) Terraform — Industry standard, multi-cloud
- B) Pulumi — Programmatic (TypeScript/Python), modern
- C) Ansible for configuration + Terraform for provisioning
- D) NixOS for relay servers — Fully reproducible, declarative system configuration

**Q3: Container orchestration?**
- A) Bare metal / VMs — No container overhead, maximum performance
- B) Docker Compose — Simple, sufficient for single-node relays
- C) Kubernetes — Scalable, auto-healing, industry standard
- D) B for small deployments, C for managed relay network at scale

**Q4: TLS certificate management?**
- A) Let's Encrypt via ACME — Free, automated, standard
- B) A + certificate transparency monitoring
- C) B + HSTS + CAA DNS records + OCSP stapling
- D) All of C + certificate pinning in the Tallow client for managed relays

---

## AGENT 48 — MOSAIC (Product Strategy)

**Q1: What should Tallow's v0.1 MVP include?**
- A) Send + receive files with PQ encryption + code phrases — Bare minimum
- B) A + P2P + single relay + basic TUI progress
- C) B + encrypted chat + contact management + multiple relays
- D) A + B only — Ship the smallest useful product, iterate fast

**Q2: Pricing for Pro tier?**
- A) $5/month — Accessible, high volume potential
- B) $8-10/month — Competitive with similar tools
- C) $12/month — Premium positioning, fewer but higher-value customers
- D) $8/month or $80/year (17% annual discount) — Standard SaaS model

**Q3: What differentiates Tallow from every competitor?**
- A) Post-quantum cryptography — No other CLI transfer tool has it
- B) Built-in onion routing — Privacy without external tools
- C) Beautiful TUI — No transfer tool has a polished terminal interface
- D) All three together — The combination is unique, not any single feature

**Q4: When should Tallow target enterprise customers?**
- A) From day one — Enterprise revenue funds development
- B) After v1.0 stable — Product must be mature and audited first
- C) After the first security audit + SOC 2 readiness
- D) B + C — Stable product + audit + compliance documentation before enterprise push

---

## AGENT 49 — LIGHTHOUSE (Accessibility)

**Q1: Accessibility standard to target?**
- A) Best effort — No formal standard, just good practices
- B) WCAG 2.1 AA equivalent (adapted for terminal) — High standard
- C) B + terminal screen reader testing (NVDA, VoiceOver)
- D) All of C + cognitive accessibility guidelines (plain language, consistent behavior)

**Q2: Color and visual accessibility?**
- A) High contrast themes available as option
- B) A + color never as sole indicator (always icon/text alongside color)
- C) B + automated contrast ratio checking for all themes in CI
- D) All of C + colorblind simulation testing (deuteranopia, protanopia, tritanopia)

**Q3: Keyboard navigation requirements?**
- A) All features reachable by keyboard (no mouse-only interactions)
- B) A + visible focus indicators on all interactive elements
- C) B + logical tab order + skip-navigation shortcuts
- D) All of C + Vim-style keybindings as optional alternative navigation

**Q4: Minimum terminal size support?**
- A) 80×24 — Classic standard terminal size
- B) 60×20 — Supports smaller panes in tmux/screen
- C) 40×10 — Extreme minimum, degraded but functional
- D) A as recommended, B as minimum, graceful error below B

---

## AGENT 50 — ARCHITECT (System Integration)

**Q1: Master architecture documentation format?**
- A) Single comprehensive markdown document in the repo
- B) `arc42` template — Structured architecture documentation standard
- C) C4 model diagrams + written documentation — Visual + textual
- D) B + C — arc42 structure with C4 diagrams at each level

**Q2: Cross-faction integration review cadence?**
- A) Before every release
- B) Bi-weekly standing meeting + before every release
- C) Weekly async review + bi-weekly sync meeting + release gate
- D) B — Bi-weekly is sufficient without creating meeting fatigue

**Q3: Decision record format?**
- A) ADR (Architecture Decision Records) in the repository — Standard, version-controlled
- B) RFC (Request for Comments) process — Community input before decisions
- C) Both ADR + RFC: RFC for proposals, ADR for decisions
- D) C — RFCs gather community input, ADRs record the final decision and rationale

**Q4: Release readiness criteria?**
- A) All tests pass + no critical bugs — Minimum viable
- B) A + security review signed off + documentation updated
- C) B + performance benchmarks within tolerance + compatibility tests pass
- D) All of C + at least one cross-faction integration review completed

---

# END OF QUESTIONNAIRE

> **Instructions:** Answer A, B, C, or D for each question (200 questions total across 50 agents).
> Your answers will be used to generate updated, customized profiles for all 50 agents with:
> - Specific tools, libraries, and versions locked in
> - Clear decision authority and priorities
> - Concrete artifact specifications
> - Inter-agent dependencies mapped

---

*PROJECT CANDLEWICK — Agent Configuration Questionnaire v1.0*
*February 2026*
