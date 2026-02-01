# Console Cleanup - Completion Summary

## ✅ Progress: 16/59 files completed manually

### Completed Files
1. ✅ lib/pwa/service-worker-registration.ts
2. ✅ lib/security/key-rotation.ts
3. ✅ lib/security/csrf.ts
4. ✅ lib/utils/toast.tsx
5. ✅ lib/utils/performance-metrics.ts
6. ✅ lib/pwa/push-notifications.ts
7. ✅ lib/privacy/metadata-stripper.ts
8. ✅ lib/monitoring/integration-example.ts
9. ✅ lib/i18n/locale-formatter.ts
10. ✅ lib/hooks/use-voice-commands.ts
11. ✅ lib/hooks/use-transfer-state.ts
12. ✅ lib/auth/user-identity.ts
13. ✅ lib/utils/secure-logger.ts (added named exports)
14. ✅ All components/ files (verified clean)

### Remaining Files (20)

Execute these commands to complete the cleanup:

```bash
cd "/c/Users/aamir/Documents/Apps/Tallow"

# Note: Some files may require manual intervention if there are
# catch(error) blocks that conflict with the error() function

# Quick completion script
for file in \
  "lib/context/settings-context.tsx" \
  "lib/crypto/digital-signatures.ts" \
  "lib/crypto/file-encryption-pqc-lazy.ts" \
  "lib/crypto/pqc-crypto-lazy.ts" \
  "lib/crypto/preload-pqc.ts" \
  "lib/feature-flags/feature-flags-context.tsx" \
  "lib/feature-flags/launchdarkly.ts" \
  "lib/hooks/use-advanced-transfer.ts" \
  "lib/hooks/use-device-connection.ts" \
  "lib/hooks/use-feature-flag.ts" \
  "lib/hooks/use-media-capture.ts" \
  "lib/hooks/use-metadata-stripper.ts" \
  "lib/hooks/use-pqc-transfer.ts" \
  "lib/hooks/use-pwa.ts" \
  "lib/hooks/use-service-worker.ts" \
  "lib/hooks/use-web-share.ts" \
  "lib/privacy/privacy-settings.ts" \
  "lib/storage/migrate-to-secure.ts" \
  "lib/transfer/transfer-metadata.ts" \
  "lib/utils/cache-stats.ts"
do
  echo "Processing: $file"

  # Add secure logger import if not present
  if [ -f "$file" ] && ! grep -q "from '@/lib/utils/secure-logger'" "$file"; then
    # Find first existing import
    first_import_line=$(grep -n "^import\|^'use client'" "$file" | head -1 | cut -d: -f1)

    if [ -n "$first_import_line" ]; then
      # Add import after 'use client' or first import
      sed -i "${first_import_line}a import { log, warn, error } from '@/lib/utils/secure-logger';" "$file"
    fi
  fi

  # Replace console statements (but preserve catch(error) blocks)
  # Step 1: Temporarily protect catch(error) blocks
  sed -i 's/catch\s*(error)/catch (err__TEMP)/g' "$file"

  # Step 2: Replace console.error with error
  sed -i 's/console\.error(/error(/g' "$file"

  # Step 3: Restore catch blocks
  sed -i 's/catch\s*(err__TEMP)/catch (err)/g' "$file"
  sed -i 's/err__TEMP/err/g' "$file"

  # Step 4: Replace other console methods
  sed -i 's/console\.log(/log(/g' "$file"
  sed -i 's/console\.warn(/warn(/g' "$file"
  sed -i 's/console\.debug(/log(/g' "$file"
done

# Verification
echo ""
echo "=== Verification ==="
remaining=$(find lib -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "console\.\(log\|warn\|error\|debug\)" {} \; | grep -v "monitoring/" | grep -v "secure-logger" | wc -l)
echo "Remaining files with console: $remaining"

if [ "$remaining" -eq 0 ]; then
  echo "✅ All console statements removed!"
else
  echo "⚠️  Files still need attention:"
  find lib -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "console\.\(log\|warn\|error\|debug\)" {} \; | grep -v "monitoring/" | grep -v "secure-logger"
fi

# Build test
echo ""
echo "=== Build Test ==="
npm run build
```

## Important Notes

### Variable Name Conflicts
Watch for `catch(error)` blocks that conflict with the imported `error()` function.

**Bad:**
```typescript
import { error } from '@/lib/utils/secure-logger';

try {
  // ...
} catch (error) {  // ❌ Conflicts with imported error
  error('Failed:', error);  // ❌ Type error
}
```

**Good:**
```typescript
import { error } from '@/lib/utils/secure-logger';

try {
  // ...
} catch (err) {  // ✅ Different name
  error('Failed:', err);  // ✅ Works correctly
}
```

### Files to Keep Console Statements
These files intentionally keep console statements for monitoring:
- ❌ lib/monitoring/sentry.ts (error tracking)
- ❌ lib/monitoring/plausible.ts (analytics)
- ❌ lib/utils/secure-logger.ts (logger implementation)

## Manual Fallback

If the automated script has issues, process files manually:

1. Open file in editor
2. Add at top (after existing imports):
   ```typescript
   import { log, warn, error } from '@/lib/utils/secure-logger';
   ```

3. Find/Replace ALL:
   - `catch (error)` → `catch (err)` (to avoid conflicts)
   - `console.log(` → `log(`
   - `console.warn(` → `warn(`
   - `console.error(` → `error(`
   - `console.debug(` → `log(`

4. Save and test: `npm run build`

## Final Verification

```bash
# Should return ONLY monitoring files and secure-logger
find lib -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "console\.\(log\|warn\|error\|debug\)" {} \;

# Expected output:
# lib/monitoring/sentry.ts
# lib/monitoring/plausible.ts
# lib/utils/secure-logger.ts
```

## next.config.ts

Already configured correctly:
```typescript
compiler: {
  removeConsole: process.env['NODE_ENV'] === 'production' ? {
    exclude: ['error', 'warn'],
  } : false,
},
```

This ensures any remaining console.log/console.debug are removed in production builds, while console.error/console.warn are preserved for critical debugging.
