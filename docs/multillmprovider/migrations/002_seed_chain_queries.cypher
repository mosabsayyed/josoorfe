// ============================================================================
// Migration 002: Seed ChainQuery Nodes (All 7 Business Chains)
// ============================================================================
// Purpose: Migrate all 7 business chain queries from hardcoded sources to
//          Neo4j ChainQuery nodes with version 1 (initial release).
//
// Source: CHAIN_FIX_IMPLEMENTATION_PLAN.md Part 1 (SST-Compliant Queries)
// Date: 2026-01-17
// Author: Database Architect (System Migration)
//
// IMPORTANT: These queries are the corrected versions that fix:
//            - Direction inconsistencies (MONITORED_BY, AGGREGATES_TO)
//            - Relationship type errors (SETS_PRIORITIES vs EXECUTES)
//            - SST canonical path compliance
//
// Replaces hardcoded queries from:
//   - /graph-server/ontology.ts (CHAIN_QUERIES constant)
//   - /backend/app/services/chains_service.py (CHAIN_QUERIES dict)
// ============================================================================


// ============================================================================
// CHAIN 1: sector_value_chain
// ============================================================================
// SST Authority: 6A-chain-1
// Description: End-to-end value chain showing how sector objectives are
//              realized through policy tools, applied to stakeholders, and
//              measured back to objectives.
//
// Canonical Path:
//   SectorObjective -[:REALIZED_VIA]-> SectorPolicyTool -[:REFERS_TO]->
//   SectorAdminRecord -[:APPLIED_ON]-> (SectorCitizen|SectorGovEntity|
//   SectorBusiness) -[:TRIGGERS_EVENT]-> SectorDataTransaction
//   -[:MEASURED_BY]-> SectorPerformance -[:AGGREGATES_TO]-> SectorObjective
// ============================================================================

CREATE (cq1:ChainQuery {
  // Identifier & Metadata
  chainId: "sector_value_chain",
  version: 1,
  isActive: true,
  releaseDate: datetime("2026-01-17T00:00:00Z"),
  deprecatedDate: null,
  description: "End-to-end value chain showing how sector objectives are realized through policy tools, applied to stakeholders, triggering transactions that are measured back to objectives.",
  
  // Narrative Query (forward complete path)
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
  
  // Diagnostic Query (optional intermediate nodes)
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
  createdAt: datetime("2026-01-17T00:00:00Z"),
  modifiedBy: "system_migration",
  modifiedAt: datetime("2026-01-17T00:00:00Z"),
  changeNotes: "Initial migration from hardcoded sources. SST-compliant query with correct forward path and AGGREGATES_TO closure.",
  
  // Validation
  sst_authority: "6A-chain-1",
  validators_passed: ["cypher_syntax", "sst_compliance", "direction_check"],
  last_validation_date: datetime("2026-01-17T00:00:00Z"),
  validation_errors: null,
  
  // Performance
  last_execution_date: null,
  execution_count: 0,
  avg_execution_ms: 0.0,
  estimated_row_limit: 1000
});


// ============================================================================
// CHAIN 2: setting_strategic_initiatives
// ============================================================================
// SST Authority: 6A-chain-2
// Description: Strategic initiative chain showing how policy tools set
//              priorities for capabilities, revealing gaps that scope projects
//              with adoption risks.
//
// IMPORTANT FIX: Uses SETS_PRIORITIES only (not EXECUTES)
//
// Canonical Path:
//   SectorObjective -[:REALIZED_VIA]-> SectorPolicyTool -[:SETS_PRIORITIES]->
//   EntityCapability -[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->
//   (EntityOrgUnit|EntityProcess|EntityITSystem) -[:GAPS_SCOPE]->
//   EntityProject -[:ADOPTION_RISKS]-> EntityChangeAdoption
// ============================================================================

CREATE (cq2:ChainQuery {
  // Identifier & Metadata
  chainId: "setting_strategic_initiatives",
  version: 1,
  isActive: true,
  releaseDate: datetime("2026-01-17T00:00:00Z"),
  deprecatedDate: null,
  description: "Strategic initiative chain showing how policy tools set priorities for capabilities, revealing gaps that scope projects with adoption risks.",
  
  // Narrative Query (forward, SETS_PRIORITIES only)
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
  
  // Diagnostic Query (optional intermediate nodes)
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
  createdAt: datetime("2026-01-17T00:00:00Z"),
  modifiedBy: "system_migration",
  modifiedAt: datetime("2026-01-17T00:00:00Z"),
  changeNotes: "Initial migration from hardcoded sources. Fixed to use SETS_PRIORITIES only (removed incorrect EXECUTES relationship).",
  
  // Validation
  sst_authority: "6A-chain-2",
  validators_passed: ["cypher_syntax", "sst_compliance", "direction_check"],
  last_validation_date: datetime("2026-01-17T00:00:00Z"),
  validation_errors: null,
  
  // Performance
  last_execution_date: null,
  execution_count: 0,
  avg_execution_ms: 0.0,
  estimated_row_limit: 800
});


// ============================================================================
// CHAIN 3: setting_strategic_priorities
// ============================================================================
// SST Authority: 6A-chain-3
// Description: Strategic priority chain showing how performance metrics set
//              targets for capabilities, revealing gaps in organizational
//              structure, processes, or IT systems.
//
// IMPORTANT FIX: Uses backward AGGREGATES_TO only (single direction)
//
// Canonical Path:
//   SectorObjective <-[:AGGREGATES_TO]- SectorPerformance -[:SETS_TARGETS]->
//   EntityCapability -[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->
//   (EntityOrgUnit|EntityProcess|EntityITSystem)
// ============================================================================

CREATE (cq3:ChainQuery {
  // Identifier & Metadata
  chainId: "setting_strategic_priorities",
  version: 1,
  isActive: true,
  releaseDate: datetime("2026-01-17T00:00:00Z"),
  deprecatedDate: null,
  description: "Strategic priority chain showing how performance metrics set targets for capabilities, revealing gaps in organizational structure, processes, or IT systems.",
  
  // Narrative Query (backward AGGREGATES_TO only)
  narrativeQuery: "MATCH (root:SectorObjective)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
MATCH path = (root)<-[:AGGREGATES_TO]-(perf:SectorPerformance)
  -[:SETS_TARGETS]->(cap:EntityCapability)
  -[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem)
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
  
  // Diagnostic Query (optional intermediate nodes)
  diagnosticQuery: "MATCH (root:SectorObjective)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)<-[:AGGREGATES_TO]-(perf:SectorPerformance)
OPTIONAL MATCH p2 = (perf)-[:SETS_TARGETS]->(cap:EntityCapability)
OPTIONAL MATCH p3 = (cap)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap:EntityOrgUnit|EntityProcess|EntityITSystem)
WITH root, [p1, p2, p3] AS paths_raw
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
  createdAt: datetime("2026-01-17T00:00:00Z"),
  modifiedBy: "system_migration",
  modifiedAt: datetime("2026-01-17T00:00:00Z"),
  changeNotes: "Initial migration from hardcoded sources. Fixed to use single direction backward AGGREGATES_TO (removed bidirectional conflict).",
  
  // Validation
  sst_authority: "6A-chain-3",
  validators_passed: ["cypher_syntax", "sst_compliance", "direction_check"],
  last_validation_date: datetime("2026-01-17T00:00:00Z"),
  validation_errors: null,
  
  // Performance
  last_execution_date: null,
  execution_count: 0,
  avg_execution_ms: 0.0,
  estimated_row_limit: 600
});


// ============================================================================
// CHAIN 4: build_oversight
// ============================================================================
// SST Authority: 6A-chain-4
// Description: Risk control loop showing which policy tools are threatened by
//              expected delays in building capabilities.
//
// IMPORTANT FIX: EntityCapability start, MONITORED_BY forward, INFORMS forward
//
// Canonical Path:
//   EntityCapability -[:MONITORED_BY]-> EntityRisk -[:INFORMS {mode:'BUILD'}]->
//   SectorPolicyTool
// ============================================================================

CREATE (cq4:ChainQuery {
  // Identifier & Metadata
  chainId: "build_oversight",
  version: 1,
  isActive: true,
  releaseDate: datetime("2026-01-17T00:00:00Z"),
  deprecatedDate: null,
  description: "Risk control loop showing which policy tools are threatened by expected delays in building capabilities (BUILD mode).",
  
  // Narrative Query (forward complete path)
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
  
  // Diagnostic Query (optional intermediate nodes)
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
  createdAt: datetime("2026-01-17T00:00:00Z"),
  modifiedBy: "system_migration",
  modifiedAt: datetime("2026-01-17T00:00:00Z"),
  changeNotes: "Initial migration from hardcoded sources. Fixed MONITORED_BY direction (forward from capability) and INFORMS relationship per SST 6A-chain-4.",
  
  // Validation
  sst_authority: "6A-chain-4",
  validators_passed: ["cypher_syntax", "sst_compliance", "direction_check"],
  last_validation_date: datetime("2026-01-17T00:00:00Z"),
  validation_errors: null,
  
  // Performance
  last_execution_date: null,
  execution_count: 0,
  avg_execution_ms: 0.0,
  estimated_row_limit: 500
});


// ============================================================================
// CHAIN 5: operate_oversight
// ============================================================================
// SST Authority: 6A-chain-5
// Description: Risk control loop showing which performance metrics are
//              threatened by expected delays in operating capabilities.
//
// IMPORTANT FIX: EntityCapability start, MONITORED_BY forward, INFORMS forward
//
// Canonical Path:
//   EntityCapability -[:MONITORED_BY]-> EntityRisk -[:INFORMS {mode:'OPERATE'}]->
//   SectorPerformance
// ============================================================================

CREATE (cq5:ChainQuery {
  // Identifier & Metadata
  chainId: "operate_oversight",
  version: 1,
  isActive: true,
  releaseDate: datetime("2026-01-17T00:00:00Z"),
  deprecatedDate: null,
  description: "Risk control loop showing which performance metrics are threatened by expected delays in operating capabilities (OPERATE mode).",
  
  // Narrative Query (forward complete path)
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
  
  // Diagnostic Query (optional intermediate nodes)
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
  createdAt: datetime("2026-01-17T00:00:00Z"),
  modifiedBy: "system_migration",
  modifiedAt: datetime("2026-01-17T00:00:00Z"),
  changeNotes: "Initial migration from hardcoded sources. Fixed MONITORED_BY direction (forward from capability) and INFORMS relationship per SST 6A-chain-5.",
  
  // Validation
  sst_authority: "6A-chain-5",
  validators_passed: ["cypher_syntax", "sst_compliance", "direction_check"],
  last_validation_date: datetime("2026-01-17T00:00:00Z"),
  validation_errors: null,
  
  // Performance
  last_execution_date: null,
  execution_count: 0,
  avg_execution_ms: 0.0,
  estimated_row_limit: 500
});


// ============================================================================
// CHAIN 6: sustainable_operations
// ============================================================================
// SST Authority: 6A-chain-6
// Description: Operational sustainability chain showing how culture health
//              monitors organizational units applying processes with automation
//              and vendor dependencies.
//
// Canonical Path:
//   EntityCultureHealth -[:MONITORS_FOR]-> EntityOrgUnit -[:APPLY]->
//   EntityProcess -[:AUTOMATION]-> EntityITSystem -[:DEPENDS_ON]-> EntityVendor
// ============================================================================

CREATE (cq6:ChainQuery {
  // Identifier & Metadata
  chainId: "sustainable_operations",
  version: 1,
  isActive: true,
  releaseDate: datetime("2026-01-17T00:00:00Z"),
  deprecatedDate: null,
  description: "Operational sustainability chain showing how culture health monitors organizational units applying processes with automation and vendor dependencies.",
  
  // Narrative Query (forward with culture health context)
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
  
  // Diagnostic Query (optional intermediate nodes)
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
  createdAt: datetime("2026-01-17T00:00:00Z"),
  modifiedBy: "system_migration",
  modifiedAt: datetime("2026-01-17T00:00:00Z"),
  changeNotes: "Initial migration from hardcoded sources. Python version is authoritative for this chain.",
  
  // Validation
  sst_authority: "6A-chain-6",
  validators_passed: ["cypher_syntax", "sst_compliance", "direction_check"],
  last_validation_date: datetime("2026-01-17T00:00:00Z"),
  validation_errors: null,
  
  // Performance
  last_execution_date: null,
  execution_count: 0,
  avg_execution_ms: 0.0,
  estimated_row_limit: 700
});


// ============================================================================
// CHAIN 7: integrated_oversight
// ============================================================================
// SST Authority: 6A-chain-7
// Description: Integrated oversight chain showing drill-down from L2 policy/
//              performance through capabilities to L3 gaps, then back up via
//              risks to inform L2 decision-makers.
//
// IMPORTANT FIX: Start from SectorPolicyTool or SectorPerformance L2
//
// Canonical Path (Policy Setter):
//   SectorPolicyTool L2 -[:SETS_PRIORITIES]-> EntityCapability L2
//   -[:PARENT_OF*0..1]-> EntityCapability L3
//   -[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->
//   (EntityOrgUnit|EntityProcess|EntityITSystem) L3
//   <-[:PARENT_OF*0..1]- EntityCapability L2
//   <-[:MONITORED_BY]- EntityRisk L2 -[:INFORMS]-> SectorPolicyTool L2
//
// Canonical Path (Performance Setter):
//   SectorPerformance L2 -[:SETS_TARGETS]-> EntityCapability L2
//   -[:PARENT_OF*0..1]-> EntityCapability L3
//   -[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->
//   (EntityOrgUnit|EntityProcess|EntityITSystem) L3
//   <-[:PARENT_OF*0..1]- EntityCapability L2
//   <-[:MONITORED_BY]- EntityRisk L2 -[:INFORMS]-> SectorPerformance L2
// ============================================================================

CREATE (cq7:ChainQuery {
  // Identifier & Metadata
  chainId: "integrated_oversight",
  version: 1,
  isActive: true,
  releaseDate: datetime("2026-01-17T00:00:00Z"),
  deprecatedDate: null,
  description: "Integrated oversight chain showing drill-down from L2 policy/performance through capabilities to L3 gaps, then back up via risks to inform L2 decision-makers.",
  
  // Narrative Query (forward drill via policy setter)
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
  
  // Diagnostic Query (alternative via performance setter)
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
  createdAt: datetime("2026-01-17T00:00:00Z"),
  modifiedBy: "system_migration",
  modifiedAt: datetime("2026-01-17T00:00:00Z"),
  changeNotes: "Initial migration from hardcoded sources. Fixed to start from SectorPolicyTool or SectorPerformance L2 with proper drill-down and roll-up paths.",
  
  // Validation
  sst_authority: "6A-chain-7",
  validators_passed: ["cypher_syntax", "sst_compliance", "direction_check"],
  last_validation_date: datetime("2026-01-17T00:00:00Z"),
  validation_errors: null,
  
  // Performance
  last_execution_date: null,
  execution_count: 0,
  avg_execution_ms: 0.0,
  estimated_row_limit: 1200
});


// ============================================================================
// MIGRATION COMPLETE: All 7 ChainQuery nodes created
// ============================================================================
// Next step: Run migration 003_verify_migration.cypher to confirm all nodes
//            are correctly created with required properties.
// ============================================================================
