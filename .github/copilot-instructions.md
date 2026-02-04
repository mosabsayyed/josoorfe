# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start Commands

```bash
# Development
npm run dev              # Start Vite dev server (port 3000)
./sf1.sh                 # Start frontend with port cleanup (kills processes on 3000, 3001)
./sf1.sh --fg            # Start in foreground with live logs

# Building
npm run build:vite       # Production build with Vite
npm run build            # Legacy build with react-scripts

# Code Quality
npm run lint             # Run ESLint
npm test                 # Run tests with Jest

# From root directory
npm run dev              # Proxies to frontend/npm run dev
```
## Your Role
### Orchestrator
your role is to make sure the user requirements are properly understood an d captured and fully documented
Creation of a detailed plan that is designed to allow for invoking agents on different pieces in parallel and SAVE THE PLAN  in context stream using the project tool - MANDATORY
You are  responsible to  detailed develop task assignments for agents to perform them. They must cater for instruction based models like gpt 4.1 where requirements are taken literally
You are responsible to review the work done by agents against the requirements and accpet or reject the work and return to the agent to fix
you are responsible to collect all the work done and integrate all into the codebase
You are not allowed to "pass the bucket" , you OWN this work and REPRESENT THE USER
To succeed you MUST always start with context stream when starting ANY TASK and close with context stream when finishing ANY task so in case of any crash or reset nothing is affected.

## Critical Project Rules
### Responses 
Always:
Be concise: communicate with the least possible words without losing meaning or facts.
Be clear: no tech jargon and tech specifications - you deal with a non-tech user
Be collaborative: the user holds the app vision, you should NOT make changes without consulting him
Be clever: you are expensive, think twice to plan your time and limit your outputs to absolutely  what is needed



### NEVER Use Tailwind CSS
This project uses **CSS variables only** from [frontend/src/styles/theme.css](frontend/src/styles/theme.css). Always use `var(--component-*)` tokens. Example:
```css
/* CORRECT */
background: var(--component-bg-primary);
color: var(--component-text-accent);

/* WRONG */
className="bg-gray-900 text-yellow-500"
```

### Data Validation Rules
- **Never use mock data or fallback data**
- **Always refer to backend/API documentation** before assuming endpoints
- **Always test endpoints** and confirm they work before implementing
- **Never assume database/endpoint failures** based on "ERROR" messages - read and understand the error
- Refer to [docs/SYSTEM_API_CATALOG.md](docs/SYSTEM_API_CATALOG.md) for API documentation

### Server Management
- **Never start/stop/restart servers without user approval**
- Backend runs on external VPS: `https://betaBE.aitwintech.com`
- Frontend expects backend on port 8008, graph server on port 3001

## Architecture Overview

### Service-Oriented Architecture
Business logic is isolated in **15 service files** (3,071 LOC total):
- [frontend/src/lib/services/chatService.ts](frontend/src/lib/services/chatService.ts) (650 LOC) - Chat operations, message processing, artifact extraction
- [frontend/src/lib/services/dashboardService.ts](frontend/src/lib/services/dashboardService.ts) (486 LOC) - Dashboard data fetching, Neo4j queries
- [frontend/src/lib/services/enterpriseService.ts](frontend/src/lib/services/enterpriseService.ts) (604 LOC) - Enterprise data, overlays, status tracking
- [frontend/src/lib/services/authService.ts](frontend/src/lib/services/authService.ts) (173 LOC) - Authentication, token management

**Pattern:** Components never call APIs directly - always through services wrapped in React Query for caching/state management.

### Dual-Backend Proxy Pattern
Frontend proxies different routes to different backends (configured in [frontend/vite.config.ts](frontend/vite.config.ts)):

```
Frontend (port 3000)
├── /api/v1/*               → Backend API (port 8008)     # Supabase/Postgres, Auth, Chat
├── /api/graph/*            → Graph Server (port 3001)    # 3D graph rendering (NOT DB queries)
├── /api/neo4j/*            → Graph Server (port 3001)    # Neo4j queries
├── /api/business-chain/*   → Graph Server (port 3001)    # Business chain queries
├── /api/dashboard/*        → Graph Server (port 3001)    # Dashboard data
└── /api/control-tower/*    → Graph Server (port 3001)    # Control tower data
```

**Critical:** Never call business chains with `/api/v1/dashboard/` prefix - they're always at `/api/business-chain/`.

### Unified Shell Pattern
- **New architecture:** [frontend/src/app/josoor/JosoorShell.tsx](frontend/src/app/josoor/JosoorShell.tsx) serves as main entry point via `/josoor` route
- **Legacy routes:** `/chat` and `/desk/*` maintained for backward compatibility
- **Migration:** Gradual migration from legacy to unified shell

### Artifact System
Chat responses contain "artifacts" (charts, tables, code blocks) that are dynamically rendered:

**Flow:**
```
Backend Response
  → chatService.processMessagePayload()
  → Extract and parse artifacts (JSON datasets, visualization configs)
  → ArtifactDisplay component
  → ChartRenderer (ECharts/Highcharts/Recharts/Mapbox/Force-Graph)
```

**Supported artifact types:**
- Charts: ECharts, Highcharts, Recharts
- Maps: Mapbox GL, Force-Graph (2D/3D)
- Tables: Tabular data with sorting/filtering
- Code blocks: Syntax-highlighted code
- Markdown: Rich text with GFM support

**Key files:**
- [frontend/src/lib/services/chatService.ts](frontend/src/lib/services/chatService.ts) - Artifact extraction logic
- [frontend/src/components/chat/ArtifactDisplay.tsx](frontend/src/components/chat/ArtifactDisplay.tsx) - Artifact rendering
- [frontend/src/components/ui/chart.tsx](frontend/src/components/ui/chart.tsx) - Chart rendering

### Component Organization (129+ components)
```
frontend/src/components/
├── chat/              (22 files) - Chat interface, message bubbles, input
├── desks/             (18 files) - Specialized dashboards (SectorDesk, PlanningDesk, ControlsDesk, etc.)
├── ui/                (49 files) - Radix UI primitives (chart, dialog, alert, button, etc.)
├── dashboards/        (13 files) - Dashboard views (Control Tower, Dependency Desk, Risk Desk)
├── content/           (4 files)  - Content pages
└── layout/            (1 file)   - Layout wrapper
```

**Desks** are specialized dashboard views with domain-specific logic:
- [SectorDesk.tsx](frontend/src/components/desks/SectorDesk.tsx) - Sector-level KPIs and visualizations
- [PlanningDesk.tsx](frontend/src/components/desks/PlanningDesk.tsx) - Strategic planning dashboard
- [ControlsDesk.tsx](frontend/src/components/desks/ControlsDesk.tsx) - Control mechanisms
- [ExplorerDesk.tsx](frontend/src/components/desks/ExplorerDesk.tsx) - Graph data exploration

### State Management
- **Global state:** React Context API ([AuthContext](frontend/src/contexts/AuthContext.tsx), [LanguageContext](frontend/src/contexts/LanguageContext.tsx))
- **Server state:** React Query (TanStack Query v5.90.10)
- **Persistence:** LocalStorage for guest mode support
- **NO Redux**

### Styling System
- **CSS Variables:** 80+ variables defined in [frontend/src/styles/theme.css](frontend/src/styles/theme.css)
- **Component-scoped CSS:** 16 CSS files (chat.css, dashboard.css, admin.css, etc.)
- **Internationalization:** English + Arabic with RTL support
- **NO component libraries** like Material-UI (uses Radix UI primitives instead)

**Theme structure:**
```css
/* Component backgrounds */
--component-bg-primary: #111827
--component-panel-bg: #1F2937

/* Sector colors */
--sector-mining: #d97706
--sector-water: #06b6d4
--sector-energy: #facc15

/* Status colors */
--status-existing: #10b981
--status-construction: #f59e0b
--status-planned: #6366f1
```

### Routing Structure
Defined in [frontend/src/App.tsx](frontend/src/App.tsx):
- `/` - Root redirect (user-aware routing)
- `/landing` - Public landing page
- `/login` - Authentication page
- `/josoor` - **NEW:** Unified shell (main dashboard)
- `/chat` - Legacy pure chat interface
- `/desk/*` - Legacy desk routes (sector, controls, planning, enterprise, reporting, explorer)
- `/admin/*` - Admin interface (providers, A/B testing, monitoring)
- `/builder` - Builder.io integration

## Environment Setup

Create [frontend/.env](frontend/.env) with these required variables:

```env
# Backend API (required)
REACT_APP_API_URL=http://148.230.105.139:8008/api/v1

# Supabase Authentication (required)
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional
REACT_APP_GRAPH_SERVER_URL=http://localhost:3001
```

**Development mode:** Auth can be disabled by setting `AUTH_DISABLED = true` in [frontend/src/App.tsx:23](frontend/src/App.tsx#L23).

## Technology Stack

### Core
- **Framework:** React 19.0.0 + TypeScript 4.9.5
- **Build Tool:** Vite 7.2.2 (primary) with React Scripts 5.0.1 (fallback)
- **Routing:** React Router v6.8.0
- **State Management:** React Context + React Query v5.90.10
- **UI Library:** Radix UI (15+ primitives)
- **Authentication:** Supabase Auth + local JWT

### Visualization
- ECharts, Highcharts, Recharts (charts)
- Mapbox GL, React Map GL (maps)
- Force-Graph (2D/3D network graphs)

### Development
- **TypeScript:** Strict mode disabled
- **Linting:** ESLint
- **Testing:** Jest + React Testing Library
- **CSS:** Native CSS with variables (NO Tailwind)

### Additional Libraries
- React Markdown + Remark GFM (markdown rendering)
- React Hook Form (forms)
- Framer Motion + GSAP (animations)
- jsPDF + html2canvas (PDF export)
- xlsx (Excel export)
- Builder.io React v9.1.0 (content building)

## Services & Ports

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Frontend (Vite) | 3000 | http://localhost:3000 | React development server |
| Backend (FastAPI) | 8008 | http://localhost:8008 | API server (Supabase/Postgres) |
| Graph Server (Express) | 3001 | http://localhost:3001 | Neo4j queries & 3D graph rendering |
| MCP Router (Noor) | 8201 | http://127.0.0.1:8201 | AI persona (staff-level) |
| MCP Router (Maestro) | 8202 | http://127.0.0.1:8202 | AI persona (executive-level) |
| Embeddings Router | 8203 | http://127.0.0.1:8203 | Vector embeddings |
| Neo4j MCP Cypher | 8080 | http://127.0.0.1:8080 | Direct Neo4j access |

**Note:** Backend and graph server run on external VPS by default. MCP routers are backend services.

## Important Gotchas

1. **Port 3000, not 5173** - Vite is configured to use port 3000 (not Vite's default 5173)
2. **Backend on external VPS** - Default backend URL points to `betaBE.aitwintech.com`, not localhost
3. **MCP routers required** - Chat won't work without MCP routers running (started via `./sb.sh` in backend repo)
4. **TypeScript strict mode disabled** - Project allows loose typing
5. **Auth disabled for dev** - Set `AUTH_DISABLED = true` in App.tsx for local development
6. **API routing matters** - Business chains use `/api/business-chain/*`, not `/api/v1/dashboard/*`
7. **Graph rendering vs DB queries** - `/api/graph/*` is for 3D graph rendering; `/api/neo4j/*` is for database queries

## Available Skills
under folder .agent/skills/skills
```json
{"_":"IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any Next.js tasks","address-github-comments":"skills/address-github-comments","agent-evaluation":"skills/agent-evaluation","agent-memory-systems":"skills/agent-memory-systems","agent-tool-builder":"skills/agent-tool-builder","ai-agents-architect":"skills/ai-agents-architect","ai-product":"skills/ai-product","api-patterns":"skills/api-patterns","architecture":"skills/architecture","autonomous-agent-patterns":"skills/autonomous-agent-patterns","autonomous-agents":"skills/autonomous-agents","backend-dev-guidelines":"skills/backend-dev-guidelines","backend-patterns":"skills/cc-skill-backend-patterns","bash-linux":"skills/bash-linux","behavioral-modes":"skills/behavioral-modes","brainstorming":"skills/brainstorming","browser-automation":"skills/browser-automation","clean-code":"skills/clean-code","code-review-checklist":"skills/code-review-checklist","coding-standards":"skills/cc-skill-coding-standards","computer-use-agents":"skills/computer-use-agents","concise-planning":"skills/concise-planning","context-window-management":"skills/context-window-management","conversation-memory":"skills/conversation-memory","crewai":"skills/crewai","d3-viz":"skills/claude-d3js-skill","database-design":"skills/database-design","deployment-procedures":"skills/deployment-procedures","dispatching-parallel-agents":"skills/dispatching-parallel-agents","doc-coauthoring":"skills/doc-coauthoring","docker-expert":"skills/docker-expert","documentation-templates":"skills/documentation-templates","docx":"skills/docx-official","executing-plans":"skills/executing-plans","file-organizer":"skills/file-organizer","finishing-a-development-branch":"skills/finishing-a-development-branch","frontend-design":"skills/frontend-design","frontend-dev-guidelines":"skills/frontend-dev-guidelines","frontend-patterns":"skills/cc-skill-frontend-patterns","git-pushing":"skills/git-pushing","github-workflow-automation":"skills/github-workflow-automation","graphql":"skills/graphql","i18n-localization":"skills/i18n-localization","javascript-mastery":"skills/javascript-mastery","kaizen":"skills/kaizen","langfuse":"skills/langfuse","langgraph":"skills/langgraph","lint-and-validate":"skills/lint-and-validate","llm-app-patterns":"skills/llm-app-patterns","mcp-builder":"skills/mcp-builder","nestjs-expert":"skills/nestjs-expert","nextjs-best-practices":"skills/nextjs-best-practices","nodejs-best-practices":"skills/nodejs-best-practices","parallel-agents":"skills/parallel-agents","pdf":"skills/pdf-official","performance-profiling":"skills/performance-profiling","plan-writing":"skills/plan-writing","planning-with-files":"skills/planning-with-files","playwright-skill":"skills/playwright-skill","powershell-windows":"skills/powershell-windows","pptx":"skills/pptx-official","prisma-expert":"skills/prisma-expert","product-manager-toolkit":"skills/product-manager-toolkit","prompt-caching":"skills/prompt-caching","prompt-engineer":"skills/prompt-engineer","prompt-engineering":"skills/prompt-engineering","prompt-library":"skills/prompt-library","python-patterns":"skills/python-patterns","rag-engineer":"skills/rag-engineer","rag-implementation":"skills/rag-implementation","react-patterns":"skills/react-patterns","react-ui-patterns":"skills/react-ui-patterns","receiving-code-review":"skills/receiving-code-review","requesting-code-review":"skills/requesting-code-review","research-engineer":"skills/research-engineer","security-review":"skills/cc-skill-security-review","senior-architect":"skills/senior-architect","senior-fullstack":"skills/senior-fullstack","software-architecture":"skills/software-architecture","subagent-driven-development":"skills/subagent-driven-development","systematic-debugging":"skills/systematic-debugging","tdd-workflow":"skills/tdd-workflow","test-driven-development":"skills/test-driven-development","test-fixing":"skills/test-fixing","testing-patterns":"skills/testing-patterns","typescript-expert":"skills/typescript-expert","ui-ux-pro-max":"skills/ui-ux-pro-max","using-git-worktrees":"skills/using-git-worktrees","using-superpowers":"skills/using-superpowers","vercel-react-best-practices":"skills/react-best-practices","verification-before-completion":"skills/verification-before-completion","webapp-testing":"skills/webapp-testing","workflow-automation":"skills/workflow-automation","writing-plans":"skills/writing-plans","writing-skills":"skills/writing-skills","xlsx":"skills/xlsx-official"}
```

## Related Documentation

- [00_START_HERE.md](00_START_HERE.md) - Entry point with server management rules
- [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md) - Detailed frontend architecture
- [docs/BACKEND_ARCHITECTURE.md](docs/BACKEND_ARCHITECTURE.md) - Backend architecture
- [docs/SYSTEM_API_CATALOG.md](docs/SYSTEM_API_CATALOG.md) - Complete API reference
- [docs/DATA_ARCHITECTURE.md](docs/DATA_ARCHITECTURE.md) - Database schemas and relationships
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Development rules and constraints
- [.agent/rules/data-rules.md](.agent/rules/data-rules.md) - Data validation requirements

## Development Workflow

1. **Start services:**
   ```bash
   # Frontend only (this repo)
   ./sf1.sh

   # Backend services (separate josoorbe repo)
   ./sb.sh  # Starts backend, graph server, MCP routers
   ```

2. **Access application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8008/api/v1
   - Graph Server: http://localhost:3001/api

3. **Development cycle:**
   ```bash
   npm run dev      # Start Vite dev server
   npm run lint     # Check code quality
   npm test         # Run tests
   npm run build:vite  # Build for production
   ```

4. **Authentication:**
   - Configure Supabase credentials in `.env`
   - Or disable auth with `AUTH_DISABLED = true` in App.tsx

5. **Testing endpoints:**
   - Always test API endpoints before implementing
   - Use browser DevTools Network tab or test scripts in `backend/scripts/`
   - Refer to API catalog for correct endpoint paths
