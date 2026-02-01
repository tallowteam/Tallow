# Performance Optimization Quick Start

Get TALLOW running at peak performance in 5 minutes.

## Quick Setup

### 1. Install Dependencies (if not already done)

```bash
npm install
```

### 2. Build and Measure

```bash
# Build with optimizations
npm run build

# Check bundle size
npm run bench:bundle
```

### 3. Run Benchmarks

```bash
# Set performance baseline
npm run bench:baseline

# Run all benchmarks
npm run bench:all
```

## Performance Checklist

### ✅ Bundle Size: < 250KB Gzipped

**Current Status:**
```bash
npm run bench:bundle
```

**If over budget:**
1. Run bundle analyzer: `ANALYZE=true npm run build`
2. Identify large chunks
3. Enable lazy loading for heavy components
4. Check `next.config.ts` for `optimizePackageImports`

### ✅ Lighthouse Score: 95+

**Run test:**
```bash
# Start production server
npm run build && npm start

# In another terminal
npm run bench:lighthouse
```

**If score < 95:**
- Check LCP (should be < 2.5s)
- Check CLS (should be < 0.1)
- Check TBT (should be < 200ms)
- Review images (convert to WebP/AVIF)
- Preload critical resources

### ✅ Images Optimized

**Run optimizer:**
```bash
npm run optimize:images
```

**Manual check:**
- All images in WebP or AVIF format
- Responsive sizes generated
- Lazy loading enabled for below-fold images
- Alt text present for accessibility

### ✅ Fonts Optimized

**Check in `app/layout.tsx`:**
- Variable fonts used (single file)
- `display: "swap"` set
- Critical fonts preloaded
- Non-critical fonts lazy loaded

### ✅ Caching Configured

**Cache strategy is in `lib/cache/cache-strategy.ts`**

Verify service worker is registered:
1. Open DevTools > Application > Service Workers
2. Should see "activated and running"

### ✅ Resource Hints Added

**Check in `app/layout.tsx` `<head>`:**
- DNS prefetch for known domains
- Preconnect to critical origins
- Preload critical fonts
- Preload critical images

## Performance Monitoring Setup

### Enable in Your App

Add to your root component:

```typescript
// app/layout.tsx or app/page.tsx
import { useEffect } from 'react';
import { initPerformanceMonitoring } from '@/lib/monitoring/performance';

export default function RootComponent() {
  useEffect(() => {
    initPerformanceMonitoring();
  }, []);

  return (
    // Your app
  );
}
```

### Monitor Real User Metrics

```typescript
import { generatePerformanceReport } from '@/lib/monitoring/performance';

// In development console
const report = generatePerformanceReport();
console.log(report);
```

## Common Performance Issues

### Issue: Bundle Size Too Large

**Solution:**
```bash
# 1. Analyze bundle
ANALYZE=true npm run build

# 2. Add heavy packages to lazy loading
# In your component:
const HeavyComponent = lazy(() => import('./HeavyComponent'));

# 3. Check package imports in next.config.ts
```

### Issue: Slow Page Load

**Solution:**
1. Preload critical resources in `app/layout.tsx`
2. Optimize images: `npm run optimize:images`
3. Enable caching in service worker
4. Use `loading="lazy"` for below-fold images

### Issue: High Memory Usage

**Solution:**
```typescript
import { startMemoryMonitoring, getMemoryUsage } from '@/lib/monitoring/performance';

// Monitor memory
startMemoryMonitoring(15000); // Check every 15s

// Check current usage
const usage = getMemoryUsage();
if (usage && usage.percentage > 80) {
  console.warn('High memory usage:', usage);
}
```

### Issue: Poor Transfer Speed

**Solution:**
```bash
# Benchmark transfer speeds
npm run bench:transfer

# Check encryption performance
# If slow, consider:
# 1. Increasing chunk size
# 2. Using Web Workers for encryption
# 3. Enabling hardware acceleration
```

## Continuous Monitoring

### Before Each Deployment

```bash
# 1. Build
npm run build

# 2. Check bundle size
npm run bench:bundle

# 3. Run regression test
npm run bench:regression

# 4. If issues found, fix before deploying
```

### Set Up CI/CD

Add to your CI pipeline:

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run bench:bundle
      - run: npm run bench:regression
```

## Performance Targets

| Metric | Target | Check Command |
|--------|--------|---------------|
| Lighthouse Score | ≥ 95 | `npm run bench:lighthouse` |
| Bundle Size (Gzip) | < 250KB | `npm run bench:bundle` |
| LCP | < 2.5s | `npm run bench:lighthouse` |
| FCP | < 1.0s | `npm run bench:lighthouse` |
| CLS | < 0.1 | `npm run bench:lighthouse` |
| INP | < 200ms | `npm run bench:lighthouse` |

## Useful Commands

```bash
# Build with analysis
ANALYZE=true npm run build

# Check bundle size
npm run bench:bundle

# Run all benchmarks
npm run bench:all

# Set performance baseline
npm run bench:baseline

# Check for regressions
npm run bench:regression

# Optimize images
npm run optimize:images

# Monitor in development
npm run perf:vitals
```

## Next Steps

1. ✅ Complete quick setup above
2. 📚 Read full guide: [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)
3. 🎯 Set up monitoring in production
4. 🔄 Add performance tests to CI/CD
5. 📊 Review metrics regularly

## Need Help?

- **Bundle too large?** Check `next.config.ts` optimization settings
- **Slow loading?** Review resource hints in `app/layout.tsx`
- **Memory issues?** Use memory monitoring tools
- **Low Lighthouse score?** Run `npm run bench:lighthouse` for details

For detailed troubleshooting, see [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md).
