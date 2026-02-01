# TALLOW Architecture

Technical architecture documentation for TALLOW - Quantum-Resistant P2P File Transfer Platform.

## Table of Contents

- [System Overview](#system-overview)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Technology Stack](#technology-stack)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)

## System Overview

TALLOW is a hybrid P2P/cloud file transfer platform built with Next.js 16, featuring:

- **Peer-to-Peer Core**: Direct device-to-device transfers via WebRTC
- **Cloud Fallback**: Email-based transfer when P2P unavailable
- **Post-Quantum Crypto**: ML-KEM-768 (Kyber) + X25519 hybrid encryption
- **Privacy Layer**: Onion routing and metadata stripping
- **Real-Time Signaling**: Socket.IO for WebRTC negotiation

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         TALLOW Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Web Client │      │   Signaling  │      │   Email      │  │
│  │  (Next.js 16)│◄────►│   Server     │      │   Service    │  │
│  │              │      │  (Socket.IO) │      │  (Resend)    │  │
│  └──────┬───────┘      └──────────────┘      └──────────────┘  │
│         │                                                         │
│         │ WebRTC P2P                                             │
│         ▼                                                         │
│  ┌──────────────┐                           ┌──────────────┐    │
│  │  Peer Device │◄─────────────────────────►│  S3 Storage  │    │
│  │              │   Encrypted File Upload   │              │    │
│  └──────────────┘                           └──────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend (Web Client)

**Location**: `/app`, `/components`, `/lib`

**Framework**: Next.js 16 with React 19

**Key Responsibilities**:
- User interface rendering
- File selection and validation
- WebRTC connection management
- Cryptographic operations (client-side)
- Transfer progress tracking

**Major Modules**:

```
/app
├── page.tsx                 # Main landing page
├── app/page.tsx             # Transfer UI
├── room/[code]/page.tsx     # Transfer rooms
├── api/                     # API routes
└── layout.tsx               # Root layout

/components
├── transfer/                # Transfer components
├── devices/                 # Device management
├── friends/                 # Friends list
└── ui/                      # Reusable UI components

/lib
├── crypto/                  # Cryptography
├── transfer/                # Transfer logic
├── signaling/               # WebRTC signaling
├── storage/                 # Local storage
└── hooks/                   # React hooks
```

### 2. Signaling Server

**Location**: `/signaling-server.js`

**Technology**: Socket.IO on Node.js

**Purpose**: WebRTC signaling and room management

**Key Functions**:
```javascript
// Room management
socket.on('join-room', (roomId, peerId))
socket.on('leave-room', (roomId))

// WebRTC signaling
socket.on('offer', ({ target, offer }))
socket.on('answer', ({ target, answer }))
socket.on('ice-candidate', ({ target, candidate }))

// PQC handshake
socket.on('pqc-public-key', ({ room, publicKey }))
socket.on('pqc-ciphertext', ({ target, ciphertext }))
```

**Deployment**:
- Standalone Node.js server
- Can be deployed separately from Next.js app
- Supports multiple instances with Redis for scaling

### 3. Cryptography Layer

**Location**: `/lib/crypto/`

**Components**:

#### a) PQC Crypto Service (`pqc-crypto.ts`)

```typescript
class PQCryptoService {
  // Key generation
  generateHybridKeypair(): Promise<HybridKeyPair>

  // Key exchange
  encapsulate(publicKey): Promise<{ciphertext, sharedSecret}>
  decapsulate(ciphertext, keypair): Promise<sharedSecret>

  // Encryption/Decryption
  encrypt(plaintext, key): Promise<EncryptedData>
  decrypt(encrypted, key): Promise<Uint8Array>

  // Key derivation
  deriveSessionKeys(sharedSecret): SessionKeys
}
```

**Algorithms**:
- **PQC**: ML-KEM-768 (NIST-standardized Kyber)
- **Classical**: X25519 (Elliptic Curve Diffie-Hellman)
- **Symmetric**: AES-256-GCM
- **Hashing**: BLAKE3, SHA-256
- **KDF**: HKDF-SHA256

#### b) Triple Ratchet (`triple-ratchet.ts`)

```typescript
class TripleRatchet {
  // Signal Protocol + Post-Quantum
  rootRatchet: RootRatchet
  sendingChain: ChainKey
  receivingChain: ChainKey
  pqcRatchet: PQCRatchet

  // Forward secrecy
  ratchetSend(message: Uint8Array): EncryptedMessage
  ratchetReceive(encrypted: EncryptedMessage): Uint8Array
}
```

**Security Properties**:
- Forward secrecy
- Post-compromise security
- Deniability
- Out-of-order message handling

#### c) File Encryption (`file-encryption-pqc.ts`)

```typescript
interface FileEncryption {
  // Chunk-based encryption for streaming
  encryptFile(file: File, key: Uint8Array): AsyncGenerator<EncryptedChunk>
  decryptFile(chunks: EncryptedChunk[], key: Uint8Array): Promise<Blob>

  // Password-based encryption
  encryptWithPassword(file: File, password: string): Promise<ProtectedFile>
  decryptWithPassword(encrypted: ProtectedFile, password: string): Promise<Blob>
}
```

### 4. Transfer Manager

**Location**: `/lib/transfer/transfer-manager.ts`

**Responsibility**: Orchestrates all file transfers

```typescript
class TransferManager {
  // Transfer lifecycle
  addTransfer(files, from, to, direction): Transfer
  updateTransfer(id, updates): void
  completeTransfer(id): void
  failTransfer(id, error): void

  // Transfer control
  pauseTransfer(id): void
  resumeTransfer(id): void
  cancelTransfer(id): void

  // Monitoring
  getActiveTransfers(): Transfer[]
  getTotalProgress(): number
  getTotalSpeed(): number

  // Event system
  on(listener): () => void
}
```

**State Machine**:
```
pending → connecting → transferring → completed
   ↓          ↓             ↓             ↑
   ↓          ↓             ↓             ↑
   └─────→ failed ←─────────┘             ↑
   ↓          ↑             ↓             ↑
   └─────→ cancelled ←──────┘             ↑
              ↑             ↓             ↑
              └─────────  paused ────────┘
```

### 5. WebRTC Layer

**Location**: `/lib/transport/private-webrtc.ts`

**Purpose**: Establish and manage P2P connections

```typescript
class PrivateWebRTC {
  // Connection setup
  createOffer(): Promise<RTCSessionDescriptionInit>
  handleOffer(offer): Promise<RTCSessionDescriptionInit>
  handleAnswer(answer): Promise<void>
  handleIceCandidate(candidate): Promise<void>

  // Data channels
  createDataChannel(label): RTCDataChannel
  sendData(data: ArrayBuffer): void

  // Connection management
  connect(): Promise<void>
  disconnect(): void

  // State monitoring
  getConnectionState(): RTCPeerConnectionState
  getStats(): Promise<RTCStatsReport>
}
```

**Connection Establishment**:
```
Sender                                  Receiver
  │                                        │
  ├─► Generate PQC keypair                │
  │                                        │
  ├─► Send PQC public key ──────────────► ├─► Receive public key
  │                                        │
  │                                        ├─► Encapsulate (generate shared secret)
  │                                        │
  │   ◄──────────── Send ciphertext ──────┤
  │                                        │
  ├─► Decapsulate (derive shared secret)  │
  │                                        │
  ├─► Create WebRTC offer                 │
  │                                        │
  ├─► Encrypt offer with shared secret    │
  │                                        │
  ├─► Send encrypted offer ──────────────►├─► Decrypt offer
  │                                        │
  │                                        ├─► Create answer
  │                                        │
  │   ◄──────────── Encrypted answer ─────┤
  │                                        │
  ├─► Decrypt answer                       │
  │                                        │
  ├─► Exchange ICE candidates ◄──────────►│
  │                                        │
  ├──────────── P2P Connection ───────────┤
  │                                        │
  ├──────────── File Transfer ────────────►│
```

### 6. Storage Layer

**Location**: `/lib/storage/`

**Components**:

#### Secure Storage (`secure-storage.ts`)
```typescript
class SecureStorage {
  // Encrypted local storage
  setItem(key: string, value: unknown): Promise<void>
  getItem(key: string): Promise<unknown>
  removeItem(key: string): Promise<void>

  // Storage encryption with device key
  private encryptData(data: unknown): Promise<string>
  private decryptData(encrypted: string): Promise<unknown>
}
```

#### Transfer History (`transfer-history.ts`)
```typescript
// IndexedDB for large transfer metadata
interface TransferHistory {
  saveTransfer(transfer: Transfer): Promise<void>
  getTransfer(id: string): Promise<Transfer>
  searchTransfers(query: SearchQuery): Promise<Transfer[]>
  deleteOldTransfers(olderThan: number): Promise<number>
}
```

#### Friends Storage (`friends.ts`)
```typescript
interface FriendsStorage {
  addFriend(device: Device): Promise<void>
  removeFriend(id: string): Promise<void>
  getFriends(): Promise<Device[]>
  updateFriend(id: string, updates: Partial<Device>): Promise<void>
}
```

### 7. Email Fallback Service

**Location**: `/lib/email-fallback/`

**Flow**:
```
1. User initiates transfer
   ↓
2. P2P connection fails
   ↓
3. Encrypt file with AES-256-GCM
   ↓
4. Upload to S3 with presigned URL
   ↓
5. Generate download token + key
   ↓
6. Send email with Resend
   ↓
7. Recipient clicks link
   ↓
8. Download file from S3
   ↓
9. Decrypt in browser
   ↓
10. Auto-delete from S3 after 24h
```

**Components**:

```typescript
// Email service
class EmailService {
  sendTransferEmail(params: EmailParams): Promise<EmailResult>
  trackDelivery(transferId: string): Promise<DeliveryStatus>
  retryFailed(transferId: string): Promise<void>
}

// S3 storage
class S3Storage {
  uploadEncrypted(file: Blob, metadata): Promise<{fileId, url}>
  download(fileId: string, token: string): Promise<Blob>
  deleteExpired(): Promise<number>
}

// Transfer tracking
class EmailTransferTracker {
  createTransfer(data): Promise<Transfer>
  updateStatus(id, status): Promise<void>
  getStatus(id): Promise<TransferStatus>
}
```

## Data Flow

### P2P Transfer Flow

```
┌─────────────┐                                    ┌─────────────┐
│   Sender    │                                    │  Receiver   │
└──────┬──────┘                                    └──────┬──────┘
       │                                                  │
       │ 1. Select files                                 │
       │                                                  │
       │ 2. Generate connection code                     │
       │    (create room on signaling server)            │
       │                                                  │
       │                     ┌──────────────┐            │
       │  ◄──────────────────┤   Signaling  ├────────────►
       │                     │    Server    │            │
       │                     └──────────────┘            │
       │                                                  │
       │                                                  │ 3. Enter code
       │                                                  │    (join room)
       │                                                  │
       │ 4. Generate PQC keypair                         │
       │                                                  │
       ├──────── PQC Public Key ────────────────────────►│
       │                                                  │
       │                                                  │ 5. Encapsulate
       │                                                  │    (create shared secret)
       │                                                  │
       │◄───────── PQC Ciphertext ────────────────────────┤
       │                                                  │
       │ 6. Decapsulate                                  │
       │    (derive shared secret)                       │
       │                                                  │
       │ 7. WebRTC Offer (encrypted)                     │
       ├─────────────────────────────────────────────────►│
       │                                                  │
       │                                                  │ 8. WebRTC Answer (encrypted)
       │◄─────────────────────────────────────────────────┤
       │                                                  │
       │ 9. ICE Candidates                               │
       │◄────────────────────────────────────────────────►│
       │                                                  │
       │══════════════ P2P Connection ═══════════════════│
       │                                                  │
       │ 10. File metadata (encrypted)                   │
       ├─────────────────────────────────────────────────►│
       │                                                  │
       │                                                  │ 11. Accept/Reject
       │◄─────────────────────────────────────────────────┤
       │                                                  │
       │ 12. File chunks (encrypted + authenticated)     │
       ├═════════════════════════════════════════════════►│
       │                                                  │
       │ 13. Acknowledgments                             │
       │◄─────────────────────────────────────────────────┤
       │                                                  │
       │ 14. Transfer complete                           │
       │                                                  │ 15. Verify integrity
       │                                                  │
       └──────────────────────────────────────────────────┘
```

### Email Fallback Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Sender  │     │   API   │     │   S3    │     │ Receiver│
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     ├─ 1. Encrypt  │               │               │
     │   file       │               │               │
     │              │               │               │
     ├─ 2. Request─►│               │               │
     │   upload URL │               │               │
     │              │               │               │
     │              ├─ 3. Generate ►│               │
     │              │   presigned   │               │
     │              │   URL         │               │
     │              │               │               │
     │◄─ 4. Return ─┤               │               │
     │   URL        │               │               │
     │              │               │               │
     ├─ 5. Upload──────────────────►│               │
     │   encrypted  │               │               │
     │   file       │               │               │
     │              │               │               │
     ├─ 6. Send────►│               │               │
     │   email req  │               │               │
     │              │               │               │
     │              ├─ 7. Send email with link ────►│
     │              │                               │
     │              │               │               │
     │              │               │◄─ 8. Click───┤
     │              │               │   link       │
     │              │               │               │
     │              │               │               │ 9. Download
     │              │               ├──────────────►│   encrypted
     │              │               │               │
     │              │               │               │
     │              │               │               │ 10. Decrypt
     │              │               │               │    in browser
     │              │               │               │
     │              ├◄─11. Track───┤               │
     │              │   download    │               │
     │              │               │               │
     │              │               │               │
     │              │  12. Auto-    │               │
     │              │  delete after │               │
     │              │  24h          │               │
     │              ├──────────────►│               │
     └──────────────┴───────────────┴───────────────┘
```

## Technology Stack

### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Next.js | 16.1.2 | React framework |
| UI Library | React | 19.2.3 | Component library |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.4.17 | Utility-first CSS |
| UI Components | Radix UI | Various | Accessible components |
| Animations | Framer Motion | 12.26.2 | Animations |
| Icons | Lucide React | 0.562.0 | Icon library |
| State | React Context | Built-in | Global state |

### Cryptography

| Component | Library | Purpose |
|-----------|---------|---------|
| PQC | @noble/post-quantum | ML-KEM (Kyber) |
| Curves | @noble/curves | X25519, Ed25519 |
| Hashing | @noble/hashes | SHA-256, BLAKE3 |
| Symmetric | Web Crypto API | AES-256-GCM |
| Argon2 | hash-wasm | Password hashing |

### WebRTC & Networking

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Signaling | Socket.IO | 4.8.3 | WebRTC signaling |
| P2P | SimplePeer | 9.11.1 | WebRTC wrapper |
| WebRTC | Browser native | - | Peer connections |

### Storage & Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Email | Resend | 6.7.0 | Email delivery |
| Storage | AWS S3 | 3.975.0 | File storage |
| Payments | Stripe | 20.2.0 | Donations |
| Database | IndexedDB | Built-in | Local storage |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| TypeScript | Type checking |
| Vitest | Unit testing |
| Playwright | E2E testing |
| Husky | Git hooks |
| Lighthouse | Performance testing |

## Security Architecture

### Defense in Depth

```
Layer 1: Transport Security
├─ TLS 1.3 for all HTTPS traffic
├─ Certificate pinning (optional)
└─ HSTS headers

Layer 2: Application Security
├─ CSRF protection
├─ XSS prevention (CSP headers)
├─ SQL injection prevention (no SQL!)
└─ Input validation

Layer 3: Encryption
├─ End-to-end encryption (E2EE)
├─ Post-quantum cryptography
├─ Perfect forward secrecy
└─ Deniable authentication

Layer 4: Privacy
├─ No user tracking
├─ Metadata stripping
├─ Onion routing (optional)
└─ Secure deletion

Layer 5: Access Control
├─ Password protection
├─ Connection codes (time-limited)
├─ Per-transfer authentication
└─ Download limits
```

### Threat Model

**Protected Against**:
- ✅ Passive network eavesdropping
- ✅ Active MITM attacks
- ✅ Server compromise (E2EE)
- ✅ Quantum computer attacks (PQC)
- ✅ Metadata analysis
- ✅ Traffic analysis (with onion routing)

**NOT Protected Against**:
- ❌ Endpoint compromise (malware on device)
- ❌ Coercion of users
- ❌ Physical access to unlocked device
- ❌ Supply chain attacks
- ❌ Targeted government surveillance (requires additional measures)

### Key Management

```
Device Key (long-term)
├─ Generated on first use
├─ Stored in browser local storage (encrypted)
├─ Used to encrypt other keys
└─ Never transmitted

Session Keys (ephemeral)
├─ Generated per transfer
├─ Derived from PQC + ECDH
├─ Forward secret
├─ Deleted after transfer

File Keys (per-file)
├─ Random 256-bit AES key
├─ Encrypted with session key
├─ Unique nonce per chunk
└─ Deleted after transfer
```

## Deployment Architecture

### Production Deployment (Vercel)

```
┌────────────────────────────────────────────────┐
│              Vercel Edge Network               │
│  ┌──────────────────────────────────────────┐  │
│  │        Next.js 16 Application            │  │
│  │  ┌────────────┐      ┌────────────┐     │  │
│  │  │  Static    │      │ API Routes │     │  │
│  │  │  Assets    │      │ (/api/*)   │     │  │
│  │  └────────────┘      └────────────┘     │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
         │                        │
         │                        ├──────────► Resend (Email)
         │                        │
         │                        ├──────────► Stripe (Payments)
         │                        │
         │                        └──────────► AWS S3 (Storage)
         │
         ▼
┌────────────────────────┐
│  Signaling Server      │
│  (Separate Node.js)    │
│  - Socket.IO           │
│  - WebSocket support   │
└────────────────────────┘
```

### Self-Hosted Deployment (Docker)

```
┌─────────────────────────────────────────────────┐
│              Docker Host / Kubernetes           │
│                                                  │
│  ┌────────────────┐       ┌──────────────────┐ │
│  │   nginx        │       │   tallow-app     │ │
│  │   (Reverse     │──────►│   (Next.js)      │ │
│  │    Proxy)      │       │   Port: 3000     │ │
│  │   Port: 80/443 │       └──────────────────┘ │
│  └────────────────┘                │           │
│         │                           │           │
│         │                           ▼           │
│         │               ┌──────────────────┐   │
│         │               │ tallow-signaling │   │
│         └──────────────►│  (Socket.IO)     │   │
│                         │  Port: 8080      │   │
│                         └──────────────────┘   │
│                                                  │
│  ┌────────────────────────────────────────────┐│
│  │          Persistent Volumes                 ││
│  │  - Transfer history                         ││
│  │  - Logs                                     ││
│  └────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Scaling Strategy

**Horizontal Scaling**:
```
Load Balancer
├─ App Instance 1 ──┐
├─ App Instance 2 ──┼─► Shared Redis (session state)
├─ App Instance 3 ──┤
└─ App Instance N ──┘

Signaling Cluster
├─ Signaling 1 ──┐
├─ Signaling 2 ──┼─► Redis Pub/Sub (room sync)
├─ Signaling 3 ──┤
└─ Signaling N ──┘
```

**Performance Targets**:
- Response time: <100ms (p95)
- Transfer speed: Limited by user bandwidth
- Signaling latency: <50ms
- Support: 10,000+ concurrent users
- Storage: S3 with CloudFront CDN

## Monitoring & Observability

### Metrics (Prometheus)

```typescript
// Key metrics tracked:
- http_requests_total
- http_request_duration_seconds
- transfer_started_total
- transfer_completed_total
- transfer_failed_total
- transfer_size_bytes
- transfer_duration_seconds
- websocket_connections_total
- pqc_operations_total
```

### Logging (Sentry)

```typescript
// Error tracking:
- JavaScript exceptions
- Network errors
- Crypto failures
- Transfer failures

// Breadcrumbs:
- User actions
- API calls
- State changes
```

### Health Checks

```typescript
// Liveness: /api/health
{
  status: "ok",
  uptime: 12345.67
}

// Readiness: /api/ready
{
  status: "ok",
  checks: {
    pqcLibrary: true,
    signalingServer: true,
    environment: true
  }
}
```

## Next Steps

- [Crypto Implementation](./crypto-implementation.md)
- [WebRTC Flow](./webrtc-flow.md)
- [Signaling Protocol](./signaling-protocol.md)
- [Deployment Guide](./deployment.md)
