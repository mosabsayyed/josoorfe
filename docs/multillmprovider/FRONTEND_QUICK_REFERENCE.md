# 📋 Frontend Quick Reference - LLM Migration APIs

**One-page cheat sheet for developers**

---

## 🚀 Start Here: 60 Second Setup

```typescript
// 1. Get token
const token = await fetch('/auth/token', {
  method: 'POST',
  body: JSON.stringify({ username: 'admin', password: 'xxx' })
}).then(r => r.json());

// 2. Make your first API call
const response = await fetch('/api/llm/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello' }],
    model: 'mixtral-8x7b',
    temperature: 0.7,
    max_output_tokens: 100
  })
});

// 3. Parse response
const data = await response.json();
console.log(data.data.text); // "Hello! How can I help..."
```

---

## 📡 Base URL & Headers

```
Base: http://localhost:8000/api
Swagger: http://localhost:8000/docs
```

**Required Headers:**
```typescript
// For public endpoints (LLM execute)
{ 'Content-Type': 'application/json' }

// For admin endpoints (providers, metrics, etc.)
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

---

## 📍 All Endpoints (20 Total)

### LLM Execution (No Auth)
```
POST   /llm/execute                    Execute query on active provider
```

### Provider Management (Auth)
```
GET    /admin/providers                List all providers
GET    /admin/providers/{id}           Get provider details
POST   /admin/providers/{id}/test      Test connection
PUT    /admin/providers/{id}/activate  Switch active provider
PUT    /admin/providers/{id}           Update configuration
```

### A/B Testing (Auth)
```
GET    /admin/ab-testing/config            Current test setup
PUT    /admin/ab-testing/traffic-split    Adjust split (80/20, etc)
GET    /admin/ab-testing/comparison       Compare metrics
GET    /admin/ab-testing/cost-analysis    Cost breakdown
POST   /admin/ab-testing/record-comparison Log comparison
```

### Metrics Dashboard (Auth)
```
GET    /admin/metrics/summary             KPIs (requests, cost, latency)
GET    /admin/metrics/providers           Per-provider comparison
GET    /admin/metrics/tokens/timeline     Token usage over time
GET    /admin/metrics/latency/distribution Latency histogram
GET    /admin/metrics/errors              Error breakdown
GET    /admin/metrics/cost                Cost trends
GET    /admin/metrics/logs                Request logs (searchable)
GET    /admin/metrics/anomalies           Alert detection
```

---

## 📊 Response Format

**Success:**
```json
{
  "status": "success",
  "data": {
    /* Endpoint-specific data */
  }
}
```

**Error:**
```json
{
  "status": "error",
  "error": {
    "type": "rate_limited|timeout|invalid_request|etc",
    "message": "Human-readable message",
    "details": { /* context */ }
  }
}
```

---

## ✅ Common Tasks

### Execute Query
```typescript
POST /llm/execute
{
  messages: [{role: 'user', content: 'text'}],
  model: 'mixtral-8x7b',
  temperature: 0.7,
  max_output_tokens: 1000
}

Response: {
  text: 'response text',
  usage: {input_tokens, output_tokens, total_tokens},
  provider: 'groq',
  latency_ms: 234,
  request_id: 'req_xxx'
}
```

### List Providers
```typescript
GET /admin/providers
Headers: Authorization: Bearer TOKEN

Response: {
  providers: [
    {id: 'groq', name: 'Groq', active: true, ...},
    {id: 'google_ai', name: 'Google AI', active: false, ...}
  ]
}
```

### Switch Active Provider
```typescript
PUT /admin/providers/google_ai/activate
Headers: Authorization: Bearer TOKEN

Response: {
  active_provider: 'google_ai',
  previous_provider: 'groq'
}
```

### Get Metrics Summary
```typescript
GET /admin/metrics/summary?time_range=24h
Headers: Authorization: Bearer TOKEN

Response: {
  summary: {
    total_requests: 12453,
    total_cost: 125.50,
    avg_latency_ms: 234,
    error_rate: 0.0015,
    p50_latency_ms: 180,
    p95_latency_ms: 850,
    p99_latency_ms: 2100
  }
}
```

### Test Provider Connection
```typescript
POST /admin/providers/groq/test
Headers: Authorization: Bearer TOKEN
{
  model: 'mixtral-8x7b',
  test_message: 'Hello'
}

Response: {
  status: 'success|error',
  response: 'Hello! I am working correctly.',
  latency_ms: 234
}
```

---

## 🔴 Error Codes & Handling

| Code | Type | What To Do |
|------|------|-----------|
| 200 | ✅ | Success - use response data |
| 400 | bad_request | Check request format/fields |
| 401 | unauthorized | Token missing/expired - re-authenticate |
| 404 | not_found | Resource doesn't exist - check ID |
| 429 | rate_limited | **Retry** with exponential backoff |
| 502 | network_error | Provider unreachable - retry or fallback |
| 504 | timeout | Request too slow - retry or increase timeout |
| 500 | internal_error | Backend error - contact support |

### Retry Logic (429/502/504)
```typescript
const retryAfter = response.headers.get('Retry-After') || 60;
await sleep(parseInt(retryAfter) * 1000);
// retry request
```

---

## 🔐 Authentication

### Get Token (Dev Only)
```bash
curl http://localhost:8000/auth/token \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"xxx"}'
```

### Use Token
```typescript
const token = localStorage.getItem('auth_token');

fetch('/admin/providers', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### Store & Refresh
```typescript
// Store
localStorage.setItem('auth_token', token);

// Refresh before expiry
const decoded = jwt_decode(token);
setTimeout(() => refreshToken(), decoded.exp * 1000 - Date.now() - 60000);
```

---

## 📈 Time Range Query Param

Use on metrics endpoints:
```
?time_range=1h      Last 1 hour
?time_range=24h     Last 24 hours
?time_range=7d      Last 7 days
?time_range=30d     Last 30 days
```

---

## 📄 Query Params by Endpoint

### GET /admin/metrics/logs
```
?provider=groq           Filter by provider
?status=success|error    Filter by status
?limit=50               Pagination limit
?offset=0               Pagination offset
?sort=created_at:desc   Sort field:direction
```

### GET /admin/ab-testing/comparison
```
?time_range=24h  24h|7d|30d
?metric=all      all|latency|cost|quality|errors
```

### GET /admin/metrics/* (most)
```
?time_range=24h  24h|7d|30d|1h
```

---

## 🐛 Debug Checklist

- [ ] Status code is 200-299 (error if 4xx, 5xx)
- [ ] Response has `status: "success"` (or `error`)
- [ ] Request has correct Authorization header
- [ ] Token not expired (decode with jwt_decode)
- [ ] Endpoint path correct (no typos)
- [ ] Request body valid JSON
- [ ] All required fields present
- [ ] request_id in response (save for support tickets)

---

## 💡 Pro Tips

1. **Always include request_id in error reports**
   ```typescript
   console.error(`Failed: ${data.error.message} (${data.data.request_id})`);
   ```

2. **Implement retry wrapper**
   ```typescript
   async function apiCall(url, options, maxRetries = 3) {
     // auto-retry on 429, 502, 504
   }
   ```

3. **Cache metrics responses (30s)**
   ```typescript
   const cache = new Map();
   if (cache.has(url) && Date.now() - cache.get(url).time < 30000) {
     return cache.get(url).data;
   }
   ```

4. **Handle rate limiting gracefully**
   ```typescript
   if (response.status === 429) {
     showNotification('API rate limited. Please wait...');
   }
   ```

5. **Use request_id for tracing**
   ```typescript
   // In every request, track request_id for debugging
   window.lastRequestId = data.data.request_id;
   ```

---

## 🔗 Full Docs

- **API Contract:** `LLM_PROVIDER_MIGRATION_API_CONTRACT.md`
- **Integration Guide:** `FRONTEND_INTEGRATION_PACKAGE.md`
- **Backend Code:** `backend/app/api/endpoints/` (536-1095 lines each)

---

## 📞 Support

- **Error?** Include `request_id` + HTTP status + error type
- **Need token?** Contact backend team
- **Rate limited?** Implement exponential backoff (see error handling)
- **Provider down?** Test with `POST /admin/providers/{id}/test`

---

**Status:** Production Ready ✅ | **Version:** 1.0 | **Updated:** Jan 17, 2026

