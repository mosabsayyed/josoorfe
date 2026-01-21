# Frontend Feature Requirements
> Created: 2026-01-18T17:05:19+04:00  
> Last Updated: 2026-01-18T18:27:54+04:00

---

## Feature 1: KSA Interactive Map with Asset Pins & Heatmap Overlays

**Priority:** HIGH  
**Status:** Data Ready

### Overview
Interactive map of Kingdom of Saudi Arabia displaying ~72 strategic national assets as clickable pins, with toggleable heatmap overlays for regional metrics.

### Data Sources (Available in `/docs/final mapping/`)

| File | Content | Records |
|------|---------|---------|
| `saudi_assets.csv` | Strategic asset locations with coordinates | 72 assets |
| `heatmap.csv` | Regional heatmap data by 13 regions | 5 metrics |
| `hospitals.json` | Hospital geolocation data | 1.2MB |
| `mobily.png`, `stc.png`, `zain.png` | Telecom coverage overlays | 3 images |

### Asset Categories (from `saudi_assets.csv`)
- **Industrial Cities:** Jubail, Yanbu, Ras Al-Khair, SPARK, Sudair (~15 assets)
- **Giga Projects:** NEOM (The Line), Qiddiya, Diriyah, Red Sea Global, Amaala, THE RIG (~12 assets)
- **Utilities:** Desalination plants, power plants, water transmission (~20 assets)
- **Mining:** Phosphate, copper, gold, bauxite sites (~10 assets)
- **Logistics:** Special zones, ports, logistics parks (~8 assets)
- **Energy (Renewable):** Solar PV projects (~4 assets)
- **Infrastructure:** Metro, rail, airports (~5 assets)

### Heatmap Layers (from `heatmap.csv`)

| Layer | Field Name | Description |
|-------|------------|-------------|
| 1 | `Heatmap1_Healthcare_Hospitals` | Hospital count by region (10-109 range) |
| 2 | `Heatmap2_Education_StudentPct` | % of national students (1.3%-24%) |
| 3 | `Heatmap3_Project_Intensity` | Active mega-project count (0-12) |
| 4 | `Heatmap4_Food_Security_Hub` | Binary food security hub (0/100) |
| 5 | `Heatmap5_Digital_Connectivity` | Connectivity score (85-100) |

**Additional Overlay Images:**
- `mobily.png` — Mobily network coverage heatmap
- `stc.png` — STC network coverage heatmap
- `zain.png` — Zain network coverage heatmap

### UI Requirements
1. **Map Base:** Interactive KSA map (consider Leaflet.js or Mapbox)
2. **Asset Pins:** Clickable markers with category-based icons, color-coded by status (Existing/Under Construction/Planned)
3. **Pin Popup:** Display asset name, category, status, description, capacity
4. **Heatmap Toggle:** Layer switcher panel to enable/disable each heatmap overlay
5. **Telecom Overlay Toggle:** Separate controls for carrier coverage images
6. **Region Click:** Click region to see aggregated stats panel
7. **Search/Filter:** Filter assets by category, status, or region

### Technical Notes
- Reference `map.py` for Python visualization approach (uses geopandas, matplotlib)
- Consider pre-generating heatmap tiles or using choropleth coloring on region polygons
- Hospital data in `hospitals.json` may need coordinate extraction

---

## Feature 2: Capability Matrix Bug Fixes

**Priority:** HIGH  
**Status:** Bug Fixes Required

### Known Issues
1. **Year Rendering Bug:** Matrix visualization breaks when displaying all years simultaneously
2. **Overlay Calculation Bug:** Overlay values not computed correctly when multiple layers overlap

### Required Fixes
- Debug year axis scaling/rendering logic
- Recalculate overlay compositing algorithm
- Test with edge cases (empty cells, all years selected, single vs multi-layer)

---

## Feature 3: Control Signals & Graph Explorer Separation

**Priority:** MEDIUM  
**Status:** Architecture Change

### Current State
Graph Explorer contains both graph visualization AND data retrieval functionality.

### Target State

| Component | Purpose | Features |
|-----------|---------|----------|
| **Control Signals** | Graph visualization | Force-directed graphs, node inspection, relationship exploration |
| **Graph Explorer** | Data retrieval | Select, filter, search, retrieve records from Neo4j |

### Graph Explorer UX Requirements
- **Human-usable** interface for traversing database
- Intuitive node/relationship filtering
- Clear navigation breadcrumbs
- Export/save query results
- Focus on data discovery, not visualization

---

## Feature 4: GenAI "Explain" Buttons (Global Feature)

**Priority:** HIGH  
**Status:** New Feature

### Overview
Strategic placement of AI explanation buttons throughout the application to help users understand data blocks.

### Requirements
- **NOT random placement** — carefully injected at meaningful data visualization points
- Each button triggers LLM call to explain the associated data context
- Response displayed in modal or side panel
- Loading state while AI processes

### Candidate Placements
- Complex charts/graphs
- Data tables with aggregated metrics
- Capability matrix cells
- Map region summaries
- Timeline/roadmap milestones

---

## Feature 5: Planning Lab (CRITICAL PRIORITY)

**Priority:** CRITICAL  
**Status:** Mock → Working Version

### Overview
**First thing users will look at.** Experience must be "magical."

### Core Concept
> "The more they do → the more data feeds the system → the more the structure builds up report components"

### UX Goals
1. **Visualize Delivery Impact:** Show users how their actions generate data
2. **Feedback Loop:** Real-time demonstration of data flowing into system intelligence
3. **Report Building:** Show how structured data assembles into reports
4. **Progress Tracking:** Gamified/visual progress indicators

### Must Have
- **Working version, NOT mock screen**
- Real data integration
- Interactive elements that demonstrate the feedback loop
- Clear calls-to-action for what users should "do next"

---

## Feature 6: Tutorials Look & Feel Improvements

**Priority:** MEDIUM  
**Status:** Polish Required

### Requirements
- Visual polish needed — current look unsatisfactory
- Improve overall aesthetics and UX
- Modern, engaging design language

---

## Feature 7: Chat Attachments & LiteLLM Migration

**Priority:** HIGH  
**Status:** Testing Required

### Chat Attachments
- Test file attachment functionality
- Verify upload, processing, and context injection
- Support common file types (PDF, images, CSV)

### LiteLLM Migration
- Backend moving to LiteLLM
- Prompt testing required
- Verify compatibility with existing chat flow
- Test multi-provider routing

---

## Feature 8: Roadmap Page

**Priority:** MEDIUM  
**Status:** Implementation Required

### Requirements
- Merge two previous sections into one cohesive view
- Timeline/milestone visualization
- Interactive progress tracking

---

## Feature 9: Merge Monitoring & Observability

**Priority:** LOW  
**Status:** UI Consolidation

### Requirements
- Merge Monitoring and Observability into single unified view
- Reduce navigation complexity
- Single dashboard for all system health metrics

---

## Feature 10: Landing Page Refresh

**Priority:** MEDIUM  
**Status:** Content Update Required

### Requirements
- **Real screenshots** from the live application (not placeholders)
- **Story/messaging overhaul** — fix narrative flow
- Compelling value proposition
- Clear call-to-action

---

## Feature 11: Production Login (LinkedIn + Gov-Ready)

**Priority:** HIGH  
**Status:** Implementation Required

### Requirements
- **LinkedIn OAuth** — primary auth for government audience
- Move beyond Gmail-only authentication
- Enterprise/government authentication compliance
- SSO readiness for future integrations

### Target Audience
- Government officials
- Enterprise users
- Professional network (LinkedIn profile data)
