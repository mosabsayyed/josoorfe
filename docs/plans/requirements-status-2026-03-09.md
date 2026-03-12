# Requirements Status Verification — 2026-03-09

**Total:** 90 items | **DONE:** 13 | **PARTIAL:** 31 | **NOT DONE:** 42

---

## PHASE 0 — Baseline (ALL DONE ✓)
- [x] S1 — BIOS screen English LTR
- [x] S2 — Remember language
- [x] S3 — Remember theme
- [x] S4 — Remember date
- [x] T1 — Settings save to DB

---

## PHASE 1 — Ontology (H1-H16): 2 DONE, 10 PARTIAL, 4 NOT DONE

- [x] H1 — No yellow/default lines (red used)
- [ ] H2 — RAG coverage all node types (code exists, needs visual verify)
- [ ] H3+H12 — Node RAG tinting (code exists, needs visual verify)
- [ ] H4+H5 — Bottom-up RAG propagation (code exists, execution unverified)
- [ ] H6+H7 — Side panel traceability (panels exist, drill-down missing)
- [ ] H8 — AI dynamic status narrative (static only, no AI call)
- [x] H9 — Year/quarter filters wired
- [ ] H10 — Sector indicator badge (NOT IMPLEMENTED)
- [ ] H11 — Canvas 5% smaller (still 100% width)
- [ ] H13 — Totals near nodes (NOT IMPLEMENTED)
- [ ] H14 — Totals near lines (NOT IMPLEMENTED)
- [ ] H15+H16 — Line relation names + arrows (NOT IMPLEMENTED)

---

## PHASE 2 — Sector Desk (O1-O9): 2 DONE, 2 PARTIAL, 5 NOT DONE

- [x] O1 — Parse-free sector outputs/investments
- [ ] O2 — Hide empty L2 entries (NOT DONE)
- [ ] O3 — Capability strip status matches matrix (PARTIAL)
- [ ] O4 — Click capability opens matrix (NOT DONE)
- [x] O5 — Map fullscreen resize
- [ ] O6 — Asset state temporal logic (NOT DONE)
- [ ] O7 — Third pillar no programs (UNVERIFIED)
- [ ] O8 — No orphan programs (UNVERIFIED)
- [ ] O9 — RAG aggregation upward (NOT DONE)

---

## PHASE 3 — Enterprise Desk (D1-D17): 2 DONE, 8 PARTIAL, 7 NOT DONE

- [x] D1 — Remove L2 description (PARTIAL/verify)
- [x] D2 — Clarify KPI label (PARTIAL/verify)
- [ ] D3 — Side panels Status→Why→Action restructure (NOT DONE)
- [ ] D4 — L2 status first (NOT DONE)
- [ ] D5 — Remove Formula section (NOT DONE)
- [ ] D6 — Add KPI card (NOT DONE)
- [ ] D7 — Temporal KPI inputs (NOT DONE)
- [ ] D8 — Simplify upward links (NOT DONE)
- [ ] D9+D10 — Gauge clarity (NOT DONE)
- [ ] D11 — Maturity M1 operational warning (NOT DONE)
- [ ] D12 — Maturity rollup fix (UNVERIFIED)
- [ ] D13 — Gauge duplication audit (NOT DONE)
- [ ] D14 — Ops footprint clarity (PARTIAL)
- [ ] D15 — Remove risk fields (NOT DONE)
- [ ] D16 — Field mappings (PARTIAL)
- [ ] D17 — Exposure gradient formula (PARTIAL)

---

## PHASE 4 — Planning Desk (P1-P13): 0 DONE

- [ ] P1+P2 — Progress tracking (NOT DONE)
- [ ] P3 — Link plan to risk (NOT DONE)
- [ ] P4 — Risk formula (UNVERIFIED)
- [ ] P5 — Plan failure escalation (NOT DONE)
- [ ] P6 — Plan list RAG (NOT DONE)
- [ ] P7 — Task RAG in Gantt (NOT DONE)
- [ ] P8 — Rename Strategic Reset → Refresh (NOT DONE — still StrategicReset in code)
- [ ] P9+P10 — Refresh AI integration (NOT DONE)
- [ ] P11+P12+P13 — Scenario planning (NOT DONE — static/hardcoded)

---

## PHASE 5 — Reporting (R1-R6): 0 DONE

- [ ] R1 — Standard reports default (**WRONG** — defaults to control-outcomes)
- [ ] R2+R3+R4 — Report templates PMO/ExCom/Adaa (NOT DONE)
- [ ] R5 — Example reports (NOT DONE)
- [ ] R6 — Intervention effectiveness (NOT DONE — hardcoded)

---

## PHASE 6 — Explorer (X1-X4): 1 DONE, 2 PARTIAL, 1 NOT DONE

- [ ] X1 — Update chain names (NEEDS VERIFY)
- [x] X2 — Node limit control (200 limit wired)
- [ ] X3+X4 — Diagnostic queries (PARTIAL)

---

## PHASE 7 — Chat (C1-C10): 1 DONE, 3 PARTIAL, 6 NOT DONE

- [ ] C1 — Remove recall buttons (**STILL IN CODE** — plan marked done incorrectly)
- [ ] C2 — Rethink personas (NOT DONE)
- [ ] C3 — Persona reset fix (NOT DONE)
- [ ] C4 — Context summary (PARTIAL)
- [ ] C5 — Water Sector example prompts (NOT DONE)
- [ ] C6 — Sidebar date/count (PARTIAL)
- [ ] C7 — Artifact naming (PARTIAL)
- [ ] C8 — Back to list (NOT DONE)
- [x] C9 — User bubble color (DONE — verify)
- [ ] C10 — Change to SWA (NOT DONE)

---

## PHASE 8 — Tutorials (TU1-TU2): 0 DONE

- [ ] TU1 — Visual styling pass (NOT DONE)
- [ ] TU2 — YouTube embeds (UNVERIFIED)

---

## PHASE 9 — Settings (T2-T4): 0 DONE

- [ ] T2 — Multiple LLM providers (NOT DONE)
- [ ] T3 — Provider features (NOT DONE)
- [ ] T4 — Graph RAG context (PARTIAL — toggle exists, backend missing)

---

## PHASE 10 — Observability (B1-B5): 0 DONE, 3 PARTIAL, 2 NOT DONE

- [ ] B1 — Message pagination (NOT DONE)
- [ ] B2 — LLM parsing drops fields (BACKEND issue)
- [ ] B3 — Reasoning extraction (PARTIAL)
- [ ] B4 — Error message clarity (NOT DONE)
- [ ] B5 — Tool call counting (PARTIAL)

---

## CRITICAL FINDINGS

1. **C1 marked DONE in plan but recall buttons still in ChatToolbar.tsx**
2. **R1 default is WRONG** — should be standard-reports, is control-outcomes
3. **P8 rename not done** — still called StrategicReset in code
4. **Planning Desk (P1-P13) is 0/13** — entirely static/hardcoded
5. **Ontology side panels (H6-H8)** — major restructure needed

