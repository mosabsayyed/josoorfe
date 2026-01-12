# External Backend Setup Guide

## Overview

The frontend and backend are now in separate repositories:
- **Backend:** https://github.com/mosabsayyed/josoorbe.git (runs on port 8008)
- **Frontend:** This repository (runs on port 3000)

The frontend uses environment variables to configure the backend API endpoint.

## Local Development (Same Machine)

### 1. Start Backend
```bash
# In josoorbe repo
./sb.sh
```
Services start on:
- Backend FastAPI: `http://localhost:8008`
- Graph Server: `http://localhost:3001`
- MCP routers: 8201, 8202, 8203, 8204

### 2. Configure Frontend
In `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:8008/api/v1
REACT_APP_SUPABASE_URL=<your-supabase-url>
REACT_APP_SUPABASE_ANON_KEY=<your-supabase-key>
```

### 3. Start Frontend
```bash
# In this repository
./sf1.sh
```
Frontend starts on: `http://localhost:3000`

---

## VPS Deployment (Backend on Different Machine)

### Scenario
- **VPS Machine:** 148.230.105.139
  - Runs backend on port 8008
  - Runs graph-server on port 3001
  - All services bind to `0.0.0.0` (accessible from internet)

- **Local Machine / Frontend Server:** Your local machine or frontend server
  - Runs frontend on port 3000

### 1. Backend Setup on VPS

```bash
# Clone josoorbe repo
git clone https://github.com/mosabsayyed/josoorbe.git
cd josoorbe

# Create .env with your secrets
cat > .env << EOF
GROQ_API_KEY=your_groq_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEO4J_URI=your_neo4j_uri
NEO4J_PASSWORD=your_neo4j_password
OPENAI_API_KEY=your_openai_key
EOF

# Start backend (all services bind to 0.0.0.0)
./sb.sh
```

Services now accessible at `http://148.230.105.139:8008`, `http://148.230.105.139:8201`, etc.

### 2. Frontend Setup (Local Machine)

```bash
# Clone frontend repo
git clone https://github.com/mosabsayyed/chatmodule.git
cd chatmodule/frontend

# Create .env pointing to VPS backend
cat > .env << EOF
REACT_APP_API_URL=http://148.230.105.139:8008/api/v1
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_key
EOF

# Start frontend
../sf1.sh
```

Access frontend at: `http://localhost:3000`

---

## How the Frontend Calls Backend

### Environment Variable Priority

The frontend checks for API URL in this order:

1. **`VITE_API_URL`** - Vite environment variable (if using Vite dev server)
2. **`VITE_API_BASE`** - Alternative Vite variable
3. **`REACT_APP_API_URL`** - React environment variable (used by react-scripts)
4. **`REACT_APP_API_BASE`** - Alternative React variable
5. **Fallback:** Relative path `/api/v1` (requires reverse proxy to backend)

### Code Implementation

All service files use this pattern:

```typescript
// frontend/src/services/chatService.ts
const RAW_API_BASE = 
  import.meta.env?.VITE_API_URL ||
  import.meta.env?.VITE_API_BASE ||
  process.env?.REACT_APP_API_URL ||
  process.env?.REACT_APP_API_BASE ||
  '';

const API_BASE_URL = RAW_API_BASE ? RAW_API_BASE.replace(/\/+$/g, '') : '';
const API_PATH_PREFIX = API_BASE_URL ? '' : '/api/v1';

function buildUrl(endpointPath: string) {
  return `${API_BASE_URL || ''}${API_PATH_PREFIX}${endpointPath}`;
}
```

### Examples

| Setup | Environment Variable | Calls |
|-------|----------------------|-------|
| Local same machine | Not set | `http://localhost:3000/api/v1/chat/message` (relative) |
| Local diff machine | `REACT_APP_API_URL=http://localhost:8008/api/v1` | `http://localhost:8008/api/v1/chat/message` |
| VPS deployment | `REACT_APP_API_URL=http://148.230.105.139:8008/api/v1` | `http://148.230.105.139:8008/api/v1/chat/message` |
| NGROK tunnel | `REACT_APP_API_URL=https://xxxx.ngrok.io/api/v1` | `https://xxxx.ngrok.io/api/v1/chat/message` |

---

## CORS Setup

If frontend and backend are on different origins, you may need to configure CORS.

### Backend CORS Configuration

File: `backend/app/main.py`

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://frontend-ip:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Or use environment variable:
```python
BACKEND_ALLOW_ORIGINS = os.getenv("BACKEND_ALLOW_ORIGINS", "http://localhost:3000")
# Split by comma and add to CORS
allow_origins = [url.strip() for url in BACKEND_ALLOW_ORIGINS.split(",")]
```

---

## Troubleshooting

### Frontend Can't Connect to Backend

**Check:**
1. Is backend running? `curl http://148.230.105.139:8008/api/v1/health`
2. Is `REACT_APP_API_URL` set correctly in `.env`?
3. Is CORS enabled on backend?
4. Check browser console for network errors

### Backend Errors

1. Check logs: `tail -f logs/backend_start.log`
2. Verify database connections: `NEO4J_URI`, `SUPABASE_URL`
3. Verify all ports are available: `lsof -i :8008`

### Port Conflicts

If ports are already in use:
```bash
# Kill processes on specific port
fuser -k 8008/tcp

# Or use different port (set in .env or script)
export BACKEND_PORT=9008
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (React 19 + Vite)                     │
│  Port 3000                                      │
│  http://localhost:3000                          │
└────────────────┬────────────────────────────────┘
                 │
                 │ API Calls with REACT_APP_API_URL
                 │ http://148.230.105.139:8008/api/v1
                 │
┌────────────────▼────────────────────────────────┐
│  Backend (FastAPI)                              │
│  Port 8008                                      │
│  http://148.230.105.139:8008                    │
├─────────────────────────────────────────────────┤
│  ├─ Graph Server (port 3001)                    │
│  ├─ MCP Routers (8201, 8202)                    │
│  ├─ Embeddings Server/Router (8203, 8204)       │
│  ├─ Neo4j MCP Server (8080)                     │
│  └─ FastAPI App                                 │
└─────────────────────────────────────────────────┘
        │
        ├─▶ Supabase (PostgreSQL)
        └─▶ Neo4j (Graph Database)
```

---

## Scripts Updated

### `sf1.sh` (Frontend Startup)
- Removed graph-server startup
- Starts only port 3000 (frontend)
- Graph-server is now managed by backend (`sb.sh`)

### `sb.sh` (Backend Startup)  
- Removed ngrok (not needed on VPS)
- All services bind to `0.0.0.0`
- Auto-detects machine IP
- Starts graph-server on port 3001

---

## Environment Variables Reference

### Frontend (`frontend/.env`)
```env
# Required: Backend API endpoint
REACT_APP_API_URL=http://148.230.105.139:8008/api/v1

# Required: Supabase
REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJxx...
```

### Backend (`backend/.env` or `josoorbe/.env`)
```env
# LLM
GROQ_API_KEY=gsk_xxx
OPENAI_API_KEY=sk_xxx

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_PASSWORD=password
NEO4J_USERNAME=neo4j

# Backend
SECRET_KEY=your-secret-key
BACKEND_ALLOW_ORIGINS=http://localhost:3000
```

---

## Next Steps

1. **Test local setup** - Verify both backend and frontend start
2. **Configure VPS** - Deploy backend to VPS machine
3. **Update frontend .env** - Point to VPS backend IP
4. **Test external connection** - Verify frontend can reach backend API
5. **Setup CORS** - If needed, configure backend CORS for frontend domain
6. **Use reverse proxy** (optional) - Nginx/Apache to route requests through single domain

