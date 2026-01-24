# Investigation: Frontend-Backend Connection (localhost:3000 → betaBE.aitwintech.com)

## Problem Statement
User reports that running `./sf1.sh` should start the frontend on localhost:3000 and connect to a backend on betaBE.aitwintech.com, but something isn't working as expected ("we don't see this here").

## Current Architecture Analysis

### Startup Script (sf1.sh)
- ✅ Correctly starts frontend on port 3000
- ✅ Cleans up existing processes on port 3000
- ✅ Runs `npm run dev` in frontend directory
- ✅ Validates successful startup

### Vite Proxy Configuration (frontend/vite.config.ts)
**Current proxy rules:**
- `/api/neo4j/*` → https://betaBE.aitwintech.com ✅
- `/api/graph/*` → https://betaBE.aitwintech.com ✅
- `/api/dashboard/*` → https://betaBE.aitwintech.com ✅
- `/api/business-chain/*` → https://betaBE.aitwintech.com ✅
- `/api/control-tower/*` → https://betaBE.aitwintech.com ✅
- `/api/v1/*` → https://betaBE.aitwintech.com ✅
- `/api/summary-stream/*` → https://betaBE.aitwintech.com ✅
- `/api/*` → https://betaBE.aitwintech.com ✅
- All proxy rules use `changeOrigin: true` and `secure: true`

### Environment Variables (.env)
**Current setting:**
```
REACT_APP_API_URL=https://betaBE.aitwintech.com
```

**Problem Identified:**
The chatService.ts (line 92-98) reads `REACT_APP_API_URL` and uses it as an absolute URL for API calls. This means:
- When `REACT_APP_API_URL` is set to an absolute URL, API calls go directly to betaBE.aitwintech.com
- This BYPASSES the Vite proxy configuration
- The design intent appears to be: use proxy during local dev, use absolute URL in production

### Service Layer Implementation (frontend/src/services/chatService.ts)
- Lines 92-99: Tries to load API_BASE_URL from environment
- Lines 101-104: buildUrl() function constructs final URLs
- When API_BASE_URL is empty, relative paths are used (e.g., `/api/v1/chat/message`)
- When API_BASE_URL has a value, absolute URLs are used (e.g., `https://betaBE.aitwintech.com/api/v1/chat/message`)

### Graph API (frontend/src/lib/api/graphApi.ts)
- Uses relative paths like `/api/neo4j/...`, `/api/dashboard/...`
- These rely on Vite proxy to be forwarded to betaBE.aitwintech.com

## Root Cause Assessment

The setup has **two conflicting approaches**:
1. **Vite Proxy**: Designed for local development where frontend and backend are different services but accessed via relative paths
2. **Environment Variable (REACT_APP_API_URL)**: Designed for production where backend is accessed via absolute URL

**Current state:** The `.env` file has an absolute URL set, which means:
- chatService.ts makes direct requests to betaBE.aitwintech.com (bypassing proxy)
- graphApi.ts makes requests to `/api/*` paths (going through Vite proxy)
- This creates an **inconsistent setup** where different parts of the app route requests differently

## Questions for User

Before proceeding, clarify:

1. **What's NOT working?**
   - Are you seeing network errors in the browser console?
   - Are certain API calls failing?
   - Is the app not loading at all?
   - Are CORS errors appearing?

2. **What's the intended development workflow?**
   - Should developers run everything locally with proxying (Vite proxy to betaBE)?
   - Or should some services run locally and backend on betaBE?
   - Should `.env` have an absolute URL for dev, or should it be empty to use the proxy?

3. **What does "we don't see this here" mean?**
   - Missing the connection in logs?
   - Network requests not reaching betaBE?
   - Frontend not loading at all?

## Recommended Solution (Pending Clarification)

**If the goal is to use Vite proxy for all local dev requests:**
1. Clear `REACT_APP_API_URL` from `.env` (set to empty)
2. Update `frontend/.env.example` to document this setup
3. All API requests (both chat and graph) will use relative paths and go through Vite proxy
4. Vite proxy will forward them to betaBE.aitwintech.com

**If the goal is to use absolute URLs:**
1. Keep `REACT_APP_API_URL=https://betaBE.aitwintech.com` in `.env`
2. Document that Vite proxy rules can be removed/unused for dev
3. Ensure all service layers (chatService, graphApi, etc.) consistently use this absolute URL
4. Update documentation to reflect this architecture choice

## Files to Investigate (if approved)
- `frontend/.env` (environment configuration)
- `frontend/vite.config.ts` (proxy rules)
- `frontend/src/services/chatService.ts` (API URL construction)
- `frontend/src/lib/api/graphApi.ts` (Graph API calls)
- `frontend/src/services/authService.ts` (might have similar patterns)
- Server logs from betaBE.aitwintech.com (to verify if requests are arriving)
