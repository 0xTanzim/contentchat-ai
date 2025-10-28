import webExtension from '@samrum/vite-plugin-web-extension';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

// Read manifest file
const manifest = JSON.parse(readFileSync('./public/manifest.json', 'utf-8'));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    webExtension({
      manifest,
      additionalInputs: {
        html: ['src/sidepanel/index.html'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['clsx', 'tailwind-merge', 'lucide-react'],
        },
      },
    },
  },
});
