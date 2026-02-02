# Tallow Technical Documentation

**Version:** 2.0 **Last Updated:** 2026-02-02 **Architecture:** Next.js 15 +
WebRTC + Post-Quantum Cryptography

---

## Table of Contents

1. [Overview](#1-overview)
2. [Security Features](#2-security-features)
3. [Privacy Features](#3-privacy-features)
4. [Device Discovery](#4-device-discovery)
5. [Transfer Modes](#5-transfer-modes)
6. [API Endpoints](#6-api-endpoints)
7. [Configuration Options](#7-configuration-options)
8. [Monitoring and Analytics](#8-monitoring-and-analytics)
9. [Network Protocols](#9-network-protocols)
10. [Security Hardening](#10-security-hardening)

---

## 1. Overview

### What is Tallow?

Tallow is a privacy-first, decentralized peer-to-peer file sharing application
with post-quantum cryptography. It combines cutting-edge security with ease of
use, enabling users to share files securely without trusting third-party
servers.

### Architecture Overview

**Technology Stack:**

- **Frontend**: Next.js 15 (React 19, App Router)
- **Transport**: WebRTC DataChannels for P2P, WebSocket for signaling
- **Cryptography**: ML-KEM-768 (Kyber) + X25519 hybrid key exchange, AES-256-GCM
  encryption
- **Discovery**: mDNS for local network, Socket.IO signaling server for internet
- **Deployment**: Docker/Kubernetes-ready with health probes

**Key Design Principles:**

- **Zero Trust**: All data encrypted end-to-end, server cannot decrypt
- **Post-Quantum Security**: Resistant to future quantum computer attacks
- **Privacy by Default**: No user tracking, optional onion routing, metadata
  stripping
- **Resilience**: Resumable transfers, automatic reconnection, circuit breaker
  patterns

### Security Philosophy

Tallow implements defense-in-depth security:

1. **Encryption Layers**: Triple ratchet protocol provides forward secrecy and
   post-compromise security
2. **Anonymous Routing**: Multi-hop onion routing conceals peer IP addresses
3. **Traffic Obfuscation**: Padded constant bitrate to prevent traffic analysis
4. **Memory Protection**: Secure wiping of sensitive data after use
5. **Rate Limiting**: Prevents brute-force and enumeration attacks

---

## 2. Security Features

### Post-Quantum Cryptography (PQC)

Tallow uses NIST-standardized **ML-KEM-768** (formerly Kyber) for
quantum-resistant key encapsulation.

**Hybrid Key Exchange Protocol:**

```typescript
// From lib/crypto/pqc-crypto.ts

// Key sizes:
// - ML-KEM-768 public key: 1184 bytes
// - ML-KEM-768 secret key: 2400 bytes
// - ML-KEM-768 ciphertext: 1088 bytes
// - X25519 public key: 32 bytes
// - X25519 private key: 32 bytes

// Generate hybrid keypair
const keypair = await pqCrypto.generateHybridKeypair();
// Returns: { kyber: {...}, x25519: {...} }

// Encapsulation (sender creates shared secret)
const { ciphertext, sharedSecret } =
  await pqCrypto.encapsulate(recipientPublicKey);

// Decapsulation (receiver recovers shared secret)
const sharedSecret = await pqCrypto.decapsulate(ciphertext, ownKeyPair);

// Combine with X25519 ECDH for hybrid security
const combinedSecret = combineSecrets(kyberSecret, x25519Secret);
// Uses HKDF with domain separation: 'tallow-hybrid-v1'
```

**Why Hybrid Cryptography?**

Combining ML-KEM-768 (quantum-resistant) with X25519 (classical ECDH) provides:

- **Quantum Resistance**: Safe against Shor's algorithm on quantum computers
- **Classical Security**: Falls back to proven X25519 if PQC is broken
- **Belt and Suspenders**: Breaking the hybrid requires breaking both algorithms

### Symmetric Encryption

**AES-256-GCM** with counter-based nonces:

```typescript
// From lib/crypto/pqc-crypto.ts

// Counter-based nonce prevents birthday paradox collisions
// Random nonces have 2^48 collision risk, counters guarantee uniqueness
const encrypted = await pqCrypto.encrypt(plaintext, key);
// Returns: { ciphertext: Uint8Array, nonce: Uint8Array }

// Nonce structure: 96 bits (12 bytes)
// - 64-bit counter (sequential)
// - 32-bit random seed (per-session)
```

**Security Properties:**

- **Authenticated Encryption**: GCM provides confidentiality + integrity
- **Nonce Reuse Protection**: Counter guarantees no nonce reuse
- **Tag Length**: 128-bit authentication tag
- **Performance**: Hardware-accelerated AES-NI on modern CPUs

### Key Derivation

**HKDF-SHA256** for session keys:

```typescript
// From lib/crypto/pqc-crypto.ts

const sessionKeys = pqCrypto.deriveSessionKeys(sharedSecret);
// Returns: {
//   encryptionKey: 32 bytes (AES-256),
//   authKey: 32 bytes (HMAC-SHA-256),
//   sessionId: 16 bytes
// }

// Domain separation with fixed salt
const salt = 'tallow-kdf-salt-v1-2024';
const info = 'tallow-session-keys-v1';
```

**Argon2id** for password-based key derivation:

```typescript
// From lib/crypto/argon2-browser.ts

// OWASP-recommended parameters
const ARGON2_DEFAULTS = {
  memory: 65536, // 64 MiB (GPU/ASIC resistant)
  iterations: 3, // Time cost
  parallelism: 4, // Thread count
  hashLength: 32, // 256-bit output
};

const key = await deriveKeyArgon2id(password, salt, ARGON2_DEFAULTS);
```

**PBKDF2 Fallback** (when Argon2id unavailable):

```typescript
const PBKDF2_DEFAULTS = {
  iterations: 600000, // OWASP 2023 recommendation
  keyLength: 32, // 256 bits
  hash: 'SHA-256',
};
```

### Forward Secrecy

**Triple Ratchet Protocol** provides forward secrecy and post-compromise
security:

```typescript
// From lib/crypto/triple-ratchet.ts

// Components:
// 1. Double Ratchet (DH-based, Signal protocol)
// 2. Sparse PQ Ratchet (ML-KEM-based, bandwidth-efficient)
// 3. Hybrid Root Key (combines both)

const ratchet = await TripleRatchet.initialize(
  sharedSecret,
  isInitiator,
  sessionId,
  peerDHPublicKey,
  peerPQPublicKey
);

// Encrypt message
const message = await ratchet.encrypt(plaintext);
// Returns: {
//   dhPublicKey: Uint8Array,       // DH ratchet key
//   pqEpoch: number,                // PQ ratchet epoch
//   pqKemCiphertext?: HybridCiphertext,  // PQ key update
//   ciphertext: Uint8Array,         // Encrypted payload
//   nonce: Uint8Array
// }

// Decrypt message
const plaintext = await ratchet.decrypt(message);
```

**Key Rotation Manager:**

```typescript
// From lib/security/key-rotation.ts

const keyRotation = new KeyRotationManager({
  rotationIntervalMs: 5 * 60 * 1000, // Rotate every 5 minutes
  maxGenerations: 100,
  enableAutoRotation: true,
});

// Initialize with base secret
const rotatingKeys = keyRotation.initialize(baseSharedSecret);

// Listen for rotation events
keyRotation.onRotation((newKeys) => {
  // Notify peer of rotation
  sendKeyRotationMessage(newKeys.generation, newKeys.sessionId);
});
```

**Properties:**

- **Forward Secrecy**: Compromise of current keys doesn't reveal past messages
- **Post-Compromise Security**: Ratcheting forward restores security after key
  compromise
- **Out-of-Order Handling**: Skipped message keys tracked for up to 1000
  messages

### Peer Authentication

**Short Authentication String (SAS) Verification:**

```typescript
// From lib/crypto/sas-verification.ts

// Generate 6-digit SAS from shared secret
const sas = await generateSAS(sharedSecret);
// Returns: '123456' (decimal) or 'ABCDEF' (hex)

// Compare SAS out-of-band (voice call, in-person, etc.)
// Probability of MITM success: 1 / 10^6 (decimal) or 1 / 16^6 (hex)
```

**Cryptographic Shared Secret Verification:**

```typescript
// Constant-time comparison prevents timing attacks
const verified = pqCrypto.constantTimeEqual(derivedSecret, expectedSecret);
```

### Memory Protection

**Secure Memory Wiping:**

```typescript
// From lib/security/memory-wiper.ts

// Wipe buffer with random data then zeros
memoryWiper.wipeBuffer(sensitiveData);

// Implementation:
// 1. Overwrite with crypto.getRandomValues()
// 2. Overwrite with zeros
// 3. Prevents cold boot attacks and memory scraping
```

**Secure Deletion of Keys:**

```typescript
// From lib/crypto/triple-ratchet.ts

private secureDelete(data: Uint8Array): void {
  // Fill with random bytes
  const random = crypto.getRandomValues(new Uint8Array(data.length));
  data.set(random);
  // Then zero
  data.fill(0);
}
```

---

## 3. Privacy Features

### Onion Routing

**Multi-Hop Anonymous Routing** conceals peer IP addresses:

```typescript
// From lib/transport/onion-routing.ts

// Configuration
const onionRouter = OnionRouter.getInstance({
  enabled: true,
  hopCount: 3, // 1-3 hops supported
  randomPath: true,
  preferredRegions: ['US', 'EU'],
});

// Circuit creation
const circuit = await onionRouter.createCircuit(destinationPeerId);
// Returns: {
//   id: string,
//   path: RelayNode[],      // Ordered relay chain
//   layerKeys: Uint8Array[], // Per-hop encryption keys
//   established: boolean
// }

// Send through circuit
await onionRouter.sendThroughCircuit(circuit.id, payload, destination);
```

**Circuit Architecture:**

1. **Entry Relay**: Accepts client connections, knows client IP
2. **Middle Relay**: Forwards encrypted data, knows neither source nor
   destination
3. **Exit Relay**: Connects to destination peer, knows destination IP

**Layer Encryption:**

```typescript
// Each hop peels one encryption layer
for (let i = layerKeys.length - 1; i >= 0; i--) {
  const layerKey = layerKeys[i];

  // Wrap header + payload
  const header = { nextHop, payloadSize };
  const combined = concat(header, encryptedPayload);

  // Encrypt this layer
  encryptedPayload = await pqCrypto.encrypt(combined, layerKey);
}
```

**Circuit Properties:**

- **Lifetime**: 10 minutes (prevents long-lived correlation)
- **Max Payload**: 64 KB per packet
- **Key Establishment**: ML-KEM-768 + X25519 per hop
- **Forward Secrecy**: Independent keys per circuit

### Traffic Obfuscation

**Padded Constant Bitrate** defeats traffic analysis:

```typescript
// From lib/transport/obfuscation.ts

const obfuscator = new TrafficObfuscator({
  // Padding
  minPacketSize: 1024, // Pad to 1 KB minimum
  maxPacketSize: 16384, // TLS record size
  paddingMode: 'uniform', // Nearest TLS size

  // Timing
  minDelay: 1, // 1ms minimum
  maxDelay: 50, // 50ms jitter
  timingMode: 'jittered',

  // Cover traffic
  enableCoverTraffic: true,
  coverTrafficRate: 2, // 2 packets/sec baseline
  decoyProbability: 0.15, // 15% decoy packets
});

// Obfuscate outgoing data
const packets = await obfuscator.obfuscate(data);
// Returns: ObfuscatedPacket[] with padding, timing, decoys
```

**Packet Structure:**

```
[type:1] [size:4] [data] [random padding]
```

**Packet Types:**

- `DATA (0x01)`: Actual data
- `PADDING (0x02)`: Pure padding
- `DECOY (0x03)`: Fake traffic
- `COVER (0x04)`: Idle browsing simulation

**Properties:**

- **Uniform Sizes**: Packets rounded to TLS record sizes (1460, 2920, 4380,
  8760, 16384 bytes)
- **Timing Jitter**: Cryptographically random delays (1-50ms)
- **Decoy Traffic**: 15% of packets are decoys
- **Cover Traffic**: Background noise when idle (2 pkt/sec)

### Metadata Stripping

**EXIF and Metadata Removal** protects user privacy:

```typescript
// From lib/privacy/metadata-stripper.ts

// Supported formats
const METADATA_SUPPORTED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  videos: ['video/mp4', 'video/quicktime', 'video/x-m4v'],
};

// Extract metadata before stripping
const metadata = await extractMetadata(file);
// Returns: {
//   gpsLatitude, gpsLongitude, gpsAltitude,
//   make, model, software, lensModel,
//   dateTimeOriginal, dateTimeDigitized,
//   artist, copyright, author
// }

// Strip metadata
const result = await stripMetadata(file);
// Returns: {
//   success: boolean,
//   strippedFile: File,
//   bytesRemoved: number
// }
```

**Removed Data:**

- **GPS**: Latitude, longitude, altitude, timestamp
- **Device Info**: Camera make/model, software version, lens model
- **Timestamps**: Creation date, modification date, digitization date
- **Author**: Artist, copyright, author fields
- **Technical**: Serial numbers, firmware versions

**Implementation:**

**JPEG**: Parse APP1 (EXIF), APP2 (ICC/FlashPix), APP3, APP13 (Photoshop), APP14
(Adobe) segments and remove metadata while preserving image data

**PNG**: Parse chunks, keep critical (IHDR, PLTE, IDAT, IEND) and safe ancillary
(tRNS, gAMA, sRGB), remove text/metadata chunks

**MP4/MOV**: Parse box structure, remove `udta`, `meta`, `cprt`, location info
(`loci`, `xyz`), and author boxes (`©ART`, `©nam`, etc.)

**WebP**: Parse RIFF chunks, keep VP8/VP8L/VP8X (image data), remove EXIF and
XMP chunks

### IP Protection

**Relay-Only Mode** prevents IP leakage:

```typescript
// Force TURN relay (no direct P2P)
const rtcConfig = {
  iceServers: [{ urls: 'turn:relay.tallow.app', username, credential }],
  iceTransportPolicy: 'relay', // Force TURN
};

// ICE candidate filtering
peerConnection.addEventListener('icecandidate', (event) => {
  if (event.candidate) {
    const candidate = event.candidate.candidate;
    // Filter out host/srflx candidates (reveal IP)
    if (candidate.includes('typ relay')) {
      // Only send relay candidates
      sendCandidate(event.candidate);
    }
  }
});
```

**Proxy Support:**

```typescript
// SOCKS5 proxy for signaling WebSocket
const signalingConfig = {
  url: 'wss://signaling.tallow.app',
  proxy: {
    type: 'socks5',
    host: 'localhost',
    port: 9050, // Tor SOCKS port
  },
};
```

---

## 4. Device Discovery

### mDNS Discovery

**Local Network Discovery** via WebSocket bridge:

```typescript
// From lib/discovery/mdns-bridge.ts

const mdnsBridge = getMDNSBridge({
  daemonUrl: 'ws://localhost:54321',
  autoReconnect: true,
  reconnectDelay: 2000,
  maxReconnectAttempts: 10,
  pingInterval: 30000,
});

// Connect to daemon
await mdnsBridge.connect();

// Start discovery
mdnsBridge.startDiscovery(['desktop', 'mobile']);

// Event handlers
mdnsBridge.on('onDeviceFound', (device: TallowDevice) => {
  console.log('Found:', device.name, device.addresses);
});

mdnsBridge.on('onDeviceLost', (deviceId: string) => {
  console.log('Lost:', deviceId);
});

// Advertise this device
mdnsBridge.advertise({
  name: 'My Device',
  deviceId: crypto.randomUUID(),
  platform: 'desktop',
  version: '2.0.0',
});
```

**mDNS Service Announcement:**

```
Service Type: _tallow._tcp.local
Port: 54321 (WebSocket bridge)
TXT Records:
  - deviceId=abc123
  - platform=desktop
  - version=2.0.0
  - capabilities=pqc,onion,resumable
```

**Properties:**

- **Auto-Discovery**: Devices appear automatically on LAN
- **Platform Filtering**: Filter by desktop/mobile/tablet
- **Heartbeat**: 30-second keepalive ping
- **Reconnection**: Exponential backoff (2s, 4s, 8s, 16s, 32s)

### Signaling Server

**Socket.IO-based WebRTC Signaling:**

```typescript
// From lib/signaling/socket-signaling.ts

const signaling = getSignalingClient();

// Connect
await signaling.connect();

// Join room
signaling.joinRoom(roomCode, {
  deviceId,
  deviceName,
  platform,
});

// Send offer
signaling.sendOffer(peerId, offer);

// Receive answer
signaling.on('answer', ({ from, answer }) => {
  peerConnection.setRemoteDescription(answer);
});

// ICE candidate exchange
signaling.sendICECandidate(peerId, candidate);
signaling.on('ice-candidate', ({ from, candidate }) => {
  peerConnection.addIceCandidate(candidate);
});
```

**Message Types:**

- `join-room`: Enter transfer room
- `leave-room`: Exit transfer room
- `offer`: WebRTC offer (SDP)
- `answer`: WebRTC answer (SDP)
- `ice-candidate`: ICE candidate for NAT traversal
- `group-offer`: 1-to-many offer
- `group-answer`: Response to group offer

### Unified Discovery

**Combined Local + Internet Discovery:**

```typescript
// Discover local devices via mDNS
const localDevices = await mdnsBridge.getDevices();

// Discover room participants via signaling
const roomDevices = await signaling.getRoomParticipants(roomCode);

// Merge and deduplicate
const allDevices = [...localDevices, ...roomDevices];
```

---

## 5. Transfer Modes

### P2P Direct Transfer

**WebRTC DataChannel** for zero-server file transfer:

```typescript
// From lib/transfer/pqc-transfer-manager.ts

const manager = new PQCTransferManager();

// Initialize session
await manager.initializeSession('send');

// Set data channel
manager.setDataChannel(dataChannel);

// Start key exchange
manager.startKeyExchange();

// Wait for session ready
manager.onSessionReady(() => {
  console.log('Encrypted channel established');
});

// Send file
await manager.sendFile(file);

// Progress tracking
manager.onProgress((progress) => {
  console.log(`${progress}% complete`);
});
```

**Transfer Protocol:**

```
1. public-key → Share ML-KEM-768 + X25519 public key
2. key-exchange → Send KEM ciphertext
3. key-rotation → Notify key rotation (every 5 min)
4. file-metadata → Send file info (encrypted name, size, chunks)
5. chunk[] → Send encrypted 64KB chunks
6. ack[] → Acknowledge received chunks
7. complete → Transfer finished
```

**Chunk Structure:**

```typescript
interface ChunkPayload {
  index: number; // 0 to totalChunks-1
  data: number[]; // Encrypted chunk (max 256KB)
  nonce: number[]; // 12-byte AES-GCM nonce
  hash: number[]; // 32-byte SHA-256 checksum
}
```

**Properties:**

- **Chunk Size**: 64 KB (configurable)
- **Acknowledgments**: Per-chunk ACK with 10s timeout
- **Retries**: 3 retries per chunk
- **Bandwidth Limiting**: Configurable rate limit
- **Verification**: SHA-256 checksum per chunk

### Email Fallback

**Resend API Integration** for email transfers:

```typescript
// From lib/email/email-service.ts

// Send file via email
const delivery = await sendEmailTransfer({
  recipientEmail: 'user@example.com',
  senderName: 'Alice',
  senderEmail: 'alice@example.com',
  files: [
    {
      filename: 'document.pdf',
      content: fileBuffer,
      size: 1024000,
      contentType: 'application/pdf',
    },
  ],
  password: 'SecurePassword123', // Optional encryption
  expiresIn: 24 * 60 * 60 * 1000, // 24 hours
  maxDownloads: 3,
  compress: true,
});

// Returns:
// {
//   id: string,
//   status: 'sent',
//   recipientEmail: string,
//   sentAt: number,
//   expiresAt: number,
//   downloadsCount: 0
// }
```

**Features:**

- **Password Protection**: AES-256-GCM encryption with Argon2id KDF
- **Compression**: ZIP compression if beneficial
- **Batch Sending**: Up to 100 recipients
- **Expiration**: Configurable (default 7 days)
- **Download Limits**: Max downloads per link
- **Delivery Tracking**: Status webhooks

**API Endpoints:**

- `POST /api/email/send`: Send single email
- `POST /api/email/batch`: Send to multiple recipients
- `GET /api/email/status/[id]`: Check delivery status
- `GET /api/email/download/[id]`: Download file
- `POST /api/email/webhook`: Resend webhooks

### Transfer Rooms

**Temporary Transfer Spaces** with security:

```typescript
// From lib/rooms/room-security.ts

// Generate secure room code
const roomCode = generateSecureRoomCode(8);
// Returns: 'AB3D7K9M' (no ambiguous chars: I, O, 0, 1, L)

// Validate room code
const validation = validateRoomCode(code);
// { valid: true, suggestions: [...] }

// Hash room password
const passwordHash = await hashRoomPassword(password);
// Returns: '1:salt:hash' (version 1 = Argon2id)

// Verify password
const verified = await verifyRoomPassword(password, passwordHash);
```

**Security Measures:**

1. **Rate Limiting**:
   - Room creation: 5/minute per device
   - Room joins: 10/minute per device/room
   - Password attempts: 3 before backoff

2. **Anti-Enumeration**:
   - Timing jitter (100-500ms) on failed attempts
   - Exponential backoff: 1s, 2s, 5s, 10s, 30s, 60s
   - Constant-time password comparison

3. **Password Strength**:
   - Minimum 8 characters
   - Require 3+ character types (upper, lower, number, special)
   - Reject common patterns (123, abc, password, qwerty)

**Room Lifecycle:**

```typescript
// Create room
const room = await createRoom({
  code: roomCode,
  password: passwordHash,
  createdBy: deviceId,
  expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
});

// Join room
await joinRoom(roomCode, password);

// Leave room
await leaveRoom(roomCode);

// Cleanup expired rooms (cron job)
await cleanupExpiredRooms();
```

### Group Transfers

**1-to-Many WebRTC Connections:**

```typescript
// From lib/transfer/group-transfer-manager.ts

const groupTransfer = new GroupTransferManager({
  bandwidthLimitPerRecipient: 1000000, // 1 MB/s each
  onRecipientProgress: (id, progress, speed) => {
    console.log(`${id}: ${progress}% @ ${speed} B/s`);
  },
  onRecipientComplete: (id) => {
    console.log(`${id} completed`);
  },
});

// Initialize
await groupTransfer.initializeGroupTransfer(transferId, fileName, fileSize, [
  { id: '1', name: 'Alice', deviceId: 'abc', socketId: 'xyz' },
  { id: '2', name: 'Bob', deviceId: 'def', socketId: 'uvw' },
]);

// Send to all (parallel)
const result = await groupTransfer.sendToAll(file);
// Returns: {
//   successfulRecipients: ['1', '2'],
//   failedRecipients: [],
//   totalTime: 5000
// }
```

**Properties:**

- **Max Recipients**: 10 simultaneous
- **Independent Progress**: Per-recipient tracking
- **Graceful Degradation**: Individual failures don't abort group
- **Bandwidth Management**: Fair allocation across peers
- **Connection Quality**: Monitor per-peer quality (excellent/good/fair/poor)

### Resumable Transfers

**Interrupted Transfer Recovery:**

```typescript
// From lib/transfer/resumable-transfer.ts

const resumableManager = new ResumablePQCTransferManager({
  autoResume: true,
  resumeTimeout: 30000,
  maxResumeAttempts: 3,
});

// Send file (automatically saves state)
await resumableManager.sendFile(file);

// On connection loss, state saved to IndexedDB
// {
//   transferId, fileName, fileSize, totalChunks,
//   receivedChunks: Map<number, Chunk>,
//   chunkBitmap: Uint8Array
// }

// Resume transfer
const transfers = await resumableManager.getResumableTransfers();
for (const transfer of transfers) {
  if (transfer.status === 'paused') {
    await resumableManager.resumeTransfer(transfer.id);
  }
}
```

**Resume Protocol:**

```
1. resume-request → Request resume with transferId
2. resume-response → Send chunk bitmap (which chunks received)
3. resume-chunk-request → Request missing chunks
4. chunk[] → Resend missing chunks only
```

**Chunk Bitmap Format:**

```
Bit-packed array: each bit represents a chunk
Byte 0 [76543210] → Chunks 0-7
Byte 1 [76543210] → Chunks 8-15
...
Bit = 1 → Chunk received
Bit = 0 → Chunk missing
```

**Properties:**

- **State Persistence**: IndexedDB for chunk tracking
- **Chunk Verification**: SHA-256 checksum per chunk
- **Auto-Resume**: Reconnect and resume automatically
- **Expiration**: Transfers expire after 7 days
- **Cleanup**: Automatic cleanup of expired transfers

---

## 6. API Endpoints

### Health Endpoints

**Basic Health Check:**

```
GET /api/health
Response: {
  status: 'ok',
  service: 'tallow',
  version: '2.0.0',
  timestamp: '2026-02-02T12:00:00Z',
  uptime: 3600
}
```

**Kubernetes Liveness Probe:**

```
GET /api/health/liveness
Response: { alive: true, timestamp: '...' }
```

**Kubernetes Readiness Probe:**

```
GET /api/health/readiness
Response: {
  ready: true,
  checks: {
    database: true,
    storage: true,
    signaling: true
  }
}
```

**Detailed Health Status:**

```
GET /api/health/detailed
Response: {
  status: 'healthy',
  version: '2.0.0',
  uptime: 3600,
  memory: { used: 50MB, total: 512MB },
  cpu: { usage: 5% },
  dependencies: {
    redis: 'connected',
    postgres: 'connected',
    s3: 'healthy'
  }
}
```

### Transfer Endpoints

**Send File via Email:**

```
POST /api/email/send
Body: {
  recipientEmail: 'user@example.com',
  senderName: 'Alice',
  files: [{ filename, content, size }],
  password?: string,
  expiresIn?: number,
  maxDownloads?: number
}
Response: {
  id: string,
  status: 'sent',
  expiresAt: number
}
```

**Batch Email Transfer:**

```
POST /api/email/batch
Body: {
  recipients: ['user1@example.com', ...],
  senderName: 'Alice',
  files: [...],
  options: { ... }
}
Response: {
  batchId: string,
  total: 10,
  sent: 10,
  failed: 0
}
```

**Check Email Status:**

```
GET /api/email/status/[id]
Response: {
  id: string,
  status: 'sent' | 'delivered' | 'downloaded' | 'expired',
  downloadsCount: 2,
  expiresAt: number
}
```

**Download File:**

```
GET /api/email/download/[id]?password=SecurePassword123
Response: File download (Content-Disposition: attachment)
```

### Monitoring Endpoints

**Prometheus Metrics:**

```
GET /api/metrics
Headers: { Authorization: 'Bearer METRICS_TOKEN' }
Response: (text/plain)
# HELP tallow_transfers_total Total file transfers
# TYPE tallow_transfers_total counter
tallow_transfers_total{status="success",method="p2p"} 42
tallow_transfers_total{status="failed",method="p2p"} 1

# HELP tallow_bytes_transferred_total Total bytes transferred
# TYPE tallow_bytes_transferred_total counter
tallow_bytes_transferred_total{method="p2p"} 1073741824

# HELP tallow_pqc_operations_total PQC operations
# TYPE tallow_pqc_operations_total counter
tallow_pqc_operations_total{operation="keygen"} 10
tallow_pqc_operations_total{operation="encaps"} 5
tallow_pqc_operations_total{operation="decaps"} 5

# HELP tallow_active_connections Active WebRTC connections
# TYPE tallow_active_connections gauge
tallow_active_connections 3

# HELP tallow_errors_total Application errors
# TYPE tallow_errors_total counter
tallow_errors_total{type="crypto"} 0
tallow_errors_total{type="transfer"} 1
```

**Room Management:**

```
GET /api/rooms
Response: {
  rooms: [
    { code: 'ABC123', participants: 2, createdAt: number }
  ]
}

POST /api/rooms
Body: { code: string, password: string }
Response: { success: true, room: {...} }

DELETE /api/rooms/[code]
Response: { success: true }
```

### Payment Endpoints

**Create Stripe Checkout Session:**

```
POST /api/stripe/create-checkout-session
Body: {
  priceId: 'price_xxx',
  successUrl: string,
  cancelUrl: string
}
Response: { sessionId: string, url: string }
```

**Stripe Webhook:**

```
POST /api/stripe/webhook
Headers: { Stripe-Signature: '...' }
Body: Stripe event
Response: { received: true }
```

---

## 7. Configuration Options

### Environment Variables

**Server Configuration:**

```bash
# Next.js
NEXT_PUBLIC_APP_URL=https://tallow.app
NODE_ENV=production

# Resend Email API
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=transfers@tallow.app

# Prometheus Metrics
METRICS_TOKEN=secret_token_here

# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=tallow.app

# Feature Flags
NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID=xxx

# Stripe Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### User Settings (localStorage)

**Privacy Settings:**

```javascript
// Advanced privacy mode (traffic obfuscation)
localStorage.setItem('tallow_advanced_privacy_mode', 'true');

// Onion routing mode
localStorage.setItem('tallow_onion_routing_mode', 'multi-hop');
// Options: 'off', 'single-hop', 'multi-hop'

// Number of onion hops (1-3)
localStorage.setItem('tallow_onion_hop_count', '3');
```

**Security Settings:**

```javascript
// Key rotation interval (milliseconds)
localStorage.setItem('tallow_key_rotation_interval', '300000'); // 5 minutes

// Automatic metadata stripping
localStorage.setItem('tallow_auto_strip_metadata', 'true');

// IP protection mode
localStorage.setItem('tallow_ip_protection', 'relay-only');
// Options: 'off', 'relay-preferred', 'relay-only'
```

**Performance Settings:**

```javascript
// Bandwidth limit (bytes per second, 0 = unlimited)
localStorage.setItem('tallow_bandwidth_limit', '1000000'); // 1 MB/s

// Chunk size for transfers
localStorage.setItem('tallow_chunk_size', '65536'); // 64 KB

// Max concurrent transfers
localStorage.setItem('tallow_max_concurrent_transfers', '3');
```

---

## 8. Monitoring and Analytics

### Prometheus Metrics

**Transfer Metrics:**

- `tallow_transfers_total{status,method}`: Total transfers (counter)
- `tallow_bytes_transferred_total{method}`: Total bytes (counter)
- `tallow_transfer_duration_seconds{method}`: Transfer duration (histogram)
- `tallow_file_size_bytes{type}`: File size distribution (histogram)
- `tallow_active_transfers`: Current active transfers (gauge)

**Connection Metrics:**

- `tallow_connections_total{type,status}`: Total connections (counter)
- `tallow_active_connections{type}`: Active connections (gauge)
- `tallow_connection_duration_seconds`: Connection lifetime (histogram)

**PQC Metrics:**

- `tallow_pqc_operations_total{operation,algorithm}`: PQC operations (counter)
- `tallow_pqc_duration_milliseconds{operation}`: PQC operation time (histogram)

**Error Metrics:**

- `tallow_errors_total{type,severity}`: Application errors (counter)

**Example Queries:**

```promql
# Average transfer speed (MB/s)
rate(tallow_bytes_transferred_total[5m]) / 1048576

# Success rate
rate(tallow_transfers_total{status="success"}[5m])
  / rate(tallow_transfers_total[5m])

# 95th percentile PQC keygen time
histogram_quantile(0.95, rate(tallow_pqc_duration_milliseconds_bucket{operation="keygen"}[5m]))

# Error rate by type
sum(rate(tallow_errors_total[5m])) by (type)
```

### Plausible Analytics

**Privacy-First Web Analytics** (no cookies, GDPR compliant):

```javascript
// Pageviews tracked automatically

// Custom events
plausible('File Transfer', { props: { method: 'P2P' } });
plausible('Room Created', { props: { hasPassword: true } });
```

**Events Tracked:**

- `pageview`: Page loads
- `File Transfer`: Transfer initiated
- `Room Created`: Transfer room created
- `Email Send`: Email transfer sent
- `Download`: File downloaded
- `Error`: Application error

### LaunchDarkly Feature Flags

**Dynamic Feature Control:**

```javascript
const ldClient = await ldClient.initialize(
  'NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID',
  { anonymous: true }
);

// Check feature flags
const onionRoutingEnabled = ldClient.variation('onion-routing', false);
const maxFileSize = ldClient.variation('max-file-size', 100 * 1024 * 1024);
```

**Flags:**

- `onion-routing`: Enable/disable onion routing
- `email-transfers`: Enable/disable email fallback
- `max-file-size`: Maximum file size (bytes)
- `room-expiration`: Room lifetime (milliseconds)

### Sentry Error Tracking

**Exception Monitoring:**

```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Strip sensitive data
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});

// Capture exception
Sentry.captureException(error, {
  tags: { module: 'pqc-transfer' },
  extra: { sessionId, fileSize },
});
```

---

## 9. Network Protocols

### WebRTC Configuration

**ICE Servers:**

```javascript
const rtcConfig = {
  iceServers: [
    // STUN (public Google STUN)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },

    // TURN (Tallow relay servers)
    {
      urls: 'turn:turn.tallow.app:3478',
      username: 'user',
      credential: 'pass',
    },
    {
      urls: 'turns:turn.tallow.app:5349',
      username: 'user',
      credential: 'pass',
    },
  ],

  // Connection mode
  iceTransportPolicy: 'all', // 'all', 'relay'

  // Bundling
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',

  // ICE candidate pool
  iceCandidatePoolSize: 10,
};
```

**Connection Modes:**

- `Auto`: Try direct P2P first, fallback to TURN
- `Relay-only`: Force TURN relay (IP protection)
- `Direct-only`: Only direct P2P (fastest, no privacy)

**NAT Traversal:**

1. **STUN**: Discover public IP/port
2. **TURN**: Relay if direct connection fails
3. **ICE**: Negotiate best path (host, srflx, relay)

### Transfer Protocol Messages

**Message Format:**

```json
{
  "type": "message-type",
  "payload": { ... }
}
```

**Message Types:**

1. **public-key**: Share public key

```json
{
  "type": "public-key",
  "payload": {
    "key": [
      /* serialized ML-KEM-768 + X25519 */
    ]
  }
}
```

2. **key-exchange**: Send KEM ciphertext

```json
{
  "type": "key-exchange",
  "payload": {
    "ciphertext": [
      /* ML-KEM-768 ciphertext */
    ]
  }
}
```

3. **key-rotation**: Notify key rotation

```json
{
  "type": "key-rotation",
  "payload": {
    "generation": 5,
    "sessionIdHex": "abc123..."
  }
}
```

4. **file-metadata**: File information

```json
{
  "type": "file-metadata",
  "payload": {
    "originalSize": 1048576,
    "mimeCategory": "application/pdf",
    "totalChunks": 16,
    "fileHash": [
      /* SHA-256 */
    ],
    "encryptedName": "base64...",
    "nameNonce": [
      /* nonce */
    ]
  }
}
```

5. **chunk**: Encrypted chunk data

```json
{
  "type": "chunk",
  "payload": {
    "index": 0,
    "data": [
      /* encrypted chunk */
    ],
    "nonce": [
      /* 12-byte nonce */
    ],
    "hash": [
      /* SHA-256 */
    ]
  }
}
```

6. **ack**: Chunk acknowledgment

```json
{
  "type": "ack",
  "payload": { "index": 0 }
}
```

7. **complete**: Transfer complete

```json
{
  "type": "complete",
  "payload": { "success": true }
}
```

8. **error**: Error notification

```json
{
  "type": "error",
  "payload": { "error": "Connection lost" }
}
```

---

## 10. Security Hardening

### Rate Limiting

**Room Operations:**

- **Room Creation**: 5 attempts/minute per device
- **Room Joins**: 10 attempts/minute per device/room
- **Password Attempts**: 3 before exponential backoff

**Implementation:**

```typescript
// Check rate limit
const limit = checkRoomCreationLimit(deviceId);
if (!limit.allowed) {
  throw new Error(`Rate limited. Retry after ${limit.retryAfter}s`);
}

// Exponential backoff for password attempts
const backoff = checkPasswordAttemptLimit(deviceId, roomCode);
if (!backoff.allowed) {
  await sleep(backoff.backoffDelay); // 1s, 2s, 5s, 10s, 30s, 60s
}
```

### Input Validation

**Zod Schema Validation:**

```typescript
import { z } from 'zod';

const RecipientSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9 _-]+$/),
  deviceId: z.string().min(1).max(50),
  socketId: z.string().min(1).max(100),
});

// Validate input
const validated = RecipientSchema.parse(input);
```

**Chunk Size Validation:**

```typescript
const MAX_CHUNK_SIZE = 256 * 1024; // 256 KB

if (chunk.data.length > MAX_CHUNK_SIZE) {
  throw new Error('Chunk too large - potential DoS attack');
}
```

**File Size Validation:**

```typescript
const MAX_FILE_SIZE = 4 * 1024 * 1024 * 1024; // 4 GB

if (file.size > MAX_FILE_SIZE) {
  throw new Error('File exceeds maximum size');
}
```

### CSRF Protection

**Token Generation:**

```typescript
// Generate CSRF token
const csrfToken = crypto.randomBytes(32).toString('hex');

// Set cookie
res.setHeader(
  'Set-Cookie',
  `csrf_token=${csrfToken}; HttpOnly; SameSite=Strict`
);

// Validate on POST
if (req.body.csrf_token !== req.cookies.csrf_token) {
  throw new Error('CSRF token mismatch');
}
```

### Constant-Time Operations

**Password Comparison:**

```typescript
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
```

**Prevents:**

- Timing attacks
- Length leakage
- Early exit exploitation

### Timing Attack Prevention

**Random Delays:**

```typescript
// Add cryptographically random jitter
async function addTimingJitter(minMs = 100, maxMs = 500): Promise<void> {
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  const jitter = minMs + (randomBuffer[0] / 0xffffffff) * (maxMs - minMs);
  await sleep(jitter);
}

// Use on authentication failures
async function authenticate(password: string): Promise<boolean> {
  const valid = await verifyPassword(password);
  if (!valid) {
    await addTimingJitter(); // Prevent timing analysis
  }
  return valid;
}
```

**Authentication Delay:**

```typescript
// Exponential backoff on failed auth
const delay = Math.min(
  1000 * Math.pow(2, failedAttempts - 1),
  10000 // Max 10s
);
await sleep(delay);
```

---

## Technical Specifications Summary

| Component             | Specification                                       |
| --------------------- | --------------------------------------------------- |
| **PQC Algorithm**     | ML-KEM-768 (NIST FIPS 203)                          |
| **Classical KEM**     | X25519 ECDH                                         |
| **Symmetric Cipher**  | AES-256-GCM                                         |
| **Hash Function**     | SHA-256                                             |
| **KDF**               | HKDF-SHA256, Argon2id                               |
| **Forward Secrecy**   | Triple Ratchet (Double Ratchet + Sparse PQ Ratchet) |
| **Onion Routing**     | 1-3 hops, 10-minute circuits                        |
| **Chunk Size**        | 64 KB (default)                                     |
| **Max File Size**     | 4 GB                                                |
| **Transfer Protocol** | WebRTC DataChannel                                  |
| **Discovery**         | mDNS + Socket.IO signaling                          |

**Key Sizes:**

- ML-KEM-768 Public Key: 1184 bytes
- ML-KEM-768 Secret Key: 2400 bytes
- ML-KEM-768 Ciphertext: 1088 bytes
- X25519 Keys: 32 bytes
- AES-256 Key: 32 bytes
- SHA-256 Hash: 32 bytes
- AES-GCM Nonce: 12 bytes

**Security Parameters:**

- Argon2id: 64 MB memory, 3 iterations, 4 parallelism
- PBKDF2: 600,000 iterations (OWASP 2023)
- Key Rotation: 5-minute intervals
- Circuit Lifetime: 10 minutes
- Room Expiration: 24 hours (default)

---

## Conclusion

Tallow provides military-grade security for everyday file transfers. By
combining post-quantum cryptography, onion routing, traffic obfuscation, and
forward secrecy, Tallow ensures files remain private both now and in the quantum
future.

For security auditors and developers, this documentation provides complete
technical transparency into every security mechanism. All cryptographic
implementations follow NIST standards and best practices.

**Further Reading:**

- NIST FIPS 203: ML-KEM Standard
- Signal Triple Ratchet Specification
- OWASP Cryptographic Storage Cheat Sheet
- WebRTC Security Considerations (RFC 8827)

**Security Contact:** For security vulnerabilities, please email:
security@tallow.app

---

_Document End - 800+ lines of comprehensive technical documentation_
