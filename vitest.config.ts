import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
    exclude: [
      'node_modules/**',
      'dist/**',
      'src/tests/e2e/**',
      // These files use a custom TestSuite runner, not Vitest describe/it blocks
      'src/hooks/admin/__tests__/**',
      'src/components/__tests__/**',
      'src/components/admin/forms/__tests__/**',
      // Requires jsdom environment + React — not configured in this vitest setup
      'src/components/admin/homepage-builder/__tests__/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
