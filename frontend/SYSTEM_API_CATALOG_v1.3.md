# 🧭 JOSOOR System API Catalog & Table of Contents (v1.3)

This document is the **Ground Truth** for all server-side communication in the Josoor ecosystem. All frontend calls MUST adhere to these paths and parameter requirements.

---

## 1. System Topology (One Backend Gateway)

**Primary Domain**: `https://betaBE.aitwintech.com`

| Service | Protocol | Gateway Path | Responsibility |
| :--- | :--- | :--- | :--- |
| **Backend (8008)** | HTTPS | `/api/v1/*` | **Supabase/Postgres**, Auth, Chat, Tabular Data |
| **Graph Server (3001)**| HTTPS | `/api/*` | **Neo4j**, All Graph Visualizations, Business Chains |
| **Noor MCP (8201)** | JSON-RPC | `/1/mcp/` | **Read-Only** Tools + Chains (Agent Use) |
| **Maestro MCP (8202)** | JSON-RPC | `/2/mcp/` | **Read/Write** Tools (Agent Use) |
| **Embeddings (8203)** | JSON-RPC | `/3/mcp/` | **Vector Operations** (Agent Use) |
| **Neo4j MCP (8080)** | JSON-RPC | `/4/mcp/` | Direct Cypher Execution (Agent Use) |

---

## 2. Graph & Visualization API (Port 3001)
**Base URL**: `https://betaBE.aitwintech.com/api`

### 2.1 Core Graph Data (`/graph`)
*   **Method**: `GET`
*   **Purpose**: Fetch raw nodes/links for custom canvas rendering.
*   **CRITICAL**: You MUST provide at least `nodeLabels`. If empty, the server returns an empty graph.
*   **Parameters**:
    *   `nodeLabels`: (Required) Comma-separated (e.g., `SectorObjective,EntityProject`).
    *   `years`: (Optional) Comma-separated (e.g., `2025,2026`).
    *   `relationships`: (Optional) Comma-separated list of types.
    *   `analyzeGaps`: (Optional) `true` to inject semantic gaps.
*   **Example**: `GET /api/graph?nodeLabels=SectorObjective,EntityCapability&years=2025`

### 2.2 Verified Business Chains (`/business-chain/*`)
*   **Method**: `GET`
*   **Purpose**: Execute deterministic industry-standard value chain queries.
*   **Supported Keys**: `sector_value_chain`, `setting_strategic_initiatives`, `setting_strategic_priorities`, `build_oversight`, `operate_oversight`, `sustainable_operations`, `integrated_oversight`, `aggregate`.
*   **Parameters**:
    *   `year`: (Optional) Filter by fiscal year (default: current).
    *   `id`: (Optional) Start chain from a specific node ID.
    *   `analyzeGaps`: (Optional) `true` for Diagnostic mode (Red/Amber/Green), `false` for Narrative.
*   **Example**: `GET /api/business-chain/sector_value_chain?year=2025&analyzeGaps=true`

### 2.3 Graph Utilities
| Endpoint | Method | Result |
| :--- | :--- | :--- |
| `/neo4j/health` | GET | `{"status": "connected"}` |
| `/neo4j/schema` | GET | List of all Labels and Relationship Types in DB. |
| `/neo4j/years` | GET | List of all years currently containing data. |
| `/business-chain/counts` | GET | Aggregated counts for R/A/G HUDs. |
| `/business-chain/integrity` | GET | Structural analysis (Orphans, Missing rels). |
| `/domain-graph/stats` | GET | High-level health grid data. |
| `/summary-stream` | GET | SSE stream for real-time analysis logs. |

---

## 3. Tabular & Logic API (Port 8008)
**Base URL**: `https://betaBE.aitwintech.com/api/v1`

### 3.1 Dashboard Data (Tables)
*   **`GET /dashboard/dashboard-data`**: Main source for KPI tables.
    *   `quarter_filter`: (e.g., "Q4 2025")
*   **`GET /dashboard/outcomes-data`**: Strategic outcome records.
*   **`GET /dashboard/investment-initiatives`**: Project budget/investment lists.

### 3.2 Chat & Conversations
*   **`POST /chat/message`**: Send a message to the AI agent.
*   **`GET /chat/conversations`**: Retrieve history thread list.

---

## 4. Integration Best Practices
1.  **Avoid 404s**: Never call business chains using the `/api/v1/dashboard/` prefix. Chains are always at `/api/business-chain/`.
2.  **Trailing Slashes**: The Gateway is configured to be flexible, but prefer using trailing slashes for MCP endpoints (e.g., `/1/mcp/`) to ensure protocol compliance.
3.  **Authentication**: All requests from unknown origins must include the `Authorization: Bearer <token>` header if auth is enabled.
4.  **Error Handling**: If a graph call returns `nodes: [], links: []`, check your `nodeLabels` parameter.
