import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tests/unit/**/*.spec.ts'],
    setupFiles: ['tests/setup.ts'],
  },
})
