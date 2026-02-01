# TALLOW - COMPLETE FEATURE & TECHNICAL DOCUMENTATION

**Version:** 0.1.0
**Last Updated:** 2026-01-27
**Status:** Production Ready

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Core File Transfer Features](#2-core-file-transfer-features)
3. [Post-Quantum Cryptography](#3-post-quantum-cryptography)
4. [Security Implementation](#4-security-implementation)
5. [Privacy Features](#5-privacy-features)
6. [Communication Features](#6-communication-features)
7. [User Interface & Experience](#7-user-interface--experience)
8. [Components Catalog](#8-components-catalog)
9. [API Endpoints](#9-api-endpoints)
10. [External Integrations](#10-external-integrations)
11. [Custom Hooks](#11-custom-hooks)
12. [Storage & Data Management](#12-storage--data-management)
13. [Network & Transport](#13-network--transport)
14. [Monitoring & Analytics](#14-monitoring--analytics)
15. [Testing Infrastructure](#15-testing-infrastructure)
16. [Internationalization](#16-internationalization)
17. [Deployment Options](#17-deployment-options)
18. [Configuration](#18-configuration)
19. [Architecture Diagrams](#19-architecture-diagrams)
20. [Production Checklist](#20-production-checklist)

---

## 1. EXECUTIVE SUMMARY

### Overview

**Tallow** is a production-grade, quantum-resistant peer-to-peer file transfer platform built with modern web technologies. It provides secure, private, and encrypted file sharing without storing files on servers.

### Key Statistics

```
Total Codebase:         ~106,000+ lines
TypeScript (lib/):      48,152 lines
React/TSX:              33,505 lines
Pages/API:              ~15,000 lines
Tests:                  ~8,000 lines
Components:             141 React components
API Endpoints:          22 REST endpoints
Custom Hooks:           30+ React hooks
Test Suites:            19 E2E suites
Test Scenarios:         400+ scenarios
Language Support:       22 languages
Themes:                 4 production themes
Test Coverage:          70%+
```

### Technology Stack

**Frontend:**
- Next.js 16 (React 19, TypeScript 5)
- Tailwind CSS
- Framer Motion
- shadcn/ui components

**Backend:**
- Node.js + Socket.IO signaling server
- Cloudflare R2 (cloud storage)
- Resend (email delivery)

**Cryptography:**
- ML-KEM-768 (NIST FIPS 203 post-quantum)
- X25519 (classical key exchange)
- AES-256-GCM (symmetric encryption)
- BLAKE3 (hashing)
- Argon2id (password hashing)

**Storage:**
- IndexedDB (client-side encrypted)
- Cloudflare R2 (cloud fallback)

**Testing:**
- Playwright (E2E)
- Vitest (unit tests)
- Visual regression testing

**Monitoring:**
- Sentry (error tracking)
- Plausible (analytics)
- Prometheus (metrics)

---

## 2. CORE FILE TRANSFER FEATURES

### 2.1 Peer-to-Peer File Transfer

**Location:** `lib/transfer/p2p-internet.ts`

**Description:**
Direct WebRTC-based file transfer between browsers without server intermediary storage.

**Features:**
- WebRTC DataChannel for low-latency streaming
- Progressive chunk encryption (64KB chunks)
- Real-time progress tracking
- Multiple file support
- Drag & drop interface
- Pause/resume capability
- Automatic retry on failure

**Technical Details:**
```typescript
// Transfer flow
1. Peer discovery via signaling server
2. WebRTC connection establishment
3. ML-KEM-768 + X25519 key exchange
4. Per-chunk AES-256-GCM encryption
5. Progressive streaming over DataChannel
6. Chunk integrity verification (BLAKE3)
7. Automatic decryption on receiver
```

**Supported File Types:** All file types (binary safe)

**File Size Limits:**
- P2P: No hard limit (tested up to 10GB)
- Email fallback: 25MB (Resend limit)

**Performance:**
- Local network: 100+ MB/s
- Internet: Limited by bandwidth
- Encryption overhead: <5%

### 2.2 Group Transfer (1-to-Many)

**Location:** `lib/transfer/group-transfer-manager.ts`

**Description:**
Send files to 2-10 recipients simultaneously with independent progress tracking.

**Features:**
- Parallel WebRTC connections (1 sender → N receivers)
- Independent progress per recipient
- Bandwidth management (fair distribution)
- Individual failure handling
- Group status aggregation
- Retry failed recipients
- Cancel specific recipients

**Technical Implementation:**
```typescript
// Components
- GroupTransferManager: Orchestrates multi-peer transfers
- GroupDiscoveryManager: Finds multiple devices
- RecipientSelector: UI for choosing recipients
- GroupTransferProgress: Real-time status per recipient

// Flow
1. User selects multiple recipients (2-10)
2. System establishes WebRTC connection to each
3. File is encrypted once, sent to all
4. Each recipient gets independent progress
5. Failures don't affect other recipients
6. Completion tracked per recipient
```

**Bandwidth Distribution:**
- Equal bandwidth allocation by default
- Priority mode for specific recipients
- Adaptive based on connection quality

### 2.3 Password Protection

**Location:** `lib/crypto/password-file-encryption.ts`

**Description:**
Add an additional layer of encryption with user-defined passwords.

**Features:**
- Argon2id key derivation (600k iterations)
- AES-256-GCM password encryption
- Per-file password support
- Password strength meter
- Optional password hints
- Second encryption layer (on top of PQC)

**Technical Details:**
```typescript
// Password encryption flow
1. User provides password
2. Argon2id derives 256-bit key (600k iterations, 64MB memory)
3. AES-256-GCM encrypts already-PQC-encrypted file
4. Password hint stored separately (optional)
5. Receiver must enter password to decrypt

// Parameters
- Algorithm: Argon2id
- Iterations: 600,000
- Memory: 64MB
- Parallelism: 4 threads
- Time cost: 2-5 seconds (intentionally slow)
```

**Use Cases:**
- Extra security for sensitive files
- Compliance requirements
- Shared device scenarios
- Multi-factor protection

### 2.4 Metadata Stripping

**Location:** `lib/privacy/metadata-stripper.ts`

**Description:**
Automatically remove sensitive metadata from images and videos before transfer.

**Supported Formats:**
- Images: JPEG, PNG, WebP, HEIC, HEIF
- Videos: MP4, MOV, M4V

**Metadata Removed:**
- GPS coordinates (latitude, longitude, altitude)
- Camera make/model
- Lens information
- Serial numbers
- Timestamps (creation, modification, digitized)
- Author/copyright
- Software version
- Device identifiers
- Color profile
- Orientation (optional preserve)

**Technical Implementation:**
```typescript
// Libraries used
- ExifReader: Extract metadata
- Canvas API: Create clean images
- WebCodecs: Video re-encoding

// Process
1. Read file with ExifReader
2. Extract all metadata tags
3. Display privacy warning if sensitive data found
4. Create new clean file (canvas/encoder)
5. Copy visual data only
6. Return sanitized File object
```

**Privacy Settings:**
```typescript
interface MetadataStripSettings {
  autoStrip: boolean;              // Auto-strip on transfer
  preserveOrientation: boolean;    // Keep orientation tag
  trustedContacts: string[];       // Skip stripping for these
  warnBeforeStrip: boolean;        // Show confirmation dialog
  stripByFileType: {
    images: boolean;
    videos: boolean;
  };
}
```

### 2.5 Email Fallback

**Location:** `lib/email-fallback/index.ts`

**Description:**
Automatic fallback to encrypted email delivery if P2P connection fails.

**Features:**
- Automatic retry mechanism
- Cloudflare R2 cloud storage
- Resend email service integration
- 24-hour auto-expiration
- Encryption at rest
- Password protection support
- Batch sending (multiple recipients)
- Delivery status tracking

**Technical Flow:**
```typescript
// Email fallback process
1. P2P transfer fails after 3 retry attempts
2. User prompted: "Try email fallback?"
3. File encrypted with AES-256-GCM
4. Upload to Cloudflare R2 bucket
5. Generate time-limited download URL
6. Send email via Resend with URL
7. Recipient clicks link, enters password (if set)
8. File downloaded and decrypted
9. R2 file auto-deleted after 24 hours
```

**Email Template:**
```html
Subject: [Sender] sent you a file via Tallow

Body:
- Download link (expires in 24 hours)
- File name and size
- Password hint (if applicable)
- Security information
- Tallow branding
```

**Storage:**
- Provider: Cloudflare R2
- Encryption: AES-256-GCM at rest
- Expiration: 24 hours
- Cleanup: Automated cron job

### 2.6 Screen Sharing

**Location:** `lib/webrtc/screen-sharing.ts`

**Description:**
Real-time screen, window, or tab sharing with PQC encryption.

**Features:**
- Screen/window/tab selection
- Quality presets: 720p, 1080p, 4K
- Adaptive bitrate
- Frame rate control (15-60 fps)
- Audio sharing (optional)
- Cursor tracking
- Privacy indicators
- PQC-protected stream

**Technical Implementation:**
```typescript
// API used
- getDisplayMedia(): Browser screen capture
- RTCPeerConnection: WebRTC connection
- MediaStream: Video/audio stream

// Quality presets
const presets = {
  '720p': { width: 1280, height: 720, frameRate: 30 },
  '1080p': { width: 1920, height: 1080, frameRate: 30 },
  '4K': { width: 3840, height: 2160, frameRate: 60 }
};

// Flow
1. User clicks "Share Screen"
2. Browser shows picker (screen/window/tab)
3. User selects what to share
4. Stream captured and sent over WebRTC
5. Encryption via DTLS-SRTP (automatic)
6. Receiver displays stream in real-time
7. Privacy indicators shown on both sides
```

**Privacy Features:**
- Visual indicator when sharing
- Audio mute toggle
- Stop sharing button
- Browser-level permissions
- No recording (live stream only)

### 2.7 Folder Transfer

**Location:** `lib/transfer/folder-transfer.ts`

**Description:**
Transfer entire directory trees while preserving structure.

**Features:**
- ZIP compression
- Directory structure preservation
- Large folder support (gigabytes)
- PQC encryption of archive
- Progress tracking
- Resumable transfers
- Selective file inclusion

**Technical Details:**
```typescript
// Process
1. User selects folder
2. Files collected recursively
3. ZIP archive created in-memory
4. Archive encrypted with ML-KEM-768 + AES-256-GCM
5. Encrypted ZIP sent via WebRTC
6. Receiver decrypts and extracts
7. Original structure restored

// Libraries
- JSZip: ZIP compression
- WebRTC: Transfer
- PQC crypto: Encryption
```

**Folder Handling:**
```typescript
interface FolderTransfer {
  name: string;
  totalFiles: number;
  totalSize: number;
  structure: FileNode[];  // Tree structure
  compressed: boolean;
  compressionRatio: number;
}
```

### 2.8 Resumable Transfers

**Location:** `lib/transfer/resumable-transfer.ts`

**Description:**
Automatic recovery from interrupted transfers with chunk-level precision.

**Features:**
- IndexedDB state persistence
- Chunk-level resume (64KB chunks)
- Recovery from network failures
- Progress preservation
- Manual resume option
- Automatic resume on reconnect
- Cross-session support

**State Management:**
```typescript
interface TransferState {
  transferId: string;
  fileName: string;
  fileSize: number;
  chunks: ChunkState[];        // Per-chunk status
  completedChunks: number;
  totalChunks: number;
  sessionKey: Uint8Array;      // Encryption key
  lastUpdateTime: number;
  peerId: string;
}

interface ChunkState {
  index: number;
  status: 'pending' | 'transferring' | 'complete' | 'failed';
  hash: string;                // BLAKE3 hash
  retries: number;
}
```

**Resume Flow:**
```typescript
// Automatic resume
1. Transfer interrupted (network failure)
2. State saved to IndexedDB
3. User reconnects (manual or auto)
4. System detects incomplete transfer
5. Resume from last completed chunk
6. Only missing chunks sent
7. Integrity verified per chunk
```

---

## 3. POST-QUANTUM CRYPTOGRAPHY

### 3.1 ML-KEM-768 (Kyber)

**Location:** `lib/crypto/pqc-crypto.ts`

**Description:**
NIST FIPS 203 standardized post-quantum key encapsulation mechanism.

**Specifications:**
- Algorithm: ML-KEM-768 (Module-Lattice-Based)
- Security Level: NIST Level 3 (≈192-bit classical security)
- Public Key Size: 1184 bytes
- Secret Key Size: 2400 bytes
- Ciphertext Size: 1088 bytes
- Shared Secret: 32 bytes

**Why ML-KEM-768:**
- Quantum computer resistant
- NIST standardized (FIPS 203)
- Balanced security/performance
- Future-proof cryptography
- Recommended by NSA

**Implementation:**
```typescript
// Key generation
const { publicKey, secretKey } = await generateKyberKeypair();

// Encapsulation (sender)
const { ciphertext, sharedSecret } = await encapsulate(publicKey);

// Decapsulation (receiver)
const sharedSecret = await decapsulate(ciphertext, secretKey);

// Both parties now have same shared secret
```

### 3.2 Hybrid Encryption (ML-KEM + X25519)

**Location:** `lib/crypto/pqc-crypto.ts`

**Description:**
Combine post-quantum and classical cryptography for defense-in-depth.

**Architecture:**
```typescript
// Hybrid key exchange
1. ML-KEM-768 key exchange   → pqSharedSecret (32 bytes)
2. X25519 key exchange       → classicalSharedSecret (32 bytes)
3. Combine both secrets      → hybridSecret (64 bytes)
4. HKDF-SHA256 derivation    → finalKeys (encryption + auth)

// Security properties
- Quantum resistant (ML-KEM)
- Classical secure (X25519)
- Forward secrecy (both)
- Backward compatible
```

**Key Derivation:**
```typescript
function deriveHybridKeys(pqSecret: Uint8Array, classicalSecret: Uint8Array) {
  // Concatenate secrets
  const combined = concat(pqSecret, classicalSecret);

  // HKDF-SHA256 with context
  const keys = hkdf(combined, salt, info, 96); // 96 bytes

  return {
    encryptionKey: keys.slice(0, 32),    // AES-256
    authKey: keys.slice(32, 64),         // HMAC-SHA256
    sessionId: keys.slice(64, 96)        // Nonce/ID
  };
}
```

### 3.3 Triple Ratchet Protocol

**Location:** `lib/crypto/triple-ratchet.ts`

**Description:**
Enhanced Double Ratchet with post-quantum sparse ratchet layer.

**Architecture:**
```
┌─────────────────────────────────────┐
│      Triple Ratchet Protocol        │
├─────────────────────────────────────┤
│                                     │
│  1. Double Ratchet (X25519)         │
│     - Classical DH ratchet          │
│     - Forward secrecy               │
│     - Post-compromise security      │
│                                     │
│  2. Sparse PQ Ratchet (ML-KEM-768)  │
│     - Post-quantum security         │
│     - Periodic key rotation         │
│     - Reduced overhead              │
│                                     │
│  3. Hybrid Root Key                 │
│     - Combines both ratchets        │
│     - HKDF key derivation           │
│                                     │
└─────────────────────────────────────┘
```

**Security Properties:**
- Forward secrecy (from both ratchets)
- Post-compromise security
- Post-quantum resistance
- Out-of-order message handling
- Message key uniqueness

**Implementation:**
```typescript
class TripleRatchet {
  private doubleRatchet: DoubleRatchet;    // Classical
  private sparsePQRatchet: SparsePQRatchet; // Post-quantum
  private rootKey: Uint8Array;              // Hybrid root

  async sendMessage(plaintext: Uint8Array) {
    // Advance double ratchet
    const { messageKey: classicalKey, nextChainKey } =
      this.doubleRatchet.ratchetForward();

    // Periodically advance PQ ratchet (every N messages)
    if (this.shouldRotatePQ()) {
      const { messageKey: pqKey } =
        await this.sparsePQRatchet.ratchetForward();

      // Update root key with both
      this.rootKey = this.deriveRootKey(classicalKey, pqKey);
    }

    // Derive message key from hybrid root
    const messageKey = this.deriveMessageKey(this.rootKey);

    // Encrypt with AES-256-GCM
    return encrypt(plaintext, messageKey);
  }
}
```

### 3.4 Sparse PQ Ratchet

**Location:** `lib/crypto/sparse-pq-ratchet.ts`

**Description:**
Post-quantum ratchet that updates periodically (not every message) to reduce overhead.

**Design:**
```typescript
// Sparse update pattern
Message 1:  Double Ratchet only
Message 2:  Double Ratchet only
Message 3:  Double Ratchet only
Message 4:  Double Ratchet only
Message 5:  Double + PQ Ratchet ← Sparse update
Message 6:  Double Ratchet only
...
Message 10: Double + PQ Ratchet ← Sparse update
```

**Benefits:**
- Reduced computational overhead (ML-KEM is expensive)
- Reduced bandwidth (smaller ciphertexts)
- Maintains post-quantum security
- Balances security vs performance

**Configuration:**
```typescript
const PQ_RATCHET_INTERVAL = 5; // Update every 5 messages

class SparsePQRatchet {
  private messageCount = 0;

  shouldUpdate(): boolean {
    return this.messageCount % PQ_RATCHET_INTERVAL === 0;
  }
}
```

---

## 4. SECURITY IMPLEMENTATION

### 4.1 Symmetric Encryption (AES-256-GCM)

**Location:** Web Crypto API integration

**Specifications:**
- Algorithm: AES-256-GCM (AEAD)
- Key Size: 256 bits
- Nonce: 96 bits (random per message)
- Authentication Tag: 128 bits
- Block Size: 128 bits

**Usage:**
```typescript
// File encryption (progressive chunks)
async function encryptChunk(
  chunk: Uint8Array,
  key: Uint8Array,
  chunkIndex: number
) {
  const nonce = randomBytes(12); // 96-bit nonce

  // Associated data: chunk index + file hash
  const associatedData = new Uint8Array([
    ...uint32ToBytes(chunkIndex),
    ...fileHash
  ]);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
      additionalData: associatedData,
      tagLength: 128
    },
    key,
    chunk
  );

  return { ciphertext, nonce };
}
```

**Alternative: ChaCha20-Poly1305**

**Location:** `lib/crypto/chacha20-poly1305.ts`

**Why ChaCha20:**
- Software-optimized (faster on mobile)
- Timing-attack resistant
- Simpler implementation
- Used in TLS, WireGuard

### 4.2 Hashing (BLAKE3)

**Location:** `lib/crypto/pqc-crypto.ts` (via `@noble/hashes`)

**Specifications:**
- Algorithm: BLAKE3
- Output Size: 256 bits (configurable)
- Performance: 2-3x faster than SHA-256
- Security: 128-bit collision resistance

**Usage:**
```typescript
import { blake3 } from '@noble/hashes/blake3';

// File integrity
const fileHash = blake3(fileData);

// Key derivation
const derivedKey = blake3(inputKeyMaterial, {
  dkLen: 32,  // 32 bytes output
  key: salt   // Optional keying
});

// Chunk verification
const chunkHash = blake3(chunk);
```

**Why BLAKE3:**
- Faster than SHA-256
- More secure than MD5/SHA-1
- Parallelizable
- Used in Zcash, Tor

### 4.3 Password Hashing (Argon2id)

**Location:** `lib/crypto/argon2-browser.ts`

**Specifications:**
- Algorithm: Argon2id (hybrid mode)
- Iterations: 600,000 (time cost: 2-5 seconds)
- Memory: 64 MB
- Parallelism: 4 threads
- Salt: 16 bytes (random)
- Output: 32 bytes (256-bit key)

**Configuration:**
```typescript
const argon2Config = {
  type: argon2id,
  memoryCost: 65536,     // 64 MB (64 * 1024 KB)
  timeCost: 600000,      // 600k iterations
  parallelism: 4,        // 4 threads
  hashLength: 32,        // 32 bytes output
  saltLength: 16         // 16 bytes salt
};
```

**Why Argon2id:**
- Winner of Password Hashing Competition
- Resistant to GPU/ASIC attacks
- Memory-hard function
- Recommended by OWASP
- Used by 1Password, Bitwarden

### 4.4 Digital Signatures (Ed25519)

**Location:** `lib/crypto/digital-signatures.ts`

**Specifications:**
- Algorithm: Ed25519 (EdDSA)
- Key Size: 32 bytes (256-bit)
- Signature Size: 64 bytes
- Security: 128-bit security level

**Usage:**
```typescript
// Generate keypair
const { publicKey, privateKey } = await generateSigningKeypair();

// Sign message
const signature = await sign(message, privateKey);

// Verify signature
const isValid = await verify(message, signature, publicKey);
```

**Post-Quantum Alternative (Planned):**
- Algorithm: ML-DSA-65 (Dilithium)
- Status: Implementation ready, not enabled
- Location: `lib/crypto/pq-signatures.ts`

### 4.5 Key Management

**Location:** `lib/crypto/key-management.ts`

**Features:**
- Secure key generation
- Key derivation (HKDF)
- Key rotation
- Secure storage (IndexedDB encrypted)
- Memory protection
- Key cleanup on session end

**Key Lifecycle:**
```typescript
class KeyManager {
  // Generate new keypair
  async generateKeypair(type: 'pqc' | 'classical' | 'signing'): Promise<Keypair>

  // Derive session keys from shared secret
  deriveSessionKeys(sharedSecret: Uint8Array): SessionKeys

  // Rotate keys periodically
  async rotateKeys(): Promise<void>

  // Securely delete key material
  secureDelete(key: Uint8Array): void

  // Store keys encrypted at rest
  async storeKey(key: Uint8Array, label: string): Promise<void>
}
```

### 4.6 CSRF Protection

**Location:** `lib/security/csrf.ts`

**Implementation:**
- Double-submit cookie pattern
- Random token generation (32 bytes)
- Token rotation on each request
- State-based validation
- Session binding

**Flow:**
```typescript
// 1. Request CSRF token
GET /api/csrf-token
Response: { token: "abc123..." }
Set-Cookie: csrf-token=abc123; Secure; HttpOnly; SameSite=Strict

// 2. Submit form with token
POST /api/email/send
Headers: { 'X-CSRF-Token': 'abc123...' }

// 3. Server validates
if (headerToken !== cookieToken) {
  throw new Error('CSRF token mismatch');
}
```

### 4.7 Rate Limiting

**Location:** `lib/middleware/rate-limit.ts`

**Rules:**
```typescript
const rateLimits = {
  '/api/email/*': {
    requests: 5,
    window: '1 minute',
    message: 'Too many email requests'
  },
  '/api/upload/*': {
    requests: 10,
    window: '1 minute',
    message: 'Upload rate limit exceeded'
  },
  '/api/auth/*': {
    requests: 3,
    window: '1 minute',
    message: 'Too many auth attempts'
  },
  default: {
    requests: 100,
    window: '1 minute'
  }
};
```

**Storage:**
- In-memory (Redis for production)
- IP-based tracking
- Sliding window algorithm

### 4.8 Memory Protection

**Location:** `lib/security/memory-wiper.ts`

**Features:**
- Sensitive value overwriting
- Multiple wipe passes
- Heap canaries
- Timing-safe operations

**Wipe Methods:**
```typescript
// DoD 5220.22-M (3-pass wipe)
function dodWipe(buffer: Uint8Array): void {
  // Pass 1: Random data
  crypto.getRandomValues(buffer);

  // Pass 2: 0xFF
  buffer.fill(0xFF);

  // Pass 3: 0x00
  buffer.fill(0x00);
}

// Gutmann method (35-pass, optional)
function gutmannWipe(buffer: Uint8Array): void {
  // 35 passes with specific patterns
  // Extreme security, slow
}
```

**Usage:**
```typescript
// Wipe sensitive key material
const secretKey = new Uint8Array(32);
// ... use key ...
dodWipe(secretKey); // Secure deletion
```

---

## 5. PRIVACY FEATURES

### 5.1 No Server Storage

**Architecture:**
Pure peer-to-peer model with no file storage on servers.

**Data Flow:**
```
Sender → WebRTC → Receiver
   ↑                 ↓
   └─ Signaling ─────┘
      (only metadata)
```

**What Signaling Server Sees:**
- Device IDs (UUIDs, not linked to identity)
- Connection requests
- ICE candidates (network info)
- Room codes
- Session metadata

**What Signaling Server NEVER Sees:**
- File contents
- File names (encrypted)
- Chat messages (encrypted)
- Encryption keys
- User identity

### 5.2 Onion Routing (3-Hop Relay)

**Location:** `lib/transport/onion-routing.ts`

**Description:**
Route connections through 3 relay nodes for anonymity.

**Architecture:**
```
Sender → Relay1 → Relay2 → Relay3 → Receiver

Each hop encrypted separately:
- Sender encrypts 3 layers (like onion)
- Relay1 decrypts outer layer, forwards to Relay2
- Relay2 decrypts middle layer, forwards to Relay3
- Relay3 decrypts inner layer, delivers to Receiver

Privacy guarantees:
- Relay1 knows sender, not receiver
- Relay2 knows neither sender nor receiver
- Relay3 knows receiver, not sender
```

**Circuit Management:**
```typescript
interface Circuit {
  id: string;
  path: RelayNode[];           // [relay1, relay2, relay3]
  layerKeys: Uint8Array[];     // Different key per layer
  createdAt: number;
  expiresAt: number;
}

interface RelayNode {
  id: string;
  address: string;
  publicKey: Uint8Array;
  trustScore: number;          // 0-100
  latency: number;             // milliseconds
  bandwidth: number;           // MB/s
}
```

**Relay Selection:**
```typescript
// Geographic diversity
function selectRelays(): RelayNode[] {
  const relays = getAvailableRelays();

  // Different countries/regions
  return [
    selectRelay(relays, { region: 'europe' }),
    selectRelay(relays, { region: 'asia' }),
    selectRelay(relays, { region: 'americas' })
  ];
}
```

### 5.3 Tor Integration

**Location:** `lib/privacy/tor-support.ts`

**Features:**
- Auto-detect Tor browser
- SOCKS5 proxy support (localhost:9050)
- .onion domain support
- WebRTC over Tor
- Stream isolation
- Circuit management

**Detection:**
```typescript
async function detectTor(): Promise<boolean> {
  // Method 1: Check Tor Browser user agent
  if (navigator.userAgent.includes('Tor Browser')) {
    return true;
  }

  // Method 2: DNS check
  try {
    const response = await fetch('https://check.torproject.org/api/ip');
    const data = await response.json();
    return data.IsTor === true;
  } catch {
    return false;
  }

  // Method 3: Check Tor directory guards
  // (Implementation specific)
}
```

**Configuration:**
```typescript
interface TorConfig {
  enabled: boolean;
  socksProxy: string;        // 'localhost:9050'
  controlPort: number;       // 9051
  circuitTimeout: number;    // 60000 ms
  newCircuitPeriod: number;  // 600000 ms (10 min)
}
```

### 5.4 VPN & IP Leak Detection

**Location:** `lib/privacy/vpn-leak-detection.ts`

**Features:**
- WebRTC IP leak detection
- DNS leak detection
- IPv6 leak detection
- Browser fingerprint detection

**WebRTC Leak Detection:**
```typescript
async function detectWebRTCLeak(): Promise<LeakResult> {
  // Create RTCPeerConnection
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  // Collect local IP candidates
  const localIPs: string[] = [];

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const ip = extractIP(event.candidate.candidate);
      if (ip) localIPs.push(ip);
    }
  };

  // Create dummy offer
  pc.createDataChannel('leak-test');
  await pc.createOffer();

  // Wait for candidates
  await delay(2000);

  // Compare with reported IP
  const reportedIP = await fetch('https://api.ipify.org').then(r => r.text());

  const leaked = localIPs.some(ip =>
    !ip.startsWith('192.168.') &&
    !ip.startsWith('10.') &&
    ip !== reportedIP
  );

  return { leaked, localIPs, reportedIP };
}
```

**DNS Leak Detection:**
```typescript
async function detectDNSLeak(): Promise<boolean> {
  // Query DNS leak test services
  const response = await fetch('https://www.dnsleaktest.com/api/v1/test');
  const data = await response.json();

  // Check if DNS servers match VPN provider
  const vpnDNS = getVPNDNSServers();
  const leaking = data.dns.some(dns => !vpnDNS.includes(dns.ip));

  return leaking;
}
```

### 5.5 Secure Deletion

**Location:** `lib/privacy/secure-deletion.ts`

**File Deletion:**
```typescript
// DoD 5220.22-M standard
async function secureDeleteFile(file: File): Promise<void> {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);

  // Pass 1: Random data
  crypto.getRandomValues(data);
  await writeFile(file.name, data);

  // Pass 2: 0xFF
  data.fill(0xFF);
  await writeFile(file.name, data);

  // Pass 3: 0x00
  data.fill(0x00);
  await writeFile(file.name, data);

  // Final delete
  await deleteFile(file.name);
}
```

**IndexedDB Wiping:**
```typescript
async function wipeDatabase(dbName: string): Promise<void> {
  // Open database
  const db = await openDB(dbName);

  // Clear all object stores
  const stores = db.objectStoreNames;
  for (const storeName of stores) {
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).clear();
  }

  // Close and delete
  db.close();
  await deleteDB(dbName);

  // Verify deletion
  const dbs = await indexedDB.databases();
  if (dbs.find(d => d.name === dbName)) {
    throw new Error('Database not fully deleted');
  }
}
```

### 5.6 Secure Logging

**Location:** `lib/utils/secure-logger.ts`

**PII Masking:**
```typescript
function maskPII(message: string): string {
  // Email addresses
  message = message.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL]'
  );

  // IP addresses
  message = message.replace(
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    '[IP]'
  );

  // Device IDs (UUIDs)
  message = message.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '[DEVICE_ID]'
  );

  // Credit cards
  message = message.replace(
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    '[CARD]'
  );

  return message;
}
```

**Structured Logging:**
```typescript
class SecureLogger {
  log(level: LogLevel, message: string, context?: object) {
    // Mask PII in message
    const maskedMessage = maskPII(message);

    // Mask PII in context
    const maskedContext = this.maskContext(context);

    // Structured log entry
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message: maskedMessage,
      context: maskedContext,
      sessionId: this.getSessionId()
    };

    // Send to log service (Sentry, etc.)
    this.send(entry);
  }
}
```

---

## 6. COMMUNICATION FEATURES

### 6.1 Encrypted Chat

**Location:** `lib/chat/chat-manager.ts`

**Features:**
- End-to-end encryption (ML-KEM + X25519)
- Message persistence (IndexedDB)
- Typing indicators
- Read receipts
- Message status (sending/sent/delivered/read)
- File attachments (5MB max)
- Message replies
- Message editing
- Emoji support
- Search capability

**Message Encryption:**
```typescript
// Message structure
interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;           // Encrypted
  type: 'text' | 'file' | 'emoji' | 'system';
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string;          // Message ID
  edited?: boolean;
  attachments?: Attachment[];
}

// Encryption process
async function encryptMessage(
  message: string,
  sessionKey: Uint8Array
): Promise<EncryptedMessage> {
  // Convert to bytes
  const plaintext = new TextEncoder().encode(message);

  // Encrypt with AES-256-GCM
  const { ciphertext, nonce } = await encrypt(plaintext, sessionKey);

  // HMAC for authenticity
  const hmac = await sign(ciphertext, authKey);

  return {
    ciphertext: base64(ciphertext),
    nonce: base64(nonce),
    hmac: base64(hmac)
  };
}
```

**Chat Storage:**
```typescript
// IndexedDB schema
const chatStore = {
  name: 'chats',
  keyPath: 'id',
  indexes: [
    { name: 'timestamp', keyPath: 'timestamp' },
    { name: 'peerId', keyPath: 'peerId' },
    { name: 'status', keyPath: 'status' }
  ]
};

// Store encrypted messages
await db.chats.add({
  id: messageId,
  peerId: recipientId,
  encryptedContent: ciphertext,
  timestamp: Date.now(),
  status: 'sent'
});
```

### 6.2 Voice Commands

**Location:** `lib/hooks/use-voice-commands.ts`

**Supported Commands:**
1. "Start Transfer" - Initiate file transfer
2. "Cancel" - Cancel ongoing transfer
3. "Pause" - Pause transfer
4. "Resume" - Resume paused transfer
5. "Open Settings" - Open settings panel
6. "Help" - Show help dialog

**Implementation:**
```typescript
// Web Speech API
const recognition = new (window.SpeechRecognition ||
                        window.webkitSpeechRecognition)();

recognition.continuous = true;
recognition.interimResults = false;
recognition.lang = 'en-US';

recognition.onresult = (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript;
  const command = normalizeCommand(transcript);

  // Match against known commands
  switch(command) {
    case 'start transfer':
      executeStartTransfer();
      break;
    case 'cancel':
      executeCancelTransfer();
      break;
    // ... other commands
  }
};
```

**Command Customization:**
```typescript
interface VoiceCommandConfig {
  enabled: boolean;
  language: string;
  customCommands: CustomCommand[];
  sensitivity: number;       // 0-100
  feedback: 'audio' | 'visual' | 'both';
}
```

---

## 7. USER INTERFACE & EXPERIENCE

### 7.1 Theme System

**Location:** `components/theme-provider.tsx`, `app/globals.css`

**Available Themes:**

1. **Light Theme** (euveka.com inspired)
   - Clean minimalist design
   - High contrast
   - Professional appearance

2. **Dark Theme**
   - Sophisticated black (#0a0a0a)
   - Reduced eye strain
   - OLED-friendly

3. **Dark Gray Theme**
   - Warm gray tones (#18181b)
   - Balanced contrast
   - Modern aesthetic

4. **Midnight Theme**
   - Deep blue-black (#0f172a)
   - Elegant appearance
   - Unique character

**Theme Implementation:**
```css
/* Light theme */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 47.4% 11.2%;
  --primary: 262.1 83.3% 57.8%;
  --primary-foreground: 210 40% 98%;
  /* ... more variables */
}

/* Dark theme */
.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 263.4 70% 50.4%;
  --primary-foreground: 0 0% 98%;
  /* ... more variables */
}
```

**Theme Switching:**
```typescript
const { theme, setTheme } = useTheme();

// Programmatic switch
setTheme('dark');

// System preference
setTheme('system');

// Persistence
localStorage.setItem('theme', theme);
```

### 7.2 Internationalization (i18n)

**Location:** `lib/i18n/`

**Supported Languages (22):**
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese - Brazil (pt-BR)
- Portuguese - Portugal (pt-PT)
- Russian (ru)
- Polish (pl)
- Dutch (nl)
- Swedish (sv)
- Danish (da)
- Norwegian (no)
- Japanese (ja)
- Chinese Simplified (zh-CN)
- Chinese Traditional (zh-TW)
- Korean (ko)
- Arabic (ar) - RTL
- Hebrew (he) - RTL
- Urdu (ur) - RTL

**Translation Structure:**
```json
// lib/i18n/translations/en.json
{
  "common": {
    "send": "Send",
    "cancel": "Cancel",
    "download": "Download"
  },
  "transfer": {
    "selectFile": "Select File",
    "uploading": "Uploading...",
    "complete": "Transfer Complete"
  },
  "errors": {
    "networkError": "Network connection failed",
    "fileTooBig": "File exceeds size limit"
  }
}
```

**Usage:**
```typescript
import { useTranslation } from '@/lib/i18n/language-context';

function Component() {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div>
      <button>{t('common.send')}</button>
      <p>{t('transfer.uploading')}</p>
    </div>
  );
}
```

**RTL Support:**
```css
/* lib/i18n/rtl-support.css */
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

[dir="rtl"] .flex {
  flex-direction: row-reverse;
}

[dir="rtl"] .ml-4 {
  margin-left: 0;
  margin-right: 1rem;
}
```

### 7.3 Responsive Design

**Breakpoints:**
```typescript
const breakpoints = {
  sm: '640px',    // Mobile
  md: '768px',    // Tablet
  lg: '1024px',   // Desktop
  xl: '1280px',   // Large desktop
  '2xl': '1536px' // Extra large
};
```

**Mobile-First Approach:**
```tsx
// Base: Mobile
<div className="p-4 text-sm">

// Tablet and up
<div className="md:p-6 md:text-base">

// Desktop and up
<div className="lg:p-8 lg:text-lg">
```

**Touch Optimization:**
```typescript
// Minimum touch target: 44x44px (iOS HIG)
<button className="min-h-[44px] min-w-[44px]">

// Swipe gestures
const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGestures({
  onSwipeLeft: handleNext,
  onSwipeRight: handlePrevious
});
```

### 7.4 Accessibility (WCAG 2.1 AA)

**Location:** `lib/utils/accessibility.ts`

**Features Implemented:**
- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support
- High contrast mode
- Reduced motion support
- Color blind friendly

**Keyboard Navigation:**
```typescript
// Tab order management
<div role="dialog" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Dialog Title</h2>
  <button tabIndex={0}>First focusable</button>
  <input tabIndex={0} />
  <button tabIndex={0} onClick={handleClose}>Close</button>
</div>

// Keyboard shortcuts
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
    if (e.key === 'Enter') handleSubmit();
  };

  document.addEventListener('keydown', handleKeyPress);
  return () => document.removeEventListener('keydown', handleKeyPress);
}, []);
```

**Focus Management:**
```typescript
import { useFocusTrap } from '@/lib/hooks/use-focus-trap';

function Modal() {
  const modalRef = useFocusTrap<HTMLDivElement>();

  return (
    <div ref={modalRef} role="dialog">
      {/* Focus trapped within modal */}
    </div>
  );
}
```

**Screen Reader Announcements:**
```typescript
import { useAnnounce } from '@/lib/hooks/use-announce';

function Component() {
  const announce = useAnnounce();

  const handleSuccess = () => {
    announce('File uploaded successfully', 'polite');
  };

  const handleError = () => {
    announce('Upload failed. Please try again.', 'assertive');
  };
}
```

**Color Contrast:**
```typescript
// All text meets WCAG AA standards
// Normal text: 4.5:1 minimum
// Large text: 3:1 minimum

// Example
const textColor = '#1f2937';      // Gray-800
const backgroundColor = '#ffffff'; // White
// Contrast ratio: 13.42:1 ✓ (Exceeds AAA)
```

**Reduced Motion:**
```typescript
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={prefersReducedMotion ? {} : { x: 100 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
    />
  );
}
```

### 7.5 Animations

**Location:** `lib/animations/`

**Framework:** Framer Motion

**Animation Types:**
1. Page transitions
2. Component entrance
3. Progress animations
4. Skeleton loading
5. Micro-interactions
6. Gesture animations

**Examples:**
```typescript
// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
/>

// Slide in
<motion.div
  initial={{ x: -100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ type: 'spring', stiffness: 100 }}
/>

// Stagger children
<motion.ul
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {items.map(item => (
    <motion.li key={item.id} variants={itemVariants}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

**Respecting User Preferences:**
```typescript
const transition = {
  duration: prefersReducedMotion ? 0 : 0.3,
  ease: 'easeInOut'
};
```

### 7.6 Progressive Web App (PWA)

**Location:** `lib/pwa/`

**Features:**
- Installable on desktop/mobile
- Offline functionality
- Service worker caching
- Background sync
- Push notifications
- App shortcuts

**Manifest:**
```json
{
  "name": "Tallow - Secure File Transfer",
  "short_name": "Tallow",
  "description": "Quantum-resistant P2P file transfer",
  "start_url": "/app",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#9333ea",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Worker:**
```typescript
// Cache strategy: Network-first, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone and cache response
        const responseClone = response.clone();
        caches.open('v1').then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Network failed, use cache
        return caches.match(event.request);
      })
  );
});
```

**Install Prompt:**
```typescript
import { usePWA } from '@/lib/hooks/use-pwa';

function InstallButton() {
  const { isInstallable, install } = usePWA();

  if (!isInstallable) return null;

  return (
    <button onClick={install}>
      Install Tallow
    </button>
  );
}
```

---

*This documentation continues in Part 2 due to size constraints...*
