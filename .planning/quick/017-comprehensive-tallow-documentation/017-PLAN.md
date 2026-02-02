---
phase: quick
plan: 017
type: execute
wave: 1
depends_on: []
files_modified:
  - docs/TALLOW-TECHNICAL-DOCUMENTATION.md
autonomous: true

must_haves:
  truths:
    - 'Developer can understand all Tallow features from a single document'
    - 'All security features (PQC, hybrid encryption, forward secrecy) are
      documented with technical details'
    - 'All privacy features (onion routing, metadata stripping, IP protection)
      are explained'
    - 'Transfer modes (P2P, email, rooms, group, resumable) are covered with
      protocols'
    - 'Device discovery mechanisms (mDNS, signaling) are documented'
    - 'API endpoints and configuration options are listed'
  artifacts:
    - path: 'docs/TALLOW-TECHNICAL-DOCUMENTATION.md'
      provides: 'Comprehensive technical documentation for all Tallow features'
      min_lines: 800
  key_links:
    - from: 'docs/TALLOW-TECHNICAL-DOCUMENTATION.md'
      to: 'lib/crypto/*'
      via: 'References PQC implementation details'
    - from: 'docs/TALLOW-TECHNICAL-DOCUMENTATION.md'
      to: 'lib/transport/*'
      via: 'References onion routing and obfuscation'
---

<objective>
Create comprehensive technical documentation for Tallow covering all implemented features.

Purpose: Provide developers and security auditors with a complete reference for
understanding Tallow's architecture, security model, privacy features, and
transfer capabilities.

Output: A single comprehensive markdown file at
`docs/TALLOW-TECHNICAL-DOCUMENTATION.md` </objective>

<context>
Tallow is a privacy-first, decentralized P2P file sharing application with post-quantum cryptography.

**Core source files to reference:**

- `lib/crypto/pqc-crypto.ts` - ML-KEM-768 (Kyber) + X25519 hybrid encryption
- `lib/crypto/triple-ratchet.ts` - Signal-style forward secrecy protocol
- `lib/crypto/sparse-pq-ratchet.ts` - Post-quantum ratchet
- `lib/transport/onion-routing.ts` - Multi-hop anonymous routing
- `lib/transport/obfuscation.ts` - Traffic obfuscation and padding
- `lib/discovery/mdns-bridge.ts` - Local network device discovery
- `lib/transfer/pqc-transfer-manager.ts` - Secure file transfer protocol
- `lib/transfer/resumable-transfer.ts` - Interrupted transfer recovery
- `lib/transfer/group-transfer-manager.ts` - Multi-recipient transfers
- `lib/rooms/room-security.ts` - Transfer room security
- `lib/email/email-service.ts` - Email fallback transfers
- `lib/privacy/metadata-stripper.ts` - EXIF/metadata removal
- `lib/monitoring/` - Prometheus metrics and analytics
- `app/api/` - REST API endpoints </context>

<tasks>

<task type="auto">
  <name>Task 1: Create comprehensive technical documentation</name>
  <files>docs/TALLOW-TECHNICAL-DOCUMENTATION.md</files>
  <action>
Create a comprehensive technical documentation file covering ALL Tallow features.

**Document Structure:**

1. **Overview**
   - What is Tallow
   - Architecture overview (Next.js + WebRTC + PQC)
   - Security philosophy

2. **Security Features**
   - Post-Quantum Cryptography (PQC)
     - ML-KEM-768 (Kyber) key encapsulation
     - X25519 ECDH for classical security
     - Hybrid key exchange (quantum-resistant + classical)
     - AES-256-GCM symmetric encryption
     - Counter-based nonces (prevent nonce reuse)
   - Key Derivation
     - HKDF for session key derivation
     - Argon2id for password-based key derivation (64MB memory, 3 iterations)
     - PBKDF2 fallback (600K iterations)
   - Forward Secrecy
     - Triple Ratchet Protocol (Double Ratchet + Sparse PQ Ratchet)
     - Key rotation manager (configurable intervals)
     - Session key derivation (encryption key, auth key, session ID)
   - Peer Authentication
     - SAS (Short Authentication String) verification
     - Cryptographic shared secret verification
   - Memory Protection
     - Secure memory wiping after use
     - Sensitive data zeroing

3. **Privacy Features**
   - Onion Routing
     - Multi-hop relay architecture (1-3 hops)
     - Circuit building with per-hop key establishment
     - Layer encryption/decryption
     - Circuit lifetime management (10 minutes)
   - Traffic Obfuscation
     - Padded constant bitrate transfers
     - Random chunk sizing (16KB-1MB)
     - Decoy traffic generation
     - Timing jitter
   - Metadata Stripping
     - EXIF removal from images (JPEG, PNG, WebP)
     - GPS location data removal
     - Camera/device info removal
     - Video metadata stripping (MP4/MOV)
   - IP Protection
     - Relay-only mode (TURN servers)
     - ICE candidate filtering
     - Proxy configuration support

4. **Device Discovery**
   - mDNS Discovery
     - WebSocket bridge to local daemon
     - Device advertisement
     - Platform filtering
     - Auto-reconnect with exponential backoff
   - Signaling Server
     - Socket.IO based signaling
     - WebRTC offer/answer exchange
     - ICE candidate exchange
   - Unified Discovery
     - Local network discovery
     - Group discovery for multi-device scenarios

5. **Transfer Modes**
   - P2P Direct Transfer
     - WebRTC DataChannel
     - Chunk-based file transfer (64KB chunks)
     - Progress tracking and acknowledgments
     - Bandwidth limiting
   - Email Fallback
     - Resend API integration
     - Password-protected attachments
     - File compression (ZIP)
     - Batch transfers
     - Download links with expiration
   - Transfer Rooms
     - Room code generation (6-16 chars, no ambiguous chars)
     - Password protection with Argon2id hashing
     - Rate limiting (room creation, joins, password attempts)
     - Anti-enumeration protection (timing jitter)
   - Group Transfers
     - 1-to-many WebRTC connections (max 10 recipients)
     - Independent progress tracking
     - Per-recipient bandwidth management
     - Graceful failure handling
   - Resumable Transfers
     - IndexedDB state persistence
     - Chunk bitmap tracking
     - Auto-resume on reconnect
     - Transfer expiration and cleanup

6. **API Endpoints**
   - Health Endpoints
     - `/api/health` - Basic health check
     - `/api/health/liveness` - Kubernetes liveness probe
     - `/api/health/readiness` - Kubernetes readiness probe
     - `/api/health/detailed` - Detailed health status
   - Transfer Endpoints
     - `/api/email/send` - Send file via email
     - `/api/email/batch` - Batch email transfers
     - `/api/email/status/[id]` - Check delivery status
     - `/api/email/download/[id]` - Download file
   - Monitoring Endpoints
     - `/api/metrics` - Prometheus metrics
     - `/api/rooms` - Room management
   - Payment Endpoints
     - `/api/stripe/create-checkout-session`
     - `/api/stripe/webhook`

7. **Configuration Options**
   - Environment Variables
     - `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` - Analytics domain
     - `NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID` - Feature flags
     - `RESEND_API_KEY` - Email service
     - `METRICS_TOKEN` - Metrics authentication
   - User Settings (localStorage)
     - `tallow_advanced_privacy_mode` - Traffic obfuscation
     - `tallow_onion_routing_mode` - Onion routing (off/single-hop/multi-hop)
     - `tallow_onion_hop_count` - Number of hops (1-3)
     - `tallow_key_rotation_interval` - Key rotation frequency
     - `tallow_bandwidth_limit` - Transfer speed limit

8. **Monitoring and Analytics**
   - Prometheus Metrics
     - `tallow_transfers_total` - Total file transfers
     - `tallow_bytes_transferred_total` - Total bandwidth
     - `tallow_pqc_operations_total` - PQC operations
     - `tallow_active_connections` - WebRTC connections
     - `tallow_errors_total` - Application errors
   - Plausible Analytics (privacy-first, no cookies)
   - LaunchDarkly Feature Flags
   - Sentry Error Tracking

9. **Network Protocols**
   - WebRTC Configuration
     - ICE servers (STUN/TURN)
     - Connection modes (Auto, Relay-only, Direct-only)
     - NAT detection and handling
   - Transfer Protocol Messages
     - `public-key` - Share public key
     - `key-exchange` - Send KEM ciphertext
     - `key-rotation` - Notify key rotation
     - `file-metadata` - File information
     - `chunk` - Encrypted chunk data
     - `ack` - Chunk acknowledgment
     - `complete` - Transfer complete
     - `error` - Error notification

10. **Security Hardening**
    - Rate Limiting
      - Room creation (5/min per device)
      - Room joins (10/min per device/room)
      - Password attempts (3 before exponential backoff)
    - Input Validation
      - Zod schema validation for all inputs
      - Maximum chunk size validation (256KB)
      - Maximum file size validation
    - CSRF Protection
    - Constant-time comparisons
    - Timing attack prevention

**Technical Details to Include:**

- Key sizes: ML-KEM-768 public key = 1184 bytes, ciphertext = 1088 bytes
- AES-GCM nonce size: 12 bytes (96 bits)
- SHA-256 hash output: 32 bytes
- Argon2id parameters: 64MB memory, 3 iterations, 4 parallelism
- HKDF info strings for domain separation
- Transfer chunk size: 64KB default
- Circuit lifetime: 10 minutes

**Code References:** Include relevant code snippets from source files showing:

- Hybrid key exchange flow
- Triple ratchet message encryption
- Onion layer wrapping/unwrapping
- Metadata stripping implementation
- Room password hashing </action> <verify>
- File exists at docs/TALLOW-TECHNICAL-DOCUMENTATION.md
- Document is at least 800 lines
- All 10 major sections are present
- Code examples are included
- Technical specifications (key sizes, algorithms) are accurate </verify> <done>
  Comprehensive technical documentation exists covering all Tallow features with
  accurate technical details, code references, and implementation specifics.
  </done> </task>

</tasks>

<verification>
- [ ] Documentation file exists at docs/TALLOW-TECHNICAL-DOCUMENTATION.md
- [ ] All security features documented (PQC, hybrid encryption, forward secrecy, key management)
- [ ] All privacy features documented (onion routing, obfuscation, metadata stripping, IP protection)
- [ ] All transfer modes documented (P2P, email, rooms, group, resumable)
- [ ] Device discovery documented (mDNS, signaling)
- [ ] API endpoints listed with descriptions
- [ ] Configuration options documented
- [ ] Monitoring/analytics covered
- [ ] Network protocols explained
- [ ] Security hardening measures documented
</verification>

<success_criteria> A single comprehensive markdown file (800+ lines) exists at
`docs/TALLOW-TECHNICAL-DOCUMENTATION.md` that a developer could use to
understand all technical aspects of Tallow without needing to read source code.
</success_criteria>

<output>
After completion, create `.planning/quick/017-comprehensive-tallow-documentation/017-SUMMARY.md`
</output>
