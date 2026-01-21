// ============================================================================
// CHAIN QUERY VERIFICATION SCRIPT
// ============================================================================
// Version: 1.0
// Date: 2026-01-17
// Purpose: Validate that all 7 SST-compliant chain queries were successfully migrated
//
// USAGE:
// Run this script after seed_chain_queries.cypher to verify migration success:
//   cat verify_chain_queries.cypher | cypher-shell -u neo4j -p <password>
// ============================================================================

// ----------------------------------------------------------------------------
// 1. Count total ChainQuery nodes (should be 7)
// ----------------------------------------------------------------------------
MATCH (cq:ChainQuery)
RETURN "Total ChainQuery Nodes" AS check,
       count(cq) AS count,
       CASE WHEN count(cq) = 7 THEN "✓ PASS" ELSE "✗ FAIL - Expected 7" END AS status;

// ----------------------------------------------------------------------------
// 2. Count active chains (should be 7, one per chainId)
// ----------------------------------------------------------------------------
MATCH (cq:ChainQuery)
WHERE cq.isActive = true
RETURN "Active ChainQuery Nodes" AS check,
       count(cq) AS count,
       CASE WHEN count(cq) = 7 THEN "✓ PASS" ELSE "✗ FAIL - Expected 7 active" END AS status;

// ----------------------------------------------------------------------------
// 3. List all active chains with metadata
// ----------------------------------------------------------------------------
MATCH (cq:ChainQuery)
WHERE cq.isActive = true
RETURN cq.chainId AS chainId,
       cq.version AS version,
       cq.description AS description,
       cq.sst_authority AS sstAuthority,
       cq.createdBy AS createdBy,
       cq.createdAt AS createdAt,
       size(cq.validators_passed) AS validatorsPassed
ORDER BY cq.chainId;

// ----------------------------------------------------------------------------
// 4. Verify all expected chainIds exist
// ----------------------------------------------------------------------------
WITH [
  "sector_value_chain",
  "setting_strategic_initiatives",
  "setting_strategic_priorities",
  "build_oversight",
  "operate_oversight",
  "sustainable_operations",
  "integrated_oversight"
] AS expected_chains
MATCH (cq:ChainQuery)
WHERE cq.isActive = true
WITH expected_chains, collect(cq.chainId) AS actual_chains
RETURN "Expected Chains Coverage" AS check,
       size([chain IN expected_chains WHERE chain IN actual_chains]) AS found,
       size(expected_chains) AS total,
       CASE 
         WHEN size([chain IN expected_chains WHERE chain IN actual_chains]) = size(expected_chains)
         THEN "✓ PASS - All 7 chains present"
         ELSE "✗ FAIL - Missing chains: " + toString([chain IN expected_chains WHERE NOT chain IN actual_chains])
       END AS status;

// ----------------------------------------------------------------------------
// 5. Verify narrativeQuery and diagnosticQuery are non-empty
// ----------------------------------------------------------------------------
MATCH (cq:ChainQuery)
WHERE cq.isActive = true
WITH cq,
     CASE WHEN cq.narrativeQuery IS NOT NULL AND size(cq.narrativeQuery) > 0 THEN 1 ELSE 0 END AS hasNarrative,
     CASE WHEN cq.diagnosticQuery IS NOT NULL AND size(cq.diagnosticQuery) > 0 THEN 1 ELSE 0 END AS hasDiagnostic
RETURN "Query Completeness" AS check,
       sum(hasNarrative) AS chainsWithNarrative,
       sum(hasDiagnostic) AS chainsWithDiagnostic,
       CASE 
         WHEN sum(hasNarrative) = 7 AND sum(hasDiagnostic) = 7
         THEN "✓ PASS - All chains have both queries"
         ELSE "✗ FAIL - Some chains missing queries"
       END AS status;

// ----------------------------------------------------------------------------
// 6. Verify SST authority references
// ----------------------------------------------------------------------------
MATCH (cq:ChainQuery)
WHERE cq.isActive = true
WITH cq,
     CASE WHEN cq.sst_authority IS NOT NULL AND cq.sst_authority CONTAINS "Section 6A" THEN 1 ELSE 0 END AS hasAuthority
RETURN "SST Authority Reference" AS check,
       sum(hasAuthority) AS chainsWithAuthority,
       CASE 
         WHEN sum(hasAuthority) = 7
         THEN "✓ PASS - All chains reference SST Section 6A"
         ELSE "✗ FAIL - Some chains missing SST authority"
       END AS status;

// ----------------------------------------------------------------------------
// 7. Verify audit trail completeness
// ----------------------------------------------------------------------------
MATCH (cq:ChainQuery)
WHERE cq.isActive = true
WITH cq,
     CASE WHEN cq.createdBy IS NOT NULL THEN 1 ELSE 0 END AS hasCreatedBy,
     CASE WHEN cq.createdAt IS NOT NULL THEN 1 ELSE 0 END AS hasCreatedAt,
     CASE WHEN cq.changeNotes IS NOT NULL THEN 1 ELSE 0 END AS hasChangeNotes
RETURN "Audit Trail Completeness" AS check,
       sum(hasCreatedBy) AS withCreatedBy,
       sum(hasCreatedAt) AS withCreatedAt,
       sum(hasChangeNotes) AS withChangeNotes,
       CASE 
         WHEN sum(hasCreatedBy) = 7 AND sum(hasCreatedAt) = 7 AND sum(hasChangeNotes) = 7
         THEN "✓ PASS - All chains have complete audit trail"
         ELSE "✗ FAIL - Some chains missing audit fields"
       END AS status;

// ----------------------------------------------------------------------------
// 8. Verify validator flags
// ----------------------------------------------------------------------------
MATCH (cq:ChainQuery)
WHERE cq.isActive = true
WITH cq,
     CASE WHEN "explicit_node_naming" IN cq.validators_passed THEN 1 ELSE 0 END AS hasExplicitNaming,
     CASE WHEN "sst_canonical_path" IN cq.validators_passed OR "sst_canonical_pattern" IN cq.validators_passed THEN 1 ELSE 0 END AS hasSSTPath
RETURN "Validator Flags" AS check,
       sum(hasExplicitNaming) AS withExplicitNaming,
       sum(hasSSTPath) AS withSSTPath,
       CASE 
         WHEN sum(hasExplicitNaming) = 7 AND sum(hasSSTPath) = 7
         THEN "✓ PASS - All chains have core validators"
         ELSE "✗ FAIL - Some chains missing validators"
       END AS status;

// ----------------------------------------------------------------------------
// 9. Sample query text (first 100 chars of narrativeQuery)
// ----------------------------------------------------------------------------
MATCH (cq:ChainQuery)
WHERE cq.isActive = true
RETURN cq.chainId AS chainId,
       substring(cq.narrativeQuery, 0, 100) + "..." AS narrativeQueryPreview
ORDER BY cq.chainId;

// ----------------------------------------------------------------------------
// 10. Validation errors check (should all be null)
// ----------------------------------------------------------------------------
MATCH (cq:ChainQuery)
WHERE cq.isActive = true
RETURN "Validation Errors" AS check,
       count(cq) AS totalChains,
       size([c IN collect(cq) WHERE c.validation_errors IS NOT NULL AND size(c.validation_errors) > 0]) AS chainsWithErrors,
       CASE 
         WHEN size([c IN collect(cq) WHERE c.validation_errors IS NOT NULL AND size(c.validation_errors) > 0]) = 0
         THEN "✓ PASS - No validation errors"
         ELSE "✗ FAIL - Some chains have validation errors"
       END AS status;

// ============================================================================
// Verification Complete
// ============================================================================
// If all checks show "✓ PASS", the migration was successful.
// If any check shows "✗ FAIL", review the seed_chain_queries.cypher script
// and re-run after fixing issues.
// ============================================================================
