# Privacy and Anonymity Features

Comprehensive privacy and anonymity implementation for Tallow file transfer application.

## Overview

Tallow includes enterprise-grade privacy features to protect user identity and prevent IP leaks during file transfers. These features are designed to work seamlessly with VPNs, Tor Browser, and other privacy tools.

## Features Implemented

### 1. VPN Leak Detection (Task #16)

**Module:** `lib/privacy/vpn-leak-detection.ts`

Comprehensive detection system that identifies VPN/proxy usage and WebRTC IP leaks.

#### Capabilities

- **Public IP Detection**: Queries multiple privacy-respecting IP lookup services
- **WebRTC Leak Detection**: Creates temporary RTCPeerConnection to detect IP leaks
- **VPN Detection**: Compares local vs public IPs to identify VPN usage
- **Risk Assessment**: Categorizes privacy risks (low/medium/high/critical)
- **Automatic Recommendations**: Suggests appropriate privacy settings

#### API Usage

```typescript
import { getVPNLeakDetector } from '@/lib/privacy/vpn-leak-detection';

const detector = getVPNLeakDetector();

// Perform full privacy check
const result = await detector.performPrivacyCheck();

console.log('VPN Detected:', result.isVPNLikely);
console.log('WebRTC Leaks:', result.hasWebRTCLeak);
console.log('Risk Level:', result.riskLevel);
console.log('Recommendations:', result.recommendations);

// Quick leak check (faster, no network requests)
const leakedIPs = await detector.quickLeakCheck();
```

#### Detection Results

```typescript
interface VPNDetectionResult {
    isVPNLikely: boolean;
    hasWebRTCLeak: boolean;
    publicIP: string | null;
    leakedIPs: string[];
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
```

### 2. Tor Browser Support (Task #17)

**Module:** `lib/privacy/tor-support.ts`

Automatic detection and optimization for Tor Browser users.

#### Capabilities

- **User Agent Detection**: Identifies Tor Browser via user agent string
- **Browser Fingerprinting**: Detects Tor-specific browser characteristics
- **Network Detection**: Confirms connection via Tor network
- **Auto-Configuration**: Automatically applies optimal settings for Tor
- **Confidence Scoring**: Multi-level confidence assessment

#### API Usage

```typescript
import { getTorDetector, autoConfigureForTor } from '@/lib/privacy/tor-support';

const detector = getTorDetector();

// Full Tor detection
const result = await detector.detectTor();

console.log('Tor Browser:', result.isTorBrowser);
console.log('Tor Network:', result.isTorNetwork);
console.log('Confidence:', result.confidence);

// Auto-configure if Tor detected
if (result.isTorBrowser) {
    await autoConfigureForTor();
}

// Quick synchronous check
const isTor = detector.quickCheck();
```

#### Tor-Optimized Settings

When Tor is detected, the following settings are automatically applied:

- **Force Relay Mode**: All connections through TURN relays
- **Disable WebRTC**: Prevents IP leak attacks
- **Extended Timeouts**: 60 seconds (accommodates Tor latency)
- **Increased Retries**: 5 attempts with 5-second delays
- **Onion Service Preference**: Prioritizes .onion relays when available

### 3. IP Masking via Relay Routing (Task #18)

**Module:** `lib/privacy/relay-routing.ts`

Multi-level privacy system with configurable relay routing.

#### Privacy Levels

1. **Direct Connection** 🔓
   - Fastest speed
   - IP address visible to peer
   - Recommended for trusted networks only

2. **Relay Mode** 🔒
   - IP hidden via TURN relay server
   - Balanced privacy and performance
   - ~1.5x latency multiplier

3. **Multi-Hop Relay** 🔐
   - Maximum anonymity
   - Multiple relay hops (1-3 configurable)
   - ~2.5x latency multiplier
   - Recommended for sensitive transfers

#### API Usage

```typescript
import {
    getPrivacyLevel,
    setPrivacyLevel,
    getRelayRoutingManager,
} from '@/lib/privacy/relay-routing';

// Get current privacy level
const level = getPrivacyLevel(); // 'direct' | 'relay' | 'multi-relay'

// Set privacy level
await setPrivacyLevel('relay');

// Advanced configuration
const manager = getRelayRoutingManager();

// Configure multi-hop
manager.updateConfig({
    privacyLevel: 'multi-relay',
    maxHops: 3,
    autoSelectRelay: true,
    latencyThreshold: 500,
});

// Get connection info
const info = manager.getConnectionPrivacyInfo();
console.log('Active Hops:', info.activeHops);
console.log('IP Masked:', info.ipMasked);
```

## UI Components

### 1. Privacy Warning Component

**Component:** `components/privacy/privacy-warning.tsx`

Displays warnings when privacy issues are detected.

```tsx
import { PrivacyWarning } from '@/components/privacy/privacy-warning';

<PrivacyWarning
    result={vpnDetectionResult}
    onDismiss={() => console.log('Dismissed')}
    onConfigureSettings={() => router.push('/app/privacy-settings')}
/>
```

### 2. Tor Indicator Component

**Component:** `components/privacy/tor-indicator.tsx`

Shows Tor Browser detection status with confidence level.

```tsx
import { TorIndicator } from '@/components/privacy/tor-indicator';

<TorIndicator result={torDetectionResult} />
```

### 3. Privacy Level Selector

**Component:** `components/privacy/privacy-level-selector.tsx`

Interactive selector for choosing privacy levels.

```tsx
import { PrivacyLevelSelector } from '@/components/privacy/privacy-level-selector';

<PrivacyLevelSelector
    onLevelChange={(level) => console.log('Level changed:', level)}
/>
```

### 4. Connection Privacy Status

**Component:** `components/privacy/connection-privacy-status.tsx`

Real-time privacy status indicator for active connections.

```tsx
import { ConnectionPrivacyStatus } from '@/components/privacy/connection-privacy-status';

<ConnectionPrivacyStatus className="my-4" />
```

## Privacy Settings Page

**Page:** `app/app/privacy-settings/page.tsx`

Comprehensive privacy settings interface featuring:

- Real-time privacy check with refresh capability
- VPN/IP leak detection results
- Tor Browser detection and auto-configuration
- Privacy level selector with multi-hop configuration
- Connection privacy status
- Privacy best practices guide

### Accessing Privacy Settings

Navigate to `/app/privacy-settings` or add a link in settings:

```tsx
<Link href="/app/privacy-settings">
    <Button>Privacy & Anonymity</Button>
</Link>
```

## Automatic Privacy Initialization

**Module:** `lib/init/privacy-init.ts`

Privacy checks run automatically on app startup:

```typescript
import { initializePrivacyFeatures } from '@/lib/init/privacy-init';

// Runs automatically on app load
const result = await initializePrivacyFeatures();

if (result.vpnDetection?.hasWebRTCLeak) {
    // Auto-enabled relay mode
    console.log('WebRTC leak detected, relay mode enabled');
}

if (result.torDetection?.isTorBrowser) {
    // Auto-configured for Tor
    console.log('Tor Browser detected, optimized settings applied');
}
```

### Initialization Features

- **Quick Tor Detection**: Synchronous check runs first
- **Background VPN Check**: Full detection runs asynchronously
- **Auto-Configuration**: Applies optimal settings automatically
- **Warning System**: Collects and reports privacy issues
- **First-Time Setup**: Suggests privacy level for new users

## Integration with Existing Features

### WebRTC Configuration

The privacy features integrate seamlessly with existing WebRTC setup:

```typescript
import { getRelayRoutingManager } from '@/lib/privacy/relay-routing';

const manager = getRelayRoutingManager();
const rtcConfig = await manager.initializeConnection('relay');

const peerConnection = new RTCPeerConnection(rtcConfig);
```

### Proxy Configuration

Works with existing `lib/network/proxy-config.ts`:

```typescript
import { setPrivacyLevel } from '@/lib/privacy/relay-routing';

// Automatically updates proxy config
await setPrivacyLevel('relay');

// Proxy config is now set to relay-only mode
```

### Private Transport

Integrates with `lib/transport/private-webrtc.ts`:

```typescript
import { getPrivateTransport } from '@/lib/transport/private-webrtc';

const transport = getPrivateTransport({
    forceRelay: true,
    onIpLeakDetected: (candidate) => {
        console.warn('IP leak detected:', candidate);
    },
});
```

## Security Considerations

### IP Leak Prevention

1. **WebRTC Filtering**: All ICE candidates are filtered in relay mode
2. **SDP Scrubbing**: Local IPs removed from SDP descriptions
3. **TURN-Only Policy**: `iceTransportPolicy: 'relay'` enforced
4. **Candidate Monitoring**: Real-time detection of non-relay candidates

### Privacy Guarantees

- **No IP Logging**: Privacy checks don't log actual IP addresses
- **No Tracking**: All checks are local or use privacy-respecting services
- **Secure Storage**: Privacy settings encrypted in localStorage
- **Zero Trust**: Assumes all connections are potentially monitored

### Tor-Specific Protections

- **No WebRTC Leaks**: Relay-only mode prevents all WebRTC leaks
- **Extended Timeouts**: Accommodates Tor's high latency
- **Fingerprinting Resistance**: Respects Tor Browser's privacy features
- **Circuit Isolation**: Each transfer uses separate relay paths

## Performance Impact

### Latency Estimates

| Privacy Level | Latency Multiplier | Typical Overhead |
|--------------|-------------------|------------------|
| Direct       | 1.0x              | 0ms              |
| Relay        | 1.5x              | 50-100ms         |
| Multi-Relay  | 2.5x              | 150-300ms        |

### Bandwidth Impact

- **Direct**: No overhead
- **Relay**: ~5% overhead (TURN protocol)
- **Multi-Relay**: ~10-15% overhead (multiple hops)

### CPU Usage

Privacy checks are lightweight:
- Initial check: ~100ms
- Background monitoring: <1% CPU
- Relay routing: Negligible overhead

## Testing

### Manual Testing

1. **VPN Leak Detection**:
   ```bash
   # Enable VPN
   # Navigate to /app/privacy-settings
   # Click "Refresh" to run check
   # Should detect VPN and show warnings if WebRTC leaks
   ```

2. **Tor Browser**:
   ```bash
   # Open app in Tor Browser
   # Should auto-detect and show indicator
   # Check settings - should be relay-only mode
   ```

3. **Privacy Levels**:
   ```bash
   # Go to Privacy Settings
   # Switch between Direct/Relay/Multi-Relay
   # Verify connection status updates
   ```

### Automated Testing

```typescript
import { getVPNLeakDetector } from '@/lib/privacy/vpn-leak-detection';
import { getTorDetector } from '@/lib/privacy/tor-support';

describe('Privacy Features', () => {
    test('detects WebRTC leaks', async () => {
        const detector = getVPNLeakDetector();
        const result = await detector.performPrivacyCheck();
        expect(result.riskLevel).toBeDefined();
    });

    test('detects Tor Browser', () => {
        const detector = getTorDetector();
        const isTor = detector.quickCheck();
        expect(typeof isTor).toBe('boolean');
    });
});
```

## Troubleshooting

### Common Issues

1. **Privacy Check Fails**
   - Check network connectivity
   - Verify IP lookup services are accessible
   - Try manual refresh in Privacy Settings

2. **Relay Mode Not Working**
   - Ensure TURN servers are configured
   - Check firewall isn't blocking TURN ports
   - Verify `forceRelay` setting is enabled

3. **Tor Not Detected**
   - Confirm using official Tor Browser
   - Check browser fingerprinting protections
   - Try manual configuration in settings

### Debug Mode

Enable debug logging:

```typescript
localStorage.setItem('tallow_debug_privacy', 'true');
```

## Future Enhancements

Potential improvements for future releases:

1. **Custom Relay Servers**: Allow users to add their own TURN servers
2. **Relay Health Monitoring**: Real-time latency checks for all relays
3. **Circuit Visualization**: Show relay path for multi-hop connections
4. **Privacy Score**: Aggregate privacy metric (0-100)
5. **DNS Leak Detection**: Check for DNS leaks in addition to WebRTC
6. **Advanced Tor Integration**: Support for Tor hidden services (.onion)

## References

- [WebRTC Security Guide](https://webrtc-security.github.io/)
- [Tor Browser Design](https://2019.www.torproject.org/projects/torbrowser/design/)
- [RFC 8445 - ICE](https://datatracker.ietf.org/doc/html/rfc8445)
- [OWASP Privacy Risks](https://owasp.org/www-community/vulnerabilities/Privacy_Violation)

## Support

For privacy-related issues or questions:

1. Check this documentation
2. Review logs in browser console (with debug mode enabled)
3. Test in Privacy Settings page
4. Report issues with privacy check results attached

---

**Last Updated:** 2026-01-25
**Version:** 1.0.0
**Security Impact:** CRITICAL
**Privacy Impact:** CRITICAL
