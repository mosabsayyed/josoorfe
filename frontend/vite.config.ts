import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api/neo4j': {
        target: 'https://betaBE.aitwintech.com',
        changeOrigin: true,
        secure: true,
      },
      '/api/graph': {
        target: 'https://betaBE.aitwintech.com',
        changeOrigin: true,
        secure: true,
      },
      '/api/dashboard': {
        target: 'https://betaBE.aitwintech.com',
        changeOrigin: true,
        secure: true,
      },
      '/api/business-chain': {
        target: 'https://betaBE.aitwintech.com',
        changeOrigin: true,
        secure: true,
      },
      '/api/control-tower': {
        target: 'https://betaBE.aitwintech.com',
        changeOrigin: true,
        secure: true,
      },
      '/api/v1': {
        target: 'https://betaBE.aitwintech.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'build',
  },
})
