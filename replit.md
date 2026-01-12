# JOSOOR Frontend

## Overview
JOSOOR is an Agentic Enterprise Platform - a Cognitive Twin designed for national scale transformation. The frontend is built with React 18, TypeScript, and Vite.

## CURRENT PROJECT: Frontend Re-Wiring - READY FOR EXECUTION

**Status:** Implementation plan COMPLETE (1,906 lines) with full traceability matrix. Ready to execute.

**CRITICAL: Read these documents in order:**
1. `docs/work/01_user_requirements_120126_0909.md` - Requirements (186 lines)
2. `docs/work/02_design_document_120126_0909.md` - Design (419 lines)
3. `docs/work/03_implementation_plan_stitch.md` - **IMPLEMENTATION PLAN (1,906 lines)** ← START HERE

## Implementation Plan Summary

**Core Principle:** STITCH existing components - do NOT recreate from scratch.

### Traceability Matrix (in plan)
Every requirement is linked to design elements and implementation tasks (max 3 tasks per element).

### Plan Sections (A-W)
| Section | Content |
|---------|---------|
| STEP 0 | Stash existing /main to /main_stash |
| A | Component Inventory (verified paths) |
| B | Governance Log System |
| C | Onboarding Tour (9 steps, driver.js) |
| D | Trace Feature |
| E | MainSidebar Combined Structure |
| F | State Management |
| G | CSS Authority |
| H | Route Configuration |
| I-J | New files + Changes to existing |
| K | Implementation Order |
| L | Reference Patterns (ChatAppPage, JosoorFrame) |
| M | Complete File Paths |
| N | MainAppPage Detailed Design |
| O | MainSidebar Detailed Design |
| P | Graph Explorer + Governance Log |
| Q | Implementation Checklist (27 tasks) |
| R | CSS Imports by Component |
| S | Trace Refactor |
| T | Driver.js Config |
| U | Conversation Management |
| V | Component Dependencies |
| W | Missing Sections (Sector, Settings, Observability, Risk Agent) |

## Key Source Files to STITCH

| Target | Source File | Path |
|--------|-------------|------|
| MainHeader | FrameHeader.tsx | `frontend/src/pages/josoor-sandbox/layout/FrameHeader.tsx` |
| MainSidebar (nav) | FrameSidebar.tsx | `frontend/src/pages/josoor-sandbox/layout/FrameSidebar.tsx` |
| MainSidebar (chat) | Sidebar.tsx | `frontend/src/components/chat/Sidebar.tsx` |
| Layout Pattern | JosoorFrame.tsx | `frontend/src/pages/josoor-sandbox/layout/JosoorFrame.tsx` |
| Conversation Mgmt | ChatAppPage.tsx | `frontend/src/pages/ChatAppPage.tsx` |
| Sector Desk | ControlTower.tsx | `frontend/src/pages/josoor-sandbox/components/ControlTower.tsx` |
| Enterprise Desk | DependencyDesk.tsx | `frontend/src/pages/josoor-sandbox/components/DependencyDesk.tsx` |
| Controls Desk | RiskDesk.tsx | `frontend/src/pages/josoor-sandbox/components/RiskDesk.tsx` |
| Settings | AdminSettingsPage.tsx | `frontend/src/pages/AdminSettingsPage.tsx` |
| Observability | ObservabilityDashboardPage.tsx | `frontend/src/pages/ObservabilityDashboardPage.tsx` |
| Trace | AIExplainButton.tsx | `frontend/src/pages/josoor-sandbox/components/AIExplainButton.tsx` |

## 4 Chain APIs (Controls Desk)
```
setting_strategic_initiatives  → Steering ribbon
build_oversight               → Risk BUILD ribbon
operate_oversight             → Risk OPERATE ribbon
sustainable_operations        → Delivery ribbon
```

## Risk Agent vs Risk Desk
- **Risk Desk (Controls Desk)** = User-facing visualization of risk data
- **Risk Agent Console** = Admin panel to trigger/monitor automated governance agent

## Execution Steps (from Plan Section K)
1. Stash `/main` to `/main_stash`
2. Create `MainAppContext.tsx`
3. Create `MainAppPage.tsx` (follow JosoorFrame + ChatAppPage patterns)
4. Create `MainSidebar.tsx` (combine FrameSidebar nav + chat elements)
5. Update `FrameHeader.tsx` (add ? button, IDs)
6. Update paths in navigation to `/main/*`
7. Create wrapper components
8. Configure routes in `App.tsx`
9. Create onboarding tour hook
10. Refactor AIExplainButton → Trace
11. Add all onboarding target IDs
12. Test all functionality

## Project Structure
```
frontend/
├── src/
│   ├── components/chat/      # Chat UI (Sidebar.css = CSS authority)
│   ├── pages/
│   │   ├── josoor-sandbox/   # SOURCE components to stitch
│   │   └── main/             # TARGET (currently has stash-able implementation)
│   ├── services/             # chatService, chainsService, authService
│   ├── contexts/             # Auth, Language
│   └── styles/theme.css      # CSS authority
├── public/icons/             # 14 app icons
└── docs/work/                # Requirements, Design, Implementation Plan
```

## Running the App
```bash
cd frontend && npm run dev
```
Dev server on port 5000.

## Backend
- Main API: https://betaBE.aitwintech.com/api/v1
- Graph Server: https://betaBE.aitwintech.com/api/graph

## CSS Authority
Use `theme.css` CSS variables throughout. NOT Tailwind.

## Recent Changes (Jan 12, 2026)
- Created comprehensive implementation plan (1,906 lines)
- Added traceability matrix (requirements → design → tasks)
- Added detailed sections for Sector Desk, Settings, Observability, Risk Agent
- Plan version 0.4 - READY FOR EXECUTION
