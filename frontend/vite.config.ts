import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
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
      '/api/summary-stream': {
        target: 'https://betaBE.aitwintech.com',
        changeOrigin: true,
        secure: true,
      },
      '/api': {
        target: 'https://betaBE.aitwintech.com',
        changeOrigin: true,
        secure: true,
      },
      '/2': {
        target: 'https://betaBE.aitwintech.com',
        changeOrigin: true,
        secure: true,
      },
      '/3': {
        target: 'https://betaBE.aitwintech.com',
        changeOrigin: true,
        secure: true,
      },
      '/4': {
        target: 'https://betaBE.aitwintech.com',
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.setHeader('Origin', 'https://betaBE.aitwintech.com');
            proxyReq.setHeader('Host', 'betaBE.aitwintech.com');
          });
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react-map-gl/mapbox', 'mapbox-gl'],
  },
  build: {
    outDir: 'build',
  },
})
