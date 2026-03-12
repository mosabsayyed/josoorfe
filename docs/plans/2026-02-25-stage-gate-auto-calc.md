# Stage-Gate Auto-Calculated Status Fields

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace broken Enterprise Desk status colors with auto-calculated fields stored on Neo4j nodes — computed at write-time from real KPI, project, and survey data.

**Architecture:** Graph-server gets new "recompute" endpoints that read input data from Neo4j (KPI actuals, project dates, survey scores, vendor SLAs), apply threshold formulas, and write derived status fields back to EntityCapability/EntityRisk nodes. Frontend reads these pre-computed fields directly — no client-side calculation needed.

**Tech Stack:** Neo4j Cypher (graph-server Express routes), React TypeScript frontend (read-only changes)

---

## Background

### Current State (BROKEN)
- Enterprise Desk strip colors come from `risk.build_band` / `risk.operate_band` — written by a Risk Agent ETL that never ran with real data
- All risk values are identical placeholders (people=2.5, process=2.0, tools=1.5)
- KPI gauge uses different data source (SectorPerformance actual/target) — so strip and gauge disagree
- Projects section is almost always empty

### Target State
- **Strip color** = pre-computed `execute_status` or `build_status` on the capability node
- **execute_status** derived from KPI achievement: `(actual / target) * 100` → ontrack/at-risk/issues
- **build_status** derived from project delays: schedule variance → ontrack/atrisk/issues
- **Overlay** = separate `regression_risk_pct` from survey + vendor SLA data
- All values **stored on nodes**, recomputed whenever input data changes

### Two-Layer OPERATE Model
- **Layer 1 (Strip)**: KPI performance — confirmed failure, 100% probability
  - ontrack ≥ 90%, at-risk 70-90%, issues < 70%
- **Layer 2 (Overlay)**: Regression risk — survey + SLA foresight signals
  - People (CultureHealth survey) 40% weight
  - Tools (Vendor SLA) 40% weight
  - Process (stable once documented) 20% weight
- Priority: Red strip ALWAYS > green strip + red overlay

### Stage Gate Model
- 5 stages: S1→S5 (Determined → Planned → Activated → Matured → Mastered)
- 3 dimensions: Organization, Data/Systems, Processes
- Capability level = LOWEST of 3 dimensions
- BUILD (S1-S2) = delay risk | OPERATE (S3+) = regression risk

---

## Task 1: Neo4j Recompute Endpoint — EXECUTE Status

**Goal:** Create graph-server endpoint that reads KPI data and writes `execute_status` + `kpi_achievement_pct` to capability nodes.

**Files:**
- Create: `backend route handler` — new POST endpoint in graph-server
- The graph-server lives at `/home/mosab/projects/chatmodule/graph-server/routes.ts`
- Frontend proxy already forwards `/api/neo4j/*` to graph-server port 3001

**Step 1: Add the recompute endpoint to graph-server routes**

Add to `routes.ts`:

```typescript
// POST /api/neo4j/recompute/execute-status
// Reads SectorPerformance KPI data linked to capabilities via SETS_TARGETS
// Computes kpi_achievement_pct and execute_status, stores on capability node
router.post('/api/neo4j/recompute/execute-status', async (req, res) => {
  const { year, quarter } = req.body;

  const query = `
    // Find all EXECUTE-mode capabilities with KPI targets
    MATCH (cap:EntityCapability {year: $year})
    WHERE cap.status = 'active'  // active = OPERATE/EXECUTE mode

    // Get linked SectorPerformance via SETS_TARGETS
    OPTIONAL MATCH (perf:SectorPerformance)-[:SETS_TARGETS]->(cap)
    WHERE perf.year = $year

    WITH cap,
         CASE WHEN perf.target IS NOT NULL AND perf.target > 0
              THEN (toFloat(perf.actual_value) / toFloat(perf.target)) * 100.0
              ELSE null END AS achievement_pct

    // Write computed fields back
    SET cap.kpi_achievement_pct = COALESCE(achievement_pct, null),
        cap.execute_status = CASE
          WHEN achievement_pct IS NULL THEN null
          WHEN achievement_pct >= 90 THEN 'ontrack'
          WHEN achievement_pct >= 70 THEN 'at-risk'
          ELSE 'issues'
        END,
        cap.status_computed_at = datetime()

    RETURN cap.id AS id, cap.name AS name,
           cap.kpi_achievement_pct AS pct,
           cap.execute_status AS status
  `;

  try {
    const result = await session.run(query, { year: neo4j.int(year), quarter });
    const updated = result.records.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      pct: r.get('pct'),
      status: r.get('status')
    }));
    res.json({ updated, count: updated.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Step 2: Test the endpoint**

```bash
curl -X POST http://localhost:3001/api/neo4j/recompute/execute-status \
  -H "Content-Type: application/json" \
  -d '{"year": 2026, "quarter": "Q1"}'
```

Expected: JSON with list of updated capabilities and their new `execute_status` values.

**Step 3: Verify in Neo4j**

```cypher
MATCH (cap:EntityCapability {year: 2026})
WHERE cap.execute_status IS NOT NULL
RETURN cap.id, cap.name, cap.kpi_achievement_pct, cap.execute_status
LIMIT 10
```

**Step 4: Commit**

```bash
git add graph-server/routes.ts
git commit -m "feat: add execute-status recompute endpoint (KPI → status)"
```

---

## Task 2: Neo4j Recompute Endpoint — BUILD Status

**Goal:** Create endpoint that reads EntityProject data and writes `build_status` to capability nodes.

**Files:**
- Modify: graph-server `routes.ts`

**Step 1: Add the build-status recompute endpoint**

```typescript
// POST /api/neo4j/recompute/build-status
// Reads EntityProject dates linked to capabilities
// Computes schedule variance and build_status
router.post('/api/neo4j/recompute/build-status', async (req, res) => {
  const { year, quarter } = req.body;

  const query = `
    // Find BUILD-mode capabilities (not active = still being built)
    MATCH (cap:EntityCapability {year: $year})
    WHERE cap.status <> 'active'

    // Get linked projects via CLOSE_GAPS chain
    OPTIONAL MATCH (proj:EntityProject)-[:CLOSE_GAPS]->(gap)-[:AFFECTS]->(cap)
    WHERE proj.year = $year

    WITH cap, proj,
         // Schedule variance: positive = late, negative = ahead
         CASE WHEN proj.end_date IS NOT NULL AND proj.start_date IS NOT NULL
              THEN duration.between(date(), date(proj.end_date)).days
              ELSE null END AS days_remaining,
         CASE WHEN proj.end_date IS NOT NULL
              THEN duration.between(date(proj.start_date), date(proj.end_date)).days
              ELSE null END AS total_duration

    WITH cap, proj, days_remaining, total_duration,
         CASE
           WHEN proj IS NULL THEN 'not-due'
           WHEN proj.status = 'planned' THEN 'planned'
           WHEN days_remaining IS NULL THEN 'planned'
           // % complete by time
           WHEN total_duration > 0
             THEN toFloat(total_duration - days_remaining) / toFloat(total_duration) * 100.0
           ELSE 0.0
         END AS time_progress_pct

    SET cap.build_status = CASE
          WHEN proj IS NULL THEN 'not-due'
          WHEN proj.status = 'planned' THEN 'planned'
          WHEN time_progress_pct >= 0 AND days_remaining >= 0 THEN 'in-progress-ontrack'
          WHEN days_remaining < 0 AND days_remaining >= -30 THEN 'in-progress-atrisk'
          WHEN days_remaining < -30 THEN 'in-progress-issues'
          ELSE 'planned'
        END,
        cap.build_delay_days = CASE
          WHEN days_remaining IS NOT NULL AND days_remaining < 0
          THEN abs(days_remaining) ELSE 0 END,
        cap.status_computed_at = datetime()

    RETURN cap.id AS id, cap.name AS name,
           cap.build_status AS status, cap.build_delay_days AS delay
  `;

  try {
    const result = await session.run(query, { year: neo4j.int(year), quarter });
    const updated = result.records.map(r => ({
      id: r.get('id'), name: r.get('name'),
      status: r.get('status'), delay: r.get('delay')
    }));
    res.json({ updated, count: updated.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Step 2: Test**

```bash
curl -X POST http://localhost:3001/api/neo4j/recompute/build-status \
  -H "Content-Type: application/json" \
  -d '{"year": 2026, "quarter": "Q1"}'
```

**Step 3: Commit**

```bash
git add graph-server/routes.ts
git commit -m "feat: add build-status recompute endpoint (project delays → status)"
```

---

## Task 3: Neo4j Recompute Endpoint — Regression Risk

**Goal:** Compute regression risk from CultureHealth survey + Vendor SLA, store as `regression_risk_pct` overlay field.

**Files:**
- Modify: graph-server `routes.ts`

**Step 1: Add regression-risk recompute endpoint**

```typescript
// POST /api/neo4j/recompute/regression-risk
// Reads CultureHealth survey + Vendor SLA for OPERATE capabilities
// Computes weighted regression_risk_pct (People 40%, Tools 40%, Process 20%)
router.post('/api/neo4j/recompute/regression-risk', async (req, res) => {
  const { year, quarter } = req.body;

  const query = `
    MATCH (cap:EntityCapability {year: $year})
    WHERE cap.status = 'active'

    // Get risk node
    OPTIONAL MATCH (cap)-[:MONITORED_BY]->(risk:EntityRisk {year: $year})

    // Get culture health (People dimension)
    OPTIONAL MATCH (cap)<-[:SUPPORTS]-(ou:OrgUnit {year: $year})
    OPTIONAL MATCH (ou)-[:HAS_SURVEY]->(ch:CultureHealth)

    // Get vendor SLA (Tools dimension)
    OPTIONAL MATCH (cap)<-[:ENABLES]-(it:EntityITSystem {year: $year})
    OPTIONAL MATCH (it)-[:SUPPLIED_BY]->(v:Vendor)

    WITH cap, risk,
         // People risk: survey below 4.0/5.0 = risk signal
         // Normalize to 0-100 risk scale (5.0 = 0% risk, 1.0 = 100% risk)
         CASE WHEN ch.survey_score IS NOT NULL
              THEN (1.0 - (toFloat(ch.survey_score) / 5.0)) * 100.0
              ELSE 50.0 END AS people_risk,

         // Tools risk: vendor rating below 4.0/5.0 = risk signal
         CASE WHEN v.performance_rating IS NOT NULL
              THEN (1.0 - (toFloat(v.performance_rating) / 5.0)) * 100.0
              ELSE 50.0 END AS tools_risk,

         // Process risk: low fixed value (stable once documented)
         20.0 AS process_risk

    WITH cap, risk,
         // Weighted: People 40%, Tools 40%, Process 20%
         (people_risk * 0.4 + tools_risk * 0.4 + process_risk * 0.2) AS regression_pct

    SET cap.regression_risk_pct = round(regression_pct * 10) / 10.0,
        cap.people_risk_pct = round(people_risk * 10) / 10.0,
        cap.tools_risk_pct = round(tools_risk * 10) / 10.0,
        cap.regression_computed_at = datetime()

    RETURN cap.id AS id, cap.name AS name,
           cap.regression_risk_pct AS regression
  `;

  try {
    const result = await session.run(query, { year: neo4j.int(year), quarter });
    const updated = result.records.map(r => ({
      id: r.get('id'), name: r.get('name'),
      regression: r.get('regression')
    }));
    res.json({ updated, count: updated.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Step 2: Test and commit**

```bash
curl -X POST http://localhost:3001/api/neo4j/recompute/regression-risk \
  -H "Content-Type: application/json" \
  -d '{"year": 2026, "quarter": "Q1"}'

git add graph-server/routes.ts
git commit -m "feat: add regression-risk recompute endpoint (survey+SLA → overlay)"
```

---

## Task 4: Master Recompute Endpoint

**Goal:** Single endpoint that calls all three recomputes in sequence. Used for initial seeding and periodic refresh.

**Files:**
- Modify: graph-server `routes.ts`

**Step 1: Add master recompute**

```typescript
// POST /api/neo4j/recompute/all
// Runs all three recomputes in sequence
router.post('/api/neo4j/recompute/all', async (req, res) => {
  const { year, quarter } = req.body;
  const results = {};

  try {
    // Run execute-status
    const execRes = await fetch(`http://localhost:3001/api/neo4j/recompute/execute-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, quarter })
    });
    results.execute = await execRes.json();

    // Run build-status
    const buildRes = await fetch(`http://localhost:3001/api/neo4j/recompute/build-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, quarter })
    });
    results.build = await buildRes.json();

    // Run regression-risk
    const regRes = await fetch(`http://localhost:3001/api/neo4j/recompute/regression-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, quarter })
    });
    results.regression = await regRes.json();

    res.json({
      execute_count: results.execute.count,
      build_count: results.build.count,
      regression_count: results.regression.count,
      computed_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Step 2: Test master recompute**

```bash
curl -X POST http://localhost:3001/api/neo4j/recompute/all \
  -H "Content-Type: application/json" \
  -d '{"year": 2026, "quarter": "Q1"}'
```

**Step 3: Commit**

```bash
git add graph-server/routes.ts
git commit -m "feat: add master recompute-all endpoint"
```

---

## Task 5: Frontend — Read Pre-Computed Status Fields

**Goal:** Change `enterpriseService.ts` to read `execute_status` and `build_status` directly from capability nodes instead of deriving from `risk.build_band`/`risk.operate_band`.

**Files:**
- Modify: `frontend/src/lib/services/enterpriseService.ts` (status derivation section, ~line 1157-1188)

**Step 1: Find the status derivation code**

Look for the section that maps `risk.build_band` → `build_status` and `risk.operate_band` → `execute_status`. This is approximately lines 1157-1188.

**Step 2: Replace band-based derivation with direct field read**

Change FROM:
```typescript
// Old: derive from risk band
if (l3.mode === 'build') {
  const band = risk?.build_band;
  l3.build_status = band === 'RED' ? 'in-progress-issues'
    : band === 'AMBER' ? 'in-progress-atrisk'
    : band === 'GREEN' ? 'in-progress-ontrack'
    : 'planned';
}
```

Change TO:
```typescript
// New: read pre-computed status directly from capability node
if (l3.mode === 'build') {
  l3.build_status = rawCap.build_status || 'not-due';
} else {
  l3.execute_status = rawCap.execute_status || null;
  l3.kpi_achievement_pct = rawCap.kpi_achievement_pct || null;
}
```

**Step 3: Read regression_risk_pct for overlay**

In the overlay enrichment section, change the exposure calculation for EXECUTE mode:

Change FROM:
```typescript
// Old: exposure from risk engine
l3.exposure_percent = 100 - (risk?.operational_health_pct || 50);
```

Change TO:
```typescript
// New: overlay uses regression risk (separate from strip)
l3.regression_risk_pct = rawCap.regression_risk_pct || null;
// For risk-exposure overlay, use regression risk (Layer 2)
if (overlayType === 'risk-exposure' && l3.mode === 'execute') {
  l3.exposure_percent = rawCap.regression_risk_pct || 0;
}
```

**Step 4: Commit**

```bash
git add frontend/src/lib/services/enterpriseService.ts
git commit -m "feat: read pre-computed status fields from Neo4j (not risk bands)"
```

---

## Task 6: Frontend — Update L3Capability Type

**Goal:** Add new pre-computed fields to the TypeScript interface.

**Files:**
- Modify: `frontend/src/types/enterprise.ts`

**Step 1: Add fields to L3Capability interface**

```typescript
// Add to L3Capability interface:
kpi_achievement_pct?: number;       // Pre-computed: (actual/target)*100
regression_risk_pct?: number;       // Pre-computed: weighted survey+SLA risk
people_risk_pct?: number;           // Component: people dimension risk
tools_risk_pct?: number;            // Component: tools dimension risk
build_delay_days?: number;          // Pre-computed: days past deadline
status_computed_at?: string;        // ISO timestamp of last computation
```

**Step 2: Commit**

```bash
git add frontend/src/types/enterprise.ts
git commit -m "feat: add pre-computed status fields to L3Capability type"
```

---

## Task 7: Frontend — Update Overlay Utils for Two-Layer Model

**Goal:** Update `enterpriseOverlayUtils.ts` so the risk-exposure overlay uses `regression_risk_pct` (Layer 2) instead of the old `exposure_percent` for EXECUTE mode.

**Files:**
- Modify: `frontend/src/utils/enterpriseOverlayUtils.ts`

**Step 1: Update calculateHeatmapColor for risk-exposure overlay**

In the `risk-exposure` case of `calculateHeatmapColor()`:

```typescript
case 'risk-exposure': {
  let value: number;
  if (l3.mode === 'execute') {
    // Layer 2: regression risk from survey + SLA
    value = l3.regression_risk_pct ?? 0;
  } else {
    // BUILD mode: delay-based exposure (unchanged)
    value = l3.exposure_percent ?? 0;
  }
  return getColorForValue(value); // uses 35/65 bands
}
```

**Step 2: Update getOverlayContent for risk-exposure**

```typescript
case 'risk-exposure': {
  if (l3.mode === 'execute') {
    const pct = l3.regression_risk_pct;
    if (pct == null) return null;
    return `${Math.round(pct)}%`;
  } else {
    // BUILD: show delay days
    const delay = l3.build_delay_days ?? l3.expected_delay_days;
    if (!delay) return null;
    return `+${delay}d`;
  }
}
```

**Step 3: Commit**

```bash
git add frontend/src/utils/enterpriseOverlayUtils.ts
git commit -m "feat: overlay uses regression risk for EXECUTE, delay for BUILD"
```

---

## Task 8: Verify End-to-End

**Goal:** Run recompute, refresh Enterprise Desk, verify colors match expectations.

**Step 1: Run master recompute**

```bash
curl -X POST http://localhost:3001/api/neo4j/recompute/all \
  -H "Content-Type: application/json" \
  -d '{"year": 2026, "quarter": "Q1"}'
```

**Step 2: Open browser → Enterprise Desk**

Check:
- Strip colors (3px left border) now reflect KPI performance (EXECUTE) or project status (BUILD)
- Gauge and strip should AGREE (both from KPI data for EXECUTE)
- Risk-exposure overlay shows regression risk % (different from strip)
- Capabilities with no KPI data show neutral/slate color
- BUILD capabilities show project-based status

**Step 3: Check Neo4j directly**

```cypher
// Verify EXECUTE capabilities have status
MATCH (cap:EntityCapability {year: 2026})
WHERE cap.execute_status IS NOT NULL
RETURN cap.id, cap.execute_status, cap.kpi_achievement_pct, cap.regression_risk_pct
ORDER BY cap.kpi_achievement_pct ASC
LIMIT 20

// Verify BUILD capabilities have status
MATCH (cap:EntityCapability {year: 2026})
WHERE cap.build_status IS NOT NULL AND cap.build_status <> 'not-due'
RETURN cap.id, cap.build_status, cap.build_delay_days
LIMIT 20
```

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: stage-gate auto-calc status fields — end-to-end"
```

---

## Task Dependency Graph

```
Task 1 (execute-status endpoint)  ──┐
Task 2 (build-status endpoint)    ──┼── Task 4 (master recompute)
Task 3 (regression-risk endpoint) ──┘         │
                                              │
Task 6 (TypeScript types)  ───────────────────┤
                                              │
Task 5 (service reads pre-computed) ──────────┤
Task 7 (overlay utils update) ────────────────┤
                                              │
                                        Task 8 (verify E2E)
```

**Parallelizable:**
- Tasks 1, 2, 3 can run in parallel (independent endpoints)
- Task 6 can run in parallel with Tasks 1-3 (frontend type, no backend dependency)
- Tasks 5 and 7 depend on Task 6 (type changes) but can run in parallel with each other
- Task 4 depends on Tasks 1-3
- Task 8 depends on ALL previous tasks

---

## Notes for Implementer

1. **Graph-server location**: `/home/mosab/projects/chatmodule/graph-server/routes.ts` — this is in the BACKEND repo, not the frontend repo
2. **Neo4j connection**: Graph-server already has a Neo4j session object — use the existing connection pattern in the file
3. **Cypher relationship names**: Verify actual relationship types in Neo4j before coding. The names above (SETS_TARGETS, CLOSE_GAPS, SUPPORTS, ENABLES, HAS_SURVEY, SUPPLIED_BY) are from the ontology spec — confirm they exist in the live database
4. **NO Tailwind CSS**: All frontend styling uses CSS variables from `theme.css`
5. **Year parameter**: Always pass `year` as neo4j integer: `neo4j.int(year)`
6. **Fallback values**: When survey/vendor data is missing, use 50.0 (neutral) — NOT 0 (that would mean perfect health)
7. **The 35/65 bands** in overlay utils are the EXISTING overlay thresholds — do NOT change them. The strip uses 90/70 cuts (different scale, different purpose)
