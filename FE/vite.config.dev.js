import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100
    },
    hmr: {
      port: 5173
    },
    // Allow access from different localhost subdomains
    allowedHosts: [
      'localhost',
      'site1.localhost',
      'site2.localhost', 
      'techhub.localhost',
      'finance.localhost',
      '.localhost'
    ],
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/logos': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
