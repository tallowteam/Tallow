# Console Debug Quick Reference

Quick commands for managing console output during development.

## Enable Debug Logs

### Browser Console
```javascript
localStorage.setItem('DEBUG', 'true')
// Then refresh the page
```

### Using Helper
```javascript
window.__debugControl.enable()
// Then refresh the page
```

### Environment Variable
```bash
# Add to .env.local
NEXT_PUBLIC_DEBUG=true
```

## Disable Debug Logs

### Browser Console
```javascript
localStorage.removeItem('DEBUG')
// Then refresh the page
```

### Using Helper
```javascript
window.__debugControl.disable()
// Then refresh the page
```

## Check Debug Status

```javascript
window.__debugControl.status()
// Output: Debug mode: ✅ ENABLED or ❌ DISABLED
```

## Log Levels

| Level | When Shown | Use Case |
|-------|------------|----------|
| `secureLog.error()` | Always (sanitized in prod) | Critical errors |
| `secureLog.force()` | Always in dev | Important dev info |
| `secureLog.warn()` | Only when DEBUG=true | Non-critical warnings |
| `secureLog.log()` | Only when DEBUG=true | Standard logging |
| `secureLog.debug()` | Only when DEBUG=true | Detailed debugging |
| `secureLog.info()` | Only when DEBUG=true | Informational messages |

## Console Cleanup

### Restore Original Console
```javascript
window.__consoleCleanup.restore()
```

### Reinstall Filters
```javascript
window.__consoleCleanup.install()
```

## Log Categories

Use categories for better filtering:

```javascript
import { secureLog, LogCategory } from '@/lib/utils/secure-logger'

secureLog.category(LogCategory.P2P, 'Connection established')
secureLog.category(LogCategory.CRYPTO, 'Key generated')
secureLog.category(LogCategory.TRANSFER, 'File sent')
```

Available categories:
- `LogCategory.SW` - Service Worker
- `LogCategory.FONT` - Font loading
- `LogCategory.HMR` - Hot Module Replacement
- `LogCategory.PERF` - Performance
- `LogCategory.CRYPTO` - Cryptography
- `LogCategory.P2P` - P2P connections
- `LogCategory.TRANSFER` - File transfers
- `LogCategory.UI` - UI interactions
- `LogCategory.GENERAL` - General logs

## Suppressed Patterns (When DEBUG=false)

The console cleanup automatically suppresses:
- Font preload warnings
- Service Worker messages
- Fast Refresh / HMR messages
- Next.js revalidation warnings
- Webpack build messages
- Performance optimization suggestions

## LaunchDarkly Warnings

LaunchDarkly "not configured" messages are now:
- Logged at `debug` level (hidden by default)
- Only shown once per session
- Completely silent when DEBUG=false

## Development Workflow

### Clean Console (Default)
```bash
npm run dev
# Console is clean by default
```

### With Debug Logs
```bash
# Option 1: Set env var
NEXT_PUBLIC_DEBUG=true npm run dev

# Option 2: Enable in browser after starting
npm run dev
# Then in console: localStorage.setItem('DEBUG', 'true')
# Then refresh
```

## Testing

```bash
# Test console output behavior
node scripts/test-console-output.js

# Test with DEBUG enabled
DEBUG=true node scripts/test-console-output.js
```

## Pro Tips

1. **Clean Screenshots**: Always disable DEBUG mode for screenshots/demos
2. **Debugging**: Enable DEBUG mode when investigating issues
3. **Session-Based**: Some logs (like LaunchDarkly) only show once per session
4. **Production**: All debug logs are automatically disabled in production
5. **Errors**: Errors are always visible (as they should be)

## Browser Console Tips

```javascript
// Filter logs by category
// In Chrome DevTools, use the filter: "[P2P]"

// Clear console
console.clear()

// Preserve log between page reloads
// Check "Preserve log" in DevTools settings
```

## Related Files

- `/c/Users/aamir/Documents/Apps/Tallow/lib/utils/secure-logger.ts` - Logging implementation
- `/c/Users/aamir/Documents/Apps/Tallow/lib/utils/console-cleanup.ts` - Console filtering
- `/c/Users/aamir/Documents/Apps/Tallow/lib/init/dev-console.ts` - Console initialization
- `/c/Users/aamir/Documents/Apps/Tallow/lib/feature-flags/launchdarkly.ts` - LaunchDarkly integration

## Need More Help?

See comprehensive documentation:
- `CONSOLE_WARNINGS_FIXED.md` - Detailed fix explanation
- `CONSOLE_CLEANUP_COMPLETION.md` - Console cleanup system docs
