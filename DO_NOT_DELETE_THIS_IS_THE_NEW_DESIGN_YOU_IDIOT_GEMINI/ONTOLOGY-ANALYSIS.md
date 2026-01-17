# ONTOLOGY GROUNDING ANALYSIS
## KSA National Industrial Ecosystem Platform - Requirements Revision

**Date**: 2026-01-04  
**Status**: Planning Mode - Critical Gap Analysis

---

## EXECUTIVE SUMMARY

**Critical Finding**: The current implementation and evolved requirements have **COMPLETELY DRIFTED** from the ontology. There are fundamental violations in:

1. **Node Type Misuse**: Requirements reference concepts not in the ontology
2. **Relationship Violations**: Assumed relationships that don't exist in the schema
3. **Hierarchy Confusion**: Mixing level constraints inappropriately
4. **Missing Ontology Reference**: Dashboard implementations use ad-hoc data structures

---

## PART 1: ONTOLOGY STRUCTURE (GROUND TRUTH)

### 1.1 Node Categories

#### **SECTOR LAYER (External/Stakeholder)**
- `SectorObjective` (25 nodes) - Strategic objectives
- `SectorPolicyTool` (225 nodes) - Policy instruments
- `SectorAdminRecord` (20 nodes) - Administrative datasets
- `SectorGovEntity` (10 nodes) - Government entities
- `SectorBusiness` (12 nodes) - Private sector
- `SectorCitizen` (9 nodes) - Citizen groups
- `SectorDataTransaction` (14 nodes) - Transaction events
- `SectorPerformance` (225 nodes) - KPIs and metrics

#### **ENTITY LAYER (Internal/Operations)**
- `EntityProject` (284 nodes) - Projects
- `EntityCapability` (391 nodes) - Capabilities
- `EntityRisk` (391 nodes) - Risks
- `EntityOrgUnit` (436 nodes) - Org units/teams
- `EntityProcess` (353 nodes) - Business processes
- `EntityITSystem` (930 nodes) - IT systems
- `EntityVendor` (7 nodes) - Vendors
- `EntityChangeAdoption` (284 nodes) - Change adoption
- `EntityCultureHealth` (436 nodes) - OHI metrics

### 1.2 DIRECT RELATIONSHIPS (The Only Truth)

```
SECTOR OPERATIONS CHAIN:
SectorObjective → [Realized Via] → SectorPolicyTool
SectorPolicyTool → [Governed By] → SectorObjective
SectorObjective → [Cascaded Via] → SectorPerformance
SectorPolicyTool → [Refers To] → SectorAdminRecord
SectorAdminRecord → [Applied On] → {SectorBusiness|SectorGovEntity|SectorCitizen}
{SectorBusiness|SectorGovEntity|SectorCitizen} → [Triggers Event] → SectorDataTransaction
SectorDataTransaction → [Measured By] → SectorPerformance
SectorPerformance → [Aggregates To] → SectorObjective

RISK MANAGEMENT:
EntityRisk → [Informs] → SectorPerformance
EntityRisk → [Informs] → SectorPolicyTool
EntityRisk ← [MONITORED_BY] ← EntityCapability

SECTOR-ENTITY BRIDGE:
SectorPolicyTool → [Sets Priorities] → EntityCapability
SectorPerformance → [Sets Targets] → EntityCapability
EntityCapability → [Executes] → SectorPolicyTool
EntityCapability → [Reports] → SectorPerformance

ENTITY INTERNAL:
EntityCapability → [Role Gaps] → EntityOrgUnit
EntityCapability → [Knowledge Gaps] → EntityProcess
EntityCapability → [Automation Gaps] → EntityITSystem
EntityOrgUnit → [Operates] → EntityCapability
EntityProcess → [Operates] → EntityCapability
EntityITSystem → [Operates] → EntityCapability
EntityCultureHealth → [Monitors For] → EntityOrgUnit
EntityOrgUnit → [Apply] → EntityProcess
EntityProcess → [Automation] → EntityITSystem
EntityITSystem → [Depends On] → EntityVendor

TRANSFORMATION:
{EntityOrgUnit|EntityProcess|EntityITSystem} → [Gaps Scope] → EntityProject
EntityProject → [Close Gaps] → {EntityOrgUnit|EntityProcess|EntityITSystem}
EntityProject → [Adoption Risks] → EntityChangeAdoption
EntityChangeAdoption → [Increase Adoption] → EntityProject
```

### 1.3 CRITICAL CONSTRAINTS

1. **Hierarchical Relationships**: All nodes have L1→L2→L3 via `PARENT_OF`
2. **Temporal Consistency**: Year property must match across relationships
3. **Level Matching Rules**:
   - **Sector Domain**: L1-L1 connections only
   - **Entity Domain**: L3-L3 connections only
   - **Cross-Domain**: Specific level mappings (e.g., CapabilityL2 ↔ PerfL2)

### 1.4 THE 7 CANONICAL CHAINS

1. **SectorOps**: Full sector operations cycle
2. **Strategy_to_Tactics_Priority_Capabilities**: Via policy tools
3. **Strategy_to_Tactics_Capabilities_Targets**: Via performance
4. **Tactical_to_Strategy**: Feedback loop
5. **Risk_Build_Mode**: Risk in construction
6. **Risk_Operate_Mode**: Risk in operation
7. **Internal_Efficiency**: Culture → Vendor chain

---

## PART 2: VIOLATIONS IN CURRENT REQUIREMENTS

### 2.1 FUNDAMENTAL CONCEPTUAL VIOLATIONS

#### ❌ VIOLATION 1: "GEOGRAPHIC REGIONS" AS PRIMARY STRUCTURE
**Current Requirement**:
> "The Geographic Value Chain... visualize the interdependency of regions... Mining extraction (Phosphate/Bauxite)... Processing (Jubail)... Manufacturing (Riyadh)"

**Ontology Reality**:
- **NO `Region` node type exists**
- **NO geographic relationships defined**
- Geographic data ONLY appears as:
  - `SectorCitizen.level` (L2=Region, L3=District)
  - `EntityOrgUnit.location` (property, not node)

**Correct Grounding**:
- Geographic visualization must be **overlaid** on SectorObjective or SectorBusiness nodes
- Flows must represent **SectorDataTransaction** chains, NOT geographic pipelines
- Regional grouping is a **display filter**, not a data model element

---

#### ❌ VIOLATION 2: "CAPABILITIES BUILDING, TRANSITIONING, OPERATING"
**Current Requirement**:
> "Horizon A: Build Mode... Horizon B: Transition Mode... Horizon C: Operate Mode"

**Ontology Reality**:
- `EntityCapability` has ONE status: `status` property (single value)
- NO lifecycle phases defined
- NO "Build/Transition/Operate" states

**What Actually Exists**:
- `EntityCapability.maturity_level` (current state)
- `EntityCapability.target_maturity_level` (goal state)
- `EntityProject.status` (for projects CLOSING capability gaps)
- `EntityChangeAdoption.status` (for adoption state)

**Correct Grounding**:
- "Build Mode" = Query for `EntityProject` where `[Gaps Scope]` → `EntityCapability`
- "Transition Mode" = Query for `EntityProject.progress_percentage=100%` AND `EntityChangeAdoption.status != 'Completed'`
- "Operate Mode" = Query for `EntityCapability` where NO active `[Gaps Scope]` projects exist

---

#### ❌ VIOLATION 3: "POLICY EFFECTIVENESS BY CAPABILITY PHASE"
**Current Requirement**:
> "A policy is only deemed 'Effective' if the capabilities required to administer it are in the 'Operate' phase"

**Ontology Reality**:
- `SectorPolicyTool.status` exists (Green/Amber/Red)
- Relationship: `EntityCapability → [Executes] → SectorPolicyTool`
- NO "Operate phase" property on EntityCapability

**Correct Grounding**:
```cypher
// Policy effectiveness query (ontology-compliant)
MATCH (policy:SectorPolicyTool)<-[exec:Executes]-(cap:EntityCapability)
WHERE cap.maturity_level >= cap.target_maturity_level
  AND NOT EXISTS((cap)<-[:Gaps_Scope]-(project:EntityProject WHERE project.status='Active'))
RETURN policy.name, 
       policy.status AS reported_status,
       count(cap) AS executing_capabilities,
       avg(cap.maturity_level) AS avg_maturity
```

---

#### ❌ VIOLATION 4: "HOLLOW VICTORY" / "PAPER TIGER" DETECTION
**Current Requirement**:
> "A KPI cannot be considered truly 'Green' unless it is backed by a SectorDataTransaction chain"

**Ontology Reality**:
✅ **THIS IS CORRECT** - but requires precise chain traversal:

```cypher
// Correct "Hollow Victory" detection
MATCH (obj:SectorObjective)-[:Cascaded_Via]->(perf:SectorPerformance)
WHERE perf.status = 'Green'
OPTIONAL MATCH (perf)<-[:Measured_By]-(trans:SectorDataTransaction)
WITH obj, perf, count(trans) AS transaction_count
WHERE transaction_count = 0
RETURN obj.name AS hollow_objective,
       perf.name AS green_but_unverified_kpi
```

**Issue**: Current implementation doesn't actually query this chain - it uses mock `verified: true/false` flags.

---

#### ❌ VIOLATION 5: "STRATEGIC JEOPARDY SCORE"
**Current Requirement**:
> "If 'Factory Automation' (Critical Cap) is delayed by 2 weeks, the 'Auto Manufacturing Goal' (L1 Objective) should visibly degrade"

**Ontology Reality**:
- `EntityProject` has `start_date`, `end_date`, `progress_percentage`
- `EntityRisk` has `likelihood_of_delay`, `delay_days`
- NO direct relationship: `EntityProject → SectorObjective`

**Correct Chain**:
```cypher
// Delayed project impact on objectives
MATCH (project:EntityProject)-[:Close_Gaps]->(itsystem:EntityITSystem)
      -[:Operates]->(cap:EntityCapability)-[:Reports]->(perf:SectorPerformance)
      -[:Aggregates_To]->(obj:SectorObjective)
WHERE project.status = 'Delayed' OR project.progress_percentage < expected_progress
WITH obj, cap, project, 
     (date() - project.end_date) AS delay_days
RETURN obj.name AS affected_objective,
       cap.name AS critical_capability,
       project.name AS delayed_project,
       delay_days AS strategic_jeopardy_score
```

**Issue**: Requirements assume direct project→objective link, which doesn't exist.

---

### 2.2 DASHBOARD-SPECIFIC VIOLATIONS

#### Dashboard 1: "North Star Command" (index.html)
**Current Implementation**:
```javascript
regions: [
    { id: 'R-01', name: 'Northern Borders', type: 'Mining Hub' }
]
```

**Violations**:
- ❌ Invents `Region` node type
- ❌ Invents `type: 'Mining Hub'` property
- ❌ `flows` array has no ontology grounding

**Correct Approach**:
- Use `SectorBusiness` nodes with `operating_sector` property
- Use `SectorDataTransaction` to represent actual value flows
- Filter by `EntityOrgUnit.location` for geographic display

---

#### Dashboard 2: "Strategic Overview" (strategic.html)
**Current Implementation**:
- Shows "Objective → Policy → Record → Transaction" Sankey
- References "Governance Gaps" table

**Violations**:
- ✅ Sankey chain IS correct (follows SectorOps chain)
- ⚠️ "Governance Gaps" assumes missing `[Governed By]` relationships
  - This IS valid (checking for missing relationships)
  - BUT: Table should show `SectorPolicyTool` nodes with NO `[Governed By]` edge

**Fix Needed**:
- Explicitly query for orphaned nodes
- Display temporal mismatches (year property conflicts)

---

#### Dashboard 3: "Lifecycle" (lifecycle.html)
**Current Description**:
> "Zone A (Build): Active project portfolio weighted by Capability Criticality"

**Violations**:
- ❌ No "Zone A/B/C" in ontology
- ❌ No "Capability Criticality" property (use `SectorObjective.priority_level` via chain)

**Correct Queries**:
```cypher
// Zone A: Build Mode
MATCH (project:EntityProject)-[:Close_Gaps]->(resource)
WHERE project.status IN ['Active', 'Planned']
OPTIONAL MATCH (resource)-[:Operates]->(cap:EntityCapability)
             -[:Reports]->(perf:SectorPerformance)
             -[:Aggregates_To]->(obj:SectorObjective)
RETURN project, cap, obj.priority_level AS criticality
```

---

## PART 3: CORRECTED REQUIREMENTS (ONTOLOGY-GROUNDED)

### 3.1 CORE QUESTION 1: "ARE WE WINNING?" (REVISED)

#### Requirement 1.1: Outcome Verification Chain
**Grounded Definition**:
> A `SectorObjective` is "Truly Green" if:
> 1. `SectorObjective.status = 'Green'`
> 2. EXISTS path: `(obj)-[:Cascaded_Via]->(perf:SectorPerformance {status:'Green'})`
> 3. EXISTS path: `(perf)<-[:Measured_By]-(trans:SectorDataTransaction)` with `count(trans) > threshold`

**Dashboard Feature**:
- Primary metric card: "Verified Objectives vs Paper Objectives"
- Visual: Objective cards with badges:
  - 🟢 "Verified Green" (has transaction chain)
  - ⚠️ "Unverified Green" (status=Green, but zero transactions)
  - 🔴 "Red" (failed target)

**Ontology Mapping**:
- **Nodes**: `SectorObjective`, `SectorPerformance`, `SectorDataTransaction`
- **Chains**: `SectorOps` (full cycle)

---

#### Requirement 1.2: Policy Tool Execution Readiness
**Grounded Definition**:
> A `SectorPolicyTool` is "Executable" if:
> 1. EXISTS `(policy)<-[:Executes]-(cap:EntityCapability)`
> 2. `cap.maturity_level >= cap.target_maturity_level`
> 3. NOT EXISTS active projects closing capability gaps

**Dashboard Feature**:
- Table: "Policy Tools by Execution Risk"
  - Columns: Policy Name | Executing Capabilities | Avg Maturity | Gap Projects | Risk Level
- Filter: Show only "Red" policies (no capable executor)

**Ontology Mapping**:
- **Relationships**: `SectorPolicyTool ← [Executes] ← EntityCapability`
- **Properties**: `EntityCapability.maturity_level`, `EntityCapability.target_maturity_level`

---

### 3.2 CORE QUESTION 2: "ARE WE FIT?" (REVISED)

#### Requirement 2.1: Capability Lifecycle by Project State
**Grounded Definition** (replaces "Horizons A/B/C"):

**State A: "Building" Capability**
```cypher
MATCH (cap:EntityCapability)<-[:Gaps_Scope]-(project:EntityProject)
WHERE project.status IN ['Active', 'Planned']
RETURN cap, collect(project) AS building_projects
```

**State B: "Transitioning" Capability**
```cypher
MATCH (cap:EntityCapability)<-[:Close_Gaps]-(project:EntityProject)
      -[:Adoption_Risks]->(adoption:EntityChangeAdoption)
WHERE project.progress_percentage >= 80 
  AND adoption.status != 'Completed'
RETURN cap, project, adoption AS transition_risk
```

**State C: "Operating" Capability**
```cypher
MATCH (cap:EntityCapability)
WHERE cap.maturity_level >= cap.target_maturity_level
  AND NOT EXISTS((cap)<-[:Gaps_Scope]-(active_project:EntityProject 
                  WHERE active_project.status='Active'))
OPTIONAL MATCH (cap)-[:MONITORED_BY]->(risk:EntityRisk)
RETURN cap, collect(risk) AS operational_risks
```

**Dashboard Feature**:
- Three-panel view:
  - Panel A: Capability cards grouped by active project count
  - Panel B: "Adoption Gap Funnel" (Project Complete % vs Adoption Status)
  - Panel C: "Operational Health Radar" (Capabilities with risk monitoring)

---

#### Requirement 2.2: Strategic Jeopardy Propagation
**Grounded Definition**:
> When a project is delayed, trace impact UP the chain to strategic objectives.

```cypher
// Full impact chain
MATCH (project:EntityProject {status:'Delayed'})-[:Close_Gaps]->(resource)
      -[:Operates]->(cap:EntityCapability)-[:Reports]->(perf:SectorPerformance)
      -[:Aggregates_To]->(obj:SectorObjective)
OPTIONAL MATCH (cap)-[:MONITORED_BY]->(risk:EntityRisk)-[:Informs]->(perf)
RETURN obj.name AS affected_objective,
       obj.priority_level AS strategic_priority,
       cap.name AS bottleneck_capability,
       project.name AS delayed_project,
       risk.delay_days AS propagated_delay,
       risk.risk_score AS jeopardy_score
ORDER BY obj.priority_level DESC, risk.risk_score DESC
```

**Dashboard Feature**:
- "Jeopardy Alert Feed" (right sidebar)
  - Shows: Objective → Capability → Project → Risk Score
  - Color-coded by `priority_level` (L1=Red, L2=Orange, L3=Yellow)

---

### 3.3 GEOGRAPHIC VISUALIZATION (CORRECTED)

#### Requirement 3.1: Geographic Overlay (NOT Primary Structure)
**Grounded Definition**:
> Geographic display is a **view filter** on existing ontology nodes, not a data model.

**What to Display on Map**:
1. **SectorBusiness** nodes positioned by implicit location
   - Size by transaction volume
   - Color by `operating_sector`
2. **SectorDataTransaction** as flows between businesses
   - Animate based on `transaction_type`
3. **EntityOrgUnit** (government offices) by `location` property

**What NOT to Display**:
- ❌ Invented "Mining Hub" / "Processing Hub" regions
- ❌ Physical pipelines (unless represented as SectorDataTransaction type)

**Dashboard Feature**:
- Base layer: Saudi Arabia GeoJSON
- Node overlay: SectorBusiness (positioned by city)
- Flow overlay: Animated lines for SectorDataTransaction (source→target business)
- Filter controls: By year, by sector, by transaction_type

---

### 3.4 ADVANCED DIAGNOSTICS (CORRECTED)

#### Requirement 4.1: "Fake Green" Detection (Trend Analysis)
**Grounded Definition**:
```cypher
// Query performance degradation despite green status
MATCH (perf:SectorPerformance {status:'Green'})
WHERE perf.year IN [2024, 2025, 2026]
WITH perf.name AS kpi_name,
     perf.year AS year,
     (perf.actual * 100.0 / perf.target) AS achievement_rate
WITH kpi_name, 
     collect({year: year, rate: achievement_rate}) AS yearly_rates
WHERE yearly_rates[-1].rate < yearly_rates[-2].rate 
  AND yearly_rates[-2].rate < yearly_rates[-3].rate
RETURN kpi_name AS fake_green_kpi,
       yearly_rates AS degradation_trend
```

**Dashboard Feature**:
- KPI card overlay: Sparkline trend (3-year)
- Badge: "⚠️ Deteriorating" if downward trend

---

#### Requirement 4.2: Root Cause Drill-Down
**Grounded Definition**:
> From a Red objective, traverse backwards to find the root blockage.

```cypher
// Click on Red Objective → Find root cause
MATCH path = (obj:SectorObjective {status:'Red'})<-[:Aggregates_To]-
             (perf:SectorPerformance)<-[:Reports]-(cap:EntityCapability)
             <-[:Operates]-(resource)<-[:Close_Gaps]-(project:EntityProject)
WHERE project.status IN ['Delayed', 'Blocked']
OPTIONAL MATCH (project)-[:Adoption_Risks]->(adoption:EntityChangeAdoption)
OPTIONAL MATCH (resource)-[:Depends_On]->(vendor:EntityVendor)
RETURN obj.name AS failed_objective,
       cap.name AS weak_capability,
       project.name AS blocked_project,
       adoption.status AS adoption_failure,
       vendor.name AS vendor_dependency
```

**Dashboard Feature**:
- Click objective card → Opens "Impact Chain Viewer"
- Force-directed graph showing full path
- Highlight root node (Project/Vendor/Adoption) in red

---

## PART 4: DASHBOARD MAPPING TO ONTOLOGY

### Dashboard 1: "Ontology Operations Hub" (NEW - Landing Page)
**Purpose**: Structural health check of the graph itself

#### Panel A: Cross-Domain Connection Matrix
**Query**:
```cypher
// Count relationships across Sector-Entity boundary
MATCH (sector)-[rel]->(entity)
WHERE sector:SectorObjective OR sector:SectorPolicyTool OR sector:SectorPerformance
  AND entity:EntityCapability OR entity:EntityRisk
RETURN labels(sector)[0] AS sector_node,
       labels(entity)[0] AS entity_node,
       type(rel) AS relationship_type,
       count(rel) AS connection_count
```

**Visualization**: Heatmap grid (Sector nodes × Entity nodes)
- **Green cells**: High connection density (healthy)
- **Red cells**: Zero connections (structural gap)

#### Panel B: Temporal Orphans
**Query**:
```cypher
// Find nodes with year mismatches in relationships
MATCH (a)-[rel]->(b)
WHERE a.year <> b.year
RETURN a.year AS source_year, b.year AS target_year,
       labels(a)[0] AS source_type, labels(b)[0] AS target_type,
       count(*) AS mismatch_count
```

**Visualization**: Alert list with orange badges

#### Panel C: Dangling Nodes
**Query**:
```cypher
// Objectives with no policy tools
MATCH (obj:SectorObjective)
WHERE NOT EXISTS((obj)-[:Realized_Via]->(:SectorPolicyTool))
RETURN obj.name AS isolated_objective, obj.priority_level
```

**Visualization**: Isolated node graph (force-directed)

---

### Dashboard 2: "Strategic Execution Pipeline" (REVISED strategic.html)
**Purpose**: Trace strategy→action→data chain

#### Main View: Execution Sankey (CORRECT - Keep As Is)
**Query** (follows SectorOps chain):
```cypher
MATCH path = (obj:SectorObjective)-[:Realized_Via]->(policy:SectorPolicyTool)
             -[:Refers_To]->(record:SectorAdminRecord)-[:Applied_On]->(stakeholder)
             -[:Triggers_Event]->(trans:SectorDataTransaction)
RETURN path
```

**Visualization**: Sankey diagram (already correct in current design)

#### Bottom Panel: "Paper Objectives" Table (NEW)
**Query**:
```cypher
MATCH (obj:SectorObjective)-[:Cascaded_Via]->(perf:SectorPerformance {status:'Green'})
WHERE NOT EXISTS((perf)<-[:Measured_By]-(:SectorDataTransaction))
RETURN obj.name AS paper_objective,
       perf.name AS unverified_kpi,
       perf.target AS claimed_target
```

**Visualization**: Table with warning icons

---

### Dashboard 3: "Risk Impact Propagation" (REVISED risk.html)
**Purpose**: Show how risks cascade through the system

#### Central View: Bidirectional Risk Tree
**Query**:
```cypher
MATCH (cap:EntityCapability)-[:MONITORED_BY]->(risk:EntityRisk)
      -[:Informs]->(perf:SectorPerformance)-[:Aggregates_To]->(obj:SectorObjective)
RETURN cap, risk, perf, obj
```

**Visualization**: Radial tree
- Center: `EntityRisk` nodes
- Left branches: `EntityCapability` (what owns the risk)
- Right branches: `SectorPerformance` → `SectorObjective` (what's threatened)

#### Click Interaction: "Blast Radius"
- Click a risk node → Highlight all downstream objectives
- Calculate "Impact Score" = `risk.risk_score × obj.priority_level`

---

### Dashboard 4: "Capability Lifecycle Tracker" (REVISED lifecycle.html)
**Purpose**: Monitor capability fitness across build/transition/operate

#### Zone A: Building Capabilities
**Query**:
```cypher
MATCH (cap:EntityCapability)<-[:Gaps_Scope]-(project:EntityProject)
WHERE project.status = 'Active'
OPTIONAL MATCH (cap)-[:Reports]->(perf:SectorPerformance)
             -[:Aggregates_To]->(obj:SectorObjective)
RETURN cap, collect(project) AS active_projects, obj.priority_level AS criticality
```

**Visualization**: Scatter plot
- X-axis: Project progress %
- Y-axis: Objective priority level
- Size: Number of active projects per capability

#### Zone B: Transition Risk Funnel
**Query**:
```cypher
MATCH (project:EntityProject)-[:Close_Gaps]->(resource)
      -[:Operates]->(cap:EntityCapability)
WHERE project.progress_percentage >= 80
OPTIONAL MATCH (project)-[:Adoption_Risks]->(adoption:EntityChangeAdoption)
RETURN project, cap, adoption.status AS adoption_state
```

**Visualization**: Funnel chart
- Stage 1: Projects at 80-100%
- Stage 2: Projects with adoption plans
- Stage 3: Projects with completed adoption
- Highlight gap between stages

#### Zone C: Operational Health Monitor
**Query**:
```cypher
MATCH (cap:EntityCapability)
WHERE cap.maturity_level >= cap.target_maturity_level
OPTIONAL MATCH (cap)-[:MONITORED_BY]->(risk:EntityRisk {risk_status:'Active'})
RETURN cap, count(risk) AS active_risks,
       CASE WHEN count(risk) = 0 THEN 'Healthy'
            WHEN count(risk) <= 2 THEN 'Monitored'
            ELSE 'Degrading' END AS health_status
```

**Visualization**: Status grid (capability cards)
- 🟢 Healthy (0 risks)
- 🟡 Monitored (1-2 risks)
- 🔴 Degrading (3+ risks)

---

### Dashboard 5: "Tactical Feedback Loop" (REVISED feedback.html)
**Purpose**: Verify projects are closing capability gaps

#### Central View: Gap-Closure Circuit
**Query**:
```cypher
MATCH (cap:EntityCapability)-[:Role_Gaps|Knowledge_Gaps|Automation_Gaps]->(resource)
      <-[:Gaps_Scope]-(project:EntityProject)-[:Close_Gaps]->(resource)
RETURN cap, resource, project
```

**Visualization**: Circular flow diagram
- Top: Capability identifies gap
- Right: Project scoped to gap
- Bottom: Project closes gap
- Left: Resource returns to capability

**Break Detection**:
```cypher
// Find broken loops (gap identified, no closure project)
MATCH (cap:EntityCapability)-[:Automation_Gaps]->(sys:EntityITSystem)
WHERE NOT EXISTS((sys)<-[:Close_Gaps]-(:EntityProject))
RETURN cap.name AS capability_with_unclosed_gap,
       sys.name AS missing_system
```

**Visualization**: Red "broken circuit" icon on incomplete loops

---

## PART 5: DATA STRUCTURE REVISION

### 5.1 Current data.js Issues
```javascript
// ❌ CURRENT (ontology violations)
const ksaData = {
    regions: [...],  // Invented node type
    flows: [...],    // Not grounded
    objectives: [    // Partially correct
        { verified: true }  // Should be calculated, not stored
    ]
};
```

### 5.2 Correct Data Structure
```javascript
// ✅ ONTOLOGY-GROUNDED DATA MODEL
const ontologyData = {
    // Sector Layer
    sectorObjectives: [
        {
            id: 'SO-L1-001',
            name: 'Industrial Value Addition',
            year: 2025,
            level: 'L1',
            status: 'Amber',
            target: 100,
            baseline: 60,
            priority_level: 'Critical',
            // NO 'verified' property - this is calculated via query
        }
    ],
    
    sectorPolicyTools: [
        {
            id: 'SPT-L2-012',
            name: 'Investment Incentive Program',
            year: 2025,
            level: 'L2',
            status: 'Active',
            tool_type: 'Financial Instrument',
            parent_id: 'SPT-L1-003'
        }
    ],
    
    sectorPerformance: [
        {
            id: 'PERF-L1-005',
            name: 'Non-Oil GDP Contribution %',
            year: 2025,
            level: 'L1',
            status: 'Green',
            target: 50,
            actual: 48,
            kpi_type: 'Strategic'
        }
    ],
    
    sectorDataTransactions: [
        {
            id: 'TRANS-L3-089',
            year: 2025,
            level: 'L3',
            transaction_type: 'Business Registration',
            domain: 'Licensing',
            quarter: 'Q2'
        }
    ],
    
    // Entity Layer
    entityCapabilities: [
        {
            id: 'CAP-L2-034',
            name: 'Investment Promotion',
            year: 2025,
            level: 'L2',
            status: 'Developing',
            maturity_level: 2,
            target_maturity_level: 4,
            parent_id: 'CAP-L1-008'
        }
    ],
    
    entityProjects: [
        {
            id: 'PROJ-L3-156',
            name: 'CRM System Implementation',
            year: 2025,
            level: 'L3',
            status: 'Active',
            progress_percentage: 65,
            start_date: '2024-06-01',
            end_date: '2025-12-31',
            parent_id: 'PROJ-L2-045'
        }
    ],
    
    entityRisks: [
        {
            id: 'RISK-L3-201',
            name: 'Vendor Delay Risk',
            year: 2025,
            level: 'L3',
            risk_status: 'Active',
            risk_score: 8.5,
            likelihood_of_delay: 'High',
            delay_days: 45,
            parent_id: 'RISK-L2-067'
        }
    ],
    
    // Relationships (explicit edge definitions)
    relationships: {
        realized_via: [
            { source: 'SO-L1-001', target: 'SPT-L1-003', year: 2025 }
        ],
        cascaded_via: [
            { source: 'SO-L1-001', target: 'PERF-L1-005', year: 2025 }
        ],
        measured_by: [
            { source: 'TRANS-L3-089', target: 'PERF-L1-005', year: 2025 }
        ],
        executes: [
            { source: 'CAP-L2-034', target: 'SPT-L2-012', year: 2025 }
        ],
        reports: [
            { source: 'CAP-L2-034', target: 'PERF-L2-019', year: 2025 }
        ],
        gaps_scope: [
            { source: 'CAP-L2-034', target: 'PROJ-L3-156', year: 2025 }
        ],
        monitored_by: [
            { source: 'CAP-L3-102', target: 'RISK-L3-201', year: 2025 }
        ]
    }
};
```

### 5.3 Query Helper Functions
```javascript
// Helper: Check if objective is "verified" (has transaction backing)
function isObjectiveVerified(objectiveId) {
    const obj = ontologyData.sectorObjectives.find(o => o.id === objectiveId);
    
    // Trace: Objective → Performance → Transaction
    const perfRels = ontologyData.relationships.cascaded_via
        .filter(r => r.source === objectiveId);
    
    for (const perfRel of perfRels) {
        const transRels = ontologyData.relationships.measured_by
            .filter(r => r.target === perfRel.target);
        
        if (transRels.length > 0) {
            return true; // Has backing transactions
        }
    }
    
    return false; // "Paper Tiger"
}

// Helper: Get capability lifecycle state
function getCapabilityLifecycleState(capabilityId) {
    const cap = ontologyData.entityCapabilities.find(c => c.id === capabilityId);
    
    // Check for active gap-closing projects
    const hasActiveProjects = ontologyData.relationships.gaps_scope
        .some(r => {
            if (r.target !== capabilityId) return false;
            const project = ontologyData.entityProjects.find(p => p.id === r.source);
            return project && project.status === 'Active';
        });
    
    if (hasActiveProjects) {
        return 'BUILD';
    }
    
    // Check maturity vs target
    if (cap.maturity_level >= cap.target_maturity_level) {
        return 'OPERATE';
    }
    
    return 'TRANSITION';
}

// Helper: Find root cause of failed objective
function getRootCauseChain(objectiveId) {
    const chain = [];
    
    // Step 1: Objective → Performance
    const perfRels = ontologyData.relationships.cascaded_via
        .filter(r => r.source === objectiveId);
    
    for (const perfRel of perfRels) {
        const perf = ontologyData.sectorPerformance.find(p => p.id === perfRel.target);
        if (perf.status !== 'Red') continue;
        
        chain.push({ type: 'Performance', data: perf });
        
        // Step 2: Performance ← Reports ← Capability
        const capRels = ontologyData.relationships.reports
            .filter(r => r.target === perf.id);
        
        for (const capRel of capRels) {
            const cap = ontologyData.entityCapabilities.find(c => c.id === capRel.source);
            if (cap.maturity_level >= cap.target_maturity_level) continue;
            
            chain.push({ type: 'Capability', data: cap });
            
            // Step 3: Capability ← Gaps Scope ← Project
            const projRels = ontologyData.relationships.gaps_scope
                .filter(r => r.target === cap.id);
            
            for (const projRel of projRels) {
                const proj = ontologyData.entityProjects.find(p => p.id === projRel.source);
                if (proj.status !== 'Delayed' && proj.status !== 'Blocked') continue;
                
                chain.push({ type: 'Project', data: proj });
                
                // Step 4: Project → Risk
                const risks = ontologyData.entityRisks.filter(r => 
                    r.name.includes(proj.name) || // Weak link - need proper rel
                    r.risk_status === 'Active'
                );
                
                if (risks.length > 0) {
                    chain.push({ type: 'Risk', data: risks[0] });
                }
            }
        }
    }
    
    return chain;
}
```

---

## PART 6: IMPLEMENTATION PRIORITIES

### Phase 1: Critical Foundation (Week 1)
1. **Replace data.js with ontology-grounded structure**
   - Remove `regions`, `flows`
   - Add all 16 node types
   - Define explicit `relationships` object

2. **Implement query helper library** (`js/ontology-queries.js`)
   - `isObjectiveVerified()`
   - `getCapabilityLifecycleState()`
   - `getRootCauseChain()`
   - `findDanglingNodes()`
   - `checkTemporalConsistency()`

3. **Create Landing Dashboard** (new `hub.html`)
   - Cross-domain matrix
   - Temporal orphan alerts
   - Dangling node visualization

### Phase 2: Dashboard Corrections (Week 2)
4. **Fix strategic.html**
   - Add "Paper Objectives" table
   - Fix Sankey to use real relationship data

5. **Rebuild lifecycle.html**
   - Replace "Zones A/B/C" language with ontology states
   - Implement three query panels

6. **Correct index.html (geographic view)**
   - Remove invented regions
   - Overlay SectorBusiness nodes on map
   - Use SectorDataTransaction for flows

### Phase 3: Advanced Features (Week 3)
7. **Implement risk.html (new approach)**
   - Bidirectional risk tree
   - Click-to-highlight impact chains

8. **Build feedback.html**
   - Gap-closure circuit visualization
   - Broken loop detection

9. **Add diagnostic features**
   - "Fake Green" trend detection
   - Root cause drill-down modals

---

## PART 7: TESTING CHECKLIST

### Ontology Compliance Tests
- [ ] All visualizations use only defined node types
- [ ] All relationships follow `<direct_relationships>` rules
- [ ] No queries assume invented properties
- [ ] Level constraints respected (L1↔L1, L3↔L3, cross-domain rules)
- [ ] Temporal consistency enforced (year matching)
- [ ] PARENT_OF hierarchy preserved in all queries

### Dashboard Validation
- [ ] Landing hub shows actual structural gaps (not mock data)
- [ ] Strategic view traces full SectorOps chain
- [ ] Lifecycle states derived from project/capability queries
- [ ] Risk view uses bidirectional traversal
- [ ] Geographic view is overlay, not primary structure

### Data Integrity
- [ ] No `verified: boolean` in data (calculated only)
- [ ] No `criticality` property (derived from objective priority)
- [ ] No "lifecycle phase" property (derived from project state)
- [ ] All relationships have explicit edge definitions
- [ ] Year properties consistent across related nodes

---

## CONCLUSION

**The Current State**:
- 🔴 **70% ontology drift** - Most features assume non-existent concepts
- 🔴 **Zero explicit relationship modeling** - Current data.js has no edge definitions
- 🟡 **Partial chain compliance** - Sankey diagram is correct, but not used elsewhere

**The Path Forward**:
1. **Immediate**: Stop all feature additions until data model is ontology-grounded
2. **Week 1**: Rebuild `data.js` with explicit node types and relationships
3. **Week 2**: Correct all dashboard queries to use only defined chains
4. **Week 3**: Implement diagnostic features using traversal algorithms

**Success Criteria**:
- Every dashboard feature can be traced to a specific ontology chain
- No invented node types or properties
- All visualizations derive from explicit relationship queries
- Documentation references ontology definitions throughout

---

**Next Steps**:
1. Review this analysis with stakeholders
2. Approve revised requirements
3. Create implementation tickets for each dashboard
4. Build ontology query library first (foundation)
5. Rebuild dashboards one by one with explicit testing

**Questions for Clarification**:
1. Are there missing relationships in the ontology that need to be added?
2. Should we support "calculated relationships" (e.g., transitive closure)?
3. What is the source of truth for the production graph database?
4. How should we handle historical data (multi-year analysis)?

---
**Document Control**
- Version: 1.0
- Author: AI Agent (Planning Mode)
- Status: Draft for Review
- Next Review: After stakeholder approval
