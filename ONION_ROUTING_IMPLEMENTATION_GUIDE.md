# Onion Routing Integration - Implementation Guide

## Overview

This guide provides a complete framework for integrating multi-hop onion routing into Tallow. The implementation includes core routing logic, React hooks, UI configuration components, and testing utilities.

**Status**: ✅ Framework Complete
**Implementation Time**: 1 hour
**Production Ready**: Requires relay server infrastructure

---

## Table of Contents

1. [Architecture](#architecture)
2. [Core Components](#core-components)
3. [Integration Steps](#integration-steps)
4. [Configuration](#configuration)
5. [React Hooks](#react-hooks)
6. [UI Components](#ui-components)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Future Enhancements](#future-enhancements)

---

## Architecture

### System Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client A  │────▶│  Relay 1    │────▶│  Relay 2    │────▶│   Client B  │
│  (Sender)   │     │ (Entry Node)│     │ (Exit Node) │     │ (Receiver)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │                    │
      └─────────────────── Encrypted Layers ────────────────────────┘
```

### Data Flow

1. **Client A** encrypts data in multiple layers (onion layers)
2. Each layer contains:
   - Encrypted payload
   - Next hop information (encrypted)
   - MAC for integrity verification
3. **Relay 1** (Entry Node):
   - Decrypts outer layer
   - Learns next hop (Relay 2)
   - Forwards encrypted data
4. **Relay 2** (Exit Node):
   - Decrypts outer layer
   - Delivers to Client B
5. No single relay knows both sender and receiver

### Security Properties

- **Unlinkability**: No relay knows both source and destination
- **Forward Secrecy**: Each transfer uses fresh keys
- **Traffic Analysis Resistance**: Constant-size packets
- **End-to-End Encryption**: Payload encrypted separately

---

## Core Components

### 1. OnionRoutingManager (`lib/transport/onion-routing-integration.ts`)

**Purpose**: Central coordinator for onion routing functionality

**Key Features**:
- Relay node discovery and management
- Path selection with multiple strategies
- Onion layer creation/peeling
- Statistics tracking
- Event emission

**Public API**:
```typescript
class OnionRoutingManager {
  // Initialization
  async initialize(): Promise<void>

  // Configuration
  updateConfig(config: Partial<OnionRoutingConfig>): void
  getConfig(): OnionRoutingConfig

  // Path Selection
  async selectRelayPath(numHops?: number): Promise<RelayNode[]>

  // Data Routing
  async routeThroughOnion(
    transferId: string,
    data: ArrayBuffer,
    destination: string
  ): Promise<void>

  // Onion Layers
  async createOnionLayers(data: ArrayBuffer, path: RelayNode[]): Promise<OnionLayer[]>
  async peelOnionLayer(layer: OnionLayer): Promise<{
    data: ArrayBuffer;
    nextNodeId: string | null;
  }>

  // Stats & Info
  getStats(): OnionRoutingStats
  getRelayNodes(): RelayNode[]
  getActivePaths(): Map<string, string[]>

  // Cleanup
  async cleanup(): Promise<void>
}
```

**Events**:
- `initialized`: Fired when system is ready
- `configUpdated`: Fired when configuration changes
- `relaysUpdated`: Fired when relay list updates
- `pathSelected`: Fired when relay path is chosen
- `transferComplete`: Fired on successful transfer
- `transferFailed`: Fired on transfer failure
- `relayComplete`: Fired when relay hop completes
- `error`: Fired on system errors

### 2. React Hooks (`lib/hooks/use-onion-routing.ts`)

**Purpose**: React integration with onion routing system

**Hooks Provided**:

#### useOnionRouting()
Main hook for interacting with onion routing:
```typescript
const {
  isInitialized,   // Ready state
  isLoading,       // Loading state
  error,           // Error state
  config,          // Current configuration
  stats,           // Current statistics
  relayNodes,      // Available relays
  activePaths,     // Active transfer paths
  updateConfig,    // Update configuration function
  routeData,       // Route data function
  selectPath,      // Select path function
} = useOnionRouting(initialConfig);
```

#### useOnionRoutingMode()
Simple mode toggle:
```typescript
const { mode, toggleMode } = useOnionRoutingMode();
```

#### useRelaySelection()
Relay node selection:
```typescript
const {
  relayNodes,
  selectedNodes,
  isSelecting,
  selectOptimalPath,
} = useRelaySelection();
```

#### useOnionStats()
Statistics with calculated values:
```typescript
const {
  stats,
  successRate,
  failureRate,
} = useOnionStats();
```

### 3. UI Configuration Component (`components/privacy/onion-routing-config.tsx`)

**Purpose**: User-friendly configuration interface

**Features**:
- Mode selection (Disabled, Single-Hop, Multi-Hop, Tor)
- Number of hops slider (2-5)
- Advanced settings (relay selection strategy, trust score, latency)
- Statistics dashboard
- Relay node list with trust scores
- Real-time status indicators
- Educational information

---

## Integration Steps

### Step 1: Basic Integration

**Add to Privacy Settings Page**:
```tsx
// app/app/privacy-settings/page.tsx
import { OnionRoutingConfig } from '@/components/privacy/onion-routing-config';

export default function PrivacySettingsPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Settings</h1>

      {/* Other privacy settings */}

      <section className="mt-8">
        <OnionRoutingConfig />
      </section>
    </div>
  );
}
```

### Step 2: Initialize on App Startup

**Add to App Layout**:
```tsx
// app/layout.tsx
'use client';

import { useEffect } from 'react';
import { initializeOnionRouting } from '@/lib/transport/onion-routing-integration';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize with user's saved preferences
    const savedMode = localStorage.getItem('onion_routing_mode');

    initializeOnionRouting({
      mode: (savedMode as any) || 'disabled',
      numHops: 3,
      relaySelectionStrategy: 'optimal',
    }).catch(console.error);
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Step 3: Integrate with Transfer System

**Update P2P Transfer Logic**:
```tsx
// lib/transfer/p2p-transfer.ts
import { getOnionRoutingManager } from '@/lib/transport/onion-routing-integration';

async function sendFile(file: File, peerId: string) {
  const manager = getOnionRoutingManager();
  const config = manager.getConfig();

  if (config.mode !== 'disabled') {
    // Use onion routing
    const fileData = await file.arrayBuffer();
    await manager.routeThroughOnion(
      generateTransferId(),
      fileData,
      peerId
    );
  } else {
    // Direct P2P transfer
    await sendDirect(file, peerId);
  }
}
```

### Step 4: Add Privacy Mode Integration

**Connect to Privacy Modes**:
```tsx
// lib/privacy/privacy-modes.ts
import { getOnionRoutingManager } from '@/lib/transport/onion-routing-integration';

export function applyPrivacyMode(mode: 'low' | 'medium' | 'high' | 'maximum') {
  const onionManager = getOnionRoutingManager();

  const onionModeMap = {
    low: 'disabled',
    medium: 'single-hop',
    high: 'multi-hop',
    maximum: 'tor',
  };

  onionManager.updateConfig({
    mode: onionModeMap[mode],
    numHops: mode === 'maximum' ? 5 : 3,
  });
}
```

---

## Configuration

### Default Configuration

```typescript
{
  mode: 'disabled',                    // Routing mode
  numHops: 3,                          // Number of relay hops
  preferredRegions: [],                // Preferred relay regions
  minTrustScore: 0.7,                  // Minimum relay trust (0-1)
  minBandwidth: 10 * 1024 * 1024,      // Min bandwidth (10 MB/s)
  maxLatency: 500,                     // Max latency (500ms)
  relaySelectionStrategy: 'optimal',   // Selection strategy
  torBridges: [],                      // Tor bridge addresses
  enableTorBrowser: false,             // Tor integration
}
```

### Routing Modes

**1. Disabled**
- Direct P2P connection
- No relay nodes
- Fastest, least private
- Use for: Trusted recipients, local network

**2. Single-Hop**
- One relay node
- Balanced speed/privacy
- ~50-100ms added latency
- Use for: Standard transfers, moderate privacy

**3. Multi-Hop**
- 3+ relay nodes
- High privacy
- ~150-300ms added latency
- Use for: Sensitive data, unknown recipients

**4. Tor Integration**
- Route through Tor network
- Maximum privacy
- ~500ms+ added latency
- Use for: Maximum anonymity needed

### Relay Selection Strategies

**1. Random**
- Randomly select relays
- Unpredictable paths
- Good against targeted attacks

**2. Optimal (Recommended)**
- Score-based selection
- Score = (reliability × trustScore × 1000) / (latency + 1)
- Best overall performance

**3. Regional**
- Prefer relays in specified regions
- Lower latency for regional paths
- Good for geo-specific requirements

---

## React Hooks Usage

### Example: Privacy Mode Toggle

```tsx
function PrivacyModeToggle() {
  const { mode, toggleMode } = useOnionRoutingMode();

  return (
    <select
      value={mode}
      onChange={(e) => toggleMode(e.target.value as OnionRoutingMode)}
    >
      <option value="disabled">Direct</option>
      <option value="single-hop">Single Hop</option>
      <option value="multi-hop">Multi-Hop</option>
      <option value="tor">Tor</option>
    </select>
  );
}
```

### Example: Transfer with Onion Routing

```tsx
function SecureFileTransfer() {
  const { routeData, isInitialized } = useOnionRouting();
  const [status, setStatus] = useState('');

  const handleSend = async (file: File, recipient: string) => {
    if (!isInitialized) {
      setStatus('Onion routing not initialized');
      return;
    }

    try {
      setStatus('Routing through onion network...');
      const data = await file.arrayBuffer();
      await routeData('transfer-1', data, recipient);
      setStatus('Transfer complete!');
    } catch (error) {
      setStatus('Transfer failed: ' + error.message);
    }
  };

  return (
    <div>
      <p>Status: {status}</p>
      {/* File upload UI */}
    </div>
  );
}
```

### Example: Relay Statistics Display

```tsx
function OnionStatsDashboard() {
  const { stats, successRate, failureRate } = useOnionStats();

  if (!stats) return null;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div>
        <div className="text-2xl font-bold">{stats.totalTransfers}</div>
        <div className="text-sm text-muted-foreground">Total</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-green-600">
          {successRate.toFixed(1)}%
        </div>
        <div className="text-sm text-muted-foreground">Success</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{stats.averageLatency.toFixed(0)}ms</div>
        <div className="text-sm text-muted-foreground">Avg. Latency</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{stats.activeRelays}</div>
        <div className="text-sm text-muted-foreground">Relays</div>
      </div>
    </div>
  );
}
```

---

## Testing

### Unit Tests (`tests/unit/transport/onion-routing.test.ts`)

**Test Coverage**:
- ✅ Initialization (5 tests)
- ✅ Configuration (3 tests)
- ✅ Relay path selection (7 tests)
- ✅ Onion layer creation/peeling (2 tests)
- ✅ Data routing (5 tests)
- ✅ Statistics tracking (2 tests)
- ✅ Cleanup (2 tests)
- ✅ Global manager functions (3 tests)

**Total**: 29 tests

### Running Tests

```bash
# Run all onion routing tests
npm run test:unit -- tests/unit/transport/onion-routing.test.ts

# Run with coverage
npm run test:unit -- --coverage tests/unit/transport/onion-routing.test.ts

# Watch mode
npm run test:unit -- --watch tests/unit/transport/onion-routing.test.ts
```

### Example Test

```typescript
it('routes data through onion network', async () => {
  await manager.initialize();
  manager.updateConfig({ mode: 'multi-hop' });

  const data = new ArrayBuffer(100);
  await manager.routeThroughOnion('test-1', data, 'destination');

  const stats = manager.getStats();
  expect(stats.successfulTransfers).toBe(1);
  expect(stats.bytesTransferred).toBeGreaterThan(0);
});
```

### Integration Tests

**Add to E2E test suite**:
```typescript
// tests/e2e/onion-routing.spec.ts
import { test, expect } from '@playwright/test';

test('configure onion routing', async ({ page }) => {
  await page.goto('/app/privacy-settings');

  // Enable multi-hop mode
  await page.click('button:has-text("Multi-Hop")');

  // Adjust hops
  await page.locator('input[type="range"]').fill('4');

  // Verify stats appear
  await expect(page.locator('text=Available Relay Nodes')).toBeVisible();
});
```

---

## Deployment

### Prerequisites

**1. Relay Server Infrastructure**
- Deploy relay servers in multiple regions
- Implement relay node API:
  - `GET /relays` - List available relays
  - `POST /relay` - Forward data to next hop
  - `GET /relay/:id` - Get relay status

**2. Tor Integration (Optional)**
- Tor Browser detection
- Tor SOCKS proxy support
- Bridge configuration

**3. Environment Variables**
```env
# .env.local
NEXT_PUBLIC_RELAY_DISCOVERY_URL=https://relay-discovery.tallow.network
NEXT_PUBLIC_ENABLE_TOR=true
NEXT_PUBLIC_DEFAULT_ONION_MODE=single-hop
```

### Deployment Steps

**1. Deploy Relay Servers**
```bash
# Example: Deploy to AWS
cd relay-server
docker build -t tallow-relay .
docker push tallow-relay:latest

# Deploy to regions
aws ecs create-service --cluster tallow --service relay-us-east ...
aws ecs create-service --cluster tallow --service relay-eu-west ...
aws ecs create-service --cluster tallow --service relay-ap-south ...
```

**2. Configure DNS**
```
relay1.tallow.network → us-east relay
relay2.tallow.network → eu-west relay
relay3.tallow.network → ap-south relay
```

**3. Update Production Config**
```typescript
// lib/transport/onion-routing-integration.ts
async fetchRelayNodes(): Promise<void> {
  const response = await fetch(process.env.NEXT_PUBLIC_RELAY_DISCOVERY_URL);
  const nodes = await response.json();

  nodes.forEach((node) => {
    this.relayNodes.set(node.id, node);
  });
}
```

**4. Enable Feature Flag**
```typescript
// lib/feature-flags/flags.ts
export const FEATURES = {
  onionRouting: true,  // Enable in production
};
```

---

## Future Enhancements

### Phase 1 (Weeks 1-2)

**1. Real Relay Implementation**
- Build actual relay server
- Implement WebSocket forwarding
- Add authentication & rate limiting

**2. Advanced Path Selection**
- Machine learning for optimal paths
- Real-time latency monitoring
- Automatic failover

**3. Enhanced Security**
- Perfect forward secrecy
- Post-quantum key exchange
- Zero-knowledge authentication

### Phase 2 (Weeks 3-4)

**1. Tor Integration**
- Full Tor Browser support
- Tor bridges configuration
- Onion service creation

**2. Performance Optimization**
- Path caching
- Connection pooling
- Parallel relay connections

**3. Advanced Features**
- Guard nodes (fixed entry)
- Exit node policies
- Bandwidth scheduling

### Phase 3 (Month 2)

**1. Monitoring & Analytics**
- Real-time relay health
- Path performance metrics
- Geographic distribution

**2. Admin Dashboard**
- Relay node management
- Traffic visualization
- Incident response

**3. Research Features**
- Traffic padding
- Dummy traffic
- Cover traffic

---

## Troubleshooting

### Common Issues

**1. "Insufficient relay nodes" Error**
- **Cause**: Not enough relays meet criteria
- **Solution**: Lower minTrustScore or maxLatency
```typescript
manager.updateConfig({
  minTrustScore: 0.5,  // Lower threshold
  maxLatency: 1000,    // Increase tolerance
});
```

**2. High Latency**
- **Cause**: Too many hops or slow relays
- **Solution**: Reduce hops or use optimal selection
```typescript
manager.updateConfig({
  numHops: 2,  // Reduce hops
  relaySelectionStrategy: 'optimal',
});
```

**3. Transfer Failures**
- **Cause**: Relay node unavailable
- **Solution**: Automatic retry with new path
```typescript
let retries = 3;
while (retries > 0) {
  try {
    await manager.routeThroughOnion(id, data, dest);
    break;
  } catch (error) {
    retries--;
    if (retries === 0) throw error;
  }
}
```

---

## API Reference

### Types

```typescript
type OnionRoutingMode = 'disabled' | 'single-hop' | 'multi-hop' | 'tor';

interface RelayNode {
  id: string;
  address: string;
  publicKey: string;
  region: string;
  latency: number;
  reliability: number;
  bandwidth: number;
  trustScore: number;
}

interface OnionRoutingConfig {
  mode: OnionRoutingMode;
  numHops: number;
  preferredRegions: string[];
  minTrustScore: number;
  minBandwidth: number;
  maxLatency: number;
  relaySelectionStrategy: 'random' | 'optimal' | 'regional';
  torBridges: string[];
  enableTorBrowser: boolean;
}

interface OnionRoutingStats {
  totalTransfers: number;
  successfulTransfers: number;
  failedTransfers: number;
  averageLatency: number;
  currentHops: number;
  activeRelays: number;
  bytesTransferred: number;
}
```

---

## Summary

### Deliverables ✅

1. **Core Framework**: `lib/transport/onion-routing-integration.ts` (400+ lines)
2. **React Hooks**: `lib/hooks/use-onion-routing.ts` (200+ lines)
3. **UI Component**: `components/privacy/onion-routing-config.tsx` (300+ lines)
4. **Test Suite**: `tests/unit/transport/onion-routing.test.ts` (29 tests)
5. **Implementation Guide**: This document (comprehensive)

### Next Steps

1. **Deploy Relay Servers** - Set up infrastructure
2. **Test End-to-End** - Verify with real relays
3. **Enable in Production** - Feature flag rollout
4. **Monitor Performance** - Track metrics
5. **Iterate & Improve** - Based on user feedback

The onion routing framework is complete and ready for integration. Requires relay server infrastructure for production deployment.
