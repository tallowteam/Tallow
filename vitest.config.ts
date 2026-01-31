import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Use happy-dom for React component/context tests
    environment: 'happy-dom',
    testTimeout: 30000, // 30 seconds for crypto operations
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx', 'tests/integration/**/*.test.ts', 'components/**/*.test.tsx'],
    setupFiles: ['tests/unit/setup.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'lib/crypto/**',
        'lib/api/**',
        'lib/utils/**',
        'lib/validation/**',
        'lib/middleware/**',
        'lib/security/**',
        'app/api/**',
      ],
      exclude: [
        'lib/**/*.d.ts',
        'lib/**/types.ts',
        'tests/**',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'pqc-kyber': path.resolve(__dirname, 'tests/unit/__mocks__/pqc-kyber.ts'),
    },
  },
});
