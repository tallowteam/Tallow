import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use webpack for build (not Turbopack) due to better compatibility
  turbopack: {
    root: process.cwd(),
  },

  // Development server configuration to prevent 408 timeouts
  ...(process.env.NODE_ENV === 'development' && {
    // Increase timeout for dev server
    experimental: {
      // Prevent dev server timeouts
      proxyTimeout: 300000, // 5 minutes
    },
  }),

  // Server-side external packages (Node.js-only modules)
  serverExternalPackages: ['pqc-kyber', 'prom-client'],

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' wss: ws: https:",
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
              "block-all-mixed-content"
            ].join('; ')
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          },
          // Cache control for static assets
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ]
      },
      {
        // Aggressive caching for static assets
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ]
      },
      {
        // Cache webpack bundles
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ]
      },
      {
        // Cache CSS files
        source: '/:path*.css',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ]
      },
      {
        // Cache JS files
        source: '/:path*.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ]
      }
    ];
  },

  // Enable WebAssembly support for pqc-kyber
  webpack: (config, { isServer, dev }) => {
    // Optimize webpack for faster builds
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
      // Enable top-level await for proper WASM initialization
      topLevelAwait: true,
    };

    // Set output target to support async/await
    // This ensures the generated code is compatible with modern browsers
    if (!isServer) {
      config.target = 'web';
      config.output.environment = {
        ...config.output.environment,
        asyncFunction: true,
        const: true,
        arrowFunction: true,
        forOf: true,
        destructuring: true,
        module: true,
        dynamicImport: true,
      };
    }

    // Development-specific optimizations
    if (dev) {
      // Increase cache for better performance
      config.cache = {
        type: 'filesystem',
        compression: 'gzip',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        allowCollectingMemory: true,
        buildDependencies: {
          config: [__filename],
        },
      };

      // Optimize dev server performance
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
        // Reduce overhead
        usedExports: false,
        sideEffects: false,
      };

      // Configure dev server
      config.infrastructureLogging = {
        level: 'error',
        debug: false,
      };

      // Optimize module resolution for faster builds
      config.resolve = {
        ...config.resolve,
        // Cache module resolution
        unsafeCache: true,
        // Reduce resolution attempts
        symlinks: false,
      };

      // Increase parallelism for faster builds
      if (!isServer) {
        config.parallelism = 4;
      }
    } else {
      // Production cache configuration
      config.cache = {
        type: 'filesystem',
        compression: 'gzip',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      };

      // Optimize production builds with better chunk splitting
      config.optimization = {
        ...config.optimization,
        minimize: true,
        // Module concatenation (scope hoisting)
        concatenateModules: true,
        // Remove empty chunks
        removeEmptyChunks: true,
        // Merge duplicate chunks
        mergeDuplicateChunks: true,
        // Tree shaking
        usedExports: true,
        sideEffects: true,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            // Large vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
              minChunks: 1,
            },
            // Common components
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Fix for WASM modules - use proper paths and async handling
    config.output.webassemblyModuleFilename =
      isServer ? './../static/wasm/[modulehash].wasm' : 'static/wasm/[modulehash].wasm';

    // Ensure WASM files are handled with asyncWebAssembly
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Bundle analyzer (optional - enable with ANALYZE=true)
    if (process.env['ANALYZE'] === 'true') {
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')({
        enabled: true,
      });
      config.plugins.push(new BundleAnalyzerPlugin());
    }

    return config;
  },

  // Image optimization (even though we use mostly SVGs)
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env['NODE_ENV'] === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Suppress non-essential warnings in development
  onDemandEntries: {
    // Keep pages in memory longer to reduce HMR noise
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },

  // Reduce logging noise
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      // Icons - ~45KB if not tree-shaken
      'lucide-react',
      // Animation library - ~45KB if not tree-shaken
      'framer-motion',
      // Date utilities - tree-shake to only used functions
      'date-fns',
      // Radix UI components
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-switch',
      '@radix-ui/react-slider',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      '@radix-ui/react-avatar',
      '@radix-ui/react-separator',
      // React Email components
      '@react-email/components',
      // Class utilities
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      // Gesture library
      '@use-gesture/react',
      // Search library
      'fuse.js',
      // QR code
      'qrcode',
      'jsqr',
      // Crypto utilities
      '@noble/hashes',
      '@noble/curves',
      '@noble/ciphers',
      // Web vitals
      'web-vitals',
      // Theme
      'next-themes',
      // Toast notifications
      'sonner',
      // Feature flags
      'launchdarkly-react-client-sdk',
    ],
    // Optimize CSS loading
    optimizeCss: true,
    // Increase timeouts for development
    ...(process.env.NODE_ENV === 'development' && {
      proxyTimeout: 300000, // 5 minutes
    }),
  },

  // Production source maps for debugging (smaller size)
  productionBrowserSourceMaps: false,

  // Compression
  compress: true,

  // Generate ETags
  generateEtags: true,

  // Power-by header
  poweredByHeader: false,

  // HTTP Agent Options to prevent timeouts
  httpAgentOptions: {
    keepAlive: true,
  },
};

export default nextConfig;
