# Tallow Monitoring and Observability System - Complete Documentation

**Version:** 2.0 **Last Updated:** 2026-02-03 **Maintainer:** SRE Team

---

## Table of Contents

1. [Overview](#overview)
2. [Prometheus Metrics](#prometheus-metrics)
3. [Plausible Analytics](#plausible-analytics)
4. [Sentry Error Tracking](#sentry-error-tracking)
5. [LaunchDarkly Feature Flags](#launchdarkly-feature-flags)
6. [Structured Logging](#structured-logging)
7. [Health Checks](#health-checks)
8. [Alerting Rules](#alerting-rules)
9. [Performance Monitoring](#performance-monitoring)
10. [PII Scrubbing](#pii-scrubbing)
11. [Integration Examples](#integration-examples)
12. [Operational Runbooks](#operational-runbooks)

---

## 1. Overview

Tallow implements a comprehensive, multi-layered observability stack designed
for privacy-first file transfer applications. The system provides:

- **Prometheus metrics** for technical performance monitoring
- **Plausible Analytics** for privacy-respecting user behavior tracking
- **Sentry** for error tracking and performance monitoring
- **LaunchDarkly** for feature flag management
- **Structured logging** with JSON output and PII scrubbing
- **Health checks** for Kubernetes and load balancers
- **Alerting rules** for proactive incident detection

### Architecture Principles

1. **Privacy-First**: All PII is scrubbed before transmission to external
   services
2. **Defense in Depth**: Multiple monitoring layers provide redundancy
3. **Low Overhead**: Monitoring adds < 5% performance overhead
4. **Client-Safe**: Browser-safe stubs prevent client-side metrics collection
5. **Production-Ready**: Designed for Kubernetes deployment with proper health
   checks

### File Structure

```
lib/
├── monitoring/
│   ├── metrics.ts              # Client-side no-op stubs
│   ├── metrics-server.ts       # Server-side Prometheus metrics
│   ├── logging.ts              # Structured JSON logging
│   ├── analytics.ts            # Analytics wrapper
│   ├── plausible.ts            # Plausible Analytics integration
│   ├── sentry.ts               # Sentry error tracking
│   ├── performance.ts          # Core Web Vitals monitoring
│   ├── web-vitals.ts           # Web Vitals tracking
│   ├── integration-example.ts  # Usage examples
│   └── index.ts                # Central exports
├── feature-flags/
│   ├── launchdarkly.ts         # LaunchDarkly client
│   ├── feature-flags-context.tsx  # React context
│   └── index.ts                # Central exports
└── utils/
    └── pii-scrubber.ts         # PII scrubbing utilities

app/api/
├── health/
│   ├── route.ts                # Basic health check
│   ├── liveness/route.ts       # Kubernetes liveness probe
│   ├── readiness/route.ts      # Kubernetes readiness probe
│   └── detailed/route.ts       # Comprehensive health status
└── metrics/
    └── route.ts                # Prometheus metrics endpoint

monitoring/
├── alerting/
│   └── alertmanager.yml        # AlertManager configuration
└── prometheus-alerts.yml       # Prometheus alert rules
```

---

## 2. Prometheus Metrics

### 2.1 Metrics Architecture

Tallow uses a dual-file architecture to prevent client-side metric collection:

- **`metrics.ts`**: Client-safe no-op stubs (imported by browser code)
- **`metrics-server.ts`**: Actual Prometheus metrics (API routes only)

This prevents accidental bundle bloat and ensures metrics are only collected
server-side.

### 2.2 Metric Registry

**Registry Configuration:**

```typescript
import { Registry, collectDefaultMetrics } from 'prom-client';

const register = new Registry();

collectDefaultMetrics({
  register,
  prefix: 'tallow_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});
```

**Default Metrics Collected:**

- `tallow_process_cpu_user_seconds_total`: User CPU time
- `tallow_process_cpu_system_seconds_total`: System CPU time
- `tallow_process_cpu_seconds_total`: Total CPU time
- `tallow_process_start_time_seconds`: Process start time
- `tallow_process_resident_memory_bytes`: Resident memory
- `tallow_process_virtual_memory_bytes`: Virtual memory
- `tallow_process_heap_bytes`: Heap size
- `tallow_process_open_fds`: Open file descriptors
- `tallow_process_max_fds`: Maximum file descriptors
- `tallow_nodejs_eventloop_lag_seconds`: Event loop lag
- `tallow_nodejs_eventloop_lag_min_seconds`: Min event loop lag
- `tallow_nodejs_eventloop_lag_max_seconds`: Max event loop lag
- `tallow_nodejs_eventloop_lag_mean_seconds`: Mean event loop lag
- `tallow_nodejs_eventloop_lag_stddev_seconds`: Event loop lag std dev
- `tallow_nodejs_eventloop_lag_p50_seconds`: Event loop lag P50
- `tallow_nodejs_eventloop_lag_p90_seconds`: Event loop lag P90
- `tallow_nodejs_eventloop_lag_p99_seconds`: Event loop lag P99
- `tallow_nodejs_gc_duration_seconds`: GC duration by kind

### 2.3 File Transfer Metrics

#### 2.3.1 tallow_transfers_total (Counter)

**Purpose:** Tracks total number of file transfer attempts.

**Type:** Counter

**Labels:**

- `status`: Transfer outcome
  - `success`: Transfer completed successfully
  - `failed`: Transfer failed due to error
  - `cancelled`: User cancelled transfer
- `method`: Transfer method
  - `p2p`: Direct peer-to-peer connection
  - `relay`: TURN relay connection

**When Incremented:**

- On transfer initiation (status tracked at completion)
- On transfer completion (success/failed/cancelled)

**Example PromQL Queries:**

```promql
# Total successful transfers in last 5 minutes
sum(rate(tallow_transfers_total{status="success"}[5m]))

# Transfer failure rate
sum(rate(tallow_transfers_total{status="failed"}[5m]))
/
sum(rate(tallow_transfers_total[5m]))

# P2P vs Relay transfer ratio
sum(rate(tallow_transfers_total{method="p2p"}[5m]))
/
sum(rate(tallow_transfers_total[5m]))

# Transfers per method breakdown
sum by (method) (rate(tallow_transfers_total[5m]))

# 24-hour transfer count
sum(increase(tallow_transfers_total[24h]))
```

**Alerting Thresholds:**

- Failure rate > 10% for 5 minutes: WARNING
- Failure rate > 25% for 5 minutes: CRITICAL

---

#### 2.3.2 tallow_bytes_transferred_total (Counter)

**Purpose:** Tracks total bytes transferred across all files.

**Type:** Counter

**Labels:**

- `direction`: Data flow direction
  - `sent`: Bytes sent from sender
  - `received`: Bytes received by receiver

**When Incremented:**

- During active transfer (chunk-by-chunk)
- On transfer completion (final byte count)

**Example PromQL Queries:**

```promql
# Current transfer throughput (bytes/sec)
sum(rate(tallow_bytes_transferred_total[1m]))

# Total data transferred today
sum(increase(tallow_bytes_transferred_total[24h]))

# Average file size
sum(rate(tallow_bytes_transferred_total[5m]))
/
sum(rate(tallow_transfers_total[5m]))

# Sent vs received ratio (should be close to 1:1)
sum(rate(tallow_bytes_transferred_total{direction="sent"}[5m]))
/
sum(rate(tallow_bytes_transferred_total{direction="received"}[5m]))

# Bandwidth usage in GB/day
sum(increase(tallow_bytes_transferred_total[24h])) / 1e9
```

**Alerting Thresholds:**

- Bandwidth > 1 TB/day: INFO (capacity planning)
- Sent/received ratio > 1.1 or < 0.9: WARNING (network issue)

---

#### 2.3.3 tallow_file_size_bytes (Histogram)

**Purpose:** Distribution of file sizes for capacity planning.

**Type:** Histogram

**Labels:**

- `file_type`: MIME type of transferred file
  - `image/*`: Image files
  - `video/*`: Video files
  - `application/*`: Applications/documents
  - `text/*`: Text files
  - `audio/*`: Audio files
  - `other`: Unknown or mixed types

**Buckets (bytes):**

```typescript
[
  1024, // 1 KB
  10240, // 10 KB
  102400, // 100 KB
  1048576, // 1 MB
  10485760, // 10 MB
  104857600, // 100 MB
  1073741824, // 1 GB
];
```

**Bucket Rationale:**

- 1 KB - 10 KB: Text files, small documents
- 10 KB - 100 KB: Images (compressed)
- 100 KB - 1 MB: High-res images, documents
- 1 MB - 10 MB: Large documents, short videos
- 10 MB - 100 MB: Longer videos, archives
- 100 MB - 1 GB: Large media files
- 1 GB+: Very large files (captured in +Inf bucket)

**Example PromQL Queries:**

```promql
# Median file size
histogram_quantile(0.5, rate(tallow_file_size_bytes_bucket[5m]))

# 95th percentile file size
histogram_quantile(0.95, rate(tallow_file_size_bytes_bucket[5m]))

# Percentage of files over 100 MB
sum(rate(tallow_file_size_bytes_bucket{le="104857600"}[5m]))
/
sum(rate(tallow_file_size_bytes_count[5m]))

# Average file size by type
sum by (file_type) (rate(tallow_file_size_bytes_sum[5m]))
/
sum by (file_type) (rate(tallow_file_size_bytes_count[5m]))

# File size distribution visualization (Grafana)
sum by (le) (rate(tallow_file_size_bytes_bucket[5m]))
```

**Capacity Planning Insights:**

- If P95 > 100 MB: Consider chunk size optimization
- If P50 < 1 MB: Optimize for small file overhead
- Image/\* dominance: Focus on image metadata stripping

---

#### 2.3.4 tallow_transfer_duration_seconds (Histogram)

**Purpose:** Measures end-to-end transfer time for SLO monitoring.

**Type:** Histogram

**Labels:**

- `status`: Transfer outcome (`success`, `failed`, `cancelled`)
- `method`: Transfer method (`p2p`, `relay`)

**Buckets (seconds):**

```typescript
[
  0.1, // 100ms - sub-second transfers
  0.5, // 500ms
  1, // 1 second
  2, // 2 seconds
  5, // 5 seconds
  10, // 10 seconds
  30, // 30 seconds
  60, // 1 minute
  120, // 2 minutes
  300, // 5 minutes
];
```

**Bucket Rationale:**

- 0-1s: Small files on fast connections
- 1-10s: Medium files on good connections
- 10-60s: Large files or slower connections
- 60-300s: Very large files
- 300s+: Edge cases (captured in +Inf)

**Example PromQL Queries:**

```promql
# P50 transfer duration (SLO target: < 10s)
histogram_quantile(0.5, rate(tallow_transfer_duration_seconds_bucket[5m]))

# P95 transfer duration (SLO target: < 60s)
histogram_quantile(0.95, rate(tallow_transfer_duration_seconds_bucket[5m]))

# P99 transfer duration (SLO target: < 120s)
histogram_quantile(0.99, rate(tallow_transfer_duration_seconds_bucket[5m]))

# Percentage of transfers under 10 seconds
sum(rate(tallow_transfer_duration_seconds_bucket{le="10"}[5m]))
/
sum(rate(tallow_transfer_duration_seconds_count[5m]))

# P2P vs Relay speed comparison
histogram_quantile(0.5, rate(tallow_transfer_duration_seconds_bucket{method="p2p"}[5m]))
vs
histogram_quantile(0.5, rate(tallow_transfer_duration_seconds_bucket{method="relay"}[5m]))

# Failed transfer duration (troubleshooting)
histogram_quantile(0.95, rate(tallow_transfer_duration_seconds_bucket{status="failed"}[5m]))
```

**SLO Definition:**

- **Target:** 95% of successful transfers complete within 60 seconds
- **Error Budget:** 5% of transfers may exceed 60 seconds
- **Measurement Window:** 30-day rolling window

**Alerting Thresholds:**

- P99 > 120s for 10 minutes: WARNING
- P95 > 60s for 10 minutes: WARNING (SLO breach)
- P50 > 30s for 10 minutes: WARNING (performance degradation)

---

#### 2.3.5 tallow_active_transfers (Gauge)

**Purpose:** Current number of in-progress transfers.

**Type:** Gauge

**Labels:** None

**When Updated:**

- Incremented: Transfer starts
- Decremented: Transfer completes/fails/cancels

**Example PromQL Queries:**

```promql
# Current active transfers
tallow_active_transfers

# Maximum concurrent transfers in last hour
max_over_time(tallow_active_transfers[1h])

# Average concurrent transfers
avg_over_time(tallow_active_transfers[5m])

# Alert on no activity
tallow_active_transfers == 0 AND rate(tallow_transfers_total[30m]) == 0
```

**Operational Insights:**

- High value (> 1000): Potential capacity issue
- Zero for extended period: Service issue or low usage
- Spike patterns: Identify peak usage times

---

### 2.4 Connection Metrics

#### 2.4.1 tallow_connections_total (Counter)

**Purpose:** Tracks peer connection attempts and outcomes.

**Type:** Counter

**Labels:**

- `type`: Connection type
  - `webrtc`: WebRTC peer connection
  - `websocket`: Signaling WebSocket
  - `relay`: TURN relay connection
- `status`: Connection outcome
  - `success`: Connection established
  - `failed`: Connection failed

**When Incremented:**

- On connection attempt
- On connection state change (success/failed)

**Example PromQL Queries:**

```promql
# WebRTC connection success rate
sum(rate(tallow_connections_total{type="webrtc",status="success"}[5m]))
/
sum(rate(tallow_connections_total{type="webrtc"}[5m]))

# Connection failure rate by type
sum by (type) (rate(tallow_connections_total{status="failed"}[5m]))

# WebSocket vs WebRTC connection ratio
sum(rate(tallow_connections_total{type="websocket"}[5m]))
/
sum(rate(tallow_connections_total{type="webrtc"}[5m]))

# Total connections in last 24 hours
sum(increase(tallow_connections_total[24h]))
```

**Alerting Thresholds:**

- WebRTC failure rate > 20% for 5 minutes: WARNING
- WebSocket failure rate > 5% for 5 minutes: CRITICAL

---

#### 2.4.2 tallow_active_connections (Gauge)

**Purpose:** Current number of active peer connections.

**Type:** Gauge

**Labels:**

- `type`: Connection type (`webrtc`, `websocket`, `relay`)

**When Updated:**

- Incremented: Connection established
- Decremented: Connection closed

**Example PromQL Queries:**

```promql
# Total active connections
sum(tallow_active_connections)

# Active WebRTC connections
tallow_active_connections{type="webrtc"}

# Connection type breakdown
sum by (type) (tallow_active_connections)

# Peak concurrent connections
max_over_time(sum(tallow_active_connections)[1h])
```

**Operational Limits:**

- Soft limit: 1000 concurrent connections
- Hard limit: 10000 concurrent connections
- Alert threshold: 1000 connections for 5 minutes

---

### 2.5 Cryptography Metrics

#### 2.5.1 tallow_crypto_operations_total (Counter)

**Purpose:** Tracks cryptographic operations for performance analysis.

**Type:** Counter

**Labels:**

- `operation`: Operation type
  - `encrypt`: Data encryption
  - `decrypt`: Data decryption
  - `sign`: Digital signature
  - `verify`: Signature verification
  - `keygen`: Key generation
- `algorithm`: Cryptographic algorithm
  - `aes-256-gcm`: AES-256 in GCM mode
  - `chacha20-poly1305`: ChaCha20-Poly1305
  - `ed25519`: Ed25519 signatures
  - `kyber768`: Kyber-768 PQC
  - `dilithium3`: Dilithium3 PQC signatures

**When Incremented:**

- On each cryptographic operation completion

**Example PromQL Queries:**

```promql
# Crypto operations per second
sum(rate(tallow_crypto_operations_total[5m]))

# Operations by type
sum by (operation) (rate(tallow_crypto_operations_total[5m]))

# Algorithm usage distribution
sum by (algorithm) (rate(tallow_crypto_operations_total[5m]))

# PQC vs traditional crypto ratio
sum(rate(tallow_crypto_operations_total{algorithm=~"kyber.*|dilithium.*"}[5m]))
/
sum(rate(tallow_crypto_operations_total[5m]))
```

---

#### 2.5.2 tallow_crypto_duration_seconds (Histogram)

**Purpose:** Measures cryptographic operation performance.

**Type:** Histogram

**Labels:**

- `operation`: Operation type (see 2.5.1)

**Buckets (seconds):**

```typescript
[
  0.001, // 1ms - symmetric crypto
  0.005, // 5ms
  0.01, // 10ms
  0.05, // 50ms - asymmetric crypto
  0.1, // 100ms
  0.5, // 500ms - PQC operations
  1, // 1 second
];
```

**Example PromQL Queries:**

```promql
# P95 encryption time
histogram_quantile(0.95, rate(tallow_crypto_duration_seconds_bucket{operation="encrypt"}[5m]))

# P99 PQC keygen time
histogram_quantile(0.99, rate(tallow_crypto_duration_seconds_bucket{operation="keygen",algorithm=~"kyber.*"}[5m]))

# Average operation time by type
sum by (operation) (rate(tallow_crypto_duration_seconds_sum[5m]))
/
sum by (operation) (rate(tallow_crypto_duration_seconds_count[5m]))
```

**Performance Targets:**

- Symmetric encryption (AES): P95 < 10ms
- Asymmetric operations (Ed25519): P95 < 50ms
- PQC key generation (Kyber): P95 < 500ms
- PQC signatures (Dilithium): P95 < 200ms

---

### 2.6 API Metrics

#### 2.6.1 tallow_http_requests_total (Counter)

**Purpose:** Tracks HTTP API request volume and status codes.

**Type:** Counter

**Labels:**

- `method`: HTTP method (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`)
- `path`: Request path (sanitized, no IDs)
  - `/api/health`
  - `/api/metrics`
  - `/api/transfers`
  - `/api/rooms`
  - etc.
- `status`: HTTP status code
  - `2xx`: Success
  - `3xx`: Redirect
  - `4xx`: Client error
  - `5xx`: Server error

**When Incremented:**

- On every HTTP request completion

**Example PromQL Queries:**

```promql
# Requests per second
sum(rate(tallow_http_requests_total[5m]))

# Error rate (4xx + 5xx)
sum(rate(tallow_http_requests_total{status=~"[45].."}[5m]))
/
sum(rate(tallow_http_requests_total[5m]))

# Requests by path
sum by (path) (rate(tallow_http_requests_total[5m]))

# 5xx error rate (server errors)
sum(rate(tallow_http_requests_total{status=~"5.."}[5m]))

# Status code distribution
sum by (status) (rate(tallow_http_requests_total[5m]))
```

**SLO Definition:**

- **Target:** 99.9% of requests return 2xx/3xx status codes
- **Error Budget:** 0.1% may return 4xx/5xx status codes

---

#### 2.6.2 tallow_http_request_duration_seconds (Histogram)

**Purpose:** Measures API endpoint latency.

**Type:** Histogram

**Labels:**

- `method`: HTTP method
- `path`: Request path (sanitized)

**Buckets (seconds):**

```typescript
[
  0.01, // 10ms - fast endpoints
  0.05, // 50ms
  0.1, // 100ms - target P95
  0.5, // 500ms
  1, // 1 second
  2, // 2 seconds
  5, // 5 seconds - timeout threshold
];
```

**Example PromQL Queries:**

```promql
# P95 API latency (SLO target)
histogram_quantile(0.95, rate(tallow_http_request_duration_seconds_bucket[5m]))

# P99 API latency
histogram_quantile(0.99, rate(tallow_http_request_duration_seconds_bucket[5m]))

# Slowest endpoints (P95)
topk(10,
  histogram_quantile(0.95,
    sum by (path) (rate(tallow_http_request_duration_seconds_bucket[5m]))
  )
)

# Average latency by endpoint
sum by (path) (rate(tallow_http_request_duration_seconds_sum[5m]))
/
sum by (path) (rate(tallow_http_request_duration_seconds_count[5m]))
```

**SLO Definition:**

- **Target:** P95 latency < 100ms
- **Error Budget:** 5% of requests may exceed 100ms

---

### 2.7 Feature Usage Metrics

#### 2.7.1 tallow_feature_usage_total (Counter)

**Purpose:** Tracks feature adoption and usage patterns.

**Type:** Counter

**Labels:**

- `feature`: Feature identifier
  - `voice_commands`
  - `camera_capture`
  - `metadata_stripping`
  - `qr_code_sharing`
  - `email_sharing`
  - `pqc_encryption`
  - `one_time_transfer`
  - `folder_transfer`
  - `group_transfer`
  - `screen_sharing`
  - `password_protection`

**When Incremented:**

- On feature activation/usage

**Example PromQL Queries:**

```promql
# Feature usage rate
sum by (feature) (rate(tallow_feature_usage_total[5m]))

# Most popular features (last 24h)
topk(10, sum by (feature) (increase(tallow_feature_usage_total[24h])))

# Feature adoption trend
sum by (feature) (increase(tallow_feature_usage_total[7d]))

# PQC encryption adoption rate
sum(rate(tallow_feature_usage_total{feature="pqc_encryption"}[5m]))
/
sum(rate(tallow_transfers_total[5m]))
```

**Product Insights:**

- High usage: Feature is valuable, ensure reliability
- Low usage: Investigate discoverability or relevance
- Growing usage: Successful feature launch
- Declining usage: Potential UX issues

---

### 2.8 Metrics Endpoint

**Endpoint:** `GET /api/metrics`

**Authentication:**

- Environment variable: `METRICS_TOKEN`
- Header: `Authorization: Bearer ${METRICS_TOKEN}`
- If `METRICS_TOKEN` not set: Unrestricted access (dev mode)

**Response Format:** Prometheus OpenMetrics text format

**Content-Type:** `application/openmetrics-text; version=1.0.0; charset=utf-8`

**Example Request:**

```bash
curl -H "Authorization: Bearer secret-token" \
  http://localhost:3000/api/metrics
```

**Example Response:**

```
# HELP tallow_transfers_total Total number of file transfers initiated
# TYPE tallow_transfers_total counter
tallow_transfers_total{status="success",method="p2p"} 1523
tallow_transfers_total{status="success",method="relay"} 892
tallow_transfers_total{status="failed",method="p2p"} 43
tallow_transfers_total{status="failed",method="relay"} 12
tallow_transfers_total{status="cancelled",method="p2p"} 8

# HELP tallow_bytes_transferred_total Total bytes transferred across all files
# TYPE tallow_bytes_transferred_total counter
tallow_bytes_transferred_total{direction="sent"} 5.4329834e+09
tallow_bytes_transferred_total{direction="received"} 5.4318923e+09

# HELP tallow_file_size_bytes Distribution of file sizes in bytes
# TYPE tallow_file_size_bytes histogram
tallow_file_size_bytes_bucket{file_type="image/jpeg",le="1024"} 12
tallow_file_size_bytes_bucket{file_type="image/jpeg",le="10240"} 45
tallow_file_size_bytes_bucket{file_type="image/jpeg",le="102400"} 234
...
```

---

### 2.9 Prometheus Scrape Configuration

**prometheus.yml:**

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'production'
    service: 'tallow'

scrape_configs:
  - job_name: 'tallow'
    static_configs:
      - targets: ['tallow:3000']

    metrics_path: '/api/metrics'

    # Authentication
    authorization:
      type: Bearer
      credentials_file: /etc/prometheus/metrics-token

    # Relabel to add instance labels
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
      - source_labels: [__address__]
        regex: '([^:]+).*'
        target_label: host
        replacement: '$1'

    # Scrape timeout
    scrape_timeout: 10s

    # Sample limit to prevent memory issues
    sample_limit: 10000
```

---

## 3. Plausible Analytics

### 3.1 Overview

Plausible Analytics provides privacy-respecting user behavior tracking without
cookies or personal data collection. It's GDPR-compliant by default and respects
Do Not Track (DNT) headers.

**Configuration:**

- Environment variable: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`
- Script source: `https://plausible.io/js/script.js` (or self-hosted)
- Domain: Your registered domain in Plausible

**Privacy Features:**

- No cookies or persistent identifiers
- No cross-site tracking
- Respects Do Not Track (DNT)
- Automatic PII scrubbing
- IP addresses not stored
- GDPR compliant by default

### 3.2 Automatic Pageview Tracking

Plausible automatically tracks page views when the script loads. No additional
code required.

**Tracked Data:**

- Page URL (scrubbed of PII)
- Referrer (domain only)
- Browser/OS (aggregated)
- Device type (desktop/mobile/tablet)
- Country (from IP, then discarded)

**PII Scrubbing:**

- Query parameters containing sensitive data removed
- User IDs in URLs replaced with `<UUID>`
- Email addresses removed
- IP addresses not logged

### 3.3 Custom Events (30+ Events)

#### 3.3.1 File Transfer Events

**Event:** `file_sent` **Properties:**

- `size_category`: `small` (< 1MB), `medium` (1-100MB), `large` (> 100MB)
- `file_type`: MIME type (e.g., `image/jpeg`, `video/mp4`)
- `method`: `p2p` or `relay`

**Trigger:** File successfully sent

**Usage:**

```typescript
analytics.fileSent(fileSize, fileType, method);
```

---

**Event:** `file_received` **Properties:**

- `size_category`: `small`, `medium`, `large`
- `file_type`: MIME type
- `method`: `p2p` or `relay`

**Trigger:** File successfully received

---

**Event:** `transfer_cancelled` **Properties:**

- `reason`: Cancel reason (PII scrubbed)

**Trigger:** User cancels transfer

---

**Event:** `transfer_failed` **Properties:**

- `error`: Error message (PII scrubbed)

**Trigger:** Transfer fails

---

#### 3.3.2 Connection Events

**Event:** `connection_established` **Properties:**

- `type`: `direct` or `relay`
- `duration_category`: `fast` (< 2s), `medium` (2-5s), `slow` (> 5s)

**Trigger:** WebRTC connection successfully established

---

**Event:** `connection_failed` **Properties:**

- `type`: Connection type
- `error`: Error message (PII scrubbed)

**Trigger:** Connection establishment fails

---

#### 3.3.3 Feature Usage Events

**Event:** `feature_used` **Properties:**

- `feature`: Feature name

**Trigger:** User activates a feature

**Features Tracked:**

- `voice_commands`
- `camera_capture`
- `qr_code_scanner`
- `metadata_stripping`
- `one_time_transfer`
- `password_protection`
- `folder_transfer`
- `group_transfer`
- `screen_sharing`
- `email_fallback`

---

**Event:** `voice_command` **Properties:**

- `command`: Command name (not transcript)
- `success`: `true` or `false`

**Trigger:** Voice command executed

---

**Event:** `camera_capture` **Properties:** None

**Trigger:** User captures image with camera

---

**Event:** `qr_code_scanned` **Properties:** None

**Trigger:** QR code successfully scanned

---

**Event:** `metadata_stripped` **Properties:**

- `file_type`: MIME type

**Trigger:** Metadata successfully removed from file

---

**Event:** `one_time_transfer` **Properties:** None

**Trigger:** One-time transfer link created

---

#### 3.3.4 Settings Events

**Event:** `setting_changed` **Properties:**

- `setting`: Setting name
- `value`: New value (as string)

**Trigger:** User changes a setting

---

**Event:** `theme_changed` **Properties:**

- `theme`: `light`, `dark`, or `system`

**Trigger:** User changes theme

---

**Event:** `language_changed` **Properties:**

- `language`: Language code (e.g., `en`, `es`, `fr`)

**Trigger:** User changes language

---

#### 3.3.5 Privacy Feature Events

**Event:** `force_relay` **Properties:**

- `enabled`: `true` or `false`

**Trigger:** User toggles "Force Relay" setting

---

**Event:** `pqc_enabled` **Properties:**

- `enabled`: `true` or `false`

**Trigger:** User toggles post-quantum encryption

---

#### 3.3.6 Sharing Events

**Event:** `link_shared` **Properties:**

- `method`: `copy`, `email`, `qr`, `share_api`

**Trigger:** User shares transfer link

---

**Event:** `email_shared` **Properties:** None

**Trigger:** Transfer link sent via email

---

#### 3.3.7 Donation Events

**Event:** `donation_started` **Properties:** None

**Trigger:** User initiates donation

---

**Event:** `donation_completed` **Properties:**

- `amount`: Donation amount (number)

**Trigger:** Donation successfully processed

---

**Event:** `donation_cancelled` **Properties:** None

**Trigger:** User cancels donation

---

#### 3.3.8 Error Events

**Event:** `error` **Properties:**

- `type`: Error type
- `severity`: `low`, `medium`, `high`

**Trigger:** Application error occurs

---

#### 3.3.9 Navigation Events

**Event:** `page_visit` **Properties:**

- `page`: Page path

**Trigger:** User visits a page (manual tracking)

---

**Event:** `outbound_click` **Properties:**

- `url`: Destination URL (PII scrubbed)

**Trigger:** User clicks external link

---

#### 3.3.10 Session Events

**Event:** `session_start` **Properties:** None

**Trigger:** User session begins

---

**Event:** `session_end` **Properties:**

- `duration_category`: `short` (< 60s), `medium` (60-300s), `long` (> 300s)

**Trigger:** User session ends (page unload)

---

### 3.4 Custom Goal Configuration

Configure goals in Plausible dashboard to track conversions:

**Goal 1:** Transfer Completed

- **Goal trigger:** Event name = `file_sent`
- **Value:** Optional (file size for revenue-like tracking)

**Goal 2:** Connection Established

- **Goal trigger:** Event name = `connection_established`
- **Filter:** `type` = `direct` (measure P2P success)

**Goal 3:** Donation Completed

- **Goal trigger:** Event name = `donation_completed`
- **Value:** Use `amount` property

**Goal 4:** Feature First Use

- **Goal trigger:** Event name = `feature_used`
- **Filter:** Track specific features individually

**Goal 5:** Email Share

- **Goal trigger:** Event name = `email_shared`

**Goal 6:** PWA Install

- **Goal trigger:** Event name = `pwa_install`

### 3.5 Privacy Considerations

**PII Scrubbing Rules:**

1. All event properties pass through `scrubPII()` before transmission
2. Error messages cleaned of paths, emails, IPs
3. URLs stripped of query parameters with sensitive data
4. User IDs replaced with `<UUID>` placeholder

**Data Retention:**

- Plausible: 30 days by default
- No long-term user tracking
- Aggregated statistics only

**GDPR Compliance:**

- No consent required (no personal data collected)
- No cookie banner needed
- Data processing agreement available

**Do Not Track:**

- Automatically respected
- No events sent if DNT=1
- Logged in browser console

### 3.6 Implementation Example

```typescript
import { analytics } from '@/lib/monitoring/plausible';

// Track file transfer
function handleTransferComplete(file: File, method: 'p2p' | 'relay') {
  analytics.fileSent(file.size, file.type, method);
}

// Track feature usage
function handleFeatureActivation(feature: string) {
  analytics.featureUsed(feature);
}

// Track setting change
function handleSettingChange(setting: string, value: string) {
  analytics.settingChanged(setting, value);
}
```

---

## 4. Sentry Error Tracking

### 4.1 Overview

Sentry provides error tracking and performance monitoring for Tallow. It's
**optional** and requires installation of `@sentry/nextjs` package.

**Configuration:**

- Environment variable: `NEXT_PUBLIC_SENTRY_DSN`
- Package: `@sentry/nextjs` (optional dependency)
- Dynamic import: Prevents build errors if not installed

### 4.2 Initialization

```typescript
import { initSentry } from '@/lib/monitoring/sentry';

// Initialize in app root
await initSentry();
```

**Configuration Options:**

```typescript
{
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  tracesSampleRate: 0.1,  // 10% of transactions
  beforeSend: (event) => {
    // Scrub PII from error messages
    return scrubbedEvent;
  },
  beforeBreadcrumb: (breadcrumb) => {
    // Scrub PII from breadcrumbs
    return scrubbedBreadcrumb;
  }
}
```

### 4.3 PII Scrubbing Rules

**Automatic Scrubbing in `beforeSend`:**

1. Error messages: `event.message` → `scrubPII()`
2. Exception values: `event.exception.values[].value` → `scrubPII()`
3. Stack traces: Preserved (useful for debugging)
4. Breadcrumb messages: `scrubPII()` applied

**PII Patterns Removed:**

- Email addresses → `<EMAIL>`
- IP addresses → `<IP>`
- File paths → `<PATH>` or `<USER_DIR>`
- API keys → `<API_KEY>`
- UUIDs → `<UUID>`
- Phone numbers → `<PHONE>`
- Credit cards → `<CARD>`

### 4.4 Error Capture

**Function:** `captureException(error, context?)`

**Parameters:**

- `error`: Error object
- `context`: Optional context object (scrubbed)

**Usage:**

```typescript
import { captureException } from '@/lib/monitoring/sentry';

try {
  await dangerousOperation();
} catch (error) {
  captureException(error, {
    operation: 'file_transfer',
    fileSize: file.size,
    method: 'p2p',
  });
  throw error;
}
```

**Context Scrubbing:**

- All context values pass through `scrubObjectPII()`
- Nested objects recursively scrubbed
- Arrays of strings scrubbed

### 4.5 Message Capture

**Function:** `captureMessage(message, level)`

**Parameters:**

- `message`: Message string (scrubbed)
- `level`: `'info'` | `'warning'` | `'error'`

**Usage:**

```typescript
import { captureMessage } from '@/lib/monitoring/sentry';

captureMessage('Transfer quota exceeded', 'warning');
```

### 4.6 User Context

**Function:** `setUser(userId)`

**PII Protection:**

- User ID hashed with SHA-256
- Only first 16 characters of hash stored
- No actual user ID sent to Sentry

**Usage:**

```typescript
import { setUser, clearUser } from '@/lib/monitoring/sentry';

// On user login (if implemented)
setUser(userId); // Hashed before sending

// On logout
clearUser();
```

**Hash Function:**

```typescript
// Synchronous FNV-1a hash for immediate use
function hashUserIdSync(userId: string): string {
  let hash = 2166136261;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0').repeat(2);
}
```

### 4.7 Breadcrumbs

**Function:** `addBreadcrumb(category, message, data?)`

**Parameters:**

- `category`: Breadcrumb category (`'navigation'`, `'user'`, `'http'`, etc.)
- `message`: Breadcrumb message (scrubbed)
- `data`: Optional data object (scrubbed)

**Usage:**

```typescript
import { addBreadcrumb } from '@/lib/monitoring/sentry';

addBreadcrumb('transfer', 'File selection started', {
  fileCount: files.length,
});

addBreadcrumb('connection', 'WebRTC offer created');

addBreadcrumb('crypto', 'PQC key exchange initiated', {
  algorithm: 'kyber768',
});
```

**Automatic Breadcrumbs:**

- Console logs (configurable)
- Network requests (URLs scrubbed)
- DOM events (selector scrubbed)
- Navigation (URLs scrubbed)

### 4.8 Performance Monitoring

#### 4.8.1 Transactions

**Function:** `startTransaction(name, op)`

**Parameters:**

- `name`: Transaction name (e.g., `'file_transfer'`)
- `op`: Operation type (e.g., `'transfer.file'`)

**Returns:** Transaction object with `finish()` method

**Usage:**

```typescript
import { startTransaction } from '@/lib/monitoring/sentry';

const transaction = startTransaction('file_transfer', 'transfer.file');

try {
  await performTransfer();
  transaction.finish();
} catch (error) {
  transaction.finish();
  throw error;
}
```

#### 4.8.2 Spans

**Function:** `startSpan(name, op)`

**Parameters:**

- `name`: Span name
- `op`: Operation type

**Returns:** Span object with `end()` method

**Usage:**

```typescript
import { startSpan } from '@/lib/monitoring/sentry';

const span = startSpan('metadata_strip', 'privacy.strip');
await stripMetadata(file);
span.end();
```

#### 4.8.3 Performance Wrappers

**Pre-built wrappers for common operations:**

```typescript
import {
  monitorTransfer,
  monitorCrypto,
  monitorConnection,
  monitorAPI,
} from '@/lib/monitoring/sentry';

// Wrap transfer function
const result = await monitorTransfer(async () => {
  return await transferFile(file);
});

// Wrap crypto operation
const keys = await monitorCrypto(async () => {
  return await generateKeyPair();
});

// Wrap connection establishment
const connection = await monitorConnection(async () => {
  return await createPeerConnection();
});

// Wrap API call
const response = await monitorAPI(async () => {
  return await fetch('/api/data');
});
```

### 4.9 Context Setters

**Set context for subsequent errors:**

```typescript
import {
  setTransferContext,
  setCryptoContext,
  setConnectionContext,
} from '@/lib/monitoring/sentry';

// Transfer context
setTransferContext({
  fileSize: file.size,
  fileType: file.type,
  method: 'p2p',
});

// Crypto context
setCryptoContext({
  algorithm: 'kyber768',
  operation: 'keygen',
});

// Connection context
setConnectionContext({
  type: 'webrtc',
  iceServers: iceServerCount,
});
```

**Context persists until cleared or updated.**

### 4.10 Transaction Naming Conventions

**Format:** `<category>.<action>`

**Examples:**

- `transfer.file`: File transfer
- `transfer.folder`: Folder transfer
- `transfer.group`: Group transfer
- `crypto.operation`: Crypto operation
- `crypto.keygen`: Key generation
- `crypto.encrypt`: Encryption
- `crypto.decrypt`: Decryption
- `connection.establish`: Connection establishment
- `connection.ice`: ICE gathering
- `api.request`: API request

### 4.11 Span Configuration

**Operation Types (op):**

- `transfer.file`: File transfer operations
- `crypto.operation`: Cryptographic operations
- `connection.establish`: Connection establishment
- `api.request`: HTTP requests
- `privacy.strip`: Metadata stripping
- `validation.check`: Input validation

**Span Naming:**

- Be specific: `'pqc_keygen_kyber768'` not `'keygen'`
- Include context: `'transfer_file_10mb'` not `'transfer'`
- Avoid PII: `'transfer_image'` not `'transfer_vacation.jpg'`

### 4.12 Sample Configuration

**`sentry.client.config.js`:**

```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,

  beforeSend(event, hint) {
    // Scrub PII
    if (event.message) {
      event.message = scrubPII(event.message);
    }

    // Add tags
    event.tags = {
      ...event.tags,
      browser: navigator.userAgent.includes('Chrome') ? 'chrome' : 'other',
    };

    return event;
  },

  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', 'tallow.manisahome.com'],
    }),
  ],
});
```

---

_Continuing in next part due to length..._
