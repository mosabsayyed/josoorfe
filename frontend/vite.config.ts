import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
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
      '/1': {
        target: 'https://betaBE.aitwintech.com',
        changeOrigin: true,
        secure: true,
        selfHandleResponse: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://betaBE.aitwintech.com');
            proxyReq.setHeader('Host', 'betaBE.aitwintech.com');
          });
          // Bypass Vite's response buffering for SSE responses from MCP router.
          // Without selfHandleResponse, Vite buffers the entire response before
          // sending to browser, causing response.text() to hang for ~50s on large payloads.
          proxy.on('proxyRes', (proxyRes, _req, res) => {
            const headers: Record<string, string | string[]> = {};
            for (const [key, value] of Object.entries(proxyRes.headers)) {
              if (value) headers[key] = value;
            }
            // Force content-type to text/plain so browser doesn't treat as SSE stream
            headers['content-type'] = 'text/plain; charset=utf-8';
            res.writeHead(proxyRes.statusCode || 200, headers);
            proxyRes.pipe(res);
          });
        },
      },
      '/2': {
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
      '/3': {
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
