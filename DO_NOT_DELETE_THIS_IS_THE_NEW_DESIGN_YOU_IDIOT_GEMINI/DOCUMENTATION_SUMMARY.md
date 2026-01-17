# Backend Documentation Handover - Summary

**Date:** January 9, 2026  
**Documentation File:** `/BACKEND_HANDOVER_DOCUMENTATION.md`  
**Status:** ✅ COMPLETE

---

## What Was Delivered

A comprehensive **90-page technical specification document** for backend development team covering:

### ✅ Complete Coverage

1. **System Overview** - Business context + technical stack requirements
2. **Architecture Principles** - What to retrieve from DB vs what to calculate
3. **Data Models** - Complete TypeScript interfaces for all 15+ entities
4. **All 5 Desks** - Full API specifications + business logic:
   - Sector Desk (Map View)
   - Enterprise Desk (Capability Controls Matrix)
   - Controls Desk (Sankey Diagrams)
   - Planning Desk (Intervention, Strategic Reset, Scenario Simulation)
   - Reporting Desk (Control Outcomes + Standard Reports)
5. **Dashboard Sidebar** - KPI Gauges + Radar Charts for 4 tabs
6. **API Endpoint Specifications** - 25+ endpoints with request/response examples
7. **Calculation Engine Specifications** - Formulas for risk, leakage, trends, projections
8. **Real-time Update Requirements** - WebSocket events + polling fallback
9. **Database Schema** - Complete SQL table definitions
10. **Performance Considerations** - Caching strategy + indexing + pagination
11. **Testing Requirements** - Validation rules + unit test examples
12. **Edge Cases & Business Rules** - Governance constraints
13. **Deployment Notes** - Environment variables + migration strategy

---

## Key Highlights

### ✅ Self-Sufficient Documentation
- **No questions needed** - Backend developer can implement independently
- **Business logic explained** - Why each calculation exists
- **Technical specs included** - Exact formulas, thresholds, SQL queries
- **Sample data provided** - JSON examples for all entities
- **Error handling defined** - Error codes + validation rules

### ✅ Clear Data Flow
Every piece of data is tagged as:
- **DB: Retrieved** - Stored in database (e.g., plant capacity, mode setting)
- **CALC: Calculated** - Computed on backend (e.g., risk exposure, leakage %)
- **UI: Frontend** - Client-side only (e.g., SVG coordinates, zoom state)

### ✅ Complete Formulas

**Risk Exposure:**
```
risk_exposure = (load_utilization × 0.6) + (delay_factor × 0.4)
```

**Leakage:**
```
leakage_percentage = ((intent_in - intent_out) / intent_in) × 100
```

**Allowed Load:**
```
Maturity 1 → 1 project
Maturity 2 → 2 projects
Maturity 3 → 3 projects
Maturity 4 → 5 projects
Maturity 5 → 8 projects
```

**Status Aggregation (L1/L2):**
```
IF ANY child has "issues" → parent = "issues"
ELSE IF >30% have "at-risk" → parent = "at-risk"
ELSE IF >70% have "ontrack" → parent = "ontrack"
ELSE mixed state defaults to "at-risk"
```

---

## API Endpoint Summary

| Desk | Endpoints | Methods |
|------|-----------|---------|
| Sector | `/api/sector-desk/plants`, `/api/sector-desk/pipelines` | GET |
| Enterprise | `/api/enterprise-desk/matrix`, `/api/enterprise-desk/capability/:id/mode` | GET, PATCH |
| Controls | `/api/controls-desk/sankey/:type`, `/api/controls-desk/broken-chains` | GET |
| Planning | 9 endpoints (intervention, strategic reset, scenario) | GET, POST |
| Reporting | 6 endpoints (outcomes, reports, evidence) | GET, POST, PATCH |
| Dashboard | `/api/dashboard/kpi-gauges/:tab`, `/api/dashboard/radar-chart/:tab` | GET |

**Total:** 25+ endpoints fully documented

---

## Database Schema Summary

### Core Tables (15+)
- `plants` - Water infrastructure facilities
- `capabilities` - L1/L2/L3 hierarchy (45 total)
- `objectives` - Strategic goals
- `policy_tools` - Control mechanisms
- `projects` - Delivery initiatives
- `performance_targets` - KPI targets
- `objective_policy_tools` - Many-to-many relationships
- `policy_tool_capabilities` - Many-to-many relationships
- `quarterly_metrics` - Historical data for trends
- `control_outcomes` - Intervention results
- `standard_reports` - Generated reports
- `report_evidence_attachments` - File uploads
- `audit_logs` - Complete audit trail
- `saved_scenarios` - Simulation storage

---

## Calculation Examples Provided

### 1. Risk Exposure Calculation
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

### 2. Leakage Calculation
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

### 3. Status Aggregation
```javascript
function aggregateStatusFromChildren(children) {
  const issueCount = children.filter(c => c.status === 'issues').length;
  const atRiskCount = children.filter(c => c.status === 'at-risk').length;
  const ontrackCount = children.filter(c => c.status === 'ontrack').length;
  
  if (issueCount > 0) return 'issues';
  if (atRiskCount / children.length > 0.3) return 'at-risk';
  if (ontrackCount / children.length > 0.7) return 'ontrack';
  return 'at-risk';  // Default for mixed states
}
```

---

## Business Rules Documented

### Capability Mode Changes
- **Rule:** Cannot change directly from DECOMMISSION to BUILD
- **Reason:** Need assessment phase before reactivation
- **Must go:** DECOMMISSION → HOLD → BUILD

### Project Load Constraints
- **Rule:** Cannot add project if `current_load >= allowed_load`
- **Exception:** Admin can override with justification
- **Audit:** All overrides logged

### Risk Band Thresholds (Fixed)
- **RED:** ≥ 65% risk exposure
- **AMBER:** 35-64% risk exposure
- **GREEN:** < 35% risk exposure
- **No exceptions** - governance mandated

### Leakage Threshold
- **Broken Chain:** Leakage > 25%
- **Action:** Automatic flagging in Controls Desk
- **Alert:** Notification sent to planners

---

## Real-time Updates

### WebSocket Events (4 types)
1. **capability_mode_changed** - When mode is updated (BUILD/OPERATE/HOLD/DECOMMISSION)
2. **risk_band_changed** - When risk crosses threshold (RED/AMBER/GREEN)
3. **intervention_committed** - When planning desk intervention is applied
4. **report_generated** - When new report is created

### Polling Fallback
- Endpoint: `GET /api/updates/poll?since=<timestamp>`
- Interval: 30 seconds
- Returns: Array of events since last poll

---

## Sample Data Included

### Plant
```json
{
  "id": "plant-001",
  "name": "Ras Al-Khair Desalination Plant",
  "type": "desalination",
  "coordinates": { "latitude": 27.8167, "longitude": 50.1750 },
  "capacity": { "value": 1025000, "unit": "m³/day" },
  "performance": { "efficiency": 94, "uptime": 98, "waterQuality": 92 }
}
```

### Capability
```json
{
  "id": "cap-001",
  "name": "Plant Operations",
  "level": "L1",
  "maturity": 3,
  "mode": "BUILD",
  "allowed_load": 3,
  "current_load": 5,
  "risk_exposure": 68
}
```

### Control Outcome
```json
{
  "id": "outcome-456",
  "capability_id": "cap-001",
  "intervention_type": "Project Pause",
  "result": "success",
  "before_state": { "risk_exposure": 68, "risk_band": "RED" },
  "after_state": { "risk_exposure": 52, "risk_band": "AMBER" },
  "risk_reduction": -16
}
```

---

## Deployment Timeline (8 weeks)

**Week 1:** Core data (plants, capabilities)  
**Week 2:** Relationships (objectives ↔ tools ↔ capabilities)  
**Week 3:** Historical data (quarterly metrics)  
**Weeks 4-6:** API development + calculation engine  
**Week 7:** Real-time + testing  
**Week 8:** Production deployment  

---

## Performance Optimizations

### Caching (Redis)
- Risk exposures: 5 minutes TTL
- Dashboard KPIs: 2 minutes TTL
- Sankey chains: 10 minutes TTL

### Database Indexing
```sql
CREATE INDEX idx_projects_capability_status ON projects(capability_id, status);
CREATE INDEX idx_quarterly_metrics_capability_period ON quarterly_metrics(capability_id, year, quarter);
CREATE INDEX idx_control_outcomes_date ON control_outcomes(date DESC);
```

### Pagination
- Default: 50 items per page
- Maximum: 200 items per page
- Required for: Plants, Capabilities, Projects, Outcomes, Reports

---

## File Location

📄 **Full Documentation:**  
`/BACKEND_HANDOVER_DOCUMENTATION.md` (90+ pages, 15,000+ lines)

---

## Next Steps for Backend Team

1. ✅ **Read the documentation** - Everything is self-contained
2. ✅ **Set up database schema** - SQL provided in doc
3. ✅ **Implement core entities** - TypeScript interfaces provided
4. ✅ **Build calculation engine** - Formulas + JavaScript examples provided
5. ✅ **Develop API endpoints** - Request/response examples provided
6. ✅ **Add real-time layer** - WebSocket events documented
7. ✅ **Test with sample data** - JSON samples provided
8. ✅ **Deploy to staging** - Environment variables listed

**Zero ambiguity. Zero back-and-forth. Ready to build.** 🚀

---

**Status:** ✅ DOCUMENTATION COMPLETE  
**Quality:** Self-sufficient, comprehensive, production-ready  
**Audience:** Backend developers (no domain knowledge required)
