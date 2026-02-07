/**
 * Vitest Configuration
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Limit to security + cards tests for now; other suites rely on external services/fixtures not present in this repo state.
    include: ['tests/webhook-security.test.ts', 'tests/cards*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'dist/**'],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});

