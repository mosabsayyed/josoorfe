# JOSOOR FRONTEND RE-WIRING - DESIGN DOCUMENT

**Version:** 1.0  
**Date:** January 12, 2026  
**Status:** READY FOR IMPLEMENTATION

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 New Page Structure

```
/main (MainAppPage.tsx)
├── MainHeader.tsx          # Year/Quarter filters, Profile, Theme, Language, ? Onboarding
├── MainSidebar.tsx         # Menu navigation + Chat elements
└── <Outlet>                # Main content area for all sections
    ├── /sector             → SectorDesk (Map + KPI Gauges)
    ├── /controls           → ControlsDesk (4 Signal Ribbons)
    ├── /planning           → PlanningDesk
    ├── /reporting          → ReportingDesk
    ├── /enterprise         → EnterpriseDesk
    ├── /knowledge          → KnowledgeSeries
    ├── /chat               → GraphChat
    ├── /roadmap            → Roadmap (combined)
    ├── /graph              → GraphExplorer (3D)
    ├── /governance         → GovernanceLog
    ├── /settings           → Settings
    ├── /observability      → Observability
    └── /founders           → FoundersLetter
```

### 1.2 File Structure

```
frontend/src/
├── pages/main/
│   ├── MainAppPage.tsx
│   ├── MainHeader.tsx
│   ├── MainSidebar.tsx
│   ├── MainAppContext.tsx
│   └── sections/
│       ├── SectorDesk.tsx
│       ├── ControlsDesk.tsx
│       ├── PlanningDesk.tsx
│       ├── ReportingDesk.tsx
│       ├── EnterpriseDesk.tsx
│       ├── KnowledgeSeries.tsx
│       ├── GraphChat.tsx
│       ├── Roadmap.tsx
│       ├── GraphExplorer.tsx
│       ├── GovernanceLog.tsx
│       ├── Settings.tsx
│       ├── Observability.tsx
│       └── FoundersLetter.tsx
├── public/icons/
│   ├── josoor.png
│   ├── menu.png
│   ├── new.png
│   ├── profile.png
│   ├── twin.png
│   ├── approach.png
│   ├── arabic.png
│   ├── chat.png
│   ├── demo.png
│   ├── architecture.png
│   ├── icon-article.png
│   ├── icon-audio.png
│   ├── icon-guide.png
│   └── icon-video.png
```

---

## 2. STATE MANAGEMENT

### 2.1 MainAppContext

```tsx
interface MainAppState {
  year: string;              // '2025' - '2030'
  quarter: string;           // 'Q1' - 'Q4', 'All'
  theme: 'light' | 'dark';
  language: 'en' | 'ar';
  isRTL: boolean;
  onboardingComplete: boolean;
  openEscalationsCount: number;  // For governance badge
}

interface MainAppActions {
  setYear: (year: string) => void;
  setQuarter: (quarter: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  resetOnboarding: () => void;
}
```

### 2.2 Persistence

| State | Storage |
|-------|---------|
| `year`, `quarter` | Session (resets on reload) |
| `theme` | localStorage |
| `language` | localStorage |
| `onboardingComplete` | localStorage (`josoor_onboarding_complete`) |

---

## 3. COMPONENT DESIGN

### 3.1 MainHeader

**Elements (left to right):**
1. Page title + subtitle
2. Year dropdown (2025-2030)
3. Quarter dropdown (Q1-Q4, All)
4. Search icon (future)
5. Notifications bell (with badge)
6. Language toggle (EN/عربي)
7. Theme toggle (sun/moon)
8. `?` Onboarding replay button
9. Profile avatar + dropdown

**Profile moved from sidebar** → Now in header right side

### 3.2 MainSidebar

**Structure:**
```
┌─────────────────────────┐
│ [J] JOSOOR              │ ← Brand + collapse toggle
├─────────────────────────┤
│ [+] New Chat            │ ← New chat button
├─────────────────────────┤
│ ENTERPRISE MANAGEMENT   │ ← Section header
│   ▸ Sector Desk         │
│   ▸ Controls Desk       │
│   ▸ Planning Desk       │
│   ▸ Reporting Desk      │
│   ▸ Enterprise Desk     │
├─────────────────────────┤
│ KNOWLEDGE & TOOLS       │
│   ▸ Knowledge Series    │
│   ▸ Graph Chat          │
│   ▸ Roadmap             │
│   ▸ Graph Explorer      │
├─────────────────────────┤
│ GOVERNANCE              │
│   ▸ Governance Log [3]  │ ← Badge = open escalations
├─────────────────────────┤
│ ADMIN                   │
│   ▸ Settings            │
│   ▸ Observability       │
│   ▸ Founders Letter     │
├─────────────────────────┤
│ CONVERSATIONS           │ ← Collapsible
│   ▸ Today               │
│   ▸ Yesterday           │
│   ▸ Previous 7 days     │
└─────────────────────────┘
```

**Chat elements preserved:**
- New Chat button ✓
- Collapse/expand sidebar ✓
- Conversation history ✓

---

## 4. ONBOARDING FLOW

### 4.1 Trigger Logic

```tsx
if (localStorage.getItem('josoor_onboarding_complete') !== 'true') {
  startOnboarding();
}
```

### 4.2 Tour Steps (7 total)

| Step | Target ID | Position | Navigate To | Text (EN) | Text (AR) |
|------|-----------|----------|-------------|-----------|-----------|
| 1 | `#main-header` | bottom-center | - | "Welcome to JOSOOR! This header controls your view. Select Year and Quarter to filter all data." | "مرحباً بك في جسور! يتحكم هذا الشريط في عرضك. اختر السنة والربع لتصفية البيانات." |
| 2 | `#sidebar-menu` | right | - | "Navigate between desks here. Each desk provides a different lens on your transformation." | "تنقل بين المكاتب هنا. كل مكتب يوفر عدسة مختلفة على تحولك." |
| 3 | `#sidebar-chat-section` | right | - | "Start new conversations, collapse the sidebar, or access your chat history here." | "ابدأ محادثات جديدة أو قم بطي الشريط الجانبي من هنا." |
| 4 | `#sector-desk-gauges` | top | /main/sector | "KPI Gauges show real-time performance metrics. Click any gauge for detailed breakdown." | "مقاييس الأداء تعرض مؤشرات في الوقت الفعلي." |
| 5 | `#controls-desk-ribbons` | top | /main/controls | "Four signal ribbons: Steering, Risk, Delivery, Integrity. Each visualizes business chain flows." | "أربعة شرائط إشارة للتحكم في التحول." |
| 6 | `#graph-explorer-3d` | center | /main/graph | "Explore your knowledge graph in 3D. Click nodes to drill down, drag to rotate." | "استكشف رسم المعرفة ثلاثي الأبعاد." |
| 7 | `#header-profile` | bottom-left | - | "Access your profile, change theme/language, or logout. Click ? anytime to replay this tour." | "الوصول إلى ملفك الشخصي من هنا. انقر ? لإعادة الجولة." |

### 4.3 Visual Effects

- **Overlay:** 80% opacity dim on non-target areas
- **Highlight:** Target element stays fully visible
- **Popover:** Max-width 400px, positioned opposite to element
- **Buttons:** Previous | Next (gold accent)

### 4.4 Replay

- `?` icon in header
- Click → Clears localStorage flag → Restarts tour

---

## 5. API WIRING

### 5.1 Desk Endpoints

| Desk | Endpoint | Method | Parameters |
|------|----------|--------|------------|
| **Sector** | `/api/v1/dashboard/dashboard-data` | GET | year, quarter |
| | `/api/v1/dashboard/outcomes-data` | GET | year, quarter |
| **Controls - Steering** | `/api/business-chain/setting_strategic_initiatives` | GET | year, nodeId |
| **Controls - Risk BUILD** | `/api/business-chain/build_oversight` | GET | year, nodeId |
| **Controls - Risk OPERATE** | `/api/business-chain/operate_oversight` | GET | year, nodeId |
| **Controls - Delivery** | `/api/business-chain/sustainable_operations` | GET | year, nodeId |
| **Planning** | `/api/business-chain/setting_strategic_initiatives` | GET | year, analyzeGaps=true |
| **Reporting** | `/api/v1/chains/recommendations` | POST | chain results |
| | `/api/v1/files/export` | POST | report data |
| **Enterprise** | `/api/business-chain/sector_value_chain` | GET | year |
| **Graph Explorer** | `/api/v1/graph/explorer` | GET | year |

### 5.2 Governance Endpoints (NEW - Backend Required)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/governance/{nodeId}/decisions` | GET, POST | CRUD decisions |
| `/api/v1/governance/{nodeId}/state` | GET, POST | CRUD state reports |
| `/api/v1/governance/{nodeId}/escalations` | GET, POST, PUT | CRUD escalations |
| `/api/v1/governance/open-escalations` | GET | Count for badge |
| `/api/v1/governance/agent/run` | POST | Trigger daily agent |

### 5.3 Risk Engine Endpoints (NEW - Backend Required)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/risk-engine/run` | POST | Execute scoring |
| `/api/v1/risk-engine/config` | GET, PUT | ScoreConfig thresholds |

---

## 6. CSS STRATEGY

### 6.1 Authority

- **Master:** `/chat` CSS files
- **Files:** `theme.css`, `sidebar.css`, `Sidebar.css`

### 6.2 Variable Mapping

```css
/* When importing new design components, map: */
--panel-bg         /* backgrounds */
--panel-border     /* borders */
--text-primary     /* headings */
--text-secondary   /* body text */
--accent-gold      /* #FFD700 highlights */
```

### 6.3 RTL Support

- Use `direction: isRTL ? 'rtl' : 'ltr'`
- Use logical properties: `margin-inline-start`, `padding-inline-end`

---

## 7. RISK ENGINE VISUALIZATION

### 7.1 Controls Desk Ribbons

| Ribbon | Risk Data | Color Coding |
|--------|-----------|--------------|
| Risk BUILD | `build_exposure_pct`, `build_band` | Green < 35%, Amber 35-65%, Red > 65% |
| Risk OPERATE | `operate_exposure_pct`, `operate_band`, `trend_flag` | Same + arrow for trend |

### 7.2 Node Tooltips

```
Capability: Investor Relations
Mode: OPERATE
Exposure: 42% (Amber)
Health: 78%
Trend: Declining (2 consecutive drops)
```

---

## 8. GOVERNANCE LOG UI

### 8.1 Panel Design

```
┌────────────────────────────────────────┐
│ Governance Log: [Node Name]            │
├──────────┬──────────┬──────────────────┤
│ Decisions│ State    │ Escalations (3)  │ ← Tabs
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

---

## 9. BACKEND REQUESTS

### 9.1 Settings Migration (Supabase)

```sql
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider JSONB NOT NULL,
  mcp JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);
-- Seed from current admin_settings.json
```

### 9.2 Governance API

API endpoints as defined in Section 5.2. Backend implementation required at `betaBE.aitwintech.com`.

### 9.3 Risk Engine Config

```sql
CREATE TABLE risk_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  red_delay_days INT DEFAULT 30,
  link_threshold_pct INT DEFAULT 50,
  band_green_max_pct INT DEFAULT 35,
  band_amber_max_pct INT DEFAULT 65
);
```

---

## 10. IMPLEMENTATION TASKS

1. Extract and place icons in `frontend/public/icons/` ✓ DONE
2. Create `MainAppContext.tsx`
3. Create `MainAppPage.tsx` layout
4. Create `MainHeader.tsx` with filters + profile
5. Create `MainSidebar.tsx` with menu + chat elements
6. Build `SectorDesk` with gauges
7. Build `ControlsDesk` with 4 ribbons + Risk visualization
8. Build remaining desks (Planning, Reporting, Enterprise)
9. Integrate Knowledge, Roadmap, GraphExplorer in main area
10. Create `GraphChat` component
11. Implement onboarding tour (driver.js)
12. Verify/code Request Invite feature
13. Apply CSS authority
14. Configure routing
15. Build `GovernanceLog` panel
16. Integrate Risk Engine visualization
17. Add Governance badge
18. Document backend requests

---

## 11. REFERENCED DOCUMENTS

- `01_user_requirements_120126_0909.md`
- `GOVERNANCE_LOG_DESIGN_1768206485031.md`
- `Enterprise_Ontology_SST_v1_1_1768206798485.md`
