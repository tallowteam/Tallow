# Monitoring & Analytics Quick Reference

## Prometheus Metrics

### Import
```typescript
import { recordTransfer, recordPQCOperation, recordWebRTCConnection, recordError, recordFeatureUsage } from '@/lib/monitoring/metrics';
```

### Common Operations
```typescript
// File transfer
recordTransfer('success', 'p2p', fileSize, duration, fileType);

// PQC operation
recordPQCOperation('keygen', duration, 'success', 'kyber768');

// WebRTC connection
recordWebRTCConnection('relay', 'success', duration);

// Error
recordError('network', 'error', '/api/endpoint', 500);

// Feature usage
recordFeatureUsage('voice_commands');
```

### Endpoint
```
GET http://localhost:3000/api/metrics
```

---

## Plausible Analytics

### Import
```typescript
import { analytics } from '@/lib/monitoring/plausible';
```

### Common Events
```typescript
// File transfers
analytics.fileSent(fileSize, fileType, 'p2p');
analytics.fileReceived(fileSize, fileType, 'relay');

// Features
analytics.featureUsed('voice_commands');
analytics.qrCodeScanned();
analytics.cameraCaptureUsed();
analytics.metadataStripped(fileType);

// Settings
analytics.settingChanged('force_relay', 'true');
analytics.themeChanged('dark');

// Connections
analytics.connectionEstablished('direct', duration);
analytics.connectionFailed('relay', 'timeout');

// Custom event
import { trackEvent } from '@/lib/monitoring/plausible';
trackEvent('custom_event', { prop: 'value' });
```

### Environment Variables
```bash
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=tallow.example.com
NEXT_PUBLIC_PLAUSIBLE_HOST=https://plausible.io
```

---

## LaunchDarkly Feature Flags

### Import
```typescript
import { useFeatureFlag, useVoiceCommands, useCameraCapture } from '@/lib/hooks/use-feature-flag';
import { FeatureFlags } from '@/lib/feature-flags/launchdarkly';
```

### Basic Usage
```typescript
// Single flag
const isEnabled = useFeatureFlag(FeatureFlags.VOICE_COMMANDS);

// Predefined hooks
const voiceEnabled = useVoiceCommands();
const cameraEnabled = useCameraCapture();
const metadataEnabled = useMetadataStripping();

// Multiple flags
const flags = useFeatureFlags([
  FeatureFlags.QR_CODE_SHARING,
  FeatureFlags.EMAIL_SHARING,
]);

// All flags
const allFlags = useAllFeatureFlags();

// Reactive updates
const isEnabled = useReactiveFeatureFlag(FeatureFlags.VOICE_COMMANDS);

// Listen for changes
useFlagChangeListener(FeatureFlags.VOICE_COMMANDS, (newValue) => {
  console.log('Flag changed:', newValue);
});
```

### Available Flags
- `voice-commands` - Voice-activated commands
- `camera-capture` - Camera photo capture
- `metadata-stripping` - EXIF metadata removal
- `one-time-transfers` - Self-destructing links
- `pqc-encryption` - Post-quantum cryptography
- `advanced-privacy` - Advanced privacy settings
- `qr-code-sharing` - QR code generation
- `email-sharing` - Email link sharing
- `link-expiration` - Time-based link expiration
- `custom-themes` - Custom color themes
- `mobile-app-promo` - Mobile app prompts
- `donation-prompts` - Donation CTAs

### Environment Variables
```bash
NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID=your-client-id
```

---

## Combined Example

```typescript
import { useFeatureFlag } from '@/lib/hooks/use-feature-flag';
import { analytics } from '@/lib/monitoring/plausible';
import { recordFeatureUsage } from '@/lib/monitoring/metrics';
import { FeatureFlags } from '@/lib/feature-flags/launchdarkly';

function VoiceCommandButton() {
  const isEnabled = useFeatureFlag(FeatureFlags.VOICE_COMMANDS);

  const handleClick = () => {
    if (!isEnabled) return;

    // Track usage in both systems
    recordFeatureUsage('voice_commands');
    analytics.voiceCommandUsed('start', true);

    // Execute feature
    startVoiceRecognition();
  };

  if (!isEnabled) return null;

  return <button onClick={handleClick}>Start Voice Commands</button>;
}
```

---

## Development Tools

### Feature Flags Admin UI
- Automatically shown in development mode
- Floating panel in bottom-right corner
- View all flag values in real-time
- Search and filter flags
- Read-only (modify in LaunchDarkly dashboard)

### Metrics Endpoint Testing
```bash
# View all metrics
curl http://localhost:3000/api/metrics

# View specific metric
curl http://localhost:3000/api/metrics | grep tallow_transfers_total
```

### Plausible Testing
- Disabled in development by default
- Respects Do Not Track header
- Check browser console for debug messages
- Events appear in Plausible dashboard after 1-2 minutes

---

## Production Checklist

### Prometheus
- [ ] Configure Prometheus scraping
- [ ] Import Grafana dashboard
- [ ] Set up alerting rules
- [ ] Optional: Add metrics endpoint authentication

### Plausible
- [ ] Create Plausible account
- [ ] Add domain to Plausible
- [ ] Set environment variables
- [ ] Configure custom event goals

### LaunchDarkly
- [ ] Create LaunchDarkly account
- [ ] Create feature flags
- [ ] Set environment variables
- [ ] Configure targeting rules
- [ ] Test real-time updates

---

## Troubleshooting

### Metrics not appearing
1. Check `/api/metrics` is accessible
2. Verify metrics are being recorded (server logs)
3. Check Prometheus configuration

### Analytics not tracking
1. Verify environment variables are set
2. Check DNT is not enabled
3. Confirm not in development mode
4. Check browser console for errors

### Feature flags not working
1. Verify environment variable is set
2. Check LaunchDarkly dashboard for flags
3. Ensure flag keys match exactly
4. Use admin UI to debug (dev only)

---

## Support

Full documentation: `MONITORING_ANALYTICS_DOCS.md`
Integration examples: `lib/monitoring/integration-example.ts`
