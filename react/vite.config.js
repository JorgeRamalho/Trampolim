import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  server: { port: 3000, proxy: { '/api': 'http://localhost:4000' } },
  build: { outDir: 'dist', sourcemap: false },
});
