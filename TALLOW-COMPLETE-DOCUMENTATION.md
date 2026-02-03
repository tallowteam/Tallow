# Tallow Complete Technical Documentation

**Generated:** 2026-02-03 **Version:** 2.0 **Total Codebase:** ~50,000+ lines
across 200+ files

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Cryptography & Security](#2-cryptography--security)
3. [Transfer System](#3-transfer-system)
4. [Privacy Features](#4-privacy-features)
5. [Room System](#5-room-system)
6. [Discovery & Networking](#6-discovery--networking)
7. [API Routes](#7-api-routes)
8. [React Hooks](#8-react-hooks)
9. [State Management](#9-state-management)
10. [Email System](#10-email-system)
11. [Monitoring & Observability](#11-monitoring--observability)
12. [Utilities & Types](#12-utilities--types)
13. [Build & Configuration](#13-build--configuration)
14. [File Reference](#14-file-reference)

---

## 1. Executive Summary

Tallow is a **privacy-first, decentralized peer-to-peer file sharing
application** with post-quantum cryptography support. Built with Next.js 16,
React 19, and WebRTC, it provides secure file transfers with military-grade
encryption.

### Core Principles

| Principle              | Implementation                                |
| ---------------------- | --------------------------------------------- |
| **Zero Trust**         | E2E encryption, no server-side decryption     |
| **Post-Quantum Ready** | ML-KEM-768 (Kyber) + X25519 hybrid            |
| **Privacy by Design**  | IP masking, metadata stripping, onion routing |
| **Forward Secrecy**    | Triple Ratchet protocol                       |
| **Resilient**          | Resumable transfers, offline support          |

### Technology Stack

- **Frontend:** Next.js 16.1.2, React 19.2.3, TypeScript 5 (strict)
- **State:** Zustand 5.0.10
- **Real-time:** Socket.IO 4.8.3, WebRTC (simple-peer)
- **Crypto:** @noble/\*, pqc-kyber (WASM)
- **Email:** Resend, React Email
- **Payments:** Stripe
- **Monitoring:** Prometheus, Plausible, Sentry, LaunchDarkly

---

## 2. Cryptography & Security

**Location:** `lib/crypto/` (18 modules, ~4,800 lines)

### Core Algorithms

| Purpose              | Algorithm              | Standard        |
| -------------------- | ---------------------- | --------------- |
| Key Encapsulation    | ML-KEM-768 (Kyber)     | NIST FIPS 203   |
| Key Exchange         | X25519 ECDH            | RFC 7748        |
| Symmetric Encryption | AES-256-GCM            | NIST SP 800-38D |
| Alternative Cipher   | ChaCha20-Poly1305      | RFC 8439        |
| Password KDF         | Argon2id               | RFC 9106        |
| Key Derivation       | HKDF-SHA256            | RFC 5869        |
| Signatures           | ML-DSA-65 (Dilithium3) | NIST FIPS 204   |
| Classical Signatures | Ed25519                | RFC 8032        |

### Key Modules

| Module                 | Lines | Purpose                                               |
| ---------------------- | ----- | ----------------------------------------------------- |
| pqc-crypto.ts          | 578   | ML-KEM-768 + X25519 hybrid encryption                 |
| triple-ratchet.ts      | 505   | Double + Sparse PQ Ratchet for forward secrecy        |
| key-management.ts      | 621   | Ephemeral keys, session derivation, auto-expiration   |
| file-encryption-pqc.ts | 430   | 64KB chunk encryption with integrity                  |
| argon2-browser.ts      | 332   | Memory-hard password KDF (64MB, 3 iterations)         |
| nonce-manager.ts       | 182   | Counter-based nonces (2^64 safe, no birthday paradox) |
| sparse-pq-ratchet.ts   | 365   | Signal's ML-KEM Braid protocol                        |
| peer-authentication.ts | 297   | SAS verification (262k word combinations)             |
| signed-prekeys.ts      | 422   | X3DH/PQXDH async messaging infrastructure             |

### Security Properties

- **Forward Secrecy:** Per-message key rotation via Triple Ratchet
- **Post-Compromise Security:** Frequent DH + PQ ratcheting
- **Quantum Resistance:** ML-KEM-768 hybrid (NIST-approved)
- **Nonce Safety:** Counter-based (no collision risk)
- **MITM Detection:** SAS verification + signed prekeys
- **Memory Protection:** Secure wiping of sensitive data

---

## 3. Transfer System

**Location:** `lib/transfer/` (16 modules, ~4,200 lines)

### Core Components

| Component                   | Lines | Purpose                                       |
| --------------------------- | ----- | --------------------------------------------- |
| PQCTransferManager          | 1,112 | ML-KEM-768 + X25519 hybrid file transfer      |
| GroupTransferManager        | 801   | 1-to-N parallel transfers (max 10 recipients) |
| ResumablePQCTransferManager | 527   | IndexedDB chunk persistence for resume        |
| FolderTransfer              | 524   | ZIP compression, tree structure preservation  |
| Encryption                  | 454   | AES-256-GCM + ChaCha20-Poly1305               |
| TransferManager             | 299   | State machine, lifecycle tracking             |
| FileChunking                | 270   | Adaptive 64KB-4MB chunks with SHA-256         |
| TransferMetadata            | 219   | Expiration, password protection, signatures   |

### Transfer Protocol

```
1. Deterministic Role Selection (prevents race conditions)
2. PQC Key Exchange (ML-KEM-768 + X25519)
3. File Metadata Transmission (encrypted filename)
4. Chunk-by-Chunk Transfer (64KB default)
5. ACK-Based Confirmation (10s timeout, 3 retries)
6. Key Rotation Notifications (5-minute intervals)
7. Secure Cleanup (memory wiping)
```

### Features

- **ACK-based flow control:** 10s timeout, 3 retries
- **Counter-based nonces:** No birthday paradox
- **Adaptive bitrate:** RTT/jitter monitoring
- **Backpressure handling:** 8MB high / 4MB low thresholds
- **Resume support:** IndexedDB chunk bitmap tracking
- **Group transfers:** Independent per-recipient progress

---

## 4. Privacy Features

**Location:** `lib/privacy/` + `lib/transport/` (~6,600 lines)

### Privacy Modules

| Module                | Lines | Purpose                                     |
| --------------------- | ----- | ------------------------------------------- |
| metadata-stripper.ts  | 774   | EXIF/GPS removal (JPEG, PNG, WebP, MP4)     |
| obfuscation.ts        | 1,004 | Traffic analysis resistance                 |
| private-webrtc.ts     | 923   | TURN-only with IP leak prevention           |
| onion-routing.ts      | 793   | Multi-hop ML-KEM-768 encrypted relay        |
| timing-obfuscation.ts | 753   | Timing pattern masking                      |
| packet-padding.ts     | 643   | Size normalization (TLS blending)           |
| vpn-leak-detection.ts | 490   | WebRTC IP leak detection                    |
| relay-routing.ts      | 465   | 3 privacy levels (direct/relay/multi-relay) |
| secure-deletion.ts    | 440   | DoD 5220.22-M & Gutmann (7-pass) wiping     |
| tor-support.ts        | 373   | Tor Browser auto-configuration              |

### Privacy Levels

| Level       | Description         | Latency |
| ----------- | ------------------- | ------- |
| Direct      | Fastest, IP visible | 1.0x    |
| Relay       | IP hidden via TURN  | 1.5x    |
| Multi-Relay | Multiple hop relay  | 2.5x    |

### Metadata Stripping

Removes from images/videos:

- GPS coordinates
- Camera make/model/serial
- Software used
- Creation timestamps
- Author/artist/copyright
- Device identifiers

### Traffic Obfuscation

- **Packet padding:** Uniform TLS record sizes (1460-16384 bytes)
- **Timing modes:** Constant bitrate, exponential, Poisson, burst
- **Protocol disguise:** HTTP/HTTPS mimicry
- **Domain fronting:** CDN-based censorship bypass
- **Cover traffic:** Decoy packets (15% probability)
- **Browser mimicry:** Chrome/Firefox/Safari/Edge profiles

---

## 5. Room System

**Location:** `lib/rooms/` (4 modules, ~1,746 lines)

### Modules

| Module                   | Lines | Purpose                                     |
| ------------------------ | ----- | ------------------------------------------- |
| room-security.ts         | 645   | Validation, rate limiting, Argon2id hashing |
| transfer-room-manager.ts | 642   | Socket.IO room management                   |
| room-p2p-integration.ts  | 262   | WebRTC P2P connections                      |
| room-crypto.ts           | 197   | AES-256-GCM room encryption                 |

### Security Features

- **Password hashing:** Argon2id (64MB, 3 iterations, 4 parallelism)
- **PBKDF2 fallback:** 600,000 iterations (OWASP 2023)
- **Rate limiting:** 3 tiers with exponential backoff
- **Anti-enumeration:** Timing jitter, constant-time comparison
- **Nonce management:** Counter-based (no reuse)
- **Replay protection:** 30-second timestamp validation

### Rate Limits

| Operation         | Limit            | Backoff            |
| ----------------- | ---------------- | ------------------ |
| Room creation     | 5/minute         | -                  |
| Room join         | 10/minute        | -                  |
| Password attempts | 3 before backoff | 1s→60s exponential |

---

## 6. Discovery & Networking

**Location:** `lib/discovery/`, `lib/signaling/`, `lib/webrtc/` (12+ modules)

### Discovery Methods

| Method            | Scope         | Protocol            |
| ----------------- | ------------- | ------------------- |
| mDNS Bridge       | Local network | WebSocket to daemon |
| Signaling Server  | Internet      | Socket.IO           |
| Unified Discovery | Both          | Automatic fallback  |

### Signaling Architecture

- **Socket.IO client** for WebRTC signaling
- **PQC signaling** with ML-KEM-768 + X25519
- **HKDF fallback** for legacy clients
- **Connection manager** with retry logic

### NAT Traversal

| NAT Type        | Strategy            |
| --------------- | ------------------- |
| Full Cone       | Direct connection   |
| Restricted Cone | STUN                |
| Port Restricted | STUN + symmetric    |
| Symmetric       | TURN relay required |

### WebRTC Features

- **Parallel data channels** for bandwidth aggregation
- **Screen sharing** with PQC protection
- **Security monitoring** and certificate validation
- **IP leak prevention** (candidate filtering, SDP scrubbing)

---

## 7. API Routes

**Location:** `app/api/` (24 endpoints across 10 categories)

### Endpoint Summary

| Category        | Routes | Key Features                         |
| --------------- | ------ | ------------------------------------ |
| Health Check    | 4      | Kubernetes probes, component metrics |
| CSRF Token      | 1      | HttpOnly/Secure/SameSite cookies     |
| Metrics         | 1      | Prometheus/OpenMetrics export        |
| Room Management | 3      | PBKDF2 600k iterations, timing-safe  |
| Email Transfer  | 5      | Batch (max 50), webhooks, password   |
| Welcome/Share   | 4      | XSS sanitization, API key auth       |
| Stripe Payment  | 2      | Webhook signature verification       |
| File Download   | 2      | AES-256 decryption, secure headers   |
| File Email      | 1      | Attachment/link modes                |
| Cron Jobs       | 1      | S3 cleanup, Vercel cron              |

### Security

- **CSRF protection** on all mutations
- **Rate limiting:** 3-60 req/min by endpoint
- **RFC 5322 email validation**
- **HMAC-SHA256 webhook verification**
- **Timing-safe password comparison**

---

## 8. React Hooks

**Location:** `lib/hooks/` (25 custom hooks)

### Hook Categories

| Category   | Count | Hooks                                                                                                                                    |
| ---------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Transfer   | 7     | useFileTransfer, usePQCTransfer, useGroupTransfer, useResumableTransfer, useAdaptiveTransfer, useAdvancedTransfer, useOptimisticTransfer |
| Connection | 5     | useP2PConnection, useDeviceConnection, useNATOptimizedConnection, useP2PSession, useNATDetection                                         |
| Discovery  | 3     | useUnifiedDiscovery, useGroupDiscovery, useMdnsDiscovery                                                                                 |
| Feature    | 5     | useOnionRouting, useMetadataStripper, useEmailTransfer, useChat, useTransferRoom                                                         |
| State      | 2     | useTransferState, useFeatureFlag                                                                                                         |
| Utility    | 3     | useVerification, useServiceWorker, useWebShare                                                                                           |

### Key Features

- **E2E encryption by default**
- **Kyber-1024 PQC** in transfer hooks
- **X25519 low-order point validation**
- **IP leak prevention** (relay-only mode)
- **Ephemeral key destruction** on cleanup
- **React 19 optimistic updates**
- **Lazy-loaded PQC crypto modules**

---

## 9. State Management

**Location:** `lib/stores/` (Zustand 5.0.10)

### Store Architecture

| Store          | Lines | Persistence                 | Actions |
| -------------- | ----- | --------------------------- | ------- |
| Device Store   | 100+  | Partial (favorites, recent) | 20+     |
| Transfer Store | 465   | None (ephemeral)            | 28      |

### Features

- **43 total actions** across stores
- **27 exported selectors** for granular access
- **Strict TypeScript** (no `any` types)
- **DevTools integration** for debugging
- **Optimistic updates** with rollback support
- **Selective subscriptions** for performance

---

## 10. Email System

**Location:** `lib/email/`, `lib/emails/` (9 files, ~2,350 lines)

### Modules

| File                    | Lines | Purpose                       |
| ----------------------- | ----- | ----------------------------- |
| email-service.ts        | 450   | Resend API integration        |
| file-transfer-email.tsx | 400   | React Email transfer template |
| email-storage.ts        | 380   | Transfer records, analytics   |
| retry-manager.ts        | 260   | Exponential backoff (1s→30s)  |
| password-protection.ts  | 210   | AES-256-GCM + scrypt KDF      |
| welcome-email.tsx       | 260   | Onboarding template           |

### Features

- **Batch operations:** 5 concurrent, max 50 recipients
- **Encryption:** AES-256-GCM, 32-byte salt, 16-byte IV
- **Retry:** Exponential backoff with ±10% jitter
- **Analytics:** Open/click/download rate tracking
- **Templates:** Responsive 600px, Tallow brand (#8B9A7D)

---

## 11. Monitoring & Observability

**Location:** `lib/monitoring/`, `lib/feature-flags/` (15+ files)

### Components

| Component          | Purpose                          |
| ------------------ | -------------------------------- |
| Prometheus         | 35+ metrics, 6 categories        |
| Plausible          | 30+ events, funnel tracking      |
| Sentry             | APM, transactions, PII scrubbing |
| LaunchDarkly       | 12 feature flags, React hooks    |
| Structured Logging | 5 levels, JSON, correlation IDs  |

### Health Endpoints

| Endpoint              | Purpose                    |
| --------------------- | -------------------------- |
| /api/health           | Basic liveness             |
| /api/health/liveness  | Kubernetes liveness probe  |
| /api/health/readiness | Kubernetes readiness probe |
| /api/health/detailed  | Component diagnostics      |

### Alerting

- **6 alert groups** with 20+ rules
- **Receivers:** Slack, PagerDuty, Email
- **Categories:** Availability, Performance, Transfer, Connection, Security

---

## 12. Utilities & Types

**Location:** `lib/utils/`, `lib/types/` (24 modules, 200+ functions)

### Utility Modules (20)

- accessibility, api-key-manager, cache-management
- cleanup-manager, clipboard, console-cleanup
- device-converters, device-detection, error-handling
- factory-functions, secure-fetch, file-utils
- focus-management, image-optimization, memory-monitor
- performance-metrics, pii-scrubber, secure-logger, uuid-generator

### Type Modules (4)

- messaging-types (WebRTC signaling)
- shared-types (Result types, PQC, errors)
- type-guards (Runtime validation)
- utility-types (TypeScript utilities)

### Key Utilities

- **Error handling** with discriminated unions
- **PII scrubber** for security logging
- **Memory monitor** with leak detection
- **Focus trapping** for accessibility
- **CSRF-protected fetch** wrapper
- **RFC 4122 UUID** generation

---

## 13. Build & Configuration

### Package Configuration

| Metric                   | Value |
| ------------------------ | ----- |
| NPM Scripts              | 62    |
| Production Dependencies  | 26    |
| Development Dependencies | 30    |
| TypeScript Strict Flags  | 16+   |

### Key Config Files

| File                 | Purpose                        |
| -------------------- | ------------------------------ |
| next.config.ts       | CSP, HSTS, WASM, optimizations |
| tsconfig.json        | 100% strict TypeScript         |
| playwright.config.ts | 9 browser configs, 90s timeout |
| vitest.config.ts     | 80% coverage thresholds        |
| eslint.config.mjs    | 20+ a11y, 9 security rules     |

### Security Headers

- **HSTS:** 2-year max-age, preload
- **CSP:** Strict, upgrade-insecure-requests
- **X-Frame-Options:** DENY
- **Permissions-Policy:** Restrictive

### Environment Variables

Required for production:

- `API_SECRET_KEY` - API authentication
- `RESEND_API_KEY` - Email service
- `AWS_*` - S3 storage
- `NEXT_PUBLIC_TURN_*` - WebRTC relay
- `STRIPE_*` - Payment processing
- `NEXT_PUBLIC_PLAUSIBLE_*` - Analytics

---

## 14. File Reference

### Directory Structure

```
lib/
├── crypto/          (18 files) - Cryptography
├── transfer/        (16 files) - File transfer
├── privacy/         (7 files)  - Privacy features
├── transport/       (7 files)  - Network transport
├── rooms/           (4 files)  - Room system
├── discovery/       (5 files)  - Device discovery
├── signaling/       (4 files)  - WebRTC signaling
├── webrtc/          (4 files)  - WebRTC management
├── hooks/           (25 files) - React hooks
├── stores/          (3 files)  - Zustand stores
├── email/           (7 files)  - Email service
├── emails/          (2 files)  - Email templates
├── monitoring/      (10 files) - Observability
├── feature-flags/   (3 files)  - LaunchDarkly
├── utils/           (20 files) - Utilities
└── types/           (4 files)  - TypeScript types

app/
├── api/             (24 routes) - API endpoints
├── layout.tsx       - Root layout
├── page.tsx         - Landing page
└── app/page.tsx     - Main app page
```

### Total Metrics

| Metric               | Count    |
| -------------------- | -------- |
| TypeScript/TSX Files | 200+     |
| Lines of Code        | ~50,000+ |
| React Hooks          | 25       |
| API Endpoints        | 24       |
| Crypto Algorithms    | 8+       |
| Prometheus Metrics   | 35+      |
| Feature Flags        | 12       |
| NPM Dependencies     | 56       |

---

## Summary

Tallow represents a comprehensive implementation of:

1. **Post-Quantum Cryptography** - ML-KEM-768 + X25519 hybrid, future-proof
   against quantum attacks
2. **Privacy-First Architecture** - IP masking, metadata stripping, onion
   routing
3. **Resilient Transfers** - Resumable, group, and adaptive bitrate support
4. **Production Security** - CSRF, rate limiting, timing-safe comparisons
5. **Full Observability** - Prometheus, Plausible, Sentry, structured logging
6. **Modern Stack** - Next.js 16, React 19, TypeScript strict mode

**Documentation compiled from 12 specialized agents analyzing the complete
codebase.**
