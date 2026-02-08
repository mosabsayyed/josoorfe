// Test Sector Value Chain Query
// Parameters: year=2025, quarter=null, id=null

:param year => 2025;
:param quarter => null;
:param id => null;

MATCH (root:SectorObjective {level:'L1'})
WHERE ($year = 0 OR toInteger(root.year) = toInteger($year))
  AND ($quarter IS NULL OR root.quarter = $quarter)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
MATCH path = (root)-[:REALIZED_VIA]->(pol:SectorPolicyTool {level:'L1'})
  -[:REFERS_TO]->(rec:SectorAdminRecord {level:'L1'})
  -[:APPLIED_ON]->(stake:SectorCitizen|SectorGovEntity|SectorBusiness {level:'L1'})
  -[:TRIGGERS_EVENT]->(txn:SectorDataTransaction {level:'L1'})
  -[:MEASURED_BY]->(perf:SectorPerformance {level:'L1'})
  -[:AGGREGATES_TO]->(root)
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r
RETURN DISTINCT elementId(n) AS nId, labels(n) AS nLabels,
  apoc.map.removeKeys(properties(n), ['embedding','Embedding','embedding_generated_at']) AS nProps,
  type(r) AS rType, apoc.map.removeKeys(properties(r), ['embedding','Embedding']) AS rProps,
  elementId(startNode(r)) AS sourceId, elementId(endNode(r)) AS targetId;
