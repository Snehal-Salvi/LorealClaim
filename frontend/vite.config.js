import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In development, /api calls are forwarded to the NestJS backend,
// so the browser talks to one origin and no CORS setup is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: false,
  },
});
