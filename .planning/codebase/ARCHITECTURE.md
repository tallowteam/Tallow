# Architecture

**Analysis Date:** 2026-01-23

## Pattern Overview

**Overall:** Next.js App Router with layered client-side architecture

**Key Characteristics:**
- Client-first design: 99% client-side state and logic via `'use client'`
- WebRTC P2P data channel for encrypted file transfer
- Hybrid post-quantum cryptography (ML-KEM/Kyber + X25519)
- Real-time signaling via Socket.IO (local LAN + internet relay)
- Context-based state management (theme, language, caches)
- Component-driven UI with Radix UI primitives

## Layers

**Presentation (Client Components):**
- Purpose: User-facing React components organized by feature
- Location: `./components/`
- Contains: Pages (app/), feature components, UI primitives, dialogs
- Depends on: Hooks, context providers, utilities, types
- Used by: App router pages in `./app/`

**Business Logic (Hooks + State Management):**
- Purpose: Encapsulate complex application logic (file transfer, P2P connection, crypto)
- Location: `./lib/hooks/` and context files in `./lib/i18n/`
- Contains: Custom hooks (useP2PConnection, useFileTransfer, usePQCTransfer), React contexts
- Depends on: Manager classes, crypto libraries, storage utilities
- Used by: Client components and pages

**Core Services (Manager Classes):**
- Purpose: Coordinate system-wide operations like connection management, transfer coordination
- Location: `./lib/signaling/`, `./lib/transfer/`, `./lib/discovery/`
- Contains: ConnectionManager, PQCTransferManager, LocalDiscovery, SocketSignaling
- Depends on: Crypto modules, transport layer, utilities
- Used by: Hooks and direct component integration (refs in AppPage)

**Cryptography & Security:**
- Purpose: Handle encryption, key derivation, authentication, and PQC operations
- Location: `./lib/crypto/`
- Contains: pqc-crypto.ts (Kyber), triple-ratchet.ts, sparse-pq-ratchet.ts, key-management.ts, peer-authentication.ts
- Depends on: @noble/curves, @noble/hashes, pqc-kyber library, crypto.subtle API
- Used by: Transfer managers, peer authentication flows

**Transport & Network:**
- Purpose: Handle P2P connectivity modes (WebRTC, relay, obfuscation)
- Location: `./lib/transport/`, `./lib/network/`, `./lib/discovery/`
- Contains: private-webrtc.ts (force-relay), onion-routing.ts, obfuscation.ts, proxy-config.ts, local-discovery.ts
- Depends on: RTCPeerConnection API, Socket.IO, crypto
- Used by: Connection managers and hooks

**Storage & Persistence:**
- Purpose: Browser storage abstraction (localStorage, IndexedDB) with encryption
- Location: `./lib/storage/`
- Contains: secure-storage.ts, transfer-history.ts, friends.ts, my-devices.ts, transfer-state.ts
- Depends on: crypto-js, localStorage API
- Used by: Pages and hooks

**Data Types:**
- Purpose: TypeScript interfaces for entire application
- Location: `./lib/types.ts`
- Contains: Device, Transfer, FileInfo, TransferOptions, Settings, etc.
- Depends on: Nothing
- Used by: All layers

**Utilities:**
- Purpose: Helper functions for common operations
- Location: `./lib/utils/`, `./lib/utils.ts`
- Contains: uuid generation, file utilities, secure logger, string formatting
- Depends on: Nothing or minimal
- Used by: All layers

## Data Flow

**Send File (Internet P2P):**

1. User selects files in `AppPage` (./app/app/page.tsx)
2. handleStartTransfer calls pqcManager.current.sendFile()
3. PQCTransferManager (./lib/transfer/pqc-transfer-manager.ts):
   - Initializes hybrid key exchange (Kyber + X25519)
   - Sends own public key to peer via RTCDataChannel
   - Receives peer public key and derives shared secret via HKDF
   - Encrypts file chunks with AES-256-GCM using derived session keys
   - Sends metadata (filename, size, hash) + encrypted chunks
4. RTCDataChannel transport relays encrypted data between peers
5. Receiver's PQCTransferManager decrypts and reassembles file

**Local Network Discovery:**

1. LocalDiscovery (./lib/discovery/local-discovery.ts) connects to signaling server in DISCOVERY_ROOM
2. Broadcasts hashed device ID + heartbeat every 3 seconds
3. Collects presence data from other devices
4. setSignalingEvents handler receives WebRTC offers from discovered devices
5. User selects device → handleDeviceSelect initiates WebRTC offer/answer handshake

**Connection by Code (Internet P2P):**

1. User enters code in receiver mode → handleConnectByCode
2. ConnectionManager (./lib/signaling/connection-manager.ts) connects to signaling server
3. Both peers join same socket.io room identified by code
4. Sender's ConnectionManager emits onPeerConnected event
5. Both peers exchange RTCSessionDescription + ICE candidates via socket.io
6. RTCPeerConnection established, dataChannel opens
7. PQC handshake begins on open dataChannel

**Authentication & Verification:**

1. When dataChannel opens, createVerificationSession generates SAS (Short Authentication String)
2. Both users see emoji/word sequence derived from connection code + peer ID
3. User confirms match to prevent MITM attack
4. Session marked verified in storage (peer-authentication.ts)
5. Future connections to same peer skip verification if already verified

**State Management:**

React component state (useState) holds:
- Connection state (isConnected, isConnecting)
- Transfer state (selectedFiles, transfers, progress)
- Device selection (selectedDevice, discoveredDevices)
- Code display (connectionCode, codeType)

Persistent state (localStorage + secure storage):
- Friends list (friends.ts) - trusted contacts
- Transfer history (transfer-history.ts) - past transfers
- Device info (my-devices.ts) - local device data
- Verification cache (peer-authentication.ts) - trusted peers

Context providers:
- ThemeProvider (next-themes) - dark/light mode
- LanguageProvider (i18n/language-context.tsx) - translation strings
- Providers wrapper (components/providers.tsx) - composites all above

## Key Abstractions

**ConnectionManager:**
- Purpose: Abstract Socket.IO signaling for WebRTC connection exchange
- Location: `./lib/signaling/connection-manager.ts`
- Pattern: Singleton-like (getConnectionManager function in app/page.tsx)
- Generates memorable 3-word codes + 8-char alphanumeric codes
- Handles code exchange protocol and ICE candidate relay

**PQCTransferManager:**
- Purpose: Orchestrate hybrid post-quantum encrypted file transfer
- Location: `./lib/transfer/pqc-transfer-manager.ts`
- Pattern: One instance per dataChannel session
- Manages: Key exchange, session establishment, file chunking, encryption/decryption

**LocalDiscovery:**
- Purpose: Enumerate devices on same LAN without cloud services
- Location: `./lib/discovery/local-discovery.ts`
- Pattern: Singleton (getLocalDiscovery function)
- Uses: Signaling server as relay for discovery room (privacy: hashed IDs only)

**PrivateTransport:**
- Purpose: Force WebRTC through relay (prevent IP leaks)
- Location: `./lib/transport/private-webrtc.ts`
- Pattern: RTCConfiguration wrapper
- Ensures: No host candidates, only TURN relay candidates

**Crypto Worker:**
- Purpose: Offload expensive crypto ops to Web Worker (not implemented yet, reference in lib/workers/crypto.worker.ts)
- Location: `./lib/workers/crypto.worker.ts`
- Pattern: Web Worker interface for non-blocking crypto operations

## Entry Points

**Root Layout:**
- Location: `./app/layout.tsx`
- Triggers: App initialization
- Responsibilities: Font setup, metadata, Providers wrapper, HTML structure

**Home Page:**
- Location: `./app/page.tsx` (client component)
- Triggers: Public landing page route
- Responsibilities: Marketing content, feature showcase, CTA buttons

**App/Transfer Page:**
- Location: `./app/app/page.tsx` (1500+ lines, core UI)
- Triggers: `/app` route after user clicks "Get Started"
- Responsibilities:
  - Device discovery (local/internet/friends modes)
  - File selection and transfer queue
  - Connection code display/entry
  - PQC session establishment
  - SAS peer verification UI
  - Real-time transfer progress display

**Settings Page:**
- Location: `./app/app/settings/page.tsx`
- Triggers: `/app/settings` route
- Responsibilities:
  - Theme switching
  - Transfer history management
  - Friend management (add/remove/verify)
  - Proxy/relay configuration

**History Page:**
- Location: `./app/app/history/page.tsx`
- Triggers: `/app/history` route
- Responsibilities: Display past transfers with stats

**API Routes:**
- Welcome Email: `./app/api/send-welcome/route.ts` - Server-side email via Resend
- Stripe Checkout: `./app/api/stripe/create-checkout-session/route.ts` - Create checkout session
- Stripe Webhook: `./app/api/stripe/webhook/route.ts` - Handle donation webhooks

## Error Handling

**Strategy:** Toast notifications for user feedback, console logging for debugging

**Patterns:**

Connection errors:
- Timeout after 30 seconds → show toast, cleanup connection
- ICE candidate errors → logged, queued candidates added after remote description
- Data channel errors → show toast, mark transfer failed

Crypto errors:
- Key derivation failures → marked session as failed
- Decryption failures → show error toast, trigger retry or abort
- Signature validation → disconnect if peer authentication fails

File transfer errors:
- Chunk send/receive failures → retry up to 3 times
- Transfer timeout → abort and show error
- Storage quota exceeded → catch error and notify user

Signaling errors:
- Socket.IO connection failure → show "failed to connect to signaling server"
- Peer not found by code → "Failed to connect"
- Code invalid → validation in handleConnectByCode

## Cross-Cutting Concerns

**Logging:**
- Secure logger (./lib/utils/secure-logger.ts) - filters sensitive data
- Used throughout: "secureLog.warn", "secureLog.error"
- Cannot log: device IDs, keys, connection codes

**Validation:**
- Code format validation (isValidCode in transfer/word-phrase-codes.ts)
- File size limits enforced (MAX_FILE_SIZE in hooks)
- RTCSessionDescription validation before use
- Transfer message structure validation in PQCTransferManager

**Authentication:**
- No user accounts (code-based pairing)
- Optional friend verification via SAS
- Peer identity verification (createVerificationSession)
- Stored verification cache prevents MITM on known peers

**Cleanup:**
- useEffect cleanup functions unmount listeners
- cleanupConnection() closes WebRTC connections, clears refs
- disconnectManager() on component unmount
- No memory leaks from circular references (refs properly cleared)

---

*Architecture analysis: 2026-01-23*
