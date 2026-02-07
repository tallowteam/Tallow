# Firewall Detection - Quick Reference

## 30-Second Integration

```tsx
import FirewallStatus from '@/components/transfer/FirewallStatus';

<FirewallStatus autoDetect={true} />
```

## API Cheat Sheet

### Component Props
```tsx
interface FirewallStatusProps {
  autoDetect?: boolean;          // Auto-run on mount (default: true)
  onDetectionComplete?: (result: FirewallDetectionResult) => void;
  className?: string;            // Custom CSS class
}
```

### Detection Result
```tsx
interface FirewallDetectionResult {
  stun: boolean;                 // UDP STUN available
  websocket: boolean;            // Signaling server reachable
  turn: boolean;                 // TURN relay available
  directP2P: boolean;            // Direct P2P possible
  firewallType: 'none' | 'moderate' | 'strict' | 'corporate';
  recommendations: string[];     // User guidance
  detectionTime: number;         // Detection time (ms)
  timestamp: number;             // When detected
}
```

### Core Functions
```tsx
// Run detection
const result = await detectFirewall();

// Get guidance message
const message = getGuidance(result);

// Get status icon
const { icon, color } = getFirewallStatusIcon(result.firewallType);

// Clear cache (force re-detection)
clearFirewallCache();

// Get cached result
const cached = getCachedResult();

// Check if should re-detect
if (shouldRedetect()) {
  await detectFirewall({ skipCache: true });
}
```

## Common Patterns

### Pattern 1: Basic Status Display
```tsx
<header>
  <h1>Transfer Files</h1>
  <FirewallStatus autoDetect={true} />
</header>
```

### Pattern 2: Adapt Connection Strategy
```tsx
const handleDetection = (result) => {
  if (result.firewallType === 'strict') {
    setUseTURN(true);
  }
};

<FirewallStatus onDetectionComplete={handleDetection} />
```

### Pattern 3: Manual Control
```tsx
import { detectFirewall } from '@/lib/network/firewall-detection';

const checkNetwork = async () => {
  const result = await detectFirewall({ skipCache: true });
  console.log(result);
};
```

### Pattern 4: Combine with NAT Detection
```tsx
import { detectNATType } from '@/lib/network/nat-detection';
import { detectFirewall } from '@/lib/network/firewall-detection';

const [nat, firewall] = await Promise.all([
  detectNATType(),
  detectFirewall(),
]);

// Use both for optimal strategy
const strategy = getConnectionStrategy(nat.type, firewall.firewallType);
```

## Firewall Types Quick Guide

| Type | Meaning | Action |
|------|---------|--------|
| `none` | No restrictions | Use direct P2P |
| `moderate` | Some limits | Try direct, fallback to relay |
| `strict` | Most blocked | Use TURN relay |
| `corporate` | HTTPS only | Use HTTPS relay only |

## Detection Tests

| Test | Protocol | Checks | Timeout |
|------|----------|--------|---------|
| STUN | UDP | Public STUN servers | 5s |
| WebSocket | WSS | Signaling connectivity | 5s |
| TURN | TCP/TLS | Relay availability | 5s |
| P2P | WebRTC | Direct connection | 5s |

**Total time: 5-10 seconds** (parallel execution)

## Configuration Options

```tsx
await detectFirewall({
  timeout: 10000,              // Per-test timeout (default: 5000)
  stunServers: [...],          // Custom STUN servers
  signalingServer: 'wss://...', // Custom signaling
  turnServer: 'turn://...',    // TURN server to test
  skipCache: true,             // Force re-detection
});
```

## Common Use Cases

### Show Connection Quality
```tsx
const { firewallType } = result;
const quality = {
  none: 'Excellent',
  moderate: 'Good',
  strict: 'Limited',
  corporate: 'Restricted'
}[firewallType];
```

### Enable Features Based on Type
```tsx
const features = {
  directTransfer: result.directP2P,
  relayRequired: !result.directP2P,
  p2pCapable: result.stun && result.directP2P,
  httpsOnly: firewallType === 'corporate'
};
```

### Show User Notifications
```tsx
if (!result.directP2P) {
  toast.info('Using relay servers for connectivity');
}
if (result.firewallType === 'corporate') {
  toast.warning('Corporate firewall detected - limited features');
}
```

## Troubleshooting

### Detection Fails
```tsx
try {
  const result = await detectFirewall({ timeout: 10000 });
} catch (error) {
  console.error('Detection failed:', error);
  // Show fallback UI
}
```

### Cache Issues
```tsx
// Clear cache
clearFirewallCache();

// Force fresh detection
const result = await detectFirewall({ skipCache: true });
```

### Slow Detection
```tsx
// Increase timeout
await detectFirewall({ timeout: 15000 });

// Or use cached result
const cached = getCachedResult();
if (cached) {
  // Use cached result
}
```

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

## Files

```
lib/network/firewall-detection.ts          # Core module
components/transfer/FirewallStatus.tsx     # Component
components/transfer/FirewallStatus.module.css  # Styles
```

## More Info

- Full docs: `FIREWALL_DETECTION_README.md`
- Examples: `FirewallStatusExample.tsx`
- Implementation: `FIREWALL_DETECTION_IMPLEMENTATION.md`

## Quick Debug

```tsx
// Enable debug logs
localStorage.setItem('DEBUG', 'true');

// Run detection
const result = await detectFirewall();

// Check console for detailed logs:
// [Firewall Detection] Starting new detection
// [Firewall Detection] Completed { firewallType: 'none', ... }
```

---

**That's it!** Add `<FirewallStatus autoDetect={true} />` to your transfer page and you're done.
