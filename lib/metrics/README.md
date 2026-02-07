# Tallow Metrics System

Prometheus-compatible metrics implementation for monitoring Tallow file transfer operations, connections, encryption, and system health.

## Architecture

The metrics system consists of three main components:

1. **`prometheus.ts`** - Core Prometheus implementation with metric types (Counter, Gauge, Histogram, Summary)
2. **`index.ts`** - Helper functions and pre-configured metrics for easy usage
3. **`app/api/metrics/route.ts`** - HTTP endpoint exposing metrics in Prometheus format

## Metric Types

### Counter
Increment-only metric for counting events (requests, errors, transfers, etc.)

```typescript
counter.inc(labels, amount);
```

### Gauge
Up/down metric for current values (active connections, memory usage, etc.)

```typescript
gauge.set(labels, value);
gauge.inc(labels, amount);
gauge.dec(labels, amount);
```

### Histogram
Distribution of values in configurable buckets (request duration, file size, etc.)

```typescript
histogram.observe(labels, value);
```

### Summary
Percentile tracking (p50, p90, p99, etc.)

```typescript
summary.observe(labels, value);
```

## Available Metrics

### Transfer Metrics

- `tallow_transfers_total{status}` - Total transfers (counter)
  - Labels: `status` = "success" | "failed" | "cancelled"

- `tallow_transfer_bytes_total{direction}` - Total bytes transferred (counter)
  - Labels: `direction` = "sent" | "received"

- `tallow_transfer_duration_seconds{status,method}` - Transfer duration (histogram)
  - Labels: `status`, `method` = "p2p" | "relay"

- `tallow_file_size_bytes{file_type}` - File size distribution (histogram)
  - Labels: `file_type` = MIME type or extension

### Connection Metrics

- `tallow_active_connections{type}` - Current active connections (gauge)
  - Labels: `type` = "webrtc" | "websocket" | "relay" | "local" | "internet"

- `tallow_peer_connections_total{type}` - Total peer connections (counter)
  - Labels: `type` = "local" | "internet" | "friend"

- `tallow_webrtc_connections_total{status,connection_type}` - WebRTC connections (counter)
  - Labels: `status` = "success" | "failed", `connection_type` = "host" | "srflx" | "relay"

- `tallow_webrtc_connection_time_seconds{connection_type}` - WebRTC connection time (histogram)

### Encryption Metrics

- `tallow_encryption_operations_total{algorithm,operation}` - Crypto operations (counter)
  - Labels: `algorithm` = "ml-kem" | "chacha20" | "aes-gcm" | "ed25519", `operation` = "encrypt" | "decrypt" | "sign" | "verify" | "keygen"

- `tallow_encryption_duration_seconds{algorithm,operation}` - Crypto operation duration (histogram)

### Discovery Metrics

- `tallow_discovery_devices_found` - Devices discovered on network (gauge)

### Room Metrics

- `tallow_rooms_active` - Currently active transfer rooms (gauge)
- `tallow_rooms_total{status}` - Total rooms (counter)
  - Labels: `status` = "created" | "joined" | "expired" | "closed"

### Error Metrics

- `tallow_errors_total{type,severity}` - Total errors (counter)
  - Labels: `type` = "crypto" | "network" | "transfer" | "validation" | "auth" | "storage", `severity` = "low" | "medium" | "high" | "critical"

### Network Metrics

- `tallow_network_latency_seconds{peer_type}` - Network latency (histogram)
  - Labels: `peer_type` = "local" | "internet" | "relay"

### Privacy Metrics

- `tallow_metadata_stripped_total{file_type}` - Files with metadata stripped (counter)

### System Metrics

- `tallow_memory_usage_bytes{type}` - Memory usage (gauge)
  - Labels: `type` = "heap" | "external" | "rss"

## Usage Examples

### Basic Usage

```typescript
import {
  recordTransfer,
  recordConnection,
  recordEncryption,
  recordError,
} from '@/lib/metrics';

// Record a successful file transfer
recordTransfer(
  1024000,      // bytes
  5.2,          // duration in seconds
  'success',    // status
  'p2p',        // method
  'image/png'   // file type
);

// Record a WebRTC connection
recordConnection('webrtc', true, 'srflx');

// Record encryption operation
recordEncryption('chacha20', 'encrypt', 0.025);

// Record an error
recordError('network', 'high');
```

### Advanced Usage - Timed Operations

```typescript
import { timedEncryption, timedTransfer } from '@/lib/metrics';

// Automatically time and record encryption
const encrypted = await timedEncryption('aes-gcm', 'encrypt', async () => {
  return await encryptData(data, key);
});

// Automatically time and record transfer
await timedTransfer('p2p', async () => {
  await sendFile(file, peer);
}, file.size, file.type);
```

### Manual Timing

```typescript
import { startTimer, recordEncryption } from '@/lib/metrics';

const stopTimer = startTimer();

await performCryptoOperation();

const duration = stopTimer(); // Returns duration in seconds
recordEncryption('ml-kem', 'keygen', duration);
```

### Connection Tracking

```typescript
import { updateActiveConnections, recordWebRTCConnectionTime } from '@/lib/metrics';

// Connection established
updateActiveConnections('webrtc', 1);
recordWebRTCConnectionTime(1.5, 'srflx');

// Connection closed
updateActiveConnections('webrtc', -1);
```

### Room Management

```typescript
import { recordActiveRooms, recordRoom } from '@/lib/metrics';

// Room created
recordRoom('created');
recordActiveRooms(5); // 5 active rooms

// Room closed
recordRoom('closed');
recordActiveRooms(4); // 4 active rooms
```

### Discovery Tracking

```typescript
import { recordDiscoveredDevices } from '@/lib/metrics';

// Update discovered devices count
recordDiscoveredDevices(12);
```

### Custom Metrics

```typescript
import { createCounter, createHistogram, getRegistry } from '@/lib/metrics';

// Create custom counter
const myCounter = createCounter(
  'tallow_custom_events_total',
  'Custom events counter',
  ['event_type']
);

myCounter.inc({ event_type: 'user_action' });

// Create custom histogram
const myHistogram = createHistogram(
  'tallow_custom_duration_seconds',
  'Custom operation duration',
  [0.1, 0.5, 1, 5, 10],
  ['operation']
);

myHistogram.observe({ operation: 'process' }, 2.5);

// Register with global registry
const registry = getRegistry();
registry.register(myCounter, 'custom_counter');
registry.register(myHistogram, 'custom_histogram');
```

## Prometheus Integration

### Scrape Configuration

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'tallow'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
```

### Query Examples

```promql
# Transfer success rate
rate(tallow_transfers_total{status="success"}[5m])
  / rate(tallow_transfers_total[5m])

# Average transfer duration
rate(tallow_transfer_duration_seconds_sum[5m])
  / rate(tallow_transfer_duration_seconds_count[5m])

# 99th percentile transfer duration
histogram_quantile(0.99,
  rate(tallow_transfer_duration_seconds_bucket[5m]))

# Active connections by type
sum by (type) (tallow_active_connections)

# Error rate by type
rate(tallow_errors_total[5m])

# Bytes transferred per second
rate(tallow_transfer_bytes_total[1m])

# WebRTC connection success rate
rate(tallow_webrtc_connections_total{status="success"}[5m])
  / rate(tallow_webrtc_connections_total[5m])
```

## Grafana Dashboard

### Key Panels

1. **Transfer Overview**
   - Total transfers (graph)
   - Success rate (gauge)
   - Bytes transferred (graph)
   - Average duration (stat)

2. **Connections**
   - Active connections by type (graph)
   - Connection establishment time (heatmap)
   - Connection success rate (gauge)

3. **Encryption**
   - Operations per second by algorithm (graph)
   - Average operation duration (stat)
   - Operation distribution (pie chart)

4. **Errors**
   - Error rate by type (graph)
   - Error severity distribution (bar chart)

5. **System Health**
   - Memory usage (graph)
   - Active rooms (stat)
   - Discovered devices (stat)

## Testing

### View Metrics

```bash
# Start development server
npm run dev

# View metrics
curl http://localhost:3000/api/metrics
```

### Sample Output

```
# HELP tallow_transfers_total Total number of file transfers
# TYPE tallow_transfers_total counter
tallow_transfers_total{status="success"} 42
tallow_transfers_total{status="failed"} 3
tallow_transfers_total{status="cancelled"} 1

# HELP tallow_active_connections Number of currently active peer connections
# TYPE tallow_active_connections gauge
tallow_active_connections{type="webrtc"} 5
tallow_active_connections{type="local"} 3

# HELP tallow_transfer_duration_seconds File transfer duration in seconds
# TYPE tallow_transfer_duration_seconds histogram
tallow_transfer_duration_seconds_bucket{status="success",method="p2p",le="0.1"} 5
tallow_transfer_duration_seconds_bucket{status="success",method="p2p",le="0.5"} 12
tallow_transfer_duration_seconds_bucket{status="success",method="p2p",le="1"} 25
tallow_transfer_duration_seconds_bucket{status="success",method="p2p",le="+Inf"} 42
tallow_transfer_duration_seconds_sum{status="success",method="p2p"} 125.5
tallow_transfer_duration_seconds_count{status="success",method="p2p"} 42
```

## Best Practices

### Do's

✅ Use counters for cumulative values (transfers, bytes, requests)
✅ Use gauges for current state (active connections, memory usage)
✅ Use histograms for distributions (duration, size, latency)
✅ Keep label cardinality low (< 10 unique values per label)
✅ Use consistent naming conventions
✅ Add units to metric names (`_seconds`, `_bytes`, `_total`)
✅ Include help text describing what metric measures

### Don'ts

❌ Don't use timestamps in labels (creates infinite cardinality)
❌ Don't use user IDs or dynamic values in labels
❌ Don't create metrics in hot paths without checking performance
❌ Don't forget to decrement gauges when values decrease
❌ Don't use metrics for debugging (use logging instead)

## Performance Considerations

- Metrics collection has minimal overhead (<1ms per operation)
- Use histograms for distributions, not summaries (more efficient)
- Keep label cardinality low to prevent memory issues
- Consider sampling for high-frequency operations
- Metrics endpoint should be behind internal network in production

## Security

⚠️ **Important**: The metrics endpoint exposes operational data.

### Production Deployment

1. **Network Isolation**: Deploy behind internal network/VPN
2. **Firewall Rules**: Only allow Prometheus server access
3. **No Authentication Data**: Never include passwords, tokens, or PII in metrics
4. **Rate Limiting**: Implement rate limiting on metrics endpoint
5. **Monitoring**: Alert on unusual metric access patterns

### Sensitive Metrics

Avoid exposing these in metrics:
- User identifiers (email, username, IP)
- Authentication tokens
- File contents or names
- Personal information
- Business-critical numbers

## Troubleshooting

### Metrics not updating

Check that you're:
1. Using the correct helper functions
2. Calling functions with valid parameters
3. Not hitting label cardinality limits

### High memory usage

Likely causes:
1. Too many unique label combinations
2. Not cleaning up old metrics
3. Using timestamps or IDs in labels

### Prometheus can't scrape

Verify:
1. Endpoint is accessible: `curl http://localhost:3000/api/metrics`
2. No firewall blocking requests
3. Correct path in `prometheus.yml`
4. Content-Type header is correct

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Metric Naming Best Practices](https://prometheus.io/docs/practices/naming/)
- [Histogram vs Summary](https://prometheus.io/docs/practices/histograms/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
