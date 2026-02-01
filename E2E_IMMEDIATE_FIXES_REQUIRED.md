# IMMEDIATE E2E Test Fixes Required

## Critical Test Failure - 1.28% Pass Rate (9/702 tests)

**Status**: 🔴 CRITICAL INFRASTRUCTURE FAILURE

## Immediate Actions (Execute in Order)

### Step 1: Stop All Node Processes
```bash
# Windows
tasklist | findstr node
taskkill /F /IM node.exe /T

# Verify no processes remain
tasklist | findstr node
```

### Step 2: Clean All Build Artifacts
```bash
# Remove Next.js build cache
rm -rf .next

# Remove node module caches
rm -rf node_modules/.cache

# Remove Playwright test results
rm -rf test-results
rm -rf playwright-report

# Remove any lock files
rm -f .next/dev/lock
```

### Step 3: Fix next.config.ts

Remove the deprecated `swcMinify` option:

**File**: `C:\Users\aamir\Documents\Apps\Tallow\next.config.ts`

**Remove or comment out**:
```typescript
swcMinify: true, // This option is deprecated in Next.js 16+
```

### Step 4: Verify Playwright Configuration

**File**: `C:\Users\aamir\Documents\Apps\Tallow\playwright.config.ts`

Ensure proper webServer configuration:

```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  timeout: 120000, // 2 minutes
  reuseExistingServer: !process.env.CI,
  // Add these if not present:
  stdout: 'pipe',
  stderr: 'pipe',
},
```

### Step 5: Rebuild and Test

```bash
# Install dependencies (if needed)
npm install

# Clean start
npm run dev

# In another terminal, verify server is running
curl http://localhost:3000

# Stop the dev server (Ctrl+C)

# Run a single test to verify
npx playwright test tests/e2e/landing.spec.ts --headed

# If that passes, run full suite
npx playwright test
```

## Root Causes Identified

1. **Next.js Build Manifests Missing**: Critical manifest files not found
   - app-paths-manifest.json
   - routes-manifest.json
   - pages-manifest.json

2. **Lock File Conflicts**: Multiple dev server instances or improper cleanup

3. **Cache Corruption**: Webpack caching failures

4. **Config Issues**: Deprecated options in next.config.ts

5. **WASM Module Warnings**: PQC kyber modules async/await compatibility

## Quick Verification Script

Create and run this script to verify the environment:

```bash
#!/bin/bash
# verify-test-env.sh

echo "=== Test Environment Verification ==="

echo -n "Checking for running Node processes... "
if tasklist | findstr node > /dev/null 2>&1; then
    echo "⚠️  FOUND - Please stop all Node processes"
    tasklist | findstr node
else
    echo "✓ None found"
fi

echo -n "Checking for .next directory... "
if [ -d ".next" ]; then
    echo "⚠️  EXISTS - Should be removed"
else
    echo "✓ Clean"
fi

echo -n "Checking for lock files... "
if [ -f ".next/dev/lock" ]; then
    echo "⚠️  FOUND - Should be removed"
else
    echo "✓ No locks"
fi

echo -n "Checking next.config.ts for deprecated options... "
if grep -q "swcMinify" next.config.ts; then
    echo "⚠️  FOUND swcMinify - Should be removed"
else
    echo "✓ Config OK"
fi

echo ""
echo "=== Verification Complete ==="
```

## Expected Timeline

- **Step 1-2**: 2 minutes (cleanup)
- **Step 3**: 5 minutes (config fixes)
- **Step 4**: 5 minutes (verify Playwright config)
- **Step 5**: 50 minutes (rebuild and full test run)

**Total**: ~60 minutes to resolution

## Success Criteria

- All Node processes stopped ✓
- Build artifacts cleaned ✓
- Configuration updated ✓
- Dev server starts without errors ✓
- Single test passes ✓
- Full test suite achieves >75% pass rate ✓

## If Issues Persist

1. Check `C:\Users\aamir\Documents\Apps\Tallow\E2E_TEST_ANALYSIS_2026-01-28.md` for detailed analysis
2. Review git history for recent changes:
   ```bash
   git log --oneline -20
   git diff HEAD~5..HEAD next.config.ts playwright.config.ts
   ```
3. Check for Windows-specific file system issues (long paths, permissions)
4. Verify no antivirus is blocking file operations in .next directory

## Contact

If immediate resolution is needed, escalate with:
- **Test Analysis Report**: E2E_TEST_ANALYSIS_2026-01-28.md
- **Error Logs**: test-results/*/error-context.md
- **Server Output**: Check for specific manifest/lock file errors

---

**Priority**: 🔴 **CRITICAL**
**Blocking**: Production deployments
**Created**: 2026-01-28 13:20
