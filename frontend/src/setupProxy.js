/******************************************************************************
 * JOSOOR Frontend Proxy Configuration
 * Backend: https://betaBE.aitwintech.com (SSL via Caddy)
 * 
 * ROUTING ORDER MATTERS:
 * - Specific routes (/api/neo4j, /api/graph, etc.) MUST come BEFORE generic /api
 * - All routes proxy to the same domain but preserve the /api/* path structure
 *****************************************************************************/

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Graph Server routes - must be defined BEFORE generic /api
  app.use('/api/neo4j', createProxyMiddleware({ 
    target: 'https://betaBE.aitwintech.com', 
    changeOrigin: true,
    secure: true
  }));
  
  app.use('/api/graph', createProxyMiddleware({ 
    target: 'https://betaBE.aitwintech.com', 
    changeOrigin: true,
    secure: true
  }));
  
  app.use('/api/business-chain', createProxyMiddleware({ 
    target: 'https://betaBE.aitwintech.com', 
    changeOrigin: true,
    secure: true
  }));
  
  app.use('/api/dependency', createProxyMiddleware({ 
    target: 'https://betaBE.aitwintech.com', 
    changeOrigin: true,
    secure: true
  }));
  
  app.use('/api/domain-graph', createProxyMiddleware({ 
    target: 'https://betaBE.aitwintech.com', 
    changeOrigin: true,
    secure: true
  }));
  
  app.use('/api/summary-stream', createProxyMiddleware({ 
    target: 'https://betaBE.aitwintech.com', 
    changeOrigin: true,
    secure: true
  }));

  // Backend routes - catches all remaining /api/* including /api/v1/chat, /api/v1/auth, etc.
  app.use('/api', createProxyMiddleware({ 
    target: 'https://betaBE.aitwintech.com', 
    changeOrigin: true,
    secure: true
  }));
};
