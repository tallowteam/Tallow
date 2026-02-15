import type { NextConfig } from "next";

// Bundle analyzer (only in analyze mode)
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config: NextConfig) => config;

const enforceHttpsUpgradeCsp =
  process.env.NODE_ENV === 'production' && process.env.TALLOW_ALLOW_HTTP !== '1';

const nextConfig: NextConfig = {
  // TypeScript strict mode enforced - no build errors allowed
  typescript: {
    ignoreBuildErrors: false,
  },

  // Use webpack for build (not Turbopack) due to better compatibility
  turbopack: {
    root: process.cwd(),
  },

  // Development server configuration to prevent 408 timeouts
  ...(process.env.NODE_ENV === 'development' && {
    experimental: {
      proxyTimeout: 300000, // 5 minutes
    },
  }),

  // Server-side external packages (Node.js-only modules)
  serverExternalPackages: ['pqc-kyber', 'prom-client', '@aws-sdk/client-s3', '@aws-sdk/lib-storage'],

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
              // NOTE: 'unsafe-inline' should be replaced with nonce-based CSP in production
              // Next.js requires inline scripts for hydration - implement nonce system for stronger security
              process.env.NODE_ENV === 'development'
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' wss: ws: https:",
              "media-src 'self' blob:",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              enforceHttpsUpgradeCsp ? "upgrade-insecure-requests" : '',
              enforceHttpsUpgradeCsp ? "block-all-mixed-content" : ''
            ].filter(Boolean).join('; ')
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
        // Cache fonts
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ]
      },
      {
        // Cache images
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          }
        ]
      },
      {
        // Short cache for API responses
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          }
        ]
      }
    ];
  },

  // Webpack configuration for performance
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Enable WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // WASM file output path
    if (config.output) {
      config.output.webassemblyModuleFilename =
        isServer ? './../static/wasm/[modulehash].wasm' : 'static/wasm/[modulehash].wasm';
    }

    // Handle WASM files
    config.module = config.module || { rules: [] };
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Optimization for production
    if (!isServer && process.env.NODE_ENV === 'production') {
      config.optimization = {
        ...config.optimization,
        // Enable module concatenation
        concatenateModules: true,
        // Minimize
        minimize: true,
        // Split chunks for better caching
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000, // ~238KB max chunk size
          cacheGroups: {
            // Separate vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // Crypto libraries (heavy, load separately)
            crypto: {
              test: /[\\/]node_modules[\\/](@noble|pqc-kyber|hash-wasm)[\\/]/,
              name: 'crypto',
              chunks: 'all',
              priority: 20,
            },
            // UI components
            ui: {
              test: /[\\/]components[\\/](ui|layout)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 15,
            },
            // Common shared code
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },

  // Image optimization
  images: {
    // Modern formats for smaller sizes
    formats: ['image/avif', 'image/webp'],
    // Longer cache for optimized images
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Icon sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Remote patterns (add your CDN here)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.tallow.app',
      },
    ],
    // Disable blur placeholder for faster load
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compiler optimizations (SWC)
  compiler: {
    // Remove console.log in production (keep error and warn)
    removeConsole: process.env['NODE_ENV'] === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    // Enable React optimizations
    reactRemoveProperties: process.env['NODE_ENV'] === 'production',
  },

  // Keep pages in memory longer for dev
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },

  // Reduce logging noise
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  // Experimental performance features
  experimental: {
    // Optimize package imports (tree-shaking)
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
      '@noble/post-quantum',
      // Web vitals
      'web-vitals',
      // Feature flags
      'launchdarkly-react-client-sdk',
      // Zustand
      'zustand',
    ],
    // CSS optimization
    optimizeCss: true,
    // Server actions optimization
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Increase timeouts for development
    ...(process.env.NODE_ENV === 'development' && {
      proxyTimeout: 300000,
    }),
  },

  // Disable production source maps for smaller builds
  productionBrowserSourceMaps: false,

  // Enable compression
  compress: true,

  // Generate ETags for caching
  generateEtags: true,

  // Remove X-Powered-By header
  poweredByHeader: false,

  // HTTP Agent for connection pooling
  httpAgentOptions: {
    keepAlive: true,
  },

  // Strict mode for better React practices
  reactStrictMode: true,

  // Output configuration
  output: 'standalone',
};

export default withBundleAnalyzer(nextConfig);
