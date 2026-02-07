# Firewall Detection & User Guidance

## Overview

The Firewall Detection system provides intelligent network analysis and user guidance for optimal P2P connectivity in the Tallow file transfer application. It automatically tests multiple connection methods and classifies firewall restrictions to help users understand their network environment.

## Architecture

### Components

1. **`lib/network/firewall-detection.ts`** - Core detection logic
   - Parallel test execution
   - Firewall type classification
   - User-friendly guidance generation
   - Result caching (5-minute TTL)

2. **`components/transfer/FirewallStatus.tsx`** - React component
   - Visual status indicator
   - Expandable detail panel
   - Real-time testing
   - Responsive design

3. **`components/transfer/FirewallStatus.module.css`** - Scoped styles
   - Dark theme with purple accent
   - Smooth animations
   - Mobile-responsive

## Detection Tests

The system performs four parallel tests:

### 1. STUN Connectivity Test
- **Purpose**: Tests UDP connectivity to public STUN servers
- **Servers**: Google, Cloudflare STUN servers
- **Success Criteria**: srflx candidate gathered
- **Timeout**: 5 seconds

### 2. WebSocket Connectivity Test
- **Purpose**: Tests signaling server connectivity
- **Protocol**: WSS (WebSocket Secure)
- **Success Criteria**: Connection established
- **Timeout**: 5 seconds

### 3. TURN Connectivity Test
- **Purpose**: Tests TCP/TLS relay capability
- **Protocol**: TURN over TCP/TLS
- **Success Criteria**: relay candidate gathered
- **Timeout**: 5 seconds

### 4. Direct P2P Capability Test
- **Purpose**: Tests ability to establish direct peer connections
- **Requirements**: Both host and srflx candidates
- **Success Criteria**: Both candidate types available
- **Timeout**: 5 seconds

## Firewall Classification

### None (Optimal)
- **Indicators**: All tests pass
- **P2P Capability**: Direct connections work
- **User Experience**: Maximum speed, minimal latency
- **Recommendation**: "Your connection is optimal for P2P transfers"

### Moderate
- **Indicators**: Some tests pass, P2P may be limited
- **P2P Capability**: Works on same network, may need relay
- **User Experience**: Good with occasional relay usage
- **Recommendation**: "Try connecting to the same WiFi network"

### Strict
- **Indicators**: Most direct connections blocked
- **P2P Capability**: Requires relay servers
- **User Experience**: Reliable but may have higher latency
- **Recommendation**: "Transfers will use encrypted relay servers"

### Corporate
- **Indicators**: Only HTTPS/WSS works
- **P2P Capability**: HTTPS relay only
- **User Experience**: Limited to secure relay connections
- **Recommendation**: "Contact IT department for direct P2P access"

## Usage

### Basic Integration

```tsx
import FirewallStatus from '@/components/transfer/FirewallStatus';

export default function TransferPage() {
  return (
    <div>
      <header>
        <h1>Transfer Files</h1>
        <FirewallStatus autoDetect={true} />
      </header>
    </div>
  );
}
```

### With Callback

```tsx
import FirewallStatus from '@/components/transfer/FirewallStatus';
import type { FirewallDetectionResult } from '@/lib/network/firewall-detection';

export default function TransferPage() {
  const handleDetection = (result: FirewallDetectionResult) => {
    console.log('Firewall type:', result.firewallType);
    console.log('STUN available:', result.stun);
    console.log('Direct P2P:', result.directP2P);

    // Adjust connection strategy
    if (result.firewallType === 'strict') {
      enableTURNRelay();
    }
  };

  return (
    <FirewallStatus
      autoDetect={true}
      onDetectionComplete={handleDetection}
    />
  );
}
```

### Manual Detection

```tsx
import { detectFirewall, clearFirewallCache } from '@/lib/network/firewall-detection';

// Perform detection
const result = await detectFirewall();

// Force re-detection (skip cache)
const freshResult = await detectFirewall({ skipCache: true });

// Clear cache
clearFirewallCache();
```

## API Reference

### `detectFirewall(options?)`

Detects firewall restrictions and returns classification results.

**Parameters:**
```typescript
interface FirewallTestOptions {
  timeout?: number;              // Test timeout per test (default: 5000ms)
  stunServers?: string[];        // Custom STUN servers
  signalingServer?: string;      // Custom signaling server
  turnServer?: string;           // TURN server to test
  skipCache?: boolean;           // Force re-detection
}
```

**Returns:**
```typescript
interface FirewallDetectionResult {
  stun: boolean;                 // STUN connectivity
  websocket: boolean;            // WebSocket connectivity
  turn: boolean;                 // TURN relay availability
  directP2P: boolean;            // Direct P2P capability
  firewallType: FirewallType;    // Classification
  recommendations: string[];     // User guidance
  detectionTime: number;         // Total detection time (ms)
  timestamp: number;             // Detection timestamp
}
```

### `getGuidance(result)`

Returns user-friendly guidance message.

```typescript
const message = getGuidance(result);
// "Your connection is optimal for P2P transfers"
```

### `getFirewallStatusIcon(firewallType)`

Returns icon and color for UI display.

```typescript
const { icon, color } = getFirewallStatusIcon('none');
// { icon: 'check', color: 'green' }
```

### `clearFirewallCache()`

Clears cached detection results to force re-detection.

### `getCachedResult()`

Returns cached result if available and not expired.

### `shouldRedetect()`

Checks if re-detection is recommended (cache expired).

## Component Props

### FirewallStatus Component

```typescript
interface FirewallStatusProps {
  autoDetect?: boolean;          // Auto-detect on mount (default: true)
  onDetectionComplete?: (result: FirewallDetectionResult) => void;
  className?: string;            // Custom CSS class
}
```

## Performance Considerations

### Parallel Execution
All tests run in parallel for faster results (typically 5-10 seconds total vs 20+ seconds sequential).

### Caching
Results are cached for 5 minutes to avoid repeated network tests.

### Timeout Protection
Each test has a 5-second timeout to prevent hanging.

### Network Impact
- Minimal bandwidth usage (< 1KB)
- No persistent connections
- Properly cleaned up resources

## Best Practices

### 1. Run on Page Load
```tsx
<FirewallStatus autoDetect={true} />
```

### 2. Handle Results
```tsx
onDetectionComplete={(result) => {
  // Adapt connection strategy
  // Show user notifications
  // Log analytics
}}
```

### 3. Provide Feedback
```tsx
// Component shows loading state automatically
<FirewallStatus autoDetect={true} />
```

### 4. Manual Re-testing
```tsx
// User can click "Re-test" button in expanded panel
// Or programmatically:
clearFirewallCache();
await detectFirewall({ skipCache: true });
```

### 5. Error Handling
```tsx
try {
  const result = await detectFirewall();
  // Use result
} catch (error) {
  console.error('Detection failed:', error);
  // Show fallback UI
}
```

## Integration with Existing Systems

### NAT Detection
```typescript
import { detectNATType } from '@/lib/network/nat-detection';
import { detectFirewall } from '@/lib/network/firewall-detection';

// Run both detections
const [natResult, firewallResult] = await Promise.all([
  detectNATType(),
  detectFirewall(),
]);

// Combine insights
const strategy = getConnectionStrategy(
  natResult.type,
  firewallResult.firewallType
);
```

### Connection Strategy
```typescript
import { getStrategySelector } from '@/lib/network/connection-strategy';

const selector = getStrategySelector();
const strategy = selector.getStrategy(localNAT, remoteNAT);

// Adjust based on firewall
if (firewallResult.firewallType === 'strict') {
  strategy.useTURN = true;
  strategy.prioritizeRelay = true;
}
```

## Styling Customization

### CSS Module Variables
```css
/* Override in your component styles */
.customFirewall {
  --firewall-accent: #your-color;
  --firewall-bg: rgba(your-bg);
  --firewall-border: rgba(your-border);
}
```

### Custom Class
```tsx
<FirewallStatus className="custom-firewall-status" />
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

Requires:
- WebRTC support (RTCPeerConnection)
- WebSocket support
- Modern JavaScript (ES2020+)

## Troubleshooting

### Detection Takes Too Long
- Check network connectivity
- Verify STUN servers are accessible
- Increase timeout: `detectFirewall({ timeout: 10000 })`

### Always Shows "Strict"
- Corporate firewall may be blocking WebRTC
- VPN may interfere with tests
- Browser may block WebRTC (check settings)

### Cache Not Working
- localStorage may be disabled
- Incognito/private mode clears cache
- Call `clearFirewallCache()` if needed

### WebSocket Test Fails
- Signaling server may be down
- Provide custom server: `detectFirewall({ signalingServer: 'wss://your-server' })`

## Security Considerations

- No sensitive data transmitted
- Tests use public STUN servers
- Results cached locally only
- WebSocket tests use WSS (secure)
- Properly closed connections prevent leaks

## Future Enhancements

- [ ] Custom test configurations
- [ ] Historical trend analysis
- [ ] Network quality metrics
- [ ] Automatic reconnection handling
- [ ] Advanced diagnostics mode
- [ ] Export results for support

## Files

```
lib/network/
  ├── firewall-detection.ts          # Core detection logic

components/transfer/
  ├── FirewallStatus.tsx             # React component
  ├── FirewallStatus.module.css      # Component styles
  ├── FirewallStatusExample.tsx      # Usage examples
  └── FIREWALL_DETECTION_README.md   # This file
```

## License

Part of the Tallow secure file transfer application.
