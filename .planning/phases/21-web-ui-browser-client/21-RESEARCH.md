# Phase 21: Web UI / Browser Client - Research

**Researched:** 2026-02-21 (updated)
**Domain:** Rust-to-WASM compilation, browser cryptography, WebSocket transport, browser file handling, Clipboard API, real-time chat
**Confidence:** MEDIUM-HIGH (crypto compat verified via official docs; transport architecture well-understood; Clipboard API well-documented; chat reuses existing Message variants)

## Summary

Phase 21 adds a browser-based client that interoperates with the existing CLI for **file transfer, clipboard sharing, and encrypted chat**. The core challenges are: (1) compiling tallow-crypto to WebAssembly so the browser performs identical post-quantum cryptography, (2) adding a WebSocket transport layer to the relay so browsers can communicate with QUIC-connected CLI peers, (3) building a web UI for file selection, progress display, and code phrase entry, (4) integrating the browser Clipboard API for reading/writing text and images to interop with `tallow clip`, and (5) real-time E2E encrypted chat interoperable with `tallow chat`.

The good news: **all critical crypto dependencies compile to wasm32-unknown-unknown**. The fips203 crate (ML-KEM-1024) v0.4.1 explicitly advertises browser/WASM support with a `/wasm` example directory. The x25519-dalek, aes-gcm, blake3, hkdf, sha2, and postcard crates are all pure Rust with no_std support. The primary complication is getrandom, which requires the `js` feature (in the 0.2.x series that tallow currently uses) to use `crypto.getRandomValues()` in the browser. The tallow-crypto crate's platform-specific code (mlock, core dump prevention) is already gated behind `#[cfg(unix)]` with no-op fallbacks, so WASM compilation should work with minimal changes.

The relay needs a WebSocket listener alongside its existing QUIC endpoint. The most practical approach is adding axum + tokio-tungstenite to tallow-relay, running an HTTP/WebSocket server on a second port. The relay bridges WebSocket clients to QUIC clients transparently -- the room/forwarding logic is shared, only the transport differs. For TLS on the WebSocket endpoint, use Caddy as a reverse proxy with automatic Let's Encrypt certificates -- this is dramatically simpler than integrating ACME into the relay binary.

**Primary recommendation:** Create a new `tallow-web` crate (cdylib) that compiles tallow-crypto + postcard serialization to WASM, expose key operations via wasm-bindgen, and build a vanilla TypeScript + HTML frontend (no heavy framework) that communicates with the relay over WebSocket. Add WebSocket support to tallow-relay as a second listener. The web UI includes three modes: file transfer (drag-and-drop send/receive), clipboard sharing (paste to send, auto-copy on receive, interop with `tallow clip`), and encrypted chat (real-time messaging, interop with `tallow chat`).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WEB-01 | tallow-crypto compiles to wasm32-unknown-unknown target without errors | fips203 v0.4.1 has explicit WASM examples; all deps are pure Rust no_std; getrandom 0.2 `js` feature provides randomness |
| WEB-02 | tallow-web cdylib crate with wasm-bindgen exports for hybrid KEM, AES-256-GCM, BLAKE3, HKDF | Pattern 1 (thin WASM wrapper) + wasm-bindgen 0.2.108 + Code Examples section |
| WEB-03 | tallow-protocol feature-gated (`wasm` feature) so wire module compiles for WASM without heavy deps | tallow-protocol depends on tokio, zstd (C lib), tar, notify -- feature-gate wire module to exclude these |
| WEB-04 | Relay server accepts WebSocket connections alongside QUIC for browser clients | axum 0.8.8 WebSocket extractor + Pattern 2 (WS-to-Room bridge) |
| WEB-05 | WebSocket-to-QUIC message bridging: relay adds/strips 4-byte length prefix | Pattern 4 (WS binary = one protocol message) with length prefix adapter |
| WEB-06 | CORS headers on WebSocket endpoint allow cross-origin browser connections | tower-http 0.6.x CorsLayer; note pure WS upgrades are NOT subject to CORS preflight |
| WEB-07 | Browser WebSocket transport connects to relay, joins room, exchanges postcard messages | web-sys 0.3.85 WebSocket API + wasm-bindgen-futures 0.4.x |
| WEB-08 | Browser performs full KEM handshake with CLI peer via WASM crypto | WASM-compiled tallow-crypto hybrid KEM; fips203 WASM verified |
| WEB-09 | Browser can send files via drag-and-drop with 64KB chunked AES-256-GCM encryption | Pattern 3 (Blob.slice chunking) + WASM encrypt_chunk |
| WEB-10 | Browser can receive files from CLI peer with progressive decryption and download | StreamSaver.js 2.0.x for streaming to disk; OPFS as future alternative |
| WEB-11 | Browser displays real-time transfer progress (speed, percentage, ETA) | Vanilla TS progress calculation; same chunk counter as CLI |
| WEB-12 | Browser clipboard sharing sends text/images E2E encrypted, interoperable with `tallow clip` | Pattern 5 (Clipboard API) + navigator.clipboard.readText/read |
| WEB-13 | Received clipboard content auto-copies to browser clipboard via Clipboard API | navigator.clipboard.writeText/write with ClipboardItem for images |
| WEB-14 | Browser chat sends/receives E2E encrypted messages interoperable with `tallow chat` | Pattern 6 (encrypted chat) with domain-separated nonces |
| WEB-15 | All received text sanitized via sanitize_display() before rendering | WASM-compiled sanitize_display from tallow-protocol wire module |
| WEB-16 | Typing indicators sent/received between browser and CLI chat peers | Message::TypingIndicator already in wire protocol |
| WEB-17 | Web app installable as PWA (manifest.json, service worker) | Minimal hand-written service worker for cache + StreamSaver.js SW |
| WEB-18 | WASM crypto produces identical output to native for KEM, AES-GCM, BLAKE3 | Cross-target cargo test (native + wasm32) with identical inputs/outputs |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| wasm-bindgen | 0.2.108 | Rust-JS interop, type generation | Foundational crate for all Rust-to-WASM browser work; 225M+ downloads, actively maintained under new wasm-bindgen org (transferred from rustwasm July 2025) |
| web-sys | 0.3.85 | Browser API bindings (WebSocket, File, Crypto, DOM, Clipboard) | Official companion to wasm-bindgen; feature-gated per API |
| js-sys | 0.3.x | JavaScript built-in type bindings | Needed for Uint8Array, ArrayBuffer, Promise interop |
| getrandom | 0.2.17 | Randomness for crypto (wraps crypto.getRandomValues) | Already used by tallow workspace at 0.2.x; needs `js` feature for wasm32-unknown-unknown browser target |
| postcard | 1.1.3 | Wire protocol serialization | Already used by tallow-protocol; no_std compatible, works in WASM, 16.8M+ downloads |
| axum | 0.8.8 | HTTP/WebSocket server for relay | Tokio-native, first-class WebSocket support via extract::ws module, actively maintained (latest release Jan 2026) |
| tokio-tungstenite | 0.27.0 | WebSocket protocol implementation | Pairs with axum for server-side WS; v0.27 has improved performance over 0.26 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| wasm-bindgen-futures | 0.4.x | Bridge JS Promises and Rust Futures | Any async operation in WASM (WebSocket send/recv, file reading) |
| serde-wasm-bindgen | 0.6.5 | Efficient serde <-> JsValue conversion | Passing structured data between Rust WASM and JS |
| console_error_panic_hook | 0.1.7 | Route Rust panics to browser console | Debug and release builds; essential for diagnosing WASM panics |
| wasm-opt | (CLI, via binaryen) | WASM binary size optimization | Release builds; typically 20-40% size reduction with `-Oz` |
| StreamSaver.js | 2.0.x | Stream large files to disk without memory buffering | Receiving files >100MB in the browser; still maintained, no replacement yet |
| tower-http | 0.6.x | CORS middleware, compression | CorsLayer on relay WebSocket endpoint |
| tower | 0.5.x | Service trait, middleware composition | Required by axum for service composition |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla TS + HTML | Leptos (Rust WASM framework) | Leptos is excellent but adds 200KB+ to WASM binary and full-Rust-frontend complexity; overkill for a single-page file transfer UI |
| Vanilla TS + HTML | React/Svelte/Solid | Adds JS framework dependency, build tooling complexity; this is a single-page app with <10 components |
| axum (relay WS) | warp | warp is lighter but axum has better ecosystem momentum and WebSocket ergonomics |
| StreamSaver.js | File System Access API (showSaveFilePicker) | FSAA only has ~34% global browser support -- Chrome/Edge only, zero Safari/Firefox support. StreamSaver.js works everywhere via ServiceWorker |
| StreamSaver.js | OPFS (Origin Private File System) | OPFS is supported by all modern browsers since 2023, but it's a sandboxed filesystem (not user-visible download). Could be used for temp storage during transfer, but not for the final "save file" UX. Future optimization, not primary path. |
| WebSocket | WebTransport | WebTransport has ~82% global support (Chrome, Firefox, Edge) but zero Safari support. Part of Interop 2026 initiative, so Safari support is expected but not yet shipped. Premature for production when Safari users cannot connect at all. |
| getrandom 0.2 | getrandom 0.3/0.4 | getrandom 0.4.1 is latest, but tallow workspace pins 0.2.17. Upgrading breaks transitive deps (rand 0.8 uses getrandom 0.2). The `js` feature in 0.2 works fine. Do NOT upgrade getrandom for this phase. |
| Caddy (TLS proxy) | nginx | Caddy provides automatic HTTPS (Let's Encrypt) with zero config and native WebSocket proxy detection. nginx requires manual certbot setup + explicit Upgrade/Connection header config. Caddy wins for simplicity. |

**Installation (relay side):**
```toml
# In tallow-relay/Cargo.toml (new dependencies)
axum = { version = "0.8", features = ["ws"] }
tokio-tungstenite = "0.27"
tower = "0.5"
tower-http = { version = "0.6", features = ["cors"] }
```

**Installation (WASM crate):**
```toml
# In tallow-web/Cargo.toml
[lib]
crate-type = ["cdylib"]

[dependencies]
tallow-crypto = { path = "../tallow-crypto" }
wasm-bindgen = "0.2"
web-sys = { version = "0.3", features = [
    "WebSocket", "File", "Blob", "FileReader", "MessageEvent",
    "BinaryType", "Url", "console", "Clipboard", "ClipboardItem",
    "ClipboardEvent", "Navigator", "Permissions", "PermissionStatus"
] }
js-sys = "0.3"
wasm-bindgen-futures = "0.4"
serde = { version = "1", features = ["derive"] }
postcard = { version = "1.1", default-features = false, features = ["alloc"] }
getrandom = { version = "0.2", features = ["js"] }
console_error_panic_hook = "0.1"
```

**CRITICAL: getrandom feature name:**
- getrandom 0.2.x uses feature `"js"` for WASM browser support
- getrandom 0.3.x renamed it to `"wasm_js"`
- getrandom 0.4.x also uses `"wasm_js"`
- Tallow uses getrandom 0.2.17 workspace-wide. Use `"js"`, NOT `"wasm_js"`.

**CRITICAL: postcard in WASM:**
- The workspace postcard uses `features = ["use-std"]`
- For the WASM crate, use `default-features = false, features = ["alloc"]` to avoid pulling in std

**Build workflow (replaces archived wasm-pack):**
```bash
# Step 1: Build WASM
cargo build -p tallow-web --release --target wasm32-unknown-unknown

# Step 2: Generate JS bindings
wasm-bindgen --target web \
    ./target/wasm32-unknown-unknown/release/tallow_web.wasm \
    --out-dir ./web/pkg

# Step 3: Optimize (release only)
wasm-opt -Oz ./web/pkg/tallow_web_bg.wasm -o ./web/pkg/tallow_web_bg.wasm
```

## Architecture Patterns

### Recommended Project Structure

```
crates/
  tallow-web/              # NEW: WASM crate (cdylib)
    src/
      lib.rs               # wasm-bindgen entry, init, panic hook
      crypto.rs            # Thin wasm-bindgen wrappers around tallow-crypto
      codec.rs             # Postcard encode/decode for Message (no tokio dependency)
      transport.rs         # WebSocket client (web-sys WebSocket)
      transfer.rs          # File chunking, send/receive state machine
      clipboard.rs         # Clipboard content type detection, encode/decode
      chat.rs              # Chat message encryption, nonce management, sanitization
      file_io.rs           # Browser File/Blob reading, download triggering
    Cargo.toml
  tallow-relay/
    src/
      websocket.rs         # NEW: axum WebSocket listener + bridge to room system
      server.rs            # Modified: spawns both QUIC and WS listeners
web/                       # NEW: Static frontend
    index.html
    style.css
    app.ts                 # Main application logic, routing between modes
    transfer.ts            # File transfer UI (drag-and-drop, progress)
    clipboard.ts           # Clipboard sharing UI (paste, copy, watch mode)
    chat.ts                # Chat UI (message list, input, typing indicators)
    worker.ts              # Service worker for PWA + StreamSaver
    manifest.json          # PWA manifest
    pkg/                   # wasm-bindgen output (generated)
```

### Pattern 1: Thin WASM Wrapper Over Existing Crypto

**What:** tallow-web does NOT reimplement crypto. It imports tallow-crypto and exposes specific functions via `#[wasm_bindgen]`. The WASM module is a thin adapter layer.

**When to use:** Always. This ensures browser and CLI use identical cryptographic code paths.

**Example:**
```rust
// tallow-web/src/crypto.rs
use wasm_bindgen::prelude::*;
use tallow_crypto::kem::hybrid;
use tallow_crypto::symmetric;

#[wasm_bindgen]
pub struct WasmKeyPair {
    inner: hybrid::HybridKeyPair,
}

#[wasm_bindgen]
impl WasmKeyPair {
    #[wasm_bindgen(constructor)]
    pub fn generate() -> Result<WasmKeyPair, JsValue> {
        let kp = hybrid::HybridKeyPair::generate()
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(WasmKeyPair { inner: kp })
    }

    pub fn public_key_bytes(&self) -> Vec<u8> {
        self.inner.public_key_bytes()
    }
}

#[wasm_bindgen]
pub fn encrypt_chunk(key: &[u8], nonce_counter: u64, aad: &[u8], plaintext: &[u8]) -> Result<Vec<u8>, JsValue> {
    symmetric::aes_gcm_encrypt(key, nonce_counter, aad, plaintext)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
```

### Pattern 2: WebSocket-to-Room Bridge in Relay

**What:** The relay runs an axum HTTP/WebSocket server on a separate port (e.g., 4434). WebSocket connections go through the same room join, forwarding, and authentication logic as QUIC connections. Each WebSocket message maps to one protocol message.

**When to use:** For all browser-to-relay communication.

**Example:**
```rust
// tallow-relay/src/websocket.rs
use axum::{extract::ws::{WebSocket, WebSocketUpgrade, Message as WsMsg}, routing::get, Router};
use std::sync::Arc;
use crate::room::RoomManager;

pub fn ws_router(room_manager: Arc<RoomManager>) -> Router {
    Router::new()
        .route("/ws", get(move |ws: WebSocketUpgrade| {
            let rm = room_manager.clone();
            async move { ws.on_upgrade(move |socket| handle_ws(socket, rm)) }
        }))
}

async fn handle_ws(mut socket: WebSocket, room_manager: Arc<RoomManager>) {
    // Read first binary message (RoomJoin)
    // Parse with postcard (same as QUIC path)
    // Join room, get peer_tx/peer_rx channels
    // Forward: WS messages -> peer channel, peer channel -> WS messages
    // The room system doesn't care about transport -- it just passes byte buffers
}
```

### Pattern 3: Chunked File Reading via Blob.slice()

**What:** Browser File objects are read in chunks using `Blob.slice(start, end)` + `FileReader.readAsArrayBuffer()`. Each chunk is passed to WASM for compression + encryption, then sent over WebSocket. This prevents loading the entire file into WASM memory.

**When to use:** Sending files from browser. The 64KB chunk size matches CLI behavior.

**Example (TypeScript side):**
```typescript
async function* readFileChunks(file: File, chunkSize: number = 65536): AsyncGenerator<Uint8Array> {
    let offset = 0;
    while (offset < file.size) {
        const slice = file.slice(offset, Math.min(offset + chunkSize, file.size));
        const buffer = await slice.arrayBuffer();
        yield new Uint8Array(buffer);
        offset += chunkSize;
    }
}
```

### Pattern 4: WebSocket Binary Message = One Protocol Message

**What:** Over WebSocket, each `send(ArrayBuffer)` delivers exactly one complete message to the receiver. Unlike QUIC streams (which are byte streams needing length-prefix framing), WebSocket messages are already framed. The browser client sends raw postcard-encoded bytes as a single WebSocket binary message. The relay WebSocket handler reads one WS message = one protocol message.

**When to use:** All WebSocket communication. This simplifies the browser codec -- no need to implement the 4-byte length prefix framing in JavaScript.

**Key detail:** The relay WebSocket bridge must add/remove the 4-byte length prefix when forwarding between WebSocket and QUIC peers, since QUIC peers expect length-prefixed framing.

### Pattern 5: Browser Clipboard Integration (Interop with `tallow clip`)

**What:** The browser reads/writes clipboard content using the Clipboard API (`navigator.clipboard.readText()`, `navigator.clipboard.read()` for images, `navigator.clipboard.writeText()`, `navigator.clipboard.write()`). Clipboard content is sent as the same wire message variants used by the CLI's `tallow clip` command. Content type detection (text, URL, image) reuses the same logic from `tallow-protocol`.

**When to use:** When the user clicks "Share Clipboard" or pastes content into the web UI.

**Key details:**
- `navigator.clipboard.readText()` requires user gesture (button click) + Permissions API grant
- `navigator.clipboard.read()` returns `ClipboardItem` objects with MIME types -- images come as `image/png` blobs
- On receive: text auto-copies via `navigator.clipboard.writeText()`; images via `navigator.clipboard.write([new ClipboardItem({"image/png": blob})])`
- Clipboard watch mode (like `tallow clip watch`) can use `setInterval` + hash comparison (no native clipboard change event in browsers)

**Example (TypeScript):**
```typescript
async function sendClipboard(ws: WebSocket, wasmCrypto: WasmModule) {
    // Read text clipboard (requires user gesture)
    const text = await navigator.clipboard.readText();
    if (!text) return;

    // Detect content type (URL, code, plain text)
    const contentType = wasmCrypto.detect_content_type(text);

    // Encrypt and encode as Message
    const encrypted = wasmCrypto.encrypt_chunk(sessionKey, 0, new TextEncoder().encode(text));
    const msg = wasmCrypto.encode_clipboard_message(transferId, contentType, encrypted);
    ws.send(msg.buffer);
}

async function receiveClipboard(data: Uint8Array, wasmCrypto: WasmModule) {
    const decrypted = wasmCrypto.decrypt_chunk(sessionKey, 0, data);
    const text = new TextDecoder().decode(decrypted);
    await navigator.clipboard.writeText(text);
    showNotification("Clipboard received and copied!");
}
```

### Pattern 6: Browser Encrypted Chat (Interop with `tallow chat`)

**What:** Real-time E2E encrypted messaging using the same `Message::ChatText` wire format as the CLI's `tallow chat` command. Messages are AES-256-GCM encrypted with the session key derived from the KEM handshake. The browser chat UI renders messages in a scrollable container with sender identification, timestamps, and sanitized display.

**When to use:** When the user enters chat mode in the web UI.

**Key details:**
- Uses existing `Message::ChatText { transfer_id, data }` -- `data` is AES-256-GCM encrypted UTF-8 text
- Per-message nonce: `[0u8; 4] || counter.to_be_bytes()`, AAD: `b"tallow-chat-v1"`, counter increments by 2
- Typing indicators: `Message::TypingIndicator { transfer_id, typing: bool }` -- sent on input debounced keypress
- Message sanitization: All received text is passed through WASM-compiled `sanitize_display()` before rendering (strips ANSI, limits length)
- Chat history: Stored in browser `sessionStorage` (cleared on tab close) -- NOT `localStorage` to avoid plaintext persistence

**Example (TypeScript):**
```typescript
class ChatSession {
    private messageCounter = 0;
    private history: ChatMessage[] = [];

    async sendMessage(text: string, ws: WebSocket, wasmCrypto: WasmModule) {
        // Sanitize outgoing text (length limit, strip control chars)
        const sanitized = text.substring(0, 4096);

        // Encrypt with session key, incrementing nonce counter
        const encrypted = wasmCrypto.encrypt_chat_message(
            sessionKey, this.messageCounter, sanitized
        );

        // Encode as Message::ChatText
        const msg = wasmCrypto.encode_chat_message(this.transferId, encrypted);
        ws.send(msg.buffer);

        this.messageCounter += 2; // increment by 2 per WEB-14 spec
        this.history.push({ sender: 'me', text: sanitized, timestamp: Date.now() });
    }

    receiveMessage(data: Uint8Array, wasmCrypto: WasmModule) {
        const decrypted = wasmCrypto.decrypt_chat_message(
            sessionKey, this.peerCounter, data
        );
        // Sanitize received text via WASM (same as CLI)
        const safe = wasmCrypto.sanitize_display(decrypted);
        this.peerCounter += 2;
        this.history.push({ sender: 'peer', text: safe, timestamp: Date.now() });
    }
}
```

### Anti-Patterns to Avoid

- **Full tallow-protocol in WASM:** Do NOT compile the entire tallow-protocol crate to WASM. It depends on tokio, tokio-util, notify, tar, zstd (C library via libzstd-sys), and many other crates that either don't compile to WASM or add massive binary bloat. Instead, compile only tallow-crypto + postcard + the Message enum (feature-gated).
- **WebCrypto for PQ crypto:** Do NOT use WebCrypto API for ML-KEM-1024 or BLAKE3. WebCrypto does not support post-quantum algorithms yet (WICG draft exists but no browser ships it as of Feb 2026). Use WASM-compiled tallow-crypto for all crypto. WebCrypto's AES-GCM COULD work but would create two code paths -- avoid it.
- **Loading entire files into WASM memory:** WASM linear memory is limited (typically 256MB-4GB depending on browser). A 2GB file loaded entirely would fail. Always stream chunks via Blob.slice().
- **React/Vue/Angular for the UI:** This is a single-page app with ~8 UI states (landing, connecting, handshake, file transfer, clipboard, chat, settings, done). A JavaScript framework adds build complexity, bundle size, and maintenance burden with minimal benefit.
- **JS-side chat message sanitization:** Do NOT re-implement ANSI stripping, control character removal, or length limiting in JavaScript. Use the WASM-compiled `sanitize_display()` from tallow-protocol. JS regex-based stripping will miss edge cases that the Rust version handles.
- **localStorage for chat history:** Do NOT store decrypted messages in localStorage. Use sessionStorage (cleared on tab close). Plaintext persistence on disk violates the zero-knowledge design.
- **Clipboard polling without hash dedup:** If implementing clipboard watch mode, always compare BLAKE3 hashes of clipboard content before re-sending. Without dedup, the same content triggers infinite re-sends.
- **Using wasm-pack:** wasm-pack was archived with the rustwasm org in July 2025. Use `cargo build --target wasm32-unknown-unknown` + `wasm-bindgen` CLI + `wasm-opt` directly. See build workflow above.
- **Upgrading getrandom to 0.3/0.4:** The workspace uses getrandom 0.2.17. The feature name for WASM changed from `"js"` (0.2.x) to `"wasm_js"` (0.3+). Upgrading would break rand 0.8 dependency chain. Stick with 0.2 + `"js"`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WASM-JS type marshaling | Custom FFI layer | wasm-bindgen + web-sys | Handles memory management, type conversion, lifetime safety |
| WebSocket client (browser) | Raw WebSocket wrapper | web-sys::WebSocket + wasm-bindgen-futures | Browser API is already high-level; wrapping adds no value |
| WebSocket server (relay) | Raw tokio-tungstenite handling | axum WebSocket extractor (extract::ws) | Handles upgrade, ping/pong, close frames, backpressure |
| Large file download to disk | Blob URL + download attribute | StreamSaver.js | Blob URLs buffer entire file in memory; StreamSaver streams to disk via ServiceWorker |
| Zstd decompression (browser) | Compile zstd C lib to WASM | fzstd (pure JS, 8KB) or skip compression for browser path | The C zstd library (libzstd-sys) won't compile to WASM; pure JS is smaller for decompress-only |
| CORS handling | Manual headers | tower-http CorsLayer | CORS is deceptively complex; one missed header breaks everything |
| PWA service worker | From scratch | Minimal hand-written SW (cache-versioned assets) | Cache invalidation is hard; keep it simple with explicit version strings |
| Postcard wire compat | Re-encode in JS | Compile postcard to WASM via tallow-web | Postcard's varint encoding is non-trivial; re-implementing risks incompatibility |
| Clipboard access (browser) | Custom clipboard hacks | navigator.clipboard API | Standard async API with permission model; works cross-browser |
| Chat message sanitization | JS-side regex stripping | WASM-compiled sanitize_display() | Must match CLI behavior exactly; ANSI/control char stripping is subtle |
| Chat nonce management | JS-side counter | WASM-compiled nonce builder with domain separation | Nonce reuse is catastrophic for AES-GCM; use the same Rust code path |
| Image clipboard encoding | Canvas-based conversion | Blob + ClipboardItem API | Browser handles PNG encoding natively; no manual pixel manipulation needed |
| TLS for WebSocket endpoint | Integrate ACME/Let's Encrypt into relay binary | Caddy reverse proxy | Caddy provides automatic HTTPS + WebSocket proxy with 3-line config |

**Key insight:** The entire value proposition of this phase is that the browser uses the SAME crypto, SAME wire protocol, SAME message sanitization, and SAME content type detection as the CLI. Any hand-rolled browser-side implementation of crypto, serialization, or security-critical text processing is a correctness risk and a maintenance burden. Compile Rust to WASM; don't rewrite in JavaScript.

## Common Pitfalls

### Pitfall 1: getrandom Fails at Runtime in WASM

**What goes wrong:** The WASM module compiles but panics at runtime with "getrandom not supported" when any crypto operation tries to generate random bytes.
**Why it happens:** getrandom 0.2.x requires explicit opt-in for wasm32-unknown-unknown via the `js` feature. Without it, the crate has no randomness source.
**How to avoid:** In tallow-web/Cargo.toml, add `getrandom = { version = "0.2", features = ["js"] }`. This must be a direct dependency of the WASM crate (not just transitive) to ensure the feature is enabled. **Note:** the feature is called `"js"` in 0.2.x (not `"wasm_js"` -- that's 0.3+).
**Warning signs:** Build succeeds but first call to `HybridKeyPair::generate()` panics in browser console.

### Pitfall 2: WASM Binary Too Large (>5MB)

**What goes wrong:** The WASM binary is 5-15MB, causing slow page loads (especially on mobile).
**Why it happens:** ML-KEM-1024 key generation, Argon2id, and BLAKE3 are all non-trivial code. Debug symbols, unoptimized builds, or pulling in tokio/std accidentally inflates the binary.
**How to avoid:** (1) Use `[profile.release]` with `opt-level = 'z'`, `lto = true`, `codegen-units = 1`. (2) Run `wasm-opt -Oz` post-build. (3) Use `twiggy top` to identify bloat sources. (4) Feature-gate: don't compile sig/ratchet/pake modules to WASM unless needed. (5) Target: ~1-2MB gzipped is achievable.
**Warning signs:** `cargo build --release` output >3MB before gzip.

### Pitfall 3: Argon2id with 256MB Memory in Browser

**What goes wrong:** Argon2id with the standard parameters (256MB memory, 3 iterations) causes the browser to freeze or crash on mobile devices.
**Why it happens:** The WASM linear memory must grow to accommodate 256MB for a single Argon2id invocation. Mobile browsers may have 512MB-1GB total memory budget for the tab.
**How to avoid:** For the browser client, Argon2id is used only for code-phrase-to-room-ID derivation (BLAKE3 hash) and PAKE authentication. The code phrase room ID uses BLAKE3 (no Argon2id). If Argon2id IS needed for any browser path, reduce parameters for browser (e.g., 64MB memory) and document the security tradeoff. Better: verify that the current handshake flow does NOT use Argon2id in the browser path.
**Warning signs:** "Out of memory" errors or tab crashes on mobile during connection setup.

### Pitfall 4: WebSocket Message Size Limits

**What goes wrong:** Large chunk messages (64KB payload + overhead) fail to send or receive over WebSocket.
**Why it happens:** Some WebSocket proxies (nginx, Cloudflare) have default message size limits (often 1MB or less). The relay's direct WebSocket has no inherent limit, but if a CDN/reverse proxy is in the path, it may truncate or reject large binary messages.
**How to avoid:** (1) Keep chunk size at 64KB (well under any reasonable limit). (2) Document relay WebSocket configuration for reverse proxy users. (3) The browser WebSocket API itself has no practical message size limit. (4) If using Caddy, configure `request_body max_size` appropriately.
**Warning signs:** Transfers fail partway through with WebSocket close code 1009 (message too big).

### Pitfall 5: Mixed Content Blocking (HTTPS Page + WSS)

**What goes wrong:** The web UI loads over HTTPS (GitHub Pages or similar) but WebSocket connections to `ws://129.146.114.5:4434` are blocked by the browser.
**Why it happens:** Browsers block mixed content -- an HTTPS page cannot open a non-secure WebSocket (ws://) connection. The relay must support WSS (WebSocket Secure).
**How to avoid:** Use Caddy as a reverse proxy on the relay VM with automatic Let's Encrypt TLS. Caddy handles WSS termination and proxies to the relay's internal WS port. Requires a domain name (e.g., relay.tallow.app) pointed at the Oracle Cloud VM. Caddy config:
```
relay.tallow.app {
    reverse_proxy localhost:4434
}
```
**Warning signs:** Browser console shows "Mixed Content: blocked" or WebSocket connection immediately fails.

### Pitfall 6: Cross-Origin Resource Sharing (CORS)

**What goes wrong:** The static site (e.g., web.tallow.app) cannot establish WebSocket connections to the relay (relay.tallow.app).
**Why it happens:** While pure WebSocket upgrade requests (no fetch API) are NOT subject to CORS preflight, some browser configurations or future spec changes may require it. The HTTP upgrade handshake itself is a cross-origin request.
**How to avoid:** Add CORS headers to the relay's HTTP/WebSocket endpoint via tower-http CorsLayer as defensive measure. Allow the web UI's origin. Test thoroughly with both same-origin and cross-origin deployments.
**Warning signs:** "CORS policy" errors in browser console during WebSocket connect.

### Pitfall 7: Clipboard API Requires Secure Context + User Gesture

**What goes wrong:** `navigator.clipboard.readText()` throws a DOMException or returns undefined silently.
**Why it happens:** The Clipboard API requires: (1) a secure context (HTTPS), (2) a user gesture (click/keypress), and (3) Permissions API grant. Reading images via `navigator.clipboard.read()` has even stricter requirements -- Chrome requires the "clipboard-read" permission and a focus event.
**How to avoid:** (1) Always gate clipboard reads behind a button click handler. (2) Use `navigator.permissions.query({name: "clipboard-read"})` to check before attempting. (3) Provide a fallback textarea for manual paste (`Ctrl+V`) if Clipboard API is denied. (4) Never attempt clipboard reads on page load or in background.
**Warning signs:** "DOMException: Document is not focused" or "NotAllowedError" in browser console.

### Pitfall 8: Chat Message Nonce Collision Between File and Chat

**What goes wrong:** Chat messages and file chunks share the same nonce counter space, causing AES-GCM nonce reuse.
**Why it happens:** If both file transfer and chat use counter-based nonces starting from 0 with the same session key, the nonce for chunk 0 and chat message 0 will be identical -- catastrophic for AES-GCM security.
**How to avoid:** Use domain separation via distinct AAD values (already done in CLI -- chat AAD uses `b"tallow-chat-v1"`, file AAD uses chunk-index-based AAD). Additionally, the chat nonce format `[0u8;4]||counter.to_be_bytes()` with counter incrementing by 2 provides distinct nonce space from file chunk nonces. Verify the browser implementation matches the CLI nonce construction exactly.
**Warning signs:** Hard to detect -- no runtime error, but nonce reuse completely breaks AES-GCM confidentiality.

### Pitfall 9: Chat History Persisted in localStorage Leaks Plaintext

**What goes wrong:** Decrypted chat messages stored in `localStorage` persist after the session ends -- anyone with physical access to the device can read them.
**Why it happens:** Developers default to `localStorage` for persistence. Unlike the CLI (which stores nothing), browser data persists until explicitly cleared.
**How to avoid:** Use `sessionStorage` (cleared when tab closes) for chat history. Never write decrypted messages to `localStorage` or IndexedDB. On session end, explicitly clear `sessionStorage`.
**Warning signs:** Chat messages visible in browser DevTools > Application > Local Storage after tab close.

### Pitfall 10: wasm-bindgen CLI Version Mismatch

**What goes wrong:** `wasm-bindgen` CLI produces errors like "it looks like the Rust project used to create this wasm file was linked against a different version of wasm-bindgen."
**Why it happens:** The wasm-bindgen CLI version must exactly match the wasm-bindgen crate version in Cargo.toml. Version 0.2.108 in Cargo.toml requires wasm-bindgen-cli 0.2.108.
**How to avoid:** Install the matching CLI version: `cargo install wasm-bindgen-cli@0.2.108`. Pin the version in build scripts or CI. Always check versions match before builds.
**Warning signs:** Build succeeds but wasm-bindgen post-processing step fails with version mismatch error.

### Pitfall 11: zstd (C library) Breaks WASM Compilation of tallow-protocol

**What goes wrong:** Attempting to compile tallow-protocol for wasm32-unknown-unknown fails because zstd depends on libzstd-sys (C code that requires a C compiler and linker for the WASM target).
**Why it happens:** tallow-protocol depends on `zstd = "0.13"` which uses cc-rs to compile C code. This doesn't work for wasm32-unknown-unknown without emscripten.
**How to avoid:** Feature-gate the wire module in tallow-protocol. The `wasm` feature should exclude compression (zstd, brotli, lz4_flex, lzma-rs), file watching (notify), tar, and other non-WASM-compatible deps. Only expose the Message enum + postcard serde under the `wasm` feature.
**Warning signs:** Compilation error mentioning `cc` or `libzstd-sys` or missing C compiler for wasm32 target.

## Code Examples

### WASM Module Initialization

```rust
// tallow-web/src/lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}
```

### WebSocket Connection (Browser WASM)

```rust
// tallow-web/src/transport.rs
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{WebSocket, MessageEvent, BinaryType};

#[wasm_bindgen]
pub struct WsConnection {
    ws: WebSocket,
}

#[wasm_bindgen]
impl WsConnection {
    #[wasm_bindgen(constructor)]
    pub fn connect(url: &str) -> Result<WsConnection, JsValue> {
        let ws = WebSocket::new(url)?;
        ws.set_binary_type(BinaryType::Arraybuffer);
        Ok(WsConnection { ws })
    }

    pub fn send_bytes(&self, data: &[u8]) -> Result<(), JsValue> {
        // Send raw postcard-encoded message as binary WebSocket frame
        let array = js_sys::Uint8Array::from(data);
        self.ws.send_with_array_buffer(&array.buffer())
    }
}
```

### Postcard Encode/Decode in WASM (No Tokio)

```rust
// tallow-web/src/codec.rs
use wasm_bindgen::prelude::*;
// Only import the Message enum via feature-gated tallow-protocol
// or a shared wire types module

#[wasm_bindgen]
pub fn encode_message(msg_type: &str, data: &[u8]) -> Result<Vec<u8>, JsValue> {
    // Construct Message variant from msg_type + data, then postcard-encode
    // ...
    postcard::to_allocvec(&msg) // use to_allocvec, not to_stdvec, in no_std/alloc context
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn decode_message(bytes: &[u8]) -> Result<JsValue, JsValue> {
    let msg: Message = postcard::from_bytes(bytes)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    // Convert to JS-friendly representation
    serde_wasm_bindgen::to_value(&msg)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
```

### Relay WebSocket Handler (axum 0.8)

```rust
// tallow-relay/src/websocket.rs
use axum::extract::ws::{WebSocket, Message as WsMsg};
use futures::{SinkExt, StreamExt};

async fn handle_ws_client(mut ws: WebSocket, room_manager: Arc<RoomManager>) {
    // First message: room join
    let first_msg = match ws.recv().await {
        Some(Ok(WsMsg::Binary(data))) => data,
        _ => return,
    };

    // Parse room join (same logic as QUIC path)
    let join = match parse_room_join_dispatch(&first_msg) {
        Ok(j) => j,
        Err(_) => return,
    };

    // Join room -- gets same channel types as QUIC
    let (mut peer_rx, peer_present) = /* room_manager.join(...) */;

    // Send RoomJoined response
    let response = encode_room_joined(peer_present).unwrap();
    // For WS: send raw bytes (no length prefix needed)
    let _ = ws.send(WsMsg::Binary(response.into())).await;

    // Bidirectional forwarding using StreamExt::split
    let (mut ws_sink, mut ws_stream) = ws.split();

    // Spawn two tasks:
    // 1. WS -> peer channel (add 4-byte length prefix for QUIC peers)
    // 2. Peer channel -> WS (strip 4-byte length prefix before sending)
}
```

### File Chunk Reading (TypeScript)

```typescript
// web/transfer.ts
async function sendFile(file: File, ws: WebSocket, wasmCrypto: WasmModule) {
    const CHUNK_SIZE = 65536; // 64KB, matches CLI
    let offset = 0;
    let chunkIndex = 0;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    while (offset < file.size) {
        const end = Math.min(offset + CHUNK_SIZE, file.size);
        const slice = file.slice(offset, end);
        const buffer = await slice.arrayBuffer();
        const plaintext = new Uint8Array(buffer);

        // Encrypt in WASM (identical to CLI path)
        const encrypted = wasmCrypto.encrypt_chunk(
            sessionKey, chunkIndex, plaintext
        );

        // Build Chunk message in WASM, get postcard bytes
        const msgBytes = wasmCrypto.encode_chunk_message(
            transferId, chunkIndex, totalChunks, encrypted
        );

        ws.send(msgBytes.buffer);
        offset = end;
        chunkIndex++;

        // Update progress UI
        updateProgress(chunkIndex, totalChunks, file.size);
    }
}
```

### Caddy TLS Proxy Configuration

```
# /etc/caddy/Caddyfile on Oracle Cloud VM
relay.tallow.app {
    reverse_proxy localhost:4434
}
```
Caddy automatically obtains and renews Let's Encrypt certificates. WebSocket upgrade headers are detected and proxied automatically. No special WebSocket configuration needed.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| wasm-pack (build tool) | Direct `cargo build --target wasm32-unknown-unknown` + `wasm-bindgen` CLI + `wasm-opt` | July 2025 (rustwasm org sunset, wasm-pack archived) | wasm-pack archived; decompose into 3 explicit steps for better control |
| getrandom `js` feature (0.2) | getrandom `wasm_js` feature (0.3+/0.4+) | getrandom 0.3.x (2025) | **BUT tallow stays on 0.2 -- use `js` feature, not `wasm_js`** |
| FileSaver.js (Blob download) | StreamSaver.js (streaming) | 2022+ | FileSaver buffers entire file in memory; StreamSaver streams to disk |
| WebRTC Data Channels | WebSocket (for relay-mediated) | N/A | WebRTC requires STUN/TURN signaling complexity; WebSocket is simpler for relay-mediated transfers |
| WebTransport (HTTP/3) | WebSocket (production) | Status: Feb 2026 | WebTransport at ~82% browser support (Chrome/Firefox/Edge YES, Safari NO). Interop 2026 includes WebTransport -- Safari support expected later in 2026. Monitor but don't adopt yet. |
| File System Access API | StreamSaver.js (broader compat) | Status: Feb 2026 | FSAA at ~34% support (Chrome/Edge only, zero Safari/Firefox). Not viable as primary path. |
| WebCrypto for PQ crypto | WASM-compiled fips203 | Status: Feb 2026 | WICG draft for ML-KEM in WebCrypto exists but NO browser ships it. Node.js has begun prototyping. Likely 2027+ for browser availability. |
| nginx (TLS reverse proxy) | Caddy (automatic HTTPS + WS proxy) | Caddy v2 (2020+), mainstream 2024-2025 | Caddy auto-obtains Let's Encrypt certs with zero config; native WebSocket detection; simpler than nginx for this use case |

**Deprecated/outdated:**
- **wasm-pack**: Archived July 2025 with rustwasm org. Use `cargo build --target wasm32-unknown-unknown` + `wasm-bindgen` CLI directly. The wasm-bindgen crate itself was transferred to a new wasm-bindgen org and remains actively maintained (0.2.108 released Jan 2026).
- **getrandom `--cfg` flag approach**: The 0.2.x series uses Cargo feature `js`; the 0.3+/0.4+ series uses `wasm_js`. Neither requires `--cfg` flags anymore.
- **WebCrypto for ML-KEM**: The WICG draft (webcrypto-modern-algos) specifies ML-KEM-512/768/1024, ML-DSA, SLH-DSA for WebCrypto, but this is an unofficial WICG incubation. Chrome has an "Intent to Prototype" -- no ship date. Do not depend on this.

## Open Questions

1. **Exact WASM binary size for tallow-crypto**
   - What we know: ML-KEM-1024 + X25519 + AES-GCM + BLAKE3 + Argon2id is significant code. All pure Rust, no C deps. fips203 WASM example exists.
   - What's unclear: Whether the optimized WASM binary will be <2MB gzipped (acceptable) or >5MB (problematic). fips203 alone could be large due to polynomial arithmetic.
   - Recommendation: Create a minimal proof-of-concept build early (first task) to measure binary size. If >3MB gzipped, investigate feature-gating unused modules (sig, ratchet, pake, argon2). Set hard budget: 2MB gzipped max.

2. **Postcard Message Enum in WASM Without Full tallow-protocol**
   - What we know: The `Message` enum lives in `tallow-protocol/src/wire/messages.rs`. tallow-protocol depends on zstd (C lib), notify, tar, tokio -- none compile to WASM.
   - What's unclear: Exact scope of feature-gating needed. The Message enum itself only uses `Vec<u8>`, `String`, `[u8; N]`, `bool`, `u32`, `u64`, `Option<T>` -- all WASM-compatible.
   - Recommendation: Feature-gate tallow-protocol with `wasm` feature. Under `wasm`, only compile `wire/messages.rs` and `wire/mod.rs` (types + postcard serde). Exclude all other modules. tallow-web depends on `tallow-protocol = { features = ["wasm"] }`. This avoids a new crate.

3. **Argon2id Usage in Browser Path**
   - What we know: Argon2id with 256MB memory is used for identity key encryption (tallow-store) and possibly PAKE. Room ID uses BLAKE3 hash of code phrase (no Argon2id).
   - What's unclear: Whether the browser handshake path actually invokes Argon2id at any point.
   - Recommendation: Audit the handshake flow. If Argon2id is NOT in the browser path, exclude it from tallow-web's feature-gated tallow-crypto. If it IS needed, reduce memory to 64MB for browser and document the tradeoff.

4. **Service Worker vs Web Worker for Crypto**
   - What we know: WASM crypto operations (ML-KEM key generation, AES-GCM bulk encryption) may block the main thread.
   - What's unclear: Whether a Web Worker is necessary for smooth UI, or if the operations are fast enough on the main thread.
   - Recommendation: Start with main thread. If ML-KEM keygen takes >100ms in the browser (likely ~50ms based on WASM benchmarks), move crypto to a Web Worker in a follow-up. Web Workers can load WASM modules via `new Worker()` + `importScripts()`.

5. **WebTransport Future Migration**
   - What we know: WebTransport has ~82% global support (Chrome, Firefox, Edge). Safari has zero support but WebTransport is in the Interop 2026 initiative, meaning Apple has committed to working on it.
   - What's unclear: When Safari will ship WebTransport support. Could be late 2026 or 2027.
   - Recommendation: Build with WebSocket for Phase 21. Design the relay's transport abstraction so WebTransport can be added as an alternative transport in a future phase without rearchitecting. When Safari ships WebTransport, it would enable direct QUIC-like semantics from browser (ordered/unordered streams, datagram support).

## Sources

### Primary (HIGH confidence)
- [wasm-bindgen crates.io](https://crates.io/crates/wasm-bindgen) - Version 0.2.108 (Jan 2026), actively maintained under new org
- [wasm-bindgen GitHub](https://github.com/wasm-bindgen/wasm-bindgen) - Transferred from rustwasm to wasm-bindgen org
- [fips203 GitHub (integritychain)](https://github.com/integritychain/fips203) - v0.4.1, confirms WASM support with `/wasm` directory, no_std, no alloc, browser target
- [getrandom docs 0.2.17](https://docs.rs/getrandom/0.2.17/getrandom/) - `js` feature for WASM browser support (NOT `wasm_js`)
- [getrandom crates.io](https://crates.io/crates/getrandom) - 0.2.17 (Jan 2026), 0.4.1 (Feb 2026) also available
- [postcard crate](https://crates.io/crates/postcard) - v1.1.3, no_std compatible
- [axum crates.io](https://crates.io/crates/axum) - v0.8.8 (Jan 2026)
- [axum WebSocket docs](https://docs.rs/axum/latest/axum/extract/ws/index.html) - WebSocketUpgrade extractor, split() for concurrent send/recv
- [tokio-tungstenite crates.io](https://crates.io/crates/tokio-tungstenite) - v0.27.0 (Jun 2025)
- [web-sys crates.io](https://crates.io/crates/web-sys) - v0.3.85 (Jan 2026)
- [Can I Use: WebTransport](https://caniuse.com/webtransport) - 81.71% global, Chrome/Firefox/Edge YES, Safari NO
- [Can I Use: File System Access API](https://caniuse.com/native-filesystem-api) - 34.29% global, Chrome/Edge only, Safari/Firefox NO
- [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) - Secure context + user gesture requirements
- [MDN OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) - Supported by all modern browsers since 2023

### Secondary (MEDIUM confidence)
- [Sunsetting rustwasm org (Rust blog)](https://blog.rust-lang.org/inside-rust/2025/07/21/sunsetting-the-rustwasm-github-org/) - wasm-pack archived, wasm-bindgen transferred
- [Life after wasm-pack (nickb.dev)](https://nickb.dev/blog/life-after-wasm-pack-an-opinionated-deconstruction/) - Build workflow: cargo build + wasm-bindgen CLI + wasm-opt
- [Interop 2026 (WebKit blog)](https://webkit.org/blog/17818/announcing-interop-2026/) - WebTransport is an Interop 2026 focus area (20% of score)
- [WICG webcrypto-modern-algos](https://wicg.github.io/webcrypto-modern-algos/) - Draft spec for ML-KEM/ML-DSA/SLH-DSA in WebCrypto; unofficial WICG incubation
- [ML-KEM in WebCrypto (dchest.com)](https://dchest.com/2025/08/09/mlkem-webcrypto/) - Confirms WebCrypto API does NOT yet support ML-KEM as of Aug 2025
- [StreamSaver.js GitHub](https://github.com/jimmywarting/StreamSaver.js) - Still maintained; maintainer notes WHATWG/fs may eventually replace it
- [Caddy server](https://caddyserver.com/) - Automatic HTTPS, native WebSocket proxy, zero-config Let's Encrypt
- [Caddy vs nginx 2025 (mangohost.net)](https://mangohost.net/blog/nginx-vs-caddy-in-2025-which-is-better-for-performance-and-tls-automation-2/) - Caddy wins for auto-TLS simplicity
- [serde-wasm-bindgen](https://crates.io/crates/serde-wasm-bindgen) - v0.6.5, latest stable
- [Shrinking .wasm Size (Rust WASM book)](https://rustwasm.github.io/book/reference/code-size.html) - wasm-opt, twiggy, LTO, codegen-units optimization

### Tertiary (LOW confidence)
- [Argon2 browser WASM benchmarks](https://asecuritysite.com/webcrypto/crypt_arg) - ~408ms for WASM Argon2; needs independent verification for 256MB params
- [curve25519-dalek backend selection](https://github.com/dalek-cryptography/curve25519-dalek/issues/414) - Auto-selects u32 backend for wasm32; no SIMD support
- [getrandom version conflicts (Rust forum)](https://users.rust-lang.org/t/getrandom-version-conflict-error-building-a-wasm/132355) - Multiple getrandom versions in dependency tree cause confusion

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - wasm-bindgen 0.2.108, web-sys 0.3.85, axum 0.8.8, postcard 1.1.3 all verified on crates.io with recent releases. getrandom 0.2 `js` feature verified via official docs.
- Architecture: MEDIUM-HIGH - Dual-transport relay pattern is straightforward; Message enum feature-gating needs validation but approach is well-understood.
- Crypto WASM compat: HIGH - fips203 explicitly supports WASM with examples; dalek/aes-gcm/blake3 are pure Rust no_std. Verified via official GitHub repos.
- Pitfalls: HIGH - Based on documented issues in official repos, MDN specifications, and community reports. getrandom feature name confusion verified across multiple sources.
- Binary size: MEDIUM - Needs empirical measurement; PQ crypto is inherently larger than classical. No published benchmarks for fips203 WASM binary size found.
- Browser APIs: HIGH - WebTransport (82% caniuse), FSAA (34% caniuse), OPFS (all modern browsers), Clipboard API (documented on MDN) all verified.
- TLS/proxy: HIGH - Caddy auto-HTTPS verified via official docs; WebSocket proxy is a documented feature.

**Research date:** 2026-02-21 (updated)
**Valid until:** ~60 days (crypto crate APIs stable; WASM tooling changes slowly; monitor WebTransport Safari status)

**Changes from original research (same date):**
- Updated wasm-bindgen to 0.2.108 (was listed as 0.2.x generic)
- Updated web-sys to 0.3.85 (was 0.3.x generic)
- Updated axum to 0.8.8 (was 0.8.x generic)
- Updated tokio-tungstenite to 0.27.0 (was 0.26.x)
- Confirmed getrandom 0.2.17 uses `js` feature (NOT `wasm_js`); added critical warning about feature name difference across versions
- Confirmed wasm-pack is archived (July 2025); added explicit 3-step build workflow as replacement
- Updated WebTransport browser support to 81.71% (was ~75%); added Interop 2026 Safari commitment
- Confirmed File System Access API at 34.29% (Chrome/Edge only); NOT viable as primary
- Confirmed OPFS supported by all modern browsers since 2023; noted as future optimization path
- Added fips203 version confirmation (0.4.1, Oct 2024)
- Confirmed WebCrypto ML-KEM draft exists (WICG) but NO browser ships it; Node.js prototyping
- Added Caddy recommendation for TLS termination (replaces vague "nginx/caddy" suggestion)
- Added Pitfall 10 (wasm-bindgen CLI version mismatch) and Pitfall 11 (zstd C lib breaks WASM)
- Added postcard `alloc` feature note (use `to_allocvec` not `to_stdvec` in WASM)
- Added getrandom version migration warning to Anti-Patterns
- Added Caddy configuration example to Code Examples
- Confirmed StreamSaver.js still maintained; WHATWG/fs not ready as replacement
- Confirmed postcard 1.1.3 is latest, no_std compatible, 16.8M+ downloads
- Confirmed serde-wasm-bindgen 0.6.5 is latest
- Added Phase Requirements traceability section
