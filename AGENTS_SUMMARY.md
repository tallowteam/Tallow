# Tallow AI Agents & Automation - Quick Reference

This is a condensed summary of all automation and agents in the Tallow codebase. For complete details, see [AGENTS_CATALOG_ADDITION.md](./AGENTS_CATALOG_ADDITION.md).

---

## Agent Inventory

### Web Workers (2)
| Agent | Location | Purpose |
|-------|----------|---------|
| **Crypto Worker** | `lib/workers/crypto.worker.ts` | Offload heavy crypto operations (AES, PBKDF2, SHA-256) |
| **Service Worker** | `public/service-worker.js` | PWA caching, offline support, asset management |

### Manager Classes (15+)
| Agent | Location | Purpose |
|-------|----------|---------|
| **PQCTransferManager** | `lib/transfer/pqc-transfer-manager.ts` | Post-quantum secure file transfers |
| **ConnectionManager** | `lib/signaling/connection-manager.ts` | P2P WebRTC connection establishment |
| **KeyRotationManager** | `lib/security/key-rotation.ts` | Automatic session key rotation |
| **EmailRetryManager** | `lib/email/retry-manager.ts` | Exponential backoff email retries |
| **GroupTransferManager** | `lib/transfer/group-transfer-manager.ts` | Multi-peer file broadcasting |
| **ResumableTransferManager** | `lib/transfer/resumable-transfer.ts` | Pause/resume large transfers |
| **ChatManager** | `lib/chat/chat-manager.ts` | Encrypted P2P messaging |
| **RateLimiter** | `lib/middleware/rate-limit.ts` | API request rate limiting |
| **ScreenSharingManager** | `lib/webrtc/screen-sharing.ts` | Screen/window capture |
| **TransferRoomManager** | `lib/rooms/transfer-room-manager.ts` | Temporary transfer rooms |
| **DataChannelManager** | `lib/webrtc/data-channel.ts` | WebRTC data channel management |
| **RelayRoutingManager** | `lib/privacy/relay-routing.ts` | Privacy-preserving routing |
| **EphemeralKeyManager** | `lib/crypto/key-management.ts` | Temporary key lifecycle |
| **GroupDiscoveryManager** | `lib/discovery/group-discovery-manager.ts` | Multi-device discovery |
| **MessageReactionsManager** | `lib/chat/chat-features.ts` | Chat message reactions |

### Automation Scripts (7)
| Script | Location | Purpose |
|--------|----------|---------|
| **Bundle Size Checker** | `scripts/check-bundle-size.js` | Validate bundle sizes |
| **Performance Tester** | `scripts/performance-test.js` | Bundle, memory, transfer, vitals testing |
| **Security Scanner** | `scripts/security-check.js` | Detect vulnerabilities (secrets, eval, etc.) |
| **Security Verifier** | `scripts/verify-security-features.ts` | Test security implementations |
| **Baseline Generator** | `scripts/generate-baseline.js` | Create performance baselines |
| **Health Checker** | `scripts/health-check.sh` | Service health validation |
| **Deploy Scripts** | `scripts/deploy-*.sh` | Automated deployment |

### CI/CD Workflows (3)
| Workflow | Location | Purpose |
|----------|----------|---------|
| **CI/CD Pipeline** | `.github/workflows/ci.yml` | Lint, test, build, security, deploy |
| **Performance Testing** | `.github/workflows/performance.yml` | Bundle size, Lighthouse audits |
| **Type Check** | `.github/workflows/type-check.yml` | TypeScript validation |

### Git Hooks (2)
| Hook | Location | Purpose |
|------|----------|---------|
| **pre-commit** | `.husky/pre-commit` | Lint-staged, ESLint, TypeScript |
| **pre-push** | `.husky/pre-push` | Full type check |

### Monitoring Agents (3)
| Agent | Location | Purpose |
|-------|----------|---------|
| **Prometheus Metrics** | `lib/monitoring/metrics.ts` | Application metrics collection |
| **Plausible Analytics** | `lib/monitoring/plausible.ts` | Privacy-focused analytics |
| **Sentry Integration** | `lib/monitoring/sentry.ts` | Error tracking |

### Security Agents (3)
| Agent | Location | Purpose |
|-------|----------|---------|
| **Memory Wiper** | `lib/security/memory-wiper.ts` | Secure memory cleanup |
| **Timing Safe** | `lib/security/timing-safe.ts` | Prevent timing attacks |
| **Credential Encryption** | `lib/security/credential-encryption.ts` | Encrypt stored credentials |

---

## Quick Start Guide

### Using the Crypto Worker

```typescript
import { cryptoWorker } from '@/lib/crypto/crypto-worker-client';

// Encrypt
const { ciphertext, nonce } = await cryptoWorker.encrypt(data, key);

// Decrypt
const plaintext = await cryptoWorker.decrypt(ciphertext, key, nonce);
```

### Using Service Worker

```typescript
import { useServiceWorker } from '@/lib/hooks/use-service-worker';

const { clearCache, preloadPQCChunks } = useServiceWorker();
```

### Using Key Rotation

```typescript
import { KeyRotationManager } from '@/lib/security/key-rotation';

const manager = new KeyRotationManager({
  rotationIntervalMs: 300000, // 5 minutes
  enableAutoRotation: true
});

const keys = manager.initialize(sharedSecret);
manager.onRotation((newKeys) => {
  // Handle rotation
});
```

### Using Rate Limiter

```typescript
import { moderateRateLimiter } from '@/lib/middleware/rate-limit';

export async function POST(request: NextRequest) {
  const limitResponse = moderateRateLimiter.check(request);
  if (limitResponse) return limitResponse; // 429

  // Process request
}
```

### Running Automation Scripts

```bash
# Performance
npm run perf:bundle      # Bundle size analysis
npm run perf:full        # Full performance suite
npm run perf:ci          # Lighthouse CI

# Security
npm run security:check   # Security scanner
npm run security:audit   # npm audit

# Testing
npm run test:unit        # Unit tests
npm run test             # E2E tests
```

---

## Metrics Categories

### Transfer Metrics
- `transfersTotal` - Total transfers by status/method
- `bytesTransferred` - Total bytes sent/received
- `transferDuration` - Transfer completion time
- `transferSpeed` - Transfer speed in Mbps

### PQC Metrics
- `pqcOperations` - Crypto operations count
- `pqcDuration` - Operation duration
- `pqcKeyExchanges` - Key exchanges by algorithm

### WebRTC Metrics
- `webrtcConnections` - Connection attempts
- `activeConnections` - Currently active
- `connectionDuration` - Establishment time

### Error Metrics
- `errorsTotal` - Errors by type/severity
- `apiErrors` - API errors by endpoint

### Privacy Metrics
- `metadataStripped` - Files with metadata removed
- `turnRelayUsage` - TURN relay connections

---

## Performance Thresholds

### Bundle Sizes
```
Main Bundle:  150 KB
Total JS:     800 KB
Total Fonts:  200 KB
Total CSS:    100 KB
```

### Memory
```
Idle:   100 MB
Active: 250 MB
Peak:   500 MB
```

### Web Vitals
```
LCP:  < 2.5s
FID:  < 100ms
CLS:  < 0.1
FCP:  < 2.0s
TTFB: < 600ms
```

### Transfer Speed
```
Minimum:  1 MB/s
Target:   5 MB/s
```

---

## Rate Limiter Presets

```typescript
strictRateLimiter:    3 requests/minute
moderateRateLimiter:  5 requests/minute
generousRateLimiter:  10 requests/minute
apiRateLimiter:       100 requests/minute
```

---

## CI/CD Pipeline Jobs

### CI Workflow (`ci.yml`)
1. **Lint & Type Check** (10 min)
2. **Unit Tests** (15 min)
3. **E2E Tests - Matrix** (30 min)
   - Chromium
   - Firefox
4. **Build Docker Images** (20 min)
   - Main app
   - Signaling server
5. **Security Scan** (10 min)
   - npm audit
   - Trivy scanner
6. **Deploy to Production** (15 min)
   - Only on main branch
   - SSH to NAS
   - Health checks

### Performance Workflow (`performance.yml`)
1. **Performance Tests** (20 min)
   - Bundle size
   - Transfer speed
   - Web Vitals
2. **Lighthouse CI** (30 min)
   - Full audits
   - Performance budgets
3. **Summary** (5 min)
   - Aggregate results

---

## Security Scanner Checks

### Critical
- Math.random() in crypto code
- Hardcoded secrets/credentials
- eval() usage
- new Function() usage

### High
- dangerouslySetInnerHTML without sanitization

### Medium
- console.log in production
- Timing-unsafe comparisons in crypto
- Missing memory cleanup

### Low
- Insecure imports

---

## Common Workflows

### Secure File Transfer
```
ConnectionManager → PQCTransferManager → CryptoWorker
         ↓
KeyRotationManager (auto-rotate every 5 min)
         ↓
MetricsAgent (record stats)
```

### Email Fallback
```
P2P Failed → EmailService → EmailRetryManager
                                   ↓
                            Exponential Backoff
                                   ↓
                            Retry (1s → 2s → 4s)
```

### PWA Offline
```
ServiceWorker → Cache Assets → IndexedDB
      ↓
Serve Offline → Resume on Online
```

---

## Troubleshooting

### Worker Not Loading
```typescript
// Use URL constructor with import.meta.url
new Worker(new URL('../workers/crypto.worker.ts', import.meta.url))
```

### Service Worker Not Updating
```typescript
const reg = await navigator.serviceWorker.getRegistration();
await reg.update();
```

### Rate Limit Debug
```typescript
const stats = rateLimiter.getStats(request);
console.log(stats); // { count, remaining, resetTime }
```

---

## Architecture Layers

```
┌─────────────────────────────────────┐
│       User Interface                 │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       Manager Layer                  │
│  Connection | Transfer | Security    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Background Workers                │
│  Crypto | Service Worker             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Automation & Monitoring             │
│  Metrics | Rate Limit | Retry        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       CI/CD Pipeline                 │
│  GitHub Actions | Git Hooks          │
└─────────────────────────────────────┘
```

---

## npm Scripts Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server

# Quality
npm run lint             # ESLint
npm run type-check       # TypeScript check
npm run quality          # Type-check + Lint

# Performance
npm run perf:bundle      # Bundle size
npm run perf:memory      # Memory profiling
npm run perf:transfer    # Transfer speed
npm run perf:vitals      # Web Vitals
npm run perf:full        # All tests
npm run perf:lighthouse  # Lighthouse (manual)
npm run perf:ci          # Lighthouse CI

# Testing
npm run test:unit        # Unit tests (Vitest)
npm run test:crypto      # Crypto tests only
npm run test             # E2E tests (Playwright)
npm run test:ui          # Playwright UI mode
npm run test:headed      # Headed browser tests

# Security
npm run security:check   # Security scanner
npm run security:audit   # npm audit
npm run security:full    # Both checks

# Metrics
npm run metrics          # View Prometheus metrics
npm run metrics:watch    # Auto-refresh metrics

# Docs
npm run docs             # Generate TypeDoc
npm run docs:watch       # Watch mode
npm run docs:serve       # Serve docs
```

---

## File Locations Reference

### Web Workers
- `lib/workers/crypto.worker.ts`
- `lib/crypto/crypto-worker-client.ts`
- `public/service-worker.js`
- `lib/pwa/service-worker-registration.ts`

### Core Managers
- `lib/transfer/pqc-transfer-manager.ts`
- `lib/signaling/connection-manager.ts`
- `lib/security/key-rotation.ts`
- `lib/email/retry-manager.ts`
- `lib/middleware/rate-limit.ts`

### Scripts
- `scripts/check-bundle-size.js`
- `scripts/performance-test.js`
- `scripts/security-check.js`
- `scripts/verify-security-features.ts`

### CI/CD
- `.github/workflows/ci.yml`
- `.github/workflows/performance.yml`
- `.husky/pre-commit`
- `.husky/pre-push`

### Monitoring
- `lib/monitoring/metrics.ts`
- `lib/monitoring/plausible.ts`
- `lib/monitoring/sentry.ts`

---

**For complete documentation, see**: [AGENTS_CATALOG_ADDITION.md](./AGENTS_CATALOG_ADDITION.md)

**Last Updated**: 2026-01-26
