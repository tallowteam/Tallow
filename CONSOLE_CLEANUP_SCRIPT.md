# Console Statement Cleanup - Remaining Work

## Summary
Removing ALL console statements from production code and replacing with secure logger.

## Completed Files (14/59)
✅ lib/pwa/service-worker-registration.ts
✅ lib/security/key-rotation.ts
✅ lib/security/csrf.ts
✅ lib/utils/toast.tsx
✅ lib/utils/performance-metrics.ts
✅ lib/pwa/push-notifications.ts
✅ lib/privacy/metadata-stripper.ts
✅ lib/monitoring/integration-example.ts
✅ lib/i18n/locale-formatter.ts
✅ lib/hooks/use-voice-commands.ts
✅ lib/hooks/use-transfer-state.ts
✅ lib/utils/secure-logger.ts (updated with named exports)
✅ components/* (all component files verified clean)

## Remaining Files (25)

### Files to Process:
1. lib/auth/user-identity.ts
2. lib/context/settings-context.tsx
3. lib/crypto/digital-signatures.ts
4. lib/crypto/file-encryption-pqc-lazy.ts
5. lib/crypto/pqc-crypto-lazy.ts
6. lib/crypto/preload-pqc.ts
7. lib/feature-flags/feature-flags-context.tsx
8. lib/feature-flags/launchdarkly.ts
9. lib/hooks/use-advanced-transfer.ts
10. lib/hooks/use-device-connection.ts
11. lib/hooks/use-feature-flag.ts
12. lib/hooks/use-media-capture.ts
13. lib/hooks/use-metadata-stripper.ts
14. lib/hooks/use-pqc-transfer.ts
15. lib/hooks/use-pwa.ts
16. lib/hooks/use-service-worker.ts
17. lib/hooks/use-web-share.ts
18. lib/privacy/privacy-settings.ts
19. lib/storage/migrate-to-secure.ts
20. lib/transfer/transfer-metadata.ts
21. lib/utils/cache-stats.ts

### Special Files (keep console for monitoring):
- lib/monitoring/plausible.ts (intentional logging for analytics)
- lib/monitoring/sentry.ts (intentional logging for error tracking)

## Replacement Pattern

For each file:

1. Add import at top:
```typescript
import { log, warn, error } from '@/lib/utils/secure-logger';
```

2. Replace all occurrences:
- `console.log(` → `log(`
- `console.warn(` → `warn(`
- `console.error(` → `error(`
- `console.debug(` → `log(`

## Automated Script

```bash
#!/bin/bash
cd "/c/Users/aamir/Documents/Apps/Tallow"

FILES=(
  "lib/auth/user-identity.ts"
  "lib/context/settings-context.tsx"
  "lib/crypto/digital-signatures.ts"
  "lib/crypto/file-encryption-pqc-lazy.ts"
  "lib/crypto/pqc-crypto-lazy.ts"
  "lib/crypto/preload-pqc.ts"
  "lib/feature-flags/feature-flags-context.tsx"
  "lib/feature-flags/launchdarkly.ts"
  "lib/hooks/use-advanced-transfer.ts"
  "lib/hooks/use-device-connection.ts"
  "lib/hooks/use-feature-flag.ts"
  "lib/hooks/use-media-capture.ts"
  "lib/hooks/use-metadata-stripper.ts"
  "lib/hooks/use-pqc-transfer.ts"
  "lib/hooks/use-pwa.ts"
  "lib/hooks/use-service-worker.ts"
  "lib/hooks/use-web-share.ts"
  "lib/privacy/privacy-settings.ts"
  "lib/storage/migrate-to-secure.ts"
  "lib/transfer/transfer-metadata.ts"
  "lib/utils/cache-stats.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"

    # Check if import already exists
    if ! grep -q "from '@/lib/utils/secure-logger'" "$file"; then
      # Find the last import line
      last_import=$(grep -n "^import " "$file" | tail -1 | cut -d: -f1)
      if [ -n "$last_import" ]; then
        # Add import after last import
        sed -i "${last_import}a import { log, warn, error } from '@/lib/utils/secure-logger';" "$file"
      fi
    fi

    # Replace console statements
    sed -i "s/console\.log(/log(/g" "$file"
    sed -i "s/console\.warn(/warn(/g" "$file"
    sed -i "s/console\.error(/error(/g" "$file"
    sed -i "s/console\.debug(/log(/g" "$file"

    echo "  ✓ Completed: $file"
  else
    echo "  ✗ Not found: $file"
  fi
done

echo ""
echo "Verification:"
remaining=$(find lib -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\.\(log\|warn\|error\|debug\)" 2>/dev/null | grep -v "secure-logger" | grep -v "monitoring/" | wc -l)
echo "Remaining files with console statements: $remaining"

echo ""
echo "Running build test..."
npm run build
```

## Manual Completion Steps

If the automated script doesn't work, process each file manually by:

1. Open file
2. Add import: `import { log, warn, error } from '@/lib/utils/secure-logger';`
3. Find/Replace:
   - Find: `console.log` → Replace: `log`
   - Find: `console.warn` → Replace: `warn`
   - Find: `console.error` → Replace: `error`
   - Find: `console.debug` → Replace: `log`
4. Save file

## Verification

After all files are processed:

```bash
# Count remaining console statements (should be only in monitoring/)
cd "/c/Users/aamir/Documents/Apps/Tallow"
find lib -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\.\(log\|warn\|error\|debug\)" | grep -v "monitoring/" | grep -v "secure-logger"

# Should return 0 files (empty result)
```

```bash
# Run build to verify no errors
npm run build
```

## Next.config.ts Verification

Ensure `next.config.ts` has console removal configured:

```typescript
compiler: {
  removeConsole: process.env['NODE_ENV'] === 'production' ? {
    exclude: ['error', 'warn'],
  } : false,
},
```

✅ This is already configured correctly.
