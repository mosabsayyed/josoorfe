# Water Sector Command Center - Backend Development Documentation

**Version:** 1.0  
**Date:** January 9, 2026  
**Purpose:** Complete technical and business specification for backend implementation

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Data Models](#data-models)
4. [Desk 1: Sector Desk (Map View)](#desk-1-sector-desk-map-view)
5. [Desk 2: Enterprise Desk (Capability Controls Matrix)](#desk-2-enterprise-desk-capability-controls-matrix)
6. [Desk 3: Controls Desk (Sankey Diagrams)](#desk-3-controls-desk-sankey-diagrams)
7. [Desk 4: Planning Desk](#desk-4-planning-desk)
8. [Desk 5: Reporting Desk](#desk-5-reporting-desk)
9. [Dashboard Sidebar (KPI Gauges)](#dashboard-sidebar-kpi-gauges)
10. [API Endpoint Specifications](#api-endpoint-specifications)
11. [Calculation Engine Specifications](#calculation-engine-specifications)
12. [Real-time Update Requirements](#real-time-update-requirements)

---

## System Overview

### Business Context
The Water Sector Command Center is an executive dashboard for monitoring and managing water infrastructure operations across Saudi Arabia. It provides:
- Real-time operational status of water plants
- Strategic capability management through a Controls Matrix
- Flow tracking from objectives → policy tools → capabilities → projects
- Planning tools for interventions and strategic resets
- Reporting and audit trails

### Technical Stack Requirements
- **Frontend:** React, TypeScript, ECharts, SVG
- **Backend:** (Your choice - Node.js/Python/Java recommended)
- **Database:** Relational DB required (PostgreSQL/MySQL recommended) for complex relationships
- **Real-time:** WebSocket or SSE support for live updates
- **API:** RESTful + optional GraphQL for complex queries

---

## Architecture Principles

### Data Retrieval vs Calculation

**DATABASE RETRIEVAL (Stored Data):**
- Base entity data (plants, projects, policy tools, objectives)
- Historical performance metrics
- User actions and timestamps
- Audit logs
- Configuration settings

**BACKEND CALCULATION (Computed on Request):**
- Aggregated metrics (averages, totals, percentages)
- Risk exposure bands
- Status derivations (Red/Amber/Green)
- Leakage percentages across chains
- Load utilization metrics
- Impact simulations

**FRONTEND CALCULATION (Display Only):**
- UI state management (zoom, filters, selections)
- Visual positioning (SVG coordinates)
- Temporary simulation previews (before submission)

### Calculation Frequency
- **On-Demand:** User requests data for specific desk/view
- **Scheduled:** Daily aggregation jobs for historical trends
- **Real-time:** When critical thresholds are crossed (risk bands, delays)

---

## Data Models

### Core Entities

#### 1. Plant
```typescript
interface Plant {
  id: string;                    // PRIMARY KEY
  name: string;                  // e.g., "Ras Al-Khair Plant"
  type: 'desalination' | 'treatment' | 'distribution';
  status: 'operational' | 'planned' | 'at-risk';  // CALCULATED
  coordinates: {
    latitude: number;
    longitude: number;
  };
  capacity: {
    value: number;               // DB: Raw capacity in cubic meters/day
    unit: string;                // DB: "m³/day"
  };
  
  // RETRIEVED from DB
  sectors: {
    agriculture: number;         // DB: Allocation percentage (0-100)
    industry: number;
    urban: number;
  };
  
  // CALCULATED from project data + sensor readings
  performance: {
    efficiency: number;          // CALC: (actual_output / rated_capacity) * 100
    uptime: number;              // CALC: (operational_hours / total_hours) * 100
    waterQuality: number;        // DB: Latest quality score from sensors
  };
  
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Status Calculation Logic:**
```
IF uptime < 50% OR efficiency < 60% → 'at-risk'
ELSE IF status_override = 'planned' → 'planned'
ELSE → 'operational'
```

---

#### 2. Capability
```typescript
interface Capability {
  id: string;                    // PRIMARY KEY
  name: string;                  // e.g., "Plant Operations"
  level: 'L1' | 'L2' | 'L3';    // Hierarchy level
  parent_id: string | null;      // FOREIGN KEY to parent capability
  
  // RETRIEVED from DB
  maturity: number;              // DB: 1-5 scale, manually set
  mode: 'BUILD' | 'OPERATE' | 'HOLD' | 'DECOMMISSION'; // DB: Strategic intent
  
  // CALCULATED
  allowed_load: number;          // CALC: maturity * base_capacity_factor
  current_load: number;          // CALC: COUNT(projects WHERE capability_id = this.id AND status = 'active')
  risk_exposure: number;         // CALC: See "Risk Exposure Calculation" below
  
  // Dashboard Metrics (CALCULATED)
  metrics: {
    avg_leakage: number;         // CALC: AVG(leakage) from all chains involving this capability
    avg_load_util: number;       // CALC: (current_load / allowed_load) * 100
    policy_pressure: number;     // CALC: COUNT(policy_tools mapped to this capability)
    perf_pressure: number;       // CALC: COUNT(performance_targets mapped to this capability)
  };
  
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Risk Exposure Calculation:**
```javascript
// Backend calculation function
function calculateRiskExposure(capability) {
  const loadUtil = (capability.current_load / capability.allowed_load) * 100;
  const projects = getActiveProjects(capability.id);
  const delayedProjects = projects.filter(p => p.delay_days > 0);
  const delayFactor = (delayedProjects.length / projects.length) * 100;
  
  // Weighted formula
  const riskScore = (loadUtil * 0.6) + (delayFactor * 0.4);
  
  return Math.min(100, Math.round(riskScore));
}

// Risk Band Classification
function getRiskBand(riskExposure) {
  if (riskExposure >= 65) return { band: 'RED', mode: 'BUILD' };
  if (riskExposure >= 35) return { band: 'AMBER', mode: 'OPERATE' };
  return { band: 'GREEN', mode: 'HOLD' };
}
```

---

#### 3. Objective (Strategic Goals)
```typescript
interface Objective {
  id: string;                    // PRIMARY KEY
  code: string;                  // e.g., "OBJ-01"
  name: string;                  // e.g., "Water Security"
  description: string;
  priority: 'High' | 'Medium' | 'Low';  // DB: Set by leadership
  
  // RETRIEVED from DB
  target_value: number;          // DB: e.g., 95 (for 95% coverage)
  current_value: number;         // DB: Updated periodically from operational data
  unit: string;                  // DB: e.g., "% coverage", "ML/day"
  
  // CALCULATED
  achievement_rate: number;      // CALC: (current_value / target_value) * 100
  
  created_at: timestamp;
  updated_at: timestamp;
}
```

---

#### 4. Policy Tool (Control Mechanisms)
```typescript
interface PolicyTool {
  id: string;                    // PRIMARY KEY
  code: string;                  // e.g., "PT-01"
  name: string;                  // e.g., "Water Pricing Reform"
  type: 'Regulatory' | 'Investment' | 'Operational' | 'Digital';
  
  // RETRIEVED from DB
  status: 'Active' | 'Planned' | 'Retired';
  budget_allocated: number;      // DB: Currency amount
  
  // CALCULATED
  effectiveness: number;         // CALC: See "Tool Effectiveness Calculation" below
  
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Tool Effectiveness Calculation:**
```javascript
function calculateToolEffectiveness(policyToolId) {
  // Get all capabilities linked to this tool
  const capabilities = getLinkedCapabilities(policyToolId);
  
  // Average their achievement vs target
  const achievements = capabilities.map(cap => {
    const projects = getProjects(cap.id);
    const completed = projects.filter(p => p.status === 'completed').length;
    return (completed / projects.length) * 100;
  });
  
  return Math.round(achievements.reduce((a, b) => a + b, 0) / achievements.length);
}
```

---

#### 5. Project (Delivery Initiatives)
```typescript
interface Project {
  id: string;                    // PRIMARY KEY
  code: string;                  // e.g., "PRJ-015"
  name: string;                  // e.g., "Riyadh Network Expansion"
  capability_id: string;         // FOREIGN KEY → Capability
  
  // RETRIEVED from DB
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  planned_start: date;
  planned_end: date;
  actual_start: date | null;
  actual_end: date | null;
  
  // CALCULATED
  delay_days: number;            // CALC: DATEDIFF(TODAY, planned_end) IF status != 'completed'
  progress: number;              // DB: 0-100, updated by project managers
  
  // Resources
  budget: number;                // DB
  team_size: number;             // DB
  
  created_at: timestamp;
  updated_at: timestamp;
}
```

---

#### 6. Performance Target
```typescript
interface PerformanceTarget {
  id: string;                    // PRIMARY KEY
  name: string;                  // e.g., "95% Uptime"
  capability_id: string;         // FOREIGN KEY → Capability
  
  // RETRIEVED from DB
  target_value: number;          // DB: e.g., 95
  current_value: number;         // DB: Latest measurement
  unit: string;                  // DB: e.g., "%", "ML/day"
  threshold: 'ambitious' | 'realistic' | 'unrealistic';  // DB: Assessment
  
  // CALCULATED
  achievement_rate: number;      // CALC: (current_value / target_value) * 100
  
  created_at: timestamp;
  updated_at: timestamp;
}
```

---

### Relationship Tables (Many-to-Many)

#### Objective ↔ Policy Tool
```sql
CREATE TABLE objective_policy_tools (
  objective_id VARCHAR(50) REFERENCES objectives(id),
  policy_tool_id VARCHAR(50) REFERENCES policy_tools(id),
  intent_strength DECIMAL(5,2),  -- 0-100: How much intent flows through
  created_at TIMESTAMP,
  PRIMARY KEY (objective_id, policy_tool_id)
);
```

#### Policy Tool ↔ Capability
```sql
CREATE TABLE policy_tool_capabilities (
  policy_tool_id VARCHAR(50) REFERENCES policy_tools(id),
  capability_id VARCHAR(50) REFERENCES capabilities(id),
  activation_strength DECIMAL(5,2),  -- 0-100: Activation level
  created_at TIMESTAMP,
  PRIMARY KEY (policy_tool_id, capability_id)
);
```

#### Capability ↔ Project
```sql
-- Direct foreign key in projects table
-- One capability has many projects
```

---

## Desk 1: Sector Desk (Map View)

### Business Purpose
Visual geographic representation of water infrastructure across Saudi Arabia. Shows plant locations, statuses, and operational metrics.

### Data Requirements

#### GET `/api/sector-desk/plants`
**Description:** Retrieve all plants for map display

**Response:**
```json
{
  "plants": [
    {
      "id": "plant-001",
      "name": "Ras Al-Khair Desalination Plant",
      "coordinates": [50.1750, 27.8167],
      "type": "desalination",
      "status": "operational",  // CALCULATED: See Plant status logic
      "capacity": {
        "value": 1025000,
        "unit": "m³/day"
      },
      "sectors": {
        "agriculture": 35,
        "industry": 25,
        "urban": 40
      },
      "performance": {
        "efficiency": 94,      // CALCULATED
        "uptime": 98,          // CALCULATED
        "waterQuality": 92     // RETRIEVED from latest sensor reading
      }
    }
  ],
  "metadata": {
    "total_count": 12,
    "operational": 8,          // CALCULATED: COUNT where status = 'operational'
    "planned": 2,
    "at_risk": 2
  }
}
```

**Backend Calculation Required:**
```javascript
// Efficiency calculation
efficiency = (actual_output_today / rated_capacity) * 100

// Uptime calculation (last 30 days)
uptime = (operational_hours / (30 * 24)) * 100

// Status determination
if (uptime < 50 || efficiency < 60) {
  status = 'at-risk'
} else if (is_planned_future) {
  status = 'planned'
} else {
  status = 'operational'
}
```

---

#### GET `/api/sector-desk/pipelines`
**Description:** Retrieve pipeline flow data for animated flows

**Response:**
```json
{
  "pipelines": [
    {
      "id": "pipeline-001",
      "from_plant_id": "plant-001",
      "to_region": "Riyadh",
      "status": "active",
      "flow_rate": 450000,    // RETRIEVED: Current flow in m³/day
      "capacity": 600000      // DB: Maximum capacity
    }
  ]
}
```

---

### Supporting Assets (Zoomed View)

**Business Logic:** When user zooms into a plant, show 6 surrounding infrastructure assets.

**Implementation:** Frontend generates asset positions dynamically (no backend needed)

**Types:** Urban Zone, Distribution Center, Control Station, Treatment Facility, Pump Station, Monitoring Hub

---

## Desk 2: Enterprise Desk (Capability Controls Matrix)

### Business Purpose
Strategic control panel showing 45 capabilities (15 L1, 30 L2) with their mode assignments, load, risk, and ability to overlay different control dimensions.

### Data Requirements

#### GET `/api/enterprise-desk/matrix`
**Description:** Retrieve complete capability matrix

**Query Parameters:**
- `overlay`: 'none' | 'mode' | 'load' | 'risk' | 'trend' | 'footprint'

**Response:**
```json
{
  "capabilities": [
    {
      "id": "cap-001",
      "name": "Plant Operations",
      "level": "L1",
      "parent_id": null,
      "maturity": 3,           // DB: 1-5 scale
      "mode": "BUILD",         // DB: Strategic intent
      "allowed_load": 3,       // CALCULATED: maturity * base_factor
      "current_load": 5,       // CALCULATED: COUNT(active projects)
      "risk_exposure": 68,     // CALCULATED: See risk formula
      "trend": "declining",    // CALCULATED: Compare to previous period
      
      // Only included when overlay = 'footprint'
      "footprint_gaps": {
        "org": "medium",       // DB: Assessment
        "process": "high",
        "tech": "low"
      }
    }
  ],
  "summary": {
    "total_capabilities": 45,
    "by_mode": {
      "BUILD": 12,             // CALCULATED
      "OPERATE": 28,
      "HOLD": 4,
      "DECOMMISSION": 1
    },
    "by_risk_band": {
      "RED": 6,                // CALCULATED: risk_exposure >= 65
      "AMBER": 24,             // CALCULATED: 35 <= risk_exposure < 65
      "GREEN": 15              // CALCULATED: risk_exposure < 35
    }
  }
}
```

**Backend Calculations:**

```javascript
// Allowed Load Calculation
function calculateAllowedLoad(maturity) {
  const baseFactors = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 8 };
  return baseFactors[maturity];
}

// Current Load Calculation
function calculateCurrentLoad(capabilityId) {
  return db.query(`
    SELECT COUNT(*) as load
    FROM projects
    WHERE capability_id = ? AND status = 'active'
  `, [capabilityId]);
}

// Trend Calculation (compare to previous quarter)
function calculateTrend(capabilityId) {
  const currentRisk = getCurrentRiskExposure(capabilityId);
  const previousRisk = getRiskExposureForPeriod(capabilityId, 'Q-1');
  
  if (currentRisk > previousRisk + 10) return 'declining';
  if (currentRisk < previousRisk - 10) return 'improving';
  return 'stable';
}
```

---

#### PATCH `/api/enterprise-desk/capability/:id/mode`
**Description:** Update capability mode (BUILD/OPERATE/HOLD/DECOMMISSION)

**Request:**
```json
{
  "mode": "OPERATE",
  "reason": "Stabilization achieved",
  "updated_by": "user-id-123"
}
```

**Response:**
```json
{
  "success": true,
  "capability": { /* updated capability object */ },
  "audit_log_id": "audit-789"
}
```

**Business Rules:**
- Mode change should trigger recalculation of allowed_load
- Audit log must be created
- WebSocket notification to all connected clients

---

### Overlay Modes

#### 1. Mode Overlay
**Data:** Use `mode` field from capability (DB)  
**Colors:** BUILD=Red, OPERATE=Blue, HOLD=Amber, DECOMMISSION=Gray

#### 2. Load Overlay
**Data:** `current_load` (CALCULATED)  
**Visualization:** Vertical bars, height = current_load, red line at allowed_load threshold

#### 3. Risk Overlay
**Data:** `risk_exposure` (CALCULATED)  
**Colors:** RED ≥65%, AMBER 35-64%, GREEN <35%

#### 4. Trend Overlay
**Data:** `trend` (CALCULATED from historical data)  
**Arrows:** ↑ improving (green), ↓ declining (red), → stable (gray)

#### 5. Footprint Gaps Overlay
**Data:** `footprint_gaps` (DB: assessments)  
**Visualization:** 3 dots per cell (Org, Process, Tech) colored by gap severity

---

## Desk 3: Controls Desk (Sankey Diagrams)

### Business Purpose
Visualize flow of intent and leakage across 4 control chains:
1. Objectives → Policy Tools
2. Policy Tools → Capabilities
3. Capabilities → Projects
4. Full Chain (Objectives → Tools → Capabilities → Projects)

### Data Requirements

#### GET `/api/controls-desk/sankey/:chain_type`
**Description:** Get Sankey diagram data for specific chain

**Path Parameters:**
- `chain_type`: 'obj-policy' | 'policy-capability' | 'capability-project' | 'full-chain'

**Response Structure:**
```json
{
  "nodes": [
    {
      "id": "obj-001",
      "name": "Water Security",
      "type": "objective",
      "total_intent": 100     // CALCULATED: Sum of outflows
    },
    {
      "id": "pt-001",
      "name": "Desalination Program",
      "type": "policy_tool",
      "total_intent": 78      // CALCULATED
    }
  ],
  "links": [
    {
      "source": "obj-001",
      "target": "pt-001",
      "value": 78,            // CALCULATED: Intent flow
      "leakage": 22           // CALCULATED: 100 - 78 = leakage
    }
  ],
  "summary": {
    "total_intent_in": 100,
    "total_intent_out": 78,
    "total_leakage": 22,
    "leakage_percentage": 22  // CALCULATED
  }
}
```

---

### Chain Calculations

#### Chain 1: Objectives → Policy Tools

**Business Logic:** Each objective allocates its intent across multiple policy tools based on strategic priority.

**Data Sources:**
- Objectives: DB
- Policy Tools: DB
- Links: `objective_policy_tools` table (intent_strength field)

**Calculation:**
```javascript
function calculateObjToPolicyFlow() {
  const objectives = getObjectives();
  const policyTools = getPolicyTools();
  const links = [];
  
  for (const obj of objectives) {
    const mappings = db.query(`
      SELECT policy_tool_id, intent_strength
      FROM objective_policy_tools
      WHERE objective_id = ?
    `, [obj.id]);
    
    const totalAllocated = mappings.reduce((sum, m) => sum + m.intent_strength, 0);
    const leakage = 100 - totalAllocated;
    
    for (const mapping of mappings) {
      links.push({
        source: obj.id,
        target: mapping.policy_tool_id,
        value: mapping.intent_strength,
        leakage: 0  // Leakage calculated separately
      });
    }
    
    // If there's leakage, add a leakage node
    if (leakage > 0) {
      links.push({
        source: obj.id,
        target: 'leakage-pool',
        value: leakage,
        leakage: leakage
      });
    }
  }
  
  return { nodes: [...objectives, ...policyTools], links };
}
```

---

#### Chain 2: Policy Tools → Capabilities

**Data Sources:**
- Policy Tools: DB
- Capabilities: DB
- Links: `policy_tool_capabilities` table (activation_strength field)

**Calculation Logic:** Same pattern as Chain 1

```sql
SELECT 
  pt.id as source,
  c.id as target,
  ptc.activation_strength as value,
  (100 - SUM(ptc.activation_strength) OVER (PARTITION BY pt.id)) as leakage
FROM policy_tools pt
JOIN policy_tool_capabilities ptc ON pt.id = ptc.policy_tool_id
JOIN capabilities c ON ptc.capability_id = c.id
```

---

#### Chain 3: Capabilities → Projects

**Data Sources:**
- Capabilities: DB
- Projects: DB
- Links: Direct foreign key relationship

**Calculation:**
```javascript
function calculateCapabilityToProjectFlow() {
  const capabilities = getCapabilities();
  const projects = getProjects();
  const links = [];
  
  for (const cap of capabilities) {
    const capProjects = projects.filter(p => p.capability_id === cap.id && p.status === 'active');
    const totalProgress = capProjects.reduce((sum, p) => sum + p.progress, 0);
    const avgProgress = capProjects.length > 0 ? totalProgress / capProjects.length : 0;
    
    for (const project of capProjects) {
      links.push({
        source: cap.id,
        target: project.id,
        value: project.progress,  // Flow = project progress
        leakage: 100 - project.progress
      });
    }
  }
  
  return { nodes: [...capabilities, ...projects], links };
}
```

**Business Logic:** Each capability distributes its capacity across projects. Incomplete projects represent "leakage."

---

#### Chain 4: Full Chain (4-Level Sankey)

**Business Logic:** Combines all 3 chains into one visualization.

**Response:**
```json
{
  "nodes": [
    { "id": "obj-001", "name": "Water Security", "layer": 0 },
    { "id": "pt-001", "name": "Desalination", "layer": 1 },
    { "id": "cap-001", "name": "Plant Ops", "layer": 2 },
    { "id": "prj-001", "name": "Riyadh Plant", "layer": 3 }
  ],
  "links": [
    { "source": "obj-001", "target": "pt-001", "value": 80, "leakage": 20 },
    { "source": "pt-001", "target": "cap-001", "value": 65, "leakage": 15 },
    { "source": "cap-001", "target": "prj-001", "value": 55, "leakage": 10 }
  ],
  "total_leakage_chain": 45  // CALCULATED: 20 + 15 + 10
}
```

---

### Leakage Detection

**Business Rule:** Leakage > 25% in any chain segment is flagged as "Broken Chain"

**Endpoint:** GET `/api/controls-desk/broken-chains`

**Response:**
```json
{
  "broken_chains": [
    {
      "source": "obj-003",
      "target": "pt-005",
      "leakage_percentage": 32,
      "severity": "high",      // CALCULATED: >25% = high
      "recommendation": "Review policy tool effectiveness"
    }
  ]
}
```

---

## Desk 4: Planning Desk

### Business Purpose
Three planning modes:
1. **Intervention Planning:** In-year tactical adjustments to projects
2. **Strategic Reset:** Annual direction-setting guidance
3. **Scenario Simulation:** What-if analysis

---

### 4.1 Intervention Planning

#### Business Logic
User selects a capability, sees current constraints (load, risk, delays), and can simulate interventions (add/pause/resequence projects).

#### GET `/api/planning-desk/intervention/context/:capability_id`
**Description:** Get intervention planning context for a capability

**Response:**
```json
{
  "capability": {
    "id": "cap-001",
    "name": "Plant Operations",
    "maturity": 3,
    "mode": "BUILD",
    "allowed_load": 3,           // CALCULATED
    "current_load": 5,           // CALCULATED
    "risk_exposure": 68,         // CALCULATED
    "trend": "declining"
  },
  "footprint_stress": {
    "org_gap": "medium",         // DB
    "process_gap": "high",
    "tech_gap": "low"
  },
  "active_risks": [
    {
      "id": "risk-012",
      "name": "Delay – Desalination Plant",
      "affects_policy_tool": "PT-01",
      "tolerance_remaining_days": 18,  // CALCULATED: planned_end - today
      "severity": "high"
    }
  ],
  "active_projects": [
    {
      "id": "prj-015",
      "name": "Riyadh Network Expansion",
      "status": "active",
      "delay_days": 23,          // CALCULATED
      "progress": 68
    }
  ]
}
```

---

#### POST `/api/planning-desk/intervention/simulate`
**Description:** Simulate impact of proposed interventions

**Request:**
```json
{
  "capability_id": "cap-001",
  "interventions": [
    {
      "type": "pause_project",
      "project_id": "prj-015"
    },
    {
      "type": "add_project",
      "project_name": "New Treatment Plant",
      "estimated_duration_months": 12
    }
  ]
}
```

**Response:**
```json
{
  "current_state": {
    "risk_exposure": 68,
    "current_load": 5,
    "delayed_projects": 2
  },
  "simulated_state": {
    "risk_exposure": 56,         // CALCULATED: After simulation
    "current_load": 5,           // 5 - 1 (paused) + 1 (added) = 5
    "delayed_projects": 1,
    "risk_band_change": "RED → AMBER"
  },
  "impact_summary": {
    "load_impact": 0,
    "risk_reduction": -12,
    "delay_reduction_days": -8
  },
  "recommendation": {
    "viable": true,
    "confidence": "medium",
    "notes": "Reduces risk below BUILD threshold"
  }
}
```

**Simulation Logic:**
```javascript
function simulateIntervention(capabilityId, interventions) {
  const current = getCurrentState(capabilityId);
  let simulated = { ...current };
  
  for (const intervention of interventions) {
    switch (intervention.type) {
      case 'pause_project':
        simulated.current_load -= 1;
        simulated.delayed_projects -= 1;  // Assume paused project was delayed
        break;
      case 'add_project':
        simulated.current_load += 1;
        break;
      case 'resequence':
        // No load change, but risk reduction due to better sequencing
        simulated.risk_exposure -= 5;
        break;
    }
  }
  
  // Recalculate risk exposure
  simulated.risk_exposure = calculateRiskExposure({
    current_load: simulated.current_load,
    allowed_load: current.allowed_load,
    delayed_projects: simulated.delayed_projects,
    total_projects: current.total_projects
  });
  
  return { current, simulated };
}
```

---

#### POST `/api/planning-desk/intervention/commit`
**Description:** Apply interventions to actual data (after user approves simulation)

**Request:**
```json
{
  "capability_id": "cap-001",
  "interventions": [ /* same as simulate */ ],
  "approved_by": "user-id-123",
  "notes": "Emergency intervention to reduce RED risk"
}
```

**Response:**
```json
{
  "success": true,
  "updated_projects": ["prj-015"],
  "audit_log_id": "audit-890",
  "control_outcome_id": "outcome-456"  // Creates a record in Reporting Desk
}
```

**Backend Actions:**
1. Update project statuses in DB
2. Recalculate capability metrics
3. Create audit log entry
4. Create Control Outcome record
5. Trigger WebSocket update

---

### 4.2 Strategic Reset

#### Business Purpose
Annual planning mode that provides **guidance recommendations** (not actionable changes). Suggests direction resets based on year-end patterns.

#### GET `/api/planning-desk/strategic-reset/snapshot`
**Description:** Year-end reality snapshot

**Response:**
```json
{
  "year_end_metrics": {
    "capabilities_stabilized": {
      "count": 22,
      "total": 45,
      "percentage": 49         // CALCULATED
    },
    "chronic_risks": {
      "count": 6,              // CALCULATED: Risks present in all 4 quarters
      "details": [
        {
          "capability_id": "cap-003",
          "risk_name": "Desalination Delay",
          "quarters_present": 4
        }
      ]
    },
    "persistent_leakage_chains": {
      "count": 3,              // CALCULATED: Chains with >25% leakage for 3+ quarters
      "details": [
        {
          "source": "obj-003",
          "target": "pt-005",
          "avg_leakage": 32
        }
      ]
    },
    "overbuilt_capabilities": {
      "count": 4,              // CALCULATED: Load utilization < 40% for 3+ quarters
      "details": [
        {
          "capability_id": "cap-012",
          "capability_name": "Legacy Infrastructure",
          "avg_load_util": 28
        }
      ]
    }
  }
}
```

**Calculation Logic:**
```javascript
// Chronic Risks
function getChronicRisks() {
  return db.query(`
    SELECT capability_id, risk_name, COUNT(DISTINCT quarter) as quarters_present
    FROM risks
    WHERE year = YEAR(CURRENT_DATE)
    GROUP BY capability_id, risk_name
    HAVING quarters_present >= 4
  `);
}

// Persistent Leakage Chains
function getPersistentLeakageChains() {
  return db.query(`
    SELECT source_id, target_id, AVG(leakage) as avg_leakage, COUNT(DISTINCT quarter) as quarters
    FROM chain_flows
    WHERE year = YEAR(CURRENT_DATE)
    GROUP BY source_id, target_id
    HAVING avg_leakage > 25 AND quarters >= 3
  `);
}
```

---

#### GET `/api/planning-desk/strategic-reset/patterns`
**Description:** Pattern Explorer - Annual averages by capability

**Response:**
```json
{
  "capability_patterns": [
    {
      "capability_id": "cap-001",
      "capability_name": "Plant Operations",
      "avg_risk_exposure": 72,      // CALCULATED: AVG across 4 quarters
      "avg_leakage_percentage": 18, // CALCULATED
      "avg_load_util": 95,          // CALCULATED
      "policy_pressure": 8,         // CALCULATED: COUNT of policy tools mapped
      "perf_pressure": 12           // CALCULATED: COUNT of performance targets
    }
  ]
}
```

**Calculation:**
```sql
SELECT 
  c.id as capability_id,
  c.name as capability_name,
  AVG(qm.risk_exposure) as avg_risk_exposure,
  AVG(qm.leakage_percentage) as avg_leakage_percentage,
  AVG(qm.load_util) as avg_load_util,
  COUNT(DISTINCT ptc.policy_tool_id) as policy_pressure,
  COUNT(DISTINCT pt.id) as perf_pressure
FROM capabilities c
LEFT JOIN quarterly_metrics qm ON c.id = qm.capability_id
  AND qm.year = YEAR(CURRENT_DATE)
LEFT JOIN policy_tool_capabilities ptc ON c.id = ptc.capability_id
LEFT JOIN performance_targets pt ON c.id = pt.capability_id
GROUP BY c.id, c.name
```

---

#### GET `/api/planning-desk/strategic-reset/recommendations`
**Description:** AI-generated guidance recommendations (not actionable changes)

**Response:**
```json
{
  "objective_consolidation_candidates": [
    {
      "type": "merge",
      "recommendation": "Consider: Merge redundant objectives",
      "details": "3 objectives overlap in scope",
      "affected_objectives": ["obj-002", "obj-007", "obj-011"]
    },
    {
      "type": "drop",
      "recommendation": "Consider: Drop low-impact objectives",
      "details": "2 objectives showing minimal returns",
      "affected_objectives": ["obj-015", "obj-018"]
    }
  ],
  "policy_mix_rebalancing": [
    {
      "recommendation": "Recommend: Add new policy tools",
      "details": "Pricing reform could address leakage",
      "rationale": "Leakage chains in distribution sector average 28%"
    }
  ],
  "direction_reset_proposals": [
    {
      "recommendation": "Guidance: Relax unrealistic targets",
      "details": "Distribution targets unattainable",
      "affected_targets": ["target-008", "target-012"]
    }
  ],
  "capability_intent_recommendations": [
    {
      "capability_id": "cap-001",
      "capability_name": "Plant Operations",
      "current_mode": "BUILD",
      "suggested_mode": "OPERATE",
      "rationale": "Stabilization achieved - risk exposure below 35% for 3 consecutive quarters"
    }
  ]
}
```

**Generation Logic:**
```javascript
// Backend AI/Rules Engine
function generateRecommendations() {
  const recommendations = {
    objective_consolidation_candidates: [],
    policy_mix_rebalancing: [],
    direction_reset_proposals: [],
    capability_intent_recommendations: []
  };
  
  // Example: Capability mode recommendations
  const capabilities = getCapabilities();
  for (const cap of capabilities) {
    const yearAvgRisk = getYearAvgRiskExposure(cap.id);
    const quarters = getQuarterlyMetrics(cap.id);
    
    // Rule: If BUILD mode but risk < 35% for 3+ quarters → suggest OPERATE
    if (cap.mode === 'BUILD' && yearAvgRisk < 35) {
      const lowRiskQuarters = quarters.filter(q => q.risk_exposure < 35).length;
      if (lowRiskQuarters >= 3) {
        recommendations.capability_intent_recommendations.push({
          capability_id: cap.id,
          capability_name: cap.name,
          current_mode: cap.mode,
          suggested_mode: 'OPERATE',
          rationale: 'Stabilization achieved'
        });
      }
    }
  }
  
  return recommendations;
}
```

**Important:** These are **recommendations only** - no database changes occur. User must manually implement via Enterprise Desk.

---

### 4.3 Scenario Simulation

#### Business Purpose
What-if analysis: Change inputs (objective priority, policy tools, capability maturity) and see projected impacts.

#### POST `/api/planning-desk/scenario/simulate`
**Description:** Run scenario simulation

**Request:**
```json
{
  "scenario_name": "Budget Cut Scenario",
  "changes": [
    {
      "type": "change_objective_priority",
      "objective_id": "obj-001",
      "from_priority": "High",
      "to_priority": "Medium"
    },
    {
      "type": "remove_policy_tool",
      "policy_tool_id": "pt-008"
    },
    {
      "type": "shift_capability_maturity",
      "capability_id": "cap-003",
      "from_maturity": 3,
      "to_maturity": 4
    },
    {
      "type": "inject_constraint",
      "constraint": "budget_cut",
      "value": -15  // -15% budget
    }
  ]
}
```

**Response:**
```json
{
  "current_state": {
    "risk_exposure": 68,
    "load_saturation": 95,
    "leakage_percentage": 24,
    "capabilities_entering_red": 6
  },
  "scenario_state": {
    "risk_exposure": 54,          // CALCULATED
    "load_saturation": 78,
    "leakage_percentage": 32,     // Increased due to policy tool removal
    "capabilities_entering_red": 4
  },
  "impact_diff": {
    "risk_exposure_delta": -14,
    "load_saturation_delta": -17,
    "leakage_percentage_delta": 8,
    "capabilities_entering_red_delta": -2
  },
  "verdict": {
    "new_critical_capabilities": ["cap-007", "cap-012"],
    "new_broken_chains": [
      {
        "source": "obj-003",
        "target": "pt-005",
        "leakage": 32
      }
    ],
    "execution_feasibility": "yes",
    "recommendation": "VIABLE",
    "notes": "Scenario reduces critical risks while maintaining delivery capacity. Minor leakage increase is acceptable."
  }
}
```

**Simulation Engine:**
```javascript
function simulateScenario(changes) {
  // Clone current state
  const scenarioState = cloneDeep(getCurrentCompleteState());
  
  // Apply each change
  for (const change of changes) {
    switch (change.type) {
      case 'change_objective_priority':
        scenarioState.objectives.find(o => o.id === change.objective_id).priority = change.to_priority;
        break;
      
      case 'remove_policy_tool':
        // Recalculate chains without this tool
        scenarioState.chains = recalculateChains(
          scenarioState,
          { exclude_policy_tool: change.policy_tool_id }
        );
        break;
      
      case 'shift_capability_maturity':
        const cap = scenarioState.capabilities.find(c => c.id === change.capability_id);
        cap.maturity = change.to_maturity;
        cap.allowed_load = calculateAllowedLoad(change.to_maturity);
        break;
      
      case 'inject_constraint':
        if (change.constraint === 'budget_cut') {
          scenarioState.projects.forEach(p => {
            p.budget *= (1 + change.value / 100);
          });
        }
        break;
    }
  }
  
  // Recalculate all derived metrics
  const scenarioMetrics = calculateAllMetrics(scenarioState);
  const currentMetrics = getCurrentMetrics();
  
  return {
    current_state: currentMetrics,
    scenario_state: scenarioMetrics,
    impact_diff: calculateDiff(currentMetrics, scenarioMetrics),
    verdict: generateVerdict(scenarioMetrics)
  };
}
```

**Important:** Scenario simulations are **temporary** - no DB changes. User can save scenario for later reference.

#### POST `/api/planning-desk/scenario/save`
**Request:**
```json
{
  "scenario_name": "Budget Cut Scenario",
  "changes": [ /* same as simulate */ ],
  "results": { /* simulation results */ },
  "saved_by": "user-id-123"
}
```

**Response:**
```json
{
  "success": true,
  "scenario_id": "scenario-789",
  "created_at": "2026-01-09T14:30:00Z"
}
```

---

## Desk 5: Reporting Desk

### Business Purpose
Two views:
1. **Control Outcomes:** Timeline of past interventions and their results
2. **Standard Reports:** Report builder with live preview, evidence attachments, and audit trails

---

### 5.1 Control Outcomes

#### GET `/api/reporting-desk/control-outcomes`
**Description:** Retrieve all control outcomes with filtering

**Query Parameters:**
- `result_filter`: 'all' | 'success' | 'partial' | 'failed'
- `start_date`: ISO date
- `end_date`: ISO date

**Response:**
```json
{
  "outcomes": [
    {
      "id": "outcome-456",
      "capability_id": "cap-001",
      "capability_name": "Plant Operations",
      "date": "2026-01-05",
      "intervention_type": "Project Pause",
      "result": "success",           // DB: 'success' | 'partial' | 'failed'
      
      // Before state (RETRIEVED from audit log)
      "before_state": {
        "risk_exposure": 68,
        "risk_band": "RED"
      },
      
      // After state (RETRIEVED from audit log)
      "after_state": {
        "risk_exposure": 52,
        "risk_band": "AMBER"
      },
      
      // CALCULATED
      "risk_reduction": -16,         // CALC: after - before
      
      "executed_by": "user-id-123",
      "notes": "Emergency intervention"
    }
  ],
  "summary": {
    "total_outcomes": 24,
    "by_result": {
      "success": 18,                 // CALCULATED
      "partial": 4,
      "failed": 2
    }
  }
}
```

**Data Source:** Created automatically when user commits an intervention via Planning Desk

**Storage:**
```sql
CREATE TABLE control_outcomes (
  id VARCHAR(50) PRIMARY KEY,
  capability_id VARCHAR(50) REFERENCES capabilities(id),
  date DATE,
  intervention_type VARCHAR(100),
  result ENUM('success', 'partial', 'failed'),
  before_state JSON,  -- Snapshot of metrics before intervention
  after_state JSON,   -- Snapshot after intervention (captured 7 days later)
  executed_by VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP
);
```

**Result Determination Logic:**
```javascript
// Automatically calculated 7 days after intervention
async function evaluateOutcomeResult(outcomeId) {
  const outcome = getOutcome(outcomeId);
  const afterState = getCurrentState(outcome.capability_id);
  
  // Update outcome with after_state
  await updateOutcome(outcomeId, { after_state: afterState });
  
  // Determine result
  let result = 'failed';
  const riskReduction = afterState.risk_exposure - outcome.before_state.risk_exposure;
  
  if (riskReduction <= -15) {
    result = 'success';  // Significant improvement
  } else if (riskReduction <= -5) {
    result = 'partial';  // Moderate improvement
  } else {
    result = 'failed';   // No improvement or worsened
  }
  
  await updateOutcome(outcomeId, { result });
  return result;
}
```

---

### 5.2 Standard Reports

#### GET `/api/reporting-desk/standard-reports/templates`
**Description:** Get available report templates

**Response:**
```json
{
  "templates": [
    {
      "id": "tpl-001",
      "type": "Quarterly Review",
      "sections": [
        "executive_summary",
        "capability_status",
        "risk_summary",
        "leakage_analysis",
        "recommendations"
      ]
    },
    {
      "id": "tpl-002",
      "type": "Annual Strategic Report",
      "sections": [
        "year_in_review",
        "pattern_analysis",
        "strategic_recommendations"
      ]
    }
  ]
}
```

---

#### POST `/api/reporting-desk/standard-reports/generate`
**Description:** Generate a report

**Request:**
```json
{
  "report_type": "Quarterly Review",
  "period": "Q4 2025",
  "sections": ["executive_summary", "capability_status", "risk_summary"],
  "filters": {
    "capabilities": ["cap-001", "cap-003"],  // Optional: limit to specific capabilities
    "risk_level": "high"                      // Optional
  }
}
```

**Response:**
```json
{
  "report_id": "rpt-789",
  "status": "draft",
  "data": {
    "executive_summary": {
      "total_capabilities": 45,
      "capabilities_at_risk": 6,            // CALCULATED
      "total_interventions": 8,
      "successful_interventions": 6,
      "key_achievements": [
        "Reduced RED capabilities from 8 to 6"
      ]
    },
    "capability_status": [
      {
        "capability_name": "Plant Operations",
        "mode": "BUILD",
        "risk_exposure": 68,
        "trend": "improving",
        "key_metrics": { /* ... */ }
      }
    ],
    "risk_summary": {
      "by_band": {
        "RED": 6,
        "AMBER": 24,
        "GREEN": 15
      },
      "chronic_risks": [ /* ... */ ]
    }
  },
  "generated_at": "2026-01-09T14:30:00Z",
  "generated_by": "user-id-123"
}
```

**Backend Data Aggregation:**
```javascript
async function generateReport(reportType, period, sections, filters) {
  const data = {};
  
  for (const section of sections) {
    switch (section) {
      case 'executive_summary':
        data.executive_summary = await generateExecutiveSummary(period, filters);
        break;
      
      case 'capability_status':
        data.capability_status = await getCapabilityStatus(period, filters);
        break;
      
      case 'risk_summary':
        data.risk_summary = await getRiskSummary(period, filters);
        break;
      
      // ... more sections
    }
  }
  
  // Save draft report
  const reportId = await saveReport({
    type: reportType,
    period,
    status: 'draft',
    data,
    generated_by: getCurrentUser()
  });
  
  return { report_id: reportId, status: 'draft', data };
}
```

---

#### GET `/api/reporting-desk/standard-reports/:report_id`
**Description:** Retrieve a saved report

**Response:**
```json
{
  "id": "rpt-789",
  "type": "Quarterly Review",
  "period": "Q4 2025",
  "status": "final",
  "data": { /* report data */ },
  "evidence_attachments": [
    {
      "id": "att-001",
      "filename": "plant-operations-metrics.pdf",
      "upload_date": "2026-01-09T15:00:00Z",
      "uploaded_by": "user-id-123"
    }
  ],
  "audit_trail": [
    {
      "action": "created",
      "user": "user-id-123",
      "timestamp": "2026-01-09T14:30:00Z"
    },
    {
      "action": "approved",
      "user": "user-id-456",
      "timestamp": "2026-01-09T16:00:00Z"
    }
  ],
  "generated_at": "2026-01-09T14:30:00Z",
  "generated_by": "user-id-123"
}
```

---

#### POST `/api/reporting-desk/standard-reports/:report_id/evidence`
**Description:** Upload evidence attachment

**Request:** Multipart form data with file

**Response:**
```json
{
  "success": true,
  "attachment_id": "att-001",
  "filename": "plant-operations-metrics.pdf",
  "file_size": 2048576,
  "upload_date": "2026-01-09T15:00:00Z"
}
```

---

#### PATCH `/api/reporting-desk/standard-reports/:report_id/status`
**Description:** Change report status (Draft → Final)

**Request:**
```json
{
  "status": "final",
  "approved_by": "user-id-456",
  "approval_notes": "Approved for distribution"
}
```

**Response:**
```json
{
  "success": true,
  "report": { /* updated report */ },
  "audit_log_id": "audit-901"
}
```

---

## Dashboard Sidebar (KPI Gauges)

### Business Purpose
Right sidebar showing key metrics across 4 tabs (Strategic, Capability, Delivery, Risk & Financial) with hierarchical gauge cards (L1 → L2).

### Data Requirements

#### GET `/api/dashboard/kpi-gauges/:tab`
**Description:** Get KPI data for a specific tab

**Path Parameters:**
- `tab`: 'strategic' | 'capability' | 'delivery' | 'risk-financial'

**Response (Strategic Tab):**
```json
{
  "gauges": [
    {
      "id": "kpi-strategic-001",
      "level": "L1",
      "label": "Objective Achievement",
      "value": 78,                  // CALCULATED: Avg achievement across all objectives
      "target": 85,                 // DB: Strategic target
      "unit": "%",
      "trend": {
        "direction": "up",          // CALCULATED: Compare to Y-1
        "previous_period": 72,      // DB: Last year's value
        "next_period": 82           // CALCULATED: Projected based on trend
      },
      "status": "amber",            // CALCULATED: value vs target
      "sub_gauges": [
        {
          "id": "kpi-strategic-001-sub-1",
          "level": "L2",
          "label": "Water Security",
          "value": 85,
          "target": 90,
          "trend": {
            "previous_period": 80,  // Q-1
            "next_period": 87       // Projected Q+1
          }
        }
      ]
    }
  ]
}
```

**Status Calculation:**
```javascript
function calculateGaugeStatus(value, target) {
  const percentage = (value / target) * 100;
  
  if (percentage >= 100) return 'green';   // On/above target
  if (percentage >= 80) return 'amber';    // Within 20% of target
  return 'red';                             // Below 80% of target
}
```

---

**Response (Capability Tab):**
```json
{
  "gauges": [
    {
      "id": "kpi-capability-001",
      "level": "L1",
      "label": "Capability Maturity Avg",
      "value": 3.2,                // CALCULATED: AVG(maturity) across all L1 capabilities
      "target": 4.0,
      "unit": "",
      "trend": {
        "direction": "up",
        "previous_period": 3.0,    // Y-1
        "next_period": 3.4         // Projected Y+1
      },
      "status": "amber"
    },
    {
      "id": "kpi-capability-002",
      "level": "L1",
      "label": "Load Saturation",
      "value": 82,                 // CALCULATED: AVG(current_load / allowed_load * 100)
      "target": 75,
      "unit": "%",
      "status": "red"              // Over target = red
    }
  ]
}
```

---

**Response (Delivery Tab):**
```json
{
  "gauges": [
    {
      "id": "kpi-delivery-001",
      "level": "L1",
      "label": "On-Time Delivery",
      "value": 68,                 // CALCULATED: % of projects on/ahead of schedule
      "target": 85,
      "unit": "%",
      "trend": {
        "direction": "down",
        "previous_period": 72,
        "next_period": 64          // Projected worsening
      },
      "status": "red"
    },
    {
      "id": "kpi-delivery-002",
      "level": "L1",
      "label": "Project Completion Rate",
      "value": 45,                 // CALCULATED: Completed projects / Total projects * 100
      "target": 60,
      "unit": "%"
    }
  ]
}
```

**On-Time Delivery Calculation:**
```sql
SELECT 
  COUNT(CASE WHEN delay_days <= 0 THEN 1 END) * 100.0 / COUNT(*) as on_time_percentage
FROM projects
WHERE status IN ('active', 'completed')
  AND planned_end >= DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR)
```

---

**Response (Risk & Financial Tab):**
```json
{
  "gauges": [
    {
      "id": "kpi-risk-001",
      "level": "L1",
      "label": "Capabilities in RED",
      "value": 6,                  // CALCULATED: COUNT where risk_exposure >= 65
      "target": 3,                 // DB: Strategic tolerance
      "unit": "count",
      "status": "red"
    },
    {
      "id": "kpi-financial-001",
      "level": "L1",
      "label": "Budget Utilization",
      "value": 87,                 // CALCULATED: Spent / Allocated * 100
      "target": 90,
      "unit": "%",
      "status": "amber"
    }
  ]
}
```

---

### Radar Charts (Tab-Specific)

Each tab has a radar chart showing dimensional breakdown.

#### GET `/api/dashboard/radar-chart/:tab`

**Response (Strategic Tab):**
```json
{
  "dimensions": [
    { "name": "Water Security", "value": 85, "max": 100 },
    { "name": "Infrastructure", "value": 72, "max": 100 },
    { "name": "Sustainability", "value": 68, "max": 100 },
    { "name": "Innovation", "value": 55, "max": 100 },
    { "name": "Governance", "value": 80, "max": 100 }
  ]
}
```

**Data Sources:**
- Strategic: Objective achievement rates
- Capability: Average maturity by capability domain
- Delivery: Project performance by sector
- Risk & Financial: Risk distribution and budget health

---

## API Endpoint Specifications

### Authentication & Authorization

**All endpoints require authentication.**

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
X-User-ID: <user-id-123>
```

**User Roles:**
- `executive`: Read-only access to all desks
- `planner`: Read + Write access to Planning Desk
- `operator`: Read + Write access to Sector Desk, Controls Desk
- `admin`: Full access

---

### Base URL Structure

```
https://api.water-command-center.gov.sa/v1
```

### Endpoint Summary

| Endpoint | Method | Purpose | Auth Level |
|----------|--------|---------|------------|
| `/sector-desk/plants` | GET | Retrieve all plants | All |
| `/sector-desk/pipelines` | GET | Retrieve pipeline flows | All |
| `/enterprise-desk/matrix` | GET | Capability matrix | All |
| `/enterprise-desk/capability/:id/mode` | PATCH | Update capability mode | Planner, Admin |
| `/controls-desk/sankey/:chain_type` | GET | Sankey diagram data | All |
| `/controls-desk/broken-chains` | GET | Identify broken chains | All |
| `/planning-desk/intervention/context/:id` | GET | Intervention context | Planner, Admin |
| `/planning-desk/intervention/simulate` | POST | Simulate intervention | Planner, Admin |
| `/planning-desk/intervention/commit` | POST | Apply intervention | Admin |
| `/planning-desk/strategic-reset/snapshot` | GET | Year-end snapshot | All |
| `/planning-desk/strategic-reset/patterns` | GET | Capability patterns | All |
| `/planning-desk/strategic-reset/recommendations` | GET | AI recommendations | All |
| `/planning-desk/scenario/simulate` | POST | Run scenario | Planner, Admin |
| `/planning-desk/scenario/save` | POST | Save scenario | Planner, Admin |
| `/reporting-desk/control-outcomes` | GET | Control outcomes | All |
| `/reporting-desk/standard-reports/templates` | GET | Report templates | All |
| `/reporting-desk/standard-reports/generate` | POST | Generate report | Planner, Admin |
| `/reporting-desk/standard-reports/:id` | GET | Retrieve report | All |
| `/reporting-desk/standard-reports/:id/evidence` | POST | Upload evidence | Planner, Admin |
| `/reporting-desk/standard-reports/:id/status` | PATCH | Change report status | Admin |
| `/dashboard/kpi-gauges/:tab` | GET | KPI gauge data | All |
| `/dashboard/radar-chart/:tab` | GET | Radar chart data | All |

---

### Response Format Standards

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "metadata": {
    "timestamp": "2026-01-09T14:30:00Z",
    "request_id": "req-abc123"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid capability_id",
    "details": {
      "field": "capability_id",
      "value": "invalid-id"
    }
  },
  "metadata": {
    "timestamp": "2026-01-09T14:30:00Z",
    "request_id": "req-abc123"
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication failed
- `FORBIDDEN`: Insufficient permissions
- `CALCULATION_ERROR`: Backend calculation failed
- `DATABASE_ERROR`: Database operation failed

---

## Calculation Engine Specifications

### Risk Exposure Calculation

**Formula:**
```
risk_exposure = (load_utilization * 0.6) + (delay_factor * 0.4)

Where:
- load_utilization = (current_load / allowed_load) * 100
- delay_factor = (delayed_projects / total_projects) * 100
```

**Implementation:**
```javascript
function calculateRiskExposure(capabilityId) {
  const capability = getCapability(capabilityId);
  const projects = getActiveProjects(capabilityId);
  
  const loadUtil = (capability.current_load / capability.allowed_load) * 100;
  const delayedCount = projects.filter(p => p.delay_days > 0).length;
  const delayFactor = (delayedCount / projects.length) * 100;
  
  const riskScore = (loadUtil * 0.6) + (delayFactor * 0.4);
  
  return Math.min(100, Math.round(riskScore));
}
```

---

### Leakage Calculation

**Formula:**
```
leakage_percentage = ((intent_in - intent_out) / intent_in) * 100
```

**Chain-Level:**
```javascript
function calculateChainLeakage(sourceId, targetId, chainType) {
  const links = getLinks(sourceId, targetId, chainType);
  
  const totalIntentIn = links.reduce((sum, link) => sum + link.value, 0);
  const totalIntentOut = getTotalFlowingOut(targetId, chainType);
  
  const leakage = totalIntentIn - totalIntentOut;
  const leakagePercentage = (leakage / totalIntentIn) * 100;
  
  return Math.round(leakagePercentage);
}
```

---

### Allowed Load Calculation

**Formula:**
```
allowed_load = maturity_factor[maturity_level]

Maturity Factors:
1 → 1 project
2 → 2 projects
3 → 3 projects
4 → 5 projects
5 → 8 projects
```

**Justification:** Higher maturity = more capacity to handle concurrent projects

---

### Trend Calculation

**Logic:**
```javascript
function calculateTrend(currentValue, previousValue, threshold = 10) {
  const delta = currentValue - previousValue;
  
  if (delta > threshold) return 'improving';    // Significant increase
  if (delta < -threshold) return 'declining';   // Significant decrease
  return 'stable';                              // Minimal change
}
```

**Period Comparison:**
- L1 Gauges: Compare Year-over-Year (Y vs Y-1)
- L2 Gauges: Compare Quarter-over-Quarter (Q vs Q-1)
- Capabilities: Compare Quarter-over-Quarter

---

### Projection Calculation

**Formula (Simple Linear Projection):**
```javascript
function projectNextPeriod(currentValue, previousValue) {
  const delta = currentValue - previousValue;
  const projectedValue = currentValue + delta;
  
  // Clamp to reasonable bounds (0-100 for percentages)
  return Math.max(0, Math.min(100, Math.round(projectedValue)));
}
```

**Example:**
- Y-1: 72%
- Y (current): 78%
- Delta: +6%
- Y+1 (projected): 78% + 6% = 84%

---

## Real-time Update Requirements

### WebSocket Events

**Connection:**
```javascript
ws://api.water-command-center.gov.sa/v1/ws?token=<JWT_TOKEN>
```

**Events to Emit:**

#### 1. Capability Mode Changed
```json
{
  "event": "capability_mode_changed",
  "data": {
    "capability_id": "cap-001",
    "old_mode": "BUILD",
    "new_mode": "OPERATE",
    "changed_by": "user-id-123",
    "timestamp": "2026-01-09T14:30:00Z"
  }
}
```

**Frontend Action:** Refresh Enterprise Desk matrix

---

#### 2. Risk Band Changed
```json
{
  "event": "risk_band_changed",
  "data": {
    "capability_id": "cap-003",
    "old_band": "AMBER",
    "new_band": "RED",
    "risk_exposure": 68,
    "timestamp": "2026-01-09T14:30:00Z"
  }
}
```

**Frontend Action:** Update dashboard gauges, show alert notification

---

#### 3. Intervention Committed
```json
{
  "event": "intervention_committed",
  "data": {
    "capability_id": "cap-001",
    "intervention_type": "pause_project",
    "project_id": "prj-015",
    "outcome_id": "outcome-456",
    "committed_by": "user-id-123",
    "timestamp": "2026-01-09T14:30:00Z"
  }
}
```

**Frontend Action:** Refresh Planning Desk, add to Control Outcomes timeline

---

#### 4. Report Generated
```json
{
  "event": "report_generated",
  "data": {
    "report_id": "rpt-789",
    "report_type": "Quarterly Review",
    "period": "Q4 2025",
    "generated_by": "user-id-123",
    "timestamp": "2026-01-09T14:30:00Z"
  }
}
```

**Frontend Action:** Refresh Reporting Desk, show notification

---

### Polling Fallback

If WebSocket not available, implement polling:

**Endpoint:** GET `/api/updates/poll?since=<timestamp>`

**Response:**
```json
{
  "updates": [
    {
      "type": "capability_mode_changed",
      "data": { /* ... */ },
      "timestamp": "2026-01-09T14:30:00Z"
    }
  ],
  "next_poll_after": "2026-01-09T14:30:30Z"
}
```

**Polling Interval:** 30 seconds

---

## Database Schema Summary

### Tables Required

```sql
-- Core Entities
CREATE TABLE plants ( /* see Plant interface */ );
CREATE TABLE capabilities ( /* see Capability interface */ );
CREATE TABLE objectives ( /* see Objective interface */ );
CREATE TABLE policy_tools ( /* see PolicyTool interface */ );
CREATE TABLE projects ( /* see Project interface */ );
CREATE TABLE performance_targets ( /* see PerformanceTarget interface */ );

-- Relationships
CREATE TABLE objective_policy_tools ( /* many-to-many */ );
CREATE TABLE policy_tool_capabilities ( /* many-to-many */ );

-- Historical Metrics (for trends)
CREATE TABLE quarterly_metrics (
  id VARCHAR(50) PRIMARY KEY,
  capability_id VARCHAR(50) REFERENCES capabilities(id),
  year INT,
  quarter INT,  -- 1, 2, 3, 4
  risk_exposure DECIMAL(5,2),
  load_util DECIMAL(5,2),
  leakage_percentage DECIMAL(5,2),
  created_at TIMESTAMP
);

-- Audit & Reporting
CREATE TABLE control_outcomes ( /* see Control Outcomes section */ );
CREATE TABLE standard_reports (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(100),
  period VARCHAR(50),
  status ENUM('draft', 'final'),
  data JSON,
  generated_by VARCHAR(50),
  generated_at TIMESTAMP
);

CREATE TABLE report_evidence_attachments (
  id VARCHAR(50) PRIMARY KEY,
  report_id VARCHAR(50) REFERENCES standard_reports(id),
  filename VARCHAR(255),
  file_path VARCHAR(500),
  file_size BIGINT,
  uploaded_by VARCHAR(50),
  upload_date TIMESTAMP
);

CREATE TABLE audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  entity_type VARCHAR(50),  -- 'capability', 'project', 'report', etc.
  entity_id VARCHAR(50),
  action VARCHAR(50),       -- 'created', 'updated', 'deleted', 'approved'
  user_id VARCHAR(50),
  changes JSON,             -- Before/after snapshot
  timestamp TIMESTAMP
);

-- Scenario Simulations (saved)
CREATE TABLE saved_scenarios (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  changes JSON,
  results JSON,
  saved_by VARCHAR(50),
  created_at TIMESTAMP
);
```

---

## Performance Considerations

### Caching Strategy

**Cache Heavily Used Calculations:**
- Capability risk exposures (cache for 5 minutes)
- Dashboard KPI values (cache for 2 minutes)
- Sankey chain flows (cache for 10 minutes)

**Cache Invalidation:**
- On capability mode change
- On project status change
- On intervention commit

**Implementation:**
```javascript
// Redis example
async function getRiskExposure(capabilityId) {
  const cacheKey = `risk_exposure:${capabilityId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const calculated = calculateRiskExposure(capabilityId);
  await redis.setex(cacheKey, 300, JSON.stringify(calculated));  // 5 min TTL
  
  return calculated;
}
```

---

### Database Indexing

**Critical Indexes:**
```sql
CREATE INDEX idx_projects_capability_status ON projects(capability_id, status);
CREATE INDEX idx_quarterly_metrics_capability_period ON quarterly_metrics(capability_id, year, quarter);
CREATE INDEX idx_control_outcomes_date ON control_outcomes(date DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, timestamp DESC);
```

---

### Pagination

**Large datasets must be paginated:**

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 200)

**Response:**
```json
{
  "data": [ /* items */ ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 234,
    "items_per_page": 50
  }
}
```

---

## Testing Requirements

### Data Validation

**All endpoints must validate:**
- Required fields present
- Data types correct
- Foreign keys exist
- Enum values valid
- Numeric ranges (e.g., maturity 1-5)

**Example:**
```javascript
function validateCapabilityModeChange(data) {
  if (!data.mode) throw new ValidationError('mode is required');
  if (!['BUILD', 'OPERATE', 'HOLD', 'DECOMMISSION'].includes(data.mode)) {
    throw new ValidationError('Invalid mode value');
  }
  if (!data.reason || data.reason.length < 10) {
    throw new ValidationError('reason must be at least 10 characters');
  }
}
```

---

### Calculation Testing

**Create unit tests for all calculation functions:**

**Example Test Cases:**
```javascript
describe('calculateRiskExposure', () => {
  it('should return 100 when load util is 100 and all projects delayed', () => {
    const result = calculateRiskExposure({
      current_load: 5,
      allowed_load: 5,
      projects: [
        { delay_days: 10 },
        { delay_days: 5 },
        { delay_days: 3 }
      ]
    });
    expect(result).toBe(100);
  });
  
  it('should return 0 when load util is 0 and no delays', () => {
    const result = calculateRiskExposure({
      current_load: 0,
      allowed_load: 5,
      projects: []
    });
    expect(result).toBe(0);
  });
});
```

---

## Edge Cases & Business Rules

### Capability Mode Changes

**Rule:** Cannot change directly from DECOMMISSION to BUILD  
**Reason:** Decommissioned capabilities need assessment before reactivation  
**Validation:**
```javascript
if (currentMode === 'DECOMMISSION' && newMode === 'BUILD') {
  throw new BusinessRuleError('Cannot change from DECOMMISSION to BUILD directly. Must go through HOLD first.');
}
```

---

### Project Load Constraints

**Rule:** Cannot add project if current_load >= allowed_load  
**Exception:** Admin users can override with justification  
**Validation:**
```javascript
if (capability.current_load >= capability.allowed_load && !user.isAdmin()) {
  throw new BusinessRuleError('Capability at maximum load. Increase maturity or pause existing projects.');
}
```

---

### Report Finalization

**Rule:** Cannot edit report after status = 'final'  
**Exception:** Admin can revert to draft with audit trail  
**Validation:**
```javascript
if (report.status === 'final' && !user.isAdmin()) {
  throw new BusinessRuleError('Cannot modify finalized report');
}
```

---

### Risk Band Thresholds

**Rule:** Risk bands are fixed:  
- RED: >= 65%  
- AMBER: 35% - 64%  
- GREEN: < 35%  

**No exceptions** - these are strategic governance thresholds

---

### Leakage Threshold

**Rule:** Leakage > 25% = "Broken Chain"  
**Action:** Automatic flagging in Controls Desk  
**Notification:** Send alert to planners

---

## Deployment Notes

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=water_command_center
DB_USER=wcc_app
DB_PASSWORD=<secure_password>

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Authentication
JWT_SECRET=<secure_secret>
JWT_EXPIRY=24h

# WebSocket
WS_PORT=8080

# API
API_PORT=3000
API_BASE_URL=https://api.water-command-center.gov.sa/v1

# Feature Flags
ENABLE_WEBSOCKETS=true
ENABLE_SCENARIO_SIMULATION=true
```

---

### Migration Strategy

**Phase 1: Core Data (Week 1)**
- Set up database schema
- Migrate plant data
- Migrate capability hierarchy

**Phase 2: Relationships (Week 2)**
- Import objectives and policy tools
- Map relationships (objectives ↔ tools ↔ capabilities)

**Phase 3: Historical Data (Week 3)**
- Import quarterly metrics (past 2 years)
- Calculate initial risk exposures

**Phase 4: API Development (Weeks 4-6)**
- Implement read endpoints
- Implement calculation engine
- Implement write endpoints

**Phase 5: Real-time & Testing (Week 7)**
- Set up WebSocket server
- End-to-end testing
- Load testing

**Phase 6: Deployment (Week 8)**
- Staging deployment
- User acceptance testing
- Production deployment

---

## Support & Questions

**Technical Lead:** [Your Name]  
**Email:** [technical-lead@example.com]  
**Documentation Version:** 1.0  
**Last Updated:** January 9, 2026

---

## Appendix: Sample Data

### Sample Plant
```json
{
  "id": "plant-001",
  "name": "Ras Al-Khair Desalination Plant",
  "type": "desalination",
  "coordinates": { "latitude": 27.8167, "longitude": 50.1750 },
  "capacity": { "value": 1025000, "unit": "m³/day" },
  "sectors": { "agriculture": 35, "industry": 25, "urban": 40 },
  "performance": { "efficiency": 94, "uptime": 98, "waterQuality": 92 }
}
```

### Sample Capability
```json
{
  "id": "cap-001",
  "name": "Plant Operations",
  "level": "L1",
  "parent_id": null,
  "maturity": 3,
  "mode": "BUILD",
  "allowed_load": 3,
  "current_load": 5,
  "risk_exposure": 68
}
```

### Sample Objective → Policy Tool Link
```json
{
  "objective_id": "obj-001",
  "policy_tool_id": "pt-003",
  "intent_strength": 78
}
```

### Sample Control Outcome
```json
{
  "id": "outcome-456",
  "capability_id": "cap-001",
  "date": "2026-01-05",
  "intervention_type": "Project Pause",
  "result": "success",
  "before_state": { "risk_exposure": 68, "risk_band": "RED" },
  "after_state": { "risk_exposure": 52, "risk_band": "AMBER" },
  "risk_reduction": -16
}
```

---

**END OF DOCUMENTATION**
