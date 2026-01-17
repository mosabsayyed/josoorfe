# JOSOOR Copilot Instructions

## Critical Rules

**NEVER START/STOP/RESTART SERVERS WITHOUT USER APPROVAL**

1. **NO Tailwind CSS** - This project uses CSS variables from [frontend/src/styles/theme.css](frontend/src/styles/theme.css). Always use `var(--component-*)` tokens.
2. **Vite Proxy Architecture** - Frontend (port 3000) proxies `/api/graph/*`, `/api/neo4j/*`, `/api/dashboard/*`, `/api/business-chain/*`, `/api/control-tower/*` to Graph Server (port 3001). Only `/api/v1/*` goes to Backend (port 8008). See [frontend/vite.config.ts](frontend/vite.config.ts).
3. **Dual Database** - Supabase (transactional, user data) + Neo4j (enterprise graph). Never duplicate data across both. See [attached_assets/DATA_ARCHITECTURE.md](attached_assets/DATA_ARCHITECTURE.md).
4. **AI Orchestration Model** - GitHub Copilot acts as orchestrator, not implementer. Break down phases, delegate tasks with spec references. See [docs/AI_ORCHESTRATION_QUICK_START.md](docs/AI_ORCHESTRATION_QUICK_START.md).

## Architecture Overview

**JOSOOR** is a Cognitive Digital Twin platform with React 19 frontend and FastAPI backend, integrating with Neo4j graph database for enterprise transformation knowledge.

### Service Topology
- **Frontend (Vite/React)**: Port 3000, started by `./sf1.sh`
- **Backend (FastAPI)**: Port 8008, started by `./sb.sh` (backend repo)
- **Graph Server (Express/Neo4j)**: Port 3001, proxied via Vite
- **MCP Routers**: Ports 8201 (Noor), 8202 (Maestro), 8203 (Embeddings), 8080 (Neo4j Direct)
- **Production**: All services gateway through `https://betaBE.aitwintech.com`

### Key Technologies
- **Frontend**: React 19, TypeScript, Vite, Radix UI, React Query, Supabase Auth
- **Backend**: FastAPI, PostgreSQL (Supabase), Neo4j, Groq LLM (`openai/gpt-oss-120b`)
- **State**: React Context + React Query (no Redux)
- **Styling**: CSS custom properties only, NO Tailwind
- **i18n**: English + Arabic with RTL support via [LanguageContext](frontend/src/contexts/LanguageContext.tsx)

## Starting Development

Read [00_START_HERE.md](00_START_HERE.md) first. Always.

```bash
# Frontend only (this repo)
./sf1.sh              # Background mode
./sf1.sh --fg         # Foreground with live logs

# Clean up automatically (ports 3000, 3001)
# Logs: frontend/logs/frontend.log
```

Backend requires separate `josoorbe` repository with `./sb.sh` (not in this workspace).

## API Integration Patterns

### Endpoint Routing

Understand the split architecture:

```typescript
// Backend (Supabase/Auth/Chat) - Port 8008
/api/v1/chat/message          → Backend FastAPI
/api/v1/auth/login            → Backend FastAPI
/api/v1/dashboard/*           → Backend FastAPI (temp tables)

// Graph Server (Neo4j) - Port 3001 (proxied)
/api/neo4j/*                  → Graph Server (Vite proxy)
/api/graph/*                  → Graph Server (Vite proxy)
/api/business-chain/*         → Graph Server (Vite proxy)
/api/control-tower/*          → Graph Server (Vite proxy)
/api/dashboard/*              → Graph Server (Vite proxy)
```

See [attached_assets/SYSTEM_API_CATALOG_v1.4.md](attached_assets/SYSTEM_API_CATALOG_v1.4.md) for complete endpoint catalog.

### Service Layer

- **Chat/Auth**: [frontend/src/lib/services/chatService.ts](frontend/src/lib/services/chatService.ts), [authService.ts](frontend/src/lib/services/authService.ts)
- **Graph APIs**: [frontend/src/lib/api/graphApi.ts](frontend/src/lib/api/graphApi.ts)
- Always use React Query for data fetching, never raw `fetch()` in components

## Component Structure

```
frontend/src/
├── components/
│   ├── chat/           # 22 files - ChatInterface, MessageBubble, ArtifactDisplay
│   ├── ui/             # 49 files - Radix UI primitives (Button, Dialog, etc.)
│   ├── dashboards/     # 13 files - Enterprise Desk components
│   └── layout/         # Layout wrappers
├── pages/
│   ├── ChatAppPage.tsx         # Main /chat route
│   ├── LandingPage.tsx         # Public /landing
│   └── josoor-sandbox/*        # Dashboard routes
```

### Styling Conventions

**Example from existing code:**

```css
/* frontend/src/styles/theme.css */
.component {
  background: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
}
```

Never use inline Tailwind classes like `className="bg-blue-500"`. Use dedicated CSS files or CSS variables.

## Data Flow Patterns

### Chat Message Flow

1. User sends message via [ChatInterface](frontend/src/components/chat/ChatInterface.tsx)
2. `chatService.sendMessage()` posts to `/api/v1/chat/message`
3. Backend orchestrator (`orchestrator_universal.py`) routes to LLM with MCP tool access
4. Response streams back with artifacts (charts, tables, code blocks)
5. [ArtifactDisplay](frontend/src/components/chat/ArtifactDisplay.tsx) renders artifacts using [ChartRenderer](frontend/src/ChartRenderer.tsx)

### Dashboard Data Flow

1. Dashboard component calls `graphApi.ts` methods
2. Vite proxy forwards `/api/dashboard/*` to Graph Server (port 3001)
3. Graph Server executes Cypher queries against Neo4j
4. Frontend renders using CSS variable-based styles from [frontend/src/styles/dashboards.css](frontend/src/styles/dashboards.css)

## Testing & Validation

### API Testing Scripts
- [frontend/complete_api_test.sh](frontend/complete_api_test.sh) - Complete endpoint validation
- [frontend/exhaustive_graph_test.sh](frontend/exhaustive_graph_test.sh) - Graph API testing
- Root-level Python probes: `probe_*.py`, `analyze_backend.py`, `test_backend_chain.py`

### Debugging
- Backend traces: `GET /api/v1/debug/traces`
- Frontend observability: [ObservabilityPage](frontend/src/pages/ObservabilityPage.tsx)
- Logs: `frontend/logs/frontend.log`

## Common Tasks

### Adding a New Dashboard Component

1. Create component in [frontend/src/components/dashboards/](frontend/src/components/dashboards/)
2. Add route in [frontend/src/App.tsx](frontend/src/App.tsx) under `/josoor-sandbox/*`
3. Add API method to [frontend/src/lib/api/graphApi.ts](frontend/src/lib/api/graphApi.ts) if needed
4. Use CSS variables for styling, add specific styles to [frontend/src/styles/dashboards.css](frontend/src/styles/dashboards.css)
5. Test against Graph Server via Vite proxy

### Modifying Chat Interface

1. Core UI: [frontend/src/components/chat/ChatInterface.tsx](frontend/src/components/chat/ChatInterface.tsx)
2. Message rendering: [frontend/src/components/chat/MessageBubble.tsx](frontend/src/components/chat/MessageBubble.tsx)
3. Styles: [frontend/src/styles/chat.css](frontend/src/styles/chat.css)
4. Never break streaming - `chatService.ts` uses `StreamingJsonParser` from [frontend/src/utils/streaming.ts](frontend/src/utils/streaming.ts)

### Working with Enterprise Ontology

The Neo4j graph follows the SST model (Sector → Strategy → Tactics). Read [attached_assets/Enterprise_Ontology_SST_v1_1_1768206798485.md](attached_assets/Enterprise_Ontology_SST_v1_1_1768206798485.md) before modifying business chain queries.

Valid relationships:
- `SectorObjective -[:ALIGNS_WITH]-> EntityCapability`
- `EntityCapability -[:SUPPORTS]-> EntityProject`
- `SectorPolicyTool -[:IMPLEMENTS]-> EntityCapability`

## File Organization Principles

1. **Active Code**: [frontend/src/](frontend/src/) contains production code
2. **Reference Designs**: [DO_NOT_DELETE_THIS_IS_THE_NEW_DESIGN_YOU_IDIOT_GEMINI/](DO_NOT_DELETE_THIS_IS_THE_NEW_DESIGN_YOU_IDIOT_GEMINI/), [reference_new_design/](reference_new_design/) - DO NOT modify
3. **Documentation**: [docs/](docs/) for architecture, [attached_assets/](attached_assets/) for specs
4. **Old Pages Excluded**: `josoor-v2`, `josoor-dashboards`, `josoor-reconstruction` removed from build

## External Resources

- **Backend Repo** (not in this workspace): `josoorbe` repository with `./sb.sh` start script
- **Production Gateway**: `https://betaBE.aitwintech.com`
- **Supabase**: Authentication + PostgreSQL storage (env: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`)
- **Neo4j**: Graph database (backend connects directly, frontend via Graph Server proxy)

## Documentation Navigation

Start here: [00_START_HERE.md](00_START_HERE.md)

Deep dives:
- [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md) - Component patterns, routing, contexts
- [attached_assets/BACKEND_ARCHITECTURE.md](attached_assets/BACKEND_ARCHITECTURE.md) - FastAPI structure, orchestrator design
- [attached_assets/DATA_ARCHITECTURE.md](attached_assets/DATA_ARCHITECTURE.md) - Dual database patterns, schemas
- [attached_assets/SYSTEM_API_CATALOG_v1.4.md](attached_assets/SYSTEM_API_CATALOG_v1.4.md) - Complete API reference
- [docs/AI_ORCHESTRATION_QUICK_START.md](docs/AI_ORCHESTRATION_QUICK_START.md) - How to coordinate development work
