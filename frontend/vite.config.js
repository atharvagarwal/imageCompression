// vite.config.js
import { defineConfig } from 'vite';
import { createProxy } from 'vite-plugin-proxy';

export default defineConfig({
  plugins: [createProxy({
    // Proxy configuration
    '/api': {
      target: 'https://image-compression-l7vd.vercel.app',
      changeOrigin: true,
      secure: false, // If the target is an HTTPS URL
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  })],
});

