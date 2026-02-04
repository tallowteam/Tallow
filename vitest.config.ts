import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Use happy-dom for React component/context tests
    environment: 'happy-dom',
    testTimeout: 30000, // 30 seconds for crypto operations
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/integration/**/*.test.ts',
      'tests/integration/**/*.test.tsx',
      'components/**/*.test.tsx',
    ],
    setupFiles: ['tests/unit/setup.ts', 'tests/utils/component-setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: [
        'lib/crypto/**',
        'lib/api/**',
        'lib/utils/**',
        'lib/validation/**',
        'lib/middleware/**',
        'lib/security/**',
        'lib/stores/**',
        'app/api/**',
        'components/**',
      ],
      exclude: [
        'lib/**/*.d.ts',
        'lib/**/types.ts',
        'tests/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/__mocks__/**',
        '**/node_modules/**',
        '**/*.config.*',
        '**/coverage/**',
        '**/.next/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      // Report formats
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/components': path.resolve(__dirname, 'components'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/app': path.resolve(__dirname, 'app'),
      '@/tests': path.resolve(__dirname, 'tests'),
      'pqc-kyber': path.resolve(__dirname, 'tests/unit/__mocks__/pqc-kyber.ts'),
    },
  },
  css: {
    modules: {
      // Return class names as-is for easier testing
      generateScopedName: '[local]',
    },
  },
});
