# Privacy Features - Quick Start Guide

Quick reference for implementing and using Tallow's privacy features.

## 30-Second Setup

```typescript
// 1. Privacy checks run automatically on app load
// No setup required!

// 2. Access privacy settings at /app/privacy-settings
// Or add to your UI:
import Link from 'next/link';

<Link href="/app/privacy-settings">
  <Button>Privacy Settings</Button>
</Link>
```

## Common Use Cases

### 1. Check for VPN/IP Leaks

```typescript
import { getVPNLeakDetector } from '@/lib/privacy/vpn-leak-detection';

const detector = getVPNLeakDetector();
const result = await detector.performPrivacyCheck();

if (result.hasWebRTCLeak) {
  console.warn('WebRTC leak detected!');
  console.log('Recommendations:', result.recommendations);
}
```

### 2. Detect Tor Browser

```typescript
import { getTorDetector } from '@/lib/privacy/tor-support';

const detector = getTorDetector();

// Quick check (synchronous)
const isTor = detector.quickCheck();

// Full check (async)
const result = await detector.detectTor();
console.log('Tor detected:', result.isTorBrowser);
console.log('Confidence:', result.confidence);
```

### 3. Set Privacy Level

```typescript
import { setPrivacyLevel } from '@/lib/privacy/relay-routing';

// Direct connection (fastest, least private)
await setPrivacyLevel('direct');

// Relay mode (balanced)
await setPrivacyLevel('relay');

// Multi-hop relay (slowest, most private)
await setPrivacyLevel('multi-relay');
```

### 4. Get Connection Privacy Status

```typescript
import { getRelayRoutingManager } from '@/lib/privacy/relay-routing';

const manager = getRelayRoutingManager();
const info = manager.getConnectionPrivacyInfo();

console.log('Privacy level:', info.privacyLevel);
console.log('IP masked:', info.ipMasked);
console.log('Active hops:', info.activeHops);
```

## UI Components

### Privacy Warning

```tsx
import { PrivacyWarning } from '@/components/privacy/privacy-warning';

<PrivacyWarning
  result={vpnDetectionResult}
  onDismiss={() => {}}
  onConfigureSettings={() => router.push('/app/privacy-settings')}
/>
```

### Tor Indicator

```tsx
import { TorIndicator } from '@/components/privacy/tor-indicator';

<TorIndicator result={torDetectionResult} />
```

### Privacy Level Selector

```tsx
import { PrivacyLevelSelector } from '@/components/privacy/privacy-level-selector';

<PrivacyLevelSelector
  onLevelChange={(level) => console.log('Changed to:', level)}
/>
```

### Connection Status

```tsx
import { ConnectionPrivacyStatus } from '@/components/privacy/connection-privacy-status';

<ConnectionPrivacyStatus />
```

## WebRTC Integration

```typescript
import { getRelayRoutingManager } from '@/lib/privacy/relay-routing';

// Initialize connection with privacy settings
const manager = getRelayRoutingManager();
const rtcConfig = await manager.initializeConnection();

const peerConnection = new RTCPeerConnection(rtcConfig);

// Configuration automatically includes:
// - Appropriate ICE servers
// - Relay-only policy (if enabled)
// - Privacy-optimized settings
```

## Auto-Configuration

```typescript
import { autoConfigureForTor } from '@/lib/privacy/tor-support';

// Automatically configure for Tor Browser
const configured = await autoConfigureForTor();

if (configured) {
  console.log('Tor settings applied:');
  console.log('- Relay-only mode enabled');
  console.log('- Extended timeouts (60s)');
  console.log('- Increased retries (5)');
}
```

## Event Listeners

```typescript
import { getVPNLeakDetector } from '@/lib/privacy/vpn-leak-detection';

const detector = getVPNLeakDetector();

detector.addListener({
  onVPNDetected: (result) => {
    console.log('VPN detected:', result);
  },
  onIPLeakDetected: (leakedIPs) => {
    console.warn('IP leak:', leakedIPs);
  },
  onCheckComplete: (result) => {
    console.log('Check complete:', result.riskLevel);
  },
});
```

## Privacy Levels Explained

### Direct Connection 🔓
```typescript
// Best for: Local networks, trusted peers
// Speed: Fastest (no overhead)
// Privacy: Your IP visible to peer
await setPrivacyLevel('direct');
```

### Relay Mode 🔒
```typescript
// Best for: General internet use
// Speed: ~50-100ms slower
// Privacy: IP hidden via TURN relay
await setPrivacyLevel('relay');
```

### Multi-Hop Relay 🔐
```typescript
// Best for: Sensitive files, maximum privacy
// Speed: ~150-300ms slower
// Privacy: IP hidden via multiple hops
await setPrivacyLevel('multi-relay');

// Configure hops (1-3)
const manager = getRelayRoutingManager();
manager.updateConfig({ maxHops: 3 });
```

## Storage Keys

Privacy settings are stored in localStorage:

```typescript
// Privacy level
localStorage.getItem('tallow_privacy_level');
// -> 'direct' | 'relay' | 'multi-relay'

// Relay configuration
localStorage.getItem('tallow_relay_config');
// -> JSON object

// Tor detection
localStorage.getItem('tallow_tor_detected');
// -> 'true' | 'false'
```

## Debug Mode

Enable debug logging:

```typescript
localStorage.setItem('tallow_debug_privacy', 'true');

// Now all privacy operations will log to console
```

## Testing

### Manual Testing

```bash
# 1. Test VPN leak detection
# - Connect to VPN
# - Go to /app/privacy-settings
# - Click "Refresh"
# - Should show VPN detected

# 2. Test Tor detection
# - Open in Tor Browser
# - Should auto-detect and show indicator
# - Check settings are relay-only

# 3. Test privacy levels
# - Switch between Direct/Relay/Multi-Hop
# - Verify connection status updates
# - Check WebRTC configuration
```

### Automated Testing

```typescript
import { describe, test, expect } from 'vitest';
import { getVPNLeakDetector } from '@/lib/privacy/vpn-leak-detection';

describe('Privacy Features', () => {
  test('detects WebRTC leaks', async () => {
    const detector = getVPNLeakDetector();
    const result = await detector.performPrivacyCheck();
    expect(result).toHaveProperty('hasWebRTCLeak');
    expect(result).toHaveProperty('riskLevel');
  });
});
```

## Troubleshooting

### Privacy check fails
```typescript
// Clear cache and retry
detector.clearCache();
const result = await detector.performPrivacyCheck(false);
```

### Relay mode not working
```typescript
// Check if TURN servers configured
import { getProxyConfig } from '@/lib/network/proxy-config';

const config = await getProxyConfig();
console.log('Force relay:', config.forceRelay);
console.log('Custom servers:', config.customTurnServers);
```

### Tor not detected
```typescript
// Manual configuration
import { autoConfigureForTor } from '@/lib/privacy/tor-support';

await autoConfigureForTor();
// This will apply Tor settings regardless of detection
```

## API Reference

### VPN Leak Detector

```typescript
interface VPNLeakDetector {
  performPrivacyCheck(useCache?: boolean): Promise<VPNDetectionResult>;
  quickLeakCheck(): Promise<string[]>;
  isTorBrowser(): boolean;
  clearCache(): void;
  addListener(listener: PrivacyCheckListener): void;
  removeListener(listener: PrivacyCheckListener): void;
}
```

### Tor Detector

```typescript
interface TorDetector {
  detectTor(useCache?: boolean): Promise<TorDetectionResult>;
  quickCheck(): boolean;
  clearCache(): void;
  getOptimalSettings(): TorOptimizedSettings;
}
```

### Relay Routing Manager

```typescript
interface RelayRoutingManager {
  getConfig(): RelayRoutingConfig;
  updateConfig(updates: Partial<RelayRoutingConfig>): void;
  getAvailableRelays(): RelayServer[];
  checkAllRelays(): Promise<void>;
  initializeConnection(privacyLevel?: PrivacyLevel): Promise<RTCConfiguration>;
  getConnectionPrivacyInfo(): ConnectionPrivacyInfo | null;
}
```

## Best Practices

### 1. Always Check Privacy on Network Change

```typescript
window.addEventListener('online', async () => {
  const detector = getVPNLeakDetector();
  detector.clearCache();
  await detector.performPrivacyCheck(false);
});
```

### 2. Warn Users Before Direct Connections

```typescript
const privacyLevel = getPrivacyLevel();

if (privacyLevel === 'direct') {
  const confirm = await showWarning(
    'Your IP will be visible to the peer. Continue?'
  );

  if (!confirm) {
    await setPrivacyLevel('relay');
  }
}
```

### 3. Monitor Connection Privacy

```typescript
const manager = getRelayRoutingManager();

setInterval(() => {
  const info = manager.getConnectionPrivacyInfo();

  if (info && !info.ipMasked) {
    console.warn('Connection not using relay!');
  }
}, 5000);
```

### 4. Cache Results Appropriately

```typescript
// Use cache for UI display (faster)
const result = await detector.performPrivacyCheck(true);

// Force fresh check for critical decisions
const freshResult = await detector.performPrivacyCheck(false);
```

## Performance Tips

1. **Use quick checks when possible**
   ```typescript
   const isTor = detector.quickCheck(); // Synchronous, fast
   ```

2. **Cache detection results**
   ```typescript
   // Cached for 5 minutes by default
   const result = await detector.performPrivacyCheck();
   ```

3. **Run checks in background**
   ```typescript
   // Don't block UI
   detector.performPrivacyCheck().then(result => {
     updateUI(result);
   });
   ```

4. **Only check when needed**
   ```typescript
   // Check on app load, network change, settings change
   // Don't check on every render
   ```

## Security Checklist

- [ ] Privacy level set to at least 'relay' for production
- [ ] VPN leak detection enabled and monitored
- [ ] Tor Browser auto-configuration tested
- [ ] WebRTC candidate filtering verified
- [ ] Connection privacy status visible to users
- [ ] Privacy warnings displayed for high-risk scenarios
- [ ] Debug mode disabled in production
- [ ] IP addresses not logged in production

## Resources

- **Full Documentation**: `PRIVACY_FEATURES.md`
- **Implementation Summary**: `PRIVACY_IMPLEMENTATION_SUMMARY.md`
- **Component Examples**: `components/privacy/*`
- **Module Source**: `lib/privacy/*`

---

**Need Help?**
1. Check full documentation in `PRIVACY_FEATURES.md`
2. Review component examples
3. Enable debug mode for detailed logs
4. Test in Privacy Settings page
