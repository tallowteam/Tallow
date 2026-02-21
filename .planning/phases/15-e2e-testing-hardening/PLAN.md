# Phase 15: End-to-End Testing & Hardening - Execution Plan

## Overview

Phase 15 adds integration tests, property tests, fuzz targets, and CI hardening to the Tallow workspace. The codebase currently has 648 unit tests across 7 crates and zero integration test files. This phase creates a layered test architecture from pipeline-level verification through full CLI binary tests, then adds CI workflows to enforce it.

## Current State

- **648 tests passing** (44 tallow + 88 tallow-crypto + 34 tallow-net + 157 tallow-protocol + 13 tallow-relay + 93 tallow-store + 182 tallow-tui + 2 tallow-relay bin + 35 tallow bin)
- **3 tests `#[ignore]`** in tallow-tui (widget tests)
- **Zero integration test files** (`crates/*/tests/` directories are empty or absent)
- **Dev-dependencies already present**: `assert_cmd` v2, `predicates` v3, `tempfile` v3 in tallow; `proptest` v1 in tallow-crypto + tallow-protocol; `tokio test-util` in relay + net + protocol
- **CI**: 3-OS matrix (ubuntu/macos/windows) with check, test, clippy, fmt, audit
- **Relay blocker**: `RelayServer::start()` does not return the bound address -- untestable with in-process harness

## Constraints

1. **One integration test file per crate** to avoid compile-time explosion (each `tests/*.rs` compiles as a separate binary)
2. **Large file tests marked `#[ignore]`** -- run only on demand or in a separate CI job
3. **`tokio::time::pause()` for deterministic timeout tests** -- avoid real clock waits in CI
4. **Fuzz targets are Unix+nightly only** -- separate CI job, never block the main pipeline
5. **Do not break existing 648 tests** -- all changes are additive
6. **Port `0` for all relay tests** -- let OS assign ports, extract bound address from endpoint
7. **`tempfile::TempDir` for all file I/O** -- no filesystem pollution between parallel tests
8. **Real crypto in tests** -- no stubs (AES-256-GCM at 64KB chunks is microseconds)

## Target File Structure

```
crates/
  tallow-protocol/
    tests/
      integration.rs           -- Wave 2: pipeline roundtrip tests
  tallow-relay/
    src/
      server.rs                -- Wave 1: modified (bind/serve split)
    tests/
      integration.rs           -- Wave 3: relay + QUIC client tests
  tallow/
    tests/
      integration.rs           -- Wave 4: CLI binary + E2E tests
fuzz/
  Cargo.toml                   -- Wave 4: fuzz workspace
  fuzz_targets/
    fuzz_codec_decode.rs
    fuzz_manifest_parse.rs
    fuzz_sanitize_filename.rs
.github/
  workflows/
    ci.yml                     -- Wave 5: updated with integration + fuzz jobs
```

---

## Wave 1: Relay Refactoring (Test Harness Foundation)

**Goal**: Split `RelayServer::start()` into `bind()` + `serve()` so integration tests can spawn a relay on `127.0.0.1:0`, get the bound address, and connect clients to it.

**Estimated work**: ~60 lines changed in `server.rs`, backward-compatible

### Task 1.1: Split `RelayServer::start()` into `bind()` + `serve()`

**File**: `crates/tallow-relay/src/server.rs`

Add two new public methods and refactor `start()` to call them:

```rust
/// Bound relay server ready to accept connections
pub struct BoundRelay {
    /// The QUIC endpoint (bound, listening)
    pub endpoint: quinn::Endpoint,
    /// The actual bound socket address (useful when binding to port 0)
    pub local_addr: SocketAddr,
}

impl RelayServer {
    /// Bind the relay server to its configured address.
    ///
    /// Returns a `BoundRelay` with the endpoint and actual bound address.
    /// Call `serve()` to start accepting connections.
    pub async fn bind(&self) -> anyhow::Result<BoundRelay> {
        let addr: SocketAddr = self.config.bind_addr.parse()
            .map_err(|e| anyhow::anyhow!("invalid bind address: {}", e))?;

        let identity = tallow_net::transport::tls_config::generate_self_signed()
            .map_err(|e| anyhow::anyhow!("TLS cert generation failed: {}", e))?;

        let server_config = tallow_net::transport::tls_config::quinn_server_config(&identity)
            .map_err(|e| anyhow::anyhow!("quinn server config failed: {}", e))?;

        let endpoint = quinn::Endpoint::server(server_config, addr)?;
        let local_addr = endpoint.local_addr()?;

        Ok(BoundRelay { endpoint, local_addr })
    }

    /// Accept connections on a bound endpoint until shutdown.
    ///
    /// This is the accept loop extracted from `start()`. The `BoundRelay`
    /// provides the endpoint to accept on.
    pub async fn serve(&self, bound: BoundRelay) -> anyhow::Result<()> {
        // ... existing accept loop code, using bound.endpoint instead of
        //     creating the endpoint inline
    }

    /// Start the relay server (convenience: bind + serve).
    ///
    /// Equivalent to `let bound = self.bind().await?; self.serve(bound).await`.
    pub async fn start(&self) -> anyhow::Result<()> {
        let bound = self.bind().await?;
        info!("relay server listening on {}", bound.local_addr);
        self.serve(bound).await
    }
}
```

**Verification**:
- `cargo test -p tallow-relay` passes (existing unit tests unchanged)
- `cargo clippy -p tallow-relay -- -D warnings` passes
- The `start()` method behavior is identical (backward-compatible)

### Task 1.2: Make `RoomManager::room_count()` available to integration tests

**File**: `crates/tallow-relay/src/room.rs`

The `room_count()` method is currently behind `#[cfg(test)]`, which means it is only visible to unit tests within the same crate. Integration tests (in `tests/`) are a separate compilation unit and cannot see `#[cfg(test)]` items. Change the gate:

```rust
// Before:
#[cfg(test)]
pub fn room_count(&self) -> usize { ... }

// After:
/// Get the number of active rooms (exposed for integration testing)
pub fn room_count(&self) -> usize { ... }
```

Since `RoomManager` is an internal type of `tallow-relay` (not re-exported to downstream crates), making this always-public has no API surface impact outside the relay crate.

### Task 1.3: Add `tallow-relay` test helper module

**File**: `crates/tallow-relay/tests/integration.rs` (stub, populated in Wave 3)

Create a minimal integration test file that validates the bind/serve split works:

```rust
//! Integration tests for tallow-relay

use tallow_relay::config::RelayConfig;
use tallow_relay::server::RelayServer;

/// Verify that bind() returns the correct address and serve() can be spawned
#[tokio::test(flavor = "multi_thread")]
async fn relay_binds_and_reports_address() {
    let config = RelayConfig {
        bind_addr: "127.0.0.1:0".to_string(),
        ..RelayConfig::default()
    };
    let server = RelayServer::new(config);
    let bound = server.bind().await.expect("bind should succeed");

    // Port should be nonzero (OS-assigned)
    assert_ne!(bound.local_addr.port(), 0);

    // Endpoint should be live
    assert!(bound.endpoint.local_addr().is_ok());
}
```

**Dev-dependency additions** for `tallow-relay/Cargo.toml`:
```toml
[dev-dependencies]
tokio = { workspace = true, features = ["test-util"] }  # already present
tempfile = "3"
```

### Wave 1 Verification Checklist

- [ ] `RelayServer` has `bind()`, `serve()`, and `start()` methods
- [ ] `start()` calls `bind()` + `serve()` internally (no behavior change)
- [ ] `BoundRelay` struct is `pub` with `endpoint` and `local_addr` fields
- [ ] `RoomManager::room_count()` is always-public (no `#[cfg(test)]` gate)
- [ ] `cargo test --workspace` passes with 648+ tests (no regressions)
- [ ] `cargo clippy --workspace -- -D warnings` clean

---

## Wave 2: Pipeline Integration Tests (No Network)

**Goal**: Test the full SendPipeline -> ReceivePipeline path without any network. This is the fastest, highest-value integration test layer because it exercises real crypto, real compression, real chunking, and real file I/O without any relay dependency.

**File**: `crates/tallow-protocol/tests/integration.rs`

### Task 2.1: Single file roundtrip (small file, one chunk)

```
Test: send_receive_single_file_roundtrip
  1. Create TempDir for send and receive
  2. Write a small test file (< 64KB, fits in one chunk)
  3. Create SendPipeline with random transfer_id and session_key
  4. Call prepare() -> get FileOffer message
  5. Call chunk_file() -> get Chunk messages (should be exactly 1)
  6. Create ReceivePipeline with same transfer_id and session_key
  7. Call process_offer() with manifest bytes from FileOffer
  8. Call process_chunk() for each chunk
  9. Assert is_complete() == true
  10. Call finalize() -> written paths
  11. Assert written file content == original file content
  12. Assert BLAKE3 hashes match
```

### Task 2.2: Multi-chunk file roundtrip (file > 64KB)

```
Test: send_receive_multi_chunk_roundtrip
  1. Write a file of ~200KB (4 chunks at 64KB default)
  2. Run full send/receive pipeline
  3. Assert chunk count >= 3
  4. Assert final file matches original
```

### Task 2.3: Text transfer roundtrip

```
Test: send_receive_text_roundtrip
  1. Call prepare_text() on SendPipeline with test string bytes
  2. Call chunk_data() for the text data
  3. Receive with ReceivePipeline
  4. Verify finalized output matches original text
  5. Verify manifest.transfer_type == TransferType::Text
```

### Task 2.4: Directory transfer roundtrip

```
Test: send_receive_directory_roundtrip
  1. Create TempDir with nested directory structure:
     dir/a.txt, dir/sub/b.txt, dir/sub/deep/c.txt
  2. Send the top-level dir
  3. Receive into a different TempDir
  4. Verify all 3 files exist at correct relative paths
  5. Verify content matches
```

### Task 2.5: All compression algorithms

```
Test: send_receive_all_compression_variants
  For each algo in [Zstd, Lz4, Brotli, Lzma, None]:
    1. Create SendPipeline with .with_compression(algo)
    2. Run full send/receive roundtrip
    3. Verify received file matches
```

### Task 2.6: Transfer resume (partial receive + checkpoint + continue)

```
Test: transfer_resume_after_interruption
  1. Create a 256KB file (4 chunks at 64KB)
  2. Send: prepare + chunk_file -> get 4 Chunk messages
  3. Receive: process first 2 chunks, then checkpoint()
  4. Drop the ReceivePipeline (simulate crash)
  5. Create new ReceivePipeline with ResumeState::restore()
  6. Process all 4 chunks (first 2 should be acked without re-processing)
  7. Assert is_complete()
  8. Finalize and verify content matches
```

### Task 2.7: Tampered chunk detection

```
Test: tampered_chunk_rejected
  1. Encrypt a chunk normally via SendPipeline
  2. Flip a byte in the encrypted data
  3. Pass to ReceivePipeline::process_chunk()
  4. Assert Err(ProtocolError::TransferFailed) with "decryption failed"
```

### Task 2.8: Chunk reordering detection

```
Test: chunk_reordering_detected
  1. Get chunks from SendPipeline for a multi-chunk file
  2. Swap the data of chunk 0 and chunk 1 (keep original indices)
  3. Process through ReceivePipeline
  4. Assert decryption fails (AAD mismatch)
```

### Task 2.9: Wrong session key rejected

```
Test: wrong_session_key_rejected
  1. Encrypt with session_key_a
  2. Decrypt with session_key_b
  3. Assert decryption fails
```

### Task 2.10: Large file roundtrip (100MB)

```
Test: large_file_roundtrip [#[ignore]]
  1. Generate 100MB of random data
  2. Full send/receive pipeline
  3. Compare BLAKE3 hashes of source and received
  4. Wrapped in tokio::time::timeout(Duration::from_secs(120))
```

### Task 2.11: Manifest hash mismatch rejection

```
Test: manifest_hash_mismatch_detected
  1. Create a valid manifest, serialize it
  2. Corrupt one byte in the serialized manifest
  3. Attempt process_offer() -> verify it fails or produces wrong hashes on finalize
```

### Dev-dependency additions for `tallow-protocol/Cargo.toml`

None needed -- `tempfile`, `tokio test-util`, and `proptest` are already present.

### Wave 2 Verification Checklist

- [ ] `crates/tallow-protocol/tests/integration.rs` contains ~11 tests
- [ ] All tests pass with `cargo test -p tallow-protocol`
- [ ] Large file test is `#[ignore]` and passes with `cargo test -p tallow-protocol -- --ignored`
- [ ] No new dev-dependencies added
- [ ] Total test count: 648 + ~11 = ~659

---

## Wave 3: Network Integration Tests (Real QUIC Relay)

**Goal**: Test real QUIC connections through an in-process relay. These tests exercise the full network stack: TLS handshake, QUIC transport, room pairing, and data forwarding.

**File**: `crates/tallow-relay/tests/integration.rs` (extend the stub from Wave 1)

### Task 3.0: Test helper — `spawn_test_relay`

A shared helper function used by all tests in this file:

```rust
/// Spawn a relay on localhost with an OS-assigned port.
/// Returns the bound address and a JoinHandle to abort on cleanup.
async fn spawn_test_relay(config: RelayConfig) -> (SocketAddr, tokio::task::JoinHandle<()>) {
    let server = RelayServer::new(config);
    let bound = server.bind().await.expect("bind failed");
    let addr = bound.local_addr;

    let handle = tokio::spawn(async move {
        let _ = server.serve(bound).await;
    });

    (addr, handle)
}
```

### Task 3.1: Two QUIC clients join room and detect pairing

```
Test: relay_room_pairing
  1. Spawn test relay on 127.0.0.1:0
  2. Create QUIC client config via tallow_net::transport::tls_config::quinn_client_config()
  3. Client A: connect, open bi-stream, send RoomJoin(room_id), read RoomJoined(peer_present=false)
  4. Client B: connect, open bi-stream, send RoomJoin(same room_id), read RoomJoined(peer_present=true)
  5. Client A: should receive PeerArrived notification
  6. Abort relay handle
```

### Task 3.2: Data forwarding between paired peers

```
Test: relay_data_forwarding
  1. Spawn relay, pair two clients in same room
  2. Client A sends length-prefixed data "hello from A"
  3. Client B reads and verifies data == "hello from A"
  4. Client B sends "reply from B"
  5. Client A reads and verifies data == "reply from B"
```

### Task 3.3: Room full rejection (third client)

```
Test: relay_room_full_rejection
  1. Pair two clients in a room
  2. Third client sends RoomJoin with same room_id
  3. Verify connection is rejected or error response received
```

### Task 3.4: Password authentication (correct, wrong, missing)

```
Test: relay_password_auth_correct
  1. Spawn relay with password = "test-password"
  2. Client sends RoomJoin with correct BLAKE3 password hash
  3. Verify RoomJoined response (not auth rejection 0xFF)

Test: relay_password_auth_wrong
  1. Spawn relay with password = "test-password"
  2. Client sends RoomJoin with wrong password hash
  3. Verify auth rejection (0xFF response)

Test: relay_password_auth_missing
  1. Spawn relay with password = "test-password"
  2. Client sends RoomJoin with password_hash = None
  3. Verify auth rejection
```

### Task 3.5: Graceful disconnect and room cleanup

```
Test: relay_disconnect_cleans_room
  1. Client A joins room
  2. Client A drops connection
  3. Wait briefly for cleanup
  4. Verify room is removed (via second client attempting to join as first peer)
```

### Task 3.6: Room timeout with time advancement

```
Test: relay_stale_room_cleanup
  Note: This test may require #[ignore] on Windows if tokio::time::pause()
  interacts poorly with QUIC's internal timers on that platform.
  1. Spawn relay with room_timeout_secs = 1
  2. Client A joins room, then drops (but room persists until cleanup cycle)
  3. Use tokio::time::sleep for slightly > cleanup interval
  4. Verify room has been cleaned up
```

### Task 3.7: Rate limiting

```
Test: relay_rate_limiting
  1. Spawn relay with rate_limit = 2
  2. Make 3 rapid connections from same IP
  3. Verify third connection is rate-limited (rejected or dropped)
```

### Task 3.8: Concurrent rooms

```
Test: relay_concurrent_rooms
  1. Spawn relay
  2. Create 3 room pairs (6 clients, 3 different room_ids)
  3. All 3 rooms exchange data simultaneously
  4. Verify all data received correctly
  5. All clients disconnect
```

### Dev-dependency additions for `tallow-relay/Cargo.toml`

```toml
[dev-dependencies]
tokio = { workspace = true, features = ["test-util"] }  # already present
quinn = "0.11"                                           # ADD: for creating test QUIC clients
tallow-net = { path = "../tallow-net", features = ["quic"] }  # ADD: for tls_config helpers
```

### Wave 3 Verification Checklist

- [ ] `crates/tallow-relay/tests/integration.rs` contains ~10 tests
- [ ] All tests pass with `cargo test -p tallow-relay`
- [ ] Tests use `127.0.0.1:0` (no port conflicts in parallel execution)
- [ ] Each test spawns its own relay (perfect isolation)
- [ ] `cargo clippy -p tallow-relay -- -D warnings` clean
- [ ] Total test count: ~659 + ~10 = ~669

---

## Wave 4: CLI Binary Tests, Property Tests, and Fuzz Targets

**Goal**: Three sub-tasks — (a) test the `tallow` binary via `assert_cmd`, (b) add proptest-based property tests for protocol roundtrips, (c) create fuzz targets for parser entry points.

### Wave 4a: CLI Binary Tests

**File**: `crates/tallow/tests/integration.rs`

#### Task 4a.1: Version output

```
Test: cli_version_output
  1. Command::cargo_bin("tallow").args(["version"])
  2. Assert exit code 0
  3. Assert stdout contains version string
```

#### Task 4a.2: Send requires file or text

```
Test: cli_send_requires_input
  1. Command::cargo_bin("tallow").args(["send"])
  2. Assert failure (non-zero exit)
  3. Assert stderr contains guidance about specifying files
```

#### Task 4a.3: Receive requires code

```
Test: cli_receive_requires_code
  1. Command::cargo_bin("tallow").args(["receive"])
  2. Assert failure
  3. Assert stderr contains guidance about code phrase
```

#### Task 4a.4: Shell completions generation

```
Test: cli_completions_bash
  1. Command::cargo_bin("tallow").args(["completions", "bash"])
  2. Assert success
  3. Assert stdout contains "complete" or "_tallow" (valid bash completion script marker)

Test: cli_completions_zsh
  1. Command::cargo_bin("tallow").args(["completions", "zsh"])
  2. Assert success

Test: cli_completions_fish
  1. Command::cargo_bin("tallow").args(["completions", "fish"])
  2. Assert success

Test: cli_completions_powershell
  1. Command::cargo_bin("tallow").args(["completions", "powershell"])
  2. Assert success
```

#### Task 4a.5: Identity commands

```
Test: cli_identity_generate
  1. Set TALLOW_CONFIG_DIR to a TempDir
  2. Command::cargo_bin("tallow").args(["identity"]).env("TALLOW_CONFIG_DIR", tmpdir)
  3. Assert success or verify expected output format
```

#### Task 4a.6: Doctor command

```
Test: cli_doctor_runs
  1. Command::cargo_bin("tallow").args(["doctor"])
  2. Assert exit code (may be non-zero if relay unreachable, but should not panic)
  3. Assert stdout contains diagnostic output (not empty)
```

#### Task 4a.7: JSON output is parseable

```
Test: cli_json_output_valid
  1. Command::cargo_bin("tallow").args(["send", "--json", "--text", "hello"])
     .timeout(Duration::from_secs(5))
  2. Will fail (no relay), but any stdout/stderr JSON lines should be parseable
  3. Parse each line starting with '{' as serde_json::Value
  4. Assert no JSON parse errors
```

#### Task 4a.8: Unknown subcommand

```
Test: cli_unknown_subcommand
  1. Command::cargo_bin("tallow").args(["nonexistent"])
  2. Assert failure
  3. Assert stderr contains help or suggestion
```

### Wave 4b: Property Tests (proptest)

**File**: `crates/tallow-protocol/tests/integration.rs` (append to the file from Wave 2, in a `mod proptest_suite` submodule to keep organization clear)

#### Task 4b.1: Codec roundtrip for all Message variants

```rust
proptest! {
    #[test]
    fn codec_roundtrip_any_message(msg in arb_message()) {
        let mut codec = TallowCodec::new();
        let mut buf = BytesMut::new();
        codec.encode_msg(&msg, &mut buf).unwrap();
        let decoded = codec.decode_msg(&mut buf).unwrap();
        prop_assert_eq!(decoded, Some(msg));
    }
}
```

With `arb_message()` strategy covering: Ping, Pong, RoomLeave, PeerArrived, PeerDeparted, FileAccept, Ack, FileOffer (with bounded manifest), Chunk (with bounded data), TransferComplete, TransferError, VersionRequest, VersionResponse, VersionReject, ManifestExchange, SyncDeleteList, FileReject.

#### Task 4b.2: Manifest serialization roundtrip

```
proptest: for any file count (1..10), sizes, hashes:
  manifest -> to_bytes() -> from_bytes() -> compare fields
```

#### Task 4b.3: ResumeState checkpoint/restore roundtrip

```
proptest: for any transfer_id, total_chunks, verified subset:
  state -> checkpoint() -> restore() -> compare
```

#### Task 4b.4: Chunk AAD uniqueness

```
proptest: for any (transfer_id, index_a, index_b) where index_a != index_b:
  build_chunk_aad(tid, a) != build_chunk_aad(tid, b)
```

#### Task 4b.5: Nonce uniqueness

```
proptest: for any (index_a, index_b) where index_a != index_b:
  build_chunk_nonce(a) != build_chunk_nonce(b)
```

### Wave 4c: Fuzz Targets

**Directory**: `fuzz/` at workspace root

**Note**: Fuzz targets require nightly Rust and only work on Unix. They are excluded from the main CI pipeline and run in a separate nightly-only workflow.

#### Task 4c.1: Set up fuzz workspace

Create `fuzz/Cargo.toml`:
```toml
[package]
name = "tallow-fuzz"
version = "0.0.0"
publish = false
edition = "2021"

[package.metadata]
cargo-fuzz = true

[dependencies]
libfuzzer-sys = "0.4"
tallow-protocol = { path = "../crates/tallow-protocol" }
bytes = "1"

[[bin]]
name = "fuzz_codec_decode"
path = "fuzz_targets/fuzz_codec_decode.rs"
doc = false

[[bin]]
name = "fuzz_manifest_parse"
path = "fuzz_targets/fuzz_manifest_parse.rs"
doc = false

[[bin]]
name = "fuzz_sanitize_filename"
path = "fuzz_targets/fuzz_sanitize_filename.rs"
doc = false
```

#### Task 4c.2: `fuzz_codec_decode` target

```rust
// fuzz/fuzz_targets/fuzz_codec_decode.rs
#![no_main]
use libfuzzer_sys::fuzz_target;
use bytes::BytesMut;
use tallow_protocol::wire::codec::TallowCodec;

fuzz_target!(|data: &[u8]| {
    let mut codec = TallowCodec::new();
    let mut buf = BytesMut::from(data);
    // Should never panic, only return Ok or Err
    let _ = codec.decode_msg(&mut buf);
});
```

#### Task 4c.3: `fuzz_manifest_parse` target

```rust
// fuzz/fuzz_targets/fuzz_manifest_parse.rs
#![no_main]
use libfuzzer_sys::fuzz_target;
use tallow_protocol::transfer::manifest::FileManifest;

fuzz_target!(|data: &[u8]| {
    let _ = FileManifest::from_bytes(data);
});
```

#### Task 4c.4: `fuzz_sanitize_filename` target

```rust
// fuzz/fuzz_targets/fuzz_sanitize_filename.rs
#![no_main]
use libfuzzer_sys::fuzz_target;
use std::path::PathBuf;

fuzz_target!(|data: &[u8]| {
    if let Ok(s) = std::str::from_utf8(data) {
        let output_dir = PathBuf::from("/tmp/fuzz_output");
        let _ = tallow_protocol::transfer::sanitize::sanitize_filename(s, &output_dir);
    }
});
```

### Wave 4 Verification Checklist

- [ ] `crates/tallow/tests/integration.rs` contains ~10 CLI tests
- [ ] All CLI tests pass with `cargo test -p tallow`
- [ ] Property tests in `crates/tallow-protocol/tests/integration.rs` pass
- [ ] Fuzz targets compile with `cargo +nightly fuzz build` (on a Unix system)
- [ ] Fuzz targets run for 20s each without panics: `cargo +nightly fuzz run <target> -- -max_total_time=20`
- [ ] `cargo test --workspace` passes with all new tests (no regressions)
- [ ] Total test count: ~669 + ~10 CLI + ~5 proptest = ~684

---

## Wave 5: CI Workflow Hardening

**Goal**: Update GitHub Actions CI to run integration tests, add a fuzz job for pushes to master, and ensure the test matrix covers all platforms.

**File**: `.github/workflows/ci.yml`

### Task 5.1: Add integration test job

Add a dedicated integration test job that runs the full test suite including `#[ignore]` tests:

```yaml
  integration-test:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: [check]  # fast fail if check doesn't pass
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - name: Run all tests including ignored
        run: cargo test --workspace --all-features -- --include-ignored
        timeout-minutes: 15
```

### Task 5.2: Add fuzz job (nightly, Linux only, master pushes only)

```yaml
  fuzz:
    name: Fuzz (60s per target)
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/master'
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@nightly
      - uses: Swatinem/rust-cache@v2
      - name: Install cargo-fuzz
        run: cargo install cargo-fuzz --locked
      - name: Run fuzz targets
        run: |
          for target in fuzz_codec_decode fuzz_manifest_parse fuzz_sanitize_filename; do
            echo "--- Fuzzing $target for 20s ---"
            cargo +nightly fuzz run $target -- -max_total_time=20
          done
        timeout-minutes: 5
```

### Task 5.3: Ensure existing test job remains cross-platform

The existing `test` job already runs on ubuntu/macos/windows. Verify it continues to work with the new integration test files. The key concern is:
- QUIC tests in `tallow-relay/tests/integration.rs` use UDP sockets, which work on all platforms
- CLI tests in `tallow/tests/integration.rs` use `assert_cmd`, which works on all platforms
- Path comparisons in pipeline tests use `std::path::Path`, not string equality

No changes needed to the existing `test` job -- the new integration tests are picked up automatically by `cargo test --workspace`.

### Task 5.4: Add test timeout to existing test job

Add a `timeout-minutes` to the existing test job as a safety net against hanging tests:

```yaml
  test:
    name: Test (${{ matrix.os }})
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - run: cargo test --workspace --all-features
        timeout-minutes: 15  # ADD: safety net
```

### Wave 5 Verification Checklist

- [ ] CI `test` job passes on all 3 platforms with new integration tests
- [ ] CI `integration-test` job runs `--include-ignored` on ubuntu and completes in < 5 minutes
- [ ] CI `fuzz` job only triggers on master pushes, completes in < 5 minutes
- [ ] No CI regressions on existing check, clippy, fmt, audit jobs
- [ ] Release workflow unaffected

---

## Success Criteria Mapping

From the ROADMAP Phase 15 success criteria:

| # | Criterion | Test Location | Wave |
|---|-----------|---------------|------|
| 1 | 100MB file transfer verified by BLAKE3 | `tallow-protocol/tests/integration.rs::large_file_roundtrip` (`#[ignore]`) | 2 |
| 2 | Transfer resume: kill mid-transfer, restart from last chunk | `tallow-protocol/tests/integration.rs::transfer_resume_after_interruption` | 2 |
| 3 | 5 concurrent transfers without deadlock or corruption | `tallow-relay/tests/integration.rs::relay_concurrent_rooms` | 3 |
| 4 | All `--json` output parseable with serde_json | `tallow/tests/integration.rs::cli_json_output_valid` | 4a |
| 5 | `cargo test --workspace` passes on Linux, macOS, Windows | `.github/workflows/ci.yml` (existing 3-OS matrix) | 5 |

## Estimated Test Counts

| Layer | File | New Tests | Cumulative |
|-------|------|-----------|------------|
| Existing | (all crates) | 648 | 648 |
| Wave 1 | tallow-relay/tests/integration.rs | 1 | 649 |
| Wave 2 | tallow-protocol/tests/integration.rs | 11 | 660 |
| Wave 3 | tallow-relay/tests/integration.rs | 10 | 670 |
| Wave 4a | tallow/tests/integration.rs | 10 | 680 |
| Wave 4b | tallow-protocol/tests/integration.rs | 5 | 685 |
| Wave 4c | fuzz/ | 3 targets | 685 + fuzz |
| **Total** | | **~37 new tests + 3 fuzz targets** | **~685** |

## Estimated CI Time Impact

| Job | Before | After | Delta |
|-----|--------|-------|-------|
| `cargo test --workspace` (Linux) | ~10s | ~40s | +30s (relay QUIC, pipeline I/O) |
| `cargo test --workspace` (macOS) | ~12s | ~45s | +33s |
| `cargo test --workspace` (Windows) | ~20s | ~55s | +35s |
| Integration tests (`--include-ignored`) | N/A | ~90s | new job |
| Fuzz (master only) | N/A | ~120s | new job |

## Compilation Time Impact

Each integration test file compiles as a separate binary:

| File | Estimated incremental compile | Reason |
|------|-------------------------------|--------|
| `tallow-protocol/tests/integration.rs` | ~3s | Links tallow-crypto + compression |
| `tallow-relay/tests/integration.rs` | ~5s | Links quinn + tallow-net |
| `tallow/tests/integration.rs` | ~3s | Links assert_cmd (light) |
| **Total** | **~11s** | Acceptable |

Keeping to one file per crate (instead of one file per test) avoids compiling 37 separate binaries.

## Execution Order

```
Wave 1 (relay refactoring)
  |
  v
Wave 2 (pipeline tests, no network dependency)
  |
  v
Wave 3 (relay network tests, depends on Wave 1)
  |
  v
Wave 4 (CLI + proptest + fuzz, partially parallel with Wave 3)
  |
  v
Wave 5 (CI hardening, depends on all waves)
```

Waves 2 and 3 can be developed in parallel since Wave 2 has no dependency on Wave 1. However, Wave 3 depends on Wave 1 completing first. Wave 4a (CLI tests) has no dependency on any other wave and can be developed in parallel. Wave 4b (proptests) extends the Wave 2 file. Wave 5 should be done last to ensure all tests are stable before wiring into CI.

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| QUIC tests flaky on Windows CI | Use generous timeouts (30s); mark genuinely flaky tests `#[ignore]` with `// FIXME: flaky on Windows` |
| Port conflicts in parallel tests | Always `127.0.0.1:0`, extract bound address from endpoint |
| Fuzz targets don't compile on stable/Windows | Fuzz is a separate CI job (nightly + Linux), never blocks the main pipeline |
| Large file test OOMs on CI | 100MB fits easily (CI has 7GB+ RAM); use `#[ignore]` to keep it out of default runs |
| Integration tests slow down developer iteration | Developers run `cargo test -p <crate>` for fast feedback; integration tests run in CI |
| Certificate expiry with `tokio::time::advance()` | Self-signed certs + `SkipServerVerification` already bypasses TLS validation in test clients |
| New tests break existing 648 | Each wave runs full `cargo test --workspace` before proceeding |
