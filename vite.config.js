import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    proxy: {
      // Only used in local development
      // Production uses VITE_API_URL directly
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})