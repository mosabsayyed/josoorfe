# Backend Bug Report: Oversight Business Chains

**Date:** 2026-01-17
**Severity:** High (Feature Broken)
**Components:** Graph Server API (`/api/business-chain/*`)

## Issue Summary
The `build_oversight` and `operate_oversight` business chains are returning incomplete and incorrect data. Specifically, they fail to return the necessary relationship links and parent nodes (e.g., `EntityCapability`), rendering the graph disconnected. Additionally, the diagnostic status logic appears to default to "Critical" for all nodes.

## Affected Endpoints
- `GET /api/business-chain/build_oversight`
- `GET /api/business-chain/operate_oversight`

## 1. Narrative Mode (`analyzeGaps=false`)
**Behavior:** Returns **0 nodes** and **0 links**.
**Request:**
```bash
curl "https://betaBE.aitwintech.com/api/business-chain/build_oversight?year=2025&analyzeGaps=false"
```
**Expected:** Should return the structural graph (blue nodes) used for navigation, including `EntityRisk` connected to `EntityCapability` and `SectorPolicyTool`.
**Actual:** Empty result.

## 2. Diagnostic Mode (`analyzeGaps=true`)
**Behavior:** Returns Orphaned Nodes (No Links).
**Request:**
```bash
curl "https://betaBE.aitwintech.com/api/business-chain/build_oversight?year=2025&analyzeGaps=true"
```
**Observation:**
- Returns ~135 `EntityRisk` nodes.
- Returns **0 links** (`links: []`).
- **Missing Data:** The connected `EntityCapability` and `SectorPolicyTool` nodes (defined in the ontology/chain mapping) are completely missing from the response. Without these, no relationships can be drawn.
- **Status Logic:** All 135 nodes are marked `status: 'critical'`.

## 3. Proof of Data Existence (Generic API)
The data **does exist** in the database. Querying the Generic Graph API for the *exact same* labels and relationships returns a complete, connected graph.
**Request:**
```bash
curl "https://betaBE.aitwintech.com/api/graph?nodeLabels=EntityRisk,EntityCapability&relationships=MONITORED_BY&years=2025&analyzeGaps=true"
```
**Result:** Returns ~557 Nodes and ~636 Links, with correct status distribution (Mixed Red/Amber/Green).

## Recommendation
The issue lies specifically in the logical implementation of the `business-chain/oversight` endpoints. 
1. **Fix Traversal:** Ensure the query incorrectly traverses from `EntityRisk` 'up' to `EntityCapability` (or vice versa) and includes those parent nodes in the response.
2. **Fix Links:** Ensure the relationships (e.g., `MONITORED_BY`) are returned.
3. **Check Filters:** Ensure `analyzeGaps=false` does not aggressively filter out all nodes.
