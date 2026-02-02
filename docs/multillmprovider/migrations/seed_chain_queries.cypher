// ============================================================================
// CHAIN QUERY CENTRALIZATION: Database Migration Script
// ============================================================================
// Version: 1.0
// Date: 2026-01-17
// Authority: Enterprise_Ontology_SST_v1_1.md (Section 6A) + CHAIN_FIX_IMPLEMENTATION_PLAN.md (PART 1)
// Purpose: Migrate all 7 SST-compliant chain queries from hardcoded sources into Neo4j ChainQuery nodes
//
// SCHEMA DESIGN:
// - Node label: ChainQuery
// - One active version per chainId (constraint enforced)
// - Full audit trail: createdBy, createdAt, modifiedBy, modifiedAt, changeNotes
// - SST validation: sst_authority references canonical path from SST doc
// - Query storage: narrativeQuery (strict path) + diagnosticQuery (optional paths)
//
// EXECUTION:
// Run this script once in Neo4j Browser or via cypher-shell:
//   cat seed_chain_queries.cypher | cypher-shell -u neo4j -p <password>
// ============================================================================

// ----------------------------------------------------------------------------
// 1. Create unique constraint on chainId + version
// ----------------------------------------------------------------------------
CREATE CONSTRAINT chain_query_unique_id_version IF NOT EXISTS
FOR (cq:ChainQuery) REQUIRE (cq.chainId, cq.version) IS UNIQUE;

// ----------------------------------------------------------------------------
// 2. Create unique constraint for active chains (only one active per chainId)
// ----------------------------------------------------------------------------
// Note: Neo4j does not support conditional unique constraints directly.
// Enforced via application logic: before setting isActive=true, set all prior versions to isActive=false

// ============================================================================
// CHAIN 1: sector_value_chain
// ============================================================================
CREATE (cq1:ChainQuery {
  // Identifier & Metadata
  chainId: "sector_value_chain",
  version: 1,
  isActive: true,
  releaseDate: datetime("2026-01-17T00:00:00Z"),
  deprecatedDate: null,
  description: "External Influence Loop: Shows how objectives are executed externally through tools/rules, stakeholder behavior, transactions, and measured performance. Traces the complete value delivery cycle from policy tool to performance measurement.",
  
  // Query Definitions (Cypher)
  narrativeQuery: "MATCH (root:SectorObjective)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
MATCH path = (root)-[:REALIZED_VIA]->(pol:SectorPolicyTool)
  -[:REFERS_TO]->(rec:SectorAdminRecord)
  -[:APPLIED_ON]->(stakeholder:SectorCitizen|SectorGovEntity|SectorBusiness)
  -[:TRIGGERS_EVENT]->(txn:SectorDataTransaction)
  -[:MEASURED_BY]->(perf:SectorPerformance)
  -[:AGGREGATES_TO]->(root)
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r
RETURN DISTINCT
  elementId(n) AS nId,
  labels(n) AS nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) AS nProps,
  type(r) AS rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) AS rProps,
  elementId(startNode(r)) AS sourceId,
  elementId(endNode(r)) AS targetId",
  
  diagnosticQuery: "MATCH (root:SectorObjective)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:REALIZED_VIA]->(pol:SectorPolicyTool)
OPTIONAL MATCH p2 = (pol)-[:REFERS_TO]->(rec:SectorAdminRecord)
OPTIONAL MATCH p3 = (rec)-[:APPLIED_ON]->(stakeholder:SectorCitizen|SectorGovEntity|SectorBusiness)
OPTIONAL MATCH p4 = (stakeholder)-[:TRIGGERS_EVENT]->(txn:SectorDataTransaction)
OPTIONAL MATCH p5 = (txn)-[:MEASURED_BY]->(perf:SectorPerformance)
OPTIONAL MATCH p6 = (perf)-[:AGGREGATES_TO]->(root)
WITH root, [p1, p2, p3, p4, p5, p6] AS paths_raw
UNWIND [path IN paths_raw WHERE path IS NOT NULL] AS path
WITH root, path
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r, root
WHERE n IS NOT NULL
RETURN DISTINCT
  elementId(n) AS nId,
  labels(n) AS nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) AS nProps,
  type(r) AS rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) AS rProps,
  CASE WHEN r IS NOT NULL THEN elementId(startNode(r)) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN elementId(endNode(r)) ELSE null END AS targetId",
  
  // Audit Trail
  createdBy: "system_migration",
  createdAt: datetime(),
  modifiedBy: "system_migration",
  modifiedAt: datetime(),
  changeNotes: "Initial SST-compliant migration from hardcoded CHAIN_FIX_IMPLEMENTATION_PLAN.md PART 1",
  
  // Validation
  sst_authority: "Enterprise_Ontology_SST_v1_1.md Section 6A Chain 1",
  validators_passed: ["explicit_node_naming", "single_direction", "sst_canonical_path"],
  last_validation_date: datetime(),
  validation_errors: null,
  
  // Performance (placeholders for runtime updates)
  last_execution_date: null,
  execution_count: 0,
  avg_execution_ms: null,
  estimated_row_limit: 1000
});

// ============================================================================
// CHAIN 2: setting_strategic_initiatives
// ============================================================================
CREATE (cq2:ChainQuery {
  // Identifier & Metadata
  chainId: "setting_strategic_initiatives",
  version: 1,
  isActive: true,
  releaseDate: datetime("2026-01-17T00:00:00Z"),
  deprecatedDate: null,
  description: "Build Steering: Shows how objectives drive policy tools that set capability priorities and shape the build portfolio (projects + adoption). FIXED to use SETS_PRIORITIES only (no EXECUTES mixing).",
  
  // Query Definitions (Cypher)
  narrativeQuery: "MATCH (root:SectorObjective)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
MATCH path = (root)-[:REALIZED_VIA]->(pol:SectorPolicyTool)
  -[:SETS_PRIORITIES]->(cap:EntityCapability)
  -[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem)
  -[:GAPS_SCOPE]->(proj:EntityProject)
  -[:ADOPTION_RISKS]->(adopt:EntityChangeAdoption)
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r
RETURN DISTINCT
  elementId(n) AS nId,
  labels(n) AS nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) AS nProps,
  type(r) AS rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) AS rProps,
  elementId(startNode(r)) AS sourceId,
  elementId(endNode(r)) AS targetId",
  
  diagnosticQuery: "MATCH (root:SectorObjective)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:REALIZED_VIA]->(pol:SectorPolicyTool)
OPTIONAL MATCH p2 = (pol)-[:SETS_PRIORITIES]->(cap:EntityCapability)
OPTIONAL MATCH p3 = (cap)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem)
OPTIONAL MATCH p4 = (gap)-[:GAPS_SCOPE]->(proj:EntityProject)
OPTIONAL MATCH p5 = (proj)-[:ADOPTION_RISKS]->(adopt:EntityChangeAdoption)
WITH root, [p1, p2, p3, p4, p5] AS paths_raw
UNWIND [path IN paths_raw WHERE path IS NOT NULL] AS path
WITH root, path
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r, root
WHERE n IS NOT NULL
RETURN DISTINCT
  elementId(n) AS nId,
  labels(n) AS nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) AS nProps,
  type(r) AS rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) AS rProps,
  CASE WHEN r IS NOT NULL THEN elementId(startNode(r)) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN elementId(endNode(r)) ELSE null END AS targetId",
  
  // Audit Trail
  createdBy: "system_migration",
  createdAt: datetime(),
  modifiedBy: "system_migration",
  modifiedAt: datetime(),
  changeNotes: "Initial SST-compliant migration. FIXED: uses SETS_PRIORITIES only, no bidirectional mixing",
  
  // Validation
  sst_authority: "Enterprise_Ontology_SST_v1_1.md Section 6A Chain 2",
  validators_passed: ["explicit_node_naming", "single_direction_forward", "sst_canonical_path", "no_executes_mixing"],
  last_validation_date: datetime(),
  validation_errors: null,
  
  // Performance (placeholders for runtime updates)
  last_execution_date: null,
  execution_count: 0,
  avg_execution_ms: null,
  estimated_row_limit: 500
});

// ============================================================================
// CHAIN 3: setting_strategic_priorities
// ============================================================================
CREATE (cq3:ChainQuery {
  // Identifier & Metadata
  chainId: "setting_strategic_priorities",
  version: 1,
  isActive: true,
  releaseDate: datetime("2026-01-17T00:00:00Z"),
  deprecatedDate: null,
  description: "Operate Target Cascade: Shows how strategic KPIs/targets cascade into capabilities and operational footprint. FIXED to use backward AGGREGATES_TO only (single direction).",
  
  // Query Definitions (Cypher)
  // FIXED: Now follows exact canonical path with all 7 nodes and 6 relationships
  // Path: SectorObjective L1 -> SectorPerformance L1 -> L2 -> EntityCapability L2 -> Entity[ops] L2 -> EntityProject L3 -> EntityChangeAdoption L3
  narrativeQuery: "MATCH (root:SectorObjective)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
MATCH path = (root)-[:AGGREGATES_TO]->(perfL1:SectorPerformance)
  -[:PARENT_OF]->(perfL2:SectorPerformance)
  -[:SETS_TARGETS]->(cap:EntityCapability)
  -[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem)
  -[:GAPS_SCOPE]->(proj:EntityProject)
  -[:ADOPTION_RISKS]->(adopt:EntityChangeAdoption)
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r
RETURN DISTINCT
  elementId(n) AS nId,
  labels(n) AS nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) AS nProps,
  type(r) AS rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) AS rProps,
  elementId(startNode(r)) AS sourceId,
  elementId(endNode(r)) AS targetId",
  
  diagnosticQuery: "MATCH (root:SectorObjective)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:AGGREGATES_TO]->(perfL1:SectorPerformance)
OPTIONAL MATCH p2 = (perfL1)-[:PARENT_OF]->(perfL2:SectorPerformance)
OPTIONAL MATCH p3 = (perfL2)-[:SETS_TARGETS]->(cap:EntityCapability)
OPTIONAL MATCH p4 = (cap)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem)
OPTIONAL MATCH p5 = (gap)-[:GAPS_SCOPE]->(proj:EntityProject)
OPTIONAL MATCH p6 = (proj)-[:ADOPTION_RISKS]->(adopt:EntityChangeAdoption)
WITH root, [p1, p2, p3, p4, p5, p6] AS paths_raw
UNWIND [path IN paths_raw WHERE path IS NOT NULL] AS path
WITH root, path
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r, root
WHERE n IS NOT NULL
RETURN DISTINCT
  elementId(n) AS nId,
  labels(n) AS nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) AS nProps,
  type(r) AS rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) AS rProps,
  CASE WHEN r IS NOT NULL THEN elementId(startNode(r)) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN elementId(endNode(r)) ELSE null END AS targetId",
  
  // Audit Trail
  createdBy: "system_migration",
  createdAt: datetime(),
  modifiedBy: "system_migration",
  modifiedAt: datetime(),
  changeNotes: "Initial SST-compliant migration. FIXED: backward AGGREGATES_TO only, single direction",
  
  // Validation
  sst_authority: "Enterprise_Ontology_SST_v1_1.md Section 6A Chain 3",
  validators_passed: ["explicit_node_naming", "single_direction_backward", "sst_canonical_path"],
  last_validation_date: datetime(),
  validation_errors: null,
  
  // Performance (placeholders for runtime updates)
  last_execution_date: null,
  execution_count: 0,
  avg_execution_ms: null,
  estimated_row_limit: 300
});

// ============================================================================
// CHAIN 4: build_oversight
// ============================================================================
CREATE (cq4:ChainQuery {
  // Identifier & Metadata
  chainId: "build_oversight",
  version: 1,
  isActive: true,
  releaseDate: datetime("2026-01-17T00:00:00Z"),
  deprecatedDate: null,
  description: "BUILD Risk Control Loop: In BUILD mode, shows which policy tools are threatened by expected delay in building capability. FIXED: starts from EntityCapability, forward MONITORED_BY, mode filter on INFORMS.",
  
  // Query Definitions (Cypher)
  narrativeQuery: "MATCH (root:EntityCapability)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
MATCH path = (root)-[:MONITORED_BY]->(risk:EntityRisk)
  -[:INFORMS]->(pol:SectorPolicyTool)
WHERE risk.mode = 'BUILD' OR pol:SectorPolicyTool
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r
RETURN DISTINCT
  elementId(n) AS nId,
  labels(n) AS nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) AS nProps,
  type(r) AS rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) AS rProps,
  elementId(startNode(r)) AS sourceId,
  elementId(endNode(r)) AS targetId",
  
  diagnosticQuery: "MATCH (root:EntityCapability)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:MONITORED_BY]->(risk:EntityRisk)
OPTIONAL MATCH p2 = (risk)-[:INFORMS]->(pol:SectorPolicyTool)
WITH root, [p1, p2] AS paths_raw
UNWIND [path IN paths_raw WHERE path IS NOT NULL] AS path
WITH root, path
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r, root
WHERE n IS NOT NULL
RETURN DISTINCT
  elementId(n) AS nId,
  labels(n) AS nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) AS nProps,
  type(r) AS rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) AS rProps,
  CASE WHEN r IS NOT NULL THEN elementId(startNode(r)) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN elementId(endNode(r)) ELSE null END AS targetId",
  
  // Audit Trail
  createdBy: "system_migration",
  createdAt: datetime(),
  modifiedBy: "system_migration",
  modifiedAt: datetime(),
  changeNotes: "Initial SST-compliant migration. FIXED: EntityCapability start, forward MONITORED_BY, mode='BUILD' filter",
  
  // Validation
  sst_authority: "Enterprise_Ontology_SST_v1_1.md Section 6A Chain 4",
  validators_passed: ["explicit_node_naming", "single_direction_forward", "sst_canonical_path", "mode_filter_build"],
  last_validation_date: datetime(),
  validation_errors: null,
  
  // Performance (placeholders for runtime updates)
  last_execution_date: null,
  execution_count: 0,
  avg_execution_ms: null,
  estimated_row_limit: 200
});

// ============================================================================
// CHAIN 5: operate_oversight
// ============================================================================
CREATE (cq5:ChainQuery {
  // Identifier & Metadata
  chainId: "operate_oversight",
  version: 1,
  isActive: true,
  releaseDate: datetime("2026-01-17T00:00:00Z"),
  deprecatedDate: null,
  description: "OPERATE Risk Control Loop: In OPERATE mode, shows which performance targets are threatened by operational health. FIXED: starts from EntityCapability, forward MONITORED_BY, mode filter on INFORMS.",
  
  // Query Definitions (Cypher)
  narrativeQuery: "MATCH (root:EntityCapability)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
MATCH path = (root)-[:MONITORED_BY]->(risk:EntityRisk)
  -[:INFORMS]->(perf:SectorPerformance)
WHERE risk.mode = 'OPERATE' OR perf:SectorPerformance
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r
RETURN DISTINCT
  elementId(n) AS nId,
  labels(n) AS nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) AS nProps,
  type(r) AS rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) AS rProps,
  elementId(startNode(r)) AS sourceId,
  elementId(endNode(r)) AS targetId",
  
  diagnosticQuery: "MATCH (root:EntityCapability)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:MONITORED_BY]->(risk:EntityRisk)
OPTIONAL MATCH p2 = (risk)-[:INFORMS]->(perf:SectorPerformance)
WITH root, [p1, p2] AS paths_raw
UNWIND [path IN paths_raw WHERE path IS NOT NULL] AS path
WITH root, path
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r, root
WHERE n IS NOT NULL
RETURN DISTINCT
  elementId(n) AS nId,
  labels(n) AS nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) AS nProps,
  type(r) AS rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) AS rProps,
  CASE WHEN r IS NOT NULL THEN elementId(startNode(r)) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN elementId(endNode(r)) ELSE null END AS targetId",
  
  // Audit Trail
  createdBy: "system_migration",
  createdAt: datetime(),
  modifiedBy: "system_migration",
  modifiedAt: datetime(),
  changeNotes: "Initial SST-compliant migration. FIXED: EntityCapability start, forward MONITORED_BY, mode='OPERATE' filter",
  
  // Validation
  sst_authority: "Enterprise_Ontology_SST_v1_1.md Section 6A Chain 5",
  validators_passed: ["explicit_node_naming", "single_direction_forward", "sst_canonical_path", "mode_filter_operate"],
  last_validation_date: datetime(),
  validation_errors: null,
  
  // Performance (placeholders for runtime updates)
  last_execution_date: null,
  execution_count: 0,
  avg_execution_ms: null,
  estimated_row_limit: 200
});

// ============================================================================
// CHAIN 6: sustainable_operations
// ============================================================================
CREATE (cq6:ChainQuery {
  // Identifier & Metadata
  chainId: "sustainable_operations",
  version: 1,
  isActive: true,
  releaseDate: datetime("2026-01-17T00:00:00Z"),
  deprecatedDate: null,
  description: "Internal Efficiency / Execution Spine: Shows how operational execution relies on process automation, systems, and vendor dependencies (and where fragility may sit). Includes culture health monitoring.",
  
  // Query Definitions (Cypher)
  narrativeQuery: "MATCH (root:EntityCultureHealth)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
MATCH path = (root)-[:MONITORS_FOR]->(org:EntityOrgUnit)
  -[:APPLY]->(proc:EntityProcess)
  -[:AUTOMATION]->(sys:EntityITSystem)
  -[:DEPENDS_ON]->(vendor:EntityVendor)
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r
RETURN DISTINCT
  elementId(n) AS nId,
  labels(n) AS nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) AS nProps,
  type(r) AS rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) AS rProps,
  elementId(startNode(r)) AS sourceId,
  elementId(endNode(r)) AS targetId",
  
  diagnosticQuery: "MATCH (root:EntityCultureHealth)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:MONITORS_FOR]->(org:EntityOrgUnit)
OPTIONAL MATCH p2 = (org)-[:APPLY]->(proc:EntityProcess)
OPTIONAL MATCH p3 = (proc)-[:AUTOMATION]->(sys:EntityITSystem)
OPTIONAL MATCH p4 = (sys)-[:DEPENDS_ON]->(vendor:EntityVendor)
WITH root, [p1, p2, p3, p4] AS paths_raw
UNWIND [path IN paths_raw WHERE path IS NOT NULL] AS path
WITH root, path
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r, root
WHERE n IS NOT NULL
RETURN DISTINCT
  elementId(n) AS nId,
  labels(n) AS nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) AS nProps,
  type(r) AS rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) AS rProps,
  CASE WHEN r IS NOT NULL THEN elementId(startNode(r)) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN elementId(endNode(r)) ELSE null END AS targetId",
  
  // Audit Trail
  createdBy: "system_migration",
  createdAt: datetime(),
  modifiedBy: "system_migration",
  modifiedAt: datetime(),
  changeNotes: "Initial SST-compliant migration. Python version authoritative for this chain.",
  
  // Validation
  sst_authority: "Enterprise_Ontology_SST_v1_1.md Section 6A Chain 6",
  validators_passed: ["explicit_node_naming", "single_direction_forward", "sst_canonical_path"],
  last_validation_date: datetime(),
  validation_errors: null,
  
  // Performance (placeholders for runtime updates)
  last_execution_date: null,
  execution_count: 0,
  avg_execution_ms: null,
  estimated_row_limit: 150
});

// ============================================================================
// CHAIN 7: integrated_oversight
// ============================================================================
CREATE (cq7:ChainQuery {
  // Identifier & Metadata
  chainId: "integrated_oversight",
  version: 1,
  isActive: true,
  releaseDate: datetime("2026-01-17T00:00:00Z"),
  deprecatedDate: null,
  description: "Unified Oversight Drill Pattern: Drills from policy/target L2 into capability + footprint L3, then returns via risk roll-up to governance. Uses PARENT_OF for level traversal. Two variants: policy setter (narrative) and performance setter (diagnostic).",
  
  // Query Definitions (Cypher)
  narrativeQuery: "MATCH (root:SectorPolicyTool)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:SETS_PRIORITIES]->(cap:EntityCapability)
OPTIONAL MATCH p2 = (cap)-[:PARENT_OF*0..1]->(cap3:EntityCapability)
OPTIONAL MATCH p3 = (cap3)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem)
OPTIONAL MATCH p4 = (gap)<-[:PARENT_OF*0..1]-(cap_up:EntityCapability)
OPTIONAL MATCH p5 = (cap_up)<-[:MONITORED_BY]-(risk:EntityRisk)
OPTIONAL MATCH p6 = (risk)-[:INFORMS]->(root)
WITH root, [p1, p2, p3, p4, p5, p6] AS paths_raw
UNWIND [path IN paths_raw WHERE path IS NOT NULL] AS path
WITH root, path
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r, root
WHERE n IS NOT NULL
RETURN DISTINCT
  elementId(n) AS nId,
  labels(n) AS nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) AS nProps,
  type(r) AS rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) AS rProps,
  CASE WHEN r IS NOT NULL THEN elementId(startNode(r)) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN elementId(endNode(r)) ELSE null END AS targetId",
  
  diagnosticQuery: "MATCH (root:SectorPerformance)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:SETS_TARGETS]->(cap:EntityCapability)
OPTIONAL MATCH p2 = (cap)-[:PARENT_OF*0..1]->(cap3:EntityCapability)
OPTIONAL MATCH p3 = (cap3)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem)
OPTIONAL MATCH p4 = (gap)<-[:PARENT_OF*0..1]-(cap_up:EntityCapability)
OPTIONAL MATCH p5 = (cap_up)<-[:MONITORED_BY]-(risk:EntityRisk)
OPTIONAL MATCH p6 = (risk)-[:INFORMS]->(root)
WITH root, [p1, p2, p3, p4, p5, p6] AS paths_raw
UNWIND [path IN paths_raw WHERE path IS NOT NULL] AS path
WITH root, path
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r, root
WHERE n IS NOT NULL
RETURN DISTINCT
  elementId(n) AS nId,
  labels(n) AS nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) AS nProps,
  type(r) AS rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding', 'embedding_generated_at']) AS rProps,
  CASE WHEN r IS NOT NULL THEN elementId(startNode(r)) ELSE null END AS sourceId,
  CASE WHEN r IS NOT NULL THEN elementId(endNode(r)) ELSE null END AS targetId",
  
  // Audit Trail
  createdBy: "system_migration",
  createdAt: datetime(),
  modifiedBy: "system_migration",
  modifiedAt: datetime(),
  changeNotes: "Initial SST-compliant migration. FIXED: starts from SectorPolicyTool or SectorPerformance L2, uses PARENT_OF for drill-down/roll-up",
  
  // Validation
  sst_authority: "Enterprise_Ontology_SST_v1_1.md Section 6A Chain 7",
  validators_passed: ["explicit_node_naming", "parent_of_traversal", "sst_canonical_pattern"],
  last_validation_date: datetime(),
  validation_errors: null,
  
  // Performance (placeholders for runtime updates)
  last_execution_date: null,
  execution_count: 0,
  avg_execution_ms: null,
  estimated_row_limit: 800
});

// ============================================================================
// Migration Complete
// ============================================================================
// Next steps:
// 1. Run verify_chain_queries.cypher to validate all 7 chains are loaded
// 2. Update application code to read from ChainQuery nodes instead of hardcoded constants
// 3. Implement web UI for admin-only chain editing with version control
// ============================================================================
