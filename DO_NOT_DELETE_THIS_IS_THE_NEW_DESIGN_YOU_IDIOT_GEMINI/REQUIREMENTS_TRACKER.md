# Water Sector Command Center - Requirements Tracker
[x] - done
[/] - partial
[ ] - pending

## 1. SECTOR DESK (COMPLETE ✅)

### 1.1 Left Navigation Sidebar
- [x] Vertical sidebar with dark theme
- [x] Navigation menu items
- [x] Active state indicators
- [x] Collapsible/expandable functionality
- [x] Icons for each menu item

### 1.2 Dashboard Sidebar (Right Panel)
- [x] Fixed width: 20vw
- [x] Dark theme background: rgba(15,23,42,0.95)
- [x] Border styling: rgba(148,163,184,0.3)
- [x] Scrollable content
- [x] Z-index: 200

#### 1.2.1 Tab System
- [x] Two tabs: Strategic Impact & Transform Health
- [x] Tab icons: Target and Heart (lucide-react)
- [x] Active tab highlighting (green for Impact, amber for Health)
- [x] Sticky tab header at top
- [x] Smooth transitions between tabs

#### 1.2.2 Strategic Impact Tab - Radar Chart
- [x] Chart title: "Strategic Impact"
- [x] Overall score display: 92% (top right, green)
- [x] 5 indicators: GDP Impact, Jobs Created, FDI Attracted, Infrastructure, Capacity Growth
- [x] Multi-line labels to prevent overlaps
- [x] Two data series: Actual (solid green) and Plan (dashed gray)
- [x] Per-node tooltips showing both Actual and Plan values
- [x] Compact tooltip size (11px font, 6x10 padding)
- [x] Tooltip stays on screen (confine: true)
- [x] Transparent background
- [x] Legend at bottom
- [x] Smooth animations on data changes

#### 1.2.3 Strategic Impact Tab - KPI Gauge Cards
**1.0 Water Sector GDP** (Main Card - Level 1)
- [x] Title: "1.0 Water Sector GDP"
- [x] No normals in title
- [x] Font size reduced to fit in one line
- [x] Value: 92%
- [x] Status: green
- [x] Delta: +16% (green color)
- [x] Gauge values: base=76, Y-1=80, Actual=92, Y+1=95, end=100
- [x] Bottom labels: base, Y-1, Actual, Y+1, end
- [x] Family: 1.0 (standard green gradient)
- [x] Responsive width (100% of container)
- [x] Maintained aspect ratio
- [x] green arc 
- [x] Proper border styling matching Figma

**1.1 FDI in Water** (Sub-card - Level 2)
- [x] Title: "1.1 FDI in Water"
- [x] Indented 15% (ml-4)
- [x] Scaled down 15% (scale: 0.85)
- [x] Value: 88%
- [x] Status: green
- [x] Delta: +8%
- [x] Gauge values: base=80, Q-1=85, Actual=88, Q+1=90, end=95
- [x] Bottom labels: base, Q-1, Actual, Q+1, end
- [x] Family: 1.0
- [x] green arc 

**1.2 Jobs Created** (Sub-card - Level 2)
- [x] Title: "1.2 Jobs Created"
- [x] Indented 15% (ml-4)
- [x] Scaled down 15% (scale: 0.85)
- [x] Value: 95%
- [x] Status: green
- [x] Delta: +5%
- [x] Gauge values: base=90, Q-1=92, Actual=95, Q+1=97, end=100
- [x] Bottom labels: base, Q-1, Actual, Q+1, end
- [x] Family: 1.0
- [x] green arc 

**2.0 Infrastructure Resilience** (Main Card - Level 1)
- [x] Title: "2.0 Infrastructure Resilience"
- [x] No normals in title
- [x] Font size reduced to fit in one line
- [x] Value: 75%
- [x] Status: amber
- [x] Delta: +5%
- [x] Gauge values: base=70, Y-1=72, Actual=75, Y+1=78, end=85
- [x] Bottom labels: base, Y-1, Actual, Y+1, end
- [x] Family: 2.0 (different background color #3a4558)
- [x] Different orange gradient for amber status
- [x] Responsive width
- [x] green arc 	

**2.1 Desalination Capacity** (Sub-card - Level 2)
- [x] Title: "2.1 Desalination Capacity"
- [x] Indented 15% (ml-4)
- [x] Scaled down 15% (scale: 0.85)
- [x] Value: 72%
- [x] Status: amber
- [x] Delta: +7%
- [x] Gauge values: base=65, Q-1=68, Actual=72, Q+1=76, end=85
- [x] Bottom labels: base, Q-1, Actual, Q+1, end
- [x] Family: 2.0
- [x] green arc 

**2.2 Pipeline Network** (Sub-card - Level 2)
- [x] Title: "2.2 Pipeline Network"
- [x] Indented 15% (ml-4)
- [x] Scaled down 15% (scale: 0.85)
- [x] Value: 68%
- [x] Status: amber
- [x] Delta: +8%
- [x] Gauge values: base=60, Q-1=64, Actual=68, Q+1=72, end=80
- [x] Bottom labels: base, Q-1, Actual, Q+1, end
- [x] Family: 2.0
- [x] green arc

#### 1.2.4 Transform Health Tab - Radar Chart
- [x] Chart title: "Transformation Health"
- [x] Overall score display: 84% (top right, amber)
- [x] 8 indicators: Strategy, Ops, Risk, Investment, Investors, Employees, Projects, Tech 
- [x] Two data series: Actual (solid amber) and Target (dashed gray)
- [x] Per-node tooltips showing both Actual and Target values
- [x] Compact tooltip size
- [x] Tooltip stays on screen
- [x] Legend at bottom

#### 1.2.5 Transform Health Tab - Project to Operations Handover
- [x] Cards follow the reference design
- [x] Projects & Operations Integration bar chart
- [x] Text labels showing Project Velocity: 88 and Ops Efficiency: 93
- [x] Consistent card styling
- [x] Proper spacing between cards

#### 1.2.6 Transform Health Tab - Economic Impact 
- [x] Cards follow the reference design
- [x] Economic Impact bar chart (FDI, Trade, Jobs)
- [x] Economic Impact Correlation chart (bars + line overlay)
- [x] Consistent card styling
- [x] Proper spacing between cards

#### 1.2.7 Transform Health Tab - Infrastructure Coverage
- [x] Cards follow the reference design
- [x] Infrastructure Coverage bar chart (Water, Sewer, Transport)
- [x] Tooltip showing Coverage and Quality for Water
- [x] Consistent card styling
- [x] Proper spacing between cards

#### 1.2.8 Transform Health Tab - Portfolio Health 
- [x] Cards follow the reference design
- [x] Investment Portfolio Health scatter plot (Risk Level vs Align)
- [x] Variable size bubbles based on risk level
- [x] Consistent card styling
- [x] Proper spacing between cards

### 1.3 Main Map Area
- [x] Saudi Arabia map displayed
- [x] Dark theme styling
- [x] AUTO zoom and return 
- [x] zoom view of city layout with main plant and assets
- [x] Initial view centered on Saudi Arabia
- [x] Responsive to window resize
- [x] 13 region outlines displayed
- [x] Region borders visible
- [x] Supporting assets system
- [x] Plant markers with status
- [x] Pipeline flow animations
- [x] Zoom & interaction functionality
- [x] Enhanced plant details panel

---

## 2. ENTERPRISE DESK (CAPABILITY MATRIX)

### 2.1 Navigation Integration
- [x] Wire "Enterprise Desk" menu item to show EnterpriseDesk component
- [x] Update App.tsx to handle view switching
- [x] Hide SaudiMap and DashboardSidebar when Enterprise Desk is active
- [x] Show EnterpriseDesk component when menu item is clicked

### 2.2 Page Header
- [x] Page title: "Engine Room - Capability Matrix"
- [x] Subtitle: "Water Sector Capability Health & Maturity Assessment"
- [x] Dark theme background matching sector desk
- [x] Proper spacing and typography

### 2.3 Heatmap Overlay Controls
- [x] Control panel with 6 overlay buttons
- [x] Buttons: Status Only, Maturity Gap, Staff Needs, IT Tools, Process Docs, Team Health
- [x] Icons for each button (lucide-react equivalents)
- [x] Active state highlighting (blue background)
- [x] Toggle behavior - only one active at a time
- [x] Control panel styling: glass panel with border

### 2.4 Capability Matrix - Layout Structure
- [x] 3-column table layout: L1 | L2 | L3
- [x] Table-like display using CSS (display: table replaced with flexbox for better control)
- [x] L1 column: 20% width, rowspan effect for multiple L2s
- [x] L2 column: 25% width, one row per L2
- [x] L3 column: 55% width, horizontal scrollable cells
- [x] Border styling: rgba(51, 65, 85, 0.5)
- [x] Proper cell padding: 12px (adjusted to 3 for better fit)

### 2.5 Capability Matrix - L1 Cells
- [x] Background: rgba(30, 41, 59, 0.8)
- [x] Font weight: bold
- [x] Text color: #3b82f6 (blue-500)
- [x] Display L1 ID (e.g., "[1.0]") in small mono font
- [x] Display L1 name in bold
- [x] Display description in smaller text
- [x] Show maturity: "current / target" format
- [x] Show count of L2s if > 1
- [x] Rowspan visual effect (first row full cell, subsequent rows empty)

### 2.6 Capability Matrix - L2 Cells
- [x] Background: rgba(15, 23, 42, 0.9)
- [x] Text color: #60a5fa (blue-400)
- [x] Display L2 ID (e.g., "[1.1]") in small mono font
- [x] Display L2 name in semibold
- [x] Display description in smaller text
- [x] Show maturity: "current / target" format
- [x] One row per L2

### 2.7 Capability Matrix - L3 Cells Container
- [x] Background: rgba(15, 23, 42, 0.6)
- [x] Horizontal flex layout with gap: 4px (adjusted to 1px)
- [x] Overflow-x: auto (horizontal scroll)
- [x] Padding: 8px (adjusted to 2px)
- [x] No flex-wrap (single row)

### 2.8 Capability Matrix - L3 Individual Cells
- [x] Min/max width: 80px each
- [x] Padding: 8px (adjusted to 2px)
- [x] Border radius: 6px (adjusted to md)
- [x] Status-based coloring:
  - Green (active): rgba(16, 185, 129, 0.3) bg, rgba(16, 185, 129, 0.6) border
  - Amber (pending): rgba(245, 158, 11, 0.3) bg, rgba(245, 158, 11, 0.6) border
  - Red (risk): rgba(239, 68, 68, 0.3) bg, rgba(239, 68, 68, 0.6) border
- [x] Hover effect: scale(1.05), box-shadow glow, z-index: 10
- [x] Cursor: pointer
- [x] Smooth transitions (0.3s)

### 2.9 Heatmap Overlays
- [x] Overlay layer: position absolute, inset: 0, pointer-events: none
- [x] Opacity: 0.6
- [x] Border radius: 6px
- [x] Maturity Gap overlay: gradient based on maturity gap value
- [x] Staff Needs overlay: gradient based on staff gap
- [x] IT Tools overlay: gradient based on missing tools count
- [x] Process Docs overlay: gradient based on doc completeness
- [x] Team Health overlay: gradient based on team health score
- [x] Show/hide based on active overlay button

### 2.10 Tooltips
- [x] Tooltip appears on L3 cell hover
- [x] Position: absolute, follows cursor
- [x] Background: rgba(15, 23, 42, 0.98)
- [x] Border: rgba(59, 130, 246, 0.5)
- [x] Border radius: 8px
- [x] Padding: 12px (adjusted to 3)
- [x] Max width: 300px
- [x] Z-index: 1000
- [x] Box shadow: 0 8px 24px rgba(0, 0, 0, 0.4)
- [x] Display L3 name, status, maturity, and overlay-specific data

### 2.11 Mock Data Structure
- [x] Create capability data file: /src/app/data/capabilityData.ts
- [x] L1 structure: { id, name, description, maturity_level, target_maturity_level, l2: [] }
- [x] L2 structure: { id, name, description, maturity_level, target_maturity_level, l3: [] }
- [x] L3 structure: { id, name, status, maturity_level, target_maturity_level, staff_gap, tools_gap, docs_complete, team_health }
- [x] Mock at least 3 L1s, with 2-4 L2s each, with 5-10 L3s each
- [x] Realistic water sector capability names

### 2.12 Responsive Behavior
- [x] Maintain table layout on large screens
- [x] L3 horizontal scroll works smoothly
- [x] Tooltips stay on screen
- [x] Overlay controls wrap on smaller screens
- [x] Minimum width constraints to prevent breaking

### 2.13 Visual Polish
- [x] Smooth hover transitions on all cells
- [x] Glass panel effect on controls
- [x] Consistent typography (match Sector Desk)
- [x] Border colors match theme
- [x] Icons properly sized and colored
- [x] Loading state (optional)

---

## NOTES

- Original repository: https://github.com/mosabsayyed/newinterface
- Reference file: lifecycle.html
- Design system: Dark with blue accents for Enterprise Desk
- Technology: React, Tailwind CSS v4
- Matrix layout: CSS table display (not ECharts)

---

**Last Updated:** 2025-01-07
**Section 1 (Sector Desk):** Complete ✅
**Section 2 (Enterprise Desk):** Complete ✅

---

## 3. ENTERPRISE DESK - REFINEMENTS & ENHANCEMENTS

### 3.1 Visual & Layout Improvements
- [x] Use Sector Desk CSS styling (match colors, fonts, spacing)
- [x] L1 cells should merge/span vertically to equal total height of all L2 children
- [x] L2 and L3 cells must have equal/same height
- [x] Strip `[]` brackets from L1 and L2 ID display
- [x] Remove rounded corners from L3 cells (make square)
- [x] Remove ALL paddings and spacings - cells must be tightly adjacent (no gaps)
- [x] Matrix must resize horizontally to fit entire width (no horizontal scrolling)
- [x] Cells INCLUDING FONT must proportionally shrink to fit width
- [x] Vertical scrolling is OK/allowed
- [x] If horizontal scrolling exists = BUG (must be fixed)

### 3.2 Heatmap Overlays - Sticky Header & Filters
- [x] Add sticky header to overlay controls section
- [x] Header includes overlay title
- [x] Add Year filter: All, 2025, 2026, 2027, 2028, 2029
- [x] Add Quarter filter: All, Q1, Q2, Q3, Q4
- [x] Filters apply to ALL overlays (define which capabilities to show)
- [x] Filtered out cells should be greyed out (not hidden)
- [x] Maintain sticky positioning during scroll

### 3.3 Build vs Execute Mode - Status Logic

**Mode Determination:**
- [x] Add database field to determine Build vs Execute mode (mock for now)
- [x] Each L3 capability has a mode field

**Build Mode** (Capability not yet active - reporting on plan to activate):
- [x] Status: "Not Due" → Greyed out, no color coding
- [x] Status: "Due" → Shows build stage status with colors:
  - [x] Planned → Blue (#3b82f6)
  - [x] In Progress - Ontrack → Emerald green (#10b981)
  - [x] In Progress - At Risk → Orange (#f59e0b)
  - [x] In Progress - Issues → Red (#ef4444)

**Execute Mode** (Capability active and in operations):
- [x] Status: "Ontrack" → Emerald green (#10b981)
- [x] Status: "At Risk" → Orange (#f59e0b)
- [x] Status: "Issues" → Red (#ef4444)

### 3.4 Overlay Selection Enhancement
- [x] Allow user to pick TWO overlays simultaneously
- [x] When two overlays are selected, grey out the other overlay buttons
- [x] Visual indicator showing which two are active
- [x] Clear selection behavior when deselecting

### 3.5 Data Model Updates
- [x] Add `mode` field to L3 capabilities: 'build' | 'execute'
- [x] Add `build_status` field: 'not-due' | 'planned' | 'in-progress-ontrack' | 'in-progress-atrisk' | 'in-progress-issues'
- [x] Add `execute_status` field: 'ontrack' | 'at-risk' | 'issues'
- [x] Add `year` field to L3 capabilities (2025-2029)
- [x] Add `quarter` field to L3 capabilities (Q1-Q4)
- [x] Update mock data with these new fields

### 3.6 Additional Refinements (Round 2)
- [x] L3 cells have equal width distribution (no fixed min/max width)
- [x] Unified color system - ONE color per cell based on status only
- [x] Remove color confusion - cell border color matches status, text is neutral
- [x] Tooltip redesigned to match reference image style (dark theme, sections)
- [x] Year and Quarter filters converted to dropdown selects
- [x] Cascading dimming rules implemented:
  - [x] L1 dimmed → all L2s and L3s under it dim
  - [x] L2 dimmed → all L3s under it dim
- [x] Active/Inactive filter dropdown added

### 3.7 Status Aggregation Formula (Round 3)
- [x] L1 and L2 status now calculated from children (not static)
- [x] All L3 capabilities have equal weight in aggregation
- [x] **L2 Status Formula**: Aggregate from all L3 children
  - [x] If ANY L3 has "issues" → L2 = "issues"
  - [x] Else if >30% have "at-risk" → L2 = "at-risk"
  - [x] Else if >70% have "ontrack" → L2 = "ontrack"
  - [x] Else if any "planned" → L2 = "planned"
  - [x] Else if all "not-due" → L2 = "not-due"
  - [x] Mixed state defaults to "at-risk"
- [x] **L1 Status Formula**: Aggregate from all L3s under all L2s
  - [x] Same formula as L2 (aggregates all grandchildren)
- [x] L1 cells show aggregated status via left border color (3px solid)
- [x] L2 cells show aggregated status via left border color (3px solid)
- [x] L3 cells use direct status (border + background tint)
- [x] **Color Scheme Clarification**: 
  - [x] L3: Border (2px solid statusColor) + Background (statusColor with 20% opacity)
  - [x] L1/L2: Left border only (3px solid aggregatedStatusColor)

### 3.8 Fixed L3 Cell Width (Round 4)
- [x] All L3 cells have the **same absolute width** across entire matrix
- [x] Width calculated based on maximum L3 count across all L2 rows
- [x] Formula: `l3CellWidth = 100% / maxL3Count`
- [x] Rows with fewer L3s will have empty/gap space at the end
- [x] No more percentage-based width per row (was causing unequal widths)

### 3.9 Status Legend (Round 5)
- [x] Added comprehensive status legend above matrix
- [x] Simplified to horizontal layout with 3 core statuses only
- [x] **Core Statuses** (apply to both Build and Execute):
  - [x] Emerald (#10b981): Ontrack
  - [x] Orange (#f59e0b): At Risk
  - [x] Red (#ef4444): Issues
- [x] Removed "Not Due" and "Planned" (shown through year/quarter filters)
- [x] Each status has vertical bar indicator (matching left border styling)
- [x] Dark theme panel with helper text

### 3.10 Unified Cell Styling (Round 6)
- [x] All L1, L2, and L3 cells now have unified dark backgrounds
- [x] Removed status color tinting from L3 cell backgrounds
- [x] **Status indication**: Left border ONLY (3px solid) with status color
- [x] L3 cells: No more full borders - only left border + right separator
- [x] Clean, distraction-free design with focus on content
- [x] Heatmap overlays still functional on top of unified backgrounds

### 3.11 Bug Fixes (Round 7)
- [x] Fixed React key prop warning in EnterpriseDesk component
- [x] Added proper key to L2 row wrapper div (`l2-row-${l2.id}`)
- [x] Removed `alignTicks` from ECharts radar chart configurations
- [x] Fixed ECharts DOM width/height warnings
- [x] All console errors and warnings resolved

### 3.12 Business-Grounded Overlays (Round 8) - ONTOLOGY ALIGNMENT
- [x] **Replaced** old 5 overlays with 6 new business-grounded overlays mapped to actual DB fields
- [x] **New Overlay System**:
  1. **Maturity Gap** → `target_maturity_level - maturity_level`
  2. **Resource Health** → `staff_gap` (people), can extend to process/tools
  3. **Operational Risk** → `tools_gap` (placeholder for EntityRisk integration)
  4. **Project Velocity** → `docs_complete` (placeholder for project progress)
  5. **Strategic Criticality** → `team_health` (placeholder for chain to SectorObjective)
  6. **Change Adoption** → `change_adoption` (new field added to L3Capability)
- [x] Each overlay answers a specific business question (documented in code comments)
- [x] Added `change_adoption` field to L3Capability interface (0-100%)
- [x] Updated all mock data with `change_adoption` values

### 3.13 Header Redesign (Round 8) - STREAMLINED UX
- [x] **Removed status legend** (common knowledge - saves space)
- [x] **Moved filters to title row**: Status, Year, Quarter placed next to page title
- [x] **Compacted overlay buttons**: Reduced padding, tighter layout, proper business names
- [x] **Reserved right-side space** for dynamic insight panel (320px width)
- [x] **Updated overlay labels** to business-grounded names:
  - Resource Health (was "Staff Needs")
  - Operational Risk (was "IT Tools")
  - Project Velocity (was "Process Docs")
  - Strategic Impact (was "Team Health")
  - Adoption Ready (was "Change Adoption")
- [x] **New header structure**:
  - Row 1: Page title + subtitle + Filters (Status, Year, Quarter)
  - Row 2: Overlay buttons (left) + Dynamic Insight Panel (right, 320px reserved)
- [x] Clean, professional layout with maximum horizontal space for insight panel

### 3.14 Dynamic Insight Panel (Round 8) - PENDING IMPLEMENTATION
- [x] **Panel location**: Right side of header (320px reserved space)
- [x] **Content**: Title, Stat, Explanation based on selected overlay(s)
- [x] **No overlay selected**: Shows general capability overview with status breakdown
- [x] **Single overlay**: Shows count of critical capabilities, worst case, actionable insight
- [x] **Double overlay**: Shows "⚠️ DOUBLE JEOPARDY" analysis with combined risk count
- [x] **Auto-updates**: Changes dynamically when overlay selection or filters change
- [x] **Design**: Matching dark theme with compact typography
- [x] **Calculations**: Real-time analysis from capability matrix data
- [x] **Thresholds**: 
  - Maturity Gap: >= 2 levels
  - Resource Health: >= 5 staff gap
  - Operational Risk: >= 3 tools missing
  - Project Velocity: < 50% docs complete
  - Strategic Impact: < 60 team health
  - Adoption Ready: < 50% adoption rate

### 3.15 Green Theme for L1/L2 Borders (Round 8)
- [x] Changed L1 left border from blue (#3b82f6) to green (#10b981)
- [x] Changed L2 left border from blue (#3b82f6) to green (#10b981)
- [x] Changed L1 name text color to green (#10b981)
- [x] Changed L2 name text color to green (#10b981)
- [x] L3 cells maintain dynamic status colors (green/amber/red)
- [x] Consistent green theme across hierarchy for capability names
- [x] **NO BLUE STATUS COLORS** - Only RAG (Red/Amber/Green) + Grey

### 3.16 Universal Delta Formula for Overlay Heatmaps (Round 8) - STANDARD
- [x] **Replaced arbitrary thresholds** with universal delta % formula
- [x] **Standard Formula**: `delta % = ((target - actual) / target) × 100`
- [x] **Universal Thresholds**:
  - Delta < 5% → **GREEN** (ontrack)
  - Delta 5-15% → **AMBER** (at risk)
  - Delta ≥ 15% → **RED** (critical issues)
- [x] **Applied to ALL 6 overlays**:
  1. Maturity Gap: `(target_maturity - maturity) / target_maturity × 100`
  2. Resource Health: `staff_gap / (maturity + staff_gap) × 100`
  3. Operational Risk: `tools_gap / 10 × 100` (baseline 10 tools)
  4. Project Velocity: `(100 - docs_complete)` (target = 100%)
  5. Strategic Impact: `(100 - team_health)` (target = 100)
  6. Change Adoption: `(100 - change_adoption)` (target = 100%)
- [x] **Insight Panel aligned**: Critical = ≥15% delta for all overlays
- [x] **Explanation text** updated to show RAG thresholds in insight panel
- [x] **Fixed change_adoption inversion** bug

### 3.17 White Cell Backgrounds + Balanced Sample Data (Round 9)
- [x] **Changed ALL cell backgrounds to white** for better overlay tint visibility
  - L1 cells: `bg-white`
  - L2 cells: `bg-white`
  - L3 cells: `bg-white`
  - L3 container: `bg-white`
- [x] **Improved sample data balance** to show mix of colors:
  - **GREEN majority** (~60%): Most capabilities performing well
  - **AMBER some** (~25%): Some at-risk items
  - **RED few** (~15%): Critical issues need attention
- [x] **Data targets**:
  - Maturity gaps: 0-2 levels (was 1-4)
  - Staff gaps: 0-4 people (was 5-15)
  - Tools gaps: 0-2 tools (was 3-8)
  - Docs complete: 75-98% (was 30-90%)
  - Team health: 75-96 (was 40-90)
  - Change adoption: 77-97% (was 40-85%)
- [x] **Result**: Overlays now show balanced RAG distribution instead of 90% red

### 3.18 Status Color Messaging Clarity (Round 9) - PENDING USER INPUT
- [ ] **Left Border Status Meaning**: Documented as execution health
  - L3: Direct build/execute status
  - L2: Aggregated from L3 children
  - L1: Aggregated from all grandchildren
- [ ] **Status Legend**: Currently no visual legend on page
- [ ] **Inactive Filter Behavior**: Needs clarification on expected behavior
- [ ] **User Questions**:
  1. Should we add a status legend visual indicator?
  2. What should "inactive" filter actually mean?
  3. Should left border indicate something else (maturity, phase, etc.)?

### 3.19 Build/Execute Filter + Black Text (Round 9)
- [x] **Replaced "Active/Inactive" filter with "Build/Execute" filter**
  - Filter options: All Modes, Build Mode, Execute Mode
  - Filters capabilities by their mode field
  - Clear business meaning: "Build" = capabilities being built, "Execute" = operational capabilities
- [x] **Left border status clarified**:
  - Build Mode: Shows **Building Health** (planned/ontrack/at-risk/issues during build phase)
  - Execute Mode: Shows **Execution Health** (ontrack/at-risk/issues during operations)
- [x] **ALL text in cells changed to BLACK only**:
  - L1 name text: Changed from green (#10b981) to black
  - L2 name text: Changed from green (#10b981) to black
  - L3 name text: Changed from light gray (#e2e8f0) to black
  - L1/L2/L3 maturity numbers: Changed to black
  - Eliminates color confusion - only left border shows status color
  - Clean, professional appearance with status indicated by left border only

---

**Status:** Round 9 - COMPLETE ✅ (White backgrounds + balanced data + Build/Execute filter + black text)
**Last Updated:** 2025-01-07

---

## 4. ENTERPRISE DESK - NEW OVERLAY SYSTEM (Round 10)

### 4.1 Data Model Enhancement
- [x] Added new overlay fields to L3Capability interface:
  - Risk Exposure: expected_delay_days, exposure_percent, exposure_trend
  - External Pressure: policy_tool_count, performance_target_count
  - Footprint Stress: org_gap, process_gap, it_gap
  - Change Saturation: active_projects_count, adoption_load, adoption_load_percent
  - Trend Early Warning: health_history
- [x] Updated sample data with new overlay values for testing

### 4.2 Replace 6 Old Overlays with 5 New Decision Intelligence Overlays
- [/] **Overlay 1: Risk Exposure** (Mode-Aware)
  - [ ] BUILD mode: Shows Expected Delay (days) + Exposure %
  - [ ] EXECUTE mode: Shows Exposure % + Trend marker (▲▼■) + Early warning (!)
  - [ ] Format: "+45d / 63%" (BUILD) or "42% ▼" (EXECUTE)
  - [ ] Mode-aware rendering logic implemented
  
- [/] **Overlay 2: External Pressure** (Context)
  - [ ] Shows: PT: X (policy tools) + KPI: Y (performance targets)
  - [ ] Compact format: "P: 5" (combined) on tile, split on hover
  - [ ] Links capability to sector reality
  
- [/] **Overlay 3: Footprint Stress** (Org/Process/IT Imbalance)
  - [ ] Shows dominant gap letter + severity: "O2", "P3", "T1"
  - [ ] Hover reveals: Org gap %, Process gap %, IT gap %
  - [ ] Detects imbalanced investment patterns
  
- [/] **Overlay 4: Change Saturation** (Delivery Realism)
  - [ ] Shows: "Proj: 4 / Load: Med"
  - [ ] Load bands: Low/Med/High (exact % on hover)
  - [ ] Prevents fantasy roadmaps
  
- [/] **Overlay 5: Trend Early Warning** (Silent Degradation)
  - [ ] EXECUTE mode only
  - [ ] Shows amber "!" badge when: still green BUT 2 consecutive declines
  - [ ] Hover text: "Early warning: 2-cycle decline"
  - [ ] No numbers on tile, flag only

### 4.3 Single Overlay Selection (Simplified UX)
- [x] Changed from TWO overlays simultaneously to ONE overlay at a time
- [x] Simplified toggle logic: click to select, click again to deselect
- [/] Remove array logic and convert to single selection throughout component
- [/] Fix remaining compilation errors from selectedOverlays -> selectedOverlay
- [/] **MODULARIZATION IN PROGRESS** - Breaking 800+ line file into maintainable modules

### 4.3.1 Modular Structure (NEW)
- [x] Create utility modules:
  - [x] `/utils/enterpriseStatusUtils.ts` - Status aggregation, color calculations
  - [x] `/utils/enterpriseOverlayUtils.ts` - Overlay calculations, heatmap colors, overlay content rendering
- [x] Create sub-components:
  - [x] `EnterpriseHeader.tsx` - Title, subtitle, filters  
  - [x] `OverlayControls.tsx` - Overlay button panel
  - [x] `DynamicInsightPanel.tsx` - Right-side insight display
  - [x] `CapabilityMatrix.tsx` - Main matrix grid  
  - [x] `CapabilityTooltip.tsx` - Hover tooltip
- [x] Main `EnterpriseDesk.tsx` - Orchestrates components, manages state (128 lines - clean!)

**MODULARIZATION STATUS:**
✅ Phase 1 COMPLETE: Utility modules extracted (status + overlay logic)  
✅ Phase 2 COMPLETE: Component extraction (all sub-components created)
✅ Phase 3 COMPLETE: Main EnterpriseDesk rewritten as clean orchestrator

**FILE STRUCTURE:**
- `/src/app/utils/enterpriseStatusUtils.ts` (140 lines) - Status logic
- `/src/app/utils/enterpriseOverlayUtils.ts` (120 lines) - Overlay logic
- `/src/app/components/enterprise/EnterpriseHeader.tsx` (60 lines)
- `/src/app/components/enterprise/OverlayControls.tsx` (40 lines)
- `/src/app/components/enterprise/DynamicInsightPanel.tsx` (140 lines)
- `/src/app/components/enterprise/CapabilityTooltip.tsx` (160 lines)
- `/src/app/components/enterprise/CapabilityMatrix.tsx` (150 lines)
- `/src/app/components/EnterpriseDesk.tsx` (128 lines) - **Main orchestrator**

**RESULT:** Replaced 800+ line monolith with 8 clean, focused modules totaling ~1,000 lines (properly organized)

### 4.4 Visual & Overlay Refinements (Round 11)
- [x] **Grey out override**: Dimmed cells now have grey tint overlay (rgba(203,213,225,0.5)) that overrides all other styling
  - [x] L1 cells: Added grey overlay with z-50, wrapped content in z-10 container, changed border to grey when dimmed
  - [x] L2 cells: Added grey overlay with z-50, wrapped content in z-10 container, changed border to grey when dimmed
  - [x] L3 cells: Grey overlay with z-20, hides overlay content when dimmed
  - [x] All cells have `position: relative` for proper overlay positioning
  - [x] Consistent grey out behavior across all cell types
- [x] **Cell height increased**: Changed from 60px to 80px to accommodate overlay content text
- [x] **External Pressure logic updated**:
  - [x] Build mode: Shows "Policy Tools" in tooltip (min 1)
  - [x] Execute mode: Shows "Performance Targets" in tooltip (min 1)
  - [x] Removed "P:x" from cell display (tooltip only)
  - [x] Background color: GREEN or RED only (no amber)
  - [x] RED if: High pressure (3+) + low maturity (BUILD) OR High pressure (3+) + declining health (EXECUTE)
  - [x] GREEN otherwise

---

**Status:** Round 10 - IN PROGRESS [/] (Data model complete, button definitions updated, refactoring selectedOverlay logic)
**Started:** 2025-01-09
**Blockers:** Need to complete conversion from selectedOverlays (array) to selectedOverlay (single value) throughout component

---

## 5. CONTROLS DESK - SANKEY DIAGRAMS (Round 12)

### 5.1 Navigation & Header
- [x] Added "Controls Desk" menu item to LeftNavigation (GitFork icon)
- [x] Positioned before Planning Desk in EXECUTIVE section
- [x] Created ControlsDesk component with header
- [x] Header title: "Control Signals"
- [x] Subtitle: "System integration — is intent flowing end-to-end?"

### 5.2 Sankey Chart System
- [x] Four chart types with selection buttons:
  - [x] 1. Steering Signals
  - [x] 2. Risk Signals (with BUILD/OPERATE toggle)
  - [x] 3. Delivery Signals
  - [x] 4. Integrity Signals
- [x] Using recharts Sankey component
- [x] Responsive container (600px height)
- [x] Dark theme styling matching Enterprise Desk

### 5.3 Sankey 1 - Steering Signals
- [x] Purpose: Shows where governance pressure concentrates from Policy/Performance into Capabilities
- [x] **Columns (fixed)**:
  - Column 1: SectorObjective (L2) - 5 objectives
  - Column 2: SectorPolicyTool (L2) + SectorPerformance (L2) - 8 each (top 8)
  - Column 3: EntityCapability (L2) - 8 capabilities + "Other"
- [x] **Link definitions** (normalized 0-100):
  - Objective → PolicyTool: weight = 1 per relationship
  - Objective → Performance: weight = 1 per relationship
  - PolicyTool → Capability: weight = 1 per SETS_PRIORITIES
  - Performance → Capability: weight = 1 per SETS_TARGETS
- [x] **Node colors**: Based on exposure % (Green <35, Amber 35-65, Red >65)
- [x] **Flags implemented**:
  - [x] Overloaded capability: P90+ inflow OR ≥8 raw
  - [x] Under-instrumented objective: <2 outgoing links

### 5.4 Sankey 2 - Risk Signals
- [x] Purpose: Shows which PolicyTools or KPIs are threatened by BUILD or OPERATE risk
- [x] **Mode toggle**: BUILD mode / OPERATE mode (buttons)
- [x] **Columns (fixed)**:
  - Column 1: EntityCapability (L2) - 6 capabilities
  - Column 2: EntityRisk (L2) - 6 risks
  - Column 3: SectorPolicyTool (L2) in BUILD / SectorPerformance (L2) in OPERATE
- [x] **Link definitions**:
  - Capability → Risk: weight = exposure % (build_exposure_pct or operate_exposure_pct_effective)
  - Risk → PolicyTool/Performance: same exposure %, thin/gray if inactive
- [x] **Node colors**: Based on exposure %
- [x] **Flags implemented**:
  - [x] Broken governance link: exposure ≥50% but inactive OR missing target
  - [x] Risk concentration: PolicyTool/KPI receives ≥3 risks over 50%

### 5.5 Sankey 3 - Delivery Signals
- [x] Purpose: Shows build demand feasibility - where load accumulates across Org/Process/IT → Projects → Adoption
- [x] **Columns (fixed)**:
  - Column 1: EntityCapability (L2) - 4 capabilities
  - Column 2: Footprint (3 lanes): EntityOrgUnit, EntityProcess, EntityITSystem
  - Column 3: EntityProject (L3) - 4 projects
  - Column 4: EntityChangeAdoption (L3) - 3 adoption nodes
- [x] **Link thickness**:
  - Capability → Footprint: weight = 1 per gap relationship
  - Footprint → Project: Active=3, Planned=1, Closed=0
  - Project → Adoption: weight = 1 per relationship (3 if high adoption)
- [x] **Node colors**:
  - Projects: by schedule lateness (0, <35, 35-65, >65)
  - Adoption: by resistance/risk
  - Capability: by BUILD exposure
- [x] **Flags implemented**:
  - [x] Saturation: capability has ≥5 active projects OR ≥10 total
  - [x] Adoption bottleneck: adoption nodes <1 while projects ≥3
  - [x] Skewed footprint: 60% flow through one lane

### 5.6 Sankey 4 - Integrity Signals
- [x] Purpose: Shows where intent or control "dies" by measuring leakage at each node
- [x] **Leakage definition**:
  - inflow = sum(incoming link weights)
  - outflow = sum(outgoing link weights)
  - leakage = max(0, inflow - outflow)
  - leakage_pct = leakage / inflow
- [x] **Display**: Leakage flows to dummy "Leak" node (side outlet)
- [x] **Node colors**: By leakage_pct (Green <10%, Amber 10-25%, Red >25%)
- [x] **Flags implemented**:
  - [x] Broken chain: leakage_pct >25% at non-terminal node
  - [x] Sink capability: high inflow, low outflow (high leakage)

### 5.7 Mock Data & Interactivity
- [x] Fixed dummy numbers for UI mockups:
  - 5 objectives, 8 policy tools, 8 KPIs
  - 12 capabilities, 12 risks
  - 10 projects, 6 adoption nodes
  - 6 org/process/IT nodes per lane
- [x] Fabricated weights demonstrating:
  - [x] 1 overloaded capability
  - [x] 1 broken governance link
  - [x] 1 adoption bottleneck
  - [x] 1 high leakage sink
- [x] Tooltip on hover (shows node/link details)
- [x] Flags displayed below each chart
- [x] Click to switch between charts

### 5.8 Visual Design
- [x] Color legend at bottom (Green/Amber/Red/Gray)
- [x] Chart selection buttons (active state highlighting)
- [x] Dark theme background (#020617)
- [x] Panel styling matching Enterprise Desk
- [x] Alert/flag cards with icons (AlertTriangle, AlertCircle)
- [x] Severity-based coloring (error: red, warning: amber)

### 5.9 Enterprise Desk Renamed
- [x] Changed header from "Engine Room - Capability Matrix" to:
  - [x] Title: "Capability Controls Matrix"
  - [x] Subtitle: "Directional alignment — are we intervening in the right places?"

---

**Status:** Round 12 - COMPLETE ✅ (Controls Desk with 4 Sankey diagrams, Enterprise Desk renamed)
**Completed:** 2025-01-09

---

## 6. PLANNING DESK (Round 13)

### 6.1 Navigation & Header
- [x] Planning Desk accessible from left navigation
- [x] Three distinct modes with selection buttons
- [x] Mode descriptions to prevent confusion

### 6.2 A) Intervention Planning (In-Year)
- [x] **1. Context Header (locked, non-editable)**
  - [x] Orange border (warning color) to indicate locked state
  - [x] Capability display: "Plant Operations" with L2→L3 expandable note
  - [x] Mode badge: BUILD (red background)
  - [x] Trigger section with visual indicators:
    - [x] Red dot: Risk exposure 68% (BUILD)
    - [x] Orange dot: Saturation: 5 active projects
    - [x] Source: Control Signals → Delivery Signals

- [x] **2. Constraint Canvas (vertical stack)**
  - [x] Three blocks showing limits (not editable):
    - [x] **Capability State** (green header)
      - [x] Maturity: 3/5
      - [x] Trend: ↓ declining (red with icon)
      - [x] Allowed load: 3 projects
      - [x] Current load: 5 ⚠️ (red with warning icon)
    - [x] **Footprint Stress** (amber header)
      - [x] Org gap: Medium (amber badge)
      - [x] Process gap: High (red badge)
      - [x] IT gap: Low (green badge)
    - [x] **Risk Constraints** (red header)
      - [x] Risk: Delay – Desalination (Red)
      - [x] Affects: Policy Tool PT-01
      - [x] Tolerance remaining: 18 days

- [x] **3. Intervention Builder (right panel)**
  - [x] Five intervention types with icons:
    - [x] Add Project (Plus icon)
    - [x] Pause Project (Pause icon)
    - [x] Resequence (ArrowUpDown icon)
    - [x] Adjust Adoption (Users icon)
    - [x] Escalate Policy/Target (Zap icon)
  - [x] Intervention cards with:
    - [x] Type display
    - [x] Impact preview metrics:
      - [x] Load impact (±1)
      - [x] Risk exposure impact (-12%)
      - [x] Delivery delay impact (-8 days)
      - [x] Confidence level (High/Medium/Low)
    - [x] Remove button
  - [x] **Resulting State Preview** (green border)
    - [x] New exposure band
    - [x] New load (calculated)
    - [x] Residual risk

### 6.3 B) Strategic Reset Planning (Annual)
- [x] **1. Year-End Reality Snapshot (top)**
  - [x] Four tiles in grid:
    - [x] Capabilities Stabilized: 22/45 (green, 49% rate)
    - [x] Chronic Risks: 6 (red, persistent)
    - [x] Persistent Leakage Chains: 3 (amber, >25% loss)
    - [x] Overbuilt Capabilities: 4 (blue, low utilization)

- [x] **2. Pattern Explorer (center matrix)**
  - [x] Table layout (not Sankey)
  - [x] Rows: Capabilities (6 shown)
  - [x] Columns:
    - [x] Avg Risk Exposure (color-coded)
    - [x] Avg Leakage % (color-coded)
    - [x] Avg Load Utilization (color-coded)
    - [x] Policy Pressure Count
    - [x] Performance Pressure Count
  - [x] Color bands: Green <35, Amber 35-65, Red >65

- [x] **3. Direction Reset Panel (4 sections)**
  - [x] **Adjust Objectives** (green border)
    - [x] Merge redundant objectives
    - [x] Drop low-impact objectives
    - [x] Elevate critical objectives
  - [x] **Adjust Policy Tool Mix** (amber border)
    - [x] Add new policy tools
    - [x] Retire ineffective tools
    - [x] Rebalance tool portfolio
  - [x] **Adjust Performance Targets** (blue border)
    - [x] Tighten ambitious targets
    - [x] Relax unrealistic targets
    - [x] Realign target timelines
  - [x] **Set Capability Intent** (red border)
    - [x] Radio buttons for: BUILD / OPERATE / HOLD / DECOMMISSION

### 6.4 C) Scenario Simulation (What-If)
- [x] **1. Scenario Controls (left)**
  - [x] Change Objective priority (dropdown)
  - [x] Add/Remove Policy Tool (dropdown)
  - [x] Shift Capability maturity (dropdown)
  - [x] Inject constraint (dropdown): Budget cut, Delay, Regulation

- [x] **2. Impact Diff View (center split)**
  - [x] Two-column comparison:
    - [x] Current State (left)
    - [x] Scenario State (right, green header)
  - [x] Metrics with delta arrows:
    - [x] Risk Exposure
    - [x] Load Saturation
    - [x] Leakage %
    - [x] Capabilities Entering Red
  - [x] Green/Red trend arrows (↑ ↓)

- [x] **3. Verdict Panel (right)**
  - [x] New Critical Capabilities (list)
  - [x] New Broken Chains (with leakage %)
  - [x] Execution Feasibility: YES/NO indicator
  - [x] **Recommendation** (green border):
    - [x] Badge: VIABLE / HIGH RISK / NON-EXECUTABLE
    - [x] Explanatory text
  - [x] Footer note: "No approve button. Scenarios inform, they don't decide."

---

## 7. REPORTING DESK (Round 13)

### 7.1 Navigation & Header
- [x] Reporting Desk accessible from left navigation
- [x] Two view types with selection buttons
- [x] View descriptions

### 7.2 A) Control Outcomes (Primary Report)
- [x] **1. Decision Timeline (top)**
  - [x] Horizontal timeline with 3 nodes:
    - [x] **Intervention Decision** (green, CheckCircle icon)
      - [x] Date: 2025-12-15
      - [x] Action: Pause Project X
    - [x] **Execution Window** (amber, Clock icon)
      - [x] Date: Q1 2026
      - [x] Duration: 45 days
    - [x] **Measurement Point** (blue, BarChart3 icon)
      - [x] Date: 2026-03-31
      - [x] Label: Q1 Close
  - [x] Visual timeline bar connecting nodes

- [x] **2. Before/After Comparison (center)**
  - [x] Capability header: "Plant Operations"
  - [x] Two-column split (BEFORE | AFTER)
  - [x] **BEFORE column** (Dec 2025):
    - [x] Risk Exposure: 62% (RED badge)
    - [x] Leakage: 30% (BROKEN badge)
    - [x] Load: 5 projects (with alert icon)
    - [x] Mode: BUILD (blue badge)
  - [x] **AFTER column** (Mar 2026, green borders):
    - [x] Risk Exposure: 38% (AMBER badge, -24% delta)
    - [x] Leakage: 12% (HEALTHY badge, -18% delta)
    - [x] Load: 3 projects (with check icon, -2 delta)
    - [x] Mode: OPERATE (green badge)
  - [x] Success indicator at bottom:
    - [x] "Did the intervention work? YES"
    - [x] Green background with CheckCircle icon

- [x] **3. Residuals & Escalations (bottom, 3 cards)**
  - [x] **Remaining Risks** (amber card)
    - [x] Delay risk: 38% (acceptable)
    - [x] Process gap: Medium (monitoring required)
  - [x] **Structural Issues** (red card)
    - [x] Distribution capability overloaded
    - [x] Policy Tool PT-03 underperforming
  - [x] **Escalation Required?** (red border card)
    - [x] YES/NO indicator
    - [x] Explanation text
    - [x] Footer: "Feeds back to Control Signals"

### 7.3 B) Standard Reports (Byproduct Views)
- [x] **Report Builder (left panel)**
  - [x] **Select Report Type** (4 options with icons):
    - [x] Performance (BarChart3)
    - [x] Risk (Shield)
    - [x] Portfolio (Building)
    - [x] Ministerial Brief (FileText)
  - [x] **Time Window** dropdown:
    - [x] Q4 2025, Q1 2026, H1 2026, FY 2026
  - [x] **Scope** filters:
    - [x] Sector dropdown
    - [x] Entity dropdown
    - [x] Capability dropdown

- [x] **Live Preview (center panel)**
  - [x] Export PDF button
  - [x] Generate button (green)
  - [x] **Report Header**:
    - [x] Dynamic title based on type
    - [x] Period and generation date
    - [x] DRAFT badge (green)
  - [x] **Executive Summary** (auto-generated text)
  - [x] **Key Metrics Table**:
    - [x] 5 metrics with Current/Target/Status columns
    - [x] Status dots (green/amber/red)
  - [x] **Analysis Narrative** (agent-written):
    - [x] Performance Trend paragraph
    - [x] Areas of Concern paragraph
    - [x] Recommendations paragraph
    - [x] Dark background, light text

- [x] **Evidence & Audit Panel (right panel)**
  - [x] **Data Sources** section:
    - [x] List of 5 data sources with checkmarks
    - [x] Record counts
  - [x] **Last Updated** section:
    - [x] 4 data types with dates
    - [x] Color-coded by freshness (green recent, amber older)
  - [x] **Confidence Level** section:
    - [x] Overall confidence percentage: 87%
    - [x] Progress bar visualization
    - [x] Explanation text
  - [x] **Missing Inputs** section (red border):
    - [x] List with AlertCircle icons
    - [x] 3 capabilities missing maturity
    - [x] 2 projects without adoption data
  - [x] Footer note: "All data linked to graph nodes"

---

**Status:** Round 13 - COMPLETE ✅ (Planning Desk and Reporting Desk fully implemented)
**Completed:** 2025-01-09