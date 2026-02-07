# Tallow Metrics - Quick Reference

## Import

```typescript
import {
  recordTransfer,
  recordConnection,
  recordEncryption,
  recordError,
  // ... other helpers
} from '@/lib/metrics';
```

## Common Operations

### Transfer Completed
```typescript
recordTransfer(bytes, duration, 'success', 'p2p', fileType);
```

### Transfer Failed
```typescript
recordTransfer(bytes, duration, 'failed', 'p2p', fileType);
recordError('transfer', 'high');
```

### Connection Established
```typescript
recordConnection('webrtc', true, 'srflx');
updateActiveConnections('webrtc', 1);
```

### Connection Closed
```typescript
updateActiveConnections('webrtc', -1);
```

### Encryption Operation
```typescript
recordEncryption('chacha20', 'encrypt', duration);
```

### Error Occurred
```typescript
recordError('crypto', 'high');
```

### Network Latency
```typescript
recordNetworkLatency(latency, 'internet');
```

### Room Created
```typescript
recordRoom('created');
recordActiveRooms(roomCount);
```

### Device Discovered
```typescript
recordDiscoveredDevices(deviceCount);
```

## Timed Operations

### Auto-timed Encryption
```typescript
const result = await timedEncryption('aes-gcm', 'encrypt', async () => {
  return await encrypt(data, key);
});
```

### Auto-timed Transfer
```typescript
await timedTransfer('p2p', async () => {
  await sendFile(file);
}, file.size, file.type);
```

### Manual Timing
```typescript
const stop = startTimer();
await doWork();
const duration = stop();
recordEncryption('ml-kem', 'keygen', duration);
```

## Metric Types

| Type | Use Case | Methods |
|------|----------|---------|
| Counter | Cumulative values | `inc(labels, amount)` |
| Gauge | Current values | `set(value)`, `inc()`, `dec()` |
| Histogram | Distributions | `observe(labels, value)` |
| Summary | Percentiles | `observe(labels, value)` |

## Label Values

### Status
- `success`, `failed`, `cancelled`

### Method
- `p2p`, `relay`

### Connection Type
- `webrtc`, `websocket`, `relay`, `local`, `internet`, `friend`

### Algorithm
- `ml-kem`, `chacha20`, `aes-gcm`, `ed25519`

### Operation
- `encrypt`, `decrypt`, `sign`, `verify`, `keygen`

### Error Type
- `crypto`, `network`, `transfer`, `validation`, `auth`, `storage`, `unknown`

### Severity
- `low`, `medium`, `high`, `critical`

## Endpoint

```bash
# View metrics
curl http://localhost:3000/api/metrics

# Prometheus scrape config
scrape_configs:
  - job_name: 'tallow'
    metrics_path: '/api/metrics'
    static_configs:
      - targets: ['localhost:3000']
```

## Common Queries

```promql
# Transfer rate
rate(tallow_transfers_total[5m])

# Success rate
rate(tallow_transfers_total{status="success"}[5m])
  / rate(tallow_transfers_total[5m])

# Active connections
sum(tallow_active_connections)

# P99 transfer duration
histogram_quantile(0.99,
  rate(tallow_transfer_duration_seconds_bucket[5m]))

# Error rate
rate(tallow_errors_total[5m])

# Throughput (bytes/sec)
rate(tallow_transfer_bytes_total[1m])
```

## Best Practices

✅ **Do:**
- Use counters for cumulative values
- Use gauges for current state
- Use histograms for distributions
- Keep label cardinality low
- Include units in metric names

❌ **Don't:**
- Don't put timestamps in labels
- Don't use user IDs in labels
- Don't expose sensitive data
- Don't forget to decrement gauges
