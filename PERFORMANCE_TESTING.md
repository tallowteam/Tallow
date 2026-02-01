# Performance Testing Guide

Comprehensive automated performance testing infrastructure for the Tallow application. This guide covers setup, usage, and CI/CD integration for performance monitoring.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Test Suites](#test-suites)
- [Performance Budgets](#performance-budgets)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The Tallow performance testing infrastructure provides automated tools to monitor and enforce performance standards across:

- **Bundle Size Analysis**: JavaScript, CSS, fonts, and total build size
- **Memory Profiling**: Runtime memory usage and leak detection
- **Transfer Speed Benchmarks**: File transfer performance testing
- **Core Web Vitals**: LCP, FID, CLS, FCP, TTFB metrics
- **Lighthouse CI**: Automated performance, accessibility, and SEO audits

## Quick Start

### Installation

First, install the required dependencies:

```bash
npm install
```

This will install Lighthouse CI and other performance testing tools.

### Running Tests

#### 1. Bundle Size Analysis

Analyze JavaScript, CSS, and asset bundle sizes:

```bash
npm run perf:bundle
```

This will:
- Check total JavaScript bundle size (< 800KB)
- Verify main application bundle (< 150KB)
- Validate CSS size (< 100KB)
- Check font assets (< 200KB)
- Calculate total build size (< 2MB)

#### 2. Memory Profiling

Profile memory usage during runtime:

```bash
npm run perf:memory
```

This will:
- Start the Next.js server
- Monitor memory usage over 10 seconds
- Report average and peak memory consumption
- Verify against thresholds (idle < 100MB, peak < 500MB)

#### 3. Transfer Speed Benchmark

Benchmark file transfer operations:

```bash
npm run perf:transfer
```

This will:
- Simulate file transfers of various sizes (1MB, 10MB, 50MB, 100MB)
- Measure processing speed
- Calculate MB/s throughput
- Verify minimum speed requirements (> 1 MB/s)

#### 4. Core Web Vitals

Estimate Core Web Vitals metrics:

```bash
npm run perf:vitals
```

This provides estimated metrics. For accurate measurements, use Lighthouse CI (see below).

#### 5. Full Test Suite

Run all performance tests (except memory profiling):

```bash
npm run perf:full
```

This executes:
- Bundle size analysis
- Transfer speed benchmarks
- Web Vitals estimation

**Note**: Memory profiling is excluded from the full suite due to execution time. Run it separately when needed.

### Lighthouse CI

#### Local Lighthouse Audit

Run a single Lighthouse audit against your local server:

```bash
# Terminal 1: Start the server
npm run build
npm run start

# Terminal 2: Run Lighthouse
npm run perf:lighthouse
```

This will:
- Audit http://localhost:3000
- Generate an HTML report (lighthouse-report.html)
- Automatically open the report in your browser

#### Automated Lighthouse CI

Run comprehensive Lighthouse CI audits:

```bash
# Build and start server (if not already running)
npm run build
npm run start

# In another terminal, run Lighthouse CI
npm run perf:ci
```

This will:
- Audit multiple pages (home, app, how-it-works)
- Run 3 times per page for statistical reliability
- Generate reports in `./lighthouse-results/`
- Enforce performance budgets
- Fail if any budget is exceeded

## Test Suites

### 1. Bundle Size Analysis

**Purpose**: Ensure bundle sizes remain within acceptable limits to maintain fast load times.

**Thresholds**:
```javascript
{
  mainBundle: 150 KB,    // Main application bundle
  totalJS: 800 KB,       // All JavaScript
  totalCSS: 100 KB,      // All stylesheets
  totalFonts: 200 KB,    // Font files
  totalSize: 2048 KB     // Complete build (2MB)
}
```

**What it checks**:
- Next.js build output size
- Code splitting effectiveness
- Asset optimization
- Vendor bundle size

**Example output**:
```
═══════════════════════════════════════════════════════════
  Bundle Size Analysis
═══════════════════════════════════════════════════════════

✓ Total JavaScript: 654.32 KB (threshold: 800 KB)
✓ Main Application Bundle: 124.87 KB (threshold: 150 KB)
✓ Total CSS: 48.21 KB (threshold: 100 KB)
✓ Total Fonts: 156.44 KB (threshold: 200 KB)
✓ Total Build Size: 1.82 MB (threshold: 2.00 MB)

Score: 5/5 (100%)
```

### 2. Memory Profiling

**Purpose**: Monitor runtime memory usage and detect potential memory leaks.

**Thresholds**:
```javascript
{
  idle: 100 MB,    // Average memory in idle state
  active: 250 MB,  // Memory during active usage
  peak: 500 MB     // Maximum acceptable peak
}
```

**What it checks**:
- Resident Set Size (RSS)
- Heap memory usage
- Memory growth over time
- Peak memory consumption

**Example output**:
```
═══════════════════════════════════════════════════════════
  Memory Profiling
═══════════════════════════════════════════════════════════

Server ready. Collecting memory samples...

Average RSS: 82.45 MB
Average Heap: 45.67 MB
Peak RSS: 124.89 MB
Peak Heap: 78.32 MB

✓ Average memory: PASS
✓ Peak memory: PASS
```

### 3. Transfer Speed Benchmark

**Purpose**: Benchmark file transfer and encryption operations.

**Thresholds**:
```javascript
{
  minSpeed: 1 MB/s,     // Minimum acceptable
  targetSpeed: 5 MB/s   // Target performance
}
```

**What it checks**:
- Buffer allocation performance
- Data processing speed
- Encryption overhead (simulated)
- Throughput consistency

**Example output**:
```
═══════════════════════════════════════════════════════════
  Transfer Speed Benchmark
═══════════════════════════════════════════════════════════

✓ 1 MB: 45 ms (22.22 MB/s)
✓ 10 MB: 180 ms (55.56 MB/s)
✓ 50 MB: 850 ms (58.82 MB/s)
✓ 100 MB: 1650 ms (60.61 MB/s)

Average speed: 49.30 MB/s (target: 5 MB/s)
```

### 4. Core Web Vitals

**Purpose**: Measure user experience metrics based on Google's Core Web Vitals.

**Thresholds**:
```javascript
{
  LCP: 2500 ms,  // Largest Contentful Paint
  FID: 100 ms,   // First Input Delay
  CLS: 0.1,      // Cumulative Layout Shift
  FCP: 2000 ms,  // First Contentful Paint
  TTFB: 600 ms   // Time to First Byte
}
```

**What it checks**:
- Loading performance (LCP, FCP)
- Interactivity (FID, TTI)
- Visual stability (CLS)
- Server response time (TTFB)

**Note**: This test provides estimates. Use Lighthouse CI for accurate measurements.

### 5. Lighthouse CI Audits

**Purpose**: Comprehensive automated audits for performance, accessibility, best practices, and SEO.

**Performance Budgets**:

| Category | Minimum Score |
|----------|---------------|
| Performance | 90 |
| Accessibility | 95 |
| Best Practices | 90 |
| SEO | 90 |

**Metric Budgets**:

| Metric | Budget | Severity |
|--------|--------|----------|
| First Contentful Paint | < 2.0s | warn |
| Largest Contentful Paint | < 2.5s | error |
| Speed Index | < 3.0s | warn |
| Total Blocking Time | < 300ms | warn |
| Cumulative Layout Shift | < 0.1 | error |
| Main Bundle Size | < 1MB | error |

**Audited Pages**:
- Home page (`/`)
- App page (`/app`)
- How it Works (`/how-it-works`)

## Performance Budgets

### Bundle Size Budgets

```javascript
{
  "resource-summary:script:size": 1024000,      // 1MB total JS
  "resource-summary:stylesheet:size": 102400,   // 100KB total CSS
  "resource-summary:font:size": 204800,         // 200KB total fonts
  "resource-summary:image:size": 512000,        // 500KB total images
  "resource-summary:total:size": 2048000        // 2MB total
}
```

### Performance Metrics Budgets

```javascript
{
  "first-contentful-paint": 2000,      // 2 seconds
  "largest-contentful-paint": 2500,    // 2.5 seconds
  "interactive": 3500,                 // 3.5 seconds
  "speed-index": 3000,                 // 3 seconds
  "cumulative-layout-shift": 0.1,      // CLS score
  "max-potential-fid": 100,            // 100ms
  "total-blocking-time": 300           // 300ms
}
```

### Why These Budgets?

These budgets are based on:

1. **Google's Core Web Vitals**: Industry standard thresholds
2. **Real-world Performance**: 75th percentile targets
3. **User Experience**: Fast loading, smooth interaction
4. **Network Conditions**: Works well on 3G/4G connections
5. **Device Capability**: Performs on mid-range devices

## CI/CD Integration

### GitHub Actions

Add a performance testing job to your CI/CD pipeline:

```yaml
# .github/workflows/performance.yml
name: Performance Testing

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master, develop]

jobs:
  performance:
    name: Performance Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Run bundle size checks
        run: npm run perf:bundle

      - name: Run transfer benchmarks
        run: npm run perf:transfer

      - name: Start server
        run: npm run start &
        env:
          CI: true

      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 60000

      - name: Run Lighthouse CI
        run: npm run perf:ci

      - name: Upload Lighthouse results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-results
          path: lighthouse-results/
          retention-days: 30

      - name: Upload performance report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: performance-report
          path: performance-report.json
          retention-days: 30
```

### Integration with Existing CI

Add performance tests to your existing `.github/workflows/ci.yml`:

```yaml
# Add to existing jobs
performance:
  name: Performance Tests
  runs-on: ubuntu-latest
  timeout-minutes: 30
  needs: [lint, test-unit]

  steps:
    # ... (see above)
```

### Performance Regression Detection

Track performance over time by comparing reports:

```bash
# Save baseline
npm run perf:full
cp performance-report.json performance-baseline.json

# After changes, compare
npm run perf:full
node scripts/compare-performance.js performance-baseline.json performance-report.json
```

## Troubleshooting

### Common Issues

#### 1. "Build not found" Error

**Problem**: Running tests before building the application.

**Solution**:
```bash
npm run build
npm run perf:bundle
```

#### 2. Lighthouse Timeout

**Problem**: Server takes too long to start.

**Solution**:
```bash
# Increase timeout in lighthouserc.js
startServerReadyTimeout: 60000  // 60 seconds
```

#### 3. Memory Test Fails to Start

**Problem**: Port 3000 already in use.

**Solution**:
```bash
# Kill existing process
npx kill-port 3000

# Or change port in next.config.ts
```

#### 4. Bundle Size Exceeds Limits

**Problem**: Bundle too large after adding dependencies.

**Solutions**:

1. **Analyze the bundle**:
```bash
npm run build:analyze
```

2. **Use dynamic imports**:
```javascript
const HeavyComponent = dynamic(() => import('./HeavyComponent'))
```

3. **Check for duplicate dependencies**:
```bash
npm dedupe
```

4. **Review package sizes**:
```bash
npx package-size <package-name>
```

#### 5. Web Vitals Scores Low

**Problem**: Poor Lighthouse scores.

**Common causes and fixes**:

1. **Large LCP**:
   - Optimize hero images
   - Use responsive images
   - Implement lazy loading

2. **High TBT**:
   - Reduce JavaScript execution time
   - Code split large bundles
   - Defer non-critical scripts

3. **Poor CLS**:
   - Set width/height on images
   - Reserve space for dynamic content
   - Avoid inserting content above existing content

4. **Slow FCP**:
   - Minimize render-blocking resources
   - Inline critical CSS
   - Preload key resources

## Best Practices

### 1. Run Tests Regularly

- **Before commits**: Run `npm run perf:bundle`
- **Before PRs**: Run `npm run perf:full`
- **After major changes**: Run full Lighthouse CI
- **In CI/CD**: Automate all tests

### 2. Monitor Trends

Track performance metrics over time:

```bash
# Save reports with timestamps
npm run perf:full
cp performance-report.json reports/perf-$(date +%Y%m%d).json
```

### 3. Set Realistic Budgets

- Start with current performance
- Gradually tighten budgets
- Account for feature additions
- Review budgets quarterly

### 4. Optimize Incrementally

- Focus on biggest impacts first
- Test changes in isolation
- Document optimizations
- Share knowledge with team

### 5. Test on Real Devices

While automated tests are great, also test on:
- Real mobile devices
- Different network conditions
- Various browsers
- Different geographic locations

### 6. Performance Checklist

Before releasing features:

- [ ] Bundle size within limits
- [ ] No memory leaks detected
- [ ] Transfer speeds acceptable
- [ ] Lighthouse scores > 90
- [ ] Core Web Vitals pass
- [ ] Tested on 3G network
- [ ] Tested on low-end device
- [ ] No console errors/warnings

## Continuous Improvement

### Weekly Performance Review

1. Review performance reports
2. Identify trends and regressions
3. Update budgets if needed
4. Plan optimization work

### Monthly Performance Sprint

Dedicate time to:
- Deep performance profiling
- Bundle optimization
- Code splitting improvements
- Asset optimization
- Dependency updates

### Quarterly Performance Audit

- Full Lighthouse audit
- Real User Monitoring (RUM) analysis
- Competitor benchmarking
- Budget adjustment
- Strategy planning

## Resources

### Official Documentation

- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Core Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web.dev Performance](https://web.dev/performance/)

### Tools

- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

### Metrics Reference

- **FCP (First Contentful Paint)**: When first content appears (< 2s)
- **LCP (Largest Contentful Paint)**: When main content loads (< 2.5s)
- **FID (First Input Delay)**: Time to first interaction (< 100ms)
- **TTI (Time to Interactive)**: Fully interactive time (< 3.5s)
- **TBT (Total Blocking Time)**: Sum of blocking time (< 300ms)
- **CLS (Cumulative Layout Shift)**: Visual stability (< 0.1)
- **TTFB (Time to First Byte)**: Server response time (< 600ms)

## Support

For issues or questions:

1. Check this documentation
2. Review GitHub issues
3. Check Lighthouse documentation
4. Open a new issue with:
   - Test output
   - Environment details
   - Steps to reproduce

---

**Last Updated**: 2026-01-26

**Maintained by**: Tallow Development Team
