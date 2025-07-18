import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
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
      '.trunglq8.com',
      'site1.localhost',
      'site2.localhost',
      'affiliate1.localhost',
      'affiliate2.localhost',
      'partner.localhost'
    ],
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
