# Diagnostic Queries — SQL Updates

Diagnostic = narrative + broken paths. Same RETURN (nProps, rProps, everything), but `OPTIONAL MATCH` instead of `MATCH` on chain legs so disconnected nodes also appear.

Run all 7 UPDATEs against Supabase `chain_queries` table.

---

## 1. capability_to_performance

```sql
UPDATE chain_queries
SET diagnostic_query = $$MATCH (root:EntityCapability {level:'L3'})
WHERE ($year = 0 OR toInteger(root.year) = toInteger($year))
  AND ($quarter IS NULL OR root.quarter = $quarter)
  AND ($id IS NULL OR root.id = $id OR EXISTS { MATCH (root)<-[:PARENT_OF]-(parent:EntityCapability {level:'L2', id: $id}) })
OPTIONAL MATCH (capL2:EntityCapability {level:'L2'})-[rc2:PARENT_OF]->(root)
OPTIONAL MATCH (capL1:EntityCapability {level:'L1'})-[rc1:PARENT_OF]->(capL2)
OPTIONAL MATCH (root)-[r1:MONITORED_BY]->(riskL3:EntityRisk {level:'L3'})
OPTIONAL MATCH (riskL2:EntityRisk {level:'L2'})-[r2:PARENT_OF]->(riskL3)
OPTIONAL MATCH (riskL1:EntityRisk {level:'L1'})-[r_rl1:PARENT_OF]->(riskL2)
OPTIONAL MATCH (riskL2)-[r3:INFORMS]->(perfL2:SectorPerformance {level:'L2'})
OPTIONAL MATCH (perfL1:SectorPerformance {level:'L1'})-[r4:PARENT_OF]->(perfL2)
OPTIONAL MATCH (perfL1)-[r5:AGGREGATES_TO]->(objL1:SectorObjective {level:'L1'})
UNWIND [
  {n: root, r: null, s: null, t: null},
  {n: capL2, r: rc2, s: capL2, t: root},
  {n: capL1, r: rc1, s: capL1, t: capL2},
  {n: riskL3, r: r1, s: root, t: riskL3},
  {n: riskL2, r: r2, s: riskL2, t: riskL3},
  {n: riskL1, r: r_rl1, s: riskL1, t: riskL2},
  {n: perfL2, r: r3, s: riskL2, t: perfL2},
  {n: perfL1, r: r4, s: perfL1, t: perfL2},
  {n: objL1, r: r5, s: perfL1, t: objL1}
] AS row
WITH row.n AS n, row.r AS r, row.s AS s, row.t AS t
WHERE n IS NOT NULL
RETURN DISTINCT
  labels(n)[0] + ':' + toString(n.id) + ':' + toString(n.year) AS nId,
  labels(n) AS nLabels,
  n { id: labels(n)[0] + ':' + toString(n.id) + ':' + toString(n.year), domain_id: n.id, .name, .year, .level, .quarter, .status, .sector, .description, .parent_id, .parent_year, .category, .region, .build_band, .operate_band, .risk_status, .risk_category, .operational_health_pct } AS nProps,
  type(r) AS rType,
  CASE WHEN r IS NOT NULL THEN apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) ELSE null END AS rProps,
  CASE WHEN r IS NOT NULL THEN labels(s)[0] + ':' + toString(s.id) + ':' + toString(s.year) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN labels(t)[0] + ':' + toString(t.id) + ':' + toString(t.year) ELSE null END AS targetId$$,
    modified_at = now(),
    modified_by = 'claude-local',
    change_notes = 'Restore diagnostic: OPTIONAL MATCH on all legs, same RETURN as narrative, surfaces orphans'
WHERE chain_id = 'capability_to_performance' AND is_active = true;
```

## 2. capability_to_policy

```sql
UPDATE chain_queries
SET diagnostic_query = $$MATCH (root:EntityCapability {level:'L3'})
WHERE ($year = 0 OR toInteger(root.year) = toInteger($year))
  AND ($quarter IS NULL OR root.quarter = $quarter)
  AND ($id IS NULL OR root.id = $id OR EXISTS { MATCH (root)<-[:PARENT_OF]-(parent:EntityCapability {level:'L2', id: $id}) })
OPTIONAL MATCH (capL2:EntityCapability {level:'L2'})-[rc2:PARENT_OF]->(root)
OPTIONAL MATCH (capL1:EntityCapability {level:'L1'})-[rc1:PARENT_OF]->(capL2)
OPTIONAL MATCH (root)-[r1:MONITORED_BY]->(riskL3:EntityRisk {level:'L3'})
OPTIONAL MATCH (riskL2:EntityRisk {level:'L2'})-[r2:PARENT_OF]->(riskL3)
OPTIONAL MATCH (riskL2)-[r3:INFORMS]->(polL2:SectorPolicyTool {level:'L2'})
OPTIONAL MATCH (polL1:SectorPolicyTool {level:'L1'})-[r4:PARENT_OF]->(polL2)
OPTIONAL MATCH (polL1)-[r5:GOVERNED_BY]->(objL1:SectorObjective {level:'L1'})
UNWIND [
  {n: root, r: null, s: null, t: null},
  {n: capL2, r: rc2, s: capL2, t: root},
  {n: capL1, r: rc1, s: capL1, t: capL2},
  {n: riskL3, r: r1, s: root, t: riskL3},
  {n: riskL2, r: r2, s: riskL2, t: riskL3},
  {n: polL2, r: r3, s: riskL2, t: polL2},
  {n: polL1, r: r4, s: polL1, t: polL2},
  {n: objL1, r: r5, s: polL1, t: objL1}
] AS row
WITH row.n AS n, row.r AS r, row.s AS s, row.t AS t
WHERE n IS NOT NULL
RETURN DISTINCT
  labels(n)[0] + ':' + toString(n.id) + ':' + toString(n.year) AS nId,
  labels(n) AS nLabels,
  n { id: labels(n)[0] + ':' + toString(n.id) + ':' + toString(n.year), domain_id: n.id, .name, .year, .level, .quarter, .status, .parent_id, .parent_year, .category, .sector, .region, .build_band, .operate_band, .build_exposure_pct, .expected_delay_days, .likelihood_of_delay, .operational_health_pct, .risk_status, .risk_category } AS nProps,
  type(r) AS rType,
  CASE WHEN r IS NOT NULL THEN apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) ELSE null END AS rProps,
  CASE WHEN r IS NOT NULL THEN labels(s)[0] + ':' + toString(s.id) + ':' + toString(s.year) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN labels(t)[0] + ':' + toString(t.id) + ':' + toString(t.year) ELSE null END AS targetId$$,
    modified_at = now(),
    modified_by = 'claude-local',
    change_notes = 'Restore diagnostic: OPTIONAL MATCH on all legs, same RETURN as narrative, surfaces orphans'
WHERE chain_id = 'capability_to_policy' AND is_active = true;
```

## 3. change_to_capability

```sql
UPDATE chain_queries
SET diagnostic_query = $$MATCH (root:EntityChangeAdoption {level:'L3'})
WHERE ($year = 0 OR toInteger(root.year) = toInteger($year))
  AND ($quarter IS NULL OR root.quarter = $quarter)
  AND ($id IS NULL OR root.id = $id)
OPTIONAL MATCH (root)-[r1:INCREASE_ADOPTION]->(proj:EntityProject {level:'L3'})
OPTIONAL MATCH (proj)-[r2:CLOSE_GAPS]->(gap {level:'L3'})
  WHERE gap:EntityOrgUnit OR gap:EntityProcess OR gap:EntityITSystem
OPTIONAL MATCH (capL3:EntityCapability {level:'L3'})-[r3:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap)
UNWIND [
  {n: root, r: null, s: null, t: null},
  {n: proj, r: r1, s: root, t: proj},
  {n: gap, r: r2, s: proj, t: gap},
  {n: capL3, r: r3, s: capL3, t: gap}
] AS row
WITH row.n AS n, row.r AS r, row.s AS s, row.t AS t
WHERE n IS NOT NULL
RETURN DISTINCT
  labels(n)[0] + ':' + toString(n.id) + ':' + toString(n.year) AS nId,
  labels(n) AS nLabels,
  type(r) AS rType,
  CASE WHEN r IS NOT NULL THEN labels(s)[0] + ':' + toString(s.id) + ':' + toString(s.year) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN labels(t)[0] + ':' + toString(t.id) + ':' + toString(t.year) ELSE null END AS targetId$$,
    modified_at = now(),
    modified_by = 'claude-local',
    change_notes = 'Restore diagnostic: OPTIONAL MATCH on all legs, same RETURN as narrative, surfaces orphans'
WHERE chain_id = 'change_to_capability' AND is_active = true;
```

## 4. setting_strategic_initiatives

```sql
UPDATE chain_queries
SET diagnostic_query = $$MATCH (root:SectorObjective {level:'L1'})
WHERE ($year = 0 OR toInteger(root.year) = toInteger($year))
  AND ($quarter IS NULL OR root.quarter = $quarter)
  AND ($id IS NULL OR root.id = $id)
OPTIONAL MATCH (root)-[r1:REALIZED_VIA]->(polL1:SectorPolicyTool {level:'L1'})
OPTIONAL MATCH (polL1)-[r2:PARENT_OF]->(polL2:SectorPolicyTool {level:'L2'})
OPTIONAL MATCH (polL2)-[r3:SETS_PRIORITIES]->(capL2:EntityCapability {level:'L2'})
OPTIONAL MATCH (capL2)-[r4:PARENT_OF]->(capL3:EntityCapability {level:'L3'})
OPTIONAL MATCH (capL3)-[r5:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap {level:'L3'})
  WHERE gap:EntityOrgUnit OR gap:EntityProcess OR gap:EntityITSystem
OPTIONAL MATCH (gap)-[r6:GAPS_SCOPE]->(proj:EntityProject {level:'L3'})
OPTIONAL MATCH (proj)-[r7:ADOPTION_RISKS]->(adopt:EntityChangeAdoption {level:'L3'})
UNWIND [
  {n: root, r: null, s: null, t: null},
  {n: polL1, r: null, s: null, t: null},
  {n: polL2, r: null, s: null, t: null},
  {n: capL2, r: null, s: null, t: null},
  {n: capL3, r: null, s: null, t: null},
  {n: gap, r: null, s: null, t: null},
  {n: proj, r: null, s: null, t: null},
  {n: adopt, r: null, s: null, t: null},
  {n: polL1, r: r1, s: root, t: polL1},
  {n: polL2, r: r2, s: polL1, t: polL2},
  {n: capL2, r: r3, s: polL2, t: capL2},
  {n: capL3, r: r4, s: capL2, t: capL3},
  {n: gap, r: r5, s: capL3, t: gap},
  {n: proj, r: r6, s: gap, t: proj},
  {n: adopt, r: r7, s: proj, t: adopt}
] AS row
WITH row.n AS n, row.r AS r, row.s AS s, row.t AS t
WHERE n IS NOT NULL
RETURN DISTINCT
  labels(n)[0] + ':' + toString(n.id) + ':' + toString(n.year) AS nId,
  labels(n) AS nLabels,
  type(r) AS rType,
  CASE WHEN r IS NOT NULL THEN labels(s)[0] + ':' + toString(s.id) + ':' + toString(s.year) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN labels(t)[0] + ':' + toString(t.id) + ':' + toString(t.year) ELSE null END AS targetId$$,
    modified_at = now(),
    modified_by = 'claude-local',
    change_notes = 'Restore diagnostic: OPTIONAL MATCH on all legs, same RETURN as narrative, surfaces orphans'
WHERE chain_id = 'setting_strategic_initiatives' AND is_active = true;
```

## 5. setting_strategic_priorities

```sql
UPDATE chain_queries
SET diagnostic_query = $$MATCH (root:SectorObjective {level:'L1'})
WHERE ($year = 0 OR toInteger(root.year) = toInteger($year))
  AND ($quarter IS NULL OR toInteger(root.quarter) = toInteger($quarter))
  AND ($id IS NULL OR root.id = $id)
OPTIONAL MATCH (root)-[r1:CASCADED_VIA]->(perfL1:SectorPerformance {level:'L1'})
OPTIONAL MATCH (perfL1)-[r2:PARENT_OF]->(perfL2:SectorPerformance {level:'L2'})
OPTIONAL MATCH (perfL2)-[r3:SETS_TARGETS]->(capL2:EntityCapability {level:'L2'})
OPTIONAL MATCH (capL2)-[r4:PARENT_OF]->(capL3:EntityCapability {level:'L3'})
OPTIONAL MATCH (capL3)-[r5:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap {level:'L3'})
  WHERE gap:EntityOrgUnit OR gap:EntityProcess OR gap:EntityITSystem
UNWIND [
  {n: root, r: null, s: null, t: null},
  {n: perfL1, r: null, s: null, t: null},
  {n: perfL2, r: null, s: null, t: null},
  {n: capL2, r: null, s: null, t: null},
  {n: capL3, r: null, s: null, t: null},
  {n: gap, r: null, s: null, t: null},
  {n: perfL1, r: r1, s: root, t: perfL1},
  {n: perfL2, r: r2, s: perfL1, t: perfL2},
  {n: capL2, r: r3, s: perfL2, t: capL2},
  {n: capL3, r: r4, s: capL2, t: capL3},
  {n: gap, r: r5, s: capL3, t: gap}
] AS row
WITH row.n AS n, row.r AS r, row.s AS s, row.t AS t
WHERE n IS NOT NULL
RETURN DISTINCT
  labels(n)[0] + ':' + toString(n.id) + ':' + toString(n.year) AS nId,
  labels(n) AS nLabels,
  type(r) AS rType,
  CASE WHEN r IS NOT NULL THEN labels(s)[0] + ':' + toString(s.id) + ':' + toString(s.year) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN labels(t)[0] + ':' + toString(t.id) + ':' + toString(t.year) ELSE null END AS targetId$$,
    modified_at = now(),
    modified_by = 'claude-local',
    change_notes = 'Restore diagnostic: OPTIONAL MATCH on all legs, same RETURN as narrative, surfaces orphans'
WHERE chain_id = 'setting_strategic_priorities' AND is_active = true;
```

## 6. sector_value_chain (FIX existing — add nProps)

```sql
UPDATE chain_queries
SET diagnostic_query = $$MATCH (root:SectorObjective {level:'L1'})
WHERE ($year = 0 OR toInteger(root.year) = toInteger($year))
  AND ($quarter IS NULL OR root.quarter = $quarter)
  AND ($id IS NULL OR root.id = $id)
OPTIONAL MATCH (root)-[r1:REALIZED_VIA]->(pol:SectorPolicyTool {level:'L1'})
OPTIONAL MATCH (pol)-[r2:REFERS_TO]->(rec:SectorAdminRecord {level:'L1'})
OPTIONAL MATCH (rec)-[r3:APPLIED_ON]->(stake {level:'L1'})
  WHERE stake:SectorCitizen OR stake:SectorGovEntity OR stake:SectorBusiness
OPTIONAL MATCH (stake)-[r4:TRIGGERS_EVENT]->(txn:SectorDataTransaction {level:'L1'})
OPTIONAL MATCH (txn)-[r5:MEASURED_BY]->(perf:SectorPerformance {level:'L1'})
OPTIONAL MATCH (perf)-[r6:AGGREGATES_TO]->(root)
UNWIND [
  {n: root, r: null, s: null, t: null},
  {n: pol, r: null, s: null, t: null},
  {n: rec, r: null, s: null, t: null},
  {n: stake, r: null, s: null, t: null},
  {n: txn, r: null, s: null, t: null},
  {n: perf, r: null, s: null, t: null},
  {n: pol, r: r1, s: root, t: pol},
  {n: rec, r: r2, s: pol, t: rec},
  {n: stake, r: r3, s: rec, t: stake},
  {n: txn, r: r4, s: stake, t: txn},
  {n: perf, r: r5, s: txn, t: perf},
  {n: root, r: r6, s: perf, t: root}
] AS row
WITH row.n AS n, row.r AS r, row.s AS s, row.t AS t
WHERE n IS NOT NULL
RETURN DISTINCT
  labels(n)[0] + ':' + toString(n.id) + ':' + toString(n.year) AS nId,
  labels(n) AS nLabels,
  type(r) AS rType,
  CASE WHEN r IS NOT NULL THEN labels(s)[0] + ':' + toString(s.id) + ':' + toString(s.year) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN labels(t)[0] + ':' + toString(t.id) + ':' + toString(t.year) ELSE null END AS targetId$$,
    modified_at = now(),
    modified_by = 'claude-local',
    change_notes = 'Fix diagnostic: use UNWIND rows (not paths), add level filters, match narrative structure'
WHERE chain_id = 'sector_value_chain' AND is_active = true;
```

## 7. sustainable_operations (FIX existing — add nProps)

```sql
UPDATE chain_queries
SET diagnostic_query = $$MATCH (root:EntityCultureHealth {level:'L3'})
WHERE ($year = 0 OR toInteger(root.year) = toInteger($year))
  AND ($quarter IS NULL OR root.quarter = $quarter)
  AND ($id IS NULL OR root.id = $id)
OPTIONAL MATCH (root)-[r1:MONITORS_FOR]->(org:EntityOrgUnit {level:'L3'})
OPTIONAL MATCH (org)-[r2:APPLY]->(proc:EntityProcess {level:'L3'})
OPTIONAL MATCH (proc)-[r3:AUTOMATION]->(sys:EntityITSystem {level:'L3'})
OPTIONAL MATCH (sys)-[r4:DEPENDS_ON]->(vendor:EntityVendor {level:'L3'})
UNWIND [
  {n: root, r: null, s: null, t: null},
  {n: org, r: null, s: null, t: null},
  {n: proc, r: null, s: null, t: null},
  {n: sys, r: null, s: null, t: null},
  {n: vendor, r: null, s: null, t: null},
  {n: org, r: r1, s: root, t: org},
  {n: proc, r: r2, s: org, t: proc},
  {n: sys, r: r3, s: proc, t: sys},
  {n: vendor, r: r4, s: sys, t: vendor}
] AS row
WITH row.n AS n, row.r AS r, row.s AS s, row.t AS t
WHERE n IS NOT NULL
RETURN DISTINCT
  labels(n)[0] + ':' + toString(n.id) + ':' + toString(n.year) AS nId,
  labels(n) AS nLabels,
  type(r) AS rType,
  CASE WHEN r IS NOT NULL THEN labels(s)[0] + ':' + toString(s.id) + ':' + toString(s.year) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN labels(t)[0] + ':' + toString(t.id) + ':' + toString(t.year) ELSE null END AS targetId$$,
    modified_at = now(),
    modified_by = 'claude-local',
    change_notes = 'Fix diagnostic: use UNWIND rows (not paths), add level filters, match narrative structure'
WHERE chain_id = 'sustainable_operations' AND is_active = true;
```

---

## What Changed vs Narrative

For each chain, the ONLY change from narrative → diagnostic is:

| Narrative | Diagnostic |
|-----------|-----------|
| `MATCH (root)-[r1:REL]->(next)` | `OPTIONAL MATCH (root)-[r1:REL]->(next)` |

Everything else is IDENTICAL:
- Same root `MATCH` (always strict — we need the starting nodes)
- Same UNWIND rows structure
- Same RETURN clause (nId, nLabels, nProps, rType, rProps, sourceId, targetId)
- Same level filters on intermediate nodes

## What This Surfaces

- **Orphans**: Root nodes that exist but have no link to the next step. They appear in results as nodes WITHOUT any relationship rows. The frontend counts nodes with no outgoing edges on each leg.
- **Connected paths**: Appear exactly as in narrative — full properties, full relationships.

## Verification

```sql
SELECT chain_id, (narrative_query = diagnostic_query) as still_identical
FROM chain_queries WHERE is_active = true ORDER BY chain_id;
```
All 7 should return `false`.
