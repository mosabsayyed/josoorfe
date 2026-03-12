# Requirements Implementation Plan — Self-Contained

> **For any Claude session:** This plan is SELF-CONTAINED. Each task has full context (file paths, line numbers, current code state, exact steps). You do NOT need external docs. Search NoorMemory for "RequirementsPlan_2026_03_06" for status updates.

**Source:** `docs/RAW_REQUIREMENTS.md` (user audit 2026-03-06)
**Total:** 90 requirements across 11 sections
**Verified DONE:** 5 (S1-S4, T1)
**Remaining:** 85

---

## HOW TO USE THIS PLAN

1. **On session start:** Read this file + search NoorMemory for `RequirementsPlan_2026_03_06`
2. **Find next unchecked task** (marked with `[ ]`)
3. **Read the "Current State" section** — it tells you exactly what exists
4. **Follow the "Steps" section** — each step is atomic and verifiable
5. **After completing a task:** Mark it `[x]`, update NoorMemory with observation
6. **Before compaction:** Save progress to NoorMemory + update this file

---

## PHASE 0: VERIFIED DONE (5 items)

- [x] **S1** — BIOS screen always English LTR → `JosoorDesktopPage.tsx:545` has `dir="ltr"` hardcoded
- [x] **S2** — Remember language → `LanguageContext.tsx:17,33` uses `localStorage.getItem('jos-lang')`
- [x] **S3** — Remember theme → `JosoorDesktopPage.tsx:119,641` uses `localStorage.getItem('jos-theme')`
- [x] **S4** — Remember date → `JosoorDesktopPage.tsx:110-115` uses `jos-year`, `jos-quarter`
- [x] **T1** — Settings save to DB → `adminSettingsService.ts:17-20` uses `apiClient.put('/api/admin/settings')`

---

## PHASE 1: ONTOLOGY DESK (H1-H16)

### [x] H1 — Eliminate impossible yellow/default lines

**User said:** "I still see solid yellow lines (an impossible state)"

**Current State:**
- `OntologyHome.css:143-148`: `.ont-rel-line--default` is styled as `color: #ef4444; opacity: 0.7` (red, not yellow)
- `OntologyHome.css:135-140`: `.ont-rel-line--red` is solid red, no animation
- `ontologyService.ts:724-773`: `computeLineFlowHealth()` returns green/amber/red for all 22 CONNECTION_PAIRS. Returns 'default' only when BOTH node types have zero instances in chain data.
- `OntologyHome.tsx:122-127`: `getLineRag()` checks `lineRag[from->to]` then `lineRag[to->from]`, fallback 'default'

**Root Cause:** If a connection pair is NOT in CONNECTION_PAIRS (ontologyService.ts:138-162), its line gets 'default'. The SVG has 27 hardcoded connection groups (OntologyHome.tsx:231-417), but CONNECTION_PAIRS has only 22 entries. The 5 missing pairs always render as 'default'.

**Steps:**
1. Read `ontologyService.ts:138-162` — list all 22 CONNECTION_PAIRS
2. Read `OntologyHome.tsx:231-417` — list all 27 SVG connection groups
3. Find the 5 missing pairs. Cross-reference to identify which SVG `<g>` groups lack a CONNECTION_PAIR entry
4. Add the missing pairs to CONNECTION_PAIRS array
5. Verify `.ont-rel-line--default` CSS is red (not yellow) — already confirmed
6. If user still sees yellow: check if browser cache serves old CSS. Add cache-buster comment

**Files to modify:** `ontologyService.ts` (add missing CONNECTION_PAIRS)

---

### [ ] H2 — RAG coverage for all node types (ppl, process, tool)

**User said:** "some nodes are not covered (ppl, process, tool) which breaks the link to projects"

**Current State:**
- `ontologyService.ts:334-534`: `getNodeInstanceRag()` already handles ALL 16+ entity types including:
  - EntityOrgUnit (lines 415-425): gap=1 → amber, gap=0 → green
  - EntityProcess (lines 427-449): actual/target ratio or trend
  - EntityITSystem (lines 451-461): status active/developing/planned
  - EntityVendor (lines 478-497): rating/sla_compliance
  - EntityCultureHealth (lines 499-520): survey_score/target or trend
- `ontologyService.ts:102-121`: LABEL_TO_NODE_KEY maps 21 Neo4j labels to node keys

**Root Cause:** The RAG handlers exist but may not receive data if chains don't return these node types. Need to verify which chains return OrgUnit/Process/ITSystem nodes.

**Steps:**
1. Add console.log in `fetchOntologyRagState()` after line 896 to dump `allNodesByType` keys and counts
2. Run in browser, check which node types have zero instances
3. For any missing types: check if the 7 fetched chains include those labels. The chains are:
   - `change_to_capability` — returns EntityProject, EntityChangeAdoption, EntityProcess, EntityCapability, EntityOrgUnit, EntityITSystem (per NoorMemory)
   - `capability_to_policy` — returns EntityCapability, EntityRisk, SectorPolicyTool, SectorObjective
   - `capability_to_performance` — returns EntityCapability, EntityRisk, SectorPerformance, SectorObjective
   - `sector_value_chain` — returns SectorObjective, SectorPerformance, SectorPolicyTool + stakeholders
   - `sustainable_operations` — returns EntityCultureHealth, EntityVendor, EntityOrgUnit, EntityProcess, EntityITSystem
   - `setting_strategic_initiatives` — returns SectorObjective, EntityChangeAdoption
   - `setting_strategic_priorities` — returns SectorObjective, EntityOrgUnit, EntityProcess, EntityITSystem
4. If data exists but isn't mapped: fix LABEL_TO_NODE_KEY
5. If data doesn't exist in chains: this is a backend/data issue, not frontend

**Files to modify:** `ontologyService.ts` (potentially add label mappings or chain fetches)

---

### [ ] H3+H12 — Node RAG tinting for all shape types

**User said:** "every shape needs a status... buildings=diamond on top, grey platform=top shape changes color, circular=fully ragged"

**Current State:**
- `OntologyHome.tsx:420-516`: Overlay rendering exists for all shapes:
  - Buildings (w>400): Pre-colored diamond SVGs (rag-green.svg, rag-yellow.svg, rag-red.svg) at `pos.x + w/2 - 62, pos.y + 71`, size 124x111
  - Coins (w<210): Pre-colored coin SVGs (coin-green.svg etc), centered, 192x161
  - Admin platforms (adminRecords, dataTransactions): Pre-colored admin SVGs at 70% scale
  - Operations platforms (orgUnits, processes, itSystems): Pre-colored operations SVGs stretch-to-fill
- `OntologyHome.css:165-202`: CSS classes exist for `.ont-node-diamond--green/amber/red` with drop-shadow + pulse

**Potential Issue:** The user may see nodes stuck on 'default' (no overlay rendered) because `imgSrc` is undefined when `rag === 'default'`. Line 453-456: `const imgSrc = isBuilding ? buildingSrc[rag] : ...` — buildingSrc has keys green/amber/red but NOT 'default'.

**Steps:**
1. Visual test in browser: open Ontology desk, verify each shape type shows RAG color
2. Check if any nodes show NO overlay (meaning rag='default' and imgSrc=undefined)
3. If 'default' nodes exist: either fix the data (H2 above) or add a gray/neutral overlay for 'default' state
4. Verify hue-rotate values produce correct colors on screen (green ≈ 131°, amber ≈ 41°, red ≈ 11°)
5. The `.ont-node-tint--*` classes in CSS (lines 172-178) exist but are NOT used in the TSX. The TSX uses `.ont-node-diamond--*` classes instead. Verify this is intentional.

**Files to modify:** `OntologyHome.tsx` (add default overlay handling), possibly `OntologyHome.css`

---

### [ ] H4+H5 — Bottom-up RAG chain aggregation (BUILD + OPERATE modes)

**User said:** "it is all bottom up. if risk is pushing reds to policy and perf then they should be red too... In build mode it starts with change and keeps going up till objectives, and in operate mode it starts with enterprise elements till objectives"

**Current State:**
- `ontologyService.ts:655-720`: Bottom-up propagation ALREADY IMPLEMENTED with two chains:
  ```
  BOTTOM_UP_BUILD: projects→capabilities, changeAdoption→capabilities, capabilities→risks, risks→policyTools, risks→performance, policyTools→sectorObjectives, performance→sectorObjectives
  BOTTOM_UP_OPERATE: orgUnits→capabilities, processes→capabilities, itSystems→capabilities, vendors→capabilities, cultureHealth→capabilities, capabilities→risks, risks→policyTools, risks→performance, policyTools→sectorObjectives, performance→sectorObjectives
  ```
- Propagation logic (lines 700-718): RED source → target becomes RED. AMBER source → GREEN target becomes AMBER.
- Both chains run sequentially (build first, then operate)

**Potential Issue:** The aggregation uses `nodeRag[source]` which is the per-building aggregate, not per-instance. If a node type has 100 green instances and 1 red instance, the aggregate may be 'red' (correct per user's rule — worst child wins). Need to verify the aggregate logic at lines 613-653 picks the worst case.

**Steps:**
1. Read `ontologyService.ts:613-653` — verify aggregate picks worst-case (it does: `hasHighPriorityRed → red`)
2. Add diagnostic logging after line 720 to print the nodeRag after propagation
3. Test in browser: if a risk node is red, verify policyTools and performance show red, and sectorObjectives shows red
4. If propagation isn't visible: check if the overlay rendering reads from `ragState.nodeRag[key]` correctly (OntologyHome.tsx:119)
5. Verify that adminRecords, dataTransactions, riskPlans also participate in propagation (they may be missing from both chains)

**Files to modify:** `ontologyService.ts` (add missing nodes to chains if needed, fix aggregate if broken)

---

### [ ] H6+H7 — Side panel: ID, traceability, CTA, drill-down to culprit

**User said:** "side panels are still a mess, random data, broken traceability, no CTA, consistently missing the ID... drill down to culprit then use an AI button to analysis the risk/issue"

**Current State:**
- `OntologyHome.tsx:521-949`: Panel exists with:
  - Verdict banner (lines 593-603): counts + health assessment
  - Health bar (lines 606-623): visual RAG segments
  - Key insight (lines 626-635): top red impact statement
  - Priority list (lines 638-901): top 3 reds+ambers by triage score
  - Each item shows: name, domain_id(?), context, impact/urgency/priority breakdown
  - Trace breadcrumb (lines 725-773): back button + trail
  - Linked nodes (lines 774-827): upstream + downstream clickable chips
  - Mitigation plans (lines 828-864): linked RiskPlans
  - CTAs (lines 922-939): "Investigate in Enterprise Desk" + "Ask AI Advisor"

**Issues to verify:**
1. Does `inst.props.domain_id` or `inst.id` actually render? Check line ~640-670 for the card header
2. Are CTAs functional? "Investigate in Enterprise Desk" — does it navigate? "Ask AI Advisor" — does it call AI?
3. Is traceability working? Click a linked node → does it show that node's connections?
4. "Random data" — are the impact/urgency numbers meaningful or placeholder?

**Steps:**
1. Read OntologyHome.tsx lines 638-680 — find where each issue card renders its header. Verify domain_id is shown
2. If domain_id missing: add `<span>{inst.props.domain_id || inst.id}</span>` to card header
3. Read lines 922-939 — verify CTA button onClick handlers. "Investigate" should navigate to enterprise desk. "Ask AI Advisor" should open chat with context
4. Read lines 725-773 — verify trace path navigation works (push/pop tracePath array)
5. Verify issue cards show meaningful data: impact should come from `computeImpactScores()` BFS, urgency from `computeUrgency()` per-type logic
6. Root cause of "random data": if chain data returns sparse properties, the RAG handlers fall to defaults. Cross-check with H2 findings

**Files to modify:** `OntologyHome.tsx` (fix missing ID, verify CTAs, improve card content)

---

### [ ] H8 — AI-generated dynamic status narrative

**User said:** "the status row... should tell the story... use an AI call to get a short paragraph to insert, loaded dynamically"

**Current State:**
- `OntologyHome.tsx:178-208`: Strip renders static narratives from `COLUMN_NARRATIVES`
- `ontologyService.ts:777-791`: `COLUMN_NARRATIVES` are template strings like "Priorities on track" / "N objectives at risk"
- No AI call exists for narrative generation

**Steps:**
1. Add new prompt_key `ontology_status_narrative` to Supabase `instruction_elements` table. Prompt should say: "Given RAG counts per column, write a 2-3 sentence executive status summary. Be concise and actionable."
2. In `OntologyHome.tsx`, after `fetchOntologyRagState()` resolves (line 97), fire an async call:
   ```typescript
   const narrativePayload = JSON.stringify(ragState.stripData);
   chatService.sendMessage({ content: narrativePayload, prompt_key: 'ontology_status_narrative' });
   ```
3. Store AI response in state: `const [aiNarrative, setAiNarrative] = useState<string>('')`
4. Replace static narrative in strip with AI narrative. Show skeleton while loading.
5. Cache in sessionStorage so it doesn't re-fetch on re-renders

**Files to modify:** `OntologyHome.tsx` (add AI call + state), Supabase (add prompt row)
**Dependencies:** Working chat API endpoint

---

### [ ] H9 — Wire year/quarter filters

**User said:** "Ontology is not wired with the year/q filters"

**Current State:**
- `JosoorDesktopPage.tsx:110-115`: Year/quarter state exists and is passed to child desks
- `ontologyService.ts:831-832`: `fetchOntologyRagState()` reads year from `localStorage.getItem('jos-year')` or current year
- `chainsService.ts:52-91`: `fetchChainCached(chainName, year=0)` — year=0 means ALL years
- Chain calls in ontologyService.ts:867-875 use `fetchChain(name)` which calls `fetchChainCached(name, 0)` — hardcoded year=0

**Root Cause:** Year is read but NOT passed to chain fetches. `fetchChain()` always uses year=0.

**Steps:**
1. Modify `fetchOntologyRagState()` to accept `year` and `quarter` params
2. Pass year to `fetchChainCached(name, year)` instead of hardcoded 0
3. In `OntologyHome.tsx`, receive year/quarter props from JosoorDesktopPage and pass to service
4. Add re-fetch on year/quarter change: `useEffect(() => { refetch() }, [year, quarter])`
5. Invalidate chain cache when year changes: call `invalidateChainCache()` before refetch
6. Verify: changing year in desktop header should reload ontology data

**Files to modify:** `ontologyService.ts` (pass year param), `OntologyHome.tsx` (accept + pass year/quarter props), `JosoorDesktopPage.tsx` (pass year/quarter to OntologyHome)

---

### [ ] H10 — Sector indicator (show Water Sector)

**User said:** "nothing indicating this for a specific Sector, yet in our case we built the demo based on the Water Sector"

**Current State:**
- `OntologyHome.tsx:162-176`: Header strip has 5 column labels but no sector indicator
- No sector name or badge anywhere in the ontology view

**Steps:**
1. Add sector badge to header strip or above it: "Water Sector" / "قطاع المياه"
2. Use i18n keys: add `josoor.ontology.sectorLabel` = "Water Sector" (en), "قطاع المياه" (ar)
3. Style as a subtle badge: `background: var(--sector-water)` or similar theme variable
4. Position: top-left of header strip, before column labels

**Files to modify:** `OntologyHome.tsx` (add badge), `en.json` + `ar.json` (add i18n keys), `OntologyHome.css` (badge styling)

---

### [ ] H11 — Canvas 5% smaller

**User said:** "The full view of the canvas should be smaller by 5%"

**Current State:**
- `OntologyHome.css:56-60`: `.ont-landscape-wrap` has `width: 100%; aspect-ratio: 5838/2581`
- No max-width constraint

**Steps:**
1. Change `.ont-landscape-wrap` to `width: 95%; margin: 0 auto;`
2. Verify the 5% reduction looks correct in browser
3. Test RTL layout still works

**Files to modify:** `OntologyHome.css`

---

### [ ] H13 — Totals positioned near each node on the visual

**User said:** "totals are better positioned on the visual dashboard near each node"

**Current State:**
- Node instance counts are only in the side panel and strip, NOT on the SVG canvas
- `NODE_POS` (OntologyHome.tsx:23-39) has x/y/w/h for each node

**Steps:**
1. For each node in NODE_POS, render a small SVG `<text>` or `<foreignObject>` badge near the node showing instance count and RAG breakdown
2. Format: "45" (total) with small colored dots (green/amber/red counts)
3. Position: offset from node center, e.g. `x: pos.x + pos.w/2, y: pos.y - 15`
4. Style: small font (12px), semi-transparent background, theme-aware colors
5. Only show when ragState is loaded

**Files to modify:** `OntologyHome.tsx` (add SVG text elements), `OntologyHome.css` (badge styling)

---

### [ ] H14 — Totals near each line

**User said:** "Totals near each line"

**Current State:**
- `ontologyService.ts:724-773`: `computeLineFlowHealth()` returns `lineDetails` with `fromTotal`, `fromConnected`, `toTotal`, `toConnected`, `connectivity`
- `OntologyHome.tsx:47-72`: `LINE_LABELS` has midpoint coordinates (mx, my) for each connection — but these are NOT rendered

**Steps:**
1. For each connection in LINE_LABELS, render a small SVG badge at (mx, my) showing connectivity % or connected/total counts
2. Format: "85%" or "34/40" — concise
3. Style: small pill background matching line RAG color, white text
4. Use LINE_LABELS rotation (rot) for angled labels if needed
5. Ensure badges don't overlap — adjust positions manually if needed

**Files to modify:** `OntologyHome.tsx` (render line stats), `OntologyHome.css` (line badge styling)

---

### [ ] H15+H16 — Line relation names + two-way arrow labels

**User said:** "each line should have the relation name... two-way arrows means two relations depending on direction, no overlaps"

**Current State:**
- `OntologyHome.tsx:47-72`: `LINE_LABELS` already has `name` and `nameAr` for each connection (e.g. 'ROLE_GAPS', 'MONITORED_BY') plus midpoint (mx, my) and rotation (rot)
- These labels are defined but NOT rendered in the SVG

**Steps:**
1. For each entry in LINE_LABELS, render a `<text>` element at (mx, my) with rotation
2. For two-way connections: render both labels with slight vertical offset to avoid overlap
3. Use small font (10-11px), semi-transparent background rect behind text for readability
4. Language-aware: use `name` for English, `nameAr` for Arabic
5. Handle RTL: when dir="rtl", the SVG is flipped via scaleX(-1) — text needs counter-flip

**Files to modify:** `OntologyHome.tsx` (render labels), `OntologyHome.css` (label styling)

---

## PHASE 2: OBSERVE / SECTOR DESK (O1-O9)

### [ ] O1 — Parse-free sector outputs/investments

**User said:** "we changed the db entries for sector outputs and investments to be parse-free"

**Current State:**
- `SectorDetailsPanel.tsx:55-194`: ALREADY migrated to structured fields
  - `getCapacityValue()` checks `asset.capacity_value` first, falls back to parsing `capacity_metric`
  - `formatInvestment()` reads `investment_value`/`investment_currency` first, falls back to parsing `investment` string
- Frontend already handles parse-free + fallback

**Verdict:** LIKELY DONE. Needs visual verification in browser.

**Steps:**
1. Open Sector desk in browser, click a water asset
2. Check if capacity and investment show correctly from structured fields
3. If still parsing strings: check Neo4j data — do nodes have `capacity_value`, `investment_value` properties?
4. Search NoorMemory for "parse-free" for any backend migration status

**Files to verify:** `SectorDetailsPanel.tsx:55-194`

---

### [ ] O2 — Hide empty L2 policy/capability entries in side panel

**User said:** "when there is no L2 policy and hence cap, it shows empty entries which is not right"

**Current State:**
- `SectorDetailsPanel.tsx:575-577`: Dropdown shows `<option value="">--</option>` as empty placeholder
- When no L2 policy exists for a delivery program, the panel still renders empty sections

**Steps:**
1. Read SectorDetailsPanel.tsx policy tool view (lines 494-664)
2. Find where programs/capabilities are rendered when there's no L2 policy
3. Add conditional: if no L2 policy linked, show "No linked policy tools" message instead of empty table
4. Same for capabilities: if no capability linked, show informative message

**Files to modify:** `SectorDetailsPanel.tsx`

---

### [ ] O3 — Capability strip status should match capability matrix

**User said:** "The status of the capabilities in the color strip is not correct, it should match the status used in the capability matrix"

**Current State:**
- SectorDetailsPanel shows capabilities as text labels (e.g. "Policy & Regulation Capability") with no numeric health/strip
- Enterprise desk (CapabilityMatrix) uses `getL3StatusColor()` from `enterpriseStatusUtils.ts` which checks `execute_status`, `build_status`, `kpi_achievement_pct`
- Sector desk does NOT use the same status logic

**Steps:**
1. Find where capability status is displayed in SectorDetailsPanel
2. Import `getL3StatusColor()` from `enterpriseStatusUtils.ts`
3. Apply same color logic to capability displays in sector desk
4. Verify the capability node has the same properties (execute_status, build_status) in the sector chain data

**Files to modify:** `SectorDetailsPanel.tsx` (import + apply enterprise status logic)

---

### [ ] O4 — Click capability opens capability matrix + auto-opens side panel

**User said:** "When I click on a capability from this tree, it is supposed to open the capability matrix (app) and auto open the sidepanel there with that capability"

**Current State:**
- SectorDetailsPanel shows capabilities in a tree but clicking does NOT navigate
- No cross-desk navigation mechanism exists for "open Enterprise desk with specific capability selected"

**Steps:**
1. Add onClick handler to capability items in SectorDetailsPanel
2. Handler calls a navigation callback (prop from parent): `onNavigateToCapability(capabilityId)`
3. In JosoorShell: add handler that sets view to 'enterprise-desk' and passes `initialCapabilityId` prop
4. In EnterpriseDesk: accept `initialCapabilityId` prop, auto-select that L3 and open detail panel
5. Wire through: SectorDetailsPanel → SectorDesk → JosoorDesktopPage → JosoorShell → EnterpriseDesk

**Files to modify:** `SectorDetailsPanel.tsx`, `JosoorShell.tsx` or `JosoorDesktopPage.tsx`, `EnterpriseDesk.tsx`

---

### [ ] O5 — Map doesn't update on fullscreen

**User said:** "The map does not update when the app changes size to full screen"

**Current State:**
- `SectorMap.tsx:872-878`: Mapbox uses `initialViewState` (uncontrolled mode), no `viewState` prop
- `SectorMap.tsx:893`: `<FullscreenControl position="top-right" />` (Mapbox built-in)
- No ResizeObserver or window resize handler
- Mapbox in uncontrolled mode should auto-resize via CSS, but sometimes needs `map.resize()` call

**Steps:**
1. Add a ResizeObserver on the map container element
2. On resize, call `mapRef.current?.resize()` to force Mapbox to recalculate
3. Alternative: listen for `fullscreenchange` event and call `map.resize()` after transition
4. Test: enter fullscreen → map should fill entire screen without blank areas

**Files to modify:** `SectorMap.tsx` (add resize handler)

---

### [ ] O6 — Asset state changes with year filter

**User said:** "assets state (existing / planned) should change with the year filter, it remains the same. if its due 2027, then the state should change to existing"

**Current State:**
- `SectorMap.tsx:125-131`: STATUS_COLORS maps "Existing", "Planned", "Under Construction", "Future"
- Asset `status` is a static property from Neo4j — NOT recalculated based on year
- Year filter is applied at parent level before assets reach SectorMap

**Steps:**
1. Add temporal status logic: if `asset.planned_completion_year <= selectedYear`, treat as "Existing"
2. Implement in parent (SectorDesk.tsx) or in SectorMap before rendering
3. Check what date fields exist on asset nodes: `planned_completion_year`, `due_date`, `completion_date`
4. Map: if year selected = 2027 and asset due = 2027 → status = "Existing" for display purposes
5. This is a VIEW transformation, not a data mutation

**Files to modify:** Parent component that passes assets to SectorMap (likely SectorDesk.tsx)

---

### [ ] O7 — Third pillar should have no programs

**User said:** "there should be no programs for the third pillar but it seems it shows all programs when selected"

**Current State:**
- `waterHighLevelHierarchy.ts:460`: Third pillar "Ambitious" has empty L1 array (`l1: []`)
- `SectorHeaderNav.tsx:447-467`: Pillar dropdown shows all 3 pillars
- Filtering logic at parent level may not properly filter programs when "Ambitious" is selected

**Steps:**
1. Read the parent component (SectorDesk.tsx) to find how pillar selection filters programs
2. When "Ambitious" pillar selected: verify that the filter correctly returns zero programs
3. If it shows all programs: the filter likely falls through to "show all" when no L1s exist
4. Fix: if selected pillar has no L1s, return empty program list (not all programs)

**Files to modify:** SectorDesk.tsx or wherever pillar→program filtering happens

---

### [ ] O8 — No orphan programs under first two pillars

**User said:** "under the first two pillars all the delivery programs and water assets are reflected, no orphans"

**Current State:**
- `waterHighLevelHierarchy.ts:216-337`: 12 execution programs defined with `linkedPrograms` arrays on L3 items
- Some programs may not be linked to any L3 item, making them orphans

**Steps:**
1. Compare the 12 defined programs against all `linkedPrograms` references in the hierarchy
2. List any programs not referenced by any L3 item
3. If orphans found: add them to appropriate L3 `linkedPrograms` arrays
4. Verify in browser: selecting Pillar 1 or 2 should show ALL relevant programs

**Files to modify:** `waterHighLevelHierarchy.ts` (link orphan programs)

---

### [ ] O9 — RAG aggregation upward: cap → policy → program → objectives

**User said:** "Once the capabilities status is correct, it needs to aggregate upwards to show the RAG"

**Current State:**
- Sector desk does NOT have RAG aggregation — it shows static status
- Ontology desk has bottom-up RAG propagation (H4+H5) but sector desk doesn't use it
- Sector desk would need its own chain-based aggregation from capability status upward

**Steps:**
1. After O3 is done (capability status matches matrix): use those status values
2. Aggregate: for each policy tool, worst-case of its linked capabilities
3. For each delivery program, worst-case of its linked policy tools
4. For each sector objective, worst-case of its linked programs
5. Display aggregated RAG on the sector tree/hierarchy view
6. Reuse ontology RAG propagation logic if possible (import from ontologyService)

**Files to modify:** `SectorDetailsPanel.tsx` or new utility, possibly import from `ontologyService.ts`
**Dependencies:** O3 must be done first

---

## PHASE 3: DECIDE / ENTERPRISE DESK (D1-D17)

### [ ] D1 — Remove description from L2 cell to prevent overflow

**User said:** "the L2 has a lot of text and ends up overflowing on to other cells under it, remove the description line from the cell"

**Current State:**
- `CapabilityMatrix.tsx:168`: `<div class="cell-description">{l2.description}</div>` renders inside L2 cell
- `CapabilityMatrix.css:65-70`: `.cell-description` has font-size 11px, no truncation or overflow control

**Steps:**
1. Remove or comment out the description div from L2 cell rendering (CapabilityMatrix.tsx:168)
2. Keep L2 cell showing only: ID, name, maturity, KPI label (same as L1 and L3)
3. Move description to the L2 detail panel (it's already there at CapabilityDetailPanel.tsx:828+)

**Files to modify:** `CapabilityMatrix.tsx` (remove line 168)

---

### [ ] D2 — Clarify or remove "KPI-" label

**User said:** "l1 and l2 have a KPI- under them, I don't know what this is and what it is supposed to do"

**Current State:**
- `CapabilityMatrix.tsx:137-138` (L1), `175-177` (L2): Shows "KPI" label + rollup percentage
- `CapabilityMatrix.css:93-102`: `.cell-kpi-rollup` styled as gold pill
- Value from `getL1RollupPct()` / `getL2RollupPct()` — averages child KPI achievement percentages

**Steps:**
1. Make the KPI label more descriptive: change from "KPI" to "KPI Achievement" or show the actual percentage with context
2. Add tooltip on hover explaining: "Average KPI achievement of child capabilities"
3. If user wants it removed entirely: remove the `.cell-kpi-rollup` div
4. Discuss with user: is this useful information? If yes, improve labeling. If no, remove.

**Files to modify:** `CapabilityMatrix.tsx` (improve or remove KPI label)

---

### [ ] D3 — Side panels: meaningful data, clear purpose, trace problems

**User said:** "THE MAJOR problem is the sidepanels, they continue to be massive dumps of data with no clear purpose to the reader and does not help trace problems"

**Current State:**
- `CapabilityDetailPanel.tsx` (1148 lines): L2 panel has 7 sections, L3 panel has 5-6 sections
- L2 sections: L3 children, KPI gauge, maturity, formula & inputs, upward links, projects, risk
- L3 BUILD: timeline, maturity, stage gate, projects, risk
- L3 OPERATE: KPI gauge, regression risk, process metrics, operating entities, risk

**This is a DESIGN task.** The panel needs restructuring to tell a story: "Here's the status → here's why → here's what to do."

**Steps:**
1. Restructure L3 OPERATE panel to this order:
   a. **Status** (top): KPI gauge + maturity blocks side-by-side
   b. **Why** (middle): "What's causing this?" — show the worst process metric or regression dimension
   c. **Root cause** (expandable): process metrics, operating entities
   d. **Action** (bottom): Risk profile + CTA buttons ("Intervene", "Ask AI")
2. Restructure L3 BUILD panel similarly:
   a. **Status**: Stage gate progress (are we on track?)
   b. **Why**: Timeline — late/on-track, expected vs actual dates
   c. **Root cause**: Projects grouped by gap type
   d. **Action**: Risk + CTA
3. Restructure L2 panel:
   a. **Status**: KPI gauge + maturity
   b. **Children overview**: Two blocks (operational + under construction) — KEEP but make more compact
   c. **Upward link**: Simplify to breadcrumb only (L2 cap → L2 perf → L1 perf → L1 obj)
   d. **Action**: CTA
4. Remove or collapse "Formula & Inputs" section — user finds it confusing

**Files to modify:** `CapabilityDetailPanel.tsx` (major restructure), `CapabilityDetailPanel.css`

---

### [ ] D4 — L2 panel: "L3 cap in operation" shown before status

**User said:** "L2: L3 cap in operation, why is this the first thing before the status?"

**Current State:**
- `CapabilityDetailPanel.tsx:828-956`: L2 panel renders L3 children section FIRST (lines 942-956), then KPI gauge (963-970)

**Steps:**
1. Reorder L2 panel: move KPI gauge + maturity to TOP, L3 children below
2. This is part of D3 restructure — handle together

**Files to modify:** `CapabilityDetailPanel.tsx` (reorder sections)

---

### [ ] D5 — Remove "Formula & Inputs" section

**User said:** "L2 formula and inputs, what formula?! this is a capability"

**Current State:**
- `CapabilityDetailPanel.tsx:975-1063`: "L2 Formula & Inputs" section shows L3 process metrics feeding L2 KPI

**Steps:**
1. Remove the "L2 Formula & Inputs" section entirely
2. If user wants KPI detail: add a link to a future KPI card instead
3. Part of D3 restructure

**Files to modify:** `CapabilityDetailPanel.tsx` (remove lines 975-1063)

---

### [ ] D6 — Add KPI card reference

**User said:** "if you want to show the KPI for it, add a reference to the L2 KPI linked to it, and when you go to the KPI card you should see the details"

**Current State:** No KPI card component exists.

**Steps:**
1. Create a KPI card component showing: KPI name, actual vs target, trend, timeline
2. Link from L2 panel: "View linked KPI →" opens KPI card
3. KPI data comes from `SectorPerformance` nodes in `capability_to_performance` chain
4. This is a NEW component — design separately

**Files to create:** New KPI card component
**Dependencies:** D5 (remove formula section first)

---

### [ ] D7 — KPI inputs: temporal planned vs target

**User said:** "they have no reference, just text inputs... some count target and shows it red without the rule of planned vs target TEMPORALLY not in absolute"

**Current State:**
- Process metrics in L3 OPERATE panel show `actual` vs `target` but don't consider temporal context
- A capability at M2 in year 1 with plan to reach M3 by year 2 is ON TRACK, not red

**Steps:**
1. Add temporal awareness: compare actual vs PLANNED-FOR-THIS-PERIOD, not vs final target
2. Use `year` and `quarter` context to determine expected milestone
3. Red = behind schedule, Amber = on schedule but not at final target, Green = at or above planned
4. This affects `getL3StatusColor()` in `enterpriseStatusUtils.ts`

**Files to modify:** `enterpriseStatusUtils.ts`, `CapabilityDetailPanel.tsx`

---

### [ ] D8 — Upward link: simplify to chain breadcrumb

**User said:** "a very long list of nothing, random crap... supposed to simply show upwards l2 cap → l2 perf → l1 perf → l1 obj"

**Current State:**
- `CapabilityDetailPanel.tsx:1065-1099`: Shows upward chain breadcrumb + list of ALL upward SectorPerformance nodes

**Steps:**
1. Simplify to JUST the breadcrumb: L2 Capability → L2 Performance → L1 Performance → L1 Objective
2. Each step is a clickable link (navigate to that entity's detail)
3. Remove the long list of performance targets below the breadcrumb
4. Show only the DIRECT upward path, not all connected performance nodes

**Files to modify:** `CapabilityDetailPanel.tsx` (simplify upward links section)

---

### [ ] D9+D10 — Gauge clarity: separate from maturity

**User said:** "in the gauge it is not clear what is the value measured... maturity which implies the gauge is about it yet they are two different measurements"

**Current State:**
- `CapabilityDetailPanel.tsx:685` (L3 OPERATE): SemiGauge shows `kpi_achievement_pct`
- `CapabilityDetailPanel.tsx:638` (L3): MaturityBlocks shows `maturity_level / target_maturity_level`
- Gauge and maturity are adjacent, creating confusion

**Steps:**
1. Add clear label above gauge: "KPI Achievement" with the actual KPI name
2. Add planned vs target context: "Target: 90% by Q4 2026 | Current: 72%"
3. Visually separate gauge from maturity with a divider or different section
4. Add label above maturity: "Maturity Level" with clear M1-M5 scale explanation
5. Consider showing them in two columns side-by-side instead of stacked

**Files to modify:** `CapabilityDetailPanel.tsx` (add labels, restructure layout)

---

### [ ] D11 — Maturity M1 while "in operation" requires M3 min

**User said:** "Maturity shows M1 while it says its in operation which is something requiring M3 min"

**Current State:** This is a DATA issue, not UI. The maturity_level on the Neo4j node is M1 but the capability status is "active" (OPERATE mode). Per SST rules, OPERATE requires M3+.

**Steps:**
1. Add validation warning in UI: if `status === 'active'` and `maturity_level < 3`, show amber warning badge "Maturity below operational threshold (M3)"
2. This is a visual indicator, not a data fix (data fix is backend ETL)

**Files to modify:** `CapabilityDetailPanel.tsx` (add validation warning)

---

### [ ] D12 — L3 gauge 0% while maturity M5, parent M1

**User said:** "L3: gauge at 0% while maturity is 5... siblings all M5 while parent M1"

**Current State:** DATA disconnection — `kpi_achievement_pct = 0` while `maturity_level = 5`. Parent maturity rollup may use wrong logic.

**Steps:**
1. UI fix: if `kpi_achievement_pct === 0` and `maturity_level >= 3`, show warning "KPI data not yet available"
2. Check maturity rollup: `CapabilityMatrix.tsx` L1 maturity should be MIN or weighted average of L2s, L2 should be MIN/avg of L3s
3. If parent shows M1 while children show M5: the rollup is broken. Fix in enterpriseService.ts where L2/L1 maturity is computed

**Files to modify:** `CapabilityDetailPanel.tsx` (warning), `enterpriseService.ts` (maturity rollup)

---

### [ ] D13 — Gauge numbers in wrong section ("process metrics")

**User said:** "gauge numbers showing way down out of the blue in process metrics"

**Current State:**
- `CapabilityDetailPanel.tsx:713-779`: Process metrics cards show actual/target/trend
- Some of these metrics may be the same data as the gauge, creating duplication

**Steps:**
1. Identify which process metrics duplicate the gauge data
2. Remove duplicates from process metrics section
3. Or: clearly label process metrics as "Contributing Metrics" under the gauge

**Files to modify:** `CapabilityDetailPanel.tsx`

---

### [ ] D14 — "Ops footprint" unclear, no project track status

**User said:** "ops footprint which I guess is projects, yet not clear and no idea if these projects are on track or not"

**Current State:**
- `CapabilityDetailPanel.tsx:782-807`: "Operating entities" section shows OrgUnit, Process, ITSystem
- `CapabilityDetailPanel.tsx:405-455`: Projects section shows grouped by People/Process/Tools pillars

**Steps:**
1. Rename section headers for clarity: "Operating Entities" → "People, Process & Systems"
2. For projects: add status indicator (on-track/delayed/overdue) based on `progress_percentage` vs timeline
3. Add clear explanation: "These projects are closing gaps to improve this capability"
4. If capability is M5: either hide projects section or explain why projects still exist

**Files to modify:** `CapabilityDetailPanel.tsx`

---

### [ ] D15 — Risk profile: remove useless category/status fields

**User said:** "risk profile has two useless inputs category and status - ABSOLUTELY USELESS"

**Current State:**
- `CapabilityDetailPanel.tsx:354-364`: Risk section shows `risk_category` and `risk_status`

**Steps:**
1. Remove `risk_category` and `risk_status` display from risk section
2. Replace with actionable info: risk band (visual), exposure %, mitigation strategy
3. Add CTA: "Create Intervention Plan" (links to PlanningDesk with risk context)

**Files to modify:** `CapabilityDetailPanel.tsx`

---

### [ ] D16 — Chains reading from wrong fields

**User said:** "chains reading from wrong fields and aggregating incorrectly"

**Current State:**
- `enterpriseService.ts:323-413`: Field extraction per entity type
- Potential mismatches: field names in Cypher vs what frontend reads

**Steps:**
1. Log the raw chain data for one capability: `console.log(JSON.stringify(node.properties))`
2. Compare available properties vs what enterpriseService extracts
3. Fix any field name mismatches (e.g. `people_risk` vs `people_score` — known bug from MEMORY.md)
4. Verify aggregation: L3 status should flow correctly to L2 and L1

**Files to modify:** `enterpriseService.ts` (fix field mappings)

---

### [ ] D17 — Exposure overlay gradient not applied

**User said:** "Exposure overlay: gradient coloring based on dynamic min and max values of a formula of risk rating, urgency and dependencies. Not applied."

**Current State:**
- `enterpriseOverlayUtils.ts:6-27`: `calculateHeatmapColor()` exists — maps `dependency_count` to green→amber→red gradient
- Current formula uses ONLY `dependency_count`, NOT `risk rating × urgency × dependencies` as user describes
- Overlay only active when user selects "risk-exposure" overlay button

**Steps:**
1. Update formula to: `score = risk_rating * urgency * dependency_count` (normalize each to 0-1)
2. Map score to gradient: 0→green, 0.5→amber, 1→red
3. Compute dynamic min/max from all L3 capabilities in current view
4. Apply gradient as cell background when "risk-exposure" overlay is selected
5. Verify: does the overlay button work? Does it toggle on/off?

**Files to modify:** `enterpriseOverlayUtils.ts` (update formula), `enterpriseService.ts` (ensure risk_rating/urgency fields exist)

---

## PHASE 4: DELIVER / PLANNING DESK (P1-P13)

### [ ] P1+P2 — Progress tracking for intervention plans

**User said:** "not clear how these plans reach users and owners, and how they send back the progress on their tasks"

**Current State:**
- `PlanningDesk.tsx:100-335`: Intervention flow creates plans via LLM + Gantt chart
- `planningService.ts:19-37`: `createRiskPlan()` POSTs to `/api/neo4j/risk-plan`
- `PlanTask` interface has `owner` and dates but NO `progress_pct` or `actual_status` fields
- No mechanism for owners to update task status

**Steps:**
1. Add `progress_pct: number` and `status: 'not-started'|'in-progress'|'completed'|'blocked'` to `PlanTask` interface in `planParser.ts`
2. Design a simple task update UI: each task row in Gantt has a status dropdown + progress slider
3. On update: call backend endpoint (new) to update task status on Neo4j node
4. For MVP: manual update by the user viewing the plan. Future: notification system for owners.
5. Show progress on plan list view (P6)

**Files to modify:** `planParser.ts` (add fields), `PlanningDesk.tsx` (add status controls), `planningService.ts` (add update endpoint)

---

### [ ] P3 — Link plan status back to risk

**User said:** "not clear how their status links back to the risk status they are supposed to solve for"

**Current State:**
- `ontologyService.ts:1018-1075`: Red risk with on-track plan → downgraded to amber (mitigation logic exists)
- `planningService.ts`: `createRiskPlan()` includes `riskId` in the POST body
- The link exists in data (RiskPlan→Risk) but the feedback loop UI is missing

**Steps:**
1. In SavedPlansList: show the linked risk name + current risk band
2. When plan status changes: update the risk node's status (or let ETL handle it)
3. Visual indicator: "This plan mitigates Risk X (currently Red → monitoring as Amber)"

**Files to modify:** `PlanningDesk.tsx` (SavedPlansList section)

---

### [ ] P4 — Risk with plan → formula makes it Amber

**User said:** "once a risk has an intervention plan, the formula calculating its risk should make it back into Amber"

**Current State:**
- `ontologyService.ts:1050-1065`: Mitigation logic exists:
  ```
  if (rawRag === 'red' && linkedPlans.length > 0 && linkedPlans.some(p => p.isOnTrack)) → rag = 'amber'
  ```
- This works for Ontology desk. Need to verify it works in Enterprise desk too.

**Steps:**
1. Verify Enterprise desk uses the same mitigation logic
2. If not: add plan-aware status to enterpriseStatusUtils.ts
3. Visual indicator in Enterprise desk: risk cells that are amber due to active plan should show a plan icon badge

**Files to verify:** `enterpriseStatusUtils.ts`, `enterpriseService.ts`

---

### [ ] P5 — Plan failure bumps risk back up

**User said:** "if the plan fails there needs to be a trigger to bump it up"

**Current State:** No failure detection mechanism exists.

**Steps:**
1. Define "plan failure": plan status = 'failed' OR plan overdue by >30 days with <50% progress
2. In ontologyService mitigation logic: if plan exists but NOT on track → keep risk as RED (don't downgrade)
3. Add visual alert: "Plan for Risk X has failed — risk escalated back to Red"
4. This is mostly a data/ETL concern — frontend just needs to read the status correctly

**Files to modify:** `ontologyService.ts` (refine mitigation logic)

---

### [ ] P6 — Plan list shows RAG at list level

**User said:** "list of intervention plans should show from the list level the RAG"

**Current State:**
- `PlanningDesk.tsx:497-568`: SavedPlansList table shows: Risk, Plan, Deliverables count, Tasks count, Status badge
- Status badge is green for "Active", gray for others — NOT a RAG indicator

**Steps:**
1. Compute plan RAG: use same formula as projects (progress vs timeline)
2. Show colored dot next to plan name in list: green (on track), amber (at risk), red (delayed/failed)
3. Add percentage column showing overall plan progress

**Files to modify:** `PlanningDesk.tsx` (SavedPlansList section)

---

### [ ] P7 — RAG per task inside plan

**User said:** "when entering to see the RAG per task"

**Current State:**
- Gantt chart shows tasks but all same color (SVAR default blue)
- No per-task RAG coloring

**Steps:**
1. Add task status field to PlanTask (from P1)
2. Apply conditional Gantt bar colors: green (on track), amber (behind), red (blocked/failed)
3. SVAR wx-react-gantt supports custom task colors via `task.css` or `task.type` properties
4. Map task status to SVAR task type/color

**Files to modify:** `PlanningDesk.tsx` (Gantt configuration)

---

### [ ] P8 — Rename "Strategic Reset" to "Refresh"

**User said:** "Strategic Reset is not a Reset, it is a REFRESH, a normal end of year exercise"

**Current State:**
- `PlanningDesk.tsx:623-832`: Component called `StrategicReset`
- i18n key: `josoor.planning.strategicReset` = "Strategic Reset"
- Mode button label: "Strategic Reset"

**Steps:**
1. Rename component from `StrategicReset` to `StrategicRefresh`
2. Update i18n keys: "Strategic Reset" → "Strategic Refresh" (en), update Arabic
3. Update mode button label
4. Update subtitle: "Annual Direction Setting" → "End-of-Year Refresh Exercise"

**Files to modify:** `PlanningDesk.tsx`, `en.json`, `ar.json`

---

### [ ] P9+P10 — Refresh: year selection + AI snapshot + save/list

**User said:** "year selection, and a prompt in supabase... the AI button like the rest to send to the prompt key... each snapshot is listed and saved"

**Current State:**
- `PlanningDesk.tsx:623-832`: StrategicReset is fully static/hardcoded — no AI, no backend, no year selection

**Steps:**
1. Add year selector dropdown at top of Refresh view
2. Create Supabase prompt: `strategic_refresh` prompt_key in `instruction_elements`
3. Add "Generate Snapshot" button that calls chatService with `prompt_key: 'strategic_refresh'` and year context
4. Parse AI response and display as snapshot
5. Add save mechanism: POST snapshot to backend (new endpoint)
6. Add list of saved snapshots with date, year, preview
7. Add prompt_key to chat.ts type union

**Files to modify:** `PlanningDesk.tsx` (replace static content), `chat.ts` (add prompt_key), Supabase (add prompt)

---

### [ ] P11+P12+P13 — Scenario planning: outcome-based controls + AI + save

**User said:** "outcome based, meaning it lists the outcomes and outputs per the current plan and next to them are the modified values, including an open text area... ruthless non-biased analysis"

**Current State:**
- `PlanningDesk.tsx:835-1000`: ScenarioSimulation is fully static — 4 dropdown controls, hardcoded impact diff, static verdict

**Steps:**
1. Replace 4 dropdowns with outcome-based controls:
   - List current outcomes/outputs with their baseline values (from chain data)
   - Each outcome has an editable "modified value" field next to it
   - Open text area for additional context/constraints
2. Create Supabase prompt: `scenario_analysis` prompt_key
3. "Analyze Scenario" button sends: baseline values + modified values + text to AI
4. Display AI response: viability analysis, risks, aggressive plan
5. Save results to backend (new endpoint)
6. List saved scenario analyses

**Files to modify:** `PlanningDesk.tsx` (replace static content), `chat.ts`, Supabase

---

## PHASE 5: REPORTING (R1-R6)

### [ ] R1 — Standard reports tab first

**User said:** "start with the standard reports tab not the outcomes one"

**Current State:**
- `ReportingDesk.tsx:6,10`: Default view is `control-outcomes` (line 10: `useState('control-outcomes')`)

**Steps:**
1. Change default state to `'standard-reports'`: line 10
2. Reorder tab buttons so Standard Reports is first

**Files to modify:** `ReportingDesk.tsx` (change default, reorder buttons)

---

### [ ] R2 — Weekly PMO report

**User said:** "weekly for all projects for weekly PMO"

**Current State:**
- `ReportingDesk.tsx:503-589`: Report builder has type selector but report types are generic labels
- API call commented out (TODO)

**Steps:**
1. Define PMO Weekly template: project list with status/progress/blockers/next steps
2. Create Supabase prompt: `report_weekly_pmo` with instructions for formatting
3. Wire "Generate" button to fetch project data from chains + call AI with prompt
4. Display formatted report with sections: Summary, Project Status Table, Blockers, Next Steps
5. Add export to PDF capability

**Files to modify:** `ReportingDesk.tsx`, Supabase, `chat.ts`

---

### [ ] R3 — Monthly ExCom report

**User said:** "monthly for programs and operations for Excom"

**Steps:**
1. Define ExCom Monthly template: programs overview, operations KPIs, current issues, upcoming milestones
2. Create Supabase prompt: `report_monthly_excom`
3. Fetch data from multiple chains (capability_to_performance, sustainable_operations)
4. Generate report with AI summarization
5. Include: KPI dashboard, risk heatmap, project pipeline, resource allocation

**Files to modify:** `ReportingDesk.tsx`, Supabase, `chat.ts`

---

### [ ] R4 — Standard Adaa report

**User said:** "one standard Adaa report"

**Steps:**
1. Research Adaa report format (National Center for Government Performance Measurement)
2. Create template matching Adaa requirements
3. Create Supabase prompt: `report_adaa_standard`
4. Map internal KPIs to Adaa indicators
5. Generate report with proper Adaa formatting

**Files to modify:** `ReportingDesk.tsx`, Supabase

---

### [ ] R5 — One real example of each report type

**User said:** "we need one real example of the three based on our data"

**Steps:**
1. After R2, R3, R4 are implemented: generate one of each using actual Water Sector data
2. Save as reference examples accessible from the Reporting desk
3. Mark as "Sample Report" with disclaimer

**Dependencies:** R2, R3, R4 must be done first

---

### [ ] R6 — Outcome-based intervention effectiveness

**User said:** "Outcome based is measuring if the interventions have been effective"

**Current State:**
- `ReportingDesk.tsx:78-407`: ControlOutcomes view exists with timeline, before/after comparison
- All data is hardcoded/mock

**Steps:**
1. Wire ControlOutcomes to real data: fetch intervention plans from planningService
2. Compare risk status before plan vs current risk status
3. Show effectiveness metrics: risk reduced? KPI improved? Timeline met?
4. AI or deterministic analysis of intervention effectiveness

**Files to modify:** `ReportingDesk.tsx` (wire real data)
**Dependencies:** P1-P7 (plans must exist first)

---

## PHASE 6: SIGNALS / EXPLORER (X1-X4)

### [ ] X1 — Update to latest chain names

**User said:** "needs to be updated with the latest chains we redesigned"

**Current State:**
- `ExplorerDesk.tsx:28-71`: CHAIN_MAPPINGS has 7 chains: sector_value_chain, setting_strategic_initiatives, setting_strategic_priorities, change_to_capability, capability_to_policy, capability_to_performance, sustainable_operations

**Steps:**
1. Compare CHAIN_MAPPINGS against current backend chain list
2. Search NoorMemory for any chain renames or splits
3. Update any stale chain names, labels, or relationship types
4. Test each chain in Explorer — verify data returns

**Files to modify:** `ExplorerDesk.tsx` (update CHAIN_MAPPINGS)

---

### [ ] X2 — Node limit control not working

**User said:** "adjustable node limit but it doesn't seem to work now"

**Current State:**
- `ExplorerDesk.tsx:207`: `limit` state initialized to 200
- `ExplorerDesk.tsx:324`: Passed as `row_limit` query parameter to API

**Steps:**
1. Verify the API respects `row_limit` parameter — check backend endpoint
2. Test: set limit to 10, verify only 10 nodes returned
3. If API ignores param: this is a backend fix
4. If limit works but UI doesn't update: check if React Query caches stale results

**Files to verify:** `ExplorerDesk.tsx`, backend API

---

### [ ] X3+X4 — Diagnose queries: orphans/bastards + red Sankey dots

**User said:** "diagnose queries... highlight break points... orphans (abandoned) and bastards (no parent)"

**Current State:**
- `ExplorerDesk.tsx:313`: `queryType === 'diagnostic'` enables gap analysis
- `ExplorerDesk.tsx:461-466`: Orphan/bastard nodes get amber color, critical nodes get red
- `GraphSankey.tsx:229-243`: Broken node handling exists

**Steps:**
1. Verify diagnostic mode works: select chain → switch to diagnostic → run
2. Check if backend returns `status: 'orphan'` / `status: 'bastard'` on nodes
3. Verify Sankey renders amber dots for orphans, red for critical
4. If not working: check if diagnostic query in Supabase `chain_queries` table is correct
5. Search NoorMemory for "orphan" / "bastard" / "diagnose" for previous design docs

**Files to verify:** `ExplorerDesk.tsx`, `GraphSankey.tsx`, backend diagnostic queries

---

## PHASE 7: EXPERT CHAT (C1-C10)

### [ ] C1 — Remove recall memory/vision buttons

**User said:** "recall memory and recall vision are redundant, they are already in the prompts"

**Current State:**
- `ChatToolbar.tsx:22-25`: TOOLS array has `recall_memory` and `recall_vision_memory`
- Rendered as toggle chips (lines 79-88)

**Steps:**
1. Remove the TOOLS array entries for recall_memory and recall_vision_memory
2. Remove the tools rendering section (lines 79-88)
3. Keep persona dropdown intact

**Files to modify:** `ChatToolbar.tsx`

---

### [ ] C2 — Rethink personas for discussion context

**User said:** "personas need to be well thought, we're using the same prompts used for the AI buttons"

**Current State:**
- `ChatToolbar.tsx:14-20`: 5 personas mapping to prompt_keys (general_analysis, risk_advisory, strategy_brief, intervention_planning, stakeholder_communication)

**Steps:**
1. Discuss with user: should chat personas have DIFFERENT prompts than AI buttons?
2. If yes: create new prompt_keys for chat context (e.g. `chat_risk_advisor` vs `risk_advisory`)
3. If no: keep current mapping but improve persona descriptions
4. Consider: chat needs conversational prompts, AI buttons need structured output prompts

**Files to modify:** `ChatToolbar.tsx`, potentially Supabase prompts
**Requires user input**

---

### [ ] C3 — Persona dropdown resets on each message

**User said:** "each time a msg is sent the drop down resets to choose a persona"

**Current State:**
- `ChatToolbar.tsx:55`: Dropdown disabled when `isPersonaLocked` is true
- `ChatContainer.tsx:520-527`: Props pass `selectedPersona` from parent
- State management is in parent (JosoorShell or ChatContainer parent)

**Steps:**
1. Trace persona state: where is `selectedPersona` stored? Is it reset on message send?
2. Check if `onPersonaChange` callback inadvertently resets state
3. Fix: persist persona selection in component state, don't reset on message send
4. Verify lock mechanism works: once persona selected and locked, it stays

**Files to modify:** Wherever persona state is managed (likely JosoorShell.tsx or parent of ChatContainer)

---

### [ ] C4 — Conversation summary at context limit

**User said:** "deployed a solution but not tested yet thoroughly"

**Current State:**
- `ChatContainer.tsx:475-485`: Condensation indicator shows when `metadata.condenser_result` exists
- Backend handles conversation condensation

**Steps:**
1. Test: have a long conversation until context limit is hit
2. Verify condensation triggers and summary is accurate
3. Check if conversation continues smoothly after condensation
4. This is primarily a backend test — frontend just displays the indicator

**Files to verify:** `ChatContainer.tsx`, backend condensation logic

---

### [ ] C5 — Better example prompts

**User said:** "example prompts in the new chat need to be changed to something more relevant"

**Current State:**
- `ChatContainer.tsx:173-190`: 4 examples using i18n keys: exampleTransformation, exampleCapabilities, exampleReport, exampleGovernance

**Steps:**
1. Read current example text from en.json and ar.json
2. Replace with Water Sector-specific, powerful examples like:
   - "What are the top 3 risks threatening our water desalination targets?"
   - "Show me capabilities below M3 maturity that are supposed to be operational"
   - "Generate a weekly PMO update for all water infrastructure projects"
   - "Which intervention plans are overdue and need escalation?"
3. Update i18n keys in both en.json and ar.json

**Files to modify:** `en.json`, `ar.json`

---

### [ ] C6 — Sidebar: date and message count disappeared

**User said:** "side bar for conversation history used to visually look nicer, had the date and number of msgs, those disappeared"

**Current State:**
- `Sidebar.tsx:145`: Shows `messagesCount` translation with count parameter
- Date display may have been removed or broken in a recent change

**Steps:**
1. Read Sidebar.tsx fully — check if date formatting code exists but is hidden
2. Check ConversationSummary type — does it include `created_at` or `updated_at` fields?
3. Restore date display: format as "Mar 6" or "2 days ago"
4. Restore message count badge if missing

**Files to modify:** `Sidebar.tsx`

---

### [ ] C7 — Artifact shows "html report" instead of actual name

**User said:** "instead of the name of the report it still says html report"

**Current State:**
- `MessageBubble.tsx:200`: `const title = v.title || (isHtml ? 'Report' : (id || 'Artifact'));`
- i18n key `josoor.chat.message.htmlReport` = "HTML Report"

**Steps:**
1. Fix title extraction: use the actual report title from the artifact metadata
2. Check if `v.title` is being populated by the backend — if not, extract from HTML content (first `<h1>` or `<title>`)
3. Fallback chain: `v.title` → extracted title → "Report"

**Files to modify:** `MessageBubble.tsx`

---

### [ ] C8 — Back to list shows only opened artifact

**User said:** "back to list button that takes you to the list of artifacts for that reply, it now only shows the artifact that was opened"

**Current State:**
- Artifact list management is handled in MessageBubble.tsx
- TwinKnowledgeRenderer has `onBack` pattern but general artifacts may not

**Steps:**
1. Read MessageBubble.tsx artifact rendering logic
2. Find the "back to list" handler — does it correctly restore the full artifact list?
3. If state is lost on navigation: store the full artifact list before opening one
4. Fix: ensure back button restores complete list, not just the opened item

**Files to modify:** `MessageBubble.tsx`

---

### [ ] C9 — User bubble color change from green

**User said:** "user bubble needs to change from green to another color to be more readable"

**Current State:**
- `message-bubble.css:7`: `.message-avatar--user { background: var(--component-color-success); }` (green)
- `message-bubble.css:15`: Bubble uses `var(--chat-bubble-user-bg)` and `var(--chat-bubble-user-text)`

**Steps:**
1. Change avatar color from green to a more readable option: `var(--component-text-accent)` (gold) or a neutral blue
2. Verify contrast ratio meets accessibility standards (WCAG AA: 4.5:1 for text)
3. Update both light and dark theme values if needed

**Files to modify:** `message-bubble.css` or `theme.css`

---

### [ ] C10 — Change "an agency" to "SWA" in prompts

**User said:** "references in all the prompts talk about 'an agency' we need to make it clear it is SWA"

**Current State:**
- No matches for "an agency" found in frontend codebase
- Prompts are stored in Supabase `instruction_elements` table

**Steps:**
1. Search Supabase `instruction_elements` table for "an agency" text
2. Replace all instances with "SWA (Saudi Water Authority)" or "هيئة المياه السعودية"
3. This is a Supabase data update, not a code change

**Files to modify:** Supabase `instruction_elements` rows

---

## PHASE 8: TUTORIALS (TU1-TU2)

### [ ] TU1 — Visual pass on look and feel

**User said:** "the look and feel I think needs another pass"

**Current State:**
- `TutorialsDesk.tsx` (42 lines): Simple toggle between TwinKnowledge TOC and TwinKnowledgeRenderer detail
- Minimal custom styling

**Steps:**
1. Read TutorialsDesk.tsx and TwinKnowledge.tsx fully
2. Apply theme-consistent styling: card layouts, proper spacing, section headers
3. Match design language of other desks (sidebar + main content pattern)
4. Ensure RTL support for Arabic content

**Files to modify:** `TutorialsDesk.tsx`, `TutorialsDesk.css`, `TwinKnowledge.tsx`

---

### [ ] TU2 — Change video links to YouTube embeds

**User said:** "videos and audios are now hosted on youtube... change the links from local to embed the youtube versions"

**Current State:**
- Link sources not fully visible in code exploration — need to check TwinKnowledge content data

**Steps:**
1. Read TwinKnowledge.tsx content data — find where video/audio URLs are defined
2. Replace local file paths with YouTube embed URLs (format: `https://www.youtube.com/embed/VIDEO_ID`)
3. Ensure embed renders with responsive iframe (16:9 aspect ratio)
4. Get YouTube video IDs from user or NoorMemory

**Files to modify:** `TwinKnowledge.tsx` or wherever content URLs are stored
**Requires user input:** YouTube video IDs

---

## PHASE 9: SETTINGS (T2-T4)

### [ ] T2 — Multiple LLM provider support

**User said:** "support multiple LLM providers, and the sub features differ"

**Current State:**
- `SettingsDesk.tsx:168-238`: Single provider config with base_url, model, timeout, endpoint_path
- `enable_mcp_tools` and `enable_response_schema` are the only feature toggles

**Steps:**
1. Add provider selector dropdown (e.g. OpenAI, Anthropic, local LLM)
2. On provider change: show/hide relevant configuration fields
3. Read `provider_features` column from Supabase to know which features each provider supports
4. Dynamically render only supported fields per provider

**Files to modify:** `SettingsDesk.tsx`, `adminSettingsService.ts`

---

### [ ] T3 — Use provider_features column for customization

**User said:** "supabase has a column listing the features supported by an LLM provider"

**Current State:** Feature column exists in Supabase but is never read by frontend.

**Steps:**
1. Add API endpoint or Supabase query to fetch provider features
2. Parse features list per provider
3. In Settings UI: only show checkboxes/fields for features the selected provider supports
4. Disable unsupported features with tooltip explaining why

**Files to modify:** `SettingsDesk.tsx`, `adminSettingsService.ts`

---

### [ ] T4 — Activate graph RAG semantic context

**User said:** "feature of injecting graph RAG semantic context that we never activated"

**Current State:**
- Admin Settings (Settings.tsx:394): `s_enable_graphrag_context` checkbox exists
- Feature is never wired to backend

**Steps:**
1. Find where `s_enable_graphrag_context` setting is read
2. Wire to backend: when enabled, chat messages should include graph context
3. This likely requires backend changes to inject Neo4j subgraph context into LLM prompts
4. Frontend: ensure the toggle saves and the backend respects it

**Files to modify:** Frontend toggle may work already — verify backend reads the setting
**Requires backend work**

---

## PHASE 10: OBSERVABILITY (B1-B5)

### [ ] B1 — Messages sometimes don't appear (long threads)

**User said:** "messages in supabase do not appear. Maybe related to long threads"

**Current State:**
- `ObservabilityDesk.tsx:838-1068`: Trace list fetches from backend
- No pagination visible — may hit limits on long threads

**Steps:**
1. Check if backend limits trace results (pagination, row limits)
2. Add pagination to trace list if missing
3. Check if long conversation threads cause the observability parser to fail
4. This is likely a backend issue — frontend just needs to handle pagination

**Files to verify:** `ObservabilityDesk.tsx`, backend observability endpoint

---

### [ ] B2 — LLM output parsing drops fields

**User said:** "parsing the outputs of the LLM to fill in for observability is sometimes dropping fields"

**Current State:**
- `ObservabilityDesk.tsx`: TraceDetailView shows summary cards (turn count, tool calls, reasoning steps, errors)
- Field extraction relies on backend parsing LLM responses

**Steps:**
1. Check which fields are missing: reasoning? tool_calls? errors?
2. Compare backend observability schema vs what LLM actually returns
3. Fix backend parser to handle all LLM response formats
4. This is primarily a backend fix

**Requires backend investigation**

---

### [ ] B3 — Reasoning not always appearing

**User said:** "Reasoning is not always appearing"

**Current State:**
- `ObservabilityDesk.tsx:280-309`: ReasoningPanel handles flexible format (string, array, object with text)
- `normalizeThought()` (lines 249-278) handles variations

**Steps:**
1. Check if some LLM responses have reasoning in a different field name
2. Verify `normalizeThought()` handles all formats
3. Backend may not extract reasoning from all LLM providers consistently
4. Frontend: add "No reasoning available" message when array is empty

**Files to verify:** `ObservabilityDesk.tsx`, backend reasoning extraction

---

### [ ] B4 — Error messages are cryptic

**User said:** "Error messages are cryptic"

**Current State:**
- `ObservabilityDesk.tsx:390-418`: ErrorsPanel shows `error.type` + raw JSON data

**Steps:**
1. Add human-readable error descriptions for common error types
2. Map error types to user-friendly messages (e.g. "timeout" → "The AI took too long to respond")
3. Show raw JSON in collapsible "Technical Details" section
4. Add suggestions for resolution where possible

**Files to modify:** `ObservabilityDesk.tsx` (ErrorsPanel section)

---

### [ ] B5 — MCP tool calls sometimes not counted

**User said:** "MCP tool calls sometimes are counted and others are not although they do happen"

**Current State:**
- `ObservabilityDesk.tsx:315-384`: ToolCallsPanel extracts name from `function.name` or `tool` or `tool_name`
- `tool_calls_count` may not match actual tool calls if backend parsing is inconsistent

**Steps:**
1. Compare `tool_calls_count` vs `tool_calls.length` — if they differ, the count field is stale
2. Use `tool_calls.length` as source of truth in UI
3. Check if some MCP tool calls use a format not handled by the extraction logic (lines 317-340)
4. Fix extraction to handle all MCP tool call formats

**Files to modify:** `ObservabilityDesk.tsx` (ToolCallsPanel extraction logic)

---

## PRIORITY ORDER (Suggested Execution Sequence)

### Sprint 1: Foundation (Ontology + System)
1. H1 — Fix missing CONNECTION_PAIRS (eliminates yellow lines)
2. H2 — Verify all node types receive data from chains
3. H4+H5 — Verify bottom-up propagation works correctly
4. H3+H12 — Verify node RAG tinting for all shapes
5. H11 — Canvas 5% smaller (quick CSS fix)
6. H10 — Sector indicator badge (quick UI add)
7. H9 — Wire year/quarter filters

### Sprint 2: Ontology Polish
8. H6+H7 — Side panel: add missing IDs, verify CTAs
9. H13 — Node totals on canvas
10. H14 — Line totals on canvas
11. H15+H16 — Line relation names
12. H8 — AI-generated status narrative

### Sprint 3: Decide Desk Overhaul
13. D1 — Remove L2 description from cell
14. D3+D4+D5 — Panel restructure (status → why → action)
15. D8 — Simplify upward links
16. D9+D10 — Separate gauge from maturity
17. D15 — Remove useless risk fields
18. D16 — Fix chain field mappings
19. D17 — Exposure overlay formula
20. D7 — Temporal planned vs target
21. D11+D12 — Data validation warnings
22. D2 — Clarify KPI label
23. D13+D14 — Fix section labels

### Sprint 4: Observe Desk
24. O1 — Verify parse-free (may be done)
25. O2 — Hide empty entries
26. O3 — Capability status consistency
27. O5 — Map fullscreen resize
28. O6 — Asset state temporal logic
29. O7+O8 — Pillar program filtering
30. O4 — Cross-desk capability navigation
31. O9 — RAG aggregation upward

### Sprint 5: Deliver Desk
32. P8 — Rename to Refresh
33. P1+P2 — Progress tracking
34. P3 — Link to risk
35. P6+P7 — Plan/task RAG
36. P4+P5 — Plan mitigation formula
37. P9+P10 — Refresh AI integration
38. P11+P12+P13 — Scenario AI integration

### Sprint 6: Chat + Reporting + Others
39. C1 — Remove redundant buttons
40. C3 — Fix persona reset
41. C5 — Better example prompts
42. C9 — User bubble color
43. C10 — SWA in prompts
44. C6 — Sidebar date/count
45. C7 — Artifact naming
46. C8 — Back to list fix
47. R1 — Standard reports first
48. R2+R3+R4 — Report templates
49. X1-X4 — Signals updates
50. TU1+TU2 — Tutorials refresh
51. T2+T3+T4 — Settings enhancements
52. B1-B5 — Observability fixes
53. C2+C4 — Persona rethink + summary testing

---

## MEMORY RESET PROTOCOL

When starting a new session:
1. `Read /home/mosab/projects/josoorfe/docs/plans/2026-03-06-requirements-implementation-plan.md`
2. `mcp__noor-memory__search_memories("RequirementsPlan_2026_03_06")`
3. Find next unchecked `[ ]` task
4. Read the "Current State" and "Steps" for that task
5. Execute steps
6. Mark `[x]` and update NoorMemory

**NEVER assume context from previous sessions. ALWAYS read this file first.**
