# JOSOOR /main Implementation Plan - STITCH APPROACH

**Version:** 0.4 (TRACEABILITY COMPLETE)
**Date:** January 12, 2026
**Status:** READY FOR EXECUTION

---

## OVERVIEW

This plan describes how to STITCH existing components from `/chat` and `/josoor-sandbox` into a unified `/main` page system. 

**Core Principle:** Reuse existing code, do NOT recreate from scratch.

---

## TRACEABILITY MATRIX

### Matrix Structure: Requirement → Design Element → Implementation Task(s)

Each row shows: `[Req ID] Requirement Description → [Design Ref] Design Element → [Task IDs] Implementation Tasks`

**Rule:** Max 3 tasks per design element. If more needed, design element is split.

---

### REQ 2: MAIN PAGE REQUIREMENTS

| Req ID | Requirement | Design Ref | Design Element | Task IDs | Tasks (1-3 max) |
|--------|-------------|------------|----------------|----------|-----------------|
| 2.1 | Unified main page structure | §1.1 | MainAppPage layout | Q.2.1, Q.2.2 | Create MainAppPage.tsx, Configure layout (sidebar+header+outlet) |
| 2.2a | New Chat button | §3.2 | MainSidebar chat block | Q.4.1 | Extract New Chat from chat/Sidebar, add to MainSidebar |
| 2.2b | Sidebar collapsing | §3.2 | MainSidebar collapse | Q.4.2 | Wire collapse toggle, persist state |
| 2.2c | Conversation history | §3.2 | MainSidebar conversations | Q.4.3 | Extract ConversationsList, wire to chatService |
| 2.3 | Profile in header | §3.1 | MainHeader profile | Q.3.1 | Move profile from FrameHeader to header right |

---

### REQ 3: DESK REQUIREMENTS

| Req ID | Requirement | Design Ref | Design Element | Task IDs | Tasks (1-3 max) |
|--------|-------------|------------|----------------|----------|-----------------|
| 3.1a | Sector Desk - Map | §1.1 | SectorDesk-Map | W.1.1, W.1.2 | Import SectorOutcomes (SaudiMap), Add id="sector-desk-map" |
| 3.1b | Sector Desk - KPI Gauges | §1.1 | SectorDesk-KPIs | W.1.3, W.1.4, W.1.5 | Import ControlTower gauges, Wire /api/v1/dashboard/dashboard-data, Add id="sector-desk-gauges" |
| 3.2a | Controls Desk - Steering Ribbon | §6.1 | Controls-Steering | Q.5.1 | Import RiskSignals for setting_strategic_initiatives |
| 3.2b | Controls Desk - Risk BUILD Ribbon | §6.1 | Controls-BUILD | Q.5.2 | Wire build_oversight chain API |
| 3.2c | Controls Desk - Risk OPERATE Ribbon | §6.1 | Controls-OPERATE | Q.5.3 | Wire operate_oversight chain API |
| 3.2d | Controls Desk - Delivery Ribbon | §6.1 | Controls-Delivery | Q.5.4 | Wire sustainable_operations chain API |
| 3.3 | Planning Desk | §1.1 | PlanningDesk | Q.12.1, Q.12.2 | Import PlanningDesk, Wire analyzeGaps=true endpoint |
| 3.4 | Reporting Desk | §1.1 | ReportingDesk | Q.12.3, Q.12.4 | Import ReportingDesk, Wire recommendations + export |
| 3.5 | Enterprise Desk | §1.1 | EnterpriseDesk | Q.12.5 | Import DependencyDesk |

---

### REQ 4: SECTIONS (OPEN IN MAIN AREA)

| Req ID | Requirement | Design Ref | Design Element | Task IDs | Tasks (1-3 max) |
|--------|-------------|------------|----------------|----------|-----------------|
| 4.1 | Knowledge Series | §1.1 | KnowledgeSeries | Q.6.1, Q.6.2 | Import TwinKnowledge, Add id="knowledge-series" |
| 4.2 | Roadmap | §1.1 | Roadmap | Q.6.3, Q.6.4 | Create RoadmapWrapper (ProductRoadmap + PlanYourJourney) |
| 4.3 | Graph Explorer | §1.1 | GraphExplorer | Q.6.5, Q.6.6 | Import RiskTopologyMap, Add id="graph-explorer-3d" |
| 4.4 | Graph Chat | §1.1 | GraphChat | Q.6.7, Q.6.8 | Import ChatContainer, Add id="graph-chat" |

---

### REQ 5: ONBOARDING REQUIREMENTS

| Req ID | Requirement | Design Ref | Design Element | Task IDs | Tasks (1-3 max) |
|--------|-------------|------------|----------------|----------|-----------------|
| 5.1a | One-time trigger | §4.1 | Onboarding-Trigger | Q.18.1 | Check localStorage on mount |
| 5.1b | Locked after completion | §4.1 | Onboarding-Lock | Q.18.2 | Set flag on tour complete |
| 5.1c | ? button replay | §4.2 | Onboarding-Replay | Q.18.3 | Add ? to header, clear flag |
| 5.2a | 9 steps with navigation | §4.2 | Onboarding-Steps | Q.18.4, Q.18.5, Q.18.6 | Configure driver.js steps, Wire navigation, Add target IDs |

---

### REQ 6: GOVERNANCE LOG SYSTEM

| Req ID | Requirement | Design Ref | Design Element | Task IDs | Tasks (1-3 max) |
|--------|-------------|------------|----------------|----------|-----------------|
| 6.1 | Institutional memory | §9.1 | GovernanceLog-Panel | Q.16.1, Q.16.2 | Create GovernanceLogPanel.tsx, Wire decisions API |
| 6.2 | Decision/State/Escalation | §9.1 | GovernanceLog-Tabs | Q.16.3, Q.16.4 | Create 3-tab UI, Wire state/escalation APIs |
| 6.3 | Badge for open escalations | §3.2 | Sidebar-Badge | Q.16.5 | Fetch open-escalations count, show badge |

---

### REQ 7: RISK ENGINE INTEGRATION

| Req ID | Requirement | Design Ref | Design Element | Task IDs | Tasks (1-3 max) |
|--------|-------------|------------|----------------|----------|-----------------|
| 7.1a | BUILD mode scoring | §8.1 | RiskViz-BUILD | Q.17.1 | Wire build_exposure_pct, build_band to ribbons |
| 7.1b | OPERATE mode scoring | §8.1 | RiskViz-OPERATE | Q.17.2, Q.17.3 | Wire operate_exposure_pct, Add trend_flag arrows |
| 7.2 | Color-coded bands | §8.1 | RiskViz-Colors | Q.17.4 | Apply Green/Amber/Red CSS classes |

---

### REQ 8: INVITE SYSTEM

| Req ID | Requirement | Design Ref | Design Element | Task IDs | Tasks (1-3 max) |
|--------|-------------|------------|----------------|----------|-----------------|
| 8.1 | Request Invite functionality | (landing) | InviteSystem | Q.20.1, Q.20.2 | Verify existing, Code if placeholder |

---

### REQ 9: BACKEND REQUIREMENTS

| Req ID | Requirement | Design Ref | Design Element | Task IDs | Tasks (1-3 max) |
|--------|-------------|------------|----------------|----------|-----------------|
| 9.1 | Settings migration | §10.1 | Settings-Backend | X.1.1 | (Backend) Migrate to Supabase admin_settings |
| 9.2 | Governance API | §6.2 | Governance-API | X.1.2, X.1.3 | (Backend) CRUD endpoints, Agent run |
| 9.3 | Risk Engine API | §6.3 | RiskEngine-API | X.1.4, X.1.5 | (Backend) Execution trigger, Config |

---

### REQ 10: ICONS

| Req ID | Requirement | Design Ref | Design Element | Task IDs | Tasks (1-3 max) |
|--------|-------------|------------|----------------|----------|-----------------|
| 10.1 | 14 icons in public/icons | §1.2 | Icons | DONE | Already extracted |

---

### ADMIN REQUIREMENTS (MISSING - NOW ADDED)

| Req ID | Requirement | Design Ref | Design Element | Task IDs | Tasks (1-3 max) |
|--------|-------------|------------|----------------|----------|-----------------|
| A.1a | Settings - LLM Provider | §10.1 | Settings-LLM | W.2.1, W.2.2 | Import AdminSettingsPanel, Wire provider config |
| A.1b | Settings - MCP Tools | §10.1 | Settings-MCP | W.2.3 | Wire MCP tools config |
| A.2a | Observability - Analytics | (new) | Observability-Analytics | W.3.1, W.3.2, W.3.3 | Import analytics cards, Wire /debug/traces, Show metrics |
| A.2b | Observability - Traces | (new) | Observability-Traces | W.3.4, W.3.5 | Import trace list, Wire filters |
| A.3a | Risk Agent Console | (new) | RiskAgent-Console | W.4.1, W.4.2, W.4.3 | Create RiskAgentPanel, Wire run endpoint, Show status/log |

---

## STEP 0: STASH EXISTING WORK

```bash
mv frontend/src/pages/main frontend/src/pages/main_stash
```

**Important:** Do NOT delete. Keep for reference.

---

## SECTION A: COMPONENT INVENTORY

### A.1 Header Component

| Requirement | Existing File | Path |
|-------------|--------------|------|
| MainHeader base | `FrameHeader.tsx` | `frontend/src/pages/josoor-sandbox/layout/FrameHeader.tsx` |

**FrameHeader.tsx already provides:**
- Title + subtitle
- Year dropdown (2025-2030)
- Quarter dropdown (Q1-Q4, All)
- Theme toggle (light/dark)
- Language toggle (EN/AR)
- Profile avatar + dropdown
- Logout functionality
- RTL support via `useLanguage()`

**FrameHeader.tsx MISSING (must add):**
- `?` Onboarding replay button
- Export button
- Share button

**FrameHeader.tsx Props:**
```tsx
interface FrameHeaderProps {
    year: string;
    quarter: string;
    onYearChange: (y: string) => void;
    onQuarterChange: (q: string) => void;
    title?: string;
    subtitle?: string;
}
```

**Changes needed:**
1. Add `?` button between language toggle and profile
2. Add `id="main-header"` for onboarding target
3. Add `id="header-profile"` for onboarding target
4. Add optional `onOnboardingReplay?: () => void` prop

---

### A.2 Sidebar Components

**Two sources must be COMBINED:**

#### A.2.1 Navigation Menu (from FrameSidebar.tsx)

| File | Path |
|------|------|
| `FrameSidebar.tsx` | `frontend/src/pages/josoor-sandbox/layout/FrameSidebar.tsx` |

**Provides:**
- JOSOOR branding
- Navigation groups (Enterprise Management, Twin Knowledge, Admin)
- Collapse support
- Active path highlighting
- RTL support

**Current navigation paths (need updating):**
```
/josoor-sandbox/executives     → /main/sector
/josoor-sandbox/dependencies   → /main/enterprise
/josoor-sandbox/risks          → /main/controls
/josoor-sandbox/planning       → /main/planning
/josoor-sandbox/reporting      → /main/reporting
/josoor-sandbox/knowledge/hub  → /main/knowledge
/josoor-sandbox/knowledge/design → /main/roadmap
/josoor-sandbox/admin/settings → /main/settings
/josoor-sandbox/admin/observability → /main/observability
```

**Changes needed:**
1. Update all navigation paths to `/main/*`
2. Rename menu items per design doc:
   - "Executives Desk" → "Sector Desk"
   - "Dependency Desk" → "Enterprise Desk"
   - "Risk Desk" → "Controls Desk"
3. Add new items: Graph Explorer, Graph Chat
4. Add badge for open escalations on Graph Explorer
5. Add `id="sidebar-menu"` for onboarding target

#### A.2.2 Chat Elements (from chat/Sidebar.tsx)

| File | Path |
|------|------|
| `Sidebar.tsx` | `frontend/src/components/chat/Sidebar.tsx` |
| `Sidebar.css` | `frontend/src/components/chat/Sidebar.css` |

**Provides (MUST REMAIN per requirements):**
- New Chat button
- Sidebar collapse functionality
- Conversation history (Today, Yesterday, Previous 7 days)
- Quick actions (knowledge, demo, architecture, approach)
- Theme toggle (duplicate - use header's)
- Profile section (duplicate - use header's)

**Props:**
```tsx
interface SidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: number | null;
  onNewChat: () => void;
  onSelectConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
  onQuickAction: (action: QuickAction | string) => void;
  isCollapsed?: boolean;
  onRequestToggleCollapse?: () => void;
}
```

**Elements to extract/reuse:**
1. New Chat button component
2. Conversations list component (with date grouping)
3. Collapse toggle logic
4. Conversation summary formatting

**Changes needed:**
1. Extract chat-specific elements into reusable sub-components OR
2. Import full Sidebar and hide duplicate elements (theme, profile)
3. Add `id="sidebar-chat-section"` for onboarding target

---

### A.3 Desk Components

#### A.3.1 Sector Desk

| Requirement | Existing File | Path |
|-------------|--------------|------|
| Map component | `SectorOutcomes.tsx` | `frontend/src/pages/josoor-sandbox/components/SectorOutcomes.tsx` |
| KPI Gauges | `ControlTower.tsx` | `frontend/src/pages/josoor-sandbox/components/ControlTower.tsx` |
| Strategic insights | `StrategicInsights.tsx` | `frontend/src/pages/josoor-sandbox/components/StrategicInsights.tsx` |

**ControlTower.tsx provides:**
- Dashboard layout
- KPI visualization
- API integration with `/api/v1/dashboard/dashboard-data`

**Changes needed:**
1. Add `id="sector-desk-gauges"` for onboarding target
2. May need to wrap/compose these components

---

#### A.3.2 Enterprise Desk

| Requirement | Existing File | Path |
|-------------|--------------|------|
| Value chain | `DependencyDesk.tsx` | `frontend/src/pages/josoor-sandbox/components/DependencyDesk.tsx` |
| Dependency knots | `DependencyKnots.tsx` | `frontend/src/pages/josoor-sandbox/components/DependencyKnots.tsx` |

**DependencyDesk.tsx provides:**
- Sector value chain visualization
- API integration

---

#### A.3.3 Controls Desk (4 Signal Ribbons)

| Requirement | Existing File | Path |
|-------------|--------------|------|
| Risk visualization | `RiskDesk.tsx` | `frontend/src/pages/josoor-sandbox/components/RiskDesk.tsx` |
| Signal ribbons | `RiskSignals.tsx` | `frontend/src/pages/josoor-sandbox/components/RiskSignals.tsx` |
| Gap recommendations | `GapRecommendationsPanel.tsx` | `frontend/src/pages/josoor-sandbox/components/GapRecommendationsPanel.tsx` |

**4 Ribbons per requirements:**

| Ribbon | API Chain | Endpoint |
|--------|-----------|----------|
| Steering | `setting_strategic_initiatives` | `/api/business-chain/setting_strategic_initiatives` |
| Risk BUILD | `build_oversight` | `/api/business-chain/build_oversight` |
| Risk OPERATE | `operate_oversight` | `/api/business-chain/operate_oversight` |
| Delivery | `sustainable_operations` | `/api/business-chain/sustainable_operations` |

**Risk Engine Visualization:**
- Color bands: Green < 35%, Amber 35-65%, Red > 65%
- OPERATE mode: Shows trend flags (arrows)
- Data fields: `build_exposure_pct`, `build_band`, `operate_exposure_pct`, `operate_band`, `trend_flag`

**Changes needed:**
1. Add `id="controls-desk-ribbons"` for onboarding target
2. Verify all 4 ribbons are rendered
3. Verify risk color coding

---

#### A.3.4 Planning Desk

| Requirement | Existing File | Path |
|-------------|--------------|------|
| Planning view | `PlanningDesk.tsx` | `frontend/src/pages/josoor-sandbox/components/PlanningDesk.tsx` |
| Radar views | `LensARadar.tsx`, `LensBRadar.tsx` | `frontend/src/pages/josoor-sandbox/components/` |

**Provides:**
- Capability matrix
- Gap analysis
- API: `/api/business-chain/setting_strategic_initiatives?analyzeGaps=true`

---

#### A.3.5 Reporting Desk

| Requirement | Existing File | Path |
|-------------|--------------|------|
| Reporting view | `ReportingDesk.tsx` | `frontend/src/pages/josoor-sandbox/components/ReportingDesk.tsx` |
| Scores | `CombinedScore.tsx` | `frontend/src/pages/josoor-sandbox/components/CombinedScore.tsx` |
| Decisions list | `DecisionsList.tsx` | `frontend/src/pages/josoor-sandbox/components/DecisionsList.tsx` |

**Provides:**
- AI-generated insights
- PDF export capability
- API: `/api/v1/chains/recommendations`, `/api/v1/files/export`

---

### A.4 Tools/Knowledge Components

#### A.4.1 Knowledge Series

| Requirement | Existing File | Path |
|-------------|--------------|------|
| Knowledge content | `TwinKnowledge.tsx` | `frontend/src/components/content/TwinKnowledge.tsx` |
| Demo hub | `InvestorDemoHub.tsx` | `frontend/src/components/content/InvestorDemoHub.tsx` |

**Opens in main content area (NOT canvas)**

**Changes needed:**
1. Add `id="knowledge-series"` for onboarding target

---

#### A.4.2 Roadmap

| Requirement | Existing File | Path |
|-------------|--------------|------|
| Product roadmap | `ProductRoadmap.tsx` | `frontend/src/components/content/ProductRoadmap.tsx` |
| Journey planner | `PlanYourJourney.tsx` | `frontend/src/components/content/PlanYourJourney.tsx` |

**Combines both components**

---

#### A.4.3 Graph Explorer

| Requirement | Existing File | Path |
|-------------|--------------|------|
| 3D graph | `RiskTopologyMap.tsx` | `frontend/src/pages/josoor-sandbox/components/RiskTopologyMap.tsx` |
| Dependency view | `DependencyKnots.tsx` | `frontend/src/pages/josoor-sandbox/components/DependencyKnots.tsx` |
| Bubble chart | `RiskBubbleChart.tsx` | `frontend/src/pages/josoor-sandbox/components/RiskBubbleChart.tsx` |

**EMBEDDED: Governance Log Panel**
- Uses `DecisionsList.tsx` for entries
- 3 tabs: Decisions | State | Escalations
- Badge count in sidebar for open escalations

**Changes needed:**
1. Add `id="graph-explorer-3d"` for onboarding target
2. Create wrapper that embeds DecisionsList as slide-out panel
3. Trigger panel on node click

---

#### A.4.4 Graph Chat

| Requirement | Existing File | Path |
|-------------|--------------|------|
| Chat container | `ChatContainer.tsx` | `frontend/src/components/chat/ChatContainer.tsx` |
| Chat input | `ChatInput.tsx` | `frontend/src/components/chat/ChatInput.tsx` |
| Message bubble | `MessageBubble.tsx` | `frontend/src/components/chat/MessageBubble.tsx` |

**Changes needed:**
1. Add `id="graph-chat"` for onboarding target

---

### A.5 Admin Components

#### A.5.1 Settings

| Requirement | Existing File | Path |
|-------------|--------------|------|
| Settings page | `AdminSettingsPage.tsx` | Need to locate |

---

#### A.5.2 Observability

| Requirement | Existing File | Path |
|-------------|--------------|------|
| Dashboard | `ObservabilityDashboardPage.tsx` | Need to locate |

---

## SECTION B: GOVERNANCE LOG SYSTEM

### B.1 UI Design

```
┌────────────────────────────────────────┐
│ Governance Log: [Node Name]            │
├──────────┬──────────┬──────────────────┤
│ Decisions│ State    │ Escalations (N)  │ ← Tabs with badge
├──────────┴──────────┴──────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ dec-2024Q4-001       L1   Active   │ │
│ │ Prioritize manufacturing FDI       │ │
│ │ Owner: Board of Directors          │ │
│ │ Cascaded to: 2 nodes               │ │
│ └────────────────────────────────────┘ │
│ [+ Add Decision]                       │
└────────────────────────────────────────┘
```

### B.2 Location

- Embedded in Graph Explorer as slide-out panel
- Opens when user clicks a node in 3D graph
- NOT a separate route

### B.3 API Endpoints (Backend Required)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/governance/{nodeId}/decisions` | GET, POST | CRUD decisions |
| `/api/v1/governance/{nodeId}/state` | GET, POST | CRUD state reports |
| `/api/v1/governance/{nodeId}/escalations` | GET, POST, PUT | CRUD escalations |
| `/api/v1/governance/open-escalations` | GET | Count for badge |
| `/api/v1/governance/agent/run` | POST | Trigger daily agent |

### B.4 Sidebar Badge

Graph Explorer menu item shows `(N)` for open escalations count

---

## SECTION C: ONBOARDING TOUR

### C.1 Trigger Logic

```tsx
// On mount
if (localStorage.getItem('josoor_onboarding_complete') !== 'true') {
  startOnboarding();
}

// On ? button click
localStorage.removeItem('josoor_onboarding_complete');
startOnboarding();
```

### C.2 Implementation

Use `driver.js` library

### C.3 Tour Steps (9 total)

| Step | Target ID | Navigate To | Position | Text (EN) |
|------|-----------|-------------|----------|-----------|
| 1 | `#main-header` | - | bottom-center | "Welcome to Josoor, I am Noor, let me familiarize you with the working area where we will do great things together (inshallah). Starting with the headers, these controls are very important." |
| 2 | `#sidebar-menu` | - | right | "These sections are not random, they are your Noise Filters to focus on the Signal in an Integrated Loop of Influence. It starts with the Sector, where Impact is Observed. The signal starts: What is the Ambition and Where does it materialize, and What Tools do we deploy. Enterprise: The signal continues, Which capabilities do we prioritize to hit our targets on time across People/Process/Tools? Controls: signal repeaters reminding us of actions to keep us aligned. Planning: signal boosters to keep our promises tangible. Reporting: Internal Signals on our efficiency in acting on commitments. And back to Sector to witness the impact then learn and improve." |
| 3 | `#sidebar-chat-section` | - | right | "Start new conversations, collapse the sidebar, or access your chat history here." |
| 4 | `#sector-desk-gauges` | `/main/sector` | top | "Eyes on the prize, here is the impact we are ultimately aiming for!" |
| 5 | `#controls-desk-ribbons` | `/main/controls` | top | "Instant Deviation Signals on: Direction, Obstacles, Flow and Integration." |
| 6 | `#graph-explorer-3d` | `/main/graph` | center | "While you always understood your transformation, now you can visualize it and its complexities." |
| 7 | `#knowledge-series` | `/main/knowledge` | right | "Knowledge Series: Build a deeper understanding of the concepts and the way they interact." |
| 8 | `#graph-chat` | `/main/chat` | right | "Graph Chat: Talk to an expert agent grounded with the knowledge graph." |
| 9 | `#header-profile` | - | bottom-left | "Access your profile, change theme/language, or logout. Click ? anytime to replay this tour." |

### C.4 Arabic Translations (TODO)

| Step | Text (AR) |
|------|-----------|
| 1 | مرحباً بك في جسور... |
| 2 | ... |
| ... | ... |

### C.5 Visual Effects

- Overlay: 80% opacity dim on non-target areas
- Highlight: Target element stays fully visible
- Popover: Max-width 400px, positioned opposite to element
- Buttons: Previous | Next (gold accent `#FFD700`)

### C.6 Completion

After step 9:
```tsx
localStorage.setItem('josoor_onboarding_complete', 'true');
```

---

## SECTION D: TRACE FEATURE

### D.1 Source

Refactor `AIExplainButton.tsx` from `/josoor-sandbox/components/`

### D.2 Changes

| Current | New |
|---------|-----|
| Label: "Explain with AI" | Label: "Trace" |
| Modal title: "AI Analyst: {title}" | Modal title: "Trace: {title}" |

### D.3 Available On

- Sector Desk KPI cards
- Controls Desk ribbon nodes
- Graph Explorer nodes
- Enterprise Desk capabilities

### D.4 Behavior

1. User clicks Trace button
2. Modal popup with loading spinner
3. Context sent to `/api/v1/chat/message`
4. AI response displayed
5. "Continue Discussion in Chat →" button
6. Navigate to Graph Chat with `conversation_id`

---

## SECTION E: MAINSIDEBAR COMBINED STRUCTURE

```
┌─────────────────────────┐
│ [J] JOSOOR              │ ← FROM FrameSidebar (branding)
├─────────────────────────┤
│ [+] New Chat            │ ← FROM chat/Sidebar.tsx
├─────────────────────────┤
│ ENTERPRISE MANAGEMENT   │ ← FROM FrameSidebar (update paths)
│   ▸ Sector Desk         │   /main/sector
│   ▸ Enterprise Desk     │   /main/enterprise
│   ▸ Controls Desk       │   /main/controls
│   ▸ Planning Desk       │   /main/planning
│   ▸ Reporting Desk      │   /main/reporting
├─────────────────────────┤
│ TOOLS                   │
│   ▸ Knowledge Series    │   /main/knowledge
│   ▸ Roadmap             │   /main/roadmap
│   ▸ Graph Explorer (N)  │   /main/graph + badge
│   ▸ Graph Chat          │   /main/chat
├─────────────────────────┤
│ ADMIN                   │
│   ▸ Settings            │   /main/settings
│   ▸ Observability       │   /main/observability
├─────────────────────────┤
│ CONVERSATIONS           │ ← FROM chat/Sidebar.tsx (collapsible)
│   ▸ Today               │
│   ▸ Yesterday           │
│   ▸ Previous 7 days     │
├─────────────────────────┤
│ [Collapse toggle]       │ ← FROM chat/Sidebar.tsx
└─────────────────────────┘
```

---

## SECTION F: STATE MANAGEMENT

### F.1 MainAppContext

```tsx
interface MainAppState {
  year: string;              // '2025' - '2030'
  quarter: string;           // 'Q1' - 'Q4', 'All'
  theme: 'light' | 'dark';
  language: 'en' | 'ar';
  isRTL: boolean;
  onboardingComplete: boolean;
  openEscalationsCount: number;
}

interface MainAppActions {
  setYear: (year: string) => void;
  setQuarter: (quarter: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  resetOnboarding: () => void;
  refreshEscalationsCount: () => void;
}
```

### F.2 Persistence

| State | Storage | Key |
|-------|---------|-----|
| `year` | sessionStorage | `josoor_year` |
| `quarter` | sessionStorage | `josoor_quarter` |
| `theme` | localStorage | `josoor_theme` |
| `language` | localStorage | `josoor_language` |
| `onboardingComplete` | localStorage | `josoor_onboarding_complete` |

---

## SECTION G: CSS AUTHORITY

### G.1 Master Files

- `frontend/src/styles/theme.css`
- `frontend/src/components/chat/Sidebar.css`
- `frontend/src/styles/sidebar.css`

### G.2 Variable Mapping

```css
--panel-bg         /* backgrounds */
--panel-border     /* borders */
--text-primary     /* headings */
--text-secondary   /* body text */
--accent-gold      /* #FFD700 highlights */
```

### G.3 RTL Support

```tsx
<div style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
```

Use logical CSS properties:
- `margin-inline-start` instead of `margin-left`
- `padding-inline-end` instead of `padding-right`

---

## SECTION H: ROUTE CONFIGURATION

### H.1 Routes in App.tsx

```tsx
<Route path="/main" element={<MainAppPage />}>
  <Route index element={<Navigate to="sector" replace />} />
  <Route path="sector" element={<ControlTower />} />
  <Route path="enterprise" element={<DependencyDesk />} />
  <Route path="controls" element={<RiskDesk />} />
  <Route path="planning" element={<PlanningDesk />} />
  <Route path="reporting" element={<ReportingDesk />} />
  <Route path="knowledge" element={<TwinKnowledge />} />
  <Route path="roadmap" element={<RoadmapWrapper />} />
  <Route path="graph" element={<GraphExplorerWrapper />} />
  <Route path="chat" element={<GraphChatWrapper />} />
  <Route path="settings" element={<AdminSettingsPage />} />
  <Route path="observability" element={<ObservabilityDashboardPage />} />
</Route>
```

### H.2 Wrapper Components (minimal)

Some components may need thin wrappers to:
- Pass year/quarter from context
- Add onboarding target IDs
- Combine multiple components (e.g., Roadmap = ProductRoadmap + PlanYourJourney)

---

## SECTION I: NEW FILES TO CREATE

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `MainAppContext.tsx` | State management | ~80 |
| `MainAppPage.tsx` | Layout composition | ~100 |
| `MainSidebar.tsx` | Combines FrameSidebar + chat elements | ~150 |
| `RoadmapWrapper.tsx` | Combines ProductRoadmap + PlanYourJourney | ~30 |
| `GraphExplorerWrapper.tsx` | Adds governance log panel | ~100 |
| `GraphChatWrapper.tsx` | Adds onboarding ID | ~20 |
| `useOnboardingTour.ts` | Driver.js hook | ~100 |

---

## SECTION J: CHANGES TO EXISTING FILES

| File | Changes |
|------|---------|
| `FrameHeader.tsx` | Add ? button, add IDs |
| `FrameSidebar.tsx` | Update paths to /main/*, rename menu items |
| `AIExplainButton.tsx` | Rename to Trace |
| `App.tsx` | Add /main routes |

---

## SECTION K: IMPLEMENTATION ORDER

1. [ ] Stash `/main` to `/main_stash`
2. [ ] Create `MainAppContext.tsx`
3. [ ] Create `MainAppPage.tsx` (imports existing components)
4. [ ] Create `MainSidebar.tsx` (combines FrameSidebar + chat elements)
5. [ ] Update `FrameHeader.tsx` (add ? button, IDs)
6. [ ] Update `FrameSidebar.tsx` (paths, menu names)
7. [ ] Create wrapper components (Roadmap, GraphExplorer, GraphChat)
8. [ ] Configure routes in `App.tsx`
9. [ ] Create `useOnboardingTour.ts`
10. [ ] Refactor `AIExplainButton.tsx` → Trace
11. [ ] Add all onboarding target IDs
12. [ ] Test all routes
13. [ ] Test RTL support
14. [ ] Test theme switching
15. [ ] Test onboarding flow

---

## TODO: INCOMPLETE SECTIONS

- [x] A.5: Locate AdminSettingsPage and ObservabilityDashboardPage - DONE
- [ ] C.4: Complete Arabic translations for onboarding
- [ ] Verify all component props match expected interfaces
- [ ] Document which CSS files each component imports
- [ ] Verify API endpoints exist in backend
- [ ] Add error handling patterns

---

## SECTION L: REFERENCE PATTERNS FROM EXISTING CODE

### L.1 ChatAppPage Pattern (frontend/src/pages/ChatAppPage.tsx)

This is the MASTER PATTERN for how to wire conversations + sidebar + content:

```tsx
// Key state management pattern from ChatAppPage
const [conversations, setConversations] = useState<ConversationSummary[]>([]);
const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
const [messages, setMessages] = useState<APIMessage[]>([]);
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

// Conversation loading
useEffect(() => {
  chatService.getConversations().then(setConversations);
}, []);

// Props passed to Sidebar
<Sidebar
  conversations={conversations}
  activeConversationId={activeConversationId}
  onNewChat={handleNewChat}
  onSelectConversation={handleSelectConversation}
  onDeleteConversation={handleDeleteConversation}
  onQuickAction={handleQuickAction}
  isCollapsed={sidebarCollapsed}
  onRequestToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
/>
```

**CRITICAL:** MainAppPage must replicate this pattern for conversation management.

### L.2 JosoorFrame Pattern (frontend/src/pages/josoor-sandbox/layout/JosoorFrame.tsx)

This is the EXACT PATTERN for header + sidebar + outlet with context:

```tsx
export const JosoorFrame: React.FC = () => {
    const [year, setYear] = useState('2025');
    const [quarter, setQuarter] = useState('Q4');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Dynamic title/subtitle based on route
    const getPageInfo = () => { ... };

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <FrameSidebar isCollapsed={isSidebarCollapsed} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <FrameHeader 
                    year={year} 
                    quarter={quarter} 
                    onYearChange={setYear} 
                    onQuarterChange={setQuarter}
                    title={title}
                    subtitle={subtitle}
                />
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <Outlet context={{ year, quarter }} />
                </div>
            </div>
        </div>
    );
};
```

**CRITICAL:** MainAppPage must follow this EXACT layout pattern.

### L.3 Outlet Context Pattern (used by all desk components)

All desk components expect `useOutletContext<JosoorContext>()`:

```tsx
interface JosoorContext {
    year: string;
    quarter: string;
}

// In ControlTower, RiskDesk, DependencyDesk, etc:
const { year, quarter } = useOutletContext<JosoorContext>();
```

**CRITICAL:** MainAppPage's Outlet must provide this same context shape.

---

## SECTION M: COMPLETE FILE PATHS (VERIFIED)

### M.1 Admin Components (FOUND)

| Requirement | Existing File | Path |
|-------------|--------------|------|
| Settings page | `AdminSettingsPage.tsx` | `frontend/src/pages/AdminSettingsPage.tsx` |
| Observability | `ObservabilityDashboardPage.tsx` | `frontend/src/pages/ObservabilityDashboardPage.tsx` |

### M.2 Chat Components (FOUND)

| Component | Path |
|-----------|------|
| ChatAppPage | `frontend/src/pages/ChatAppPage.tsx` |
| Sidebar | `frontend/src/components/chat/Sidebar.tsx` |
| ChatContainer | `frontend/src/components/chat/ChatContainer.tsx` |
| ChatInput | `frontend/src/components/chat/ChatInput.tsx` |
| MessageBubble | `frontend/src/components/chat/MessageBubble.tsx` |
| CanvasManager | `frontend/src/components/chat/CanvasManager.tsx` |
| UniversalCanvas | `frontend/src/components/chat/UniversalCanvas.tsx` |

### M.3 Services (FOUND)

| Service | Path | Purpose |
|---------|------|---------|
| chatService | `frontend/src/services/chatService.ts` | Conversations, messages, streaming |
| authService | `frontend/src/services/authService.ts` | User auth, guest mode |
| chainsService | `frontend/src/services/chainsService.ts` | Business chain execution |

### M.4 Chains Service - 4 Ribbon Keys

```typescript
// From chainsService.ts - executeChain() accepts these chainKeys:
'setting_strategic_initiatives'  // Steering ribbon
'build_oversight'                // Risk BUILD ribbon  
'operate_oversight'              // Risk OPERATE ribbon
'sustainable_operations'         // Delivery ribbon
```

---

## SECTION N: MAINAPPPAGE DETAILED DESIGN

### N.1 Complete Structure

MainAppPage must combine:
1. **JosoorFrame pattern** - layout with sidebar + header + outlet
2. **ChatAppPage pattern** - conversation state management
3. **New elements** - onboarding, governance badge

### N.2 Required State

```tsx
// From JosoorFrame (keep as-is)
const [year, setYear] = useState('2025');
const [quarter, setQuarter] = useState('Q4');
const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

// From ChatAppPage (must add)
const [conversations, setConversations] = useState<ConversationSummary[]>([]);
const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

// New for governance
const [openEscalationsCount, setOpenEscalationsCount] = useState(0);

// New for onboarding
const [showOnboarding, setShowOnboarding] = useState(false);
```

### N.3 Required Effects

```tsx
// Load conversations on mount (from ChatAppPage)
useEffect(() => {
  chatService.getConversations().then(setConversations);
}, []);

// Load escalations count on mount (new)
useEffect(() => {
  fetch('/api/v1/governance/open-escalations')
    .then(res => res.json())
    .then(data => setOpenEscalationsCount(data.count || 0));
}, []);

// Check onboarding on mount (new)
useEffect(() => {
  if (localStorage.getItem('josoor_onboarding_complete') !== 'true') {
    setShowOnboarding(true);
  }
}, []);
```

### N.4 Layout Structure

```tsx
return (
  <div style={{ display: 'flex', height: '100vh' }} id="main-app">
    {/* Combined Sidebar */}
    <MainSidebar 
      isCollapsed={isSidebarCollapsed}
      onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      // Navigation props (from FrameSidebar)
      // Chat props (from ChatAppPage)
      conversations={conversations}
      activeConversationId={activeConversationId}
      onNewChat={handleNewChat}
      onSelectConversation={handleSelectConversation}
      onDeleteConversation={handleDeleteConversation}
      // Governance badge
      openEscalationsCount={openEscalationsCount}
    />
    
    {/* Main Content */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header with ? button */}
      <FrameHeader 
        year={year} 
        quarter={quarter} 
        onYearChange={setYear} 
        onQuarterChange={setQuarter}
        title={getPageTitle()}
        subtitle={getPageSubtitle()}
        onOnboardingReplay={() => setShowOnboarding(true)}
      />
      
      {/* Content Outlet */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        <Outlet context={{ year, quarter }} />
      </div>
    </div>
    
    {/* Onboarding Tour */}
    {showOnboarding && <OnboardingTour onComplete={() => {
      localStorage.setItem('josoor_onboarding_complete', 'true');
      setShowOnboarding(false);
    }} />}
  </div>
);
```

---

## SECTION O: MAINSIDEBAR DETAILED DESIGN

### O.1 Props Interface

```tsx
interface MainSidebarProps {
  // Collapse
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  
  // Chat elements (from ChatAppPage)
  conversations: ConversationSummary[];
  activeConversationId: number | null;
  onNewChat: () => void;
  onSelectConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
  
  // Governance badge
  openEscalationsCount: number;
}
```

### O.2 Component Structure

```tsx
export const MainSidebar: React.FC<MainSidebarProps> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  
  // Navigation groups (adapted from FrameSidebar)
  const groups = [
    {
      title: "ENTERPRISE MANAGEMENT",
      items: [
        { label: "Sector Desk", path: "/main/sector", icon: LayoutDashboard },
        { label: "Enterprise Desk", path: "/main/enterprise", icon: GitGraph },
        { label: "Controls Desk", path: "/main/controls", icon: ShieldAlert },
        { label: "Planning Desk", path: "/main/planning", icon: Map },
        { label: "Reporting Desk", path: "/main/reporting", icon: FileText },
      ]
    },
    {
      title: "TOOLS",
      items: [
        { label: "Knowledge Series", path: "/main/knowledge", icon: BookOpen },
        { label: "Roadmap", path: "/main/roadmap", icon: Cpu },
        { label: "Graph Explorer", path: "/main/graph", icon: Activity, badge: props.openEscalationsCount },
        { label: "Graph Chat", path: "/main/chat", icon: MessageSquare },
      ]
    },
    {
      title: "ADMIN",
      items: [
        { label: "Settings", path: "/main/settings", icon: Settings },
        { label: "Observability", path: "/main/observability", icon: Activity },
      ]
    }
  ];

  return (
    <div className="main-sidebar" id="sidebar-menu">
      {/* Branding */}
      <div className="sidebar-brand">
        <span className="brand-logo">J</span>
        {!props.isCollapsed && <span className="brand-name">JOSOOR</span>}
      </div>
      
      {/* New Chat Button (from chat/Sidebar) */}
      <button className="new-chat-btn" onClick={props.onNewChat}>
        {!props.isCollapsed && "New Chat"}
      </button>
      
      {/* Navigation Groups */}
      {groups.map(group => (
        <NavGroup key={group.title} {...group} />
      ))}
      
      {/* Conversations Section (from chat/Sidebar) */}
      <div id="sidebar-chat-section">
        <ConversationsSection 
          conversations={props.conversations}
          activeId={props.activeConversationId}
          onSelect={props.onSelectConversation}
          onDelete={props.onDeleteConversation}
          isCollapsed={props.isCollapsed}
        />
      </div>
      
      {/* Collapse Toggle */}
      <button onClick={props.onToggleCollapse}>
        {props.isCollapsed ? '→' : '←'}
      </button>
    </div>
  );
};
```

---

## SECTION P: GRAPH EXPLORER WITH GOVERNANCE LOG

### P.1 Wrapper Component

```tsx
// GraphExplorerWrapper.tsx
import { RiskTopologyMap } from '../josoor-sandbox/components/RiskTopologyMap';
import { GovernanceLogPanel } from './GovernanceLogPanel';

export const GraphExplorerWrapper: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showGovernancePanel, setShowGovernancePanel] = useState(false);
  
  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setShowGovernancePanel(true);
  };
  
  return (
    <div id="graph-explorer-3d" style={{ display: 'flex', height: '100%' }}>
      {/* 3D Graph */}
      <div style={{ flex: 1 }}>
        <RiskTopologyMap onNodeClick={handleNodeClick} />
      </div>
      
      {/* Governance Log Panel (slide-out) */}
      {showGovernancePanel && selectedNodeId && (
        <GovernanceLogPanel 
          nodeId={selectedNodeId}
          onClose={() => setShowGovernancePanel(false)}
        />
      )}
    </div>
  );
};
```

### P.2 Governance Log Panel Component

```tsx
// GovernanceLogPanel.tsx
export const GovernanceLogPanel: React.FC<{ nodeId: string; onClose: () => void }> = ({ nodeId, onClose }) => {
  const [activeTab, setActiveTab] = useState<'decisions' | 'state' | 'escalations'>('decisions');
  const [decisions, setDecisions] = useState([]);
  const [stateReports, setStateReports] = useState([]);
  const [escalations, setEscalations] = useState([]);
  
  useEffect(() => {
    // Fetch all governance data for node
    Promise.all([
      fetch(`/api/v1/governance/${nodeId}/decisions`).then(r => r.json()),
      fetch(`/api/v1/governance/${nodeId}/state`).then(r => r.json()),
      fetch(`/api/v1/governance/${nodeId}/escalations`).then(r => r.json()),
    ]).then(([d, s, e]) => {
      setDecisions(d);
      setStateReports(s);
      setEscalations(e);
    });
  }, [nodeId]);
  
  return (
    <div className="governance-panel">
      <header>
        <h3>Governance Log: {nodeId}</h3>
        <button onClick={onClose}>×</button>
      </header>
      
      <div className="tabs">
        <button onClick={() => setActiveTab('decisions')}>Decisions</button>
        <button onClick={() => setActiveTab('state')}>State</button>
        <button onClick={() => setActiveTab('escalations')}>
          Escalations ({escalations.filter(e => e.status === 'open').length})
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'decisions' && <DecisionsList data={decisions} />}
        {activeTab === 'state' && <StateList data={stateReports} />}
        {activeTab === 'escalations' && <EscalationsList data={escalations} />}
      </div>
      
      <button className="add-btn">+ Add {activeTab.slice(0, -1)}</button>
    </div>
  );
};
```

---

## SECTION Q: IMPLEMENTATION CHECKLIST (DETAILED)

### Phase 1: Setup
- [ ] 1.1 Stash `/main` → `/main_stash`
- [ ] 1.2 Create empty `/main` folder structure

### Phase 2: Core Components
- [ ] 2.1 Create `MainAppContext.tsx` with state + persistence
- [ ] 2.2 Create `MainAppPage.tsx` following JosoorFrame + ChatAppPage patterns
- [ ] 2.3 Create `MainSidebar.tsx` combining FrameSidebar nav + chat elements

### Phase 3: Header Updates
- [ ] 3.1 Add `?` onboarding button to `FrameHeader.tsx`
- [ ] 3.2 Add `id="main-header"` to header container
- [ ] 3.3 Add `id="header-profile"` to profile section
- [ ] 3.4 Add `onOnboardingReplay` prop

### Phase 4: Sidebar Updates
- [ ] 4.1 Extract FrameSidebar navigation logic for reuse
- [ ] 4.2 Update paths from `/josoor-sandbox/*` to `/main/*`
- [ ] 4.3 Rename menu items per design doc
- [ ] 4.4 Add Graph Explorer badge for escalations
- [ ] 4.5 Add `id="sidebar-menu"` and `id="sidebar-chat-section"`

### Phase 5: Wrapper Components
- [ ] 5.1 Create `RoadmapWrapper.tsx` (ProductRoadmap + PlanYourJourney)
- [ ] 5.2 Create `GraphExplorerWrapper.tsx` (3D graph + governance panel)
- [ ] 5.3 Create `GraphChatWrapper.tsx` (ChatContainer with ID)
- [ ] 5.4 Create `GovernanceLogPanel.tsx` (3-tab panel)

### Phase 6: Onboarding
- [ ] 6.1 Install driver.js if not present
- [ ] 6.2 Create `useOnboardingTour.ts` hook
- [ ] 6.3 Add all target IDs to components
- [ ] 6.4 Wire onboarding trigger and completion

### Phase 7: Trace Feature
- [ ] 7.1 Update `AIExplainButton.tsx` labels
- [ ] 7.2 Add "Continue in Chat" navigation

### Phase 8: Routing
- [ ] 8.1 Add `/main/*` routes to `App.tsx`
- [ ] 8.2 Configure default redirect to `/main/sector`
- [ ] 8.3 Test all routes load correct components

### Phase 9: Testing
- [ ] 9.1 Test navigation between all sections
- [ ] 9.2 Test conversation management (new, select, delete)
- [ ] 9.3 Test year/quarter filtering
- [ ] 9.4 Test theme switching
- [ ] 9.5 Test language/RTL switching
- [ ] 9.6 Test onboarding flow
- [ ] 9.7 Test sidebar collapse

---

## CHANGE LOG

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-12 | 0.1 | Initial draft |
| 2026-01-12 | 0.2 | Added Sections L-Q: Reference patterns, complete paths, detailed designs, implementation checklist |
| 2026-01-12 | 0.3 | Added Section R (CSS imports), Section S (AIExplainButton/Trace), Section T (Driver.js config) |

---

## SECTION R: CSS IMPORTS BY COMPONENT

### R.1 Master CSS Variables (theme.css)

```css
/* Dark theme (default) */
--component-bg-primary: #111827;       /* Main backgrounds */
--component-panel-bg: #1F2937;         /* Panel/card backgrounds */
--component-panel-border: #374151;     /* Borders */
--component-text-primary: #F9FAFB;     /* Headings */
--component-text-secondary: #D1D5DB;   /* Body text */
--component-text-muted: #9CA3AF;       /* Muted text */
--component-text-accent: #FFD700;      /* Gold accent */

/* Light theme */
--component-bg-primary: #F3F4F6;
--component-panel-bg: #FFFFFF;
--component-panel-border: #E5E7EB;
--component-text-primary: #1F2937;
--component-text-secondary: #4B5563;
--component-text-accent: #D97706;      /* Darker amber */
```

### R.2 CSS Imports by Component

| Component | CSS Files Imported |
|-----------|-------------------|
| ChatContainer | `styles/chat.css`, `styles/message-bubble.css`, `styles/sidebar.css`, `styles/chat-container.css` |
| Sidebar (chat) | `Sidebar.css`, `styles/sidebar.css` |
| FrameHeader | `josoor.css` |
| FrameSidebar | `josoor.css` |
| ControlTower | `ControlTower.css`, `styles/GraphDashboard.css` |
| RiskDesk | (no dedicated CSS) |
| RiskSignals | `RiskSignals.css` |
| DecisionsList | `DecisionsList.css` |

### R.3 Required CSS for MainAppPage

```tsx
// MainAppPage.tsx imports
import '../../styles/theme.css';        // CSS authority
import '../../styles/sidebar.css';      // Chat sidebar styles
import '../josoor-sandbox/josoor.css';  // Frame styles
```

---

## SECTION S: AIEXPLAINBUTTON → TRACE REFACTOR

### S.1 Current Interface

```tsx
interface AIExplainButtonProps {
    contextId: string;       // Unique ID for the element
    contextTitle: string;    // Display title
    contextData: any;        // Data to send to AI
    isDark?: boolean;        // Theme
    style?: React.CSSProperties;
    mode?: 'icon' | 'block'; // Render mode
    label?: string;          // Override label
}
```

### S.2 Required Label Changes

| Location | Current Text | New Text |
|----------|-------------|----------|
| Button label (default) | "Explain with AI" | "Trace" |
| Modal title | "AI Analyst: {title}" | "Trace: {title}" |
| Modal header icon | 💡 | 🔍 (optional) |

### S.3 Code Changes

```tsx
// In AIExplainButton.tsx

// Line ~130 (button label)
// FROM:
{!props.label ? '💡 Explain with AI' : props.label}
// TO:
{!props.label ? '🔍 Trace' : props.label}

// Line ~180 (modal title)
// FROM:
<h3 style={styles.modalTitle(isDark)}>AI Analyst: {contextTitle}</h3>
// TO:
<h3 style={styles.modalTitle(isDark)}>Trace: {contextTitle}</h3>
```

### S.4 Continue to Chat Navigation

The component already has this functionality:

```tsx
const handleContinueToChat = () => {
    setShowModal(false);
    navigate(`/chat?conversation_id=${conversationId}`);
};
```

**Change needed:** Update navigation path:
```tsx
navigate(`/main/chat?conversation_id=${conversationId}`);
```

---

## SECTION T: DRIVER.JS ONBOARDING CONFIGURATION

### T.1 Installation Check

```bash
# Check if driver.js is installed
npm list driver.js

# If not installed:
npm install driver.js
```

### T.2 Hook Implementation

```tsx
// useOnboardingTour.ts
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useNavigate } from 'react-router-dom';

const ONBOARDING_STEPS: DriveStep[] = [
  {
    element: '#main-header',
    popover: {
      title: 'Welcome to JOSOOR',
      description: 'Welcome to Josoor, I am Noor, let me familiarize you with the working area where we will do great things together (inshallah). Starting with the headers, these controls are very important.',
      side: 'bottom',
      align: 'center',
    }
  },
  {
    element: '#sidebar-menu',
    popover: {
      title: 'Navigation Menu',
      description: 'These sections are not random, they are your Noise Filters to focus on the Signal...',
      side: 'right',
      align: 'start',
    }
  },
  {
    element: '#sidebar-chat-section',
    popover: {
      title: 'Chat & Conversations',
      description: 'Start new conversations, collapse the sidebar, or access your chat history here.',
      side: 'right',
      align: 'start',
    }
  },
  // Steps 4-9 require navigation
  {
    element: '#sector-desk-gauges',
    popover: {
      title: 'Sector Desk',
      description: 'Eyes on the prize, here is the impact we are ultimately aiming for!',
      side: 'top',
      align: 'center',
    },
    onHighlightStarted: () => {
      // Navigate to sector desk
    }
  },
  // ... remaining steps
];

export function useOnboardingTour() {
  const navigate = useNavigate();
  
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: ONBOARDING_STEPS,
      nextBtnText: 'Next',
      prevBtnText: 'Previous',
      doneBtnText: 'Done',
      overlayColor: 'rgba(0, 0, 0, 0.8)',
      popoverClass: 'josoor-popover',
      onDestroyStarted: () => {
        localStorage.setItem('josoor_onboarding_complete', 'true');
      },
      onHighlightStarted: (element, step) => {
        // Handle navigation for steps that need it
        const navMap: Record<number, string> = {
          3: '/main/sector',
          4: '/main/controls',
          5: '/main/graph',
          6: '/main/knowledge',
          7: '/main/chat',
        };
        if (navMap[step.index]) {
          navigate(navMap[step.index]);
        }
      }
    });
    
    driverObj.drive();
  };
  
  return { startTour };
}
```

### T.3 Custom Popover Styling

```css
/* In theme.css or separate onboarding.css */
.josoor-popover {
  background: #1F2937 !important;
  border: 1px solid #374151 !important;
  color: #F9FAFB !important;
  max-width: 400px !important;
}

.josoor-popover .driver-popover-title {
  color: #FFD700 !important;
  font-weight: 600;
}

.josoor-popover .driver-popover-description {
  color: #D1D5DB !important;
  line-height: 1.6;
}

.josoor-popover .driver-popover-navigation-btns button {
  background: #FFD700 !important;
  color: #111827 !important;
  border: none !important;
  font-weight: 600;
}

.josoor-popover .driver-popover-progress-text {
  color: #9CA3AF !important;
}
```

---

## SECTION U: CONVERSATION MANAGEMENT

### U.1 Required Services

From `chatService.ts`:

```tsx
// Get all conversations
chatService.getConversations(): Promise<ConversationSummary[]>

// Load messages for a conversation
chatService.getMessages(conversationId: number): Promise<Message[]>

// Create new conversation (via first message)
chatService.sendMessage(message: string, conversationId?: number): Promise<...>

// Delete conversation
chatService.deleteConversation(conversationId: number): Promise<void>
```

### U.2 Handler Implementations

```tsx
// In MainAppPage.tsx

const handleNewChat = () => {
  setActiveConversationId(null);
  setMessages([]);
  navigate('/main/chat');
};

const handleSelectConversation = async (id: number) => {
  setActiveConversationId(id);
  const msgs = await chatService.getMessages(id);
  setMessages(msgs);
  navigate('/main/chat');
};

const handleDeleteConversation = async (id: number) => {
  await chatService.deleteConversation(id);
  setConversations(prev => prev.filter(c => c.id !== id));
  if (activeConversationId === id) {
    setActiveConversationId(null);
    setMessages([]);
  }
};
```

---

## SECTION V: COMPONENT DEPENDENCIES

### V.1 Import Tree for MainAppPage

```
MainAppPage.tsx
├── FrameHeader (from josoor-sandbox/layout)
│   ├── useLanguage (from contexts)
│   ├── authService (from services)
│   └── DropdownMenu (from ui)
├── MainSidebar (new - combines below)
│   ├── FrameSidebar logic (navigation groups)
│   └── Sidebar elements (chat history, new chat)
├── chatService (from services)
├── MainAppContext (new - state)
├── useOnboardingTour (new - driver.js)
└── Outlet (from react-router-dom)
```

### V.2 Import Tree for Desk Components

```
ControlTower.tsx (Sector Desk)
├── useOutletContext
├── LensARadar, LensBRadar
├── TrendsChart, CombinedScore
├── InternalOutputs
├── StrategicInsights (from dashboards)
└── SectorOutcomes (from dashboards)

RiskDesk.tsx (Controls Desk)
├── useOutletContext
├── RiskTopologyMap
├── AIExplainButton (Trace)
└── useQuery (@tanstack/react-query)

DependencyDesk.tsx (Enterprise Desk)
├── useOutletContext
└── DependencyKnots
```

---

## SECTION W: MISSING SECTIONS (NOW COMPLETE)

### W.1 SECTOR DESK DETAILED DESIGN

#### W.1.1 Component Composition

```
SectorDesk.tsx
├── SectorOutcomes (SaudiMap)         # Geographic visualization
│   └── Path: frontend/src/pages/josoor-sandbox/components/SectorOutcomes.tsx
├── ControlTower gauges               # KPI visualization
│   └── Path: frontend/src/pages/josoor-sandbox/components/ControlTower.tsx
└── StrategicInsights                 # AI-generated insights panel
    └── Path: frontend/src/pages/josoor-sandbox/components/StrategicInsights.tsx
```

#### W.1.2 API Endpoints

| Endpoint | Method | Purpose | Response Fields |
|----------|--------|---------|-----------------|
| `/api/v1/dashboard/dashboard-data` | GET | KPI data | `overall_score`, `governance_readiness`, `strategic_alignment` |
| `/api/v1/dashboard/outcomes-data` | GET | Map data | `regions`, `sector_outcomes`, `impact_metrics` |

#### W.1.3 KPI Gauges (from ControlTower)

| Gauge | Data Field | Color Logic |
|-------|------------|-------------|
| Overall Score | `overall_score` | Green ≥70, Amber 40-69, Red <40 |
| Governance Readiness | `governance_readiness` | Same |
| Strategic Alignment | `strategic_alignment` | Same |
| Transformation Index | `transformation_index` | Same |

#### W.1.4 Implementation Tasks

| Task ID | Task | Lines Est. |
|---------|------|-----------|
| W.1.1 | Create SectorDesk.tsx wrapper | 60 |
| W.1.2 | Import SectorOutcomes, add id="sector-desk-map" | 10 |
| W.1.3 | Import ControlTower gauge components | 20 |
| W.1.4 | Wire /api/v1/dashboard/dashboard-data | 25 |
| W.1.5 | Add id="sector-desk-gauges" for onboarding | 5 |

#### W.1.5 Wrapper Code

```tsx
// SectorDesk.tsx
import { useOutletContext } from 'react-router-dom';
import { SectorOutcomes } from '../../josoor-sandbox/components/SectorOutcomes';
import { ControlTower } from '../../josoor-sandbox/components/ControlTower';
import { StrategicInsights } from '../../josoor-sandbox/components/StrategicInsights';

interface JosoorContext { year: string; quarter: string; }

export const SectorDesk: React.FC = () => {
  const { year, quarter } = useOutletContext<JosoorContext>();
  
  return (
    <div className="sector-desk">
      <div id="sector-desk-map">
        <SectorOutcomes year={year} quarter={quarter} />
      </div>
      <div id="sector-desk-gauges">
        <ControlTower year={year} quarter={quarter} />
      </div>
      <StrategicInsights year={year} quarter={quarter} />
    </div>
  );
};
```

---

### W.2 SETTINGS PAGE DETAILED DESIGN

#### W.2.1 Source Component

```
Path: frontend/src/pages/AdminSettingsPage.tsx
Lines: 346
```

#### W.2.2 Settings Panels

| Panel | Config Fields | API |
|-------|---------------|-----|
| **LLM Provider** | `base_url`, `model_name`, `api_key_ref`, `temperature`, `max_tokens` | `/api/v1/admin/settings` GET/PUT |
| **MCP Tools** | `enabled_tools[]`, `tool_configs{}` | Same endpoint |
| **Feature Flags** | `feature_flags{}` (e.g., `governance_enabled`, `risk_engine_enabled`) | Same endpoint |
| **System Behavior** | `cache_ttl`, `rate_limits`, `logging_level` | Same endpoint |

#### W.2.3 AdminSettings Interface

```tsx
interface AdminSettings {
  provider: {
    base_url: string;
    model_name: string;
    api_key_ref: string;  // Secret reference, not actual key
    temperature: number;
    max_tokens: number;
  };
  mcp: {
    enabled_tools: string[];
    tool_configs: Record<string, any>;
  };
  feature_flags: Record<string, boolean>;
  system: {
    cache_ttl: number;
    rate_limits: Record<string, number>;
    logging_level: 'debug' | 'info' | 'warn' | 'error';
  };
}
```

#### W.2.4 Implementation Tasks

| Task ID | Task | Lines Est. |
|---------|------|-----------|
| W.2.1 | Create Settings.tsx wrapper that imports AdminSettingsPanel | 40 |
| W.2.2 | Wire to /api/v1/admin/settings (already exists in adminSettingsService) | 10 |
| W.2.3 | Add MCP tools panel if not already present | 50 |

---

### W.3 OBSERVABILITY PAGE DETAILED DESIGN

#### W.3.1 Source Component

```
Path: frontend/src/pages/ObservabilityDashboardPage.tsx
Lines: 692
```

#### W.3.2 Analytics Cards

| Card | Metric | Color Logic |
|------|--------|-------------|
| Total Requests | `total_requests` | Neutral |
| Total Tokens | `total_tokens` | Neutral |
| Cache Hit Rate | `cache_hit_rate` | Green ≥50%, Amber 20-49%, Red <20% |
| Avg Latency | `avg_latency_ms` | Green <500, Amber 500-2000, Red >2000 |
| Error Rate | `error_rate` | Green <1%, Amber 1-5%, Red >5% |
| P95 Latency | `p95_latency_ms` | Green <1000, Amber 1000-5000, Red >5000 |

#### W.3.3 Trace List Features

| Feature | Fields |
|---------|--------|
| Trace Entry | `conversation_id`, `created_at`, `persona`, `provider`, `model_name` |
| Request Details | `request_temperature`, `request_max_tokens`, `request_messages_count` |
| Response Details | `response_stop_reason`, `response_choices_count` |
| Tool Usage | `tool_calls_count`, `tool_names_used` |
| Token Stats | `total_tokens`, `input_tokens`, `output_tokens`, `cached_tokens` |
| Performance | `ttft_ms`, `last_latency_ms` |
| Status | `has_error`, `last_status` |

#### W.3.4 Filter Options

```tsx
const [filterModel, setFilterModel] = useState('');      // Model name filter
const [filterPersona, setFilterPersona] = useState('');  // Persona filter
const [filterHasTools, setFilterHasTools] = useState<string>('all'); // 'all' | 'yes' | 'no'
const [filterStatus, setFilterStatus] = useState('');    // Status filter
```

#### W.3.5 Implementation Tasks

| Task ID | Task | Lines Est. |
|---------|------|-----------|
| W.3.1 | Create Observability.tsx wrapper | 30 |
| W.3.2 | Import ObservabilityDashboardPage | 10 |
| W.3.3 | Ensure analytics cards render correctly | 5 |
| W.3.4 | Wire trace list with existing /debug/traces | 10 |
| W.3.5 | Verify filters work | 5 |

---

### W.4 RISK AGENT CONSOLE (NEW - DISTINCT FROM RISK DESK)

#### W.4.1 Purpose

Risk Agent is an **automated governance agent** that:
1. Runs daily to evaluate risk exposure across all nodes
2. Generates escalations when thresholds are breached
3. Updates risk scores (BUILD/OPERATE modes)
4. Can be triggered manually by admin

**This is DIFFERENT from Risk Desk (Controls Desk):**
- Controls Desk = View risk data (user-facing visualization)
- Risk Agent Console = Admin panel to trigger/monitor the agent

#### W.4.2 UI Design

```
┌────────────────────────────────────────────────────────┐
│ Risk Agent Console                                      │
├─────────────────────────────────────────────────────────┤
│ Status: [🟢 Idle / 🟡 Running / 🔴 Error]              │
│ Last Run: 2026-01-12 03:00:00 UTC                      │
│ Next Scheduled: 2026-01-13 03:00:00 UTC                │
│ ─────────────────────────────────────────────────────── │
│ [▶ Run Now]  [⏸ Pause Schedule]  [⚙ Configure]        │
├─────────────────────────────────────────────────────────┤
│ Recent Runs                                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 2026-01-12 03:00  ✓ Success  45 nodes  3 escalations│ │
│ │ 2026-01-11 03:00  ✓ Success  45 nodes  1 escalation │ │
│ │ 2026-01-10 03:00  ✗ Error    Connection timeout     │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Configuration                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Red Threshold: [30] days delay                       │ │
│ │ Link Threshold: [50]% dependency                     │ │
│ │ Green Band Max: [35]%                               │ │
│ │ Amber Band Max: [65]%                               │ │
│ │ Schedule: [03:00 UTC daily]                         │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### W.4.3 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/risk-engine/status` | GET | Get agent status, last run, next scheduled |
| `/api/v1/risk-engine/run` | POST | Trigger manual run |
| `/api/v1/risk-engine/config` | GET | Get current config |
| `/api/v1/risk-engine/config` | PUT | Update config |
| `/api/v1/risk-engine/history` | GET | Get run history |

#### W.4.4 Component Code

```tsx
// RiskAgentConsole.tsx
import { useState, useEffect } from 'react';
import { Play, Pause, Settings, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

interface AgentStatus {
  status: 'idle' | 'running' | 'error';
  last_run: string | null;
  next_scheduled: string | null;
  last_error: string | null;
}

interface AgentConfig {
  red_delay_days: number;
  link_threshold_pct: number;
  band_green_max_pct: number;
  band_amber_max_pct: number;
  schedule_cron: string;
}

interface RunHistory {
  id: string;
  timestamp: string;
  status: 'success' | 'error';
  nodes_processed: number;
  escalations_created: number;
  error_message?: string;
}

export const RiskAgentConsole: React.FC = () => {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [history, setHistory] = useState<RunHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchConfig();
    fetchHistory();
  }, []);

  const fetchStatus = async () => {
    const res = await fetch('/api/v1/risk-engine/status');
    setStatus(await res.json());
  };

  const fetchConfig = async () => {
    const res = await fetch('/api/v1/risk-engine/config');
    setConfig(await res.json());
  };

  const fetchHistory = async () => {
    const res = await fetch('/api/v1/risk-engine/history?limit=10');
    setHistory((await res.json()).runs || []);
  };

  const handleRunNow = async () => {
    setLoading(true);
    await fetch('/api/v1/risk-engine/run', { method: 'POST' });
    await fetchStatus();
    await fetchHistory();
    setLoading(false);
  };

  const handleSaveConfig = async () => {
    await fetch('/api/v1/risk-engine/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  };

  // ... render UI
};
```

#### W.4.5 Implementation Tasks

| Task ID | Task | Lines Est. |
|---------|------|-----------|
| W.4.1 | Create RiskAgentConsole.tsx | 150 |
| W.4.2 | Wire status/run/config APIs | 40 |
| W.4.3 | Add run history list with status indicators | 50 |

---

## TODO: REMAINING INCOMPLETE ITEMS

- [ ] Arabic translations for onboarding steps (Section C.4)
- [ ] Verify backend API endpoints exist for governance
- [ ] Document error handling patterns for API failures
- [ ] Add loading states for all async operations
- [ ] Define mobile responsive breakpoints
- [ ] Backend: Implement Risk Agent APIs (W.4.3)

