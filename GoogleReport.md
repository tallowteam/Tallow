\# TALLOW MASTER CONSOLIDATION CHECKLIST DOCUMENT

\*\*Classification:\*\* TOP SECRET // TALLOW // NOFORN // ORCON

\*\*Version:\*\* 3.0.0-CONSOLIDATED

\*\*Date:\*\* February 2026



---



\## \*\*MASTER TABLE OF CONTENTS\*\*



\*\*1.0 TIER 0 — THE DIRECTORATE (STRATEGIC COMMAND)\*\*

> 1.1 Agent 001 — RAMSAD (Director-General)

> 1.2 Agent 002 — CIPHER (Cryptographic Operations)

> 1.3 Agent 003 — SPECTRE (Platform Engineering)

> 1.4 Agent 004 — ARCHITECT (Human Intelligence/UX)



\*\*2.0 DIVISION ALPHA — SIGINT (CRYPTOGRAPHY \& SECURITY)\*\*

> 2.1 Key Exchange \& Ratcheting (Agents 006, 007)

> 2.2 Encryption \& Integrity (Agents 008, 009)

> 2.3 Authentication \& Verification (Agents 010, 011, 012, 018)

> 2.4 Privacy \& Obfuscation (Agents 014, 015, 016)

> 2.5 Security Engineering \& Audit (Agents 013, 017, 019)



\*\*3.0 DIVISION BRAVO — NETOPS (NETWORK OPERATIONS)\*\*

> 3.1 Transport \& Connectivity (Agents 021, 025, 027)

> 3.2 Traversal \& Signaling (Agents 022, 023, 024, 028)

> 3.3 Discovery \& Synchronization (Agents 026, 029)



\*\*4.0 DIVISION CHARLIE — VISINT (VISUAL INTELLIGENCE)\*\*

> 4.1 Foundations \& Tokens (Agents 031, 034, 038)

> 4.2 Components \& Patterns (Agents 032, 033, 035, 036, 037, 039, 040, 041, 042)



\*\*5.0 DIVISION DELTA — UX-OPS (USER EXPERIENCE)\*\*

> 5.1 Flows \& Onboarding (Agents 044, 045)

> 5.2 Content \& Trust (Agents 046, 047, 048)

> 5.3 Responsive Design (Agent 049)



\*\*6.0 DIVISION ECHO — FRONTEND ARCHITECTURE\*\*

> 6.1 Core Architecture \& State (Agents 051, 052)

> 6.2 Code Quality \& Performance (Agents 053, 054, 055, 059)

> 6.3 Accessibility \& Internationalization (Agents 056, 057)

> 6.4 Data Visualization (Agent 058)



\*\*7.0 DIVISION FOXTROT — PLATFORM OPERATIONS\*\*

> 7.1 Web \& Browser (Agents 066, 067)

> 7.2 Native Mobile \& Desktop (Agents 061, 062, 063, 064, 068)

> 7.3 CLI \& Tooling (Agent 065)

> 7.4 Platform Features (Agents 069, 070, 071, 072, 073, 074)



\*\*8.0 DIVISION GOLF — QUALITY ASSURANCE\*\*

> 8.1 Testing Infrastructure (Agents 076, 077, 080)

> 8.2 Security \& Performance Testing (Agents 078, 079, 081, 083, 084)

> 8.3 Compatibility \& Compliance (Agents 082, 085)



\*\*9.0 DIVISION HOTEL — OPERATIONS \& INTELLIGENCE\*\*

> 9.1 Infrastructure \& CI/CD (Agents 087, 088, 089)

> 9.2 Observability \& Incident Response (Agents 090, 096)

> 9.3 Product Growth \& Documentation (Agents 091, 092, 093, 094)

> 9.4 Privacy \& Analytics (Agent 095)

> 9.5 Extended Features \& Automation (Agents 097, 098, 099)

> 9.6 Build Orchestration (Agent 100)



\*\*10.0 IMPLEMENTATION STATUS \& AUDIT FINDINGS\*\*

> 10.1 Audit Synthesis \& Risk Matrix

> 10.2 Copy \& Content Audit

> 10.3 Web Worker Audit



\*\*11.0 APPENDIX\*\*

> 11.1 Source Mapping

> 11.2 Glossary



---



\## \*\*1.0 TIER 0 — THE DIRECTORATE (STRATEGIC COMMAND)\*\*



\*\*Section Summary:\*\* This section covers the supreme authority agents (001-004) responsible for strategic coherence, architectural decisions, and final release sign-offs across all divisions.



\### \*\*1.1 Agent 001 — RAMSAD (Director-General)\*\*

\*\*Mission:\*\* Single point of strategic coherence. Maintains the "mental model" of the entire 106K+ LOC system.

\*\*Authority:\*\* Read access to every file; write authority over any file for overrides.



\*   \*\*Strategic Responsibilities\*\*

&nbsp;   \*   ☐ Maintain `CLAUDE.md` (Constitutional document).

&nbsp;   \*   ☐ Maintain the V3 Checklist (Master feature list).

&nbsp;   \*   ☐ Maintain the 20-week security roadmap.

&nbsp;   \*   ☐ Approve or reject Architecture Decision Records (ADRs).

&nbsp;   \*   ☐ Reassign, expand, or constrain agent scopes based on performance reviews.

\*   \*\*Operational Deliverables\*\*

&nbsp;   \*   ☐ \*\*Release Sign-off:\*\* Written approval per release with conditions.

&nbsp;   \*   ☐ \*\*Architectural Directives:\*\* Numbered directives to Deputy Directors (as needed).

&nbsp;   \*   ☐ \*\*Conflict Resolution:\*\* Decision documents for cross-division conflicts.

&nbsp;   \*   ☐ \*\*Feature Prioritization:\*\* Weekly updates to V3 checklist priorities.

&nbsp;   \*   ☐ \*\*Risk Register:\*\* Monthly updated project risk assessment.

\*   \*\*Operational Rules\*\*

&nbsp;   \*   ☐ RAMSAD directives override Division Chiefs.

&nbsp;   \*   ☐ RAMSAD \*cannot\* override Agent 002 (CIPHER) security vetoes.

&nbsp;   \*   ☐ RAMSAD \*cannot\* override Agent 019 (CRYPTO-AUDITOR) release vetoes.

&nbsp;   \*   ☐ Never ship insecure code regardless of schedule.

&nbsp;   \*   ☐ Never compromise on privacy (Zero-Knowledge is non-negotiable).



\### \*\*1.2 Agent 002 — CIPHER (Deputy Director — Cryptographic Operations)\*\*

\*\*Mission:\*\* Owns the entire cryptographic stack and policy.

\*\*Reporting:\*\* Reports to RAMSAD (001).



\*   \*\*Cryptographic Doctrine (Immutable)\*\*

&nbsp;   \*   ☐ \*\*Encryption:\*\* ML-KEM-768 + X25519 hybrid key exchange.

&nbsp;   \*   ☐ \*\*Symmetric Cipher:\*\* AES-256-GCM (primary), ChaCha20-Poly1305 (fallback), AEGIS-256 (AES-NI hardware accel).

&nbsp;   \*   ☐ \*\*Hash Function:\*\* BLAKE3 (primary), SHA3-256 (fallback).

&nbsp;   \*   ☐ \*\*Key Derivation:\*\* HKDF-BLAKE3 with mandatory domain separation strings.

&nbsp;   \*   ☐ \*\*Password Hashing:\*\* Argon2id (3 iterations, 64MB memory, 4 parallel lanes).

&nbsp;   \*   ☐ \*\*Signatures:\*\* Ed25519 (classical), ML-DSA-65 (FIPS 204 PQ), SLH-DSA (FIPS 205 stateless backup).

&nbsp;   \*   ☐ \*\*Ratchet:\*\* Triple Ratchet (DH + symmetric + sparse PQ).

&nbsp;   \*   ☐ \*\*Nonce:\*\* 96-bit, counter-based, NEVER reused.

\*   \*\*Deliverables\*\*

&nbsp;   \*   ☐ \*\*Cryptographic Policy Document:\*\* Master spec of algorithms/parameters.

&nbsp;   \*   ☐ \*\*Algorithm Approvals:\*\* Written approval for new algo/parameter changes.

&nbsp;   \*   ☐ \*\*Security Review Sign-offs:\*\* Per-release verification.

&nbsp;   \*   ☐ \*\*Vulnerability Assessments:\*\* Analysis of new disclosures.

&nbsp;   \*   ☐ \*\*FIPS Compliance Reports:\*\* Verification against FIPS 203/204/205.

&nbsp;   \*   ☐ \*\*Key Lifecycle Diagrams:\*\* Generation, use, rotation, destruction documentation.

&nbsp;   \*   ☐ \*\*Threat Model Updates:\*\* Quarterly updates.



\### \*\*1.3 Agent 003 — SPECTRE (Deputy Director — Platform Engineering)\*\*

\*\*Mission:\*\* Controls NETOPS (Agents 020-029) and PLATFORM (Agents 060-074) divisions.

\*\*Reporting:\*\* Reports to RAMSAD (001).



\*   \*\*Infrastructure Authority\*\*

&nbsp;   \*   ☐ `next.config.ts`: Framework config, Turbopack, WASM.

&nbsp;   \*   ☐ `tallow-relay/`: Go relay server.

&nbsp;   \*   ☐ Docker configuration: `Dockerfile`, `Dockerfile.signaling`, `docker-compose.yml`.

&nbsp;   \*   ☐ CI/CD Pipelines: `.github/workflows/`.

\*   \*\*Technical Directives\*\*

&nbsp;   \*   ☐ \*\*Turbopack/Zustand Constraint:\*\* All Zustand store access must go through plain TypeScript modules (`lib/\*/store-actions.ts`), \*never\* directly in hooks/components to prevent infinite render loops.

&nbsp;   \*   ☐ \*\*Transport Fallback Chain:\*\* QUIC → WebTransport → WebRTC DataChannel → Go Relay.

&nbsp;   \*   ☐ \*\*Platform Parity Matrix:\*\* Maintain feature matrix across Web/iOS/Android/macOS/Windows/Linux/CLI.

&nbsp;   \*   ☐ \*\*Connection Quality:\*\* Design bandwidth estimation feeding adaptive chunk sizing (16KB to 256KB).

\*   \*\*Deliverables\*\*

&nbsp;   \*   ☐ Platform Parity Matrix.

&nbsp;   \*   ☐ Infrastructure Architecture Docs.

&nbsp;   \*   ☐ Transport Performance Reports.

&nbsp;   \*   ☐ Deployment Runbooks.



\### \*\*1.4 Agent 004 — ARCHITECT (Deputy Director — Human Intelligence)\*\*

\*\*Mission:\*\* Controls VISINT (Agents 030-042), UX-OPS (Agents 043-049), and FRONTEND (Agents 050-059).

\*\*Reporting:\*\* Reports to RAMSAD (001).



\*   \*\*Design System Definition\*\*

&nbsp;   \*   ☐ \*\*Palette:\*\* Backgrounds (`#030306`, `#08080e`), Text (`#f2f2f8`, `#a8a8bc`), Accent (`#6366f1`), Glass (`rgba(12, 12, 22, 0.55)`).

&nbsp;   \*   ☐ \*\*Typography:\*\* Playfair Display (300w, headings), Inter (body), JetBrains Mono (code). Fluid sizing with `clamp()`.

&nbsp;   \*   ☐ \*\*Motion:\*\* CSS scroll-driven animations, cubic-bezier(0.16, 1, 0.3, 1).

&nbsp;   \*   ☐ \*\*Aesthetic:\*\* "Magazine Aesthetic" (Dark layout, serif headings, premium feel).

\*   \*\*UX Architecture\*\*

&nbsp;   \*   ☐ \*\*3-Mode Transfer:\*\* Local Network / Internet P2P / Friends.

&nbsp;   \*   ☐ \*\*Glass App Hero:\*\* 3D-perspective glass window on landing page.

&nbsp;   \*   ☐ \*\*Security Indicators:\*\* "Security as Feeling" (Green dots, indigo badges, non-threatening icons).

\*   \*\*Deliverables\*\*

&nbsp;   \*   ☐ Design System Specification.

&nbsp;   \*   ☐ Page Designs (Visual specs for 10+ pages).

&nbsp;   \*   ☐ Component Library (Approved designs).

&nbsp;   \*   ☐ Animation Choreography specs.

&nbsp;   \*   ☐ UX Flow Diagrams (Send/Receive/Connect/Settings).

&nbsp;   \*   ☐ Accessibility Audit (WCAG 2.1 AA).



---



\## \*\*2.0 DIVISION ALPHA — SIGINT (CRYPTOGRAPHY \& SECURITY)\*\*



\*\*Section Summary:\*\* Led by Agent 005 (DC-ALPHA), this division executes the cryptographic policy. It handles key exchange, encryption, integrity, privacy routing, and adversarial testing.



\### \*\*2.1 Key Exchange \& Ratcheting\*\*



\#### \*\*Agent 006 — PQC-KEYSMITH (Post-Quantum Key Exchange)\*\*

\*   \*\*Scope:\*\* `lib/crypto/pqc-crypto.ts`, `lib/crypto/key-management.ts`, `lib/crypto/nonce-manager.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Hybrid Exchange:\*\* Implement ML-KEM-768 (FIPS 203) + X25519.

&nbsp;   \*   ☐ \*\*Derivation:\*\* Concatenate shared secrets -> HKDF-BLAKE3 with domain `tallow-v3-hybrid-kex`.

&nbsp;   \*   ☐ \*\*Generators:\*\* Use CSPRNG (`crypto.getRandomValues`) for all keypairs.

&nbsp;   \*   ☐ \*\*Lifecycle:\*\* Ensure keys are zeroed immediately after use (via Agent 017).

\*   \*\*Deliverables:\*\*

&nbsp;   \*   ☐ `generateHybridKeypair()` implementation.

&nbsp;   \*   ☐ `encapsulate()` / `decapsulate()` implementation.

&nbsp;   \*   ☐ `deriveSessionKeys()` implementation.

\*   \*\*Dependencies:\*\*

&nbsp;   \*   Upstream: Agent 013 (Timing), Agent 017 (Memory), Agent 009 (Hash).

&nbsp;   \*   Downstream: Agent 007 (Ratchet), Agent 008 (Symmetric), Agent 023 (Signal).



\#### \*\*Agent 007 — RATCHET-MASTER (Triple Ratchet Protocol)\*\*

\*   \*\*Scope:\*\* `lib/crypto/triple-ratchet.ts`, `lib/crypto/sparse-pq-ratchet.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Triple Ratchet:\*\* Implement DH + Symmetric + Sparse PQ ratchet.

&nbsp;   \*   ☐ \*\*Forward Secrecy:\*\* Destroy old keys immediately.

&nbsp;   \*   ☐ \*\*Self-Healing:\*\* Ensure compromise heals after one DH round-trip.

&nbsp;   \*   ☐ \*\*PQ Injection:\*\* Inject ML-KEM-768 encapsulation every 100 messages (Sparse PQ).

&nbsp;   \*   ☐ \*\*Out-of-Order:\*\* Handle up to 1000 skipped messages (store keys, wipe after TTL).

&nbsp;   \*   ☐ \*\*State Persistence:\*\* Encrypt ratchet state at rest (AES-256-GCM).

\*   \*\*Deliverables:\*\*

&nbsp;   \*   ☐ `initializeTripleRatchet()`, `encryptMessage()`, `decryptMessage()`, `stepRatchet()`.

&nbsp;   \*   ☐ Break-in recovery test proofs.



\### \*\*2.2 Encryption \& Integrity\*\*



\#### \*\*Agent 008 — SYMMETRIC-SENTINEL (Symmetric Encryption)\*\*

\*   \*\*Scope:\*\* `lib/crypto/file-encryption-pqc.ts`, `lib/crypto/chacha20-poly1305.ts`, `lib/crypto/aegis256.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Cipher Selection:\*\* Auto-detect hardware. AEGIS-256 (AES-NI) > AES-256-GCM > ChaCha20-Poly1305.

&nbsp;   \*   ☐ \*\*Nonce Management:\*\* 96-bit counter-based nonces. Track direction (0x00 sender, 0x01 receiver). NEVER reuse nonces.

&nbsp;   \*   ☐ \*\*Authenticated Encryption:\*\* Verify auth tag \*BEFORE\* decryption.

&nbsp;   \*   ☐ \*\*Throughput Targets:\*\* >500MB/s desktop, >50MB/s mobile.

\*   \*\*Deliverables:\*\*

&nbsp;   \*   ☐ Chunk encryption pipeline (compress -> encrypt).

&nbsp;   \*   ☐ NIST test vectors passing for AES/ChaCha.



\#### \*\*Agent 009 — HASH-ORACLE (Hashing \& Integrity)\*\*

\*   \*\*Scope:\*\* `lib/crypto/blake3.ts`, `lib/crypto/sha3.ts`, `lib/crypto/integrity.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*BLAKE3:\*\* Primary hash for streaming, chunks, and KDF. Target >1GB/s (WASM).

&nbsp;   \*   ☐ \*\*SHA3-256:\*\* Fallback hash.

&nbsp;   \*   ☐ \*\*Merkle Tree:\*\* Build tree from chunk hashes for full file verification.

&nbsp;   \*   ☐ \*\*Domain Separation:\*\* Enforce unique info strings for HKDF (e.g., `tallow-v3-chain-key`).

&nbsp;   \*   ☐ \*\*Streaming:\*\* Process chunks without buffering entire file.

\*   \*\*Deliverables:\*\*

&nbsp;   \*   ☐ Domain separation registry.

&nbsp;   \*   ☐ BLAKE3 reference test compliance.



\### \*\*2.3 Authentication \& Verification\*\*



\#### \*\*Agent 010 — PASSWORD-FORTRESS (Password \& PAKE)\*\*

\*   \*\*Scope:\*\* `lib/crypto/password.ts`, `lib/crypto/pake.ts`, `lib/crypto/argon2-browser.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Argon2id:\*\* 3 iterations, 64MB memory, 4 parallelism.

&nbsp;   \*   ☐ \*\*PAKE (CLI):\*\* CPace protocol for symmetric password auth.

&nbsp;   \*   ☐ \*\*OPAQUE (Web):\*\* Asymmetric PAKE for web login.

&nbsp;   \*   ☐ \*\*Salt:\*\* 16+ bytes CSPRNG.

\*   \*\*Deliverables:\*\*

&nbsp;   \*   ☐ Password-based file encryption module.

&nbsp;   \*   ☐ Secure password clearing from memory.



\#### \*\*Agent 011 — SIGNATURE-AUTHORITY (Digital Signatures)\*\*

\*   \*\*Scope:\*\* `lib/crypto/digital-signatures.ts`, `lib/crypto/signed-prekeys.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Ed25519:\*\* Primary identity binding.

&nbsp;   \*   ☐ \*\*ML-DSA-65:\*\* FIPS 204 PQ signing.

&nbsp;   \*   ☐ \*\*SLH-DSA:\*\* FIPS 205 stateless backup.

&nbsp;   \*   ☐ \*\*Prekeys:\*\* Sign all prekeys. Rotate every 7 days. Revoke old keys.

\*   \*\*Deliverables:\*\*

&nbsp;   \*   ☐ Prekey bundle generation and verification logic.



\#### \*\*Agent 012 — SAS-VERIFIER (Short Authentication String)\*\*

\*   \*\*Scope:\*\* `lib/crypto/sas.ts`, `components/transfer/SASModal.tsx`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Derivation:\*\* `sas = BLAKE3(sharedSecret || "tallow-v3-sas")\[:6]`.

&nbsp;   \*   ☐ \*\*Emoji Mapping:\*\* Map bytes to 64 distinct, culturally neutral emojis.

&nbsp;   \*   ☐ \*\*Word Mapping:\*\* Map to 256 phonetically distinct words.

&nbsp;   \*   ☐ \*\*QR Fallback:\*\* Encode SAS for camera verification.

&nbsp;   \*   ☐ \*\*Mismatch:\*\* Immediate connection termination + warning on mismatch.

\*   \*\*Deliverables:\*\*

&nbsp;   \*   ☐ SAS generation module.

&nbsp;   \*   ☐ Verification UI modal.



\#### \*\*Agent 018 — WEBAUTHN-GATEKEEPER (Biometric Auth)\*\*

\*   \*\*Scope:\*\* `lib/security/webauthn.ts`, `lib/security/biometric.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*WebAuthn/FIDO2:\*\* Registration and authentication.

&nbsp;   \*   ☐ \*\*Constraint:\*\* Biometric is optional 2nd factor, NEVER sole auth.

&nbsp;   \*   ☐ \*\*HSM:\*\* Integration for enterprise key storage.

&nbsp;   \*   ☐ \*\*Attestation:\*\* Verify authenticator provenance.



\### \*\*2.4 Privacy \& Obfuscation\*\*



\#### \*\*Agent 014 — TRAFFIC-GHOST (Traffic Analysis Resistance)\*\*

\*   \*\*Scope:\*\* `lib/privacy/traffic-shaping.ts`, `lib/transport/obfuscation.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Padding:\*\* Pad all packets to uniform sizes.

&nbsp;   \*   ☐ \*\*Jitter:\*\* Randomize inter-packet timing (±30% variance).

&nbsp;   \*   ☐ \*\*Decoys:\*\* Inject dummy encrypted traffic to fill gaps.

&nbsp;   \*   ☐ \*\*Bitrate:\*\* Shape traffic to target constant bitrate.

\*   \*\*Deliverables:\*\*

&nbsp;   \*   ☐ Constant-rate packet transmission implementation.

&nbsp;   \*   ☐ Privacy mode toggle configuration.



\#### \*\*Agent 015 — ONION-WEAVER (Onion Routing)\*\*

\*   \*\*Scope:\*\* `lib/privacy/onion-routing.ts`, `lib/privacy/tor.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Native Onion:\*\* 1-3 hop relay routing.

&nbsp;   \*   ☐ \*\*Tor Integration:\*\* SOCKS5 proxy integration (localhost:9050).

&nbsp;   \*   ☐ \*\*WebRTC Disable:\*\* Force transfer through Tor relay in privacy mode (WebRTC leaks IP).

&nbsp;   \*   ☐ \*\*Circuit Rotation:\*\* Rotate circuits every 10 minutes.

\*   \*\*Deliverables:\*\*

&nbsp;   \*   ☐ Multi-hop encryption layering.

&nbsp;   \*   ☐ Relay node selection algorithm (geo-distributed).



\#### \*\*Agent 016 — METADATA-ERASER (Metadata Sanitization)\*\*

\*   \*\*Scope:\*\* `lib/privacy/metadata-strip.ts`, `lib/privacy/metadata-stripper.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Images:\*\* Strip EXIF, XMP, IPTC, thumbnails (JPEG, PNG, WebP).

&nbsp;   \*   ☐ \*\*Documents:\*\* Strip author, company, history (PDF, DOCX, XLSX).

&nbsp;   \*   ☐ \*\*Filename:\*\* Encrypt original name; transmit as random UUID.

&nbsp;   \*   ☐ \*\*Size:\*\* Pad to nearest power-of-2 (or 10MB/100MB chunks) to hide exact size.

&nbsp;   \*   ☐ \*\*Timestamps:\*\* Set to epoch (1970-01-01) or strip.

\*   \*\*Deliverables:\*\*

&nbsp;   \*   ☐ Format-specific strippers.

&nbsp;   \*   ☐ Receiver-side filename decryption.



\### \*\*2.5 Security Engineering \& Audit\*\*



\#### \*\*Agent 013 — TIMING-PHANTOM (Side-Channel Protection)\*\*

\*   \*\*Scope:\*\* `lib/crypto/constant-time.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Comparison:\*\* Implement `constantTimeCompare(a, b)`.

&nbsp;   \*   ☐ \*\*Conditionals:\*\* Implement branch-free `constantTimeSelect`.

&nbsp;   \*   ☐ \*\*Audit:\*\* Review all crypto code for secret-dependent branching/indexing.

&nbsp;   \*   ☐ \*\*WASM:\*\* Document cache-timing risks and mitigations.



\#### \*\*Agent 017 — MEMORY-WARDEN (Secure Memory)\*\*

\*   \*\*Scope:\*\* `lib/security/secure-memory.ts`, `lib/security/storage.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Zeroing:\*\* Wipe key material immediately after use (`TypedArray.fill(0)`).

&nbsp;   \*   ☐ \*\*Storage:\*\* Wrapper for encrypted IndexedDB (`SecureStorage`).

&nbsp;   \*   ☐ \*\*Lifecycle:\*\* Use `FinalizationRegistry` and `WeakRef` for fail-safe cleanup.

&nbsp;   \*   ☐ \*\*Constraint:\*\* NO secrets in Redux/Zustand stores.

\*   \*\*Deliverables:\*\*

&nbsp;   \*   ☐ `SecretValue` wrapper class.

&nbsp;   \*   ☐ Memory audit tools (heap snapshots).



\#### \*\*Agent 019 — CRYPTO-AUDITOR (Red Team)\*\*

\*   \*\*Mission:\*\* Adversarial testing and release veto. Reports to CIPHER (002).

\*   \*\*Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Release Veto:\*\* Must sign off on every release.

&nbsp;   \*   ☐ \*\*KAT Vectors:\*\* Verify all primitives against NIST Known-Answer Tests.

&nbsp;   \*   ☐ \*\*Fuzzing:\*\* Run fuzzers against crypto inputs (libFuzzer).

&nbsp;   \*   ☐ \*\*Entropy Analysis:\*\* Check FIPS 800-90B compliance.

&nbsp;   \*   ☐ \*\*Downgrade:\*\* Attempt to force weak crypto negotiation.



---



\## \*\*3.0 DIVISION BRAVO — NETOPS (NETWORK OPERATIONS)\*\*



\*\*Section Summary:\*\* Led by Agent 020 (DC-BRAVO), this division manages the transport backbone. From discovery to signaling to data transfer, it ensures packets move securely and efficiently.



\### \*\*3.1 Transport \& Connectivity\*\*



\#### \*\*Agent 021 — WEBRTC-CONDUIT (DataChannel Optimization)\*\*

\*   \*\*Scope:\*\* `lib/webrtc/`, `lib/transport/webrtc-channel.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Throughput:\*\* Target >100MB/s (LAN), >10MB/s (WAN).

&nbsp;   \*   ☐ \*\*Chunking:\*\* Adaptive chunk sizing based on backpressure/buffer (16KB to 256KB).

&nbsp;   \*   ☐ \*\*Config:\*\* Ordered vs Unordered delivery tuning.

\*   \*\*Deliverables:\*\*

&nbsp;   \*   ☐ Backpressure handling logic (never overflow buffer).



\#### \*\*Agent 025 — TRANSPORT-ENGINEER (Advanced Protocols)\*\*

\*   \*\*Scope:\*\* `lib/transport/`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Fallback Chain:\*\* QUIC (HTTP/3) → WebTransport → WebRTC → Relay.

&nbsp;   \*   ☐ \*\*QUIC:\*\* 0-RTT setup, BBR congestion control.

&nbsp;   \*   ☐ \*\*MPTCP:\*\* Use WiFi + Cellular simultaneously on mobile.

&nbsp;   \*   ☐ \*\*FEC:\*\* Reed-Solomon for lossy networks.

\*   \*\*Deliverables:\*\*

&nbsp;   \*   ☐ Unified Transport API abstraction.



\#### \*\*Agent 027 — BANDWIDTH-ANALYST (Connection Quality)\*\*

\*   \*\*Scope:\*\* `lib/network/network-quality.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Metrics:\*\* Measure RTT, packet loss, jitter, throughput.

&nbsp;   \*   ☐ \*\*Feedback:\*\* Provide real-time "Quality Indicator" (Excellent/Good/Fair/Poor).

&nbsp;   \*   ☐ \*\*Adaptation:\*\* Feed metrics to Transport/WebRTC agents for tuning.



\### \*\*3.2 Traversal \& Signaling\*\*



\#### \*\*Agent 022 — ICE-BREAKER (NAT Traversal)\*\*

\*   \*\*Scope:\*\* `lib/webrtc/ice.ts`, `lib/webrtc/nat-detection.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*NAT Detection:\*\* Detect Open vs Symmetric NAT before connecting.

&nbsp;   \*   ☐ \*\*Strategy:\*\*

&nbsp;       \*   Symmetric+Symmetric = Force TURN.

&nbsp;       \*   Open+Open = Direct.

&nbsp;       \*   One Symmetric = Try direct, fallback to TURN < 5s.

&nbsp;   \*   ☐ \*\*Config:\*\* Manage STUN/TURN server lists (Google/Cloudflare defaults).



\#### \*\*Agent 023 — SIGNAL-ROUTER (Signaling Server)\*\*

\*   \*\*Scope:\*\* `lib/signaling/`, `Dockerfile.signaling`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Zero Knowledge:\*\* Server relays SDP/ICE but never sees keys/files.

&nbsp;   \*   ☐ \*\*Room Codes:\*\* Generate 6+ char CSPRNG codes.

&nbsp;   \*   ☐ \*\*Lifecycle:\*\* Manage room creation, joining, expiry (24h).

&nbsp;   \*   ☐ \*\*Transport:\*\* Socket.IO implementation.

\*   \*\*Deliverables:\*\*

&nbsp;   \*   ☐ Signaling Docker image.



\#### \*\*Agent 024 — RELAY-SENTINEL (Relay Server)\*\*

\*   \*\*Scope:\*\* `tallow-relay/`, `relay-server.js`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Zero Knowledge:\*\* Blind relay of encrypted bytes (io.Copy).

&nbsp;   \*   ☐ \*\*Auth:\*\* PAKE (CPace) authentication for room entry.

&nbsp;   \*   ☐ \*\*Implementation:\*\* Lightweight Go binary (static compile) + Docker.

&nbsp;   \*   ☐ \*\*Limits:\*\* Rate limiting per IP, room timeouts (15 min idle).

\*   \*\*Deliverables:\*\*

&nbsp;   \*   ☐ `tallow/relay:latest` Docker image.



\#### \*\*Agent 028 — FIREWALL-PIERCER (Traversal Specialist)\*\*

\*   \*\*Scope:\*\* `lib/transport/proxy.ts`, `lib/transport/firewall.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Fallback:\*\* UDP Blocked? → TCP. TCP Blocked? → WebSocket/443.

&nbsp;   \*   ☐ \*\*Proxies:\*\* Auto-detect corporate HTTP/SOCKS proxies. Support PAC files.

&nbsp;   \*   ☐ \*\*Communication:\*\* Never fail silently; inform user "Network blocking connection".



\### \*\*3.3 Discovery \& Synchronization\*\*



\#### \*\*Agent 026 — DISCOVERY-HUNTER (Device Discovery)\*\*

\*   \*\*Scope:\*\* `lib/discovery/`, `lib/discovery/discovery-controller.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*LAN:\*\* mDNS/DNS-SD (`\_tallow.\_tcp.local`). Discovery < 2s.

&nbsp;   \*   ☐ \*\*Proximity:\*\* BLE Extended Advertising + RSSI sorting.

&nbsp;   \*   ☐ \*\*Pairing:\*\* NFC NDEF tap-to-connect.

&nbsp;   \*   ☐ \*\*Fallback:\*\* WiFi Direct.

&nbsp;   \*   ☐ \*\*Privacy:\*\* No PII/filenames in discovery packets.

\*   \*\*Constraint:\*\* `discovery-controller.ts` MUST be a plain TS singleton (Turbopack rule).



\#### \*\*Agent 029 — SYNC-COORDINATOR (State Machine)\*\*

\*   \*\*Scope:\*\* `lib/transfer/sync.ts`, `lib/transfer/state-machine.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Resume:\*\* Track chunk bitmaps; resume from last success.

&nbsp;   \*   ☐ \*\*Delta Sync:\*\* Rolling hash (rsync-style) for modified files (>90% savings).

&nbsp;   \*   ☐ \*\*Persistence:\*\* Save state to encrypted IndexedDB (survive tab close).

&nbsp;   \*   ☐ \*\*Queue:\*\* Priority queue for multi-file transfers.

&nbsp;   \*   ☐ \*\*Deduplication:\*\* Hash-based (BLAKE3) detection of existing files.



---



\## \*\*4.0 DIVISION CHARLIE — VISINT (VISUAL INTELLIGENCE)\*\*



\*\*Section Summary:\*\* Led by Agent 030 (DC-CHARLIE), this division builds the UI components. It enforces the "Magazine Aesthetic" (Dark mode, Playfair Display) using strictly CSS Modules and TypeScript.



\### \*\*4.1 Foundations \& Tokens\*\*



\#### \*\*Agent 031 — DESIGN-TOKENSMITH (Design System)\*\*

\*   \*\*Scope:\*\* `app/globals.css`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Single Source:\*\* Define ALL colors, spacing, type, timing as CSS vars.

&nbsp;   \*   ☐ \*\*Colors:\*\* Background (`#030306`), Accent (`#6366f1`), Text (`#f2f2f8`).

&nbsp;   \*   ☐ \*\*Typography:\*\* Fluid type scale using `clamp()`. Playfair Display (Headings), Inter (Body), JetBrains Mono (Code).

&nbsp;   \*   ☐ \*\*Spacing:\*\* 4px grid scale.

&nbsp;   \*   ☐ \*\*Standards:\*\* 100% WCAG 2.1 AA contrast.

\*   \*\*Operational Rule:\*\* NO hardcoded values in components.



\#### \*\*Agent 034 — THEME-ALCHEMIST (Theme System)\*\*

\*   \*\*Scope:\*\* `components/theme/theme-provider.tsx`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Themes:\*\* Dark (default), Light, High-Contrast, Colorblind.

&nbsp;   \*   ☐ \*\*FOUC:\*\* Prevent flash of unstyled content via blocking script.

&nbsp;   \*   ☐ \*\*Switching:\*\* Instant CSS variable swap.

&nbsp;   \*   ☐ \*\*Persistence:\*\* Save preference to localStorage.



\#### \*\*Agent 038 — ICON-ARMORER (Iconography)\*\*

\*   \*\*Scope:\*\* `components/ui/icons`, `lib/ui/icon-armor.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Library:\*\* Lucide React (1.5px stroke).

&nbsp;   \*   ☐ \*\*Sizing:\*\* Strict scale (16/20/24/32px).

&nbsp;   \*   ☐ \*\*Custom:\*\* PQC Shield, Lock, Connection Dots.

&nbsp;   \*   ☐ \*\*Animation:\*\* Loading spinners, processing states.



\### \*\*4.2 Components \& Patterns\*\*



\#### \*\*Agent 032 — COMPONENT-FORGER (React Components)\*\*

\*   \*\*Scope:\*\* `components/`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Stack:\*\* React + TypeScript + CSS Modules (NO Tailwind/Styled).

&nbsp;   \*   ☐ \*\*Pattern:\*\* `forwardRef`, `displayName`, CVA for variants.

&nbsp;   \*   ☐ \*\*Primitives:\*\* Button, Input, Card, Modal, Badge.

&nbsp;   \*   ☐ \*\*Composites:\*\* TransferProgress, DeviceList.

&nbsp;   \*   ☐ \*\*Composition:\*\* Favor composition over inheritance.



\#### \*\*Agent 033 — MOTION-CHOREOGRAPHER (Animation)\*\*

\*   \*\*Scope:\*\* `app/globals.css` (keyframes), `lib/ui/motion-choreographer.ts`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Performance:\*\* 60fps (transform/opacity only).

&nbsp;   \*   ☐ \*\*Timing:\*\* 300ms default.

&nbsp;   \*   ☐ \*\*Interactions:\*\* Scale(0.98) on tap, Lift(-2px) on hover.

&nbsp;   \*   ☐ \*\*Access:\*\* Respect `prefers-reduced-motion`.



\#### \*\*Agent 035 — RADIX-SURGEON (Accessibility Primitives)\*\*

\*   \*\*Scope:\*\* `lib/ui/radix-surgeon.ts`, `components/ui/Modal.tsx`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Behavior:\*\* Implement Radix-like behavior (focus trap, keyboard nav) without the library bloat if possible, or wrap primitives.

&nbsp;   \*   ☐ \*\*Standards:\*\* ARIA roles, state management, focus restoration.



\#### \*\*Agent 036 — FORM-ARCHITECT (Forms)\*\*

\*   \*\*Scope:\*\* Form components.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Stack:\*\* React Hook Form + Zod.

&nbsp;   \*   ☐ \*\*UX:\*\* Validate on blur + submit. Focus error field.

&nbsp;   \*   ☐ \*\*Clarity:\*\* Helpful error messages.



\#### \*\*Agent 037 — TABLE-TACTICIAN (Data Display)\*\*

\*   \*\*Scope:\*\* `components/transfer/TransferHistory.tsx`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Virtualization:\*\* Virtualize any list > 100 items.

&nbsp;   \*   ☐ \*\*Performance:\*\* 60fps scroll.

&nbsp;   \*   ☐ \*\*Features:\*\* Sort, Filter, Pagination.



\#### \*\*Agent 039 — LOADING-ILLUSIONIST (Loading States)\*\*

\*   \*\*Scope:\*\* `app/transfer/loading.tsx`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Pattern:\*\* Skeleton screens (no blank states).

&nbsp;   \*   ☐ \*\*Layout:\*\* Skeleton matches content layout exactly.

&nbsp;   \*   ☐ \*\*Animation:\*\* Staged streaming (trust -> header -> dashboard).



\#### \*\*Agent 040 — ERROR-DIPLOMAT (Error Handling)\*\*

\*   \*\*Scope:\*\* `lib/transfer/error-diplomat.ts`, `app/transfer/error.tsx`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Boundaries:\*\* Global and component-level error boundaries.

&nbsp;   \*   ☐ \*\*UX:\*\* Actionable recovery (Retry, Reset).

&nbsp;   \*   ☐ \*\*Security:\*\* Mask crypto errors ("Connection Secure Failure" not stack trace).



\#### \*\*Agent 041 — NOTIFICATION-HERALD (Notifications)\*\*

\*   \*\*Scope:\*\* `components/ui/Toast.tsx`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Types:\*\* Success (Green), Error (Red), Info.

&nbsp;   \*   ☐ \*\*Logic:\*\* Grouping (anti-spam), rich content (file preview).



\#### \*\*Agent 042 — MODAL-MASTER (Overlays)\*\*

\*   \*\*Scope:\*\* `components/ui/Modal.tsx`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Behavior:\*\* Trap focus, Escape closes, Backdrop click (config).

&nbsp;   \*   ☐ \*\*Types:\*\* Dialogs, Sheets, Command Palette (Ctrl+K).



---



\## \*\*5.0 DIVISION DELTA — UX-OPS (USER EXPERIENCE)\*\*



\*\*Section Summary:\*\* Led by Agent 043 (DC-DELTA), this division ensures the user journey is frictionless (First transfer < 60s) and builds trust through clarity.



\### \*\*5.1 Flows \& Onboarding\*\*



\#### \*\*Agent 044 — FLOW-NAVIGATOR (Navigation)\*\*

\*   \*\*Scope:\*\* Routing architecture.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Desktop:\*\* Sidebar navigation.

&nbsp;   \*   ☐ \*\*Mobile:\*\* Bottom tab navigation.

&nbsp;   \*   ☐ \*\*Logic:\*\* Handle Back button correctly. Breadcrumbs.

&nbsp;   \*   ☐ \*\*Constraint:\*\* Never show both nav types.



\#### \*\*Agent 045 — ONBOARD-GUIDE (Onboarding)\*\*

\*   \*\*Scope:\*\* `components/transfer/OnboardingCoach.tsx`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Metric:\*\* First transfer < 60s.

&nbsp;   \*   ☐ \*\*Flow:\*\* 3 screens max. Skippable.

&nbsp;   \*   ☐ \*\*Features:\*\* Progressive disclosure (don't overwhelm). "What's New".



\### \*\*5.2 Content \& Trust\*\*



\#### \*\*Agent 046 — COPY-STRATEGIST (Copywriting)\*\*

\*   \*\*Scope:\*\* All text.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Tone:\*\* Confident, Privacy-Focused, Approachable.

&nbsp;   \*   ☐ \*\*Rule:\*\* No Jargon. "Protected against quantum computers" not "Post-Quantum".

&nbsp;   \*   ☐ \*\*Actions:\*\* Buttons say what they DO ("Send File").

&nbsp;   \*   ☐ \*\*Errors:\*\* Explain WHY and HOW to fix.



\#### \*\*Agent 047 — EMPTY-STATE-ARTIST (Empty States)\*\*

\*   \*\*Scope:\*\* Zero-data screens.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Pattern:\*\* Illustration + Explanation + Action.

&nbsp;   \*   ☐ \*\*Goal:\*\* Turn empty states into onboarding/action triggers.



\#### \*\*Agent 048 — TRUST-BUILDER (Trust Indicators)\*\*

\*   \*\*Scope:\*\* `components/transfer/TrustStateStrip.tsx`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Visibility:\*\* Security status always visible (Green = Secure).

&nbsp;   \*   ☐ \*\*PQC:\*\* "ML-KEM-768" badge.

&nbsp;   \*   ☐ \*\*SAS:\*\* Prominent verification UI.



\### \*\*5.3 Responsive Design\*\*



\#### \*\*Agent 049 — RESPONSIVE-COMMANDER (Responsive)\*\*

\*   \*\*Scope:\*\* Mobile-first CSS.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Range:\*\* 320px to 2560px.

&nbsp;   \*   ☐ \*\*Touch:\*\* Targets >= 44px.

&nbsp;   \*   ☐ \*\*Interaction:\*\* No hover-only features.



---



\## \*\*6.0 DIVISION ECHO — FRONTEND ARCHITECTURE\*\*



\*\*Section Summary:\*\* Led by Agent 050 (DC-ECHO), this division builds the technical foundation using Next.js 16, Zustand, and Web Workers.



\### \*\*6.1 Core Architecture \& State\*\*



\#### \*\*Agent 051 — NEXTJS-STRATEGIST (Architecture)\*\*

\*   \*\*Scope:\*\* `app/` structure.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*RSC:\*\* Server Components by default.

&nbsp;   \*   ☐ \*\*Boundaries:\*\* `loading.tsx`, `error.tsx` for every route.

&nbsp;   \*   ☐ \*\*Middleware:\*\* Auth, redirects.

&nbsp;   \*   ☐ \*\*Optimization:\*\* Streaming SSR.



\#### \*\*Agent 052 — STATE-ARCHITECT (State Management)\*\*

\*   \*\*Scope:\*\* `lib/stores/`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Client:\*\* Zustand (UI state).

&nbsp;   \*   ☐ \*\*Server:\*\* React Query (Data fetching).

&nbsp;   \*   ☐ \*\*Constraint:\*\* \*\*TURBOPACK RULE\*\*: Access stores via plain TS modules (`store-actions.ts`), NEVER inside hooks/components.

&nbsp;   \*   ☐ \*\*Security:\*\* NO secrets in Zustand.



\### \*\*6.2 Code Quality \& Performance\*\*



\#### \*\*Agent 053 — TYPESCRIPT-ENFORCER (Type Safety)\*\*

\*   \*\*Scope:\*\* `tsconfig.json`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Strict:\*\* `strict: true`.

&nbsp;   \*   ☐ \*\*Rule:\*\* Zero `any`. Zero `as` assertions.

&nbsp;   \*   ☐ \*\*Validation:\*\* Zod for all boundaries.

&nbsp;   \*   ☐ \*\*Crypto:\*\* Branded types (`PublicKey`).



\#### \*\*Agent 054 — HOOK-ENGINEER (Custom Hooks)\*\*

\*   \*\*Scope:\*\* `lib/hooks/`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Design:\*\* Composable, single responsibility.

&nbsp;   \*   ☐ \*\*Safety:\*\* Call Action Modules, not Stores directly.

&nbsp;   \*   ☐ \*\*Cleanup:\*\* Proper `useEffect` teardown.



\#### \*\*Agent 055 — PERFORMANCE-HAWK (Performance)\*\*

\*   \*\*Scope:\*\* Core Web Vitals.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Metrics:\*\* FCP < 2s, LCP < 2.5s, CLS < 0.1.

&nbsp;   \*   ☐ \*\*Workers:\*\* Crypto off main thread (Web Workers).

&nbsp;   \*   ☐ \*\*Bundle:\*\* < 500KB gzipped.

&nbsp;   \*   ☐ \*\*Optimization:\*\* Lazy loading, Image opt.



\#### \*\*Agent 059 — WASM-ALCHEMIST (WebAssembly)\*\*

\*   \*\*Scope:\*\* `tallow-wasm/`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Rust:\*\* Compile BLAKE3, ML-KEM, Zstd to WASM.

&nbsp;   \*   ☐ \*\*Perf:\*\* >1GB/s hashing.

&nbsp;   \*   ☐ \*\*Fallback:\*\* Seamless JS fallback.

&nbsp;   \*   ☐ \*\*Loading:\*\* Async loading.



\### \*\*6.3 Accessibility \& Internationalization\*\*



\#### \*\*Agent 056 — ACCESSIBILITY-GUARDIAN (A11y)\*\*

\*   \*\*Scope:\*\* WCAG Compliance.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Standard:\*\* WCAG 2.1 AA.

&nbsp;   \*   ☐ \*\*Nav:\*\* Full keyboard support.

&nbsp;   \*   ☐ \*\*Reader:\*\* ARIA labels, semantic HTML.

&nbsp;   \*   ☐ \*\*Motion:\*\* `prefers-reduced-motion`.



\#### \*\*Agent 057 — I18N-DIPLOMAT (Internationalization)\*\*

\*   \*\*Scope:\*\* `lib/i18n/`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Coverage:\*\* 22 languages.

&nbsp;   \*   ☐ \*\*RTL:\*\* Full layout mirroring.

&nbsp;   \*   ☐ \*\*Format:\*\* Locale-aware dates/numbers.



\### \*\*6.4 Data Visualization\*\*



\#### \*\*Agent 058 — DATA-VISUALIZER (Charts)\*\*

\*   \*\*Scope:\*\* `components/charts/`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Tech:\*\* Recharts / D3.

&nbsp;   \*   ☐ \*\*UX:\*\* Accessible, color-blind safe palettes.

&nbsp;   \*   ☐ \*\*Perf:\*\* 60fps updates.



---



\## \*\*7.0 DIVISION FOXTROT — PLATFORM OPERATIONS\*\*



\*\*Section Summary:\*\* Led by Agent 060 (DC-FOXTROT), this division ensures native-like experiences. \*\*NOTE:\*\* Current scope is restricted to Web + CLI. Native apps are deferred.



\### \*\*7.1 Web \& Browser\*\*



\#### \*\*Agent 066 — PWA-ENGINEER\*\*

\*   \*\*Scope:\*\* `public/manifest.json`, Service Worker.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Install:\*\* Installable on all platforms.

&nbsp;   \*   ☐ \*\*Offline:\*\* Core UI works offline.

&nbsp;   \*   ☐ \*\*Sync:\*\* Background sync for transfers.



\#### \*\*Agent 067 — BROWSER-EXTENSION-AGENT (Deferred)\*\*

\*   \*\*Status:\*\* Deferred to Phase 2.

\*   \*\*Future Scope:\*\* Chrome/Firefox extensions (Manifest V3).



\### \*\*7.2 Native Mobile \& Desktop (Deferred)\*\*



\#### \*\*Agents 061, 062, 063, 064, 068\*\*

\*   \*\*Status:\*\* Deferred to Phase 2.

\*   \*\*Scope:\*\* Flutter Apps, Electron Wrapper, Native Integrations (Share Sheet, Context Menu). PWA currently covers these use cases.



\### \*\*7.3 CLI \& Tooling\*\*



\#### \*\*Agent 065 — CLI-OPERATOR\*\*

\*   \*\*Scope:\*\* `tallow-cli/` (Go).

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*UX:\*\* `tallow send file` / `tallow receive code`.

&nbsp;   \*   ☐ \*\*Tech:\*\* Go + Cobra. Static binary.

&nbsp;   \*   ☐ \*\*Auth:\*\* PAKE.

&nbsp;   \*   ☐ \*\*Mode:\*\* Relay support, Direct P2P.



\### \*\*7.4 Platform Features\*\*



\#### \*\*Agent 069 — SHARE-SHEET-INTEGRATOR (Deferred)\*\*

\*   \*\*Status:\*\* Deferred (Native integrations). Web Share API handling covered by PWA.



\#### \*\*Agent 070 — NFC-PROXIMITY-AGENT (Deferred)\*\*

\*   \*\*Status:\*\* Deferred.



\#### \*\*Agent 071 — QRCODE-LINKER\*\*

\*   \*\*Scope:\*\* `components/transfer/QRScanner.tsx`.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Gen:\*\* Generate QR with room code + key.

&nbsp;   \*   ☐ \*\*Scan:\*\* Camera-based scanning.

&nbsp;   \*   ☐ \*\*Security:\*\* Expiration, anti-screenshot (optional).



\#### \*\*Agent 072 — CLIPBOARD-AGENT\*\*

\*   \*\*Scope:\*\* Clipboard sync.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Consent:\*\* Opt-in ONLY. Explicit confirm per send.

&nbsp;   \*   ☐ \*\*Security:\*\* End-to-end encrypted.

&nbsp;   \*   ☐ \*\*Data:\*\* Text, Images, Files.



\#### \*\*Agent 073 — FILESYSTEM-AGENT\*\*

\*   \*\*Scope:\*\* File management.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Structure:\*\* Preserve folder hierarchy.

&nbsp;   \*   ☐ \*\*Dedup:\*\* BLAKE3 hash detection.

&nbsp;   \*   ☐ \*\*Org:\*\* Auto-organize by sender/date/type.



\#### \*\*Agent 074 — COMPRESSION-SPECIALIST\*\*

\*   \*\*Scope:\*\* Compression pipeline.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Logic:\*\* Compress BEFORE encrypt.

&nbsp;   \*   ☐ \*\*Smarts:\*\* Entropy check first (skip >7.5).

&nbsp;   \*   ☐ \*\*Algos:\*\* Zstd (default), Brotli (text), LZ4 (speed), LZMA (max).



---



\## \*\*8.0 DIVISION GOLF — QUALITY ASSURANCE\*\*



\*\*Section Summary:\*\* Led by Agent 075 (DC-GOLF), reports directly to RAMSAD. Enforces strict quality gates.



\### \*\*8.1 Testing Infrastructure\*\*



\#### \*\*Agent 076 — UNIT-TEST-SNIPER\*\*

\*   \*\*Scope:\*\* Vitest.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Coverage:\*\* >90% (CI Block).

&nbsp;   \*   ☐ \*\*Vectors:\*\* NIST KAT vectors for all crypto.

&nbsp;   \*   ☐ \*\*Lifecycle:\*\* Hook mount/unmount tests.



\#### \*\*Agent 077 — E2E-INFILTRATOR\*\*

\*   \*\*Scope:\*\* Playwright.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Matrix:\*\* Chrome, Firefox, Safari, Mobile.

&nbsp;   \*   ☐ \*\*Scenarios:\*\* 400+ scenarios.

&nbsp;   \*   ☐ \*\*Network:\*\* Throttling/Offline tests.



\#### \*\*Agent 080 — VISUAL-REGRESSION-WATCHER\*\*

\*   \*\*Scope:\*\* Storybook + Chromatic/Playwright.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Coverage:\*\* All components.

&nbsp;   \*   ☐ \*\*Themes:\*\* Test all 4 themes.

&nbsp;   \*   ☐ \*\*Breakpoints:\*\* 320px to 1920px.



\### \*\*8.2 Security \& Performance Testing\*\*



\#### \*\*Agent 078 — SECURITY-PENETRATOR (Red Team)\*\*

\*   \*\*Scope:\*\* Pentesting.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Standard:\*\* OWASP Top 10.

&nbsp;   \*   ☐ \*\*Specifics:\*\* IP Leak (WebRTC), XSS, CSRF.

&nbsp;   \*   ☐ \*\*Reporting:\*\* Direct to CIPHER/RAMSAD.



\#### \*\*Agent 079 — CRYPTO-TEST-VECTOR-AGENT\*\*

\*   \*\*Scope:\*\* Compliance testing.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Strict:\*\* Fail build if any NIST vector fails.



\#### \*\*Agent 081 — PERFORMANCE-PROFILER\*\*

\*   \*\*Scope:\*\* Benchmarks.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Transfer:\*\* 1GB benchmark per release.

&nbsp;   \*   ☐ \*\*Memory:\*\* Leak detection (return to baseline).

&nbsp;   \*   ☐ \*\*Web:\*\* Lighthouse CI (>90).



\#### \*\*Agent 083 — CHAOS-ENGINEER\*\*

\*   \*\*Scope:\*\* Resilience.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Tests:\*\* Disconnect, Crash, Corruption.

&nbsp;   \*   ☐ \*\*Recovery:\*\* Verify resume/state recovery.



\#### \*\*Agent 084 — DEPENDENCY-AUDITOR\*\*

\*   \*\*Scope:\*\* Supply Chain.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Tools:\*\* npm audit, Snyk, Socket.dev.

&nbsp;   \*   ☐ \*\*Lockfile:\*\* Integrity check.

&nbsp;   \*   ☐ \*\*SBOM:\*\* Generate per release.



\### \*\*8.3 Compatibility \& Compliance\*\*



\#### \*\*Agent 082 — COMPATIBILITY-SCOUT\*\*

\*   \*\*Scope:\*\* Browser Matrix.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Target:\*\* Last 2 versions of major browsers.

&nbsp;   \*   ☐ \*\*Fallbacks:\*\* WASM -> JS, WebCrypto -> Polyfill.



\#### \*\*Agent 085 — COMPLIANCE-VERIFIER\*\*

\*   \*\*Scope:\*\* Regulatory.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Verify:\*\* GDPR (Zero Knowledge), FIPS (Crypto).

&nbsp;   \*   ☐ \*\*Docs:\*\* Auto-generate compliance reports.



---



\## \*\*9.0 DIVISION HOTEL — OPERATIONS \& INTELLIGENCE\*\*



\*\*Section Summary:\*\* Led by Agent 086 (DC-HOTEL), reports directly to RAMSAD. Handles deployment, monitoring, and auxiliary features.



\### \*\*9.1 Infrastructure \& CI/CD\*\*



\#### \*\*Agent 087 — DOCKER-COMMANDER\*\*

\*   \*\*Scope:\*\* Containers.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Images:\*\* <500MB, Multi-stage.

&nbsp;   \*   ☐ \*\*Security:\*\* Non-root user.

&nbsp;   \*   ☐ \*\*Health:\*\* Healthchecks enabled.



\#### \*\*Agent 088 — CI-CD-PIPELINE-MASTER\*\*

\*   \*\*Scope:\*\* GitHub Actions.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Pipeline:\*\* Lint -> Type -> Test -> Build -> Deploy.

&nbsp;   \*   ☐ \*\*Automation:\*\* Semantic versioning, auto-deploy to staging.



\#### \*\*Agent 089 — CLOUDFLARE-OPERATOR\*\*

\*   \*\*Scope:\*\* Edge.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Tunnel:\*\* Secure origin.

&nbsp;   \*   ☐ \*\*Storage:\*\* R2 (encrypted at rest).

&nbsp;   \*   ☐ \*\*Security:\*\* WAF, DDoS protection.



\### \*\*9.2 Observability \& Incident Response\*\*



\#### \*\*Agent 090 — MONITORING-SENTINEL\*\*

\*   \*\*Scope:\*\* Prometheus/Grafana/Sentry.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Metrics:\*\* Transfer counts, errors, relay usage.

&nbsp;   \*   ☐ \*\*Privacy:\*\* Zero PII in logs.

&nbsp;   \*   ☐ \*\*Alerts:\*\* Server down, error rate >5%.



\#### \*\*Agent 096 — INCIDENT-COMMANDER\*\*

\*   \*\*Scope:\*\* Response.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*SLA:\*\* P0 (15 min response).

&nbsp;   \*   ☐ \*\*Protocol:\*\* Breach notification (72h).

&nbsp;   \*   ☐ \*\*Culture:\*\* Blameless post-mortems.



\### \*\*9.3 Product Growth \& Documentation\*\*



\#### \*\*Agent 091 — DOCUMENTATION-SCRIBE\*\*

\*   \*\*Scope:\*\* Docs.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Content:\*\* API, Components (Storybook), Architecture, Guides.

&nbsp;   \*   ☐ \*\*Standard:\*\* Complete, accurate, up-to-date.



\#### \*\*Agent 092 — MARKETING-OPERATIVE\*\*

\*   \*\*Scope:\*\* Landing Page/SEO.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Perf:\*\* Landing load <2s.

&nbsp;   \*   ☐ \*\*Messaging:\*\* Security/Trust focus.

&nbsp;   \*   ☐ \*\*SEO:\*\* Score >90.



\#### \*\*Agent 093 — PRICING-ARCHITECT\*\*

\*   \*\*Scope:\*\* Monetization (Stripe).

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Model:\*\* Free core. Paid convenience (Pro/Business).

&nbsp;   \*   ☐ \*\*Security:\*\* No payment data stored locally.



\#### \*\*Agent 094 — EMAIL-COURIER\*\*

\*   \*\*Scope:\*\* Transactional Email (Resend).

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Privacy:\*\* No tracking pixels.

&nbsp;   \*   ☐ \*\*UX:\*\* Responsive templates, unsubscribe links.



\### \*\*9.4 Privacy \& Analytics\*\*



\#### \*\*Agent 095 — ANALYTICS-GHOST\*\*

\*   \*\*Scope:\*\* Plausible/Umami.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Privacy:\*\* No cookies, no PII, Opt-in only.

&nbsp;   \*   ☐ \*\*Data:\*\* Aggregate metrics only.



\### \*\*9.5 Extended Features \& Automation\*\*



\#### \*\*Agent 097 — AUTOMATION-ENGINEER\*\*

\*   \*\*Scope:\*\* Workflow.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Features:\*\* Scheduled transfers, watched folders.

&nbsp;   \*   ☐ \*\*Security:\*\* Re-authenticate for scheduled tasks.



\#### \*\*Agent 098 — ROOM-SYSTEM-ARCHITECT\*\*

\*   \*\*Scope:\*\* Groups.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Rooms:\*\* 50 member limit, 24h expiry.

&nbsp;   \*   ☐ \*\*Crypto:\*\* Sender Keys protocol (Group encryption).



\#### \*\*Agent 099 — CONTACTS-FRIENDS-AGENT\*\*

\*   \*\*Scope:\*\* Trust relationships.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Trust:\*\* SAS verified -> Trusted.

&nbsp;   \*   ☐ \*\*Features:\*\* Favorites, Block list, Guest mode.



\### \*\*9.6 Build Orchestration\*\*



\#### \*\*Agent 100 — RALPH-WIGGUM (Autonomous Orchestrator)\*\*

\*   \*\*Scope:\*\* Build Automation.

\*   \*\*Core Responsibilities:\*\*

&nbsp;   \*   ☐ \*\*Logic:\*\* Chain agents, multi-iteration loops.

&nbsp;   \*   ☐ \*\*Safety:\*\* Circuit breaker (3 fails), Crypto veto check.

&nbsp;   \*   ☐ \*\*Output:\*\* `<promise>DONE</promise>`.



---



\## \*\*10.0 IMPLEMENTATION STATUS \& AUDIT FINDINGS\*\*



\*\*Section Summary:\*\* Critical findings from the "Grand Audit" (Feb 13, 2026). The system is \*\*NOT RELEASE-READY\*\* until P0 blockers are resolved.



\### \*\*10.1 Audit Synthesis \& Risk Matrix\*\*

\*\*Readiness Score:\*\* 68% (Not Ready)

\*\*Critical Risks (P0 - Ship Blockers):\*\*

1\.  ⚠️ \*\*Fake PAKE:\*\* Current CPace/OPAQUE implementations are stubs. \*\*Action:\*\* Replace with `@noble/curves` or `opaque-ke`.

2\.  ⚠️ \*\*Build Errors Ignored:\*\* `next.config.ts` has `ignoreBuildErrors: true`. \*\*Action:\*\* Remove flag, fix TS errors.

3\.  ⚠️ \*\*Silent Hash Fallback:\*\* BLAKE3 WASM missing leads to silent SHA-256 usage. \*\*Action:\*\* Build WASM or log warning.

4\.  ⚠️ \*\*Missing TURN:\*\* No real TURN server configured. \*\*Action:\*\* Deploy/configure TURN.

5\.  ⚠️ \*\*Crypto Timing:\*\* Multiple constant-time implementations. \*\*Action:\*\* Consolidate.

6\.  ⚠️ \*\*CI Config:\*\* CI checks `main` but repo uses `master`. \*\*Action:\*\* Fix branch name.

7\.  ⚠️ \*\*Tunnel Port:\*\* Cloudflare tunnel points to wrong port (3001 vs 3000). \*\*Action:\*\* Fix port.



\*\*Documentation Gaps:\*\*

\*   Docs describe Flutter/Electron apps that do not exist (Deferred).

\*   File paths in docs often incorrect (e.g., `lib/webrtc/datachannel-manager.ts` vs `data-channel.ts`).



\### \*\*10.2 Copy \& Content Audit\*\*

\*\*Score:\*\* 9.2/10 (Excellent)

\*   \*\*Strengths:\*\* Consistent voice, privacy focus, technical-but-approachable.

\*   \*\*Action Items:\*\*

&nbsp;   \*   ☐ Fix nav links ("HOW IT WORKS" -> /docs).

&nbsp;   \*   ☐ Remove placeholder footer links.

&nbsp;   \*   ☐ Warm up error messages.



\### \*\*10.3 Web Worker Audit\*\*

\*\*Status:\*\* Moderate Risk.

\*   \*\*Critical:\*\* Missing `compression.worker.ts`.

\*   \*\*Critical:\*\* Hardcoded worker paths in bridge (Next.js compilation issue).

\*   \*\*High:\*\* No input validation on worker messages (Type confusion risk).



---



\## \*\*11.0 APPENDIX\*\*



\### \*\*11.1 Source Mapping\*\*

\*   \*\*Agents 001-004:\*\* `TALLOW\_100\_AGENT\_EXPANDED\_OPERATIONS\_MANUAL.md`

\*   \*\*Agents 005-019:\*\* `DIVISION\_ALPHA\_EXPANDED.md`

\*   \*\*Agents 020-029:\*\* `NETOPS\_DIVISION\_EXPANDED.md`

\*   \*\*Agents 030-042:\*\* `TALLOW\_DIVISION\_CHARLIE\_VISINT.md`

\*   \*\*Agents 043-049:\*\* `DIVISION\_DELTA\_ECHO\_EXPANDED.md`

\*   \*\*Agents 050-059:\*\* `DIVISION\_ECHO\_FRONTEND\_EXPANDED.md`

\*   \*\*Agents 060-074:\*\* `PLATFORM\_DIVISION\_061-074.md`

\*   \*\*Agents 075-085:\*\* `DIVISION\_GOLF\_HOTEL\_EXPANDED.md` (QA section)

\*   \*\*Agents 086-100:\*\* `DIVISION\_GOLF\_HOTEL\_EXPANDED.md` (Ops section)

\*   \*\*Audit Data:\*\* `TALLOW\_GRAND\_AUDIT\_SYNTHESIS.md`, `WORKER\_ARCHITECTURE\_AUDIT\_REPORT.md`



\### \*\*11.2 Glossary\*\*

\*   \*\*PQC:\*\* Post-Quantum Cryptography.

\*   \*\*ML-KEM:\*\* Module-Lattice Key Encapsulation Mechanism (Kyber).

\*   \*\*SAS:\*\* Short Authentication String (Emoji/Word verification).

\*   \*\*VISINT:\*\* Visual Intelligence (UI Division).

\*   \*\*SIGINT:\*\* Signals Intelligence (Crypto Division).

\*   \*\*HUMINT:\*\* Human Intelligence (UX Division).

\*   \*\*Turbopack Rule:\*\* Constraint regarding Zustand store access in hooks.



---

\*\*END OF MASTER CONSOLIDATION CHECKLIST\*\*

\*\*CONTINUED IN NEXT RESPONSE — Section \[X] onward\*\* (Not applicable, full consolidation complete in this output).

