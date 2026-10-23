import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    setupFiles: ['./test/setup-env.ts'],
    include: ['test/**/*.integration-spec.ts'],
    testTimeout: 15000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
