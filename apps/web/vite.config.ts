import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';


export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/chat': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/sessions': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/messages': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/friends': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/upload': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});