# JOSOOR Frontend Re-Wiring - Implementation Plan

**Version:** 1.0
**Date:** January 13, 2026

---

## Phase 1: Foundation (The Shell)
**Goal:** Establish the Unified Layout and strict CSS foundation.

- [ ] **Step 1.1:** Create `MainLayout.tsx` in `src/components/layout`.
    -   Implement `UnifiedSidebar` (refactored from Chat).
    -   Implement `UnifiedHeader` (refactored from Sandbox).
    -   Ensure `theme.css` variables are applied.
- [ ] **Step 1.2:** Refactor `App.tsx`.
    -   Replace existing routes with the new hierarchy.
    -   Login -> `MainLayout`.
- [ ] **Step 1.3:** Verify Theme Compliance.
    -   Check Light/Dark mode toggling on the generic shell.

## Phase 2: Navigation & "Empty" Desks
**Goal:** fast scaffold of the navigation structure.

- [ ] **Step 2.1:** Create placeholder components for the 5 Desks.
    -   `SectorDesk.tsx`
    -   `ControlsDesk.tsx`
    -   `PlanningDesk.tsx`
    -   `EnterpriseDesk.tsx`
    -   `ReportingDesk.tsx`
- [ ] **Step 2.2:** Update Sidebar Menu.
    -   Map menu items to these routes.
    -   Verify navigation works within the Shell.

## Phase 3: Sector Desk (Map & Gauges)
**Goal:** Port "Executive" content to "Sector Desk" with visual changes.

- [ ] **Step 3.1:** Port Map Component (as-is).
- [ ] **Step 3.2:** Implement KPI Gauges.
    -   Adapt data from "Cards" to "Gauge" visualization.

## Phase 4: Controls Desk (The 4 Ribbons)
**Goal:** Implement the Core Control Signals.

- [ ] **Step 4.1:** Implement `SignalRibbon` component.
- [ ] **Step 4.2:** Integrate Graph Queries (mocked or real).
    -   `branding_strategic_initiatives` (Steering)
    -   `build_oversight` (Risk Build)
    -   `operate_oversight` (Risk Operate)
    -   `sustainable_operations` (Delivery)

## Phase 5: Content Sections
**Goal:** Migrate Chat content to Main Area.

- [ ] **Step 5.1:** Migrated Knowledge Series (Embed Youtube).
- [ ] **Step 5.2:** Migrate Roadmap.
- [ ] **Step 5.3:** Extract Graph Explorer (3D) to full screen.

## Phase 6: Features (Onboarding, Trace, Governance)
**Goal:** Add the "Delighters" and functional depth.

### 6.1 Onboarding Tour (Overlay)
- **Narrative Source:** `docs/onboarding_narrative_from_user.txt`
- **Steps:**
  1.  **Welcome:** "Welcome to Josoor, I am Noor..."
  2.  **Header Controls:** "Starting with the headers... Noise Filters..."
  3.  **Sector Desk:** "Eyes on the prize... Impact is Observed."
  4.  **Controls Desk:** "Instant Deviation Signals..."
  5.  **Enterprise Desk:** "Which capabilities do we prioritize..."
  6.  **Planning Desk:** "Signal boosters..."
  7.  **Reporting Desk:** "Internal Signals..."
  8.  **Knowledge Series:** "Build a deeper understanding..."
  9.  **Graph Chat:** "Talk to an expert agent..."
  10. **Closing:** "While you always understood your transformation..."
- [ ] **Step 6.2:** Implement Trace Drawer (Chat Integration).
- [ ] **Step 6.3:** Implement Embedded Governance Popovers.

## Phase 7: Backend Integration
**Goal:** Connect to live APIs.

- [ ] **Step 7.1:** Settings DB Migration.
- [ ] **Step 7.2:** Verify Graph Queries against `betaBE`.
