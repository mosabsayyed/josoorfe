# JOSOOR Frontend - Design Strategy

**Version:** 1.0
**Date:** January 13, 2026
**Reference:** Corrected User Requirements v2.0

---

## 1. Architectural Pattern: The "Chat Shell"

We will invert the current layout strategy. Instead of `App.tsx` routing to disparate pages (`/josoor-sandbox`, `/josoor`, etc.), we will lift the **Chat Shell** (Sidebar + Header + Main Area) to be the primary layout for the authenticated experience.

### 1.1 Layout Hierarchy

```mermaid
graph TD
    App[App.tsx] --> Auth[AuthProvider]
    Auth --> Router[Router]
    Router --> Landing[LandingPage (Public)]
    Router --> Protected[Generic ProtectedRoute]
    Protected --> MainLayout[MainLayout (Unified Shell)]
    
    MainLayout --> Header[Global Header (Sandbox Enhanced)]
    MainLayout --> Sidebar[Chat Sidebar (Refactored)]
    MainLayout --> ContentArea[Main Content Area]
    
    ContentArea --> DeskSwitch{Desk Switcher}
    DeskSwitch --> ChatView[Graph Chat (Default)]
    DeskSwitch --> SectorView[Sector Desk]
    DeskSwitch --> ControlsView[Controls Desk]
    DeskSwitch --> EnterpriseView[Enterprise Desk]
    DeskSwitch --> PlanningView[Planning Desk]
    DeskSwitch --> ReportingView[Reporting Desk]
    DeskSwitch --> KnowledgeView[Knowledge Series]
    DeskSwitch --> RoadmapView[Roadmap]
    DeskSwitch --> ExplorerView[Graph Explorer (Full Screen)]

    MainLayout --> TraceDrawer[Trace Drawer (Overlay)]
    MainLayout --> Onboarding[Onboarding Overlay]
```

---

## 2. Component Integration Strategy

### 2.1 Styling Enforcer (`theme.css`)
All imported components must consume the **CSS Variables** defined in `frontend/src/styles/theme.css`.

- **Rule:** No hardcoded hex codes.
- **Rule:** No Tailwind classes (unless mapped to variables).
- **Mapping:**
  - `bg-gray-900` -> `var(--component-bg-primary)`
  - `text-white` -> `var(--component-text-primary)`
  - `border-gray-700` -> `var(--component-panel-border)`
  - `text-gold` -> `var(--component-text-accent)`

### 2.2 Component Migration Table

| Source (Sandbox/New) | Destination (Unified) | Adaptations Required |
| :--- | :--- | :--- |
| `JosoorFrame/Header` | `components/layout/UnifiedHeader` | Add Profile dropdown, Onboarding trigger. |
| `Chat/Sidebar` | `components/layout/UnifiedSidebar` | New menu structure, retain collapse logic. |
| `Executive/KPICards` | `components/desks/SectorDesk` | **REPLACE** with Gauge visual. Bind to same data. |
| `Executive/Signals` | `components/desks/ControlsDesk` | Bind to 4 specific Graph Chains. |
| `Dashboard/3DGraph` | `components/sections/GraphExplorer` | Ensure standalone rendering (no canvas constraint). |

---

## 3. Data Layer: Graph Integration

We will use a standard hook pattern to bind `screen_mapping.md` queries to React components.

```typescript
// Pattern for all Desk Data
const { data, loading } = useGraphQuery({
  chain: 'setting_strategic_initiatives', // Mapped to SST v1.1
  params: { 
    year: selectedYear, 
    id: selectedNode 
  }
});
```

### 3.1 Traceability
- **Trace Feature:** A Global Context `TraceContext` will manage the "Explain to me" state.
- **Interaction:** Clicking "Trace" on any node triggers `openTraceDrawer(nodeId)` which loads the **Chat Interface** in a side panel (or overlay) with the query context.

---

## 4. Governance & Risk Modules

### 4.1 Usage
- **Governance:** Not a page. Embedded Popovers on specific nodes (Enterprise/Controls desks).
- **Risk Engine:** Background calculator (via backend API). Frontend visualizes "Bands" (Green/Amber/Red) on the ribbons.

---

## 5. Traceability to Requirements

1.  **Strict Styling:** Implemented via `theme.css` enforcement in `MainLayout`.
2.  **5 Desks:** Implemented as `DeskSwitch` routes.
3.  **Onboarding:** Implemented as `OnboardingOverlay` in `MainLayout`.
4.  **Trace:** Implemented as `TraceDrawer`.
