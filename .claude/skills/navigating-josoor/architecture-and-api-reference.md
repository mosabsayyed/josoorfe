# Architecture & API Reference

## System Topology

**Primary Domain**: `https://betaBE.aitwintech.com`

| Service | Port | Gateway Path | Responsibility |
|---|---|---|---|
| Backend (FastAPI) | 8008 | `/api/v1/*` | Supabase/Postgres, Auth, Chat |
| Graph Server (Node) | 3001 | `/api/*` | Neo4j, Visualizations, Business Chains |
| Noor MCP Router | 8201 | `/1/mcp/` | Read-only tools + chains (11 tools) |
| Maestro MCP Router | 8202 | `/2/mcp/` | Read/write tools + chains (11 tools) |
| Embeddings Router | 8203 | `/3/mcp/` | Vector operations (3 tools) |
| Neo4j MCP Direct | 8080 | `/4/mcp/` | Raw Cypher execution (3 tools) |

## Frontend Source Layout

```
frontend/src/
├── app/josoor/           # JosoorShell — unified app shell (URL never changes at /josoor)
├── components/
│   ├── desks/            # Main view layer (SectorDesk, EnterpriseDesk, etc.)
│   ├── ui/               # Radix-based design system (button, dialog, tabs, etc.)
│   ├── chat/             # Chat interface (ChatContainer, MessageBubble, ArtifactRenderer)
│   ├── dashboards/       # Executive dashboards (BusinessChains, GraphDashboard)
│   ├── layout/           # Shell, sidebar, header
│   ├── landing/          # Public landing page components
│   └── common/           # Shared components
├── services/             # API layer (one file per domain) — ALL API calls go here
├── contexts/             # React Context providers (Auth, Language, Theme)
├── styles/               # CSS files (theme.css = single source of truth for design tokens)
├── i18n/                 # en.json + ar.json — always keep both in sync
├── types/                # TypeScript type definitions
├── pages/                # Top-level route components
├── lib/                  # Supabase client, API utils
└── utils/                # Helpers (streaming, visualization)
```

## Frontend Routes

| Path | Component | Access |
|---|---|---|
| `/` | WelcomeEntry | Public (redirect-aware) |
| `/landing` | LandingPage | Public |
| `/login` | LoginPage | Public |
| `/josoor` | JosoorShell | Protected (unified shell, URL never changes) |

## JosoorShell Navigation (state-driven, not URL-driven)

Sidebar sections:
- **Desks**: Sector, Controls, Planning, Enterprise, Reporting
- **Content**: Knowledge, Roadmap, Explorer
- **Admin**: Settings, Observability
- **History**: Chat history

## Chain API Format (March 2026)

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
- `chainsService.ts` normalizes into `{ nId, nLabels, nProps, id, labels, properties }` for internal use.

## 7 Business Chains

| Chain Key | Flow |
|---|---|
| `change_to_capability` | Change → Capability |
| `capability_to_policy` | Capability → Policy |
| `capability_to_performance` | Capability → Performance |
| `sector_value_chain` | Policy → Stakeholders → Transactions → KPIs |
| `sustainable_operations` | Process → IT → Vendor |
| `setting_strategic_initiatives` | Strategy → Policy → Capability priorities → Build portfolio |
| `setting_strategic_priorities` | Performance targets → Capabilities → Operational footprint |

All fetched with `year=0` (all data), filtered locally by year/quarter.

## Node Identity (CRITICAL)

Node `id` (e.g. `"1.0"`) is **NOT unique across Neo4j labels**.
`EntityCapability:1.0` and `EntityRisk:1.0` are different nodes.

- **Dedup key:** `${label}:${id}:${year}`
- **Level lookup key:** `${label}:${id}`
- **Any Map/Set keyed by node ID alone MUST include the label**

## RAG Status System

- Colors: `green`, `amber`, `red`, `default`
- **Line RAG thresholds:** green = 0% broken, amber = ≤25% broken, red = >25% broken
- **Building RAG:** Weighted by impact × urgency per node type

## SectorPolicyTool IDs

- IDs 1.0–15.x = policy instruments (counted in line RAG)
- IDs ≥16.0 = physical assets (NEOM, power plants) — excluded from line RAG

## Cumulative Types (carry forward across years)

`capabilities`, `risks`, `policyTools`, `orgUnits`, `itSystems`, `processes`, `performance`, `vendors`, `projects`

## Build Mode Filtering

For IT/Process/Org → Projects lines: only count nodes that are targets of `CLOSE_GAPS` relationships from projects (build-mode nodes).

## MCP Protocol

All MCP endpoints use HTTP transport with JSON-RPC 2.0:

```json
POST /mcp/
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "sector_value_chain",
    "arguments": { "entity_id": "1.0", "year": 2025 }
  }
}
```

**Required Headers:**
```
Content-Type: application/json
Accept: application/json, text/event-stream
```

## MCP Chain Response Constraints

- `row_limit` default 200 (max 500)
- `properties_mode` default 'full'
- Pagination via `page` param, use `has_more` boolean (no `total_count`)
- Auto-inject `LIMIT 200` on `read_neo4j_cypher` (`/1/mcp/` only)

## Environment Variables

```
REACT_APP_API_URL              # Backend base (falls back to /api/v1)
REACT_APP_SUPABASE_URL         # Supabase project URL
REACT_APP_SUPABASE_ANON_KEY    # Supabase anon key (public, safe to expose)
```
