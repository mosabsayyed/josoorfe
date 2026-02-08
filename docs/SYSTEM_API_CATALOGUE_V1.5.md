# 🧭 JOSOOR System API Catalog & Table of Contents (v1.5)

This document is the **Ground Truth** for all server-side communication in the Josoor ecosystem. All frontend calls MUST adhere to these paths and parameter requirements.

**Last Verified:** 2026-01-27  
**Status:** ✅ All endpoints operational and tested  
**Frontend Integration:** See Section 3 for complete call requirements and response parsing

**Recent Updates (2026-01-27):**
- **NEW** Added `search_ksa_facts` MCP tool to Noor (11 tools) and Maestro (4 tools) routers
- **NEW** Added KSA Facts API endpoints (GET /api/v1/ksa-facts/search, /categories, /{id})
- 77 pre-extracted Saudi economic facts from NotebookLM/Gemini now searchable via semantic search

**Recent Fixes (2026-01-16):**
- Fixed Graph Server Cypher syntax error (double bracket in relationship filter)
- Fixed Graph Server validation to allow queries with only relationship types (no node labels required)
- Updated josoor-graph.service to run as root user (mastersite user does not exist)
- Removed inefficient dynamic imports in routes.ts (6 instances)

---

## 1. System Topology (One Backend Gateway)

**Primary Domain**: `https://betaBE.aitwintech.com`

| Service | Protocol | Gateway Path | Local Port | Responsibility | Tool Count |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend (8008)** | HTTPS | `/api/v1/*` | 8008 | **Supabase/Postgres**, Auth, Chat, Tabular Data | N/A |
| **Graph Server (3001)**| HTTPS | `/api/*` | 3001 | **Neo4j**, All Graph Visualizations, Business Chains | N/A |
| **Noor MCP (8201)** | HTTP/JSON-RPC | `/1/mcp/` | 8201 | **Read-Only** Tools + Business Chains + KSA Facts (Agent Use) | 11 tools |
| **Maestro MCP (8202)** | HTTP/JSON-RPC | `/2/mcp/` | 8202 | **Read/Write** Core Tools + KSA Facts + Business Chains (Agent Use) | 11 tools |
| **Embeddings (8203)** | HTTP/JSON-RPC | `/3/mcp/` | 8203 | **Vector Operations** (Agent Use) | 3 tools |
| **Neo4j MCP (8080)** | HTTP/JSON-RPC | `/4/mcp/` | 8080 | Direct Cypher Execution (Agent Use) | 3 tools |

### Important Protocol Notes:
- **All MCP endpoints use HTTP transport** with JSON-RPC 2.0 protocol over POST requests
- **Accept Header Required:** `Accept: application/json, text/event-stream`
- **Content-Type:** `application/json`
- **MCP Standard Call Format:**
  ```json
  POST /mcp/
  {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
  ```

---

## 2. MCP Router Tools Catalog (Verified 2026-01-16)

### 2.1 Endpoint 1: Noor Router (8201) - Read-Only + Business Chains
**Gateway:** `https://betaBE.aitwintech.com/1/mcp/`  
**Local:** `http://localhost:8201/mcp/`  
**Config:** `/home/mastersite/development/josoorbe/backend/mcp-server/servers/mcp-router/router_config.yaml`  
**Systemd:** `josoor-router-noor.service`  
**Backend:** `local-backend-wrapper` → `/home/mastersite/development/josoorbe/backend/tools/mcp_wrapper.py`

**Tools (11):**
1. `recall_memory` - Search personal/project memory using semantic vector search
2. `retrieve_instructions` - Load instruction bundles based on interaction mode
3. `read_neo4j_cypher` - Execute Cypher query against Neo4j knowledge graph (READ-ONLY)
4. `search_ksa_facts` - **NEW** KSA ECONOMIC DATA: Search Saudi economic facts (unemployment, FDI, GDP, Vision 2030)
5. `sector_value_chain` - STRATEGIC VIEW: Trace High-Level Sector Value Chain
6. `setting_strategic_initiatives` - TACTICAL PLANNING: Objectives → Projects
7. `setting_strategic_priorities` - CAPABILITY BUILDING: Performance → Capabilities
8. `integrated_oversight` - STRATEGIC FEEDBACK LOOP: Gaps/Risks → Strategy
9. `build_oversight` - COMPLIANCE OVERSIGHT: Capabilities → Policy
10. `operate_oversight` - PERFORMANCE OVERSIGHT: Risks → Performance
11. `sustainable_operations` - OPERATIONAL EFFICIENCY: Process → IT → Vendor

### 2.2 Endpoint 2: Maestro Router (8202) - Read/Write Core Tools
**Gateway:** `https://betaBE.aitwintech.com/2/mcp/`  
**Local:** `http://localhost:8202/mcp/`  
**Config:** `/home/mastersite/development/josoorbe/backend/mcp-server/servers/mcp-router/maestro_router_config.yaml`  
**Systemd:** `josoor-router-maestro.service`  
**Backend:** `local-backend-wrapper` → `/home/mastersite/development/josoorbe/backend/tools/mcp_wrapper_maestro.py`

**Tools (11):**
1. `recall_memory` - Search memory (C-suite scopes accessible)
2. `retrieve_instructions` - Load instruction bundles
3. `read_neo4j_cypher` - Execute Cypher query (READ/WRITE capabilities)
4. `search_ksa_facts` - **NEW** KSA ECONOMIC DATA: Search Saudi economic facts (unemployment, FDI, GDP, Vision 2030)
5. `sector_value_chain` - STRATEGIC VIEW: Trace High-Level Sector Value Chain
6. `setting_strategic_initiatives` - TACTICAL PLANNING: Objectives → Projects
7. `setting_strategic_priorities` - CAPABILITY BUILDING: Performance → Capabilities
8. `integrated_oversight` - STRATEGIC FEEDBACK LOOP: Gaps/Risks → Strategy
9. `build_oversight` - COMPLIANCE OVERSIGHT: Capabilities → Policy
10. `operate_oversight` - PERFORMANCE OVERSIGHT: Risks → Performance
11. `sustainable_operations` - OPERATIONAL EFFICIENCY: Process → IT → Vendor

**Note:** Maestro uses the same server code as Noor, so it inherits all business chain tools despite the config file only defining core tools.

### 2.3 Endpoint 3: Embeddings Router (8203) - Vector Operations
**Gateway:** `https://betaBE.aitwintech.com/3/mcp/`  
**Local:** `http://localhost:8203/mcp/`  
**Config:** `/home/mastersite/development/josoorbe/backend/mcp-server/servers/mcp-router/embeddings_router_config.yaml`  
**Systemd:** `josoor-router-embeddings.service`  
**Backend:** `embedding-service` → `http://127.0.0.1:8204/mcp/` (Embeddings Server)

**Tools (3):**
1. `recall_memory` - Search memory using vector search
2. `retrieve_instructions` - Load instruction bundles
3. `read_neo4j_cypher` - Execute Cypher queries

**Note:** This router was FIXED on 2026-01-16. Previously had 10 tools due to auto-injection bug in router code. Now correctly exposes only configured tools.

### 2.5 MCP Tool Detail: `search_ksa_facts`
**Available On:** Noor (8201), Maestro (8202)
**Added:** 2026-01-27
**Purpose:** Fast semantic search for pre-extracted Saudi Arabian economic data

**Tool Description (for Agent Prompts):**
> KSA ECONOMIC DATA. Search pre-extracted Saudi Arabian economic facts and statistics from official sources (GASTAT, Vision 2030, etc.). Covers unemployment, jobs creation, FDI, GDP, trade balance, non-oil exports, and Vision 2030 targets. Data period: 2023-2030.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Natural language search query about Saudi economic data. Examples: 'What is the unemployment rate?', 'Show FDI inflows for 2024', 'Vision 2030 employment targets'"
    },
    "category": {
      "type": "string",
      "enum": ["UNEMPLOYMENT", "JOBS_CREATION", "EMPLOYMENT", "FDI", "LOCAL_INVESTMENT", "TRADE_BALANCE", "NON_OIL_EXPORTS", "GDP", "VISION_2030", "REGIONAL"],
      "description": "Narrow search to a specific category. Omit to search all categories."
    },
    "threshold": {
      "type": "number",
      "minimum": 0.0,
      "maximum": 1.0,
      "default": 0.4,
      "description": "Minimum similarity score (0.0-1.0). Use 0.4 for broad results, 0.7+ for high precision."
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50,
      "default": 10,
      "description": "Maximum number of facts to return (1-50). Use lower values (3-5) for focused answers, higher (10-20) for comprehensive research."
    }
  },
  "required": ["query"]
}
```

**Example MCP Tool Call:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_ksa_facts",
    "arguments": {
      "query": "What are the FDI inflows for 2024?",
      "category": "FDI",
      "limit": 5
    }
  }
}
```

**Response Format:**
```json
{
  "query": "What are the FDI inflows for 2024?",
  "results": [
    {
      "id": "fdi_2",
      "question": "What were the FDI inflows in 2024?",
      "answer": "Saudi Arabia attracted $26 billion in FDI inflows in 2024, exceeding the target of $25 billion...",
      "category": "FDI",
      "topics": ["FDI", "investment", "2024"],
      "similarity_score": 0.9124,
      "relevance": "EXCELLENT"
    }
  ],
  "total_found": 1,
  "search_time_ms": 148.5
}
```

**Use Cases:**
- "What is the Saudi unemployment rate?" → Returns UNEMPLOYMENT facts
- "Show me Vision 2030 targets" → Returns VISION_2030 facts
- "How much FDI did Saudi attract in 2024?" → Returns FDI facts
- "What is the GDP growth forecast?" → Returns GDP facts

**Data Coverage (77 facts total):**
| Category | Count | Sample Topics |
| :--- | :--- | :--- |
| VISION_2030 | 9 | Program pillars, targets, progress |
| JOBS_CREATION | 8 | Annual job creation, Saudization |
| EMPLOYMENT | 8 | Labor force participation, sector breakdown |
| FDI | 8 | Inflows by year, targets, comparisons |
| LOCAL_INVESTMENT | 8 | PIF, domestic investment, megaprojects |
| GDP | 8 | Growth rates, forecasts, sector contributions |
| UNEMPLOYMENT | 7 | National rates, trends, targets |
| TRADE_BALANCE | 7 | Surplus/deficit, oil vs non-oil |
| NON_OIL_EXPORTS | 7 | Export values, growth rates |
| REGIONAL | 7 | Regional economic indicators (limited) |

### 2.6 Endpoint 4: Neo4j MCP Direct (8080) - Cypher Execution
**Gateway:** `https://betaBE.aitwintech.com/4/mcp/`  
**Local:** `http://localhost:8080/mcp/`  
**Binary:** `/home/mastersite/development/josoorbe/backend/mcp-server/.venv/bin/mcp-neo4j-cypher`  
**Systemd:** `josoor-mcp.service`  
**Transport:** `--transport http` (CRITICAL: Must be HTTP, not SSE)

**Tools (3):**
1. `get_neo4j_schema` - Retrieve Neo4j database schema using APOC
2. `read_neo4j_cypher` - Execute read-only Cypher queries
3. `write_neo4j_cypher` - Execute write Cypher queries (if enabled with `--read-only false`)

**Critical Configuration:**
```bash
ExecStart=/home/mastersite/development/josoorbe/backend/mcp-server/.venv/bin/mcp-neo4j-cypher \
  --transport http \
  --server-host 0.0.0.0 \
  --server-port 8080 \
  --server-path /mcp/ \
  --allowed-hosts betaBE.aitwintech.com,localhost,127.0.0.1 \
  --allow-origins https://betaBE.aitwintech.com
```

**Fixed on 2026-01-16:** Changed from `sse` to `http` transport for JSON-RPC compatibility.

---

## 3. Frontend Integration Guide

### 3.1 MCP Endpoint Call Requirements

**CRITICAL:** All MCP endpoints require specific headers to work correctly.

**Required Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Accept": "application/json, text/event-stream"
}
```

**Why Both Accept Types?**
- The MCP servers use HTTP transport but wrap responses in SSE format
- Without `text/event-stream`, you'll get HTTP 406 "Not Acceptable" errors
- Responses come wrapped in `event: message` and `data:` fields

### 3.2 Response Format

**All MCP responses follow SSE format:**
```
event: message
data: {"jsonrpc":"2.0","id":1,"result":{...}}
```

**Frontend must parse:**
1. Split by `\n` to get lines
2. Find line starting with `data: `
3. Extract JSON after `data: ` prefix
4. Parse the JSON

**Example parsing:**
```javascript
const response = await fetch('https://betaBE.aitwintech.com/1/mcp/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  })
});

const text = await response.text();
const lines = text.split('\n');
const dataLine = lines.find(line => line.startsWith('data: '));
const jsonData = JSON.parse(dataLine.substring(6)); // Remove "data: " prefix
```

### 3.3 MCP Standard Methods

**Method: `tools/list`**
- Lists all available tools on the endpoint
- No parameters required
- Returns: `{tools: [{name, description, inputSchema, ...}]}`

**Method: `tools/call`**
- Executes a specific tool
- Parameters: `{name: string, arguments: object}`
- Returns: `{content: [{type, text}], isError: boolean}`

**Example Tool Call:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "read_neo4j_cypher",
    "arguments": {
      "query": "MATCH (n) RETURN count(n) as total"
    }
  }
}
```

**Response Structure:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"data\": [{\"total\": 10446}], \"warnings\": [], \"notifications\": [], \"counters\": {}}"
      }
    ],
    "isError": false
  }
}
```

### 3.4 Which Endpoint to Use?

**For AI Agent Integrations:**
- **Endpoint 1 (Noor)**: Use for read-only operations with business chain access
- **Endpoint 2 (Maestro)**: Use for admin/write operations (C-suite access)
- **Endpoint 3 (Embeddings)**: Use for vector search operations
- **Endpoint 4 (Neo4j MCP)**: Use for direct Cypher queries (when you need schema introspection)

**For Direct Backend/Graph Calls (Non-MCP):**
- Use `/api/v1/*` for Supabase/Postgres data
- Use `/api/business-chain/*` for business chain visualizations
- Use `/api/neo4j/*` for Neo4j health/status and cypher calls
- Use `/api/graph*` for graph visualizations

### 3.5 Error Handling

**Common HTTP Errors:**
- `405 Method Not Allowed`: Server transport is SSE-only (should not happen in v1.4)
- `406 Not Acceptable`: Missing `text/event-stream` in Accept header
- `500 Internal Server Error`: Tool execution failed, check result.isError

**JSON-RPC Errors:**
```json
{
  "jsonrpc": "2.0",
  "id": "server-error",
  "error": {
    "code": -32600,
    "message": "Not Acceptable: Client must accept both application/json and text/event-stream"
  }
}
```

**Frontend should check:**
1. HTTP status code (expect 200)
2. Parse SSE format correctly
3. Check `result.isError` for tool execution errors
4. Handle JSON-RPC `error` field if present

---

## 4. Caddy Gateway Configuration

**Location:** `/opt/ibnalarab/Caddyfile`  
**Last Updated:** 2026-01-16

```caddyfile
{
	email admin@miles.click
}
betaBE.aitwintech.com {
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
		X-Content-Type-Options "nosniff"
		X-Frame-Options "DENY"
		Referrer-Policy "strict-origin-when-cross-origin"
		X-XSS-Protection "1; mode=block"
	}
	reverse_proxy /api/v1/* http://172.17.0.1:8008
	handle /api/graph* {
		reverse_proxy http://172.17.0.1:3001
	}
	reverse_proxy /api/business-chain/* http://172.17.0.1:3001
	reverse_proxy /api/neo4j/* http://172.17.0.1:3001
	reverse_proxy /api/domain-graph/* http://172.17.0.1:3001
	reverse_proxy /api/summary-stream http://172.17.0.1:3001 {
		flush_interval -1
	}
	reverse_proxy /api/debug/* http://172.17.0.1:3001
	handle_path /1/mcp/* {
		rewrite * /mcp{path}
		reverse_proxy http://172.17.0.1:8201
	}
	handle_path /2/mcp/* {
		rewrite * /mcp{path}
		reverse_proxy http://172.17.0.1:8202
	}
	handle_path /3/mcp/* {
		rewrite * /mcp{path}
		reverse_proxy http://172.17.0.1:8203
	}
	handle_path /4/mcp/* {
		rewrite * /mcp{path}
		reverse_proxy http://172.17.0.1:8080
	}
	respond / "{\"status\": \"online\", \"service\": \"JOSOOR Gateway\"}" 200
}
```

**Reload Command:** `docker exec ibnalarab-caddy caddy reload --config /etc/caddy/Caddyfile`

---

## 4. Systemd Service Locations

| Service | File Path | Purpose |
|---------|-----------|---------|
| Graph Server | `/etc/systemd/system/josoor-graph.service` | Graph visualizations port 3001 |
| Noor Router | `/etc/systemd/system/josoor-router-noor.service` | MCP Router port 8201 |
| Maestro Router | `/etc/systemd/system/josoor-router-maestro.service` | MCP Router port 8202 |
| Embeddings Router | `/etc/systemd/system/josoor-router-embeddings.service` | MCP Router port 8203 |
| Neo4j MCP | `/etc/systemd/system/josoor-mcp.service` | Neo4j Cypher MCP port 8080 |

**Management Commands:**
```bash
# Reload after config changes
systemctl daemon-reload

# Restart a single service
systemctl restart josoor-graph
systemctl restart josoor-router-noor

# Restart multiple services (e.g., all routers)
systemctl restart josoor-router-noor josoor-router-maestro josoor-router-embeddings josoor-mcp

# Restart ALL josoor services (full stack)
systemctl restart josoor-*.service

# Check status
systemctl status josoor-graph --no-pager -l
systemctl status josoor-router-noor --no-pager -l
```

---

## 5. Router Code Architecture

**Router Implementation:** `/home/mastersite/development/josoorbe/backend/mcp-server/servers/mcp-router/src/mcp_router/server.py`

**Critical Fix Applied 2026-01-16:**
- **Issue:** Router was auto-injecting all business chain tools into ALL routers, ignoring config
- **Fix:** Modified chain registration to only include tools explicitly defined in each router's YAML config
- **Lines Changed:** 183-207 in server.py
- **Behavior:** Each router now exposes ONLY the tools declared in its config file

**Config Detection Logic:**
```python
# Only register chains if config explicitly defines them
chain_tools_in_config = [
    t['name'] for t in tools_config 
    if 'parameters' in t and any(p in t.get('parameters', {}) for p in ['year', 'analyzeGaps', 'row_limit'])
]
```

---

## 6. Graph & Visualization API (Port 3001)
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
*   **Purpose**: Execute deterministic industry-standard value chain queries **stored in Supabase `chain_queries` table**.
*   **Query Source**: Backend fetches from Supabase at `/api/v1/chains/query/{chain_key}`, graph server executes against Neo4j.
*   **Supported Keys**: `sector_value_chain`, `setting_strategic_initiatives`, `setting_strategic_priorities`, `build_oversight`, `operate_oversight`, `sustainable_operations`, `integrated_oversight`, `aggregate`.
*   **Parameters**:
    *   `year`: (Optional) Filter by fiscal year (default: 0 = all years).
    *   `id`: (Optional) Start chain from a specific node ID.
    *   `quarter`: (Optional) Filter by quarter (1-4).
    *   `analyzeGaps`: (Optional) `true` for Diagnostic mode (Red/Amber/Green), `false` for Narrative.
*   **Example**: `GET /api/business-chain/sector_value_chain?year=2025&analyzeGaps=true`
*   **Data Requirements**: Query may return empty results if Neo4j data doesn't form complete chain paths for the specified year/quarter.

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

### 3.3 KSA Economic Facts API (NEW - 2026-01-27)
**Purpose**: Fast semantic search for pre-extracted Saudi Arabian economic data from NotebookLM/Gemini.
**Data Source**: Official government sources (GASTAT, Vision 2030, Ministry of Investment)
**Data Period**: 2023-2030 (actuals + targets)
**Performance**: ~150ms average response time

#### `GET /ksa-facts/search`
Semantic search across 77 pre-extracted economic facts.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `q` | string | ✅ Yes | - | Natural language search query (min 1 char) |
| `category` | string | No | - | Filter by category (see list below) |
| `threshold` | float | No | 0.4 | Minimum similarity score (0.0-1.0) |
| `limit` | int | No | 10 | Maximum results (1-50) |

**Available Categories:**
- `UNEMPLOYMENT` - Unemployment rates, trends, targets (national level)
- `JOBS_CREATION` - Job creation figures and annual targets
- `EMPLOYMENT` - Employment figures, labor force participation
- `FDI` - Foreign Direct Investment inflows and targets
- `LOCAL_INVESTMENT` - Domestic investment and PIF data
- `TRADE_BALANCE` - Trade surplus/deficit figures
- `NON_OIL_EXPORTS` - Non-oil export values and growth
- `GDP` - Gross Domestic Product figures and growth rates
- `VISION_2030` - Vision 2030 program targets and progress
- `REGIONAL` - Regional economic indicators (limited data)

**Example Request:**
```bash
curl "https://betaBE.aitwintech.com/api/v1/ksa-facts/search?q=unemployment%20rate%202024&category=UNEMPLOYMENT&limit=5"
```

**Example Response:**
```json
{
  "query": "unemployment rate 2024",
  "results": [
    {
      "id": "unemployment_1",
      "question": "What is the current unemployment rate in Saudi Arabia?",
      "answer": "The unemployment rate in Saudi Arabia was 7.6% in Q1 2024, decreasing from 8.3% in Q1 2023...",
      "category": "UNEMPLOYMENT",
      "topics": ["unemployment", "labor market", "2024"],
      "similarity_score": 0.8742,
      "relevance": "EXCELLENT"
    }
  ],
  "total_found": 1,
  "search_time_ms": 142.35
}
```

**Relevance Categories:**
- `EXCELLENT`: score ≥ 0.8
- `GOOD`: score ≥ 0.6
- `OKAY`: score ≥ 0.4
- `POOR`: score < 0.4

#### `GET /ksa-facts/categories`
List all available fact categories with counts.

**Example Response:**
```json
{
  "categories": [
    {"name": "VISION_2030", "count": 9},
    {"name": "JOBS_CREATION", "count": 8},
    {"name": "EMPLOYMENT", "count": 8},
    {"name": "FDI", "count": 8},
    {"name": "LOCAL_INVESTMENT", "count": 8},
    {"name": "GDP", "count": 8},
    {"name": "UNEMPLOYMENT", "count": 7},
    {"name": "TRADE_BALANCE", "count": 7},
    {"name": "NON_OIL_EXPORTS", "count": 7},
    {"name": "REGIONAL", "count": 7}
  ],
  "total_facts": 77
}
```

#### `GET /ksa-facts/{fact_id}`
Retrieve a specific fact by ID.

**Path Parameters:**
- `fact_id` (string): The unique identifier of the fact (e.g., "unemployment_1")

**Example Response:**
```json
{
  "id": "unemployment_1",
  "question": "What is the current unemployment rate in Saudi Arabia?",
  "answer": "The unemployment rate in Saudi Arabia was 7.6% in Q1 2024...",
  "category": "UNEMPLOYMENT",
  "topics": ["unemployment", "labor market", "2024"],
  "source": "NotebookLM/Gemini extraction",
  "extracted_at": "2026-01-27T14:30:00"
}
```

---

## 7. Verification & Testing

### 7.1 Quick Health Check (All Endpoints)
```bash
# Test all 4 MCP endpoints
printf "\n=== MCP ENDPOINTS TEST ===\n\n" && \
printf "1. Noor (8201): " && curl -s -X POST https://betaBE.aitwintech.com/1/mcp/ \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | grep -o '"name":"[^"]*"' | wc -l && \
printf "2. Maestro (8202): " && curl -s -X POST https://betaBE.aitwintech.com/2/mcp/ \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}' | grep -o '"name":"[^"]*"' | wc -l && \
printf "3. Embeddings (8203): " && curl -s -X POST https://betaBE.aitwintech.com/3/mcp/ \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "id": 3, "method": "tools/list"}' | grep -o '"name":"[^"]*"' | wc -l && \
printf "4. Neo4j MCP (8080): " && curl -s -X POST https://betaBE.aitwintech.com/4/mcp/ \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "id": 4, "method": "tools/list"}' | grep -o '"name":"[^"]*"' | wc -l
```

**Expected Output:**
```
=== MCP ENDPOINTS TEST ===

1. Noor (8201): 11
2. Maestro (8202): 11
3. Embeddings (8203): 3
4. Neo4j MCP (8080): 3
```

### 7.2 List Tool Names
```bash
# Endpoint 1 - Noor Router
curl -s -X POST https://betaBE.aitwintech.com/1/mcp/ \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | grep -o '"name":"[^"]*"'

# Endpoint 4 - Neo4j MCP
curl -s -X POST https://betaBE.aitwintech.com/4/mcp/ \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "id": 4, "method": "tools/list"}' | grep -o '"name":"[^"]*"'
```

### 7.3 Service Status Check
```bash
# Check all MCP services
systemctl status josoor-router-noor --no-pager | grep Active
systemctl status josoor-router-maestro --no-pager | grep Active
systemctl status josoor-router-embeddings --no-pager | grep Active
systemctl status josoor-mcp --no-pager | grep Active
```

### 7.4 Port Verification
```bash
# Verify all ports are listening
ss -tlnp | grep -E ":(8080|8201|8202|8203|8204)\s"
```

**Expected Output:**
```
LISTEN 0 2048 0.0.0.0:8080  users:(("mcp-neo4j-cyphe",pid=...))
LISTEN 0 2048 0.0.0.0:8201  users:(("python",pid=...))
LISTEN 0 2048 0.0.0.0:8202  users:(("python",pid=...))
LISTEN 0 2048 0.0.0.0:8203  users:(("python",pid=...))
LISTEN 0 2048 0.0.0.0:8204  users:(("python",pid=...))
```

---

## 8. Troubleshooting Guide

### 8.1 Common Issues

**Issue:** Graph endpoint returns syntax error "Invalid input '['"
- **Cause:** Cypher query building double brackets in relationship filter `[r:[TYPE|...]]`
- **Fix:** Updated neo4j.ts line 924 to use `:TYPE|...` instead of `:[TYPE|...]`
- **Fixed:** 2026-01-16

**Issue:** Graph returns empty nodes/links when only relationshipTypes provided
- **Cause:** Validation incorrectly rejected queries without nodeLabels
- **Fix:** Removed validation check on line 896 of neo4j.ts
- **Fixed:** 2026-01-16

**Issue:** Systemd service hangs on restart
- **Cause:** Service configured to run as non-existent 'mastersite' user
- **Fix:** Updated josoor-graph.service to use `User=root`
- **Fixed:** 2026-01-16

**Issue:** Endpoint returns "Method Not Allowed" (HTTP 405)
- **Cause:** Server using SSE transport instead of HTTP
- **Fix:** Check systemd service file, ensure `--transport http`
- **Verify:** `ps aux | grep mcp-neo4j-cypher | grep "transport"`

**Issue:** Router exposing wrong number of tools
- **Cause:** Auto-injection bug in router code
- **Fix:** Ensure router code at line 183-207 has conditional chain registration
- **Verify:** Test endpoint and count tools

**Issue:** Caddy gateway not routing properly
- **Cause:** Missing `rewrite * /mcp{path}` or incorrect proxy target
- **Fix:** Update Caddyfile and reload: `docker exec ibnalarab-caddy caddy reload --config /etc/caddy/Caddyfile`

### 8.2 Log Locations & Monitoring
```bash
# Router logs (journald)
journalctl -u josoor-router-noor -f
journalctl -u josoor-router-maestro -f
journalctl -u josoor-router-embeddings -f
journalctl -u josoor-mcp -f

# Caddy logs
docker logs -f ibnalarab-caddy

# Application logs
tail -f /home/mastersite/development/josoorbe/backend/logs/mcp_server.log
```

**Real-Time Unified Monitoring:**
```bash
# Watch all services with color-coded output
/home/mastersite/development/josoorbe/watch_all.sh

# Features:
# - Color-coded by service (Noor=BLUE, Maestro=GREEN, Embeddings=YELLOW, Neo4j=WHITE)
# - HTTP status codes highlighted (200=GREEN, 404=YELLOW, 401/500=RED)
# - Request types labeled (REQ for GET/POST, MCP for JSON-RPC, TOOL for tool calls)
# - Real-time streaming from all MCP routers and services
```

**Monitor Output Example:**
```
SERVICE      | LVL   | MESSAGE
MCP-NOOR     | 200   | 172.18.0.3:43510 - "POST /mcp/ HTTP/1.1" 200 OK
MCP-NEO4J    | REQ   | Running Neo4j Cypher MCP Server with HTTP transport on 0.0.0.0:8080
MCP-EMBED    | INFO  | No business chain tools in config - router will expose only configured tools
MCP-MAESTRO  | MCP   | Received tools/list request
```

---

## 9. Integration Best Practices
1.  **Avoid 404s**: Never call business chains using the `/api/v1/dashboard/` prefix. Chains are always at `/api/business-chain/`.
2.  **Trailing Slashes**: The Gateway is configured to be flexible, but prefer using trailing slashes for MCP endpoints (e.g., `/1/mcp/`) to ensure protocol compliance.
3.  **Authentication**: All requests from unknown origins must include the `Authorization: Bearer <token>` header if auth is enabled.
4.  **Error Handling**: If a graph call returns `nodes: [], links: []`, check your `nodeLabels` parameter.
