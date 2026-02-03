# Tallow Monitoring and Observability - Part 3

_Continued from MONITORING_OBSERVABILITY_PART2.md_

---

## 7. Health Checks

### 7.1 Overview

Tallow provides four health check endpoints for container orchestration, load
balancers, and monitoring systems:

| Endpoint                | Purpose              | Checks Performed       | Kubernetes Use       |
| ----------------------- | -------------------- | ---------------------- | -------------------- |
| `/api/health`           | Basic health         | Application running    | -                    |
| `/api/health/liveness`  | Liveness probe       | Process alive          | `livenessProbe`      |
| `/api/health/readiness` | Readiness probe      | Ready to serve traffic | `readinessProbe`     |
| `/api/health/detailed`  | Comprehensive status | All components         | Monitoring dashboard |

### 7.2 Basic Health Check

**Endpoint:** `GET /api/health`

**Purpose:** Quick health status for simple monitoring.

**Response (200 OK):**

```json
{
  "status": "ok",
  "service": "tallow",
  "version": "2.0.0",
  "timestamp": "2026-02-03T10:30:45.123Z",
  "uptime": 86400
}
```

**Response (503 Service Unavailable):**

```json
{
  "status": "error",
  "service": "tallow",
  "timestamp": "2026-02-03T10:30:45.123Z",
  "error": "Application initialization failed"
}
```

**Checks:**

- Application process running
- Basic error handling functional

**Use Cases:**

- Simple uptime monitoring
- External health check services
- Status page integration

**Example Request:**

```bash
curl http://localhost:3000/api/health
```

### 7.3 Liveness Probe

**Endpoint:** `GET /api/health/liveness`

**Purpose:** Kubernetes liveness probe - determines if container should be
restarted.

**Response (200 OK):**

```json
{
  "status": "alive",
  "timestamp": "2026-02-03T10:30:45.123Z"
}
```

**Also supports:** `HEAD /api/health/liveness` (no body)

**Checks:**

- Process is running
- Event loop responding
- No deadlocks

**Kubernetes Configuration:**

```yaml
livenessProbe:
  httpGet:
    path: /api/health/liveness
    port: 3000
    scheme: HTTP
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  successThreshold: 1
  failureThreshold: 3
```

**Failure Behavior:**

- After 3 consecutive failures: Pod restarted
- Container restarted by kubelet
- Alerts sent to monitoring system

**Performance:**

- Response time: < 10ms
- No external dependencies checked
- Minimal CPU/memory usage

### 7.4 Readiness Probe

**Endpoint:** `GET /api/health/readiness`

**Purpose:** Kubernetes readiness probe - determines if pod should receive
traffic.

**Response (200 OK):**

```json
{
  "status": "ready",
  "timestamp": "2026-02-03T10:30:45.123Z",
  "checks": [
    {
      "name": "environment",
      "status": "healthy",
      "responseTime": 1
    },
    {
      "name": "memory",
      "status": "healthy",
      "responseTime": 2
    }
  ]
}
```

**Response (503 Not Ready):**

```json
{
  "status": "not ready",
  "timestamp": "2026-02-03T10:30:45.123Z",
  "checks": [
    {
      "name": "environment",
      "status": "unhealthy",
      "responseTime": 1,
      "error": "Missing required environment variables: NEXT_PUBLIC_SIGNALING_URL"
    },
    {
      "name": "memory",
      "status": "healthy",
      "responseTime": 2
    }
  ]
}
```

**Also supports:** `HEAD /api/health/readiness` (no body)

#### 7.4.1 Environment Check

**Checks:**

- `NEXT_PUBLIC_SIGNALING_URL` is set

**Status:**

- `healthy`: All required variables present
- `unhealthy`: Missing required variables

**Response Time:** < 5ms

---

#### 7.4.2 Memory Check

**Checks:**

- Heap usage < 90% of total heap

**Status:**

- `healthy`: Memory usage normal
- `unhealthy`: Memory usage > 90%

**Response Time:** < 5ms

**Error Example:**

```json
{
  "name": "memory",
  "status": "unhealthy",
  "responseTime": 2,
  "error": "High memory usage: 92.45%"
}
```

---

**Kubernetes Configuration:**

```yaml
readinessProbe:
  httpGet:
    path: /api/health/readiness
    port: 3000
    scheme: HTTP
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  successThreshold: 1
  failureThreshold: 3
```

**Failure Behavior:**

- After 3 consecutive failures: Pod removed from service
- No traffic routed to pod
- Pod not restarted (unlike liveness)
- Allows time for recovery

**Recovery:**

- Once check passes: Pod added back to service
- Traffic resumes automatically

### 7.5 Detailed Health Status

**Endpoint:** `GET /api/health/detailed`

**Purpose:** Comprehensive health information for monitoring dashboards.

**Authentication:** Optional Bearer token (`HEALTH_CHECK_TOKEN`)

**Response (200 OK):**

```json
{
  "status": "healthy",
  "version": "2.0.0",
  "environment": "production",
  "uptime": 86400,
  "timestamp": "2026-02-03T10:30:45.123Z",
  "components": [
    {
      "name": "memory",
      "status": "healthy",
      "message": "Memory usage normal",
      "metrics": {
        "heapUsed": 125829120,
        "heapTotal": 201326592,
        "percentage": 62.51,
        "external": 1623456,
        "rss": 145829120
      },
      "lastChecked": "2026-02-03T10:30:45.123Z"
    },
    {
      "name": "environment",
      "status": "healthy",
      "message": "All required environment variables configured",
      "metrics": {
        "requiredConfigured": 2,
        "requiredTotal": 2,
        "optionalConfigured": 3,
        "optionalTotal": 4
      },
      "lastChecked": "2026-02-03T10:30:45.123Z"
    },
    {
      "name": "metrics",
      "status": "healthy",
      "message": "Metrics collection active",
      "metrics": {
        "metricsCount": 47
      },
      "lastChecked": "2026-02-03T10:30:45.123Z"
    },
    {
      "name": "monitoring",
      "status": "healthy",
      "message": "All monitoring integrations active",
      "metrics": {
        "sentry": "configured",
        "plausible": "configured"
      },
      "lastChecked": "2026-02-03T10:30:45.123Z"
    }
  ],
  "system": {
    "platform": "linux",
    "nodeVersion": "v20.10.0",
    "memory": {
      "total": 201326592,
      "used": 125829120,
      "percentage": 62.51
    },
    "cpu": {
      "count": 4
    }
  }
}
```

**Response (503 Degraded/Unhealthy):**

```json
{
  "status": "degraded",
  "version": "2.0.0",
  "environment": "production",
  "uptime": 86400,
  "timestamp": "2026-02-03T10:30:45.123Z",
  "components": [
    {
      "name": "memory",
      "status": "degraded",
      "message": "High memory usage",
      "metrics": {
        "heapUsed": 180000000,
        "heapTotal": 201326592,
        "percentage": 89.42,
        ...
      },
      "lastChecked": "2026-02-03T10:30:45.123Z"
    },
    {
      "name": "monitoring",
      "status": "degraded",
      "message": "Some monitoring integrations not configured",
      "metrics": {
        "sentry": "not configured",
        "plausible": "configured"
      },
      "lastChecked": "2026-02-03T10:30:45.123Z"
    }
  ],
  ...
}
```

#### 7.5.1 Component Status Levels

**`healthy`:**

- Component functioning normally
- No issues detected
- All checks passed

**`degraded`:**

- Component partially functional
- Non-critical issues detected
- Service continues but may be impaired

**`unhealthy`:**

- Component not functional
- Critical issues detected
- Service may fail

#### 7.5.2 Memory Component

**Thresholds:**

- < 75%: `healthy`
- 75-90%: `degraded`
- \> 90%: `unhealthy`

**Metrics:**

- `heapUsed`: Bytes used in heap
- `heapTotal`: Total heap size
- `percentage`: Heap usage percentage
- `external`: External memory (C++)
- `rss`: Resident set size (total memory)

---

#### 7.5.3 Environment Component

**Checks:**

- Required: `NEXT_PUBLIC_SIGNALING_URL`, `NEXTAUTH_SECRET`
- Optional: `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`,
  `STRIPE_SECRET_KEY`, `RESEND_API_KEY`

**Status Logic:**

- All required present: `healthy`
- Some optional missing: `degraded`
- Any required missing: `unhealthy`

---

#### 7.5.4 Metrics Component

**Checks:**

- Prometheus registry accessible
- Metrics can be serialized
- Metric count > 0

**Status:**

- Registry operational: `healthy`
- Registry error: `unhealthy`

---

#### 7.5.5 Monitoring Component

**Checks:**

- Sentry DSN configured
- Plausible domain configured

**Status Logic:**

- Both configured: `healthy`
- One configured: `degraded`
- None configured: `degraded`

---

**Authentication:**

```bash
curl -H "Authorization: Bearer ${HEALTH_CHECK_TOKEN}" \
  http://localhost:3000/api/health/detailed
```

**Without Token (if `HEALTH_CHECK_TOKEN` not set):**

```bash
curl http://localhost:3000/api/health/detailed
```

**Use Cases:**

- Grafana health dashboard
- PagerDuty health check
- Status page integration
- Capacity planning

### 7.6 Alerting Integration

**Prometheus Alerting:**

```yaml
- alert: TallowApplicationDown
  expr: up{job="tallow"} == 0
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: 'Tallow application is down'
    description: 'Health check failing for 2 minutes'
```

**Load Balancer:**

```nginx
upstream tallow {
  server tallow-01:3000;
  server tallow-02:3000;

  # Health check
  check interval=3000 rise=2 fall=3 timeout=1000
    default_down=false type=http;
  check_http_send "GET /api/health/readiness HTTP/1.0\r\n\r\n";
  check_http_expect_alive http_2xx;
}
```

### 7.7 Kubernetes Full Configuration

**deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tallow
  labels:
    app: tallow
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tallow
  template:
    metadata:
      labels:
        app: tallow
    spec:
      containers:
        - name: tallow
          image: tallow:2.0.0
          ports:
            - containerPort: 3000
              name: http

          # Startup probe - gives app time to start
          startupProbe:
            httpGet:
              path: /api/health/liveness
              port: 3000
            initialDelaySeconds: 0
            periodSeconds: 5
            timeoutSeconds: 3
            successThreshold: 1
            failureThreshold: 30 # 150 seconds max startup time

          # Liveness probe - restart if unhealthy
          livenessProbe:
            httpGet:
              path: /api/health/liveness
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            successThreshold: 1
            failureThreshold: 3

          # Readiness probe - remove from service if not ready
          readinessProbe:
            httpGet:
              path: /api/health/readiness
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            successThreshold: 1
            failureThreshold: 3

          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 2Gi

          env:
            - name: NODE_ENV
              value: 'production'
            - name: NEXT_PUBLIC_SIGNALING_URL
              valueFrom:
                secretKeyRef:
                  name: tallow-secrets
                  key: signaling-url
```

---

## 8. Alerting Rules

### 8.1 Alert Structure

**Alert Definition:**

```yaml
- alert: AlertName
  expr: PromQL expression
  for: duration
  labels:
    severity: critical|warning|info
    component: system|transfers|webrtc|crypto|api
    category: performance|security|business
  annotations:
    summary: 'Brief description'
    description: 'Detailed description with {{ $value }}'
```

### 8.2 Transfer Alerts

#### 8.2.1 HighTransferFailureRate

**Severity:** WARNING

**Threshold:** > 10% failure rate for 5 minutes

**PromQL:**

```promql
(
  sum(rate(tallow_transfers_total{status="failed"}[5m]))
  /
  sum(rate(tallow_transfers_total[5m]))
) > 0.1
```

**Meaning:** More than 10% of file transfers are failing.

**Possible Causes:**

- Network connectivity issues
- WebRTC connection failures
- Server overload
- Client-side errors

**Investigation:**

1. Check `/api/health/detailed` for system issues
2. Review error logs for failure patterns
3. Check WebRTC connection metrics
4. Verify STUN/TURN server availability

**Runbook:** [Transfer Failure Runbook](#1221-transfer-failure-runbook)

---

#### 8.2.2 CriticalTransferFailureRate

**Severity:** CRITICAL

**Threshold:** > 25% failure rate for 5 minutes

**PromQL:**

```promql
(
  sum(rate(tallow_transfers_total{status="failed"}[5m]))
  /
  sum(rate(tallow_transfers_total[5m]))
) > 0.25
```

**Meaning:** More than 25% of transfers failing - major service degradation.

**Immediate Actions:**

1. Check application logs
2. Verify infrastructure health
3. Consider emergency rollback
4. Enable fallback mechanisms

**Escalation:** Page on-call engineer immediately

---

#### 8.2.3 LowTransferSpeed

**Severity:** WARNING

**Threshold:** P50 < 1 Mbps for 10 minutes

**PromQL:**

```promql
histogram_quantile(0.5, rate(tallow_transfer_speed_mbps_bucket[5m])) < 1
```

**Meaning:** Median transfer speed below acceptable threshold.

**Possible Causes:**

- Network congestion
- Relay server overload
- Insufficient bandwidth
- Client-side throttling

**Investigation:**

1. Check P2P vs relay ratio
2. Verify TURN server performance
3. Check ISP issues
4. Review recent infrastructure changes

---

### 8.3 PQC Crypto Alerts

#### 8.3.1 PQCOperationFailures

**Severity:** WARNING

**Threshold:** Any PQC failures for 5 minutes

**PromQL:**

```promql
sum(rate(tallow_pqc_operations_total{status="failed"}[5m])) > 0
```

**Meaning:** Post-quantum cryptography operations are failing.

**Possible Causes:**

- WASM initialization failure
- Browser compatibility issue
- Memory constraints
- Bug in PQC library

**Investigation:**

1. Check browser versions in logs
2. Review WASM loading errors
3. Check memory usage during operations
4. Test PQC in isolated environment

---

#### 8.3.2 HighPQCKeyExchangeFailureRate

**Severity:** CRITICAL

**Threshold:** > 5% PQC key exchange failure rate for 5 minutes

**PromQL:**

```promql
(
  sum(rate(tallow_pqc_key_exchanges_total{status="failed"}[5m]))
  /
  sum(rate(tallow_pqc_key_exchanges_total[5m]))
) > 0.05
```

**Meaning:** Significant portion of PQC key exchanges failing.

**Immediate Actions:**

1. Check feature flag `pqc-encryption` status
2. Consider disabling PQC temporarily
3. Investigate WASM module issues
4. Review recent PQC library updates

---

#### 8.3.3 SlowPQCOperations

**Severity:** WARNING

**Threshold:** P95 > 5 seconds for 10 minutes

**PromQL:**

```promql
histogram_quantile(0.95, rate(tallow_pqc_duration_seconds_bucket[5m])) > 5
```

**Meaning:** PQC operations taking too long.

**Possible Causes:**

- CPU overload
- Memory pressure
- Browser throttling
- Inefficient algorithm selection

**Investigation:**

1. Check CPU usage metrics
2. Review memory usage during PQC ops
3. Test on different hardware
4. Consider algorithm optimization

---

### 8.4 Connection Alerts

#### 8.4.1 HighConnectionFailureRate

**Severity:** WARNING

**Threshold:** > 20% connection failure rate for 5 minutes

**PromQL:**

```promql
(
  sum(rate(tallow_webrtc_connections_total{status="failed"}[5m]))
  /
  sum(rate(tallow_webrtc_connections_total[5m]))
) > 0.2
```

**Meaning:** 1 in 5 WebRTC connections failing.

**Possible Causes:**

- NAT traversal issues
- STUN/TURN server unavailable
- Firewall blocking WebRTC
- Client network restrictions

**Runbook:** [Connection Failure Runbook](#1222-connection-failure-runbook)

---

#### 8.4.2 SlowConnectionEstablishment

**Severity:** WARNING

**Threshold:** P95 > 10 seconds for 10 minutes

**PromQL:**

```promql
histogram_quantile(0.95, rate(tallow_connection_establishment_seconds_bucket[5m])) > 10
```

**Meaning:** Connections taking too long to establish.

**Investigation:**

1. Check ICE gathering time
2. Verify STUN server responsiveness
3. Review network topology
4. Check for relay fallback delays

---

#### 8.4.3 HighActiveConnections

**Severity:** WARNING

**Threshold:** > 1000 concurrent connections for 5 minutes

**PromQL:**

```promql
tallow_active_connections > 1000
```

**Meaning:** Approaching capacity limits.

**Actions:**

1. Scale horizontally (add instances)
2. Monitor resource usage
3. Consider rate limiting
4. Review connection cleanup

---

#### 8.4.4 NoActiveConnections

**Severity:** INFO

**Threshold:** 0 connections for 30 minutes with no activity

**PromQL:**

```promql
tallow_active_connections == 0
AND
rate(tallow_webrtc_connections_total[30m]) == 0
```

**Meaning:** Service idle or potential issue.

**Investigation:**

1. Check if expected (maintenance window, low usage time)
2. Verify service is reachable
3. Check marketing campaigns
4. Review access logs

---

### 8.5 Error Alerts

#### 8.5.1 HighErrorRate

**Severity:** WARNING

**Threshold:** > 10 errors/second for 5 minutes

**PromQL:**

```promql
sum(rate(tallow_errors_total[5m])) > 10
```

**Meaning:** Elevated error rate across application.

---

#### 8.5.2 CriticalErrors

**Severity:** CRITICAL

**Threshold:** Any critical errors for 1 minute

**PromQL:**

```promql
sum(rate(tallow_errors_total{severity="critical"}[5m])) > 0
```

**Meaning:** Critical errors occurring.

**Immediate Actions:**

1. Check error logs immediately
2. Assess user impact
3. Consider emergency response
4. Notify stakeholders

---

#### 8.5.3 HighAPIErrorRate

**Severity:** WARNING

**Threshold:** > 5% API error rate for 5 minutes

**PromQL:**

```promql
(
  sum(rate(tallow_api_errors_total[5m]))
  /
  sum(rate(tallow_page_views_total[5m]))
) > 0.05
```

**Meaning:** API endpoints returning errors.

---

### 8.6 System Alerts

#### 8.6.1 HighCPUUsage

**Severity:** WARNING

**Threshold:** > 80% CPU usage for 5 minutes

**PromQL:**

```promql
rate(tallow_process_cpu_seconds_total[5m]) * 100 > 80
```

---

#### 8.6.2 HighMemoryUsage

**Severity:** WARNING

**Threshold:** > 2GB memory usage for 5 minutes

**PromQL:**

```promql
tallow_process_resident_memory_bytes > 2e9
```

---

#### 8.6.3 PossibleMemoryLeak

**Severity:** WARNING

**Threshold:** +500MB memory increase in 1 hour

**PromQL:**

```promql
(
  tallow_process_resident_memory_bytes
  -
  tallow_process_resident_memory_bytes offset 1h
) > 500e6
```

**Meaning:** Memory increasing over time - possible leak.

---

#### 8.6.4 ApplicationDown

**Severity:** CRITICAL

**Threshold:** Application unreachable for 2 minutes

**PromQL:**

```promql
up{job="tallow"} == 0
```

**Immediate Actions:**

1. Check pod/container status
2. Review recent deployments
3. Check infrastructure
4. Initiate incident response

---

### 8.7 SLO Error Budget Alerts

#### 8.7.1 FastErrorBudgetBurn

**Severity:** CRITICAL

**Threshold:** Burning budget 14.4x faster than sustainable

**PromQL:**

```promql
(
  sum(rate(tallow_errors_total[1h]))
  /
  sum(rate(tallow_transfers_total[1h]))
) > (14.4 * 0.001)
```

**Meaning:** At this rate, monthly budget exhausted in 2 days.

**Action:** Investigate and fix immediately.

---

#### 8.7.2 SlowErrorBudgetBurn

**Severity:** WARNING

**Threshold:** Burning budget 3x faster than sustainable

**PromQL:**

```promql
(
  sum(rate(tallow_errors_total[6h]))
  /
  sum(rate(tallow_transfers_total[6h]))
) > (3 * 0.001)
```

**Meaning:** At this rate, monthly budget exhausted in 10 days.

**Action:** Plan investigation and remediation.

---

#### 8.7.3 ErrorBudgetNearlyExhausted

**Severity:** CRITICAL

**Threshold:** < 10% monthly budget remaining

**PromQL:**

```promql
1 - (
  sum(rate(tallow_errors_total[30d]))
  /
  sum(rate(tallow_transfers_total[30d]))
) < 0.10
```

**Meaning:** Almost out of error budget for the month.

**Action:** Feature freeze until errors reduce.

---

### 8.8 AlertManager Configuration

**Notification Routing:**

| Severity | Channels                | Grouping  | Repeat Interval |
| -------- | ----------------------- | --------- | --------------- |
| critical | Email, PagerDuty, Slack | 1 minute  | 1 hour          |
| warning  | Email, Slack            | 5 minutes | 12 hours        |
| info     | Email (digest)          | 24 hours  | 24 hours        |

**Inhibition Rules:**

- Critical alert inhibits warning alert for same component
- `ApplicationDown` inhibits all connection/transfer alerts

**Receiver Examples:**

```yaml
receivers:
  - name: 'critical-alerts'
    email_configs:
      - to: 'oncall@tallow.com'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_KEY}'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK}'
        channel: '#tallow-critical'

  - name: 'warning-alerts'
    email_configs:
      - to: 'ops@tallow.com'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK}'
        channel: '#tallow-alerts'

  - name: 'daily-digest'
    email_configs:
      - to: 'ops@tallow.com'
        send_resolved: false
```

---

## 9. Performance Monitoring

### 9.1 Core Web Vitals

**Metrics Tracked:**

| Metric | Target  | Description                    |
| ------ | ------- | ------------------------------ |
| LCP    | < 2.5s  | Largest Contentful Paint       |
| FID    | < 100ms | First Input Delay (deprecated) |
| INP    | < 200ms | Interaction to Next Paint      |
| CLS    | < 0.1   | Cumulative Layout Shift        |
| TTFB   | < 800ms | Time to First Byte             |
| FCP    | < 1.8s  | First Contentful Paint         |

**Ratings:**

- **Good:** Metric ≤ good threshold
- **Needs Improvement:** good threshold < metric ≤ poor threshold
- **Poor:** Metric > poor threshold

**Example:**

```typescript
import { initCoreWebVitals } from '@/lib/monitoring/performance';

// In app root
await initCoreWebVitals();

// Metrics automatically reported to Plausible
```

### 9.2 Custom Performance Marks

```typescript
import { mark, measure } from '@/lib/monitoring/performance';

// Mark start
mark('transfer_start');

// ... perform transfer ...

// Mark end
mark('transfer_end');

// Measure duration
const duration = measure('transfer_duration', 'transfer_start', 'transfer_end');
// Returns: { name, duration, startMark, endMark }
```

### 9.3 Transfer Speed Metrics

```typescript
import { recordTransferSpeed } from '@/lib/monitoring/performance';

const metric = recordTransferSpeed(
  transferId,
  fileSize,
  startTime,
  endTime,
  method
);

// Returns: {
//   transferId,
//   fileSize,
//   duration,
//   speed,  // bytes/sec
//   method,
//   timestamp
// }
```

### 9.4 Memory Monitoring

```typescript
import {
  getMemoryUsage,
  startMemoryMonitoring,
  stopMemoryMonitoring,
} from '@/lib/monitoring/performance';

// Get current snapshot
const snapshot = getMemoryUsage();
// {
//   usedJSHeapSize,
//   totalJSHeapSize,
//   jsHeapSizeLimit,
//   timestamp,
//   percentage
// }

// Start continuous monitoring (every 10s)
startMemoryMonitoring(10000);

// Stop monitoring
stopMemoryMonitoring();
```

### 9.5 Resource Timing

```typescript
import {
  getResourceTimings,
  getSlowResources,
  getResourceBreakdown,
} from '@/lib/monitoring/performance';

// All resources
const resources = getResourceTimings();

// Slow resources (> 1s)
const slow = getSlowResources();

// Breakdown by type
const breakdown = getResourceBreakdown();
// {
//   script: { count, totalSize, totalDuration },
//   stylesheet: { count, totalSize, totalDuration },
//   ...
// }
```

### 9.6 Long Task Detection

```typescript
import {
  startLongTaskMonitoring,
  stopLongTaskMonitoring,
} from '@/lib/monitoring/performance';

// Start monitoring tasks > 50ms
startLongTaskMonitoring();

// Automatically logs warnings
// [Performance] Long task detected: 234.56ms

// Stop monitoring
stopLongTaskMonitoring();
```

### 9.7 Performance Report

```typescript
import { generatePerformanceReport } from '@/lib/monitoring/performance';

const report = generatePerformanceReport();

// {
//   webVitals: [...],
//   customMetrics: { marks: [...], measures: [...] },
//   transfers: { metrics: [...], stats: {...} },
//   memory: { current: {...}, snapshots: [...] },
//   resources: { timings: [...], breakdown: {...} }
// }
```

---

## 10. PII Scrubbing

### 10.1 Scrubbing Functions

**Individual Scrubbers:**

| Function             | Pattern               | Replacement      |
| -------------------- | --------------------- | ---------------- |
| `scrubEmail()`       | `user@example.com`    | `<EMAIL>`        |
| `scrubIP()`          | `192.168.1.1`         | `<IP>`           |
| `scrubPhoneNumber()` | `+1-555-123-4567`     | `<PHONE>`        |
| `scrubCreditCard()`  | `4111-1111-1111-1111` | `<CARD>`         |
| `scrubSSN()`         | `123-45-6789`         | `<SSN>`          |
| `scrubApiKeys()`     | `Bearer xyz123abc...` | `Bearer <TOKEN>` |
| `scrubUUID()`        | `550e8400-e29b-...`   | `<UUID>`         |
| `scrubFilePath()`    | `C:\Users\john\...`   | `<USER_DIR>\...` |
| `scrubUsername()`    | `@johndoe`            | `@<USER>`        |

**Comprehensive Scrubber:**

```typescript
import { scrubPII } from '@/lib/utils/pii-scrubber';

const clean = scrubPII(
  'User john.doe@example.com at 192.168.1.1 transferred file from C:\\Users\\john\\Documents'
);
// "User <EMAIL> at <IP> transferred file from <USER_DIR>\\Documents"
```

### 10.2 Object Scrubbing

```typescript
import { scrubObjectPII } from '@/lib/utils/pii-scrubber';

const context = {
  user: 'john.doe@example.com',
  ip: '192.168.1.1',
  path: '/Users/john/file.txt',
  nested: {
    email: 'jane@example.com',
  },
};

const clean = scrubObjectPII(context);
// {
//   user: '<EMAIL>',
//   ip: '<IP>',
//   path: '<USER_DIR>/file.txt',
//   nested: { email: '<EMAIL>' }
// }
```

### 10.3 Error Scrubbing

```typescript
import { scrubErrorPII } from '@/lib/utils/pii-scrubber';

try {
  throw new Error(
    'Failed to access /Users/john/file.txt for john.doe@example.com'
  );
} catch (error) {
  const cleanError = scrubErrorPII(error);
  // Message: "Failed to access <USER_DIR>/file.txt for <EMAIL>"
}
```

### 10.4 User ID Hashing

```typescript
import { hashUserId, hashUserIdSync } from '@/lib/utils/pii-scrubber';

// Async (SHA-256)
const hash = await hashUserId('user-12345');
// "a1b2c3d4e5f6g7h8"

// Sync (FNV-1a)
const hashSync = hashUserIdSync('user-12345');
// "a1b2c3d4e5f6g7h8"
```

### 10.5 PII Detection

```typescript
import { containsPII } from '@/lib/utils/pii-scrubber';

const hasPII = containsPII('Contact john.doe@example.com');
// true

const noPII = containsPII('Contact support');
// false
```

---

## 11. Integration Examples

See `lib/monitoring/integration-example.ts` for complete examples of:

1. File transfer with tracking
2. PQC key exchange with metrics
3. WebRTC connection monitoring
4. Feature usage tracking
5. Voice command with feature flags
6. Metadata stripping with privacy tracking
7. Settings change tracking
8. Session tracking
9. Comprehensive transfer pipeline
10. Error boundary integration

---

## 12. Operational Runbooks

### 12.1 Common Scenarios

#### 12.1.1 High Error Rate Investigation

**Steps:**

1. Check Grafana dashboard for error spike
2. Query logs: `level:error AND timestamp:[now-15m TO now]`
3. Group errors by type: `level:error | stats count by error.name`
4. Check recent deployments
5. Review feature flag changes
6. Check infrastructure metrics
7. Roll back if necessary

**Tools:**

- Grafana: Error rate graphs
- Elasticsearch: Log aggregation
- Sentry: Error details
- Prometheus: Metrics correlation

---

#### 12.1.2 Memory Leak Detection

**Steps:**

1. Check memory usage trend: `tallow_process_resident_memory_bytes[24h]`
2. Get memory snapshots: `getMemorySnapshots()`
3. Enable heap profiling in dev environment
4. Review recent code changes
5. Check for event listener leaks
6. Review WebRTC connection cleanup
7. Force GC and observe: `global.gc()`

**Tools:**

- Chrome DevTools: Heap snapshots
- Prometheus: Memory metrics
- Node.js: `--inspect` flag

---

### 12.2 Incident Response

#### 12.2.1 Transfer Failure Runbook

**Severity:** High

**Initial Response Time:** 15 minutes

**Steps:**

1. **Acknowledge Alert** (1 min)
   - Confirm alert receipt
   - Update status page

2. **Assess Impact** (3 min)
   - Check failure rate: `tallow_transfers_total{status="failed"}`
   - Review affected users
   - Determine service degradation level

3. **Diagnose** (10 min)
   - Check WebRTC connection metrics
   - Verify STUN/TURN server status
   - Review error logs for patterns
   - Test transfer in isolated environment

4. **Mitigate** (30 min)
   - Enable fallback mechanisms
   - Scale relay servers if needed
   - Adjust feature flags if necessary
   - Communicate with users

5. **Resolve** (60 min)
   - Apply permanent fix
   - Monitor metrics for improvement
   - Verify resolution
   - Update status page

6. **Post-Incident** (24 hours)
   - Write postmortem
   - Identify root cause
   - Create action items
   - Update runbook

---

#### 12.2.2 Connection Failure Runbook

**Severity:** Medium

**Initial Response Time:** 30 minutes

**Steps:**

1. **Verify Infrastructure**
   - Check STUN server: `curl stun:stun.l.google.com:19302`
   - Check TURN server health
   - Verify signaling server

2. **Analyze Metrics**
   - Connection failure rate by type
   - ICE gathering duration
   - Relay usage percentage

3. **Check Recent Changes**
   - Deployments in last 24 hours
   - Feature flag changes
   - Infrastructure modifications

4. **Test Connectivity**
   - Manual WebRTC test
   - Different network conditions
   - Various browsers/devices

5. **Communicate**
   - Update status page
   - Notify affected users
   - Document findings

---

### 12.3 Maintenance Procedures

#### 12.3.1 Deploying New Version

**Pre-Deployment:**

1. Review changes and test coverage
2. Check error budget availability
3. Plan rollback strategy
4. Schedule maintenance window
5. Notify stakeholders

**Deployment:**

1. Deploy to canary (5% traffic)
2. Monitor metrics for 15 minutes
3. Check error rates and latency
4. Gradually increase traffic (25%, 50%, 100%)
5. Monitor at each stage

**Post-Deployment:**

1. Verify all health checks passing
2. Check error rates vs baseline
3. Monitor for 1 hour
4. Document deployment
5. Update runbooks if needed

---

#### 12.3.2 Updating Feature Flags

**Procedure:**

1. Document change reason
2. Update targeting rules in LaunchDarkly
3. Test with specific users first
4. Monitor feature usage metrics
5. Gradually rollout
6. Document configuration

**Rollback:**

1. Toggle flag off instantly
2. Monitor for error reduction
3. Investigate root cause
4. Fix before re-enabling

---

### 12.4 Escalation Matrix

| Severity | Response Time | Escalation Path           |
| -------- | ------------- | ------------------------- |
| Critical | Immediate     | On-call → Team Lead → CTO |
| High     | 15 minutes    | On-call → Team Lead       |
| Medium   | 30 minutes    | On-call                   |
| Low      | 4 hours       | Team queue                |

---

## 13. Quick Reference

### 13.1 Key Endpoints

- Health: `GET /api/health`
- Liveness: `GET /api/health/liveness`
- Readiness: `GET /api/health/readiness`
- Detailed: `GET /api/health/detailed`
- Metrics: `GET /api/metrics`

### 13.2 Important Metrics

- Transfer success rate:
  `sum(rate(tallow_transfers_total{status="success"}[5m])) / sum(rate(tallow_transfers_total[5m]))`
- Error rate: `sum(rate(tallow_errors_total[5m]))`
- Active connections: `tallow_active_connections`
- Memory usage: `tallow_process_resident_memory_bytes`

### 13.3 Common PromQL Queries

```promql
# P95 transfer duration
histogram_quantile(0.95, rate(tallow_transfer_duration_seconds_bucket[5m]))

# Failure rate by method
sum by (method) (rate(tallow_transfers_total{status="failed"}[5m]))

# Top 10 slowest endpoints
topk(10, histogram_quantile(0.95, sum by (path) (rate(tallow_http_request_duration_seconds_bucket[5m]))))
```

### 13.4 Environment Variables

| Variable                             | Required | Purpose               |
| ------------------------------------ | -------- | --------------------- |
| `NEXT_PUBLIC_SENTRY_DSN`             | No       | Sentry error tracking |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`       | No       | Plausible analytics   |
| `NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID` | No       | Feature flags         |
| `METRICS_TOKEN`                      | No       | Metrics endpoint auth |
| `HEALTH_CHECK_TOKEN`                 | No       | Detailed health auth  |
| `NEXT_PUBLIC_SIGNALING_URL`          | Yes      | WebRTC signaling      |

---

**End of Monitoring and Observability Documentation**

**Total Pages:** ~100 (combined parts) **Total Lines:** 2500+ **Coverage:**
Complete

For questions or updates, contact: sre-team@tallow.manisahome.com
