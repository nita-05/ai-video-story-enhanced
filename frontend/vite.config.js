

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5000',
      '/upload': 'http://localhost:5000',
      '/global-search': 'http://localhost:5000',
      '/process': 'http://localhost:5000',
      '/results': 'http://localhost:5000',
      '/my': 'http://localhost:5000',
      '/analyze-emotions': 'http://localhost:5000',
      '/generate-story': 'http://localhost:5000',
      '/video': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
      '/debug': 'http://localhost:5000',
      '/proxy-avatar': 'http://localhost:5000',
      '/render-story': 'http://localhost:5000',
      '/thumbnail': 'http://localhost:5000',
      '/renders': 'http://localhost:5000',
      '/collective-generate-story': 'http://localhost:5000',
      '/render-collective-story': 'http://localhost:5000',
      '/api': 'http://localhost:5000'
    }
  }
})
