# JOSOOR Frontend

## Overview
JOSOOR is an Agentic Enterprise Platform - a Cognitive Twin designed for national scale transformation. The frontend is built with React 18, TypeScript, and Vite.

## CURRENT PROJECT: Frontend Re-Wiring

**Goal:** Integrate `/chat`, `/josoor-sandbox`, and new design components into a unified main page system.

**Design Documents (READ THESE FIRST):**
- `docs/work/01_user_requirements_120126_0909.md` - All requirements
- `docs/work/02_design_document_120126_0909.md` - Full architecture, components, API wiring

**Key Principles:**
1. `/chat` CSS is master authority - all code adopts `theme.css` and `sidebar.css`
2. Backend at `https://betaBE.aitwintech.com`
3. Multi-language (EN/AR with RTL) and light/dark themes
4. Knowledge Series, Roadmap, Graph Explorer open in main content area (not canvas)

## What's Done
- [x] Icons extracted to `frontend/public/icons/` (14 files)
- [x] Requirements document created
- [x] Design document created with:
  - Page structure and routing
  - MainHeader (from FrameHeader.tsx)
  - MainSidebar with menu + chat elements
  - 9-step onboarding flow with exact text
  - Trace feature specification
  - API wiring for all desks
  - Governance Log UI (embedded in Graph Explorer)
  - Risk Engine visualization

## What Needs to Be Built
1. `MainAppContext.tsx` - State management
2. `MainAppPage.tsx` - Layout with header, sidebar, outlet
3. `MainHeader.tsx` - Year/Quarter/Export/Share/Theme/Lang/Profile
4. `MainSidebar.tsx` - Menu + chat elements
5. Section components (SectorDesk, EnterpriseDesk, ControlsDesk, etc.)
6. Onboarding tour (driver.js, 9 steps)
7. Trace feature (refactor AIExplainButton)
8. Routing configuration
9. CSS authority application

## Project Structure
```
frontend/
├── src/
│   ├── components/       # UI components
│   │   ├── chat/         # Chat interface (Sidebar.css is CSS authority)
│   │   ├── dashboards/   # Dashboard components
│   │   ├── ui/           # Radix UI primitives
│   │   └── content/      # Content components
│   ├── pages/
│   │   ├── josoor-sandbox/  # Source: FrameHeader, RiskDesk, etc.
│   │   ├── chat/            # ChatAppPage
│   │   └── main/            # NEW: MainAppPage + sections
│   ├── services/         # chatService, authService
│   ├── contexts/         # Auth, Language contexts
│   ├── styles/           # theme.css (CSS authority)
│   └── types/            # TypeScript definitions
├── public/
│   ├── icons/            # 14 app icons (josoor, menu, new, etc.)
│   ├── knowledge/        # Twin Knowledge content
│   └── att/              # Cube animation
└── vite.config.ts
```

## Key Source Files for Re-wiring
- `frontend/src/pages/josoor-sandbox/layout/FrameHeader.tsx` - Header template
- `frontend/src/components/chat/Sidebar.tsx` - Chat sidebar (preserve elements)
- `frontend/src/styles/theme.css` - CSS authority
- `frontend/src/pages/josoor-sandbox/components/AIExplainButton.tsx` - Trace source
- `attached_assets/GOVERNANCE_LOG_DESIGN_*.md` - Governance spec
- `attached_assets/Enterprise_Ontology_SST_*.md` - Risk Engine spec

## Sidebar Menu Structure
```
ENTERPRISE MANAGEMENT
  ▸ Sector Desk
  ▸ Enterprise Desk
  ▸ Controls Desk
  ▸ Planning Desk
  ▸ Reporting Desk
TOOLS
  ▸ Knowledge Series
  ▸ Roadmap
  ▸ Graph Explorer (has embedded Governance Log)
  ▸ Graph Chat
ADMIN
  ▸ Settings
  ▸ Observability
CONVERSATIONS (collapsible)
  ▸ Today / Yesterday / Previous 7 days
```

## Running the App
```bash
cd frontend && npm run dev
```
Dev server on port 5000.

## Backend Connection
- Main API: https://betaBE.aitwintech.com/api/v1
- Graph Server: https://betaBE.aitwintech.com/api/graph

## Styling
CSS variables in theme.css - NOT Tailwind CSS.

## Recent Changes
- January 12, 2026: Created design documents and extracted icons
- Trace feature specified (refactor AIExplainButton)
- Onboarding flow defined (9 steps with Noor welcome)
- Governance Log embedded in Graph Explorer (not separate route)
- Founders Letter stays on landing page only
