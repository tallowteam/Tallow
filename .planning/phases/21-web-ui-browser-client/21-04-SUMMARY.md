---
phase: 21-web-ui-browser-client
plan: 04
subsystem: ui
tags: [wasm, clipboard-api, chat, aes-256-gcm, typing-indicators, emoji, sessionstorage, sanitization]

# Dependency graph
requires:
  - phase: 21-web-ui-browser-client (plan 03)
    provides: "Browser file transfer UI, WASM bridge, TypeScript infrastructure, dark theme"
  - phase: 21-web-ui-browser-client (plan 01)
    provides: "tallow-web WASM crate with crypto and codec wrappers"
provides:
  - "WASM clipboard module with content type detection and manifest preparation"
  - "WASM ChatSession with stateful counters and AES-256-GCM encryption matching CLI nonce construction"
  - "Browser Clipboard API integration with fallback textarea for denied permissions"
  - "Chat UI with real-time messaging, typing indicators, emoji picker, sessionStorage history"
  - "Double sanitization pipeline: WASM sanitize_display_text + HTML escaping"
affects: [21-web-ui-browser-client-plan-05]

# Tech tracking
tech-stack:
  added: [Clipboard API, ClipboardItem, sessionStorage]
  patterns: [module delegation (app.ts delegates to chat.ts/clipboard.ts), stateful WASM classes, double sanitization, typing debounce]

key-files:
  created:
    - crates/tallow-web/src/clipboard.rs
    - crates/tallow-web/src/chat.rs
    - web/clipboard.ts
    - web/chat.ts
  modified:
    - crates/tallow-web/src/lib.rs
    - web/app.ts
    - web/index.html
    - web/style.css
    - web/wasm.ts
    - web/pkg/tallow_web.d.ts

key-decisions:
  - "ChatSession uses stateful counters (send += 2, recv += 2) matching CLI chat encryption exactly"
  - "Clipboard sends as FileOffer+Chunk pipeline (same wire format as file transfer) for CLI interop"
  - "Chat history stored in sessionStorage only (never localStorage) per WEB-14 security"
  - "Module delegation: app.ts delegates chat/clipboard to dedicated modules rather than inline code"
  - "decryptMessageWithNonce() takes explicit nonce from wire message for CLI interop"

patterns-established:
  - "Module delegation: app.ts imports and delegates to chat.ts and clipboard.ts"
  - "Stateful WASM classes: ChatSession manages counters internally, exposed via wasm-bindgen"
  - "Double sanitization: WASM strips ANSI/control chars, TypeScript uses textContent for HTML escaping"
  - "Typing indicator debounce: 300ms send delay, 2s inactivity sends stop, 5s auto-clear on receive"

requirements-completed: [WEB-12, WEB-13, WEB-14, WEB-15, WEB-16]

# Metrics
duration: 18min
completed: 2026-02-22
---

# Phase 21 Plan 04: Clipboard & Chat Summary

**WASM clipboard sharing + encrypted chat with typing indicators, emoji picker, and double sanitization -- all interoperable with CLI wire protocol**

## Performance

- **Duration:** 18 min
- **Started:** 2026-02-22T16:00:00Z
- **Completed:** 2026-02-22T16:18:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- WASM clipboard module with content type detection (url/code/text), manifest preparation, and clipboard content parsing -- all interoperable with `tallow clip` wire format
- WASM ChatSession with stateful send/receive counters, AES-256-GCM encryption using nonce `[0u8;4]||counter.to_be_bytes()` and AAD `b"tallow-chat-v1"`, matching CLI chat exactly
- Browser Clipboard API integration: text/image read via `navigator.clipboard`, encrypted send as FileOffer+Chunk, auto-copy on receive, fallback textarea for denied permissions
- Chat UI with real-time messaging, animated typing indicators (WEB-16), emoji picker (50 emojis), sessionStorage-only history (WEB-14), and double sanitization (WEB-15)
- Refactored app.ts to delegate chat and clipboard to dedicated modules with clean separation of concerns

## Task Commits

Each task was committed atomically:

1. **Task 1: WASM clipboard and chat modules + TypeScript Clipboard API integration** - `8bcb32c` (feat)
2. **Task 2: Chat UI with real-time messaging, typing indicators, sanitization, and emoji** - `b9ff5fe` (feat)

## Files Created/Modified

- `crates/tallow-web/src/clipboard.rs` - WASM clipboard helpers: detect_content_type, prepare_clipboard_manifest, parse_clipboard_content
- `crates/tallow-web/src/chat.rs` - WASM ChatSession: stateful counters, encrypt_message, decrypt_message, decrypt_message_with_nonce
- `crates/tallow-web/src/lib.rs` - Added pub mod chat and clipboard
- `web/clipboard.ts` - Browser Clipboard API integration: share, receive, fallback textarea, image support
- `web/chat.ts` - Chat UI: messaging, typing indicators, emoji picker, sessionStorage history
- `web/app.ts` - Refactored: delegated chat/clipboard to modules, added sendWsBytesExport, initChatUI/destroyChatUI calls
- `web/index.html` - Enhanced chat panel with emoji picker, typing dots, clipboard fallback textarea
- `web/style.css` - Chat bubble animations, typing bounce keyframes, emoji grid styles, clipboard panel styles
- `web/wasm.ts` - Added exports: detectContentType, prepareClipboardManifest, parseClipboardContent, ChatSession
- `web/pkg/tallow_web.d.ts` - Type declarations for new WASM clipboard functions and ChatSession class

## Decisions Made

1. **ChatSession stateful design**: The WASM ChatSession manages send/receive counters internally (send starts at 0, recv at 1, both increment by 2). This matches the CLI's counter-based nonce construction exactly: `[0u8;4]||counter.to_be_bytes()`.

2. **decryptMessageWithNonce for CLI interop**: Created a separate method that takes an explicit nonce from the wire message (ChatText carries its nonce). This is essential because the CLI's nonce might not perfectly align with the browser's counter state.

3. **Clipboard as FileOffer+Chunk pipeline**: Browser clipboard sharing uses the same wire format as file transfer (FileOffer with manifest flagged `is_clipboard: true`, then encrypted Chunk). This ensures full interoperability with `tallow clip`.

4. **Module delegation pattern**: Rather than growing app.ts with inline chat/clipboard code, created dedicated modules (chat.ts, clipboard.ts) imported by app.ts. This keeps app.ts focused on state machine and WebSocket lifecycle.

5. **sessionStorage-only chat history**: Per WEB-14 security requirement, chat history is stored only in sessionStorage (cleared on tab close), never localStorage or IndexedDB. Maximum 200 messages stored.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Uint8Array to BlobPart strict mode type error in clipboard.ts**
- **Found during:** Task 2 (TypeScript verification)
- **Issue:** TypeScript strict mode rejects `new Blob([data])` where `data` is `Uint8Array` because `Uint8Array` isn't assignable to `BlobPart` due to `SharedArrayBuffer` incompatibility
- **Fix:** Added `as BlobPart` cast at both occurrences (receiveClipboard and showReceivedContent)
- **Files modified:** web/clipboard.ts
- **Verification:** `npx tsc --noEmit` passes clean
- **Committed in:** b9ff5fe (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor TypeScript strict mode fix. No scope creep.

## Issues Encountered
None beyond the TypeScript strict mode issue documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Clipboard sharing and chat features complete, ready for Plan 05 (PWA + testing)
- All 3 core features (file transfer, clipboard, chat) now implemented in the browser
- Service worker, offline support, and integration testing remain for Plan 05

## Self-Check: PASSED

All 10 files verified present on disk. Both task commits (8bcb32c, b9ff5fe) verified in git log.

---
*Phase: 21-web-ui-browser-client*
*Completed: 2026-02-22*
