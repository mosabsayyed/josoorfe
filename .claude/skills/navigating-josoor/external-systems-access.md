# External Systems Access

## Supabase

**Purpose:** Auth, chat history, user data, config storage (Postgres)

**Frontend client:** `frontend/src/lib/supabaseClient.ts`

**Env vars:**
- `REACT_APP_SUPABASE_URL` — Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` — public anon key (safe to expose)

**Key tables:**
- `users_pending` — beta signup form submissions
- `chat_sessions` — chat history
- `chat_messages` — individual messages
- `config` — app configuration

**Edge Functions:**
- `notify-beta-signup` — sends email notification on new signups
- Deployed via Supabase CLI: `supabase functions deploy <name>`
- Secrets set via: `supabase secrets set KEY=VALUE`

**RLS (Row Level Security):**
- `users_pending` has anon INSERT policy for public beta form
- Most other tables require authenticated access

**Access from Claude Code:**
- Use Supabase MCP tools if available
- Or use the Supabase CLI: `supabase` commands
- Dashboard: check Supabase project URL in env

## Neo4j (Aura)

**Purpose:** Ontology data, knowledge graph, all business chain data

**Access paths (frontend never talks to Neo4j directly):**
1. **Business chains** → `GET /api/business-chain/{key}` → Graph Server → Neo4j
2. **MCP tools** → JSON-RPC to routers (8201/8202) → Neo4j
3. **Direct Cypher** → MCP at port 8080 (`/4/mcp/`)
4. **Service layer** → `neo4jMcpService.ts` → MCP router

**Schema (SST Ontology):**
Node labels include: `EntityCapability`, `EntityRisk`, `SectorPolicyTool`, `EntityPerformance`, `EntityStakeholder`, `EntityTransaction`, `OrgUnit`, `ITSystem`, `Process`, `Vendor`, `Project`

**Relationships:** `MONITORED_BY`, `CLOSE_GAPS`, `DELIVERS`, `SUPPORTS`, `MANAGES`, etc.

## Memory System (neo4j-memory MCP)

**CRITICAL: Check at the start of EVERY session.**

**How to use:**
- `search_memories` — search for entities by keyword
- `read_graph` — read the full knowledge graph
- `create_entities` / `add_observations` — store new knowledge
- `create_relations` — link entities together

**What's stored:**
- Project architecture decisions
- Key lessons from past mistakes
- VPS service state and configurations
- Glossary terms (KSA, Josoor-specific)
- Component relationships and data flows

**Auto-memory directory:** `/root/.claude/projects/-home-mastersite-development-josoorfe/memory/`
- `MEMORY.md` — auto-loaded into context (keep under 200 lines)
- `action-reminders.md` — per-action safety checklist
- Other topic files as needed

**When to save to memory:**
- Stable patterns confirmed across multiple interactions
- Architecture decisions and important file paths
- Solutions to recurring problems
- User preferences (Mosab's workflow, communication style)

**When NOT to save:**
- Session-specific context (current task details)
- Speculative conclusions from reading a single file
- Anything that duplicates CLAUDE.md or this skill

## MCP Routers (Detail)

### Noor Router (8201) — Read-Only
**Gateway:** `https://betaBE.aitwintech.com/1/mcp/`
**Local:** `http://localhost:8201/mcp/`
**Systemd:** `josoor-router-noor.service`

**Tools (11):**
1. `recall_memory` — semantic vector search on memory
2. `retrieve_instructions` — load instruction bundles
3. `read_neo4j_cypher` — read-only Cypher (auto-injects LIMIT 200)
4. `search_ksa_facts` — Saudi economic data (77 facts)
5. `sector_value_chain` — sector value chain traversal
6. `setting_strategic_initiatives` — objectives → projects
7. `setting_strategic_priorities` — performance → capabilities
8. `integrated_oversight` — gaps/risks → strategy
9. `build_oversight` — capabilities → policy
10. `operate_oversight` — risks → performance
11. `sustainable_operations` — process → IT → vendor

### Maestro Router (8202) — Read/Write
Same 11 tools as Noor but with write capabilities on Cypher.

### Embeddings Router (8203)
3 tools: `recall_memory`, `retrieve_instructions`, `read_neo4j_cypher`

### Neo4j Direct (8080)
3 tools: `get_neo4j_schema`, `read_neo4j_cypher`, `write_neo4j_cypher`

## VPS Services

**You are ON the VPS. Never use SSH.**

| Service | Port | Systemd Unit | Repo |
|---|---|---|---|
| Frontend (Vite) | 3000 | `josoor-frontend.service` | josoorfe |
| Backend (FastAPI) | 8008 | `josoor-backend.service` | josoorbe |
| Graph Server | 3001 | `josoor-graph.service` | josoorfe |
| Neo4j MCP | 8080 | `josoor-mcp.service` | josoorbe |
| Noor MCP Router | 8201 | `josoor-router-noor.service` | josoorbe |
| Caddy (reverse proxy) | 80, 443 | Docker: `ibnalarab-caddy` | — |

**Managing services:**
```bash
systemctl status josoor-frontend.service
systemctl restart josoor-graph.service
journalctl -u josoor-backend.service -f  # follow logs
```

**Checking ports:**
```bash
ss -tlnp | grep 3000  # check if frontend is listening
```

## Startup Commands

```bash
cd frontend && npm run dev          # Vite dev server (port 3000)
cd frontend && npm run build:vite   # Production build
cd frontend && npm test             # Jest tests
cd frontend && npm run lint         # ESLint
./sf1.sh                            # Start frontend + graph server
```
