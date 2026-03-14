# Diagnostic Queries — SQL Updates

Run these 5 UPDATE statements against Supabase `chain_queries` table to restore proper diagnostic queries.

## 1. capability_to_performance

```sql
UPDATE chain_queries
SET diagnostic_query = $$MATCH (root:EntityCapability)
WHERE ($year = 0 OR toInteger(root.year) = toInteger($year))
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:MONITORED_BY]->(riskL3:EntityRisk)
OPTIONAL MATCH p2 = (riskL2:EntityRisk)-[:PARENT_OF]->(riskL3)
OPTIONAL MATCH p3 = (riskL2)-[:INFORMS]->(perfL2:SectorPerformance)
OPTIONAL MATCH p4 = (perfL1:SectorPerformance)-[:PARENT_OF]->(perfL2)
OPTIONAL MATCH p5 = (perfL1)-[:AGGREGATES_TO]->(objL1:SectorObjective)
WITH root, [p1, p2, p3, p4, p5] AS paths_raw
UNWIND [path IN paths_raw WHERE path IS NOT NULL] AS path
WITH root, path
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r, root
WHERE n IS NOT NULL
RETURN DISTINCT
  labels(n)[0] + ':' + toString(n.id) + ':' + toString(n.year) AS nId,
  labels(n) AS nLabels,
  type(r) AS rType,
  CASE WHEN r IS NOT NULL THEN labels(startNode(r))[0] + ':' + toString(startNode(r).id) + ':' + toString(startNode(r).year) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN labels(endNode(r))[0] + ':' + toString(endNode(r).id) + ':' + toString(endNode(r).year) ELSE null END AS targetId$$,
    modified_at = now(),
    modified_by = 'claude-local',
    change_notes = 'Restore diagnostic query: OPTIONAL MATCH pattern for orphan/bastard detection'
WHERE chain_id = 'capability_to_performance' AND is_active = true;
```

## 2. capability_to_policy

```sql
UPDATE chain_queries
SET diagnostic_query = $$MATCH (root:EntityCapability)
WHERE ($year = 0 OR toInteger(root.year) = toInteger($year))
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:MONITORED_BY]->(riskL3:EntityRisk)
OPTIONAL MATCH p2 = (riskL2:EntityRisk)-[:PARENT_OF]->(riskL3)
OPTIONAL MATCH p3 = (riskL2)-[:INFORMS]->(polL2:SectorPolicyTool)
OPTIONAL MATCH p4 = (polL1:SectorPolicyTool)-[:PARENT_OF]->(polL2)
OPTIONAL MATCH p5 = (polL1)-[:GOVERNED_BY]->(objL1:SectorObjective)
WITH root, [p1, p2, p3, p4, p5] AS paths_raw
UNWIND [path IN paths_raw WHERE path IS NOT NULL] AS path
WITH root, path
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r, root
WHERE n IS NOT NULL
RETURN DISTINCT
  labels(n)[0] + ':' + toString(n.id) + ':' + toString(n.year) AS nId,
  labels(n) AS nLabels,
  type(r) AS rType,
  CASE WHEN r IS NOT NULL THEN labels(startNode(r))[0] + ':' + toString(startNode(r).id) + ':' + toString(startNode(r).year) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN labels(endNode(r))[0] + ':' + toString(endNode(r).id) + ':' + toString(endNode(r).year) ELSE null END AS targetId$$,
    modified_at = now(),
    modified_by = 'claude-local',
    change_notes = 'Restore diagnostic query: OPTIONAL MATCH pattern for orphan/bastard detection'
WHERE chain_id = 'capability_to_policy' AND is_active = true;
```

## 3. change_to_capability

```sql
UPDATE chain_queries
SET diagnostic_query = $$MATCH (root:EntityChangeAdoption)
WHERE ($year = 0 OR toInteger(root.year) = toInteger($year))
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:INCREASE_ADOPTION]->(proj:EntityProject)
OPTIONAL MATCH p2 = (proj)-[:CLOSE_GAPS]->(gap)
  WHERE gap:EntityOrgUnit OR gap:EntityProcess OR gap:EntityITSystem
OPTIONAL MATCH p3 = (capL3:EntityCapability)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap)
WITH root, [p1, p2, p3] AS paths_raw
UNWIND [path IN paths_raw WHERE path IS NOT NULL] AS path
WITH root, path
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r, root
WHERE n IS NOT NULL
RETURN DISTINCT
  labels(n)[0] + ':' + toString(n.id) + ':' + toString(n.year) AS nId,
  labels(n) AS nLabels,
  type(r) AS rType,
  CASE WHEN r IS NOT NULL THEN labels(startNode(r))[0] + ':' + toString(startNode(r).id) + ':' + toString(startNode(r).year) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN labels(endNode(r))[0] + ':' + toString(endNode(r).id) + ':' + toString(endNode(r).year) ELSE null END AS targetId$$,
    modified_at = now(),
    modified_by = 'claude-local',
    change_notes = 'Restore diagnostic query: OPTIONAL MATCH pattern for orphan/bastard detection'
WHERE chain_id = 'change_to_capability' AND is_active = true;
```

## 4. setting_strategic_initiatives

```sql
UPDATE chain_queries
SET diagnostic_query = $$MATCH (root:SectorObjective)
WHERE ($year = 0 OR toInteger(root.year) = toInteger($year))
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:REALIZED_VIA]->(polL1:SectorPolicyTool)
OPTIONAL MATCH p2 = (polL1)-[:PARENT_OF]->(polL2:SectorPolicyTool)
OPTIONAL MATCH p3 = (polL2)-[:SETS_PRIORITIES]->(capL2:EntityCapability)
OPTIONAL MATCH p4 = (capL2)-[:PARENT_OF]->(capL3:EntityCapability)
OPTIONAL MATCH p5 = (capL3)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap)
  WHERE gap:EntityOrgUnit OR gap:EntityProcess OR gap:EntityITSystem
OPTIONAL MATCH p6 = (gap)-[:GAPS_SCOPE]->(proj:EntityProject)
OPTIONAL MATCH p7 = (proj)-[:ADOPTION_RISKS]->(adopt:EntityChangeAdoption)
WITH root, [p1, p2, p3, p4, p5, p6, p7] AS paths_raw
UNWIND [path IN paths_raw WHERE path IS NOT NULL] AS path
WITH root, path
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r, root
WHERE n IS NOT NULL
RETURN DISTINCT
  labels(n)[0] + ':' + toString(n.id) + ':' + toString(n.year) AS nId,
  labels(n) AS nLabels,
  type(r) AS rType,
  CASE WHEN r IS NOT NULL THEN labels(startNode(r))[0] + ':' + toString(startNode(r).id) + ':' + toString(startNode(r).year) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN labels(endNode(r))[0] + ':' + toString(endNode(r).id) + ':' + toString(endNode(r).year) ELSE null END AS targetId$$,
    modified_at = now(),
    modified_by = 'claude-local',
    change_notes = 'Restore diagnostic query: OPTIONAL MATCH pattern for orphan/bastard detection'
WHERE chain_id = 'setting_strategic_initiatives' AND is_active = true;
```

## 5. setting_strategic_priorities

```sql
UPDATE chain_queries
SET diagnostic_query = $$MATCH (root:SectorObjective)
WHERE ($year = 0 OR toInteger(root.year) = toInteger($year))
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:CASCADED_VIA]->(perfL1:SectorPerformance)
OPTIONAL MATCH p2 = (perfL1)-[:PARENT_OF]->(perfL2:SectorPerformance)
OPTIONAL MATCH p3 = (perfL2)-[:SETS_TARGETS]->(capL2:EntityCapability)
OPTIONAL MATCH p4 = (capL2)-[:PARENT_OF]->(capL3:EntityCapability)
OPTIONAL MATCH p5 = (capL3)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap)
  WHERE gap:EntityOrgUnit OR gap:EntityProcess OR gap:EntityITSystem
WITH root, [p1, p2, p3, p4, p5] AS paths_raw
UNWIND [path IN paths_raw WHERE path IS NOT NULL] AS path
WITH root, path
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r, root
WHERE n IS NOT NULL
RETURN DISTINCT
  labels(n)[0] + ':' + toString(n.id) + ':' + toString(n.year) AS nId,
  labels(n) AS nLabels,
  type(r) AS rType,
  CASE WHEN r IS NOT NULL THEN labels(startNode(r))[0] + ':' + toString(startNode(r).id) + ':' + toString(startNode(r).year) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN labels(endNode(r))[0] + ':' + toString(endNode(r).id) + ':' + toString(endNode(r).year) ELSE null END AS targetId$$,
    modified_at = now(),
    modified_by = 'claude-local',
    change_notes = 'Restore diagnostic query: OPTIONAL MATCH pattern for orphan/bastard detection'
WHERE chain_id = 'setting_strategic_priorities' AND is_active = true;
```

## Note on RETURN clause

The surviving diagnostic queries use `labels(s)` and `labels(t)` for sourceId/targetId, referencing variables `s` and `t` that aren't defined in the query (they come from the UNWIND rows approach in the narrative). The new queries use `startNode(r)` and `endNode(r)` which is correct for the paths-based UNWIND approach.

## Verification

After applying, verify with:
```sql
SELECT chain_id, (narrative_query = diagnostic_query) as still_identical
FROM chain_queries WHERE is_active = true ORDER BY chain_id;
```
All 7 should return `false`.
