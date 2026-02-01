# AI Agents & Automation

This section documents all automated agents, managers, workers, and automation tools in the Tallow codebase.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Web Workers](#web-workers)
3. [Manager Classes](#manager-classes)
4. [Service Workers](#service-workers)
5. [Automation Scripts](#automation-scripts)
6. [CI/CD Automation](#cicd-automation)
7. [Git Hooks](#git-hooks)
8. [Monitoring & Metrics](#monitoring--metrics)
9. [Security Automation](#security-automation)
10. [Use Cases & Workflows](#use-cases--workflows)

---

## Architecture Overview

Tallow employs a multi-layered automation architecture:

```
┌─────────────────────────────────────────────────────┐
│                 User Interface                       │
└─────────────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────────────┐
│              Manager Layer                           │
│  - Connection Manager                                │
│  - Transfer Managers (PQC, Group, Resumable)         │
│  - Key Rotation Manager                              │
│  - Chat Manager                                      │
│  - Room Manager                                      │
└─────────────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────────────┐
│           Background Workers                         │
│  - Crypto Web Worker                                 │
│  - Service Worker (PWA/Caching)                      │
└─────────────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────────────┐
│         Automation & Monitoring                      │
│  - Metrics Collection                                │
│  - Rate Limiting                                     │
│  - Email Retry Logic                                 │
│  - Security Scanners                                 │
└─────────────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────────────┐
│              CI/CD Pipeline                          │
│  - GitHub Actions                                    │
│  - Git Hooks (Husky)                                 │
│  - Performance Testing                               │
└─────────────────────────────────────────────────────┘
```

---

## Web Workers

### 1. Crypto Web Worker

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\workers\crypto.worker.ts`

**Purpose**: Offloads heavy cryptographic operations to a background thread to keep the main UI responsive.

**Capabilities**:
- AES-256-GCM encryption/decryption
- SHA-256 hashing
- PBKDF2 key derivation
- Random number generation

**Input/Output Format**:
```typescript
// Input Message
interface CryptoWorkerMessage {
  type: 'encrypt' | 'decrypt' | 'hash' | 'derive-key';
  id: string;
  payload: {
    data?: ArrayBuffer;
    key?: ArrayBuffer;
    nonce?: ArrayBuffer;
    password?: string;
    salt?: ArrayBuffer;
  };
}

// Output
{
  id: string;
  success: boolean;
  result?: ArrayBuffer | { ciphertext: ArrayBuffer; nonce: ArrayBuffer };
  error?: string;
}
```

**When to Use**:
- File encryption/decryption operations
- Password-based key derivation
- Computing file hashes
- Any cryptographic operation that might block the UI

**Example Usage**:
```typescript
import { cryptoWorker } from '@/lib/crypto/crypto-worker-client';

// Encrypt data
const { ciphertext, nonce } = await cryptoWorker.encrypt(data, key);

// Decrypt data
const plaintext = await cryptoWorker.decrypt(ciphertext, key, nonce);

// Hash data
const hash = await cryptoWorker.hash(data);

// Derive key from password
const key = await cryptoWorker.deriveKey(password, salt);
```

**Client Interface**: `C:\Users\aamir\Documents\Apps\Tallow\lib\crypto\crypto-worker-client.ts`

---

### 2. Service Worker (PWA Agent)

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\public\service-worker.js`

**Purpose**: Provides offline support and intelligent caching for the PWA.

**Capabilities**:
- Cache-first strategy for static assets
- Network-first strategy for API calls and HTML
- Stale-while-revalidate for PQC chunks
- Automatic cache cleanup
- Offline fallback pages

**Caching Strategies**:
```javascript
Static Assets:    Cache-first with network fallback
PQC Chunks:       Stale-while-revalidate (performance)
API Calls:        Network-first with cache fallback
HTML Pages:       Network-first (ensure latest content)
```

**Cache Structure**:
- `tallow-static-v1`: Static assets (HTML, icons, manifest)
- `tallow-dynamic-v1`: Dynamic content (pages, routes)
- `tallow-pqc-v1`: Post-quantum crypto chunks
- `tallow-api-v1`: API responses

**When to Use**:
- Automatically active for all PWA installations
- Message-based control for cache management

**Example Usage**:
```typescript
import { useServiceWorker } from '@/lib/hooks/use-service-worker';

const {
  isSupported,
  isRegistered,
  isOnline,
  updateServiceWorker,
  clearCache,
  preloadPQCChunks
} = useServiceWorker();

// Clear all caches
await clearCache();

// Preload PQC chunks for offline use
preloadPQCChunks();

// Update to new service worker version
updateServiceWorker();
```

**Registration**: `C:\Users\aamir\Documents\Apps\Tallow\lib\pwa\service-worker-registration.ts`

---

## Manager Classes

### 1. PQC Transfer Manager

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\transfer\pqc-transfer-manager.ts`

**Type**: Transfer Orchestration Agent

**Purpose**: Manages secure file transfers with hybrid post-quantum cryptography.

**Capabilities**:
- Hybrid PQC key exchange (Kyber + X25519)
- Chunked file transfer with encryption
- Traffic obfuscation
- Transfer status tracking
- Automatic retry on failure

**Key Methods**:
```typescript
class PQCTransferManager {
  // Initialize session
  initialize(sessionId: string, mode: 'send' | 'receive'): Promise<void>

  // Send file
  sendFile(file: File): Promise<void>

  // Receive file
  receiveFile(): Promise<File>

  // Handle key exchange
  exchangeKeys(peerPublicKey: HybridPublicKey): Promise<void>
}
```

**When to Use**:
- All peer-to-peer file transfers
- Secure data exchange with quantum resistance
- Privacy-focused file sharing

---

### 2. Connection Manager

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\signaling\connection-manager.ts`

**Type**: P2P Connection Agent

**Purpose**: Handles WebRTC connection establishment using WebSocket signaling.

**Capabilities**:
- Generate memorable connection codes
- Encrypted signaling with derived keys
- Multi-peer connection support
- Connection pool management
- Automatic reconnection

**Connection Codes**:
- **Word Code**: `Red-Lion-Star` (3 memorable words)
- **Alpha Code**: `A7K9P2M8` (8-character alphanumeric)

**Key Methods**:
```typescript
class ConnectionManager {
  // Get connection codes
  getWordCode(): string
  getAlphaCode(): string

  // Start signaling
  startSignaling(events: ConnectionEvents): Promise<void>

  // Connect to peer
  connectToPeer(code: string): Promise<void>

  // Multi-peer connections
  connectToMultiplePeers(socketIds: string[]): Promise<MultiPeerConnectionResult>
}
```

**When to Use**:
- Establishing P2P connections
- WebRTC signaling and ICE candidate exchange
- Multi-device synchronization

---

### 3. Key Rotation Manager

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\security\key-rotation.ts`

**Type**: Security Agent

**Purpose**: Automatic session key rotation with forward secrecy.

**Capabilities**:
- HKDF-based key derivation
- Automatic time-based rotation (configurable)
- Forward secrecy (old keys wiped)
- Generation tracking
- State export/import for persistence

**Configuration**:
```typescript
interface KeyRotationConfig {
  rotationIntervalMs: number;  // Default: 5 minutes
  maxGenerations: number;      // Default: 100
  enableAutoRotation: boolean; // Default: true
}
```

**Key Methods**:
```typescript
class KeyRotationManager {
  // Initialize with shared secret
  initialize(baseSharedSecret: Uint8Array): RotatingSessionKeys

  // Manual rotation
  rotateKeys(): RotatingSessionKeys

  // Get current keys
  getCurrentKeys(): RotatingSessionKeys | null

  // Register callback for rotation events
  onRotation(callback: (keys: RotatingSessionKeys) => void): void

  // Export/import state
  exportState(): KeyRotationState | null
  importState(state: KeyRotationState): RotatingSessionKeys

  // Cleanup
  destroy(): void
}
```

**When to Use**:
- Long-lived encrypted sessions
- Automatic key refresh for security
- Forward secrecy requirements

---

### 4. Email Retry Manager

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\email\retry-manager.ts`

**Type**: Reliability Agent

**Purpose**: Implements exponential backoff retry logic for failed email deliveries.

**Capabilities**:
- Exponential backoff with jitter
- Configurable retry policies
- Retryable error detection
- Retry state tracking
- Automatic scheduling

**Default Policy**:
```typescript
{
  maxRetries: 3,
  initialDelayMs: 1000,      // 1 second
  maxDelayMs: 300000,        // 5 minutes
  backoffMultiplier: 2,      // Double each time
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNREFUSED',
    'ENOTFOUND',
    'Network error'
  ]
}
```

**Key Methods**:
```typescript
class EmailRetryManager {
  // Record failure and calculate retry
  recordFailure(emailId: string, error: Error): RetryState

  // Record success
  recordSuccess(emailId: string): void

  // Get retry state
  getRetryState(emailId: string): RetryState | undefined

  // Schedule retry with callback
  scheduleRetry(
    emailId: string,
    retryCallback: () => Promise<void>
  ): void

  // Cancel pending retries
  cancelRetries(emailId: string): void
}
```

**When to Use**:
- Email fallback transfers
- Any network operation requiring retry logic
- Resilient background tasks

---

### 5. Group Transfer Manager

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\transfer\group-transfer-manager.ts`

**Type**: Multi-Peer Coordination Agent

**Purpose**: Coordinates file transfers to multiple recipients simultaneously.

**Capabilities**:
- Parallel transfers to multiple peers
- Independent encryption per peer
- Progress aggregation
- Failure handling
- Bandwidth management

**When to Use**:
- Broadcasting files to multiple devices
- Team collaboration features
- Multi-device synchronization

---

### 6. Resumable Transfer Manager

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\transfer\resumable-transfer.ts`

**Type**: Transfer Resilience Agent

**Purpose**: Extends PQC transfers with resume capability after interruptions.

**Capabilities**:
- Transfer state persistence (IndexedDB)
- Chunk-level resume
- Progress restoration
- Automatic cleanup
- Transfer history tracking

**When to Use**:
- Large file transfers
- Unreliable network conditions
- User-initiated pause/resume

---

### 7. Chat Manager

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\chat\chat-manager.ts`

**Type**: Real-Time Communication Agent

**Purpose**: Manages encrypted P2P chat sessions.

**Capabilities**:
- End-to-end encrypted messaging
- Read receipts
- Typing indicators
- Message history
- Delivery status tracking

---

### 8. Rate Limiter

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\middleware\rate-limit.ts`

**Type**: API Protection Agent

**Purpose**: Prevents abuse by limiting request rates.

**Capabilities**:
- IP-based rate limiting
- Configurable windows and limits
- Custom key generators
- Automatic cleanup
- Standard rate limit headers

**Presets**:
```typescript
strictRateLimiter:    3 requests/minute
moderateRateLimiter:  5 requests/minute
generousRateLimiter:  10 requests/minute
apiRateLimiter:       100 requests/minute
```

**Example Usage**:
```typescript
import { moderateRateLimiter } from '@/lib/middleware/rate-limit';

export async function POST(request: NextRequest) {
  // Check rate limit
  const limitResponse = moderateRateLimiter.check(request);
  if (limitResponse) {
    return limitResponse; // 429 Too Many Requests
  }

  // Process request...
}
```

---

### 9. Screen Sharing Manager

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\webrtc\screen-sharing.ts`

**Type**: Media Capture Agent

**Purpose**: Manages screen and window capture for remote collaboration.

**Capabilities**:
- Full screen capture
- Window/tab capture
- Audio capture
- Quality presets (low/medium/high)
- Automatic stream cleanup

---

### 10. Transfer Room Manager

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\rooms\transfer-room-manager.ts`

**Type**: Session Coordination Agent

**Purpose**: Manages temporary transfer rooms for group collaboration.

**Capabilities**:
- Room creation with unique codes
- Peer joining/leaving
- Room metadata management
- Automatic expiration
- Member discovery

---

## Service Workers

### PWA Service Worker

**Already documented above in Web Workers section**

**Additional Features**:
- **Periodic Sync**: Background updates when app is idle
- **Push Notifications**: Future feature for transfer completion
- **Background Fetch**: Large file downloads in background

---

## Automation Scripts

### 1. Bundle Size Checker

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\scripts\check-bundle-size.js`

**Type**: Build Automation

**Purpose**: Validates bundle sizes against defined limits.

**Thresholds**:
```javascript
{
  mainBundle: 150 KB,
  totalJS: 800 KB,
  totalFonts: 200 KB,
  totalCSS: 100 KB
}
```

**Usage**:
```bash
npm run build
npm run perf:test
```

**Output**: Colored terminal output with pass/fail status per bundle.

---

### 2. Performance Test Suite

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\scripts\performance-test.js`

**Type**: Performance Automation

**Purpose**: Comprehensive performance analysis and benchmarking.

**Test Suites**:

1. **Bundle Size Analysis**: Checks JS/CSS/font bundle sizes
2. **Memory Profiling**: Tracks heap usage over time
3. **Transfer Speed Benchmark**: Simulates file transfer operations
4. **Core Web Vitals**: Estimates LCP, FCP, CLS metrics

**Usage**:
```bash
# Run specific test
npm run perf:bundle
npm run perf:memory
npm run perf:transfer
npm run perf:vitals

# Run full suite
npm run perf:full
```

**Output**: JSON report saved to `performance-report.json`

**Thresholds**:
```javascript
{
  bundle: { mainBundle: 150KB, totalJS: 800KB },
  memory: { idle: 100MB, peak: 500MB },
  webVitals: { LCP: 2500ms, FID: 100ms, CLS: 0.1 },
  transfer: { minSpeed: 1MB/s, targetSpeed: 5MB/s }
}
```

---

### 3. Security Scanner

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\scripts\security-check.js`

**Type**: Security Automation

**Purpose**: Automated security vulnerability scanning.

**Checks**:
- **Math.random()** in crypto code (CRITICAL)
- **console.log** in production code (MEDIUM)
- **Hardcoded secrets/credentials** (CRITICAL)
- **Timing-safe comparisons** in crypto (MEDIUM)
- **eval() / new Function()** usage (CRITICAL)
- **dangerouslySetInnerHTML** (HIGH)
- **Memory cleanup** in crypto functions (MEDIUM)

**Usage**:
```bash
npm run security:check
```

**Output**: Categorized issues by severity (CRITICAL, HIGH, MEDIUM, LOW)

**Exit Codes**:
- `0`: No critical/high issues
- `1`: Critical or high-severity issues found

---

### 4. Security Features Verifier

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\scripts\verify-security-features.ts`

**Type**: Security Testing Automation

**Purpose**: Verifies security implementations are working correctly.

**Tests**:
1. **Memory Wiping**: Buffer/object wiping, secure wrappers
2. **Timing-Safe Comparisons**: Buffer, string, token comparisons
3. **Key Rotation**: Initialization, rotation, forward secrecy
4. **Credential Encryption**: Encrypt/decrypt, batch operations

**Performance Benchmarks**:
- Memory wipe (1MB): < 10ms
- Timing-safe compare: < 0.1ms per call
- Key rotation: < 5ms

**Usage**:
```bash
npx tsx scripts/verify-security-features.ts
```

---

### 5. Baseline Generator

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\scripts\generate-baseline.js`

**Type**: Performance Tracking Automation

**Purpose**: Creates baseline performance reports for regression testing.

**Usage**:
```bash
node scripts/generate-baseline.js [output-file]
```

**Output**: JSON baseline with metadata (timestamp, Node version, platform)

---

### 6. Deployment Scripts

**Locations**:
- `C:\Users\aamir\Documents\Apps\Tallow\scripts\deploy-dev.sh`
- `C:\Users\aamir\Documents\Apps\Tallow\scripts\deploy-prod.sh`
- `C:\Users\aamir\Documents\Apps\Tallow\scripts\deploy-k8s.sh`

**Type**: Deployment Automation

**Purpose**: Automated deployment to different environments.

**Features**:
- Environment validation
- Docker image building
- Service health checks
- Rollback on failure

---

### 7. Health Check Script

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\scripts\health-check.sh`

**Type**: Monitoring Automation

**Purpose**: Validates service health across all components.

**Checks**:
- HTTP endpoints responding
- Database connectivity
- WebSocket signaling server
- Cache availability

---

## CI/CD Automation

### 1. CI/CD Pipeline

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\.github\workflows\ci.yml`

**Type**: Continuous Integration/Deployment

**Jobs**:

#### Job 1: Lint & Type Check
- ESLint for code quality
- TypeScript type checking
- Timeout: 10 minutes

#### Job 2: Unit Tests
- Vitest unit tests
- Coverage reporting to Codecov
- Timeout: 15 minutes

#### Job 3: E2E Tests (Matrix)
- Playwright tests on Chromium and Firefox
- Parallel execution
- Artifact upload for test results
- Timeout: 30 minutes

#### Job 4: Build Docker Images
- Multi-stage Docker builds
- BuildKit caching
- Main app + Signaling server
- Timeout: 20 minutes

#### Job 5: Security Scan
- npm audit
- Trivy vulnerability scanner
- SARIF upload to GitHub Security
- Timeout: 10 minutes

#### Job 6: Deploy to Production
- **Trigger**: Push to main branch
- SSH deployment to NAS
- Docker Compose orchestration
- Health checks post-deployment
- Timeout: 15 minutes

**Optimizations**:
- **Concurrency Control**: Cancel in-progress runs on new push
- **Caching**: npm cache, Docker layer cache
- **Parallelization**: Matrix strategy for multi-browser testing

---

### 2. Performance Testing Pipeline

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\.github\workflows\performance.yml`

**Type**: Performance CI/CD

**Jobs**:

#### Job 1: Performance Tests
- Bundle size analysis
- Transfer speed benchmarks
- Web Vitals estimation
- Artifact upload
- Timeout: 20 minutes

#### Job 2: Lighthouse CI
- Full Lighthouse audits
- Performance budgets
- Accessibility checks
- Artifact upload
- Timeout: 30 minutes

#### Job 3: Performance Summary
- Aggregate results
- GitHub Step Summary
- Regression detection

**Triggers**:
- Push to main/develop
- Pull requests
- Manual workflow dispatch

---

### 3. Type Check Workflow

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\.github\workflows\type-check.yml`

**Type**: Type Safety CI

**Purpose**: Continuous TypeScript type checking.

---

## Git Hooks

### Pre-Commit Hook

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\.husky\pre-commit`

**Type**: Quality Gate

**Actions**:
1. Run `lint-staged` on staged files
2. ESLint with auto-fix
3. TypeScript type check (tsc-files)
4. Prettier formatting

**Configuration**:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "tsc-files --noEmit"],
    "*.{js,jsx,mjs}": ["eslint --fix"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

### Pre-Push Hook

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\.husky\pre-push`

**Type**: Safety Gate

**Actions**:
1. Full TypeScript type check
2. Prevent pushing code with type errors

---

## Monitoring & Metrics

### Prometheus Metrics Agent

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\monitoring\metrics.ts`

**Type**: Observability Agent

**Purpose**: Collects and exposes application metrics for monitoring.

**Metric Categories**:

#### 1. File Transfer Metrics
```typescript
transfersTotal        // Counter: Total transfers by status/method
bytesTransferred      // Counter: Total bytes sent/received
fileSizeHistogram     // Histogram: File size distribution
transferDuration      // Histogram: Transfer completion time
transferSpeed         // Histogram: Transfer speed (Mbps)
```

#### 2. PQC Metrics
```typescript
pqcOperations         // Counter: Crypto operations
pqcDuration           // Histogram: Operation duration
pqcKeyExchanges       // Counter: Key exchanges by algorithm
```

#### 3. WebRTC Metrics
```typescript
webrtcConnections     // Counter: Connection attempts
activeConnections     // Gauge: Currently active connections
connectionDuration    // Histogram: Connection establishment time
```

#### 4. Error Metrics
```typescript
errorsTotal           // Counter: Application errors by type/severity
apiErrors             // Counter: API errors by endpoint/status
```

#### 5. Privacy & Security Metrics
```typescript
metadataStripped      // Counter: Metadata stripping operations
turnRelayUsage        // Counter: TURN relay connections
```

#### 6. Feature Usage Metrics
```typescript
featureUsage          // Counter: Feature usage tracking
settingsChanges       // Counter: Settings modifications
```

#### 7. User Engagement Metrics
```typescript
activeUsers           // Gauge: Current active users
pageViews             // Counter: Page views by page/referrer
sessionDuration       // Histogram: Session duration
```

**Helper Functions**:
```typescript
recordTransfer(status, method, fileSize, duration, fileType?)
recordPQCOperation(operation, duration, status?, algorithm?)
recordWebRTCConnection(type, status, duration?)
recordError(type, severity, endpoint?, statusCode?)
recordFeatureUsage(feature)
```

**Endpoint**: `GET /api/metrics` (Prometheus format)

**Usage**:
```bash
# View metrics
npm run metrics

# Watch metrics (updates every 5s)
npm run metrics:watch
```

---

### Plausible Analytics Integration

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\monitoring\plausible.ts`

**Type**: Privacy-Focused Analytics Agent

**Purpose**: Tracks user behavior without cookies or personal data.

**Events Tracked**:
- Page views
- File transfers
- Feature usage
- Error occurrences

---

### Sentry Integration

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\monitoring\sentry.ts`

**Type**: Error Tracking Agent

**Purpose**: Captures and aggregates runtime errors.

**Features**:
- Source maps for debugging
- User context (anonymous)
- Performance monitoring
- Release tracking

---

## Security Automation

### 1. Memory Wiper

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\security\memory-wiper.ts`

**Type**: Security Agent

**Purpose**: Automatic memory cleanup for sensitive data.

**Methods**:
```typescript
memoryWiper.wipeBuffer(buffer: Uint8Array): void
memoryWiper.wipeObject(obj: object): void
memoryWiper.createWrapper(data: Uint8Array): SecureWrapper
```

**Auto-Wipe Pattern**:
```typescript
const wrapper = memoryWiper.createWrapper(secretKey);
try {
  // Use wrapper.data
} finally {
  wrapper.dispose(); // Auto-wipes
}
```

---

### 2. Timing-Safe Operations

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\security\timing-safe.ts`

**Type**: Security Agent

**Purpose**: Prevents timing attacks in cryptographic operations.

**Methods**:
```typescript
timingSafe.equal(a: Uint8Array, b: Uint8Array): boolean
timingSafe.stringCompare(a: string, b: string): boolean
timingSafe.tokenCompare(a: string, b: string): boolean
timingSafe.operation<T>(fn: () => Promise<T>, minDurationMs: number): Promise<T>
```

---

### 3. Credential Encryption

**Location**: `C:\Users\aamir\Documents\Apps\Tallow\lib\security\credential-encryption.ts`

**Type**: Security Agent

**Purpose**: Encrypts sensitive credentials in storage.

**Methods**:
```typescript
CredentialEncryption.encryptTurnCredentials(creds): Promise<EncryptedCredentials>
CredentialEncryption.decryptTurnCredentials(encrypted): Promise<TurnCredentials>
CredentialEncryption.migrateCredentials(batch): Promise<EncryptedCredentials[]>
```

---

## Use Cases & Workflows

### Use Case 1: Secure File Transfer

**Agents Involved**:
1. **Connection Manager**: Establishes P2P connection
2. **PQC Transfer Manager**: Orchestrates secure transfer
3. **Crypto Web Worker**: Performs encryption off main thread
4. **Key Rotation Manager**: Rotates session keys during transfer
5. **Metrics Agent**: Records transfer statistics

**Workflow**:
```
1. User initiates transfer
   ↓
2. ConnectionManager generates code
   ↓
3. Peer connects via code
   ↓
4. PQCTransferManager performs key exchange
   ↓
5. KeyRotationManager initializes session keys
   ↓
6. File chunked and encrypted in CryptoWorker
   ↓
7. Chunks transferred over WebRTC
   ↓
8. Keys rotated every 5 minutes
   ↓
9. Transfer complete, metrics recorded
```

---

### Use Case 2: Offline PWA Experience

**Agents Involved**:
1. **Service Worker**: Caches assets and PQC chunks
2. **PWA Registration**: Manages installation
3. **IndexedDB**: Stores transfer state

**Workflow**:
```
1. User installs PWA
   ↓
2. ServiceWorker caches static assets
   ↓
3. PQC chunks preloaded
   ↓
4. User goes offline
   ↓
5. ServiceWorker serves cached content
   ↓
6. Transfer state persisted in IndexedDB
   ↓
7. User goes online
   ↓
8. ServiceWorker revalidates caches
   ↓
9. Pending transfers resume
```

---

### Use Case 3: CI/CD Pipeline

**Agents Involved**:
1. **Git Hooks**: Pre-commit/pre-push validation
2. **GitHub Actions**: Automated testing and deployment
3. **Security Scanner**: Vulnerability detection
4. **Performance Tests**: Bundle size and speed checks

**Workflow**:
```
1. Developer commits code
   ↓
2. Pre-commit hook runs lint-staged
   ↓
3. Developer pushes to GitHub
   ↓
4. Pre-push hook runs type-check
   ↓
5. GitHub Actions triggered
   ↓
6. Parallel jobs: Lint, Unit Tests, E2E Tests
   ↓
7. Security scan with Trivy
   ↓
8. Docker images built and cached
   ↓
9. Performance tests run
   ↓
10. Deploy to production (if main branch)
    ↓
11. Health checks verify deployment
```

---

### Use Case 4: Email Fallback with Retry

**Agents Involved**:
1. **Email Service**: Sends transfer notification
2. **Email Retry Manager**: Handles failures
3. **Metrics Agent**: Tracks email delivery

**Workflow**:
```
1. P2P transfer fails (peer offline)
   ↓
2. Email fallback initiated
   ↓
3. Email service attempts send
   ↓
4. Network error occurs
   ↓
5. RetryManager records failure
   ↓
6. Exponential backoff calculated
   ↓
7. Retry scheduled (1s → 2s → 4s)
   ↓
8. Retry succeeds on 2nd attempt
   ↓
9. Success recorded, metrics updated
```

---

### Use Case 5: Performance Monitoring

**Agents Involved**:
1. **Metrics Agent**: Collects runtime metrics
2. **Performance Scripts**: Automated benchmarks
3. **Lighthouse CI**: Web vitals auditing

**Workflow**:
```
1. Application running in production
   ↓
2. MetricsAgent records all operations
   ↓
3. Prometheus scrapes /api/metrics
   ↓
4. Grafana visualizes metrics
   ↓
5. GitHub Actions runs performance tests
   ↓
6. Baseline comparison detects regression
   ↓
7. Alert triggered if thresholds exceeded
```

---

## Integration Points

### Key Integration Patterns

1. **Manager → Worker Pattern**
   - Managers delegate heavy work to Web Workers
   - Example: PQCTransferManager → CryptoWorker

2. **Manager → Manager Coordination**
   - Managers communicate through events
   - Example: ConnectionManager → TransferManager

3. **Script → CI/CD Pipeline**
   - Scripts called by GitHub Actions
   - Example: performance-test.js → performance.yml

4. **Hook → Script Validation**
   - Git hooks run validation scripts
   - Example: pre-commit → lint-staged

5. **Metrics → Monitoring Stack**
   - Metrics exported to external systems
   - Example: PrometheusMetrics → Grafana

---

## Performance Characteristics

### Web Workers
- **Overhead**: ~5-10ms for worker initialization
- **Throughput**: Can process multiple crypto operations in parallel
- **Memory**: Isolated heap, doesn't block main thread

### Service Worker
- **Cache Hit Rate**: Typically >95% for static assets
- **Startup Time**: ~100-200ms for cache lookup
- **Storage**: Unlimited quota for installed PWAs

### Managers
- **Connection Establishment**: 1-5 seconds (depends on network)
- **Key Rotation**: <5ms per rotation
- **Transfer Speed**: 5-50 MB/s (network dependent)

### Automation Scripts
- **Security Scan**: 5-30 seconds (codebase size)
- **Bundle Size Check**: 1-5 seconds
- **Performance Suite**: 2-10 minutes (full suite)

---

## Best Practices

### When to Create a New Agent

Create a new manager/agent when:
1. **Complex State Management**: Feature requires significant state tracking
2. **Lifecycle Management**: Resources need proper initialization/cleanup
3. **Event Coordination**: Multiple components need to communicate
4. **Background Processing**: Work should be done off main thread
5. **Retry Logic**: Operation may fail and needs resilience

### Agent Design Guidelines

1. **Single Responsibility**: Each agent has one clear purpose
2. **Clean Interfaces**: Clear input/output contracts
3. **Error Handling**: Graceful degradation on failure
4. **Memory Management**: Proper cleanup in destroy() methods
5. **Event-Driven**: Use callbacks/events for loose coupling

### Testing Automation

1. **Unit Tests**: Test individual agent methods
2. **Integration Tests**: Test agent coordination
3. **E2E Tests**: Test complete workflows
4. **Performance Tests**: Benchmark critical paths

---

## Troubleshooting

### Common Issues

#### Web Worker Not Loading
```typescript
// Check worker initialization
const worker = new Worker(
  new URL('../workers/crypto.worker.ts', import.meta.url),
  { type: 'module' }
);
```

#### Service Worker Not Updating
```typescript
// Force update
const registration = await navigator.serviceWorker.getRegistration();
await registration.update();
```

#### Manager State Desync
```typescript
// Always use exportState/importState for persistence
const state = manager.exportState();
localStorage.setItem('manager-state', JSON.stringify(state));
```

---

## Future Enhancements

### Planned Agents

1. **AI Transfer Optimizer**: ML-based bandwidth optimization
2. **Smart Retry Agent**: Adaptive retry strategies based on error patterns
3. **Predictive Caching**: ML-based prediction of likely transfers
4. **Network Quality Monitor**: Real-time network condition tracking
5. **Auto-Scaling Agent**: Dynamic resource allocation

### Automation Improvements

1. **Visual Regression Testing**: Automated screenshot comparison
2. **Chaos Engineering**: Automated failure injection testing
3. **Auto-Remediation**: Self-healing deployment pipeline
4. **Smart Rollback**: Automatic rollback on metric degradation

---

## Summary

Tallow employs a comprehensive automation architecture with:

- **2 Web Workers**: Crypto operations, PWA caching
- **15+ Manager Classes**: Connection, transfer, security, chat coordination
- **7 Automation Scripts**: Security, performance, deployment
- **3 CI/CD Workflows**: Testing, performance, type safety
- **2 Git Hooks**: Pre-commit quality, pre-push safety
- **Comprehensive Metrics**: Prometheus-based observability

All agents work together to provide a secure, performant, and reliable file transfer experience with quantum-resistant encryption.

---

**Last Updated**: 2026-01-26
**Document Version**: 1.0
