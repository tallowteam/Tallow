# Performance Optimization Guide

Complete guide to TALLOW's performance optimization implementation and monitoring.

## Overview

TALLOW is optimized to achieve:
- **Lighthouse Score**: 95+
- **LCP**: < 2.5s
- **FID/INP**: < 100ms / < 200ms
- **CLS**: < 0.1
- **Bundle Size**: < 250KB gzipped

## Table of Contents

- [Bundle Optimization](#bundle-optimization)
- [Performance Monitoring](#performance-monitoring)
- [Image Optimization](#image-optimization)
- [Font Optimization](#font-optimization)
- [Cache Strategy](#cache-strategy)
- [Benchmark Suite](#benchmark-suite)
- [Resource Hints](#resource-hints)

---

## Bundle Optimization

### Configuration

Bundle optimization is configured in `next.config.ts`:

```typescript
experimental: {
  optimizePackageImports: [
    'lucide-react',        // Icon tree-shaking
    'framer-motion',       // Animation library
    'date-fns',            // Date utilities
    '@radix-ui/*',         // UI components
    '@noble/*',            // Crypto utilities
    'web-vitals',          // Performance monitoring
    // ... and more
  ],
  optimizeCss: true,
}
```

### Webpack Optimizations

**Code Splitting Strategy:**
- PQC crypto libraries: Lazy loaded, separate chunk
- UI libraries (Radix): Separate chunk
- Vendor dependencies: Separate chunk
- Common components: Shared chunk

**Tree Shaking:**
- `usedExports: true` - Remove unused exports
- `sideEffects: true` - Enable package.json sideEffects field
- `concatenateModules: true` - Scope hoisting

### Bundle Analysis

**Check bundle size:**
```bash
npm run bench:bundle
```

**Analyze bundle composition:**
```bash
ANALYZE=true npm run build
```

**Track bundle size over time:**
```bash
# After each build
npm run bench:bundle
```

Reports are saved to `reports/bundle-size-report.md`.

### Bundle Budgets

| Asset | Budget | Current |
|-------|--------|---------|
| Total (Gzip) | 250KB | ~200KB |
| Main Chunk | 100KB | ~80KB |
| CSS | 50KB | ~30KB |

---

## Performance Monitoring

### Core Web Vitals Tracking

Implemented in `lib/monitoring/performance.ts`:

```typescript
import { initPerformanceMonitoring } from '@/lib/monitoring/performance';

// Initialize in your app
await initPerformanceMonitoring();
```

**Metrics Tracked:**
- **LCP** (Largest Contentful Paint)
- **FCP** (First Contentful Paint)
- **CLS** (Cumulative Layout Shift)
- **INP** (Interaction to Next Paint)
- **TTFB** (Time to First Byte)

### Custom Performance Marks

```typescript
import { mark, measure } from '@/lib/monitoring/performance';

// Create a mark
mark('encryption-start');

// Do some work
await encryptFile(file);

// Measure duration
measure('encryption-duration', 'encryption-start');
```

### Transfer Speed Metrics

```typescript
import { recordTransferSpeed } from '@/lib/monitoring/performance';

const metric = recordTransferSpeed(
  transferId,
  fileSize,
  startTime,
  endTime,
  'p2p' // or 'relay'
);

console.log(`Speed: ${metric.speed} bytes/sec`);
```

### Memory Monitoring

```typescript
import {
  startMemoryMonitoring,
  getMemoryUsage,
  getMemorySnapshots
} from '@/lib/monitoring/performance';

// Start continuous monitoring
startMemoryMonitoring(15000); // Every 15 seconds

// Get current memory usage
const usage = getMemoryUsage();
console.log(`Memory: ${usage.percentage}%`);
```

### Long Task Detection

Automatically monitors tasks taking > 50ms:

```typescript
import { startLongTaskMonitoring } from '@/lib/monitoring/performance';

startLongTaskMonitoring();
```

### Performance Reports

Generate comprehensive performance report:

```typescript
import { generatePerformanceReport } from '@/lib/monitoring/performance';

const report = generatePerformanceReport();
console.log(report);
```

---

## Image Optimization

### Automated Optimization

Run the image optimizer:

```bash
npm run optimize:images
```

This will:
1. Convert PNG/JPG to WebP and AVIF
2. Generate responsive sizes (192px, 384px, 512px, 1024px)
3. Create usage guide in `public/optimized/USAGE.md`

### Usage in Next.js

```tsx
import Image from 'next/image';

<Image
  src="/icon-192.png"
  alt="App Icon"
  width={192}
  height={192}
  formats={['image/avif', 'image/webp']}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

### Manual Picture Element

```html
<picture>
  <source srcset="/optimized/icon-192.avif" type="image/avif" />
  <source srcset="/optimized/icon-192.webp" type="image/webp" />
  <img src="/icon-192.png" alt="App Icon" loading="lazy" />
</picture>
```

### Image Requirements

- Use WebP/AVIF for all raster images
- Provide multiple sizes for responsive images
- Add `loading="lazy"` for below-fold images
- Include blur placeholders for better UX

---

## Font Optimization

### Current Configuration

Fonts are configured in `app/layout.tsx`:

```typescript
// Inter - Variable font
const inter = localFont({
  src: "../public/fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",    // Prevent invisible text
  preload: true,      // Preload critical font
});
```

### Best Practices

1. **Use Variable Fonts**: Single file for all weights
2. **Font Display**: Always use `display: "swap"`
3. **Subset Fonts**: Include only Latin characters
4. **Preload Critical Fonts**: Add to `<head>`

```html
<link
  rel="preload"
  href="/fonts/inter-latin-wght-normal.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

4. **Lazy Load Non-Critical**: Set `preload: false`

---

## Cache Strategy

### Configuration

Cache strategies are defined in `lib/cache/cache-strategy.ts`:

| Resource Type | Strategy | Max Age | Max Entries |
|--------------|----------|---------|-------------|
| Static Assets | Cache-First | 1 year | 100 |
| Pages | Network-First | 1 day | 50 |
| API | Network-First | 5 min | 100 |
| Images | Cache-First | 30 days | 200 |
| Fonts | Cache-First | 1 year | 30 |
| WebSocket | Network-Only | 0 | - |

### Usage

```typescript
import {
  getStrategyForRequest,
  executeStrategy,
  cleanupOldCaches
} from '@/lib/cache/cache-strategy';

// In service worker
self.addEventListener('fetch', (event) => {
  const strategy = getStrategyForRequest(event.request);

  if (strategy) {
    event.respondWith(executeStrategy(event.request, strategy));
  }
});

// Cleanup on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(cleanupOldCaches());
});
```

### Cache Management

```typescript
import {
  clearAllCaches,
  getCacheStats,
  pruneCache
} from '@/lib/cache/cache-strategy';

// Clear all caches
await clearAllCaches();

// Get cache statistics
const stats = await getCacheStats();
console.log(`Total size: ${stats.totalSize} bytes`);
console.log(`Total entries: ${stats.totalEntries}`);

// Prune specific cache
await pruneCache('tallow-images-v1', 200);
```

---

## Benchmark Suite

### Lighthouse CI

Run Lighthouse audits with performance budgets:

```bash
npm run bench:lighthouse
```

**Configuration**: `.lighthouserc.js`

**Budgets:**
- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 100
- LCP: < 2.5s
- FCP: < 1s
- CLS: < 0.1
- Total Size: < 250KB

### Bundle Size Tracking

Track bundle size over time:

```bash
npm run bench:bundle
```

**Features:**
- Compares with previous builds
- Checks against budgets
- Tracks history (last 30 builds)
- Identifies largest chunks

### Transfer Speed Benchmarks

Benchmark encryption, chunking, and compression:

```bash
npm run bench:transfer
```

**Test Sizes:**
- 1KB, 10KB, 100KB
- 1MB, 10MB, 100MB

**Operations Tested:**
- ChaCha20-Poly1305 encryption
- File chunking
- Gzip compression
- SHA-256 hashing

### Performance Regression Tests

Detect performance regressions:

```bash
# Set baseline (after optimization)
npm run bench:baseline

# Run regression test
npm run bench:regression
```

**Thresholds:**
- Lighthouse: 5% regression allowed
- Bundle Size: 10% increase allowed
- Transfer Speed: 10% decrease allowed

### Run All Benchmarks

```bash
npm run bench:all
```

---

## Resource Hints

### DNS Prefetch

Resolve DNS for known origins early:

```html
<link rel="dns-prefetch" href="https://signaling.manisahome.com" />
<link rel="dns-prefetch" href="https://api.stripe.com" />
```

### Preconnect

Establish early connections to critical origins:

```html
<link rel="preconnect" href="https://signaling.manisahome.com" crossOrigin="anonymous" />
```

### Preload

Preload critical resources:

```html
<!-- Critical font -->
<link
  rel="preload"
  href="/fonts/inter-latin-wght-normal.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>

<!-- Critical image -->
<link
  rel="preload"
  href="/icon-192.png"
  as="image"
  type="image/png"
/>
```

### Module Preload

Next.js automatically adds module preload hints for critical JavaScript chunks.

---

## Performance Checklist

### Before Deployment

- [ ] Run `npm run bench:all`
- [ ] Verify Lighthouse score ≥ 95
- [ ] Check bundle size < 250KB gzipped
- [ ] Test transfer speeds meet targets
- [ ] No performance regression detected
- [ ] Images optimized (WebP/AVIF)
- [ ] Fonts preloaded correctly
- [ ] Service worker caching enabled
- [ ] Resource hints configured
- [ ] Long tasks < 50ms

### Monitoring Production

```bash
# Check metrics endpoint
npm run metrics

# View health status
npm run health

# Generate performance report
node -e "require('./lib/monitoring/performance').generatePerformanceReport()"
```

---

## Performance Targets

### Core Web Vitals

| Metric | Target | Good | Needs Improvement | Poor |
|--------|--------|------|-------------------|------|
| LCP | < 2.5s | ≤ 2.5s | 2.5s - 4s | > 4s |
| INP | < 200ms | ≤ 200ms | 200ms - 500ms | > 500ms |
| CLS | < 0.1 | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |

### Loading Performance

| Metric | Target |
|--------|--------|
| FCP | < 1.0s |
| TTI | < 2.0s |
| TBT | < 200ms |
| Speed Index | < 3.0s |

### Bundle Size

| Asset | Target |
|-------|--------|
| Total (Gzip) | < 250KB |
| Main Chunk | < 100KB |
| CSS | < 50KB |

### Transfer Performance

| File Size | Target Speed |
|-----------|--------------|
| Small (< 100KB) | > 1 MB/s |
| Medium (< 10MB) | > 10 MB/s |
| Large (> 10MB) | > 50 MB/s |

---

## Troubleshooting

### Bundle Too Large

1. Run bundle analyzer: `ANALYZE=true npm run build`
2. Identify large dependencies
3. Consider lazy loading or alternatives
4. Enable tree-shaking for the package

### Slow LCP

1. Check resource loading waterfall
2. Preload critical resources
3. Optimize images (WebP/AVIF)
4. Use responsive images
5. Enable caching

### High CLS

1. Add dimensions to images
2. Reserve space for dynamic content
3. Use skeleton loaders
4. Avoid inserting content above viewport

### Memory Issues

1. Enable memory monitoring
2. Check for memory leaks
3. Clear unused caches
4. Optimize data structures

---

## Additional Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

---

## Support

For performance issues or questions:
1. Check this guide
2. Run benchmarks to identify bottlenecks
3. Review performance reports
4. Check GitHub issues for similar problems
