# Task: Diagnostic Query Verification & Dynamic Limit Support

## Status: PENDING

## Task 1: Verify All Diagnostic Queries

### Context
- 7 business chains each have a **narrative** and **diagnostic** query in Supabase `chain_queries` table
- Narrative queries were verified (all 7 return HTTP 200 with correct data)
- **Diagnostic queries were NOT individually verified** (only build_oversight was tested)
- v4 queries are active, v5 inactive

### What to do
1. Call each chain's diagnostic endpoint on the live backend and record results:
   - `GET /api/business-chain/{chainKey}?year=2025&diagnostic=true`
   - Chains: `build_oversight`, `operate_oversight`, `sector_value_chain`, `setting_strategic_priorities`, `setting_strategic_initiatives`, `sustainable_operations`, `integrated_oversight`
2. For each chain, verify:
   - HTTP status is 200 (not 500/OOM)
   - Response contains `nodes` and `links` arrays
   - Node count and link count are reasonable (not 0, not excessively large)
   - Node labels match the expected canonical path for that chain
3. Compare diagnostic results against narrative results — diagnostic should return >= narrative nodes (it includes orphans/bastards)
4. If any diagnostic query fails or returns incorrect data, check the Supabase query and fix it

### Expected results (narrative baseline for comparison)
| Chain | Narrative Nodes | Narrative Links |
|-------|----------------|-----------------|
| build_oversight | 193 | 182 |
| operate_oversight | 25 | 25 |
| sector_value_chain | 15 | 23 |
| setting_strategic_priorities | 23 | 22 |
| setting_strategic_initiatives | 19 | 18 |
| sustainable_operations | 28 | 35 |
| integrated_oversight | 88 | 100 |

### Notes
- build_oversight diagnostic uses hop-by-hop UNION ALL pattern (same as narrative) — already tested OK
- Other 6 chains use standard v4 diagnostic queries with `LIMIT 200` appended
- Source of truth for expected query logic: `ChainTestDesk.tsx` diagnostic queries

---

## Task 2: Backend Support for Dynamic `limit` Parameter

### Context
- The Explorer page has a `limit` slider (default 200)
- The backend chain endpoint (`/api/business-chain/{chainKey}`) **ignores** the `limit` URL parameter
- Currently, `LIMIT 200` is hardcoded inside the Cypher queries in Supabase
- This means the user cannot control how many results they get from the UI

### What to do
1. **Locate the backend chain endpoint** in the graph-server code (josoorbe repo, Express server on port 3001)
2. **Read the route handler** for `/api/business-chain/:chainKey` to understand how it reads and runs queries
3. **Add `limit` parameter support**:
   - Accept `limit` as a URL query param (e.g., `?limit=100`)
   - Default to 200 if not provided
   - Pass it as a Cypher parameter `$limit` to the query
   - The Cypher queries in Supabase would need `LIMIT toInteger($limit)` instead of `LIMIT 200`
4. **Special handling for build_oversight**: its hop-by-hop pattern has per-hop limits (LIMIT 25 each). Dynamic limit here would mean dividing the total limit across hops (e.g., `limit/8` per hop)
5. **Update frontend** (`ExplorerDesk.tsx` `buildGraphUrl()`) to pass `limit` param in the chain URL
6. **Test** all 7 chains with various limit values (50, 100, 200, 500)

### Files involved
- **Backend**: `josoorbe/graph-server/` — route handler for business-chain
- **Frontend**: `frontend/src/components/desks/ExplorerDesk.tsx` — `buildGraphUrl()` function (~line 256)
- **Supabase**: `chain_queries` table — replace `LIMIT 200` with `LIMIT toInteger($limit)`

### Risk
- Removing hardcoded LIMIT without backend support would cause OOM on Aura (278 MiB limit)
- build_oversight is especially sensitive — must keep hop-by-hop pattern regardless of limit value
