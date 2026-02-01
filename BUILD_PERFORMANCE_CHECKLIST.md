# Build Performance Checklist

## Quick Verification Guide

Use this checklist to verify that all build timeout fixes are working correctly.

## Pre-Verification Steps

### 1. Clean All Caches
```bash
# PowerShell
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache

# Bash
rm -rf .next node_modules/.cache
```

### 2. Clear Browser Data
1. Open DevTools (F12)
2. Application > Storage > Clear site data
3. Or use: `Ctrl+Shift+Delete` > Clear cached images and files

### 3. Unregister Old Service Workers
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(regs =>
  regs.forEach(reg => reg.unregister())
);
```

## Build Verification

### Cold Build Test
```bash
npm run build
```

**Expected Results:**
- [ ] Build completes in <60 seconds
- [ ] No WASM warnings (acceptable to have async/await warning)
- [ ] All chunks generated successfully
- [ ] No 408 timeout errors

**Actual Time:** __________ seconds

### Development Server Test
```bash
npm run dev
```

**Expected Results:**
- [ ] Server starts in <30 seconds
- [ ] Compiles successfully
- [ ] No 408 errors in console
- [ ] Hot reload works
- [ ] Memory usage stable (<2GB)

**Startup Time:** __________ seconds

### Rebuild Test
1. Start dev server
2. Make a small change to a component
3. Save file

**Expected Results:**
- [ ] Rebuild completes in <5 seconds
- [ ] Fast refresh works
- [ ] No errors in console

**Rebuild Time:** __________ seconds

## Resource Loading Verification

### Browser Network Tab
1. Open app in browser
2. Open DevTools > Network tab
3. Reload page (Ctrl+R)
4. Check each resource:

**webpack.js:**
- [ ] Status: 200 (not 408)
- [ ] Cache-Control header present
- [ ] Loads in <2 seconds

**layout.css:**
- [ ] Status: 200 (not 408)
- [ ] Cache-Control header present
- [ ] Loads in <1 second

**Vendor chunks:**
- [ ] All status: 200
- [ ] Proper cache headers
- [ ] Total load time <5 seconds

### Cache Headers Verification
Check these headers on static assets:
- [ ] `Cache-Control: public, max-age=31536000, immutable`
- [ ] `ETag` header present
- [ ] `Content-Type` correct for each resource

### Service Worker Verification
```javascript
// In browser console:
navigator.serviceWorker.controller.postMessage({ type: 'CACHE_PQC_CHUNKS' });
```

**Expected Results:**
- [ ] Service worker active
- [ ] Version: v2
- [ ] No errors in console
- [ ] Caches created: tallow-static-v2, tallow-dynamic-v2, tallow-pqc-v2

## Test Execution Verification

### Unit Tests
```bash
npm run test:unit
```

**Expected Results:**
- [ ] All tests pass
- [ ] No timeout errors
- [ ] Completes in <30 seconds

### E2E Tests
```bash
npm test
```

**Expected Results:**
- [ ] Server starts successfully
- [ ] >90% tests pass
- [ ] No 408 errors in test output
- [ ] No service worker errors

## Performance Metrics

### Bundle Size Analysis
```bash
npm run build:analyze
```

**Check:**
- [ ] Total bundle size <500KB (gzipped)
- [ ] PQC crypto chunk separate
- [ ] Vendor chunk separate
- [ ] No duplicate dependencies

### Lighthouse Score
```bash
npm run perf:lighthouse
```

**Targets:**
- [ ] Performance: >90
- [ ] Accessibility: >95
- [ ] Best Practices: >90
- [ ] SEO: >90

## Configuration Verification

### next.config.ts
```bash
# Check file contains:
grep -q "optimizeCss: true" next.config.ts && echo "✓ CSS optimization enabled"
grep -q "compress: true" next.config.ts && echo "✓ Compression enabled"
grep -q "swcMinify: true" next.config.ts && echo "✓ SWC minify enabled"
grep -q "type: 'filesystem'" next.config.ts && echo "✓ Filesystem cache enabled"
```

**Expected Results:**
- [ ] All 4 checks pass

### service-worker.js
```bash
# Check version and timeout:
grep -q "CACHE_VERSION = 'v2'" public/service-worker.js && echo "✓ Version v2"
grep -q "NETWORK_TIMEOUT = 30000" public/service-worker.js && echo "✓ 30s timeout"
grep -q "/_next/webpack" public/service-worker.js && echo "✓ Webpack skip enabled"
```

**Expected Results:**
- [ ] All 3 checks pass

### playwright.config.ts
```bash
# Check timeouts:
grep -q "timeout: 90000" playwright.config.ts && echo "✓ Test timeout 90s"
grep -q "navigationTimeout: 60000" playwright.config.ts && echo "✓ Navigation timeout 60s"
grep -q "max-old-space-size=4096" playwright.config.ts && echo "✓ Memory limit 4GB"
```

**Expected Results:**
- [ ] All 3 checks pass

## Common Issues and Fixes

### Issue: Still seeing 408 errors
**Fix:**
1. Clear browser cache completely
2. Unregister service worker
3. Hard reload (Ctrl+Shift+R)
4. Check Network tab for actual failing URL
5. Verify service worker version is v2

### Issue: Build is slow
**Fix:**
1. Check Node.js version (should be >=18)
2. Increase memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`
3. Clear `.next` cache
4. Check disk space
5. Close other memory-intensive apps

### Issue: Resources not loading
**Fix:**
1. Check dev server is running
2. Verify port 3000 is not blocked
3. Check TypeScript errors: `npm run type-check`
4. Look for webpack compilation errors in server logs
5. Try disabling service worker temporarily

### Issue: Service worker errors
**Fix:**
1. Unregister all service workers
2. Clear all caches
3. Hard reload
4. Check console for specific error
5. Verify `/offline` page exists

### Issue: Tests timing out
**Fix:**
1. Reduce parallel workers to 1
2. Increase test timeout to 120s
3. Check server is not overloaded
4. Run tests individually to identify slow tests
5. Check for memory leaks in test setup

## Performance Targets

### Development
- Cold start: <30 seconds
- Hot reload: <5 seconds
- Build time: <60 seconds
- Memory usage: <2GB
- Zero 408 errors

### Production
- First Contentful Paint: <1.5s
- Time to Interactive: <3.5s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1
- Total bundle size: <500KB (gzipped)

### Testing
- Test pass rate: >90%
- Test execution time: <5 minutes
- Server startup: <3 minutes
- Zero flaky tests

## Sign-Off

After completing all checks, sign off on each section:

- [ ] Build verification complete
- [ ] Resource loading verified
- [ ] Test execution verified
- [ ] Performance metrics acceptable
- [ ] Configuration verified
- [ ] No 408 errors observed
- [ ] All targets met

**Verified by:** __________________
**Date:** __________________
**Notes:** __________________

## Continuous Monitoring

### Daily Checks
- Run `npm run build` to verify build time
- Check dev server startup time
- Monitor test pass rate

### Weekly Checks
- Run bundle analysis
- Check Lighthouse scores
- Review performance metrics
- Clean up old caches

### Monthly Checks
- Update dependencies
- Review webpack configuration
- Audit bundle size
- Performance regression testing

## Additional Resources

- [Next.js Performance Documentation](https://nextjs.org/docs/pages/building-your-application/optimizing)
- [Webpack Caching Guide](https://webpack.js.org/guides/caching/)
- [Service Worker Best Practices](https://web.dev/service-worker-caching-and-http-caching/)
- [BUILD_TIMEOUT_FIXES.md](./BUILD_TIMEOUT_FIXES.md) - Detailed fix documentation
