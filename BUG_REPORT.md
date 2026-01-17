# Critical Bug Report: Oversight Chains Returning Empty Data

**Severity:** Critical (Feature Broken in Production)
**Date:** January 17, 2026
**Affected Components:** Graph Server API (`/api/business-chain/*`)

## Issue Description
The specific endpoints for "Build Oversight" (`build_oversight`) and "Operate Oversight" (`operate_oversight`) business chains are returning **zero nodes and zero links**, rendering the Graph Explorer feature unusable for these chains.

However, the **Generic Graph API** (`/api/graph`), when queried with the exact same node labels and relationship types defined for these chains, returns the correct and complete subgraph (~680 nodes). This confirms the data exists in Neo4j, but the specific business-chain logic/query on the backend is faulty.

## Reproduction Results (Confirmed)

| Chain | Specific Endpoint (Broken) | Generic API Equivalent (Working) | Discrepancy |
| :--- | :--- | :--- | :--- |
| `build_oversight` | **0 nodes, 0 links** | **681 nodes, 676 links** | Missing 100% of data |
| `operate_oversight` | **0 nodes, 0 links** | **686 nodes, 684 links** | Missing 100% of data |

## Reproduction Steps

You can reproduce this using `curl` against the production/beta backend:

### 1. Build Oversight Failure
**Request:**
```bash
curl "https://betaBE.aitwintech.com/api/business-chain/build_oversight?year=2025&analyzeGaps=false&excludeEmbeddings=true"
```
**Actual Response:** `{"nodes": [], "links": []}`
**Expected Response:** A JSON object containing ~680 nodes.

### 2. Proof of Data Existence (Generic API)
**Request:**
```bash
curl -G "https://betaBE.aitwintech.com/api/graph" \
  --data-urlencode "nodeLabels=EntityRisk,EntityCapability,SectorPolicyTool" \
  --data-urlencode "relationships=MONITORED_BY,EXECUTES,SETS_PRIORITIES,INFORMS" \
  --data-urlencode "years=2025" \
  --data-urlencode "analyzeGaps=false" \
  --data-urlencode "excludeEmbeddings=true"
```
**Actual Response:** Large JSON object with >600 nodes.

## Technical Analysis
The issue is likely in the backend handler for `GET /api/business-chain/{chain_id}`.
-   It seems the specific Cypher query used for `build_oversight` and `operate_oversight` is either outdated, uses incorrect relationship directions, or applies strict filtering that filters out all nodes (e.g., waiting for specific properties that don't exist).
-   The Generic API (`/api/graph`) simply matches `(n:Label)-[r:TYPE]->(m:Label)` which works perfectly, indicating the data structure in Neo4j is correct.

## Recommended Fix
**Short Term:** Update the backend handler for these two chains to functionally mirror the logic of the Generic API (matching by Labels + Relationships) rather than whatever custom logic is currently failing.

**Long Term:** deprecate specific chain endpoints if they are just hardcoded subsets of the generic graph, and move the configuration to the database or a config file that drives the Generic API.
