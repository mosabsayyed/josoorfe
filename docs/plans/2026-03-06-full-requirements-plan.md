# Full Requirements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement all 90 requirements from the 2026-03-06 audit across 11 desk sections.

**Architecture:** React SPA with Neo4j graph DB (via MCP + REST chains), Supabase for auth/settings/prompts, Mapbox for maps. Frontend reads ETL-written status from Neo4j nodes. AI buttons send prompt_key to backend which loads prompt from Supabase instruction_elements.

**Tech Stack:** React 18, TypeScript, Mapbox GL, SVAR wx-react-gantt, Recharts, CSS custom properties, Neo4j Cypher, Supabase REST.

---

## Phase 0: ALREADY DONE (5 items)

| ID | Requirement | File | Status |
|----|------------|------|--------|
| S1 | BIOS always English LTR | JosoorDesktopPage.tsx | DONE — `dir="ltr"` on boot container |
| S2 | Remember language preference | LanguageContext.tsx | DONE — localStorage `jos-lang` |
| S3 | Remember light/dark preference | JosoorDesktopPage.tsx | DONE — localStorage theme |
| S4 | Remember date selected | JosoorDesktopPage.tsx | DONE — localStorage year/quarter |
| T1 | Settings save to DB | adminSettingsService.ts | DONE — apiClient with auto-auth |

---

## Phase 1: ONTOLOGY DESK (H1–H16) — 16 items

### Task 1.1: H1+H2 — Line RAG coverage for all nodes (VERIFY ONLY)

**Requirement:** "solid yellow lines (impossible state)", "some nodes not covered (ppl, process, tool)"

**Current state:** `computeLineFlowHealth()` in ontologyService.ts:606-668 already computes RAG for 23 connection pairs. Default line CSS changed from gold to red. The function returns green/amber/red for all pairs, 'default' only when BOTH node types are absent.

**Files:**
- Verify: `frontend/src/services/ontologyService.ts:137-161` — CONNECTION_PAIRS array
- Verify: `frontend/src/components/desks/OntologyHome.css:142-148` — `.ont-rel-line--default` is red

**Step 1:** Read CONNECTION_PAIRS in ontologyService.ts and confirm all 15 node types appear in at least one pair. List any node type with ZERO connections.

**Step 2:** If any node type is missing from CONNECTION_PAIRS, add the missing pairs. The pairs that MUST exist per the ontology:
- orgUnits ↔ capabilities, orgUnits ↔ processes, orgUnits ↔ projects
- processes ↔ capabilities, processes ↔ projects, processes ↔ itSystems
- itSystems ↔ capabilities, itSystems ↔ projects, itSystems ↔ vendors
- cultureHealth ↔ orgUnits
- vendors ↔ capabilities
- changeAdoption ↔ projects
- riskPlans ↔ risks

**Step 3:** Verify `.ont-rel-line--default` in OntologyHome.css is `#ef4444` (red), not gold.

**Step 4:** Commit if changes made.

---

### Task 1.2: H3+H12 — Node RAG tinting for all shape types (IN PROGRESS)

**Requirement:** "every shape needs a status", "buildings=diamond on top, grey platform=top shape changes color, circular=fully ragged"

**Current state:** D3 fix already applied. Buildings use `rag-green/yellow/red.svg` diamonds. Coins use `gold-coin.png` with CSS `hue-rotate` filter. Platforms use entity gold assets with CSS filter.

**Files:**
- Modified: `frontend/src/components/desks/OntologyHome.tsx:389-454` — overlay block
- Modified: `frontend/src/components/desks/OntologyHome.css:170-178` — `.ont-node-tint--*` classes

**Step 1:** Visual test in browser. Open Ontology desk, verify:
- Buildings (sectorObjectives, policyTools, performance, risks, capabilities, projects) show colored diamond on roof
- Coins (riskPlans, cultureHealth, vendors, changeAdoption) show fully tinted coin
- Platforms (adminRecords, dataTransactions, orgUnits, processes, itSystems) show tinted top shape

**Step 2:** If hue-rotate values are off, adjust in OntologyHome.css. Gold hue ≈ 51°. Target values:
- Green: `hue-rotate(80deg) saturate(2.5) brightness(1.1)` → shifts to ~131°
- Amber: `hue-rotate(-10deg) saturate(1.5)` → stays near gold ~41°
- Red: `hue-rotate(-40deg) saturate(3) brightness(0.9)` → shifts to ~11°

**Step 3:** Commit.

---

### Task 1.3: H4+H5 — Bottom-up RAG chain aggregation

**Requirement:** "it is all bottom up. if risk is pushing reds to policy and perf then they should be red too, and if they are red then objectives is also red"

**Current state:** `aggregateNodeRag()` in ontologyService.ts:559-602 already does upstream cascade via `computeDownstreamExposure()` (lines 484-555). But it uses BFS fan-out which may not fully propagate bottom-up.

**Files:**
- Modify: `frontend/src/services/ontologyService.ts:559-602` — `aggregateNodeRag()`
- Modify: `frontend/src/services/ontologyService.ts:484-555` — `computeDownstreamExposure()`

**Step 1:** Read the current aggregateNodeRag logic. Understand: does a RED risk node currently make the policyTools aggregate RED? Does RED policyTools make sectorObjectives RED?

**Step 2:** Define the two bottom-up chains explicitly:
- **Build mode:** projects → changeAdoption → capabilities → risks → (policyTools + performance) → sectorObjectives
- **Operate mode:** (orgUnits + processes + itSystems + vendors + cultureHealth) → capabilities → risks → (policyTools + performance) → sectorObjectives

**Step 3:** Implement chain propagation in `aggregateNodeRag()`:
```typescript
// After computing per-instance RAG for all nodes, propagate bottom-up:
// For each chain step, if source aggregate is RED → target aggregate becomes RED
// If source is AMBER → target becomes at least AMBER (but RED overrides)
const BOTTOM_UP_BUILD = [
  ['projects', 'capabilities'],
  ['changeAdoption', 'capabilities'],
  ['capabilities', 'risks'],
  ['risks', 'policyTools'],
  ['risks', 'performance'],
  ['policyTools', 'sectorObjectives'],
  ['performance', 'sectorObjectives'],
];
const BOTTOM_UP_OPERATE = [
  ['orgUnits', 'capabilities'],
  ['processes', 'capabilities'],
  ['itSystems', 'capabilities'],
  ['vendors', 'capabilities'],
  ['cultureHealth', 'capabilities'],
  ['capabilities', 'risks'],
  ['risks', 'policyTools'],
  ['risks', 'performance'],
  ['policyTools', 'sectorObjectives'],
  ['performance', 'sectorObjectives'],
];
```

**Step 4:** For each pair `[source, target]`, if `nodeRag[source] === 'red'` then `nodeRag[target] = 'red'`. If `nodeRag[source] === 'amber'` and `nodeRag[target] === 'green'` then `nodeRag[target] = 'amber'`.

**Step 5:** Commit: `feat(ontology): implement bottom-up RAG chain aggregation`

---

### Task 1.4: H6+H7 — Side panel: ID, traceability, CTA

**Requirement:** "side panels are still a mess, random data, broken traceability, no CTA, consistently missing the ID in the panel"

**Current state:** Panel at OntologyHome.tsx:462-889 already has: verdict banner, health bar, priority list with triage sort, linked nodes for drill-down, mitigation plans, CTAs. The ID (`domain_id`) is shown in some cards but may be missing.

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx:602-806` — per-issue card

**Step 1:** Read the per-issue card rendering (lines 602-806). Check if `inst.props.domain_id` or `inst.id` is displayed. The user explicitly says "consistently missing the ID in the panel".

**Step 2:** Add domain_id display to each issue card header:
```tsx
<span className="ont-panel-id">{inst.props.domain_id || extractLogicalId(inst.id)}</span>
```

**Step 3:** Verify the drill-down trace path works: click a linked node chip → panel updates to show that node's connections → back button returns to previous view.

**Step 4:** Verify CTA buttons exist at bottom: "Investigate in Enterprise Desk" + "Ask AI Advisor". If missing, add them.

**Step 5:** Commit.

---

### Task 1.5: H8 — AI-generated status narrative

**Requirement:** "status row should tell the story... use an AI call to get a short paragraph to insert, loaded dynamically"

**Current state:** Strip has pre-computed text narratives like "Priorities on track" from COLUMN_NARRATIVES in ontologyService.ts:672-686. These are static templates, not AI-generated.

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx:148-178` — strip rendering
- Modify: `frontend/src/services/ontologyService.ts:954-981` — strip narrative generation
- Create: Supabase prompt for `ontology_status_narrative`

**Step 1:** Add a new prompt_key `ontology_status_narrative` to Supabase `instruction_elements` table. The prompt should instruct the AI to write a 2-3 sentence status summary given the RAG counts per column.

**Step 2:** After `fetchOntologyRagState()` completes, fire an async AI call:
```typescript
const narrativePrompt = `Given these RAG counts: Goals(${green}G/${amber}A/${red}R), Sector(${...}), Health(${...}), Capacity(${...}), Velocity(${...}) — write a 2-sentence executive summary.`;
chatService.sendMessage({ content: narrativePrompt, prompt_key: 'ontology_status_narrative' });
```

**Step 3:** Display the AI response in a banner above the strip. Show skeleton loader while waiting.

**Step 4:** Cache the narrative in state so it doesn't re-fetch on every render.

**Step 5:** Commit.

---

### Task 1.6: H9 — Wire year/quarter filters

**Requirement:** "Ontology is not wired with the year/q filters"

**Current state:** `fetchOntologyRagState()` hardcodes `year = new Date().getFullYear()` at line 726. No quarter filtering. No UI controls in OntologyHome.

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx` — accept year/quarter props
- Modify: `frontend/src/services/ontologyService.ts:723-726` — accept year/quarter params

**Step 1:** OntologyHome already receives `year` and `quarter` as props from JosoorDesktopPage (which stores them in localStorage). Read how they're passed.

**Step 2:** Pass `year` and `quarter` to `fetchOntologyRagState(year, quarter)`.

**Step 3:** In `fetchOntologyRagState`, use the passed year instead of `new Date().getFullYear()`. Filter nodes by quarter if provided.

**Step 4:** Verify chain API calls support year param: `fetchChainCached(name, year)`.

**Step 5:** Commit.

---

### Task 1.7: H10 — Sector indicator

**Requirement:** "nothing indicating this for a specific Sector, yet in our case we built the demo based on the Water Sector"

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx` — header area

**Step 1:** Add a sector badge to the header strip area:
```tsx
<div className="ont-sector-badge">
  <span className="ont-sector-icon">💧</span>
  <span className="ont-sector-name">{lang === 'ar' ? 'قطاع المياه' : 'Water Sector'}</span>
</div>
```

**Step 2:** Style it in OntologyHome.css.

**Step 3:** Commit.

---

### Task 1.8: H11 — Canvas 5% smaller

**Requirement:** "The full view of the canvas should be smaller by 5%"

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.css:57-60` — `.ont-landscape-wrap`

**Step 1:** Change the landscape wrap to scale down 5%:
```css
.ont-landscape-wrap {
  position: relative;
  width: 95%;  /* was 100% */
  margin: 0 auto;
  aspect-ratio: 5838 / 2581;
}
```

**Step 2:** Commit.

---

### Task 1.9: H13+H14 — Totals near nodes and lines

**Requirement:** "totals are better positioned on the visual dashboard near each node and near each line"

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx` — SVG overlay layer

**Step 1:** After the RAG overlay block, add SVG `<text>` elements positioned near each node showing instance counts:
```tsx
{Object.entries(NODE_POS).map(([key, pos]) => {
  const details = ragState?.nodeDetails[key] || [];
  const reds = details.filter(d => d.rag === 'red').length;
  const total = details.length;
  if (total === 0) return null;
  return (
    <text key={`count-${key}`}
      x={pos.x + pos.w / 2} y={pos.y + pos.h + 30}
      textAnchor="middle" fontSize="24" fontWeight="700"
      fill={reds > 0 ? '#ef4444' : '#22c55e'}>
      {reds > 0 ? `${reds}/${total}` : `${total}`}
    </text>
  );
})}
```

**Step 2:** Similarly, add line totals near each connection midpoint from `lineDetails`.

**Step 3:** Commit.

---

### Task 1.10: H15+H16 — Relation names on lines

**Requirement:** "each line should have the relation name (while accommodating for two way arrows which means two relations depending on the direction and making sure no overlaps happen)"

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx:200-388` — connection line groups
- Add: relation name labels to each `<g>` group

**Step 1:** Define a RELATION_NAMES map:
```typescript
const RELATION_NAMES: Record<string, { forward: string; reverse?: string }> = {
  'capabilities_orgUnits': { forward: 'ROLE_GAPS' },
  'capabilities_processes': { forward: 'KNOWLEDGE_GAPS' },
  'capabilities_itSystems': { forward: 'AUTOMATION_GAPS' },
  // ... all 23 pairs
};
```

**Step 2:** For each connection `<g>`, add a `<text>` element at the path midpoint with the relation name. Use `<textPath>` on the actual SVG path for automatic positioning along the curve.

**Step 3:** For two-way arrows, offset the two labels vertically so they don't overlap (e.g., dy="-12" and dy="+12").

**Step 4:** Style with small font size (14px), semi-transparent, visible on hover.

**Step 5:** Commit.

---

## Phase 2: OBSERVE DESK (O1–O9) — 9 items

### Task 2.1: O1 — Parse-free sector outputs/investments

**Requirement:** "we changed the db entries for sector outputs and investments to be parse-free. adjust frontend to make the correct calls"

**Files:**
- Modify: `frontend/src/components/desks/sector/SectorDetailsPanel.tsx:166-194` — formatInvestment/formatCapacity
- Check NoorMemory for schema details

**Step 1:** Search NoorMemory for "parse-free" or "sector outputs" to find the schema change entry.

**Step 2:** Read the current `formatInvestment()` and `formatCapacity()` functions in SectorDetailsPanel.tsx. They already read structured fields (`investment_value`, `capacity_value`, `capacity_unit`). Verify these match the new DB schema.

**Step 3:** If the DB now stores values directly (no parsing needed), remove any remaining string-parsing fallbacks that try to extract numbers from text labels.

**Step 4:** Commit.

---

### Task 2.2: O2 — Hide empty entries when no L2 policy/cap

**Requirement:** "when there is no L2 policy and hence cap, it shows empty entries which is not right"

**Files:**
- Modify: `frontend/src/components/desks/sector/SectorDetailsPanel.tsx:825-900` — L2 children rendering

**Step 1:** Read the L2 expansion code. Find where capabilities are listed under a policy tool.

**Step 2:** Add a null guard: if `l2.capabilities.length === 0`, don't render the empty capability section. Show a "No linked capabilities" message instead, or skip the section entirely.

**Step 3:** Same for empty L2 entries: if an L1 has no L2 children, skip rendering the empty container.

**Step 4:** Commit.

---

### Task 2.3: O3 — Capability strip status match matrix

**Requirement:** "The status of the capabilities in the color strip is not correct, it should match the status used in the capability matrix"

**Current state:** VERIFIED CORRECT by C3 agent. SectorDetailsPanel reads `buildBand` from `build_band`/`operate_band` on risk nodes via `aggregatePolicyRiskByL1()`. This IS the same source as the capability matrix.

**Step 1:** Verify visually that the colors match between Observe desk capability cards and Decide desk capability matrix cells.

**Step 2:** If colors differ, check whether the sector desk aggregates at a different level (L1 vs L2 vs L3).

**Step 3:** No code change expected — mark as verified.

---

### Task 2.4: O4 — Click capability → open matrix app + auto-open panel

**Requirement:** "When I click on a capability from this tree, it is supposed to open the capability matrix (app) and auto open the sidepanel there with that capability"

**Current state:** `handleCapabilityNavigation()` at SectorDetailsPanel.tsx:270-279 exists but navigates to `/josoor?cap=<capId>` (OntologyHome), NOT the capability matrix.

**Files:**
- Modify: `frontend/src/components/desks/sector/SectorDetailsPanel.tsx:270-279`
- Modify: `frontend/src/components/desks/EnterpriseDesk.tsx` — accept `initialCapId` prop
- Modify: `frontend/src/pages/JosoorDesktopPage.tsx` — route cap param to EnterpriseDesk

**Step 1:** Change navigation target from OntologyHome to EnterpriseDesk:
```typescript
navigate(`/josoor?app=decide&cap=${encodeURIComponent(targetCapId)}`);
```

**Step 2:** In JosoorDesktopPage, read `cap` query param and pass to the Decide desk as `initialCapId`.

**Step 3:** In EnterpriseDesk, when `initialCapId` is set, auto-select that capability and open the detail panel.

**Step 4:** Commit.

---

### Task 2.5: O5 — Map resize on fullscreen

**Requirement:** "The map does not update when the app changes size to full screen"

**Files:**
- Modify: `frontend/src/components/desks/sector/SectorMap.tsx` — add resize observer

**Step 1:** Add a ResizeObserver on the map container:
```typescript
useEffect(() => {
  const observer = new ResizeObserver(() => {
    mapRef.current?.resize();
  });
  if (containerRef.current) observer.observe(containerRef.current);
  return () => observer.disconnect();
}, []);
```

**Step 2:** Commit.

---

### Task 2.6: O6 — Asset state changes with year filter

**Requirement:** "the assets state (existing/planned) should change with the year filter. if its due to 2027, then the state should change to existing"

**Files:**
- Modify: `frontend/src/components/desks/sector/SectorMap.tsx:247-256` — `getSimpleStatus()`

**Step 1:** Pass `selectedYear` prop to SectorMap.

**Step 2:** Modify `getSimpleStatus()`:
```typescript
function getSimpleStatus(status?: string, completionYear?: number, selectedYear?: number): 'Running' | 'Future' {
  if (completionYear && selectedYear && completionYear <= selectedYear) return 'Running';
  // existing logic
}
```

**Step 3:** Read `completion_year` or `target_year` from the asset node properties and pass to the function.

**Step 4:** Commit.

---

### Task 2.7: O7+O8 — Pillar program filtering

**Requirement:** "third pillar should have no programs but it seems it shows all programs. Make sure under the first two pillars all delivery programs and water assets are reflected, no orphans"

**Files:**
- Modify: `frontend/src/components/desks/sector/data/waterHighLevelHierarchy.ts`
- Modify: `frontend/src/components/desks/sector/SectorHeaderNav.tsx:257-272`

**Step 1:** Read waterHighLevelHierarchy.ts. Check if Pillar 3 ("Ambitious") has `linkedPrograms` on its L3 items. If so, remove them — third pillar should have no programs.

**Step 2:** Check Pillars 1 and 2: list ALL programs that should be linked. Cross-reference with the actual Water program families to ensure no orphans.

**Step 3:** In SectorHeaderNav, when a pillar is selected and has NO programs, show "No delivery programs for this pillar" instead of showing all programs.

**Step 4:** Commit.

---

### Task 2.8: O9 — RAG aggregation upward in Observe desk

**Requirement:** "capability status needs to aggregate upwards: cap → policy tool → delivery program → sector objectives"

**Files:**
- Modify: `frontend/src/services/neo4jMcpService.ts` — `aggregatePolicyRiskByL1()`
- Modify: `frontend/src/components/desks/sector/SectorDetailsPanel.tsx` — display aggregated RAG

**Step 1:** In `aggregatePolicyRiskByL1()`, after computing per-capability bands, aggregate upward:
- L2 policy tool band = worst band of its capabilities
- L1 policy tool band = worst band of its L2 children
- Delivery program band = worst band of its policy tools
- Sector objective band = worst band of its delivery programs

**Step 2:** Display these aggregated bands as color indicators on the hierarchy in SectorDetailsPanel.

**Step 3:** Commit.

---

## Phase 3: DECIDE DESK (D1–D17) — 17 items

### Task 3.1: D1 — Remove L2 description overflow

**Requirement:** "L2 has a lot of text and ends up overflowing on to other cells under it, remove the description line from the cell"

**Files:**
- Modify: `frontend/src/components/desks/enterprise/CapabilityMatrix.tsx:150-180` — L2 cell

**Step 1:** In the L2 cell rendering, find the description line and remove it. L2 should show only: ID, name, maturity, KPI — same as L1 and L3.

**Step 2:** Add CSS overflow protection: `overflow: hidden; text-overflow: ellipsis;` on the cell.

**Step 3:** Commit.

---

### Task 3.2: D2 — Remove mystery KPI- labels

**Requirement:** "L1 and L2 have a KPI- under them, I don't know what this is"

**Files:**
- Modify: `frontend/src/components/desks/enterprise/CapabilityMatrix.tsx:136-139,175-178`

**Step 1:** Read lines 136-139 (L1 KPI label) and 175-178 (L2 KPI label). These show aggregated KPI percentages.

**Step 2:** If the label shows "KPI-" with no value, it means no KPI data exists for those capabilities. Either hide when no value, or show a meaningful label like "KPI: N/A".

**Step 3:** Better: show `{kpiPct ? `${kpiPct}%` : ''}` — hide entirely when no data.

**Step 4:** Commit.

---

### Task 3.3: D3+D4+D5 — Redesign L2 side panel

**Requirement:** "side panels are massive data dumps. L3 cap in operation before status (wrong order). Formula and inputs makes no sense."

**Files:**
- Modify: `frontend/src/components/desks/enterprise/CapabilityDetailPanel.tsx` — L2 detail view

**Step 1:** Read the current L2 panel rendering. Document the current section order.

**Step 2:** Redesign L2 panel section order:
1. **Status banner** (RAG color + one-line verdict) — FIRST
2. **Gauge** (KPI achievement %) — with clear label of what's measured
3. **Maturity blocks** (current vs target, with gap)
4. **Upward chain** (L2 cap → L2 perf → L1 perf → L1 obj) — SIMPLE 4-step breadcrumb
5. **L3 capabilities in operation** — list with status
6. **Linked KPI reference** — link to KPI card (see D6)
7. **Risk profile** — only meaningful fields

**Step 3:** Remove: "L2 formula and inputs" section entirely. Remove "Upward link" long list, replace with 4-step breadcrumb.

**Step 4:** Commit.

---

### Task 3.4: D6+D7 — KPI card with L2 KPI reference

**Requirement:** "add a reference to the L2 KPI linked to it, and when you go to the KPI card you should see the details there. Red without the rule of planned vs target TEMPORALLY not in absolute."

**Files:**
- Create: `frontend/src/components/desks/enterprise/KpiCard.tsx`
- Modify: `frontend/src/components/desks/enterprise/CapabilityDetailPanel.tsx`

**Step 1:** Create KpiCard component showing:
- KPI name + ID
- Current value vs target value
- **Temporal comparison:** planned value for THIS quarter vs actual for THIS quarter (not absolute target)
- Timeline showing quarterly progression
- RAG based on temporal rule: green if on-plan, amber if behind but recovering, red if behind and worsening

**Step 2:** In CapabilityDetailPanel L2 view, add a "Linked KPI" section with a clickable chip that opens the KPI card as an overlay/modal.

**Step 3:** Commit.

---

### Task 3.5: D8 — Simple upward link chain

**Requirement:** "Upward link should simply show L2 cap → L2 perf → L1 perf → L1 obj. Simple."

**Files:**
- Modify: `frontend/src/components/desks/enterprise/CapabilityDetailPanel.tsx` — upward link section

**Step 1:** Replace the current long list with a simple 4-step breadcrumb:
```tsx
<div className="ent-upward-chain">
  <span className="chain-node">{l2Cap.name}</span> →
  <span className="chain-node">{l2Perf?.name || '—'}</span> →
  <span className="chain-node">{l1Perf?.name || '—'}</span> →
  <span className="chain-node">{l1Obj?.name || '—'}</span>
</div>
```

**Step 2:** Each step is clickable (navigates to that node's detail).

**Step 3:** Color each step by its RAG status.

**Step 4:** Commit.

---

### Task 3.6: D9+D10 — Clarify gauge vs maturity

**Requirement:** "gauge unclear what is measured. Maturity right under gauge implies they're the same, they're different."

**Files:**
- Modify: `frontend/src/components/desks/enterprise/CapabilityDetailPanel.tsx:535-555`

**Step 1:** Add clear label above gauge: "KPI Achievement" with subtext showing the specific metric name.

**Step 2:** Add a visual separator (divider + heading) between gauge and maturity blocks: "Capability Maturity" heading.

**Step 3:** In the gauge, show planned vs actual:
```
Planned: 75% by Q1 2026
Actual: 62%
```

**Step 4:** Commit.

---

### Task 3.7: D11+D12 — Fix maturity data disconnects

**Requirement:** "maturity shows 1 while in operation (requires M3 min). L3 gauge 0% while maturity is 5, siblings M5 while parent M1."

**Files:**
- Modify: `frontend/src/services/enterpriseService.ts` — maturity reading logic
- Modify: `frontend/src/services/enterpriseService.ts` — L2 rollup from L3

**Step 1:** Read how `maturity_level` is extracted in `buildL3()` (line 1540). Check if it reads the correct Neo4j field.

**Step 2:** Add validation: if `execute_status` indicates OPERATE mode, maturity MUST be ≥ 3. If it's less, flag as data quality issue in the UI.

**Step 3:** Fix L2 maturity rollup: L2.maturity = MIN of its L3 children (not average, not MAX). This prevents parent=M1 while children=M5.

**Step 4:** Fix L3 gauge: if `kpi_achievement_pct` is 0 but maturity is 5, this is a data issue. Add a warning indicator.

**Step 5:** Commit.

---

### Task 3.8: D13+D14 — Fix misplaced process metrics and ops footprint

**Requirement:** "gauge numbers appearing in process metrics (wrong location). Ops footprint unclear, no track status."

**Files:**
- Modify: `frontend/src/components/desks/enterprise/CapabilityDetailPanel.tsx`

**Step 1:** Read the L3 panel sections. Find where "process metrics" appears and what data it shows.

**Step 2:** If gauge numbers (KPI %) are duplicated in process metrics, remove the duplication. Process metrics should show: metric name, actual value, target value, trend.

**Step 3:** Rename "Ops Footprint" to "Linked Projects". Show each project with: name, status (RAG dot), progress %, end date, and reason for link (e.g., "Closing gap in IT Systems").

**Step 4:** If a capability is at M5 and has linked projects, add explanatory note: "Sustaining operations" or "Enhancement projects".

**Step 5:** Commit.

---

### Task 3.9: D15 — Risk profile cleanup

**Requirement:** "risk profile has two useless inputs category and status — ABSOLUTELY USELESS"

**Files:**
- Modify: `frontend/src/components/desks/enterprise/CapabilityDetailPanel.tsx:332-399`

**Step 1:** Remove "category" and "status" fields from the risk profile section.

**Step 2:** Replace with actionable fields: risk band (RAG), impact score, linked mitigation plan status, escalation flag.

**Step 3:** Commit.

---

### Task 3.10: D16 — Fix chain field reading

**Requirement:** "chains reading from wrong fields and aggregating incorrectly"

**Files:**
- Modify: `frontend/src/services/enterpriseService.ts:289-567` — entity extraction and aggregation

**Step 1:** Audit the field mappings in `extractEntitiesFromChains()`. For each entity type, verify the Cypher field names match what Neo4j actually stores:
- EntityCapability: `build_status`, `execute_status`, `kpi_achievement_pct`, `maturity_level`, `target_maturity_level`
- EntityRisk: `build_band`, `operate_band`
- EntityProcess: `metric_name`, `actual`, `target`, `trend`
- SectorPerformance: `actual_value`, `target`

**Step 2:** Fix any mismatched field names (e.g., `people_risk` vs `people_score`).

**Step 3:** Verify aggregation: L2 status = worst L3 child. L1 status = worst L2 child.

**Step 4:** Commit.

---

### Task 3.11: D17 — Exposure overlay gradient

**Requirement:** "Exposure overlay: gradient coloring based on dynamic min and max values of a formula of risk rating, urgency and dependencies. Not applied."

**Current state:** `calculateHeatmapColor()` in enterpriseOverlayUtils.ts uses only `dependency_count`. Should use `risk_rating × urgency × dependencies`.

**Files:**
- Modify: `frontend/src/services/enterpriseOverlayUtils.ts:6-27`

**Step 1:** Change the formula:
```typescript
const riskRating = l3.rawRisk?.build_band === 'red' ? 3 : l3.rawRisk?.build_band === 'amber' ? 2 : 1;
const urgency = l3.expected_delay_days ? Math.min(l3.expected_delay_days / 90, 1) : 0.3;
const deps = l3.dependency_count || 0;
const exposure = (riskRating * 0.4) + (urgency * 0.3) + ((deps / maxDeps) * 0.3);
```

**Step 2:** Normalize exposure to 0-1 range using dynamic min/max from all visible L3s.

**Step 3:** Apply same green→amber→red gradient.

**Step 4:** Commit.

---

## Phase 4: DELIVER DESK (P1–P13) — 13 items

### Task 4.1: P1+P2+P3 — Progress tracking for intervention plans

**Requirement:** "how do plans reach users and owners, how they send back progress on tasks, status doesn't link back to risk"

**Files:**
- Modify: `frontend/src/components/desks/PlanningDesk.tsx:239-577` — SavedPlansList
- Modify: `frontend/src/services/planningService.ts` — add progress update endpoint

**Step 1:** In SavedPlansList, add a "Progress" column showing completion % per plan (count completed tasks / total tasks).

**Step 2:** Add an "Update Progress" action on each task row. This opens an inline form: status dropdown (not-started / in-progress / completed / blocked) + notes field.

**Step 3:** Create `updateTaskProgress(planId, taskId, status, notes)` in planningService.ts → PUT `/api/neo4j/risk-plan/{planId}/task/{taskId}`.

**Step 4:** Add a "Linked Risk" badge on each plan card showing the risk name + current band. Click navigates to the risk in Ontology panel.

**Step 5:** Commit.

---

### Task 4.2: P4+P5 — Risk band downgrade/escalation on plan status

**Requirement:** "risk with intervention plan → Amber. If plan fails → trigger to bump up."

**Current state:** VERIFIED — `getNodeInstanceRag()` in ontologyService.ts already downgrades red→amber when a linked RiskPlan is on-track. The `buildLinkedPlan()` function checks active + not overdue + progress > 20%.

**Step 1:** Verify this works end-to-end by checking: when a RiskPlan's status changes to "failed" or "overdue", does the risk go back to red?

**Step 2:** In `buildLinkedPlan()` (ontologyService.ts:700-717), verify that overdue plans result in `isOnTrack = false`, which means no downgrade — risk stays red.

**Step 3:** If a plan is explicitly "failed" or "cancelled", ensure `isOnTrack = false`. Check the `activeStatuses` list doesn't accidentally include these.

**Step 4:** No code change expected — mark as verified.

---

### Task 4.3: P6+P7 — RAG on plan list and per task

**Requirement:** "list of intervention plans should show RAG at list level and when entering see RAG per task"

**Files:**
- Modify: `frontend/src/components/desks/PlanningDesk.tsx:339-577` — SavedPlansList

**Step 1:** Add RAG indicator on each plan card in the list:
- Green: all tasks on-track, no overdue
- Amber: some tasks delayed but plan still within deadline
- Red: plan overdue or >50% tasks blocked/failed

**Step 2:** Inside a plan (task view), add RAG dot per task row:
- Green: completed or on-track
- Amber: in-progress but behind schedule
- Red: blocked or overdue

**Step 3:** Use same color constants from CSS variables.

**Step 4:** Commit.

---

### Task 4.4: P8+P9+P10 — Rename Reset to Refresh + snapshot page

**Requirement:** "Strategic Reset is not a Reset, it is a REFRESH. Year selection + AI snapshot prompt. Snapshots listed and saved."

**Files:**
- Modify: `frontend/src/components/desks/PlanningDesk.tsx:622-831` — StrategicReset section
- Add: Supabase prompt for `strategic_refresh_snapshot`

**Step 1:** Rename all UI references from "Strategic Reset" to "Strategic Refresh" (labels, headings, tab names).

**Step 2:** Replace the static "Pattern Explorer" with a year selection dropdown + "Generate Snapshot" button.

**Step 3:** The button sends to AI with prompt_key `strategic_refresh_snapshot`, passing: year, current RAG summary, capability statuses, risk profile.

**Step 4:** Display the AI-generated snapshot in a formatted card. Save to Supabase or Neo4j with year + timestamp.

**Step 5:** Add a "Previous Snapshots" list showing all saved snapshots by year.

**Step 6:** Commit.

---

### Task 4.5: P11+P12+P13 — Outcome-based scenario controls + AI analysis

**Requirement:** "scenario controls need to be outcome based — lists outcomes/outputs with modified values + open text. AI output: ruthless non-biased analysis."

**Files:**
- Modify: `frontend/src/components/desks/PlanningDesk.tsx:834-1000` — ScenarioSimulation
- Add: Supabase prompt for `scenario_analysis`

**Step 1:** Replace the 4 dropdown selectors with an outcome-based table:
| Outcome | Current Value | Modified Value | Notes |
Populate from actual sector objectives + KPI targets.

**Step 2:** Add an open text area below the table for additional context/assumptions.

**Step 3:** "Analyze" button sends to AI with prompt_key `scenario_analysis`, passing: all outcomes (current + modified values), notes, current baseline data.

**Step 4:** AI response rendered as a structured card: Viability Assessment, What It Takes, Best Possible Plan, Associated Risks. With a severity badge.

**Step 5:** Save scenario + result to list. Show previous scenarios.

**Step 6:** Commit.

---

## Phase 5: REPORTING DESK (R1–R6) — 6 items

### Task 5.1: R1 — Standard reports tab first

**Requirement:** "start with the standard reports tab not the outcomes one"

**Files:**
- Modify: `frontend/src/components/desks/ReportingDesk.tsx` — tab order

**Step 1:** Change default active tab from ControlOutcomes to StandardReports. Swap the tab order so Standard is first.

**Step 2:** Commit.

---

### Task 5.2: R2+R3+R4+R5 — Three real report examples

**Requirement:** "Weekly PMO, Monthly ExCom, Adaa report. One real example of each based on our data."

**Files:**
- Modify: `frontend/src/components/desks/ReportingDesk.tsx:410-808` — StandardReports
- Add: Supabase prompts for `report_weekly_pmo`, `report_monthly_excom`, `report_adaa`

**Step 1:** Wire the "Generate Report" button to actual data. For each report type:
- **Weekly PMO:** Fetch all EntityProject nodes from `change_to_capability` chain. Show: project name, status, progress %, planned vs actual delta, blockers.
- **Monthly ExCom:** Fetch capabilities + risks + KPIs. Show: program health, operational issues, KPI trends, upcoming project milestones, capability gaps.
- **Adaa:** Fetch sector objectives + performance. Show: strategic alignment, delivery metrics, compliance indicators.

**Step 2:** Use AI to format the narrative sections. Send data + prompt_key to generate the executive summary, areas of concern, and recommendations.

**Step 3:** Create one saved example of each using current Water Sector data.

**Step 4:** Commit.

---

### Task 5.3: R6 — Outcome-based effectiveness measurement

**Requirement:** "measure if interventions have been effective"

**Files:**
- Modify: `frontend/src/components/desks/ReportingDesk.tsx:77-408` — ControlOutcomes

**Step 1:** Wire ControlOutcomes to actual data. For each completed intervention plan:
- Before metrics: risk band at time of intervention
- After metrics: current risk band
- Delta: improvement/degradation
- Effectiveness badge: Success / Partial / Failed

**Step 2:** Pull intervention plans from `fetchAllRiskPlans()` and cross-reference with current risk bands.

**Step 3:** Commit.

---

## Phase 6: SIGNALS DESK (X1–X4) — 4 items

### Task 6.1: X1 — Update chain references

**Requirement:** "still refers to chains we cancelled and split"

**Files:**
- Modify: `frontend/src/components/desks/ExplorerDesk.tsx:28-71` — chain definitions

**Step 1:** Read the 7 chain definitions in ExplorerDesk. Cross-reference with the 4 chains used in ontologyService (`change_to_capability`, `capability_to_policy`, `capability_to_performance`, `sector_value_chain`).

**Step 2:** Remove any chain references that no longer exist in the backend. Add any new chains that were created during the split.

**Step 3:** Verify with NoorMemory for the current canonical chain list.

**Step 4:** Commit.

---

### Task 6.2: X2 — Fix node limit control

**Requirement:** "adjustable node limit doesn't seem to work now"

**Files:**
- Modify: `frontend/src/components/desks/ExplorerDesk.tsx` — limit state + API call
- Modify: `frontend/src/components/desks/GraphSankey.tsx` — node filtering

**Step 1:** Read how `limit` state is used. Check if it's passed to the API call and/or used to filter nodes in GraphSankey.

**Step 2:** If the API supports a limit param, ensure it's passed: `/api/neo4j/chain/{name}?limit=${limit}`.

**Step 3:** If the API doesn't support limit, apply client-side filtering: `nodes.slice(0, limit)`.

**Step 4:** Commit.

---

### Task 6.3: X3+X4 — Diagnose queries (orphans + bastards)

**Requirement:** "highlight break points where path didn't continue. Orphans (abandoned) and bastards (no parent). Red dots on Sankey."

**Current state:** GraphSankey.tsx line 230 already has `isOrphanOrBastard` detection checking `props.status === 'orphan' || props.status === 'bastard'`. Broken nodes are colored red (#ef4444) and placed in a "Gap" column.

**Files:**
- Verify: `frontend/src/components/desks/GraphSankey.tsx:230,265-270`

**Step 1:** Verify the diagnostic query mode actually sets `status: 'orphan'` or `status: 'bastard'` on returned nodes. Check the backend endpoint.

**Step 2:** If the backend doesn't return these statuses, add client-side detection:
- **Orphan:** node has no outgoing relationships (no successors in the chain)
- **Bastard:** node has no incoming relationships (no predecessors)

**Step 3:** Ensure red dots are visible on the Sankey for these nodes.

**Step 4:** Commit.

---

## Phase 7: EXPERT CHAT (C1–C10) — 10 items

### Task 7.1: C1 — Remove recall memory/vision buttons

**Requirement:** "the two buttons recall memory and recall vision are redundant, already in the prompts"

**Files:**
- Modify: `frontend/src/components/chat/ChatToolbar.tsx:22-44` — tool buttons

**Step 1:** Remove the TOOLS array (lines 22-25) and the tool toggle section from the toolbar JSX.

**Step 2:** Remove `selectedTools` and `onToolsChange` props from ChatToolbar.

**Step 3:** Update parent (ChatContainer) to remove tool state management.

**Step 4:** Commit.

---

### Task 7.2: C2+C3 — Fix persona lock per session

**Requirement:** "persona needs rethinking. Once selected it gets locked for that session, yet each message resets the dropdown."

**Files:**
- Modify: `frontend/src/components/chat/ChatToolbar.tsx:55-69` — persona select
- Modify: parent component managing persona state

**Step 1:** The `isPersonaLocked` prop already exists (line 9). Check the parent: does it set this to `true` after first message?

**Step 2:** If not, add logic: after the first message is sent in a conversation, set `isPersonaLocked = true`.

**Step 3:** Ensure the selected persona value persists in state and doesn't reset. Check if the select is controlled (`value={selectedPersona}`) or uncontrolled.

**Step 4:** Commit.

---

### Task 7.3: C4 — Test conversation summary at limit

**Requirement:** "conversation summary when it hits the limit — deployed but not tested"

**Step 1:** This is a testing task, not code. Manually test by sending many messages until context limit is approached.

**Step 2:** Verify the summary mechanism triggers and the conversation continues coherently.

**Step 3:** Document findings. Fix if broken.

---

### Task 7.4: C5 — Update example prompts

**Requirement:** "example prompts need to be more relevant and show the power of the system"

**Files:**
- Modify: `frontend/src/components/chat/ChatContainer.tsx:173-191` — example buttons

**Step 1:** Replace the 4 generic examples with powerful, data-specific ones:
1. "Which capabilities are red and what risks are blocking them?"
2. "Show me the top 3 intervention priorities for this quarter"
3. "Compare Water Sector delivery progress: planned vs actual"
4. "What would happen if we delay the Desalination Expansion project by 6 months?"

**Step 2:** Commit.

---

### Task 7.5: C6 — Restore sidebar date and message count

**Requirement:** "sidebar conversation history had the date and number of msgs, those disappeared"

**Files:**
- Modify: `frontend/src/components/chat/Sidebar.tsx:495-565` — ConversationItem

**Step 1:** Read lines 523-525. The metadata (date + count) should be there. Check if CSS is hiding it.

**Step 2:** If the elements exist but are hidden, fix CSS. If the data isn't being passed, wire it up from the conversation object.

**Step 3:** Commit.

---

### Task 7.6: C7 — Artifact name instead of "html report"

**Requirement:** "instead of the name of the report it still says html report"

**Files:**
- Modify: `frontend/src/components/chat/MessageBubble.tsx` — artifact chip rendering

**Step 1:** Find where artifact chips are rendered. Check the `title` or `name` field.

**Step 2:** If it falls back to "HTML Report", change to use `artifact.title || artifact.name || 'Report'`.

**Step 3:** Commit.

---

### Task 7.7: C8 — Fix back-to-list showing all artifacts

**Requirement:** "back to list button takes you to list of artifacts for that reply, it now only shows the artifact that was opened"

**Files:**
- Modify: artifact viewer component (likely in MessageBubble.tsx or a canvas component)

**Step 1:** Find the "Back to List" handler. Check if it filters to the current message's artifacts or shows only the viewed one.

**Step 2:** Fix: reset viewed artifact index to null, which should show the full list for that message.

**Step 3:** Commit.

---

### Task 7.8: C9 — Change user bubble color

**Requirement:** "user bubble needs to change from green to another color to be more readable"

**Files:**
- Modify: CSS file for message bubbles (MessageBubble.css or chat CSS)

**Step 1:** Find `.message-avatar--user` or `.message-bubble--user`. Change background from green to a professional blue:
```css
.message-avatar--user { background: var(--component-text-accent); }  /* Gold to match brand */
```

**Step 2:** Or use `#3b82f6` (blue-500) for better readability contrast.

**Step 3:** Commit.

---

### Task 7.9: C10 — Replace "agency" with "SWA" in prompts

**Requirement:** "references in all the prompts talk about 'an agency' — need to make it clear it is SWA"

**Files:**
- Supabase: `instruction_elements` table — all prompt templates

**Step 1:** This is a DATABASE change, not frontend code. Query Supabase for all instruction_elements containing "agency" or "an agency".

**Step 2:** Replace with "Saudi Water Authority (SWA)" or "SWA" in all prompts.

**Step 3:** This may require backend access. If frontend can't update, document the specific rows to change.

**Step 4:** Commit if any frontend references exist.

---

## Phase 8: TUTORIALS (TU1–TU2) — 2 items

### Task 8.1: TU1 — Visual refresh

**Requirement:** "look and feel needs another pass"

**Files:**
- Modify: `frontend/src/components/desks/TutorialsDesk.tsx`
- Modify: associated CSS files

**Step 1:** Read current styling. Apply consistent design tokens (border-radius, shadows, spacing) matching the rest of the desktop.

**Step 2:** Commit.

---

### Task 8.2: TU2 — YouTube embed links

**Requirement:** "videos and audios are now hosted on youtube, change links from local to embed"

**Files:**
- Modify: `frontend/src/data/knowledge.json` — episode URLs
- Modify: `frontend/src/components/chat/renderers/TwinKnowledgeRenderer.tsx:66-72` — video rendering

**Step 1:** Update `knowledge.json` episode entries with YouTube URLs:
```json
{ "videoUrl": "https://www.youtube.com/embed/VIDEO_ID" }
```

**Step 2:** In TwinKnowledgeRenderer, change video rendering from `<video>` tag to `<iframe>` for YouTube embeds:
```tsx
<iframe src={videoUrl} allowFullScreen frameBorder="0" />
```

**Step 3:** Handle both local and YouTube URLs — if URL contains "youtube", use iframe; else use video tag.

**Step 4:** Commit.

---

## Phase 9: SETTINGS (T2–T4) — 3 items

### Task 9.1: T2+T3 — Multiple LLM provider support

**Requirement:** "support multiple LLM providers with different sub-features. Use Supabase column listing features per provider."

**Files:**
- Modify: `frontend/src/components/desks/SettingsDesk.tsx:168-238` — provider settings
- Read: Supabase `provider_features` column

**Step 1:** Fetch provider list from Supabase (or a settings API). Each provider has: name, supported features (e.g., tool_use, response_schema, vision, streaming).

**Step 2:** Add a provider dropdown. When selected, show only the settings relevant to that provider's supported features.

**Step 3:** Hide unsupported toggles (e.g., hide "Enable MCP Tools" if provider doesn't support tool_use).

**Step 4:** Commit.

---

### Task 9.2: T4 — Graph RAG semantic context injection

**Requirement:** "feature of injecting graph RAG semantic context that we never activated"

**Files:**
- Modify: `frontend/src/components/desks/SettingsDesk.tsx` — add toggle
- Modify: chat service to pass graph context when enabled

**Step 1:** Add a settings toggle: "Enable Graph RAG Context" in the settings card.

**Step 2:** When enabled, before each AI call, fetch relevant graph context (nearby nodes, relationships) and prepend to the prompt as structured context.

**Step 3:** Store the setting in Supabase alongside other provider settings.

**Step 4:** Commit.

---

## Phase 10: OBSERVABILITY (B1–B5) — 5 items

### Task 10.1: B1+B2+B3 — Fix message display and field parsing

**Requirement:** "messages sometimes don't appear. LLM output parsing drops fields. Reasoning not always appearing."

**Files:**
- Modify: Observability desk component (ObservabilityDesk.tsx)
- Modify: LLM response parser that extracts observability fields

**Step 1:** Read the observability desk component. Find where messages are fetched from Supabase.

**Step 2:** Check pagination — if long threads exceed page size, messages may be cut off. Increase limit or add pagination.

**Step 3:** Find the response parser. Check which fields it extracts (reasoning, tool_calls, tokens, latency). Fix any regex or JSON parsing that drops fields.

**Step 4:** For reasoning: check if the parser looks for `<thinking>` tags or `reasoning` field in the LLM response. Ensure both patterns are handled.

**Step 5:** Commit.

---

### Task 10.2: B4 — Improve error message display

**Requirement:** "error messages are cryptic"

**Files:**
- Modify: Observability desk — error display section

**Step 1:** Find where errors are shown. Replace raw error strings with human-readable messages:
- "ECONNREFUSED" → "Cannot reach LLM server — check if it's running"
- "context_length_exceeded" → "Message too long — conversation needs summarization"
- "rate_limit" → "Too many requests — wait and retry"

**Step 2:** Show the raw error in an expandable "Technical Details" section.

**Step 3:** Commit.

---

### Task 10.3: B5 — Fix MCP tool call counting

**Requirement:** "MCP tool calls sometimes counted and sometimes not"

**Files:**
- Modify: Observability desk — tool call parsing

**Step 1:** Find where MCP tool calls are counted. Check the parser for the tool_use content blocks in the LLM response.

**Step 2:** Ensure ALL tool_use blocks are counted, including those with `type: 'tool_use'` in the content array (Anthropic format) and `tool_calls` in the message object (OpenAI format).

**Step 3:** Commit.

---

## Execution Order (Recommended)

| Priority | Phase | Items | Effort | Impact |
|----------|-------|-------|--------|--------|
| P0 | Phase 1 (Ontology) | 16 | HIGH | Core dashboard — most visible |
| P0 | Phase 3 (Decide) | 17 | HIGH | Capability matrix — most complex |
| P1 | Phase 2 (Observe) | 9 | MEDIUM | Sector desk fixes |
| P1 | Phase 7 (Chat) | 10 | MEDIUM | Chat UX fixes — user-facing |
| P2 | Phase 4 (Deliver) | 13 | HIGH | Progress tracking — new feature |
| P2 | Phase 5 (Reporting) | 6 | HIGH | New reports — needs AI prompts |
| P3 | Phase 6 (Signals) | 4 | LOW | Chain reference updates |
| P3 | Phase 8 (Tutorials) | 2 | LOW | Video link swap |
| P3 | Phase 9 (Settings) | 3 | MEDIUM | Provider config |
| P3 | Phase 10 (Observability) | 5 | MEDIUM | Parsing fixes |

**Total: 90 items across 10 phases, ~35 tasks (some tasks cover multiple items).**
