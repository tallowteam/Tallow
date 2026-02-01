# Service Worker Testing Guide

## Quick Test (2 minutes)

### 1. Clear Service Worker
```
1. Open DevTools (F12)
2. Application tab > Service Workers
3. Click "Unregister" for all service workers
4. Application tab > Storage > Clear site data
5. Close DevTools
```

### 2. Hard Refresh
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### 3. Check Console
**Expected:** Clean console with only:
```
[SW] Installing service worker...
[SW] Caching static assets
[SW] Activating service worker...
```

**NOT Expected:**
- ❌ Failed to convert value to 'Response'
- ❌ FetchEvent resulted in a network error
- ❌ Multiple TypeErrors
- ❌ Fetch failed messages

## Comprehensive Test (10 minutes)

### Test 1: Online Mode
```bash
1. Load http://localhost:3000
2. Open DevTools Console
3. Count errors: should be 0
4. Navigate to /app
5. Count errors: should be 0
6. Return to /
7. Count errors: should be 0
```

**Pass Criteria:** Zero console errors

### Test 2: Offline Mode
```bash
1. Load http://localhost:3000
2. Let page fully load
3. Open DevTools > Network tab
4. Set throttling to "Offline"
5. Click refresh
6. Should see offline page OR cached content
7. Set throttling back to "No throttling"
```

**Pass Criteria:**
- Page loads (even if offline page)
- No console errors
- Service worker doesn't crash

### Test 3: Cache Verification
```bash
1. Load http://localhost:3000
2. Open DevTools > Application > Cache Storage
3. Should see:
   - tallow-static-v3
   - tallow-dynamic-v3
   - tallow-pqc-v3
   - tallow-api-v3
4. Old v2 caches should be deleted
```

**Pass Criteria:**
- v3 caches exist
- v2 caches deleted
- Static assets cached

### Test 4: Network Tab Verification
```bash
1. Load http://localhost:3000
2. Open DevTools > Network tab
3. Refresh page
4. Look at Size column for assets
5. Second load should show "(from ServiceWorker)"
```

**Pass Criteria:**
- Assets served from service worker
- No 404 or 503 errors
- No red entries

### Test 5: PQC Chunks
```bash
1. Navigate to /app
2. Open DevTools > Network tab
3. Trigger PQC feature
4. Look for pqc-crypto or kyber chunks
5. These should load successfully
6. Refresh /app
7. PQC chunks should come from cache
```

**Pass Criteria:**
- PQC chunks load without errors
- Subsequent loads use cache
- No "Failed to convert" errors

## Browser Compatibility Test

### Chrome/Edge
```
1. Open in Chrome/Edge
2. Run Quick Test
3. Verify service worker registers
4. Check console for 0 errors
```

### Firefox
```
1. Open in Firefox
2. Run Quick Test
3. Verify service worker registers
4. Check console for 0 errors
```

### Safari (if available)
```
1. Open in Safari
2. Run Quick Test
3. Verify service worker registers
4. Check console for 0 errors
```

## Known Good Console Output

### Installation (First Load)
```
[SW] Installing service worker...
[SW] Caching static assets
[SW] Activating service worker...
[SW] Deleting old cache: tallow-static-v2
[SW] Deleting old cache: tallow-dynamic-v2
[SW] Deleting old cache: tallow-pqc-v2
[SW] Deleting old cache: tallow-api-v2
Service worker registered successfully
```

### Subsequent Loads
```
(Usually silent, no SW messages unless updating)
```

### Offline Mode
```
[SW] Network request failed, trying cache: Failed to fetch
[SW] Serving from cache after network failure
```

## Troubleshooting

### Issue: Service Worker Not Updating
**Solution:**
```
1. DevTools > Application > Service Workers
2. Check "Update on reload"
3. Hard refresh (Ctrl+Shift+R)
4. Or manually click "Update" button
```

### Issue: Old Caches Not Deleted
**Solution:**
```
1. DevTools > Application > Cache Storage
2. Manually delete old v2 caches
3. Refresh page
```

### Issue: Still Seeing Errors
**Solution:**
```
1. Verify service-worker.js has CACHE_VERSION = 'v3'
2. Unregister ALL service workers
3. Clear ALL site data
4. Close and reopen browser
5. Navigate to site
```

### Issue: Offline Page Not Loading
**Solution:**
```
1. Check /offline route exists
2. Verify /offline is in STATIC_ASSETS array
3. Check manifest.json is accessible
4. Clear caches and reinstall service worker
```

## Error Patterns to Watch For

### FIXED Errors (Should NOT Appear)
```
❌ Uncaught (in promise) TypeError: Failed to convert value to 'Response'
❌ The FetchEvent for "<URL>" resulted in a network error response
❌ [SW] Fetch failed: TypeError: Failed to fetch
❌ [SW] Background fetch failed: TypeError: Failed to fetch
```

### Expected Warnings (OK to Appear)
```
⚠️ [SW] Failed to cache response: (specific resource)
⚠️ [SW] Some static assets failed to cache: (during install)
⚠️ [SW] Cache retrieval failed: (if cache corrupted)
```

### Expected Logs (Normal Operation)
```
✅ [SW] Network request failed, trying cache: Failed to fetch
✅ [SW] Serving from cache after network failure
✅ [SW] PQC chunks cached successfully
```

## Performance Verification

### Metrics to Check
1. **First Load:**
   - Service worker installs within 2 seconds
   - Static assets cached
   - No console errors

2. **Subsequent Loads:**
   - Assets served from service worker
   - Page load time same or better
   - No console errors

3. **Offline Mode:**
   - Offline page loads within 1 second
   - Or cached content serves immediately
   - No browser errors

## Automated Test Commands

### Check Service Worker Status
```javascript
// Paste in browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs.length);
  regs.forEach(reg => {
    console.log('Scope:', reg.scope);
    console.log('Active:', reg.active?.state);
  });
});
```

### Check Cache Contents
```javascript
// Paste in browser console
caches.keys().then(names => {
  console.log('Caches:', names);
  names.forEach(name => {
    caches.open(name).then(cache => {
      cache.keys().then(keys => {
        console.log(`${name}:`, keys.length, 'items');
      });
    });
  });
});
```

### Check for Errors
```javascript
// Paste in browser console (run before navigating)
let errorCount = 0;
const oldError = console.error;
console.error = function(...args) {
  errorCount++;
  oldError.apply(console, args);
};
// After navigation:
console.log('Error count:', errorCount);
```

## Success Criteria Summary

| Test | Criteria | Status |
|------|----------|--------|
| Console Errors | 0 errors | ⏳ Pending |
| Service Worker Registration | Successful | ⏳ Pending |
| Cache Creation | v3 caches exist | ⏳ Pending |
| Cache Cleanup | v2 caches deleted | ⏳ Pending |
| Offline Mode | Graceful degradation | ⏳ Pending |
| PQC Chunks | Load without errors | ⏳ Pending |
| Browser Compatibility | All supported browsers | ⏳ Pending |

## Next Steps After Testing

### If Tests Pass
1. ✅ Mark fix as verified
2. ✅ Update documentation
3. ✅ Deploy to production
4. ✅ Monitor production metrics

### If Tests Fail
1. 🔍 Document exact error messages
2. 🔍 Note browser and version
3. 🔍 Capture Network tab screenshot
4. 🔍 Check service worker state
5. 🔍 Report to debugger agent

---

**Quick Reference:**
- Service Worker File: `C:\Users\aamir\Documents\Apps\Tallow\public\service-worker.js`
- Cache Version: v3
- Expected Errors: 0
- Test Duration: 2-10 minutes
