import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  build: {
    minify: false,
    sourcemap: true
  },
  server: {
    port: 3006,
    host: '0.0.0.0',
    hmr: {
      host: 'dev.2tdata.com',
      protocol: 'wss'
    },
    allowedHosts: [
      'localhost',
      'dev.2tdata.com',
      'trunglq8.com',
      'www.trunglq8.com',
      '.2tdata.com',
      '.trunglq8.com'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3004',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3004',
        changeOrigin: true
      },
      '/logos': {
        target: 'http://localhost:3004',
        changeOrigin: true
      }
    }
  }
})