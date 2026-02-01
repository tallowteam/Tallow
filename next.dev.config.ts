import type { NextConfig } from "next";

/**
 * Development-optimized Next.js configuration
 * Focuses on stability, fast reloads, and reduced memory usage
 */
const devConfig: NextConfig = {
  // Disable Turbopack in development for stability
  // Webpack is more stable and has better error messages

  // Optimize development server
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
    ],
    // Reduce memory usage by disabling some optimizations in dev
    optimizeCss: false,
    optimizeServerReact: false,
  },

  // Webpack configuration for dev
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Development-specific webpack optimizations
      config.watchOptions = {
        // Use efficient file watching
        aggregateTimeout: 200,
        poll: false,
        ignored: [
          '**/node_modules',
          '**/.git',
          '**/.next',
          '**/build',
          '**/dist',
          '**/.planning',
          '**/.claude',
          '**/reports',
          '**/tests',
          '**/*.md',
          '**/*.log',
          '**/*.txt',
        ],
      };

      // Reduce memory usage in development
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
        minimize: false,
        usedExports: false,
      };

      // Faster source maps for development
      config.devtool = 'cheap-module-source-map';

      // Increase memory limit for webpack
      config.performance = {
        ...config.performance,
        hints: false,
        maxAssetSize: 10000000,
        maxEntrypointSize: 10000000,
      };
    }

    // Enable WebAssembly support (required for PQC)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // WASM file handling
    config.output.webassemblyModuleFilename =
      isServer ? './../static/wasm/[modulehash].wasm' : 'static/wasm/[modulehash].wasm';

    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    return config;
  },

  // Minimal image optimization in dev
  images: {
    unoptimized: true, // Faster in development
  },

  // Disable console removal in dev
  compiler: {
    removeConsole: false,
  },

  // Relaxed headers for development
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          // Relaxed CSP for development (allows HMR)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' ws: wss: http: https:",
              "media-src 'self' blob:",
              "object-src 'none'",
            ].join('; ')
          },
        ]
      }
    ];
  },

  // Output configuration
  output: 'standalone',

  // Page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Disable static optimization to prevent build timeouts
  staticPageGenerationTimeout: 120,
};

export default devConfig;
