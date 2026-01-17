# JOSOOR Frontend Architecture - Consolidated Specification

**Version:** 3.0 (Authoritative)  
**Date:** January 13, 2026  
**Status:** ACTIVE - This document supersedes all previous versions

> **⚠️ CRITICAL:** This is the SINGLE SOURCE OF TRUTH. Any AI agent working on this codebase MUST read this document first.

---

## 1. Route Architecture

```
/                    → Landing Page (Public)
/login               → Login Page (Public)
/founder-letter      → Founder Letter (Public)
/contact-us          → Contact Us (Public)
/josoor              → Main Application Shell (Protected)
```

### 1.1 The `/josoor` Shell
The `/josoor` route is the **ONLY** authenticated experience. All content loads INSIDE this shell. The URL never changes from `/josoor` - internal navigation is handled via state/context.

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED HEADER                            │
│  [Logo] [AI Twin Tech JOSOOR] [Title] │ [Year▼][Qtr▼] │     │
│  [📥 Export] [🔗 Share] [?] [Lang] [Theme] [Profile▼]       │
├──────────────┬────────────────────────────────────────────────┤
│   SIDEBAR    │              CONTENT AREA                       │
│              │                                                  │
│  New Chat    │   ┌─────────────────────────────────────────┐   │
│  ----------  │   │                                         │   │
│  📊 Desks    │   │    Currently Active View                │   │
│   Sector     │   │    (Chat / Desk / Content / Admin)      │   │
│   Controls   │   │                                         │   │
│   Planning   │   │                                         │   │
│   Enterprise │   │                                         │   │
│   Reporting  │   │                                         │   │
│  ----------  │   │                                         │   │
│  📚 Content  │   │                                         │   │
│   Knowledge  │   │                                         │   │
│   Roadmap    │   │                                         │   │
│   Explorer   │   └─────────────────────────────────────────┘   │
│  ----------  │                                                  │
│  ⚙️ Admin    │              CANVAS (Chat mode only)            │
│   Settings   │   ┌─────────────────────────────────────────┐   │
│   Observ.    │   │  Artifacts / Visualizations             │   │
│  ----------  │   └─────────────────────────────────────────┘   │
│  💬 History  │                                                  │
│   Conv 1     │                                                  │
│   Conv 2     │                                                  │
└──────────────┴────────────────────────────────────────────────┘
```

---

## 2. Folder Structure (Target State)

```
frontend/src/
├── app/
│   └── josoor/                    # The /josoor route
│       ├── JosoorShell.tsx        # Main shell (Header + Sidebar + Content)
│       ├── JosoorHeader.tsx       # Unified header with all controls
│       ├── JosoorSidebar.tsx      # Navigation sidebar
│       ├── views/                 # All views that load in content area
│       │   ├── chat/              # Graph Chat (default view)
│       │   │   ├── ChatView.tsx
│       │   │   ├── ChatInput.tsx
│       │   │   └── MessageBubble.tsx
│       │   ├── desks/             # The 5 Desks
│       │   │   ├── SectorDesk.tsx
│       │   │   ├── ControlsDesk.tsx
│       │   │   ├── PlanningDesk.tsx
│       │   │   ├── EnterpriseDesk.tsx
│       │   │   └── ReportingDesk.tsx
│       │   ├── content/           # Content Sections
│       │   │   ├── KnowledgeSeries.tsx
│       │   │   ├── Roadmap.tsx
│       │   │   └── GraphExplorer.tsx
│       │   └── admin/             # Settings & Observability
│       │       ├── Settings.tsx
│       │       └── Observability.tsx
│       └── components/            # Shell-specific components
│           ├── GaugeCard.tsx
│           ├── SectorMap.tsx
│           ├── SignalRibbon.tsx
│           └── OnboardingOverlay.tsx
│
├── pages/                         # Standalone pages (NOT in shell)
│   ├── LandingPage.tsx            # / (with cube animation)
│   ├── LoginPage.tsx              # /login
│   ├── FounderLetter.tsx          # /founder-letter
│   └── ContactUs.tsx              # /contact-us
│
├── styles/                        # ONE source of CSS
│   ├── theme.css                  # CSS Variables (AUTHORITATIVE)
│   ├── global.css                 # Global styles
│   └── components.css             # Component styles (consolidated)
│
├── services/                      # API services
│   ├── authService.ts
│   ├── chatService.ts
│   ├── dashboardService.ts
│   └── graphService.ts
│
└── contexts/                      # React contexts
    ├── AuthContext.tsx
    ├── LanguageContext.tsx
    └── JosoorContext.tsx          # Navigation state for shell
```

---

## 3. CSS Strategy - ZERO TOLERANCE

### 3.1 The Law
1. **ONE SOURCE:** All styles come from `/styles/theme.css`
2. **NO PER-COMPONENT CSS:** Components do not have their own CSS files
3. **NO HARDCODED COLORS:** All colors use CSS variables
4. **NO TAILWIND:** Unless explicitly mapped to CSS variables
5. **INLINE STYLES ONLY** for dynamic values

### 3.2 CSS Variables (from theme.css)
```css
/* Background */
--bg-primary: <dark/light value>
--bg-secondary: <dark/light value>
--component-bg-primary: <value>
--component-panel-bg: <value>

/* Text */
--text-primary: <value>
--text-secondary: <value>
--component-text-accent: gold

/* Borders */
--border-color: <value>
--component-panel-border: <value>

/* Accent */
--accent-gold: #FFD700
--component-color-success: #10b981
--component-color-danger: #ef4444
```

### 3.3 How Components Must Style
```tsx
// ✅ CORRECT
<div style={{ 
  backgroundColor: 'var(--component-bg-primary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)'
}}>

// ❌ WRONG
<div style={{ backgroundColor: '#1f2937', color: 'white' }}>
<div className="bg-gray-900 text-white">
```

---

## 4. Component Inventory

### 4.1 Header Elements (ALL must be present)
| Element | Source | Status |
|---------|--------|--------|
| Logo | CDN image | ✅ |
| "AI Twin Tech JOSOOR" | Static text | ✅ |
| Title/Subtitle | Dynamic prop | 🔄 Adding |
| Year Dropdown | Sandbox | ✅ |
| Quarter Dropdown | Sandbox | ✅ |
| Export Button | Sandbox | 🔄 Adding |
| Share Button | Sandbox | 🔄 Adding |
| Onboarding (?) | Custom | ✅ |
| Language Toggle | Chat | ✅ |
| Theme Toggle | Chat | ✅ |
| Profile Dropdown | Sidebar (moved) | ✅ |

### 4.2 Sidebar Elements
| Section | Items | Behavior |
|---------|-------|----------|
| Actions | New Chat | Opens new chat thread |
| Desks | Sector, Controls, Planning, Enterprise, Reporting | Loads desk in content area |
| Content | Knowledge, Roadmap, Explorer | Loads in content area |
| Admin | Settings, Observability | Loads in content area |
| History | Conversation list | Loads chat conversation |

### 4.3 The 5 Desks
| Desk | Components | Data Source |
|------|------------|-------------|
| Sector | Map + Gauges + Radar | `/api/v1/dashboard/*` |
| Controls | 4 Signal Ribbons | Graph queries (SST) |
| Planning | Intervention, Scenarios | Graph queries |
| Enterprise | Capability Matrix, Gaps | Graph queries |
| Reporting | AI Insights, Export | Combined |

---

## 5. Features Checklist

### 5.1 Onboarding Tour
- **Trigger:** First login (one-time, locked after)
- **Replay:** `?` button in header
- **Narrative:** `docs/onboarding_narrative_from_user.txt`
- **Steps:** 10 (Welcome → Closing)

### 5.2 Trace Feature
- **Origin:** "Explain to me" button (Sandbox)
- **Refactor:** Opens chat thread with query context
- **Appears on:** Sector Radars, Enterprise Overlays, Controls Signals

### 5.3 Governance Log
- **NOT a separate page**
- **Embedded:** Popovers on nodes in Enterprise/Controls desks
- **Panels:** Decisions | State | Escalations

### 5.4 Risk Engine
- **Modes:** BUILD (Delay) vs OPERATE (Health)
- **Bands:** Green (<35%) | Amber (35-65%) | Red (>65%)

---

## 6. Backend Integration

### 6.1 Endpoints
- **Base:** `https://betaBE.aitwintech.com`
- **Dashboard:** `/api/v1/dashboard/*`
- **Chat:** `/api/v1/chat/*`
- **Graph:** Port 3001 (separate server)

### 6.2 Settings Migration
- **FROM:** File-based (`admin_settings.json`)
- **TO:** Database-based (Supabase `admin_settings` table)
- **STATUS:** CRITICAL - System non-functional without this

---

## 7. Implementation Phases

### Phase 1: Shell Foundation 🔄 IN PROGRESS
- [x] Create unified header in ChatContainer
- [x] Add Year/Quarter filters
- [x] Add Export/Share buttons
- [x] Add Profile dropdown (from sidebar)
- [ ] Create `/app/josoor/` folder structure
- [ ] Move components into new structure
- [ ] Update routes to use `/josoor`

### Phase 2: Consolidate CSS
- [ ] Merge all CSS into `theme.css` + `global.css`
- [ ] Remove per-component CSS files
- [ ] Verify theme compliance

### Phase 3: Wire Desks
- [ ] Sector Desk (Map + Gauges)
- [ ] Controls Desk (4 Ribbons)
- [ ] Planning Desk
- [ ] Enterprise Desk
- [ ] Reporting Desk

### Phase 4: Content Sections
- [ ] Knowledge Series (YouTube embeds)
- [ ] Roadmap (revamped content)
- [ ] Graph Explorer (3D standalone)

### Phase 5: Features
- [ ] Onboarding Tour
- [ ] Trace Feature
- [ ] Governance Popovers

### Phase 6: Admin
- [ ] Settings (DB migration)
- [ ] Observability enhancements

---

## 8. Files to DEPRECATE After Migration

```
frontend/src/pages/josoor-sandbox/     # Entire folder
frontend/src/pages/ChatAppPage.tsx     # Replaced by JosoorShell
frontend/src/components/layout/        # Replaced by app/josoor/
```

---

## 9. Verification Checklist

Before any PR/merge:
- [ ] `/josoor` route works
- [ ] Header has ALL elements
- [ ] Sidebar navigation works
- [ ] Theme toggle works (light/dark)
- [ ] Language toggle works (en/ar)
- [ ] Profile dropdown works
- [ ] No console errors
- [ ] CSS variables used (no hardcoded colors)

---

**Document History:**
- v3.0 (2026-01-13): Consolidated from 01/02/03 docs + user_raw_requirements
- v2.0: Corrected User Requirements
- v1.0: Initial Design Strategy
