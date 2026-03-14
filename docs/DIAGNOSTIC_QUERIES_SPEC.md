# Diagnostic Queries Specification

## Context

Each chain in the `chain_queries` Supabase table has two Cypher queries:
- **`narrative_query`** — the "happy path". Uses strict `MATCH` on every leg. Only returns fully-connected paths. If a node has no link to the next step, the entire path is excluded.
- **`diagnostic_query`** — the "health check". Uses `OPTIONAL MATCH` on every leg. Returns ALL nodes including disconnected ones, revealing broken paths.

### The Problem
A previous session overwrote 5 of 7 diagnostic queries with copies of the narrative query. Only `sector_value_chain` and `sustainable_operations` still have correct diagnostic queries.

## Concepts

### Orphan (يتيم)
A **from-node** where the chain path STOPS at that node. It has no link to any to-node on the next leg. Dead end. Left behind while the other nodes travel forward.

*Example: EntityCapability "3.1.2" exists but has no MONITORED_BY link to any EntityRisk. It's an orphan on the Cap→Risk leg.*

### Bastard (لقيط)
A **to-node** that appears on the chain path but has NO link FROM any from-node on the previous leg. It appeared from nowhere — no one knows how it joined the journey.

*Example: EntityRisk "R-5.2" exists but no EntityCapability links to it via MONITORED_BY. It's a bastard on the Cap→Risk leg.*

### Visual Representation
- Red dots at each node type position showing aggregate counts
- Format: `O:N B:M` (N orphans, M bastards)
- These are per-leg counts, NOT global connectivity

### Internal Lingo
"Orphan" and "bastard" are internal development terms. Client-facing labels should use:
- Orphan → "Unlinked source" or "Disconnected node"
- Bastard → "Unlinked target" or "Unattributed node"

## The Pattern: Narrative vs Diagnostic

### Narrative (strict MATCH)
```cypher
MATCH (root:EntityCultureHealth {level:'L3'})
MATCH (root)-[r1:MONITORS_FOR]->(org:EntityOrgUnit {level:'L3'})
MATCH (org)-[r2:APPLY]->(proc:EntityProcess {level:'L3'})
```
Only returns CultureHealth nodes that connect to OrgUnit that connects to Process. Missing links = missing from results entirely.

### Diagnostic (OPTIONAL MATCH)
```cypher
MATCH (root:EntityCultureHealth)
OPTIONAL MATCH p1 = (root)-[:MONITORS_FOR]->(org:EntityOrgUnit)
OPTIONAL MATCH p2 = (org)-[:APPLY]->(proc:EntityProcess)
```
Returns ALL CultureHealth nodes. If no MONITORS_FOR link exists, org is null but root still appears. This reveals the orphan.

### Key Differences
1. `MATCH` → `OPTIONAL MATCH` for each chain leg
2. Level filters relaxed (no `{level:'L3'}` on intermediates) to catch cross-level anomalies
3. Uses path variables (`p1`, `p2`...) and `UNWIND paths` approach
4. Simpler RETURN — no nProps/rProps (diagnostic cares about structure, not properties)

## Current State (chain_queries table)

| chain_id | narrative | diagnostic | Status |
|----------|-----------|-----------|--------|
| sector_value_chain | v6 strict MATCH | v6 OPTIONAL MATCH | OK |
| sustainable_operations | v6 strict MATCH | v6 OPTIONAL MATCH | OK |
| capability_to_performance | v3 strict MATCH | **COPY of narrative** | BROKEN |
| capability_to_policy | v2 strict MATCH | **COPY of narrative** | BROKEN |
| change_to_capability | v2 strict MATCH | **COPY of narrative** | BROKEN |
| setting_strategic_initiatives | v6 strict MATCH | **COPY of narrative** | BROKEN |
| setting_strategic_priorities | v6 strict MATCH | **COPY of narrative** | BROKEN |

## Chain Paths (for diagnostic query construction)

### 1. capability_to_performance
```
EntityCapability L3
  -[MONITORED_BY]-> EntityRisk L3
  <-[PARENT_OF]- EntityRisk L2
  -[INFORMS]-> SectorPerformance L2
  <-[PARENT_OF]- SectorPerformance L1
  -[AGGREGATES_TO]-> SectorObjective L1
```

### 2. capability_to_policy
```
EntityCapability L3
  -[MONITORED_BY]-> EntityRisk L3
  <-[PARENT_OF]- EntityRisk L2
  -[INFORMS]-> SectorPolicyTool L2
  <-[PARENT_OF]- SectorPolicyTool L1
  -[GOVERNED_BY]-> SectorObjective L1
```

### 3. change_to_capability
```
EntityChangeAdoption L3
  -[INCREASE_ADOPTION]-> EntityProject L3
  -[CLOSE_GAPS]-> gap (OrgUnit|Process|ITSystem) L3
  <-[ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]- EntityCapability L3
```

### 4. setting_strategic_initiatives
```
SectorObjective L1
  -[REALIZED_VIA]-> SectorPolicyTool L1
  -[PARENT_OF]-> SectorPolicyTool L2
  -[SETS_PRIORITIES]-> EntityCapability L2
  -[PARENT_OF]-> EntityCapability L3
  -[ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]-> gap (OrgUnit|Process|ITSystem) L3
  -[GAPS_SCOPE]-> EntityProject L3
  -[ADOPTION_RISKS]-> EntityChangeAdoption L3
```

### 5. setting_strategic_priorities
```
SectorObjective L1
  -[CASCADED_VIA]-> SectorPerformance L1
  -[PARENT_OF]-> SectorPerformance L2
  -[SETS_TARGETS]-> EntityCapability L2
  -[PARENT_OF]-> EntityCapability L3
  -[ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]-> gap (OrgUnit|Process|ITSystem) L3
```

## Frontend Detection (already implemented)

The frontend already handles orphan/bastard detection in two places:

### 1. OntologyHome Dashboard (`ontologyService.ts` lines 1051-1235)
- `computeLineFlowHealth()` — per-leg detection using chain data
- Returns `LineHealthDetail` with `disconnectedFrom` (orphans) and `disconnectedTo` (bastards)
- Thresholds: 0% = green, 1-15% = amber, >15% = red
- Displayed as animated SVG lines between columns

### 2. ExplorerDesk (`ExplorerDesk.tsx` line 202)
- Toggle between `narrative` and `diagnostic` mode
- Passes `analyzeGaps=true` to API for diagnostic
- Colors orphan/bastard nodes amber in 3D graph and Sankey

## Future: Semantic Reconnection Suggestions

All nodes have embeddings (OpenAI text-embedding-3-small, 1536 dims). For orphans and bastards, we can suggest probable connections:

- **For an orphan** (e.g., Cap "3.1.2" with no MONITORED_BY → Risk): Find Risk nodes whose embedding is closest to the orphan's embedding via cosine similarity. These are "probable parents" — the risks that semantically match this capability.

- **For a bastard** (e.g., Risk "R-5.2" with no Cap → MONITORED_BY): Find Capability nodes whose embedding is closest. These are "probable origins."

The suggestion becomes a list for the business owner (relevant OrgUnit) to review and either:
- **Connect** — create the missing relationship
- **Kill** — mark the node as deprecated/irrelevant

Infrastructure exists (embeddings router on port 8203, vector index `memory_semantic_index`). Feature not yet built.
