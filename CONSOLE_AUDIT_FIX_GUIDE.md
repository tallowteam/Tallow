# Console Audit Fix Implementation Guide

**Based on:** Console Output Audit Report (2026-01-28)
**Estimated Time:** 4-5 hours
**Priority:** Low (Quality improvement, not security issue)

---

## Overview

This guide provides step-by-step instructions to fix the 25 direct console calls identified in the audit.

---

## Phase 1: Add ESLint Rule (30 minutes)

### Step 1.1: Update ESLint Configuration

**File:** `eslint.config.mjs`

Add the following rule:

```javascript
export default [
  // ... existing config
  {
    rules: {
      // Existing rules...

      // Warn on direct console usage
      'no-console': ['warn', {
        allow: [] // Don't allow any direct console usage
      }],
    }
  }
];
```

### Step 1.2: Test the Rule

```bash
npm run lint
```

You should see warnings for all 81 direct console calls.

### Step 1.3: Add to CI/CD

**File:** `.github/workflows/ci.yml` (if exists)

```yaml
- name: Lint
  run: npm run lint
```

---

## Phase 2: Component Error Migration (2 hours)

### Files to Update (15)

#### 2.1: components/app/ChatInput.tsx

**Line 92:**
```typescript
// BEFORE
console.error('Failed to send message:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Failed to send message:', error);
```

**Line 145:**
```typescript
// BEFORE
console.error('Failed to send file:', error);

// AFTER
secureLog.error('Failed to send file:', error);
```

---

#### 2.2: components/app/EmailFallbackDialog.tsx

**Line 177:**
```typescript
// BEFORE
console.error('Email send failed:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Email send failed:', error);
```

---

#### 2.3: components/error-boundary.tsx

**Line 42:**
```typescript
// BEFORE
console.error('[ErrorBoundary] Caught error:', error, errorInfo);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('[ErrorBoundary] Caught error:', error, errorInfo);
```

---

#### 2.4: components/privacy/privacy-settings-panel.tsx

**Lines 38, 53, 64:**
```typescript
// BEFORE
console.error('Failed to load privacy settings:', error);
console.error('Failed to update settings:', error);
console.error('Failed to reset settings:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Failed to load privacy settings:', error);
secureLog.error('Failed to update settings:', error);
secureLog.error('Failed to reset settings:', error);
```

---

#### 2.5: components/app/CreateRoomDialog.tsx

**Line 70:**
```typescript
// BEFORE
console.error('Failed to create room:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Failed to create room:', error);
```

---

#### 2.6: components/privacy/metadata-viewer.tsx

**Line 52:**
```typescript
// BEFORE
console.error('Failed to load metadata:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Failed to load metadata:', error);
```

---

#### 2.7: components/app/MessageBubble.tsx

**Line 58:**
```typescript
// BEFORE
console.error('Failed to edit message:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Failed to edit message:', error);
```

---

#### 2.8: components/app/GroupTransferExample.tsx

**Lines 55, 58:**
```typescript
// BEFORE
console.error(`Transfer failed to ${recipientName}:`, error);
console.error('Failed to start group transfer:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error(`Transfer failed to ${recipientName}:`, error);
secureLog.error('Failed to start group transfer:', error);
```

---

#### 2.9: components/app/JoinRoomDialog.tsx

**Line 47:**
```typescript
// BEFORE
console.error('Failed to join room:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Failed to join room:', error);
```

---

#### 2.10: components/app/ReceivedFilesDialog.tsx

**Line 65:**
```typescript
// BEFORE
console.error('Share error:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Share error:', error);
```

---

#### 2.11: app/app/page.tsx

**Lines 2917, 2944:**
```typescript
// BEFORE
console.error('Failed to create room:', error);
console.error('Failed to join room:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Failed to create room:', error);
secureLog.error('Failed to join room:', error);
```

---

#### 2.12: app/screen-share-demo/page.tsx

**Line 52:**
```typescript
// BEFORE
console.error('Failed to initialize PQC for demo:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Failed to initialize PQC for demo:', error);
```

---

#### 2.13: components/app/MobileGestureSettings.tsx

**Lines 44, 227:**
```typescript
// BEFORE
console.error('Failed to load gesture settings:', err);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Failed to load gesture settings:', err);
```

---

#### 2.14: components/examples/group-transfer-example.tsx

**Line 145:**
```typescript
// BEFORE
console.error('Transfer error:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Transfer error:', error);
```

---

#### 2.15: components/transfer/file-selector-with-privacy.tsx

**Lines 99, 134, 200:**
```typescript
// BEFORE
console.error('Failed to load privacy settings:', error);
console.warn('Failed to extract metadata:', error);
console.error('Failed to strip metadata:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Failed to load privacy settings:', error);
secureLog.warn('Failed to extract metadata:', error);
secureLog.error('Failed to strip metadata:', error);
```

---

### Automated Script for Error Migration

Create `scripts/migrate-console-errors.sh`:

```bash
#!/bin/bash

# Array of files to update
files=(
  "components/app/ChatInput.tsx"
  "components/app/EmailFallbackDialog.tsx"
  "components/error-boundary.tsx"
  "components/privacy/privacy-settings-panel.tsx"
  "components/app/CreateRoomDialog.tsx"
  "components/privacy/metadata-viewer.tsx"
  "components/app/MessageBubble.tsx"
  "components/app/GroupTransferExample.tsx"
  "components/app/JoinRoomDialog.tsx"
  "components/app/ReceivedFilesDialog.tsx"
  "app/app/page.tsx"
  "app/screen-share-demo/page.tsx"
  "components/app/MobileGestureSettings.tsx"
  "components/examples/group-transfer-example.tsx"
  "components/transfer/file-selector-with-privacy.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Add import if not exists
    if ! grep -q "import secureLog from '@/lib/utils/secure-logger'" "$file"; then
      # Find the last import line
      sed -i "/^import/a import secureLog from '@/lib/utils/secure-logger';" "$file"
    fi

    # Replace console.error with secureLog.error
    sed -i 's/console\.error/secureLog.error/g' "$file"

    # Replace console.warn with secureLog.warn
    sed -i 's/console\.warn/secureLog.warn/g' "$file"

    echo "✓ Updated $file"
  else
    echo "✗ File not found: $file"
  fi
done

echo "Migration complete!"
```

---

## Phase 3: Debug Statement Cleanup (1 hour)

### Files to Clean (10)

#### 3.1: components/app/install-prompt.tsx

**Lines 90, 93:**
```typescript
// OPTION A: Remove entirely
// console.log('User accepted the install prompt');
// console.log('User dismissed the install prompt');

// OPTION B: Use debug logger
import secureLog from '@/lib/utils/secure-logger';
secureLog.debug('User accepted the install prompt');
secureLog.debug('User dismissed the install prompt');
```

**Recommendation:** OPTION A (Remove) - Not needed in production

---

#### 3.2: components/app/ResumableTransferExample.tsx

**Lines 107, 117:**
```typescript
// BEFORE
console.error('Failed to send file:', error);
console.error('Failed to resume:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Failed to send file:', error);
secureLog.error('Failed to resume:', error);
```

---

#### 3.3: components/app/ScreenSharePreview.tsx

**Line 112:**
```typescript
// BEFORE
console.error('Fullscreen error:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Fullscreen error:', error);
```

---

#### 3.4: components/app/ResumableTransferSettings.tsx

**Lines 79, 109:**
```typescript
// BEFORE
console.error('Failed to load settings:', e);
console.error('Failed to load resumable count:', e);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Failed to load settings:', e);
secureLog.error('Failed to load resumable count:', e);
```

---

#### 3.5: components/app/ScreenShareViewer.tsx

**Lines 144, 163, 211:**
```typescript
// BEFORE
console.error('Fullscreen error:', error);
console.error('PiP error:', error);
console.error('Screenshot error:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Fullscreen error:', error);
secureLog.error('PiP error:', error);
secureLog.error('Screenshot error:', error);
```

---

#### 3.6: components/transfer/FolderDownload.tsx

**Line 62:**
```typescript
// BEFORE
console.error('Failed to download folder:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Failed to download folder:', error);
```

---

#### 3.7: components/transfer/advanced-file-transfer.tsx

**Lines 111, 117, 153, 160, 203, 208:**
```typescript
// BEFORE
console.log('Transfer prepared:', { ... });
console.error('Transfer preparation failed:', error);
console.log('File decrypted:', { ... });
console.error('Decryption failed:', error);
console.log('File downloaded:', { ... });
console.error('Download failed:', error);

// AFTER (remove info logs, migrate errors)
import secureLog from '@/lib/utils/secure-logger';
// Remove console.log entirely or use debug:
secureLog.debug('Transfer prepared:', { ... });
secureLog.error('Transfer preparation failed:', error);
secureLog.debug('File decrypted:', { ... });
secureLog.error('Decryption failed:', error);
secureLog.debug('File downloaded:', { ... });
secureLog.error('Download failed:', error);
```

**Recommendation:** Remove info logs, keep errors with secureLog

---

#### 3.8: components/transfer/FolderSelector.tsx

**Line 113:**
```typescript
// BEFORE
console.error('Failed to process folder:', error);

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.error('Failed to process folder:', error);
```

---

#### 3.9: components/examples/group-transfer-example.tsx

**Lines 59, 62:**
```typescript
// BEFORE
console.log('Discovered devices:', devices);
console.log('Connection result:', result);

// AFTER (for examples, these can stay as debug)
import secureLog from '@/lib/utils/secure-logger';
secureLog.debug('Discovered devices:', devices);
secureLog.debug('Connection result:', result);
```

---

#### 3.10: app/screen-share-demo/page.tsx

**Lines 197, 202:**
```typescript
// BEFORE
console.log('Stream ready:', stream);
console.log('Sharing stopped');

// AFTER
import secureLog from '@/lib/utils/secure-logger';
secureLog.debug('Stream ready:', stream);
secureLog.debug('Sharing stopped');
```

---

### Automated Cleanup Script

Create `scripts/cleanup-debug-logs.sh`:

```bash
#!/bin/bash

# Files with debug console.log to remove or migrate
files=(
  "components/app/install-prompt.tsx"
  "components/examples/group-transfer-example.tsx"
  "app/screen-share-demo/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Cleaning $file..."

    # Comment out console.log (safer than deleting)
    sed -i 's/\s*console\.log/\/\/ console.log/g' "$file"

    echo "✓ Cleaned $file"
  fi
done

echo "Cleanup complete!"
```

---

## Phase 4: Analytics Exception (Keep As-Is)

### File: components/analytics/plausible-script.tsx

**Decision:** KEEP the console statements

**Reason:**
- Third-party script debugging
- Useful for troubleshooting analytics
- Will be removed in production build anyway
- Low priority

**Action:** Add comment to document the exception

```typescript
// NOTE: Console logs intentionally kept for third-party analytics debugging
// These are removed in production builds via Next.js compiler config
console.log('[Plausible] Analytics script loaded');
console.warn('[Plausible] Failed to load analytics script');
```

---

## Phase 5: UI Examples (Keep for Demo)

### Files with intentional console for UI demos:

- `components/ui/toast-examples.tsx`
- `components/features/feature-card.example.tsx`

**Decision:** KEEP these as they're example/demo code

**Action:** Add comments:

```typescript
// Demo code - console.log kept for interactive examples
onClick: () => console.log('Opening file...')
```

---

## Phase 6: Documentation Comments (30 minutes)

Add a comment block at the top of files with remaining direct console usage:

```typescript
/**
 * LOGGING POLICY:
 * - Use secureLog for all application logging
 * - Console statements in this file are for [REASON]:
 *   - Demo/example code
 *   - Third-party integration debugging
 *   - Removed in production builds
 */
```

---

## Verification Checklist

After completing all phases:

```bash
# 1. Run linter
npm run lint

# 2. Check for remaining console usage
grep -r "console\." --include="*.ts" --include="*.tsx" components/ app/ lib/ | grep -v "secureLog" | grep -v "\.md:"

# 3. Build production
npm run build

# 4. Verify console removal
# Check build output - should see "Compiler: Removing console.log"

# 5. Test in development
npm run dev
# All logging should work normally

# 6. Test in production build
npm run start
# Only errors should log (sanitized)
```

---

## Testing

### Test 1: Development Logging

```typescript
// Create test file: tests/logging.test.ts
import secureLog from '@/lib/utils/secure-logger';

describe('Logging in Development', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'development';
  });

  it('should log in development', () => {
    const spy = jest.spyOn(console, 'log');
    secureLog.log('test message');
    expect(spy).toHaveBeenCalledWith('test message');
    spy.mockRestore();
  });
});
```

### Test 2: Production Sanitization

```typescript
describe('Logging in Production', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'production';
  });

  it('should sanitize errors in production', () => {
    const spy = jest.spyOn(console, 'error');
    secureLog.error('sensitive error', { secret: 'data' });
    expect(spy).toHaveBeenCalledWith('An error occurred');
    expect(spy).not.toHaveBeenCalledWith('sensitive error');
    spy.mockRestore();
  });
});
```

---

## Git Workflow

### Branch Strategy

```bash
# Create feature branch
git checkout -b fix/console-audit-improvements

# Make changes in phases
git add [files]
git commit -m "Phase 1: Add ESLint no-console rule"

git add [files]
git commit -m "Phase 2: Migrate component errors to secureLog"

git add [files]
git commit -m "Phase 3: Clean up debug statements"

# Push and create PR
git push origin fix/console-audit-improvements
```

### Commit Messages

```
Phase 1: Add ESLint no-console rule
- Added no-console warning to ESLint config
- Will catch future direct console usage
- Part of console audit fix (CONSOLE_OUTPUT_AUDIT_REPORT.md)

Phase 2: Migrate error logging to secureLog
- Updated 15 component files
- Replaced console.error with secureLog.error
- Improves consistency and production error handling
- No functional changes (production builds already remove console)

Phase 3: Clean up debug console statements
- Removed/migrated 10 debug console.log calls
- Kept intentional logs in demo/example code with comments
- Cleaner development console output
```

---

## Rollback Plan

If issues arise:

```bash
# Revert all changes
git revert [commit-hash]

# Or reset to before changes
git reset --hard origin/main

# Redeploy previous version
```

**Risk:** VERY LOW
- Changes only affect logging
- No functional code changes
- Production already removes console.log

---

## Post-Implementation

### 1. Update Documentation

Add to `CONTRIBUTING.md`:

```markdown
## Logging Standards

Use the secure logger for all application logging:

```typescript
import secureLog from '@/lib/utils/secure-logger';

// Development and production (sanitized)
secureLog.error('Error message', error);

// Development only
secureLog.log('Info message');
secureLog.warn('Warning message');
secureLog.debug('Debug message');
```

**Never use console directly** - It bypasses production safeguards.
```

### 2. Team Training

- Send summary email with new standards
- Add to onboarding checklist
- Review in next team meeting

### 3. Monitoring

Set up alerts for:
- ESLint warnings in CI/CD
- Production error rates (if using Sentry)
- Build warnings

---

## Success Metrics

After implementation:

- [ ] ESLint passes with 0 console warnings
- [ ] 100% secureLog adoption in source code
- [ ] Production build shows console removal
- [ ] All tests pass
- [ ] No functional regressions
- [ ] Team trained on new standards

---

## Time Estimates

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| 1 | ESLint rule | 30 min |
| 2 | Error migration (15 files) | 2 hours |
| 3 | Debug cleanup (10 files) | 1 hour |
| 4 | Analytics exception | 5 min |
| 5 | UI examples | 5 min |
| 6 | Documentation | 30 min |
| Testing | All phases | 30 min |
| PR Review | Code review | 30 min |

**Total:** 5 hours

---

## Questions & Support

If you encounter issues:

1. Check the audit report for context
2. Review the secure logger implementation
3. Test in both dev and prod modes
4. Ask in team channel if unclear

**Contact:** Engineering team lead

---

**Document Version:** 1.0
**Last Updated:** 2026-01-28
**Related:** CONSOLE_OUTPUT_AUDIT_REPORT.md, CONSOLE_AUDIT_QUICK_SUMMARY.md
