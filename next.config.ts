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
              "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
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

  // Simplified webpack config for stability
  webpack: (config, { isServer }) => {
    // Enable WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // WASM file output path
    config.output.webassemblyModuleFilename =
      isServer ? './../static/wasm/[modulehash].wasm' : 'static/wasm/[modulehash].wasm';

    // Handle WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

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
      // Date utilities
      'date-fns',
      // React Email components
      '@react-email/components',
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
