import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Kept separate from vite.config.js so the build config stays about the build.
 * Vitest prefers this file when both exist.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    // The form tests drive the real components, so they need a DOM.
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
    restoreMocks: true,
  },
});
