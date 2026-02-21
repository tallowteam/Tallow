# Phase 17: Real E2E Transfer Pipeline - Research

**Researched:** 2026-02-20
**Domain:** End-to-end encrypted file transfer orchestration (crypto + transport + protocol integration)
**Confidence:** HIGH

## Summary

Phase 17 is an **integration and hardening** phase, not a greenfield build. After thorough investigation of the codebase, the transfer pipeline is substantially more complete than the phase description suggests. The KEM handshake, relay connection, chunked AES-256-GCM encryption, file manifests, progress bars, and even basic resume checkpointing are ALL already wired end-to-end in `send.rs` and `receive.rs`. The session key IS derived from the real ML-KEM-1024 + X25519 hybrid key exchange via CPace PAKE -- the code phrase authenticates only, it does not derive encryption keys. This is exactly the architecture the success criteria demand.

However, there are significant gaps that need closing to satisfy all success criteria:

1. **Stop-and-wait transfer** -- The current implementation sends one chunk, waits for one ack, sends next chunk. XFER-12 requires a sliding window (N=8) for throughput. This is the single largest gap.
2. **No Merkle tree integration** -- `MerkleTree` exists in `tallow-crypto` but is never used in the transfer pipeline. Success criterion #3 requires Merkle tree verification.
3. **Resume is incomplete** -- Checkpointing exists on the receiver side but the sender does not track resume state, and reconnecting with the "same code" does not re-establish the session. The sender also does not query the receiver for already-received chunks.
4. **Large file handling** -- The send pipeline reads entire files into memory (`tokio::fs::read`), which will fail for files >1GB. Needs streaming I/O.
5. **Compression before chunking** -- Currently the pipeline compresses entire file data then chunks the compressed output. For large files, this requires the entire file in memory. Needs per-chunk or streaming compression.

**Primary recommendation:** Refactor the send/receive loop to use a sliding window protocol, add streaming file I/O for large files, wire in Merkle tree verification, and implement bidirectional resume negotiation. The crypto, KEM, relay, codec, and manifest layers are solid and do NOT need changes.

## Standard Stack

### Core (Already in workspace -- NO new dependencies)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| tallow-crypto (crate) | workspace | ML-KEM-1024, X25519, AES-256-GCM, BLAKE3, MerkleTree | Already integrated |
| tallow-net (crate) | workspace | QUIC transport (quinn), relay client, PeerChannel trait | Already integrated |
| tallow-protocol (crate) | workspace | Wire codec (postcard), SendPipeline, ReceivePipeline, chunking | Already integrated |
| tokio | workspace | Async runtime, fs, time, sync | Already integrated |
| bytes | workspace | BytesMut for codec encode/decode buffers | Already integrated |
| indicatif | workspace | TransferProgressBar (speed, ETA, percentage) | Already integrated |
| postcard | workspace | Wire message serialization | Already integrated |
| blake3 | workspace | File hashing, manifest hashing | Already integrated |
| zeroize | workspace | Key material cleanup | Already integrated |
| subtle | workspace | Constant-time comparisons | Already integrated |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tokio::sync::Semaphore | (tokio) | Sliding window concurrency limit | For N=8 in-flight chunk limiting |
| tokio::io::AsyncReadExt | (tokio) | Streaming file reads | For >1GB files, read chunk-at-a-time |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom sliding window | QUIC streams (one stream per chunk) | QUIC already has flow control, but this couples too tightly to one transport -- relay path also needs window |
| tokio channels for pipeline | Direct async loop with semaphore | Channels add indirection; semaphore is simpler for bounded in-flight counting |

**No new crate dependencies are needed.** Everything required is already in the workspace.

## Architecture Patterns

### Current Architecture (what exists)

```
tallow send <file>
  |-> determine_source() -> SendSource::Files or Text
  |-> generate code phrase, derive room_id
  |-> establish connection (relay or direct LAN)
  |-> KEM Handshake (4-message: Init -> Response -> Kem -> Complete)
  |-> pipeline.set_session_key(handshake-derived key)
  |-> Send FileOffer (manifest), wait for FileAccept
  |-> For each file: chunk_file() -> [Chunk messages]
  |-> For each chunk: send -> wait for Ack -> send next (STOP AND WAIT)
  |-> Send TransferComplete
  |-> Close

tallow receive <code>
  |-> derive room_id from code
  |-> establish connection
  |-> KEM Handshake (mirror of sender)
  |-> Receive FileOffer -> process_offer() -> display + confirm
  |-> Send FileAccept
  |-> Loop: receive Chunk -> process_chunk(decrypt, store) -> send Ack
  |-> finalize() -> reassemble, decompress, verify BLAKE3, write files
  |-> Close
```

### Pattern 1: Sliding Window Sender (N=8)

**What:** Instead of stop-and-wait (send 1, wait ack, send next), maintain up to N chunks in-flight simultaneously. Use a `tokio::sync::Semaphore` with N=8 permits.

**When to use:** Always (replaces current stop-and-wait).

**Architecture:**
```
Sender loop:
  1. Acquire semaphore permit (blocks if 8 already in-flight)
  2. Send chunk via channel.send_message()
  3. Spawn task or use select! to receive acks:
     - On ack: release permit, update progress
     - On error: abort

Key insight: Cannot truly send+receive in parallel on PeerChannel
because it's &mut self. Use alternating pattern instead:

  while chunks_remaining > 0 {
      // Send up to window_size chunks
      let mut in_flight = 0;
      while in_flight < WINDOW_SIZE && chunks_remaining > 0 {
          send next chunk
          in_flight += 1
          chunks_remaining -= 1
      }
      // Drain acks for all sent chunks
      while in_flight > 0 {
          receive ack
          in_flight -= 1
          update progress
      }
  }
```

**CRITICAL constraint:** The `PeerChannel` trait takes `&mut self` for both send and receive. You CANNOT concurrently send chunks and receive acks on the same channel. The pattern must be "send batch, then drain acks" rather than truly concurrent send+receive. This is the same constraint croc and magic-wormhole face with TCP connections.

### Pattern 2: Streaming File I/O for Large Files

**What:** Read files in 64KB chunks using `tokio::fs::File` + `AsyncReadExt::read_buf()` instead of `tokio::fs::read()` which loads the entire file into memory.

**When to use:** Always (for correctness with >1GB files).

**Architecture:**
```
Send side:
  let file = tokio::fs::File::open(path).await?;
  let mut reader = BufReader::new(file);
  let mut chunk_buf = vec![0u8; chunk_size];
  loop {
      let n = reader.read(&mut chunk_buf).await?;
      if n == 0 { break; }
      compress chunk_buf[..n]
      encrypt compressed data
      send as Chunk message
  }
```

### Pattern 3: Merkle Tree for Transfer Integrity

**What:** Build a Merkle tree from chunk hashes before transfer. Include the root in the manifest. Receiver verifies each chunk hash contributes to the root.

**When to use:** For files >64KB (multiple chunks). Single-chunk files use the existing per-file BLAKE3 hash.

**Architecture:**
```
Sender:
  1. Scan files, compute per-chunk hashes (BLAKE3 of compressed+encrypted chunk data)
  2. Build MerkleTree::build(chunk_hashes)
  3. Include merkle_root in FileManifest
  4. Optionally include proof with each chunk (or let receiver verify at end)

Receiver:
  1. Collect chunk hashes as chunks arrive
  2. After all chunks: build MerkleTree, verify root matches manifest
  3. Alternative: verify per-chunk proof on arrival (more complex, higher bandwidth)

Recommended: End-of-transfer verification (simpler, lower bandwidth).
The per-file BLAKE3 verification already in finalize() provides integrity.
Merkle tree adds the ability to pinpoint which chunk was corrupted.
```

### Pattern 4: Resume Negotiation Protocol

**What:** After reconnecting with the same code phrase, the receiver tells the sender which chunks it already has, and the sender skips them.

**Architecture:**
```
Resume flow:
  1. Receiver loads checkpoint from disk (if exists)
  2. After KEM handshake + FileOffer, receiver sends a ResumeRequest
     message containing the set of verified chunk indices
  3. Sender receives ResumeRequest, marks those chunks as already-sent
  4. Sender sends only missing chunks
  5. Transfer proceeds normally from there

Wire message needed:
  Message::ResumeRequest {
      transfer_id: [u8; 16],
      manifest_hash: [u8; 32],       // verify same transfer
      verified_chunks: Vec<u64>,      // chunks already received
  }
```

### Anti-Patterns to Avoid

- **Full-file memory read for large files:** `tokio::fs::read()` loads entire file into RAM. A 2GB file = 2GB allocation. Use streaming reads.
- **Compress-then-chunk for large files:** Current pipeline compresses all file data then splits into chunks. For a 2GB file this requires 2GB+ in memory twice (original + compressed). Compress per-chunk instead.
- **Sending chunks on the wire codec framing layer with inline data:** Current design embeds chunk data in the `Message::Chunk` enum. This is fine for 64KB chunks but means every chunk goes through postcard serialization. For large chunk sizes (up to 4MB), this is acceptable but watch for allocations.
- **Blocking file I/O in async context:** Use `tokio::fs` (which uses spawn_blocking internally) or explicit `spawn_blocking` for file operations. Current code already uses `tokio::fs` correctly.
- **Changing the KEM handshake:** The handshake is complete and correct. Do not modify it. Focus integration work on the transfer loop after the handshake.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progress display | Custom terminal output | `indicatif::ProgressBar` (already used) | Handles terminal width, rate calculation, ETA |
| File hashing | Custom hasher | `blake3::hash()` (already used) | Streaming, fast, correct |
| Merkle tree | Custom tree | `tallow_crypto::hash::MerkleTree` (already exists) | Has proofs, constant-time verify, domain separation |
| Wire framing | Custom framing | `TallowCodec` (already exists) | 4-byte BE length prefix, max size checks |
| Nonce generation | Random nonces | Counter-based nonces (already implemented) | Guaranteed unique, deterministic, safe for AES-GCM |
| Key exchange | Any modification | `SenderHandshake`/`ReceiverHandshake` (already exists) | Complete, tested, transcript-bound, confirmed |
| Resume checkpoint format | Custom binary | `postcard` serialization of `ResumeState` (already exists) | Compact, versioned, roundtrip tested |
| Compression pipeline | Custom compressor | `compression::pipeline::compress/decompress` (already exists) | Supports zstd/lz4/brotli/lzma with entropy detection |

**Key insight:** The individual components are all built and tested. The work is wiring them together correctly for real-world conditions (large files, network failures, concurrent acks).

## Common Pitfalls

### Pitfall 1: AES-GCM Nonce Space Exhaustion
**What goes wrong:** Counter-based nonces use 8 bytes of the 12-byte nonce (the first 4 are zero). This gives 2^64 unique nonces per session key. For 64KB chunks at 2^64 chunks, the maximum transferable data is 2^64 * 64KB = effectively infinite. No issue.
**Why it matters:** If someone changes the nonce scheme to random, the birthday bound becomes dangerous (~2^48 for 96-bit random nonces).
**How to avoid:** Keep counter-based nonces. Never switch to random nonces without switching to AES-GCM-SIV or XChaCha20.
**Warning signs:** Any code that calls `rand::random()` for nonce generation in the chunk encryption path.

### Pitfall 2: Memory Exhaustion on Large Files
**What goes wrong:** `tokio::fs::read(file)` loads entire file into memory. A 4GB file causes OOM.
**Why it happens:** The current `chunk_file()` method reads the entire file, compresses it all, then splits into chunks.
**How to avoid:** Stream file reads in chunk_size increments. Compress and encrypt each chunk independently.
**Warning signs:** `tokio::fs::read()` calls in the hot path for user-provided files.

### Pitfall 3: PeerChannel Borrow Conflict
**What goes wrong:** Trying to concurrently `send_message()` and `receive_message()` on the same `PeerChannel` instance.
**Why it happens:** Both methods take `&mut self`. Rust's borrow checker prevents this at compile time.
**How to avoid:** Use batch-send-then-drain-acks pattern. Or split the channel into separate send/receive halves (requires refactoring PeerChannel to use split ownership like tokio's `OwnedReadHalf`/`OwnedWriteHalf`).
**Warning signs:** Attempting to use `tokio::join!` or `tokio::select!` with both send and receive on the same channel reference.

### Pitfall 4: Compression Before vs After Chunking
**What goes wrong:** If you compress per-chunk, each chunk compresses independently with less context, resulting in worse compression ratio. If you compress the whole file, you need it all in memory.
**Why it happens:** Zstd has a "streaming" mode but the current `compression::pipeline` API operates on byte slices.
**How to avoid:** For Phase 17, compress per-chunk. The ratio loss is small for zstd (it uses dictionaries) and the memory savings are critical. Future optimization: use zstd streaming with linked dictionaries.
**Warning signs:** Allocating a `Vec<u8>` equal to the file size anywhere in the pipeline.

### Pitfall 5: Resume State Consistency
**What goes wrong:** The sender generates a new random transfer_id on every invocation. If the sender restarts, the transfer_id changes, and the receiver's checkpoint (keyed by transfer_id) doesn't match.
**Why it happens:** transfer_id is `rand::random()` in `send.rs`.
**How to avoid:** For resume, derive transfer_id deterministically from the code phrase + some stable salt. Or use the manifest_hash as the checkpoint key instead of transfer_id.
**Warning signs:** Receiver checkpoint file names using `hex::encode(transfer_id)` -- these will never match after sender restart.

### Pitfall 6: Decompression in finalize() Requires All Chunks in Memory
**What goes wrong:** `ReceivePipeline::finalize()` reassembles ALL chunks into a single `Vec<u8>`, then decompresses, then splits by file offsets. For a 2GB transfer, this requires 2GB+ in memory.
**Why it happens:** The current design concatenates all received chunks then decompresses as one blob.
**How to avoid:** If compression is per-chunk, decompress each chunk individually during `process_chunk()` and write directly to a temp file. Then in finalize(), just verify hashes and rename.
**Warning signs:** `let mut all_data = Vec::new(); for i in 0..manifest.total_chunks { all_data.extend_from_slice(chunk); }` -- this is the current code in `finalize()`.

## Code Examples

### Example 1: Sliding Window Send Loop (Batch Pattern)

```rust
// Source: Derived from existing send.rs pattern + sliding window requirement
const WINDOW_SIZE: usize = 8;

let mut chunk_iter = chunk_messages.iter().peekable();
let mut in_flight: usize = 0;
let mut acked: u64 = 0;

while chunk_iter.peek().is_some() || in_flight > 0 {
    // Send up to WINDOW_SIZE chunks
    while in_flight < WINDOW_SIZE {
        if let Some(chunk_msg) = chunk_iter.next() {
            encode_buf.clear();
            codec.encode_msg(chunk_msg, &mut encode_buf)?;
            channel.send_message(&encode_buf).await?;
            in_flight += 1;
        } else {
            break; // No more chunks to send
        }
    }

    // Drain at least one ack (prevents deadlock)
    if in_flight > 0 {
        let n = channel.receive_message(&mut recv_buf).await?;
        let mut ack_buf = BytesMut::from(&recv_buf[..n]);
        match codec.decode_msg(&mut ack_buf)? {
            Some(Message::Ack { index, .. }) => {
                in_flight -= 1;
                acked += 1;
                // Update progress based on acked chunk data size
                progress.update(/* bytes */);
            }
            Some(Message::TransferError { error, .. }) => {
                return Err(/* error */);
            }
            _ => { /* unexpected */ }
        }
    }
}
```

### Example 2: Streaming File Read + Per-Chunk Compress/Encrypt

```rust
// Source: Derived from existing chunk_file() + streaming requirement
use tokio::io::AsyncReadExt;

pub async fn stream_chunks(
    &self,
    file_path: &Path,
    start_index: u64,
    channel: &mut impl PeerChannel,
    codec: &mut TallowCodec,
) -> Result<u64> {
    let file = tokio::fs::File::open(file_path).await?;
    let mut reader = tokio::io::BufReader::new(file);
    let mut chunk_buf = vec![0u8; self.chunk_config.size];
    let mut chunk_index = start_index;

    loop {
        let n = reader.read(&mut chunk_buf).await?;
        if n == 0 { break; }

        // Compress this chunk independently
        let compressed = compression::pipeline::compress(
            &chunk_buf[..n], self.compression
        )?;

        // Encrypt with counter-based nonce
        let aad = chunking::build_chunk_aad(&self.transfer_id, chunk_index);
        let nonce = chunking::build_chunk_nonce(chunk_index);
        let encrypted = tallow_crypto::symmetric::aes_encrypt(
            &self.session_key, &nonce, &compressed, &aad
        )?;

        // Build and send message
        let msg = Message::Chunk {
            transfer_id: self.transfer_id,
            index: chunk_index,
            total: None, // Set on final chunk
            data: encrypted,
        };

        chunk_index += 1;
        // ... send via sliding window
    }

    Ok(chunk_index - start_index)
}
```

### Example 3: Merkle Tree Integration

```rust
// Source: tallow_crypto::hash::MerkleTree (already exists)
use tallow_crypto::hash::MerkleTree;

// Sender side: build tree from chunk hashes
let chunk_hashes: Vec<[u8; 32]> = chunks.iter()
    .map(|c| blake3::hash(&c.data).into())
    .collect();
let tree = MerkleTree::build(chunk_hashes);
manifest.merkle_root = Some(tree.root());

// Receiver side: verify after all chunks received
let received_hashes: Vec<[u8; 32]> = (0..total_chunks)
    .map(|i| blake3::hash(&received_chunks[&i]).into())
    .collect();
let tree = MerkleTree::build(received_hashes);
if !tallow_crypto::mem::constant_time::ct_eq(&tree.root(), &manifest.merkle_root.unwrap()) {
    return Err(ProtocolError::TransferFailed("Merkle root mismatch".into()));
}
```

### Example 4: Resume Negotiation

```rust
// After FileOffer/FileAccept exchange, receiver can send resume info:

// New wire message (add to Message enum):
Message::ResumeInfo {
    transfer_id: [u8; 16],
    manifest_hash: [u8; 32],
    verified_chunks: Vec<u64>,
}

// Receiver side (after process_offer):
if let Some(ref resume) = self.resume {
    let resume_msg = Message::ResumeInfo {
        transfer_id: self.transfer_id,
        manifest_hash: resume.manifest_hash,
        verified_chunks: resume.verified_chunks.iter().copied().collect(),
    };
    // Send to sender
}

// Sender side: skip already-verified chunks
let skip_set: HashSet<u64> = verified_chunks.into_iter().collect();
for chunk_msg in chunk_messages {
    if let Message::Chunk { index, .. } = &chunk_msg {
        if skip_set.contains(index) { continue; }
    }
    // ... send chunk
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Code phrase derives session key (v1) | KEM handshake derives session key (v2) | Already done | Session key NOT from code phrase -- code phrase only for PAKE auth |
| Random nonces for AES-GCM | Counter-based nonces | Already done | No birthday bound risk, guaranteed unique |
| Single transport (relay only) | Direct LAN + relay fallback | Already done | Better performance on LAN |
| Stop-and-wait chunks | Sliding window (N=8) | **NEEDS IMPLEMENTATION** | ~8x throughput improvement on high-latency links |
| Full file in memory | Streaming per-chunk | **NEEDS IMPLEMENTATION** | Enables >1GB transfers without OOM |
| Per-file BLAKE3 only | Merkle tree over chunks | **NEEDS IMPLEMENTATION** | Pinpoint corrupt chunks, stronger integrity |

**Deprecated/outdated:**
- `derive_session_key_from_phrase()` and `derive_session_key_with_salt()` in kex.rs are correctly marked `#[deprecated]` and are NOT used in the active transfer path.
- The old protocol path (receiving `FileOffer` instead of `HandshakeInit` as first message) is correctly rejected with a version mismatch error.

## Open Questions

1. **Per-chunk vs whole-file compression for resume**
   - What we know: Current pipeline compresses the entire file then chunks. Per-chunk compression enables streaming and resume. Zstd per-chunk compression loses ~5-15% ratio but enables streaming.
   - What's unclear: Should we support mixed mode (small files: whole-file, large files: per-chunk)?
   - Recommendation: Always per-chunk for simplicity. The ratio loss is acceptable.

2. **Transfer ID stability for resume**
   - What we know: Currently `rand::random()`, so it changes each session. Checkpoints keyed by transfer_id won't match across restarts.
   - What's unclear: Should transfer_id be deterministic (derived from code phrase + file hashes) or should the checkpoint key use manifest_hash?
   - Recommendation: Use `manifest_hash` as the checkpoint key, not `transfer_id`. The manifest_hash is deterministic for the same set of files and uniquely identifies the transfer content.

3. **Sliding window with PeerChannel &mut self**
   - What we know: PeerChannel requires `&mut self` for both send and receive, preventing true concurrent send+receive.
   - What's unclear: Is it worth refactoring PeerChannel to support split ownership (like tokio's `split()` on TcpStream)?
   - Recommendation: Use batch-send-then-drain pattern for Phase 17. It achieves most of the throughput benefit. Full split can be a future optimization.

4. **Resume across different code phrases**
   - What we know: Same code phrase = same room_id = same relay room, but different KEM session key each time.
   - What's unclear: How to handle the case where a receiver has a checkpoint from code phrase A, then receives code phrase B for the same files?
   - Recommendation: Verify manifest_hash match before applying resume. If manifest differs, discard checkpoint and start fresh.

## Sources

### Primary (HIGH confidence)
- `E:/Tallow/crates/tallow/src/commands/send.rs` -- Full sender implementation with KEM handshake, file offer, chunk loop
- `E:/Tallow/crates/tallow/src/commands/receive.rs` -- Full receiver implementation with KEM handshake, chunk processing, finalize
- `E:/Tallow/crates/tallow-protocol/src/kex.rs` -- Complete 4-message KEM handshake (CPace + hybrid KEM + HKDF + confirmation)
- `E:/Tallow/crates/tallow-protocol/src/transfer/send.rs` -- SendPipeline with `set_session_key()`, `chunk_file()`, `chunk_data()`
- `E:/Tallow/crates/tallow-protocol/src/transfer/receive.rs` -- ReceivePipeline with `process_chunk()`, `finalize()`, resume
- `E:/Tallow/crates/tallow-protocol/src/transfer/chunking.rs` -- Counter nonces, AAD, chunk splitting
- `E:/Tallow/crates/tallow-protocol/src/transfer/resume.rs` -- ResumeState with checkpoint/restore
- `E:/Tallow/crates/tallow-crypto/src/kem/hybrid.rs` -- ML-KEM-1024 + X25519 hybrid KEM
- `E:/Tallow/crates/tallow-crypto/src/hash/merkle.rs` -- MerkleTree with proofs and constant-time verify
- `E:/Tallow/crates/tallow-net/src/transport/peer_channel.rs` -- PeerChannel trait (&mut self constraint)
- `E:/Tallow/crates/tallow-net/src/transport/connection.rs` -- ConnectionResult enum, establish_sender/receiver_connection
- `E:/Tallow/crates/tallow-net/src/relay/client.rs` -- RelayClient implementing PeerChannel
- `E:/Tallow/crates/tallow-protocol/src/wire/messages.rs` -- All Message variants including handshake messages
- `E:/Tallow/crates/tallow-protocol/src/wire/codec.rs` -- TallowCodec with 4-byte BE framing

### Secondary (MEDIUM confidence)
- [Quinn data transfer docs](https://quinn-rs.github.io/quinn/quinn/data-transfer.html) -- Bidirectional stream patterns
- [Magic-Wormhole file transfer protocol](https://magic-wormhole.readthedocs.io/en/latest/file-transfer-protocol.html) -- Reference for transit/relay patterns
- [Croc resume issue #89](https://github.com/schollz/croc/issues/89) -- Resume capability patterns in similar tools
- [AES-GCM nonce analysis](https://neilmadden.blog/2024/05/23/galois-counter-mode-and-random-nonces/) -- Counter vs random nonce safety bounds

### Tertiary (LOW confidence)
- None -- all critical claims verified against codebase directly

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in workspace, versions verified in Cargo.toml
- Architecture: HIGH -- current implementation thoroughly reviewed, gaps precisely identified
- Pitfalls: HIGH -- derived from actual code review, not hypothetical scenarios

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable -- no external API changes expected)
