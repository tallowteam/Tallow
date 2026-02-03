# Tallow Monitoring and Observability - Part 2

_Continued from MONITORING_OBSERVABILITY_COMPLETE.md_

---

## 5. LaunchDarkly Feature Flags

### 5.1 Overview

LaunchDarkly provides feature flag management for controlled rollouts, A/B
testing, and feature toggling. It's **optional** and gracefully degrades to
default flag values if not configured.

**Configuration:**

- Environment variable: `NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID`
- Package: `launchdarkly-js-client-sdk`
- If not configured: Uses `DEFAULT_FLAGS` with debug logging

### 5.2 Feature Flag Definitions

#### Complete Flag Catalog (12 Flags)

| Flag Key             | Default | Purpose                           | Rollout Strategy             |
| -------------------- | ------- | --------------------------------- | ---------------------------- |
| `voice-commands`     | `false` | Enable voice command interface    | Beta users, gradual rollout  |
| `camera-capture`     | `true`  | Allow camera for QR code scanning | Enabled by default           |
| `metadata-stripping` | `true`  | Strip EXIF/metadata from files    | Enabled by default (privacy) |
| `one-time-transfers` | `true`  | Enable one-time transfer links    | Enabled by default           |
| `pqc-encryption`     | `true`  | Enable post-quantum crypto        | Enabled by default           |
| `advanced-privacy`   | `true`  | Enable advanced privacy features  | Enabled by default           |
| `qr-code-sharing`    | `true`  | Enable QR code generation         | Enabled by default           |
| `email-sharing`      | `true`  | Enable email fallback             | Enabled by default           |
| `link-expiration`    | `false` | Enable link expiration feature    | In development               |
| `custom-themes`      | `false` | Enable custom theme editor        | In development               |
| `mobile-app-promo`   | `false` | Show mobile app promotion         | Marketing campaigns          |
| `donation-prompts`   | `true`  | Show donation prompts             | Enabled by default           |

### 5.3 Flag Implementation Details

#### 5.3.1 voice-commands

**Purpose:** Enable/disable voice command interface for accessibility and
hands-free operation.

**Default:** `false` (experimental feature)

**Use Cases:**

- Beta testing with power users
- Gradual rollout based on browser support
- A/B test voice vs traditional UI

**Targeting Rules:**

```javascript
// Example LaunchDarkly targeting
{
  "rules": [
    {
      "variation": 1,  // true
      "clauses": [
        {
          "attribute": "userSegment",
          "op": "in",
          "values": ["beta_testers"]
        }
      ]
    }
  ],
  "fallthrough": {
    "variation": 0  // false
  }
}
```

**React Usage:**

```typescript
import { useFeatureFlagsContext } from '@/lib/feature-flags';

function TransferPage() {
  const { flags } = useFeatureFlagsContext();

  return (
    <>
      {flags['voice-commands'] && (
        <VoiceCommandButton />
      )}
    </>
  );
}
```

**Metrics:**

- Track usage: `recordFeatureUsage('voice_commands')`
- Analytics: `analytics.featureUsed('voice_commands')`

---

#### 5.3.2 camera-capture

**Purpose:** Enable camera access for QR code scanning and photo capture.

**Default:** `true`

**Use Cases:**

- Disable if privacy concerns arise
- Platform-specific toggling (e.g., desktop vs mobile)
- Browser compatibility fallback

**Targeting Rules:**

```javascript
{
  "rules": [
    {
      "variation": 0,  // false
      "clauses": [
        {
          "attribute": "browser",
          "op": "in",
          "values": ["safari_14", "ie"]  // Old browsers
        }
      ]
    }
  ],
  "fallthrough": {
    "variation": 1  // true
  }
}
```

**Permissions:**

- Requires browser camera permission
- Gracefully degrades if permission denied
- Shows alternative UI if disabled

---

#### 5.3.3 metadata-stripping

**Purpose:** Automatically strip EXIF and metadata from uploaded files for
privacy.

**Default:** `true` (privacy feature)

**Use Cases:**

- Emergency disable if bugs detected
- Performance optimization on low-end devices
- User preference override

**Privacy Impact:**

- Removes GPS coordinates from photos
- Strips author info from documents
- Removes device identifiers

**Performance:**

- CPU-intensive operation
- May slow transfers on large files
- Consider disabling for corporate users

---

#### 5.3.4 one-time-transfers

**Purpose:** Generate single-use transfer links that expire after first
download.

**Default:** `true`

**Use Cases:**

- Enhanced security for sensitive files
- Compliance requirements
- Premium feature gating

**Implementation:**

```typescript
if (flags['one-time-transfers']) {
  link = generateOneTimeLink(file);
} else {
  link = generateStandardLink(file);
}
```

---

#### 5.3.5 pqc-encryption

**Purpose:** Enable post-quantum cryptography (Kyber, Dilithium) for
future-proof security.

**Default:** `true`

**Use Cases:**

- A/B test performance impact
- Gradual rollout due to computational cost
- Compliance-driven enablement

**Performance Impact:**

- Key generation: +300-500ms
- Encryption: +10-20ms per operation
- Browser compatibility: Modern browsers only

**Targeting Rules:**

```javascript
{
  "rules": [
    {
      "variation": 1,  // true
      "clauses": [
        {
          "attribute": "deviceType",
          "op": "in",
          "values": ["desktop", "high_end_mobile"]
        }
      ]
    }
  ],
  "fallthrough": {
    "variation": 0  // false for low-end devices
  }
}
```

---

#### 5.3.6 advanced-privacy

**Purpose:** Umbrella flag for advanced privacy features (VPN leak detection,
fingerprint resistance).

**Default:** `true`

**Includes:**

- WebRTC leak prevention
- Canvas fingerprint protection
- Force TURN relay option
- Private browsing detection

**Use Cases:**

- High-security environments
- Privacy-conscious users
- Compliance requirements

---

#### 5.3.7 qr-code-sharing

**Purpose:** Generate QR codes for easy mobile-to-desktop transfers.

**Default:** `true`

**Use Cases:**

- Disable if QR library causes issues
- A/B test QR vs manual link sharing
- Mobile-first feature

**Implementation:**

```typescript
if (flags['qr-code-sharing']) {
  const qrCode = generateQRCode(transferLink);
  displayQRCode(qrCode);
}
```

---

#### 5.3.8 email-sharing

**Purpose:** Enable email fallback for transfer link delivery.

**Default:** `true`

**Requirements:**

- RESEND_API_KEY environment variable
- Verified sender domain

**Use Cases:**

- Disable if email service unavailable
- Cost control (email sending has fees)
- Compliance restrictions

**Rate Limiting:**

- 10 emails per hour per user
- 100 emails per day per IP

---

#### 5.3.9 link-expiration

**Purpose:** Allow users to set custom expiration times for transfer links.

**Default:** `false` (in development)

**Planned Expiration Options:**

- 1 hour
- 24 hours
- 7 days
- 30 days
- Custom duration

**Implementation Status:**

- Backend: Complete
- Frontend: In progress
- Testing: Not started

---

#### 5.3.10 custom-themes

**Purpose:** Enable custom theme editor for personalized UI.

**Default:** `false` (in development)

**Features:**

- Color picker for primary/secondary colors
- Font selection
- Layout density options
- Save custom themes

**Target Audience:**

- Power users
- Corporate branding
- Accessibility needs

---

#### 5.3.11 mobile-app-promo

**Purpose:** Display mobile app download prompts.

**Default:** `false`

**Use Cases:**

- Marketing campaigns
- Platform-specific (only on mobile web)
- A/B test messaging and placement

**Targeting Rules:**

```javascript
{
  "rules": [
    {
      "variation": 1,  // true
      "clauses": [
        {
          "attribute": "deviceType",
          "op": "in",
          "values": ["mobile", "tablet"]
        },
        {
          "attribute": "hasInstalledApp",
          "op": "is",
          "values": [false]
        }
      ]
    }
  ],
  "fallthrough": {
    "variation": 0  // false
  }
}
```

---

#### 5.3.12 donation-prompts

**Purpose:** Display donation requests to support development.

**Default:** `true`

**Placement:**

- After successful transfer
- On settings page
- Dismissible banner

**Frequency:**

- Once per session
- Max 3 times per week per user
- Never during active transfer

---

### 5.4 React Integration

#### 5.4.1 Context Provider

**Setup in `_app.tsx`:**

```typescript
import { FeatureFlagsProvider } from '@/lib/feature-flags';

function MyApp({ Component, pageProps }) {
  return (
    <FeatureFlagsProvider>
      <Component {...pageProps} />
    </FeatureFlagsProvider>
  );
}
```

#### 5.4.2 Hook Usage

```typescript
import { useFeatureFlagsContext } from '@/lib/feature-flags';

function MyComponent() {
  const { flags, loading, error, identify } = useFeatureFlagsContext();

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage />;

  return (
    <>
      {flags['voice-commands'] && <VoiceUI />}
      {flags['qr-code-sharing'] && <QRCode />}
    </>
  );
}
```

#### 5.4.3 User Identification

```typescript
const { identify } = useFeatureFlagsContext();

// On user login
await identify(userId, {
  email: userEmail, // Will be hashed
  plan: 'premium',
  country: 'US',
});
```

### 5.5 Server-Side Usage

```typescript
import { getFeatureFlag } from '@/lib/feature-flags';

// In API route
export async function POST(req: Request) {
  const pqcEnabled = getFeatureFlag('pqc-encryption');

  if (pqcEnabled) {
    return await handleWithPQC(req);
  } else {
    return await handleStandard(req);
  }
}
```

### 5.6 Event Tracking

```typescript
import { trackFeatureFlagEvent } from '@/lib/feature-flags';

// Track flag usage
trackFeatureFlagEvent('feature_used', {
  feature: 'voice_commands',
  success: true,
});

// Track conversion
trackFeatureFlagEvent(
  'donation_completed',
  {
    amount: 10,
  },
  10
);
```

### 5.7 A/B Testing

**Example: Test Donation Prompt Placement**

```typescript
const { flags } = useFeatureFlagsContext();

// LaunchDarkly multivariate flag
const donationPlacement = flags['donation-prompt-placement']; // 'top' | 'bottom' | 'modal'

function TransferComplete() {
  if (donationPlacement === 'top') {
    return <><DonationBanner /><TransferStats /></>;
  } else if (donationPlacement === 'bottom') {
    return <><TransferStats /><DonationBanner /></>;
  } else {
    return <><TransferStats /><DonationModal /></>;
  }
}

// Track conversion
trackFeatureFlagEvent('donation_completed', {
  variant: donationPlacement,
  amount: 10
});
```

**Analysis in LaunchDarkly:**

- Compare conversion rates by variant
- Measure time to conversion
- Segment by user attributes

### 5.8 Gradual Rollout

**Rollout Strategy for `voice-commands`:**

1. **Week 1:** 5% of users (beta testers)
2. **Week 2:** 25% of users (early adopters)
3. **Week 3:** 50% of users (general availability)
4. **Week 4:** 100% of users (full rollout)

**Rollback Plan:**

- Monitor error rates
- Check feature usage metrics
- Instant rollback if > 5% error rate

### 5.9 Kill Switch

**Emergency Disable:**

```typescript
// In LaunchDarkly dashboard
{
  "on": false,  // Instantly disables for all users
  "fallthrough": {
    "variation": 0  // false
  }
}
```

**Use Cases:**

- Critical bug discovered
- Security vulnerability
- Service dependency outage
- Legal/compliance issue

### 5.10 Default Flag Values

**`DEFAULT_FLAGS` object:**

```typescript
export const DEFAULT_FLAGS: Record<FeatureFlagKey, boolean> = {
  'voice-commands': false,
  'camera-capture': true,
  'metadata-stripping': true,
  'one-time-transfers': true,
  'pqc-encryption': true,
  'advanced-privacy': true,
  'qr-code-sharing': true,
  'email-sharing': true,
  'link-expiration': false,
  'custom-themes': false,
  'mobile-app-promo': false,
  'donation-prompts': true,
};
```

**Used when:**

- LaunchDarkly not configured
- LaunchDarkly API unavailable
- Network error during initialization
- Browser doesn't support LaunchDarkly SDK

### 5.11 Anonymous Users

**Anonymous ID Generation:**

```typescript
// Stored in localStorage
const anonymousId =
  localStorage.getItem('ld-anonymous-id') || `anon-${crypto.randomUUID()}`;

// Used for targeting without PII
const context = {
  kind: 'user',
  key: anonymousId,
  anonymous: true,
};
```

**Targeting Anonymous Users:**

```javascript
{
  "rules": [
    {
      "clauses": [
        {
          "attribute": "sessionCount",
          "op": "greaterThan",
          "values": [5]
        }
      ],
      "variation": 1  // Enable for returning users
    }
  ]
}
```

### 5.12 Flag Change Listeners

```typescript
import { onFlagChange } from '@/lib/feature-flags';

// Listen for real-time flag updates
const cleanup = onFlagChange('voice-commands', (newValue) => {
  console.log('Voice commands now:', newValue);

  if (newValue) {
    initializeVoiceRecognition();
  } else {
    cleanupVoiceRecognition();
  }
});

// Cleanup on unmount
return cleanup;
```

### 5.13 Event Flushing

**Flush pending events before page unload:**

```typescript
import { flushEvents } from '@/lib/feature-flags';

window.addEventListener('beforeunload', () => {
  flushEvents();
});
```

**Also handled automatically by `FeatureFlagsProvider`.**

---

## 6. Structured Logging

### 6.1 Overview

Tallow implements structured JSON logging with automatic PII scrubbing,
correlation ID tracking, and configurable log levels.

**Features:**

- JSON format for machine parsing
- PII scrubbing before output
- Correlation ID for request tracing
- Log level filtering
- Context enrichment
- Performance tracking
- Remote logging support

### 6.2 Log Levels

**Priority Order (lowest to highest):**

| Level   | Priority | Use Case                   | Example                             |
| ------- | -------- | -------------------------- | ----------------------------------- |
| `debug` | 0        | Development debugging      | `"WebRTC offer created"`            |
| `info`  | 1        | Normal operations          | `"Transfer completed successfully"` |
| `warn`  | 2        | Recoverable issues         | `"Retry attempt 2/3"`               |
| `error` | 3        | Errors requiring attention | `"Transfer failed: Network error"`  |
| `fatal` | 4        | Application-ending errors  | `"Database connection lost"`        |

**Configuration:**

```typescript
const logger = new StructuredLogger({
  level: 'info', // Only log info and above
  environment: 'production',
  service: 'tallow',
  enableConsole: true,
  enableRemote: true,
  scrubPII: true,
});
```

### 6.3 Log Entry Format

**JSON Structure:**

```json
{
  "timestamp": "2026-02-03T10:30:45.123Z",
  "level": "error",
  "message": "Transfer failed: Connection timeout",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "environment": "production",
    "version": "2.0.0",
    "service": "tallow",
    "hostname": "tallow-web-01",
    "pid": 12345
  },
  "context": {
    "transferId": "<UUID>",
    "fileSize": 1048576,
    "method": "p2p"
  },
  "error": {
    "name": "ConnectionError",
    "message": "Connection timeout",
    "stack": "ConnectionError: Connection timeout\n    at <PATH>:123:45",
    "code": "ETIMEDOUT"
  },
  "performance": {
    "duration": 5234,
    "memory": 156789012
  },
  "tags": ["transfer", "webrtc"]
}
```

### 6.4 Logging Methods

#### 6.4.1 Debug

```typescript
logger.debug('WebRTC offer created', {
  peerId: '550e8400...',
  iceServers: 3,
});
```

**Output (development):**

```
[DEBUG] WebRTC offer created { peerId: '550e8400...', iceServers: 3 }
```

**Output (production):**

```json
{"timestamp":"2026-02-03T10:30:45.123Z","level":"debug","message":"WebRTC offer created",...}
```

---

#### 6.4.2 Info

```typescript
logger.info('Transfer completed', {
  fileSize: 1048576,
  duration: 5234,
});
```

**Use Cases:**

- Transfer lifecycle events
- Connection establishment
- Feature usage
- Configuration changes

---

#### 6.4.3 Warn

```typescript
logger.warn('Retry attempt', {
  attempt: 2,
  maxAttempts: 3,
  reason: 'Network timeout',
});
```

**Use Cases:**

- Recoverable errors
- Performance degradation
- Deprecated feature usage
- Configuration warnings

---

#### 6.4.4 Error

```typescript
logger.error('Transfer failed', error, {
  transferId: 'abc123',
  fileSize: 1048576,
});
```

**Use Cases:**

- Transfer failures
- Connection errors
- Validation errors
- External service failures

---

#### 6.4.5 Fatal

```typescript
logger.fatal('Database connection lost', error, {
  database: 'postgres',
  lastPing: '2026-02-03T10:25:00Z',
});
```

**Use Cases:**

- Application-ending errors
- Critical service failures
- Unrecoverable states

---

### 6.5 Correlation ID Management

**Automatic Generation:**

```typescript
// Generate new correlation ID
const correlationId = logger.setCorrelationId();
// Returns: "550e8400-e29b-41d4-a716-446655440000"

// Use existing ID
logger.setCorrelationId(requestId);

// Get current ID
const currentId = logger.getCorrelationId();

// Clear ID
logger.clearCorrelationId();
```

**Request Tracing:**

```typescript
// API route
export async function POST(req: Request) {
  const correlationId =
    req.headers.get('x-correlation-id') || crypto.randomUUID();

  logger.setCorrelationId(correlationId);

  logger.info('Request received');
  // ... process request ...
  logger.info('Request completed');

  return Response.json(data, {
    headers: {
      'x-correlation-id': correlationId,
    },
  });
}
```

**Distributed Tracing:** All logs with same correlation ID can be aggregated for
full request trace.

### 6.6 Context Management

**Persistent Context:**

```typescript
// Set context once, included in all subsequent logs
logger.setContext({
  userId: '<hashed>',
  sessionId: '123abc',
  environment: 'production',
});

logger.info('User action'); // Includes context
logger.error('User error', error); // Includes context

// Clear context
logger.clearContext();
```

**Call-Specific Context:**

```typescript
// Context only for this log
logger.info('Transfer started', {
  fileSize: 1048576,
  method: 'p2p',
});
```

**Merged Context:** Persistent context + call-specific context = final log
context.

### 6.7 Child Loggers

**Create specialized loggers:**

```typescript
const transferLogger = logger.child({ domain: 'transfer' });
const cryptoLogger = logger.child({ domain: 'crypto' });
const apiLogger = logger.child({ domain: 'api' });

transferLogger.info('File sent');
// Output includes: { domain: 'transfer', ... }

cryptoLogger.debug('Key generated');
// Output includes: { domain: 'crypto', ... }
```

**Pre-configured Loggers:**

```typescript
import {
  transferLogger,
  cryptoLogger,
  connectionLogger,
  apiLogger,
  securityLogger,
} from '@/lib/monitoring/logging';

transferLogger.info('Transfer completed');
cryptoLogger.warn('Slow PQC operation');
securityLogger.error('Authentication failed', error);
```

### 6.8 Performance Timing

**Time Operations:**

```typescript
const result = await logger.time(
  'file_encryption',
  async () => {
    return await encryptFile(file);
  },
  { fileSize: file.size }
);
```

**Output:**

```json
{
  "level": "debug",
  "message": "Starting operation: file_encryption",
  ...
}
{
  "level": "info",
  "message": "Operation completed: file_encryption",
  "context": {
    "fileSize": 1048576,
    "duration": 234,
    "memoryDelta": 5242880
  },
  ...
}
```

### 6.9 PII Scrubbing

**Automatic Scrubbing:**

- All messages: `scrubPII(message)`
- All context objects: `scrubObjectPII(context)`
- Error messages: `scrubPII(error.message)`
- Error stacks: `scrubPII(error.stack)`

**Example:**

```typescript
logger.info(
  'User john.doe@example.com transferred vacation.jpg from /Users/john/Documents'
);
```

**Output:**

```json
{
  "message": "User <EMAIL> transferred vacation.jpg from <USER_DIR>/Documents",
  ...
}
```

**Scrubbed Patterns:**

- Emails → `<EMAIL>`
- IPs → `<IP>`
- Paths → `<PATH>` or `<USER_DIR>`
- UUIDs → `<UUID>`
- API keys → `<API_KEY>`
- Tokens → `<TOKEN>`
- Phone numbers → `<PHONE>`
- Credit cards → `<CARD>`
- SSNs → `<SSN>`

### 6.10 Remote Logging

**Configuration:**

```typescript
const logger = new StructuredLogger({
  enableRemote: true,
  remoteEndpoint: 'https://logs.example.com/ingest',
  correlationIdHeader: 'x-correlation-id',
});
```

**HTTP Request:**

```http
POST /ingest HTTP/1.1
Host: logs.example.com
Content-Type: application/json
x-correlation-id: 550e8400-e29b-41d4-a716-446655440000

{
  "timestamp": "2026-02-03T10:30:45.123Z",
  "level": "error",
  ...
}
```

**Error Handling:**

- Network errors logged to console (not recursively)
- Non-blocking (fire-and-forget)
- Retries not implemented (avoid log loops)

### 6.11 Log Format Examples

**Development (Pretty Print):**

```
[INFO] Transfer completed { fileSize: 1048576, duration: 5234 }
[ERROR] Connection failed Error: Timeout
```

**Production (JSON):**

```json
{"timestamp":"2026-02-03T10:30:45.123Z","level":"info","message":"Transfer completed","context":{"fileSize":1048576,"duration":5234},"metadata":{"environment":"production","version":"2.0.0","service":"tallow"}}
{"timestamp":"2026-02-03T10:30:46.456Z","level":"error","message":"Connection failed","error":{"name":"Error","message":"Timeout","stack":"Error: Timeout\n    at ..."},"metadata":{"environment":"production","version":"2.0.0","service":"tallow"}}
```

### 6.12 Integration with Log Aggregation

**Elasticsearch:**

```json
{
  "index": "tallow-logs-2026.02.03",
  "body": {
    "timestamp": "2026-02-03T10:30:45.123Z",
    "level": "error",
    "message": "Transfer failed",
    ...
  }
}
```

**Splunk:**

```
sourcetype=tallow:json
source=/var/log/tallow/app.log
index=production
```

**CloudWatch:**

```javascript
{
  logGroupName: '/aws/ecs/tallow',
  logStreamName: 'tallow-web-01',
  logEvents: [{
    timestamp: 1738580000000,
    message: '{"level":"error","message":"Transfer failed",...}'
  }]
}
```

### 6.13 Operational Queries

**Find all errors in last hour:**

```
level:error AND timestamp:[now-1h TO now]
```

**Trace request by correlation ID:**

```
correlationId:"550e8400-e29b-41d4-a716-446655440000"
```

**Find slow operations:**

```
performance.duration:>5000 AND level:info
```

**Group errors by type:**

```
level:error | stats count by error.name
```

---

_Continuing in next part with Health Checks, Alerting, and operational
runbooks..._
