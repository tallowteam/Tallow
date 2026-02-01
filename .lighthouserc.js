/**
 * Lighthouse CI Configuration
 * Continuous performance monitoring and budgeting
 *
 * Usage:
 *   npx lhci autorun
 */

module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/', 'http://localhost:3000/app'],
      numberOfRuns: 3,
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      settings: {
        chromeFlags: '--no-sandbox --disable-gpu',
        // Only test performance, we handle other audits separately
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance Metrics
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 1.0 }],
        'categories:best-practices': ['error', { minScore: 1.0 }],
        'categories:seo': ['error', { minScore: 1.0 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 2000 }],

        // Resource Metrics
        'total-byte-weight': ['error', { maxNumericValue: 350000 }], // 350KB
        'uses-optimized-images': 'error',
        'modern-image-formats': 'warn',
        'uses-text-compression': 'error',
        'uses-responsive-images': 'warn',

        // JavaScript
        'unminified-javascript': 'error',
        'unused-javascript': ['warn', { maxNumericValue: 50000 }], // 50KB
        'bootup-time': ['error', { maxNumericValue: 2000 }], // 2s
        'mainthread-work-breakdown': ['error', { maxNumericValue: 2000 }],

        // CSS
        'unminified-css': 'error',
        'unused-css-rules': 'warn',

        // Fonts
        'font-display': 'error',
        'preload-fonts': 'warn',

        // Network
        'uses-http2': 'error',
        'uses-long-cache-ttl': 'warn',
        'uses-rel-preconnect': 'warn',

        // Rendering
        'offscreen-images': 'warn',
        'render-blocking-resources': 'warn',
        'non-composited-animations': 'warn',

        // Accessibility (maintain 100)
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'button-name': 'error',
        'link-name': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-viewport': 'error',

        // Best Practices (maintain 100)
        'no-vulnerable-libraries': 'error',
        'geolocation-on-start': 'error',
        'notification-on-start': 'error',
        'deprecations': 'error',
        'errors-in-console': 'warn',
        'no-document-write': 'error',

        // SEO (maintain 100)
        'meta-description': 'error',
        'http-status-code': 'error',
        'crawlable-anchors': 'error',
        'robots-txt': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
      // Or configure for permanent storage:
      // target: 'filesystem',
      // outputDir: './lighthouse-reports',
    },
    server: {
      // Storage for Lighthouse CI Server (optional)
      // url: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN,
    },
  },
};
