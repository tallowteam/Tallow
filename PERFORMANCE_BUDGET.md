# Performance Budget

This document defines the performance targets for the Tallow application. These budgets are enforced through automated CI/CD checks and monitoring.

## Core Web Vitals Targets

Based on Google's recommendations for a "Good" user experience:

| Metric | Target | Warning | Critical | Description |
|--------|--------|---------|----------|-------------|
| **LCP** | < 2.5s | < 3.5s | < 4.0s | Largest Contentful Paint - main content visibility |
| **INP** | < 200ms | < 400ms | < 500ms | Interaction to Next Paint - responsiveness |
| **CLS** | < 0.1 | < 0.2 | < 0.25 | Cumulative Layout Shift - visual stability |
| **FCP** | < 1.8s | < 2.5s | < 3.0s | First Contentful Paint - initial content |
| **TTFB** | < 800ms | < 1.2s | < 1.8s | Time to First Byte - server response |

> **Note**: FID (First Input Delay) is deprecated as of March 2024, replaced by INP.

## Bundle Size Budgets

Targets for compressed (gzip) bundle sizes:

| Resource | Target | Warning | Critical |
|----------|--------|---------|----------|
| **Initial JS** | 100 KB | 130 KB | 170 KB |
| **Total JS** | 150 KB | 200 KB | 250 KB |
| **Total CSS** | 50 KB | 75 KB | 100 KB |
| **Combined** | 200 KB | 275 KB | 350 KB |
| **Per Chunk** | 50 KB | 75 KB | 100 KB |
| **Fonts** | 100 KB | 150 KB | 200 KB |
| **Per Image** | 100 KB | 200 KB | 500 KB |

## Resource Count Limits

Maximum number of requests per page:

| Resource Type | Target | Warning | Critical |
|---------------|--------|---------|----------|
| **Total Requests** | 50 | 75 | 100 |
| **JavaScript Files** | 10 | 15 | 20 |
| **CSS Files** | 3 | 5 | 8 |
| **Font Files** | 4 | 6 | 10 |
| **Third-Party** | 10 | 15 | 25 |

## Page-Specific Budgets

### Landing Page (/)

Optimized for conversion - strictest budgets:

- LCP: < 2.0s
- CLS: < 0.05
- Initial JS: < 80 KB
- Total Requests: < 30

### App Page (/app)

Allows more for functionality:

- LCP: < 2.5s
- CLS: < 0.1
- Initial JS: < 150 KB
- Total Requests: < 50

### Static Pages (/privacy, /terms, etc.)

Minimal resources needed:

- LCP: < 1.5s
- CLS: < 0.05
- Initial JS: < 50 KB
- Total Requests: < 20

## Optimization Strategies

### 1. Code Splitting

Heavy features are code-split and loaded on demand:

- Crypto libraries (`@noble/*`, `pqc-kyber`) - loaded when transfer starts
- QR code libraries - loaded when QR code is needed
- Email functionality - loaded when email transfer is selected

### 2. Image Optimization

- Use WebP/AVIF formats
- Implement lazy loading for below-the-fold images
- Set explicit width/height to prevent CLS
- Use appropriate sizes for different viewports

### 3. Font Loading

- Use `font-display: swap` for all fonts
- Preload critical fonts
- Subset fonts to reduce file size
- Use system fonts as fallbacks

### 4. Caching Strategy

- Static assets: 1 year cache (`immutable`)
- Fonts: 1 year cache
- Images: 1 day cache with stale-while-revalidate
- API responses: No cache

### 5. Critical Path Optimization

- Inline critical CSS
- Preconnect to critical origins
- Defer non-critical JavaScript
- Prioritize above-the-fold content

## Monitoring

### Automated Checks

Performance is monitored through:

1. **Build-time**: `npm run perf:bundle` - Bundle size checks
2. **CI/CD**: `npm run perf:ci` - Lighthouse CI
3. **Production**: Web Vitals tracking via analytics

### Manual Testing

Run performance tests locally:

```bash
# Bundle analysis
ANALYZE=true npm run build

# Lighthouse audit
npm run perf:lighthouse

# Full performance test
npm run perf:full
```

## Performance Budget Enforcement

### CI/CD Integration

The build will fail if:

1. Any Core Web Vital exceeds the "Critical" threshold
2. Bundle size exceeds 250 KB (JS) or 100 KB (CSS)
3. More than 100 total HTTP requests

### Pre-commit Checks

Before committing, consider:

1. Adding new dependencies - check bundle impact
2. Adding images - ensure optimization
3. Adding fonts - check total font weight

## Useful Commands

```bash
# Check bundle size
npm run perf:bundle

# Run Lighthouse CI
npm run perf:ci

# Analyze bundle composition
npm run build:analyze

# Check Web Vitals in production
npm run perf:vitals

# Full performance audit
npm run perf:full
```

## Related Files

- `lib/performance/` - Performance utilities
- `lib/performance/budget.ts` - Budget constants and checking
- `lib/performance/monitoring.ts` - Web Vitals tracking
- `scripts/check-bundle-size.js` - Bundle size checker
- `next.config.ts` - Build optimizations

## References

- [Web Vitals](https://web.dev/vitals/)
- [Core Web Vitals thresholds](https://web.dev/defining-core-web-vitals-thresholds/)
- [Performance budgets](https://web.dev/performance-budgets-101/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
