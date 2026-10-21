import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['.task24-tests/products/**/*.spec.js'],
    environment: 'node',
  },
});