# Enterprise Ontology + Risk Engine v1.1 — Single Source of Truth (SST)

**Status:** Authoritative (locked)  
**Version:** 1.1  
**Scope:** Node taxonomy, relationship semantics, cross-domain constraints, chain query library, and Risk Engine behavior.

---

## 0) Purpose and usage

This document is the authoritative definition of:
- Node labels, levels, and properties
- Relationship types and directions (**the only direct world relations**)
- Cross-domain constraints (what is allowed to connect to what)
- Chain query library (approved traversals)
- Risk Engine v1.1 (deterministic scoring + dynamic associations)

All implementations (Neo4j agent, Supabase functions/triggers, ETL sync) must conform to this SST.

---

## 1) Global rules

### 1.1 Hierarchy
- `PARENT_OF`: L1 → L2 → L3 self-node hierarchy (all node types)

### 1.2 Temporal consistency
- `year` must match across relationships

### 1.3 Level matching
- Connect same-level nodes unless `PARENT_OF`

### 1.4 Cross-domain interface constraints
1) EntityProject L2 & L3 cannot be connected to SectorObjective — only through SectorPolicyTool or SectorPerformance  
2) EntityCapability L2 can be connected to SectorPolicyTool L2 or SectorPerformance L2  
3) EntityCapability L2 cannot be connected to SectorObjective L2 — only through SectorPolicyTool L2 or SectorPerformance L2  
4) EntityOrgUnit L2 can be connected to EntityCapability L2 and EntityProcess L2  
5) EntityProcess L2 can be connected to EntityCapability L2 and EntityITSystem L2  
6) EntityITSystem L2 can be connected to EntityCapability L2 and EntityVendor L2  
7) RiskL2 ↔ PerformanceL2 (allowed cross-domain interface)  
8) RiskL2 ↔ PolicyToolsL2 (allowed cross-domain interface)

---

## 2) Node taxonomy

### 2.1 Sector layer (external)
**SectorObjective**  
Properties: id, name, year, level, quarter, status, objective_owner, description, target_outcomes

**SectorPolicyTool**  
Properties: id, name, year, level, quarter, category, responsible_entity, start_date, end_date, status, policy_scope

**SectorPerformance**  
Properties: id, name, year, level, quarter, status, target, baseline, actual_value, measurement_frequency, data_source, thresholds, unit, frequency

**SectorAdminRecord**  
Properties: id, name, year, level, quarter, type, issuing_authority, enforcement_status, effective_date, expiry_date, linked_policies

**SectorGovEntity**  
Properties: id, name, year, level, quarter, linked_policies

**SectorBusiness**  
Properties: id, name, year, level, quarter, operating_sector

**SectorCitizen**  
Properties: id, year, level, quarter, type, demographic_details

**SectorDataTransaction**  
Properties: id, name, year, level, quarter, transaction_type, transaction_value, timestamp, source_entity

### 2.2 Enterprise layer (internal)
**EntityProject**  
Properties: id, name, year, level, quarter, status, progress_percentage, start_date, end_date, parent_id, parent_year

**EntityCapability**  
Properties: id, name, year, level, quarter, status, description, owner, maturity_level, target_maturity_level, parent_id, parent_year

**EntityRisk**  
Properties: id, name, year, level, quarter, parent_id, parent_year, risk_status, risk_category, risk_owner, risk_reviewer, likelihood_of_delay, delay_days, mitigation_strategy, identified_date, last_review_date, threshold_green, threshold_amber, threshold_red, operational_health_score, people_score, process_score, tools_score

**EntityOrgUnit**  
Properties: id, name, year, level, quarter, parent_id, parent_year, type, head_of_unit, headcount, location, budget, annual_budget, gap

**EntityProcess**  
Properties: id, name, year, level, quarter, description

**EntityITSystem**  
Properties: id, name, year, level, quarter, owner, vendor, integration_level, criticality

**EntityChangeAdoption**  
Properties: id, name, year, level, quarter, change_type, adoption_score, resistance_score, mitigation_actions

**EntityCultureHealth**  
Properties: id, name, year, level, quarter, baseline, target, survey_score, trend, historical_trends, participation_rate

**EntityVendor**  
Properties: (model-defined where available)

---

## 3) Level definitions (L1/L2/L3)

**SectorObjective** — L1 Vision | L2 Objective | L3 KPI Category  
**SectorPolicyTool** — L1 Category | L2 Tool Family | L3 Instrument  
**SectorPerformance** — L1 KPI Category | L2 KPI | L3 Metric  
**SectorAdminRecord** — L1 Document Type | L2 Instrument | L3 Clauses  
**SectorGovEntity** — L1 Type | L2 Group | L3 Entity  
**SectorBusiness** — L1 Sector | L2 Segment | L3 Business  
**SectorCitizen** — L1 Segment | L2 Sub-segment | L3 Persona  
**SectorDataTransaction** — L1 Domain Agg. | L2 Sub-domain Agg. | L3 Transaction Agg.  

**EntityCapability** — L1 Business Domains | L2 Functional Knowledge | L3 Competencies  
**EntityRisk** — L1 Risk Domain | L2 Risk Group | L3 Specific Risk  
**EntityOrgUnit** — L1 Dept | L2 Sub-dept | L3 Team  
**EntityProcess** — L1 Category | L2 Group | L3 Cluster  
**EntityITSystem** — L1 Platform | L2 Module | L3 Feature  
**EntityProject** — L1 Program | L2 Initiative | L3 Project  
**EntityChangeAdoption** — L1 Change Program | L2 Workstream | L3 Behavioral Shift  
**EntityCultureHealth** — L1 OHI Dept | L2 OHI Sub-dept | L3 OHI Team  
**EntityVendor** — L1 Partner | L2 Service Domain | L3 Service

---

## 4) Direct relationships (authoritative)

These are the REAL and ONLY direct world relations. Any missing label/type/direction is a gap to raise.

### 4.1 Sector operations
- SectorObjective `-[:REALIZED_VIA]->` SectorPolicyTool  
- SectorPolicyTool `-[:GOVERNED_BY]->` SectorObjective  
- SectorObjective `-[:CASCADED_VIA]->` SectorPerformance  
- SectorPolicyTool `-[:REFERS_TO]->` SectorAdminRecord  
- SectorAdminRecord `-[:APPLIED_ON]->` SectorBusiness  
- SectorAdminRecord `-[:APPLIED_ON]->` SectorGovEntity  
- SectorAdminRecord `-[:APPLIED_ON]->` SectorCitizen  
- SectorBusiness `-[:TRIGGERS_EVENT]->` SectorDataTransaction  
- SectorGovEntity `-[:TRIGGERS_EVENT]->` SectorDataTransaction  
- SectorCitizen `-[:TRIGGERS_EVENT]->` SectorDataTransaction  
- SectorDataTransaction `-[:MEASURED_BY]->` SectorPerformance  
- SectorPerformance `-[:AGGREGATES_TO]->` SectorObjective  

### 4.2 Strategic integrated risk management
- EntityRisk `-[:INFORMS]->` SectorPerformance  
- EntityRisk `-[:INFORMS]->` SectorPolicyTool  
- EntityCapability `-[:MONITORED_BY]->` EntityRisk  (**canonical direction**)  

### 4.3 Sector ↔ Entity steering
- SectorPolicyTool `-[:SETS_PRIORITIES]->` EntityCapability  
- SectorPerformance `-[:SETS_TARGETS]->` EntityCapability  
- EntityCapability `-[:EXECUTES]->` SectorPolicyTool  
- EntityCapability `-[:REPORTS]->` SectorPerformance  

### 4.4 Entity internal operations
- EntityCapability `-[:ROLE_GAPS]->` EntityOrgUnit  
- EntityCapability `-[:KNOWLEDGE_GAPS]->` EntityProcess  
- EntityCapability `-[:AUTOMATION_GAPS]->` EntityITSystem  
- EntityOrgUnit `-[:OPERATES]->` EntityCapability  
- EntityProcess `-[:OPERATES]->` EntityCapability  
- EntityITSystem `-[:OPERATES]->` EntityCapability  
- EntityCultureHealth `-[:MONITORS_FOR]->` EntityOrgUnit  
- EntityOrgUnit `-[:APPLY]->` EntityProcess  
- EntityProcess `-[:AUTOMATION]->` EntityITSystem  
- EntityITSystem `-[:DEPENDS_ON]->` EntityVendor  

### 4.5 Transforming capabilities
- EntityOrgUnit `-[:GAPS_SCOPE]->` EntityProject  
- EntityProcess `-[:GAPS_SCOPE]->` EntityProject  
- EntityITSystem `-[:GAPS_SCOPE]->` EntityProject  
- EntityProject `-[:CLOSE_GAPS]->` EntityOrgUnit  
- EntityProject `-[:CLOSE_GAPS]->` EntityProcess  
- EntityProject `-[:CLOSE_GAPS]->` EntityITSystem  

### 4.6 Project → operation transfer
- EntityProject `-[:ADOPTION_RISKS]->` EntityChangeAdoption  
- EntityChangeAdoption `-[:INCREASE_ADOPTION]->` EntityProject  

---

## 5) Risk Engine v1.1 (deterministic scoring + dynamic associations)

### 5.1 Invariants
- 1:1 monitoring: every EntityCapability has exactly one associated EntityRisk via `MONITORED_BY`
- Identity convention: capability_id == risk_id (per year, quarter)
- Dynamic association is represented only by `INFORMS` edges:
  - (EntityRisk)-[:INFORMS]->(SectorPolicyTool)
  - (EntityRisk)-[:INFORMS]->(SectorPerformance)

### 5.2 Mode resolution (from EntityCapability.status)
- BUILD when status in `{planned, in_progress}`
- OPERATE when status == `active`
- Else: mode = null (no scoring, no linking)

### 5.3 Closure suppression
If EntityRisk.risk_status indicates closure (e.g., closed, mitigated):
- Do not recalculate exposures or scores in this run
- Deactivate outgoing INFORMS edges: set `rel.active=false` and update metadata (`asof_date`, `last_run_id`)

### 5.4 Global scoring config (ScoreConfig)
- red_delay_days: integer > 0 (BUILD normalization tolerance)
- link_threshold_pct: default 50 (association activation threshold)
- band_green_max_pct: default 35
- band_amber_max_pct: default 65
Note: EntityRisk.threshold_green / threshold_amber / threshold_red may override band thresholds if populated.

### 5.5 BUILD track (expected delay)
Evidence derived from these ontology paths:
- Capability -[:ROLE_GAPS]-> OrgUnit -[:GAPS_SCOPE]-> Project  
- Capability -[:KNOWLEDGE_GAPS]-> Process -[:GAPS_SCOPE]-> Project  
- Capability -[:AUTOMATION_GAPS]-> ITSystem -[:GAPS_SCOPE]-> Project  

Overdue days for project p:
- if p.end_date exists AND p.status not complete AND p.end_date < asof_date → overdue_days = days(asof_date - p.end_date)
- else 0

Component delays:
- roles_delay_days   = max overdue_days via ROLE_GAPS projects
- process_delay_days = max overdue_days via KNOWLEDGE_GAPS projects
- it_delay_days      = max overdue_days via AUTOMATION_GAPS projects
- outputs_delay_days = max overdue_days across union of those projects

Persistence per component (0..3):
- if component_delay_days > 0: persistence = min(3, persistence_prev + 1)
- else: persistence = max(0, persistence_prev - 1)

persist_p mapping:
- 0→0.00, 1→0.50, 2→0.75, 3→1.00

Component risk:
- slip_p_c = clamp01(component_delay_days / red_delay_days)
- component_risk_c = max(persist_p, slip_p_c)

Overall BUILD:
- likelihood_of_delay = average(component_risk_outputs, component_risk_roles, component_risk_it) (weights may override via config)
- delay_days          = max(outputs_delay_days, roles_delay_days, it_delay_days) (critical path)
- expected_delay_days = likelihood_of_delay * delay_days
- build_exposure_pct  = clamp01(expected_delay_days / red_delay_days) * 100
- build_band derived from thresholds

### 5.6 OPERATE track (health → exposure)
Inputs on EntityRisk (1..5): people_score, process_score, tools_score

Normalize:
- people_pct  = ((people_score  - 1)/4)*100
- process_pct = ((process_score - 1)/4)*100
- tools_pct   = ((tools_score   - 1)/4)*100
- operational_health_pct = average(people_pct, process_pct, tools_pct)
- operate_exposure_pct_raw = 100 - operational_health_pct

Trend early warning (attention flag; does NOT create links):
Maintain: prev_operational_health_pct, prev2_operational_health_pct
If BOTH:
- prev2 > prev > current (two consecutive drops)
- AND operate_exposure_pct_raw is still Green (< band_green_max_pct)
Then:
- operate_trend_flag = true
- operate_band = Amber
- operate_exposure_pct_effective = band_green_max_pct (amber floor for attention)
Else:
- operate_trend_flag = false
- operate_exposure_pct_effective = operate_exposure_pct_raw
- operate_band derived from effective exposure

### 5.7 Roll-up and linking level
- Roll up exposures L3→L2→L1 using `max(child_exposure)` per track
- Cross-domain association activation is evaluated and written at L2 only:
  - RiskL2 → PolicyToolsL2 (BUILD)
  - RiskL2 → PerformanceL2 (OPERATE)

### 5.8 Dynamic association maintenance (INFORMS)
Targets discovered via capability relations:

BUILD targets:
- PolicyTool where (policytool)-[:SETS_PRIORITIES]->(capability) OR (capability)-[:EXECUTES]->(policytool)

OPERATE targets:
- Performance where (performance)-[:SETS_TARGETS]->(capability) OR (capability)-[:REPORTS]->(performance)

Activation rule:
- mode == BUILD   → active = (build_exposure_pct >= link_threshold_pct)
- mode == OPERATE → active = (operate_exposure_pct_effective >= link_threshold_pct)

Relationship properties written each run:
- active (boolean)
- mode ('BUILD' | 'OPERATE')
- exposure_pct (0..100)
- year, quarter, asof_date, last_run_id

### 5.9 Derived fields stored on EntityRisk (latest only)
BUILD:
- likelihood_of_delay, delay_days, expected_delay_days (risk_score), build_exposure_pct, build_band

OPERATE:
- operational_health_pct, operate_exposure_pct_raw, operate_exposure_pct_effective, operate_band, operate_trend_flag

Trend state:
- prev_operational_health_pct, prev2_operational_health_pct

### 5.10 Data gaps
If required inputs are missing for the active mode:
- Do not activate INFORMS links for that mode
- Emit diagnostics via external audit log (risk engine itself does not invent inputs)

---

## 6) Chain query library (approved traversals)

## 6A) Business Chains (canonical definitions)

> These are business-facing “navigation stories”. Each maps to one or more Cypher queries in 6.2.

### Chain 1 — Sector Value Chain (External Influence Loop)
**Intent:** Show how objectives are executed externally through tools/rules, stakeholder behavior, transactions, and measured performance.  
**Canonical path:**
SectorObjective
-[:REALIZED_VIA]-> SectorPolicyTool
-[:REFERS_TO]-> SectorAdminRecord
-[:APPLIED_ON]-> (SectorCitizen | SectorGovEntity | SectorBusiness)
-[:TRIGGERS_EVENT]-> SectorDataTransaction
-[:MEASURED_BY]-> SectorPerformance
-[:AGGREGATES_TO]-> SectorObjective
**Start anchors:** SectorObjective (preferred), SectorPolicyTool, SectorPerformance  
**Output:** tool chain + rules + affected stakeholders + transactions + KPIs + objective roll-up  
**Query mapping:** `sector_value_chain`

---

### Chain 2 — Setting Strategic Initiatives (Build Steering)
**Intent:** Show how objectives drive policy tools that set capability priorities and shape the build portfolio (projects + adoption).  
**Canonical path:**
SectorObjective
-[:REALIZED_VIA]-> SectorPolicyTool
-[:SETS_PRIORITIES]-> EntityCapability
-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]-> (EntityOrgUnit | EntityProcess | EntityITSystem)
-[:GAPS_SCOPE]-> EntityProject
-[:ADOPTION_RISKS]-> EntityChangeAdoption
**Start anchors:** SectorObjective, SectorPolicyTool, EntityCapability  
**Output:** which capabilities are prioritized, where the gaps sit (org/process/IT), which projects/adoption actions are in flight  
**Query mapping:** `setting_strategic_initiatives`

---

### Chain 3 — Setting Strategic Priorities (Operate Target Cascade)
**Intent:** Show how strategic KPIs/targets cascade into capabilities and operational footprint (and optionally into projects/adoption if targets require build).  
**Canonical path:**
SectorObjective
<-[:AGGREGATES_TO]- SectorPerformance
-[:SETS_TARGETS]-> EntityCapability
-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]-> (EntityOrgUnit | EntityProcess | EntityITSystem)
(Optional if you want execution trace:)
... -[:GAPS_SCOPE]-> EntityProject -[:ADOPTION_RISKS]-> EntityChangeAdoption
**Start anchors:** SectorPerformance (preferred), SectorObjective, EntityCapability  
**Output:** KPI → capability mapping, capability footprint, and optional execution trace  
**Query mapping:** `setting_strategic_priorities`

---

### Chain 4 — Build Oversight (BUILD Risk Control Loop)
**Intent:** In BUILD mode, show which policy tools are threatened by expected delay in building capability, and why.  
**Canonical path:**
EntityCapability
-[:MONITORED_BY]-> EntityRisk
-[:INFORMS {mode:'BUILD'}]-> SectorPolicyTool
(plus steering context)
SectorPolicyTool -[:SETS_PRIORITIES|:GOVERNED_BY|:REALIZED_VIA]-> SectorObjective
**Start anchors:** EntityRisk (preferred), EntityCapability, SectorPolicyTool  
**Output:** build exposure %, band, expected delay, active informs links to policy tools  
**Query mapping:** `build_oversight`

---

### Chain 5 — Operate Oversight (OPERATE Risk Control Loop)
**Intent:** In OPERATE mode, show which performance targets are threatened by operational health, and why.  
**Canonical path:**
EntityCapability
-[:MONITORED_BY]-> EntityRisk
-[:INFORMS {mode:'OPERATE'}]-> SectorPerformance
(plus objective roll-up)
SectorPerformance -[:AGGREGATES_TO]-> SectorObjective
**Start anchors:** EntityRisk (preferred), EntityCapability, SectorPerformance  
**Output:** operate exposure %, band/trend flag, active informs links to performance targets  
**Query mapping:** `operate_oversight`

---

### Chain 6 — Sustainable Operations (Internal Efficiency / Execution Spine)
**Intent:** Show how operational execution relies on process automation, systems, and vendor dependencies (and where fragility may sit).  
**Canonical path:**
EntityProcess
-[:AUTOMATION]-> EntityITSystem
-[:DEPENDS_ON]-> EntityVendor
(Optional upstream context if available in graph:)
EntityOrgUnit -[:APPLY]-> EntityProcess
EntityCultureHealth -[:MONITORS_FOR]-> EntityOrgUnit
**Start anchors:** EntityProcess (preferred), EntityITSystem, EntityVendor  
**Output:** process → system → vendor dependency chain (optionally org + health context)  
**Query mapping:** `sustainable_operations`

---

### Chain 7 — Integrated Oversight (Drill Pattern, not one path)
**Intent:** Unified oversight by drilling from policy/target L2 into capability + footprint L3, then returning via risk roll-up to governance.  
**Traversal pattern (must use PARENT_OF for levels):**
Start at (SectorPolicyTool L2 | SectorPerformance L2)
→ EntityCapability L2
→ (PARENT_OF)* → EntityCapability L3
→ footprint L3 (EntityOrgUnit/EntityProcess/EntityITSystem)
→ EntityRisk L3
→ (PARENT_OF)* → EntityRisk L2
→ back to (SectorPolicyTool L2 | SectorPerformance L2) using active INFORMS
**Start anchors:** SectorPolicyTool L2 or SectorPerformance L2  
**Output:** end-to-end drill-down + roll-up with active control signals  
**Query mapping:** composite (uses `setting_*` + `*_oversight` + `PARENT_OF` rollups)

### 6.B1 Standard Return Clause (append to all)
```cypher
WITH root, collect(path) as paths
UNWIND (CASE WHEN size(paths) = 0 THEN [null] ELSE paths END) as p
UNWIND (CASE WHEN p IS NULL THEN [root] ELSE nodes(p) END) as n
UNWIND (CASE WHEN p IS NULL THEN [null] ELSE relationships(p) END) as r
WITH n, r
WHERE n IS NOT NULL
RETURN DISTINCT
  elementId(n) as nId,
  labels(n) as nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding']) as nProps,
  type(r) as rType,
  properties(r) as rProps,
  CASE WHEN r IS NOT NULL THEN elementId(startNode(r)) ELSE null END as sourceId,
  CASE WHEN r IS NOT NULL THEN elementId(endNode(r)) ELSE null END as targetId
```

### 6.B2 Chain queries

#### Sector Value Chain (sector_value_chain)
```cypher
MATCH (root:SectorObjective)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:REALIZED_VIA]->(pol:SectorPolicyTool)
OPTIONAL MATCH p2 = (pol)-[:REFERS_TO]->(rec:SectorAdminRecord)
OPTIONAL MATCH p3 = (rec)-[:APPLIED_ON]->(stakeholder)
OPTIONAL MATCH p4 = (stakeholder)-[:TRIGGERS_EVENT]->(txn:SectorDataTransaction)
OPTIONAL MATCH p5 = (txn)-[:MEASURED_BY]->(perf:SectorPerformance)
OPTIONAL MATCH p6 = (perf)-[:AGGREGATES_TO]->(root)
UNWIND [p1, p2, p3, p4, p5, p6] as path
WITH root, path
```

#### Setting Strategic Initiatives (setting_strategic_initiatives)
```cypher
MATCH (root:SectorObjective)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:REALIZED_VIA]->(pol:SectorPolicyTool)
OPTIONAL MATCH p2 = (pol)-[:SETS_PRIORITIES]->(cap:EntityCapability)
OPTIONAL MATCH p3 = (cap)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap)
OPTIONAL MATCH p4 = (gap)-[:GAPS_SCOPE]->(proj:EntityProject)
OPTIONAL MATCH p5 = (proj)-[:ADOPTION_RISKS]->(adopt:EntityChangeAdoption)
UNWIND [p1, p2, p3, p4, p5] as path
WITH root, path
```

#### Setting Strategic Priorities (setting_strategic_priorities)
```cypher
MATCH (root:SectorObjective)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)<-[:AGGREGATES_TO|CASCADED_VIA]-(perf:SectorPerformance)
OPTIONAL MATCH p2 = (perf)<-[:MEASURED_BY]-(txn:SectorDataTransaction)
OPTIONAL MATCH p3 = (perf)-[:SETS_TARGETS]->(cap:EntityCapability)
OPTIONAL MATCH p4 = (cap)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(gap)
OPTIONAL MATCH p5 = (gap)-[:GAPS_SCOPE]->(proj:EntityProject)
OPTIONAL MATCH p6 = (proj)-[:ADOPTION_RISKS]->(adopt:EntityChangeAdoption)
UNWIND [p1, p2, p3, p4, p5, p6] as path
WITH root, path
```

#### Build Oversight (build_oversight)
```cypher
MATCH (root:EntityRisk)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)<-[:MONITORED_BY]-(cap:EntityCapability)
OPTIONAL MATCH p2 = (cap)-[:EXECUTES]->(pol_exec:SectorPolicyTool)
OPTIONAL MATCH p3 = (cap)<-[:SETS_PRIORITIES]-(pol_set:SectorPolicyTool)
OPTIONAL MATCH p4 = (root)-[:INFORMS]->(pol_inf:SectorPolicyTool)
UNWIND [p1, p2, p3, p4] as path
WITH root, path
```

#### Operate Oversight (operate_oversight)
```cypher
MATCH (root:EntityRisk)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)<-[:MONITORED_BY]-(cap:EntityCapability)
OPTIONAL MATCH p2 = (cap)-[:REPORTS]->(perf_rep:SectorPerformance)
OPTIONAL MATCH p3 = (cap)<-[:SETS_TARGETS]-(perf_set:SectorPerformance)
OPTIONAL MATCH p4 = (root)-[:INFORMS]->(perf_inf:SectorPerformance)
UNWIND [p1, p2, p3, p4] as path
WITH root, path
```

#### Sustainable Operations (sustainable_operations)
```cypher
MATCH (root:EntityProcess)
WHERE ($year = 0 OR root.year = $year OR root.Year = $year)
AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:AUTOMATION]->(it:EntityITSystem)
OPTIONAL MATCH p2 = (it)-[:DEPENDS_ON]->(vendor:EntityVendor)
UNWIND [p1, p2] as path
WITH root, path
```

---

## 7) World Model

```json

{
  "version": "2.2_SST_v1_1",
  "meta": {
    "nodes_count": 17,
    "chains_count": 7,
    "description": "Navigation + governance world model aligned to SST v1.1. No invented nodes. Gaps are capability state; traversal is via Org/Process/IT."
  },

  "core_semantics": {
    "levels": "L1->L2->L3 via PARENT_OF",
    "time": "year must match across traversals; quarter is 1..4 when used",
    "no_fake_nodes": ["Gaps", "Ops", "Strategic", "Stakeholder"],
    "stakeholders_are": ["SectorCitizen", "SectorGovEntity", "SectorBusiness"]
  },

  "relationship_vocabulary": [
    "PARENT_OF",
    "REALIZED_VIA", "GOVERNED_BY", "CASCADED_VIA",
    "REFERS_TO", "APPLIED_ON", "TRIGGERS_EVENT", "MEASURED_BY", "AGGREGATES_TO",
    "SETS_PRIORITIES", "SETS_TARGETS", "EXECUTES", "REPORTS",
    "MONITORED_BY", "INFORMS",
    "ROLE_GAPS", "KNOWLEDGE_GAPS", "AUTOMATION_GAPS",
    "OPERATES", "MONITORS_FOR", "APPLY", "AUTOMATION", "DEPENDS_ON",
    "GAPS_SCOPE", "CLOSE_GAPS",
    "ADOPTION_RISKS", "INCREASE_ADOPTION"
  ],

  "nodes": [
    {"id": "EntityProject"},
    {"id": "EntityCapability"},
    {"id": "EntityRisk"},
    {"id": "EntityOrgUnit"},
    {"id": "EntityITSystem"},
    {"id": "EntityProcess"},
    {"id": "EntityChangeAdoption"},
    {"id": "EntityCultureHealth"},
    {"id": "EntityVendor"},

    {"id": "SectorObjective"},
    {"id": "SectorPolicyTool"},
    {"id": "SectorPerformance"},
    {"id": "SectorAdminRecord"},
    {"id": "SectorBusiness"},
    {"id": "SectorGovEntity"},
    {"id": "SectorCitizen"},
    {"id": "SectorDataTransaction"}
  ],

  "business_chains": [
    {
      "name": "Sector Value Chain",
      "story": "External influence loop: objectives executed via policy tools, rules, stakeholder behavior, transactions, and measured performance rolling up to objectives.",
      "canonical_path": "SectorObjective -REALIZED_VIA-> SectorPolicyTool -REFERS_TO-> SectorAdminRecord -APPLIED_ON-> (SectorCitizen|SectorGovEntity|SectorBusiness) -TRIGGERS_EVENT-> SectorDataTransaction -MEASURED_BY-> SectorPerformance -AGGREGATES_TO-> SectorObjective",
      "mcp_tool": "chain_sector_value_chain"
    },
    {
      "name": "Setting Strategic Initiatives",
      "story": "Build steering: objectives drive policy tools that set capability priorities; capability footprint (org/process/IT) links to projects and adoption.",
      "canonical_path": "SectorObjective -REALIZED_VIA-> SectorPolicyTool -SETS_PRIORITIES-> EntityCapability -(ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS)-> (EntityOrgUnit|EntityProcess|EntityITSystem) -GAPS_SCOPE-> EntityProject -ADOPTION_RISKS-> EntityChangeAdoption",
      "mcp_tool": "chain_setting_strategic_initiatives"
    },
    {
      "name": "Setting Strategic Priorities",
      "story": "Operate target cascade: objectives/performance targets cascade to capabilities; capability footprint and (optionally) resulting projects/adoption are visible.",
      "canonical_path": "SectorObjective <-AGGREGATES_TO- SectorPerformance -SETS_TARGETS-> EntityCapability -(ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS)-> (EntityOrgUnit|EntityProcess|EntityITSystem) -GAPS_SCOPE-> EntityProject -ADOPTION_RISKS-> EntityChangeAdoption",
      "mcp_tool": "chain_setting_strategic_priorities"
    },
    {
      "name": "Build Oversight",
      "story": "BUILD control loop: in BUILD mode, risk informs which policy tools are threatened by expected delay in capability building.",
      "canonical_path": "EntityCapability -MONITORED_BY-> EntityRisk -INFORMS(mode=BUILD)-> SectorPolicyTool",
      "mcp_tool": "chain_build_oversight"
    },
    {
      "name": "Operate Oversight",
      "story": "OPERATE control loop: in OPERATE mode, risk informs which performance targets are threatened by operational health and trend.",
      "canonical_path": "EntityCapability -MONITORED_BY-> EntityRisk -INFORMS(mode=OPERATE)-> SectorPerformance",
      "mcp_tool": "chain_operate_oversight"
    },
    {
      "name": "Sustainable Operations",
      "story": "Execution spine: process automation through IT systems and vendor dependencies (optionally with org + culture health context).",
      "canonical_path": "EntityProcess -AUTOMATION-> EntityITSystem -DEPENDS_ON-> EntityVendor",
      "mcp_tool": "chain_sustainable_operations"
    },
    {
      "name": "Integrated Oversight",
      "story": "Drill pattern (not one chain): start from PolicyTool/Performance L2, drill to Capability L2/L3 and footprint L3, traverse to Risk L3, roll up to Risk L2, return via active INFORMS.",
      "canonical_path": "Pattern: (SectorPolicyTool L2 | SectorPerformance L2) -> EntityCapability L2 -> (PARENT_OF)* -> EntityCapability L3 -> footprint L3 -> EntityRisk L3 -> (PARENT_OF)* -> EntityRisk L2 -> active INFORMS -> (SectorPolicyTool L2 | SectorPerformance L2)",
      "mcp_tool": "pattern_integrated_oversight"
    }
  ]
}
```
---

## 8) What you do next (minimal, ordered)

1) **Lock this SST file** as the source of truth (stop editing older copies).
2) **Graph validation (no changes yet):**
   - Verify `MONITORED_BY` direction is consistently `Capability -> Risk`.
   - Verify `INFORMS` exists (or can be created) from Risk to PolicyTool and Performance.
   - Verify BUILD evidence paths exist: Org/Process/IT `GAPS_SCOPE` to Project.
3) **Query library update:** replace any older chain queries that assume reverse `MONITORED_BY` direction; adopt the chain names in Section 6.
4) **Agent alignment:** ensure the Risk Analyst writes/maintains `INFORMS(active, mode, exposure_pct, year, quarter, asof_date, last_run_id)` and respects closure suppression.

