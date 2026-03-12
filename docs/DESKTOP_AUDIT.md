# JosoorOS Desktop Audit — 2026-03-06

Issues categorized by app. Focus: business requirements reflected poorly, functional gaps.

---

## EXECUTION PRIORITY

### P0 — SYSTEM BROKEN (can't build, can't run, crashes)
| # | Item | Why |
|---|------|-----|
| 1 | S5 | Build errors — nothing deploys |
| 2 | O1+CC1 | useOutletContext/useNavigate crash desks outside Router |
| 3 | T1 | Settings save broken — nothing persists |

### P1 — CORE DATA WRONG (everything downstream is garbage)
| # | Item | Why |
|---|------|-----|
| 6 | D7 | Chains read wrong fields — ALL chain consumers show wrong data |
| 7 | H2 | RAG logic must be bottom-up — Ontology status fundamentally wrong |
| 8 | O11 | RAG aggregation in Observe — depends on same bottom-up logic |
| 9 | O4 | Parse-free structured metrics — Observe shows unparsed strings |
| 10 | O6 | Cap status mismatch with capability matrix — inconsistent RAG |
| 11 | D5 | Maturity vs status disconnect (M1 + operational = impossible) |
| 12 | D6 | L3 gauge/maturity/metrics total disconnect |
| 13 | H1+H9 | RAG coverage incomplete — nodes without status break the model |
| 14 | H3 | Yellow lines = no data = broken line RAG |

### P2 — FUNCTIONAL GAPS (features exist but don't work right)
| # | Item | Why |
|---|------|-----|
| 15 | D3+D4 | Side panels are data dumps — core UX of Decide is broken |
| 16 | H4 | Ontology side panels — same problem, no traceability |
| 17 | O7 | Cap click should open Enterprise — cross-app navigation broken |
| 18 | H6 | Ontology ignores year/quarter calendar |
| 19 | O5 | Empty panel when no L2 policy/cap |
| 20 | O8 | Map doesn't resize on fullscreen |
| 21 | O9 | Asset state doesn't change with year filter |
| 22 | O10 | Pillar 3 shows all programs (should be none) |
| 23 | D8 | Exposure overlay not applied |
| 24 | D9 | L2 interventions send empty risk data |
| 25 | P2 | Plan status disconnected from risk status |
| 26 | C2 | Persona lock bug — resets every message |
| 27 | C9 | All prompts say "agency" not SWA |
| 28 | S4 | Preferences not persisted across sessions |
| 29 | S3 | BIOS must be English LTR always |
| 30 | B1+B2 | Observability missing messages + dropped fields |

### P3 — IMPORTANT FEATURES (system works but incomplete)
| # | Item | Why |
|---|------|-----|
| 31 | P1 | Progress tracking — plans have no feedback loop |
| 32 | P3 | Plan list RAG at list and task level |
| 33 | H5 | AI-generated narrative strip (dynamic, not static) |
| 34 | H10 | Totals on canvas near each node |
| 35 | H11 | Relation names + totals on lines |
| 36 | X1 | Signals: update to redesigned chains |
| 37 | X2 | Node limit slider broken |
| 38 | X3 | Orphan/bastard diagnostic visualization |
| 39 | D1+D2 | L2 cell overflow + KPI- label cleanup |
| 40 | P5 | Strategic Reset → Refresh redesign |
| 41 | P6 | Scenario Planning outcome-based redesign |
| 42 | R2 | Standard reports (Weekly PMO, Monthly Excom, Adaa) |
| 43 | R3 | Outcome-based reports |
| 44 | B3 | Cryptic error messages |
| 45 | T2 | Multi-provider feature customization |
| 46 | T3 | GraphRAG injection activation |

### P4 — POLISH (usability, visual, minor)
| # | Item | Why |
|---|------|-----|
| 47 | C1 | Remove redundant recall buttons |
| 48 | C3 | Context limit summary testing |
| 49 | C4 | New chat example prompts |
| 50 | C5 | Conversation history lost date/count |
| 51 | C6 | Artifact name "HTML Report" |
| 52 | C7 | Back to list shows only one artifact |
| 53 | C8 | User bubble green too harsh |
| 54 | C10 | Sidebar toggle no-op |
| 55 | H7 | Sector indicator (Water Sector label) |
| 56 | H8 | Canvas 5% smaller |
| 57 | S1 | ControlsDesk dead import |
| 58 | S2 | Canvas panel top offset |
| 59 | O2 | Pillar switching locked |
| 60 | O3 | Quarter not passed to details panel |
| 61 | TU1 | Tutorials visual refresh |
| 62 | TU2 | YouTube embed links |
| 63 | B4 | Division by zero NaN% |
| 64 | B5 | Inline styles → CSS file |
| 65 | T4 | Two HTTP stacks |
| 66 | X4 | Unused schema query |
| 67 | X5 | Duplicate getNodeColor |

---

## EXECUTION PLAN

### PHASE 0: UNBLOCK BUILD + CRASHES (3 items)

#### P0-1. S5 — Build errors (4 TypeScript failures)

**Status**: 2 of 4 fixed, 2 remaining

**Remaining fix A — SectorMap.tsx**:
- File: `frontend/src/components/desks/sector/SectorMap.tsx`
- Error: `Record<MainCategory, string>` missing `'All'` key in 3 maps
- Already fixed: `MAIN_CATEGORY_GLOWS` (added `'All': ''`)
- Already fixed: `LEGEND_ICONS` (added `'All': ''`)
- Already fixed: `MAIN_CATEGORY_COLORS` (added `'All': 'var(--component-text-primary)'`)
- Action: Run build, confirm this file passes

**Already fixed**:
- `waterHighLevelHierarchy.ts`: local `TFunc` type replaces `TFunction` import
- `SectorDetailsPanel.tsx`: `{percentage}%` → `{`${percentage}%`}`
- `SectorHeaderNav.tsx`: `linkedPrograms?: string[]` added to `CascadeL2`

**Verification**: `npm run build --workspace=frontend` must exit 0

---

#### P0-2. O1+CC1 — Router hooks crash desks outside Router context

**Problem**: Desktop renders desk components as standalone (not inside `<Outlet>`). Any desk using `useNavigate()` or `useOutletContext()` will throw a React Router invariant error at runtime.

**Step 1 — Find all affected files**:
```
grep -rn "useOutletContext\|useNavigate" frontend/src/components/desks/ --include="*.tsx"
```

**Step 2 — For each file found**:
- If `useNavigate` is called but `navigate()` is never used → remove the import and call entirely
- If `useNavigate` is actually used (e.g., `navigate('/somewhere')`) → replace with `window.location.href` or accept an `onNavigate` prop from desktop
- If `useOutletContext` is called → check if the component already accepts the same data as props. If yes: remove `useOutletContext`, use props only. If no: add props for `year`/`quarter` and remove `useOutletContext`

**Step 3 — SectorDesk specifically** (confirmed affected):
- Line 4: `import { useOutletContext, useNavigate } from 'react-router-dom'`
- Line 89: `const navigate = useNavigate()` — `navigate` is NEVER called in the file. Delete.
- Line 90: `const outletContext = useOutletContext<...>()` — used for year/quarter fallback. Props already exist for both. Delete this line, keep prop-only: `const year = propYear || '2026'`

**Step 4 — Safety net**:
- In `JosoorDesktopPage.tsx`, wrap the `renderAppContent` output in `<MemoryRouter>` so any deeply nested component that imports from react-router-dom doesn't crash:
```tsx
import { MemoryRouter } from 'react-router-dom';
// In renderAppContent, wrap each case:
case 'observe':
  return <MemoryRouter><SectorDesk ... /></MemoryRouter>;
```
- This is a belt-and-suspenders approach — direct hook removal is the primary fix, MemoryRouter catches anything we miss

**Verification**: Open each desk app in the desktop OS window. No console errors about "useNavigate() may be used only in the context of a <Router>"

---

#### P0-3. T1 — Settings save broken

**Problem**: Settings reads fine but writes fail. Need to find out WHY.

**Step 1 — Identify the actual error**:
- Open Settings app in desktop, try to save, open browser DevTools Network tab
- Record: what URL is called, what HTTP method, what status code comes back, what error body
- Check console for any JS errors

**Step 2 — Trace the frontend call**:
- Read `frontend/src/app/josoor/views/admin/Settings.tsx` — find save handlers
- Read the service file it uses (likely `adminSettingsService.ts` or similar)
- Note the exact URL and HTTP method used for each save operation
- There are TWO kinds of saves: provider settings (via apiClient/axios) and system settings (via raw fetch)

**Step 3 — Provider settings save** (apiClient):
- If this works → good, skip
- If 404 → check URL matches backend route `/api/admin/providers/{id}`
- If 401/403 → auth header not being sent

**Step 4 — System settings save** (raw fetch):
- URL is `/api/admin/settings` — check if Caddy routes `/api/admin/*` to port 8008
- Check backend: does a PUT/POST handler exist at `/api/admin/settings`?
- If endpoint missing in backend → this is a backend task, document it and flag as "needs backend work"
- If endpoint exists but URL is wrong in frontend → fix the URL in the service file
- Also: switch from raw `fetch` to `apiClient` (axios) to get consistent auth headers

**Verification**: Change a setting, save, reload page, confirm the setting persisted

---

### PHASE 1: FIX DATA FOUNDATION (items 6–14)

**5. D7 — Chains read wrong fields**
- This is the root cause for D3–D6 and feeds into H2 and O11
- Read `enterpriseService.ts` thoroughly — map every field read against actual chain response fields
- Cross-reference with noor memory `Business Chain:` entries for each chain's actual structure
- Fix field mappings: `nProps` contains the node properties, `rType` is the relationship type
- Key fields per node type (from memory):
  - Capability: `execute_status`, `build_status`, `maturity_level`, `operational_health_pct`, `build_exposure_pct`
  - Risk: `build_band`, `operate_band`
  - Performance: `actual_value`, `target`, `unit`
  - Project: `progress`, `start_date`, `end_date`, `status`
- Fix aggregation: L2 aggregates from its L3 children (via PARENT_OF), not from random chain hops
- Fix maturity consistency: if `execute_status` = operational, maturity must be ≥ 3

**6. H2 + O11 — Bottom-up RAG aggregation**
- Design a shared `computeBottomUpRag()` function (new file: `frontend/src/utils/ragEngine.ts`)
- Two modes, two chain paths:
  - **Build**: projects/changeAdoption → capabilities → risks → policyTools/performance → objectives
  - **Operate**: orgUnits/processes/itSystems/vendors/culture → capabilities → risks → policyTools/performance → objectives
- Algorithm:
  1. Compute leaf-node RAG from instance properties (existing `getNodeInstanceRag` logic — verified correct)
  2. Walk up the chain: parent RAG = worst child RAG (red > amber > green)
  3. Special rule: risk with intervention plan → amber (not red), unless plan failed → back to red
- Both Ontology (`ontologyService.ts`) and Observe (`SectorDesk`) import and use this shared engine
- Line RAG derives from: worst RAG of the nodes it connects (not connectivity %)

**7. O4 — Parse-free structured metrics**
- In `SectorDesk.tsx` and/or `SectorDetailsPanel.tsx`, find where `capacity_metric` and `investment` strings are parsed
- Replace with structured field reads:
  ```
  investment: node.investment_value ? formatCurrency(node.investment_value, node.investment_currency) : node.investment_label || node.investment
  capacity: node.capacity_value ? formatCapacity(node.capacity_value, node.capacity_unit, node.capacity_secondary_value) : node.capacity_label || node.capacity_metric
  ```
- Add `formatCurrency()` and `formatCapacity()` helpers (simple number formatting)

**8. O6 — Cap status must match capability matrix**
- Find how Observe computes capability color strip
- Find how Enterprise (capability matrix) computes capability RAG
- Extract the Enterprise logic into the shared `ragEngine.ts`
- Observe imports the same function — guaranteed consistency

**9. H1 + H9 — RAG visual coverage for all node shapes**
- In `OntologyHome.tsx`, the diamond overlay loop already covers all 15 nodes
- **Buildings** (sectorObjectives, policyTools, performance, risks, capabilities, projects): Keep diamond overlay — already works
- **Objects** (adminRecords, dataTransactions, orgUnits, processes, itSystems): These have a grey platform + small shape on top. Add an SVG `<rect>` or `<circle>` overlay on the small shape, colored by RAG
- **Circular** (cultureHealth, vendors, riskPlans, changeAdoption): Add SVG `<circle>` overlay filling the circular button area, colored by RAG
- Need to measure exact positions from the landscape SVG for each shape type

**10. H3 — Yellow lines → derive from node RAG**
- In `ontologyService.ts`, replace `computeLineFlowHealth()` (connectivity-based) with:
  - Line RAG = worst RAG of (source node building, target node building)
  - If both green → green line. If either amber → amber. If either red → red
  - Never return 'default' — always compute from the two endpoints
- Update CSS: remove `ont-rel-line--default` gold color, ensure only red/amber/green exist

---

### PHASE 2: WIRE UP BROKEN FEATURES (items 15–30)

**11. D3+D4 — Redesign side panels (Decide)**
- L2 panel restructure:
  1. **Status lead**: RAG badge + one-line verdict at top
  2. **Maturity**: visual blocks (enforce ≥M3 for operational)
  3. **Linked KPI card**: reference to L2 perf KPI — clickable to expand KPI details
  4. **Upward chain**: simple breadcrumb: L2 cap → L2 perf → L1 perf → L1 objective (4 pills, not a list)
  5. **Risk summary**: if risks exist, show count + worst band + "Investigate" CTA
- L3 panel restructure:
  1. **Status lead**: gauge showing clear metric (label what's measured)
  2. **Maturity**: separate section, clearly labeled
  3. **Process metrics**: only if operate mode
  4. **Projects**: labeled clearly as "Gap-closing projects" with on-track/overdue badge
  5. **Risk**: actionable fields only (band, impact, mitigation status) — remove category/status

**12. H4 — Ontology side panels redesign**
- Node click panel:
  1. Node name + ID + RAG badge
  2. Instance list: each with RAG dot + name + one-line cause
  3. Drill-down: click instance → show upstream/downstream chain with clickable chips
  4. CTA: "Ask AI Advisor" → wired to `chatService.sendMessage()` with `prompt_key: 'risk_advisory'` and node context as query
  5. CTA: "Investigate in Enterprise" → calls `openApp('decide')` with capability ID (needs prop threading from desktop)
- Line click panel:
  1. Relation name + direction + RAG
  2. Connected count from/to
  3. Orphan highlights

**13. O7 — Cap click opens Enterprise with auto-select**
- Add `onOpenCapability?: (capId: string) => void` prop to SectorDesk
- Desktop wires it: `onOpenCapability={(capId) => { openApp('decide'); /* pass capId */ }}`
- EnterpriseDesk accepts `initialCapabilityId?: string` prop
- On mount with `initialCapabilityId`: auto-select that capability and open its side panel
- Needs shared state or event bus between windows — simplest: add `pendingCapabilityId` state in desktop, pass as prop

**14. H6 — Wire Ontology to calendar**
- OntologyHome: add `year?: string` and `quarter?: string` props
- Desktop: pass `year={year} quarter={quarter}` to OntologyHome in renderAppContent
- `ontologyService.ts`: change `const year = new Date().getFullYear()` to accept year as parameter
- Propagate through `fetchOntologyRagState(year, quarter)`

**15. O5, O8, O9, O10 — Observe functional fixes**
- **O5**: In SectorDetailsPanel, when no L2 policy/cap linked, show program's own data (name, investment, capacity, status) instead of empty sections
- **O8**: Add `ResizeObserver` in SectorMap that re-renders on container size change. Or use `useEffect` with `win.width`/`win.height` deps
- **O9**: Compute asset state dynamically: `state = (asset.completion_year <= selectedYear) ? 'Existing' : 'Planned'`
- **O10**: Fix pillar-to-program mapping: filter programs by `linkedPrograms` array on CascadeL2. Third pillar has no `linkedPrograms` → empty list

**16. D8 — Exposure overlay**
- In EnterpriseDesk matrix grid, compute per-cell: `exposure = normalize(riskRating * urgency * dependencyCount, min, max)`
- `min`/`max` computed dynamically across all visible cells
- Apply as background gradient: `rgba(red, 0, 0, exposure)` for red → `rgba(green)` for green
- Overlay renders behind cell content, opacity 0.1–0.3 range

**17. D9 — L2 intervention empty risk data**
- In `handleSelectOption`, for L2: walk down to L3 children, find the worst-risk L3, use its `rawRisk`
- If no L3 has risk: check if L2 has direct risk links from `integrated_oversight` chain

**18. P2 — Plan status ↔ risk status**
- When intervention plan is committed: update risk node's band to 'Amber' via backend
- Add a `planStatus` field on RiskPlan nodes: 'active' | 'overdue' | 'completed'
- Backend cron or trigger: if any task in plan is overdue → set planStatus='overdue' → risk back to 'Red'
- Frontend: RAG engine checks `risk.has_plan` + `risk.plan_status` when computing risk RAG

**19. C2 — Persona lock fix**
- Bug is in `useEffect` at line 331: `setSelectedPersona(null)` fires on `activeConversationId` change
- Fix: only reset persona when starting a NEW conversation (activeConversationId changes to null)
- When sending a message creates a new conversation_id, don't reset

**20. C9 — Prompts: "agency" → "SWA"**
- Backend/Supabase: UPDATE `instruction_elements` SET content = REPLACE(content, 'an agency', 'SWA (Saudi Water Authority)') WHERE content LIKE '%an agency%'
- Verify all prompt keys: general_analysis, risk_advisory, strategy_brief, intervention_planning

**21. S4 — Persist preferences**
- On change: `localStorage.setItem('jos-lang', language)`, same for theme, year, quarter
- On mount: read from localStorage, use as initial state
- Theme: also restore `data-theme` attribute on `<html>` from localStorage

**22. S3 — BIOS always English LTR**
- Boot screen JSX: hardcode `dir="ltr"` instead of `dir={isAr ? 'rtl' : 'ltr'}`
- All boot text strings: keep English only (already are, just fix the dir)

**23. B1+B2 — Observability missing data**
- Backend investigation: check `llm_request_logs` INSERT logic for long threads
- Check if context summary truncation skips the log write
- For dropped fields: trace the LLM response parsing in orchestrator — log raw response vs parsed fields
- MCP tool count: check if tool calls from MCP servers are counted differently than native tool calls

---

### PHASE 3: BUILD MISSING FEATURES (items 31–46)

**24. P1 + P3 — Progress tracking + plan RAG**
- Plan list view: fetch all plans, compute RAG per plan using project formula (timeline progress vs expected)
- Task-level RAG: each task gets green/amber/red based on due date vs today + completion %
- Plan-level RAG: worst task RAG
- Progress update flow (MVP): manual update page per plan — owner logs in, updates task % and status
- Future: email/notification integration

**25. H5 — AI narrative strip**
- On load: call `chatService.sendMessage()` with `prompt_key: 'ontology_narrative'` (new prompt)
- Query includes: RAG summary per column (counts of green/amber/red per building group)
- AI returns a 2–3 sentence narrative per column
- Cache result for the session, refresh on year/quarter change
- New Supabase prompt: instructs AI to write concise executive narrative from RAG data

**26. H10 + H11 — Canvas totals and relation labels**
- **H10**: For each node in SVG, add `<text>` element below/beside the building showing "X/Y" (red count / total)
- **H11**: For each line path, compute midpoint. Place `<text>` with relation name at midpoint
  - Two-way: offset the two labels vertically (one above line, one below)
  - Use collision detection: if two labels overlap, nudge one by 20px
  - Show count: "12 links" next to relation name

**27. X1+X2+X3 — Signals overhaul**
- **X1**: Update chain dropdown to list all 7 current chains. Remove references to cancelled chains
- **X2**: Pass `limit` param in URL: `buildGraphUrl()` appends `&limit=${nodeLimit}`. Backend: accept `limit` query param, inject into Cypher as `$limit`
- **X3**: Add diagnostic toggle. When on: fetch with `?diagnostic=true`. Compare diagnostic vs narrative nodes. Nodes in diagnostic but not narrative = orphans/bastards. Render as red dots on Sankey. Add legend explaining red dots

**28. P5 + P6 — Strategic Refresh + Scenario Planning**
- **P5 Refresh**:
  - New tab replacing "Strategic Reset"
  - Year selector dropdown
  - "Generate Snapshot" button → sends year + data query to AI with new `prompt_key: 'strategic_refresh'`
  - AI returns structured snapshot document
  - Save to Supabase table (new: `strategic_snapshots` with year, content, created_at)
  - List of past snapshots below
- **P6 Scenario Planning**:
  - Load current plan outcomes/outputs from chain data
  - Display as editable table: outcome name | current value | modified value
  - Free-text area for scenario description
  - "Analyze" button → sends modified values + prompt to AI with `prompt_key: 'scenario_analysis'`
  - AI returns viability analysis (ruthless, non-biased)
  - Save results to Supabase table (new: `scenario_analyses`)

**29. R2 + R3 — Reporting**
- **R2 Standard Reports**: Build 3 report templates as React components
  - Weekly PMO: query all EntityProject nodes, group by status, show milestones
  - Monthly Excom: query capabilities + risks + KPIs, show operational issues + upcoming projects
  - Adaa: standard format — query objectives + KPIs + achievement rates
  - Each template fetches live data via chain/cypher calls
  - "Generate" button renders the report, "Print/PDF" uses existing print mechanism
- **R3 Outcome Reports**: Query intervention plans + their risk status changes over time
  - Before/after: risk band at plan creation vs now
  - AI can narrate the delta with `prompt_key: 'outcome_report'`

**30. D1+D2 — Cell overflow + KPI label**
- D1: Remove `description` line from L2 cell render — match L1/L3 format
- D2: Investigate KPI- label source. If it's from chain data display, either make it meaningful (link to actual KPI) or remove

**31. B3 — Readable error messages**
- Create error message map in observability: `{ 'context_length_exceeded': 'Message too long...', 'rate_limit': '...' }`
- Display mapped message, keep raw error in expandable "Technical Details"

**32. T2+T3 — Multi-provider + GraphRAG**
- T2: Read Supabase `providers` table `features` column. In Settings UI: conditionally show/hide options based on provider's feature list
- T3: GraphRAG toggle: when enabled, backend injects relevant graph context into LLM system prompt before sending. Need to wire the toggle value through to orchestrator

---

### PHASE 4: POLISH (items 47–67)
- Execute as a batch pass after Phases 0–3
- Mostly single-line fixes, CSS tweaks, dead code removal
- Group by file to minimize context switches
- See individual item descriptions in the app sections below

---

## SHELL (JosoorDesktopPage.tsx)

### S1. ControlsDesk imported but never rendered
- `ControlsDesk` is lazy-loaded but has no app entry in APPS[] and no case in renderAppContent
- Was this meant to be an app? Or was it replaced by something else?
- **Decision needed**: Add it as an app or remove the import

### S2. Canvas panel positioned wrong
- Canvas overlay uses `top: 28` (old macOS topbar height) — should be `top: 0` now that topbar is gone
- Double `position: fixed` — desktop wraps CanvasManager in a fixed div, but CanvasManager already renders its own fixed container

### S3. BIOS boot screen must always be English LTR
- Currently uses `isAr` to set `dir` on the boot screen container
- BIOS is a system-level screen — should always render in English, always LTR
- Regardless of user's language preference

### S4. System must persist user preferences
- Language (AR/EN) — should be remembered across sessions
- Theme (light/dark) — should be remembered across sessions
- Last selected year/quarter — should be remembered across sessions
- Currently all reset to defaults on page reload (language=context default, theme=dark, year=2026, quarter=Q1)
- Use localStorage to persist

### S5. Build errors (TypeScript)
- `waterHighLevelHierarchy.ts`: TFunction signature mismatch (i18next v25)
- `SectorDetailsPanel.tsx`: `{percentage}%` multiple children in strict i18next span
- `SectorHeaderNav.tsx`: `linkedPrograms` missing from local CascadeL2 type
- `SectorMap.tsx`: `'All'` missing from 3 Record<MainCategory> maps
- **Status**: First two fixed this session, last two partially fixed

---

## OBSERVE (SectorDesk) — USER REQUIREMENTS

### O1. useNavigate + useOutletContext crash outside Router
- SectorDesk uses `useNavigate()` and `useOutletContext()` from react-router-dom
- In the desktop OS, it's rendered as a standalone component OUTSIDE a Router outlet
- **This will crash at runtime** with a React Router invariant error
- `navigate` is imported but never called (dead code that still crashes)
- **Fix**: Remove useNavigate/useOutletContext, rely on props only

### O2. Pillar switching is locked
- `selectedPillar` state defaults to `'economy'` but `setSelectedPillar` is never called
- No UI element allows changing the pillar
- Society sectors (health, water, culture, livability) and Nation sectors (gov) are unreachable through the pillar filter
- Direct sector selection still works, but the pillar-based filtering/reset logic is broken

### O3. Quarter not passed to SectorDetailsPanel
- `quarter` is passed to SectorMap and SectorSidebar but NOT to any of the 5 SectorDetailsPanel instances
- SectorDetailsPanel accepts `quarter?: string` but never uses it in rendering either
- If quarter-level detail is a business requirement for the details view, this needs wiring

### O4. Frontend must use structured metric fields (parse-free)
- DB migration done: `SectorPolicyTool` nodes now have structured fields instead of raw strings
- **Old**: parse `"SAR 790.7 Million"` from `investment` string, parse `"45k–92k seats"` from `capacity_metric` string
- **New fields**: `investment_value` (float), `investment_currency` (str: SAR/USD), `investment_label` (str for "Not specified")
- **New fields**: `capacity_value` (float), `capacity_unit` (str), `capacity_secondary_value` (float for ranges), `capacity_secondary_unit` (str), `capacity_label` (str for text-only)
- Display logic: if `capacity_value` exists → formatted number + unit; if `capacity_secondary_value` → show as range; else show `capacity_label` as-is
- Original `capacity_metric` and `investment` strings preserved as fallback
- **Frontend must switch from string parsing to reading structured fields**

### O5. Side panel: delivery program → empty when no L2 policy/cap
- When clicking a delivery program, panel shows related policy tools and linked capabilities
- When there is NO L2 policy tool and hence no capability, panel shows empty entries
- Should handle this gracefully — show "no linked policy tools" or show the program's direct data instead

### O6. Capability status color strip: must match capability matrix
- The color strip for capabilities doesn't match the status used in the capability matrix (Enterprise Desk)
- Must use the same RAG/status logic as the capability matrix for consistency

### O7. Capability click should open Enterprise Desk with auto-opened side panel
- Clicking a capability from the policy→cap tree should open the Decide (Enterprise) app
- Auto-open the side panel there with that specific capability selected
- Currently: nothing happens on click

### O8. Map does not update on window resize / fullscreen
- Map uses fixed dimensions from initial render
- When user maximizes the window, the map doesn't reflow to fill the new size
- Needs a resize observer or re-render on window state change

### O9. Asset state (existing/planned) should change with year filter
- Currently asset states remain static regardless of selected year
- If an asset is due in 2027 and user selects 2027, its state should show "existing" not "planned"
- Year filter must affect the computed state of each asset

### O10. Third pillar shows all programs — should show none
- Pillar 3 mapping is wrong: it shows all programs when selected
- There should be NO programs under the third pillar
- First two pillars: all delivery programs and water assets must be reflected, no orphans

### O11. RAG aggregation: bottom-up from capabilities through chain
- Once capability status is corrected (O6), it needs to aggregate upward
- Same bottom-up rules as ontology (H2): cap → policy tool → delivery program → sector objectives
- Status should visually appear at each level of this chain

---

## DECIDE (EnterpriseDesk) — USER REQUIREMENTS

### D1. L2 cell overflow: description line causes text spill
- L2 cells have a description line that overflows onto cells below when window is resized
- **Fix**: Remove the description line from L2 cells so they match L1/L3 cell format

### D2. KPI- label under L1 and L2: unclear purpose
- L1 and L2 cells show a "KPI-" label underneath — purpose is unclear
- What is it? What is it supposed to do? Needs clear definition or removal

### D3. MAJOR: Side panels are data dumps with no clear purpose
- Massive walls of data with no narrative, no traceability, no "what, why, due to what"
- Reader cannot trace problems through the chain
- Panels must tell a story: what is the status, why, and what is causing it

### D4. L2 panel: wrong content order and broken KPI display
- **L3 cap in operation** shown first before status — wrong priority, status should lead
- **"L2 formula and inputs"** — capabilities don't have formulas. This makes no sense
- If showing KPI for an L2 capability: add a reference to the L2 KPI linked to it
- KPI should have its own card — click to see details instead of cramming everything in the cap panel
- Even the KPI inputs make no sense: text descriptions with no reference, counts showing red without temporal planned vs target comparison (absolute comparison is wrong)
- **Upward link section**: incomprehensible long list of random data
  - Should simply show: L2 cap → L2 perf → L1 perf → L1 objective (simple upward chain)
  - Currently shows random noise

### D5. L2 panel: gauge unclear, maturity disconnect
- Gauge: not clear what value is measured, what planned vs target means, no timeline context
- Maturity block sits right under gauge, implying gauge is about maturity — but they're separate measurements
- Many cases: maturity shows 1 while status says "in operation" — operation requires M3 minimum
- **Maturity vs status must be consistent** — can't be M1 and operational

### D6. L3 panel: total disconnect between gauge, maturity, and metrics
- Gauge shows 0% while maturity shows M5 — and all siblings at M5 while parent is M1
- Gauge numbers reappear further down in "process metrics" section — confusing duplication
- **Ops footprint** (projects?): not clear what this is, no indication if projects are on track, no explanation why M5 capability has projects
- **Risk profile**: shows "category" and "status" fields — absolutely useless, tells nothing actionable

### D7. Chain data: reading wrong fields, aggregating incorrectly
- The chains being read and what is extracted from them is fundamentally wrong
- Wrong fields being read, wrong aggregation logic
- Must match the actual chain structure and field semantics

### D8. Exposure overlay: not applied
- Supposed to be a gradient coloring based on dynamic min/max formula
- Formula = f(risk rating, urgency, dependencies)
- Currently not implemented — no gradient, no dynamic calculation

### D9. L2-level interventions produce empty risk data
- `handleSelectOption` reads `cap.rawRisk?.id` and `cap.rawRisk?.band`
- For L2Capability, `rawRisk` doesn't exist — silently produces empty strings
- Intervention context sent to PlanningDesk will have blank riskId and band

---

## DELIVER (PlanningDesk) — USER REQUIREMENTS

### P1. No progress tracking mechanism
- Intervention plans are saved and retrieved correctly
- **Missing**: How do plans reach task owners? No notification/assignment system
- **Missing**: How do owners report back progress on their tasks? No update flow
- Plans exist in isolation — no feedback loop from execution back to the system

### P2. No link between plan status and risk status
- Once a risk has an intervention plan, its RAG should move to **Amber** (not solved, but under monitoring)
- If the plan fails (tasks overdue/blocked), there needs to be a trigger to bump risk back to **Red**
- Currently: risk status and plan status are completely disconnected

### P3. Plan list should show RAG at list level
- The list of intervention plans should show RAG per plan (same formula used for projects)
- When entering a plan: RAG per task should be visible
- Currently: no status indicators at list or task level

### P4. Language switch doesn't regenerate plan
- `useEffect` that generates the intervention plan has `[context, t]` deps
- `language` is used inside but missing from dependency array
- If user switches AR/EN after a plan is generated, it stays in the old language

### P5. Strategic Reset → rename to Strategic Refresh
- This is NOT a reset — it's a **Refresh**, a normal end-of-year exercise
- Requires a snapshot as input to the exercise/workshop
- **Page redesign**:
  - Year selector to choose which year to snapshot
  - AI button sends to a Supabase prompt key (follows same rules/structure as other prompts)
  - Prompt instructs AI how to create a yearly snapshot
  - Simple query provides the snapshot for the selected year, AI returns it
  - Each snapshot is listed and saved for future reference
- Prompt must be stored in Supabase `instruction_elements` table like all other prompts

### P6. Scenario Planning: must be outcome-based with AI analysis
- Scenario planning feeds into the Refresh workshop naturally:
  - Workshop gets the snapshot → discussions end with options needing validation
  - AI button pattern (same as rest): sends to prompt key, gets analysis back
- **Scenario controls redesign** — must be outcome-based:
  - List current plan's outcomes and outputs
  - Next to each: modified values (what-if inputs)
  - Open text area for additional prompt context
  - Button sends modified outcomes + prompt key to AI
- **AI output requirements**:
  - Non-biased, ruthless viability analysis of proposed outcome changes
  - Assessed against current baseline AND Vision objectives mandates
  - What it would take to achieve them, even if tough
  - If not possible: best aggressive plan + risks for it
  - No sugar-coating
- **Inputs are dynamic** — vary based on which scenario controls the user adjusts
- Each analysis result gets saved and listed (like snapshots)

### ~~P7. Risk plan API~~ — REMOVED (works fine, false alarm from curl test)

---

## REPORTING (ReportingDesk) — USER REQUIREMENTS

### R1. Entirely hardcoded mock data — must be replaced with real data
- All API fetch logic is commented out
- `reportingService` referenced in comments doesn't exist in the codebase
- The desk shows only static dummy data

### R2. Standard Reports tab (priority — start here, not Outcomes)
- Three standard report types, each needs ONE real example built from our data:
  1. **Weekly PMO Report** — all projects, weekly cadence
     - Project status, milestones hit/missed, blockers, upcoming tasks
  2. **Monthly Excom Report** — programs and operations, monthly cadence
     - Current operational issues + KPI status
     - Projects upcoming and which operations depend on them to increase capabilities
     - Capabilities needed to achieve more targets
  3. **Adaa Report** — standard government performance reporting format
     - One real example based on our water sector data
- Reports generated on the fly from live data (chains, neo4j, cached data)

### R3. Outcome-Based Reports tab
- Measures whether interventions have been effective or not
- Sources:
  - Risk interventions from Deliver (PlanningDesk)
  - Refresh exercise outcomes (Strategic Refresh snapshots)
- Can be AI-generated analysis OR deterministic script with AI explanation
- Shows before/after comparison: what was the risk, what intervention was taken, what changed

---

## SIGNALS (ExplorerDesk) — USER REQUIREMENTS

### X1. Chain references outdated — must use redesigned chains
- Still refers to chains that were cancelled and split
- Must be updated to use the current 7 chains:
  - `build_oversight`, `operate_oversight`, `sector_value_chain`
  - `setting_strategic_priorities`, `setting_strategic_initiatives`
  - `sustainable_operations`, `integrated_oversight`

### X2. Adjustable node limit slider broken
- UI has a limit slider but it doesn't work
- Backend ignores the `limit` URL parameter — `LIMIT 200` hardcoded in Supabase Cypher queries
- See `docs/TASK_DIAGNOSTIC_AND_LIMIT.md` Task 2 for full spec on fixing this

### X3. Diagnostic queries: orphans and bastards visualization
- **Designed but not implemented** (see `docs/TASK_DIAGNOSTIC_AND_LIMIT.md` Task 1)
- Diagnostic queries return MORE nodes than narrative (includes chain break points)
- **Orphans** ("abandoned"): nodes where the chain path did not continue — dead ends
- **Bastards** ("no parent"): nodes with no predecessor in the chain
- These should appear as **red dots on the Sankey** diagram
- Purpose: highlight data quality issues for discussion with owners to fix
- Each chain has a `diagnostic=true` query variant in Supabase `chain_queries` table
- Only `build_oversight` diagnostic was tested; other 6 need verification

### X4. Schema query fires but result is never used
- `graphService.getSchema()` runs on mount but `schemaData` is never rendered

### X5. getNodeColor defined twice with different logic
- Module-level version used by normalizeGraphData
- useCallback version (with diagnostic status checks) passed to NeoGraph
- Potential color inconsistency between graph rendering and data normalization

---

## EXPERT CHAT (ChatContainer in desktop) — USER REQUIREMENTS

### C1. Remove recall_memory and recall_vision buttons
- These two tool buttons are redundant — they're already embedded in the prompts
- Showing them causes confusion, implying the user needs to toggle them
- Remove from the UI entirely

### C2. Persona selection: needs rethink + lock bug
- Current personas reuse the same prompts as the AI buttons elsewhere
- Question: are these personas useful for an open chat discussion context? Need review
- **Bug**: Rule is once a persona is selected it locks for that session
- Currently: dropdown resets to "choose a persona" after every message sent
- Lock mechanism is broken

### C3. Conversation summary at context limit
- Solution was deployed but not thoroughly tested
- Needs verification: does the summary correctly compress history when hitting the limit?
- Edge cases: long conversations, multi-artifact chats, tool-heavy sessions

### C4. New chat example prompts: not relevant
- Current placeholder prompts don't showcase the system's power
- Need to be replaced with prompts that demonstrate real capabilities (chain analysis, risk diagnosis, KPI queries, etc.)

### C5. Conversation history sidebar: lost visual detail
- Used to show date and message count per conversation
- Now shows only the title — visual regression
- Restore date and message count display

### C6. Artifact name shows "HTML Report" instead of actual name
- When AI reply includes artifacts, the bubble shows "HTML Report" generically
- Should show the actual report/artifact name

### C7. Artifact list: "Back to list" only shows current artifact
- Opening an artifact then clicking "Back to list" should show ALL artifacts for that reply
- Currently only shows the one artifact that was opened

### C8. User message bubble color: green too harsh
- Green bubble is hard to read
- Change to a more readable color (softer tone or different hue)

### C9. All prompts reference "an agency" — must say SWA
- References across all Supabase prompts are generic ("an agency")
- Must be updated to explicitly reference SWA (Saudi Water Authority)
- Affects: system prompts, persona instructions, all prompt keys

### C10. onToggleSidebar is a no-op
- Desktop passes `() => {}` — sidebar toggle button does nothing
- Desktop has its own chat sidebar built inline — the internal toggle is disconnected

---

## ONTOLOGY (OntologyHome) — USER REQUIREMENTS

### H1. RAG for nodes: incomplete coverage
- **Buildings** (large shapes with white icon top): Currently get diamond overlays — OK approach
- **Objects** (grey platform + small shape on top): The small shape on top should change color to show RAG — NOT IMPLEMENTED
- **Circular button nodes** (cultureHealth, vendors, riskPlans, changeAdoption): Should be fully RAG-colored — NOT IMPLEMENTED
- Missing RAG on: `ppl` (orgUnits), `process`, `tool` (itSystems) — breaks link to projects
- **Every shape must have a status**, otherwise why is it on the canvas

### H2. RAG logic: must be bottom-up chain aggregation
- Current logic: upstream cascade (downstream exposure) — NOT the correct model
- **Correct model**: Bottom-up aggregation through chains
  - **Build mode**: starts at `change` (projects/change adoption) → capabilities → risks → policy/performance → objectives
  - **Operate mode**: starts at enterprise elements (orgUnits, processes, itSystems, vendors, culture) → capabilities → risks → policy/performance → objectives
  - If risk pushes reds to policy AND performance, then policy and perf should be red too
  - If policy and perf are red, then objectives is also red
  - The chain concept must be built into how RAGs are calculated
- **Planning chains are NOT status chains** — only bottom-up operational chains define RAG
- Current `getNodeInstanceRag()` computes per-instance correctly, but building aggregation doesn't propagate upward through the chain

### H3. Solid yellow lines — impossible state
- Lines showing as yellow/gold when status is `'default'` — this means "no data"
- A line between two connected nodes should NEVER be yellow — it should reflect the RAG of the data flowing through it
- Yellow = we don't know = we haven't computed it = bug
- Line RAG should derive from the RAG of the nodes it connects (bottom-up principle)

### H4. Side panels: mess of random data
- Broken traceability — drill-down doesn't consistently show cause chain
- Missing node ID consistently in the panel
- No clear CTA flow: the point is to drill down to the culprit, then use AI button to analyze the risk/issue and provide intervention options
- Risks/issues root in either:
  - Enterprise elements (people shortage, broken processes, faulty systems, poor vendors, low culture scores)
  - OR if capability is being built → projects closing the gaps
- "Ask AI Advisor" button exists but is a stub — needs to be wired
- "Investigate in Enterprise Desk" button exists but doesn't navigate — needs to be wired

### H5. Status strip: too basic, not visual enough
- Currently: stats only + text like "sector delivery is healthy"
- **Required**: Visually modern and intuitive (not just numbers and text)
- Should tell the story — not a one-liner summary
- **AI-generated narrative**: Short paragraph loaded dynamically via AI call (unlike buttons, this loads automatically)
- The strip should be a living narrative, not static counters

### H6. Not wired to year/quarter calendar
- Uses `new Date().getFullYear()` — ignores the desktop calendar state
- Year and quarter from CalendarDesk should flow into Ontology
- OntologyHome needs to accept `year` and `quarter` props

### H7. No sector indicator
- Nothing on the canvas says "Water Sector"
- Our demo is built on Water — this should be clearly visible
- Need a sector label/badge on the dashboard

### H8. Canvas zoom: 5% too large
- Current viewBox fills 100% of container
- Should be 95% (5% smaller) for better framing/breathing room

### H9. Node RAG visual per shape type
- **Buildings** (white icon top face): Diamond overlay on top — current approach, keep it
- **Objects** (grey platform + small colored shape on top): The small shape changes color based on RAG
- **Circular nodes** (culture, vendors, riskPlans, changeAdoption): Entire circle fills with RAG color

### H10. Totals should appear on the canvas near each node
- Currently totals only appear in the signal strip at the bottom
- Each node on the SVG should show its count/total near it (e.g., "5/8" or "3 red")
- More contextual — user sees status at a glance without needing to click

### H11. Relation names on lines + totals near each line
- Each line should display its relation name (e.g., "FEEDS_INTO", "MONITORED_BY")
- Two-way arrows = two relation names (one per direction) — must accommodate both
- Totals/counts near each line (e.g., "12 links")
- Layout must avoid overlaps between labels on adjacent or crossing lines

---

## TUTORIALS (TutorialsDesk) — USER REQUIREMENTS

### TU1. Look and feel needs a visual refresh
- Current design needs another pass for polish and consistency with the rest of the OS

### TU2. Media links: switch from local to YouTube embeds
- Videos and audios are now hosted on YouTube
- Must change all local file references to embedded YouTube players
- Need the actual YouTube URLs to update

---

## SETTINGS — USER REQUIREMENTS

### T1. Writing back to DB never works
- Reading settings displays fine
- Saving/updating settings fails consistently
- `adminSettingsService` hits `/api/admin/settings` (no `/v1/` prefix) — 404
- Backend endpoint doesn't exist or routing is wrong
- **Nothing can be saved**

### T2. Multi-LLM provider support: feature-based customization
- Need to support multiple LLM providers with different feature sets
- Supabase has a column listing features supported per provider
- UI should customize options shown based on what the selected provider supports
- **Never implemented** — all providers show the same generic options

### T3. GraphRAG semantic context injection: never activated
- Feature exists in concept: inject graph RAG semantic context into LLM calls
- Toggle exists in UI but the backend feature was never wired
- Needs activation and end-to-end testing

### T4. Two different HTTP stacks
- Provider APIs use `apiClient` (axios with auth headers)
- System settings use raw `fetch` with manual token
- Inconsistent auth handling may contribute to save failures

---

## OBSERVABILITY — USER REQUIREMENTS

### B1. Messages from long threads sometimes missing from Supabase
- Some messages in long conversations don't appear in observability traces
- Possibly related to thread length / context limit triggers
- Need to investigate if the backend stops logging after a certain point

### B2. LLM output parsing drops fields
- Parsing the LLM response to populate observability fields is inconsistent
- **Reasoning**: not always appearing even when the LLM returns it
- **MCP tool calls**: sometimes counted, sometimes not — despite actually executing
- Fields are silently dropped during parsing

### B3. Error messages are cryptic
- When errors occur, the displayed messages are unhelpful
- Need human-readable error descriptions (what failed, why, what to check)

### B4. Division by zero on empty data
- `Math.round((total_cached / total_tokens) * 100)` — if total_tokens is 0, renders "NaN%"

### B5. Inline styles in render
- ~100 lines of CSS injected via `<style>` tag on every render
- Should be in the CSS file

---

## CALENDAR (CalendarDesk)

### No issues found
- Props match perfectly with what desktop passes
- Year/quarter changes propagate to all consuming apps via shared state

---

## CROSS-CUTTING

### CC1. useOutletContext used by desk components
- SectorDesk (and possibly others) use useOutletContext as fallback for year/quarter
- In desktop context, there's no Router outlet — this either crashes or returns null
- Need to verify which desks use this pattern and ensure they all fallback to props

### CC2. OntologyHome ignores shared calendar state
- All other apps use the year/quarter from desktop state
- OntologyHome derives year independently — calendar changes don't affect it

### CC3. ReportingDesk has no real data pipeline
- Every other desk connects to real APIs
- Reporting is fully mocked — stands out as incomplete
