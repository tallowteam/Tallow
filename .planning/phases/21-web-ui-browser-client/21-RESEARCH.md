# Phase 21: Web UI / Browser Client - Research

**Researched:** 2026-02-21
**Domain:** Rust-to-WASM compilation, browser cryptography, WebSocket transport, browser file handling, Clipboard API, real-time chat
**Confidence:** MEDIUM-HIGH (crypto compat verified via official docs; transport architecture well-understood; Clipboard API well-documented; chat reuses existing Message variants)

## Summary

Phase 21 adds a browser-based client that interoperates with the existing CLI for **file transfer, clipboard sharing, and encrypted chat**. The core challenges are: (1) compiling tallow-crypto to WebAssembly so the browser performs identical post-quantum cryptography, (2) adding a WebSocket transport layer to the relay so browsers can communicate with QUIC-connected CLI peers, (3) building a web UI for file selection, progress display, and code phrase entry, (4) integrating the browser Clipboard API for reading/writing text and images to interop with `tallow clip`, and (5) real-time E2E encrypted chat interoperable with `tallow chat`.

The good news: **all critical crypto dependencies compile to wasm32-unknown-unknown**. The fips203 crate (ML-KEM-1024) explicitly advertises browser/WASM support with a `/wasm` example directory. The x25519-dalek, aes-gcm, blake3, hkdf, sha2, and postcard crates are all pure Rust with no_std support. The primary complication is getrandom, which requires the `wasm_js` feature to use `crypto.getRandomValues()` in the browser. The tallow-crypto crate's platform-specific code (mlock, core dump prevention) is already gated behind `#[cfg(unix)]` with no-op fallbacks, so WASM compilation should work with minimal changes.

The relay needs a WebSocket listener alongside its existing QUIC endpoint. The most practical approach is adding axum + tokio-tungstenite to tallow-relay, running an HTTP/WebSocket server on a second port. The relay bridges WebSocket clients to QUIC clients transparently -- the room/forwarding logic is shared, only the transport differs. WebSocket already provides message framing, so the 4-byte length prefix used over QUIC can be omitted (or retained for simplicity with a thin adapter).

**Primary recommendation:** Create a new `tallow-web` crate (cdylib) that compiles tallow-crypto + postcard serialization to WASM, expose key operations via wasm-bindgen, and build a vanilla TypeScript + HTML frontend (no heavy framework) that communicates with the relay over WebSocket. Add WebSocket support to tallow-relay as a second listener. The web UI includes three modes: file transfer (drag-and-drop send/receive), clipboard sharing (paste to send, auto-copy on receive, interop with `tallow clip`), and encrypted chat (real-time messaging, interop with `tallow chat`).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| wasm-bindgen | 0.2.x | Rust-JS interop, type generation | The foundational crate for all Rust-to-WASM browser work; 225M+ downloads, actively maintained under new org |
| web-sys | 0.3.x | Browser API bindings (WebSocket, File, Crypto, DOM) | Official companion to wasm-bindgen; feature-gated per API |
| js-sys | 0.3.x | JavaScript built-in type bindings | Needed for Uint8Array, ArrayBuffer, Promise interop |
| getrandom | 0.2.x | Randomness for crypto (wraps crypto.getRandomValues) | Required by all crypto deps; needs `wasm_js` feature for browser |
| postcard | 1.1.x | Wire protocol serialization | Already used by tallow-protocol; no_std compatible, works in WASM |
| axum | 0.8.x | HTTP/WebSocket server for relay | Tokio-native, first-class WebSocket support, widely adopted |
| tokio-tungstenite | 0.26.x | WebSocket protocol implementation | Pairs with axum for server-side WS; battle-tested |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| wasm-bindgen-futures | 0.4.x | Bridge JS Promises and Rust Futures | Any async operation in WASM (WebSocket send/recv, file reading) |
| serde-wasm-bindgen | 0.6.x | Efficient serde <-> JsValue conversion | Passing structured data between Rust WASM and JS |
| console_error_panic_hook | 0.1.x | Route Rust panics to browser console | Debug builds; essential for development |
| wasm-opt | (CLI) | WASM binary size optimization | Release builds; typically 20-40% size reduction |
| StreamSaver.js | 2.0.x | Stream large files to disk without memory buffering | Receiving files >100MB in the browser |
| fzstd | 0.1.x | Pure JS zstd decompression (8KB) | Fallback if WASM zstd too large; only needed for decompression |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla TS + HTML | Leptos (Rust WASM framework) | Leptos is excellent but adds 200KB+ to WASM binary and full-Rust-frontend complexity; overkill for a single-page file transfer UI |
| Vanilla TS + HTML | React/Svelte/Solid | Adds JS framework dependency, build tooling complexity; this is a single-page app with <10 components |
| axum (relay WS) | warp | warp is lighter but axum has better ecosystem momentum and WebSocket ergonomics |
| StreamSaver.js | File System Access API | FSAA requires user permission prompts and has limited browser support (Chrome only); StreamSaver.js works everywhere via ServiceWorker |
| WebSocket | WebTransport | WebTransport uses QUIC natively but only ~75% browser support as of 2025, limited server tooling; premature for production |

**Installation (relay side):**
```toml
# In tallow-relay/Cargo.toml
axum = { version = "0.8", features = ["ws"] }
tokio-tungstenite = "0.26"
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
web-sys = { version = "0.3", features = ["WebSocket", "File", "Blob", "FileReader", "MessageEvent", "BinaryType", "Url", "console", "Clipboard", "ClipboardItem", "ClipboardEvent", "Navigator", "Permissions", "PermissionStatus"] }
js-sys = "0.3"
wasm-bindgen-futures = "0.4"
serde = { version = "1", features = ["derive"] }
postcard = { version = "1.1", features = ["use-std"] }
getrandom = { version = "0.2", features = ["wasm_js"] }
console_error_panic_hook = "0.1"
```

## Architecture Patterns

### Recommended Project Structure

```
crates/
  tallow-web/              # NEW: WASM crate (cdylib)
    src/
      lib.rs               # wasm-bindgen entry, init, panic hook
      crypto.rs             # Thin wasm-bindgen wrappers around tallow-crypto
      codec.rs              # Postcard encode/decode for Message (no tokio dependency)
      transport.rs          # WebSocket client (web-sys WebSocket)
      transfer.rs           # File chunking, send/receive state machine
      clipboard.rs          # Clipboard content type detection, encode/decode
      chat.rs               # Chat message encryption, nonce management, sanitization
      file_io.rs            # Browser File/Blob reading, download triggering
    Cargo.toml
  tallow-relay/
    src/
      websocket.rs          # NEW: axum WebSocket listener + bridge to room system
      server.rs             # Modified: spawns both QUIC and WS listeners
web/                         # NEW: Static frontend
    index.html
    style.css
    app.ts                   # Main application logic, routing between modes
    transfer.ts              # File transfer UI (drag-and-drop, progress)
    clipboard.ts             # Clipboard sharing UI (paste, copy, watch mode)
    chat.ts                  # Chat UI (message list, input, typing indicators)
    worker.ts                # Service worker for PWA + StreamSaver
    manifest.json            # PWA manifest
    pkg/                     # wasm-bindgen output (generated)
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

**What:** The relay runs an axum HTTP/WebSocket server on a separate port (e.g., 4434). WebSocket connections go through the same room join, forwarding, and authentication logic as QUIC connections. Each WebSocket message maps to one length-prefixed protocol message.

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

**What:** The browser reads/writes clipboard content using the Clipboard API (`navigator.clipboard.readText()`, `navigator.clipboard.read()` for images, `navigator.clipboard.writeText()`, `navigator.clipboard.write()`). Clipboard content is sent as the same `Message::Clipboard` / `Message::ClipboardImage` / `Message::Text` variants used by the CLI's `tallow clip` command. Content type detection (text, URL, image) reuses the same logic from `tallow-protocol::transfer::manifest::TransferType`.

**When to use:** When the user clicks "Share Clipboard" or pastes content into the web UI.

**Key details:**
- `navigator.clipboard.readText()` requires user gesture (button click) + Permissions API grant
- `navigator.clipboard.read()` returns `ClipboardItem` objects with MIME types — images come as `image/png` blobs
- On receive: text auto-copies via `navigator.clipboard.writeText()`; images via `navigator.clipboard.write([new ClipboardItem({"image/png": blob})])`
- The `TransferType::Clipboard`, `TransferType::ClipboardImage`, `TransferType::Text`, and `TransferType::Url` variants are already in the wire protocol — the browser client uses them identically
- Clipboard watch mode (like `tallow clip watch`) can use `setInterval` + hash comparison (no native clipboard change event in browsers)

**Example (TypeScript):**
```typescript
async function sendClipboard(ws: WebSocket, wasmCrypto: WasmModule) {
    // Read text clipboard
    const text = await navigator.clipboard.readText();
    if (!text) return;

    // Detect content type (URL, code, plain text)
    const contentType = wasmCrypto.detect_content_type(text);

    // Encrypt and encode as Message::Text / Message::Clipboard
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

**What:** Real-time E2E encrypted messaging using the same `Message::ChatMessage` wire format as the CLI's `tallow chat` command. Messages are AES-256-GCM encrypted with the session key derived from the KEM handshake. The browser chat UI renders messages in a scrollable container with sender identification, timestamps, and sanitized display.

**When to use:** When the user enters chat mode in the web UI.

**Key details:**
- Uses existing `Message::ChatMessage { transfer_id, data }` — `data` is AES-256-GCM encrypted UTF-8 text
- Per-message nonce: counter-based (same as chunk nonces but with chat domain separator in AAD)
- Typing indicators: `Message::TypingIndicator { transfer_id, typing: bool }` — sent on input focus/blur or debounced keypress
- Message sanitization: All received text is passed through WASM-compiled `sanitize_display()` before rendering (strips ANSI, limits length)
- Chat history: Stored in browser `sessionStorage` (cleared on tab close) — NOT `localStorage` to avoid plaintext persistence
- Multi-peer chat: In multi-peer rooms, messages are addressed to specific peers via `Message::Targeted` envelope — the browser tracks per-peer session keys

**Example (TypeScript):**
```typescript
class ChatSession {
    private messageCounter = 0;
    private history: ChatMessage[] = [];

    async sendMessage(text: string, ws: WebSocket, wasmCrypto: WasmModule) {
        // Sanitize outgoing text (length limit, strip control chars)
        const sanitized = text.substring(0, 4096);

        // Encrypt with session key, incrementing nonce counter
        const aad = wasmCrypto.build_chat_aad(this.transferId, this.messageCounter);
        const nonce = wasmCrypto.build_chat_nonce(this.messageCounter);
        const encrypted = wasmCrypto.aes_encrypt(sessionKey, nonce, aad, new TextEncoder().encode(sanitized));

        // Encode as Message::ChatMessage
        const msg = wasmCrypto.encode_chat_message(this.transferId, encrypted);
        ws.send(msg.buffer);

        this.messageCounter++;
        this.history.push({ sender: 'me', text: sanitized, timestamp: Date.now() });
        this.renderMessage('me', sanitized);
    }

    receiveMessage(data: Uint8Array, wasmCrypto: WasmModule) {
        const decrypted = wasmCrypto.decrypt_chunk(sessionKey, this.peerCounter, data);
        const text = new TextDecoder().decode(decrypted);

        // Sanitize received text via WASM (same as CLI)
        const safe = wasmCrypto.sanitize_display(text);
        this.peerCounter++;
        this.history.push({ sender: 'peer', text: safe, timestamp: Date.now() });
        this.renderMessage('peer', safe);
    }
}
```

### Anti-Patterns to Avoid

- **Full tallow-protocol in WASM:** Do NOT compile the entire tallow-protocol crate to WASM. It depends on tokio, tokio-util, notify, tar, zstd (C library), and many other crates that either don't compile to WASM or add massive binary bloat. Instead, compile only tallow-crypto + postcard + the Message enum.
- **WebCrypto for PQ crypto:** Do NOT use WebCrypto API for ML-KEM-1024 or BLAKE3. WebCrypto doesn't support post-quantum algorithms. Use WASM-compiled tallow-crypto for all crypto. WebCrypto's AES-GCM COULD work but would create two code paths -- avoid it.
- **Loading entire files into WASM memory:** WASM linear memory is limited (typically 256MB-4GB depending on browser). A 2GB file loaded entirely would fail. Always stream chunks via Blob.slice().
- **React/Vue/Angular for the UI:** This is a single-page app with ~8 UI states (landing, connecting, handshake, file transfer, clipboard, chat, settings, done). A JavaScript framework adds build complexity, bundle size, and maintenance burden with minimal benefit.
- **JS-side chat message sanitization:** Do NOT re-implement ANSI stripping, control character removal, or length limiting in JavaScript. Use the WASM-compiled `sanitize_display()` from tallow-protocol. JS regex-based stripping will miss edge cases that the Rust version handles.
- **localStorage for chat history:** Do NOT store decrypted messages in localStorage. Use sessionStorage (cleared on tab close). Plaintext persistence on disk violates the zero-knowledge design.
- **Clipboard polling without hash dedup:** If implementing clipboard watch mode, always compare BLAKE3 hashes of clipboard content before re-sending. Without dedup, the same content triggers infinite re-sends.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WASM-JS type marshaling | Custom FFI layer | wasm-bindgen + web-sys | Handles memory management, type conversion, lifetime safety |
| WebSocket client (browser) | Raw WebSocket wrapper | web-sys::WebSocket + wasm-bindgen-futures | Browser API is already high-level; wrapping adds no value |
| WebSocket server (relay) | Raw tokio-tungstenite handling | axum WebSocket extractor | Handles upgrade, ping/pong, close frames, backpressure |
| Large file download to disk | Blob URL + download attribute | StreamSaver.js | Blob URLs buffer entire file in memory; StreamSaver streams to disk |
| Zstd decompression (browser) | Compile zstd C lib to WASM | fzstd (pure JS, 8KB) or zstd-wasm | The C zstd library adds ~300KB to WASM; pure JS is smaller for decompress-only |
| CORS handling | Manual headers | tower-http CorsLayer | CORS is deceptively complex; one missed header breaks everything |
| PWA service worker | From scratch | Workbox or minimal hand-written SW | Cache invalidation is hard; at minimum use cache-versioned assets |
| Postcard wire compat | Re-encode in JS | Compile postcard to WASM via tallow-web | Postcard's varint encoding is non-trivial; re-implementing risks incompatibility |
| Clipboard access (browser) | Custom clipboard hacks | navigator.clipboard API (Clipboard API) | Standard async API with permission model; works cross-browser |
| Chat message sanitization | JS-side regex stripping | WASM-compiled sanitize_display() | Must match CLI behavior exactly; ANSI/control char stripping is subtle |
| Chat nonce management | JS-side counter | WASM-compiled nonce builder with domain separation | Nonce reuse is catastrophic for AES-GCM; use the same Rust code path |
| Image clipboard encoding | Canvas-based conversion | Blob + ClipboardItem API | Browser handles PNG encoding natively; no manual pixel manipulation needed |

**Key insight:** The entire value proposition of this phase is that the browser uses the SAME crypto, SAME wire protocol, SAME message sanitization, and SAME content type detection as the CLI. Any hand-rolled browser-side implementation of crypto, serialization, or security-critical text processing is a correctness risk and a maintenance burden. Compile Rust to WASM; don't rewrite in JavaScript.

## Common Pitfalls

### Pitfall 1: getrandom Fails at Runtime in WASM

**What goes wrong:** The WASM module compiles but panics at runtime with "getrandom not supported" when any crypto operation tries to generate random bytes.
**Why it happens:** getrandom 0.2.x requires explicit opt-in for wasm32-unknown-unknown via either the `wasm_js` feature or a cfg flag. Without it, the crate has no randomness source.
**How to avoid:** In tallow-web/Cargo.toml, add `getrandom = { version = "0.2", features = ["wasm_js"] }`. This must be a direct dependency of the WASM crate (not just transitive) to ensure the feature is enabled.
**Warning signs:** Build succeeds but first call to `HybridKeyPair::generate()` panics in browser console.

### Pitfall 2: WASM Binary Too Large (>5MB)

**What goes wrong:** The WASM binary is 5-15MB, causing slow page loads (especially on mobile).
**Why it happens:** ML-KEM-1024 key generation, Argon2id, and BLAKE3 are all non-trivial code. Debug symbols, unoptimized builds, or pulling in tokio/std accidentally inflates the binary.
**How to avoid:** (1) Use `[profile.release]` with `opt-level = 'z'`, `lto = true`, `codegen-units = 1`. (2) Run `wasm-opt -Oz` post-build. (3) Use `twiggy top` to identify bloat sources. (4) Feature-gate: don't compile sig/ratchet/pake modules to WASM unless needed. (5) Target: ~1-2MB gzipped is achievable.
**Warning signs:** `wasm-pack build --release` output >3MB before gzip.

### Pitfall 3: Argon2id with 256MB Memory in Browser

**What goes wrong:** Argon2id with the standard parameters (256MB memory, 3 iterations) causes the browser to freeze or crash on mobile devices.
**Why it happens:** The WASM linear memory must grow to accommodate 256MB for a single Argon2id invocation. Mobile browsers may have 512MB-1GB total memory budget for the tab.
**How to avoid:** For the browser client, Argon2id is used only for code-phrase-to-room-ID derivation (BLAKE3 hash) and PAKE authentication. The code phrase room ID uses BLAKE3 (no Argon2id). If Argon2id IS needed for any browser path, reduce parameters for browser (e.g., 64MB memory) and document the security tradeoff. Better: verify that the current handshake flow does NOT use Argon2id in the browser path.
**Warning signs:** "Out of memory" errors or tab crashes on mobile during connection setup.

### Pitfall 4: WebSocket Message Size Limits

**What goes wrong:** Large chunk messages (64KB payload + overhead) fail to send or receive over WebSocket.
**Why it happens:** Some WebSocket proxies (nginx, Cloudflare) have default message size limits (often 1MB or less). The relay's direct WebSocket has no inherent limit, but if a CDN/reverse proxy is in the path, it may truncate or reject large binary messages.
**How to avoid:** (1) Keep chunk size at 64KB (well under any reasonable limit). (2) Document relay WebSocket configuration for reverse proxy users. (3) The browser WebSocket API itself has no practical message size limit.
**Warning signs:** Transfers fail partway through with WebSocket close code 1009 (message too big).

### Pitfall 5: Mixed Content Blocking (HTTPS Page + WSS)

**What goes wrong:** The web UI loads over HTTPS (GitHub Pages or similar) but WebSocket connections to `ws://129.146.114.5:4434` are blocked by the browser.
**Why it happens:** Browsers block mixed content -- an HTTPS page cannot open a non-secure WebSocket (ws://) connection. The relay must support WSS (WebSocket Secure).
**How to avoid:** The relay WebSocket endpoint MUST use TLS. Options: (1) Use the same self-signed cert the QUIC endpoint uses (but browsers reject self-signed). (2) Put the relay behind a reverse proxy (nginx/caddy) with a real Let's Encrypt cert. (3) Use a domain name with proper TLS (e.g., relay.tallow.app). Option 3 is the correct long-term solution.
**Warning signs:** Browser console shows "Mixed Content: blocked" or WebSocket connection immediately fails.

### Pitfall 6: Cross-Origin Resource Sharing (CORS)

**What goes wrong:** The static site (e.g., web.tallow.app) cannot establish WebSocket connections to the relay (relay.tallow.app) because the browser blocks the cross-origin request.
**Why it happens:** WebSocket upgrade requests go through an HTTP handshake that is subject to CORS preflight in some configurations.
**How to avoid:** Add CORS headers to the relay's HTTP/WebSocket endpoint via tower-http CorsLayer. Allow the web UI's origin. Note: pure WebSocket connections (not using fetch API) are NOT subject to CORS preflight, but the initial HTTP upgrade may be. Test thoroughly.
**Warning signs:** "CORS policy" errors in browser console during WebSocket connect.

### Pitfall 7: Clipboard API Requires Secure Context + User Gesture

**What goes wrong:** `navigator.clipboard.readText()` throws a DOMException or returns undefined silently.
**Why it happens:** The Clipboard API requires: (1) a secure context (HTTPS), (2) a user gesture (click/keypress), and (3) Permissions API grant. Reading images via `navigator.clipboard.read()` has even stricter requirements — Chrome requires the "clipboard-read" permission and a focus event.
**How to avoid:** (1) Always gate clipboard reads behind a button click handler. (2) Use `navigator.permissions.query({name: "clipboard-read"})` to check before attempting. (3) Provide a fallback textarea for manual paste (`Ctrl+V`) if Clipboard API is denied. (4) Never attempt clipboard reads on page load or in background.
**Warning signs:** "DOMException: Document is not focused" or "NotAllowedError" in browser console.

### Pitfall 8: Chat Message Nonce Collision Between File and Chat

**What goes wrong:** Chat messages and file chunks share the same nonce counter space, causing AES-GCM nonce reuse.
**Why it happens:** If both file transfer and chat use counter-based nonces starting from 0 with the same session key, the nonce for chunk 0 and chat message 0 will be identical — catastrophic for AES-GCM security.
**How to avoid:** Use domain separation in the AAD (already done in CLI — chat AAD includes "chat" prefix, file AAD includes "file" prefix). Even better: derive separate sub-keys from the session key — one for file encryption, one for chat encryption — using HKDF with distinct info strings. The CLI already uses `build_chat_aad()` vs `build_chunk_aad()` which include different domain separators.
**Warning signs:** Hard to detect — no runtime error, but nonce reuse completely breaks AES-GCM confidentiality.

### Pitfall 9: Chat History Persisted in localStorage Leaks Plaintext

**What goes wrong:** Decrypted chat messages stored in `localStorage` persist after the session ends — anyone with physical access to the device can read them.
**Why it happens:** Developers default to `localStorage` for persistence. Unlike the CLI (which stores nothing), browser data persists until explicitly cleared.
**How to avoid:** Use `sessionStorage` (cleared when tab closes) for chat history. Never write decrypted messages to `localStorage` or IndexedDB. On session end, explicitly clear `sessionStorage`. Consider using the OPFS (Origin Private File System) if persistent encrypted history is needed in the future.
**Warning signs:** Chat messages visible in browser DevTools > Application > Local Storage after tab close.

### Pitfall 10: File Size Display Mismatch Between File API and Transfer

**What goes wrong:** `File.size` in JavaScript returns the file size, but WASM sees a different size due to encoding/chunking issues.
**Why it happens:** JavaScript's File.size is in bytes. When passing ArrayBuffer to WASM via wasm-bindgen, the byte count must match exactly. Off-by-one errors in Blob.slice() or incorrect typed array views cause size mismatches.
**How to avoid:** Always use `new Uint8Array(arrayBuffer)` for the exact byte view. Verify `slice(start, end)` uses exclusive end (matching Rust range semantics). Add assertion: sum of chunk sizes must equal File.size.
**Warning signs:** Transfer completes but BLAKE3 hash verification fails on receiver.

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
use tallow_protocol::wire::Message; // Only the Message enum, not the codec

#[wasm_bindgen]
pub fn encode_message(msg_type: &str, data: &[u8]) -> Result<Vec<u8>, JsValue> {
    // Deserialize JS-provided data into a Message, then postcard-encode
    let msg: Message = /* construct from msg_type + data */;
    postcard::to_stdvec(&msg)
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

### Relay WebSocket Handler

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

    // Bidirectional forwarding
    let (mut ws_sink, mut ws_stream) = ws.split();

    // WS -> peer channel (add 4-byte length prefix for QUIC peers)
    // Peer channel -> WS (strip 4-byte length prefix before sending)
}
```

### File Chunk Reading (TypeScript)

```typescript
// web/app.ts
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
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| wasm-pack (build tool) | Direct wasm-bindgen CLI + cargo | July 2025 (rustwasm org sunset) | wasm-pack archived; use `cargo build --target wasm32-unknown-unknown` + `wasm-bindgen` CLI |
| getrandom cfg flag | getrandom `wasm_js` feature | getrandom 0.2.x | Feature flag replaces `--cfg getrandom_backend` rustflag |
| FileSaver.js (Blob download) | StreamSaver.js (streaming) | 2022+ | FileSaver buffers entire file in memory; StreamSaver streams via ServiceWorker |
| WebRTC Data Channels | WebSocket (for relay-mediated) | N/A | WebRTC requires STUN/TURN signaling complexity; WebSocket is simpler for relay-mediated transfers where relay is always in the path |
| WebTransport (HTTP/3) | WebSocket (production) | 2025 status | WebTransport only ~75% browser support; production viability 2-3 years out |

**Deprecated/outdated:**
- **wasm-pack**: Archived July 2025. Use `cargo build --target wasm32-unknown-unknown` + `wasm-bindgen` CLI directly.
- **rustwasm GitHub org**: Sunset. wasm-bindgen transferred to new org with active maintainers.
- **getrandom `--cfg` flag approach**: No longer needed; use Cargo feature `wasm_js` instead.

## Open Questions

1. **Exact WASM binary size for tallow-crypto**
   - What we know: ML-KEM-1024 + X25519 + AES-GCM + BLAKE3 + Argon2id is significant code. Pure Rust, no C deps.
   - What's unclear: Whether the optimized WASM binary will be <2MB gzipped (acceptable) or >5MB (problematic). fips203 alone could be large due to polynomial arithmetic.
   - Recommendation: Create a minimal proof-of-concept build early (Task 1) to measure binary size. If >3MB gzipped, investigate feature-gating unused modules (sig, ratchet, pake).

2. **Relay TLS for WebSocket**
   - What we know: Browser requires WSS (TLS) from HTTPS pages. The relay currently uses self-signed QUIC certs.
   - What's unclear: Whether to add Let's Encrypt cert to relay directly (acme-lib) or use a reverse proxy (nginx/caddy).
   - Recommendation: Use reverse proxy (Caddy) for TLS termination on the Oracle Cloud VM. Simpler than integrating ACME into the relay binary. WebSocket on port 443, Caddy proxies to relay's internal WS port.

3. **Postcard Message Enum in WASM Without Full tallow-protocol**
   - What we know: The `Message` enum lives in tallow-protocol, which depends on tokio, zstd, tar, etc.
   - What's unclear: How to compile just the Message enum + postcard serialization without pulling in all of tallow-protocol's dependencies.
   - Recommendation: Extract the Message enum and postcard serde into a new lightweight crate (e.g., `tallow-wire`) or use a feature flag on tallow-protocol that disables everything except the wire module. Feature-gating is simpler and avoids crate proliferation.

4. **Argon2id Usage in Browser Path**
   - What we know: Argon2id with 256MB memory is used for identity key encryption (tallow-store) and possibly PAKE.
   - What's unclear: Whether the browser handshake path actually invokes Argon2id, or if BLAKE3 handles the code-phrase-to-room-ID derivation.
   - Recommendation: Audit the handshake flow. If Argon2id is in the browser path, either reduce memory (with security tradeoff documentation) or restructure so only BLAKE3 + CPace are needed for browser connections.

5. **Service Worker vs Web Worker for Crypto**
   - What we know: WASM crypto operations (ML-KEM key generation, AES-GCM bulk encryption) may block the main thread.
   - What's unclear: Whether a Web Worker is necessary for smooth UI, or if the operations are fast enough on the main thread.
   - Recommendation: Start with main thread. If ML-KEM keygen takes >100ms (likely ~50ms based on WASM benchmarks), move crypto to a Web Worker. Web Workers can load WASM modules.

## Sources

### Primary (HIGH confidence)
- [fips203 GitHub (integritychain)](https://github.com/integritychain/fips203) - Confirms WASM support with `/wasm` directory, no_std, no alloc, browser target
- [fips203 docs.rs](https://docs.rs/fips203/latest/fips203/) - Version 0.4.3, ML-KEM-1024 API (KeyGen, Encaps, Decaps, SerDes)
- [wasm-bindgen guide](https://rustwasm.github.io/docs/wasm-bindgen/) - Official documentation for Rust-JS interop
- [web-sys docs](https://wasm-bindgen.github.io/wasm-bindgen/api/web_sys/) - Browser API bindings reference
- [getrandom docs](https://docs.rs/getrandom) - WASM support via `wasm_js` feature
- [postcard crate](https://crates.io/crates/postcard) - no_std compatible, wire format spec at postcard.jamesmunns.com
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) - Binary message support via ArrayBuffer
- [MDN Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API) - ReadableStream for efficient file handling

### Secondary (MEDIUM confidence)
- [Sunsetting rustwasm org (Rust blog)](https://blog.rust-lang.org/inside-rust/2025/07/21/sunsetting-the-rustwasm-github-org/) - wasm-pack archived, wasm-bindgen transferred
- [WebSocket.org WebTransport comparison](https://websocket.org/comparisons/webtransport/) - WebTransport at ~75% browser support, not production-ready
- [wormhole.app security](https://wormhole.app/security) - Browser E2E encrypted file transfer using WebCrypto + WebSocket
- [Winden (magic-wormhole web client)](https://meejah.ca/blog/wormhole-for-the-web) - Go WASM + JS UI pattern for browser wormhole client
- [StreamSaver.js GitHub](https://github.com/jimmywarting/StreamSaver.js) - ServiceWorker-based streaming file download
- [Shrinking .wasm Size (Rust WASM book)](https://rustwasm.github.io/book/reference/code-size.html) - wasm-opt, twiggy, LTO, codegen-units optimization

### Tertiary (LOW confidence)
- [Argon2 browser WASM benchmarks](https://asecuritysite.com/webcrypto/crypt_arg) - ~408ms for WASM Argon2; needs independent verification for 256MB params
- [curve25519-dalek backend selection](https://github.com/dalek-cryptography/curve25519-dalek/issues/414) - Auto-selects u32 backend for wasm32; no SIMD support

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - wasm-bindgen, web-sys, postcard are well-established; getrandom WASM support documented
- Architecture: MEDIUM-HIGH - Dual-transport relay pattern is straightforward; Message enum extraction needs validation
- Crypto WASM compat: HIGH - fips203 explicitly supports WASM; dalek/aes-gcm/blake3 are pure Rust no_std
- Pitfalls: HIGH - Based on documented issues in official repos and MDN specifications
- Binary size: MEDIUM - Needs empirical measurement; PQ crypto is inherently larger than classical
- Frontend approach: MEDIUM - Vanilla JS/TS recommendation is opinionated; Leptos is a valid alternative if Rust-everywhere is preferred

**Research date:** 2026-02-21
**Valid until:** ~60 days (crypto crate APIs stable; WASM tooling changes slowly)
