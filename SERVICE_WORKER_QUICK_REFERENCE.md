# Service Worker Quick Reference

**Status**: All Response handling errors FIXED
**Last Updated**: 2026-01-28

---

## Quick Health Check

### Console Commands
```javascript
// Check if service worker is registered
navigator.serviceWorker.getRegistration().then(reg =>
  console.log(reg ? 'Registered ✓' : 'Not registered ✗')
);

// Check cache status
caches.keys().then(keys => console.log('Caches:', keys));

// Clear all caches
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg?.active) {
    reg.active.postMessage({ type: 'CLEAR_CACHE' });
  }
});

// Force service worker update
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg?.waiting) {
    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
});
```

---

## Error Signatures (FIXED)

### Before Fix
```
❌ Failed to convert value to 'Response'
❌ TypeError: response is undefined
❌ Unhandled promise rejection
❌ Network fetch failed
```

### After Fix
```
✓ [SW] Service worker registered successfully
✓ All requests return valid Response objects
✓ Proper fallbacks for all error cases
✓ No console errors
```

---

## Cache Strategies

### Static Assets (Cache-First)
- **Pattern**: `/_next/static/*`, `*.js`, `*.css`, `*.woff2`, etc.
- **Flow**: Cache → Network → Offline Fallback
- **Use Case**: Immutable assets that rarely change

### PQC Chunks (Stale-While-Revalidate)
- **Pattern**: `pqc-crypto*.js`, `@noble*.js`, `*.wasm`
- **Flow**: Cache (immediate) → Network (background update)
- **Use Case**: Large crypto libraries that need fast loading

### API Calls (Network-First)
- **Pattern**: `/api/*`
- **Flow**: Network → Cache → Offline Fallback
- **Use Case**: Dynamic data that should be fresh

### Navigation (Network-First)
- **Pattern**: HTML pages
- **Flow**: Network → Cache → Offline Page
- **Use Case**: Ensure users see latest content

---

## Response Validation

### isValidResponse() Function
```javascript
// A response is valid for caching if:
✓ response exists
✓ response instanceof Response
✓ response.ok === true
✓ response.status === 200
✓ response.type !== 'error'
```

### All Code Paths
Every fetch handler now guarantees:
1. Returns Response object (never undefined/null)
2. Proper Content-Type headers
3. Appropriate HTTP status codes
4. Graceful error degradation

---

## Offline Fallbacks

### Content-Type Specific

| Request Type | Fallback Response | Content-Type |
|-------------|-------------------|--------------|
| Navigation | Offline HTML page | text/html |
| Script (.js) | `// Script unavailable offline` | application/javascript |
| Style (.css) | `/* Style unavailable offline */` | text/css |
| Image | Transparent 1x1 SVG | image/svg+xml |
| Font | Empty body | application/octet-stream |
| Other | `Network error` | text/plain |

---

## Testing

### Test Suite Location
`C:\Users\aamir\Documents\Apps\Tallow\test-service-worker.html`

### Quick Test Steps

1. **Open test page**: Navigate to `/test-service-worker.html`
2. **Register SW**: Click "Register Service Worker"
3. **Run tests**: Click test buttons in each section
4. **Check results**: Look for 100% pass rate

### Manual Testing

```javascript
// 1. Test online functionality
fetch('/').then(r => console.log('Home:', r.status));

// 2. Test offline functionality
// In DevTools → Application → Service Workers → Check "Offline"
fetch('/').then(r => console.log('Offline home:', r.status));

// 3. Test different request types
fetch('/api/health').then(r => console.log('API:', r.status));
fetch('/manifest.json').then(r => console.log('Static:', r.status));
```

---

## Common Issues & Solutions

### Issue: Service worker not registering
**Solution**:
- Check HTTPS (required for SW)
- Check browser support
- Check console for registration errors
- Verify `/service-worker.js` is accessible

### Issue: Cache not updating
**Solution**:
```javascript
// Force skip waiting
navigator.serviceWorker.getRegistration().then(reg => {
  reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
});
```

### Issue: Old cache entries
**Solution**:
```javascript
// Clear all caches
navigator.serviceWorker.getRegistration().then(reg => {
  reg?.active?.postMessage({ type: 'CLEAR_CACHE' });
});
```

### Issue: Offline page not showing
**Solution**:
- Check `/offline` route exists
- Check offline page is cached
- Test with DevTools offline mode

---

## Response Error Checklist

When debugging Response errors:

- [ ] Check all fetch handlers return Response
- [ ] Validate response before returning
- [ ] Handle all error cases
- [ ] Provide fallback responses
- [ ] Check instanceof Response
- [ ] Handle null/undefined
- [ ] Handle promise rejections
- [ ] Test offline scenarios

---

## Deployment Checklist

Before deploying service worker changes:

- [ ] Test locally with test suite
- [ ] Verify no console errors
- [ ] Test offline functionality
- [ ] Test all request types
- [ ] Test error scenarios
- [ ] Increment CACHE_VERSION if needed
- [ ] Document any breaking changes
- [ ] Monitor after deployment

---

## Service Worker Messages

### From App to Service Worker
```javascript
// Skip waiting
registration.active.postMessage({ type: 'SKIP_WAITING' });

// Clear cache
registration.active.postMessage({ type: 'CLEAR_CACHE' });

// Cache PQC chunks
registration.active.postMessage({ type: 'CACHE_PQC_CHUNKS' });
```

### From Service Worker to App
```javascript
// Listen for messages
navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('Message from SW:', event.data);
});
```

---

## Performance Monitoring

### Cache Stats
```javascript
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    stats[name] = keys.length;
  }

  return stats;
}

getCacheStats().then(console.log);
```

### Service Worker State
```javascript
function getServiceWorkerState() {
  return navigator.serviceWorker.getRegistration().then(reg => {
    if (!reg) return 'Not registered';
    if (reg.installing) return 'Installing';
    if (reg.waiting) return 'Waiting';
    if (reg.active) return 'Active';
    return 'Unknown';
  });
}

getServiceWorkerState().then(console.log);
```

---

## Cache Limits

### Maximum Items
- Dynamic Cache: 50 items
- API Cache: 30 items
- PQC Cache: 10 items
- Static Cache: Unlimited (but rarely changes)

### Maximum Age
- All caches: 7 days
- Automatic cleanup runs every 24 hours

---

## Browser Support

### Required Features
- Service Worker API
- Cache API
- Fetch API
- Promises
- HTTPS (or localhost)

### Supported Browsers
- Chrome 40+
- Firefox 44+
- Safari 11.1+
- Edge 17+

---

## React Integration

### Using the Hook
```typescript
import { useServiceWorker } from '@/lib/hooks/use-service-worker';

function MyComponent() {
  const {
    isSupported,
    isRegistered,
    isOnline,
    needsUpdate,
    updateServiceWorker,
    clearCache,
    preloadPQCChunks,
  } = useServiceWorker();

  return (
    <div>
      {needsUpdate && (
        <button onClick={updateServiceWorker}>
          Update available - Click to refresh
        </button>
      )}
      {!isOnline && <div>You are offline</div>}
    </div>
  );
}
```

---

## File Locations

### Core Files
- **Service Worker**: `C:\Users\aamir\Documents\Apps\Tallow\public\service-worker.js`
- **React Hook**: `C:\Users\aamir\Documents\Apps\Tallow\lib\hooks\use-service-worker.ts`
- **Test Suite**: `C:\Users\aamir\Documents\Apps\Tallow\test-service-worker.html`

### Documentation
- **Fix Report**: `C:\Users\aamir\Documents\Apps\Tallow\SERVICE_WORKER_FIXES_REPORT.md`
- **Debug Summary**: `C:\Users\aamir\Documents\Apps\Tallow\SERVICE_WORKER_DEBUG_SUMMARY.md`
- **Quick Reference**: `C:\Users\aamir\Documents\Apps\Tallow\SERVICE_WORKER_QUICK_REFERENCE.md` (this file)

---

## Emergency Rollback

If critical issues arise:

1. **Unregister service worker**:
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
  reg?.unregister();
  window.location.reload();
});
```

2. **Clear all caches**:
```javascript
caches.keys().then(keys => {
  Promise.all(keys.map(key => caches.delete(key)));
});
```

3. **Revert file**: Replace `service-worker.js` with previous version

4. **Force update**: All users will get new version on next page load

---

## Status: PRODUCTION READY ✓

All Response handling errors have been fixed. The service worker is:
- ✓ Guaranteed to return valid Responses
- ✓ Fully error-handled
- ✓ Content-type aware
- ✓ Comprehensively tested
- ✓ Well documented

**No further action required** - Deploy when ready.
