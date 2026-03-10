# Key Files & Services Map

## Service Layer (frontend/src/services/)

| Service File | Responsibility | When to Use |
|---|---|---|
| `chainsService.ts` | Fetch chain data, shared cache (`fetchChainCached`), normalize API format | ANY business chain data |
| `ontologyService.ts` | RAG computation, line health, impact/urgency scoring | OntologyHome views |
| `enterpriseService.ts` | Capability matrix (L1→L2→L3), Neo4j queries | Enterprise Desk |
| `sectorService.ts` | Sector desk data | Sector Desk |
| `chatService.ts` | LLM calls, streaming, artifact extraction | Chat/Noor AI |
| `neo4jMcpService.ts` | MCP router (JSON-RPC 2.0) for Cypher queries | ONLY when no chain exists |
| `graphService.ts` | Graph server interactions (Neo4j rendering) | 3D graph views |
| `dashboardService.ts` | Analytics & KPI data | Dashboard views |
| `planningService.ts` | Planning lab & scenario work | Planning Desk |
| `adminService.ts` | Admin dashboard & settings | Admin pages |
| `adminSettingsService.ts` | LLM provider, MCP config | Admin settings |
| `llmService.ts` | LLM provider integration | AI features |
| `authService.ts` | Login/logout via Supabase | Auth flows |

## Desk Components (frontend/src/components/desks/)

| Component | Purpose |
|---|---|
| `SectorDesk.tsx` | Sector Desk orchestrator — main sector view |
| `EnterpriseDesk.tsx` | Enterprise Desk — capability matrix, enterprise view |
| `sector/SectorHeaderNav.tsx` | Top nav + policy categories |
| `sector/PolicyToolsDrawer.tsx` | Policy tool cards drawer |
| `sector/PolicyToolDetailPanel.tsx` | Right panel for selected tool |
| `sector/SectorGanttChart.tsx` | Gantt chart for sector timelines |
| `sector/SectorMap.tsx` | Geographic map view |

## App Shell

| File | Purpose |
|---|---|
| `app/josoor/JosoorShell.tsx` | Unified shell at /josoor — state-driven nav, no URL changes |
| `components/layout/Sidebar.tsx` | Navigation sidebar |
| `components/layout/Header.tsx` | Top header with controls |

## Chat System

| File | Purpose |
|---|---|
| `components/chat/ChatContainer.tsx` | Main chat interface |
| `components/chat/MessageBubble.tsx` | Individual message rendering |
| `components/chat/ArtifactRenderer.tsx` | Renders AI-generated artifacts (charts, tables) |
| `components/chat/CanvasManager.tsx` | Canvas panel for artifact display |

## Landing Page (public, no auth)

| File | Purpose |
|---|---|
| `components/landing/LandingPage.tsx` | Main landing orchestrator |
| `components/landing/BetaForm.tsx` | Beta signup form (writes to Supabase `users_pending`) |
| `components/landing/Platform.tsx` | Platform showcase with carousel |
| `components/landing/StrategyHouse.tsx` | Strategy house visualization |
| `pages/WelcomeEntry.tsx` | Entry redirect logic |

## Styling

| File | Purpose |
|---|---|
| `styles/theme.css` | ALL CSS variables — single source of truth. Use `var(--*)` |
| `styles/chat.css` | Chat-specific styles |

## i18n

| File | Purpose |
|---|---|
| `i18n/en.json` | English translations |
| `i18n/ar.json` | Arabic translations — ALWAYS keep in sync with en.json |

## Config & Build

| File | Purpose |
|---|---|
| `vite.config.ts` | Vite config with proxy routing to backend/graph server |
| `frontend/.env` | Environment variables (not committed) |
| `frontend/.env.example` | Template for env vars |
| `frontend/package.json` | Dependencies and scripts |
| `sf1.sh` | Start frontend + graph server script |

## UI Primitives (frontend/src/components/ui/)

50+ Radix-based components. Import via `@/components/ui/*`:
- `button`, `dialog`, `tabs`, `select`, `dropdown-menu`, `tooltip`
- `card`, `badge`, `avatar`, `separator`, `scroll-area`
- `table`, `input`, `textarea`, `checkbox`, `switch`

## Key Contexts (frontend/src/contexts/)

| Context | Purpose |
|---|---|
| `AuthContext` | User auth state, login/logout |
| `LanguageContext` | Current language (en/ar), RTL toggle |
| `ThemeContext` | Light/dark theme |

## Documentation (docs/)

| File | Purpose |
|---|---|
| `SYSTEM_API_CATALOGUE_V1.5.md` | Ground truth for all API endpoints |
| `FRONTEND_ARCHITECTURE.md` | Frontend architecture details |
| `BACKEND_ARCHITECTURE.md` | Backend architecture details |
| `DATA_ARCHITECTURE.md` | Data architecture details |

## Graph Server (separate Node.js process, port 3001)

Located in project root (not frontend/). Handles:
- Neo4j queries and data transformation
- Business chain endpoint (`/api/business-chain/*`)
- Graph visualization data
- Dashboard data aggregation

## Backend (separate repo: josoorbe)

Located at `/home/mastersite/development/josoorbe/backend/`. Contains:
- FastAPI application (port 8008)
- Supabase/Postgres integration
- Chat orchestrator with LLM providers
- MCP wrapper scripts for tool routing
- Edge functions for notifications
