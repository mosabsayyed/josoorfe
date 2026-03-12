# Living Ontology Dashboard — Design Doc

**Date:** 2026-03-03
**Status:** APPROVED
**Author:** Claude (brainstorming session with user)
**Component:** OntologyHome.tsx + OntologyHome.css
**Branch:** feat/frontend-landing-founder-letter

---

## 1. Core Principle

The ontology diagram IS the dashboard. Every visual element carries a signal:
- **Color = priority** (impact-weighted, not count-based)
- **Motion = health** (animated lines = alive, still lines = broken)
- **Thickness = importance** (more upstream dependencies = thicker line)

Three layers work together:
1. **Headers** (top) — column labels (already built)
2. **KPI Signal Strip** (middle) — aggregate summary per column
3. **Network** (bottom) — ontology nodes + animated relationship lines

---

## 2. Node RAG Coloring

### Color Rule

A node's color is determined by its **highest-impact red child**, not by count of reds.

```
node_color =
  if ANY child is red AND impact_score(child) > threshold → RED
  if ANY child is red AND impact_score(child) ≤ threshold → AMBER
  if reds exist but all recovering (projects on track)    → AMBER fading to GREEN
  if no reds                                              → GREEN
```

### Impact Score Definition

**Impact = upstream fan-out count.** Traverse from the node upward through ontology relationships. Count how many KPIs, policy tools, and objectives would be affected if this node fails.

- A capability feeding 5 KPIs → 3 objectives = HIGH impact
- A capability feeding 1 KPI → 1 objective = LOW impact
- Even 1 red with high impact makes the aggregate node RED
- Even 100 reds with low impact + being fixed = AMBER (not RED)

### Visual Treatment by Node Type

| Node Type | RAG Application |
|-----------|----------------|
| Building-top nodes (Objectives, PolicyTools, Performance, Capabilities, Projects) | White/light cap piece on top tints to R/A/G |
| Gold platform nodes (sub-sectors, OrgUnits, Processes, IT Systems) | Building itself shifts from gold to R/A/G |
| Small coin nodes (CultureHealth, Vendors, RiskPlans, ChangeAdoption) | Coin tints to R/A/G |

Implementation: CSS `filter: hue-rotate() saturate()` to shift gold → green/amber/red without replacing images.

---

## 3. Animated Relationship Lines

SVG `<path>` elements between nodes, positioned from Figma coordinates.

### Line Styles

| Status | Stroke Color | Dash Pattern | Animation | Speed | Meaning |
|--------|-------------|-------------|-----------|-------|---------|
| Green | `var(--component-color-success)` | `8 4` (dotted) | `stroke-dashoffset` cycle | 1s | Healthy — data flowing |
| Amber | `var(--component-color-warning)` | `8 4` (dotted) | `stroke-dashoffset` cycle | 3s | Degrading — still working but issues |
| Red | `var(--component-color-danger)` | None (solid) | **None** | — | Broken — severe issues, flow stopped |

### Visual Principle

**Motion = life. Stillness = death.**

The eye catches still red lines against moving green ones. This naturally draws attention to problems without any numbers.

### Line Thickness

Based on upstream fan-out (impact weight) of the relationship path. A line feeding 40 downstream nodes is thicker than one feeding 3.

Range: 1.5px (low impact) → 4px (high impact).

### Line Color Derivation

The line takes the color of the **worst-impact status** along that path. If the path from PolicyTools → Capabilities contains a high-impact red capability, the entire line goes red + solid.

### Arrow Direction

Matches ontology flow direction (already defined in `relationLines` array in OntologyHome.tsx).

---

## 4. Missing Nodes (from updated Figma 453:974)

Nodes to add to OntologyHome.tsx:

| Node | Type | Column | Position (from Figma) |
|------|------|--------|----------------------|
| Admin Records | SectorAdminRecord | Sector | Between PolicyTools and stakeholders |
| Data TXN | SectorDataTransaction | Sector | Below sub-sectors, above Performance |
| Gov Entity | SectorGovEntity | Sector | Stakeholder label, left group |
| Business | SectorBusiness | Sector | Stakeholder label, center group |
| Citizen | SectorCitizen | Sector | Stakeholder label, right group |

### Updated Header Labels

| Column | Old Label | New Label |
|--------|-----------|-----------|
| 1 | Goals | Goals |
| 2 | Sector Outputs | Sector Outputs |
| 3 | Health | Health |
| 4 | Health | **Capacity** |
| 5 | Velocity | Velocity |

---

## 5. KPI Signal Strip

Sits between headers (y≈399) and network body (y≈814). One cell per column.

### Per Cell Contents

1. **RAG micro-bar** — proportional width showing green/amber/red ratio of children in that column
2. **Priority count** — number of high-impact reds (red + high upstream fan-out)
3. **Label** — contextual per column

### Strip Content per Column

| Column | What it aggregates | "Priority red" means |
|--------|-------------------|---------------------|
| Goals | SectorObjective achievement | Objective where underlying KPIs are red AND high fan-out |
| Sector Chains | SectorPerformance KPIs + SectorPolicyTool status | KPI red with high dependency chain |
| Health | EntityRisk status | Risk red + high-impact capability affected |
| Capacity | EntityCapability BUILD/OPERATE status | Capability red (late BUILD or regressing OPERATE) + high fan-out |
| Velocity | EntityProject delivery status | Project delayed + blocking a high-impact capability |

### Visual

```
┌─────────┬──────────────┬─────────┬────────────────┬───────────┐
│ Goals   │ Sector       │ Health  │ Capacity       │ Velocity  │
│ ██████░ │ ████░░░░     │ ██░░░░░ │ ████░░░░       │ ██████░░  │
│ clear   │ 4 priority   │ 8 high  │ 2 critical     │ 3 blocked │
└─────────┴──────────────┴─────────┴────────────────┴───────────┘
```

---

## 6. Click Interaction

Click any node → side panel opens with detail card.

- **BUILD mode**: Timeline, project progress, delay risk, gap closure status
- **OPERATE mode**: KPI health, three pillars (People/Process/Tools), regression indicators

Reuses existing `CapabilityDetailPanel` from Enterprise Desk (already built).

---

## 7. Data Flow

```
Neo4j (ETL writes status to nodes)
  → REST API: GET /api/v1/chains/{chain_name}
    → OntologyHome fetches on mount (build_oversight, operate_oversight, sector_value_chain)
      → Compute impact_score per node (count upstream fan-out from chain results)
      → Derive node colors (highest-impact red child rule)
      → Derive line colors + animation states
      → Derive strip aggregates (count priority reds per column)
      → Render SVG lines + tinted nodes + strip
```

### Data Sources (all exist today)

| Data | Source | Field |
|------|--------|-------|
| Capability status | EntityCapability | `build_status`, `execute_status` |
| Risk bands | EntityRisk | `build_band`, `operate_band` |
| KPI achievement | SectorPerformance | `actual_value`, `target` |
| Dependency count | EntityCapability | `dependency_count` |
| Project progress | EntityProject | `actual_progress_pct`, `planned_progress_pct` |
| Relationship paths | Chain API results | Traversal data |

No new backend work needed.

---

## 8. Implementation Phases

### Phase 1: SVG Lines + Missing Nodes
- Add missing nodes from Figma (AdminRecords, DataTXN, GovEntity, Business, Citizen)
- Draw SVG relationship lines between all nodes
- Update header labels (Capacity)
- Static lines first (no animation, no RAG)

### Phase 2: RAG Coloring + Animation
- Fetch chain data on mount
- Compute impact scores from chain traversal
- Apply node color tinting (CSS filter)
- Apply line RAG styles (green dotted fast, amber dotted slow, red solid still)
- Line thickness from impact weight

### Phase 3: KPI Signal Strip
- Aggregate node statuses per column
- Count priority reds per column
- Render strip with RAG micro-bars + counts

### Phase 4: Click → Side Panel
- Click handler on nodes
- Open side panel with BUILD/OPERATE detail
- Reuse CapabilityDetailPanel

---

## 9. Out of Scope

- No specific node names in the strip (no "Water" or "Capability 1.1")
- No drill-down tables in the strip
- No tooltips on lines
- No 3D or physics — pure SVG on Figma coordinates
- No new backend endpoints
- No mock data

---

## 10. Key Design Decisions

1. **RED = impact, not count.** 1 high-impact red > 100 low-impact reds.
2. **Impact = upstream fan-out.** How many things break if this fails.
3. **Motion = life.** Green animated, amber slow, red still. Eye catches stillness.
4. **Lines ARE the dashboard.** They show flow health at a glance.
5. **Strip is drill-down level 1.** Network draws your eye → strip gives the number → click gives the detail.
6. **Building the engine while racing it.** BUILD + OPERATE coexist. The network shows both simultaneously.
