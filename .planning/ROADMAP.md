# Roadmap: Tallow

## Overview

Tallow is a brownfield Rust project — a 7-crate workspace with ~45% implementation and 4 critical security failures that are silent at runtime. The roadmap sequences work from the inside out: fix the broken crypto layer first (Phase 1), build the codec and transport foundation (Phase 2), wire the core send/receive pipeline (Phase 3), add persistence and CLI polish (Phase 4), layer on privacy and TUI differentiators (Phase 5), then audit and harden before release (Phase 6). Every phase delivers one coherent, independently testable capability. The tool cannot safely ship until Phase 6 completes.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Security Hardening** - Fix 15 critical/high crypto defects before any networking code is wired
- [x] **Phase 2: Wire Protocol, Transport and Relay** - Postcard codec, QUIC+TCP transports, working relay server
- [x] **Phase 3: File Transfer Pipeline** - End-to-end send/receive with compression, key exchange, integrity verification
- [ ] **Phase 4: Storage, CLI Commands and Polish** - Persistent identity/config, all CLI commands wired, transfer resume
- [ ] **Phase 5: Privacy, TUI and Discovery** - Tor/SOCKS5, DNS-over-HTTPS, Ratatui dashboard, mDNS, OS sandbox
- [ ] **Phase 6: Sandbox, Hardening and Security Audit** - Landlock, seccomp, structured logging, fuzz targets, full audit sweep

## Phase Details

### Phase 1: Security Hardening
**Goal**: The crypto layer provides the security it advertises — FIPS-compliant PQ algorithms, correct Argon2id parameters, working PAKE, key material pinned in RAM, no panics on bad input.
**Depends on**: Nothing (first phase)
**Requirements**: SECFIX-01, SECFIX-02, SECFIX-03, SECFIX-04, SECFIX-05, SECFIX-06, SECFIX-07, SECFIX-08, SECFIX-09, SECFIX-10, SECFIX-11, SECFIX-12, SECFIX-13, SECFIX-14, SECFIX-15
**Success Criteria** (what must be TRUE):
  1. `cargo test -p tallow-crypto` passes and ML-KEM-1024 key generation, encapsulation, and decapsulation succeed using the `ml-kem` crate against NIST FIPS 203 known-answer test vectors
  2. All hash and MAC comparisons in crypto paths use `subtle::ConstantTimeEq` — `grep -r " == \| != " crates/tallow-crypto/src/` finds zero matches on `[u8]` types outside `#[cfg(test)]`
  3. The CPace PAKE derives a session key that differs when different passwords are used and matches when the same password is used — an incorrect password produces `Err`, not a zero key
  4. Argon2id hashing with `Params::new(262144, 3, 4, None)` completes without error and `Argon2::default()` does not appear anywhere in non-test code
  5. All `.unwrap()` calls in non-test crypto code are replaced with `Result` returns — `cargo clippy -p tallow-crypto` passes with zero warnings
**Plans**: TBD

### Phase 2: Wire Protocol, Transport and Relay
**Goal**: A message can be encoded with postcard, sent over QUIC (or TCP+TLS fallback), routed through the relay server, and decoded on the other side — end-to-end framing and transport works.
**Depends on**: Phase 1
**Requirements**: WIRE-01, WIRE-02, WIRE-03, WIRE-04, XPORT-01, XPORT-02, XPORT-03, XPORT-04, RELAY-01, RELAY-02, RELAY-03, RELAY-04, RELAY-05, RELAY-06, RELAY-07
**Success Criteria** (what must be TRUE):
  1. All `Message` variants round-trip through `TallowCodec::encode` → `TallowCodec::decode` without data loss, and postcard is the serializer (bincode is absent from all codec paths)
  2. Two QUIC clients can connect to the relay server, join the same room by code phrase, and bytes sent by one arrive at the other via `DataForwarder` — verified by integration test
  3. When QUIC is blocked (simulated), the transport layer falls back to TCP+TLS and the same round-trip test passes
  4. The relay server runs within 50 MB RSS under a 100-concurrent-room load test — confirming it fits the 1 GB Oracle Cloud free tier constraint
  5. Stale rooms are removed after the configured timeout (default 60 seconds) and rate limiting rejects connections beyond the per-IP cap
**Plans**: TBD

### Phase 3: File Transfer Pipeline
**Goal**: A user can send a file from one terminal and receive it on another via the relay — the complete encrypt-compress-chunk-sign-send and receive-verify-decrypt-decompress-write pipeline works end-to-end.
**Depends on**: Phase 2
**Requirements**: XFER-01, XFER-02, XFER-03, XFER-04, XFER-05, XFER-06, XFER-07, XFER-08, XFER-09, XFER-10, XFER-11, XFER-12, XFER-13, COMP-01, COMP-02, COMP-03, KEX-01, KEX-02, KEX-03, KEX-04
**Success Criteria** (what must be TRUE):
  1. `tallow send <file>` generates a code phrase and completes transfer; `tallow receive <code>` receives and writes the file byte-for-byte identical to the source (verified by BLAKE3 hash comparison)
  2. A folder sent recursively via `tallow send <folder>` is received with complete directory structure and all file contents verified
  3. When a transfer is interrupted (process kill) and restarted, it resumes from the last verified chunk rather than restarting from byte zero
  4. The receiver displays a prompt with filename, size, and sender fingerprint before accepting, and typing `n` declines without writing any data
  5. Transfer progress shows current speed (MB/s), percentage complete, and ETA — updating at least once per second during active transfer
**Plans**: TBD

### Phase 4: Storage, CLI Commands and Polish
**Goal**: Tallow persists identity across runs, loads config from XDG paths, all CLI commands are wired to real implementations (no `todo!()`), and the tool behaves correctly as a Unix citizen.
**Depends on**: Phase 3
**Requirements**: STORE-01, STORE-02, STORE-03, STORE-04, STORE-05, CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, CLI-06, CLI-07, CLI-08, CLI-09, CLI-10, CLI-11, CLI-12
**Success Criteria** (what must be TRUE):
  1. On first run, an identity keypair is generated and saved to `~/.config/tallow/identity.enc`; on second run the same fingerprint is displayed without regenerating keys
  2. `tallow identity export` writes a portable keypair file; `tallow identity import <file>` restores it and the fingerprint matches — enabling device migration
  3. `tallow doctor` exits 0 and reports relay reachability, entropy availability, and DNS resolution status with actionable output when any check fails
  4. `tallow send --json` and `tallow receive --json` produce machine-parseable JSON output on stdout with structured progress events — `jq .` parses it without error
  5. Shell completions generated by `tallow completions bash` are valid bash completion script (source-able without errors)
**Plans**: TBD

### Phase 5: Privacy, TUI and Discovery
**Goal**: Users who need anonymity can route transfers through Tor; the Ratatui TUI dashboard shows live transfer state; local peers are discoverable without a relay.
**Depends on**: Phase 4
**Requirements**: PRIV-01, PRIV-02, PRIV-03, PRIV-04, TUI-01, TUI-02, TUI-03, TUI-04, TUI-05, TUI-06, TUI-07, TUI-08, DISC-01, DISC-02, DISC-03
**Success Criteria** (what must be TRUE):
  1. `tallow send --proxy socks5://127.0.0.1:9050 <file>` completes a transfer with all DNS queries going through the SOCKS5 proxy (no plaintext DNS — verified by absence of system resolver calls)
  2. `tallow tui` launches a Ratatui dashboard that shows identity fingerprint, relay connection status, active transfers with progress bars, and LAN-discovered peers — all panels render without panicking
  3. Two peers on the same LAN can complete a transfer via mDNS discovery without configuring a relay address — the transfer uses the direct LAN path
  4. When `tallow tui` is exited (q or Ctrl+C) or crashes, the terminal is restored to normal state and the screen is cleared (no residual transfer data visible)
  5. EXIF metadata is stripped from images when `--strip-metadata` is passed — the received file contains no GPS coordinates or device identifiers from the original
**Plans**: TBD

### Phase 6: Sandbox, Hardening and Security Audit
**Goal**: The release build passes a full security audit — OS sandboxed on Linux, no timing leaks, no unsafe code without justification, no CVEs, fuzz targets written, NIST test vectors pass.
**Depends on**: Phase 5
**Requirements**: SAND-01, SAND-02, SAND-03, SAND-04, SAND-05
**Success Criteria** (what must be TRUE):
  1. On Linux, `tallow` applies Landlock filesystem restrictions (only output directory writable) and seccomp syscall filtering — a strace of the process shows no syscalls outside the allowlist during a transfer
  2. `cargo clippy --workspace -- -D warnings` exits 0, `cargo audit` reports no vulnerabilities, and `cargo deny check` passes with no policy violations
  3. Fuzz targets for `TallowCodec` (encode/decode round-trips with arbitrary input) and filename sanitization (arbitrary received filenames) run for 60 seconds without panicking or triggering undefined behavior
  4. `tracing-subscriber` is initialized on startup and sensitive data (keys, passphrases, file contents) never appears in log output at any level — verified by grep on a trace-level log capture
  5. `cargo test --workspace` passes clean, including NIST KAT vector tests for ML-KEM-1024 and ML-DSA-87
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security Hardening | 5/5 | Complete | 2026-02-19 |
| 2. Wire Protocol, Transport and Relay | 4/4 | Complete | 2026-02-19 |
| 3. File Transfer Pipeline | 4/4 | Complete | 2026-02-19 |
| 4. Storage, CLI Commands and Polish | 0/TBD | Not started | - |
| 5. Privacy, TUI and Discovery | 0/TBD | Not started | - |
| 6. Sandbox, Hardening and Security Audit | 0/TBD | Not started | - |
