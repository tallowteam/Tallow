# Offline Support Quick Reference Guide

## Overview

Tallow now includes comprehensive offline support powered by a service worker implementation. This guide provides quick access to common tasks and troubleshooting.

## For Users

### What Works Offline?

- ✅ Previously visited pages
- ✅ Cached static assets (images, styles, fonts)
- ✅ PQC crypto libraries (instant encryption even offline)
- ✅ Prepared file transfers (ready when connection returns)
- ✅ UI navigation and interactions

### What Requires Internet?

- ❌ New file transfers
- ❌ Signaling server connection
- ❌ API calls to fresh data
- ❌ Real-time features

### Using Offline Features

1. **First Visit**: Load the app at least once while online
2. **Automatic Caching**: Assets are cached automatically
3. **Offline Mode**: The app detects and shows offline status
4. **Reconnection**: Automatic sync when connection returns

## For Developers

### Service Worker Files

```
/public/service-worker.js          # Main service worker
/lib/hooks/use-service-worker.ts   # React hook for SW control
/components/app/offline-indicator.tsx  # UI indicator
/lib/utils/cache-stats.ts          # Cache management utilities
```

### Quick Commands

```bash
# Build with SVG optimization
npm run build

# Optimize SVGs manually
npm run optimize:svg

# Run unit tests
npm run test:unit

# Run E2E tests including offline tests
npm run test
```

### Cache Types

| Cache Name | Strategy | Purpose |
|------------|----------|---------|
| `tallow-static-v1` | Cache-first | HTML, core assets, offline page |
| `tallow-pqc-v1` | Stale-while-revalidate | PQC crypto libraries |
| `tallow-dynamic-v1` | Stale-while-revalidate | Runtime assets (max 50 items) |
| `tallow-api-v1` | Network-first | API responses (max 30 items) |

### Using the Service Worker Hook

```typescript
import { useServiceWorker } from '@/lib/hooks/use-service-worker';

function MyComponent() {
  const {
    isSupported,      // Browser support check
    isRegistered,     // Registration status
    isOnline,         // Network status
    needsUpdate,      // Update available
    updateServiceWorker,  // Trigger update
    clearCache,       // Clear all caches
    preloadPQCChunks  // Preload crypto libraries
  } = useServiceWorker();

  return (
    <div>
      {!isOnline && <p>You are offline</p>}
      {needsUpdate && (
        <button onClick={updateServiceWorker}>
          Update Available
        </button>
      )}
    </div>
  );
}
```

### Managing Caches Programmatically

```typescript
import {
  getCacheStats,
  getCacheItems,
  clearCache,
  clearAllCaches,
  getStorageQuota,
  formatBytes,
} from '@/lib/utils/cache-stats';

// Get all cache statistics
const stats = await getCacheStats();
console.log(stats);

// Get items in a specific cache
const items = await getCacheItems('tallow-static-v1');
console.log(items);

// Clear a specific cache
await clearCache('tallow-api-v1');

// Clear all caches
await clearAllCaches();

// Check storage quota
const quota = await getStorageQuota();
console.log(`Using ${formatBytes(quota.usage)} of ${formatBytes(quota.quota)}`);
```

### Cache Debug Panel

In development mode, a floating debug panel is available:

1. Click the purple database icon (bottom-right)
2. View cache statistics
3. Inspect individual caches
4. Clear caches
5. Preload PQC chunks
6. Monitor storage usage

### Testing Offline Functionality

#### Manual Testing in Chrome DevTools

1. Open DevTools (F12)
2. Go to Application tab
3. Click "Service Workers" in left sidebar
4. Check "Offline" checkbox
5. Reload the page
6. Verify offline functionality

#### Automated E2E Tests

```bash
# Run offline-specific tests
npm run test -- tests/e2e/offline.spec.ts

# Run with UI mode for debugging
npm run test:ui -- tests/e2e/offline.spec.ts
```

### Updating the Service Worker

When deploying changes to the service worker:

1. **Update cache version**:
   ```javascript
   // In public/service-worker.js
   const CACHE_VERSION = 'v2';  // Increment version
   ```

2. **Test the update flow**:
   - Deploy new version
   - Open app in existing session
   - Verify update banner appears
   - Test update process

3. **Monitor in production**:
   - Check service worker registration rate
   - Monitor update acceptance rate
   - Watch for errors in console

### Common Patterns

#### Checking Online Status

```typescript
const { isOnline } = useServiceWorker();

useEffect(() => {
  if (isOnline) {
    // Sync pending changes
    syncData();
  }
}, [isOnline]);
```

#### Preloading Critical Assets

```typescript
const { preloadPQCChunks } = useServiceWorker();

useEffect(() => {
  // Preload on app start
  preloadPQCChunks();
}, []);
```

#### Handling Update Notifications

```typescript
const { needsUpdate, updateServiceWorker } = useServiceWorker();

useEffect(() => {
  if (needsUpdate) {
    // Show custom update UI
    toast({
      title: "Update Available",
      action: <Button onClick={updateServiceWorker}>Update</Button>,
    });
  }
}, [needsUpdate]);
```

### Debugging Tips

#### Service Worker Not Registering

1. Check console for errors
2. Verify HTTPS or localhost
3. Check browser support
4. Inspect Application > Service Workers in DevTools
5. Try hard refresh (Ctrl+Shift+R)

#### Caches Not Updating

1. Update `CACHE_VERSION`
2. Clear old caches manually
3. Unregister service worker
4. Hard refresh

#### Offline Page Not Showing

1. Verify `/offline` route exists
2. Check static cache contents
3. Test navigation fallback
4. Inspect network errors in DevTools

#### Cache Growing Too Large

1. Check cache size limits in service worker
2. Verify LRU eviction is working
3. Manually clear old caches
4. Adjust `MAX_CACHE_ITEMS` values

### Performance Monitoring

#### Metrics to Track

1. **Cache Hit Rate**: Percentage of requests served from cache
2. **Service Worker Registration**: Success rate
3. **Update Acceptance**: Users accepting updates
4. **Storage Usage**: Average cache size per user
5. **Offline Visits**: Pages viewed while offline

#### Using Cache Statistics

```typescript
// Log cache stats to console
import { logCacheStats } from '@/lib/utils/cache-stats';

logCacheStats();
// Output:
// 📦 Service Worker Cache Statistics
//   Total Caches: 4
//   Total Items: 42
//   Total Size: 2.5 MB
//   ...
```

### Browser Compatibility

| Browser | Supported | Notes |
|---------|-----------|-------|
| Chrome 45+ | ✅ | Full support |
| Firefox 44+ | ✅ | Full support |
| Safari 11.1+ | ✅ | Full support |
| Edge 17+ | ✅ | Full support |
| Opera 32+ | ✅ | Full support |
| IE 11 | ❌ | Not supported |

### Security Considerations

1. **HTTPS Only**: Service workers require HTTPS (except localhost)
2. **Same-Origin**: Service worker scope is origin-isolated
3. **No Sensitive Data**: Avoid caching sensitive API responses
4. **Script Removal**: SVGs are sanitized (scripts removed)
5. **Cache Privacy**: Caches are per-origin

### Best Practices

1. **Version All Caches**: Always increment version on changes
2. **Limit Cache Sizes**: Prevent excessive storage usage
3. **Monitor Performance**: Track cache hit rates
4. **Test Offline Thoroughly**: Verify critical paths work offline
5. **Provide Clear Feedback**: Always show offline status to users
6. **Handle Updates Gracefully**: Don't force immediate updates
7. **Clean Up Regularly**: Remove old cached items

### Troubleshooting Checklist

- [ ] Service worker registered successfully?
- [ ] HTTPS or localhost environment?
- [ ] Browser supports service workers?
- [ ] Cache version updated after changes?
- [ ] Static assets being cached?
- [ ] Offline page accessible?
- [ ] Network events firing correctly?
- [ ] No console errors?
- [ ] Cache size within limits?
- [ ] Update flow working?

### Resources

- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google Workbox](https://developers.google.com/web/tools/workbox)
- [Service Worker Lifecycle](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)

---

**Last Updated**: January 2026
**Maintained by**: Frontend Development Team
