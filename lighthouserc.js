/**
 * Lighthouse CI Configuration
 * Automated performance, accessibility, and SEO audits
 *
 * Usage:
 * - Development: npm run perf:lighthouse
 * - CI/CD: npm run perf:ci
 *
 * @see https://github.com/GoogleChrome/lighthouse-ci
 */

module.exports = {
  ci: {
    collect: {
      // URL patterns to audit
      url: [
        'http://localhost:3000',
        'http://localhost:3000/app',
        'http://localhost:3000/how-it-works',
      ],
      numberOfRuns: 3,
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      settings: {
        // Lighthouse settings
        preset: 'desktop',
        throttlingMethod: 'simulate',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
        formFactor: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },

    assert: {
      // Performance budgets - must meet these thresholds
      assertions: {
        // Core Web Vitals
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Specific performance metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interactive': ['warn', { maxNumericValue: 3500 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'max-potential-fid': ['warn', { maxNumericValue: 100 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 1024000 }], // 1MB
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 102400 }], // 100KB
        'resource-summary:font:size': ['warn', { maxNumericValue: 204800 }], // 200KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 512000 }], // 500KB
        'resource-summary:total:size': ['warn', { maxNumericValue: 2048000 }], // 2MB

        // Best practices
        'uses-responsive-images': 'warn',
        'offscreen-images': 'warn',
        'modern-image-formats': 'warn',
        'uses-optimized-images': 'warn',
        'uses-text-compression': 'error',
        'uses-long-cache-ttl': 'warn',
        'efficient-animated-content': 'warn',
        'unused-javascript': 'warn',
        'unused-css-rules': 'warn',
        'render-blocking-resources': 'warn',

        // Accessibility
        'color-contrast': 'error',
        'heading-order': 'warn',
        'label': 'error',
        'button-name': 'error',
        'image-alt': 'error',
        'link-name': 'error',
        'html-has-lang': 'error',
        'meta-viewport': 'error',

        // PWA (if applicable)
        'viewport': 'error',
        'installable-manifest': 'off', // Optional for now
        'service-worker': 'off', // Optional for now

        // Security
        'is-on-https': 'off', // Disabled for local testing
      },
    },

    upload: {
      // Storage options for CI results
      target: 'filesystem',
      outputDir: './lighthouse-results',
      reportFilenamePattern: 'lighthouse-%%PATHNAME%%-%%DATETIME%%.%%EXTENSION%%',
    },

    server: {
      // Optional: Use if you need a custom server config
      port: 9009,
      storage: {
        storageMethod: 'filesystem',
        sqlDatabasePath: './lighthouse-results/lhci.db',
      },
    },
  },
};
