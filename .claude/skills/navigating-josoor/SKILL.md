---
name: navigating-josoor
description: Primary project guide for the Josoor frontend codebase. Use on every task in this repo — coding, debugging, fetching data, creating components, reviewing PRs, or any development work. Provides orchestrator role, delegation rules, API routing, architecture, CSS/data constraints, key file paths, and project conventions. Triggers on any code change, feature request, bug fix, or question about the Josoor project.
---

# Navigating the Josoor Project

This is the single source of truth for working in this codebase. Read this before doing anything.

## Validation: Is This Skill Up to Date?

Before trusting this documentation, run the validation script:
```bash
node .claude/skills/navigating-josoor/scripts/validate-project-state.js
```
If it reports failures, verify against the actual source files before proceeding.

**Live verification commands:**
```bash
ss -tlnp | grep -E '3000|3001|8008|8080|8201'   # Are services running?
ls frontend/src/services/*.ts                      # What services exist?
head -5 frontend/vite.config.ts                    # Is proxy config still there?
```

When in doubt about any claim in this skill, check the actual file referenced. This skill may lag behind reality.

## What Is Josoor?

See [./josoor-domain-knowledge.md](./josoor-domain-knowledge.md) for the full business context.

**Quick summary:** Josoor (جسور = "bridges") is a **Transformation Intelligence** platform for Saudi government entities. It bridges strategy to execution for Vision 2030 implementation. Target users are vice ministers, strategy directors, PMO managers in KSA public sector.

**Desks** are the main views — each is a specialized workspace:
- **Sector Desk** — sector-level policy tools, value chains, strategic oversight
- **Enterprise Desk** — capability matrix, org structure, maturity assessment
- **Planning Desk** — intervention planning, scenario modeling
- **Controls Desk** — risk oversight, compliance monitoring
- **Reporting Desk** — executive dashboards, KPI reporting

**Noor** is the AI assistant embedded in the platform (chat interface).

## Working with Mosab

- Mosab is non-technical. Use plain language. No jargon.
- He says what he means. Don't over-interpret or add scope.
- He gets frustrated when: you go in circles, assume instead of verify, add unwanted "improvements", fabricate explanations, or ignore his explicit instructions.
- When he says "do it" — just do it. Don't ask clarifying questions.
- When he says "stop" — stop immediately.
- He prefers seeing results over hearing plans.
- Commits only when he asks. Never auto-commit.
- Push only when he says "push".

## Related Skills

| Skill | When to use |
|---|---|
| `arabic-perfection` | Any Arabic content: i18n files, HTML pages, founder letter |
| `ux-writing-arabic` | Arabic UX copy, buttons, labels, error messages |
| `superpowers:subagent-driven-development` | Delegating implementation tasks |
| `superpowers:dispatching-parallel-agents` | Multiple independent tasks |
| `superpowers:systematic-debugging` | Any bug or unexpected behavior |

## Git Workflow

- Work directly on `main` branch (no feature branches typically)
- Commit only when Mosab explicitly asks
- Push only when Mosab explicitly says "push"
- Never use `--no-verify`, `--force`, or `--amend` without asking
- Stage specific files, never `git add -A`
- Commit messages: concise, descriptive, include `Co-Authored-By: Claude Opus 4.6`

## Browser Verification (claude-in-chrome)

When verifying work in the running app:
1. Use `mcp__claude-in-chrome__tabs_context_mcp` first to see current tabs
2. Navigate to `http://localhost:3000` (or existing tab)
3. Check: correct data appears, user flow works, no regressions
4. For Arabic: check RTL layout, text direction, punctuation
5. Take screenshots if needed for Mosab to review
6. Do NOT use Playwright — always use claude-in-chrome

## Role: Orchestrator

You are ORCHESTRATOR + QA. You do NOT write implementation code (>5 lines).

**Workflow for every task:**
1. Understand the requirement. Ask Mosab if unclear.
2. Break into subtasks.
3. Delegate each to a subagent:
   - `model: "haiku"` for routine (styling, simple components, tests)
   - `model: "sonnet"` for complex (architecture, multi-file, business logic)
4. Review each subagent's output against the business requirement.
5. Visually verify in the running app using **claude-in-chrome** (NOT Playwright).
6. Accept or reject. Re-dispatch with specific corrections if rejecting.
7. Integrate accepted work. Commit only when Mosab asks.

**If task is trivial (<5 lines):** Do it directly.
**If something fails twice:** STOP. Explain to Mosab. Ask for guidance.

### Delegation Template

When dispatching a subagent, always include:

> **Task:** [specific description]
> **Files to touch:** [exact paths]
> **Constraints:**
> - CSS variables only (from `frontend/src/styles/theme.css`), no Tailwind
> - No mock/fallback data
> - API routes: [relevant routes]
> - Follow existing patterns in adjacent files
> **Expected output:** [what the result should look like]
> **Do NOT:** [scope boundaries]

### Orchestration Skills

Default to these for task execution:
- `superpowers:subagent-driven-development` — per-task subagent + two-stage review
- `superpowers:dispatching-parallel-agents` — parallel independent tasks
- `superpowers:executing-plans` — plan execution with checkpoints

## Hard Rules

1. **Never assume.** Verify how things work before changing them.
2. **Fails twice = STOP.** Ask Mosab for guidance. No third attempt.
3. **Be concise.** Minimum words, maximum clarity. Mosab is non-technical.
4. **Stay in scope.** Do EXACTLY what was asked. No extras, no refactoring, no "improvements".
5. **Never overwrite files** without checking if they exist first.
6. **Never modify running services** without explicit approval.
7. **Check neo4j-memory MCP first** at the start of every session.
8. **No mock data.** No fallback data. Always real API responses.
9. **No Tailwind.** CSS variables only from `frontend/src/styles/theme.css`.
10. **Verification in running app.** Not just code review.

## Project Architecture

See [./architecture-and-api-reference.md](./architecture-and-api-reference.md) for full details.

### Quick Reference

| What | Where |
|---|---|
| Frontend | `/home/mastersite/development/josoorfe/frontend/` |
| Backend (separate repo) | `/home/mastersite/development/josoorbe/backend/` |
| Theme CSS | `frontend/src/styles/theme.css` |
| i18n files | `frontend/src/i18n/en.json` + `ar.json` |
| Services | `frontend/src/services/` |
| Components | `frontend/src/components/` |
| App shell | `frontend/src/app/josoor/JosoorShell.tsx` |
| Tasks file | `TASKS.md` (project root) |
| API catalogue | `docs/SYSTEM_API_CATALOGUE_V1.5.md` |

### Proxy Routing (vite.config.ts)

```
/api/v1/*               → Backend (port 8008)   — Supabase/Postgres, Auth, Chat
/api/graph/*            → Graph Server (3001)   — 3D graph rendering
/api/neo4j/*            → Graph Server (3001)   — Neo4j queries
/api/business-chain/*   → Graph Server (3001)   — Business chain queries ← PRIMARY DATA SOURCE
/api/dashboard/*        → Graph Server (3001)   — Dashboard data
```

### Business Chains

`GET /api/business-chain/{key}?id={nodeId}&year={year}&analyzeGaps=true`

| Chain Key | What it returns |
|---|---|
| `setting_strategic_initiatives` | Strategy → Policy → Capability priorities → Build portfolio |
| `setting_strategic_priorities` | Performance targets → Capabilities → Operational footprint |
| `build_oversight` | Capabilities → Policy (BUILD risk loop) |
| `operate_oversight` | Risks → Performance (OPERATE risk loop) |
| `integrated_oversight` | Policy/Performance L2 → Capability/Footprint L3 |
| `sector_value_chain` | Policy → Stakeholders → Transactions → KPIs |
| `sustainable_operations` | Process → IT → Vendor |

**Response shape:** `results[0].nodes[]` + `results[0].relationships[]`
Each node: `{ id, elementId, labels: string[], properties: { ... } }`

### Data Patterns

- Components NEVER call APIs directly — always through `frontend/src/services/`
- Use `chainsService.ts` for business chain data (with `fetchChainCached`)
- Use `neo4jMcpService.ts` ONLY when no business chain exists for the data
- Node dedup key: `${label}:${id}:${year}` (id alone is NOT unique across labels)
- All chains fetched with `year=0` (all data), filtered locally by year/quarter

## Tech Stack

- **Framework:** React 18 + TypeScript + Vite 7
- **Styling:** CSS custom properties (oklch) in `theme.css`. NO Tailwind. NO CSS-in-JS.
- **UI Primitives:** Radix UI (`components/ui/`) + Lucide icons
- **State:** React Query v5 + React Context (Auth, Language, Theme)
- **Routing:** React Router v6
- **i18n:** i18next — default language is Arabic. Always support `en` and `ar`.
- **Auth:** Supabase SDK + localStorage tokens
- **Charts:** Recharts, Highcharts, ECharts, D3, react-force-graph
- **Animation:** Framer Motion, GSAP

## Key Files

See [./key-files-and-services.md](./key-files-and-services.md) for the full map.

### Desks (main views)
- `components/desks/SectorDesk.tsx` — Sector Desk orchestrator
- `components/desks/EnterpriseDesk.tsx` — Enterprise Desk
- `components/desks/sector/SectorHeaderNav.tsx` — top nav + policy categories
- `components/desks/sector/PolicyToolsDrawer.tsx` — policy tool cards
- `components/desks/sector/PolicyToolDetailPanel.tsx` — right panel for selected tool

### Services
- `services/chainsService.ts` — chain data + shared cache
- `services/ontologyService.ts` — RAG computation, line health
- `services/enterpriseService.ts` — capability matrix (L1→L2→L3)
- `services/chatService.ts` — LLM calls, streaming, artifacts
- `services/neo4jMcpService.ts` — MCP router (JSON-RPC 2.0)

## Conventions

### RTL Support
- Default language is Arabic. Always support both `en` and `ar`.
- Components use `dir={rtl ? 'rtl' : 'ltr'}` and `lang={lang}`.
- Use `useTranslation()` hook for all user-facing strings.
- Arabic punctuation: ، not , and ؟ not ?
- Never add `letter-spacing` to Arabic text.

### Component Patterns
- Functional components, `.tsx` extension
- Export name matches filename: `SectorDesk.tsx` → `SectorDesk`
- React Query for data: `useQuery({ queryKey, queryFn, staleTime: 5*60*1000 })`
- UI primitives from `components/ui/` — import via `@/components/ui/*`

### Error Handling
- Try-catch in services; re-throw with context
- 401 responses: interceptor handles re-auth
- Inline error messages in UI (not `alert()`)

## Task Tracking

- All tasks in `TASKS.md` (project root)
- Read it at the start of every session
- Append new tasks — never overwrite
- Never create a separate tasks file

## External Systems

See [./external-systems-access.md](./external-systems-access.md) for full connection details.

### Supabase
- Used for: Auth, chat history, user data, config (Postgres)
- Frontend client: `frontend/src/lib/supabaseClient.ts`
- Env vars: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`
- Dashboard: accessible via Supabase CLI or web console
- Edge Functions: deployed for notifications (e.g. `notify-beta-signup`)

### Neo4j (Aura)
- Used for: Ontology data, knowledge graph, all chain data
- Accessed via: Graph Server (port 3001) or MCP routers (8201/8202/8080)
- Frontend never talks to Neo4j directly — always through services
- Schema: SST Ontology (EntityCapability, EntityRisk, SectorPolicyTool, etc.)

### Memory System (neo4j-memory MCP)
- **Always check at session start** using `search_memories` / `read_graph`
- Stores: project context, architecture decisions, key lessons, VPS state
- Server: runs as MCP server, accessible via tool calls
- Auto-memory directory: `/root/.claude/projects/-home-mastersite-development-josoorfe/memory/`
- `MEMORY.md` is auto-loaded into context (keep under 200 lines)

### MCP Routers
| Router | Port | Gateway | Purpose |
|---|---|---|---|
| Noor | 8201 | `/1/mcp/` | Read-only tools + chains (11 tools) |
| Maestro | 8202 | `/2/mcp/` | Read/write tools + chains (11 tools) |
| Embeddings | 8203 | `/3/mcp/` | Vector operations (3 tools) |
| Neo4j Direct | 8080 | `/4/mcp/` | Raw Cypher execution (3 tools) |

### VPS Services (systemd)
| Service | Port | Unit |
|---|---|---|
| Frontend | 3000 | `josoor-frontend.service` |
| Backend | 8008 | `josoor-backend.service` |
| Graph Server | 3001 | `josoor-graph.service` |
| Neo4j MCP | 8080 | `josoor-mcp.service` |
| MCP Router Noor | 8201 | `josoor-router-noor.service` |

## Environment

- You are ON the VPS (148.230.105.139). Never use SSH.
- Backend domain: `betaBE.aitwintech.com`
- Frontend port: 3000, Graph server: 3001, Backend: 8008
- Frontend repo: `/home/mastersite/development/josoorfe/`
- Backend repo: `/home/mastersite/development/josoorbe/` (separate repo)

## Per-Action Safety Rules

See [./action-safety-rules.md](./action-safety-rules.md) for the complete checklist.

**Critical:**
- Before ANY file write: check if target exists first
- When showing file content: paste inline (tool output is not visible to user)
- Don't fabricate explanations. "I don't know" > guessing.
- When user gives a value: use it EXACTLY. Don't substitute.
- Use service's own commands, not raw `kill`.
- `git fetch` + checkout specific files, not blanket `git pull`.
