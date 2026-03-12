# Requirements Catalog — Full Breakdown

Source: `docs/RAW_REQUIREMENTS.md` (user's own words, 2026-03-06 audit)
Each requirement has: ID, verbatim quote, status, implementation notes.

---

## Ontology (H items)

| # | ID | Requirement | Status |
|---|-----|-------------|--------|
| 1 | H1 | Solid yellow lines still visible (impossible state) | IN PROGRESS — default line changed to red; `computeLineFlowHealth()` always returns green/amber/red |
| 2 | H2 | RAG logic for lines/relations is sketchy — some nodes not covered (ppl, process, tool) breaks link to projects | NOT STARTED — need RAG coverage for orgUnits, processes, itSystems |
| 3 | H3 | Every shape needs a status, otherwise why add it | IN PROGRESS — D3 fix adds tinting for coins + platforms |
| 4 | H4 | RAG is bottom-up: risk reds → policy+perf red → objectives red (chain aggregation) | NOT STARTED — chain concept not coded into RAG calc |
| 5 | H5 | Build mode: change → capabilities → up to objectives. Operate mode: enterprise elements → up to objectives | NOT STARTED — two-mode RAG path not implemented |
| 6 | H6 | Side panels: random data, broken traceability, no CTA, missing ID in panel | NOT STARTED |
| 7 | H7 | Panel purpose: drill down to culprit → AI button for risk/issue analysis → intervention options | NOT STARTED |
| 8 | H8 | Status row: text-only stats, not modern/intuitive. Should tell a story with AI-generated dynamic paragraph | NOT STARTED |
| 9 | H9 | Ontology not wired with year/quarter filters | NOT STARTED |
| 10 | H10 | No sector indicator — should show Water Sector | NOT STARTED |
| 11 | H11 | Canvas full view should be 5% smaller | NOT STARTED |
| 12 | H12 | Node RAG tinting: buildings=diamond on top, grey platform shapes=top shape changes color, circular=fully ragged | IN PROGRESS — D3 fix implements CSS filter hue-rotate |
| 13 | H13 | Totals positioned near each node on the visual dashboard | NOT STARTED |
| 14 | H14 | Totals near each line | NOT STARTED |
| 15 | H15 | Each line should have the relation name displayed | NOT STARTED |
| 16 | H16 | Two-way arrows: two relations per direction, no overlaps on labels | NOT STARTED |

---

## System / Boot (S items)

| # | ID | Requirement | Status |
|---|-----|-------------|--------|
| 17 | S1 | BIOS screen always English, always LTR regardless of ar/en | DONE — boot container hardcodes `dir="ltr"` |
| 18 | S2 | System remembers last language preference | DONE — localStorage `jos-lang` |
| 19 | S3 | System remembers light/dark preference | DONE — localStorage theme |
| 20 | S4 | System remembers last date selected | DONE — localStorage year/quarter |

---

## Observe (O items)

| # | ID | Requirement | Status |
|---|-----|-------------|--------|
| 21 | O1 | DB entries for sector outputs/investments changed to parse-free — frontend needs adjustment | NOT STARTED — need NoorMemory lookup for new schema |
| 22 | O2 | Side panel on delivery program: shows empty entries when no L2 policy/cap — should hide them | NOT STARTED |
| 23 | O3 | Capability strip status doesn't match capability matrix status — should use same source | NEEDS VERIFY — C3 agent checking |
| 24 | O4 | Click capability from tree should open capability matrix app + auto-open side panel | NOT STARTED |
| 25 | O5 | Map doesn't update when app changes to full screen | NOT STARTED |
| 26 | O6 | Asset state (existing/planned) should change with year filter — if due 2027, becomes existing | NOT STARTED |
| 27 | O7 | Third pillar should have no programs but shows all programs | NOT STARTED |
| 28 | O8 | First two pillars: all delivery programs and water assets reflected, no orphans | NOT STARTED |
| 29 | O9 | RAG aggregation upward: cap → policy tool → delivery program → sector objectives | NOT STARTED |

---

## Decide (D items)

| # | ID | Requirement | Status |
|---|-----|-------------|--------|
| 30 | D1 | L2 text overflow: remove description line from cell (like L1/L3) | NOT STARTED |
| 31 | D2 | L1 and L2 have mystery "KPI-" label — unclear purpose | NOT STARTED |
| 32 | D3 | Side panels are massive data dumps with no clear purpose — doesn't help trace problems | NOT STARTED |
| 33 | D4 | L2 panel: "L3 cap in operation" shown first before status — wrong order | NOT STARTED |
| 34 | D5 | L2 panel: "formula and inputs" makes no sense for a capability | NOT STARTED |
| 35 | D6 | Should reference linked L2 KPI with link to KPI card (card doesn't exist yet) | NOT STARTED |
| 36 | D7 | KPI inputs: no reference, just text, red without temporal planned-vs-target rule | NOT STARTED |
| 37 | D8 | Upward link: incomprehensible long list — should show L2 cap → L2 perf → L1 perf → L1 obj | NOT STARTED |
| 38 | D9 | Gauge unclear: what value is measured, planned vs target, timelines | NOT STARTED |
| 39 | D10 | Maturity right under gauge implies same thing — they're different measurements | NOT STARTED |
| 40 | D11 | Maturity shows M1 while "in operation" requires M3 minimum — data disconnect | NOT STARTED |
| 41 | D12 | L3: gauge 0% while maturity M5, siblings M5 while parent M1 — total disconnect | NOT STARTED |
| 42 | D13 | Gauge numbers appearing in "process metrics" section — wrong location | NOT STARTED |
| 43 | D14 | "Ops footprint" (projects?) unclear, no track status, no explanation for M5 cap having projects | NOT STARTED |
| 44 | D15 | Risk profile: "category" and "status" are useless inputs | NOT STARTED |
| 45 | D16 | Chains reading from wrong fields and aggregating incorrectly | NOT STARTED |
| 46 | D17 | Exposure overlay: gradient coloring from risk rating × urgency × dependencies — not applied | NOT STARTED |

---

## Deliver (P items)

| # | ID | Requirement | Status |
|---|-----|-------------|--------|
| 47 | P1 | Intervention plans saved but no progress tracking — how do plans reach owners? | NOT STARTED |
| 48 | P2 | How do owners send back progress on tasks? | NOT STARTED |
| 49 | P3 | Status doesn't link back to the risk being solved | NOT STARTED |
| 50 | P4 | Risk with intervention plan → formula makes it Amber (monitoring, not solved) | NEEDS VERIFY — C4 agent checking getNodeInstanceRag |
| 51 | P5 | If plan fails → trigger to bump risk back up | NOT STARTED |
| 52 | P6 | Intervention plan list should show RAG at list level | NOT STARTED |
| 53 | P7 | Inside plan: RAG per task | NOT STARTED |
| 54 | P8 | Rename "Strategic Reset" to "Refresh" — end-of-year exercise | NOT STARTED |
| 55 | P9 | Refresh page: year selection + AI snapshot prompt (from Supabase) | NOT STARTED |
| 56 | P10 | Snapshots listed and saved for future reference | NOT STARTED |
| 57 | P11 | Scenario planning: outcome-based controls (current vs modified values + open text) | NOT STARTED |
| 58 | P12 | Scenario AI output: ruthless non-biased viability analysis with risks and aggressive plan | NOT STARTED |
| 59 | P13 | Scenario results saved and listed | NOT STARTED |

---

## Reporting (R items)

| # | ID | Requirement | Status |
|---|-----|-------------|--------|
| 60 | R1 | Standard reports tab first (not outcomes) | NOT STARTED |
| 61 | R2 | Weekly PMO report for all projects | NOT STARTED |
| 62 | R3 | Monthly ExCom report: programs + operations + issues + KPIs + upcoming | NOT STARTED |
| 63 | R4 | Standard Adaa report | NOT STARTED |
| 64 | R5 | One real example of each three report types based on actual data | NOT STARTED |
| 65 | R6 | Outcome-based: measure if interventions were effective (from Deliver or Refresh) | NOT STARTED |

---

## Signals (X items)

| # | ID | Requirement | Status |
|---|-----|-------------|--------|
| 66 | X1 | Update to latest redesigned chains (old cancelled/split ones still referenced) | NOT STARTED |
| 67 | X2 | Adjustable node limit doesn't work | NOT STARTED |
| 68 | X3 | Diagnose queries: orphans (abandoned) and bastards (no parent) detection | NOT STARTED |
| 69 | X4 | Red dots on Sankey for orphans/bastards, discussed with owners to fix | NOT STARTED |

---

## Expert Chat (C items)

| # | ID | Requirement | Status |
|---|-----|-------------|--------|
| 70 | C1 | Remove "recall memory" and "recall vision" buttons (redundant) | NOT STARTED |
| 71 | C2 | Personas need rethinking for discussion context | NOT STARTED |
| 72 | C3 | Persona dropdown resets on each message — should lock per session | NOT STARTED |
| 73 | C4 | Conversation summary at context limit — deployed but not tested | NOT STARTED |
| 74 | C5 | New chat example prompts need to be more relevant/powerful | NOT STARTED |
| 75 | C6 | Sidebar conversation history: date and message count disappeared | NOT STARTED |
| 76 | C7 | Artifact under reply shows "html report" instead of actual report name | NOT STARTED |
| 77 | C8 | "Back to list" button shows only opened artifact, not full list | NOT STARTED |
| 78 | C9 | User bubble color: change from green to more readable color | NOT STARTED |
| 79 | C10 | All prompt references say "an agency" — change to "SWA" | NOT STARTED |

---

## Tutorials (TU items)

| # | ID | Requirement | Status |
|---|-----|-------------|--------|
| 80 | TU1 | Look and feel needs another visual pass | NOT STARTED |
| 81 | TU2 | Change video/audio links from local to embedded YouTube versions | NOT STARTED |

---

## Settings (T items)

| # | ID | Requirement | Status |
|---|-----|-------------|--------|
| 82 | T1 | Writing back to DB never works | DONE — switched to apiClient (axios) with auto-auth |
| 83 | T2 | Support multiple LLM providers with different sub-features | NOT STARTED |
| 84 | T3 | Use Supabase provider_features column to customize options per provider | NOT STARTED |
| 85 | T4 | Graph RAG semantic context injection — never activated | NOT STARTED |

---

## Observability (B items)

| # | ID | Requirement | Status |
|---|-----|-------------|--------|
| 86 | B1 | Messages in Supabase sometimes don't appear (maybe long threads) | NOT STARTED |
| 87 | B2 | LLM output parsing drops fields for observability | NOT STARTED |
| 88 | B3 | Reasoning not always appearing | NOT STARTED |
| 89 | B4 | Error messages are cryptic | NOT STARTED |
| 90 | B5 | MCP tool calls: sometimes counted, sometimes not | NOT STARTED |

---

## Summary

| Section | Total | Done | In Progress | Not Started |
|---------|-------|------|-------------|-------------|
| Ontology (H) | 16 | 0 | 3 | 13 |
| System (S) | 4 | 4 | 0 | 0 |
| Observe (O) | 9 | 0 | 0 | 9 |
| Decide (D) | 17 | 0 | 0 | 17 |
| Deliver (P) | 13 | 0 | 0 | 13 |
| Reporting (R) | 6 | 0 | 0 | 6 |
| Signals (X) | 4 | 0 | 0 | 4 |
| Expert Chat (C) | 10 | 0 | 0 | 10 |
| Tutorials (TU) | 2 | 0 | 0 | 2 |
| Settings (T) | 4 | 1 | 0 | 3 |
| Observability (B) | 5 | 0 | 0 | 5 |
| **TOTAL** | **90** | **5** | **3** | **82** |
