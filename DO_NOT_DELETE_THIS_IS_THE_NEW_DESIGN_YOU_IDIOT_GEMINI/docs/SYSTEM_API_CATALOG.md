# 🧭 JOSOOR System API Catalog & Table of Contents (v1.1)

This document is the **Ground Truth** for all server-side communication in the Josoor ecosystem. It synthesizes architecture from `00_START_HERE.md` with the live implementation in `backend/app/main.py` and `graph-server/routes.ts`.

---

## 1. System Topology (Servers & Ports)

| Service | Port | Description | Primary File |
| :--- | :--- | :--- | :--- |
| **Frontend (React)** | 3000 | Primary User Interface (Vite/React 19) | `frontend/src/App.tsx` |
| **Backend (FastAPI)** | 8008 | Core Logic, Chat, & User Orchestration | `backend/app/main.py` |
| **Graph Server (Express)** | 3001 | High-perf Neo4j Proxy & Viz Sidecar | `graph-server/app.ts` |
| **MCP Router (Noor)** | 8201 | Staff Operations (Portfolio/Program) | `./sb.sh` |
| **MCP Router (Maestro)**| 8202 | Executive Insights (Strategy/Secrets) | `./sb.sh` |
| **Embeddings Router** | 8203 | Semantic Memory Retrieval (Vector DB) | `./sb.sh` |
| **MCP Neo4j Cypher** | 8080 | Deterministic Graph Query Service | `./sb.sh` |

---

## 2. Backend API Catalog (Port 8008)

### 2.1 Chat & Intelligence (`/api/v1/chat`)
- **`POST /message`**: Primary chat entry point.
    - **Req**: `{ query: string, conversation_id?: number, persona?: "noor"|"maestro", history?: list }`
    - **Res**: `ChatResponse` (See UNIFIED_AGENT_CONTRACT.md)
- **`GET /conversations`**: List current user's chat history.
- **`GET /conversations/{id}`**: Get full message thread with metadata/artifacts.

### 2.2 Control Tower (`/api/v1/control-tower`)
- **`GET /lens-b`**: Strategic Outcomes (GDP, Jobs, UX, Security, Regulations).
## 1. System Topology & Ports

| Service | Port | Primary Protocol | Responsibility |
| :--- | :--- | :--- | :--- |
| **Frontend** | 3000 | HTTPS (Browser) | UX, Canvas Rendering, Local State |
| **Backend** | 8008 | REST API | **Supabase/Postgres**, Auth, Orchestration, Observability |
| **Graph Server** | 3001 | REST API | **Neo4j**, Visualization Proxy, Dashboards |
| **Noor MCP** | 8201 | JSON-RPC | **Read-Only** Tools + Business Chains |
| **Maestro MCP** | 8202 | JSON-RPC | **Read/Write** Tools (Secrets/Strategy) |
| **Embeddings Router**| 8203 | JSON-RPC | **Vector Operations** (Semantic Search) |
| **Embeddings Server**| 8204 | HTTP | Low-level OpenAI Embedding Provider |
| **MCP Cypher** | 8080 | HTTP | Direct Neo4j Cypher Execution Server |

---

## 2. Backend (8008) - The Supabase Hub
**Base URL**: `/api/v1/*`

### 2.1 Core Services
| Endpoint | Method | Purpose | Data Source |
| :--- | :--- | :--- | :--- |
| `/chat` | POST | Single-call MCP Orchestration | Orchestrator Logic |
| `/auth/*` | POST | Login, Register, Sync | Supabase `users` |
| `/files/*` | GET/POST | Artifact & Document storage | Supabase Storage |
| `/sync/*` | POST | Ingestion & ETL Triggers | Python Integration Layer |

### 2.2 Dashboards & Control Tower
| Endpoint | Method | Purpose | Data Source |
| :--- | :--- | :--- | :--- |
| `/dashboard/*` | GET | Raw KPI records (Axes 1-8) | `temp_quarterly_*` tables |
| `/control-tower/*` | GET | Direct Lens A / HUD sourcing | Dashboard Tables |

### 2.3 Administration & Observability
| Endpoint | Method | Purpose | Data Source |
| :--- | :--- | :--- | :--- |
| `/admin/settings` | GET/PUT | Global System Config | `admin_settings` table |
| `/observability/user/summary` | GET | Token Usage & Costs | `llm_request_logs` |
| `/observability/providers/*`| GET | Performance Stats | `llm_request_logs` |
| `/debug/traces` | GET | LLM Conversation Traces | `llm_request_logs` |
| `/setup/*` | POST | DB Initialization Tools | SQL Scripts |

### 2.4 Internal Services
| Endpoint | Method | Purpose | Data Source |
| :--- | :--- | :--- | :--- |
| `/embeddings/populate`| POST | Re-index Vector DB | OpenAI -> Neo4j |
| `/embeddings/search` | GET | Semantic Search API | Neo4j Vector Index |
| `/chains/*` | GET/POST | **Business Chain Logic** | Proxies executed by Backend |

---

## 3. Graph Server (3001) - The Visualization Proxy
**Base URL**: `/api/*`
**Ontology Authority**: See [`/docs/Enterprise_Ontology_SST_v1_1.md`](Enterprise_Ontology_SST_v1_1.md) for node/relationship definitions served here.

| Endpoint | Method | Purpose | Underlying Action |
| :--- | :--- | :--- | :--- |
| `/neo4j/schema` | GET | Graph Meta-Knowledge | `CALL db.labels()` |
| `/neo4j/properties` | GET | Available Node Properties | Schema scan |
| `/neo4j/years` | GET | Temporal availability | Neo4j scan |
| `/neo4j/health` | GET | Connection Health Check | Driver connectivity test |
| `/graph` | GET | Core Graph Data (Nodes/Links) | `MATCH (n)-[r]-(m) ...` |
| `/business-chain/counts` | GET | Chain Stats & Level Breakdown | Aggregated counts |
| `/business-chain/diagnostics` | GET | Chain Relationship Health | Check specific rel types |
| `/business-chain/integrity` | GET | Data Integrity (Orphans, Missing Types)| Structural checks |
| `/business-chain/:chainKey` | GET | Exec Verified Chain (e.g., `sector_ops`)| `MATCH ...` (Optimized) |
| `/business-chain/recommendations`| POST | **Proxy to Backend** | Forward to 8008 |
| `/domain-graph/stats` | GET | Risk Desk Health Grid (R/A/G) | Union Query + Logic |
| `/debug/pathtest` | GET | Dependency Knot Debugging | Path finding |
| `/debug/chain` | GET | Business Chain Relationship Debug | Hop analysis |
| `/summary-stream` | GET | SSE for Real-time Updates | Server-Sent Events |

---

## 4. MCP Tools Catalog

### 4.1 Noor Router (Port 8201) - Staff Operations
**Role**: Read-Only / Operational
- **`recall_memory(scope, query_summary, limit)`**: Memory Retrieval.
- **`retrieve_instructions(mode, tier, elements)`**: Prompt Assembly.
- **`read_neo4j_cypher(cypher_query, parameters)`**: Direct Graph Read.
- **`sector_ops`** etc.: All **7 Business Chain Tools** (See Section 4.4).

### 4.2 Maestro Router (Port 8202) - Executive Insights
**Role**: Read/Write / Strategy / Secrets
- **`recall_memory(...)`**: With `secrets` scope access.
- **`retrieve_instructions(...)`**
- **`read_neo4j_cypher(...)`**
*(Note: Does NOT expose Business Chain tools currently)*

### 4.3 Embeddings Router (Port 8203) - Semantic Core
**Role**: Vector Operations (Backend: Port 8204)
- **`generate_embedding(text)`**: Create 1536d vector.
- **`vector_search(query, limit, threshold)`**: Search Neo4j indices.
- **`similarity_query(text, limit)`**: Find similar content.

### 4.4 Business Chain Tools (Noor 8201 Only)
- **`sector_value_chain`, `setting_strategic_initiatives`, `setting_strategic_priorities`, `build_oversight`, `operate_oversight`, `sustainable_operations`, `integrated_oversight`**
  - *Arguments*: `year` (0|"All"|2024..), `id` (str|null), `analyzeGaps` (bool).
  - *Backend*: Proxies to **Graph Server (3001)** via `backend/tools/mcp_wrapper.py`.

---

## 5. Architectural Boundaries & Proxies
1.  **Vite Proxy Protocol**:
    - `/api/v1/*` → Backend (8008)
    - `/api/neo4j/*`, `/api/graph`, `/api/business-chain/*`, `/api/domain-graph/*` → Graph Server (3001)
2.  **Display Aggregation**: The Graph Server (3001) is the "Display Master". It often fetches raw data from 8008, processes it for specific HUD layouts, and returns a unified JSON.
3.  **Supabase Lock**: No direct Supabase calls from 3001 or Frontend. All Postgres access MUST pass through 8008.
