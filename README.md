# JOSOOR Frontend

React 19 + TypeScript frontend for JOSOOR Cognitive Digital Twin platform.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Backend running on VPS (148.230.105.139:8008)
- Graph server running on VPS (148.230.105.139:3001)

### Installation

```bash
cd frontend
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```env
REACT_APP_API_URL=http://148.230.105.139:8008/api/v1
REACT_APP_GRAPH_SERVER_URL=http://148.230.105.139:3001
REACT_APP_SUPABASE_URL=<your-supabase-url>
REACT_APP_SUPABASE_ANON_KEY=<your-supabase-key>
```

### Run Development Server

```bash
./sf1.sh
# or
cd frontend && npm start
```

Frontend runs on: http://localhost:3000

## Architecture

See [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md) for complete reference.

### Key Technologies
- **Framework:** React 19 + TypeScript
- **Build:** Vite
- **Styling:** CSS variables (NO Tailwind)
- **State:** React Context + React Query
- **UI:** Radix UI primitives
- **Languages:** English + Arabic (RTL)

### Active Routes
- `/` - Welcome entry
- `/landing` - Landing page
- `/chat` - Main chat interface
- `/josoor-sandbox/*` - Dashboard pages (Control Tower, Dependency Desk, Risk Desk, etc.)

### Component Structure

```
frontend/src/
├── components/
│   ├── chat/              # Chat UI (22 files)
│   ├── ui/                # Radix UI primitives (49 files)
│   ├── dashboards/        # Dashboard components (13 files) ⭐ NEW
│   ├── content/           # Content pages (4 files)
│   └── layout/            # Layout components (1 file)
├── pages/
│   ├── ChatAppPage.tsx    # /chat route
│   ├── LandingPage.tsx    # /landing route
│   └── josoor-sandbox/    # /josoor-sandbox/* routes
├── lib/
│   ├── services/          # API clients (chatService, authService)
│   └── api/               # API utilities (graphApi) ⭐ NEW
├── contexts/              # React contexts (Auth, Language)
├── styles/                # CSS files (theme.css, dashboards.css)
├── types/                 # TypeScript definitions
└── utils/                 # Utility functions
```

### Changes from Original

✅ **Reorganized:** Dashboard components from `graphv001/` → `components/dashboards/`
✅ **Consolidated:** Graph API utilities → `lib/api/graphApi.ts`
✅ **Cleaned:** Removed duplicate UI components from graphv001
❌ **Excluded:** Old pages (josoor-v2, josoor-dashboards, josoor-reconstruction)

## Backend Connection

The frontend connects to:
1. **Backend API** (port 8008) via `REACT_APP_API_URL`
2. **Graph Server** (port 3001) via proxy routes: `/api/neo4j/*`, `/api/graph/*`, `/api/dashboard/*`

See [EXTERNAL_BACKEND_SETUP.md](EXTERNAL_BACKEND_SETUP.md) for backend setup.

## Scripts

- `npm start` - Start dev server (port 3000)
- `npm build` - Build for production
- `npm test` - Run tests

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_API_URL` | Yes | Backend API endpoint (e.g., http://148.230.105.139:8008/api/v1) |
| `REACT_APP_GRAPH_SERVER_URL` | No | Graph server URL (defaults to proxy) |
| `REACT_APP_SUPABASE_URL` | Yes | Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |

## Deployment

1. Set `REACT_APP_API_URL` to backend VPS IP
2. Run `npm build`
3. Deploy `build/` folder to static hosting (Netlify, Vercel, etc.)

## Backend Repository

Backend code is at: https://github.com/mosabsayyed/josoorbe.git

## Notes

- ⚠️ Frontend expects backend on **148.230.105.139:8008** (hardcoded in some files)
- ⚠️ Graph server expected on **148.230.105.139:3001** (via proxy and ExecutiveSummary SSE)
- For local development, update these IPs in `setupProxy.js`, `ExecutiveSummary.tsx`, `backend/app/config/__init__.py`
