---
phase: 21-web-ui-browser-client
plan: 03
subsystem: web, ui, wasm, transfer
tags: [typescript, html, css, wasm-bindgen, websocket, aes-gcm, kem, drag-drop, progress-bar, dark-theme, pwa]

# Dependency graph
requires:
  - phase: 21-web-ui-browser-client (plan 01)
    provides: "tallow-web cdylib crate with crypto.rs and codec.rs WASM wrappers"
  - phase: 21-web-ui-browser-client (plan 02)
    provides: "Relay WebSocket listener with WS-to-QUIC bridging"
provides:
  - "WASM transport.rs: WsTransport with room join/response message helpers"
  - "WASM transfer.rs: TransferSession with chunk encrypt/decrypt matching CLI AAD/nonce"
  - "WASM file_io.rs: WasmFileManifest compatible with CLI FileManifest, JSON parsing"
  - "Web UI: index.html SPA with hero, code entry, handshake visual, dashboard"
  - "CSS theme: dark (#0f172a) + light mode, system fonts, full-width progress bars"
  - "TypeScript app.ts: state machine, WebSocket lifecycle, KEM handshake, chat"
  - "TypeScript transfer.ts: drag-and-drop, 64KB chunked send/receive, progress display"
  - "TypeScript wasm.ts: single initialization bridge for WASM module"
affects: [21-04-PLAN, 21-05-PLAN]

# Tech tracking
tech-stack:
  added: [typescript, serde_json]
  patterns: [SPA state machine, counter-based AES-GCM matching CLI, WebSocket binary framing, CSS custom properties theming]

key-files:
  created:
    - crates/tallow-web/src/transport.rs
    - crates/tallow-web/src/transfer.rs
    - crates/tallow-web/src/file_io.rs
    - web/index.html
    - web/style.css
    - web/app.ts
    - web/transfer.ts
    - web/wasm.ts
    - web/tsconfig.json
    - web/manifest.json
    - web/pkg/tallow_web.d.ts
  modified:
    - crates/tallow-web/src/lib.rs
    - crates/tallow-web/Cargo.toml

key-decisions:
  - "Plain TypeScript with tsc (no bundler) -- app is small, no Vite/webpack needed per CONTEXT.md discretion"
  - "AAD = transfer_id || chunk_index.to_be_bytes() -- exact match with CLI chunking.rs build_chunk_aad()"
  - "Lightweight WasmFileManifest in file_io.rs -- FileManifest is behind 'full' feature gate, so WASM needs its own compatible type"
  - "serde-wasm-bindgen for message dispatch -- postcard Message deserialized as tagged JS objects"
  - "Blob.slice() for chunking -- no File.stream() needed, simpler cross-browser compat"

patterns-established:
  - "SPA state machine: landing -> code-entry -> connecting -> waiting -> handshake -> dashboard"
  - "CSS theming via data-theme attribute with custom properties"
  - "WASM bridge pattern: single initWasm() + re-exported types in wasm.ts"
  - "Progress throttling: update UI at most 4x/second during transfer"

requirements-completed: [WEB-07, WEB-08, WEB-09, WEB-10, WEB-11]

# Metrics
duration: 15min
completed: 2026-02-22
---

# Phase 21 Plan 03: Browser File Transfer UI Summary

**Full browser file transfer SPA with dark theme, KEM handshake via WebSocket, 64KB chunked AES-256-GCM send/receive, real-time progress bars, and dashboard layout with files/clipboard/chat panels**

## Performance

- **Duration:** 15 min
- **Started:** 2026-02-22T00:27:37Z
- **Completed:** 2026-02-22T00:42:40Z
- **Tasks:** 2
- **Files modified:** 13 (11 created + 2 modified)

## Accomplishments
- WASM transport, transfer, and file_io modules that match CLI wire format exactly (AAD = transfer_id || chunk_index BE)
- Complete SPA with 7-state state machine, WebSocket lifecycle, hybrid KEM handshake flow (both sender and receiver paths)
- Dark theme UI with hero security messaging ("Post-Quantum Encrypted"), deep blue/purple palette, smooth transitions
- Dashboard with all 3 panels visible simultaneously (files, clipboard, chat) per user decision
- File transfer with drag-and-drop, folder upload (webkitdirectory), size validation (1GB warn, 4GB block), chunked send/receive
- Full-width WeTransfer-style progress bar with speed (MB/s), percentage, and ETA
- Transfer summary card on completion, persistent transfer history in localStorage
- Command palette (Ctrl+K), theme toggle (dark/light), settings panel, keyboard shortcuts
- Deep link support (?code=...), QR code placeholder, code phrase generation
- Chat with encrypted messages, typing indicators, clipboard sharing
- TypeScript compiles clean with strict mode (zero errors)
- WASM builds for wasm32-unknown-unknown (release profile)

## Task Commits

Each task was committed atomically:

1. **Task 1: WASM transport module + browser file I/O helpers + TypeScript WASM bridge** - `4af4a49` (feat)
2. **Task 2: Web UI -- HTML structure, CSS theme, and core application logic** - `34236a3` (feat)

## Files Created/Modified
- `crates/tallow-web/src/transport.rs` - WsTransport: room join/response message encoding
- `crates/tallow-web/src/transfer.rs` - TransferSession: chunk encrypt/decrypt with CLI-compatible AAD/nonce
- `crates/tallow-web/src/file_io.rs` - WasmFileManifest and file description JSON parsing
- `crates/tallow-web/src/lib.rs` - Added transport, transfer, file_io module declarations
- `crates/tallow-web/Cargo.toml` - Added serde_json dependency
- `web/index.html` - SPA with hero, code entry, handshake steps, dashboard, settings, command palette
- `web/style.css` - Dark/light theme, drop zone, progress bars, chat, command palette (~800 lines)
- `web/app.ts` - State machine, WebSocket, KEM handshake, chat, keyboard shortcuts (~540 lines)
- `web/transfer.ts` - Drag-and-drop, file chunking, send/receive, progress, history (~520 lines)
- `web/wasm.ts` - WASM module initialization and re-exports
- `web/tsconfig.json` - TypeScript configuration (ES2020, strict)
- `web/manifest.json` - PWA manifest placeholder
- `web/pkg/tallow_web.d.ts` - TypeScript declarations for WASM bindings

## Decisions Made
- **Plain TypeScript (no bundler):** Per CONTEXT.md, Claude's discretion on build tooling. The app is <10 modules, `tsc --outDir` is sufficient. No Vite/webpack/esbuild overhead.
- **Lightweight WasmFileManifest:** The CLI's `FileManifest` is behind the `full` feature gate (requires tokio, zstd, etc). Created a `WasmFileManifest` in `file_io.rs` with identical field layout and postcard serialization.
- **serde-wasm-bindgen for dispatch:** Messages decoded via postcard + serde-wasm-bindgen produce tagged JS objects (e.g., `{RoomJoined: {peer_present: true}}`). This maps naturally to the TypeScript dispatch pattern.
- **Blob.slice() for chunking:** Using `Blob.slice(offset, end)` + `arrayBuffer()` for file reading instead of `ReadableStream`. Simpler, wider browser support.
- **CSS custom properties theming:** `[data-theme="dark"]` vs `[data-theme="light"]` with CSS custom properties. Persisted to localStorage. Toggle via button or settings panel.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- TypeScript strict mode flagged `Uint8Array[]` as not assignable to `BlobPart[]` due to `SharedArrayBuffer` incompatibility. Fixed with explicit cast `as BlobPart[]`.
- WASM `./pkg/tallow_web.js` module not found during tsc check (expected -- generated by wasm-bindgen at build time). Resolved by adding `web/pkg/tallow_web.d.ts` type declarations.

## User Setup Required
None - no external service configuration required. The web app is pure static files served via any HTTP server.

## Next Phase Readiness
- Web UI foundation complete: ready for clipboard sharing + encrypted chat polish (Plan 21-04)
- WASM modules compile and export all needed functions
- Dashboard layout has all 3 panels wired (files working, clipboard/chat need Plan 21-04 for full integration)
- Settings panel stores relay URL to localStorage
- TypeScript compiles clean with strict mode
- For deployment: need `wasm-bindgen` CLI to generate `web/pkg/` JS bindings, then `tsc` to compile TS, then serve `web/` directory

## Self-Check: PASSED

All 13 created/modified files verified present on disk:
- FOUND: crates/tallow-web/src/transport.rs
- FOUND: crates/tallow-web/src/transfer.rs
- FOUND: crates/tallow-web/src/file_io.rs
- FOUND: web/index.html, web/style.css, web/app.ts, web/transfer.ts, web/wasm.ts
- FOUND: web/tsconfig.json, web/manifest.json, web/pkg/tallow_web.d.ts
- Commit `4af4a49` verified in git log
- Commit `34236a3` verified in git log
- WASM builds for wasm32-unknown-unknown (release profile)
- TypeScript compiles clean (zero errors, strict mode)

---
*Phase: 21-web-ui-browser-client*
*Completed: 2026-02-22*
