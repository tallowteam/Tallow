# Feature Flags Quick Reference

## Import

```typescript
import { useFeatureFlag, FeatureFlagGuard } from '@/lib/feature-flags';
```

## Common Patterns

### 1. Simple Check

```typescript
const isChatEnabled = useFeatureFlag('chat_enabled');
```

### 2. Conditional Rendering

```typescript
{isChatEnabled && <ChatComponent />}
```

### 3. Guard Component

```typescript
<FeatureFlagGuard flag="chat_enabled">
  <ChatComponent />
</FeatureFlagGuard>
```

### 4. With Fallback

```typescript
<FeatureFlagGuard flag="team_workspaces" fallback={<ComingSoon />}>
  <TeamWorkspace />
</FeatureFlagGuard>
```

### 5. Toggle Hook

```typescript
const [debugMode, setDebugMode] = useFeatureFlagToggle('debug_mode');
```

### 6. Multiple Flags (ALL)

```typescript
<FeatureFlagGuardAll flags={['chat_enabled', 'voice_memos']}>
  <VoiceChat />
</FeatureFlagGuardAll>
```

### 7. Multiple Flags (ANY)

```typescript
<FeatureFlagGuardAny flags={['screen_sharing', 'voice_memos']}>
  <MediaFeatures />
</FeatureFlagGuardAny>
```

## All Available Flags

| Flag | Default | Description |
|------|---------|-------------|
| `chat_enabled` | ✓ | Chat integration |
| `voice_memos` | ✓ | Voice memos |
| `location_sharing` | ✗ | Location sharing (privacy) |
| `screen_sharing` | ✓ | Screen sharing |
| `broadcast_mode` | ✓ | Broadcast mode |
| `scheduled_transfers` | ✓ | Scheduled transfers |
| `team_workspaces` | ✓ | Team workspaces |
| `browser_extension_api` | ✓ | Extension API |
| `advanced_compression` | ✓ | Advanced compression |
| `delta_sync` | ✓ | Delta sync |
| `webauthn` | ✓ | WebAuthn |
| `webtransport` | ✗ | WebTransport (experimental) |
| `plausible_analytics` | ✗ | Analytics (privacy) |
| `sentry_tracking` | ✗ | Error tracking (privacy) |
| `i18n_enabled` | ✓ | Internationalization |
| `guest_mode` | ✓ | Guest mode |
| `experimental_pqc` | ✗ | Post-quantum crypto (experimental) |
| `debug_mode` | ✗ | Debug mode |

## Convenience Hooks

```typescript
import {
  useChatEnabled,
  useDebugModeEnabled,
  useScreenSharingEnabled,
  // ... etc
} from '@/lib/feature-flags';

const chatEnabled = useChatEnabled();
```

## URL Override

```
https://app.com/?flags=debug_mode:true,chat_enabled:false
```

## Environment Variables

```bash
FEATURE_FLAG_CHAT_ENABLED=true
FEATURE_FLAG_DEBUG_MODE=false
```

## Direct API

```typescript
import FeatureFlags from '@/lib/feature-flags/feature-flags';

// Check
FeatureFlags.isEnabled('chat_enabled');

// Set
FeatureFlags.setFlag('debug_mode', true);

// Reset
FeatureFlags.resetAllFlags();
```

## Override Precedence

URL params > localStorage > Remote API > Defaults
