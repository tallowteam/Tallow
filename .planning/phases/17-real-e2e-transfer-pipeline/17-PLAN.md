# Phase 17: Real E2E Transfer Pipeline — PLAN

**Goal:** Fix the 5 gaps in the existing transfer pipeline so two machines can actually send files of any size, with integrity verification, progress tracking, and resumable transfers.

**Status:** The pipeline is ~80% wired. KEM handshake, relay connection, codec, manifest, and basic chunk loop all work. The gaps are: (1) whole-file memory loads, (2) stop-and-wait throughput, (3) Merkle tree not wired, (4) resume broken across restarts, (5) finalize() loads all chunks into memory.

## Wave 1: Streaming I/O + Per-Chunk Pipeline (Foundation)

Everything else depends on this. Currently `chunk_file()` loads the entire file into memory, compresses it all, then splits into chunks. This must become streaming.

### Task 1.1: Streaming chunk_file() in SendPipeline

**File:** `crates/tallow-protocol/src/transfer/send.rs`

**Current:** `chunk_file()` calls `tokio::fs::read(path)` (loads entire file), then `compression::pipeline::compress()` (copies entire file again), then `chunking::split_into_chunks()` (copies again). 3x file size in memory.

**Change to:**
- Add `pub async fn stream_chunks()` method that:
  1. Opens file with `tokio::fs::File::open()`
  2. Reads `chunk_size` bytes at a time with `AsyncReadExt::read()`
  3. Compresses each chunk independently with `compression::pipeline::compress()`
  4. Encrypts each chunk with AES-256-GCM (counter nonce, per-chunk AAD)
  5. Returns an async iterator/channel of `Message::Chunk` instead of `Vec<Message>`
- Keep old `chunk_file()` for backward compat but mark `#[deprecated]`
- Memory: O(chunk_size) instead of O(file_size)

**Also add:** `pub fn chunk_count_for_file(file_size: u64) -> u64` helper that computes expected chunk count without reading the file (needed for Merkle tree pre-allocation and progress bars).

**Tests:**
- Unit test: stream_chunks on a 1MB temp file produces correct number of chunks
- Unit test: each chunk independently decrypts and decompresses to original data
- Unit test: chunk_count_for_file matches actual chunk count

### Task 1.2: Streaming finalize() in ReceivePipeline

**File:** `crates/tallow-protocol/src/transfer/receive.rs`

**Current:** `process_chunk()` stores decrypted data in `BTreeMap<u64, Vec<u8>>`. `finalize()` concatenates ALL chunks into a single `Vec<u8>`, decompresses the whole thing, then splits by file offsets.

**Change to:**
- In `process_chunk()`: after decrypting, decompress the chunk immediately (per-chunk compression), then write to a temp file (append mode) instead of storing in BTreeMap
- Track chunk metadata (index, offset, hash) in a lightweight struct instead of storing actual data
- In `finalize()`: read from temp file in file-offset ranges, verify per-file BLAKE3 hash, rename/move to final output path
- Memory: O(chunk_size) instead of O(total_transfer_size)
- Keep `received_chunks` BTreeMap for small transfers (<10MB) as optimization, switch to temp file for larger

**Tests:**
- Unit test: process_chunk writes to temp file correctly
- Unit test: finalize reassembles multi-file transfer from temp file
- Unit test: BLAKE3 hash verification still passes after streaming

### Task 1.3: Wire streaming into send.rs command

**File:** `crates/tallow/src/commands/send.rs`

**Current:** Lines 596-720 call `pipeline.chunk_file()` which returns `Vec<Message>`, then iterates and sends one-by-one with stop-and-wait.

**Change to:**
- Replace `chunk_file()` call with `stream_chunks()`
- Use a channel or async stream to produce chunks on-demand
- For now, keep stop-and-wait (Wave 3 adds sliding window)
- Update progress tracking to work with streaming (bytes sent, not chunk count)

### Task 1.4: Wire streaming into receive.rs command

**File:** `crates/tallow/src/commands/receive.rs`

**Current:** Receive loop stores chunks in pipeline, calls `finalize()` at end.

**Change to:**
- Receive loop remains similar but `process_chunk()` now writes to disk
- `finalize()` now does verification + rename instead of reassembly
- Resume checkpoint continues to work (tracks verified chunk indices)

## Wave 2: Merkle Tree + Resume Protocol

### Task 2.1: Add Merkle root to FileManifest

**File:** `crates/tallow-protocol/src/transfer/manifest.rs`

**Change:**
- Add `pub merkle_root: Option<[u8; 32]>` to `FileManifest`
- Sender computes Merkle tree from chunk hashes during `prepare()` and sets the root
- This requires knowing all chunk hashes before sending — for streaming, compute a first pass hash scan of the file (BLAKE3 is fast, ~3GB/s) then stream chunks

**Alternative (simpler):** Compute Merkle root lazily — sender sends chunks, tracks hashes, includes Merkle root in `TransferComplete` message. Receiver builds its own tree and compares roots. This avoids a double-pass over the file.

**Recommended:** Use the `TransferComplete` approach. Add `merkle_root: Option<[u8; 32]>` to `Message::TransferComplete`. Sender builds tree as chunks are sent, receiver builds tree as chunks arrive, compare at end.

### Task 2.2: Wire MerkleTree into send/receive

**Files:** `send.rs`, `receive.rs`

**Sender:**
- Track chunk hashes (BLAKE3 of encrypted chunk data) as chunks are sent
- After all chunks: `MerkleTree::build(chunk_hashes)`, include root in `TransferComplete`

**Receiver:**
- Track chunk hashes as chunks arrive
- On `TransferComplete`: build tree, compare root with constant-time eq
- If mismatch: report which chunks are suspect (via Merkle proof verification)

### Task 2.3: Fix resume — deterministic checkpoint key

**File:** `crates/tallow-protocol/src/transfer/resume.rs`

**Current:** `transfer_id` is `rand::random()` in send.rs. Checkpoints keyed by transfer_id never match across restarts.

**Change:**
- Derive checkpoint key from `manifest_hash` (BLAKE3 of serialized manifest) instead of random transfer_id
- Sender includes `manifest_hash` in `FileOffer` (already exists in manifest)
- Receiver keys checkpoint files by `hex::encode(manifest_hash)` instead of `hex::encode(transfer_id)`
- On reconnect: receiver loads checkpoint by manifest_hash, sends resume info

### Task 2.4: Add ResumeInfo wire message

**File:** `crates/tallow-protocol/src/wire/messages.rs`

**Add variant:**
```rust
ResumeInfo {
    transfer_id: [u8; 16],
    manifest_hash: [u8; 32],
    verified_chunks: Vec<u64>,
}
```

**Flow:**
1. Receiver gets `FileOffer`, computes manifest_hash, checks for checkpoint
2. If checkpoint exists and manifest_hash matches: send `ResumeInfo` after `FileAccept`
3. Sender receives `ResumeInfo`, skips chunks in `verified_chunks` set
4. If no checkpoint: send `FileAccept` only (no ResumeInfo), sender sends all chunks

**Files to modify:** `send.rs` (check for ResumeInfo after FileAccept), `receive.rs` (send ResumeInfo)

## Wave 3: Sliding Window Sender

### Task 3.1: Batch-send-then-drain pattern

**File:** `crates/tallow/src/commands/send.rs`

**Current:** Stop-and-wait — send 1 chunk, wait for ack, send next.

**Change to batch pattern (PeerChannel is &mut self, can't concurrent send+receive):**

```
const WINDOW_SIZE: usize = 8;

while chunks_remaining > 0 || in_flight > 0 {
    // Phase 1: Send up to WINDOW_SIZE chunks
    while in_flight < WINDOW_SIZE && chunks_remain {
        send next chunk
        in_flight += 1
    }
    // Phase 2: Drain acks for sent chunks
    while in_flight > 0 {
        receive ack
        in_flight -= 1
        update progress
    }
}
```

This achieves ~8x throughput on high-latency links without refactoring PeerChannel.

**Tests:**
- Integration test: send 100 chunks with window=8, verify all received correctly
- Verify ack ordering doesn't matter (out-of-order acks are OK)

### Task 3.2: Receiver batch-ack support

**File:** `crates/tallow/src/commands/receive.rs`

**Current:** Receives 1 chunk, processes, sends 1 ack.

**Change:** No change needed — receiver already processes chunks and sends acks one-at-a-time. The sender's batch pattern is compatible because the receiver's acks will be read in the drain phase. The receiver doesn't need to know about the window.

## Wave 4: Integration Testing + Verification

### Task 4.1: Loopback integration test

**File:** `crates/tallow-protocol/tests/transfer_e2e.rs` (new)

**Test:** Full send→receive pipeline over in-memory channel:
1. Create temp files (small: 1KB, medium: 10MB, large: 100MB)
2. Run send pipeline (streaming chunks) connected to receive pipeline
3. Verify output files match input (BLAKE3)
4. Verify Merkle root matches
5. Verify progress callback fires

### Task 4.2: Resume integration test

**Test:**
1. Start transfer, interrupt after 50% of chunks
2. Save checkpoint
3. Restart transfer with same manifest
4. Verify only remaining chunks are sent
5. Verify final output is correct

### Task 4.3: Large file stress test

**Test:**
- Create a 500MB temp file (or use sparse file)
- Transfer with streaming pipeline
- Monitor memory usage stays under 50MB throughout
- Verify BLAKE3 integrity

## Verification Checklist

After all waves complete:

- [ ] `cargo test --workspace --all-features` — all tests pass (existing 832+ new)
- [ ] `cargo clippy --workspace --all-features -- -D warnings` — zero warnings
- [ ] Success Criterion 1: send/receive a file between two pipeline instances, BLAKE3 verified
- [ ] Success Criterion 2: Session key from KEM handshake, not code phrase (already true, verify preserved)
- [ ] Success Criterion 3: 500MB+ file transfers without OOM, Merkle tree verification
- [ ] Success Criterion 4: Progress shows speed/percentage/ETA (already true, verify preserved)
- [ ] Success Criterion 5: Resume test — interrupt and restart picks up from checkpoint

## Dependency Graph

```
Wave 1 (streaming I/O)
  ├── Task 1.1: stream_chunks() in SendPipeline
  ├── Task 1.2: streaming finalize() in ReceivePipeline
  ├── Task 1.3: wire into send.rs (depends on 1.1)
  └── Task 1.4: wire into receive.rs (depends on 1.2)

Wave 2 (Merkle + resume) — depends on Wave 1
  ├── Task 2.1: Merkle root in manifest/TransferComplete
  ├── Task 2.2: wire MerkleTree into send/receive
  ├── Task 2.3: deterministic checkpoint key
  └── Task 2.4: ResumeInfo wire message

Wave 3 (sliding window) — depends on Wave 1
  ├── Task 3.1: batch-send pattern in send.rs
  └── Task 3.2: verify receiver compat (no change needed)

Wave 4 (testing) — depends on Waves 1-3
  ├── Task 4.1: loopback E2E test
  ├── Task 4.2: resume test
  └── Task 4.3: large file stress test
```

Waves 2 and 3 can execute in parallel after Wave 1 completes.
