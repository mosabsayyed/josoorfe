# Risk Analyst Agent Specification

> **Version**: 1.0  
> **Status**: Authoritative  
> **Created**: 2024-12-30

---

## 1. Risk Logic and Formulas

### A. Two Explicit Modes

Every risk row has two independent score tracks; only one is "active" based on capability status.

| Mode | Capability Status | Purpose | Routes To |
|------|------------------|---------|-----------|
| **BUILD** | `planned`, `in_progress` | Quantify expected delay to reach intended impact | `SectorPolicyTool` |
| **OPERATE** | `active` | Quantify probability of missing performance targets | `SectorPerformance` |

Store both tracks, expose one via `affecting_policy_tools_or_performance`.

---

### B. BUILD Risk Track (Expected Delay + Normalized Exposure)

#### Field Definitions

| Field | Scale | Meaning |
|-------|-------|---------|
| `project_outputs_risk`, `role_gaps_risk`, `it_systems_risk` | 0.0–1.0 | Component-level probability of causing delay |
| `*_delay_days` | Integer ≥ 0 | Component-level schedule slip in days |
| `*_persistence` | 0–3 | Recurrence strength across cycles |
| `likelihood_of_delay` | 0.0–1.0 | Overall probability of capability impact delay |
| `delay_days` | Integer | Overall critical-path delay for capability |
| `risk_score` | Days | Expected delay days = `likelihood_of_delay × delay_days` |

#### Persistence Mapping

| Persistence Value | Probability (`persist_p`) |
|-------------------|---------------------------|
| 0 | 0.00 |
| 1 | 0.50 |
| 2 | 0.75 |
| 3 | 1.00 (Issue) |

#### Component Risk Calculation

For each component `c ∈ {outputs, roles, it}`:

```
Signal A — recurrence:     persist_p_c = mapping[persistence_c]
Signal B — slip severity:  slip_p_c = clamp01(delay_days_c / red_delay_days)

component_risk_c = max(persist_p_c, slip_p_c)
```

#### Overall Probability and Delay

```
Default weights: W_outputs = W_roles = W_it = 1/3

likelihood_of_delay = W_outputs × project_outputs_risk 
                    + W_roles × role_gaps_risk 
                    + W_it × it_systems_risk

delay_days = max(project_outputs_delay_days, 
                 role_gaps_delay_days, 
                 it_systems_delay_days)

risk_score_days = likelihood_of_delay × delay_days
```

#### BUILD Exposure Percentage (50% threshold metric)

```
build_exposure_pct = clamp01(risk_score_days / red_delay_days) × 100
```

**50% exposure** = expected delay has consumed half of red tolerance.

#### BUILD Severity Bands

| Band | Exposure % |
|------|------------|
| Green | < 35 |
| Amber | 35–65 |
| Red | > 65 |

---

### C. OPERATE Risk Track (Health → Risk)

#### Health Score Normalization (1-5 → 0-100)

```
health_pct = ((score - 1) / 4) × 100
```

| Component | Source | Stored Field |
|-----------|--------|--------------|
| **People** | Culture Health Survey (1-5) | `people_score` |
| **Process** | Maturity Level vs Target (1-5) | `process_score` |
| **Tools** | Vendor SLA Compliance (1-5) | `tools_score` |

#### Operational Health

```
operational_health_score = (people_score + process_score + tools_score) / 3
```

#### OPERATE Exposure (inverse of health)

```
operate_exposure_pct = 100 - operational_health_score
```

#### Persistence Penalty (stops oscillation)

If last N cycles show decline or below-amber:
```
operate_exposure_pct = clamp(operate_exposure_pct + trend_penalty_pct, 0, 100)
Example: trend_penalty_pct = 10 when deterioration persists 2+ cycles
```

---

### D. Hierarchy Roll-up (L3 → L2 → L1)

Avoid averaging that hides hotspots.

```
parent_exposure = max(child_exposure)

Optional breadth factor:
parent_exposure = max(child_exposure) × (1 + 0.10 × ln(1 + count(children_over_amber)))
clamp to 100
```

---

## 2. Dynamic Association Rules

### A. Mode Determination

```
affecting_policy_tools_or_performance = 
  'policy_tools' if capability.status ∈ {Planned, In progress}
  'performance'  if capability.status = Active
  null           otherwise
```

### B. Threshold Rule

`link_threshold_pct = 50`

| Affecting | Link Condition |
|-----------|----------------|
| `policy_tools` | `build_exposure_pct >= 50` |
| `performance` | `operate_exposure_pct >= 50` |

### C. Graph Relationships (No Junction Tables)

```cypher
// BUILD mode links
(:Risk)-[:AFFECTS_POLICY_TOOL {year, quarter, exposure_pct, asof_date, mode:'BUILD'}]->(:PolicyTool)

// OPERATE mode links  
(:Risk)-[:AFFECTS_PERFORMANCE {year, quarter, exposure_pct, asof_date, mode:'OPERATE'}]->(:PerformanceTarget)
```

If exposure falls below threshold: delete relationship or set `active=false`.

---

## 3. Risk Analyst Agent

### A. Role Definition

**Risk Analyst Agent** is a deterministic scorer and linker.

**Responsibilities:**
1. Populate BUILD and OPERATE exposure metrics for every capability-linked risk node each cycle
2. Maintain dynamic graph associations to PolicyTools or Performance targets
3. Produce auditable evidence and diagnostics for missing inputs
4. Roll up L3 risks into L2/L1 parents

**Non-responsibilities:**
- Does not invent data
- Does not override manual closures without explicit rules

### B. Core Workflow (Periodic Run)

1. **Scope selection**: Identify year/quarter, pull all capabilities and their 1:1 risks
2. **Mode resolution**: Determine BUILD vs OPERATE based on capability status
3. **Evidence gathering**:
   - BUILD: project outputs, role gaps, IT systems milestones + persistence
   - OPERATE: people survey, process maturity, vendor SLA
4. **Score computation**: All formulas above
5. **Graph update**: Upsert risk properties, create/remove AFFECTS relationships
6. **Audit**: Write Assessment Run record

### C. On-Demand Workflow (Master Orchestrator Triggers)

| Trigger | Action |
|---------|--------|
| "Explain this risk" | Recompute + return explanation tree |
| "What changed since last cycle" | Diff last two Assessment Runs |
| "I need more information" | Emit diagnostics with missing nodes/fields |

### D. Required Tools

1. `graph_read(cypher, params)`
2. `graph_write(cypher, params)`
3. `upsert_relationship(type, from, to, props)`
4. `delete_relationship(type, from, to, filter)`
5. `get_time_context()` → `{asof_date, year, quarter}`
6. `audit_log_write(run_payload)` → run_id
7. `score_config_read()` → tolerances and weights

---

## 4. Canonical Output Contract

```json
{
  "run_context": { "asof_date": "YYYY-MM-DD", "year": 2025, "quarter": 4, "mode": "MIXED" },
  "summary": {
    "capabilities_scored": 0,
    "risks_scored": 0,
    "links_created": 0,
    "links_removed": 0,
    "over_threshold_build": 0,
    "over_threshold_operate": 0,
    "max_build_exposure_pct": 0,
    "max_operate_exposure_pct": 0
  },
  "updates": [
    {
      "risk_id": "1.2.3",
      "year": 2025,
      "quarter": 4,
      "affecting": "policy_tools",
      "build": {
        "project_outputs_risk": 0.75,
        "role_gaps_risk": 0.50,
        "it_systems_risk": 1.00,
        "likelihood_of_delay": 0.75,
        "delay_days": 60,
        "expected_delay_days": 45,
        "build_exposure_pct": 62.5,
        "band": "Amber"
      },
      "operate": null,
      "relationship_changes": [
        { "type": "AFFECTS_POLICY_TOOL", "action": "UPSERT", "target_id": "PT-XYZ", "exposure_pct": 62.5 }
      ],
      "evidence": {
        "drivers": [
          { "component": "it_systems", "reason": "overdue", "delay_days": 60, "persistence": 3 }
        ],
        "thresholds": { "link_threshold_pct": 50, "red_delay_days": 72 }
      },
      "data_gaps": []
    }
  ],
  "data_gaps": [
    { "capability_id": "2.1", "missing": ["vendor_sla_rating"], "impact": "operate_exposure_unavailable" }
  ],
  "audit": { "assessment_run_id": "RUN-UUID" }
}
```

---

## 5. Neo4j Implementation

### A. 1:1 Capability ↔ Risk

```cypher
// Ensure relationship exists
MERGE (r:Risk {id: $id, year: $year})
MERGE (c:Capability {id: $id, year: $year})-[:HAS_RISK]->(r)
```

### B. Store Both Exposure Metrics

Properties on `:Risk`:
- `build_exposure_pct`
- `operate_exposure_pct`
- `risk_score` (expected_delay_days for BUILD)

### C. Dynamic Relationship Maintenance

```cypher
// CREATE link when exposure >= threshold
MATCH (r:Risk {id: $id, year: $year})
WHERE r.build_exposure_pct >= 50
MATCH (pt:SectorPolicyTool) // with appropriate matching logic
MERGE (r)-[:AFFECTS_POLICY_TOOL {year: $year, quarter: $quarter}]->(pt)

// REMOVE link when exposure < threshold
MATCH (r:Risk {id: $id, year: $year})-[rel:AFFECTS_POLICY_TOOL]->(pt)
WHERE r.build_exposure_pct < 50
DELETE rel
```
