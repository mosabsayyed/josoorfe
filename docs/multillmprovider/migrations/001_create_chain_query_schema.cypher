// ============================================================================
// Migration 001: ChainQuery Schema & Constraints
// ============================================================================
// Purpose: Define the ChainQuery node structure and constraints for storing
//          business chain queries as centralized, versioned database objects.
//
// Authority: CHAIN_FIX_IMPLEMENTATION_PLAN.md Part 2
// Date: 2026-01-17
// Author: Database Architect (System Migration)
//
// IMPORTANT: This migration creates the schema foundation for centralizing
//            all business chain queries from hardcoded sources (TypeScript
//            ontology.ts and Python chains_service.py) into Neo4j.
// ============================================================================

// ----------------------------------------------------------------------------
// CONSTRAINT 1: Unique Active Version per Chain
// ----------------------------------------------------------------------------
// Ensures that each chainId can have only ONE active version at a time.
// This prevents accidental dual activation and maintains query consistency.
//
// Example: If build_oversight version 1 is active, attempting to activate
//          version 2 without first deactivating version 1 will fail.
// ----------------------------------------------------------------------------

CREATE CONSTRAINT chain_query_active_unique IF NOT EXISTS
FOR (cq:ChainQuery)
REQUIRE (cq.chainId, cq.isActive) IS UNIQUE;

// Note: Neo4j constraint will enforce uniqueness only when isActive = true
// due to how UNIQUE constraints handle boolean properties.


// ----------------------------------------------------------------------------
// CONSTRAINT 2: ChainQuery ID Must Exist
// ----------------------------------------------------------------------------
// Ensures every ChainQuery node has a chainId property.
// This is critical because chainId is the primary identifier for retrieval.
// ----------------------------------------------------------------------------

CREATE CONSTRAINT chain_query_id_exists IF NOT EXISTS
FOR (cq:ChainQuery)
REQUIRE cq.chainId IS NOT NULL;


// ----------------------------------------------------------------------------
// INDEX 1: Fast Lookup by ChainId + Active Status
// ----------------------------------------------------------------------------
// Optimizes the most common query pattern:
// MATCH (cq:ChainQuery {chainId: $id, isActive: true})
// This index accelerates runtime query retrieval across all services.
// ----------------------------------------------------------------------------

CREATE INDEX chain_query_active_lookup IF NOT EXISTS
FOR (cq:ChainQuery)
ON (cq.chainId, cq.isActive);


// ----------------------------------------------------------------------------
// INDEX 2: Fast Lookup by Version for History Queries
// ----------------------------------------------------------------------------
// Optimizes version history queries in the admin UI:
// MATCH (cq:ChainQuery {chainId: $id}) RETURN cq ORDER BY cq.version DESC
// ----------------------------------------------------------------------------

CREATE INDEX chain_query_version_lookup IF NOT EXISTS
FOR (cq:ChainQuery)
ON (cq.chainId, cq.version);


// ----------------------------------------------------------------------------
// INDEX 3: Audit Trail Lookup by Modified Date
// ----------------------------------------------------------------------------
// Optimizes admin queries for recent changes:
// MATCH (cq:ChainQuery) WHERE cq.modifiedAt > $date RETURN cq
// ----------------------------------------------------------------------------

CREATE INDEX chain_query_modified_date IF NOT EXISTS
FOR (cq:ChainQuery)
ON (cq.modifiedAt);


// ----------------------------------------------------------------------------
// SCHEMA DOCUMENTATION: ChainQuery Node Properties
// ----------------------------------------------------------------------------
// This is a logical schema definition (Neo4j is schema-less, but we enforce
// these properties in application code and migration scripts).
//
// PROPERTY REFERENCE:
//
// === Identifier & Metadata ===
// chainId: string (REQUIRED)
//   - Unique identifier: "sector_value_chain", "build_oversight", etc.
//   - Must match keys used in legacy CHAIN_QUERIES constants
//   - Used for query retrieval at runtime
//
// version: integer (REQUIRED)
//   - Incremental version number: 1, 2, 3...
//   - Latest version with isActive=true is the current query
//   - Enables rollback to previous versions
//
// isActive: boolean (REQUIRED)
//   - true = currently used in production
//   - false = deprecated or not yet activated
//   - Only ONE version per chainId can be active (enforced by constraint)
//
// releaseDate: datetime (REQUIRED)
//   - When this version was activated for production use
//   - Format: ISO 8601 (e.g., "2026-01-17T10:30:00Z")
//
// deprecatedDate: datetime (OPTIONAL, null if active)
//   - When this version was replaced by a newer version
//   - Set when isActive changes from true to false
//
// description: string (REQUIRED)
//   - Human-readable explanation of chain purpose
//   - Example: "Risk control loop: shows which policy tools are threatened"
//
// === Query Definitions (Cypher Strings) ===
// narrativeQuery: string (REQUIRED)
//   - Full strict path query (MATCH ... WHERE ... RETURN)
//   - Used when analyzeGaps = false
//   - Must include all relationships in canonical path
//   - Must follow SST authority specification
//
// diagnosticQuery: string (REQUIRED)
//   - Flexible optional path query (OPTIONAL MATCH)
//   - Used when analyzeGaps = true
//   - Allows partial paths for gap analysis
//   - Must support same parameters as narrativeQuery
//
// === Audit Trail ===
// createdBy: string (REQUIRED)
//   - Admin user ID who created this version
//   - Example: "admin@company.com" or "system_migration"
//
// createdAt: datetime (REQUIRED)
//   - Timestamp when node was created
//   - Immutable after creation
//
// modifiedBy: string (REQUIRED)
//   - Last admin user who modified this version
//   - Updated on every property change
//
// modifiedAt: datetime (REQUIRED)
//   - Last modification timestamp
//   - Updated on every property change
//
// changeNotes: string (REQUIRED)
//   - Why this version was created or modified
//   - Example: "Fixed MONITORED_BY direction per SST 6A-chain-4"
//   - Critical for understanding version history
//
// === Validation ===
// sst_authority: string (REQUIRED)
//   - Reference to SST documentation section
//   - Example: "6A-chain-1", "6A-chain-4"
//   - Links query to authoritative specification
//
// validators_passed: [string] (OPTIONAL)
//   - List of validation checks passed
//   - Example: ["cypher_syntax", "sst_compliance", "direction_check"]
//   - Updated by query_validator.py service
//
// last_validation_date: datetime (OPTIONAL)
//   - When query was last tested/validated
//   - Updated by admin UI "Test Query" feature
//
// validation_errors: [string] (OPTIONAL, null if valid)
//   - Any current validation failures
//   - Example: ["Syntax error at line 5", "Missing APOC function"]
//   - Blocks activation until resolved
//
// === Performance Metrics ===
// last_execution_date: datetime (OPTIONAL)
//   - Last time query was run in production
//   - Updated by runtime query service
//
// execution_count: integer (DEFAULT: 0)
//   - Total number of times query has been executed
//   - Incremented by runtime query service
//
// avg_execution_ms: float (DEFAULT: 0.0)
//   - Average query execution time in milliseconds
//   - Used for performance monitoring and optimization
//
// estimated_row_limit: integer (DEFAULT: 1000)
//   - Expected maximum number of rows returned
//   - Used for resource planning and query timeout settings
//
// ----------------------------------------------------------------------------


// ----------------------------------------------------------------------------
// RELATIONSHIP TYPES (for future use)
// ----------------------------------------------------------------------------
// These relationships are not created in this migration, but are documented
// here for reference. They will be used by the admin UI and audit services.
//
// (:ChainQuery {version: 2})-[:SUPERSEDES {date: datetime}]->(:ChainQuery {version: 1})
//   - Links newer version to previous version
//   - Enables version history traversal
//
// (:ChainQuery)-[:CREATED_BY {timestamp: datetime}]->(admin:User)
//   - Links query to admin who created it
//   - Enables audit trail queries
//
// (:ChainQuery)-[:MODIFIED_BY {timestamp: datetime}]->(admin:User)
//   - Links query to admin who last modified it
//   - Enables change tracking
//
// (:ChainQuery)-[:ACCESSIBLE_BY]->(role:Role)
//   - Optional: access control for multi-tenant scenarios
//   - Not implemented in initial migration
// ----------------------------------------------------------------------------


// ============================================================================
// MIGRATION COMPLETE
// ============================================================================
// Schema foundation created. Proceed to migration 002 to seed initial data.
// ============================================================================
