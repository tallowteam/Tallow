# Monitoring, Analytics & Feature Flags Documentation

This document provides comprehensive guidance for Tallow's monitoring, analytics, and feature management infrastructure.

## Table of Contents

1. [Prometheus Metrics](#prometheus-metrics)
2. [Plausible Analytics](#plausible-analytics)
3. [LaunchDarkly Feature Flags](#launchdarkly-feature-flags)
4. [Integration Examples](#integration-examples)
5. [Production Setup](#production-setup)

---

## Prometheus Metrics

### Overview

Tallow exposes application metrics via a Prometheus-compatible endpoint at `/api/metrics`. These metrics enable detailed monitoring of file transfers, PQC operations, WebRTC connections, and system performance.

### Configuration

No configuration required. The metrics endpoint is available immediately at:

```
http://localhost:3000/api/metrics
```

### Available Metrics

#### File Transfer Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `tallow_transfers_total` | Counter | Total file transfers initiated | `status`, `method` |
| `tallow_bytes_transferred_total` | Counter | Total bytes transferred | `direction` |
| `tallow_file_size_bytes` | Histogram | File size distribution | `file_type` |
| `tallow_transfer_duration_seconds` | Histogram | Transfer completion time | `status`, `size_category` |
| `tallow_transfer_speed_mbps` | Histogram | Transfer speed | `method` |

#### Post-Quantum Cryptography Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `tallow_pqc_operations_total` | Counter | PQC operations executed | `operation`, `status` |
| `tallow_pqc_duration_seconds` | Histogram | PQC operation duration | `operation` |
| `tallow_pqc_key_exchanges_total` | Counter | Key exchanges performed | `algorithm`, `status` |

#### WebRTC Connection Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `tallow_webrtc_connections_total` | Counter | Total WebRTC connections | `type`, `status` |
| `tallow_active_connections` | Gauge | Currently active connections | - |
| `tallow_connection_establishment_seconds` | Histogram | Connection setup time | `type` |

#### Error Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `tallow_errors_total` | Counter | Application errors | `type`, `severity` |
| `tallow_api_errors_total` | Counter | API endpoint errors | `endpoint`, `status_code` |

#### Privacy Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `tallow_metadata_stripped_total` | Counter | Metadata removal operations | `file_type`, `status` |
| `tallow_turn_relay_usage_total` | Counter | TURN relay connections | `forced` |

#### Feature Usage Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `tallow_feature_usage_total` | Counter | Feature usage count | `feature` |
| `tallow_settings_changes_total` | Counter | Settings modifications | `setting`, `value` |

### Usage Examples

#### Recording a File Transfer

```typescript
import { recordTransfer } from '@/lib/monitoring/metrics';

// Record successful P2P transfer
recordTransfer(
  'success',
  'p2p',
  10485760, // 10MB file
  5.2,      // 5.2 seconds duration
  'image/jpeg'
);
```

#### Recording PQC Operations

```typescript
import { recordPQCOperation } from '@/lib/monitoring/metrics';

const startTime = performance.now();
// ... perform PQC operation ...
const duration = (performance.now() - startTime) / 1000;

recordPQCOperation('keygen', duration, 'success', 'kyber768');
```

#### Recording WebRTC Connection

```typescript
import { recordWebRTCConnection } from '@/lib/monitoring/metrics';

recordWebRTCConnection('relay', 'success', 2.5);
```

#### Recording Errors

```typescript
import { recordError } from '@/lib/monitoring/metrics';

recordError('network', 'error', '/api/send-file', 500);
```

#### Recording Feature Usage

```typescript
import { recordFeatureUsage } from '@/lib/monitoring/metrics';

recordFeatureUsage('voice_commands');
```

### Grafana Dashboard

Import the included Grafana dashboard from `grafana-dashboard.json`:

1. Open Grafana
2. Navigate to Dashboards → Import
3. Upload `grafana-dashboard.json`
4. Configure your Prometheus data source
5. Dashboard includes:
   - Transfer rate and bandwidth graphs
   - PQC operation monitoring
   - WebRTC connection statistics
   - Error rate tracking
   - System resource usage

### Prometheus Configuration

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'tallow'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
```

---

## Plausible Analytics

### Overview

Plausible is a privacy-first analytics solution that doesn't use cookies, respects Do Not Track (DNT), and is GDPR compliant by default.

### Setup

1. **Sign up for Plausible**
   - Visit [plausible.io](https://plausible.io/)
   - Create an account and add your domain

2. **Configure Environment Variables**

Add to `.env.local`:

```bash
# Your domain registered in Plausible
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=tallow.example.com

# Plausible host (optional, defaults to https://plausible.io)
NEXT_PUBLIC_PLAUSIBLE_HOST=https://plausible.io
```

3. **Analytics Script**

The Plausible script is automatically loaded in `app/layout.tsx`. It respects DNT headers and is disabled in development.

### Custom Events

#### Using the Analytics Helper

```typescript
import { analytics } from '@/lib/monitoring/plausible';

// File transfer events
analytics.fileSent(10485760, 'image/jpeg', 'p2p');
analytics.fileReceived(5242880, 'application/pdf', 'relay');

// Feature usage
analytics.featureUsed('voice_commands');
analytics.qrCodeScanned();
analytics.cameraCaptureUsed();

// Settings changes
analytics.settingChanged('force_relay', 'true');
analytics.themeChanged('dark');

// Connection events
analytics.connectionEstablished('direct', 1.5);
analytics.connectionFailed('relay', 'timeout');
```

#### Direct Event Tracking

```typescript
import { trackEvent } from '@/lib/monitoring/plausible';

trackEvent('custom_event', {
  category: 'engagement',
  action: 'button_click',
  value: 1,
});
```

### Available Custom Events

| Event Name | Properties | Description |
|------------|------------|-------------|
| `file_sent` | `size_category`, `file_type`, `method` | File successfully sent |
| `file_received` | `size_category`, `file_type`, `method` | File successfully received |
| `transfer_cancelled` | `reason` | Transfer was cancelled |
| `transfer_failed` | `error` | Transfer failed |
| `connection_established` | `type`, `duration_category` | WebRTC connection established |
| `feature_used` | `feature` | Feature was activated |
| `voice_command` | `command`, `success` | Voice command executed |
| `setting_changed` | `setting`, `value` | User changed a setting |
| `donation_completed` | `amount` | User completed donation |

### Privacy Features

- **No Cookies**: Plausible doesn't use cookies or persistent storage
- **Do Not Track**: Automatically respects DNT browser header
- **Anonymous Data**: No personal information collected
- **Development Mode**: Disabled in development to avoid skewing data
- **GDPR Compliant**: No consent banner required

### Dashboard Access

View analytics at: `https://plausible.io/{your-domain}`

---

## LaunchDarkly Feature Flags

### Overview

LaunchDarkly provides feature flag management for controlled feature rollouts, A/B testing, and instant feature toggles without deployments.

### Setup

1. **Sign up for LaunchDarkly**
   - Visit [launchdarkly.com](https://launchdarkly.com/)
   - Create an account and project

2. **Get Client ID**
   - Navigate to Account Settings → Projects
   - Copy the "Client-side ID" for your environment

3. **Configure Environment Variables**

Add to `.env.local`:

```bash
NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID=your-client-side-id
```

### Available Feature Flags

| Flag Key | Default | Description |
|----------|---------|-------------|
| `voice-commands` | `false` | Enable voice-activated commands |
| `camera-capture` | `true` | Allow camera photo capture |
| `metadata-stripping` | `true` | Automatically strip EXIF metadata |
| `one-time-transfers` | `true` | Enable self-destructing links |
| `pqc-encryption` | `true` | Use post-quantum cryptography |
| `advanced-privacy` | `true` | Show advanced privacy settings |
| `qr-code-sharing` | `true` | Enable QR code generation |
| `email-sharing` | `true` | Allow email link sharing |
| `link-expiration` | `false` | Enable time-based link expiration |
| `custom-themes` | `false` | Allow custom color themes |
| `mobile-app-promo` | `false` | Show mobile app download prompts |
| `donation-prompts` | `true` | Display donation calls-to-action |

### Usage Examples

#### Basic Feature Flag Check

```typescript
import { useFeatureFlag } from '@/lib/hooks/use-feature-flag';
import { FeatureFlags } from '@/lib/feature-flags/launchdarkly';

function VoiceCommandButton() {
  const isEnabled = useFeatureFlag(FeatureFlags.VOICE_COMMANDS);

  if (!isEnabled) {
    return null;
  }

  return <button>Start Voice Commands</button>;
}
```

#### Using Predefined Hooks

```typescript
import {
  useVoiceCommands,
  useCameraCapture,
  useMetadataStripping,
} from '@/lib/hooks/use-feature-flag';

function FeatureSettings() {
  const voiceEnabled = useVoiceCommands();
  const cameraEnabled = useCameraCapture();
  const metadataEnabled = useMetadataStripping();

  return (
    <div>
      {voiceEnabled && <VoiceSettings />}
      {cameraEnabled && <CameraSettings />}
      {metadataEnabled && <PrivacySettings />}
    </div>
  );
}
```

#### Multiple Flags at Once

```typescript
import { useFeatureFlags } from '@/lib/hooks/use-feature-flag';
import { FeatureFlags } from '@/lib/feature-flags/launchdarkly';

function ShareOptions() {
  const flags = useFeatureFlags([
    FeatureFlags.QR_CODE_SHARING,
    FeatureFlags.EMAIL_SHARING,
    FeatureFlags.LINK_EXPIRATION,
  ]);

  return (
    <div>
      {flags[FeatureFlags.QR_CODE_SHARING] && <QRCodeButton />}
      {flags[FeatureFlags.EMAIL_SHARING] && <EmailButton />}
      {flags[FeatureFlags.LINK_EXPIRATION] && <ExpirationPicker />}
    </div>
  );
}
```

#### Reactive Flag Updates

```typescript
import { useReactiveFeatureFlag } from '@/lib/hooks/use-feature-flag';

function DynamicFeature() {
  // Component will re-render when flag changes in LaunchDarkly
  const isEnabled = useReactiveFeatureFlag(FeatureFlags.VOICE_COMMANDS);

  return <div>{isEnabled ? 'Feature ON' : 'Feature OFF'}</div>;
}
```

#### Listening for Flag Changes

```typescript
import { useFlagChangeListener } from '@/lib/hooks/use-feature-flag';
import { FeatureFlags } from '@/lib/feature-flags/launchdarkly';

function Component() {
  useFlagChangeListener(FeatureFlags.VOICE_COMMANDS, (newValue) => {
    console.log('Voice commands toggled:', newValue);
    // Perform side effects when flag changes
  });

  return <div>Monitoring voice commands flag</div>;
}
```

#### User Identification

```typescript
import { useIdentifyUser } from '@/lib/hooks/use-feature-flag';

function UserLogin({ userId, email }) {
  const identifyUser = useIdentifyUser();

  const handleLogin = async () => {
    // Identify user to enable targeted feature flags
    await identifyUser(userId, {
      email,
      plan: 'premium',
      beta_tester: true,
    });
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

### Feature Flags Admin UI

In development mode, a floating admin panel is available to view all feature flags:

- Opens automatically in development
- Shows real-time flag values
- Displays flag descriptions
- Groups flags by category
- Search functionality
- Read-only (modify in LaunchDarkly dashboard)

### Creating Flags in LaunchDarkly

1. Log in to LaunchDarkly dashboard
2. Navigate to Feature Flags
3. Create new flag with key matching `FeatureFlags` enum
4. Set targeting rules:
   - Target specific users
   - Percentage rollouts
   - Environment-specific values
   - A/B test variations
5. Changes propagate to clients in real-time

---

## Integration Examples

### Combining Metrics and Analytics

```typescript
import { analytics } from '@/lib/monitoring/plausible';
import { recordTransfer } from '@/lib/monitoring/metrics';

async function handleFileTransfer(file: File) {
  const startTime = performance.now();

  try {
    // ... perform transfer ...

    const duration = (performance.now() - startTime) / 1000;

    // Record in both systems
    recordTransfer('success', 'p2p', file.size, duration, file.type);
    analytics.fileSent(file.size, file.type, 'p2p');
  } catch (error) {
    recordError('transfer', 'error');
    analytics.transferFailed(error.message);
  }
}
```

### Feature Flag with Analytics

```typescript
import { useFeatureFlag } from '@/lib/hooks/use-feature-flag';
import { analytics } from '@/lib/monitoring/plausible';
import { recordFeatureUsage } from '@/lib/monitoring/metrics';

function VoiceCommandFeature() {
  const isEnabled = useFeatureFlag(FeatureFlags.VOICE_COMMANDS);

  const handleVoiceCommand = (command: string) => {
    if (!isEnabled) return;

    // Track in both systems
    recordFeatureUsage('voice_commands');
    analytics.voiceCommandUsed(command, true);

    // ... execute command ...
  };

  return isEnabled ? <VoiceInterface onCommand={handleVoiceCommand} /> : null;
}
```

### Gradual Feature Rollout

```typescript
// LaunchDarkly Dashboard Configuration:
// 1. Create flag: "new-transfer-ui"
// 2. Set targeting: 10% of users
// 3. Gradually increase to 25%, 50%, 100%

import { useFeatureFlag } from '@/lib/hooks/use-feature-flag';

function TransferInterface() {
  const useNewUI = useFeatureFlag('new-transfer-ui');

  return useNewUI ? <NewTransferUI /> : <LegacyTransferUI />;
}
```

---

## Production Setup

### Checklist

#### Prometheus Metrics

- [ ] Configure Prometheus to scrape `/api/metrics`
- [ ] Set scrape interval to 15-30 seconds
- [ ] Import Grafana dashboard
- [ ] Set up alerting rules for:
  - High error rates
  - Transfer failures
  - PQC operation failures
  - System resource exhaustion
- [ ] Optional: Add authentication to metrics endpoint

#### Plausible Analytics

- [ ] Create Plausible account
- [ ] Add your domain to Plausible
- [ ] Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` in production
- [ ] Verify DNT header is respected
- [ ] Test custom events are being tracked
- [ ] Configure goals for key events:
  - File transfers completed
  - Features used
  - Donations received

#### LaunchDarkly Feature Flags

- [ ] Create LaunchDarkly account
- [ ] Create production environment
- [ ] Set `NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID` in production
- [ ] Create all feature flags from `FeatureFlags` enum
- [ ] Set default values for production
- [ ] Configure targeting rules
- [ ] Test flag changes propagate in real-time
- [ ] Set up flag change notifications

### Security Considerations

1. **Metrics Endpoint**
   - Consider adding authentication for production
   - Uncomment authentication code in `/api/metrics/route.ts`
   - Set `METRICS_TOKEN` environment variable

2. **Analytics Privacy**
   - Plausible is privacy-first by default
   - No PII is collected
   - Respects user DNT settings
   - GDPR compliant without consent banners

3. **Feature Flags**
   - Never put sensitive data in flag variations
   - Use server-side evaluation for sensitive features
   - LaunchDarkly client ID is safe to expose
   - Don't rely on flags for security controls

### Monitoring Best Practices

1. **Set Up Alerts**
   - Error rate > 5%
   - Transfer failure rate > 10%
   - PQC operation failures
   - High memory usage
   - High CPU usage

2. **Track Key Metrics**
   - File transfer success rate
   - Average transfer speed
   - Connection establishment time
   - Feature adoption rates
   - User engagement

3. **Regular Reviews**
   - Weekly metrics review
   - Monthly feature flag audit
   - Quarterly analytics analysis
   - Remove unused flags

### Performance Optimization

1. **Metrics**
   - Use histogram buckets appropriate for your data
   - Don't track high-cardinality labels
   - Keep label count under 10 per metric
   - Use counters for monotonically increasing values

2. **Analytics**
   - Batch events when possible
   - Don't track on every render
   - Use custom events sparingly
   - Respect user privacy settings

3. **Feature Flags**
   - Cache flag values when possible
   - Use context provider for shared flags
   - Minimize flag evaluation calls
   - Clean up old flags regularly

---

## Troubleshooting

### Metrics Not Appearing

1. Check `/api/metrics` endpoint is accessible
2. Verify Prometheus configuration
3. Check for TypeScript errors in metrics usage
4. Ensure metrics are being recorded (check server logs)

### Plausible Not Tracking

1. Verify `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set
2. Check browser console for script loading errors
3. Verify DNT is not enabled in browser
4. Confirm you're not in development mode
5. Check Plausible dashboard for incoming events

### Feature Flags Not Working

1. Verify `NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID` is set
2. Check browser console for initialization errors
3. Ensure flags exist in LaunchDarkly dashboard
4. Verify flag keys match `FeatureFlags` enum exactly
5. Check network tab for LaunchDarkly API calls
6. Use FeatureFlagsAdmin UI to debug (development only)

### Common Issues

**Issue**: Metrics endpoint returns 500 error
**Solution**: Check server logs for errors, verify prom-client is installed

**Issue**: Plausible events not appearing in dashboard
**Solution**: Events may take 1-2 minutes to appear, check domain configuration

**Issue**: Feature flags always return default values
**Solution**: Verify LaunchDarkly client initialized, check client ID is correct

---

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Plausible Analytics Docs](https://plausible.io/docs)
- [LaunchDarkly Documentation](https://docs.launchdarkly.com/)
- [OpenMetrics Specification](https://openmetrics.io/)

---

## Support

For issues or questions:
1. Check this documentation
2. Review example code in `integration-examples/`
3. Check browser and server console logs
4. Review service-specific documentation
5. Open an issue on GitHub

## License

This monitoring infrastructure is part of the Tallow project and follows the same license.
