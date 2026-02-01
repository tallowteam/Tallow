# NAT Traversal Code Examples

Complete code examples for using TALLOW's NAT traversal optimization system.

## Table of Contents
1. [Basic Usage](#basic-usage)
2. [React Component Examples](#react-component-examples)
3. [Advanced Patterns](#advanced-patterns)
4. [Testing Examples](#testing-examples)
5. [Monitoring & Metrics](#monitoring--metrics)

---

## Basic Usage

### Example 1: Simple NAT Detection

```typescript
import { detectNATType } from '@/lib/network/nat-detection';

async function checkMyNAT() {
  const result = await detectNATType();

  console.log('NAT Type:', result.type);
  console.log('Confidence:', (result.confidence * 100).toFixed(1) + '%');
  console.log('Public IP:', result.publicIP || 'Unknown');

  // Interpret the result
  if (result.type === 'SYMMETRIC' || result.type === 'BLOCKED') {
    console.log('⚠️ Restrictive NAT - TURN server recommended');
  } else {
    console.log('✅ P2P connections should work well');
  }
}
```

### Example 2: Get Connection Strategy

```typescript
import { getConnectionStrategy } from '@/lib/network/nat-detection';

function determineStrategy(localNAT: NATType, remoteNAT: NATType) {
  const strategy = getConnectionStrategy(localNAT, remoteNAT);

  console.log('Recommended Strategy:', strategy.strategy);
  console.log('Timeout:', strategy.directTimeout + 'ms');
  console.log('Use TURN:', strategy.useTURN ? 'Yes' : 'No');
  console.log('Reason:', strategy.reason);

  return strategy;
}

// Example usage
const strategy = determineStrategy('FULL_CONE', 'RESTRICTED');
// Output:
// Recommended Strategy: direct
// Timeout: 15000ms
// Use TURN: No
// Reason: Favorable NAT combination, direct connection preferred
```

### Example 3: Generate ICE Configuration

```typescript
import { getOptimizedICEConfig } from '@/lib/network/nat-detection';

function createConnection(natType: NATType) {
  const iceConfig = getOptimizedICEConfig(
    natType,
    'turn:turn.example.com:3478',
    { username: 'user', credential: 'pass' }
  );

  const pc = new RTCPeerConnection(iceConfig);

  console.log('ICE Configuration:');
  console.log('- Transport Policy:', iceConfig.iceTransportPolicy);
  console.log('- Candidate Pool Size:', iceConfig.iceCandidatePoolSize);
  console.log('- ICE Servers:', iceConfig.iceServers?.length);

  return pc;
}
```

---

## React Component Examples

### Example 4: Basic React Integration

```typescript
import { useNATOptimizedConnection } from '@/lib/hooks/use-nat-optimized-connection';

function ConnectionStatus() {
  const {
    localNAT,
    remoteNAT,
    strategy,
    natDetecting,
    isReady,
  } = useNATOptimizedConnection({
    autoDetectNAT: true,
  });

  if (natDetecting) {
    return <div>Detecting NAT type...</div>;
  }

  return (
    <div>
      <h3>Connection Information</h3>
      <p>Local NAT: {localNAT || 'Unknown'}</p>
      <p>Remote NAT: {remoteNAT || 'Waiting for peer'}</p>
      <p>Strategy: {strategy?.strategy || 'Not determined'}</p>
      <p>Ready: {isReady ? '✅' : '⏳'}</p>
    </div>
  );
}
```

### Example 5: File Transfer with NAT Optimization

```typescript
import { useNATOptimizedConnection } from '@/lib/hooks/use-nat-optimized-connection';
import { useState } from 'react';

function FileTransfer() {
  const [file, setFile] = useState<File | null>(null);
  const [transferring, setTransferring] = useState(false);

  const {
    isReady,
    getICEConfig,
    startConnectionAttempt,
    recordConnectionSuccess,
    recordConnectionFailure,
    connecting,
    connectionType,
  } = useNATOptimizedConnection({
    onNATDetected: (result) => {
      console.log('NAT detected:', result.type);
    },
    onStrategySelected: (strategy) => {
      console.log('Using strategy:', strategy.strategy);
    },
    onConnectionSuccess: (time, type) => {
      console.log(`Connected in ${time}ms via ${type}`);
    },
  });

  const handleTransfer = async () => {
    if (!file || !isReady) return;

    setTransferring(true);
    startConnectionAttempt();
    const startTime = performance.now();

    try {
      // Get optimized ICE configuration
      const iceConfig = getICEConfig();
      const pc = new RTCPeerConnection(iceConfig);

      // Create data channel
      const channel = pc.createDataChannel('file-transfer');

      // Wait for connection
      await new Promise((resolve, reject) => {
        channel.onopen = resolve;
        channel.onerror = reject;

        // Create and send offer
        pc.createOffer().then(offer => {
          pc.setLocalDescription(offer);
          // Send offer to peer via signaling...
        });
      });

      // Transfer file
      await transferFile(channel, file);

      // Record success
      const connectionTime = performance.now() - startTime;
      recordConnectionSuccess(connectionTime, connectionType);

      console.log('Transfer complete!');
    } catch (error) {
      recordConnectionFailure(error.message);
      console.error('Transfer failed:', error);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        onClick={handleTransfer}
        disabled={!file || !isReady || transferring}
      >
        {transferring ? 'Transferring...' : 'Send File'}
      </button>

      {connecting && <p>Establishing connection...</p>}
    </div>
  );
}

async function transferFile(channel: RTCDataChannel, file: File) {
  // File transfer implementation...
}
```

### Example 6: Advanced Dashboard Component

```typescript
import { useNATOptimizedConnection } from '@/lib/hooks/use-nat-optimized-connection';
import { useEffect, useState } from 'react';

function ConnectionDashboard() {
  const {
    localNAT,
    localNATResult,
    remoteNAT,
    strategy,
    bestTURNServer,
    turnHealthy,
    connecting,
    connected,
    connectionType,
    connectionTime,
    getMetrics,
  } = useNATOptimizedConnection({
    autoDetectNAT: true,
    enableTURNHealth: true,
  });

  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, [getMetrics]);

  return (
    <div className="dashboard">
      <section>
        <h2>NAT Detection</h2>
        <div className="card">
          <div className="stat">
            <label>Local NAT Type:</label>
            <span className={`badge ${localNAT}`}>{localNAT}</span>
          </div>
          <div className="stat">
            <label>Detection Confidence:</label>
            <span>{(localNATResult?.confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="stat">
            <label>Public IP:</label>
            <span>{localNATResult?.publicIP || 'N/A'}</span>
          </div>
        </div>
      </section>

      <section>
        <h2>Connection Strategy</h2>
        <div className="card">
          <div className="stat">
            <label>Strategy:</label>
            <span className="badge">{strategy?.strategy}</span>
          </div>
          <div className="stat">
            <label>Timeout:</label>
            <span>{strategy?.directTimeout}ms</span>
          </div>
          <div className="stat">
            <label>Estimated Time:</label>
            <span>{strategy?.estimatedConnectionTime.toFixed(0)}ms</span>
          </div>
          <div className="stat">
            <label>Success Rate:</label>
            <span>
              {(strategy?.historicalSuccessRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </section>

      <section>
        <h2>TURN Servers</h2>
        <div className="card">
          <div className="stat">
            <label>Status:</label>
            <span className={turnHealthy ? 'healthy' : 'unhealthy'}>
              {turnHealthy ? '✅ Healthy' : '⚠️ Degraded'}
            </span>
          </div>
          <div className="stat">
            <label>Best Server:</label>
            <span>
              {bestTURNServer
                ? Array.isArray(bestTURNServer.urls)
                  ? bestTURNServer.urls[0]
                  : bestTURNServer.urls
                : 'None'}
            </span>
          </div>
        </div>
      </section>

      <section>
        <h2>Connection Status</h2>
        <div className="card">
          <div className="stat">
            <label>State:</label>
            <span className={`badge ${connected ? 'connected' : ''}`}>
              {connecting
                ? 'Connecting...'
                : connected
                ? 'Connected'
                : 'Idle'}
            </span>
          </div>
          {connected && (
            <>
              <div className="stat">
                <label>Type:</label>
                <span className="badge">{connectionType}</span>
              </div>
              <div className="stat">
                <label>Time:</label>
                <span>{connectionTime}ms</span>
              </div>
            </>
          )}
        </div>
      </section>

      {metrics && (
        <section>
          <h2>Historical Metrics</h2>
          <div className="card">
            {Object.entries(metrics).map(([strategy, data]) => (
              <div key={strategy} className="metric-row">
                <h4>{strategy.toUpperCase()}</h4>
                <div className="stat">
                  <label>Attempts:</label>
                  <span>{data.attempts}</span>
                </div>
                <div className="stat">
                  <label>Success Rate:</label>
                  <span>{(data.successRate * 100).toFixed(1)}%</span>
                </div>
                <div className="stat">
                  <label>Avg Time:</label>
                  <span>{data.avgConnectionTime.toFixed(0)}ms</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

---

## Advanced Patterns

### Example 7: Manual Strategy Selection

```typescript
import { getStrategySelector } from '@/lib/network/connection-strategy';

// Get the singleton instance
const selector = getStrategySelector();

// Get adaptive strategy
const strategy = selector.getStrategy('FULL_CONE', 'RESTRICTED');

console.log('Strategy:', strategy.strategy);
console.log('Confidence:', (strategy.confidence * 100).toFixed(1) + '%');

// Start tracking an attempt
const attemptId = selector.startAttempt(
  strategy.strategy,
  'FULL_CONE',
  'RESTRICTED',
  false // not using TURN
);

// Simulate connection...
await connect();

// Record success
selector.recordSuccess(strategy.strategy, 3500);

// Or record failure
// selector.recordFailure(strategy.strategy, 'timeout');

// Get quality assessment
const quality = selector.getQualityAssessment(strategy.strategy);
console.log('Quality:', quality); // 'excellent' | 'good' | 'fair' | 'poor'
```

### Example 8: TURN Health Monitoring

```typescript
import { initializeTURNHealth, getTURNHealthMonitor } from '@/lib/network/turn-health';

// Initialize with configuration
const monitor = initializeTURNHealth({
  servers: [
    {
      urls: 'turn:turn1.example.com:3478',
      username: 'user1',
      credential: 'pass1',
      priority: 1,
      region: 'us-east',
    },
    {
      urls: 'turn:turn2.example.com:3478',
      username: 'user2',
      credential: 'pass2',
      priority: 2,
      region: 'us-west',
    },
  ],
  healthCheckInterval: 60000,
  failureThreshold: 3,
  enableAutoFailover: true,
});

// Start monitoring
monitor.start();

// Get best server
const bestServer = monitor.getBestServer();
console.log('Best server:', bestServer?.urls);

// Get all servers sorted by health
const allServers = monitor.getAllServers();

// Get statistics
const stats = monitor.getStatistics();
console.log('Statistics:', {
  healthy: stats.healthy,
  degraded: stats.degraded,
  unhealthy: stats.unhealthy,
  avgLatency: stats.avgLatency.toFixed(0) + 'ms',
  avgSuccessRate: (stats.avgSuccessRate * 100).toFixed(1) + '%',
});

// Get health for specific server
const health = monitor.getServerHealth(bestServer);
if (health) {
  console.log('Server health:', {
    status: health.status,
    latency: health.latency.toFixed(0) + 'ms',
    successRate: (health.successRate * 100).toFixed(1) + '%',
  });
}

// Manually trigger health check
const results = await monitor.checkNow();
results.forEach(result => {
  console.log(result.success ? '✅' : '❌', result.server.urls, result.latency + 'ms');
});

// Stop monitoring
monitor.stop();
```

### Example 9: Connection with Timeout Handling

```typescript
import { useNATOptimizedConnection } from '@/lib/hooks/use-nat-optimized-connection';

function SmartConnection() {
  const {
    strategy,
    getICEConfig,
    startConnectionAttempt,
    recordConnectionSuccess,
    recordConnectionFailure,
  } = useNATOptimizedConnection();

  const connectWithTimeout = async () => {
    if (!strategy) return;

    startConnectionAttempt();
    const startTime = performance.now();

    // Use adaptive timeout from strategy
    const timeout = strategy.directTimeout;

    const connectionPromise = establishConnection(getICEConfig());
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), timeout)
    );

    try {
      const result = await Promise.race([
        connectionPromise,
        timeoutPromise,
      ]);

      const connectionTime = performance.now() - startTime;
      recordConnectionSuccess(connectionTime, result.type);

      return result;
    } catch (error) {
      recordConnectionFailure(error.message);
      throw error;
    }
  };

  return connectWithTimeout;
}

async function establishConnection(iceConfig: RTCConfiguration) {
  // WebRTC connection logic...
  return { type: 'direct', connection: /* ... */ };
}
```

---

## Testing Examples

### Example 10: Test NAT Detection

```typescript
import { detectNATType } from '@/lib/network/nat-detection';

async function testNATDetection() {
  console.log('Testing NAT detection...');

  const result = await detectNATType({
    timeout: 10000,
    stunServers: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
    ],
  });

  console.log('✅ NAT Detection Results:');
  console.log('  Type:', result.type);
  console.log('  Confidence:', (result.confidence * 100).toFixed(1) + '%');
  console.log('  Public IP:', result.publicIP || 'N/A');
  console.log('  Detection Time:', result.detectionTime.toFixed(0) + 'ms');
  console.log('  Candidates:', result.candidateCount);
  console.log('  SRFLX:', result.srflxCount);
  console.log('  Host:', result.hostCount);
  console.log('  Relay:', result.relayCount);

  return result;
}
```

### Example 11: Test All NAT Combinations

```typescript
import { getConnectionStrategy, type NATType } from '@/lib/network/nat-detection';

function testAllCombinations() {
  const natTypes: NATType[] = [
    'FULL_CONE',
    'RESTRICTED',
    'PORT_RESTRICTED',
    'SYMMETRIC',
    'BLOCKED',
  ];

  console.log('Testing all NAT combinations...\n');

  natTypes.forEach(local => {
    natTypes.forEach(remote => {
      const strategy = getConnectionStrategy(local, remote);

      console.log(`${local.padEnd(15)} + ${remote.padEnd(15)} = ${strategy.strategy.padEnd(13)} (${strategy.directTimeout}ms)`);
    });
  });
}
```

---

## Monitoring & Metrics

### Example 12: Export Metrics

```typescript
import { getStrategySelector } from '@/lib/network/connection-strategy';

function exportMetrics() {
  const selector = getStrategySelector();
  const metricsJson = selector.exportMetrics();

  // Save to file or send to analytics
  console.log('Metrics Export:', metricsJson);

  // Parse and analyze
  const metrics = JSON.parse(metricsJson);

  console.log('\n📊 Summary:');
  Object.entries(metrics.history).forEach(([strategy, data]) => {
    if (data.attempts > 0) {
      console.log(`\n${strategy.toUpperCase()}:`);
      console.log(`  Attempts: ${data.attempts}`);
      console.log(`  Success Rate: ${(data.successRate * 100).toFixed(1)}%`);
      console.log(`  Avg Time: ${data.avgConnectionTime.toFixed(0)}ms`);
    }
  });
}
```

### Example 13: Real-time Metrics Dashboard

```typescript
import { useEffect, useState } from 'react';
import { getStrategySelector } from '@/lib/network/connection-strategy';
import { getTURNHealthMonitor } from '@/lib/network/turn-health';

function MetricsDashboard() {
  const [strategyMetrics, setStrategyMetrics] = useState(null);
  const [turnStats, setTurnStats] = useState(null);

  useEffect(() => {
    const updateMetrics = () => {
      // Get strategy metrics
      const selector = getStrategySelector();
      setStrategyMetrics(selector.getMetrics());

      // Get TURN health stats (if monitoring is enabled)
      try {
        const monitor = getTURNHealthMonitor();
        setTurnStats(monitor.getStatistics());
      } catch {
        // TURN monitoring not initialized
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Strategy Performance</h2>
      {strategyMetrics && Object.entries(strategyMetrics).map(([name, data]) => (
        <div key={name}>
          <h3>{name}</h3>
          <div>Attempts: {data.attempts}</div>
          <div>Success Rate: {(data.successRate * 100).toFixed(1)}%</div>
          <div>Avg Time: {data.avgConnectionTime.toFixed(0)}ms</div>
        </div>
      ))}

      {turnStats && (
        <>
          <h2>TURN Server Health</h2>
          <div>Healthy: {turnStats.healthy}</div>
          <div>Degraded: {turnStats.degraded}</div>
          <div>Unhealthy: {turnStats.unhealthy}</div>
          <div>Avg Latency: {turnStats.avgLatency.toFixed(0)}ms</div>
        </>
      )}
    </div>
  );
}
```

### Example 14: Analytics Integration

```typescript
import { useNATOptimizedConnection } from '@/lib/hooks/use-nat-optimized-connection';

function AnalyticsComponent() {
  const connection = useNATOptimizedConnection({
    onNATDetected: (result) => {
      // Send to analytics
      analytics.track('NAT Detected', {
        type: result.type,
        confidence: result.confidence,
        detectionTime: result.detectionTime,
      });
    },

    onStrategySelected: (strategy) => {
      // Send to analytics
      analytics.track('Strategy Selected', {
        strategy: strategy.strategy,
        timeout: strategy.directTimeout,
        useTURN: strategy.useTURN,
        successRate: strategy.historicalSuccessRate,
      });
    },

    onConnectionSuccess: (time, type) => {
      // Send to analytics
      analytics.track('Connection Success', {
        connectionTime: time,
        connectionType: type,
      });
    },

    onConnectionFailure: (error) => {
      // Send to analytics
      analytics.track('Connection Failure', {
        error: error,
      });
    },
  });

  // Component logic...
}
```

---

## Complete Example: Production-Ready File Transfer

```typescript
import { useState, useCallback } from 'react';
import { useNATOptimizedConnection } from '@/lib/hooks/use-nat-optimized-connection';
import { toast } from 'sonner';

export function ProductionFileTransfer() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const {
    localNAT,
    strategy,
    isReady,
    connecting,
    connected,
    connectionType,
    connectionTime,
    getICEConfig,
    startConnectionAttempt,
    recordConnectionSuccess,
    recordConnectionFailure,
    resetConnection,
  } = useNATOptimizedConnection({
    autoDetectNAT: true,
    enableTURNHealth: true,
    onNATDetected: (result) => {
      toast.success(`NAT detected: ${result.type} (${(result.confidence * 100).toFixed(1)}% confidence)`);
    },
    onStrategySelected: (strategy) => {
      toast.info(`Using strategy: ${strategy.strategy}`);
    },
    onConnectionSuccess: (time, type) => {
      toast.success(`Connected in ${time}ms via ${type}`);
    },
    onConnectionFailure: (error) => {
      toast.error(`Connection failed: ${error}`);
    },
  });

  const handleTransfer = useCallback(async () => {
    if (!file || !isReady) return;

    startConnectionAttempt();
    const startTime = performance.now();

    try {
      // Get optimized configuration
      const iceConfig = getICEConfig();
      if (!iceConfig) throw new Error('ICE config not available');

      // Create peer connection
      const pc = new RTCPeerConnection(iceConfig);
      const channel = pc.createDataChannel('file-transfer', {
        ordered: true,
      });

      // Set up channel handlers
      channel.onopen = () => {
        console.log('Channel open, starting transfer');
      };

      channel.onclose = () => {
        console.log('Channel closed');
      };

      channel.onerror = (error) => {
        console.error('Channel error:', error);
      };

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, strategy?.directTimeout || 15000);

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'connected') {
            clearTimeout(timeout);
            resolve();
          } else if (pc.iceConnectionState === 'failed') {
            clearTimeout(timeout);
            reject(new Error('ICE connection failed'));
          }
        };

        // Create offer and handle signaling...
        pc.createOffer().then(offer => {
          pc.setLocalDescription(offer);
          // Send offer to peer via signaling server
        });
      });

      // Transfer file
      const chunkSize = 64 * 1024; // 64KB
      let offset = 0;

      while (offset < file.size) {
        // Check backpressure
        while (channel.bufferedAmount > 1024 * 1024) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        const slice = file.slice(offset, offset + chunkSize);
        const buffer = await slice.arrayBuffer();
        channel.send(buffer);

        offset += buffer.byteLength;
        setProgress((offset / file.size) * 100);
      }

      // Record success
      const connectionTime = performance.now() - startTime;
      recordConnectionSuccess(connectionTime, connectionType);

      toast.success('File transferred successfully!');
    } catch (error) {
      recordConnectionFailure(error.message);
      toast.error(`Transfer failed: ${error.message}`);
    } finally {
      setProgress(0);
    }
  }, [file, isReady, getICEConfig, strategy, startConnectionAttempt, recordConnectionSuccess, recordConnectionFailure, connectionType]);

  return (
    <div className="file-transfer">
      <div className="info">
        <div>NAT Type: {localNAT || 'Detecting...'}</div>
        <div>Strategy: {strategy?.strategy || 'Unknown'}</div>
        <div>Status: {connecting ? 'Connecting' : connected ? 'Connected' : 'Ready'}</div>
        {connected && <div>Connection Type: {connectionType}</div>}
      </div>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        disabled={!isReady}
      />

      <button
        onClick={handleTransfer}
        disabled={!file || !isReady || connecting}
      >
        {connecting ? 'Connecting...' : 'Transfer File'}
      </button>

      {progress > 0 && (
        <div className="progress">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <span>{progress.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
```

---

These examples demonstrate all aspects of the NAT traversal optimization system, from basic usage to production-ready implementations.
