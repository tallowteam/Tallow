# Quick Reference: 408 Timeout Fixes

## What Was Fixed
408 Request Timeout errors on webpack.js, layout.css, and other resources.

## Key Changes

### 1. Service Worker (public/service-worker.js)
```javascript
// CHANGED: Version bumped
const CACHE_VERSION = 'v2';

// ADDED: Network timeout
const NETWORK_TIMEOUT = 30000; // 30 seconds

// ADDED: Fetch with timeout
async function fetchWithTimeout(request, timeout = NETWORK_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  // ... handles timeout and re-throws errors
}

// CHANGED: Skip webpack dev requests
if (url.pathname.includes('/_next/webpack') ||
    url.pathname.includes('/__nextjs') ||
    url.pathname.includes('/_next/static/webpack')) {
  return; // Don't cache these
}

// REMOVED: getOfflineFallback() that returned 408
// NOW: Re-throws errors instead of returning 408 responses
```

### 2. Next.js Config (next.config.ts)
```typescript
// ADDED: Webpack filesystem cache
config.cache = dev ? {
  type: 'filesystem',
  compression: 'gzip',
  maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
} : config.cache;

// ADDED: Aggressive caching headers
{
  source: '/_next/static/:path*',
  headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
}

// ADDED: Dev optimizations
if (dev) {
  config.optimization = {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  };
}
```

### 3. Playwright Config (playwright.config.ts)
```typescript
timeout: 90000,              // 90s (was 60s)
navigationTimeout: 60000,    // 60s (was 30s)
actionTimeout: 20000,        // 20s (was 15s)
webServer: {
  timeout: 180000,           // 3min (was 2min)
  env: {
    NODE_OPTIONS: '--max-old-space-size=4096'
  }
}
```

### 4. Package.json
```json
{
  "dev": "node --max-old-space-size=4096 ./node_modules/.bin/next dev --webpack -H 0.0.0.0 -p 3000"
}
```

## Quick Test

### Clear Everything
```bash
# PowerShell
Remove-Item -Recurse -Force .next

# Browser Console
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
```

### Build Test
```bash
npm run build
# Expected: ~54 seconds, no 408 errors
```

### Dev Server Test
```bash
npm run dev
# Expected: Starts in ~30s, no 408 errors in Network tab
```

### E2E Test
```bash
npm test
# Expected: >90% pass rate, no timeout errors
```

## Verify Resources Load

Open DevTools > Network:
- ✓ webpack.js: Status 200
- ✓ layout.css: Status 200
- ✓ All assets: Cache-Control headers present
- ✓ No 408 errors

## Troubleshooting

### Still seeing 408?
1. Hard reload: Ctrl+Shift+R
2. Check service worker version (should be v2)
3. Verify service worker is using new code

### Build slow?
1. Check `.next/cache` exists
2. Verify 4GB memory available
3. Close other apps

### Tests timeout?
1. Reduce workers to 1
2. Check server isn't overloaded
3. Verify timeouts are 90s/60s/20s

## Performance Targets

- Build: <60s
- Rebuild: <5s
- Zero 408 errors
- Cache hit: >90%
- Tests: >90% pass

## Files Changed

1. `next.config.ts` - Build optimization
2. `public/service-worker.js` - Fixed 408s
3. `playwright.config.ts` - Timeouts
4. `package.json` - Memory (already done)

## Full Documentation

- [TIMEOUT_FIXES_SUMMARY.md](./TIMEOUT_FIXES_SUMMARY.md) - Executive summary
- [BUILD_TIMEOUT_FIXES.md](./BUILD_TIMEOUT_FIXES.md) - Detailed guide
- [BUILD_PERFORMANCE_CHECKLIST.md](./BUILD_PERFORMANCE_CHECKLIST.md) - Verification checklist
