# TASKS.md — JOSOOR Implementation Tasks (SINGLE SOURCE OF TRUTH)

Source: `josoorfe/docs/plans/2026-02-13-FINAL-IMPLEMENTATION-PLAN.md` + existing backlog

Goal: **Screenshot-ready for landing page & client demos**

**Telegram:** Group -1003713840380 | Thread column = forum topic ID

---

## Master Task List — 20 tasks

| # | Thread | Task | Priority | Est | Blocks | Status | QA |
|---|--------|------|----------|-----|--------|--------|-----|
| 1 | 47 | Enterprise Overlays (fix all-green) | P0 | 1h test | — | DONE ✅ — Core overlay fix complete. 4 sub-requirements remain (R4, R5, R8, R9). | ⏳ SUB-ITEMS PENDING |
| 2 | 48 | Risk Agent — analyze & run | P0 | 2-3h | — | PAUSED ⏸️ | ⏳ NOT TESTED |
| 3 | 49 | Planning Lab — build from scratch | P0 | 6-8h | — | UI SHELL ONLY — hardcoded data, no backend, no API calls | ⏳ NOT TESTED |
| 4 | 50 | Chain Query Consistency (14 Supabase queries) | P0 | 4-6h | — | DONE ✅ | ✅ VERIFIED |
| 5 | 375 | Fix empty canvas | P1 | 1-2h | — | DONE ✅ | ✅ VERIFIED |
| 6 | 51 | Canvas opens briefs | P1 | 1-2h | — | DONE ✅ | ✅ VERIFIED |
| 7 | 52 | Fix strategy brief prompt → HTML | P1 | 1h | — | DONE ✅ | ✅ VERIFIED |
| 8 | 53 | Charts in bubble | P1 | 1-2h | — | DONE ✅ | ✅ VERIFIED |
| 9 | — | AI Button Prompts (Supabase table + API + templates) | P1 | 3-4h | — | NEEDS VERIFICATION | ⏳ NOT TESTED |
| 10 | — | AI Button UI (icon component + desk integration) | P1 | 3-4h | Blocked by #9 | TODO | ⏳ NOT TESTED |
| 11 | — | Fix condenser (remove code-side keep_last_n) | P1 | 2h | — | DONE ✅ | ✅ VERIFIED |
| 12 | — | Frontend compaction indicator | P1 | 1-2h | — | DONE ✅ (commit a5fbe9c) | ✅ VERIFIED |
| 13 | — | /josoor sidebar changes | P1 | TBD | — | DONE ✅ — 4 sections: Oversight/Manage/Refer/Admin | ✅ VERIFIED |
| 14 | — | LLM Model Comparison experiment | P2 | TBD | — | TODO | ⏳ NOT TESTED |
| 15 | — | Clean 112 dead files in mem_dump/ | P2 | 1h | — | DONE ✅ | ✅ VERIFIED |
| 16 | 54 | Fix observability parsing (ALL fields) | P2 | 2-3h | — | TODO | ⏳ NOT TESTED |
| 17 | — | Locate ETL code path | P2 | 0.5h | — | DONE ✅ | ✅ VERIFIED |
| 18 | — | Landing page mobile responsive | P1 | 2-3h | — | DONE ✅ | ✅ VERIFIED |
| 19 | — | Canvas save/print full content | P1 | 1-2h | — | DONE ✅ (commit 7c32ab4) | ✅ VERIFIED |
| 20 | — | Canvas artifact list always empty | P1 | 1-2h | — | DONE ✅ | ✅ VERIFIED |

---

## Summary

- **DONE:** 14/20 (#1 core, #4, #5, #6, #7, #8, #11, #12, #13, #15, #17, #18, #19, #20)
- **UI SHELL ONLY:** 1 (#3 — Planning Lab has hardcoded data, no backend integration)
- **PAUSED:** 1 (#2 — Risk Agent)
- **TODO:** 2 (#10, #14, #16)
- **NEEDS VERIFICATION:** 1 (#9)
- **SUB-ITEMS PENDING:** Task #1 has 4 remaining sub-requirements (R4, R5, R8, R9)

---

# TASK DETAILS

---

## #1 — Enterprise Overlays (fix all-green)

**Thread:** 47 | **Priority:** P0 | **Status:** DONE ✅ — Core overlay fix complete. 4 sub-requirements remain.

### Problem
Enterprise Desk capability matrix showed all-green regardless of actual data. Overlays (Risk Exposure, External Pressure, Footprint Stress, Change Saturation, Trend Warning) were not reflecting real property values from Neo4j.

### What was done
- Fixed overlay color logic to read actual node properties
- Tooltips enriched with real data
- 5 overlay modes working: Status Only, Risk Exposure, External Pressure, Footprint Stress, Change Saturation, Trend Warning

### Files modified
- `frontend/src/components/desks/enterprise/CapabilityMatrix.tsx`
- `frontend/src/components/desks/EnterpriseDesk.tsx`

### Remaining: Risk agent must run (Task #2) to populate all overlay properties

### Capability Detail Panel Sub-Requirements (R1-R12)

These requirements came from user session 573bb083 (2026-02-20). They apply to the Enterprise Desk capability detail panel.

**Core user spec (Message 8):**
> "i didnt see the trend flag. things like this 'issues' should be 'Issues'. The q and year need to be clear it is start date. start of build or start of operate. and lets unify the Execute to be build. I thought we had some thing that says WHEN the maturity level is to be achieved? otherwise if the gap is 1 or 4 its all late, we need a reference. check the sst risk formulas, what is the formula for this? When in Operate, you need to get the metrics linked to it and for the people/process/IT you need to show their name not a generic name, and in build where are the project deliverables linked and their status. these are all against the chains. On the other hand, we need to also show the capability link upwards from cap 2 to policy 2 or performance 2 and then to objective. so when i click on cap L2 open the right panel but show something different. this would be the tree and kpis/objectives (use the old gauges) or projects and status."

| Sub-Req | Description | Status |
|---------|-------------|--------|
| R1 | Trend flag — must be visible in the panel | DONE ✅ (operate_trend_flag shown as early warning) |
| R2 | Capitalize ALL status values — "issues" → "Issues" | DONE ✅ |
| R3 | Year/Quarter labeling — show as "Start of Build" or "Start of Operate" | DONE ✅ |
| R4 | Maturity target date / reference — WHEN is the maturity level to be achieved? Check SST risk formulas | NOT DONE — no timeline/reference date exists in current data |
| R5 | OPERATE mode — metrics linked to capability + show actual entity names (not generic) | PARTIAL — entity names shown, but METRICS ARE MISSING |
| R6 | BUILD mode — project deliverables linked with status, IDs, grouping, %, overdue | DONE ✅ |
| R7 | Remove thresholds | DONE ✅ |
| R8 | Exposure calculation — "I dont understand how the exposure is calculated" — needs clarification or better display | NOT ADDRESSED |
| R9 | L2 click — upward chain panel — Cap L2 → PolicyTool/Performance L2 → Objective, with old gauges, in same right panel | NOT DONE |
| R10 | Overlay buttons — dim out all except Status Only + Risk Exposure | DONE ✅ |
| R11 | No extra DB calls — all data from initial enterprise query, no per-panel fetches | DONE ✅ |
| R12 | Cross-product fix — too many projects per capability, fixed with sequential WITH clauses | DONE ✅ |

**Remaining work (ordered by priority):**
1. **R5 — OPERATE metrics** — Must show metrics/KPIs linked to the capability (likely SectorPerformance via SETS_TARGETS per SST §4.3)
2. **R9 — L2 upward chain panel** — Cap L2 → PolicyTool/Performance → Objective, with gauges, in same right panel
3. **R4 — Maturity target date** — Check SST for formula/reference
4. **R8 — Exposure calculation** — Clarify display

---

## #2 — Risk Agent — analyze & run

**Thread:** 48 | **Priority:** P0 | **Status:** PAUSED ⏸️

### What was completed
- ✅ Risk engine: `backend/scripts/risk_engine.py` (deterministic SST v1.2 formulas)
- ✅ **Production runs completed Feb 14** — Engine ran 4 times on production Neo4j
- ✅ **Data IS in Neo4j** — 382 nodes scored, L3 values: 25.0/75.0
- ✅ **Clean rounded values** — percentages=integers, lod=2 decimals, risk_score=1 decimal
- ✅ **L2/L1 rollups completed** — Risk data propagated up the hierarchy

### Per SST v1.2 §5.9, EntityRisk nodes have these properties:

**BUILD mode:**
- `likelihood_of_delay` (float 0..1)
- `delay_days` (int)
- `expected_delay_days` (float, aka risk_score)
- `build_exposure_pct` (float 0..100)
- `build_band` (string: 'Green'|'Amber'|'Red')

**OPERATE mode:**
- `operational_health_pct` (float 0..100)
- `operate_exposure_pct_raw` (float 0..100)
- `operate_exposure_pct_effective` (float 0..100)
- `operate_band` (string: 'Green'|'Amber'|'Red')
- `operate_trend_flag` (bool)

**Trend state:**
- `prev_operational_health_pct` (float 0..100)
- `prev2_operational_health_pct` (float 0..100)

### Per SST v1.2 §5.8, INFORMS relationships have these properties:
- `active` (bool)
- `mode` ('BUILD'|'OPERATE')
- `exposure_pct` (float 0..100)
- `year`, `quarter`, `asof_date`, `last_run_id`

### Next step
Task #1 (Enterprise Overlays) — Frontend must read these risk properties via MONITORED_BY join

---

## #3 — Planning Lab — build from scratch

**Thread:** 49 | **Priority:** P0 | **Status:** UI SHELL ONLY — hardcoded data, no backend, no API calls

### Problem
Planning Lab needs to be built. Currently only a UI shell exists with hardcoded data — no backend integration, no API calls, not a working system.

### Three entry paths

**Path A: Intervention Planning**
Sector Dashboard/Capability View → red KPI → AI Explain button → options → leader selects → DECISION → Intervention Planning (plan attaches to problem node, stays red until resolved)

**Path B: Annual Planning**
Direct navigation → Annual Planning → Refresh mode (no AI Explain, no DECISION, just regular annual refresh)

**Path C: Scenario Simulation**
Matrix of outputs/outcomes pre-populated with current plan → user asks AI "what if I want outcome X delivered 2 months earlier?" → AI responds with feasibility + required changes

### Key Concepts
1. **DECISION** = AI Explain button on red KPI → AI gives options → leader selects one
2. **Refresh** = end-of-year tweak, stay on course
3. **Reset** = throw plan in garbage, start from scratch
4. **Outcomes** = national lagging KPIs (L1 strategic goals, e.g. "improve health of citizens")
5. **Outputs** = operational KPIs (L2 tactical deliverables, e.g. "10 new hospitals")
6. **"Inject into flow"** = plan attaches to problem node, continues to be red until actions change reality
7. **Relationship path:** Capability → Gap (ROLE_GAPS/KNOWLEDGE_GAPS/AUTOMATION_GAPS) → OrgUnit/Process/ITSystem → GAPS_SCOPE → Project (2 hops, indirect)

### Subtasks
- [ ] Find old hardcoded prompt from previous Planning Lab tsx (user said "it was in one of the older versions hard coded in the tsx")
- [ ] Research gantt chart skill/library (Mosab said "equip a skill on gantt charts")
- [ ] Design graph storage for plans and propose to Mosab:
      - L4 task level (currently only L1-L3, never had task level)
      - Plan nodes attached to problem nodes
      - Mosab said "I leave it up to you to suggest"
- [ ] Build Path A: Intervention Planning UI
- [ ] Build Path B: Annual Planning UI (refresh vs reset mode)
- [ ] Build Path C: Scenario Simulation UI (outcomes/outputs matrix)
- [ ] Implement plan schema on nodes:
      - Stakeholder owner
      - Clear output deliverables
      - Clear dates
      - Clear hard end date
      - Clear dependencies
      - New risks/issues

### User notes
- "for this equip a skill on gantt charts and suggest where to save"
- "currently plans are limited to dates on nodes, projects are output based dates"
- "We never had task level (that is L4), but I guess we can. I leave it up to you to suggest."

---

## #4 — Chain Query Consistency (14 Supabase queries)

**Thread:** 50 | **Priority:** P0 | **Status:** DONE ✅ | **QA:** ✅ VERIFIED

### What was done
- All 7 chains standardized with v4 queries in Supabase `chain_queries` table
- LIMIT 200 appended to prevent excessive results
- `build_oversight` special rewrite: hop-by-hop UNION ALL (8 independent hops, LIMIT 25 each) to avoid Aura OOM
- No APOC functions, no embedding properties in results
- Year conversion with `toInteger()` in all queries
- ID handling: `properties(n).id` for display, `elementId(n)` for graph links

### Live results (all HTTP 200)
| Chain | Nodes | Links |
|-------|-------|-------|
| build_oversight | 193 | 182 |
| operate_oversight | 25 | 25 |
| sector_value_chain | 15 | 23 |
| setting_strategic_priorities | 23 | 22 |
| setting_strategic_initiatives | 19 | 18 |
| sustainable_operations | 28 | 35 |
| integrated_oversight | 88 | 100 |

### Files modified
- Supabase `chain_queries` table (14 queries — 7 narrative + 7 diagnostic)
- `frontend/src/components/desks/GraphSankey.tsx` (client-side aggregation)

---

## #5 — Fix empty canvas

**Thread:** 375 | **Priority:** P1 | **Status:** DONE ✅ | **QA:** ✅ VERIFIED

### Problem
`handleOpenArtifact` in ChatAppPage.tsx doesn't pass artifact properly to UniversalCanvas → canvas opens empty.

### What was done
Fixed spread operator bug in MessageBubble.tsx. DEBUG LOGS NEED CLEANUP before production.

### Files
- `frontend/src/components/ChatAppPage.tsx` — manages canvas state, `handleOpenArtifact`
- `frontend/src/components/dashboards/UniversalCanvas.tsx` — auto-detecting polymorphic renderer
- `frontend/src/components/CanvasPanel.tsx` — slide-out artifact viewer

---

## #6 — Canvas opens briefs

**Thread:** 51 | **Priority:** P1 | **Status:** DONE ✅ | **QA:** ✅ VERIFIED

### Problem
Briefs with embedded charts don't open in canvas.

### Verification Result
- ✅ Briefs **DO** open in canvas — full code path exists and works
- ✅ MessageBubble.tsx (lines 564-581): Renders clickable artifact chips for ALL types including REPORT
- ✅ ChatAppPage.tsx: `handleOpenArtifact` sets canvas state correctly
- ✅ CanvasManager.tsx + UniversalCanvas.tsx: Route REPORT/HTML to ArtifactRenderer
- ⚠️ **Embedded charts don't render** — this is Task #8 (backend doesn't send artifact objects in metadata)

### Files verified
- `frontend/src/components/chat/MessageBubble.tsx` (lines 526, 544, 572, 577, 710)
- `frontend/src/pages/ChatAppPage.tsx` (line 320)
- `frontend/src/components/chat/CanvasManager.tsx`
- `frontend/src/components/chat/UniversalCanvas.tsx`

---

## #7 — Fix strategy brief prompt → HTML

**Thread:** 52 | **Priority:** P1 | **Status:** DONE ✅ | **QA:** ✅ VERIFIED

### Problem
LLM returns markdown for strategy briefs, but design intent is HTML output. The strategy brief query template uses `###` markdown headings in its own instructions, so LLM mirrors the format.

### Root cause
Query template prompt doesn't explicitly say "respond in HTML". LLM mirrors prompt format → outputs markdown with `<ui-chart>` tags embedded. Frontend `contentIsHTML` detects tags → routes to HTML renderer → markdown doesn't render properly.

### Fix
Updated the strategy brief prompt template (in Supabase or tier1 assembler) to explicitly request HTML output. Mosab confirmed: "it is instructed to send html" — HTML output is the design intent, prompt was broken.

### Key rule
ALL LLM output must be HTML (from SESSION-STATE critical rules). HTML enables inline `<ui-chart>`.

---

## #8 — Charts in bubble

**Thread:** 53 | **Priority:** P1 | **Status:** DONE ✅ | **QA:** ✅ VERIFIED

### Problem
Charts render inline in the message flow instead of in the bubble/canvas.

### Root Cause
LLM generates HTML with `<ui-chart data-id="chart1">` tags, but backend doesn't include corresponding artifact objects in `message.metadata.llm_payload.artifacts`. Result: placeholders created by `replaceVisualizationTags()` can't be hydrated because `embeddedArtifactsMap` is empty.

### Fix (2 Parts)
1. **Backend**: Include artifact objects in response payload alongside HTML
2. **Frontend**: Verify hydration chain works (debug logging added to trace issue)

### Files
- `backend/app/services/orchestrator_universal.py` — ensure artifacts in response.artifacts
- `frontend/src/components/chat/MessageBubble.tsx` — embeddedArtifactsMap creation
- `frontend/src/hooks/useArtifactHydration.tsx` — placeholder hydration logic
- `frontend/src/utils/visualizationBuilder.ts` — replaceVisualizationTags() function

---

## #9 — AI Button Prompts (Supabase table + API + templates)

**Priority:** P1 | **Status:** NEEDS VERIFICATION

### Problem
AI Explain buttons need prompt templates stored in Supabase (no hardcoding). Multiple personas needed depending on context.

### Subtasks
- [ ] Create Supabase table `ai_button_prompts`:
      - `id` UUID PK
      - `persona` TEXT (risk_advisor, capability_expert, sector_strategist, project_manager, performance_analyst)
      - `context_type` TEXT (risk, capability, sector, project, kpi)
      - `prompt_template` TEXT (with {placeholders} for dynamic data)
      - `is_active` BOOLEAN default true
      - `created_at`, `updated_at` TIMESTAMPTZ
- [ ] Write prompt templates for 5 personas:
      - **risk_advisor** — risk exposure analysis, top 3 mitigation strategies
      - **capability_expert** — capability gap review, interventions needed
      - **sector_strategist** — sector objective progress, strategic recommendations
      - **project_manager** — project issue assessment, resolution options
      - **performance_analyst** — red KPI root cause, corrective action options (3-5)
- [ ] Create seed script: `backend/scripts/seed_ai_button_prompts.py`
- [ ] Create API endpoints in `backend/app/api/routes/prompts.py`:
      - `GET /prompts/:persona/:context_type` — fetch template
      - `POST /prompts/:persona/:context_type/render` — render template with context data

### User notes
- "We need EXTRA prompts as in the point before this. Don't confuse with existing."
- "The prompts need to be written and put in supabase, no more hardcoding"
- "We have multiple personas in the tier1 prompts so they need to be added depending on the case"

---

## #10 — AI Button UI (icon component + desk integration)

**Priority:** P1 | **Status:** TODO | **Blocked by:** #9

### Problem
Need a standard AI Explain button across all desks.

### Subtasks
- [ ] Create `frontend/src/components/common/AIExplainButton.tsx`:
      - Icon only, NO text (unique icon so eyes catch it)
      - Gradient style: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
      - Round button, white icon, box shadow, hover scale effect
      - On click: determine persona from context type → fetch prompt from Supabase → navigate to chat with prefilled message
- [ ] Context-to-persona mapping:
      - risk → risk_advisor
      - capability → capability_expert
      - sector → sector_strategist
      - project → project_manager
      - kpi → performance_analyst
- [ ] Integrate into all desks:
      - RiskDesk KPI cards
      - CapabilityMatrix overlays
      - SectorDesk red status items
      - ProjectDesk issues

### User notes
- "Maybe we don't add text, just a unique icon button so eyes catch it."
- Clicking navigates to chat with prefilled message from Supabase prompt

---

## #11 — Fix condenser (remove code-side keep_last_n)

**Priority:** P1 | **Status:** DONE ✅ | **QA:** ✅ VERIFIED

### Problem
`simple_condenser.py` still has code-side logic (`keep_last_n=4`). Architecture decision: ALL condensation logic lives in the PROMPT, not in code.

### What was done
- Removed `keep_last_n` parameter and any code-side message filtering
- Code now ONLY: passes all messages to LLM, gets condensed result back
- Prompt tells the LLM what to preserve/compress/drop
- Old 5-module pipeline in `backend/app/services/condenser/` is DEPRECATED

### Architecture rule
One LLM call receives ALL messages, prompt tells it what to preserve/compress/drop. Code only: pass messages to LLM, get result back. That's it.

---

## #12 — Frontend compaction indicator

**Priority:** P1 | **Status:** DONE ✅ (commit a5fbe9c) | **QA:** ✅ VERIFIED

### What was done
- Backend: Include `was_condensed` flag in `/message` API response
- Frontend: Subtle divider + "Context condensed" indicator when flag is true
- CSS: Gradient line styling with opacity fade and hover effects
- UX: Non-intrusive, appears only when context condensation actually happens

---

## #13 — /josoor sidebar changes

**Priority:** P1 | **Status:** DONE ✅ | **QA:** ✅ VERIFIED

### What was done
Restructured the /josoor sidebar into 4 sections:
1. **Oversight** — Observe / Decide / Deliver
2. **Manage** — Signals / Reporting / Graph
3. **Refer** — Tutorials / Expert Chat
4. **Admin** — Settings / Observability

Icons updated, header titles updated. Expert Chat has collapsible conversation history.

---

## #14 — LLM Model Comparison experiment

**Priority:** P2 | **Status:** TODO

### Goal
Compare GPT 5.3, Gemini 3, Opus 4.6, Kimi 2.5 as baselines for JOSOOR orchestrator, then test smaller models (120B, 70B, 20B) and find where quality drops noticeably. Cost vs quality tradeoff analysis.

---

## #15 — Clean 112 dead files in mem_dump/

**Priority:** P2 | **Status:** DONE ✅ | **QA:** ✅ VERIFIED

### What was done
Removed 112 dead/orphaned files from the `mem_dump/` directory.

---

## #16 — Fix observability parsing (ALL fields)

**Thread:** 54 | **Priority:** P2 | **Status:** TODO

### Problem
Response data is dumped as nested JSON in `response_payload`, but ALL fields should be properly extracted and stored in their correct database columns in `llm_request_logs`.

### Scope
Parse the entire nested response structure and map ALL fields to proper columns:
- provider
- model
- tokens (prompt/completion/total)
- cost
- latency
- output_text (from nested message item)
- Any other relevant fields

### Current state
Response payload is nested JSON with keys: output (array of mcp_list_tools, reasoning, mcp_call, message items). The `output_text` inside the message item has the actual LLM response, but it's not being extracted.

### Fix
Update observability logging to properly parse and normalize ALL fields from response_payload into their designated columns.

---

## #17 — Locate ETL code path

**Priority:** P2 | **Status:** DONE ✅ | **QA:** ✅ VERIFIED

### What was found
The conversation-to-memory ETL is confirmed BUILT AND RUNNING (nightly cron at 3am UTC, `0 3 * * *` in root crontab).

**File:** `backend/scripts/nightly_memory_etl.py`

**What it does:** Fetches conversations from Supabase → embeds → upserts Memory nodes in Neo4j (memory_semantic_index). Hash-based dedup. Last ran Feb 13 01:45 — 17 conversations processed, all skipped (unchanged).

---

## #18 — Landing page mobile responsive

**Priority:** P1 | **Status:** DONE ✅ | **QA:** ✅ VERIFIED

### What was done
- AItoIA.tsx: Single 300vh scroll-driven particle morph (grey→gold)
- Mobile optimized: 60 particles (vs 140 desktop), 3x velocity (vs 5x), 120px connections (vs 160px)
- Breakpoints: 375px, 480px, 768px, 1024px
- Typography scales: h2 (42→32→28px), h1 (56→40→32px), subtitles (18→16px)
- Grids stack vertically, hero centers on mobile
- Touch targets: 44px minimum (buttons, nav)
- Snap sections: hero, aitoia, platform, claims, promise, arch (6 total)
- useSnapScroll: Mobile-aware — 800ms duration (vs 1200ms desktop), 80px swipe threshold (vs 50px)

---

## #19 — Canvas save/print full content

**Priority:** P1 | **Status:** DONE ✅ (commit 7c32ab4) | **QA:** ✅ VERIFIED

### Problem
Canvas save/print captured only the visible area, not full scrollable content.

### What was done
- Expand element to full `scrollHeight` before `html2canvas` capture
- Pass `scrollHeight`/`scrollWidth` to html2canvas options
- Restore original styles after capture (overflow, height, maxHeight)
- Added proper print CSS with `page-break-inside: avoid` for images
- PDF orientation auto-selected based on aspect ratio

### Files modified
- `frontend/src/utils/canvasActions.ts` (generatePDF + printArtifact)

---

## #20 — Canvas artifact list always empty

**Priority:** P1 | **Status:** DONE ✅ | **QA:** ✅ VERIFIED

### Problem
The artifact list/history in the canvas panel is always empty — no artifacts show up even after generating reports/charts.

### Root cause
Related to #8 — backend doesn't include artifact objects in `message.metadata.llm_payload.artifacts`, so the frontend artifact list has nothing to display. Fixed by Task #5 (same root cause: artifact data lost in spread).

### Files
- `frontend/src/components/CanvasPanel.tsx` — artifact list rendering
- `frontend/src/components/ChatAppPage.tsx` — artifact collection/state
- Backend response payload — artifacts array population

---

# EXECUTION PRIORITY (remaining work)

## Active / Next Up
1. **#1 sub-items (R5, R9, R4, R8)** — Enterprise Desk capability panel remaining requirements
2. **#2 Risk Agent** — analyze & run (unblocks overlay property data)
3. **#3 Planning Lab** — needs backend integration (BLOCKED on user answering Q7)
4. **#9 AI Button Prompts** — verify Supabase table + API
5. **#10 AI Button UI** — blocked by #9

## Backlog
6. **#14 LLM Model Comparison** — TBD
7. **#16 Fix observability parsing** — TODO

---

*Last updated: 2026-02-22*
