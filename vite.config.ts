import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  plugins: [tailwindcss()],
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
  server: {
    port: 4301,
    proxy: {
      '/api': 'http://localhost:4300',
      '/health': 'http://localhost:4300',
      '/images': 'http://localhost:4300',
      '/ws': {
        target: 'ws://localhost:4300',
        ws: true,
      },
    },
  },
});
