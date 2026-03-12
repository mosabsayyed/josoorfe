# Risk & Status Design Document

> **Version:** 3.1 — 2026-02-25
> **Base:** RISK_LOGIC_SPEC.md + RISK_AUDIT_SOP.md + RISK_AGENT_WORKFLOW.md + Enterprise_Ontology_SST_v1.2.md
> **Corrections:** Applied from user review session (2026-02-25). All user corrections override the base specs.
> **Rule:** Where old specs conflict with user corrections, the correction wins. Conflicts are noted inline with ⚠️.
> **v3.1 changes:** Neo4j verification results applied. KPI path confirmed. Dependency count defined. Relationship cleanup specified. Cumulative caps behavior documented.

---

## 1. Capability Maturity — The Stage Gate Model

### 1.1 The 5 Stages

| Stage | Name | Meaning |
|-------|------|---------|
| S1 | Determined | Scope defined, initial assessments done |
| S2 | Planned | Detailed plans, teams forming, systems specified |
| S3 | Activated | Core operational — minimum viable capability |
| S4 | Matured | Full capacity, optimized |
| S5 | Mastered | Strategic excellence, continuous improvement |

### 1.2 The 3 Dimensions

Each capability is measured across 3 independent dimensions:

| Dimension | Also Called | What It Tracks |
|-----------|-----------|----------------|
| Organization | People | Roles, headcount, recruitment, unit structure |
| Data/Systems | Tools | Agreements, outputs, digital systems |
| Processes | Process | Classification, development, governance |

### 1.3 Core Rule

**Capability level = LOWEST of the 3 dimensions.**

Example: Organization=S3, Data/Systems=S4, Processes=S2 → Capability level = **S2**.

### 1.4 Target

`target_maturity_level` = the stage ALL 3 dimensions must reach. A capability is "activated" (S3) only when ALL THREE dimensions reach S3.

### 1.5 Stage Gate Milestones (from user's diagram — `docs/stage_gate_diagram.png`)

**Organization:**

| Area | S1 | S2 | S3 | S4 | S5 |
|------|----|----|----|----|-----|
| Role Description | JDs list defined | Core JDs detailed | All JDs detailed | Development plans set | Strategic Outsourcing |
| FTE Needs | Headcount defined | Core team # defined | Full team # defined | Annual forecasting | Internal Succession |
| Acquisition Path | Options defined | Build approach decided | Core Unit built | Full Unit built | Talent Factory |
| Recruitment | Unit owner onboard | Recruiting core team | Core team onboarded | Full team onboarded | Retention Resilience |

**Data/Systems:**

| Area | S1 | S2 | S3 | S4 | S5 |
|------|----|----|----|----|-----|
| External Agreements | Consolidated MoU list | MoU plan defined | Critical MoUs signed | All MoUs signed | Digital Integration |
| Initiatives Outputs | Main outputs described | Outputs prioritized | Priority outputs published | All outputs published | All outputs digitized |
| Digital Systems | Main features identified | Critical features defined | Working features delivered | All Delivered (final form) | All systems integrated |

**Processes:**

| Area | S1 | S2 | S3 | S4 | S5 |
|------|----|----|----|----|-----|
| Classification | L1-2 final, tracking overlay | KPI overlay | Digital tool deployed | E2E process optimization | Process Mining/AA |
| Development | Initial L3 list identified | Core L3 list, design inputs | Core processes (L4/L5) | All processes (L4/L5) | Process Culture embedded |
| Governance | Roles defined | Roles Assigned | Roles Activated | Performance Management | Operations Management |

---

## 2. Two Modes: BUILD vs OPERATE

### 2.1 Mode Determination

A capability is in exactly ONE mode at any time:

| Mode | When | What Drives Status | What Drives Overlay |
|------|------|-------------------|---------------------|
| **BUILD** | status = `planned` or `in_progress` | Project delay (planned vs actual) | None — no overlay in BUILD |
| **OPERATE** | status = `active` | KPI achievement (actual vs target) | Regression exposure (survey + SLA) |

**BUILD is a 0/1 setup.** A capability being built is NOT operational — there are no KPIs to measure, no gauge to show. Only project delay strips.

**Transition:** BUILD → OPERATE when capability status changes to `active`. Projects are done; KPIs take over.

### 2.2 What This Means for the System

| Component | BUILD Mode | OPERATE Mode |
|-----------|-----------|--------------|
| Strip color | `build_status` | `execute_status` |
| Gauge | **Does NOT exist** | KPI achievement % |
| Overlay | **None** | Exposure gradient (dependency heatmap) |
| Panel shows | Stage Gate progress + project deliverables | KPI metrics + regression dimensions |
| Risk formula | Delay risk (Section 3) | KPI strip (Section 4) + Exposure (Section 5) |

---

## 3. BUILD Mode — Delay Risk

### 3.1 What It Measures

How far behind is the capability from where it should be? Measured by the gap between planned and actual project progress.

### 3.2 Input Data

**Source:** EntityProject nodes connected to the capability via the `build_oversight` chain.

Each project contributes to one of 3 components:
- **Outputs** (project deliverables) — via general project links
- **Roles** (organizational gaps) — via ROLE_GAPS projects
- **IT** (systems gaps) — via AUTOMATION_GAPS projects

Per component, extract:
- `delay_days_c` = max overdue days across that component's projects
- `persistence_c` = recurrence counter (0-3), tracked across ETL cycles

### 3.3 Persistence Factor

Prevents a component from bouncing back to green just because it fixed the current delay — if it was REPEATEDLY late, risk stays high.

**Update rule (each ETL cycle):**
```
if component_delay_days > 0:
    persistence = min(3, persistence_prev + 1)    # ratchets up
else:
    persistence = max(0, persistence_prev - 1)    # decays slowly
```

**Persistence → Probability mapping:**

| Persistence | `persist_p` | Meaning |
|-------------|-------------|---------|
| 0 | 0.00 | No history of delay |
| 1 | 0.50 | First occurrence |
| 2 | 0.75 | Recurring |
| 3 | 1.00 | Chronic — treated as a confirmed issue |

### 3.4 Component Risk Calculation

For each component `c ∈ {outputs, roles, it}`:

```
slip_p_c       = clamp01(delay_days_c / red_delay_days)
persist_p_c    = persistence_mapping[persistence_c]
component_risk_c = max(persist_p_c, slip_p_c)
```

The component risk is the HIGHER of current slip OR historical persistence. This means even if a project catches up this cycle, chronic delays keep the risk elevated.

### 3.5 Overall BUILD Risk

```
likelihood_of_delay = average(component_risk_outputs, component_risk_roles, component_risk_it)
delay_days          = max(outputs_delay, roles_delay, it_delay)     # critical path
expected_delay_days = likelihood_of_delay × delay_days
build_exposure_pct  = clamp((expected_delay_days / red_delay_days) × 100, 0, 100)
```

### 3.6 BUILD Strip Color (⚠️ CORRECTED from old spec)

> ⚠️ Old spec used bands: Green <35, Amber 35-65, Red >65. **User corrected to 5/15 delta thresholds.**

The strip color is based on the delta between planned and actual progress:

| `build_status` | Range | Color | Meaning |
|----------------|-------|-------|---------|
| `not-due` | No projects assigned | `#475569` (Gray) | Nothing to track |
| `planned` | Projects exist, not started | `#475569` (Gray) | Awaiting kickoff |
| `in-progress-ontrack` | Delta < 5% | `#10b981` (Green) | On track |
| `in-progress-atrisk` | Delta 5–15% | `#f59e0b` (Amber) | Falling behind |
| `in-progress-issues` | Delta > 15% | `#ef4444` (Red) | Serious slippage |

**Ripple effect of this change:**
- The `build_exposure_pct` formula (Section 3.5) still calculates the raw risk score
- The strip color thresholds (5/15) apply to the **displayed status**, not to `build_exposure_pct` directly
- `build_exposure_pct` feeds into the AFFECTS_POLICY_TOOL linking rule (threshold: 50%)
- The `build_band` on EntityRisk still uses the raw exposure calculation for analytical purposes

### 3.7 Health = Actual vs Target, NOT Absolute Values

> ⚠️ Old spec normalized 1-5 scores as absolute values. **User corrected: health is always delta between actual and target.**


A raw score of 2/5 is NOT automatically bad. If the plan says the dimension should be at S2 right now, then being at S2 is ON TRACK. Health is the gap between where you ARE vs where you SHOULD BE at this point in time.
### 3.8 Stage Gate in BUILD Panel

The BUILD section of the L2 panel MUST show:
- Each dimension's current stage vs target stage (e.g., "Organization: S2 → target S3")
- NOT absolute values like "People 2.5/5"

---

## 4. OPERATE Mode — Layer 1: KPI Strip

### 4.1 What It Measures

Is the live capability delivering results? Measured by KPI performance — actual value vs planned quarterly target.

**This is a confirmed fact (100% probability)** — a KPI miss already happened. It always takes priority over Layer 2 (which is a prediction).

### 4.2 Input Data

**Source:** SectorPerformance nodes linked to the capability **through the Risk chain**.

> ⚠️ v3.1: VERIFIED. `DELIVERS` does NOT exist (0 relationships). Direct `REPORTS` (Cap→Perf, 225) is a legacy relationship being deleted. The correct path is:
>
> ```
> EntityCapability -[:MONITORED_BY]-> EntityRisk -[:INFORMS]-> SectorPerformance
> ```
>
> Verified counts: MONITORED_BY = 484, INFORMS to SectorPerformance = 328, INFORMS to SectorPolicyTool = 363.

Each SectorPerformance node has `actual` and `target`.

> ⚠️ v3.1: Field is `actual`, NOT `actual_value`. Verified against Neo4j sample nodes.

### 4.3 Formula

```
kpi_achievement_pct = (actual / target) × 100
```

### 4.4 OPERATE Strip Color (⚠️ CORRECTED from old spec)

> ⚠️ Old spec derived OPERATE strip from `operate_exposure_pct` (health-based bands Green <35, Amber 35-65, Red >65). **User corrected: OPERATE strip = KPI achievement with 90/70 thresholds.**

| `execute_status` | Range | Color | Meaning |
|-----------------|-------|-------|---------|
| `ontrack` | ≥ 90% of target | `#10b981` (Green) | Delivering as expected |
| `at-risk` | 70–90% of target | `#f59e0b` (Amber) | Below target |
| `issues` | < 70% of target | `#ef4444` (Red) | Significantly underperforming |

**Ripple effect of this change:**
- The `operate_exposure_pct` formula from the old spec (Section 5) still exists but drives the **overlay** (Layer 2), NOT the strip
- The strip is now purely KPI-driven
- This creates a clear two-layer system: Strip = confirmed fact, Overlay = predicted risk

---

## 5. OPERATE Mode — Layer 2: Exposure Overlay

### 5.1 What It Measures

Can we predict that a currently-healthy capability might LOSE its level? This is the regression risk — foresight, not fact.

### 5.2 Regression Dimensions (⚠️ CORRECTED weighting)

> ⚠️ Old spec used equal 33/33/33 weighting. **User corrected: People 40%, Tools 40%, Process 20%.**

| Dimension | Data Source | Weight | Volatility | Why |
|-----------|-----------|--------|------------|-----|
| People | CultureHealth survey | **40%** | VOLATILE | Staff can leave, morale crashes |
| Tools | Vendor `performance_rating` (SLA) | **40%** | VOLATILE | Vendor can fail, systems crash |
| Process | Documentation status | **20%** | STABLE | Once documented, knowledge persists |

**Why unequal?** Process is stable — once knowledge is documented, it doesn't disappear overnight. People and tools are volatile — staff can quit, vendors can fail. So People and Tools carry double the weight.

### 5.3 Health Score Calculation (from old spec, retained)

```
people_pct   = ((people_score - 1) / 4) × 100
process_pct  = ((process_score - 1) / 4) × 100
tools_pct    = ((tools_score - 1) / 4) × 100

operational_health_pct = (people_pct × 0.40) + (tools_pct × 0.40) + (process_pct × 0.20)
operate_exposure_pct_raw = 100 - operational_health_pct
```

### 5.4 Persistence Penalty — Trend Early Warning (from old spec, retained)

Stops oscillation between green and red when deterioration is persistent:

```
Maintain on EntityRisk (shifted each ETL cycle):
  prev2_operational_health_pct   ← previous cycle's prev_operational_health_pct
  prev_operational_health_pct    ← previous cycle's operational_health_pct

If BOTH:
  prev2 > prev > current   (two consecutive drops — a PATTERN, not a counter)
  AND operate_exposure_pct_raw is still Green
Then:
  operate_trend_flag = true
  operate_exposure_pct_effective = amber_floor   (forced to amber for attention)
Else:
  operate_trend_flag = false
  operate_exposure_pct_effective = operate_exposure_pct_raw
```

> ⚠️ v3.1: This is a TWO-CONSECUTIVE-DROPS pattern check, NOT a per-cycle counter multiplied by 0.1. The ETL must store three values (prev2, prev, current) and shift them each cycle. There is no `consecutive_declining_cycles` counter.

### 5.5 Exposure Display (⚠️ CORRECTED from old spec)

> ⚠️ Old spec used discrete bands (Green <35, Amber 35-65, Red >65). **User corrected: continuous gradient heatmap based on dependency count.**

**NOT discrete bands.** It's a smooth gradient:

| Scale Point | Color | Basis |
|-------------|-------|-------|
| Minimum (1 dependency) | Green | Least exposed |
| Midpoint | Yellow | Moderate exposure |
| Maximum | Red | Most exposed node cross-cutting in ENTIRE dataset |

The maximum is the highest `dependency_count` on ANY single node (L3 or L2) across ALL sectors — not per-sector.

**Ripple effect:** The old `operate_band` (Green/Amber/Red) derived from `operate_exposure_pct` is still computed and stored on EntityRisk for analytical purposes. But the FRONTEND overlay uses `dependency_count` with the continuous gradient instead.

### 5.5a Dependency Count Definition (⚠️ NEW in v3.1)

> ⚠️ v3.1: Dependency count = **all incoming + outgoing relationships on a capability, EXCLUDING structural relationships**.

**Excluded structural relationships:**
- `MONITORED_BY` (Cap↔Risk — administrative linkage, not a business dependency)
- Parent/child hierarchy links (implicit via `parent_id`, not a relationship type)

**Included:** Every other relationship the capability participates in (both directions). These represent real business dependencies — policy tools setting priorities, performance targets, gap projects, process links, etc.

**Scope:**
- Counted per **year/quarter** — only relationships on nodes matching the same year/quarter
- **L3:** Direct count on the L3 node
- **L2:** SUM of `dependency_count` across all its L3 children (same year/quarter)
- **L1:** SUM of `dependency_count` across all its L2 children (same year/quarter)

**Verified L3 distribution (all time, current data):**
- Total L3 nodes: 285
- Min: 9, Max: 515, Median: 11, Avg: 20, P90: 30
- Buckets: 140 (1-10), 119 (11-30), 17 (31-60), 4 (61-100), 5 (100+)

### 5.5b Cumulative Caps and Dependency Counting

Capabilities are **cumulative** — once a cap appears in a quarter, it persists into subsequent quarters even without updates. The frontend handles this:

```
Frontend logic (enterpriseService.ts, line 154):
  "2026 Q3" = ALL of 2025 + 2026 Q1 + Q2 + Q3
  - All years before filter year → included
  - Same year → quarters up to and including filter quarter
  - Future years → excluded
  - Dedup by business ID → keep most recent year/quarter within window
```

The ETL computes `dependency_count` per the node's own year/quarter. The frontend's cumulative dedup ensures only the most recent version of each cap is displayed.

### 5.6 Where Exposure Is Calculated

**Backend ETL — NOT frontend.**

The ETL:
1. Counts dependencies for each capability
2. Writes `dependency_count` to the node
3. Frontend reads the pre-computed value and applies the gradient color

The frontend NEVER computes `dependency_count` from component fields. Field names like `linkedProjects`, `operatingEntities`, `processMetrics` are INVENTED and do not exist in Neo4j.

### 5.7 Only ONE Overlay

The exposure gradient heatmap is the ONLY active overlay. All others (external-pressure, footprint-stress, change-saturation, trend-warning) are **PAUSED**.

---

## 6. Priority & Display Rules

### 6.1 Red vs Priority — Two Different Concepts

- **Red** = a problem EXISTS (KPI miss, project delay). This is a status.
- **Priority** = how many other items DEPEND on this capability (upstream/downstream count). This is structural importance.

A green capability with 50 dependents is higher PRIORITY than a red capability with 1 dependent — but the red one needs immediate ACTION.

### 6.2 Attention Priority Order

| Priority | Condition | Action |
|----------|-----------|--------|
| 1 (Highest) | Red strip | Confirmed failure — address immediately |
| 2 | Amber strip | Warning — monitor closely |
| 3 | Green strip + red overlay | Delivering now but might regress — investigate exposure |
| 4 (Lowest) | Green strip + green/no overlay | All clear |

### 6.3 Strip Is a Stored Value

The strip color is NOT computed on the frontend. It reads a pre-computed status field from the node (written by ETL): `build_status` in BUILD mode, `execute_status` in OPERATE mode.

### 6.4 Overlay Only in OPERATE

BUILD mode has NO overlay. There is no regression concept when you're still building — you haven't reached operational status yet, so there's nothing to regress from.

---

## 7. Rollup Rules (L3 → L2 → L1)

### 7.1 Mode Rollup (⚠️ CORRECTED from old spec)

> ⚠️ Old spec didn't specify mode rollup. **User specified: MIN (most advanced) of children.**

If even ONE L3 child is operational (OPERATE mode) → L2 is in OPERATE mode.

This means an L2 can show BOTH operational and build children simultaneously (see Section 8).

### 7.2 Status (Strip) Rollup

Worst-case of all children:
- If any child is red → parent is red
- If any child is amber and none red → parent is amber
- If all children are green → parent is green

> ⚠️ Old spec used `max(child_exposure)` with optional breadth factor. **User simplified to worst-case status.**

### 7.3 Exposure (Overlay) Rollup (⚠️ CORRECTED from old spec)

> ⚠️ Old spec used `max(child_exposure)` with breadth factor. **User specified: SUM of dependencies.**

- L3 exposure = its own `dependency_count`
- L2 exposure = **sum** of `dependency_count` across ALL its L3 children
- Displayed on the same continuous gradient (same scale, same global max)

---

## 8. L2 Panel — Two Blocks

### 8.1 Layout

When clicking an L2 capability, the detail panel shows TWO distinct blocks:

1. **"Capabilities in Operation"** — shown FIRST
2. **"Capabilities Being Built"** — shown SECOND

The "Being Built" block disappears when all L3 children become operational.

### 8.2 Operational L3 Cards

Each card shows:
- ID, name
- KPI achievement %
- Status dot (execute_status colors)
- Actual names of People (org units), Process (documented processes), IT/Tools (systems/vendors) linked to the capability — NOT generic labels

### 8.3 Build L3 Cards

Each card shows:
- ID, name
- Stage Gate progress: current stage vs target PER DIMENSION (e.g., "Organization: S2 → S3")
- Status dot (build_status colors)
- Project deliverables grouped by the 3 dimensions (People/Process/Tools), with status and whether they're late

**NOT:** Absolute values like "People 2.5/5". MUST use Stage Gate progression.

---

## 9. Data Architecture

### 9.1 Storage Split

| System | Role |
|--------|------|
| **Neo4j** | Live data store — all entities, sectors, capabilities, risks, KPIs, projects |
| **Supabase** | System settings ONLY — auth, configs, instruction_elements |

The risk/status calculations originally lived as auto-calculated columns on Supabase tables. When data moved to Neo4j, those auto-calcs were lost (Neo4j has no triggers or generated columns). Solution: ETL script computes values and writes them as node properties.

### 9.2 Read/Write Separation — CORE PRINCIPLE

| Component | Can Read | Can Write | Purpose |
|-----------|----------|-----------|---------|
| Frontend | Yes | **NEVER** | Display only |
| Graph-server (port 3001) | Yes | **NEVER** | 3D graph rendering ONLY |
| MCP read | Yes | No | Read-only Neo4j access for queries |
| MCP write (port 8080) | Yes | **Yes** | Centralized write — prevents anti-ontology inputs |
| ETL scripts | Yes | Via MCP write | Compute and store calculated values |

**Why centralized write?** Data comes from many external systems. Centralizing writes through a single validated path maintains ontology integrity — no rogue writes that break the schema.

### 9.3 Risk Agent ≠ ETL

The Risk Agent (Left Brain = Engine, Right Brain = Auditor) is NOT the same as the ETL. The Risk Agent has a broader role:
- **Left Brain** (Engine): Deterministic scorer — applies formulas, writes scores, manages graph associations
- **Right Brain** (Auditor): LLM-based — spot checks calculations, validates trends, produces audit reports

The ETL computation of status fields (`build_status`, `execute_status`, `dependency_count` on capability nodes) is a SEPARATE concern. Currently both use `run_risk_agent.py`.

### 9.4 Data Sources for Enterprise Desk

| Source | What It Provides |
|--------|-----------------|
| `sector_value_chain` | Physical capabilities (L1s with assets) |
| `build_oversight` | Capabilities being built + linked projects |
| `operate_oversight` | Operational capabilities + KPIs |
| Direct Cypher | Policy tools |

All data can be retrieved for all years; rendering is filtered per year and quarter.

### 9.5 Current State

ALL risk values in Neo4j are **random placeholders** generated by `run_risk_agent.py` with `random.seed(cap_id)`. They mean nothing. The ETL must be rewritten with the formulas in this document.

---

## 10. Computed Fields — What Gets Written Where

### 10.1 On EntityRisk (risk analytics)

| Field | Source | Formula |
|-------|--------|---------|
| `likelihood_of_delay` | BUILD | avg(component_risks) |
| `delay_days` | BUILD | max(component_delays) — critical path |
| `expected_delay_days` | BUILD | likelihood × delay_days |
| `build_exposure_pct` | BUILD | clamp(expected_delay / red_delay × 100) |
| `build_band` | BUILD | Derived from build_exposure_pct thresholds |
| `operational_health_pct` | OPERATE | Weighted avg of dimension health (40/40/20) |
| `operate_exposure_pct_raw` | OPERATE | 100 - operational_health_pct |
| `operate_exposure_pct_effective` | OPERATE | Raw + trend penalty if applicable |
| `operate_band` | OPERATE | Derived from effective exposure |
| `operate_trend_flag` | OPERATE | true if 2+ consecutive health drops |
| `people_score`, `process_score`, `tools_score` | OPERATE | Component health scores (1-5) |
| `*_persistence` (per component) | BUILD | 0-3 recurrence counter |
| `prev_operational_health_pct` | OPERATE | Previous cycle's health (for trend) |
| `prev2_operational_health_pct` | OPERATE | Two cycles ago health (for two-consecutive-drops check) |

### 10.2 On EntityCapability (frontend reads these)

| Field | Mode | Source | Formula |
|-------|------|--------|---------|
| `build_status` | BUILD | Project delay analysis | not-due / planned / in-progress-ontrack / atrisk / issues |
| `execute_status` | OPERATE | KPI achievement | ontrack (≥90%) / at-risk (70-90%) / issues (<70%) |
| `kpi_achievement_pct` | OPERATE | SectorPerformance actual/target | (actual / target) × 100 |
| `dependency_count` | OPERATE | ETL counts dependencies | Integer — for exposure gradient |

### 10.3 Computation Order (Single ETL Run)

```
1. Gather inputs:
   - BUILD: EntityProject delays, persistence history
   - OPERATE: SectorPerformance actuals/targets, CultureHealth scores, Vendor SLAs

2. Compute EntityRisk fields:
   - BUILD: component risks → likelihood → expected delay → exposure → band
   - OPERATE: health scores → exposure → trend check → effective exposure → band

3. Derive EntityCapability status fields:
   - BUILD: build_status from project delta (5/15 thresholds)
   - OPERATE: execute_status from KPI achievement (90/70 thresholds)
   - OPERATE: dependency_count for overlay gradient

4. Write both EntityRisk and EntityCapability in same run

5. Manage INFORMS relationships:
   - BUILD: Risk -[:INFORMS]-> SectorPolicyTool if build_exposure_pct >= 50%
   - OPERATE: Risk -[:INFORMS]-> SectorPerformance if operate_exposure_pct_effective >= 50%
   - Note: AFFECTS_POLICY_TOOL and AFFECTS_PERFORMANCE are PROPERTIES on EntityRisk, not relationship types
```

> ⚠️ v3.1: `affecting_policy_tools_or_performance` is a property on EntityRisk (391 nodes have it). The actual relationship type for linking Risk to targets is `INFORMS` (691 exist). INFORMS targets are found via the chain: `SectorPolicyTool -[:SETS_PRIORITIES]-> Cap` (for BUILD) and `SectorPerformance -[:SETS_TARGETS]-> Cap` (for OPERATE) — reversed to find which targets care about this cap's risk.

### 10.4 ETL Schedule

Runs **daily** (nightly). Followed by Right Brain audit (spot check, sanity, trend analysis).

---

## 11. Known Frontend Bugs (from commit 3faf58d)

| # | Bug | Impact | Fix |
|---|-----|--------|-----|
| 1 | `dependency_count` computed in frontend with invented fields (`linkedProjects`, `operatingEntities`, `processMetrics`) | Wrong overlay values | Read `dependency_count` from node (ETL writes it) |
| 2 | 5 overlay types active in `enterpriseOverlayUtils.ts` | UI confusion | Keep only exposure gradient, pause rest |
| 3 | Wrong labels: "Under Construction" / "Operational Capabilities" | Terminology mismatch | "Capabilities Being Built" / "Capabilities in Operation" (operate first) |
| 4 | Three Pillars showing absolute values (2.5/5) | Contradicts Stage Gate model | Show S1-S5 stage progression per dimension |
| 5 | Gauge shows in BUILD mode | No gauge should exist in BUILD | Remove gauge for BUILD capabilities |
| 6 | Gauge contradicts strip in OPERATE mode | Different data sources | Both should use KPI achievement |
| 7 | KPI metrics show wrong data in panel | Raw values don't match strip | Align with 90/70 thresholds |
| 8 | Build projects section always empty | `build_oversight` chain too shallow | Fix chain query depth to reach EntityProject |
| 9 | Stage Gate model missing from build section | S1-S5 and 3 dimensions absent | Add Stage Gate UI to build panel |

---

## 12. Neo4j Verification Results (⚠️ UPDATED in v3.1)

> All items below were verified against the live Neo4j database on 2026-02-25.

| Item | Result | Count |
|------|--------|-------|
| `EntityCapability -[:DELIVERS]-> SectorPerformance` | **DOES NOT EXIST** | 0 |
| `EntityProcess -[:FEEDS_INTO]-> SectorPerformance` | **EXISTS but SUSPECT** — may be AI-contaminated, mixes BUILD/OPERATE concepts | Exists |
| `EntityCapability -[:MONITORED_BY]-> EntityRisk` | **EXISTS — this is the correct link** (not HAS_RISK) | 484 |
| `EntityRisk -[:MONITORED_BY]-> EntityCapability` | Reverse direction also exists | 1,810 |
| `EntityRisk -[:INFORMS]-> SectorPerformance` | **EXISTS** | 328 |
| `EntityRisk -[:INFORMS]-> SectorPolicyTool` | **EXISTS** | 363 |
| `EntityCapability -[:CLOSE_GAPS]-> EntityProject` | **EXISTS** | 2,380 |
| CultureHealth nodes | **EXIST** | 436 |
| Vendor nodes | **EXIST** | 29 |
| EntityProject nodes | **EXIST** | 284 |
| SectorPerformance nodes | **EXIST** | 233 |
| EntityProject field names | `progress_percentage` (NOT `actual_progress_pct`/`planned_progress_pct`) | Verified |
| SectorPerformance field names | `actual` and `target` (NOT `actual_value`) | Verified |
| `affecting_policy_tools_or_performance` | Property on EntityRisk, NOT a relationship type | 391 nodes |
| `HAS_RISK` relationship | **DOES NOT EXIST** | 0 |

### 12.1 KPI Path — Confirmed Chain

```
EntityCapability -[:MONITORED_BY]-> EntityRisk -[:INFORMS]-> SectorPerformance
```

This is the ONLY valid path from Cap to KPI data. Direct paths (DELIVERS, REPORTS) either don't exist or are legacy artifacts being deleted.

### 12.2 Relationship Cleanup Required (One-Time)

Legacy direct relationships that bypass the Risk chain must be deleted:

| Action | Relationship | Direction | Count | Why |
|--------|-------------|-----------|-------|-----|
| **DELETE** | `REPORTS` | `Cap → SectorPerformance` | 225 | Old direct link, replaced by Cap→Risk→INFORMS→Perf |
| **DELETE** | `EXECUTES` | `Cap → SectorPolicyTool` | 75 | Old direct link, replaced by Cap→Risk→INFORMS→PolicyTool |
| **KEEP** | `SETS_TARGETS` | `SectorPerformance → Cap` | 617 | Reverse direction — Perf setting targets FOR cap |
| **KEEP** | `SETS_PRIORITIES` | `SectorPolicyTool → Cap` | 541 | Reverse direction — PolicyTool setting priorities FOR cap |

> **Direction matters.** Cap→Perf means "cap reports to perf" (old, wrong). Perf→Cap means "perf sets targets for cap" (correct, keep).

> **Warning:** The Enterprise Ontology SST v1.2 doc may contain relationship types added by a previous AI session. Do NOT trust it as ground truth — verify against the actual database.

---

## 13. Reference

### Colors

| Purpose | Hex | CSS Variable |
|---------|-----|-------------|
| Green (ontrack) | `#10b981` | `--status-existing` |
| Amber (at-risk) | `#f59e0b` | `--status-construction` |
| Red (issues) | `#ef4444` | — |
| Gray (not-due) | `#475569` | — |

### Key Files

| File | Purpose |
|------|---------|
| `josoorfe/frontend/src/services/enterpriseService.ts` | Cumulative filter + risk matching + hierarchy builder |
| `josoorfe/frontend/src/types/enterprise.ts` | TypeScript type definitions |
| `josoorfe/frontend/src/utils/enterpriseStatusUtils.ts` | Strip color logic |
| `josoorfe/frontend/src/utils/enterpriseOverlayUtils.ts` | Overlay color logic (NEEDS FIX) |
| `josoorfe/frontend/src/components/desks/enterprise/CapabilityDetailPanel.tsx` | L2 panel |
| `josoorbe/backend/scripts/risk_engine.py` | ETL script (BEING REWRITTEN per this doc) |
| `docs/RISK_LOGIC_SPEC.md` | Original formula spec |
| `docs/RISK_AUDIT_SOP.md` | Audit procedures |
| `docs/RISK_AGENT_WORKFLOW.md` | Left Brain / Right Brain architecture |

### ScoreConfig (from ontology)

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `red_delay_days` | Configurable (integer > 0) | BUILD normalization tolerance |
| `link_threshold_pct` | 50 | Minimum exposure to create AFFECTS link |

---

*End of document. Version 3.0 — proper design merging framework specs with user corrections. Every correction is marked with ⚠️ and ripple effects are traced.*
