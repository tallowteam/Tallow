# Tallow Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TALLOW ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   Browser    │     │   Browser    │     │   Browser    │                │
│  │   (Sender)   │     │  (Receiver)  │     │   (Relay)    │                │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘                │
│         │                    │                    │                         │
│         │  WebRTC P2P (Encrypted)                 │                         │
│         └────────────────────┴────────────────────┘                         │
│                              │                                               │
│                    ┌─────────▼─────────┐                                    │
│                    │  Signaling Server │                                    │
│                    │   (Socket.IO)     │                                    │
│                    └─────────┬─────────┘                                    │
│                              │                                               │
│         ┌────────────────────┼────────────────────┐                         │
│         │                    │                    │                         │
│  ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐                   │
│  │   Next.js   │     │    Redis    │     │    NGINX    │                   │
│  │   App       │     │   (Cache)   │     │   (Proxy)   │                   │
│  └──────┬──────┘     └─────────────┘     └──────┬──────┘                   │
│         │                                        │                          │
│  ┌──────▼─────────────────────────────────────────▼──────┐                  │
│  │                    External Services                   │                  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │                  │
│  │  │ Resend  │  │ Stripe  │  │  TURN   │  │ Sentry  │  │                  │
│  │  │ (Email) │  │(Payment)│  │ Server  │  │ (Logs)  │  │                  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │                  │
│  └───────────────────────────────────────────────────────┘                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend (Next.js)

```
┌─────────────────────────────────────────────────────────────┐
│                     NEXT.JS APPLICATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │      Pages       │  │    Components     │                 │
│  │  ┌────────────┐  │  │  ┌────────────┐  │                 │
│  │  │ Landing    │  │  │  │ Transfer   │  │                 │
│  │  │ App        │  │  │  │ Chat       │  │                 │
│  │  │ Share      │  │  │  │ Devices    │  │                 │
│  │  │ Docs       │  │  │  │ UI         │  │                 │
│  │  └────────────┘  │  │  └────────────┘  │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │      Hooks       │  │      Lib          │                 │
│  │  ┌────────────┐  │  │  ┌────────────┐  │                 │
│  │  │ useTransfer│  │  │  │ Crypto     │  │                 │
│  │  │ useP2P     │  │  │  │ WebRTC     │  │                 │
│  │  │ useChat    │  │  │  │ Storage    │  │                 │
│  │  │ usePQC     │  │  │  │ i18n       │  │                 │
│  │  └────────────┘  │  │  └────────────┘  │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Transport Security                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  TLS 1.3 │ HTTPS │ WSS │ Certificate Pinning       │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│  Layer 2: Post-Quantum Cryptography                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ML-KEM-768 │ X25519 │ Hybrid Key Exchange         │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│  Layer 3: File Encryption                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  AES-256-GCM │ Per-file Keys │ Chunked Encryption  │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│  Layer 4: Authentication                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  CSRF Tokens │ API Keys │ Rate Limiting │ CORS     │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│  Layer 5: Privacy                                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Metadata Stripping │ No Logging │ E2E Encryption  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3. Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    FILE TRANSFER FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SENDER                           RECEIVER                   │
│    │                                  │                      │
│    │  1. Select Files                 │                      │
│    ├──────────────────────►           │                      │
│    │                                  │                      │
│    │  2. Generate Room Code           │                      │
│    │  ◄──────────────────────         │                      │
│    │                                  │                      │
│    │  3. Share Code ──────────────────┤                      │
│    │                                  │                      │
│    │  4. WebRTC Connection            │                      │
│    │◄─────────────────────────────────►                      │
│    │     (via Signaling Server)       │                      │
│    │                                  │                      │
│    │  5. PQC Key Exchange             │                      │
│    │◄─────────────────────────────────►                      │
│    │     (ML-KEM-768 + X25519)        │                      │
│    │                                  │                      │
│    │  6. Encrypt & Stream Files       │                      │
│    ├──────────────────────────────────►                      │
│    │     (AES-256-GCM chunks)         │                      │
│    │                                  │                      │
│    │  7. Verify & Reassemble          │                      │
│    │                           ───────►                      │
│    │                                  │                      │
│    │  8. Complete                     │                      │
│    │◄─────────────────────────────────┤                      │
│    │                                  │                      │
└─────────────────────────────────────────────────────────────┘
```

### 4. Deployment Architecture (Synology NAS)

```
┌─────────────────────────────────────────────────────────────┐
│                 SYNOLOGY NAS DEPLOYMENT                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Internet                                                    │
│      │                                                       │
│      ▼                                                       │
│  ┌──────────────┐                                           │
│  │  Cloudflare  │  (DNS + CDN + DDoS Protection)            │
│  │   Tunnel     │                                           │
│  └──────┬───────┘                                           │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SYNOLOGY NAS (Docker)                   │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │               docker-compose                 │    │    │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐     │    │    │
│  │  │  │ NGINX   │  │ Tallow  │  │Signaling│     │    │    │
│  │  │  │ :80/443 │──│ :3000   │──│ :3001   │     │    │    │
│  │  │  └─────────┘  └─────────┘  └─────────┘     │    │    │
│  │  │       │                          │          │    │    │
│  │  │       ▼                          │          │    │    │
│  │  │  ┌─────────┐              ┌─────────┐      │    │    │
│  │  │  │ Redis   │              │ Coturn  │      │    │    │
│  │  │  │ :6379   │              │ :3478   │      │    │    │
│  │  │  └─────────┘              └─────────┘      │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  Volume Mounts:                                      │    │
│  │  - /volume1/docker/tallow → /app                    │    │
│  │  - /volume1/docker/redis → /data                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5. API Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API ENDPOINTS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Public Endpoints (No Auth)                                  │
│  ├── GET  /api/health          → Liveness probe             │
│  ├── GET  /api/ready           → Readiness probe            │
│  └── GET  /api/csrf-token      → CSRF token generation      │
│                                                              │
│  Protected Endpoints (API Key + CSRF)                        │
│  ├── POST /api/v1/send-welcome      → Welcome email         │
│  ├── POST /api/v1/send-share-email  → Share notification    │
│  ├── POST /api/v1/send-file-email   → File transfer email   │
│  └── GET  /api/v1/download-file     → Secure download       │
│                                                              │
│  Payment Endpoints (CSRF + Signature)                        │
│  ├── POST /api/v1/stripe/create-checkout-session            │
│  └── POST /api/v1/stripe/webhook    → Stripe events         │
│                                                              │
│  Email Transfer Endpoints (CSRF + Rate Limited)              │
│  ├── POST /api/email/send           → Single transfer       │
│  ├── POST /api/email/batch          → Batch transfer        │
│  ├── GET  /api/email/download/[id]  → Download file         │
│  ├── GET  /api/email/status/[id]    → Delivery status       │
│  └── POST /api/email/webhook        → Resend events         │
│                                                              │
│  Room Management (Rate Limited)                              │
│  ├── GET    /api/rooms              → List rooms            │
│  ├── POST   /api/rooms              → Create room           │
│  ├── DELETE /api/rooms              → Delete room           │
│  └── OPTIONS /api/rooms             → CORS preflight        │
│                                                              │
│  Internal Endpoints (Cron Secret)                            │
│  └── POST /api/cron/cleanup         → Scheduled cleanup     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6. Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MONITORING STACK                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Tallow    │────►│ Prometheus  │────►│   Grafana   │   │
│  │  /metrics   │     │   Scraper   │     │  Dashboard  │   │
│  └─────────────┘     └─────────────┘     └─────────────┘   │
│                                                              │
│  Metrics Exposed:                                            │
│  ├── HTTP request count (by status, method, path)           │
│  ├── HTTP request duration (histogram)                      │
│  ├── Active WebSocket connections                           │
│  ├── File transfers (count, size, duration)                 │
│  ├── PQC operations (key exchanges, encryptions)            │
│  └── System metrics (CPU, memory, uptime)                   │
│                                                              │
│  Alerts:                                                     │
│  ├── High error rate (>5% for 5 minutes)                    │
│  ├── High latency (P95 > 2s for 5 minutes)                  │
│  ├── Pod restarts (>3 in 1 hour)                            │
│  ├── Memory usage (>85% of limit)                           │
│  └── Signaling server down (>2 minutes)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Encryption | ML-KEM-768, X25519, AES-256-GCM |
| Realtime | WebRTC, Socket.IO |
| Backend | Next.js API Routes |
| Email | Resend |
| Payments | Stripe |
| Deployment | Docker, Docker Compose |
| Reverse Proxy | NGINX |
| Caching | Redis |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus, Grafana, Sentry |

## Security Compliance

- **Encryption**: Post-Quantum Cryptography (NIST PQC standards)
- **Transport**: TLS 1.3 with strong cipher suites
- **Authentication**: API keys, CSRF tokens, webhook signatures
- **Rate Limiting**: Per-IP rate limiting on all endpoints
- **Headers**: Full security headers (CSP, HSTS, X-Frame-Options)
- **Logging**: Sanitized logging with PII scrubbing
- **Privacy**: GDPR-compliant, no tracking, metadata stripping
