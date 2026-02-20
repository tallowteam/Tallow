# TALLOW AGENT QUESTIONNAIRE — SECURITY & PRIVACY MAXIMALIST GUIDE

> **Philosophy:** Pick the most secure/private option that is still *practical*. 
> Sometimes the "most paranoid" choice (e.g., triple hybrid crypto) adds complexity that introduces bugs — which *reduces* security.
> The sweet spot: **maximum security with auditable simplicity.**

> 🔒 = Security-critical pick (don't compromise)
> 🛡️ = Privacy-critical pick (don't compromise)  
> ⚡ = Practical tradeoff (paranoid option exists but this is smarter)
> 💡 = Tip / reasoning

---

## FACTION 01: NSA — Cryptographic Excellence

---

### AGENT 01 — LATTICE (Post-Quantum Cryptography)

**Q1: Primary PQ KEM library?**
**→ D** (ml-kem default + aws-lc-rs FIPS backend)
🔒 Pure Rust `ml-kem` eliminates C FFI attack surface for daily use. `aws-lc-rs` gives you a FIPS-validated path for enterprise without compromising the default. Defense-in-depth: two independent implementations.
💡 `pqcrypto-kyber` (A) wraps C code — every FFI boundary is a potential memory safety hole. Avoid for a Rust-first project.

**Q2: Minimum ML-KEM security level?**
**→ C** (ML-KEM-1024, Level 5)
🔒 No compromise. ML-KEM-1024 is AES-256 equivalent. The performance difference vs ML-KEM-768 is negligible on modern hardware (~1ms extra). You're building "the most secure tool ever" — use the highest level.
💡 NIST recommends Level 5 for long-term secrets. Tallow's files could be stored and decrypted decades from now.

**Q3: Hybrid key exchange?**
**→ A** (ML-KEM-1024 + X25519, AND composition)
⚡ AND composition means BOTH must succeed. This is the strongest guarantee: if either algorithm is broken, the other still protects. X25519 is more than sufficient for the classical component — X448 (C) adds complexity for minimal security gain, and Classic McEliece (D) has enormous key sizes (~1MB) that would cripple usability.
💡 Signal, Chrome, and Cloudflare all chose ML-KEM + X25519. Follow the herd for the most-analyzed combination.

**Q4: Key combiner function?**
**→ B** (BLAKE3 with ciphertext binding)
🔒 Binding the ciphertext into the combiner prevents "key commitment" attacks where the same ciphertext decrypts to different plaintexts under different keys. HKDF-SHA-512 (A) is proven but doesn't bind context. BLAKE3 is faster and the binding is a real security win.
💡 This is the approach recommended by the HPKE standard and multiple PQC transition papers.

---

### AGENT 02 — ENTROPY (Random Number Generation)

**Q1: Primary CSPRNG?**
**→ D** (Custom: OS → HKDF-BLAKE3 → ChaCha20)
🔒 Defense-in-depth. OS entropy feeds through a Tallow-specific extraction step before entering ChaCha20. If the OS RNG has a subtle bias, the HKDF-BLAKE3 extraction step smooths it. This is what Signal and WireGuard-style designs do.
💡 Never trust a single entropy source. The extraction step costs microseconds and buys real insurance.

**Q2: Low-entropy system handling?**
**→ C** (Refuse to generate keys if entropy check fails)
🔒 NEVER generate keys with bad entropy. A weak key is worse than no key — the user thinks they're secure but they're not. Fail loud, fail fast.
💡 This is what GnuPG does. Blocking (A) can hang indefinitely on headless VMs. Mixing in jitter (B/D) is a band-aid.

**Q3: KDF chain for session keys?**
**→ D** (Double: HKDF-SHA-512 then HKDF-BLAKE3)
🔒 Two different hash families in sequence. If SHA-512 is broken, BLAKE3 still holds. If BLAKE3 is broken, SHA-512 still holds. This is the ultimate defense-in-depth for key derivation.
💡 The performance cost is negligible (microseconds per session). For "best of the best," double extraction with different primitives is the gold standard.

**Q4: Domain separation strategy?**
**→ B** (Structured: "tallow-v1-file-enc-aes256gcm-session")
🔒 Structured labels include version, purpose, AND algorithm. This prevents cross-protocol attacks and makes future algorithm migrations safe. If you ever change from AES-GCM to something else, the domain separation guarantees old keys can't be misused.
💡 Numeric IDs (C) are compact but unreadable in audits. Fixed-length bytes (D) are over-engineered. B is the sweet spot.

---

### AGENT 03 — BULKHEAD (Symmetric Encryption)

**Q1: Primary AEAD cipher?**
**→ D** (Auto-negotiate: AEGIS → AES-GCM → ChaCha20)
🔒 Best available per connection. AEGIS-256 is 2-4x faster than AES-GCM and equally secure — but only works with AES-NI. ChaCha20 is the safe fallback for all platforms. Auto-negotiation ensures every connection uses the strongest available option.
💡 AEGIS-256 is a real game-changer for throughput. Don't leave performance on the table when it's free security-wise.

**Q2: Chunk size for streaming AEAD?**
**→ D** (Adaptive: 16KB/64KB/256KB based on file size)
⚡ Small chunks for small files (low latency), large chunks for big files (less overhead). Fixed 64KB (B) is fine but adaptive is strictly better.
💡 Each chunk has a 16-byte authentication tag. At 16KB chunks, a 1GB file has 65,536 tags (~1MB overhead). At 256KB, only 4,096 tags (~64KB overhead).

**Q3: Nonce management?**
**→ B** (Counter-based: session_key || chunk_index)
🔒 Counter nonces have ZERO collision probability (vs random nonces which have a theoretical birthday bound). Combined with session binding, this is the most secure option. AES-GCM-SIV (D) is misuse-resistant but slower — the counter approach means misuse isn't possible in the first place.
💡 Counter nonces are what TLS 1.3 uses. Proven, simple, impossible to get wrong.

**Q4: FIPS enterprise cipher?**
**→ A** (AES-256-GCM via aws-lc-rs FIPS module)
⚡ FIPS compliance means using what's FIPS-validated. Don't get creative here — AES-256-GCM through aws-lc-rs is the clean path. GCM-SIV (B) isn't FIPS-approved yet. CBC-HMAC (C) is legacy garbage.
💡 The FIPS path should be boring and standard. Innovation goes in the default (non-FIPS) path.

---

### AGENT 04 — WATCHFIRE (Traffic Analysis Resistance)

**Q1: Onion routing model?**
**→ A** (Tor-style telescopic 3-hop)
🔒 Tor's design has 20+ years of academic analysis, real-world deployment, and attack research. Sphinx (B) is newer and less analyzed. Mixnets (C) have higher latency that kills file transfer UX. For a file transfer tool, Tor-style is the proven choice.
💡 Don't reinvent onion routing. The attack research on Tor's model IS the security guarantee — it's been stress-tested by nation-states.

**Q2: Packet padding?**
**→ D** (Adaptive: power-of-2 default, constant-size in --stealth)
🛡️ Power-of-2 is good enough for normal use (reveals order-of-magnitude, not exact size). Constant-size cells in stealth mode eliminates even that leakage. This gives users a choice between practical and paranoid.
💡 Uniform 1KB cells (C) wastes 50% bandwidth permanently. Not worth it for everyday transfers.

**Q3: Timing obfuscation?**
**→ D** (Configurable profiles: none/light/moderate/aggressive)
🛡️ Different users have different threat models. A journalist in Iran needs aggressive jitter. A developer sending code to a colleague needs speed. Let users choose.
💡 If forced to pick ONE default: light (0-10ms). It's imperceptible to humans but defeats simple timing correlation.

**Q4: Cover/decoy traffic?**
**→ D** (Opt-in levels: --cover none/light/full)
🛡️ Cover traffic is powerful but costs bandwidth. Making it opt-in respects users who pay for data. The levels let privacy-conscious users dial it up.
💡 Default should be "none" — cover traffic on by default would surprise users and could expose them to bandwidth charges.

---

### AGENT 05 — TEMPEST (Side-Channel Resistance)

**Q1: Constant-time verification?**
**→ D** (All: manual + runtime dudect + type-system)
🔒 Layered verification catches what single methods miss. Manual review for logic, runtime testing for actual timing, type-system for compile-time guarantees. This is belt-and-suspenders for the code that matters most.
💡 `dudect` has caught real timing leaks that code review missed. The type-system approach prevents future regressions.

**Q2: Memory protection for keys?**
**→ C** (zeroize + mlock + guard pages + encrypted memory at rest)
🔒 Guard pages catch buffer overflows near keys. XOR-encrypted keys in RAM defeat cold boot attacks and memory dumps. Hardware enclaves (D) are great but platform-specific — C works everywhere.
💡 The XOR mask is re-randomized periodically. Even if an attacker snapshots RAM, they need both the key AND the current mask.

**Q3: Core dump and swap prevention?**
**→ D** (All: PR_SET_DUMPABLE + MADV_DONTFORK/DONTDUMP + mlockall + clear screen)
🔒 Every layer matters. Core dumps have leaked keys in real incidents. Swap has leaked keys in real incidents. Terminal scrollback has leaked secrets in real incidents. Block all paths.
💡 The alternate screen buffer wipe on exit is underrated — `less` does this for a reason.

**Q4: Speculative execution mitigations?**
**→ D** (All: OS patches + retpoline + no lookup tables)
🔒 Spectre/Meltdown variants keep appearing. Bitsliced AES avoids the cache-timing attacks that plague table-based implementations. Retpoline + compiler barriers add extra safety.
💡 This is what OpenSSL, BoringSSL, and libsodium all do. If your crypto library uses AES lookup tables in 2026, switch immediately.

---

### AGENT 06 — PRISM (Key Management & Identity)

**Q1: Key storage?**
**→ D** (Hardware-first: YubiKey/FIDO2 → keychain → encrypted file)
🔒 Hardware keys are THE gold standard. Keys never leave the hardware token — even a fully compromised OS can't extract them. Keychain is second-best, encrypted file is the universal fallback.
💡 YubiKey 5 supports Ed25519 natively. This makes Tallow compatible with the strongest consumer key storage available.

**Q2: Contact verification?**
**→ D** (All: emoji + safety number + QR code)
🔒 More verification methods = more likely users will actually verify. Emoji for quick visual check, safety number for phone-call verification, QR for in-person meetups. Every method catches different scenarios.
💡 Signal's safety number adoption is ~2% of users. Multiple methods increase the chance someone uses at least one.

**Q3: Key rotation?**
**→ D** (Continuous ratcheting + manual long-term rotation)
🔒 Session keys ratchet continuously (forward secrecy + post-compromise security). Long-term identity keys rotate manually with signed transition records. This is the Signal/Double Ratchet model and it's the strongest known approach.
💡 Automatic time-based rotation (B) can fail silently. Manual rotation with user confirmation is safer for identity keys.

**Q4: Identity model?**
**→ B** (Keypair + optional display name)
🛡️ Pure keypair (A) is maximally private but terrible UX. Usernames (C/D) create a centralized namespace that can be censored or surveilled. Local display names are the privacy-optimal choice — no server ever knows what you call your contacts.
💡 Signal uses phone numbers (worse for privacy). Tallow should avoid ANY centralized identity system.

---

### AGENT 07 — MERIDIAN (Formal Verification)

**Q1: Verification tools?**
**→ C** (Both ProVerif AND Tamarin)
🔒 Cross-validation with different tools catches bugs either one misses. ProVerif is faster for simple properties, Tamarin handles stateful protocols better. CryptoVerif (D) adds computational proofs but is extremely hard to use — diminishing returns.
💡 Signal's protocol was verified with both ProVerif and Tamarin. Follow their lead.

**Q2: Properties to verify?**
**→ D** (All: secrecy + auth + FS + PCS + key confirmation + deniability + anonymity + KCI resistance)
🔒 Every property matters for a tool claiming to be "the most secure ever." KCI resistance specifically prevents an attacker who steals your key from impersonating others to you.
💡 Most tools skip deniability and KCI. Verifying these properties is a major differentiator.

**Q3: Block releases?**
**→ B** (Yes for protocol changes)
⚡ Protocol changes are where catastrophic bugs hide. Non-protocol code (UI, config) doesn't need formal verification gates. B is practical without being reckless.
💡 D (publish proofs) is great aspirationally but blocking EVERY release on verification would cripple velocity.

**Q4: Communication of results?**
**→ D** (Internal + public report + academic paper)
🔒 Full transparency builds the most trust. Academic peer review catches things internal teams miss. Publishing proofs is a massive competitive advantage.

---

### AGENT 08 — CROSSFIRE (Crypto Rust Implementation)

**Q1: Library ecosystem?**
**→ D** (RustCrypto default + aws-lc-rs behind --fips)
🔒 Pure Rust eliminates an entire class of memory safety bugs. aws-lc-rs behind a flag serves enterprise without polluting the default. This is the best of both worlds.
💡 `ring` (B) is excellent but is maintained by one person and includes C/asm. RustCrypto has a broader contributor base.

**Q2: Platforms without AES-NI?**
**→ D** (Negotiate fastest mutually-supported AEAD)
⚡ Auto-negotiation ensures optimal security AND performance on every platform. Hardcoding fallbacks (A/B/C) leaves performance on the table.

**Q3: Fuzzing strategy?**
**→ D** (All fuzzers + OSS-Fuzz)
🔒 Different fuzzers find different bugs. OSS-Fuzz runs continuously for free on Google's infrastructure. This is what curl, OpenSSL, and every serious security project does.

**Q4: Performance optimization?**
**→ D** (SIMD yes, hand-written assembly no)
⚡ SIMD intrinsics are auditable and portable. Hand-written assembly (C) is nearly impossible to audit and a constant source of bugs. The performance gain from asm is ~5% — not worth the audit risk.
💡 BoringSSL has had assembly bugs that went undetected for years. Don't repeat their mistakes.

---

### AGENT 09 — ECHELON (Compliance & Export Control)

**Q1: License?**
**→ D** (AGPL-3.0 core + proprietary enterprise dual-license)
🔒 AGPL prevents cloud providers from running modified Tallow as a service without sharing code. Dual-license funds development. This is the Signal/MongoDB/Grafana model.
💡 Pure AGPL (A) makes monetization hard. BSL (C) isn't true open source and loses community trust.

**Q2: Export control?**
**→ D** (TSU + compliance matrix + legal review + pluggable crypto)
🔒 Pluggable crypto is the nuclear option — it lets you ship compliant builds in restricted jurisdictions without weakening the core product.

**Q3: Lawful intercept response?**
**→ D** (All: comply + prove impossibility + warrant canary)
🔒 The mathematical impossibility IS the compliance. You can honestly say "we cannot decrypt user data because we never have the keys." The canary adds an extra transparency signal.
💡 This is the exact approach Proton, Signal, and Tutanota use. It's legally tested.

**Q4: CLA?**
**→ C** (CLA with open-source guarantee)
⚡ You need a CLA for dual-licensing to work legally. But the open-source guarantee prevents rug-pulls and builds contributor trust. This is the best balance.
💡 No CLA (D) means you legally cannot dual-license contributions. DCO (B) is too weak for relicensing rights.

---

### AGENT 10 — KEYSTONE (Cryptographic Architecture)

**Q1: Algorithm agility?**
**→ D** (Fixed default + optional upgrade negotiation)
⚡ Fixed defaults are simpler and harder to attack (no downgrade attacks). Optional negotiation allows upgrades without protocol version bumps. This is how TLS 1.3 works.
💡 Full negotiation (C) is how TLS 1.2 got its downgrade vulnerabilities. Avoid.

**Q2: Emergency algorithm replacement?**
**→ D** (All: patch + relay broadcast + auto client skip)
🔒 Layered response ensures fast mitigation even if users don't update immediately. Relay broadcast reaches connected clients instantly.

**Q3: PQ timeline?**
**→ D** (User-selectable based on adversary)
⚡ Nation-state adversaries are doing "harvest now, decrypt later" TODAY. Personal users face lower threat. Let users choose their security posture.
💡 Default should assume B (CRQC by 2035) — aggressive enough to be safe, not so aggressive it's impractical.

**Q4: Backward compatibility?**
**→ B** (Last 3 versions, warn older, refuse ancient)
⚡ Supporting too many versions increases attack surface. Too few breaks upgrades. 3 versions is the sweet spot (same as Signal).

---

## FACTION 02: UNIT 8200 — Offensive Security

---

### AGENT 11 — IRON DOME

**Q1:** **→ D** (Pre-release + quarterly + annual) 🔒 Maximum coverage at multiple timescales.
**Q2:** **→ B** (Nation-state first) 🔒 If you defend against the strongest, everyone else is covered.
**Q3:** **→ C** (Custom crypto + industry network) ⚡ Custom tools for novel attacks, proven tools for known vectors.
**Q4:** **→ D** (Full transparency post-remediation) 🔒 Publishing findings builds trust and invites community scrutiny.

### AGENT 12 — STINGER

**Q1:** **→ D** (All equally weighted) 🔒 Don't assume which attack class an adversary will use.
**Q2:** **→ D** (Configurable: 4 default, enforce 6+ in --high-security) ⚡ 6 words = 77 bits, sufficient against offline brute force. 4 words for casual use with warnings.
**Q3:** **→ D** (All combined) 🔒 Defense-in-depth against replay is cheap and the attacks are devastating.
**Q4:** **→ D** (Generated from spec + model-checked) 🔒 Two independent methods catch different classes of state machine bugs.

### AGENT 13 — PHANTOM

**Q1:** **→ D** (All simultaneously) 🔒 Network infrastructure is the most exposed attack surface.
**Q2:** **→ D** (All attack surfaces) 🔒 NAT traversal touches untrusted networks at every layer.
**Q3:** **→ D** (Full DNS + fallback + bootstrapping) 🔒 DNS is often the weakest link. Test everything.
**Q4:** **→ D** (Pin relay public keys in protocol) 🔒 Protocol-level pinning survives TLS certificate rotation and CA compromise. This is stronger than certificate pinning.

### AGENT 14 — SANDSTORM

**Q1:** **→ D** (All fuzzers + OSS-Fuzz) 🔒 More fuzzers = more bugs found. OSS-Fuzz is free continuous testing.
**Q2:** **→ D** (Weighted: parser 40%, files 30%, crypto 20%, config 10%) ⚡ Weight by attack surface exposure. Parsers face untrusted input most.
**Q3:** **→ D** (Zero unsafe in Tallow, only inside audited deps) 🔒 Tallow's code should be 100% safe Rust. Crypto crate internals can use unsafe (they're audited independently).
**Q4:** **→ C** (Zero keys + restore terminal + clear screen) ⚡ Key zeroing on crash is essential. Terminal restoration prevents broken terminal state. Crash reports (D) risk leaking info.

### AGENT 15 — VIPER

**Q1:** **→ D** (Configurable: subtle default, aggressive in --high-security) 🛡️ Don't alarm casual users but protect high-risk users.
**Q2:** **→ D** (Active warnings for clipboard-detected code phrases) 🔒 Detecting code phrases in clipboard from messaging apps is genuinely innovative security UX.
**Q3:** **→ D** (Fingerprint + similar name detection + phonetic similarity) 🔒 Homoglyph attacks are real. "a1ice" looks like "alice" in many fonts.
**Q4:** **→ D** (Signing + URLs + domain monitoring + verify-install) 🔒 Every layer of anti-phishing protects a different user behavior.

### AGENT 16 — MOSSAD

**Q1:** **→ D** (Docker + Nix + third-party verification) 🔒 If builds aren't reproducible, a compromised CI could ship malware. Third-party verification is the gold standard (like Tor Browser does).
**Q2:** **→ D** (Audit all + lock versions + vetted forks of security-critical) 🔒 For crypto dependencies, maintaining a vetted fork means YOU control the code that protects users.
**Q3:** **→ D** (Threshold signing + Sigstore + independent verification) 🔒 No single person should be able to ship a release. Threshold signing + transparency log = maximum supply chain integrity.
**Q4:** **→ D** (All: cargo-audit + cargo-deny + daily scanning + allowlist) 🔒 Pre-approved allowlist means no surprise dependency can enter the build.

### AGENT 17 — SABRA

**Q1:** **→ C** (Linux + macOS + Windows x86_64 + ARM64) ⚡ Full desktop coverage is necessary for adoption. FreeBSD (D) can come later.
**Q2:** **→ D** (Keychain + YubiKey/FIDO2 + secure enclave) 🔒 Use the strongest available hardware on each platform.
**Q3:** **→ D** (Auto-clear + bypass history + --no-clipboard option) 🔒 Clipboard is a major secret leakage vector. Every mitigation matters.
**Q4:** **→ D** (All terminals + accessibility) 🔒 Screen reader compatibility isn't just accessibility — it's security for visually impaired users who deserve equal protection.

### AGENT 18 — MASADA

**Q1:** **→ D** (All: per-IP + proof-of-work + progressive + anycast) 🔒 DDoS against relays is the most likely availability attack. Layered defense is essential.
**Q2:** **→ D** (All: rate limit + PoW + resource limits + reputation) 🔒 PAKE is computationally expensive — DoS through PAKE exhaustion is a real attack vector.
**Q3:** **→ D** (All: concurrent limits + data limits + contact verification + auto-throttle) 🔒 Client-side resource exhaustion can be used to deny service to the user.
**Q4:** **→ D** (Retry + health status + P2P fallback + CDN-fronting) 🔒 CDN-fronted endpoints make volumetric DDoS extremely expensive for attackers.

### AGENT 19 — KIDON

**Q1:** **→ D** (Two reviews + SAST + weekly rotation) 🔒 Fresh eyes catch what familiar eyes miss. Rotation is underrated.
**Q2:** **→ D** (Debug + sanitizers + symbolic execution + crypto timing instrumentation) 🔒 Each tool finds different vulnerability classes.
**Q3:** **→ D** (Structured bounty + invite-only for top researchers) 🔒 Public bounty attracts volume, invite-only attracts quality. Both matter.
**Q4:** **→ D** (Daily audit + RustSec + repo subscriptions + private DB) 🔒 A private vulnerability database for pre-disclosure findings is standard for serious security projects.

### AGENT 20 — BERESHEET

**Q1:** **→ D** (All threat models simultaneously) 🔒 Every user faces all three threats. Design for the union.
**Q2:** **→ D** ("Harvest now, decrypt later" is happening TODAY) 🔒 Intelligence agencies are collecting encrypted traffic now for future quantum decryption. This is documented and confirmed. PQ is already urgent.
**Q3:** **→ D** (All: manual + automated + dark web + CERT relationships) 🔒 Comprehensive threat intelligence catches threats at every stage.
**Q4:** **→ D** (Internal + public + ISACs + community indicators) 🔒 Sharing threat data helps the entire secure communications ecosystem.

---

## FACTION 03: MSS — Infrastructure & Scale

---

### AGENT 21 — GREAT WALL

**Q1:** **→ A** (Pure Rust: tokio + quinn) 🔒 Same language as client = one security audit covers both. Go (B) introduces a second language's security model.
**Q2:** **→ D** (Hybrid: hardcoded + DNS + consensus + gossip) 🔒 Maximum discovery resilience. Censors can't block all four methods simultaneously.
**Q3:** **→ D** (Binary + Docker + Terraform + federation) 🔒 Federation allows independent relay operators to mesh — no single operator controls all traffic.
**Q4:** **→ D** (All: domain fronting + pluggable transports + WebSocket facade) 🛡️ Auto-detection of network environment means Tallow works in China, Iran, Russia without user configuration.

### AGENT 22 — SILK ROAD

**Q1:** **→ C** (QUIC primary + TCP+TLS fallback) ⚡ QUIC is superior but some networks block UDP. TCP+TLS fallback ensures connectivity everywhere.
**Q2:** **→ D** (Adaptive: BBR for high-latency, CUBIC for LAN) ⚡ Different algorithms optimize for different network conditions.
**Q3:** **→ D** (QUIC migration only, no multi-path) 🔒 Connection migration survives network switches. Multi-path (C) adds complexity and attack surface for marginal benefit.
**Q4:** **→ D** (Adaptive: 1 small, 4 large, configurable ceiling) ⚡ Adaptive streaming maximizes throughput without over-complicating small transfers.

### AGENT 23 — DRAGON

**Q1:** **→ D** (ICE + UPnP/NAT-PMP + mDNS) ⚡ Maximum connectivity options = fewer failed transfers.
**Q2:** **→ C** (Both mDNS AND UDP broadcast) ⚡ Some networks support one but not the other. Both ensures LAN discovery always works.
**Q3:** **→ D** (User choice: --direct/--relay, default relay-first) 🛡️ Relay-first is privacy-safe by default (never leaks IP). Users who want speed can opt into direct P2P.
**Q4:** **→ D** (Hardware limited + configurable throttling) ⚡ Tallow should never be the bottleneck, but throttling prevents hogging shared networks.

### AGENT 24 — TERRACOTTA

**Q1:** **→ C** (100,000 concurrent) ⚡ Designing for 100K is realistic for a global relay network without over-engineering for 1M+.
**Q2:** **→ D** (Fully stateless — each relay independent) 🔒 No shared state = no shared state to compromise. Simpler, more secure, easier to operate.
**Q3:** **→ D** (Unlimited P2P, generous capped relay, configurable) ⚡ P2P costs nothing. Relay caps prevent abuse while remaining generous.
**Q4:** **→ C** (OpenTelemetry + Prometheus/Grafana + Jaeger tracing) ⚡ Distributed tracing is essential for debugging onion routing issues.

### AGENT 25 — JADE

**Q1:** **→ B** (rusqlite with SQLCipher) 🔒 Encrypted-at-rest database protects transfer history if device is seized. SQLCipher is the gold standard.
**Q2:** **→ C** (Ephemeral by default, opt-in persistent) 🛡️ The privacy-maximalist choice. No history by default means nothing to subpoena.
**Q3:** **→ C** (TOML human + postcard binary internal) ⚡ TOML for user-editable config, postcard for efficient internal state. Clean separation.
**Q4:** **→ A** (Zero retention — pure pass-through) 🛡️ If relays store nothing, there's nothing to seize. This is the privacy-nuclear option and it's the right one.

### AGENT 26 — PHOENIX

**Q1:** **→ D** (Chunk-level with integrity verification) 🔒 Resume from last VERIFIED chunk. Without verification, a corrupted chunk could be accepted. This prevents bitflip attacks on resumed transfers.
**Q2:** **→ D** (WAL + snapshots + graceful shutdown) 🔒 Maximum crash resilience without data loss. Graceful SIGTERM handling is essential for Docker/systemd environments.
**Q3:** **→ D** (Latency memory + circuit breaker) ⚡ Smart relay selection + temporary blacklisting prevents hammering a failing relay.
**Q4:** **→ D** (LAN fallback + queue + network diagnostic) ⚡ `tallow doctor --network` is a killer UX feature that also helps debug censorship issues.

### AGENT 27 — BAMBOO

**Q1:** **→ D** (Adaptive: lz4 LAN, zstd 3 relay) ⚡ LAN has bandwidth to spare (lz4 speed wins). Relay benefits from better ratios (zstd compression wins).
**Q2:** **→ D** (Magic bytes + content sampling for unknowns) 🔒 Never trust file extensions. Magic bytes + sampling catches renamed files and unknown formats.
**Q3:** **→ D** (Auto: zstd 19 < 100MB, zstd 9 larger) ⚡ Time-bounded compression prevents users from waiting forever on huge files.
**Q4:** **→ D** (Rabin CDC + BLAKE3 integrity) 🔒 Content-defined chunking is superior to rsync for deduplication, and BLAKE3 provides cryptographic integrity.

### AGENT 28 — MANDARIN

**Q1:** **→ D** (Top 10 at launch, community expansion) ⚡ Code phrases in native languages dramatically improve usability for non-English speakers.
**Q2:** **→ D** (Community translations + professional review for security strings) 🔒 Mistranslated security warnings could be dangerous. Professional review for those specific strings.
**Q3:** **→ C** (UTF-8 wire + platform-native + lossy conversion with warning) ⚡ Practical handling of the real-world encoding mess.
**Q4:** **→ D** (Full RTL + native speaker testing) 🔒 RTL is not just cosmetic — broken RTL can cause filename/path confusion that's security-relevant.

### AGENT 29 — QILIN

**Q1:** **→ B** (GitHub Actions + self-hosted ARM/FreeBSD) ⚡ Self-hosted runners for platforms GitHub doesn't support natively.
**Q2:** **→ C** (Linux + macOS + Windows + ARM64 + FreeBSD) ⚡ Matches the platform support from Agent 17.
**Q3:** **→ D** (Monthly stable + continuous nightly) ⚡ Stable cadence for users, nightly for testers and early adopters.
**Q4:** **→ D** (CI + Nix + community + Sigstore) 🔒 Maximum build transparency and verification.

### AGENT 30 — COMPASS

**Q1:** **→ A** (ZERO telemetry, ever) 🛡️ This is non-negotiable for a privacy tool. ANY telemetry — even opt-in — creates a trust deficit.
💡 "We never phone home" is a powerful marketing message. Don't dilute it.
**Q2:** **→ D** (Local dump, user submits manually) 🛡️ Crash data stays on the user's machine. They choose to share. Maximum privacy, still useful for debugging.
**Q3:** **→ A** (Zero visibility) 🛡️ Relay operators shouldn't see anything. If you need capacity data, use relay-side metrics that don't expose user traffic patterns.
**Q4:** **→ D** (Configurable: never/weekly/daily, default weekly) ⚡ Weekly check-in to a static file (no analytics) is reasonable. Never auto-update.

---

## FACTION 04: GCHQ — Standards & Rigor

---

### AGENT 31 — TURING

**Q1:** **→ C** (Both RFC-style + developer markdown) 🔒 RFC for auditors and academics, markdown for developers.
**Q2:** **→ D** (Version number + capability flags) ⚡ Versions for structure, flags for optional features. Maximum flexibility.
**Q3:** **→ C** (TLV + feature negotiation) ⚡ Both mechanisms serve different purposes. TLV for data extensions, negotiation for capability discovery.
**Q4:** **→ B** (postcard — Serde, no_std, compact) 🔒 Pure Rust, no_std capable, Serde-compatible. Perfect for a Rust-first project.

### AGENT 32 — BLETCHLEY

**Q1:** **→ D** (FIPS-ready architecture + aws-lc-rs backend) 🔒 Design for FIPS from day one even if you certify later. Retrofitting FIPS is painful.
**Q2:** **→ C** (All major standards including OPAQUE + MLS) 🔒 Comprehensive standards compliance future-proofs the protocol.
**Q3:** **→ D** (Tallow-only primary, key export optional, gateway future) ⚡ Focus on Tallow-to-Tallow perfection first.
**Q4:** **→ D** (All: KAT + ACVP + reference + caveat testing) 🔒 Complete test vector coverage is essential for crypto correctness.

### AGENT 33 — ENIGMA

**Q1:** **→ D** (Protocol + key management first, full scope next) 🔒 Phased auditing maximizes coverage within budget constraints.
**Q2:** **→ D** (Competitive RFP to all three) ⚡ Let the best proposal win. Trail of Bits has the strongest Rust expertise but competition improves quality.
**Q3:** **→ D** (After first audit, expand over time) 🔒 Bug bounty on unaudited code is a waste of money. Audit first, then bounty.
**Q4:** **→ A** (Full report immediately after remediation) 🔒 Speed + transparency. Delaying publication reduces trust.

### AGENT 34 — COLOSSUS

**Q1:** **→ D** (Starlight/Astro — modern, fast, great search) ⚡ Search quality is critical for security documentation. Users need to find answers fast.
**Q2:** **→ D** (Technical whitepaper + academic paper) 🔒 Two audiences, two formats. Peer-reviewed research is a trust signal competitors can't match.
**Q3:** **→ D** (Contextual help + searchable overlay + doc links) ⚡ Best UX for users of all skill levels.
**Q4:** **→ C** (Changelog + migration guide + CLI upgrade-guide) ⚡ In-CLI guidance reduces upgrade friction and security-relevant misconfiguration.

### AGENT 35 — SOVEREIGN

**Q1:** **→ C** (Privacy-by-design + DPIA + DPA templates) 🔒 Published DPIA demonstrates GDPR compliance proactively. DPA templates unlock enterprise.
**Q2:** **→ D** (SOC 2 controls baked in + relay certified) 🔒 Enterprise sales require SOC 2. Build for it from day one.
**Q3:** **→ D** (Geo-fencing + per-contact + documentation) 🛡️ Data residency is a legal requirement in many jurisdictions. Full support is essential for enterprise.
**Q4:** **→ D** (BAA + HIPAA config + control mapping) 🔒 Healthcare is a massive market for secure file transfer. Complete HIPAA documentation unlocks it.

### AGENT 36 — WELLINGTON

**Q1:** **→ D** (Verb-noun common + git-style advanced) ⚡ `tallow send` is intuitive. `tallow identity rotate` is discoverable. Best of both.
**Q2:** **→ D** (Human + --output human/json/jsonl) 🔒 JSONL streaming is essential for monitoring and automation. Security tools need machine-readable output.
**Q3:** **→ D** (API key simple, OAuth SSO, mTLS zero-trust) 🔒 Three auth methods for three deployment models. Maximum flexibility.
**Q4:** **→ D** (Core + FFI + language wrappers) 🔒 Clean architecture enables auditing each layer independently.

### AGENT 37 — CROMWELL

**Q1:** **→ D** (100% crypto branch + 90% elsewhere + mutation testing) 🔒 Mutation testing catches tests that pass but don't actually verify behavior. Essential for crypto.
**Q2:** **→ D** (Docker + network sim + chaos + cross-platform CI) 🔒 Cross-platform testing catches platform-specific security bugs.
**Q3:** **→ D** (N↔N-1 + cross-platform pairs) 🔒 Cross-platform compatibility testing catches encoding/endianness/path bugs.
**Q4:** **→ D** (Automated benchmarks + e2e + trends dashboard) 🔒 Performance regressions can indicate security issues (e.g., accidentally disabling HW acceleration).

### AGENT 38 — BABBAGE

**Q1:** **→ D** (< 50ms CLI, < 200ms TUI) ⚡ CLI should feel instant. TUI can take a moment to draw.
**Q2:** **→ D** (> 90% HW accel, > 80% software) ⚡ These targets are achievable with AEGIS/AES-GCM and prove crypto isn't the bottleneck.
**Q3:** **→ D** (Adaptive: 60 FPS active, 10 FPS idle) ⚡ Save CPU when idle, smooth when interacting. Smart resource usage.
**Q4:** **→ D** (< 20MB default, < 10MB with --low-memory) 🔒 Streaming architecture ensures large files don't bloat memory. < 20MB enables Raspberry Pi relays.

### AGENT 39 — OXFORD

**Q1:** **→ D** (Papers + peer review + advisory board) 🔒 Academic review of PQC parameter choices catches errors before deployment.
**Q2:** **→ C** (Formal university partnerships) ⚡ Funded research on Tallow-specific problems (e.g., hybrid PQ composition security).
**Q3:** **→ D** (Code + benchmarks + network data + bibliography) 🔒 Contributing real-world PQC data back to the research community benefits everyone.
**Q4:** **→ D** (Security + open-source + crypto conferences) ⚡ Maximum visibility across all relevant communities.

### AGENT 40 — LANCASTER

**Q1:** **→ D** (Coordinated with reporter, default 90 days) 🔒 Flexibility shows maturity. Some fixes genuinely need more time.
**Q2:** **→ D** (Custom severity + CVSS + impact + component tagging) 🔒 Component tagging speeds triage and helps users assess their exposure.
**Q3:** **→ D** (Public: timeline + root cause + prevention, within 30 days) 🔒 Detailed public post-incident reports build trust and help the ecosystem learn.
**Q4:** **→ D** (Tiered SLAs: community C, custom enterprise) ⚡ Enterprise customers pay for guaranteed response times.

---

## FACTION 05: INDEPENDENT CELL — Community & UX

---

### AGENT 41 — CYPHERPUNK

**Q1:** **→ D** (Discord + Matrix bridged + GitHub Discussions) ⚡ Maximum reach (Discord) + values alignment (Matrix) + searchability (GitHub).
**Q2:** **→ D** (Tiered + security code needs core approval + CLA) 🔒 Security-critical code must be approved by trusted maintainers. CLA enables dual-licensing.
**Q3:** **→ D** (Open core: CLI complete for individuals, enterprise proprietary) ⚡ The CLI should be genuinely complete. Enterprise features are admin/compliance tooling.
**Q4:** **→ D** (Technical by maintainers, strategic by BDFL) ⚡ You keep strategic control, community drives technical decisions. This scales well.

### AGENT 42 — PIXEL

**Q1:** **→ D** (Custom Tallow theme + 12 themes, select in onboarding) ⚡ Brand identity + user choice. The custom theme IS the brand.
**Q2:** **→ D** (Adaptive: split ≥ 120 cols, tabs < 120) ⚡ Responsive design for different terminal sizes.
**Q3:** **→ D** (Micro-animations + --reduce-motion) ⚡ Polished UX by default, accessible with a flag.
**Q4:** **→ D** (Configurable, rounded default) ⚡ Rounded borders are modern but some users prefer sharp. Let them choose.

### AGENT 43 — SHERPA

**Q1:** **→ D** (< 30s sender, < 2min receiver) ⚡ Realistic targets. Receiver needs install time.
**Q2:** **→ D** (What + why + what to do + error code + tallow doctor) 🔒 The BEST error UX for a security tool. Users should never be confused about what went wrong.
**Q3:** **→ D** (Zero onboarding CLI, wizard TUI) ⚡ Power users want zero friction. New TUI users benefit from guided setup.
**Q4:** **→ D** (Progressive disclosure + "Learn more" links) ⚡ Don't hide security details but don't force them on users either.

### AGENT 44 — RUSTACEAN

**Q1:** **→ D** (crypto + protocol + transport + cli + tui + relay + sdk) 🔒 Maximum separation of concerns. Each crate can be audited independently. Crypto crate has minimal dependencies.
**Q2:** **→ D** (thiserror libs + anyhow app + custom codes + color-eyre) 🔒 color-eyre restores terminal state on panic — essential for TUI security (broken terminal can leak scrollback).
**Q3:** **→ D** (current_thread CLI, multi_thread daemon) ⚡ Right-sized runtime for each mode.
**Q4:** **→ D** (Stable - 4, match ecosystem) ⚡ Matches Tokio and Quinn MSRV, maximum compatibility.

### AGENT 45 — HERALD

**Q1:** **→ D** (Docs + tutorials + videos + WASM demo) ⚡ The WASM demo lets people try Tallow in a browser. Incredible for adoption.
**Q2:** **→ D** (WASM plugins + curated registry + security review) 🔒 WASM sandboxing prevents malicious plugins from accessing the filesystem or network.
**Q3:** **→ D** (CI/CD + chat bots + S3 + webhooks) ⚡ Integration breadth drives enterprise adoption.
**Q4:** **→ D** (Rust + Python first, expand on demand) ⚡ Python covers scripting/automation use cases. Expand based on actual demand.

### AGENT 46 — SPECTER

**Q1:** **→ D** (arti-client optional, runtime flag --tor) 🛡️ Pure Rust Tor built-in but optional. `tallow send --tor file.txt` is a game-changing privacy feature.
**Q2:** **→ D** (DoH + DoT + refuse plaintext + Tor DNS in high-security) 🛡️ Complete DNS privacy. Refusing plaintext DNS prevents accidental leaks.
**Q3:** **→ D** (Relay default, P2P opt-in with explicit warning) 🛡️ Privacy-safe by default. Users must explicitly choose to reveal their IP.
💡 This is THE most important privacy decision in the entire questionnaire.
**Q4:** **→ D** (All: encrypt metadata + pad + no version string + randomize timing) 🛡️ Protocol fingerprinting resistance is essential against DPI (Deep Packet Inspection).

### AGENT 47 — FORGE

**Q1:** **→ D** (Multi-cloud + CDN + privacy jurisdictions) 🛡️ Relays in Switzerland and Iceland provide legal protection for user privacy.
**Q2:** **→ D** (NixOS for fully reproducible relay servers) 🔒 NixOS means the exact relay configuration is version-controlled and reproducible. No config drift.
**Q3:** **→ D** (Docker Compose small, Kubernetes large) ⚡ Right-sized orchestration for deployment scale.
**Q4:** **→ D** (ACME + CT monitoring + HSTS + CAA + OCSP + client pinning) 🔒 Complete TLS hardening stack. No shortcuts.

### AGENT 48 — MOSAIC

**Q1:** **→ D** (Send + receive + PQ + P2P + relay + basic TUI = MVP) ⚡ Ship the smallest useful product. Chat and contacts can wait for v0.2.
**Q2:** **→ D** ($8/month or $80/year) ⚡ Standard SaaS pricing. Annual discount drives retention.
**Q3:** **→ D** (All three: PQ + onion routing + beautiful TUI) 🔒 The COMBINATION is the moat. No competitor has all three.
**Q4:** **→ D** (Stable + audit + compliance docs, then enterprise) ⚡ Enterprise customers need audit reports and compliance documentation. Don't rush it.

### AGENT 49 — LIGHTHOUSE

**Q1:** **→ D** (WCAG AA + screen readers + cognitive accessibility) 🔒 Security tools MUST be accessible. Everyone deserves privacy, regardless of ability.
**Q2:** **→ D** (High contrast + color not sole + contrast CI + colorblind testing) 🔒 Automated CI checking prevents accessibility regressions.
**Q3:** **→ D** (Keyboard + focus + tab order + Vim bindings) ⚡ Vim keybindings are a huge draw for terminal power users.
**Q4:** **→ D** (80×24 recommended, 60×20 minimum, graceful below) ⚡ tmux users need smaller pane support.

### AGENT 50 — ARCHITECT

**Q1:** **→ D** (arc42 + C4 diagrams) 🔒 Structured documentation + visual diagrams. Best for auditors and new contributors.
**Q2:** **→ D** (Bi-weekly, avoid meeting fatigue) ⚡ Frequent enough to catch issues, not so frequent it burns people out.
**Q3:** **→ D** (RFC for proposals + ADR for decisions) 🔒 Community input via RFC, permanent record via ADR. This is the Rust language's own governance model.
**Q4:** **→ D** (All: tests + security review + benchmarks + integration review) 🔒 Maximum release readiness criteria. Never ship with known gaps.

---

## QUICK REFERENCE — ALL 200 ANSWERS

```
AGENT 01: D C A B     AGENT 26: D D D D
AGENT 02: D C D B     AGENT 27: D D D D
AGENT 03: D D B A     AGENT 28: D D C D
AGENT 04: A D D D     AGENT 29: B C D D
AGENT 05: D C D D     AGENT 30: A D A D
AGENT 06: D D D B     AGENT 31: C D C B
AGENT 07: C D B D     AGENT 32: D C D D
AGENT 08: D D D D     AGENT 33: D D D A
AGENT 09: D D D C     AGENT 34: D D D C
AGENT 10: D D D B     AGENT 35: C D D D
AGENT 11: D B C D     AGENT 36: D D D D
AGENT 12: D D D D     AGENT 37: D D D D
AGENT 13: D D D D     AGENT 38: D D D D
AGENT 14: D D D C     AGENT 39: D C D D
AGENT 15: D D D D     AGENT 40: D D D D
AGENT 16: D D D D     AGENT 41: D D D D
AGENT 17: C D D D     AGENT 42: D D D D
AGENT 18: D D D D     AGENT 43: D D D D
AGENT 19: D D D D     AGENT 44: D D D D
AGENT 20: D D D D     AGENT 45: D D D D
AGENT 21: A D D D     AGENT 46: D D D D
AGENT 22: C D D D     AGENT 47: D D D D
AGENT 23: D C D D     AGENT 48: D D D D
AGENT 24: C D D C     AGENT 49: D D D D
AGENT 25: B C C A     AGENT 50: D D D D
```

---

*Tallow — because "probably secure" isn't good enough.*
