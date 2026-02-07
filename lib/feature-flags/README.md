# Feature Flags System

A lightweight, self-contained feature flag management system for Tallow that supports multiple configuration sources with a clear override precedence.

## Features

- **Default flag values** - Sensible defaults for all features
- **Remote configuration** - Load flags from `/api/flags` endpoint
- **Local storage overrides** - User-specific flag overrides
- **URL parameter overrides** - Testing and debugging via URL params
- **React hooks** - Automatic re-rendering when flags change
- **Type-safe** - Full TypeScript support
- **Zero dependencies** - No external feature flag service required

## Override Precedence

Flags are loaded in the following order (later sources override earlier ones):

1. **Defaults** - Built-in default values
2. **Remote** - API endpoint (`/api/flags`)
3. **localStorage** - User-specific overrides
4. **URL params** - Testing overrides

## Available Flags

### Core Features (Enabled by Default)

- `chat_enabled` - Chat integration
- `voice_memos` - Voice memo support
- `screen_sharing` - Screen sharing capability
- `broadcast_mode` - Broadcast mode for 1-to-many transfers
- `scheduled_transfers` - Schedule transfers for later
- `team_workspaces` - Team collaboration features
- `browser_extension_api` - Browser extension integration
- `advanced_compression` - Advanced compression algorithms
- `delta_sync` - Delta synchronization
- `webauthn` - WebAuthn authentication
- `i18n_enabled` - Internationalization
- `guest_mode` - Guest mode access

### Privacy-Sensitive Features (Disabled by Default)

- `location_sharing` - Location sharing (privacy-sensitive)
- `plausible_analytics` - Plausible analytics tracking
- `sentry_tracking` - Sentry error tracking

### Experimental Features (Disabled by Default)

- `webtransport` - WebTransport protocol (experimental)
- `experimental_pqc` - Post-quantum cryptography experiments
- `debug_mode` - Debug mode features

## Usage

### Basic Hook Usage

```typescript
import { useFeatureFlag } from '@/lib/feature-flags';

function ChatButton() {
  const isChatEnabled = useFeatureFlag('chat_enabled');

  if (!isChatEnabled) {
    return null;
  }

  return <Button>Open Chat</Button>;
}
```

### Multiple Flags

```typescript
import { useFeatureFlags } from '@/lib/feature-flags';

function AdvancedFeatures() {
  const flags = useFeatureFlags();

  return (
    <div>
      {flags.chat_enabled && <ChatPanel />}
      {flags.voice_memos && <VoiceRecorder />}
      {flags.screen_sharing && <ScreenShareButton />}
    </div>
  );
}
```

### Feature Flag Guard Component

```typescript
import { FeatureFlagGuard } from '@/components/ui';

function App() {
  return (
    <div>
      <FeatureFlagGuard flag="chat_enabled">
        <ChatComponent />
      </FeatureFlagGuard>

      <FeatureFlagGuard
        flag="team_workspaces"
        fallback={<ComingSoonBanner />}
      >
        <TeamWorkspaceUI />
      </FeatureFlagGuard>
    </div>
  );
}
```

### Multiple Flag Guards

```typescript
import { FeatureFlagGuardAll, FeatureFlagGuardAny } from '@/components/ui';

// Requires ALL flags to be enabled
function VoiceChat() {
  return (
    <FeatureFlagGuardAll flags={['chat_enabled', 'voice_memos']}>
      <VoiceChatComponent />
    </FeatureFlagGuardAll>
  );
}

// Requires ANY flag to be enabled
function MediaFeatures() {
  return (
    <FeatureFlagGuardAny flags={['screen_sharing', 'voice_memos']}>
      <MediaFeaturesSection />
    </FeatureFlagGuardAny>
  );
}
```

### Toggle Hook

```typescript
import { useFeatureFlagToggle } from '@/lib/feature-flags';

function DebugSettings() {
  const [debugMode, setDebugMode] = useFeatureFlagToggle('debug_mode');

  return (
    <Toggle
      checked={debugMode}
      onChange={setDebugMode}
      label="Debug Mode"
    />
  );
}
```

### Convenience Hooks

```typescript
import {
  useChatEnabled,
  useDebugModeEnabled,
  useScreenSharingEnabled,
} from '@/lib/feature-flags';

function Features() {
  const chatEnabled = useChatEnabled();
  const debugMode = useDebugModeEnabled();
  const screenSharing = useScreenSharingEnabled();

  return (
    <div>
      {chatEnabled && <Chat />}
      {screenSharing && <ScreenShare />}
      {debugMode && <DebugPanel />}
    </div>
  );
}
```

### Direct API Usage (Non-React)

```typescript
import FeatureFlags from '@/lib/feature-flags/feature-flags';

// Check if flag is enabled
if (FeatureFlags.isEnabled('chat_enabled')) {
  initializeChatSystem();
}

// Set a flag (persists to localStorage)
FeatureFlags.setFlag('debug_mode', true);

// Get all flags
const allFlags = FeatureFlags.getAllFlags();

// Subscribe to changes
const unsubscribe = FeatureFlags.subscribe((flag, enabled) => {
  console.log(`Flag ${flag} changed to ${enabled}`);
});

// Later: unsubscribe
unsubscribe();

// Reset to defaults
FeatureFlags.resetAllFlags();
```

## URL Parameter Testing

Enable/disable flags via URL parameters for testing:

```
https://tallow.app/?flags=debug_mode:true,chat_enabled:false
```

Format: `?flags=flag1:value1,flag2:value2`

Values can be `true` or `false`.

## Environment Variables

Configure flags server-side via environment variables in the `/api/flags` endpoint:

```bash
# .env.local
FEATURE_FLAG_CHAT_ENABLED=true
FEATURE_FLAG_DEBUG_MODE=false
FEATURE_FLAG_EXPERIMENTAL_PQC=true
```

Environment variable format: `FEATURE_FLAG_<FLAG_NAME_UPPERCASE>=true|false`

Supported values: `true`, `false`, `1`, `0`, `yes`, `no`, `on`, `off`, `enabled`, `disabled`

## API Endpoint

### GET /api/flags

Returns current feature flag configuration from environment variables.

**Response:**

```json
{
  "flags": {
    "chat_enabled": true,
    "debug_mode": false,
    "experimental_pqc": true,
    ...
  },
  "timestamp": "2026-02-06T10:30:00.000Z",
  "source": "environment"
}
```

## Local Storage Format

Flags are stored in localStorage as:

```json
{
  "chat_enabled": true,
  "debug_mode": false,
  "voice_memos": true
}
```

Key: `tallow-feature-flags`

## Advanced Patterns

### Conditional Rendering with Render Props

```typescript
import { FeatureFlagGuardRender } from '@/components/ui';

function StatusBadge() {
  return (
    <FeatureFlagGuardRender flag="debug_mode">
      {(isEnabled) => (
        <Badge variant={isEnabled ? 'error' : 'success'}>
          {isEnabled ? 'Debug Mode' : 'Production'}
        </Badge>
      )}
    </FeatureFlagGuardRender>
  );
}
```

### Loading State

```typescript
import { useFeatureFlagsReady } from '@/lib/feature-flags';

function App() {
  const isReady = useFeatureFlagsReady();

  if (!isReady) {
    return <Spinner />;
  }

  return <MainApp />;
}
```

### Reset to Defaults

```typescript
import { useFeatureFlagReset } from '@/lib/feature-flags';

function ResetButton() {
  const resetDebugMode = useFeatureFlagReset('debug_mode');

  return (
    <Button onClick={resetDebugMode}>
      Reset Debug Mode to Default
    </Button>
  );
}
```

### Get Default Value

```typescript
import { useFeatureFlagDefault } from '@/lib/feature-flags';

function FlagStatus({ flag }: { flag: FeatureFlagKey }) {
  const currentValue = useFeatureFlag(flag);
  const defaultValue = useFeatureFlagDefault(flag);

  return (
    <div>
      <p>Current: {currentValue ? 'Enabled' : 'Disabled'}</p>
      <p>Default: {defaultValue ? 'Enabled' : 'Disabled'}</p>
      {currentValue !== defaultValue && <Badge>Custom</Badge>}
    </div>
  );
}
```

## Best Practices

1. **Use guards for large components** - Wrap expensive components with `FeatureFlagGuard` to prevent unnecessary rendering
2. **Use hooks for small logic** - Use `useFeatureFlag` for simple conditional logic
3. **Provide fallbacks** - Always consider what to show when a feature is disabled
4. **Test with URL params** - Use URL parameters to quickly test flag combinations
5. **Reset when done testing** - Clear localStorage after testing custom flag values
6. **Document flag purpose** - Keep this file updated with flag descriptions
7. **Consider privacy** - Default privacy-sensitive features to disabled
8. **Use convenience hooks** - Prefer `useChatEnabled()` over `useFeatureFlag('chat_enabled')`

## Migration from LaunchDarkly

If you were using the LaunchDarkly-based system, migration is straightforward:

```typescript
// Before (LaunchDarkly)
import { useFeatureFlag, FeatureFlags } from '@/lib/feature-flags';
const isEnabled = useFeatureFlag(FeatureFlags.VOICE_COMMANDS);

// After (Standalone)
import { useFeatureFlag } from '@/lib/feature-flags';
const isEnabled = useFeatureFlag('voice_memos');
```

The old LaunchDarkly system is still available for backward compatibility but is deprecated.

## TypeScript Support

All flags are fully typed:

```typescript
import { FeatureFlagKey } from '@/lib/feature-flags';

// TypeScript will autocomplete flag names
const flag: FeatureFlagKey = 'chat_enabled'; // ✓ Valid
const invalid: FeatureFlagKey = 'unknown_flag'; // ✗ Type error
```

## Performance

- **Zero runtime overhead** when not using React hooks
- **Efficient re-renders** - Only components using changed flags re-render
- **Lazy initialization** - Flags load asynchronously without blocking
- **Cached** - Remote flags are cached after first load

## Troubleshooting

### Flags not updating

1. Check browser console for errors
2. Verify `/api/flags` endpoint is accessible
3. Clear localStorage: `localStorage.removeItem('tallow-feature-flags')`
4. Hard refresh the page

### URL parameters not working

1. Ensure format is correct: `?flags=flag_name:true`
2. Check flag name spelling (use underscores, not hyphens)
3. Verify flag is a valid `FeatureFlagKey`

### Environment variables not applying

1. Restart dev server after changing `.env.local`
2. Check environment variable format: `FEATURE_FLAG_CHAT_ENABLED=true`
3. Verify no typos in flag names (must be uppercase with underscores)
