# JOSOOR Frontend — Workspace Instructions

> KSA Vision 2030 Cognitive Digital Twin platform. React 18 + TypeScript + Vite frontend.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `cd frontend && npm run dev` | Vite dev server (port 3000) |
| `cd frontend && npm run build:vite` | Production build → `dist/` |
| `cd frontend && npm test` | Jest tests |
| `cd frontend && npm run lint` | ESLint |
| `./sf1.sh` | Start frontend + graph server |

Backend API: `https://betaBE.aitwintech.com` (proxied via Vite at `/api/*`).
Detailed architecture in `docs/FRONTEND_ARCHITECTURE.md`, `docs/BACKEND_ARCHITECTURE.md`, `docs/DATA_ARCHITECTURE.md`.

---

## Architecture

### Tech Stack
- **Framework:** React 18.3 + TypeScript 4.9 (strict: false)
- **Build:** Vite 7 (legacy CRA scripts `npm start` / `npm run build` still present — prefer Vite)
- **Styling:** Tailwind CSS 4 + CSS custom properties (oklch) in `styles/theme.css`. NO CSS-in-JS.
- **UI Primitives:** Radix UI (50+ components in `components/ui/`) + Lucide icons
- **State:** React Query v5 + React Context (Auth, Language, Theme)
- **Routing:** React Router v6
- **i18n:** i18next — default language is Arabic (`ar`). Always support both `en` and `ar`.
- **Auth:** Supabase SDK + localStorage tokens
- **Charts:** Recharts 3, Highcharts 12, ECharts 6, D3, react-force-graph
- **Animation:** Framer Motion, GSAP

### Source Layout
```
frontend/src/
├── components/
│   ├── desks/              # Main view layer (OntologyHome, SectorDesk, EnterpriseDesk, etc.)
│   ├── ui/                 # Radix-based design system (button, dialog, tabs, etc.)
│   ├── chat/               # Chat interface (ChatContainer, MessageBubble, ArtifactRenderer)
│   ├── dashboards/         # Executive dashboards (BusinessChains, GraphDashboard)
│   ├── layout/             # Shell, sidebar, header
│   └── common/             # Shared components
├── services/               # API layer (one file per domain)
├── contexts/               # React Context providers (Auth, Language, Theme)
├── styles/                 # CSS files (theme.css, chat.css, etc.)
├── i18n/                   # en.json + ar.json translation files
├── types/                  # TypeScript type definitions
├── pages/                  # Top-level route components
├── lib/                    # Supabase client, API utils
├── utils/                  # Helpers (streaming, visualization)
└── app/josoor/             # JosoorShell unified app shell
```

### Service Layer
| Service | Responsibility |
|---------|---------------|
| `chainsService.ts` | Fetch chain data, shared cache (`fetchChainCached`), normalize API format |
| `ontologyService.ts` | RAG computation, line health, impact/urgency scoring for OntologyHome |
| `enterpriseService.ts` | Capability matrix (L1→L2→L3), Neo4j queries |
| `chatService.ts` | LLM calls, streaming, artifact extraction |
| `neo4jMcpService.ts` | MCP router (JSON-RPC 2.0) for Cypher queries |
| `graphService.ts` | Graph server interactions (Neo4j rendering) |
| `sectorService.ts` | Sector desk data |
| `dashboardService.ts` | Analytics & KPI data |
| `planningService.ts` | Planning lab & scenario work |
| `adminService.ts` | Admin dashboard & settings |
| `adminSettingsService.ts` | LLM provider, MCP config |
| `llmService.ts` | LLM provider integration |
| `authService.ts` | Login/logout via Supabase |

### Backend Architecture

The actual backend (FastAPI) lives in a separate **`josoorbe`** repo on the VPS. This repo is frontend-only + utility scripts.

| Service | Port | Purpose |
|---------|------|---------|
| Frontend (Vite) | 3000 | React SPA |
| Graph Server | 3001 | Neo4j data, visualizations, chains |
| Backend (FastAPI) | 8008 | Auth, chat, Supabase/Postgres |
| MCP Router (Noor) | 8201 | Read-only tools + chains |
| MCP Router (Maestro) | 8202 | Read/write core tools |

### Vite Proxy Routing

Some frontend routes proxy to the **graph server** (port 3001), others to the **backend** (port 8008):
- Graph server: `/api/neo4j/*`, `/api/dashboard/*`, `/api/graph/*`, `/api/business-chain/*`, `/api/control-tower/*`, `/api/dependency/*`, `/api/domain-graph/*`
- Backend: `/api/v1/*` (auth, chat, chains, admin)

---

## Critical Rules

### Node Identity (MOST IMPORTANT)
Node `id` (e.g. `"1.0"`) is **NOT unique across Neo4j labels**. `EntityCapability:1.0` and `EntityRisk:1.0` are different nodes.

- **Dedup key:** `${label}:${id}:${year}`
- **Level lookup key:** `${label}:${id}`
- **Any Map/Set keyed by node ID alone MUST include the label** — this applies to dedup, level lookup, and any future code processing chain data.

### Chain API Format (March 2026)
```json
{
  "chain_key": "capability_to_performance",
  "nodes": {
    "EntityCapability": [{ "id": "1.0", "name": "...", "year": 2025, "level": "L2" }],
    "EntityRisk": [{ "id": "5.0", "name": "..." }]
  },
  "edges": [{
    "source_label": "EntityCapability", "source_id": "1.0",
    "target_label": "EntityRisk", "target_id": "5.0",
    "type": "MONITORED_BY"
  }]
}
```
- Nodes are flat arrays grouped by label. No `nLabels`/`nProps` wrappers. No `domain_id`.
- Edges use `source_label/source_id/target_label/target_id`.
- `chainsService.ts` normalizes this into `{ nId, nLabels, nProps, id, labels, properties }` for internal use.

### 7 Chains
`change_to_capability`, `capability_to_policy`, `capability_to_performance`, `sector_value_chain`, `sustainable_operations`, `setting_strategic_initiatives`, `setting_strategic_priorities`

All fetched with `year=0` (all data), filtered locally by year/quarter.

### RAG Status
- Colors: `green`, `amber`, `red`, `default`
- **Line RAG thresholds:** green = 0% broken, amber = ≤25% broken, red = >25% broken
- **Building RAG:** Weighted by impact × urgency per node type

### Cumulative Types (carry forward across years)
`capabilities`, `risks`, `policyTools`, `orgUnits`, `itSystems`, `processes`, `performance`, `vendors`, `projects`

### SectorPolicyTool
IDs 1.0–15.x = policy instruments (counted in line RAG). IDs ≥16.0 = physical assets (NEOM, power plants, etc.) — excluded from line RAG computation.

### Build Mode Filtering
For IT/Process/Org → Projects lines: only count nodes that are targets of `CLOSE_GAPS` relationships from projects (build-mode nodes).

---

## Conventions

### RTL Support
- Default language is Arabic. Always check and support both `en` and `ar`.
- Components use `dir={rtl ? 'rtl' : 'ltr'}` and `lang={lang}`.
- Use `useTranslation()` hook for all user-facing strings.

### Component Patterns
- Functional components with `.tsx` extension
- Export name matches filename: `SectorDesk.tsx` exports `SectorDesk`
- Desk components in `components/desks/`, sub-components in subdirectories
- Use React Query for data fetching: `useQuery({ queryKey, queryFn, staleTime: 5*60*1000 })`
- UI primitives from `components/ui/` (Radix-based) — import via `@/components/ui/*`

### Error Handling
- Try-catch in services; re-throw with context
- 401 responses: interceptor handles re-auth

### Environment Variables
```
REACT_APP_API_URL          # Backend base (falls back to /api/v1)
REACT_APP_SUPABASE_URL     # Supabase project URL
REACT_APP_SUPABASE_ANON_KEY
```

---

## Multi-Instance Setup
This project runs across multiple environments (staging laptop, production VPS, frontend vs backend). AI agents share a common memory system via the Noor Memory MCP server. Always validate documentation against memory — updates may have occurred outside your context.

