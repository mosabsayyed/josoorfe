# Enterprise Desk Overlay Specification

> **Purpose:** Complete specification for all overlay calculations and data enrichment for Enterprise Desk capability matrix
> **Status:** IN PROGRESS - Documenting overlay logic before implementation
> **Created:** January 17, 2026
> **Last Updated:** January 17, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Data Architecture](#data-architecture)
3. [Overlay 1: Risk Exposure](#overlay-1-risk-exposure)
4. [Overlay 2: External Pressure](#overlay-2-external-pressure)
5. [Overlay 3: Footprint Stress](#overlay-3-footprint-stress)
6. [Overlay 4: Change Saturation](#overlay-4-change-saturation)
7. [Overlay 5: Trend Warning](#overlay-5-trend-warning)
8. [Implementation Strategy](#implementation-strategy)
9. [Backend Changes Required](#backend-changes-required)

---

## Overview

The Enterprise Desk displays a capability matrix with 5 overlay types that reveal different strategic risks and pressure points:

| Overlay | Purpose | Data Source | Color Logic |
|---------|---------|-------------|-------------|
| **Risk Exposure** | Delivery delays (BUILD) / Operational health (EXECUTE) | EntityRisk | Green <5%, Amber 5-15%, Red ≥15% |
| **External Pressure** | Policy/Performance mandate overload | Chains to PolicyTool/Performance | Binary: Red (urgent) / Green (manageable) |
| **Footprint Stress** | Imbalance across People/Process/Tools | EntityRisk scores | Based on imbalance range |
| **Change Saturation** | Too many concurrent change projects | EntityChangeAdoption counts | Based on adoption load % |
| **Trend Warning** | Silent health degradation over time | EntityRisk health history | Red if declining, none otherwise |

### Key Principles

1. **1:1 Matching:** EntityRisk matches EntityCapability via composite key: `(id, year, quarter)`
2. **Cumulative Data:** Year/quarter filtering is cumulative (2026 Q3 includes all of 2025 + 2026 Q1-Q3)
3. **Mode-Specific:** BUILD vs EXECUTE modes use different metrics and logic
4. **Strategic Focus:** Overlays reveal hidden risks, not just obvious problems

---

## Data Architecture

### Core Entities

**EntityCapability (391 nodes)**
```cypher
(:EntityCapability {
    id: String,                    // Business ID (e.g., "1.0", "1.1", "1.1.1")
    name: String,
    description: String,
    maturity_level: Integer,       // 1-5 scale
    target_maturity_level: Integer,
    status: String,                // 'active', 'pending', 'at-risk'
    parent_id: String,
    parent_year: Integer,
    quarter: String,               // "Q1", "Q2", "Q3", "Q4"
    year: Integer,
    level: String,                 // "L1", "L2", "L3"
    embedding: List<Float>
})
```

**EntityRisk (391 nodes) - 1:1 with EntityCapability**
```cypher
(:EntityRisk {
    id: String,                    // Matches capability.id
    name: String,
    risk_category: String,
    risk_status: String,
    quarter: String,
    year: Integer,
    
    // BUILD MODE fields
    likelihood_of_delay: Float,
    delay_days: Float,
    expected_delay_days: Float,
    build_exposure_pct: Float,     // 0-100%
    build_band: String,
    
    // EXECUTE MODE fields
    people_score: Float,           // 1-5 scale
    process_score: Float,          // 1-5 scale
    tools_score: Float,            // 1-5 scale
    operational_health_pct: Float, // 0-100%
    operate_exposure_pct_raw: Float,
    operate_exposure_pct_effective: Float,
    operate_band: String,
    operate_trend_flag: Boolean,
    
    // Trend tracking
    prev_operational_health_pct: Float,
    prev2_operational_health_pct: Float,
    
    // Thresholds
    threshold_green: Float,
    threshold_amber: Float,
    threshold_red: Float
})
```

### Matching Logic

**Composite Key Match:**
```typescript
// Match EntityRisk to L3 Capability
const riskNode = riskNodes.find(risk => 
    risk.id === capability.id &&
    risk.year === capability.year &&
    risk.quarter === capability.quarter
);
```

**After Backend ID Fix (deployed):**
- `node.id` = Business ID (e.g., "1.0")
- `node.elementId` = Neo4j internal ID (e.g., "4:eae8d877...")
- No more business ID extraction/generation needed

---

## Overlay 1: Risk Exposure

### Purpose
Shows capabilities at risk of delivery delays (BUILD mode) or operational health degradation (EXECUTE mode).

### Data Source
- **EntityRisk** (matched 1:1 with capability)
- Fields used depend on mode

### BUILD Mode

**Fields:**
- `build_exposure_pct` (0-100%)
- `expected_delay_days`
- `likelihood_of_delay`
- `delay_days`

**Formula (from Enterprise Ontology SST v1.1):**
```
build_exposure_pct = clamp01(expected_delay_days / red_delay_days) × 100

where:
  expected_delay_days = likelihood_of_delay × delay_days
  delay_days = max(outputs_delay, roles_delay, it_delay)
```

**Display:**
- **Cell Text:** `"+{expected_delay_days}d / {build_exposure_pct}%"`
- **Example:** "+12d / 23%"

### EXECUTE Mode

**Fields:**
- `operate_exposure_pct_effective` (0-100%)
- `operational_health_pct`
- `people_score`, `process_score`, `tools_score` (1-5 scale)
- `operate_trend_flag` (boolean)

**Formula (from Enterprise Ontology SST v1.1):**
```
operational_health_pct = avg(people_pct, process_pct, tools_pct)

where:
  people_pct = ((people_score - 1) / 4) × 100
  process_pct = ((process_score - 1) / 4) × 100
  tools_pct = ((tools_score - 1) / 4) × 100

operate_exposure_pct_raw = 100 - operational_health_pct

IF operate_trend_flag = true (2 consecutive declines in health):
  operate_exposure_pct_effective = band_green_max_pct (force amber)
ELSE:
  operate_exposure_pct_effective = operate_exposure_pct_raw
```

**Trend Arrow:**
```typescript
const trend = 
    expose_trend === 'improving' ? '▲' :
    expose_trend === 'declining' ? '▼' : '■';
```

**Display:**
- **Cell Text:** `"{operate_exposure_pct_effective}% {trend_arrow}"`
- **Example:** "23% ▼"

### Color Thresholds (Both Modes)

```typescript
exposure_percent = mode === 'build' 
    ? build_exposure_pct 
    : operate_exposure_pct_effective;

if (exposure_percent < 5) {
    color = GREEN;  // rgba(16, 185, 129, 0.6)
} else if (exposure_percent < 15) {
    color = AMBER;  // Gradient
} else {
    color = RED;    // rgba(239, 68, 68, 0.6)
}
```

### Data Enrichment

```typescript
// Add to L3Capability interface:
interface L3Capability {
    // ... existing fields
    
    // Risk Exposure fields
    exposure_percent: number;           // 0-100
    expected_delay_days?: number;       // BUILD only
    likelihood_of_delay?: number;       // BUILD only
    operational_health_score?: number;  // EXECUTE only
    people_score?: number;              // EXECUTE only (1-5)
    process_score?: number;             // EXECUTE only (1-5)
    tools_score?: number;               // EXECUTE only (1-5)
    exposure_trend?: 'improving' | 'declining' | 'stable';  // EXECUTE only
}
```

---

## Overlay 2: External Pressure

### Purpose
Identifies capabilities under heavy external mandate pressure from policy tools (BUILD) or performance targets (EXECUTE), even if currently healthy. Goal is to find potential weak links before they break.

### Key Insight
- **Proactive vs Reactive:** Shows pressure BEFORE it becomes a risk
- **Not from EntityRisk INFORMS:** Those activate only AFTER risk exceeds threshold
- **Real External Forces:** Counts actual mandates/targets imposed on capability

### Data Source
- **Chain endpoints** to count linked PolicyTool or Performance entities
- **EntityRisk** for health history (EXECUTE mode only)
- **EntityCapability** for maturity levels

### BUILD Mode - Policy Pressure

**Chain Call:**
```
GET /api/chains?
  sourceLabel=EntityCapability&
  sourceId={capability.id}&
  targetLabel=PolicyTool&
  relationshipTypes=EXECUTES,SETS_PRIORITIES
```

**Calculation:**
```typescript
policy_tool_count = response.length;

highPressure = (policy_tool_count >= 3);
lowMaturity = (maturity_level < target_maturity_level);
isUrgent = highPressure && lowMaturity;

color = isUrgent ? RED : GREEN;
```

**Logic:**
- High pressure (≥3 policy mandates) + capability not ready = URGENT (RED)
- Otherwise = manageable (GREEN)

### EXECUTE Mode - Performance Pressure

**Chain Call:**
```
GET /api/chains?
  sourceLabel=EntityCapability&
  sourceId={capability.id}&
  targetLabel=Performance&
  relationshipTypes=REPORTS,SETS_TARGETS
```

**Calculation:**
```typescript
performance_target_count = response.length;

// Get health history from EntityRisk
health_history = [
    prev2_operational_health_pct,
    prev_operational_health_pct,
    operational_health_pct
];

highPressure = (performance_target_count >= 3);
isDeclining = (
    health_history[0] > health_history[1] && 
    health_history[1] > health_history[2]
);
isUrgent = highPressure && isDeclining;

color = isUrgent ? RED : GREEN;
```

**Logic:**
- High pressure (≥3 performance targets) + declining health = URGENT (RED)
- Otherwise = manageable (GREEN)

### Color Logic

```typescript
// Binary - no gradient
if (isUrgent) {
    return 'rgba(239, 68, 68, 0.6)';  // RED
} else {
    return 'rgba(16, 185, 129, 0.6)'; // GREEN
}
```

### Display
- **Cell Text:** None (color-only indicator)
- **Tooltip:** Shows count of policy tools or performance targets

### Data Enrichment

```typescript
interface L3Capability {
    // ... existing fields
    
    // External Pressure fields
    policy_tool_count?: number;         // BUILD mode
    performance_target_count?: number;  // EXECUTE mode
    health_history?: number[];          // EXECUTE mode [prev2, prev, current]
}
```

### Performance Consideration

With 285 L3 capabilities, that's potentially 285 chain requests. **Recommendation:**
- Use batch fetching strategy
- Cache results (re-fetch only when year/quarter changes)
- OR create dedicated backend endpoint that returns all counts in one call

---

## Overlay 3: Footprint Stress

### Purpose
Detects **imbalance** across People/Process/Tools dimensions. Not about absolute maturity (high or low), but about **balance**. Goal is to flush out hidden risks where 2 strong pillars mask 1 weak pillar (unsustainable configurations).

### Key Insight
**Balanced is good, regardless of maturity level:**
- [5, 5, 5] = GREEN (balanced high maturity - sustainable ✅)
- [2, 2, 2] = GREEN (balanced low maturity - evenly weak ✅)
- [5, 5, 1] = RED (tools lagging - team compensating ⚠️)
- [5, 3, 1] = RED (progressive degradation - unsustainable ⚠️)

### Data Source
- **EntityRisk** (matched 1:1 with capability)
- Uses `people_score`, `process_score`, `tools_score` (1-5 scale)

### Calculation Logic

```typescript
// 1. Get scores from EntityRisk
const people_score = risk.people_score;   // 1-5
const process_score = risk.process_score; // 1-5
const tools_score = risk.tools_score;     // 1-5

// 2. Calculate imbalance metrics
const max_score = Math.max(people_score, process_score, tools_score);
const min_score = Math.min(people_score, process_score, tools_score);
const range = max_score - min_score;
const mean = (people_score + process_score + tools_score) / 3;

// 3. Calculate gaps from mean for each dimension
const org_gap = Math.abs(people_score - mean);
const process_gap = Math.abs(process_score - mean);
const it_gap = Math.abs(tools_score - mean);

// 4. Convert range to stress percentage
const stress_pct = (range / 4) × 100;  // 4 is max range (5-1)

// 5. Identify dominant stress (furthest from mean)
const maxGap = Math.max(org_gap, process_gap, it_gap);
const dominant = 
    org_gap === maxGap ? 'O' :      // People is outlier
    process_gap === maxGap ? 'P' :  // Process is outlier
    'T';                            // Tools is outlier

const severity = Math.floor(stress_pct / 25);  // minimum 1

// 6. Color based on stress_pct
let color;
if (stress_pct < 5) {
    color = GREEN;
} else if (stress_pct < 15) {
    color = AMBER;
} else {
    color = RED;
}
```

### Examples

| People | Process | Tools | Range | Stress % | Color | Interpretation |
|--------|---------|-------|-------|----------|-------|----------------|
| 5 | 5 | 5 | 0 | 0% | GREEN | Balanced high maturity - sustainable ✅ |
| 2 | 2 | 2 | 0 | 0% | GREEN | Balanced low maturity - evenly weak ✅ |
| 5 | 5 | 1 | 4 | 100% | RED | Tools lagging - team compensating ⚠️ |
| 1 | 5 | 5 | 4 | 100% | RED | People weak - automation masking risk ⚠️ |
| 5 | 3 | 1 | 4 | 100% | RED | Progressive degradation - unsustainable ⚠️ |
| 4 | 3 | 3 | 1 | 25% | AMBER | Slight imbalance - people slightly ahead ⚠️ |

### Display
- **Cell Text:** `"{dominant}{severity}"`
  - Shows which dimension is the outlier creating stress
  - Example: "T3" = Tools is 3 levels different from others
- **Tooltip:** Shows all three scores and imbalance details

### Data Enrichment

```typescript
interface L3Capability {
    // ... existing fields
    
    // Footprint Stress fields (from EntityRisk)
    people_score: number;     // 1-5
    process_score: number;    // 1-5
    tools_score: number;      // 1-5
    
    // Calculated for display
    org_gap: number;          // Distance from mean
    process_gap: number;      // Distance from mean
    it_gap: number;           // Distance from mean
}
```

---

## Overlay 4: Change Saturation

### Purpose
Reveals **organizational change compression risk** - teams being hit by too many capability changes in too short a time. Individual capabilities may look healthy, but when 75% of a team's portfolio is changing within 6 months, that team is at breaking point.

### Key Insight
**Hidden signal in the noise:**
- Looking at each capability individually → might all look fine
- Looking at organizational units → reveals stress patterns
- 75% change over 5 years = manageable ✅
- 75% change in 6 months = organizational breakdown ⚠️

**This overlay identifies the TOP 3 most saturated teams** and highlights which capabilities are stressing them.

### Data Source

**Step 1: Define Recent Time Window (Last 2 Quarters)**
```typescript
// Example: Viewing Q3 2026
const currentQuarter = 'Q3';
const currentYear = 2026;

// Calculate previous quarter
const recentWindow = [
    { year: 2026, quarter: 'Q2' },  // Previous quarter
    { year: 2026, quarter: 'Q3' }   // Current quarter
];
```

**Step 2: Find BUILD Capabilities in Recent Window**
```cypher
MATCH (cap:EntityCapability)
WHERE cap.status IN ['planned', 'in_progress']
  AND (
    (cap.year = 2026 AND cap.quarter = 'Q2') OR
    (cap.year = 2026 AND cap.quarter = 'Q3')
  )
RETURN cap
```

**Step 3: Traverse to Affected OrgUnits**
```cypher
// For each BUILD capability in recent window
MATCH (cap:EntityCapability)-[:ROLE_GAPS]->(org:EntityOrgUnit)
WHERE cap.status IN ['planned', 'in_progress']
  AND ((cap.year = 2026 AND cap.quarter = 'Q2') OR 
       (cap.year = 2026 AND cap.quarter = 'Q3'))
RETURN cap.id as capability_id, org.id as org_unit_id
```

**Step 4: Calculate Per-Team Metrics**
```cypher
// For each OrgUnit, count:
// 1. How many BUILD capabilities (last 2Q) have ROLE_GAPS to this team
// 2. Total capabilities this team operates (all time)

MATCH (org:EntityOrgUnit)
OPTIONAL MATCH (recent_build:EntityCapability)-[:ROLE_GAPS]->(org)
WHERE recent_build.status IN ['planned', 'in_progress']
  AND ((recent_build.year = 2026 AND recent_build.quarter = 'Q2') OR 
       (recent_build.year = 2026 AND recent_build.quarter = 'Q3'))

OPTIONAL MATCH (org)-[:OPERATES]->(all_caps:EntityCapability)

WITH org,
     COUNT(DISTINCT recent_build) as recent_change_count,
     COUNT(DISTINCT all_caps) as total_capabilities

RETURN 
    org.id,
    org.name,
    recent_change_count,
    total_capabilities,
    (recent_change_count * 100.0 / total_capabilities) as change_compression_pct
ORDER BY change_compression_pct DESC
LIMIT 3
```

### Calculation Logic

```typescript
// 1. Get all OrgUnits with their metrics
interface TeamChangeLoad {
    org_unit_id: string;
    org_unit_name: string;
    recent_change_count: number;       // BUILD caps in last 2Q
    total_capabilities: number;         // All caps team operates
    change_compression_pct: number;     // Percentage
}

// 2. Calculate for each team
const teamMetrics: TeamChangeLoad[] = orgUnits.map(org => {
    // Count BUILD capabilities (last 2Q) with ROLE_GAPS to this team
    const recentChanges = buildCapabilities.filter(cap => 
        isInRecentWindow(cap.year, cap.quarter) &&
        cap.roleGaps?.includes(org.id)
    ).length;
    
    // Count total capabilities this team operates
    const totalCaps = capabilities.filter(cap => 
        cap.operates === org.id
    ).length;
    
    return {
        org_unit_id: org.id,
        org_unit_name: org.name,
        recent_change_count: recentChanges,
        total_capabilities: totalCaps,
        change_compression_pct: (recentChanges / totalCaps) * 100
    };
});

// 3. Sort and take top 3
const top3Teams = teamMetrics
    .sort((a, b) => b.change_compression_pct - a.change_compression_pct)
    .slice(0, 3);

// 4. Assign color intensity (darkest = highest %)
const colorMap = {
    [top3Teams[0]?.org_unit_id]: 'rgba(239, 68, 68, 0.8)',   // Darkest red
    [top3Teams[1]?.org_unit_id]: 'rgba(239, 68, 68, 0.6)',   // Medium red
    [top3Teams[2]?.org_unit_id]: 'rgba(239, 68, 68, 0.4)',   // Lighter red
};

// 5. Color capabilities on matrix
L3Capabilities.forEach(cap => {
    // Find which teams are affected by this capability
    const affectedTeams = cap.roleGaps || [];
    
    // Check if any affected team is in top 3
    const inTop3 = affectedTeams.find(teamId => colorMap[teamId]);
    
    if (inTop3) {
        cap.saturation_color = colorMap[inTop3];
        cap.saturation_team = top3Teams.find(t => t.org_unit_id === inTop3)?.org_unit_name;
    } else {
        cap.saturation_color = 'rgba(100, 100, 100, 0.1)';  // Dimmed
    }
});
```

### Examples

**Scenario: Q3 2026 Analysis (Last 2Q = Q2 + Q3 2026)**

**Team Metrics:**
| OrgUnit | Total Caps | Changes (Q2+Q3) | Compression % | Rank | Color |
|---------|-----------|----------------|---------------|------|-------|
| Finance Operations | 20 | 15 | 75% | #1 | Darkest Red |
| HR Services | 12 | 7 | 58% | #2 | Medium Red |
| IT Support | 25 | 12 | 48% | #3 | Light Red |
| Marketing | 18 | 5 | 28% | - | Dimmed |
| Legal | 10 | 2 | 20% | - | Dimmed |

**Matrix Display:**
- Capabilities with ROLE_GAPS → Finance Operations: **Darkest red** (75% team under stress)
- Capabilities with ROLE_GAPS → HR Services: **Medium red** (58% team under stress)
- Capabilities with ROLE_GAPS → IT Support: **Light red** (48% team under stress)
- All other capabilities: **Dimmed** (gray, not in top 3)

### Color Logic

```typescript
// NO gradient between cells - each cell is either:
// 1. Darkest red (affects team #1)
// 2. Medium red (affects team #2)
// 3. Light red (affects team #3)
// 4. Dimmed gray (not affecting top 3 teams)

if (capability.roleGaps?.includes(top3Teams[0]?.org_unit_id)) {
    return 'rgba(239, 68, 68, 0.8)';  // Team #1
} else if (capability.roleGaps?.includes(top3Teams[1]?.org_unit_id)) {
    return 'rgba(239, 68, 68, 0.6)';  // Team #2
} else if (capability.roleGaps?.includes(top3Teams[2]?.org_unit_id)) {
    return 'rgba(239, 68, 68, 0.4)';  // Team #3
} else {
    return 'rgba(100, 100, 100, 0.1)'; // Dimmed
}
```

### Display
- **Cell Color:** Red intensity based on which top 3 team is affected (or dimmed)
- **Cell Text:** None (color-only, like External Pressure and Trend Warning)
- **Tooltip:** Shows team name and compression percentage
  - Example: "Finance Operations: 75% (15/20 capabilities changing)"

### Data Enrichment

```typescript
interface L3Capability {
    // ... existing fields
    
    // Change Saturation fields
    roleGaps?: string[];                // OrgUnit IDs from ROLE_GAPS
    saturation_team?: string;           // Name of top 3 team affected
    saturation_team_pct?: number;       // That team's compression %
    saturation_color?: string;          // Red shade or dimmed
}

interface TeamChangeLoad {
    org_unit_id: string;
    org_unit_name: string;
    recent_change_count: number;        // BUILD in last 2Q
    total_capabilities: number;         // All capabilities
    change_compression_pct: number;     // 0-100%
}
```

### Mode Applicability

**BUILD Mode Only:**
- In EXECUTE mode, capabilities have `status='active'` (change is complete)
- No ROLE_GAPS exist for active capabilities (gaps are closed)
- Change saturation only relevant when capabilities are being built

**Recommendation:** Show this overlay in BUILD mode only, or gray out in EXECUTE mode.

### Implementation Strategy

**Backend Endpoint (RECOMMENDED):**
```
POST /api/enterprise/change-saturation
Body: { 
    currentYear: number, 
    currentQuarter: string 
}

Response: {
    top3Teams: [
        {
            org_unit_id: string,
            org_unit_name: string,
            recent_change_count: number,
            total_capabilities: number,
            change_compression_pct: number,
            affected_capability_ids: string[]
        }
    ],
    colorMap: {
        capability_id -> color_string
    }
}
```

**Query Logic:**
1. Calculate previous quarter from current
2. Find all BUILD capabilities in 2-quarter window
3. Traverse ROLE_GAPS to OrgUnits
4. Count per team: recent changes vs total operated capabilities
5. Return top 3 teams + color mapping for all capabilities

### Validation Notes

From DATA_ARCHITECTURE.md:
- `ROLE_GAPS`: 480 relationships (Capability → OrgUnit)
- `OPERATES`: Relationship (OrgUnit → Capability) for total count

From Enterprise_Ontology_SST_v1.1:
- EntityCapability status: 'planned', 'in_progress', 'active'
- EntityOrgUnit levels: L1 Dept | L2 Sub-dept | L3 Team

**Critical Insight:** This overlay reveals **organizational capacity constraints**, not technical risks. It answers: "Which teams are being asked to absorb too much change too fast?"

---

## Overlay 5: Trend Warning

### Purpose
Detects **silent degradation** - capabilities that are declining in health over 2+ consecutive quarters, even if current exposure is still GREEN. This is an **early warning** system to catch problems before they become critical.

### Key Insight
From Enterprise_Ontology_SST_v1.1:
> "Trend early warning (attention flag; does NOT create links):
> If BOTH:
> - prev2 > prev > current (two consecutive drops)
> - AND operate_exposure_pct_raw is still Green (< band_green_max_pct)
> Then: operate_trend_flag = true"

**Purpose:** Flag capabilities that are "bleeding out quietly" - still healthy on paper but getting worse each quarter.

### Data Source
**EntityRisk across 3 consecutive quarters** for the same capability:
- **Current quarter:** operational_health_pct from EntityRisk(capability.id, year, quarter)
- **Previous quarter (Q-1):** operational_health_pct from EntityRisk(capability.id, year, quarter-1)
- **Previous-previous quarter (Q-2):** operational_health_pct from EntityRisk(capability.id, year, quarter-2)

### EXECUTE Mode Only

This overlay applies **only in EXECUTE mode** because:
- Only active capabilities have operational health scores
- BUILD mode tracks delivery delays, not operational health trends

### Calculation Logic

```typescript
// 1. Query EntityRisk for same capability across 3 quarters
const currentRisk = EntityRisk.find(
    r => r.id === capability.id && 
         r.year === currentYear && 
         r.quarter === currentQuarter
);

const prevRisk = EntityRisk.find(
    r => r.id === capability.id && 
         r.year === prevYear && 
         r.quarter === prevQuarter
);

const prev2Risk = EntityRisk.find(
    r => r.id === capability.id && 
         r.year === prev2Year && 
         r.quarter === prev2Quarter
);

// 2. Extract operational health percentages
const current_health = currentRisk?.operational_health_pct ?? null;
const prev_health = prevRisk?.operational_health_pct ?? null;
const prev2_health = prev2Risk?.operational_health_pct ?? null;

// 3. Calculate operational health from scores (if needed)
// operational_health_pct = avg(people_pct, process_pct, tools_pct)
// where each_pct = ((score - 1) / 4) × 100

// 4. Detect declining trend (2 consecutive drops)
const isDeclining = 
    prev2_health !== null && 
    prev_health !== null && 
    current_health !== null &&
    prev2_health > prev_health && 
    prev_health > current_health;

// 5. Check if current exposure is still GREEN
const operate_exposure_pct_raw = 100 - current_health;
const band_green_max_pct = 35; // from ScoreConfig

const stillGreen = operate_exposure_pct_raw < band_green_max_pct;

// 6. Set trend warning flag
const operate_trend_flag = isDeclining && stillGreen;

// 7. Color logic
if (operate_trend_flag) {
    color = RED;  // Early warning - silent degradation detected
} else {
    color = null; // No warning (no color overlay)
}
```

### Quarter Navigation Logic

```typescript
function getPreviousQuarter(year: number, quarter: string): {year: number, quarter: string} {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const currentIndex = quarters.indexOf(quarter);
    
    if (currentIndex > 0) {
        return { year, quarter: quarters[currentIndex - 1] };
    } else {
        return { year: year - 1, quarter: 'Q4' };
    }
}

const prev = getPreviousQuarter(currentYear, currentQuarter);
const prev2 = getPreviousQuarter(prev.year, prev.quarter);
```

### Examples

**Scenario 1: Silent Degradation (RED)**
| Quarter | Health % | Exposure % | Band | Trend | Warning |
|---------|----------|------------|------|-------|---------|
| Q1 2026 | 80% | 20% | GREEN | - | - |
| Q2 2026 | 75% | 25% | GREEN | ▼ | - |
| Q3 2026 | 70% | 30% | GREEN | ▼ | RED ⚠️ |

**Explanation:** 2 consecutive drops (80→75→70), still GREEN (<35% exposure) → **Trend Warning RED**

**Scenario 2: Already Amber/Red (No Warning)**
| Quarter | Health % | Exposure % | Band | Trend | Warning |
|---------|----------|------------|------|-------|---------|
| Q1 2026 | 55% | 45% | AMBER | - | - |
| Q2 2026 | 50% | 50% | AMBER | ▼ | - |
| Q3 2026 | 45% | 55% | RED | ▼ | None |

**Explanation:** Declining, but already RED (≥35% exposure) → **No Trend Warning** (already visible in Risk Exposure overlay)

**Scenario 3: Improving (No Warning)**
| Quarter | Health % | Exposure % | Band | Trend | Warning |
|---------|----------|------------|------|-------|---------|
| Q1 2026 | 70% | 30% | GREEN | - | - |
| Q2 2026 | 75% | 25% | GREEN | ▲ | - |
| Q3 2026 | 80% | 20% | GREEN | ▲ | None |

**Explanation:** Improving trend → **No Warning**

**Scenario 4: Stable (No Warning)**
| Quarter | Health % | Exposure % | Band | Trend | Warning |
|---------|----------|------------|------|-------|---------|
| Q1 2026 | 75% | 25% | GREEN | - | - |
| Q2 2026 | 75% | 25% | GREEN | ■ | - |
| Q3 2026 | 75% | 25% | GREEN | ■ | None |

**Explanation:** No change → **No Warning**

### Display
- **Cell Color:** RED if `operate_trend_flag = true`, else no overlay color
- **Cell Text:** None (color-only indicator, like External Pressure)
- **Tooltip:** Shows 3-quarter health trend with percentages

### Data Enrichment

```typescript
interface L3Capability {
    // ... existing fields
    
    // Trend Warning fields (EXECUTE mode only)
    current_health_pct?: number;        // Q0 operational_health_pct
    prev_health_pct?: number;           // Q-1 operational_health_pct
    prev2_health_pct?: number;          // Q-2 operational_health_pct
    operate_trend_flag?: boolean;       // Silent degradation detected
    health_trend?: 'improving' | 'declining' | 'stable';
}
```

### Implementation Strategy

**Option A: Frontend Multi-Quarter Query**
```typescript
// Fetch EntityRisk nodes for current AND previous 2 quarters
const riskNodes = graphData.nodes.filter(n => 
    n.label === 'EntityRisk' &&
    n.id === capability.id &&
    (
        (n.year === currentYear && n.quarter === currentQuarter) ||
        (n.year === prevYear && n.quarter === prevQuarter) ||
        (n.year === prev2Year && n.quarter === prev2Quarter)
    )
);
```

**Option B: Backend Trend Endpoint**
```
POST /api/enterprise/health-trends
Body: { 
    capabilityIds: string[],
    currentYear: number, 
    currentQuarter: string 
}

Response: {
    capability_id -> {
        current_health: number,
        prev_health: number,
        prev2_health: number,
        trend_flag: boolean
    }
}
```

**RECOMMENDATION:** Start with Option A (frontend) since we're already fetching EntityRisk. Just ensure the query includes previous quarters' data.

### Validation Notes

From Enterprise_Ontology_SST_v1.1 (lines 245-260):
- `operational_health_pct = avg(people_pct, process_pct, tools_pct)`
- Each dimension: `pct = ((score - 1) / 4) × 100`
- Trend flag only activates if BOTH declining AND still green
- This is an **attention flag** - does NOT create INFORMS links
- Roll-up uses `max(child_exposure)` at L2/L1 levels

**Critical:** This overlay reveals hidden risks that won't show in Risk Exposure overlay until they cross the green threshold (35%).

---

## Implementation Strategy

### Phase 1: Data Enrichment (Backend or Frontend)

**Option A: Frontend Enrichment**
- Fetch EntityCapability + EntityRisk nodes
- Match 1:1 in frontend
- Enrich L3 capabilities with risk data
- PRO: No backend changes needed
- CON: Multiple chain calls for External Pressure overlay

**Option B: Dedicated Backend Endpoint**
- Create `/api/enterprise/capability-enrichment?year={year}&quarter={quarter}`
- Returns fully enriched capability tree with all overlay data
- PRO: Single call, optimal performance, cumulative filtering handled server-side
- CON: Requires backend development

**RECOMMENDATION:** Start with Option A (frontend), evaluate performance, consider Option B if needed.

### Phase 2: Implementation Order

1. **Risk Exposure** - Uses EntityRisk directly, no external calls
2. **Footprint Stress** - Uses EntityRisk directly, no external calls
3. **External Pressure** - Requires chain endpoint integration
4. **Change Saturation** - TBD based on data source
5. **Trend Warning** - Uses EntityRisk directly

### Phase 3: Testing Strategy

**Test Cases:**
- Various year/quarter combinations (cumulative filtering)
- BUILD vs EXECUTE mode switching
- Edge cases: missing EntityRisk, missing scores
- Performance: 285 L3s with all overlays active

---

## Backend Changes Required

### 1. ID Field Swap (✅ DEPLOYED)
- `id` = Business ID (properties.id)
- `elementId` = Neo4j internal ID
- Two-pass relationship resolution

### 2. Chain Endpoint Verification
- Test `/api/chains` with year/quarter filtering
- Verify cumulative data support
- Performance test with 285 capabilities

### 3. Potential New Endpoint
If performance issues arise:
```
POST /api/enterprise/capability-enrichment
Body: {
    year: number | 'all',
    quarter: number | 'all'
}

Response: {
    l1Capabilities: [{
        id, name, l2: [{
            id, name, l3: [{
                id, name,
                // All overlay data included:
                exposure_percent,
                policy_tool_count,
                people_score, process_score, tools_score,
                // etc.
            }]
        }]
    }]
}
```

---

## Status Log

| Date | Overlay | Status | Notes |
|------|---------|--------|-------|
| 2026-01-17 | Risk Exposure | ✅ Documented | Formula from Ontology SST v1.1 |
| 2026-01-17 | External Pressure | ✅ Documented | Chain endpoint strategy defined |
| 2026-01-17 | Footprint Stress | ✅ Documented | Imbalance detection logic clarified |
| 2026-01-17 | Change Saturation | ✅ Documented | Team change compression (2Q window) via ROLE_GAPS |
| 2026-01-17 | Trend Warning | ✅ Documented | Multi-quarter EntityRisk comparison (prev/prev2) |

---

## Next Steps

**All 5 overlays now documented and validated.** Ready for implementation.

**Implementation Checklist:**
- [ ] Extract EntityRisk nodes from graphData (Overlays 1, 2, 3, 5)
- [ ] Match EntityRisk to L3 via (id, year, quarter) composite key (Overlays 1, 3, 5)
- [ ] Fetch PolicyTool/Performance counts via chains or dedicated endpoint (Overlay 2)
- [ ] Calculate team change compression for top 3 teams (Overlay 4)
- [ ] Query multi-quarter EntityRisk for trend detection (Overlay 5)
- [ ] Enrich L3 capabilities with all overlay data in buildL3()
- [ ] Remove business ID workarounds (extractBusinessId, sequential generation)
- [ ] Test all 5 overlays with real data in both BUILD and EXECUTE modes

---

**END OF DOCUMENT**
