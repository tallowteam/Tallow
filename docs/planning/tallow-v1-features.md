# Tallow v1 Feature Catalog

**Secure File Transfer CLI — Post-Quantum Encrypted, Tor-Integrated**
**Total Features: 500**

---

## Table of Contents

1. [Core Transfer Engine (001–040)](#1-core-transfer-engine)
2. [Cryptography & Key Management (041–100)](#2-cryptography--key-management)
3. [Security Hardening (101–160)](#3-security-hardening)
4. [Privacy & Anonymity (161–210)](#4-privacy--anonymity)
5. [UX — CLI Interface (211–270)](#5-ux--cli-interface)
6. [UX — TUI / Interactive Mode (271–310)](#6-ux--tui--interactive-mode)
7. [UX — Desktop GUI / Drag-and-Drop (311–340)](#7-ux--desktop-gui--drag-and-drop)
8. [File & Folder Handling (341–380)](#8-file--folder-handling)
9. [Relay & Network Architecture (381–420)](#9-relay--network-architecture)
10. [Authentication & Identity (421–450)](#10-authentication--identity)
11. [Observability & Diagnostics (451–475)](#11-observability--diagnostics)
12. [Platform & Distribution (476–500)](#12-platform--distribution)

---

## 1. Core Transfer Engine

| #   | Feature | Description | Priority |
|-----|---------|-------------|----------|
| 001 | Single-file transfer | Send one file to one recipient via relay | P0 |
| 002 | Multi-file transfer | Send multiple files in a single session | P0 |
| 003 | Folder transfer | Recursively send entire directory trees | P0 |
| 004 | Streaming transfer | Stream file bytes without buffering entire file in memory | P0 |
| 005 | Resumable transfers | Resume interrupted transfers from last confirmed chunk | P0 |
| 006 | Transfer ID generation | Generate unique, human-readable transfer codes (e.g., `7-guitar-castle`) | P0 |
| 007 | Chunked uploads | Split files into authenticated, encrypted chunks | P0 |
| 008 | Chunk ordering & reassembly | Reassemble chunks in correct order with sequence verification | P0 |
| 009 | Integrity verification | Verify full-file hash after reassembly | P0 |
| 010 | Parallel chunk transfer | Upload/download multiple chunks concurrently | P1 |
| 011 | Adaptive chunk sizing | Adjust chunk size based on network conditions | P1 |
| 012 | Transfer progress tracking | Track bytes sent/received per chunk and overall | P0 |
| 013 | Transfer cancellation | Gracefully cancel in-progress transfers from either side | P0 |
| 014 | Transfer timeout configuration | Configurable timeouts for idle and total transfer duration | P0 |
| 015 | Bandwidth throttling | Limit upload/download speed to avoid saturating connections | P1 |
| 016 | Transfer queuing | Queue multiple transfers and process sequentially or concurrently | P1 |
| 017 | Transfer prioritization | Reorder queued transfers by priority | P2 |
| 018 | One-to-many transfer | Send the same file to multiple recipients simultaneously | P1 |
| 019 | Many-to-one collection | Receive files from multiple senders into a single session | P2 |
| 020 | Transfer receipt confirmation | Sender receives cryptographic proof of successful delivery | P0 |
| 021 | Transfer size limits | Configurable max file/transfer size with clear error messages | P0 |
| 022 | Zero-length file handling | Correctly handle empty files without errors | P1 |
| 023 | Symlink handling policy | Option to follow, skip, or error on symbolic links | P1 |
| 024 | Hard link detection | Detect and deduplicate hard-linked files in folder transfers | P2 |
| 025 | Sparse file support | Preserve sparse file holes during transfer | P2 |
| 026 | Transfer deduplication | Skip re-sending unchanged files in repeated folder transfers | P1 |
| 027 | Delta/diff transfers | Send only changed blocks for files that already exist on receiver | P2 |
| 028 | Compression pre-transfer | Optional zstd compression before encryption | P1 |
| 029 | Compression auto-detection | Skip compression for already-compressed formats (jpg, mp4, zip) | P1 |
| 030 | Transfer session persistence | Save session state to disk for crash recovery | P1 |
| 031 | Atomic file writes on receive | Write to temp file, rename on completion to prevent partial files | P0 |
| 032 | Conflict resolution policy | Configurable behavior for filename conflicts (overwrite, rename, skip, prompt) | P1 |
| 033 | Transfer manifest | Generate and verify a manifest of all files in a multi-file transfer | P0 |
| 034 | Manifest signing | Cryptographically sign the transfer manifest | P0 |
| 035 | Bidirectional transfer | Both parties can send and receive within the same session | P2 |
| 036 | Pipe/stdin support | Accept data from stdin for transfer (e.g., `tar cf - . \| tallow send`) | P1 |
| 037 | Pipe/stdout support | Output received data to stdout (e.g., `tallow receive \| tar xf -`) | P1 |
| 038 | Transfer retry with backoff | Automatic retry on transient failures with exponential backoff | P0 |
| 039 | Maximum retry configuration | Configurable retry count and backoff parameters | P1 |
| 040 | Transfer completion hooks | Execute user-defined commands on transfer complete/fail | P2 |

---

## 2. Cryptography & Key Management

| #   | Feature | Description | Priority |
|-----|---------|-------------|----------|
| 041 | ML-KEM-1024 key encapsulation | Post-quantum KEM for key exchange (NIST FIPS 203) | P0 |
| 042 | ML-DSA-87 signatures | Post-quantum digital signatures (NIST FIPS 204) | P0 |
| 043 | X25519 key exchange | Classical ECDH for hybrid key exchange | P0 |
| 044 | Ed25519 signatures | Classical digital signatures as secondary layer | P0 |
| 045 | Hybrid KEM construction | Combine ML-KEM + X25519 so compromise of either alone doesn't break security | P0 |
| 046 | Hybrid signature construction | Combine ML-DSA + Ed25519 for dual-algorithm signing | P0 |
| 047 | AES-256-GCM payload encryption | Symmetric encryption for file data with authenticated encryption | P0 |
| 048 | ChaCha20-Poly1305 alternative | Alternative AEAD cipher for platforms without AES-NI | P1 |
| 049 | Cipher negotiation | Sender and receiver agree on cipher suite during handshake | P1 |
| 050 | Per-chunk nonce derivation | Derive unique nonces per chunk from a master nonce + counter | P0 |
| 051 | Nonce-misuse resistance | Use SIV or similar construction to resist nonce reuse catastrophes | P1 |
| 052 | Key derivation with HKDF-SHA-512 | Derive symmetric keys from shared secret using HKDF | P0 |
| 053 | Separate keys per direction | Derive independent encryption keys for send vs. receive channels | P0 |
| 054 | Key separation by purpose | Distinct derived keys for encryption, MAC, metadata, each sub-protocol | P0 |
| 055 | Session key rotation | Rotate symmetric keys after configurable byte/time thresholds | P1 |
| 056 | Forward secrecy | Ephemeral key pairs per session ensure past sessions can't be decrypted | P0 |
| 057 | Post-compromise security | Ratchet mechanism to recover security after key compromise | P2 |
| 058 | Double-ratchet protocol | Integrate Signal-style double ratchet for ongoing sessions | P2 |
| 059 | Key confirmation | Both parties confirm they derived the same session key (MAC-based) | P0 |
| 060 | Identity key generation | Generate long-term identity keypair (Ed25519 + ML-DSA) | P0 |
| 061 | Identity key storage | Store identity keys in encrypted keyfile | P0 |
| 062 | Keyfile passphrase encryption | Encrypt keyfile at rest with Argon2id-derived key | P0 |
| 063 | Argon2id parameterization | Configurable memory/time/parallelism for passphrase hashing | P0 |
| 064 | Keyfile format versioning | Version-tagged keyfile format for future migration | P0 |
| 065 | Key backup export | Export identity key in portable encrypted format | P1 |
| 066 | Key backup import | Import identity key from backup | P1 |
| 067 | Paper key backup | Generate BIP39/SLIP39-style mnemonic for key backup | P2 |
| 068 | Key revocation | Publish revocation statement for compromised keys | P1 |
| 069 | Key expiration | Optional expiration date on identity keys | P2 |
| 070 | Ephemeral keypair generation | Fresh keypairs per transfer session | P0 |
| 071 | Ephemeral key zeroization | Securely wipe ephemeral keys from memory after use | P0 |
| 072 | Memory zeroization on drop | `zeroize` crate integration for all sensitive data types | P0 |
| 073 | Mlock for sensitive memory | Lock key material pages to prevent swapping to disk | P0 |
| 074 | Constant-time comparisons | Use constant-time equality checks for MACs, signatures, tokens | P0 |
| 075 | Side-channel resistance | Constant-time implementations for all crypto operations | P0 |
| 076 | CSPRNG exclusive usage | All randomness from OS CSPRNG (getrandom/urandom) | P0 |
| 077 | Randomness health check | Verify entropy source on startup | P1 |
| 078 | Crypto library pinning | Pin exact versions of crypto dependencies with hash verification | P0 |
| 079 | No custom crypto primitives | Use only audited, established libraries (ring, RustCrypto, pqcrypto) | P0 |
| 080 | HMAC-SHA-512 for authentication | HMAC for per-chunk and manifest authentication | P0 |
| 081 | Encrypt-then-MAC construction | Always encrypt first, then MAC the ciphertext | P0 |
| 082 | Associated data in AEAD | Bind metadata (chunk index, file ID, session ID) as AAD | P0 |
| 083 | Protocol version in AAD | Include protocol version in AEAD associated data to prevent downgrade | P0 |
| 084 | SAS verification | Short Authentication String for manual out-of-band key verification | P1 |
| 085 | SAS emoji encoding | Display SAS as emoji sequence for easier human comparison | P2 |
| 086 | QR code key verification | Generate QR code of fingerprint for in-person verification | P2 |
| 087 | Key fingerprint display | Show human-readable key fingerprints (hex or base32) | P0 |
| 088 | Key fingerprint comparison | CLI command to compare two fingerprints side-by-side | P1 |
| 089 | Trust-on-first-use (TOFU) | Remember peer keys on first contact, warn on change | P0 |
| 090 | Known-hosts database | SQLite store of trusted peer identity keys | P0 |
| 091 | Key change alerts | Prominent warning when a known peer's key changes | P0 |
| 092 | Key pinning strict mode | Reject connections from peers whose keys have changed | P1 |
| 093 | Multi-device key management | Associate multiple device keys with a single identity | P2 |
| 094 | Key signing / web of trust | Sign other users' keys to vouch for identity | P2 |
| 095 | Crypto agility framework | Pluggable crypto backend for future algorithm swaps | P1 |
| 096 | Algorithm negotiation protocol | Version-tagged algorithm set negotiation during handshake | P1 |
| 097 | Downgrade attack prevention | Reject algorithm sets below minimum security level | P0 |
| 098 | Encrypted metadata channel | Separate encrypted channel for filenames, sizes, timestamps | P0 |
| 099 | Deniable encryption | Optional deniability layer where ciphertext is indistinguishable | P2 |
| 100 | Cryptographic audit logging | Log all crypto operations (no secrets) for post-incident analysis | P1 |

---

## 3. Security Hardening

| #   | Feature | Description | Priority |
|-----|---------|-------------|----------|
| 101 | TLS 1.3 relay connection | All relay communication over TLS 1.3 minimum | P0 |
| 102 | Certificate pinning for relay | Pin relay's TLS certificate to prevent MITM | P0 |
| 103 | Relay identity verification | Verify relay identity with pre-shared public key | P0 |
| 104 | E2E encryption independent of TLS | Application-layer encryption so relay compromise doesn't expose data | P0 |
| 105 | Zero-knowledge relay design | Relay cannot decrypt or inspect transferred content | P0 |
| 106 | Relay sees no filenames | Filenames encrypted in metadata channel, invisible to relay | P0 |
| 107 | Relay sees no file sizes | Pad transfers to obscure actual file sizes from relay | P1 |
| 108 | Protocol obfuscation | Make Tallow traffic look like standard HTTPS to resist DPI | P1 |
| 109 | Domain fronting support | Optional domain fronting to disguise relay destination | P2 |
| 110 | Pluggable transport support | Interface for obfs4, meek, or custom transport plugins | P2 |
| 111 | Replay attack prevention | Nonces, timestamps, and sequence numbers to prevent replay | P0 |
| 112 | Reflection attack prevention | Distinct key derivation for sender vs. receiver roles | P0 |
| 113 | Session ID binding | Bind all messages to session ID to prevent cross-session attacks | P0 |
| 114 | Handshake timeout | Strict timeout on handshake completion to limit resource exhaustion | P0 |
| 115 | Maximum session duration | Configurable hard limit on session lifetime | P1 |
| 116 | Rate limiting on sender | Limit outbound connection rate to prevent abuse detection | P1 |
| 117 | Input validation everywhere | Validate all incoming data lengths, formats, ranges before processing | P0 |
| 118 | Maximum message size enforcement | Reject messages exceeding expected sizes | P0 |
| 119 | No unsafe Rust by default | Zero `unsafe` blocks in application code (only in vetted dependencies) | P0 |
| 120 | Fuzzing harness | libfuzzer/AFL harness for protocol parser, crypto envelope, serialization | P0 |
| 121 | Property-based testing | proptest for invariant verification of crypto and protocol logic | P0 |
| 122 | Sandboxing — seccomp (Linux) | Restrict syscalls after initialization | P1 |
| 123 | Sandboxing — Landlock (Linux) | Restrict filesystem access to only necessary paths | P1 |
| 124 | Sandboxing — pledge/unveil (OpenBSD) | OS-level privilege restriction | P2 |
| 125 | Sandboxing — sandbox_init (macOS) | App Sandbox for macOS builds | P2 |
| 126 | Privilege drop after setup | Drop root/elevated privileges after binding ports | P1 |
| 127 | No network access during crypto | Ensure key generation and encryption happen offline-capable | P0 |
| 128 | Dependency auditing (cargo-audit) | Automated CVE scanning of all dependencies | P0 |
| 129 | Dependency minimization | Minimize dependency tree to reduce attack surface | P0 |
| 130 | Supply chain verification | Verify crate checksums and signatures | P0 |
| 131 | Reproducible builds | Deterministic compilation for build verification | P1 |
| 132 | Binary signing | Sign release binaries with project key | P1 |
| 133 | SBOM generation | Software Bill of Materials for every release | P1 |
| 134 | Secure temp file handling | Create temp files in secure directories with restricted permissions | P0 |
| 135 | Temp file cleanup on crash | Ensure temp files are cleaned up even on panic/SIGKILL | P0 |
| 136 | File permission preservation | Preserve Unix permissions (configurable) during transfer | P1 |
| 137 | Restrictive default file permissions | Received files default to 600 (owner-only) | P0 |
| 138 | Path traversal prevention | Reject filenames containing `../` or absolute paths | P0 |
| 139 | Filename sanitization | Strip or encode dangerous characters in received filenames | P0 |
| 140 | Zip-slip prevention | Validate archive extraction paths stay within target directory | P0 |
| 141 | Symlink attack prevention | Don't follow symlinks when writing received files | P0 |
| 142 | Race condition prevention | Atomic operations for file creation and state transitions | P0 |
| 143 | Anti-tampering for binary | Checksum verification of own binary on startup (optional) | P2 |
| 144 | Canary token detection | Detect and warn about potential canary/tracking files | P2 |
| 145 | Encrypted config file | Store configuration encrypted at rest | P1 |
| 146 | Config file permissions check | Warn if config file has overly permissive permissions | P0 |
| 147 | Secrets never in CLI args | Accept secrets via env vars, stdin, or file — never command-line arguments | P0 |
| 148 | Secrets never in logs | Redact all sensitive data from log output | P0 |
| 149 | Process memory protection | Prevent core dumps from containing sensitive data | P1 |
| 150 | ASLR compatibility | Ensure binary is compiled with ASLR/PIE support | P0 |
| 151 | Stack canaries | Compile with stack protection flags | P0 |
| 152 | Fortify source | Compile with buffer overflow detection | P1 |
| 153 | Control Flow Integrity | Enable CFI where supported by compiler | P2 |
| 154 | Panic = abort | Configure panic behavior to abort (prevent unwinding information leaks) | P1 |
| 155 | Connection flood protection | Rate limit new connections at application level | P1 |
| 156 | Slowloris protection | Timeout on slow/incomplete handshakes | P1 |
| 157 | Resource exhaustion limits | Cap memory, file descriptors, and thread usage | P0 |
| 158 | Graceful degradation | Maintain security guarantees under resource pressure | P1 |
| 159 | Security-focused CI pipeline | Run clippy, miri, ASAN, cargo-audit on every commit | P0 |
| 160 | Threat model documentation | Documented threat model with explicit non-goals | P0 |

---

## 4. Privacy & Anonymity

| #   | Feature | Description | Priority |
|-----|---------|-------------|----------|
| 161 | Tor SOCKS5 proxy support | Route all relay traffic through Tor | P0 |
| 162 | Configurable SOCKS5 address | Custom SOCKS5 proxy address (default 127.0.0.1:9050) | P0 |
| 163 | Tor authentication support | SOCKS5 username/password auth for Tor stream isolation | P1 |
| 164 | Per-transfer Tor circuit isolation | New Tor circuit per transfer session via IsolateSOCKSAuth | P1 |
| 165 | Tor-only mode | Refuse to connect without Tor; fail closed | P1 |
| 166 | Tor reachability check | Verify Tor connectivity before initiating transfer | P0 |
| 167 | Onion service relay support | Connect to relay as a Tor onion service (.onion address) | P1 |
| 168 | Onion service hosting | Run personal relay as onion service | P2 |
| 169 | I2P support (experimental) | Optional I2P proxy as Tor alternative | P2 |
| 170 | No IP leaks to relay | Verify no direct connections bypass SOCKS5 proxy | P0 |
| 171 | DNS leak prevention | All DNS resolution through Tor/SOCKS5 when enabled | P0 |
| 172 | WebRTC leak prevention (GUI) | Disable WebRTC in GUI to prevent IP leaks | P1 |
| 173 | No identifying user agent | Don't send identifying information in protocol headers | P0 |
| 174 | No client fingerprinting | Normalize protocol messages to prevent fingerprinting | P1 |
| 175 | Padding for traffic analysis resistance | Pad messages to fixed sizes to resist traffic analysis | P1 |
| 176 | Timing attack mitigation | Add random delays to resist timing correlation | P1 |
| 177 | Dummy traffic generation | Optional cover traffic to mask real transfer patterns | P2 |
| 178 | Transfer size obfuscation | Pad file sizes to nearest power-of-two or configurable granularity | P1 |
| 179 | Metadata stripping — images | Strip EXIF, GPS, camera info from images before sending | P1 |
| 180 | Metadata stripping — documents | Strip author, revision history, comments from documents | P1 |
| 181 | Metadata stripping — video | Strip geolocation and device info from video files | P2 |
| 182 | Metadata stripping — audio | Strip ID3 tags and recording device info | P2 |
| 183 | Metadata stripping — PDF | Strip author, creation tool, timestamps from PDFs | P1 |
| 184 | Configurable metadata stripping | Choose which metadata categories to strip | P1 |
| 185 | Filename obfuscation option | Replace filenames with random UUIDs during transfer | P1 |
| 186 | Timestamp obfuscation | Option to normalize file timestamps (e.g., epoch zero) | P1 |
| 187 | No transfer history by default | Don't persist transfer records unless explicitly enabled | P0 |
| 188 | Encrypted transfer history | If transfer history is enabled, encrypt it at rest | P1 |
| 189 | Transfer history expiration | Auto-delete transfer records after configurable time | P1 |
| 190 | Secure deletion of temp files | Overwrite temp files before unlinking (where FS supports it) | P1 |
| 191 | RAM-only mode | Option to keep all state in RAM, never touch disk | P2 |
| 192 | Ephemeral identity mode | Generate throwaway identity for single-use transfers | P1 |
| 193 | No analytics/telemetry | Zero telemetry, crash reporting, or phone-home behavior | P0 |
| 194 | No auto-update phone home | Updates are manual or verified through reproducible builds | P0 |
| 195 | Plausible deniability mode | Encrypted container that could plausibly contain different content | P2 |
| 196 | Steganographic option | Experimental: embed transfer data in innocuous-looking files | P2 |
| 197 | Anonymous sender mode | Send files without revealing long-term identity | P1 |
| 198 | Anonymous receiver mode | Receive files without revealing long-term identity | P1 |
| 199 | Mutual anonymity mode | Both parties anonymous — relay-mediated with no identity exchange | P2 |
| 200 | Unlinkable transfers | Prevent relay from correlating multiple transfers to same user | P1 |
| 201 | Clock skew protection | Prevent timing metadata from revealing timezone/locale | P1 |
| 202 | Locale-independent protocol | Protocol doesn't leak system locale or language settings | P1 |
| 203 | OS fingerprint resistance | Normalize protocol fields to prevent OS identification | P1 |
| 204 | Network interface selection | Choose which network interface to use (avoid leaking VPN status) | P2 |
| 205 | Kill switch on Tor failure | Immediately abort transfer if Tor connection drops | P1 |
| 206 | Contact discovery privacy | No centralized directory — share keys out-of-band | P0 |
| 207 | Invite-only transfers | Transfers require pre-shared invite code | P0 |
| 208 | Burn-after-reading mode | Auto-delete files after first successful open/access | P2 |
| 209 | Expiring transfers | Transfer codes expire after configurable time | P0 |
| 210 | Self-destructing messages | Optional time-limited access to transferred files | P2 |

---

## 5. UX — CLI Interface

| #   | Feature | Description | Priority |
|-----|---------|-------------|----------|
| 211 | `tallow send <file>` | Minimal command to send a file | P0 |
| 212 | `tallow receive <code>` | Minimal command to receive a file | P0 |
| 213 | `tallow send <folder>` | Send entire folder recursively | P0 |
| 214 | `tallow send <glob>` | Send files matching glob pattern (e.g., `*.pdf`) | P1 |
| 215 | `tallow send --stdin` | Send data from stdin pipe | P1 |
| 216 | `tallow receive --stdout` | Output received data to stdout | P1 |
| 217 | Human-readable transfer codes | Wordlist-based codes (e.g., `7-guitar-castle-river`) | P0 |
| 218 | Configurable code word count | Adjust code length for security/usability tradeoff | P1 |
| 219 | Custom code passphrase | Override generated code with user-chosen passphrase | P1 |
| 220 | Code copy-to-clipboard | Auto-copy transfer code to clipboard (with `--no-clipboard` opt-out) | P1 |
| 221 | Progress bar | Rich progress bar with speed, ETA, percentage | P0 |
| 222 | Multi-file progress | Per-file and overall progress for multi-file transfers | P0 |
| 223 | Spinner for indeterminate operations | Spinner during handshake, connection setup | P0 |
| 224 | Color-coded output | Colored output for status, warnings, errors (respects NO_COLOR) | P0 |
| 225 | NO_COLOR support | Respect `NO_COLOR` environment variable | P0 |
| 226 | Quiet mode (`-q`) | Suppress all output except errors | P0 |
| 227 | Verbose mode (`-v/-vv/-vvv`) | Increasing verbosity levels for debugging | P0 |
| 228 | JSON output mode (`--json`) | Machine-parseable JSON output for scripting | P1 |
| 229 | Output format selection | Choose between human, json, and minimal output formats | P1 |
| 230 | `tallow init` | Initialize identity key and configuration interactively | P0 |
| 231 | `tallow config` | View and set configuration values | P0 |
| 232 | `tallow config edit` | Open config file in $EDITOR | P1 |
| 233 | `tallow key show` | Display public key fingerprint | P0 |
| 234 | `tallow key export` | Export public key for sharing | P0 |
| 235 | `tallow key import <key>` | Import a peer's public key to known-hosts | P0 |
| 236 | `tallow key list` | List all known peer keys | P0 |
| 237 | `tallow key revoke` | Revoke current identity key | P1 |
| 238 | `tallow key verify <peer>` | Interactive SAS/fingerprint verification | P1 |
| 239 | `tallow status` | Show current configuration, relay status, Tor status | P0 |
| 240 | `tallow relay ping` | Test relay connectivity and latency | P0 |
| 241 | `tallow relay info` | Show relay version, capabilities, supported algorithms | P1 |
| 242 | `tallow history` | Show transfer history (if enabled) | P1 |
| 243 | `tallow history clear` | Securely delete transfer history | P1 |
| 244 | `tallow completions <shell>` | Generate shell completions (bash, zsh, fish, PowerShell) | P1 |
| 245 | Tab completion for files | Context-aware tab completion for file paths | P1 |
| 246 | Tab completion for subcommands | Complete subcommands, flags, and options | P1 |
| 247 | `--help` for every subcommand | Comprehensive help text with examples | P0 |
| 248 | Man page generation | Generate man pages from CLI definitions | P2 |
| 249 | `tallow version` | Show version, build info, linked crypto libraries | P0 |
| 250 | `tallow selfcheck` | Run self-diagnostic (crypto, connectivity, config validation) | P1 |
| 251 | `--relay <url>` flag | Override configured relay for this transfer | P0 |
| 252 | `--tor` flag | Enable Tor for this transfer | P0 |
| 253 | `--no-tor` flag | Disable Tor even if configured as default | P0 |
| 254 | `--output <dir>` flag | Specify download directory | P0 |
| 255 | `--yes` flag | Auto-accept incoming transfers without prompting | P1 |
| 256 | `--dry-run` flag | Show what would be sent without actually sending | P1 |
| 257 | `--verify` flag | Extra verification step (SAS or fingerprint check) | P1 |
| 258 | `--compress` flag | Force compression on/off | P1 |
| 259 | `--encrypt-names` flag | Obfuscate filenames in transit | P1 |
| 260 | `--strip-metadata` flag | Strip file metadata before sending | P1 |
| 261 | `--password` flag | Require password from receiver before transfer starts | P1 |
| 262 | Environment variable configuration | All config options settable via `TALLOW_*` env vars | P0 |
| 263 | XDG base directory compliance | Config in `$XDG_CONFIG_HOME/tallow/`, data in `$XDG_DATA_HOME/tallow/` | P0 |
| 264 | Config file (TOML) | TOML configuration file with sensible defaults | P0 |
| 265 | Config file auto-creation | Create default config on first run | P0 |
| 266 | Config validation on load | Validate config values and report errors clearly | P0 |
| 267 | Receive approval prompt | Show incoming file details and prompt for accept/reject | P0 |
| 268 | Transfer summary on complete | Show summary (files, size, duration, speed, verification status) | P0 |
| 269 | Error messages with remediation | Every error message includes what to try next | P0 |
| 270 | Internationalization framework | i18n support for error messages and UI text | P2 |

---

## 6. UX — TUI / Interactive Mode

| #   | Feature | Description | Priority |
|-----|---------|-------------|----------|
| 271 | `tallow interactive` | Launch full-screen terminal UI | P2 |
| 272 | File browser pane | Navigate filesystem to select files for sending | P2 |
| 273 | Directory tree view | Collapsible tree view for folder contents | P2 |
| 274 | File preview pane | Preview text files, show metadata for binaries | P2 |
| 275 | Transfer queue panel | View and manage pending/active transfers | P2 |
| 276 | Active transfer monitor | Real-time transfer status with per-file progress | P2 |
| 277 | Connection status indicator | Show relay connection, Tor status, key info | P2 |
| 278 | Keyboard shortcut overlay | Help screen showing all keyboard shortcuts | P2 |
| 279 | Vi-style keybindings | Navigate with hjkl, search with `/` | P2 |
| 280 | Emacs keybindings option | Alternative keybinding set | P2 |
| 281 | File selection with spacebar | Toggle file selection for batch operations | P2 |
| 282 | Bulk select with patterns | Select files by pattern (e.g., `*.rs`) | P2 |
| 283 | Search within file list | Fuzzy search to find files by name | P2 |
| 284 | Sort file list | Sort by name, size, date, type | P2 |
| 285 | Filter file list | Filter by extension, size range, date range | P2 |
| 286 | Transfer history panel | View past transfers with search | P2 |
| 287 | Peer list panel | Show known peers with trust status | P2 |
| 288 | Configuration panel | View and edit settings in TUI | P2 |
| 289 | Log viewer panel | Scrollable log output with severity filtering | P2 |
| 290 | Split pane layout | Multiple visible panes (file browser + transfer monitor) | P2 |
| 291 | Resizable panes | Drag pane borders to resize | P2 |
| 292 | Tab navigation | Multiple tabs for different views | P2 |
| 293 | Modal dialogs | Confirmation dialogs for dangerous operations | P2 |
| 294 | Toast notifications | Non-blocking notifications for completed transfers | P2 |
| 295 | Status bar | Persistent status bar with key metrics | P2 |
| 296 | Theming support | Color themes (dark, light, high contrast, custom) | P2 |
| 297 | Unicode support | Full Unicode rendering for filenames | P2 |
| 298 | Terminal size adaptation | Graceful layout adaptation to terminal dimensions | P2 |
| 299 | Mouse support | Click to select, scroll, resize panes | P2 |
| 300 | Drag selection | Click-drag to select multiple files | P2 |
| 301 | Context menu | Right-click context menu for file operations | P2 |
| 302 | Quick-send shortcut | Select files and press `s` to immediately start send flow | P2 |
| 303 | Quick-receive shortcut | Press `r` to enter receive mode and paste code | P2 |
| 304 | Clipboard paste for codes | Paste transfer code from clipboard in receive mode | P2 |
| 305 | File size display (human readable) | Show sizes as KB, MB, GB with color coding for large files | P2 |
| 306 | Transfer speed graph | ASCII/braille graph of transfer speed over time | P2 |
| 307 | Bandwidth allocation display | Show bandwidth usage per transfer | P2 |
| 308 | Notification sound | Optional terminal bell on transfer complete | P2 |
| 309 | Session persistence | Save TUI state between restarts | P2 |
| 310 | Accessibility mode | High-contrast, screen-reader-friendly output mode | P2 |

---

## 7. UX — Desktop GUI / Drag-and-Drop

| #   | Feature | Description | Priority |
|-----|---------|-------------|----------|
| 311 | Native desktop app shell | Cross-platform desktop app (Tauri or similar lightweight framework) | P2 |
| 312 | Drag-and-drop files to send | Drop files onto app window to initiate send | P2 |
| 313 | Drag-and-drop folders to send | Drop entire folders onto app window | P2 |
| 314 | Drag-and-drop from file manager | Accept drops from OS file manager (Finder, Explorer, Nautilus) | P2 |
| 315 | Drag-and-drop to receive location | Drop received files to desired location | P2 |
| 316 | File picker dialog | Native file/folder picker as alternative to drag-and-drop | P2 |
| 317 | Drop zone visual feedback | Visual indicator when hovering files over drop zone | P2 |
| 318 | File type icons | Show file type icons for common formats | P2 |
| 319 | Transfer code display (large) | Large, clear display of transfer code with one-click copy | P2 |
| 320 | QR code display | Show QR code of transfer code for mobile scanning | P2 |
| 321 | Transfer progress visualization | Animated progress ring/bar for active transfers | P2 |
| 322 | System tray integration | Minimize to system tray, show transfer status in tray icon | P2 |
| 323 | Desktop notifications | OS-native notifications for transfer events | P2 |
| 324 | Multiple transfer windows | Support concurrent transfers in separate windows or tabs | P2 |
| 325 | Receive mode landing | Persistent receive mode with code entry field | P2 |
| 326 | Contact/peer list UI | Visual list of known peers with trust indicators | P2 |
| 327 | One-click send to known peer | Send directly to known peer without code exchange | P2 |
| 328 | Settings UI | Graphical settings panel for all configuration options | P2 |
| 329 | Dark mode / light mode | Respect OS theme or manual toggle | P2 |
| 330 | Transfer history view | Visual history of past transfers with search and filter | P2 |
| 331 | File preview on receive | Preview files (images, text) before accepting transfer | P2 |
| 332 | Right-click context menu integration | "Send with Tallow" in OS file manager context menu | P2 |
| 333 | Keyboard shortcuts | Full keyboard navigation without mouse | P2 |
| 334 | Accessibility (ARIA, screen readers) | Full accessibility support for GUI elements | P2 |
| 335 | Auto-start on login | Optional auto-start with system for receive-ready mode | P2 |
| 336 | Multi-language GUI | Localized interface following system language | P2 |
| 337 | Onboarding wizard | First-run setup wizard for identity key and relay configuration | P2 |
| 338 | Connection status dashboard | Visual dashboard showing relay, Tor, and security status | P2 |
| 339 | Update notification | In-app notification when new version is available | P2 |
| 340 | Minimal resource footprint | GUI uses < 50MB RAM when idle, < 5% CPU during transfer | P2 |

---

## 8. File & Folder Handling

| #   | Feature | Description | Priority |
|-----|---------|-------------|----------|
| 341 | Recursive folder traversal | Walk directory tree with configurable depth limit | P0 |
| 342 | `.tallowignore` file | Gitignore-style exclusion patterns for folder sends | P1 |
| 343 | Default ignore patterns | Auto-skip `.DS_Store`, `Thumbs.db`, `.git/`, `node_modules/` | P1 |
| 344 | Include/exclude flags | `--include "*.rs"` and `--exclude "*.log"` patterns | P1 |
| 345 | File size filter | `--max-size 100MB` to skip files above threshold | P1 |
| 346 | Hidden file handling | Option to include/exclude dotfiles | P1 |
| 347 | Empty directory preservation | Send and recreate empty directories | P1 |
| 348 | File permission transfer | Preserve Unix mode bits (configurable) | P1 |
| 349 | Ownership transfer (optional) | Transfer UID/GID information (apply as available) | P2 |
| 350 | Extended attribute transfer | Preserve xattrs where supported | P2 |
| 351 | ACL transfer (optional) | Preserve POSIX ACLs where supported | P2 |
| 352 | Timestamp preservation | Preserve mtime, atime (configurable) | P1 |
| 353 | Creation date preservation | Preserve birthtime on supported filesystems | P2 |
| 354 | File integrity checksums | SHA-256 checksum for every transferred file | P0 |
| 355 | Checksum verification on receive | Automatic integrity check after each file | P0 |
| 356 | Checksum manifest file | Generate `.tallow-checksums` file with all hashes | P1 |
| 357 | Large file support (>4GB) | Handle files exceeding 4GB correctly (64-bit sizes) | P0 |
| 358 | Very large file support (>100GB) | Tested and optimized for files over 100GB | P1 |
| 359 | Millions-of-files support | Handle directories with millions of small files efficiently | P1 |
| 360 | File type detection | Detect file type by magic bytes, not just extension | P1 |
| 361 | Archive auto-creation | Optionally auto-tar folders before sending for efficiency | P2 |
| 362 | Archive auto-extraction | Optionally auto-extract received archives | P2 |
| 363 | Selective extraction | Choose specific files from a multi-file transfer to accept | P2 |
| 364 | Filename encoding normalization | Handle Unicode normalization (NFC/NFD) across platforms | P1 |
| 365 | Long path support (Windows) | Handle paths exceeding 260 characters on Windows | P1 |
| 366 | Case sensitivity handling | Handle case-sensitivity differences between filesystems | P1 |
| 367 | Reserved name handling (Windows) | Rename files with Windows-reserved names (CON, PRN, etc.) | P1 |
| 368 | Special character handling | Handle all valid Unix filenames including spaces, newlines, etc. | P0 |
| 369 | File locking detection | Warn if file is locked/in-use before sending | P1 |
| 370 | Open file handling | Option to copy-on-read for files that may change during transfer | P1 |
| 371 | Filesystem space check | Verify sufficient disk space before receiving | P0 |
| 372 | Inode exhaustion check | Verify sufficient inodes before receiving many files | P2 |
| 373 | Partial receive cleanup | Clean up partial files on transfer failure (configurable) | P1 |
| 374 | Received file quarantine | Place received files in quarantine directory until verified | P2 |
| 375 | Virus scan integration | Hook for ClamAV or other scanner on received files | P2 |
| 376 | File type allowlist/blocklist | Only accept/reject specific file types | P1 |
| 377 | Executable receive warning | Warn before accepting executable files | P1 |
| 378 | Download directory configuration | Default download location with per-transfer override | P0 |
| 379 | Organized receive directories | Auto-organize received files by date, sender, or transfer ID | P2 |
| 380 | File watch mode | Watch a directory and auto-send new/changed files | P2 |

---

## 9. Relay & Network Architecture

| #   | Feature | Description | Priority |
|-----|---------|-------------|----------|
| 381 | Single relay binary | Relay server as separate binary/crate in same workspace | P0 |
| 382 | Relay Docker image | Official Docker image for relay deployment | P0 |
| 383 | Relay docker-compose | One-file deployment with docker-compose | P0 |
| 384 | Relay systemd service file | Production systemd unit for Linux deployment | P1 |
| 385 | Relay Oracle Cloud free tier deployment | Documented deployment on Oracle Cloud free ARM instances | P0 |
| 386 | Relay Terraform/OpenTofu config | IaC for Oracle Cloud relay infrastructure | P1 |
| 387 | Relay auto-TLS (Let's Encrypt) | Automatic TLS certificate provisioning via ACME | P0 |
| 388 | Relay certificate auto-renewal | Automatic cert renewal before expiration | P0 |
| 389 | Relay stateless design | Relay holds no persistent state — pure message forwarding | P0 |
| 390 | Relay authentication | Clients authenticate to relay (prevent open relay abuse) | P0 |
| 391 | Relay access tokens | Short-lived tokens for relay access | P1 |
| 392 | Relay invite-only mode | Relay only accepts connections with valid invite tokens | P1 |
| 393 | Relay rate limiting | Per-client rate limiting for connections and bandwidth | P0 |
| 394 | Relay connection limits | Maximum concurrent connections per client and global | P0 |
| 395 | Relay bandwidth quotas | Per-client bandwidth quotas (daily/monthly) | P1 |
| 396 | Relay storage quotas | Maximum pending transfer size per client | P1 |
| 397 | Relay session timeout | Auto-close idle sessions after configurable timeout | P0 |
| 398 | Relay pending message expiry | Auto-delete unclaimed messages after timeout | P0 |
| 399 | Relay no-logging mode | Relay can operate with zero request logging | P1 |
| 400 | Relay minimal logging mode | Log only errors and connection counts, no identifying info | P0 |
| 401 | Relay metrics endpoint | Prometheus-compatible metrics (connections, bytes, errors) | P1 |
| 402 | Relay health endpoint | `/health` endpoint for monitoring and load balancers | P0 |
| 403 | Relay graceful shutdown | Drain active connections before shutting down | P0 |
| 404 | Relay hot reload config | Reload configuration without restart | P2 |
| 405 | Relay multi-instance support | Multiple relay instances behind a load balancer | P2 |
| 406 | Relay sticky sessions | Session affinity for load-balanced relay clusters | P2 |
| 407 | Relay WebSocket transport | WebSocket-based transport for firewall traversal | P1 |
| 408 | Relay HTTP/2 transport | HTTP/2-based transport as alternative | P2 |
| 409 | Relay QUIC transport | QUIC-based transport for performance on lossy networks | P2 |
| 410 | Relay custom domain support | Use custom domain name for relay | P1 |
| 411 | Multi-relay failover | Client falls back to secondary relay if primary is down | P1 |
| 412 | Relay selection by latency | Auto-select lowest-latency relay from list | P2 |
| 413 | Community relay discovery | Opt-in list of community-operated relays | P2 |
| 414 | Self-hosted relay guide | Comprehensive documentation for self-hosting | P0 |
| 415 | Relay firewall rules | Documented minimum firewall rules (iptables/nftables) | P0 |
| 416 | Relay hardening guide | Security hardening checklist for relay servers | P0 |
| 417 | Relay abuse prevention | Block/throttle misbehaving clients | P1 |
| 418 | Relay IPv6 support | Full IPv6 support for relay connections | P1 |
| 419 | Relay bandwidth monitoring | Real-time bandwidth usage monitoring per connection | P1 |
| 420 | Direct peer-to-peer mode | Optional direct P2P connection bypassing relay (when NAT allows) | P2 |

---

## 10. Authentication & Identity

| #   | Feature | Description | Priority |
|-----|---------|-------------|----------|
| 421 | Identity keypair generation | Generate long-term identity keypair on first run | P0 |
| 422 | Multiple identity profiles | Support multiple identities (personal, work, anonymous) | P2 |
| 423 | Identity profile switching | Easy switching between identity profiles | P2 |
| 424 | Contact/peer management | Store and label known peer identities | P1 |
| 425 | Contact nicknames | Assign human-readable nicknames to peer keys | P1 |
| 426 | Contact groups | Group contacts for organizational purposes | P2 |
| 427 | TOFU trust model | Trust on first use with key change detection | P0 |
| 428 | Manual key verification | Out-of-band key verification via fingerprint comparison | P0 |
| 429 | SAS code verification | Short Authentication String during initial connection | P1 |
| 430 | Trust levels | Unverified → verified → trusted progression for contacts | P1 |
| 431 | Trust level display | Show trust level for every peer interaction | P1 |
| 432 | Key change notification | Prominent warning when a known peer's key changes | P0 |
| 433 | Key change policy | Configurable: warn, prompt, or reject on key change | P1 |
| 434 | Passphrase-authenticated transfer | Require passphrase in addition to transfer code | P1 |
| 435 | PAKE authentication | Password-Authenticated Key Exchange for passphrase-based auth | P1 |
| 436 | Challenge-response authentication | Verify peer identity without revealing secret | P1 |
| 437 | One-time invite codes | Generate single-use invite codes for specific transfers | P1 |
| 438 | Invite code expiration | Invite codes auto-expire after configurable time | P1 |
| 439 | Invite code rate limiting | Limit invite code generation to prevent abuse | P1 |
| 440 | Pre-authorized transfers | Authorize specific peers for instant-accept transfers | P2 |
| 441 | Transfer authorization rules | Rules: accept from verified peers, prompt for others, reject unknown | P2 |
| 442 | Device binding | Optionally bind identity to specific hardware (TPM, Secure Enclave) | P2 |
| 443 | Hardware token support | YubiKey/security key for identity key storage | P2 |
| 444 | SSH key import | Import existing SSH keys as Tallow identity | P2 |
| 445 | Age key import | Import age encryption keys | P2 |
| 446 | WireGuard key import | Import WireGuard keys for identity | P2 |
| 447 | GPG key cross-signing | Cross-sign Tallow and GPG keys for web of trust integration | P2 |
| 448 | Key transparency log | Optional publish to key transparency log for auditing | P2 |
| 449 | Identity recovery | Recover identity from backup/mnemonic | P1 |
| 450 | Identity deletion | Securely destroy identity key and all associated data | P1 |

---

## 11. Observability & Diagnostics

| #   | Feature | Description | Priority |
|-----|---------|-------------|----------|
| 451 | Structured logging (tracing) | Use Rust `tracing` crate for structured, leveled logs | P0 |
| 452 | Log levels (error/warn/info/debug/trace) | Standard severity levels with runtime filtering | P0 |
| 453 | Log to stderr | All log output to stderr, transfer output to stdout | P0 |
| 454 | Log to file | Optional file logging with rotation | P1 |
| 455 | Log redaction | Automatic redaction of keys, tokens, IPs in logs | P0 |
| 456 | Log format options | Human-readable, JSON, and compact log formats | P1 |
| 457 | Request/session tracing | Unique trace IDs per transfer session | P1 |
| 458 | Performance timing | Log timing for key operations (handshake, encryption, transfer) | P1 |
| 459 | Transfer statistics | Detailed per-transfer statistics (speed, retries, compression ratio) | P1 |
| 460 | Aggregate statistics | Cumulative stats across all transfers (if history enabled) | P2 |
| 461 | Network diagnostics | `tallow diagnose` command to test all connectivity | P1 |
| 462 | Tor circuit info | Display Tor circuit details when connected through Tor | P1 |
| 463 | Crypto self-test | Verify crypto primitives produce expected outputs on startup | P1 |
| 464 | Handshake debug mode | Detailed handshake step-by-step output for troubleshooting | P1 |
| 465 | Connection state machine logging | Log all state transitions for protocol debugging | P1 |
| 466 | MTU/path discovery logging | Log network path characteristics for performance tuning | P2 |
| 467 | Error categorization | Categorize errors (network, crypto, filesystem, protocol, user) | P0 |
| 468 | Error codes | Unique error codes for every failure mode | P0 |
| 469 | Troubleshooting guide | Error code → resolution mapping in documentation and `--help` | P0 |
| 470 | Debug bundle export | `tallow debug-bundle` generates redacted diagnostic archive | P1 |
| 471 | Relay-side diagnostics | Relay logs connection stats without identifying data | P1 |
| 472 | Transfer speed benchmarking | `tallow benchmark` command to test throughput | P2 |
| 473 | Crypto benchmarking | Benchmark all crypto operations for the current platform | P2 |
| 474 | OpenTelemetry export (optional) | Optional OTLP export for relay operators | P2 |
| 475 | Health check command | `tallow health` checks config, keys, relay, Tor in one command | P1 |

---

## 12. Platform & Distribution

| #   | Feature | Description | Priority |
|-----|---------|-------------|----------|
| 476 | Linux x86_64 binary | Statically linked Linux binary | P0 |
| 477 | Linux ARM64 binary | ARM64 binary for Raspberry Pi, Oracle Cloud ARM | P0 |
| 478 | macOS x86_64 binary | macOS Intel binary | P0 |
| 479 | macOS ARM64 binary | macOS Apple Silicon binary | P0 |
| 480 | Windows x86_64 binary | Windows binary (MSVC or GNU toolchain) | P0 |
| 481 | Windows ARM64 binary | Windows ARM binary | P2 |
| 482 | FreeBSD binary | FreeBSD x86_64 binary | P2 |
| 483 | musl-based Linux build | Fully static musl binary for maximum portability | P1 |
| 484 | `cargo install tallow` | Install from crates.io | P0 |
| 485 | Homebrew formula | `brew install tallow` for macOS/Linux | P1 |
| 486 | APT/DEB package | Debian/Ubuntu package | P1 |
| 487 | RPM package | Fedora/RHEL/CentOS package | P2 |
| 488 | AUR package | Arch Linux AUR package | P2 |
| 489 | Nix package | Nixpkgs or Nix flake | P2 |
| 490 | Alpine APK | Alpine Linux package (for Docker images) | P2 |
| 491 | Snap package | Ubuntu Snap store package | P2 |
| 492 | Flatpak package | Flatpak for GUI version | P2 |
| 493 | Windows installer (MSI/WiX) | Proper Windows installer with PATH setup | P2 |
| 494 | Windows Scoop manifest | `scoop install tallow` | P2 |
| 495 | Windows winget manifest | `winget install tallow` | P2 |
| 496 | Docker image (CLI) | Docker image for ephemeral send/receive | P1 |
| 497 | CI/CD action (GitHub Actions) | `tallow-action` for secure file transfer in CI pipelines | P2 |
| 498 | Cross-compilation CI matrix | CI builds for all target platforms | P0 |
| 499 | Integration test suite | End-to-end transfer tests (send → relay → receive) across platforms | P0 |
| 500 | Release automation | Automated release pipeline: build, sign, package, publish | P1 |

---

## Priority Legend

| Priority | Meaning | Target |
|----------|---------|--------|
| **P0** | Must-have for v1.0 launch | Release blocker |
| **P1** | Should-have — high impact, build immediately after P0 | First 90 days post-launch |
| **P2** | Nice-to-have — builds competitive advantage or community appeal | Roadmap for v1.x |

---

## Summary by Category

| Category | Count | P0 | P1 | P2 |
|----------|-------|-----|-----|-----|
| Core Transfer Engine | 40 | 17 | 15 | 8 |
| Cryptography & Key Management | 60 | 29 | 17 | 14 |
| Security Hardening | 60 | 27 | 22 | 11 |
| Privacy & Anonymity | 50 | 8 | 25 | 17 |
| UX — CLI Interface | 60 | 25 | 26 | 9 |
| UX — TUI / Interactive Mode | 40 | 0 | 0 | 40 |
| UX — Desktop GUI / Drag-and-Drop | 30 | 0 | 0 | 30 |
| File & Folder Handling | 40 | 8 | 18 | 14 |
| Relay & Network Architecture | 40 | 14 | 15 | 11 |
| Authentication & Identity | 30 | 6 | 12 | 12 |
| Observability & Diagnostics | 25 | 6 | 12 | 7 |
| Platform & Distribution | 25 | 7 | 7 | 11 |
| **Total** | **500** | **147** | **169** | **184** |

---

## v1.0 Critical Path (P0 Features)

The 147 P0 features form the minimum viable secure transfer tool. The critical path through them is:

1. **Identity & Keys** → Generate identity, store encrypted, display fingerprint
2. **Crypto Pipeline** → Hybrid KEM handshake → HKDF → AEAD encryption → HMAC authentication
3. **Relay** → Deploy relay on Oracle Cloud free tier, TLS 1.3, zero-knowledge forwarding
4. **Transfer Protocol** → Chunked streaming, integrity verification, resumable transfers
5. **CLI** → `send` / `receive` with human-readable codes, progress bars, error messages
6. **Privacy** → Tor SOCKS5 integration, no telemetry, no metadata leaks
7. **Hardening** → Fuzzing, dependency auditing, sandboxing, input validation
8. **Distribution** → Cross-platform binaries, cargo install, CI/CD
