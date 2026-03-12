# NoorMemory Ontology Cleanup 2026-03-07

## Scope

This cleanup addresses ontology-memory pollution caused by fragmented updates where new chain definitions were added without retiring the superseded chain entities and `SST Ontology` observations.

The canonical source for this cleanup is the user-provided Cypher for these seven chains:

- `sector_value_chain`
- `setting_strategic_initiatives`
- `setting_strategic_priorities`
- `sustainable_operations`
- `change_to_capability`
- `capability_to_policy`
- `capability_to_performance`

## Polluted Entries

The current memory dump mixes two incompatible chain registries:

1. Legacy oversight chains still modeled as active ontology chains:
   - `Business Chain: build_oversight`
   - `Business Chain: operate_oversight`
   - `Business Chain: integrated_oversight`

2. Replacement split-chain migration stored separately in `CHANGE_2026-02-25_Split_Oversight_Chains_v2`

3. `SST Ontology` still points to the legacy chain trio through both observations and `HAS_CHAIN` relations.

This is the specific contradiction causing memory pollution:

- `SST Ontology` says the active seven chains include `build_oversight`, `operate_oversight`, and `integrated_oversight`.
- `CHANGE_2026-02-25_Split_Oversight_Chains_v2` says those three were deactivated and replaced by `change_to_capability`, `capability_to_policy`, and `capability_to_performance`.

## Canonical Cleaned Entries

### SST Ontology

Keep:

- `Enterprise ontology with 7 business chains`
- `Nodes have 3 levels: L1 (strategic), L2 (operational), L3 (tactical)`
- `Defined in docs/Enterprise_Ontology_SST_v1.2.md`
- `Backend reads chain queries from Supabase chain_queries table`
- Existing retrieval guide, unless separately tightened later

Remove:

- `Chains: build_oversight, operate_oversight, sector_value_chain, setting_strategic_priorities, setting_strategic_initiatives, sustainable_operations, integrated_oversight`
- `CHAIN NAMES (7 active on MCP router): sector_value_chain, setting_strategic_initiatives, setting_strategic_priorities, build_oversight, operate_oversight, sustainable_operations, integrated_oversight. Chain details stored as 'Business Chain: {name}' entities.`
- `SPLIT CHAINS (3, in Supabase but NOT on MCP router yet): change_to_capability, capability_to_policy, capability_to_performance. Stored as CHANGE_2026-02-25_Split_Oversight_Chains_v2 entity.`

Add:

- `Canonical chain set: sector_value_chain, setting_strategic_initiatives, setting_strategic_priorities, sustainable_operations, change_to_capability, capability_to_policy, capability_to_performance.`
- `Legacy oversight aliases retired from ontology registry: build_oversight, operate_oversight, integrated_oversight were replaced by split chains and must not remain attached to SST Ontology as active HAS_CHAIN entries.`
- `Level integrity for canonical chains: Sector-sector links stay L1-L1, bridge links stay L2-L2, entity-entity work links stay L3-L3, and PARENT_OF supplies hierarchy context only.`

### Business Chain: sector_value_chain

Replace observations with:

- `Canonical path: SectorObjective L1 -> REALIZED_VIA -> SectorPolicyTool L1 -> REFERS_TO -> SectorAdminRecord L1 -> APPLIED_ON -> stakeholder L1 (SectorCitizen|SectorGovEntity|SectorBusiness) -> TRIGGERS_EVENT -> SectorDataTransaction L1 -> MEASURED_BY -> SectorPerformance L1 -> AGGREGATES_TO -> SectorObjective L1.`
- `Level rule: sector_value_chain is an L1 sector loop; all primary traversal links are sector-side and year-consistent.`

### Business Chain: setting_strategic_initiatives

Replace observations with:

- `Canonical path: SectorObjective L1 -> REALIZED_VIA -> SectorPolicyTool L1 -> PARENT_OF -> SectorPolicyTool L2 -> SETS_PRIORITIES -> EntityCapability L2 -> PARENT_OF -> EntityCapability L3 -> ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS -> gap L3 -> GAPS_SCOPE -> EntityProject L3 -> ADOPTION_RISKS -> EntityChangeAdoption L3.`
- `Bridge rule: policy-to-capability steering happens at L2-L2 only; gap, project, and adoption work stays L3-L3.`

### Business Chain: setting_strategic_priorities

Replace observations with:

- `Canonical path: SectorObjective L1 -> CASCADED_VIA -> SectorPerformance L1 -> PARENT_OF -> SectorPerformance L2 -> SETS_TARGETS -> EntityCapability L2 -> PARENT_OF -> EntityCapability L3 -> ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS -> gap L3.`
- `Bridge rule: performance-to-capability steering happens at L2-L2 only; gap realization remains L3-L3.`

### Business Chain: sustainable_operations

Replace observations with:

- `Canonical path: EntityCultureHealth L3 -> MONITORS_FOR -> EntityOrgUnit L3 -> APPLY -> EntityProcess L3 -> AUTOMATION -> EntityITSystem L3 -> DEPENDS_ON -> EntityVendor L3.`
- `Level rule: sustainable_operations is an L3 operational chain end-to-end.`

### Business Chain: change_to_capability

Create entity with observations:

- `Canonical path: EntityChangeAdoption L3 -> INCREASE_ADOPTION -> EntityProject L3 -> CLOSE_GAPS -> gap L3 (EntityOrgUnit|EntityProcess|EntityITSystem) <- ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS - EntityCapability L3.`
- `Purpose: capability build chain rooted from change adoption through projects and concrete gap closure back to capability work.`

### Business Chain: capability_to_policy

Create entity with observations:

- `Canonical path: EntityCapability L3 <- PARENT_OF - EntityCapability L2 <- PARENT_OF - EntityCapability L1; EntityCapability L3 -> MONITORED_BY -> EntityRisk L3 <- PARENT_OF - EntityRisk L2 -> INFORMS -> SectorPolicyTool L2 <- PARENT_OF - SectorPolicyTool L1 -> GOVERNED_BY -> SectorObjective L1.`
- `Bridge rule: risk-to-policy steering occurs at L2-L2 through INFORMS; policy objective governance is L1-L1 through GOVERNED_BY.`

### Business Chain: capability_to_performance

Create entity with observations:

- `Canonical path: EntityCapability L3 <- PARENT_OF - EntityCapability L2 <- PARENT_OF - EntityCapability L1; EntityCapability L3 -> MONITORED_BY -> EntityRisk L3 <- PARENT_OF - EntityRisk L2 -> INFORMS -> SectorPerformance L2 <- PARENT_OF - SectorPerformance L1; effective performance node -> AGGREGATES_TO -> SectorObjective L1.`
- `Bridge rule: risk-to-performance steering occurs at L2-L2 through INFORMS; performance aggregation to objective is L1-L1 with fallback from L2 when no L1 parent is present.`

## Exact Memory Mutations

### Delete Entities

- `Business Chain: build_oversight`
- `Business Chain: operate_oversight`
- `Business Chain: integrated_oversight`

### Delete Observations From SST Ontology

- `Chains: build_oversight, operate_oversight, sector_value_chain, setting_strategic_priorities, setting_strategic_initiatives, sustainable_operations, integrated_oversight`
- `CHAIN NAMES (7 active on MCP router): sector_value_chain, setting_strategic_initiatives, setting_strategic_priorities, build_oversight, operate_oversight, sustainable_operations, integrated_oversight. Chain details stored as 'Business Chain: {name}' entities.`
- `SPLIT CHAINS (3, in Supabase but NOT on MCP router yet): change_to_capability, capability_to_policy, capability_to_performance. Stored as CHANGE_2026-02-25_Split_Oversight_Chains_v2 entity.`

### Add Observations To SST Ontology

- `Canonical chain set: sector_value_chain, setting_strategic_initiatives, setting_strategic_priorities, sustainable_operations, change_to_capability, capability_to_policy, capability_to_performance.`
- `Legacy oversight aliases retired from ontology registry: build_oversight, operate_oversight, integrated_oversight were replaced by split chains and must not remain attached to SST Ontology as active HAS_CHAIN entries.`
- `Level integrity for canonical chains: Sector-sector links stay L1-L1, bridge links stay L2-L2, entity-entity work links stay L3-L3, and PARENT_OF supplies hierarchy context only.`

### Delete Existing Observations From Preserved Chain Entities

For `Business Chain: sector_value_chain`:

- `Objectives → Tools → Rules → Stakeholders → Transactions → Performance → Objectives`
- `15 nodes, 23 links`
- `v4 active in Supabase, no LIMIT in query (pagination via SKIP/LIMIT added at runtime by chains_service.py)`

For `Business Chain: setting_strategic_initiatives`:

- `Objectives → Tools → Priorities → Capabilities → Gaps → Projects → Adoption`
- `19 nodes, 18 links`
- `v4 active in Supabase, no LIMIT in query (pagination via SKIP/LIMIT added at runtime)`

For `Business Chain: setting_strategic_priorities`:

- `Objectives ← Performance → Targets → Capabilities → Gaps`
- `23 nodes, 22 links`
- `v4 active in Supabase, no LIMIT in query (pagination via SKIP/LIMIT added at runtime)`

For `Business Chain: sustainable_operations`:

- `Processes → Automation → Systems → Vendors`
- `28 nodes, 35 links`
- `v4 active in Supabase, no LIMIT in query (pagination via SKIP/LIMIT added at runtime)`

### Create Entities

- `Business Chain: change_to_capability`
- `Business Chain: capability_to_policy`
- `Business Chain: capability_to_performance`

### Create Relations

- `SST Ontology -[HAS_CHAIN]-> Business Chain: change_to_capability`
- `SST Ontology -[HAS_CHAIN]-> Business Chain: capability_to_policy`
- `SST Ontology -[HAS_CHAIN]-> Business Chain: capability_to_performance`

## Deferred Items

These entries still contain legacy chain names, but they should be treated as deployment-history or API-history items and revalidated separately before mutation:

- `ARCHITECTURE_MCP_Endpoints_Ground_Truth`
- `RULE_Enterprise_Desk_API_Usage`
- `CHANGE_2026-02-25_Split_Oversight_Chains_v2`

They are not safe to rewrite from ontology Cypher alone because they also encode router availability and frontend integration state.