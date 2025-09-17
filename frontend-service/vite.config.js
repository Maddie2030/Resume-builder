// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://api-gateway:8000',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api\/v1/, ''),
      },
    },
  },
});