# Chain Query Centralization: Database Migration

**Version:** 1.0  
**Date:** 2026-01-17  
**Authority:** Enterprise_Ontology_SST_v1_1.md (Section 6A) + CHAIN_FIX_IMPLEMENTATION_PLAN.md (PART 1)

---

## Purpose

This migration moves all 7 SST-compliant business chain queries from hardcoded Python/JavaScript sources into a centralized Neo4j database schema, enabling:

1. **Single Source of Truth**: All chain queries stored in one authoritative location
2. **Version Control**: Full audit trail of query changes with version history
3. **Admin-Only Writes**: Web UI for controlled query updates by authorized admins
4. **Runtime Read-Only**: Application reads active queries from database at runtime
5. **SST Compliance**: All queries validated against Enterprise_Ontology_SST_v1_1.md canonical paths

---

## Schema Design

### ChainQuery Node Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `chainId` | string | ✓ | Unique identifier (e.g., "sector_value_chain") |
| `version` | integer | ✓ | Incremental version number (1, 2, 3...) |
| `isActive` | boolean | ✓ | true = currently active, false = deprecated |
| `releaseDate` | datetime | ✓ | When this version was activated |
| `deprecatedDate` | datetime | | When this version was replaced (null if active) |
| `description` | string | ✓ | Human-readable chain purpose |
| `narrativeQuery` | string | ✓ | Full strict path query (forward complete) |
| `diagnosticQuery` | string | ✓ | Flexible optional path query (OPTIONAL MATCH) |
| `createdBy` | string | ✓ | Admin user ID who created this version |
| `createdAt` | datetime | ✓ | Creation timestamp |
| `modifiedBy` | string | ✓ | Last admin who modified |
| `modifiedAt` | datetime | ✓ | Last modification timestamp |
| `changeNotes` | string | ✓ | Why this version was created |
| `sst_authority` | string | ✓ | Reference to SST section (e.g., "Section 6A Chain 4") |
| `validators_passed` | [string] | ✓ | List of validation rules passed |
| `last_validation_date` | datetime | ✓ | When last tested |
| `validation_errors` | [string] | | Any current validation failures (null if none) |
| `last_execution_date` | datetime | | Last time query was run in production |
| `execution_count` | integer | | Total executions |
| `avg_execution_ms` | float | | Average query execution time |
| `estimated_row_limit` | integer | | Typical max row return |

### Constraints

```cypher
// Unique constraint on chainId + version
CREATE CONSTRAINT chain_query_unique_id_version IF NOT EXISTS
FOR (cq:ChainQuery) REQUIRE (cq.chainId, cq.version) IS UNIQUE;
```

**Note:** Neo4j does not support conditional unique constraints (e.g., "only one active per chainId"). This is enforced via application logic: before setting `isActive=true` on a new version, set all prior versions of the same `chainId` to `isActive=false`.

### Relationships (Future Extensions)

```cypher
// Version history
(:ChainQuery {version: 2})-[:SUPERSEDES {date: datetime}]->(:ChainQuery {version: 1})

// Audit trail
(:ChainQuery)-[:CREATED_BY {timestamp: datetime}]->(admin:User)
(:ChainQuery)-[:MODIFIED_BY {timestamp: datetime}]->(admin:User)

// Access control (optional)
(:ChainQuery)-[:ACCESSIBLE_BY]->(role:Role)
```

---

## Migration Files

### 1. `seed_chain_queries.cypher`

**Purpose:** Creates all 7 ChainQuery nodes with SST-compliant queries from PART 1 of the implementation plan.

**Chains Migrated:**
1. `sector_value_chain` - External Influence Loop
2. `setting_strategic_initiatives` - Build Steering (FIXED: SETS_PRIORITIES only)
3. `setting_strategic_priorities` - Operate Target Cascade (FIXED: backward AGGREGATES_TO)
4. `build_oversight` - BUILD Risk Control Loop (FIXED: forward from EntityCapability)
5. `operate_oversight` - OPERATE Risk Control Loop (FIXED: forward from EntityCapability)
6. `sustainable_operations` - Internal Efficiency Spine
7. `integrated_oversight` - Unified Oversight Drill Pattern (L2 → L3 → L2)

**Execution:**
```bash
# Using cypher-shell
cat seed_chain_queries.cypher | cypher-shell -u neo4j -p <password> -d neo4j

# Or via Neo4j Browser
# Copy/paste the entire file into Neo4j Browser and execute
```

### 2. `verify_chain_queries.cypher`

**Purpose:** Validates that all 7 chains were successfully migrated and meet quality checks.

**Validation Checks:**
1. Total ChainQuery nodes = 7
2. Active chains = 7 (one per chainId)
3. All expected chainIds present
4. All chains have non-empty narrativeQuery and diagnosticQuery
5. All chains reference SST Section 6A authority
6. Complete audit trail (createdBy, createdAt, changeNotes)
7. Core validators present (explicit_node_naming, sst_canonical_path)
8. No validation errors

**Execution:**
```bash
# Using cypher-shell
cat verify_chain_queries.cypher | cypher-shell -u neo4j -p <password> -d neo4j

# Or via Neo4j Browser
# Copy/paste and execute
```

**Expected Output:** All checks should show `✓ PASS`. If any show `✗ FAIL`, review the seed script and re-run.

---

## Design Decisions

### 1. **Single Active Version Per Chain**

**Decision:** Only one `isActive=true` version per `chainId` at any time.

**Rationale:**
- Application runtime should never be ambiguous about which query to execute
- Prevents accidental duplication or conflicting queries
- Clear rollback path: deactivate current, reactivate previous version

**Implementation:** Application logic enforces this before setting `isActive=true`:
```cypher
// Before activating new version 2
MATCH (old:ChainQuery {chainId: "sector_value_chain", isActive: true})
SET old.isActive = false, old.deprecatedDate = datetime()
// Then activate new version
MATCH (new:ChainQuery {chainId: "sector_value_chain", version: 2})
SET new.isActive = true
```

### 2. **Narrative vs Diagnostic Queries**

**Decision:** Store two query variants per chain:
- **narrativeQuery**: Strict path using `MATCH path = (...)` - returns only complete paths
- **diagnosticQuery**: Flexible using `OPTIONAL MATCH p1, p2, ...` - returns partial paths for debugging

**Rationale:**
- Narrative: User-facing, clear business story, strict data quality
- Diagnostic: Admin/developer tool for troubleshooting incomplete data
- Different use cases require different query strictness

### 3. **SST Authority Reference**

**Decision:** Store explicit reference to SST document section (e.g., "Enterprise_Ontology_SST_v1_1.md Section 6A Chain 4").

**Rationale:**
- Traceability: every query links back to canonical definition
- Compliance: auditors can verify queries match SST authority
- Change management: if SST changes, know which queries to update

### 4. **Validator Flags**

**Decision:** Store array of validator rule names that this query passed (e.g., `["explicit_node_naming", "single_direction", "sst_canonical_path"]`).

**Rationale:**
- Self-documenting: shows which quality rules were checked
- Regression prevention: re-run validators on future versions
- Audit trail: proves query was validated before activation

### 5. **Performance Metadata**

**Decision:** Include runtime performance fields (`last_execution_date`, `execution_count`, `avg_execution_ms`).

**Rationale:**
- Monitoring: identify slow queries for optimization
- Usage analytics: which chains are most popular
- Capacity planning: estimate query load on Neo4j

**Note:** These are placeholders in v1. Application should update them via:
```cypher
MATCH (cq:ChainQuery {chainId: $chainId, isActive: true})
SET cq.execution_count = cq.execution_count + 1,
    cq.last_execution_date = datetime(),
    cq.avg_execution_ms = (cq.avg_execution_ms * (cq.execution_count - 1) + $execution_ms) / cq.execution_count
```

### 6. **Version Control Pattern**

**Decision:** Incremental integer versions (1, 2, 3...), not semantic versioning.

**Rationale:**
- Simplicity: no need for semver complexity in this use case
- Clear history: version 3 always supersedes version 2
- Query performance: integer comparison faster than string parsing

**Alternative Considered:** Semantic versioning (1.0.0, 1.1.0, 2.0.0) - rejected as overkill.

---

## Next Steps (Post-Migration)

### 1. **Update Application Code**

Replace hardcoded chain query constants with database reads:

**Python Example:**
```python
def get_active_chain_query(chain_id: str, query_type: str = "narrative"):
    query = """
    MATCH (cq:ChainQuery {chainId: $chainId, isActive: true})
    RETURN cq.narrativeQuery AS narrative, cq.diagnosticQuery AS diagnostic
    """
    result = graph.run(query, chainId=chain_id).data()[0]
    return result[query_type]

# Usage
sector_value_chain_query = get_active_chain_query("sector_value_chain", "narrative")
```

**JavaScript Example:**
```javascript
async function getActiveChainQuery(chainId, queryType = 'narrative') {
  const result = await session.run(
    `MATCH (cq:ChainQuery {chainId: $chainId, isActive: true})
     RETURN cq.narrativeQuery AS narrative, cq.diagnosticQuery AS diagnostic`,
    { chainId }
  );
  return result.records[0].get(queryType);
}

// Usage
const query = await getActiveChainQuery('sector_value_chain', 'narrative');
```

### 2. **Implement Web UI for Chain Management**

**Requirements:**
- Admin-only access (role-based authentication)
- CRUD operations:
  - **Create**: New chain version with validation
  - **Read**: View current and historical versions
  - **Update**: Create new version (never edit existing)
  - **Activate**: Set new version as active, deactivate old
- Validation before save:
  - Cypher syntax check
  - SST compliance check (explicit naming, single direction)
  - Dry-run execution test (return sample data)
- Diff view: compare versions side-by-side
- Change log: audit trail of who changed what when

**Tech Stack Suggestions:**
- FastAPI + React Admin
- Supabase + Next.js
- Django Admin + custom forms

### 3. **Implement Automated Validators**

**Validation Rules:**
```python
def validate_chain_query(query_text: str) -> List[str]:
    validators_passed = []
    
    # 1. Explicit node naming
    if re.search(r'\(root:', query_text):
        validators_passed.append("explicit_node_naming")
    
    # 2. No bidirectional mixing
    if not (re.search(r'<-\[:.*\]->', query_text) or 
            (re.search(r'-\[:.*\]->', query_text) and re.search(r'<-\[:.*\]-', query_text))):
        validators_passed.append("single_direction")
    
    # 3. SST canonical paths (check against known patterns)
    # ... (implementation depends on SST structure)
    
    # 4. Cypher syntax
    try:
        graph.run(f"EXPLAIN {query_text}")
        validators_passed.append("valid_cypher_syntax")
    except:
        pass
    
    return validators_passed
```

### 4. **Set Up Monitoring**

**Key Metrics:**
- Query execution time per chain (track `avg_execution_ms`)
- Query failure rate (log errors to `validation_errors`)
- Version change frequency (audit `createdAt` timestamps)
- Chain usage distribution (sum `execution_count` per chain)

**Alerting:**
- Alert if any chain's `avg_execution_ms` > 5000ms
- Alert if `validation_errors` is not null for active chain
- Alert if no active version for a chainId

---

## Rollback Procedure

If a new chain version causes issues, revert to the previous version:

```cypher
// 1. Deactivate current broken version
MATCH (broken:ChainQuery {chainId: "sector_value_chain", version: 2})
SET broken.isActive = false,
    broken.deprecatedDate = datetime(),
    broken.validation_errors = ["runtime_failure: " + $error_message]

// 2. Reactivate previous stable version
MATCH (stable:ChainQuery {chainId: "sector_value_chain", version: 1})
SET stable.isActive = true,
    stable.deprecatedDate = null

// 3. Log rollback
MATCH (stable:ChainQuery {chainId: "sector_value_chain", version: 1})
SET stable.modifiedBy = $admin_user,
    stable.modifiedAt = datetime(),
    stable.changeNotes = "Rolled back from v2 due to: " + $error_message
```

---

## FAQ

### Q: Can I edit an existing ChainQuery node?

**A:** No. ChainQuery nodes are immutable once created. To update a query:
1. Create a new version with incremented `version` number
2. Copy the old query text and modify it
3. Set `isActive=true` on new version, `isActive=false` on old version
4. Add detailed `changeNotes` explaining the change

This ensures full audit trail and ability to rollback.

### Q: How do I test a new query before activating it?

**A:** Create the new version with `isActive=false`, then:
1. Run it manually in Neo4j Browser with test parameters
2. Use the diagnostic variant to check for partial paths
3. Compare output with previous version
4. Only set `isActive=true` after validation

### Q: What if two admins try to create version 2 simultaneously?

**A:** The unique constraint on `(chainId, version)` will prevent this. The second attempt will fail with a constraint violation error. The web UI should handle this gracefully:
```python
try:
    graph.run("CREATE (cq:ChainQuery {chainId: $chainId, version: $version, ...})", ...)
except ConstraintViolationError:
    # Fetch latest version and suggest version+1
    latest_version = get_latest_version(chainId)
    raise ConflictError(f"Version {version} already exists. Try version {latest_version + 1}")
```

### Q: Should I delete old versions?

**A:** No. Keep all versions for audit trail. If you must delete (e.g., contains sensitive data), ensure:
1. Version is not active (`isActive=false`)
2. At least one active version remains for the chainId
3. Deletion is logged in external audit system

---

## Schema Evolution

If the ChainQuery schema needs to evolve (e.g., add new property):

1. **Additive Changes (Safe):**
   ```cypher
   // Add new optional property to all existing nodes
   MATCH (cq:ChainQuery)
   WHERE cq.performance_tier IS NULL
   SET cq.performance_tier = "standard"  // default value
   ```

2. **Breaking Changes (Requires Migration):**
   - Create new node label (e.g., `ChainQueryV2`)
   - Migrate data from old to new schema
   - Update application to use new label
   - Deprecate old label after transition period

---

## Contact

For questions or issues with this migration:
- **Schema Design:** Database Architect team
- **SST Compliance:** Enterprise Architecture team (reference Enterprise_Ontology_SST_v1_1.md)
- **Application Integration:** Backend Development team
