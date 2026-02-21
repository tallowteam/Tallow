# Phase 15: End-to-End Testing & Hardening - Research

## Standard Stack

### Test Framework & Runners
- **`#[tokio::test]`**: The standard macro for async test functions. Use `#[tokio::test(flavor = "multi_thread")]` for tests involving concurrent I/O (relay server + clients). Single-thread flavor is the default but will not expose race conditions.
- **`assert_cmd` v2**: Already in `tallow/Cargo.toml` `[dev-dependencies]` but unused. This is the standard Rust crate for integration-testing CLI binaries. Uses `Command::cargo_bin("tallow")` to locate the built binary and chain assertions on exit code, stdout, stderr.
- **`predicates` v3**: Already in `tallow/Cargo.toml`. Companion to `assert_cmd` for flexible output matching (regex, contains, starts_with).
- **`tempfile` v3**: Already in `tallow/Cargo.toml` and `tallow-protocol/Cargo.toml`. For creating temporary directories and files that auto-clean on drop.
- **`proptest` v1**: Already in `tallow-crypto/Cargo.toml` and `tallow-protocol/Cargo.toml`. Used in `sanitize.rs` for property-based testing. Extend to protocol roundtrips and crypto invariants.
- **`cargo-nextest`**: Alternative test runner that executes each test in a separate process. Up to 3x faster for workspaces with many test binaries (cross-binary parallelism). However, process-per-test is slower on Windows due to process creation overhead. For Tallow's 7-crate workspace with 600+ tests, nextest provides meaningful speedup on Linux CI runners. Consider keeping `cargo test` as fallback on Windows.
- **`cargo-fuzz` + `libfuzzer-sys`**: De-facto standard for coverage-guided fuzzing in Rust. Requires nightly + Unix. The codebase has no fuzz targets yet despite CLAUDE.md mentioning them.

### Test Dependencies to Add
- **`assert_fs`**: Filesystem assertion crate for integration tests. Creates temp dirs with known file structures.
- **`tokio::time::pause()`**: Already available via `tokio = { features = ["test-util"] }` in dev-dependencies. Allows deterministic time-dependent tests (room timeouts, keep-alive).
- **`wiremock` or custom harness**: For mocking relay responses. However, for Tallow an in-process relay is more valuable than mocking.

### CI Infrastructure
- **GitHub Actions**: Already configured with 3-OS matrix (ubuntu-latest, macos-latest, windows-latest) for check, test, clippy, fmt, and audit. Release workflow handles 5 targets with cross-compilation.
- **`dtolnay/rust-toolchain@stable`**: Already in use. Standard for CI.
- **`Swatinem/rust-cache@v2`**: Already in use. Caches `~/.cargo` and `target/` between runs.

## Architecture Patterns

### Pattern 1: In-Process Relay Test Harness

The most important pattern for Phase 15. The relay server (`RelayServer::new(config).start()`) currently blocks forever in an accept loop. For integration testing, we need:

```
test setup:
  1. Spawn relay on localhost:0 (OS-assigned port) in a tokio task
  2. Get the bound port from the quinn::Endpoint
  3. Create two RelayClient instances pointing at localhost:port
  4. Run send/receive pipeline logic
  5. Assert on received file integrity
  6. Drop the relay task (cancel on drop)
```

**Current obstacle**: `RelayServer::start()` returns `anyhow::Result<()>` and runs until Ctrl+C. It does not return the bound address. The function needs refactoring to either:
- Return the `quinn::Endpoint` (or at least the bound `SocketAddr`) before entering the accept loop, OR
- Accept a `tokio::sync::oneshot::Sender<SocketAddr>` to signal the bound address, OR
- Split into `bind() -> Endpoint` and `serve(endpoint)` methods.

**Recommendation**: Add a `pub async fn start_with_addr_tx(&self, addr_tx: tokio::sync::oneshot::Sender<SocketAddr>)` method or split `start()` into `bind()` + `run()`. This is a minimal, backward-compatible change.

### Pattern 2: Pipeline-Level Integration Test (No Network)

Test the full encrypt-compress-chunk-send / receive-decrypt-decompress-verify pipeline without any network:

```
test:
  1. Create SendPipeline with known session_key
  2. Call prepare() with test files -> get FileOffer messages
  3. Call chunk_file() for each file -> get Chunk messages
  4. Create ReceivePipeline with same session_key
  5. Call process_offer() with manifest bytes
  6. Call process_chunk() for each chunk -> get Ack messages
  7. Call finalize() -> written files
  8. Compare BLAKE3 hashes of source and received files
```

This is the fastest integration test to write because it requires ZERO network refactoring. All the pieces (`SendPipeline`, `ReceivePipeline`, `TallowCodec`) are already public and testable.

### Pattern 3: CLI Binary Integration Test

Using `assert_cmd` to test the actual binary end-to-end:

```
test:
  1. Spawn relay subprocess (or in-process)
  2. Use assert_cmd::Command::cargo_bin("tallow") to run sender
  3. Use assert_cmd::Command::cargo_bin("tallow") to run receiver
  4. Assert sender exit code 0
  5. Assert receiver exit code 0
  6. Compare output files
```

**Challenge**: The sender and receiver must run concurrently. `assert_cmd` spawns a blocking child process. Need two threads or two `tokio::spawn_blocking` tasks. The `--json` flag makes output parsing tractable.

### Pattern 4: Transfer Resume Testing

```
test:
  1. Start send pipeline
  2. Process N of M chunks through receive pipeline
  3. Checkpoint resume state via ResumeState::checkpoint()
  4. Drop receive pipeline (simulate crash)
  5. Create new ReceivePipeline with ResumeState::restore()
  6. Process remaining chunks (already-received chunks return Ack without re-processing)
  7. finalize() succeeds with correct hashes
```

The `ResumeState` already has `checkpoint()` and `restore()` methods. The `ReceivePipeline::with_resume()` builder method already exists. This test is straightforward.

### Pattern 5: Concurrent Transfer Stress Test

```
test:
  1. Spawn in-process relay
  2. Spawn N sender/receiver pairs (each with unique room_id)
  3. Each pair transfers a file of random size
  4. Wait for all transfers to complete with timeout
  5. Verify all files match
  6. Verify relay room count returns to 0
```

Key concern: Resource exhaustion. The relay's `RoomManager` uses `DashMap` and `mpsc::channel(256)`. With 5+ concurrent transfers, channel backpressure and memory usage need monitoring.

## Don't Hand-Roll

1. **Don't build a custom test runner** -- use `cargo test` (or `cargo-nextest`) with `#[tokio::test]`. The codebase already has 600+ tests in this pattern.

2. **Don't mock the relay at the network level** -- instead, spin up the real `RelayServer` in-process on localhost. Mocking QUIC at the socket level is extremely complex and fragile. The relay code is small (~400 lines) and fast to start.

3. **Don't build custom fuzz harnesses** -- use `cargo-fuzz` with `libfuzzer-sys`. It handles corpus management, coverage tracking, and minimization automatically.

4. **Don't write custom file comparison utilities** -- BLAKE3 hash comparison is already the project's standard (used in `ReceivePipeline::finalize()`). Use `blake3::hash(data)` for all integrity checks.

5. **Don't build custom CI matrix logic** -- GitHub Actions' built-in `strategy.matrix` with `include` blocks (already used in `release.yml`) is sufficient. Avoid external matrix.jsonc files for a project this size.

6. **Don't write test-only crypto stubs** -- the actual crypto is fast enough for tests. AES-256-GCM with 64KB chunks takes microseconds. Using real crypto in tests catches real bugs.

7. **Don't hand-roll progress/timing assertions** -- use `tokio::time::timeout()` to wrap integration tests with deadlines. A test that hangs for >30s is a bug.

8. **Don't write custom proptest strategies for protocol messages** -- `proptest` can derive `Arbitrary` for most types. Use `#[derive(Arbitrary)]` on `Message` variants or write focused strategies for the complex ones.

## Common Pitfalls

### 1. Port Conflicts in Parallel Tests
Multiple tests binding to the same port will fail. **Always use `0.0.0.0:0`** to let the OS assign a port, then extract the bound address from the `quinn::Endpoint`.

### 2. Test Ordering Dependencies
`cargo test` runs tests within a binary in parallel by default. Tests that share global state (files, environment variables, config directories) will interfere. **Use `tempfile::TempDir` for all file I/O** and avoid `std::env::set_var` (it's process-global and unsafe in multi-threaded contexts since Rust 1.66).

### 3. Windows Path Differences
Path assertions using string comparison will break on Windows (`\` vs `/`). **Use `std::path::Path` comparisons** instead of string equality. The existing `sanitize_filename` tests may need cross-platform awareness.

### 4. Async Test Timeouts
Async tests that deadlock will hang CI forever. **Wrap every integration test in `tokio::time::timeout(Duration::from_secs(30), ...)`** as a safety net. GitHub Actions has a 6-hour job timeout but individual test hangs waste minutes of CI time.

### 5. Fuzz Testing Only Works on Unix + Nightly
`cargo-fuzz` requires `libFuzzer` (LLVM sanitizer), which only works on x86-64/AArch64 Unix with nightly Rust. **Do not add fuzz targets to the regular CI pipeline.** Run them as a separate nightly-only workflow or local-only.

### 6. Large File Tests in CI
Generating 100MB test files in CI eats disk space and slows tests. **Use `#[ignore]` for large-file tests** and run them only on demand (`cargo test -- --ignored`) or in a separate CI job. CI runners have ~14GB free disk on ubuntu-latest.

### 7. QUIC Certificate Timing
Self-signed certificates generated by `generate_self_signed()` have default expiry. If `tokio::time::pause()` + `advance()` is used to test room timeouts, the certificate may "expire" in simulated time. **Generate certs with long validity** in test helpers, or skip TLS verification (already done by `SkipServerVerification`).

### 8. Channel Capacity Deadlocks
The relay uses `mpsc::channel(256)` for peer communication. If a test sends 257 messages without the receiver draining them, the sender blocks forever. **Always run sender and receiver concurrently** (not sequentially).

### 9. Windows CI Build Times
Windows CI builds are ~2x slower than Linux due to MSVC linker. The release workflow already handles this. For test CI, consider running only `cargo check` on Windows and full tests on Linux/macOS if time is a concern.

### 10. proptest Shrinking Can Be Slow
If a proptest failure triggers shrinking on a complex type, it can take minutes. **Set `PROPTEST_CASES` to a reasonable number** (e.g., 1000 for CI, 10000 for local). The existing sanitize tests use default settings.

## Code Examples

### Example 1: Pipeline-Level Integration Test (No Network)

```rust
// In crates/tallow-protocol/tests/pipeline_integration.rs

use tallow_protocol::transfer::{SendPipeline, ReceivePipeline};
use tallow_protocol::compression::CompressionAlgorithm;
use tempfile::TempDir;
use std::path::PathBuf;

#[tokio::test]
async fn test_send_receive_pipeline_roundtrip() {
    let send_dir = TempDir::new().unwrap();
    let recv_dir = TempDir::new().unwrap();

    // Create test file
    let test_data = b"Hello from Tallow integration test!";
    let test_file = send_dir.path().join("test.txt");
    tokio::fs::write(&test_file, test_data).await.unwrap();

    // Shared transfer params
    let transfer_id: [u8; 16] = rand::random();
    let session_key: [u8; 32] = rand::random();

    // --- Sender side ---
    let mut send_pipeline = SendPipeline::new(transfer_id, session_key)
        .with_compression(CompressionAlgorithm::Zstd);

    let offer_messages = send_pipeline
        .prepare(&[test_file.clone()])
        .await
        .unwrap();

    let chunk_messages = send_pipeline
        .chunk_file(&test_file, 0)
        .await
        .unwrap();

    // --- Receiver side ---
    let mut recv_pipeline = ReceivePipeline::new(
        transfer_id,
        recv_dir.path(),
        session_key,
    );

    // Process offer
    let manifest_bytes = match &offer_messages[0] {
        tallow_protocol::wire::Message::FileOffer { manifest, .. } => manifest.clone(),
        _ => panic!("expected FileOffer"),
    };
    recv_pipeline.process_offer(&manifest_bytes).unwrap();

    // Process chunks
    for chunk_msg in &chunk_messages {
        match chunk_msg {
            tallow_protocol::wire::Message::Chunk { index, data, total, .. } => {
                recv_pipeline.process_chunk(*index, data, *total).unwrap();
            }
            _ => panic!("expected Chunk"),
        }
    }

    assert!(recv_pipeline.is_complete());

    // Finalize and verify
    let written = recv_pipeline.finalize().await.unwrap();
    assert_eq!(written.len(), 1);
    let received_data = tokio::fs::read(&written[0]).await.unwrap();
    assert_eq!(received_data, test_data);
}
```

### Example 2: In-Process Relay Harness

```rust
// In crates/tallow-relay/src/server.rs (add this method)

impl RelayServer {
    /// Start the relay and report the bound address via a oneshot channel.
    ///
    /// This is primarily for integration tests that need to know the
    /// actual bound port when using port 0.
    #[cfg(test)]
    pub async fn start_for_test(
        &self,
        addr_tx: tokio::sync::oneshot::Sender<std::net::SocketAddr>,
    ) -> anyhow::Result<()> {
        let addr: std::net::SocketAddr = self.config.bind_addr.parse()?;
        let identity = tallow_net::transport::tls_config::generate_self_signed()?;
        let server_config = tallow_net::transport::tls_config::quinn_server_config(&identity)?;
        let endpoint = quinn::Endpoint::server(server_config, addr)?;

        let bound_addr = endpoint.local_addr()?;
        let _ = addr_tx.send(bound_addr);

        // ... rest of accept loop (same as start())
    }
}

// In a test file:
#[tokio::test(flavor = "multi_thread")]
async fn test_relay_room_pairing() {
    let config = RelayConfig {
        bind_addr: "127.0.0.1:0".to_string(),
        ..RelayConfig::default()
    };

    let (addr_tx, addr_rx) = tokio::sync::oneshot::channel();
    let server = RelayServer::new(config);

    let relay_handle = tokio::spawn(async move {
        server.start_for_test(addr_tx).await.unwrap();
    });

    let relay_addr = addr_rx.await.unwrap();

    // Now create two clients and test room joining...
    let mut client_a = tallow_net::relay::RelayClient::new(relay_addr);
    let mut client_b = tallow_net::relay::RelayClient::new(relay_addr);

    let room_id = [42u8; 32];

    let peer_present_a = client_a.connect(&room_id, None).await.unwrap();
    assert!(!peer_present_a); // first peer, nobody waiting

    let peer_present_b = client_b.connect(&room_id, None).await.unwrap();
    assert!(peer_present_b); // second peer, first is waiting

    // Cleanup
    client_a.close().await;
    client_b.close().await;
    relay_handle.abort();
}
```

### Example 3: CLI Binary Test with assert_cmd

```rust
// In crates/tallow/tests/cli_integration.rs

use assert_cmd::Command;
use predicates::prelude::*;
use tempfile::TempDir;

#[test]
fn test_send_requires_file_or_text() {
    Command::cargo_bin("tallow")
        .unwrap()
        .args(["send"])
        .assert()
        .failure()
        .stderr(predicate::str::contains("No files specified"));
}

#[test]
fn test_version_output() {
    Command::cargo_bin("tallow")
        .unwrap()
        .args(["version"])
        .assert()
        .success();
}

#[test]
fn test_json_output_parseable() {
    // Test that --json flag produces valid JSON
    Command::cargo_bin("tallow")
        .unwrap()
        .args(["send", "--json", "--text", "hello"])
        .timeout(std::time::Duration::from_secs(5))
        .assert()
        .failure() // will fail because no relay, but should emit JSON errors
        .stdout(predicate::str::contains("\"event\""));
}
```

### Example 4: Transfer Resume Test

```rust
#[tokio::test]
async fn test_transfer_resume_after_interruption() {
    let send_dir = TempDir::new().unwrap();
    let recv_dir = TempDir::new().unwrap();

    // Create a file large enough for multiple chunks
    let test_data = vec![0xABu8; 256 * 1024]; // 256 KB = 4 chunks at 64KB
    let test_file = send_dir.path().join("large.bin");
    tokio::fs::write(&test_file, &test_data).await.unwrap();

    let transfer_id: [u8; 16] = [1u8; 16];
    let session_key: [u8; 32] = [2u8; 32];

    // Sender prepares all chunks
    let mut send_pipeline = SendPipeline::new(transfer_id, session_key);
    let offer_messages = send_pipeline.prepare(&[test_file.clone()]).await.unwrap();
    let chunk_messages = send_pipeline.chunk_file(&test_file, 0).await.unwrap();

    let manifest_bytes = match &offer_messages[0] {
        Message::FileOffer { manifest, .. } => manifest.clone(),
        _ => panic!("expected FileOffer"),
    };

    // --- First attempt: receive only first 2 chunks, then "crash" ---
    {
        let mut recv = ReceivePipeline::new(transfer_id, recv_dir.path(), session_key);
        recv.process_offer(&manifest_bytes).unwrap();

        for chunk_msg in chunk_messages.iter().take(2) {
            if let Message::Chunk { index, data, total, .. } = chunk_msg {
                recv.process_chunk(*index, data, *total).unwrap();
            }
        }

        assert!(!recv.is_complete());

        // Checkpoint
        let checkpoint_data = recv.resume_state().unwrap().checkpoint().unwrap();
        tokio::fs::write(recv_dir.path().join("checkpoint"), &checkpoint_data)
            .await
            .unwrap();
    }
    // recv is dropped here -- simulates crash

    // --- Second attempt: resume from checkpoint ---
    let checkpoint_data = tokio::fs::read(recv_dir.path().join("checkpoint")).await.unwrap();
    let resume_state = ResumeState::restore(&checkpoint_data).unwrap();

    let mut recv = ReceivePipeline::new(transfer_id, recv_dir.path(), session_key)
        .with_resume(resume_state);
    recv.process_offer(&manifest_bytes).unwrap();

    // Re-send all chunks; already-received ones are acked without re-processing
    for chunk_msg in &chunk_messages {
        if let Message::Chunk { index, data, total, .. } = chunk_msg {
            recv.process_chunk(*index, data, *total).unwrap();
        }
    }

    assert!(recv.is_complete());
    let written = recv.finalize().await.unwrap();
    let received_data = tokio::fs::read(&written[0]).await.unwrap();
    assert_eq!(received_data, test_data);
}
```

### Example 5: Proptest for Codec Roundtrip

```rust
use proptest::prelude::*;
use tallow_protocol::wire::{Message, codec::TallowCodec};
use bytes::BytesMut;

fn arb_message() -> impl Strategy<Value = Message> {
    prop_oneof![
        Just(Message::Ping),
        Just(Message::Pong),
        Just(Message::RoomLeave),
        Just(Message::PeerArrived),
        Just(Message::PeerDeparted),
        any::<[u8; 16]>().prop_map(|id| Message::FileAccept { transfer_id: id }),
        (any::<[u8; 16]>(), any::<u64>()).prop_map(|(id, idx)| Message::Ack {
            transfer_id: id,
            index: idx,
        }),
        (any::<[u8; 16]>(), prop::collection::vec(any::<u8>(), 0..1024))
            .prop_map(|(id, data)| Message::FileOffer {
                transfer_id: id,
                manifest: data,
            }),
        (any::<[u8; 16]>(), any::<u64>(), any::<Option<u64>>(),
         prop::collection::vec(any::<u8>(), 0..4096))
            .prop_map(|(id, idx, total, data)| Message::Chunk {
                transfer_id: id,
                index: idx,
                total,
                data,
            }),
    ]
}

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

## Gap Analysis

### What Exists

| Category | State | Details |
|----------|-------|---------|
| Unit tests | 600+ tests across 115 files | Comprehensive per-module coverage |
| Crypto tests | Strong | ML-KEM, HKDF, AES-GCM, ChaCha20, BLAKE3, CPace, Ed25519, ML-DSA all tested |
| Protocol tests | Good | Codec roundtrip, message variants, chunking, resume, sanitize (with proptest) |
| Relay tests | Basic | Room manager create/join/full/limit/cleanup/disconnect tested |
| CI | 3-OS matrix | Check, test, clippy, fmt, audit on ubuntu/macos/windows |
| Release CI | Cross-platform | 5 targets with checksums, completions, GH release |
| Dev deps | Partially set up | `assert_cmd`, `predicates`, `tempfile` in tallow; `proptest` in crypto + protocol; `tokio test-util` in relay + net + protocol |

### What's Missing

| Category | Gap | Priority |
|----------|-----|----------|
| Integration tests (`tests/` dirs) | ZERO integration test files exist in any crate | Critical |
| Pipeline integration test | No test wires SendPipeline -> ReceivePipeline | Critical |
| Relay integration test | No test connects real QUIC clients to relay server | Critical |
| CLI integration test | `assert_cmd` is a dev-dep but has ZERO tests using it | High |
| Transfer resume test | ResumeState has unit tests but no pipeline-level resume test | High |
| Concurrent transfer test | No stress test for multiple simultaneous transfers | High |
| Large file test | No test with files >64KB (the chunk size) | High |
| JSON output validation | No test verifies `--json` output is parseable | High |
| Fuzz targets | CLAUDE.md references fuzz targets but none exist | Medium |
| Cross-platform tests | CI runs tests but no platform-specific assertions | Medium |
| Relay harness | `RelayServer::start()` does not return bound address (untestable) | Critical (blocker) |
| Directory transfer test | No test for recursive directory send/receive | Medium |
| Compression variants | Only zstd tested; lz4, brotli, lzma untested at pipeline level | Medium |
| Text transfer test | No test for `prepare_text()` -> receive -> print flow | Medium |
| Relay password auth test | `auth.rs` has unit tests but no integration test | Medium |
| Overwrite protection test | No test for existing-file conflict handling | Low |
| `cargo-nextest` | Not configured; could speed CI 2-3x | Low |

### Refactoring Required Before Tests

1. **`RelayServer::start()` needs to return the bound address** -- without this, no integration test can connect to the relay. Options:
   - Add `start_for_test(addr_tx: oneshot::Sender<SocketAddr>)` (test-only, behind `#[cfg(test)]`)
   - Split into `bind() -> (Endpoint, SocketAddr)` + `serve(endpoint)` (cleaner, production-usable)
   - Recommendation: the `bind() + serve()` split, since it also enables graceful shutdown and metrics in production.

2. **`RelayClient` methods are all `#[cfg(feature = "quic")]`** -- integration tests in `tallow-protocol` or `tallow-relay` need the `quic` feature enabled in dev-dependencies. Currently `tallow-net` is a dep of `tallow-relay` with `features = ["quic"]`, so this should work for relay-side integration tests.

3. **No shared test utility crate** -- common helpers (generate test files, create relay harness, compare BLAKE3 hashes) will be duplicated across integration tests in different crates. Consider a `test-utils/` directory or a `tallow-test-utils` crate (dev-dependency only, not published).

## Test Architecture Design

### Layer 1: Unit Tests (Existing, Expand)
- **Location**: `#[cfg(test)]` modules in each source file
- **Focus**: Individual functions, pure logic, error paths
- **Already strong**: 600+ tests covering crypto, protocol, store, relay

### Layer 2: Pipeline Integration Tests (New, Priority)
- **Location**: `crates/tallow-protocol/tests/pipeline.rs`
- **Focus**: SendPipeline + ReceivePipeline wired together without network
- **Tests**:
  - Single file roundtrip (small file, one chunk)
  - Multi-chunk file roundtrip (file > 64KB)
  - Directory transfer roundtrip
  - Text transfer roundtrip
  - Transfer resume (partial receive + checkpoint + continue)
  - All compression algorithms (zstd, lz4, brotli, lzma, none)
  - Tampered chunk detection (modified ciphertext -> decryption failure)
  - Chunk reordering detection (wrong AAD -> decryption failure)
  - Manifest hash mismatch rejection
- **Estimated**: ~15 tests

### Layer 3: Relay Integration Tests (New, Priority)
- **Location**: `crates/tallow-relay/tests/relay_integration.rs`
- **Prerequisites**: Relay server refactoring (bind/serve split)
- **Tests**:
  - Room join and pairing (two QUIC clients)
  - Data forwarding (client A sends bytes -> client B receives)
  - Room timeout (pause time, advance, verify cleanup)
  - Rate limiting (connect > limit, verify rejection)
  - Password authentication (correct pass, wrong pass, no pass)
  - Per-IP room limit enforcement
  - Room full rejection (3rd client trying to join)
  - Concurrent rooms (multiple rooms active simultaneously)
  - Graceful disconnect (peer leaves, room cleaned up)
- **Estimated**: ~12 tests

### Layer 4: End-to-End Network Tests (New)
- **Location**: `crates/tallow/tests/e2e.rs` or `tests/integration/`
- **Prerequisites**: Layer 3 relay harness
- **Tests**:
  - Full send-relay-receive file transfer (small file)
  - Full send-relay-receive with 100MB file (`#[ignore]`)
  - Concurrent 5-pair transfers through same relay
  - Transfer with relay password authentication
  - Sender cancellation mid-transfer
  - Receiver rejection (FileReject)
  - Code phrase mismatch (different rooms, no pairing)
- **Estimated**: ~10 tests

### Layer 5: CLI Binary Tests (New)
- **Location**: `crates/tallow/tests/cli.rs`
- **Tests**:
  - `tallow version` output format
  - `tallow send` without args -> error message
  - `tallow send --text "hello"` with unreachable relay -> connection error
  - `tallow completions bash` -> valid shell script
  - `tallow doctor` -> exit code and output structure
  - `tallow identity` -> identity generation and display
  - `tallow config` subcommands
  - `tallow send --json` -> valid JSON events (even on error)
  - `tallow receive --json --yes` -> valid JSON events
  - All `--json` output events are serde_json::Value parseable
- **Estimated**: ~12 tests

### Layer 6: Property Tests (Expand)
- **Location**: Inline in source files or `tests/proptests.rs`
- **Tests**:
  - Codec roundtrip for all Message variants (example above)
  - Manifest serialization roundtrip
  - ResumeState checkpoint/restore roundtrip
  - Session key derivation determinism (same input -> same output)
  - Chunk AAD uniqueness (different indices -> different AADs)
  - Nonce uniqueness (different indices -> different nonces)
  - Filename sanitization never escapes output_dir (already exists)
- **Estimated**: ~8 new proptest blocks

### Layer 7: Fuzz Targets (New)
- **Location**: `fuzz/fuzz_targets/`
- **Targets**:
  - `fuzz_codec_decode`: Feed arbitrary bytes to `TallowCodec::decode_msg()`
  - `fuzz_manifest_from_bytes`: Feed arbitrary bytes to `FileManifest::from_bytes()`
  - `fuzz_sanitize_filename`: Feed arbitrary strings to `sanitize_filename()`
  - `fuzz_room_join_parse`: Feed arbitrary bytes to `parse_room_join()`
  - `fuzz_compression_roundtrip`: Compress then decompress arbitrary data
- **Estimated**: 5 fuzz targets

### Proposed File Structure

```
crates/
  tallow-protocol/
    tests/
      pipeline_roundtrip.rs    -- Layer 2: pipeline integration
      codec_proptest.rs        -- Layer 6: property tests
  tallow-relay/
    tests/
      relay_integration.rs     -- Layer 3: relay with QUIC clients
  tallow/
    tests/
      cli_smoke.rs             -- Layer 5: CLI binary tests
      e2e_transfer.rs          -- Layer 4: full send-relay-receive
      json_output.rs           -- Layer 5: JSON output validation
fuzz/
  Cargo.toml
  fuzz_targets/
    fuzz_codec_decode.rs
    fuzz_manifest_parse.rs
    fuzz_sanitize.rs
    fuzz_room_join.rs
    fuzz_compression.rs
```

### CI Pipeline Additions

```yaml
# Add to .github/workflows/ci.yml

  integration-test:
    name: Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - run: cargo test --workspace --all-features -- --include-ignored
        timeout-minutes: 15

  fuzz:
    name: Fuzz (60s)
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/master'
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@nightly
      - run: cargo install cargo-fuzz
      - run: |
          for target in fuzz_codec_decode fuzz_manifest_parse fuzz_sanitize; do
            cargo fuzz run $target -- -max_total_time=20
          done
```

## Performance Considerations

### Test Execution Time Budget

| Test Layer | Estimated Time | Strategy |
|------------|---------------|----------|
| Unit tests (existing) | ~30s | Already fast, no changes needed |
| Pipeline integration | ~5s | No I/O, in-memory, fast |
| Relay integration | ~10s | QUIC setup ~1s per test, run parallel |
| E2E network tests (small) | ~15s | Real QUIC, bound by handshake latency |
| E2E large file (100MB) | ~30-60s | Mark `#[ignore]`, run separately |
| CLI binary tests | ~10s | Process spawn overhead |
| Property tests (1000 cases) | ~5s | Fast per-case, shrinking adds overhead |
| **Total CI time** | **~75s** (without ignored) | Acceptable for per-push CI |

### cargo-nextest Performance

For Tallow's 7-crate workspace:
- **Linux**: ~2x speedup expected (cross-binary parallelism)
- **macOS**: ~1.5x speedup (process creation faster than Windows)
- **Windows**: ~1.0-1.2x (process creation overhead may negate gains)

**Recommendation**: Use `cargo-nextest` on Linux CI, keep `cargo test` on Windows CI. Install nextest in CI via `cargo binstall cargo-nextest` (pre-built binary, no compile time).

### Resource Limits for Stress Tests

- **Memory**: Each `ReceivePipeline` buffers chunks in a `BTreeMap`. With 64KB chunks and `MAX_BUFFERED_CHUNKS = 65536`, that's up to 4GB. Stress tests should use smaller files.
- **File descriptors**: QUIC endpoints open UDP sockets. 5 concurrent transfers = 10 endpoints + relay = 11 UDP sockets. Well within OS defaults (1024 on Linux).
- **Ports**: Using `127.0.0.1:0` for each test's relay avoids port conflicts. OS ephemeral port range (32768-60999) supports hundreds of concurrent tests.
- **Disk**: 100MB test file + received copy = 200MB. CI runners have ~14GB free. No concern.
- **CPU**: Crypto operations (AES-256-GCM, BLAKE3) are hardware-accelerated and take microseconds per chunk. Not a bottleneck.

### Compilation Time Impact

Adding integration test files increases compilation time because each `tests/*.rs` file compiles as a separate binary:
- **Pipeline integration** (1 binary): ~3s incremental
- **Relay integration** (1 binary): ~5s incremental (links quinn)
- **CLI integration** (1-2 binaries): ~3s incremental
- **Total additional compile time**: ~11s incremental

To minimize: keep integration tests in fewer files (one per crate is ideal). Do not create one file per test function.

### Large File Test Strategy

For the 100MB file integrity test required by Phase 15 success criteria:

1. **Generate in-test**: `vec![0u8; 100 * 1024 * 1024]` with random pattern (use `rand::Rng::fill_bytes`)
2. **Mark `#[ignore]`**: Exclude from default `cargo test` runs
3. **CI job**: Separate job that runs `cargo test -- --ignored` on ubuntu-latest only (fastest runner, most disk)
4. **Timeout**: 120 seconds (100MB at 64KB chunks = 1600 chunks, each needing encrypt + compress + ack)
5. **Verify**: Compare BLAKE3 hash of source and received file

### Relay Start Time

Starting a QUIC relay involves:
1. Generate self-signed TLS cert (~1ms)
2. Build quinn ServerConfig (~1ms)
3. Bind UDP socket (~0.1ms)
4. **Total: <5ms**

This is fast enough to create a fresh relay per test, providing perfect isolation.

---

### Sources

- [Unit Testing | Tokio](https://tokio.rs/tokio/topics/testing)
- [cargo-nextest Home](https://nexte.st/)
- [cargo-nextest Benchmarks](https://nexte.st/docs/benchmarks/)
- [Why process-per-test? (nextest)](https://nexte.st/docs/design/why-process-per-test/)
- [Testing CLI Applications in Rust](https://rust-cli.github.io/book/tutorial/testing.html)
- [assert_cmd on crates.io](https://crates.io/crates/assert_cmd)
- [How I test Rust command-line apps with assert_cmd](https://alexwlchan.net/2025/testing-rust-cli-apps-with-assert-cmd/)
- [cargo-fuzz | Testing Handbook](https://appsec.guide/docs/fuzzing/rust/cargo-fuzz/)
- [Fuzzing with cargo-fuzz - Rust Fuzz Book](https://rust-fuzz.github.io/book/cargo-fuzz.html)
- [Structure-Aware Fuzzing - Rust Fuzz Book](https://rust-fuzz.github.io/book/cargo-fuzz/structure-aware-fuzzing.html)
- [Property-based testing in Rust with Proptest](https://blog.logrocket.com/property-based-testing-in-rust-with-proptest/)
- [Quinn QUIC on GitHub](https://github.com/quinn-rs/quinn)
- [Building cross-platform Rust CI/CD with GitHub Actions](https://ahmedjama.com/blog/2025/12/cross-platform-rust-pipeline-github-actions/)
- [GitHub Actions best practices for Rust projects](https://infinyon.com/blog/2021/04/github-actions-best-practices/)
- [Build Rust Projects with Cross (GitHub Action)](https://github.com/marketplace/actions/build-rust-projects-with-cross)
