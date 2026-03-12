# Risk & Status System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the Enterprise Desk so strip colors, overlays, and rollups reflect real data and correct formulas as defined in `docs/RISK_STATUS_DESIGN.md`.

**Architecture:** Three streams that can run in parallel: (A) fix mode rollup + status aggregation utilities, (B) add continuous gradient heatmap for exposure overlay, (C) redesign L2 panel to show two blocks (operational + under-construction). All changes are frontend-only — the ETL script rewrite is a separate backend task.

**Tech Stack:** React 19, TypeScript, CSS variables (NO Tailwind), existing enterprise component tree.

**Design doc:** `docs/RISK_STATUS_DESIGN.md` — all formulas, field definitions, and rules are there.

---

## Stream A: Fix Mode Rollup + Status Aggregation

### Task 1: Fix `aggregateStatus()` mode rollup — MIN instead of majority

**Files:**
- Modify: `frontend/src/utils/enterpriseStatusUtils.ts:5-60`

**Context:** Currently line 42 uses `buildModeCount >= executeModeCount` (majority wins). Design doc says: "L2 mode = MIN (most advanced) of its children. If one L3 is operational → L2 is operational." This means if ANY child is `execute` mode, the parent is `execute`.

**Step 1: Read the current function**

Read `frontend/src/utils/enterpriseStatusUtils.ts` lines 1-60 to confirm the current `aggregateStatus()` implementation.

**Step 2: Fix mode rollup logic**

Replace the mode determination line (currently line 42):

```typescript
// OLD: const mode: 'build' | 'execute' = buildModeCount >= executeModeCount ? 'build' : 'execute';

// NEW: If ANY child is operational (execute), parent is operational
const mode: 'build' | 'execute' = executeModeCount > 0 ? 'execute' : 'build';
```

**Step 3: Fix status rollup — worst child wins (no weighted formula)**

Replace lines 47-59 (the weighted formula) with simple worst-case:

```typescript
// Worst-case rollup: any issues → issues, any at-risk → at-risk, else ontrack
if (issuesCount > 0) {
  return { mode, status: 'issues' };
} else if (atRiskCount > 0) {
  return { mode, status: 'at-risk' };
} else if (ontrackCount > 0) {
  return { mode, status: 'ontrack' };
} else if (plannedCount > 0) {
  return { mode, status: 'planned' };
} else {
  return { mode, status: 'not-due' };
}
```

This replaces the old weighted formula (`atRiskCount / total > 0.3`) with simple worst-case as the design doc specifies.

**Step 4: Verify build compiles**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors in enterpriseStatusUtils.ts

**Step 5: Commit**

```bash
git add frontend/src/utils/enterpriseStatusUtils.ts
git commit -m "fix: mode rollup uses MIN (any execute → parent execute), status uses worst-case"
```

---

### Task 2: Fix `getL3StatusColor()` — planned should be gray, not green

**Files:**
- Modify: `frontend/src/utils/enterpriseStatusUtils.ts:62-77`

**Context:** Line 66 maps `planned` → `#10b981` (green). But `planned` means "not started yet" — it should be gray like `not-due`. Design doc Section 12 color map: `planned` → `#475569` (gray).

**Step 1: Fix the color mapping**

Change line 66:
```typescript
// OLD: else if (l3.build_status === 'planned') return '#10b981';
// NEW:
else if (l3.build_status === 'planned') return '#475569';
```

Also fix `getL2StatusColor` at line 87:
```typescript
// OLD: else if (aggregated.status === 'planned') return '#10b981';
// NEW:
else if (aggregated.status === 'planned') return '#475569';
```

And `getL1StatusColor` at line 109:
```typescript
// OLD: else if (aggregated.status === 'planned') return '#10b981';
// NEW:
else if (aggregated.status === 'planned') return '#475569';
```

**Step 2: Verify build compiles**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/utils/enterpriseStatusUtils.ts
git commit -m "fix: planned status shows gray (#475569), not green"
```

---

## Stream B: Continuous Gradient Heatmap for Exposure Overlay

### Task 3: Add `dependency_count` field to L3Capability type

**Files:**
- Modify: `frontend/src/types/enterprise.ts:25-35`

**Step 1: Add the field**

Add after `exposure_trend` (around line 27):
```typescript
dependency_count?: number; // Number of upstream/downstream dependencies for this capability
```

**Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/types/enterprise.ts
git commit -m "feat: add dependency_count field to L3Capability type"
```

---

### Task 4: Populate `dependency_count` in `buildL3()`

**Files:**
- Modify: `frontend/src/services/enterpriseService.ts:1072-1191`

**Context:** `buildL3()` constructs each L3 from Neo4j data. We need to count dependencies: linkedProjects + operatingEntities + policyTools + performanceTargets. These are already attached to the raw node.

**Step 1: Add dependency count calculation**

After line 1107 (`l3Cap.rawCapability.l2Kpis = ...`), add:

```typescript
// Dependency count = total connected nodes (projects + entities + process metrics)
// Used for exposure gradient heatmap (more dependencies = more risk surface)
const projCount = (l3Cap.rawCapability.linkedProjects || []).length;
const entityCount = (l3Cap.rawCapability.operatingEntities || []).length;
const processCount = (l3Cap.rawCapability.processMetrics || []).length;
l3Cap.dependency_count = projCount + entityCount + processCount;
```

**Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/services/enterpriseService.ts
git commit -m "feat: populate dependency_count on L3 capabilities"
```

---

### Task 5: Replace discrete overlay bands with continuous gradient

**Files:**
- Modify: `frontend/src/utils/enterpriseOverlayUtils.ts:6-88`

**Context:** Currently `calculateHeatmapColor()` returns one of 3 discrete colors (green/amber/red) based on 35/65 bands. Design doc says exposure should be a continuous gradient based on dependency count, scaled to dataset max.

The function needs a new parameter: `maxDependencyCount` (the highest dependency count in the entire dataset). Each component that calls this will compute and pass this value.

**Step 1: Update function signature and risk-exposure case**

```typescript
export function calculateHeatmapColor(
  l3: L3Capability,
  overlayType: OverlayType,
  maxDependencyCount?: number
): string {
    if (overlayType === 'none') return 'transparent';

    // ... keep existing switch for non-risk-exposure overlays ...

    if (overlayType === 'risk-exposure') {
        // Continuous gradient based on dependency count
        // Scale: 1 = green, max = red, mid = yellow
        const count = l3.dependency_count || 1;
        const max = Math.max(maxDependencyCount || 1, 1);
        const ratio = Math.min((count - 1) / Math.max(max - 1, 1), 1); // 0 to 1

        // Gradient: green (0) → yellow (0.5) → red (1)
        let r: number, g: number, b: number;
        if (ratio <= 0.5) {
            // Green to Yellow
            const t = ratio * 2; // 0 to 1
            r = Math.round(16 + (245 - 16) * t);   // 16 → 245
            g = Math.round(185 + (158 - 185) * t);  // 185 → 158
            b = Math.round(129 + (11 - 129) * t);   // 129 → 11
        } else {
            // Yellow to Red
            const t = (ratio - 0.5) * 2; // 0 to 1
            r = Math.round(245 + (239 - 245) * t);  // 245 → 239
            g = Math.round(158 + (68 - 158) * t);   // 158 → 68
            b = Math.round(11 + (68 - 11) * t);     // 11 → 68
        }
        return `rgba(${r}, ${g}, ${b}, 0.6)`;
    }

    // ... keep existing deltaPercent logic for other overlays ...
}
```

The gradient interpolates:
- `ratio=0` → `rgba(16, 185, 129, 0.6)` (green, `#10b981`)
- `ratio=0.5` → `rgba(245, 158, 11, 0.6)` (yellow/amber, `#f59e0b`)
- `ratio=1` → `rgba(239, 68, 68, 0.6)` (red, `#ef4444`)

**Step 2: Update all callers to pass maxDependencyCount**

Search for all calls to `calculateHeatmapColor` and add the third parameter. The caller must compute `maxDependencyCount` from the full L3 dataset once and pass it down.

Run: `grep -rn "calculateHeatmapColor" frontend/src/`

For each call site, the parent component needs to compute:
```typescript
const maxDeps = Math.max(...allL3s.map(l3 => l3.dependency_count || 1));
```
And pass it as the third argument.

**Step 3: Verify build**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/utils/enterpriseOverlayUtils.ts
git commit -m "feat: risk-exposure overlay uses continuous gradient based on dependency count"
```

---

### Task 6: Update overlay content text for risk-exposure

**Files:**
- Modify: `frontend/src/utils/enterpriseOverlayUtils.ts:91-129`

**Context:** `getOverlayContent()` for risk-exposure currently shows `"+Xd / Y%"` (BUILD) or `"Y% ▲/▼"` (EXECUTE). With the new gradient system, it should show the dependency count so users understand what drives the color.

**Step 1: Update risk-exposure case**

```typescript
case 'risk-exposure':
    const deps = l3.dependency_count || 0;
    if (l3.mode === 'build') {
        return `${deps} deps · +${l3.expected_delay_days || 0}d`;
    } else {
        const trend = l3.exposure_trend === 'improving' ? '▲' : l3.exposure_trend === 'declining' ? '▼' : '■';
        return `${deps} deps · ${l3.exposure_percent || 0}% ${trend}`;
    }
```

**Step 2: Verify build + commit**

```bash
cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30
git add frontend/src/utils/enterpriseOverlayUtils.ts
git commit -m "feat: risk-exposure overlay text shows dependency count"
```

---

## Stream C: L2 Panel — Two Blocks (Operational + Under-Construction)

### Task 7: Redesign L2 Detail Panel to show two L3 blocks

**Files:**
- Modify: `frontend/src/components/desks/enterprise/CapabilityDetailPanel.tsx:786-825`

**Context:** Currently the L2 panel lists ALL L3 children in a single flat list (lines 786-825). Design doc says: show TWO separate blocks when L2 has mixed-mode children:
1. "Operational Capabilities" — L3s where `mode === 'execute'`
2. "Under Construction" — L3s where `mode === 'build'`

When all L3s become operational, the build block disappears.

**Step 1: Read the current L2DetailView**

Read `frontend/src/components/desks/enterprise/CapabilityDetailPanel.tsx` lines 720-840 to understand the current structure.

**Step 2: Split L3 children into two groups**

After line 729 (`const { t } = useTranslation();`), add:

```typescript
// Split L3s by mode for two-block display
const operationalL3s = (l2.l3 || []).filter(l3 => l3.mode === 'execute');
const buildingL3s = (l2.l3 || []).filter(l3 => l3.mode === 'build');
```

**Step 3: Replace the single L3 list (lines 786-825) with two blocks**

Replace the section from `{/* 1. L3 Children */}` through the closing `</div>` of the L3 list with:

```tsx
{/* 1. Operational Capabilities */}
{operationalL3s.length > 0 && (
  <>
    <h3 style={sectionTitleStyle}>
      {t('josoor.enterprise.detailPanel.operationalCapabilities', 'Operational Capabilities')}
      <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 400, color: 'var(--component-text-muted)' }}>
        ({operationalL3s.length})
      </span>
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.5rem' }}>
      {operationalL3s.map(l3 => {
        const l3StatusColor = l3.execute_status === 'issues' ? '#ef4444'
          : l3.execute_status === 'at-risk' ? '#f59e0b'
          : l3.execute_status === 'ontrack' ? '#10b981' : '#475569';
        return (
          <div key={l3.id}
            onClick={() => onSelectL3 && onSelectL3(l3)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px', padding: '8px 12px',
              cursor: onSelectL3 ? 'pointer' : 'default'
            }}>
            <div>
              <span style={{ opacity: 0.5, marginRight: '6px', fontSize: '12px' }}>{l3.id}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--component-text-primary)' }}>
                {l3.name}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--component-text-muted)' }}>
                {l3.kpi_achievement_pct != null ? `${Math.round(l3.kpi_achievement_pct)}%` : '—'}
              </span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: l3StatusColor }} />
            </div>
          </div>
        );
      })}
    </div>
  </>
)}

{/* 2. Under Construction — disappears when all L3s become operational */}
{buildingL3s.length > 0 && (
  <>
    <h3 style={sectionTitleStyle}>
      {t('josoor.enterprise.detailPanel.underConstruction', 'Under Construction')}
      <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 400, color: 'var(--component-text-muted)' }}>
        ({buildingL3s.length})
      </span>
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.5rem' }}>
      {buildingL3s.map(l3 => {
        const rawStatus = String(l3.rawCapability?.status || '').toLowerCase();
        const isNotDue = l3.build_status === 'not-due' ||
          rawStatus === 'planned' || rawStatus === 'not_started' || rawStatus === 'not-started' || rawStatus === 'future' || rawStatus === 'pipeline';
        const l3StatusColor = l3.build_status?.includes('issues') ? '#ef4444'
          : l3.build_status?.includes('atrisk') ? '#f59e0b'
          : l3.build_status === 'in-progress-ontrack' ? '#10b981'
          : '#475569';
        return (
          <div key={l3.id}
            onClick={() => onSelectL3 && onSelectL3(l3)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: isNotDue ? 'rgba(148,163,184,0.10)' : 'rgba(255,255,255,0.03)',
              border: isNotDue ? '1px solid rgba(148,163,184,0.30)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px', padding: '8px 12px', opacity: isNotDue ? 0.72 : 1,
              cursor: onSelectL3 ? 'pointer' : 'default'
            }}>
            <div>
              <span style={{ opacity: 0.5, marginRight: '6px', fontSize: '12px' }}>{l3.id}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: isNotDue ? 'var(--component-text-muted)' : 'var(--component-text-primary)' }}>
                {l3.name}
              </span>
              {isNotDue && (
                <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--component-text-muted)' }}>
                  ({t('josoor.enterprise.detailPanel.notDue', 'Not due')})
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--component-text-muted)' }}>{l3.maturity_level}/{l3.target_maturity_level}</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isNotDue ? '#64748b' : l3StatusColor }} />
            </div>
          </div>
        );
      })}
    </div>
  </>
)}
```

**Step 4: Add i18n keys**

Add to `frontend/src/i18n/en.json` under `josoor.enterprise.detailPanel`:
```json
"operationalCapabilities": "Operational Capabilities",
"underConstruction": "Under Construction",
"notDue": "Not due"
```

Add to `frontend/src/i18n/ar.json` under `josoor.enterprise.detailPanel`:
```json
"operationalCapabilities": "القدرات التشغيلية",
"underConstruction": "قيد الإنشاء",
"notDue": "غير مستحقة"
```

**Step 5: Verify build**

Run: `cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

**Step 6: Commit**

```bash
git add frontend/src/components/desks/enterprise/CapabilityDetailPanel.tsx frontend/src/i18n/en.json frontend/src/i18n/ar.json
git commit -m "feat: L2 panel shows two blocks — operational and under-construction L3s"
```

---

## Verification

### Task 8: Full build + visual verification

**Step 1: Run full TypeScript check**

Run: `cd frontend && npx tsc --noEmit --pretty`
Expected: 0 errors in modified files

**Step 2: Run production build**

Run: `cd frontend && npm run build:vite 2>&1 | tail -20`
Expected: Build succeeds

**Step 3: Visual verification checklist**

Open browser → http://localhost:3000/josoor → Enterprise Desk:

1. **Mode rollup:** Find an L2 with mixed L3s (some active, some planned). Verify L2 shows as operational (execute mode) if ANY child is active.
2. **Strip rollup:** If one L3 under an L2 is red, the L2 strip should be red too.
3. **Planned color:** L3s with `planned` status should show gray dot, not green.
4. **L2 Panel:** Click an L2 with mixed children → should see TWO blocks:
   - "Operational Capabilities" with KPI percentages
   - "Under Construction" with maturity levels
   - If L2 has only operational children → only one block shown
5. **Exposure overlay:** Toggle "Risk Exposure" overlay on. Colors should be smooth gradients (not discrete red/amber/green blocks). Capabilities with more dependencies should be warmer (more red).

**Step 4: Commit all remaining changes**

```bash
git add -A
git commit -m "chore: verification complete — risk status system implementation"
```

---

## Task Dependency Graph

```
Stream A (rollup):     Task 1 → Task 2
Stream B (gradient):   Task 3 → Task 4 → Task 5 → Task 6
Stream C (L2 panel):   Task 7

All streams:           → Task 8 (verification)
```

Streams A, B, and C can run **in parallel** (no dependencies between them). Task 8 runs after all streams complete.

---

## Out of Scope (Separate Plan Needed)

1. **ETL Script Rewrite** (`run_risk_agent.py`) — backend repo, needs real formula implementation
2. **Right Brain Auditor** — LLM-based audit, separate service
3. **CultureHealth / Vendor data population** — data engineering task
4. **Other overlay types** (external pressure, footprint stress, change saturation, trend warning) — working with existing logic, not changed in this plan
