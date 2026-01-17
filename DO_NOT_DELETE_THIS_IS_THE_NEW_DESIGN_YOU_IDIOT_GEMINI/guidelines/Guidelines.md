# Water Sector Command Center - AI Assistant Guidelines

## 🚨 CRITICAL: READ THIS FILE FIRST BEFORE ANY CHANGES

This file is your SINGLE SOURCE OF TRUTH. Always read this entire file before making any code changes.

---

## 📋 OPERATING MODEL (HOW YOU MUST WORK)

### Before Making ANY Changes:
1. **READ REQUIREMENTS_TRACKER.md FIRST** - Find the next task to work on
2. **READ** the existing code first using `read` or `file_search`
3. **SEARCH** for existing implementations - don't assume or invent
4. **VERIFY** against TRUTHS below - ensure you won't break critical functionality
5. **THINK** through the change using the `think` tool
6. **IMPLEMENT** using `fast_apply_tool` (or `edit_tool` as fallback)
7. **UPDATE REQUIREMENTS_TRACKER.md** - Mark status as "Work Done" (e.g., `[x]`)
8. **NEVER** rewrite entire files unless absolutely necessary

### After Completing Work:
1. Update REQUIREMENTS_TRACKER.md with status: **Work Done** `[x]`
2. Wait for user approval
3. Once user approves, status remains **Work Approved** `[x]`

### Requirements Tracker Status Legend:
- `[x]` - Work Done / Work Approved
- `[/]` - Partial / In Progress
- `[ ]` - Pending / Not Started

### When User Says "add to mem":
- The LAST thing we agreed upon should be added to this Guidelines.md file
- Update the relevant section (TRUTHS, Component Behavior, etc.)
- This creates a permanent record to prevent future mistakes

### Search Before You Invent:
- If user asks about existing functionality, USE `file_search` to find it
- NEVER create new implementations of features that already exist
- If you can't find it after searching, ASK the user for clarification

---

## 🛡️ TRUTHS (NEVER BREAK THESE)

### 1. Enhanced Plant Details Panel
- **Location**: Right-side panel that appears when clicking a plant
- **Sections**: Header with plant name/status, Capacity, Distribution by Sector (with bar chart), Performance Metrics, Infrastructure Details
- **Must preserve**: All sections, data calculations, styling, animations
- **File**: `/src/app/components/SaudiMap.tsx` (lines ~544-700+)

### 2. SVG Coordinate System Calibration
- **Two coordinate systems exist**:
  - `geoToPercent()`: For map outline - uses UNSCALED coordinates
  - `geoToPercentMap()`: For plants/assets - uses SCALED coordinates (+20% from center)
- **Why**: Map outline and plant positions require different scaling
- **Never**: Merge these functions or change the scaling factors without explicit request
- **File**: `/src/app/components/SaudiMap.tsx` (lines ~50-77)

### 3. Map Outline Overlay
- **Implementation**: SVG path generated from GeoJSON data
- **Uses**: `geoToPercent()` function (unscaled)
- **Styling**: Semi-transparent stroke, no fill, dashed pattern
- **File**: `/src/app/components/SaudiMap.tsx` (lines ~79-97, rendered ~250-260)

### 4. Zoom Functionality
- **States**: `isZoomedIn` (boolean), `zoomedPlantId` (string | null)
- **Triggers**: Clicking any plant
- **Zoom out**: "RETURN TO KINGDOM VIEW" button appears at top
- **Effects**: Shows supporting assets around zoomed plant, changes legend content
- **File**: `/src/app/components/SaudiMap.tsx` (lines ~102-103, 140-150)

### 5. Supporting Assets System
- **Appears**: Only when zoomed into a plant
- **Generation**: 6 assets arranged in circle around zoomed plant
- **Types**: Urban Zone, Distribution Center, Control Station, Treatment Facility, Pump Station, Monitoring Hub
- **Icons**: `buildingsIcon`, `cityIcon`, `chipIcon` (alternating pattern)
- **Function**: `generateSupportingAssets()` at lines ~110-138
- **Render**: Lines ~395-433

### 6. Map Size Calibration
- **Container**: Entire map scaled down by 25% using CSS `transform: scale(0.75)`
- **Location**: Applied to the main SVG container
- **Purpose**: Makes map fit better in the dashboard layout
- **File**: `/src/app/components/SaudiMap.tsx` (line ~240)

### 7. Gradient Map Styling
- **Background**: Radial gradient from dark blue center to darker edges
- **Purpose**: Creates depth and focus on Saudi Arabia region
- **Colors**: `#0a1628` (center) to `#020617` (edges)
- **File**: `/src/app/components/SaudiMap.tsx` (background styling)

### 8. Animated Pipeline Flows
- **Implementation**: Native SVG with SMIL animations (`<animateMotion>`)
- **Flow**: From coastal desalination plants → toward Riyadh (inland)
- **Quality**: ECharts-level smoothness and visual polish
- **Arrows**: Small SVG triangles that follow curved paths
- **Styling**: Emerald green (#10b981), smooth Bezier curves
- **File**: `/src/app/components/SaudiMap.tsx` (lines ~270-350+)

---

## 🎯 COMPONENT BEHAVIOR

### Legend System
- **Location**: Bottom-right corner of map
- **Dynamic behavior**: Content COMPLETELY SWITCHES based on zoom state
- **Normal view** (not zoomed):
  - Shows "Plants" section: Operational, Planned, At Risk
  - Shows "Pipeline Flows" section: Active
- **Zoomed view** (zoomed in):
  - REPLACES content with "Supporting Assets" section only
  - Lists all 6 asset types with icons
- **File**: `/src/app/components/SaudiMap.tsx` (lines ~478-542)

### KPI Gauge Cards (Hierarchical Numbering)
- **L1 Cards** (Top level): Use YEARLY labels
  - Previous period: `Y-1`
  - Next period: `Y+1`
- **L2 Cards** (Sub-level): Use QUARTERLY labels
  - Previous period: `Q-1`
  - Next period: `Q+1`
- **Structure**: L1 cards can expand to show nested L2 cards
- **File**: `/src/app/components/DashboardSidebar.tsx`, `/src/app/components/GaugeCard.tsx`

### Plant Click Behavior
1. User clicks plant marker
2. Sets `selectedPlant` state → shows details panel on right
3. If not already zoomed: Sets `isZoomedIn = true`, `zoomedPlantId = plant.id`
4. Map zooms, supporting assets appear around clicked plant
5. Legend switches to show "Supporting Assets"
6. "RETURN TO KINGDOM VIEW" button appears at top

---

## 🗂️ DATA STRUCTURES

### Plant Data (`ksaData.ts`)
```typescript
{
  id: string,
  name: string,
  coords: [longitude, latitude],
  status: 'operational' | 'planned' | 'at-risk',
  capacity: number,
  type: 'desalination' | 'treatment' | 'distribution',
  sectors: {
    agriculture: number,
    industry: number,
    urban: number
  },
  performance: {
    efficiency: number,
    uptime: number,
    waterQuality: number
  }
}
```

### Supporting Assets (Generated Dynamically)
```typescript
{
  x: number,          // SVG coordinate
  y: number,          // SVG coordinate  
  icon: string,       // Image src path
  name: string        // Display name
}
```

---

## 🎨 DESIGN SYSTEM

### Color Palette
- **Background**: `#020617` (slate-950)
- **Cards/Panels**: `rgba(15, 23, 42, 0.95)` (slate-900 with transparency)
- **Primary Accent**: `#10b981` (emerald-500) - operational, active
- **Warning/Risk**: `#ef4444` (red-500) - at-risk plants
- **Planned**: `#3b82f6` (blue-500) - future plants
- **Text Primary**: `#e2e8f0` (slate-200)
- **Text Secondary**: `#cbd5e1` (slate-300)
- **Text Muted**: `#64748b` (slate-500)
- **Borders**: `rgba(148, 163, 184, 0.3)` (slate-400 with transparency)

### Typography
- **Headings**: Bold, 10-12px
- **Body**: Regular, 9px
- **Labels**: 8px uppercase with letter-spacing
- **Font**: System sans-serif

### Spacing
- **Card padding**: 12-16px
- **Gap between elements**: 8-12px
- **Border radius**: 4-6px for cards, 2-3px for small elements

---

## 📦 TECHNOLOGY STACK

### Required Packages
- `react` - UI framework
- `echarts` - Charts for dashboard sidebar (radar charts)
- `echarts-for-react` - React wrapper for ECharts
- `lucide-react` - Icons throughout the app
- `tailwindcss` - Utility-first styling (v4)

### Architecture Decisions
- **SVG over ECharts for map**: Better control over animations, coordinate systems, and custom interactions
- **Native SVG animations**: SMIL `<animateMotion>` for pipeline flows - no JavaScript animation libraries needed
- **Coordinate transformation**: Two separate functions because map outline and plant positions scale differently
- **State management**: React useState hooks, no external state library needed

---

## 📁 FILE STRUCTURE

```
/src/app/
├── App.tsx                          # Main application wrapper
├── components/
│   ├── LeftNavigation.tsx          # Left sidebar navigation menu
│   ├── DashboardSidebar.tsx        # Right sidebar with tabs and charts
│   ├── GaugeCard.tsx               # Individual KPI gauge component
│   └── SaudiMap.tsx                # ⭐ MAIN MAP COMPONENT (most complexity here)
├── data/
│   └── ksaData.ts                  # Plant data, GeoJSON, mock data
└── styles/
    ├── theme.css                   # CSS variables and tokens
    └── fonts.css                   # Font imports only
```

---

## 🔧 COMMON TASKS

### Adding a New Plant
1. Edit `/src/app/data/ksaData.ts`
2. Add object to `plants` array with all required fields
3. Ensure coordinates are [longitude, latitude] for Saudi Arabia region
4. Plant will automatically appear on map and in interactions

### Modifying Legend
1. Find legend code in `/src/app/components/SaudiMap.tsx` (lines ~478-542)
2. Two separate blocks: `!isZoomedIn` (normal) and zoomed view
3. Keep both in sync with actual plant types and asset types

### Changing Colors
1. Check `/src/styles/theme.css` for CSS variables first
2. For map-specific colors, edit inline styles in `/src/app/components/SaudiMap.tsx`
3. Maintain consistency: emerald for active, red for warnings, blue for planned

---

## ⚠️ COMMON MISTAKES TO AVOID

1. **DON'T** merge `geoToPercent()` and `geoToPercentMap()` - they serve different purposes
2. **DON'T** remove any sections from the plant details panel - users rely on all data
3. **DON'T** change zoom behavior without understanding the state cascade
4. **DON'T** rewrite the legend from scratch - it has specific behavior
5. **DON'T** modify supporting assets generation - angles and distances are calibrated
6. **DON'T** remove the CSS transform scale - it's needed for layout fitting
7. **DON'T** assume features don't exist - SEARCH first, then ask

---

## 🎯 WHEN USER SAYS "add to mem"

**STOP** and update this file with the last thing we agreed upon:
1. Identify which section the new information belongs to
2. Add it under the appropriate heading
3. Use clear, specific language
4. Include file paths and line numbers if applicable
5. Make it easy for future-you to understand without context

**Example**: If we just agreed that the legend should ADD supporting assets instead of replacing content:
- Update "Legend System" section under "🎯 COMPONENT BEHAVIOR"
- Specify exact behavior: "Shows both Plants + Pipeline Flows AND Supporting Assets when zoomed"
- Reference the code location

---

## 📝 MEMORY LOG (Recent Agreements)

<!-- User will tell you to "add to mem" and you'll append here -->

### 2025-01-07
- Established this Guidelines.md as single source of truth
- Defined "add to mem" convention for capturing decisions

---

**Remember: This file is your memory. Trust it more than assumptions. Read it first, always.** 🧠✨