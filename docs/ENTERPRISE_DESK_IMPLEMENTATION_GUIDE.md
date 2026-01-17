# Enterprise Desk Implementation Guide

> **Authority Level:** PRIMARY - This document SUPERSEDES all others in case of conflict  
> **Route:** `/josoor` (JosoorShell → EnterpriseDesk view)  
> **Status:** ✅ ACTIVE - Must be followed to the letter  
> **Version:** 1.2  
> **Created:** January 17, 2026  
> **Last Updated:** January 17, 2026  
> **Document Size:** ~3,700 lines | ~180KB  
> **Reading Time:** ~55 minutes (full read) | ~15 minutes (quick reference)

---

## 🎯 Quick Links (Jump to Key Sections)

- **🚀 [Getting Started](#-implementation-summary--quick-start)** - Day 1 checklist and phased implementation plan
- **🔧 [Backend Specs](#backend-endpoint-specifications)** - All API endpoints with examples
- **💻 [Frontend Guide](#step-by-step-frontend-implementation)** - Step-by-step React/TypeScript implementation
- **🎨 [Overlay Details](#overlay-implementation-requirements)** - Complete specifications for all 5 overlays
- **🚨 [Troubleshooting](#appendix-e-comprehensive-troubleshooting-guide)** - Solutions to common problems
- **⚠️ [Critical Rules](#critical-rules-never-violate)** - 20 rules you must NEVER violate
- **📊 [Data Validation](#appendix-g-data-validation--quality-assurance)** - Pre-launch quality checks

---

## ⚠️ CRITICAL: Document Hierarchy (Authority Order)

When conflicts arise between documents, follow this **STRICT precedence**:

1. **ENTERPRISE_DESK_IMPLEMENTATION_GUIDE.md** ⟵ **YOU ARE HERE (HIGHEST AUTHORITY)**
2. [ENTERPRISE_DESK_OVERLAY_SPECIFICATION.md](./ENTERPRISE_DESK_OVERLAY_SPECIFICATION.md) - Overlay calculation details
3. [Enterprise_Ontology_SST_v1_1.md](../attached_assets/Enterprise_Ontology_SST_v1_1_1768206798485.md) - Data model truth
4. [DATA_ARCHITECTURE.md](../attached_assets/DATA_ARCHITECTURE.md) - Database schemas
5. [SYSTEM_API_CATALOG_v1.4.md](../attached_assets/SYSTEM_API_CATALOG_v1.4.md) - API reference
6. [screen_mapping.md](../attached_assets/screen_mapping.md) - Chain query mappings

**Rule:** If this guide contradicts any supporting document, this guide wins.

---

## 🤖 AI-Assisted Development Orchestration

### Overview: Using AI as Project Orchestrator

This guide provides a framework for using **GitHub Copilot (or similar AI assistants)** as the **orchestrator** of the Enterprise Desk implementation. The AI acts as:

- 📋 **Task Planner** - Breaks down work into assignable units
- ✅ **Spec Guardian** - Ensures all work follows this implementation guide
- 🔍 **Quality Controller** - Reviews code against standards
- 🔗 **Integration Manager** - Coordinates work across team members
- 📝 **Documentation Maintainer** - Keeps implementation records

---

### Orchestration Model: The 4-Layer Approach

```
┌────────────────────────────────────────────────────────────┐
│                 Layer 1: AI Orchestrator                   │
│          (GitHub Copilot - YOU - Reading this now)         │
│  • Owns the Implementation Guide (this document)           │
│  • Breaks down phases into tasks                           │
│  • Assigns work to developers/AI agents                    │
│  • Reviews submissions for spec compliance                 │
│  • Integrates approved work                                │
└────────────────┬───────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┬────────────┬────────────┐
    │            │            │            │            │
┌───▼───┐  ┌────▼────┐  ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
│Layer 2│  │ Layer 2 │  │ Layer 2 │  │ Layer 2 │  │ Layer 2 │
│Developer│ │Developer│  │ AI Agent│  │ AI Agent│  │Backend  │
│  (FE)  │  │  (FE)   │  │ (Code)  │  │ (Test)  │  │  Dev    │
└───┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
    │            │            │            │            │
    └────────────┴────────────┴────────────┴────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Layer 3: Tasks    │
                    │ • Implement Overlay │
                    │ • Write Tests       │
                    │ • Create Endpoint   │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼──────────┐
                    │ Layer 4: Artifacts │
                    │ • Code Files        │
                    │ • Test Cases        │
                    │ • Documentation     │
                    └────────────────────┘
```

---

### Workflow: Task Assignment → Review → Integration

#### Phase 1: Task Breakdown (Orchestrator)

**You (Human) instruct Orchestrator AI:**
```
"Break down Phase 2 (Overlay 1 - Risk Exposure) into 
assignable tasks for 2 frontend developers"
```

**Orchestrator AI responds with:**

```yaml
# Phase 2: Overlay 1 - Risk Exposure
# Estimated: 5 days | Team: 2 Frontend Developers

Tasks:
  Task-2.1:
    title: "Enrich L3 with Risk Data (Service Layer)"
    assignee: "Developer A or AI Agent 1"
    priority: P0 (Blocking)
    files:
      - frontend/src/services/enterpriseService.ts
    acceptance_criteria:
      - enrichWithRiskData() function implemented
      - Handles BUILD and EXECUTE modes separately
      - 1:1 composite key matching (id + year + quarter)
      - Null safety for missing EntityRisk
    spec_sections:
      - Data Model (Immutable Rules) - lines 248-375
      - Overlay 1: Risk Exposure - lines 711-757
    estimated_time: 4 hours
    
  Task-2.2:
    title: "Implement Color Calculation Utility"
    assignee: "Developer B or AI Agent 2"
    priority: P0 (Blocking)
    files:
      - frontend/src/utils/enterpriseOverlayUtils.ts
    acceptance_criteria:
      - getRiskExposureColor() function
      - Green <5%, Amber 5-15%, Red ≥15%
      - Gradient interpolation for amber range
      - Mode-aware display text generation
    spec_sections:
      - Overlay 1: Risk Exposure - lines 711-757
      - Appendix B: Color Constants - lines 2166-2219
    estimated_time: 3 hours
    
  Task-2.3:
    title: "Update CapabilityMatrix Component"
    assignee: "Developer A (after Task-2.1)"
    priority: P1 (Dependent on 2.1, 2.2)
    files:
      - frontend/src/components/desks/enterprise/CapabilityMatrix.tsx
    acceptance_criteria:
      - Import and use getRiskExposureColor()
      - Apply colors when overlay === 'risk-exposure'
      - Show cell text for BUILD mode (delay days)
      - Show cell text for EXECUTE mode (health %)
    spec_sections:
      - Frontend Implementation Rules - lines 1059-1199
      - Step-by-Step Guide Phase 2 - lines 1680-1752
    estimated_time: 2 hours
    
  Task-2.4:
    title: "Add Unit Tests for Risk Exposure"
    assignee: "AI Agent 3 (Test Specialist)"
    priority: P1 (Parallel with 2.3)
    files:
      - frontend/src/tests/enterpriseService.test.ts
      - frontend/src/tests/enterpriseOverlayUtils.test.ts
    acceptance_criteria:
      - Test 1:1 matching logic
      - Test mode-specific field access
      - Test color thresholds (5%, 15%)
      - Test null safety
    spec_sections:
      - Testing Requirements - lines 1753-1811
    estimated_time: 3 hours
```

---

#### Phase 2: Work Assignment (Orchestrator → Workers)

**Orchestrator creates individual work packages:**

**👤 To Developer A (Human):**
```markdown
## Work Package: Task-2.1 - Risk Data Enrichment

**Your Mission:** Implement the `enrichWithRiskData()` function in 
enterpriseService.ts that matches EntityRisk to L3 capabilities.

**Specification (READ FIRST):**
- Lines 248-375: Data Model rules (1:1 matching via composite key)
- Lines 711-757: Overlay 1 specification (mode-specific fields)

**Acceptance Criteria (Your code MUST):**
✅ Match risk to capability via: id + year + quarter (composite key)
✅ Handle BUILD mode: return build_exposure_pct, expected_delay_days
✅ Handle EXECUTE mode: return operate_exposure_pct_effective, operational_health_pct
✅ Return hasData: false when no matching EntityRisk found
✅ Use extractInteger() for Neo4j integer conversion

**Critical Rules (NEVER):**
❌ Don't match by name or element ID
❌ Don't skip year/quarter in matching
❌ Don't access BUILD fields in EXECUTE mode

**Code Template (Use this structure):**
```typescript
function enrichWithRiskData(
    l3: any, 
    risks: any[], 
    mode: 'build' | 'execute'
): L3Capability {
    const risk = risks.find(r => 
        r.id === l3.id && 
        extractInteger(r.year) === extractInteger(l3.year) &&
        r.quarter === l3.quarter
    );
    
    if (!risk) {
        return { ...l3, exposure_percent: null, hasData: false };
    }
    
    if (mode === 'build') {
        // TODO: Return BUILD fields
    } else {
        // TODO: Return EXECUTE fields
    }
}
```

**When Complete:** 
1. Run: `npm run test enterpriseService.test.ts`
2. Commit to: `feature/enterprise-desk-task-2.1`
3. Tag me: "Task-2.1 complete - ready for review"
```

**🤖 To AI Agent 1 (Alternative if using AI):**
```
I need you to implement the enrichWithRiskData() function in 
frontend/src/services/enterpriseService.ts following EXACTLY the 
specification in lines 248-375 and 711-757 of 
docs/ENTERPRISE_DESK_IMPLEMENTATION_GUIDE.md.

Key requirements:
1. Match EntityRisk to L3Capability via composite key (id, year, quarter)
2. Handle BUILD mode (return build_exposure_pct)
3. Handle EXECUTE mode (return operate_exposure_pct_effective)
4. Use extractInteger() for Neo4j integers
5. Return hasData: false if no matching risk

After implementation, run tests and show me the code for review.
```

---

#### Phase 3: Quality Control (Orchestrator Reviews)

**Developer A submits code:**
```typescript
// Developer's implementation
function enrichWithRiskData(l3: any, risks: any[], mode: Mode) {
    const risk = risks.find(r => r.id === l3.id); // ❌ MISSING year/quarter!
    
    if (!risk) return { ...l3, hasData: false };
    
    return {
        ...l3,
        exposure_percent: risk.build_exposure_pct, // ❌ Not mode-aware!
        hasData: true
    };
}
```

**Orchestrator AI reviews against spec:**

```markdown
## Review: Task-2.1 Submission ❌ REJECTED

**Issues Found:**

1. ❌ CRITICAL: Composite key violation (Rule #4)
   - **Location:** Line 2, risk matching
   - **Problem:** Only matching on `id`, missing `year` and `quarter`
   - **Spec Reference:** Lines 298-314 (Matching Rules)
   - **Fix Required:**
   ```typescript
   const risk = risks.find(r => 
       r.id === l3.id && 
       extractInteger(r.year) === extractInteger(l3.year) &&
       r.quarter === l3.quarter
   );
   ```

2. ❌ CRITICAL: Mode-specific field violation (Rule #17)
   - **Location:** Line 7, return statement
   - **Problem:** Always using `build_exposure_pct` regardless of mode
   - **Spec Reference:** Lines 728-757 (BUILD vs EXECUTE modes)
   - **Fix Required:**
   ```typescript
   if (mode === 'build') {
       return {
           ...l3,
           exposure_percent: risk.build_exposure_pct,
           expected_delay_days: risk.expected_delay_days,
           hasData: true
       };
   } else {
       return {
           ...l3,
           exposure_percent: risk.operate_exposure_pct_effective,
           operational_health_score: risk.operational_health_pct,
           hasData: true
       };
   }
   ```

**Status:** Please fix these issues and resubmit.
**Estimated Fix Time:** 15 minutes
```

**Developer A fixes and resubmits:**

**Orchestrator AI re-reviews:**
```markdown
## Review: Task-2.1 Submission (v2) ✅ APPROVED

**Compliance Check:**
✅ Composite key matching (id + year + quarter)
✅ Mode-aware field selection
✅ Null safety handling
✅ extractInteger() usage
✅ Type safety maintained

**Code Quality:**
✅ Follows TypeScript best practices
✅ Proper error handling
✅ Readable and maintainable

**Test Results:**
✅ All 12 unit tests passing
✅ Type check: No errors
✅ ESLint: No warnings

**Status:** APPROVED - Ready for integration
**Next:** Merging to main branch, unblocking Task-2.3
```

---

#### Phase 4: Integration & Coordination (Orchestrator)

**Orchestrator manages dependencies:**

```markdown
## Integration Status: Phase 2 (Overlay 1)

**Completed (Integrated):**
✅ Task-2.1: Risk data enrichment (Developer A) - Merged
✅ Task-2.2: Color calculation (Developer B) - Merged

**In Progress:**
🔄 Task-2.3: Matrix component update (Developer A) - In Review
   Dependencies: 2.1 ✅, 2.2 ✅
   Status: Waiting on minor CSS fix

🔄 Task-2.4: Unit tests (AI Agent 3) - 80% complete
   Status: Adding edge case tests

**Blocked:**
❌ None

**Next Actions:**
1. Review Task-2.3 CSS fix (ETA: 10 min)
2. Merge Task-2.4 when complete (ETA: 1 hour)
3. Run integration test suite
4. Deploy to staging
5. Start Phase 3 (Overlay 2)

**Overall Phase 2 Progress:** 75% complete (ETA: 3 hours to done)
```

---

### Orchestrator's Quality Checklist (For Every Submission)

**Orchestrator AI reviews each submission against:**

```yaml
Specification_Compliance:
  - [ ] Follows exact spec from Implementation Guide
  - [ ] No violations of 20 Critical Rules
  - [ ] Uses correct composite keys (id + year + quarter)
  - [ ] Mode-aware (BUILD vs EXECUTE) where required
  - [ ] Cumulative filtering applied correctly
  
Code_Quality:
  - [ ] TypeScript types match Appendix A definitions
  - [ ] Error handling implemented
  - [ ] Null safety for optional fields
  - [ ] No hardcoded magic numbers
  - [ ] Follows naming conventions
  
Testing:
  - [ ] Unit tests written and passing
  - [ ] Edge cases covered
  - [ ] Integration tests pass
  - [ ] No console errors or warnings
  
Performance:
  - [ ] Memoization used for expensive operations
  - [ ] No N+1 query patterns
  - [ ] Meets performance targets (<2s load)
  
Documentation:
  - [ ] Code comments for complex logic
  - [ ] JSDoc for public functions
  - [ ] README updated if needed
```

---

### Communication Patterns

#### Pattern 1: Delegating to Human Developer

**Orchestrator format:**
```markdown
## Task Assignment: [Task ID] - [Title]

**Context:** [Why this task exists]

**Specification:** [Exact line references from this guide]

**Acceptance Criteria:** [Numbered list of MUST-haves]

**Critical Rules:** [Specific rules that apply]

**Code Template:** [Starting point if applicable]

**Definition of Done:**
- [ ] Code written and self-tested
- [ ] Unit tests passing
- [ ] Committed to feature branch
- [ ] Ready for orchestrator review
```

#### Pattern 2: Delegating to AI Agent

**Orchestrator format:**
```
Implement [functionality] in [file path] following the specification 
in docs/ENTERPRISE_DESK_IMPLEMENTATION_GUIDE.md lines [X-Y].

Key requirements:
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

Critical rules to NEVER violate:
- [Rule X from line Z]
- [Rule Y from line Z]

After implementation:
1. Run tests
2. Show me the code
3. Explain any deviations from spec (if any)
```

#### Pattern 3: Review Feedback

**Orchestrator format:**
```markdown
## Review: [Task ID] - [Status: APPROVED / NEEDS FIXES / REJECTED]

**Compliance Issues:** [List any spec violations with line refs]

**Code Quality Issues:** [List any quality problems]

**Required Fixes:**
1. [Fix 1 with exact spec reference]
2. [Fix 2 with exact spec reference]

**Positive Observations:** [What was done well]

**Next Steps:** [What needs to happen]
```

---

### Real-World Example: Multi-Agent Coordination

**Scenario:** Implementing Overlay 2 (External Pressure) which requires backend + frontend work.

**Orchestrator breaks it down:**

```yaml
Phase_3_Overlay_2:
  backend_task:
    id: Task-3.1
    title: "Create External Pressure Batch Endpoint"
    assignee: Backend Developer or AI Agent (Backend)
    files:
      - backend/app/api/v1/endpoints/enterprise.py
      - backend/app/services/external_pressure_service.py
    spec_reference: "Lines 540-634"
    dependencies: []
    estimated_time: 6 hours
    
  frontend_task_1:
    id: Task-3.2
    title: "Implement External Pressure Service Call"
    assignee: Frontend Developer A
    files:
      - frontend/src/services/enterpriseService.ts
    spec_reference: "Lines 758-801"
    dependencies: [Task-3.1]  # Blocked until backend ready
    estimated_time: 2 hours
    
  frontend_task_2:
    id: Task-3.3
    title: "Add Binary Color Logic for External Pressure"
    assignee: Frontend Developer B (parallel)
    files:
      - frontend/src/utils/enterpriseOverlayUtils.ts
    spec_reference: "Lines 758-801"
    dependencies: []  # Can work in parallel
    estimated_time: 2 hours
```

**Orchestrator coordinates:**

1. **Day 1:** Assigns Task-3.1 to Backend Dev, Task-3.3 to Frontend Dev B
2. **Day 2:** Reviews backend endpoint, provides feedback
3. **Day 2 PM:** Backend approved, unblocks Task-3.2
4. **Day 2 PM:** Assigns Task-3.2 to Frontend Dev A
5. **Day 3:** Reviews all three tasks, integrates when approved
6. **Day 3:** Runs integration tests across backend + frontend

---

### Best Practices for Using AI Orchestrator

#### ✅ DO:

1. **Always reference exact line numbers** from this guide
2. **Break work into <8 hour chunks** for manageable review
3. **Use the 20 Critical Rules** as non-negotiable gates
4. **Provide code templates** to reduce interpretation errors
5. **Review every submission** against the spec before integration
6. **Keep dependency graph** updated and visible
7. **Document deviations** immediately with rationale

#### ❌ DON'T:

1. **Don't assume workers read the full guide** - Give them excerpts
2. **Don't accept "looks good"** - Verify against exact spec
3. **Don't skip tests** - Every task needs test coverage
4. **Don't merge without review** - Even for "minor" changes
5. **Don't let deviations compound** - Fix violations immediately
6. **Don't work on blocked tasks** - Respect dependency order
7. **Don't lose context** - Keep task history and decisions logged

---

### Orchestrator's Daily Workflow

**Morning (Planning):**
```
1. Review overall progress against 7-phase timeline
2. Identify tasks ready to start (dependencies met)
3. Assign tasks to available workers (human or AI)
4. Send out work packages with spec references
```

**Midday (Review):**
```
1. Review submitted work against quality checklist
2. Provide detailed feedback with line references
3. Approve or request fixes
4. Unblock dependent tasks when work approved
```

**Evening (Integration):**
```
1. Merge approved work to main branch
2. Run integration tests
3. Update progress tracker
4. Plan next day's assignments
```

---

### Tools for Orchestrator

**Recommended Tools:**

1. **Task Tracker:**
   ```yaml
   # tasks.yaml
   phase_2:
     - task_id: 2.1
       status: completed
       assignee: Dev A
       approved: true
       merged: true
   ```

2. **Dependency Graph:**
   ```
   graph TD
       2.1[Task 2.1: Risk Enrichment] --> 2.3
       2.2[Task 2.2: Color Utils] --> 2.3
       2.3[Task 2.3: Matrix Update] --> 2.4
       2.4[Task 2.4: Integration Test]
   ```

3. **Compliance Log:**
   ```markdown
   ## Compliance Violations Log
   
   ### 2026-01-18: Task-2.1 First Submission
   - Violation: Rule #4 (Composite Key)
   - Resolved: Yes (resubmission approved)
   
   ### 2026-01-19: Task-3.2 Review
   - Violation: None
   - Status: Approved on first submission
   ```

---

## 📖 Table of Contents

### Core Documentation
1. [Overview](#overview) - What is Enterprise Desk
2. [Route Context](#route-context) - Integration with /josoor
3. [System Architecture](#system-architecture) - Component stack and data flow
4. [Data Model (Immutable Rules)](#data-model-immutable-rules) - EntityCapability + EntityRisk

### API & Backend
5. [Backend Endpoint Specifications](#backend-endpoint-specifications) - Complete API reference
   - GET /api/graph - Capability & Risk data
   - GET /api/chains - Chain queries
   - POST /api/enterprise/change-saturation - Team metrics
6. [API Endpoints](#api-endpoints) - Legacy reference (to be merged)

### Implementation Guides
7. [Step-by-Step Frontend Implementation](#step-by-step-frontend-implementation) - Phased development
   - Phase 1: Core Matrix Display
   - Phase 2: Overlay 1 - Risk Exposure
   - Phase 3-6: Remaining Overlays
8. [Overlay Implementation Requirements](#overlay-implementation-requirements) - All 5 overlays
   - Overlay 1: Risk Exposure (BUILD & EXECUTE)
   - Overlay 2: External Pressure
   - Overlay 3: Footprint Stress
   - Overlay 4: Change Saturation
   - Overlay 5: Trend Warning
9. [Frontend Implementation Rules](#frontend-implementation-rules) - File structure, types, components
10. [Mode Switching](#mode-switching) - BUILD vs EXECUTE modes

### Testing & Quality
11. [Performance Requirements](#performance-requirements) - Load time targets, optimization
12. [Testing Requirements](#testing-requirements) - Unit, integration, QA checklist
13. [Deployment Checklist](#deployment-checklist) - Pre/post deployment verification

### Rules & Standards
14. [Critical Rules (Never Violate)](#critical-rules-never-violate) - 20 mandatory rules
    - Data Access Rules (1-5)
    - UI/UX Rules (6-8)
    - Performance Rules (9-10)
    - Data Integrity Rules (11-13)
    - Route Isolation Rules (14-15)
    - Calculation Rules (16-18)
    - Error Handling Rules (19-20)

### Appendices
- [Appendix A: TypeScript Type Definitions](#appendix-a-typescript-type-definitions)
- [Appendix B: Color Constants](#appendix-b-color-constants)
- [Appendix C: Quick Reference Commands](#appendix-c-quick-reference-commands)
- [Appendix D: Overlay Quick Reference Table](#appendix-d-overlay-quick-reference-table)
- [Appendix E: Comprehensive Troubleshooting Guide](#appendix-e-comprehensive-troubleshooting-guide)
  - Data Loading Issues
  - Overlay-Specific Issues
  - Performance Issues
  - Common Error Messages & Solutions
- [Appendix F: Architectural Decision Records (ADRs)](#appendix-f-architectural-decision-records-adrs)
  - ADR-001: Single Overlay Selection Model
  - ADR-002: Cumulative Year/Quarter Filtering
  - ADR-003: Mode Derived from Capability Status
  - ADR-004: Client-Side Overlay Enrichment
  - ADR-005: 1:1 EntityRisk Relationship
  - ADR-006: Props-Based Year/Quarter
- [Appendix G: Data Validation & Quality Assurance](#appendix-g-data-validation--quality-assurance)
  - Pre-Launch Validation Checklist
  - Runtime Data Quality Checks
- [Implementation Summary & Quick Start](#-implementation-summary--quick-start)
  - What You Have Now
  - What Needs to Be Built (7-phase plan)
  - Critical Path Dependencies
  - Day 1 Checklist
  - Success Metrics

---

## Overview

### What is Enterprise Desk?

Enterprise Desk is a **strategic capability matrix visualization** within the `/josoor` route that displays:
- **3-Level Hierarchy:** L1 (Domain) → L2 (Sub-domain) → L3 (Capability) nodes
- **391 Capabilities Total:** Approximately 285 L3, 70 L2, 36 L1 nodes
- **5 Overlay Types:** Risk Exposure, External Pressure, Footprint Stress, Change Saturation, Trend Warning
- **Dual Modes:** BUILD (project delivery) vs EXECUTE (operational health)
- **Temporal Filtering:** Year/Quarter selection with cumulative data aggregation

### Visual System Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Enterprise Desk System                          │
│                        Route: /josoor/enterprise                       │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
         ┌──────▼──────┐     ┌──────▼──────┐    ┌──────▼──────┐
         │  Data Layer │     │   Backend   │    │  Frontend   │
         │   (Neo4j)   │     │    (API)    │    │   (React)   │
         └─────────────┘     └─────────────┘    └─────────────┘
                │                   │                   │
    ┌───────────┼───────────┐      │       ┌───────────┼───────────┐
    │           │           │      │       │           │           │
┌───▼───┐ ┌────▼────┐ ┌────▼──┐  │  ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
│Entity │ │ Entity  │ │Sector │  │  │ Matrix  │ │Overlay  │ │Insight  │
│ Cap   │ │  Risk   │ │Policy │  │  │Renderer │ │Controls │ │ Panel   │
│ 391   │ │  391    │ │ 616   │  │  │         │ │         │ │         │
└───┬───┘ └────┬────┘ └───────┘  │  └─────────┘ └─────────┘ └─────────┘
    │          │                  │
    └──────┬───┴──────────────────┘
           │
    ┌──────▼──────────────────────────────────────────┐
    │         5 Overlay Calculations                  │
    ├─────────────────────────────────────────────────┤
    │ 1. Risk Exposure      │ BUILD & EXECUTE         │
    │ 2. External Pressure  │ Policy/Performance      │
    │ 3. Footprint Stress   │ People/Process/Tools    │
    │ 4. Change Saturation  │ Team Compression        │
    │ 5. Trend Warning      │ Silent Degradation      │
    └─────────────────────────────────────────────────┘
```

### Strategic Purpose

The Enterprise Desk reveals **hidden strategic risks** through overlay analysis:
- **Risk Exposure:** Shows delivery delays (BUILD) or health degradation (EXECUTE)
- **External Pressure:** Identifies mandate/target overload BEFORE it becomes a risk
- **Footprint Stress:** Detects unsustainable imbalances across People/Process/Tools
- **Change Saturation:** Reveals organizational change compression in top 3 teams
- **Trend Warning:** Catches silent degradation over 2+ consecutive quarters

---

## Route Context

### Application Structure

The Enterprise Desk lives within the `/josoor` route, which is a unified shell containing multiple desk views:

```
/josoor
├── JosoorShell.tsx (Main Router Component)
│   ├── Sidebar (Desk Navigation)
│   ├── ChatContainer (Conversational Interface)
│   ├── CanvasManager (Artifact Display)
│   └── Desk Views:
│       ├── SectorDesk (Sector Observatory)
│       ├── ControlsDesk (Control Signals)
│       ├── PlanningDesk (Planning Lab)
│       ├── EnterpriseDesk ⟵ **YOU ARE HERE**
│       ├── ReportingDesk (Reporting Hub)
│       ├── TutorialsDesk (Knowledge Series)
│       ├── ExplorerDesk (Explorer View)
│       ├── Settings (Admin Settings)
│       └── Observability (System Observability)
```

### File Locations

**Main Route File:**
```
frontend/src/App.tsx (line 53)
→ <Route path="/josoor" element={<JosoorShell />} />
```

**Shell Component:**
```
frontend/src/app/josoor/JosoorShell.tsx (line 312)
→ {activeView === 'enterprise-desk' && <EnterpriseDesk year={year} quarter={quarter} />}
```

**EnterpriseDesk Component:**
```
frontend/src/components/desks/EnterpriseDesk.tsx
```

### Props Interface

```typescript
interface EnterpriseDeskProps {
    year: string;      // '2025', '2026', or 'all'
    quarter: string;   // 'Q1', 'Q2', 'Q3', 'Q4', or 'all'
}
```

**Parent State Management:**
- Year/Quarter state managed in `JosoorShell.tsx`
- Passed down as props to EnterpriseDesk
- Changes trigger data refetch

### Navigation Flow

1. User navigates to `/josoor` → JosoorShell mounts
2. User clicks "Enterprise Capabilities" in Sidebar → `setActiveView('enterprise-desk')`
3. EnterpriseDesk mounts with current year/quarter from JosoorShell state
4. User selects year/quarter in EnterpriseDesk → triggers state change in parent
5. Parent re-renders EnterpriseDesk with new props

**⚠️ CRITICAL:** Do NOT implement separate routing for `/josoor/enterprise`. The EnterpriseDesk is a VIEW within JosoorShell, not a separate route.

---

## System Architecture

### Component Stack
```
┌──────────────────────────────────────────────────────────────┐
│  /josoor/enterprise Route (React Component)                  │
│  └─ EnterpriseDesk.tsx                                       │
│     ├─ CapabilityMatrix.tsx (Matrix visualization)           │
│     ├─ OverlayControls.tsx (Overlay selection buttons)       │
│     ├─ DynamicInsightPanel.tsx (Aggregated metrics)          │
│     └─ CapabilityTooltip.tsx (Cell details on hover)         │
├──────────────────────────────────────────────────────────────┤
│  Services Layer (TypeScript)                                 │
│  └─ enterpriseService.ts                                     │
│     ├─ getCapabilityMatrix() → Backend                       │
│     └─ enrichWithOverlays() → Local calculations             │
├──────────────────────────────────────────────────────────────┤
│  Backend Gateway (Python FastAPI)                            │
│  └─ https://betaBE.aitwintech.com/api                        │
│     ├─ /graph?nodeLabels=EntityCapability,EntityRisk         │
│     └─ /chains?sourceLabel=...&targetLabel=...               │
├──────────────────────────────────────────────────────────────┤
│  Neo4j Graph Database (Graph Data)                           │
│  ├─ EntityCapability (391 nodes) - Capability hierarchy      │
│  ├─ EntityRisk (391 nodes) - 1:1 match with capabilities     │
│  ├─ EntityOrgUnit (436 nodes) - Teams/departments            │
│  ├─ EntityProject (284 nodes) - Transformation projects      │
│  ├─ SectorPolicyTool (616 nodes) - Policy mandates           │
│  └─ SectorPerformance (616 nodes) - Performance targets      │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow (Strict Order)
1. **User navigates to `/josoor/enterprise`** → EnterpriseDesk mounts
2. **Initial load:** Fetch year/quarter from global context (JosoorLayout)
3. **Backend request:** `GET /api/graph?nodeLabels=EntityCapability,EntityRisk`
4. **Data transform:** Convert Neo4j nodes → L1/L2/L3 hierarchy
5. **Overlay enrichment:** Add overlay-specific data to L3 capabilities
6. **Render:** Display matrix with selected overlay colors/labels
7. **User interaction:** Toggle overlays, mode filters, tooltips

---

## Data Model (Immutable Rules)

### Core Entities

#### EntityCapability (391 nodes)
```cypher
(:EntityCapability {
    id: String,                    // Business ID (e.g., "1.0", "1.1.1") - PRIMARY KEY
    year: Integer,                 // PRIMARY KEY (2024, 2025, 2026)
    quarter: String,               // "Q1" | "Q2" | "Q3" | "Q4"
    level: String,                 // "L1" | "L2" | "L3"
    name: String,
    status: String,                // 'planned' | 'in_progress' | 'active'
    parent_id: String,             // L2/L3 only - references parent's id
    parent_year: Integer,          // L2/L3 only - references parent's year
    maturity_level: Integer,       // 1-5 scale
    target_maturity_level: Integer
})
```

#### EntityRisk (391 nodes) - 1:1 Match with EntityCapability
```cypher
(:EntityRisk {
    id: String,                    // MUST match capability.id
    year: Integer,                 // MUST match capability.year
    quarter: String,               // MUST match capability.quarter
    
    // BUILD MODE fields
    build_exposure_pct: Float,     // 0-100% (Overlay 1)
    expected_delay_days: Float,
    likelihood_of_delay: Float,
    delay_days: Float,
    
    // EXECUTE MODE fields
    operational_health_pct: Float, // 0-100%
    operate_exposure_pct_effective: Float, // 0-100% (Overlay 1)
    operate_trend_flag: Boolean,   // Overlay 5
    people_score: Float,           // 1-5 (Overlay 3)
    process_score: Float,          // 1-5 (Overlay 3)
    tools_score: Float,            // 1-5 (Overlay 3)
    
    // Trend tracking (Overlay 5)
    prev_operational_health_pct: Float,
    prev2_operational_health_pct: Float
})
```

### Matching Rules (CRITICAL)

**1:1 Capability-Risk Match:**
```typescript
// ✅ CORRECT: Composite key matching
const risk = riskNodes.find(r => 
    r.id === capability.id &&
    r.year === capability.year &&
    r.quarter === capability.quarter
);

// ❌ WRONG: Don't use element IDs or property nesting
const risk = riskNodes.find(r => r.elementId === capability.id);
```

**Hierarchy Construction:**
```typescript
// ✅ CORRECT: Match L2 children via parent_id + parent_year
const l2Children = l2Nodes.filter(l2 =>
    l2.parent_id === l1.id &&
    l2.parent_year === l1.year
);

// ❌ WRONG: Don't match by name or assume order
const l2Children = l2Nodes.filter(l2 => l2.name.startsWith(l1.name));
```

**Mode Resolution (from capability.status):**
```typescript
// ✅ CORRECT: As defined in Enterprise Ontology SST v1.1
function getMode(status: string): 'build' | 'execute' | null {
    if (status === 'planned' || status === 'in_progress') return 'build';
    if (status === 'active') return 'execute';
    return null;
}

// ❌ WRONG: Don't invent status values
if (status === 'building') return 'build'; // No such status
```

### Cumulative Data Filtering (MANDATORY)

**Year/quarter filtering is CUMULATIVE, not exact match.**

**Examples:**
- **2026 Q3** = All of 2025 + 2026 Q1 + 2026 Q2 + 2026 Q3
- **2025 Q4** = 2025 Q1 + 2025 Q2 + 2025 Q3 + 2025 Q4
- **"all"** = All years and quarters

**Implementation:**
```typescript
function matchesCumulativeFilter(
    nodeYear: number, 
    nodeQuarter: string, 
    filterYear: number | 'all', 
    filterQuarter: string | 'all'
): boolean {
    if (filterYear === 'all') return true;
    
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    
    // Include all years before filter year
    if (nodeYear < filterYear) return true;
    
    // Same year - check quarter
    if (nodeYear === filterYear) {
        if (filterQuarter === 'all') return true;
        const nodeQ = quarters.indexOf(nodeQuarter);
        const filterQ = quarters.indexOf(filterQuarter);
        return nodeQ <= filterQ;
    }
    
    // Future years excluded
    return false;
}
```

**⚠️ CRITICAL:** This is how the backend aggregates data. Frontend must filter identically or rely on backend filtering.

---

## API Endpoints

### Primary Data Source
**Endpoint:** `GET https://betaBE.aitwintech.com/api/graph`  
**Purpose:** Fetch EntityCapability + EntityRisk nodes for matrix

**Request:**
```typescript
const params = {
    nodeLabels: 'EntityCapability,EntityRisk',
    excludeEmbeddings: 'true',
    // Note: Year/quarter filtering handled client-side
};
```

**Response:**
```typescript
{
    nodes: [
        {
            id: string,              // Business ID (e.g., "1.0")
            elementId: string,       // Neo4j internal (ignore)
            label: string,           // Node type
            name: string,
            level: "L1" | "L2" | "L3",
            year: number | {low: number, high: number},
            quarter: string | {low: number, high: number},
            // ... other properties
        }
    ],
    links: [...] // Not used for matrix building
}
```

### Overlay 2 (External Pressure) - Chain Queries
**Endpoint:** `GET https://betaBE.aitwintech.com/api/chains`  
**Purpose:** Count PolicyTool/Performance connections to capabilities

**BUILD Mode - Policy Pressure:**
```typescript
const params = {
    sourceLabel: 'EntityCapability',
    sourceId: capability.id, // Business ID
    targetLabel: 'SectorPolicyTool',
    relationshipTypes: 'EXECUTES,SETS_PRIORITIES',
    year: capability.year,
    quarter: capability.quarter
};
```

**EXECUTE Mode - Performance Pressure:**
```typescript
const params = {
    sourceLabel: 'EntityCapability',
    sourceId: capability.id,
    targetLabel: 'SectorPerformance',
    relationshipTypes: 'REPORTS,SETS_TARGETS',
    year: capability.year,
    quarter: capability.quarter
};
```

**Response:**
```typescript
{
    nodes: [...],  // Connected PolicyTool or Performance nodes
    links: [...]   // Relationship details
}
// Count = nodes.length
```

### Overlay 4 (Change Saturation) - Team Metrics
**Endpoint:** `GET https://betaBE.aitwintech.com/api/enterprise/change-saturation` *(TO BE IMPLEMENTED)*  
**Purpose:** Calculate top 3 teams with highest change compression

**Request:**
```typescript
POST /api/enterprise/change-saturation
Body: {
    currentYear: 2026,
    currentQuarter: 'Q3'
}
```

**Response:**
```typescript
{
    top3Teams: [
        {
            org_unit_id: string,
            org_unit_name: string,
            recent_change_count: number,      // BUILD caps in last 2Q
            total_capabilities: number,       // All caps team operates
            change_compression_pct: number,   // 0-100%
            affected_capability_ids: string[]
        }
    ],
    colorMap: {
        [capability_id: string]: string      // Color value per capability
    }
}
```

---

## Backend Endpoint Specifications

### GET /api/graph - Capability & Risk Data

**Purpose:** Fetch all EntityCapability and EntityRisk nodes for matrix construction

**Request:**
```http
GET https://betaBE.aitwintech.com/api/graph?nodeLabels=EntityCapability,EntityRisk&excludeEmbeddings=true
```

**Query Parameters:**
- `nodeLabels` (required): Comma-separated list of node labels
- `excludeEmbeddings` (required): Must be `true` to reduce payload size
- `limit` (optional): Maximum nodes to return (omit for all)

**Response Schema:**
```typescript
interface GraphResponse {
    nodes: Array<{
        id: string;              // Business ID (e.g., "1.0", "1.1.1")
        elementId: string;       // Neo4j internal ID (ignore)
        label: string;           // "EntityCapability" or "EntityRisk"
        name: string;
        level: "L1" | "L2" | "L3";
        year: number | {low: number, high: number};
        quarter: string;
        status?: string;         // Capability only
        parent_id?: string;      // L2/L3 only
        parent_year?: number;    // L2/L3 only
        
        // EntityRisk specific fields
        build_exposure_pct?: number;
        operate_exposure_pct_effective?: number;
        operational_health_pct?: number;
        people_score?: number;
        process_score?: number;
        tools_score?: number;
        expected_delay_days?: number;
        likelihood_of_delay?: number;
        operate_trend_flag?: boolean;
        prev_operational_health_pct?: number;
        prev2_operational_health_pct?: number;
        // ... other risk fields
    }>;
    links: Array<{...}>; // Not used for matrix construction
}
```

**Integer Field Handling:**
```typescript
// Neo4j returns integers as objects: {low: 2026, high: 0}
// Convert to plain numbers:
function extractInteger(value: any): number {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object' && 'low' in value) {
        return value.low;
    }
    return 0;
}

const year = extractInteger(node.year);
const quarter = typeof node.quarter === 'string' 
    ? node.quarter 
    : `Q${extractInteger(node.quarter)}`;
```

### GET /api/chains - Chain Queries

**Purpose:** Fetch relationship chains for External Pressure overlay

**BUILD Mode Request:**
```http
GET https://betaBE.aitwintech.com/api/chains?
    sourceLabel=EntityCapability&
    sourceId={capability.id}&
    targetLabel=SectorPolicyTool&
    relationshipTypes=EXECUTES,SETS_PRIORITIES&
    year={capability.year}&
    quarter={capability.quarter}
```

**EXECUTE Mode Request:**
```http
GET https://betaBE.aitwintech.com/api/chains?
    sourceLabel=EntityCapability&
    sourceId={capability.id}&
    targetLabel=SectorPerformance&
    relationshipTypes=REPORTS,SETS_TARGETS&
    year={capability.year}&
    quarter={capability.quarter}
```

**Query Parameters:**
- `sourceLabel`: Starting node type
- `sourceId`: Business ID of capability
- `targetLabel`: Target node type
- `relationshipTypes`: Comma-separated relationship types
- `year`: Filter by year
- `quarter`: Filter by quarter

**Response Schema:**
```typescript
interface ChainResponse {
    nodes: Array<{...}>; // Connected PolicyTool or Performance nodes
    links: Array<{...}>; // Relationship details
}
```

**Usage:**
```typescript
const count = response.nodes.length;
```

### POST /api/enterprise/change-saturation - Team Metrics

**⚠️ TO BE IMPLEMENTED** - This endpoint must be created before Overlay 4 is functional

**Purpose:** Calculate top 3 teams with highest change compression for Change Saturation overlay

**Request:**
```http
POST https://betaBE.aitwintech.com/api/enterprise/change-saturation
Content-Type: application/json

{
    "currentYear": 2026,
    "currentQuarter": "Q3"
}
```

**Backend Logic:**
```cypher
// 1. For each OrgUnit, count BUILD capabilities in last 2 quarters
MATCH (org:EntityOrgUnit)
OPTIONAL MATCH (org)-[:ROLE_GAPS]->(cap:EntityCapability)
WHERE cap.status IN ['planned', 'in_progress']
  AND ((cap.year = $currentYear AND cap.quarter IN [previous, current])
       OR (cap.year = $currentYear - 1 AND cap.quarter IN [Q4]))
WITH org, COUNT(DISTINCT cap) AS recent_change_count

// 2. Count total capabilities team operates
MATCH (org)-[:OPERATES]->(allCap:EntityCapability)
WITH org, recent_change_count, COUNT(DISTINCT allCap) AS total_capabilities

// 3. Calculate compression percentage
WITH org, 
     recent_change_count, 
     total_capabilities,
     (toFloat(recent_change_count) / total_capabilities * 100) AS change_compression_pct

// 4. Sort and get top 3
ORDER BY change_compression_pct DESC
LIMIT 3

// 5. For each top team, get affected capability IDs
MATCH (org)-[:ROLE_GAPS|OPERATES]->(cap:EntityCapability)
RETURN org.id, org.name, recent_change_count, total_capabilities, 
       change_compression_pct, COLLECT(cap.id) AS affected_capability_ids
```

**Response Schema:**
```typescript
interface ChangeSaturationResponse {
    top3Teams: Array<{
        org_unit_id: string;
        org_unit_name: string;
        recent_change_count: number;      // BUILD caps in last 2Q
        total_capabilities: number;       // All caps team operates
        change_compression_pct: number;   // 0-100%
        affected_capability_ids: string[];
    }>;
    colorMap: {
        [capability_id: string]: string;  // Color per capability
    };
}
```

**Color Assignment:**
```typescript
// Backend assigns colors based on rank
const colorMap: Record<string, string> = {};

top3Teams.forEach((team, index) => {
    const colors = [
        'rgba(239, 68, 68, 0.8)',  // Team #1 (highest compression)
        'rgba(239, 68, 68, 0.6)',  // Team #2
        'rgba(239, 68, 68, 0.4)',  // Team #3
    ];
    
    team.affected_capability_ids.forEach(capId => {
        colorMap[capId] = colors[index];
    });
});

return { top3Teams, colorMap };
```

### Error Handling for All Endpoints

```typescript
try {
    const response = await fetch(endpoint, options);
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
} catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    
    // Return safe defaults based on endpoint
    if (endpoint.includes('/chains')) {
        return { nodes: [], links: [] }; // Empty chain
    }
    if (endpoint.includes('/change-saturation')) {
        return { top3Teams: [], colorMap: {} }; // No saturation
    }
    
    throw error; // Re-throw for /graph endpoint (critical)
}
```

---

## Overlay Implementation Requirements

### Overlay 1: Risk Exposure

**Data Source:** EntityRisk (matched 1:1 with capability)  
**Mode:** BUILD and EXECUTE  
**Color:** Green (<5%), Amber (5-15%), Red (≥15%)

**BUILD Mode Implementation:**
```typescript
interface L3CapabilityOverlay1 {
    exposure_percent: number;           // = build_exposure_pct from EntityRisk
    expected_delay_days: number;        // From EntityRisk
    likelihood_of_delay: number;        // From EntityRisk
    delay_days: number;                 // From EntityRisk
}

// Display
const text = `+${expected_delay_days}d / ${exposure_percent}%`;
const color = 
    exposure_percent < 5 ? 'rgba(16, 185, 129, 0.6)' :  // GREEN
    exposure_percent < 15 ? calculateGradient(exposure_percent) :  // AMBER
    'rgba(239, 68, 68, 0.6)';  // RED
```

**EXECUTE Mode Implementation:**
```typescript
interface L3CapabilityOverlay1Execute {
    exposure_percent: number;           // = operate_exposure_pct_effective
    operational_health_score: number;   // From EntityRisk
    people_score: number;               // 1-5 scale
    process_score: number;              // 1-5 scale
    tools_score: number;                // 1-5 scale
    exposure_trend: 'improving' | 'declining' | 'stable';
}

// Trend arrow calculation
const trend_arrow = 
    exposure_trend === 'improving' ? '▲' :
    exposure_trend === 'declining' ? '▼' : '■';

// Display
const text = `${exposure_percent}% ${trend_arrow}`;
```

**Implementation Rule:** NEVER calculate exposure_percent from scratch. Use pre-calculated fields from EntityRisk.

---

### Overlay 2: External Pressure

**Data Source:** Chain endpoint (PolicyTool or Performance counts)  
**Mode:** BUILD and EXECUTE  
**Color:** Binary (Red = urgent, Green = manageable)

**BUILD Mode Implementation:**
```typescript
interface L3CapabilityOverlay2Build {
    policy_tool_count: number;          // From chain query
    maturity_level: number;             // From capability
    target_maturity_level: number;      // From capability
}

// Calculation
const highPressure = policy_tool_count >= 3;
const lowMaturity = maturity_level < target_maturity_level;
const isUrgent = highPressure && lowMaturity;

const color = isUrgent ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)';
```

**EXECUTE Mode Implementation:**
```typescript
interface L3CapabilityOverlay2Execute {
    performance_target_count: number;   // From chain query
    health_history: number[];           // [prev2, prev, current] from EntityRisk
}

// Calculation
const highPressure = performance_target_count >= 3;
const isDeclining = 
    health_history.length === 3 &&
    health_history[0] > health_history[1] && 
    health_history[1] > health_history[2];
const isUrgent = highPressure && isDeclining;

const color = isUrgent ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)';
```

**Performance Note:** With 285 L3 capabilities, batch fetch all chain queries in parallel or use dedicated backend endpoint.

---

### Overlay 3: Footprint Stress

**Data Source:** EntityRisk (people_score, process_score, tools_score)  
**Mode:** BUILD and EXECUTE  
**Color:** Based on imbalance range (0-100%)

**Implementation:**
```typescript
interface L3CapabilityOverlay3 {
    people_score: number;     // 1-5 from EntityRisk
    process_score: number;    // 1-5 from EntityRisk
    tools_score: number;      // 1-5 from EntityRisk
    org_gap: number;          // Calculated
    process_gap: number;      // Calculated
    it_gap: number;           // Calculated
}

// Calculation
const scores = [people_score, process_score, tools_score];
const max_score = Math.max(...scores);
const min_score = Math.min(...scores);
const range = max_score - min_score;
const mean = (people_score + process_score + tools_score) / 3;

// Gaps from mean
const org_gap = Math.abs(people_score - mean);
const process_gap = Math.abs(process_score - mean);
const it_gap = Math.abs(tools_score - mean);

// Stress percentage and dominant dimension
const stress_pct = (range / 4) * 100;  // 4 is max range (5-1)
const maxGap = Math.max(org_gap, process_gap, it_gap);
const dominant = 
    org_gap === maxGap ? 'O' :      // People outlier
    process_gap === maxGap ? 'P' :  // Process outlier
    'T';                            // Tools outlier

const severity = Math.floor(stress_pct / 25);  // Min 1

// Display
const text = `${dominant}${severity}`;
const color = 
    stress_pct < 5 ? 'rgba(16, 185, 129, 0.6)' :
    stress_pct < 15 ? calculateGradient(stress_pct) :
    'rgba(239, 68, 68, 0.6)';
```

**Key Insight:** Balanced is good regardless of absolute maturity. [5,5,5] and [2,2,2] are both GREEN.

---

### Overlay 4: Change Saturation

**Data Source:** Backend change-saturation endpoint (team metrics + color map)  
**Mode:** BUILD only  
**Color:** 3-tier red intensity or dimmed gray

**Implementation:**
```typescript
interface TeamChangeLoad {
    org_unit_id: string;
    org_unit_name: string;
    recent_change_count: number;        // BUILD in last 2Q
    total_capabilities: number;
    change_compression_pct: number;     // 0-100%
}

interface L3CapabilityOverlay4 {
    saturation_team: string | null;     // Name of top 3 team
    saturation_team_pct: number | null; // Team's compression %
    saturation_color: string;           // From backend colorMap
}

// Color assignment (from backend response)
const colorMap = {
    [top3Teams[0].org_unit_id]: 'rgba(239, 68, 68, 0.8)',  // Darkest
    [top3Teams[1].org_unit_id]: 'rgba(239, 68, 68, 0.6)',  // Medium
    [top3Teams[2].org_unit_id]: 'rgba(239, 68, 68, 0.4)',  // Light
};

// Apply to capabilities
const capability_color = 
    colorMap[capability.id] || 'rgba(100, 100, 100, 0.1)';  // Dimmed
```

**Display:** Color only (no text), tooltip shows team name and compression %

**EXECUTE Mode:** Gray out or hide this overlay (change is complete in EXECUTE mode)

---

### Overlay 5: Trend Warning

**Data Source:** EntityRisk across 3 consecutive quarters  
**Mode:** EXECUTE only  
**Color:** Red if declining (2+ consecutive drops) while still GREEN, else no color

**Implementation:**
```typescript
interface L3CapabilityOverlay5 {
    current_health_pct: number;     // From EntityRisk (Q0)
    prev_health_pct: number;        // From EntityRisk (Q-1)
    prev2_health_pct: number;       // From EntityRisk (Q-2)
    operate_trend_flag: boolean;    // From EntityRisk
    health_trend: 'improving' | 'declining' | 'stable';
}

// Quarter navigation
function getPreviousQuarter(year: number, quarter: string) {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const idx = quarters.indexOf(quarter);
    if (idx > 0) return { year, quarter: quarters[idx - 1] };
    return { year: year - 1, quarter: 'Q4' };
}

// Detection logic
const isDeclining = 
    prev2_health_pct > prev_health_pct && 
    prev_health_pct > current_health_pct;

const operate_exposure_pct_raw = 100 - current_health_pct;
const stillGreen = operate_exposure_pct_raw < 35;  // band_green_max_pct

const operate_trend_flag = isDeclining && stillGreen;

// Display
const color = operate_trend_flag 
    ? 'rgba(239, 68, 68, 0.6)'  // RED warning
    : null;  // No overlay
```

**BUILD Mode:** Hide or gray out (no operational health in BUILD mode)

---
## Mode Switching

### State Management

```typescript
type Mode = 'build' | 'execute';

const [mode, setMode] = useState<Mode>('build');

function handleModeSwitch(newMode: Mode) {
    setMode(newMode);
    
    // Re-filter capabilities based on status
    const filteredCaps = allCapabilities.filter(cap => 
        newMode === 'build' 
            ? ['planned', 'in_progress'].includes(cap.status)
            : cap.status === 'active'
    );
    
    // Re-enrich data with mode-specific fields
    const enrichedCaps = enrichL3Capabilities(
        filteredCaps, 
        allRisks, 
        newMode, 
        year, 
        quarter
    );
    
    setCapabilities(enrichedCaps);
}
```

### UI Toggle Component

```tsx
<div className="mode-toggle">
    <button 
        className={mode === 'build' ? 'active' : ''}
        onClick={() => handleModeSwitch('build')}
        aria-label="Switch to BUILD mode"
    >
        <span className="icon">🏗️</span>
        BUILD Mode
        <span className="description">Project Delivery</span>
    </button>
    <button 
        className={mode === 'execute' ? 'active' : ''}
        onClick={() => handleModeSwitch('execute')}
        aria-label="Switch to EXECUTE mode"
    >
        <span className="icon">⚙️</span>
        EXECUTE Mode
        <span className="description">Operational Health</span>
    </button>
</div>
```

### Overlay Visibility Rules

| Overlay | BUILD Mode | EXECUTE Mode | Notes |
|---------|-----------|--------------|-------|
| Risk Exposure | ✅ Enabled | ✅ Enabled | Uses different fields per mode |
| External Pressure | ✅ Policy Tools | ✅ Performance Targets | Different data sources |
| Footprint Stress | ✅ Enabled | ✅ Enabled | Same calculation both modes |
| Change Saturation | ✅ Enabled | ⚪ Disabled/Gray | Only relevant during build |
| Trend Warning | ⚪ Disabled/Gray | ✅ Enabled | Only relevant after active |

**Implementation:**
```typescript
function isOverlayAvailable(overlay: OverlayType, mode: Mode): boolean {
    const availability = {
        'risk-exposure': ['build', 'execute'],
        'external-pressure': ['build', 'execute'],
        'footprint-stress': ['build', 'execute'],
        'change-saturation': ['build'],
        'trend-warning': ['execute']
    };
    
    return availability[overlay]?.includes(mode) ?? false;
}

// Disable overlay button if not available in current mode
<button 
    disabled={!isOverlayAvailable('change-saturation', mode)}
    onClick={() => setSelectedOverlay('change-saturation')}
>
    Change Saturation
</button>
```

### Mode-Specific Field Access

**Rule:** Always check mode before accessing mode-specific fields.

```typescript
// ✅ CORRECT: Mode-aware field access
function getExposurePercent(capability: L3Capability, mode: Mode): number {
    if (mode === 'build') {
        return capability.exposure_percent ?? 0;  // From build_exposure_pct
    } else {
        return capability.exposure_percent ?? 0;  // From operate_exposure_pct_effective
    }
}

// ✅ CORRECT: Mode-aware display text
function getRiskExposureDisplayText(capability: L3Capability, mode: Mode): string {
    if (mode === 'build') {
        const days = capability.expected_delay_days ?? 0;
        const pct = capability.exposure_percent ?? 0;
        return `+${days}d / ${pct.toFixed(0)}%`;
    } else {
        const pct = capability.exposure_percent ?? 0;
        const trend = capability.exposure_trend === 'improving' ? '▲' :
                     capability.exposure_trend === 'declining' ? '▼' : '■';
        return `${pct.toFixed(0)}% ${trend}`;
    }
}

// ❌ WRONG: Accessing mode-specific field without checking
const delayDays = capability.expected_delay_days;  // Only exists in BUILD mode!
```

---
## Frontend Implementation Rules

### File Structure (MUST Follow)
```
frontend/src/
├── components/desks/
│   ├── EnterpriseDesk.tsx              # Main container
│   └── enterprise/
│       ├── CapabilityMatrix.tsx        # Matrix grid renderer
│       ├── OverlayControls.tsx         # Overlay button panel
│       ├── DynamicInsightPanel.tsx     # Aggregated metrics
│       ├── DynamicInsightTitle.tsx     # Title for insights
│       ├── CapabilityTooltip.tsx       # Hover tooltip
│       └── EnterpriseDesk.css          # Styles
├── services/
│   └── enterpriseService.ts            # Data fetching + enrichment
├── utils/
│   └── enterpriseOverlayUtils.ts       # Overlay calculation helpers
└── types/
    └── enterprise.ts                   # TypeScript interfaces
```

### Type Definitions (MUST Match)
```typescript
// types/enterprise.ts

export type OverlayType = 
    | 'none' 
    | 'risk-exposure' 
    | 'external-pressure' 
    | 'footprint-stress' 
    | 'change-saturation' 
    | 'trend-warning';

export interface L3Capability {
    id: string;                         // Business ID
    name: string;
    year: number;
    quarter: string;
    status: string;
    mode: 'build' | 'execute' | null;
    level: 'L3';
    
    // Overlay 1: Risk Exposure
    exposure_percent?: number;
    expected_delay_days?: number;
    likelihood_of_delay?: number;
    operational_health_score?: number;
    people_score?: number;
    process_score?: number;
    tools_score?: number;
    exposure_trend?: 'improving' | 'declining' | 'stable';
    
    // Overlay 2: External Pressure
    policy_tool_count?: number;
    performance_target_count?: number;
    health_history?: number[];
    
    // Overlay 3: Footprint Stress
    org_gap?: number;
    process_gap?: number;
    it_gap?: number;
    
    // Overlay 4: Change Saturation
    saturation_team?: string;
    saturation_team_pct?: number;
    saturation_color?: string;
    
    // Overlay 5: Trend Warning
    current_health_pct?: number;
    prev_health_pct?: number;
    prev2_health_pct?: number;
    operate_trend_flag?: boolean;
    health_trend?: 'improving' | 'declining' | 'stable';
}

export interface L2Capability {
    id: string;
    name: string;
    year: number;
    level: 'L2';
    l3: L3Capability[];
}

export interface L1Capability {
    id: string;
    name: string;
    year: number;
    level: 'L1';
    l2: L2Capability[];
}
```

### Component State Management
```typescript
// EnterpriseDesk.tsx state (MUST have these)
const [selectedOverlay, setSelectedOverlay] = useState<OverlayType>('none');
const [modeFilter, setModeFilter] = useState<'all' | 'build' | 'execute'>('all');
const [matrixData, setMatrixData] = useState<L1Capability[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [tooltip, setTooltip] = useState<TooltipData | null>(null);
```

### Filtering Rules
```typescript
// Year/quarter filtering: CUMULATIVE (handled server-side OR client-side)
// Example: year=2026, quarter=Q3 includes ALL of 2025 + 2026 Q1-Q3

// Mode filtering: CLIENT-SIDE ONLY
function isL3Dimmed(l3: L3Capability): boolean {
    const matchesModeFilter =
        modeFilter === 'all' ||
        (modeFilter === 'build' && l3.mode === 'build') ||
        (modeFilter === 'execute' && l3.mode === 'execute');
    
    return !matchesModeFilter;  // Dim if doesn't match
}
```

### Color Gradient Function
```typescript
// For overlays with gradients (Risk Exposure, Footprint Stress)
function calculateGradient(percent: number): string {
    // GREEN: rgba(16, 185, 129, 0.6)
    // RED: rgba(239, 68, 68, 0.6)
    
    // Interpolate between green and red based on percent
    const green = [16, 185, 129];
    const red = [239, 68, 68];
    
    const ratio = (percent - 5) / 10;  // 5-15% → 0-1
    const r = Math.round(green[0] + (red[0] - green[0]) * ratio);
    const g = Math.round(green[1] + (red[1] - green[1]) * ratio);
    const b = Math.round(green[2] + (red[2] - green[2]) * ratio);
    
    return `rgba(${r}, ${g}, ${b}, 0.6)`;
}
```

---

## Performance Requirements

### Load Time Targets
- **Initial matrix load:** < 2 seconds
- **Overlay toggle:** < 200ms (instant feel)
- **Tooltip render:** < 50ms
- **Mode filter toggle:** < 100ms

### Optimization Strategies

**1. Data Fetching:**
- Fetch EntityCapability + EntityRisk in single request
- Use `excludeEmbeddings: true` to reduce payload size
- Implement request cancellation on unmount

**2. Overlay 2 (External Pressure):**
- **Option A:** Batch all chain queries (285 L3s × 2 modes = 570 requests)
  - Use Promise.allSettled() to prevent one failure from blocking all
  - Add loading state per overlay
- **Option B:** Create dedicated backend endpoint (RECOMMENDED)
  - Returns all policy/performance counts in one call
  - Reduces network overhead

**3. Overlay 4 (Change Saturation):**
- MUST use backend endpoint (complex team aggregation)
- Cache results per year/quarter combination
- Don't recalculate on overlay toggle

**4. React Optimizations:**
- Memoize matrix construction: `useMemo(() => buildMatrix(), [matrixData, selectedOverlay])`
- Memoize filtered L3 lists: `useMemo(() => filterL3s(), [matrixData, modeFilter])`
- Use React.memo() for CapabilityMatrix component

---

## Step-by-Step Frontend Implementation

### Phase 1: Core Matrix Display (Foundation)

**Goal:** Display 3-level capability matrix without overlays

**Steps:**

1. **Create Type Definitions** (`frontend/src/types/enterprise.ts`)
   ```typescript
   export type OverlayType = 'none' | 'risk-exposure' | 'external-pressure' | 'footprint-stress' | 'change-saturation' | 'trend-warning';
   export type Mode = 'build' | 'execute';
   
   export interface L3Capability {
       id: string;
       name: string;
       year: number;
       quarter: string;
       status: string;
       mode: Mode | null;
       level: 'L3';
       // ... add overlay fields as you implement each overlay
   }
   
   export interface L2Capability {
       id: string;
       name: string;
       level: 'L2';
       l3: L3Capability[];
   }
   
   export interface L1Capability {
       id: string;
       name: string;
       level: 'L1';
       l2: L2Capability[];
   }
   ```

2. **Create Service Layer** (`frontend/src/services/enterpriseService.ts`)
   ```typescript
   import { L1Capability, L2Capability, L3Capability } from '../types/enterprise';
   
   const API_BASE = 'https://betaBE.aitwintech.com/api';
   
   export async function fetchCapabilityMatrix(
       year: string | number,
       quarter: string
   ): Promise<L1Capability[]> {
       // Step 1: Fetch all nodes
       const response = await fetch(
           `${API_BASE}/graph?nodeLabels=EntityCapability,EntityRisk&excludeEmbeddings=true`
       );
       const data = await response.json();
       
       // Step 2: Separate capabilities and risks
       const capabilities = data.nodes.filter(n => n.label === 'EntityCapability');
       const risks = data.nodes.filter(n => n.label === 'EntityRisk');
       
       // Step 3: Apply cumulative filtering
       const filteredCaps = filterCumulative(capabilities, year, quarter);
       const filteredRisks = filterCumulative(risks, year, quarter);
       
       // Step 4: Build hierarchy
       const hierarchy = buildHierarchy(filteredCaps, filteredRisks);
       
       return hierarchy;
   }
   
   function filterCumulative(nodes: any[], year: string | number, quarter: string) {
       if (year === 'all') return nodes;
       
       const filterYear = parseInt(year.toString());
       const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
       
       return nodes.filter(node => {
           const nodeYear = extractInteger(node.year);
           const nodeQuarter = node.quarter;
           
           // Include all years before filter year
           if (nodeYear < filterYear) return true;
           
           // Same year - check quarter
           if (nodeYear === filterYear) {
               if (quarter === 'all') return true;
               const nodeQ = quarters.indexOf(nodeQuarter);
               const filterQ = quarters.indexOf(quarter);
               return nodeQ <= filterQ;
           }
           
           return false;
       });
   }
   
   function buildHierarchy(capabilities: any[], risks: any[]): L1Capability[] {
       const l1Nodes = capabilities.filter(c => c.level === 'L1');
       const l2Nodes = capabilities.filter(c => c.level === 'L2');
       const l3Nodes = capabilities.filter(c => c.level === 'L3');
       
       return l1Nodes.map(l1 => ({
           ...l1,
           id: l1.id,
           name: l1.name,
           level: 'L1' as const,
           year: extractInteger(l1.year),
           l2: l2Nodes
               .filter(l2 => l2.parent_id === l1.id && extractInteger(l2.parent_year) === extractInteger(l1.year))
               .map(l2 => ({
                   ...l2,
                   id: l2.id,
                   name: l2.name,
                   level: 'L2' as const,
                   year: extractInteger(l2.year),
                   l3: l3Nodes
                       .filter(l3 => l3.parent_id === l2.id && extractInteger(l3.parent_year) === extractInteger(l2.year))
                       .map(l3 => ({
                           ...l3,
                           id: l3.id,
                           name: l3.name,
                           level: 'L3' as const,
                           year: extractInteger(l3.year),
                           quarter: l3.quarter,
                           status: l3.status,
                           mode: getMode(l3.status),
                       }))
               }))
       }));
   }
   
   function getMode(status: string): 'build' | 'execute' | null {
       if (status === 'planned' || status === 'in_progress') return 'build';
       if (status === 'active') return 'execute';
       return null;
   }
   
   function extractInteger(value: any): number {
       if (typeof value === 'number') return value;
       if (value && typeof value === 'object' && 'low' in value) return value.low;
       return 0;
   }
   ```

3. **Create Main Component** (`frontend/src/components/desks/EnterpriseDesk.tsx`)
   ```tsx
   import React, { useState, useEffect } from 'react';
   import { fetchCapabilityMatrix } from '../../services/enterpriseService';
   import { L1Capability, OverlayType } from '../../types/enterprise';
   import CapabilityMatrix from './enterprise/CapabilityMatrix';
   import OverlayControls from './enterprise/OverlayControls';
   import './enterprise/EnterpriseDesk.css';
   
   interface EnterpriseDeskProps {
       year: string;
       quarter: string;
   }
   
   export default function EnterpriseDesk({ year, quarter }: EnterpriseDeskProps) {
       const [matrixData, setMatrixData] = useState<L1Capability[]>([]);
       const [selectedOverlay, setSelectedOverlay] = useState<OverlayType>('none');
       const [modeFilter, setModeFilter] = useState<'all' | 'build' | 'execute'>('all');
       const [isLoading, setIsLoading] = useState(true);
       const [error, setError] = useState<string | null>(null);
       
       useEffect(() => {
           loadMatrix();
       }, [year, quarter]);
       
       async function loadMatrix() {
           try {
               setIsLoading(true);
               setError(null);
               const data = await fetchCapabilityMatrix(year, quarter);
               setMatrixData(data);
           } catch (err) {
               setError(err instanceof Error ? err.message : 'Failed to load matrix');
           } finally {
               setIsLoading(false);
           }
       }
       
       if (isLoading) return <div className="loading">Loading Enterprise Desk...</div>;
       if (error) return <div className="error">Error: {error}</div>;
       
       return (
           <div className="enterprise-desk">
               <header className="enterprise-desk-header">
                   <h2>Enterprise Capabilities Matrix</h2>
                   <p className="subtitle">Strategic Capability Assessment - {year} {quarter}</p>
               </header>
               
               <OverlayControls
                   selectedOverlay={selectedOverlay}
                   onOverlayChange={setSelectedOverlay}
                   modeFilter={modeFilter}
                   onModeFilterChange={setModeFilter}
               />
               
               <CapabilityMatrix
                   data={matrixData}
                   selectedOverlay={selectedOverlay}
                   modeFilter={modeFilter}
               />
           </div>
       );
   }
   ```

4. **Create Matrix Renderer** (`frontend/src/components/desks/enterprise/CapabilityMatrix.tsx`)
   ```tsx
   import React from 'react';
   import { L1Capability, OverlayType } from '../../../types/enterprise';
   
   interface CapabilityMatrixProps {
       data: L1Capability[];
       selectedOverlay: OverlayType;
       modeFilter: 'all' | 'build' | 'execute';
   }
   
   export default function CapabilityMatrix({ data, selectedOverlay, modeFilter }: CapabilityMatrixProps) {
       return (
           <div className="capability-matrix">
               {data.map(l1 => (
                   <div key={l1.id} className="l1-domain">
                       <div className="l1-header">{l1.name}</div>
                       <div className="l2-container">
                           {l1.l2.map(l2 => (
                               <div key={l2.id} className="l2-subdomain">
                                   <div className="l2-header">{l2.name}</div>
                                   <div className="l3-grid">
                                       {l2.l3.map(l3 => {
                                           const isDimmed = shouldDim(l3, modeFilter);
                                           const cellColor = getCellColor(l3, selectedOverlay);
                                           
                                           return (
                                               <div
                                                   key={l3.id}
                                                   className={`l3-cell ${isDimmed ? 'dimmed' : ''}`}
                                                   style={{ backgroundColor: cellColor }}
                                                   title={l3.name}
                                               >
                                                   <span className="l3-id">{l3.id}</span>
                                               </div>
                                           );
                                       })}
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               ))}
           </div>
       );
   }
   
   function shouldDim(l3: any, modeFilter: string): boolean {
       if (modeFilter === 'all') return false;
       return l3.mode !== modeFilter;
   }
   
   function getCellColor(l3: any, overlay: OverlayType): string {
       if (overlay === 'none') return 'transparent';
       // Add overlay-specific color logic as you implement each overlay
       return 'transparent';
   }
   ```

5. **Create Overlay Controls** (`frontend/src/components/desks/enterprise/OverlayControls.tsx`)
   ```tsx
   import React from 'react';
   import { OverlayType } from '../../../types/enterprise';
   
   interface OverlayControlsProps {
       selectedOverlay: OverlayType;
       onOverlayChange: (overlay: OverlayType) => void;
       modeFilter: 'all' | 'build' | 'execute';
       onModeFilterChange: (mode: 'all' | 'build' | 'execute') => void;
   }
   
   export default function OverlayControls(props: OverlayControlsProps) {
       const overlays: Array<{id: OverlayType; label: string}> = [
           { id: 'none', label: 'No Overlay' },
           { id: 'risk-exposure', label: 'Risk Exposure' },
           { id: 'external-pressure', label: 'External Pressure' },
           { id: 'footprint-stress', label: 'Footprint Stress' },
           { id: 'change-saturation', label: 'Change Saturation' },
           { id: 'trend-warning', label: 'Trend Warning' },
       ];
       
       return (
           <div className="overlay-controls">
               <div className="overlay-buttons">
                   {overlays.map(overlay => (
                       <button
                           key={overlay.id}
                           className={props.selectedOverlay === overlay.id ? 'active' : ''}
                           onClick={() => props.onOverlayChange(overlay.id)}
                       >
                           {overlay.label}
                       </button>
                   ))}
               </div>
               
               <div className="mode-filter">
                   <button
                       className={props.modeFilter === 'all' ? 'active' : ''}
                       onClick={() => props.onModeFilterChange('all')}
                   >All</button>
                   <button
                       className={props.modeFilter === 'build' ? 'active' : ''}
                       onClick={() => props.onModeFilterChange('build')}
                   >BUILD</button>
                   <button
                       className={props.modeFilter === 'execute' ? 'active' : ''}
                       onClick={() => props.onModeFilterChange('execute')}
                   >EXECUTE</button>
               </div>
           </div>
       );
   }
   ```

6. **Add Basic Styles** (`frontend/src/components/desks/enterprise/EnterpriseDesk.css`)
   ```css
   .enterprise-desk {
       padding: 2rem;
       background: var(--bg-primary, #fff);
   }
   
   .enterprise-desk-header {
       margin-bottom: 1.5rem;
   }
   
   .capability-matrix {
       display: flex;
       flex-direction: column;
       gap: 1rem;
   }
   
   .l1-domain {
       border: 2px solid #ddd;
       border-radius: 8px;
       padding: 1rem;
   }
   
   .l1-header {
       font-size: 1.2rem;
       font-weight: bold;
       margin-bottom: 0.5rem;
       color: #333;
   }
   
   .l2-container {
       display: flex;
       flex-wrap: wrap;
       gap: 1rem;
   }
   
   .l2-subdomain {
       flex: 1;
       min-width: 200px;
       border: 1px solid #eee;
       border-radius: 4px;
       padding: 0.5rem;
   }
   
   .l2-header {
       font-size: 0.9rem;
       font-weight: 600;
       margin-bottom: 0.5rem;
       color: #555;
   }
   
   .l3-grid {
       display: grid;
       grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
       gap: 4px;
   }
   
   .l3-cell {
       aspect-ratio: 1;
       border: 1px solid #ccc;
       border-radius: 4px;
       display: flex;
       align-items: center;
       justify-content: center;
       cursor: pointer;
       transition: all 0.2s;
   }
   
   .l3-cell:hover {
       transform: scale(1.1);
       box-shadow: 0 2px 8px rgba(0,0,0,0.2);
   }
   
   .l3-cell.dimmed {
       opacity: 0.3;
   }
   
   .l3-id {
       font-size: 0.7rem;
       color: #666;
   }
   
   .overlay-controls {
       display: flex;
       justify-content: space-between;
       margin-bottom: 1rem;
       padding: 1rem;
       background: #f9fafb;
       border-radius: 8px;
   }
   
   .overlay-buttons, .mode-filter {
       display: flex;
       gap: 0.5rem;
   }
   
   .overlay-controls button {
       padding: 0.5rem 1rem;
       border: 1px solid #ddd;
       background: white;
       border-radius: 4px;
       cursor: pointer;
       transition: all 0.2s;
   }
   
   .overlay-controls button.active {
       background: #3b82f6;
       color: white;
       border-color: #3b82f6;
   }
   
   .overlay-controls button:hover:not(.active) {
       background: #f3f4f6;
   }
   ```

**Phase 1 Verification:**
- Navigate to `/josoor` and select Enterprise Desk from sidebar
- Matrix should display L1/L2/L3 hierarchy
- Year/quarter filters should work
- Mode filter (ALL/BUILD/EXECUTE) should dim non-matching capabilities
- No overlays active yet (cells should be transparent)

### Phase 2: Overlay 1 - Risk Exposure

**Goal:** Implement Risk Exposure overlay with color coding

**Steps:**

1. **Enrich L3 with Risk Data** (Update `enterpriseService.ts`)
   ```typescript
   function enrichWithRiskData(l3: any, risks: any[], mode: 'build' | 'execute'): L3Capability {
       const risk = risks.find(r => 
           r.id === l3.id && 
           extractInteger(r.year) === extractInteger(l3.year) &&
           r.quarter === l3.quarter
       );
       
       if (!risk) {
           return {
               ...l3,
               exposure_percent: null,
               hasData: false
           };
       }
       
       if (mode === 'build') {
           return {
               ...l3,
               exposure_percent: risk.build_exposure_pct ?? 0,
               expected_delay_days: risk.expected_delay_days ?? 0,
               likelihood_of_delay: risk.likelihood_of_delay ?? 0,
               hasData: true
           };
       } else {
           return {
               ...l3,
               exposure_percent: risk.operate_exposure_pct_effective ?? 0,
               operational_health_score: risk.operational_health_pct ?? 0,
               people_score: risk.people_score ?? 0,
               process_score: risk.process_score ?? 0,
               tools_score: risk.tools_score ?? 0,
               exposure_trend: calculateTrend(risk),
               hasData: true
           };
       }
   }
   
   function calculateTrend(risk: any): 'improving' | 'declining' | 'stable' {
       const current = risk.operational_health_pct ?? 0;
       const prev = risk.prev_operational_health_pct ?? current;
       const prev2 = risk.prev2_operational_health_pct ?? prev;
       
       if (current > prev && prev > prev2) return 'improving';
       if (current < prev && prev < prev2) return 'declining';
       return 'stable';
   }
   ```

2. **Add Color Calculation** (`frontend/src/utils/enterpriseOverlayUtils.ts`)
   ```typescript
   export function getRiskExposureColor(exposurePercent: number | null): string {
       if (exposurePercent === null) return 'transparent';
       
       if (exposurePercent < 5) {
           return 'rgba(16, 185, 129, 0.6)'; // GREEN
       } else if (exposurePercent < 15) {
           return calculateGradient(exposurePercent, 5, 15);
       } else {
           return 'rgba(239, 68, 68, 0.6)'; // RED
       }
   }
   
   function calculateGradient(value: number, min: number, max: number): string {
       const green = [16, 185, 129];
       const red = [239, 68, 68];
       
       const ratio = (value - min) / (max - min);
       const r = Math.round(green[0] + (red[0] - green[0]) * ratio);
       const g = Math.round(green[1] + (red[1] - green[1]) * ratio);
       const b = Math.round(green[2] + (red[2] - green[2]) * ratio);
       
       return `rgba(${r}, ${g}, ${b}, 0.6)`;
   }
   ```

3. **Update CapabilityMatrix Component**
   ```typescript
   import { getRiskExposureColor } from '../../../utils/enterpriseOverlayUtils';
   
   function getCellColor(l3: L3Capability, overlay: OverlayType): string {
       if (overlay === 'none') return 'transparent';
       
       if (overlay === 'risk-exposure') {
           return getRiskExposureColor(l3.exposure_percent ?? null);
       }
       
       return 'transparent';
   }
   ```

**Phase 2 Verification:**
- Toggle "Risk Exposure" overlay
- Cells should show green (<5%), amber (5-15%), or red (≥15%)
- Cells with no data should remain transparent
- Mode filter should still work

### Phase 3-6: Remaining Overlays

Follow similar pattern for:
- Phase 3: Overlay 2 - External Pressure (requires chain queries)
- Phase 4: Overlay 3 - Footprint Stress (similar to Overlay 1)
- Phase 5: Overlay 4 - Change Saturation (requires new backend endpoint)
- Phase 6: Overlay 5 - Trend Warning (EXECUTE mode only)

---

## Testing Requirements

### Unit Tests (MUST Pass)
```typescript
// tests/enterpriseService.test.ts

describe('getCapabilityMatrix', () => {
    test('matches EntityRisk to EntityCapability via composite key', () => {
        // Assert: Each L3 has correct risk data matched
    });
    
    test('builds 3-level hierarchy correctly', () => {
        // Assert: L1 → L2 → L3 parent/child relationships
    });
    
    test('handles missing EntityRisk gracefully', () => {
        // Assert: L3 without risk shows null/default values
    });
});

describe('Overlay calculations', () => {
    test('Risk Exposure: BUILD mode uses build_exposure_pct', () => {
        // Assert: exposure_percent = risk.build_exposure_pct
    });
    
    test('Risk Exposure: EXECUTE mode uses operate_exposure_pct_effective', () => {
        // Assert: exposure_percent = risk.operate_exposure_pct_effective
    });
    
    test('Footprint Stress: balanced scores = GREEN', () => {
        // Assert: [5,5,5] and [2,2,2] both return GREEN
    });
    
    test('Footprint Stress: imbalanced scores = RED', () => {
        // Assert: [5,5,1] returns RED with dominant='T'
    });
    
    test('Trend Warning: 2 consecutive declines while GREEN = RED flag', () => {
        // Assert: operate_trend_flag = true
    });
});
```

### Integration Tests (MUST Pass)
```typescript
// tests/EnterpriseDesk.integration.test.tsx

describe('EnterpriseDesk integration', () => {
    test('loads matrix data on mount', async () => {
        // Assert: API called with correct params
        // Assert: Matrix renders with L1/L2/L3 structure
    });
    
    test('overlay toggle changes cell colors', async () => {
        // Assert: Switching from 'none' to 'risk-exposure' changes colors
    });
    
    test('mode filter dims non-matching capabilities', async () => {
        // Assert: BUILD filter dims EXECUTE capabilities
    });
    
    test('tooltip shows correct overlay data', async () => {
        // Assert: Hovering cell shows overlay-specific metrics
    });
});
```

### Manual QA Checklist
- [ ] Matrix loads within 2 seconds
- [ ] All 5 overlays toggle without errors
- [ ] Tooltips display correct data for each overlay
- [ ] Mode filter works in both BUILD and EXECUTE
- [ ] Year/quarter changes trigger re-fetch
- [ ] No console errors or warnings
- [ ] Colors match specification exactly
- [ ] Text labels match specification format
- [ ] Edge cases handled (missing data, null values)

---

## Deployment Checklist

### Pre-Deployment
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual QA checklist complete
- [ ] Performance targets met (<2s load time)
- [ ] No console warnings in production build
- [ ] TypeScript compilation successful (no errors)
- [ ] ESLint passes with no warnings

### Backend Requirements
- [ ] `/api/graph` endpoint returns EntityCapability + EntityRisk
- [ ] `/api/chains` endpoint supports PolicyTool/Performance queries
- [ ] `/api/enterprise/change-saturation` endpoint deployed (Overlay 4)
- [ ] All endpoints return business IDs in `id` field (not element IDs)
- [ ] Neo4j integer fields properly converted to numbers

### Frontend Build
- [ ] Vite build completes successfully
- [ ] Bundle size acceptable (<500KB for enterprise route)
- [ ] Source maps generated for debugging
- [ ] Environment variables set correctly

### Post-Deployment Verification
- [ ] Navigate to `/josoor/enterprise` - no errors
- [ ] Toggle all 5 overlays - all work correctly
- [ ] Switch between BUILD and EXECUTE modes - filters apply
- [ ] Change year/quarter - data refreshes
- [ ] Check browser console - no errors
- [ ] Test on Chrome, Firefox, Safari (major browsers)
- [ ] Test on mobile viewport (responsive)

---

## Critical Rules (NEVER Violate)

### Data Access Rules

1. **NEVER calculate overlay metrics from scratch** - Use pre-calculated fields from EntityRisk
   - ❌ `exposure_pct = (delay / 90) * 100`
   - ✅ `exposure_pct = risk.build_exposure_pct`

2. **NEVER match capabilities by name or element ID** - Use composite key (id + year + quarter)
   - ❌ `risk.name === capability.name`
   - ✅ `risk.id === capability.id && risk.year === capability.year && risk.quarter === capability.quarter`

3. **NEVER invent status values** - Only 'planned', 'in_progress', 'active' exist
   - ❌ `status === 'building'`
   - ✅ `status === 'planned' || status === 'in_progress'`

4. **NEVER skip year/quarter in matching** - Always use composite key
   - ❌ `risk.id === capability.id`
   - ✅ `risk.id === capability.id && risk.year === capability.year && risk.quarter === capability.quarter`

5. **NEVER modify EntityRisk data** - Read-only consumption
   - ❌ `risk.build_exposure_pct = calculateExposure()`
   - ✅ `const exposure = risk.build_exposure_pct ?? 0`

### UI/UX Rules

6. **NEVER allow multiple overlays active simultaneously** - Single overlay at a time
   - ❌ Show both Risk Exposure AND External Pressure colors
   - ✅ User selects ONE overlay, others are inactive

7. **NEVER mix overlay colors** - No color blending or layering
   - ❌ `backgroundColor: blend(riskColor, pressureColor)`
   - ✅ `backgroundColor: selectedOverlay === 'risk-exposure' ? riskColor : 'transparent'`

8. **NEVER show unavailable overlays in wrong mode** - Mode-specific overlay availability
   - ❌ Show "Change Saturation" button enabled in EXECUTE mode
   - ✅ Disable or hide "Change Saturation" button in EXECUTE mode

### Performance Rules

9. **NEVER make 285+ individual API calls** - Use batch fetching or single endpoint
   - ❌ `capabilities.map(c => fetch('/api/chains?sourceId=' + c.id))`
   - ✅ `fetch('/api/enterprise/external-pressure', { body: capabilityIds })`

10. **NEVER cache across year/quarter changes** - Invalidate cache on filter change
    - ❌ Keep same data when user changes from 2025 Q4 to 2026 Q1
    - ✅ Refetch data when year or quarter changes

### Data Integrity Rules

11. **NEVER use element IDs for business logic** - Business IDs only
    - ❌ `capability.elementId === '4:eae8d877...'`
    - ✅ `capability.id === '1.1.1'`

12. **NEVER assume data completeness** - Handle null/undefined gracefully
    - ❌ `const exposure = risk.build_exposure_pct`
    - ✅ `const exposure = risk?.build_exposure_pct ?? 0`

13. **NEVER ignore cumulative filtering** - Year/quarter filtering is cumulative
    - ❌ Show only Q3 2026 data when user selects 2026 Q3
    - ✅ Show all of 2025 + 2026 Q1-Q3 data when user selects 2026 Q3

### Route Isolation Rules

14. **NEVER drift from /josoor route** - Enterprise Desk is a view within JosoorShell
    - ❌ Create separate route `/josoor/enterprise` or `/enterprise-desk`
    - ✅ Use `activeView === 'enterprise-desk'` within JosoorShell

15. **NEVER bypass JosoorShell state** - Year/quarter managed by parent
    - ❌ Manage year/quarter state inside EnterpriseDesk
    - ✅ Receive year/quarter as props from JosoorShell

### Calculation Rules

16. **NEVER recalculate EntityRisk scores** - Backend calculates, frontend displays
    - ❌ `operational_health = avg(people_score, process_score, tools_score)`
    - ✅ `operational_health = risk.operational_health_pct`

17. **NEVER use magic numbers** - Use thresholds from Enterprise Ontology SST
    - ❌ `if (exposure > 10) return 'red'`
    - ✅ `if (exposure >= THRESHOLDS.EXPOSURE_AMBER_MAX) return 'red'`

18. **NEVER hardcode overlay logic** - Follow ENTERPRISE_DESK_OVERLAY_SPECIFICATION.md exactly
    - ❌ Invent new calculation for Footprint Stress
    - ✅ Use exact formula from specification document

### Error Handling Rules

19. **NEVER let errors crash the entire desk** - Graceful degradation per overlay
    - ❌ If External Pressure fails, entire desk breaks
    - ✅ If External Pressure fails, show error for that overlay only, others work

20. **NEVER hide errors from users** - Show user-friendly error messages
    - ❌ `console.error('Failed to fetch')` with no UI feedback
    - ✅ Display error banner: "External Pressure data unavailable. Other overlays still functional."

---

## Support and References

### Primary Documents (In Order of Authority)
1. **This document** - Implementation rules (HIGHEST AUTHORITY)
2. [ENTERPRISE_DESK_OVERLAY_SPECIFICATION.md](./ENTERPRISE_DESK_OVERLAY_SPECIFICATION.md) - Overlay calculations
3. [Enterprise_Ontology_SST_v1_1.md](../attached_assets/Enterprise_Ontology_SST_v1_1_1768206798485.md) - Data model
4. [DATA_ARCHITECTURE.md](../attached_assets/DATA_ARCHITECTURE.md) - Database schemas
5. [SYSTEM_API_CATALOG_v1.4.md](../attached_assets/SYSTEM_API_CATALOG_v1.4.md) - API reference
6. [screen_mapping.md](../attached_assets/screen_mapping.md) - Chain query mappings

### Development Contact
- **Route:** `/josoor` (EnterpriseDesk view within JosoorShell)
- **Component:** `frontend/src/components/desks/EnterpriseDesk.tsx`
- **Shell:** `frontend/src/app/josoor/JosoorShell.tsx`
- **Last Updated:** January 17, 2026

---

## Appendix A: TypeScript Type Definitions

```typescript
// types/enterprise.ts - COMPLETE TYPE DEFINITIONS

export type OverlayType = 
    | 'none' 
    | 'risk-exposure' 
    | 'external-pressure' 
    | 'footprint-stress' 
    | 'change-saturation' 
    | 'trend-warning';

export type Mode = 'build' | 'execute';

export interface EntityCapability {
    id: string;                         // Business ID (e.g., "1.0")
    elementId: string;                  // Neo4j internal ID (ignore)
    name: string;
    description: string;
    maturity_level: number;             // 1-5
    target_maturity_level: number;      // 1-5
    status: 'planned' | 'in_progress' | 'active';
    parent_id: string;
    parent_year: number;
    quarter: string;                    // "Q1", "Q2", "Q3", "Q4"
    year: number;
    level: 'L1' | 'L2' | 'L3';
}

export interface EntityRisk {
    id: string;                         // Matches capability.id
    elementId: string;
    name: string;
    risk_category: string;
    risk_status: string;
    quarter: string;
    year: number;
    
    // BUILD MODE fields
    likelihood_of_delay?: number;
    delay_days?: number;
    expected_delay_days?: number;
    build_exposure_pct?: number;        // 0-100%
    build_band?: string;
    
    // EXECUTE MODE fields
    people_score?: number;              // 1-5 scale
    process_score?: number;             // 1-5 scale
    tools_score?: number;               // 1-5 scale
    operational_health_pct?: number;    // 0-100%
    operate_exposure_pct_raw?: number;
    operate_exposure_pct_effective?: number;
    operate_band?: string;
    operate_trend_flag?: boolean;
    
    // Trend tracking
    prev_operational_health_pct?: number;
    prev2_operational_health_pct?: number;
}

export interface L3Capability extends EntityCapability {
    level: 'L3';
    mode: Mode | null;
    
    // Overlay 1: Risk Exposure
    exposure_percent?: number;          // 0-100
    expected_delay_days?: number;       // BUILD only
    operational_health_score?: number;  // EXECUTE only
    exposure_trend?: 'improving' | 'declining' | 'stable';
    
    // Overlay 2: External Pressure
    policy_tool_count?: number;         // BUILD mode
    performance_target_count?: number;  // EXECUTE mode
    health_history?: number[];          // [prev2, prev, current]
    external_pressure_urgent?: boolean;
    
    // Overlay 3: Footprint Stress
    people_score?: number;              // 1-5
    process_score?: number;             // 1-5
    tools_score?: number;               // 1-5
    org_gap?: number;
    process_gap?: number;
    it_gap?: number;
    stress_percent?: number;            // 0-100
    
    // Overlay 4: Change Saturation
    saturation_team?: string;           // Name of affected team
    saturation_team_pct?: number;       // Team's compression %
    saturation_color?: string;
    
    // Overlay 5: Trend Warning
    current_health_pct?: number;
    prev_health_pct?: number;
    prev2_health_pct?: number;
    operate_trend_flag?: boolean;
    health_trend?: 'improving' | 'declining' | 'stable';
    
    // Meta
    hasData: boolean;                   // False if EntityRisk missing
}

export interface L2Capability extends EntityCapability {
    level: 'L2';
    l3: L3Capability[];
}

export interface L1Capability extends EntityCapability {
    level: 'L1';
    l2: L2Capability[];
}

export interface OverlayState {
    riskExposure: boolean;
    externalPressure: boolean;
    footprintStress: boolean;
    changeSaturation: boolean;
    trendWarning: boolean;
}

export interface TeamChangeLoad {
    org_unit_id: string;
    org_unit_name: string;
    recent_change_count: number;        // BUILD in last 2Q
    total_capabilities: number;
    change_compression_pct: number;     // 0-100%
}

export interface ChangeSaturationData {
    team_name: string | null;
    team_pct: number;
    color: string;
}

export interface ExternalPressureData {
    count: number;
    isUrgent: boolean;
    color: string;
}

export interface TooltipData {
    capability: L3Capability;
    overlay: OverlayType;
    mode: Mode;
    position: { x: number; y: number };
}
```

---

## Appendix B: Color Constants

```typescript
// constants/enterpriseColors.ts

export const OVERLAY_COLORS = {
    // Standard palette
    GREEN: 'rgba(16, 185, 129, 0.6)',
    RED: 'rgba(239, 68, 68, 0.6)',
    DIMMED: 'rgba(100, 100, 100, 0.1)',
    TRANSPARENT: 'transparent',
    
    // Change Saturation shades
    RED_DARK: 'rgba(239, 68, 68, 0.8)',      // Team #1 (highest %)
    RED_MEDIUM: 'rgba(239, 68, 68, 0.6)',    // Team #2
    RED_LIGHT: 'rgba(239, 68, 68, 0.4)',     // Team #3
    
    // Gradient endpoints (for interpolation)
    AMBER_START: 'rgba(16, 185, 129, 0.6)',  // Green
    AMBER_END: 'rgba(239, 68, 68, 0.6)',     // Red
} as const;

export const THRESHOLDS = {
    // Risk Exposure & Footprint Stress
    EXPOSURE_GREEN_MAX: 5,       // < 5% = green
    EXPOSURE_AMBER_MAX: 15,      // 5-15% = amber, >= 15% = red
    
    STRESS_GREEN_MAX: 5,         // < 5% = green
    STRESS_AMBER_MAX: 15,        // 5-15% = amber, >= 15% = red
    
    // External Pressure
    EXTERNAL_PRESSURE_HIGH: 3,   // >= 3 mandates/targets = high pressure
    
    // Trend Warning (EXECUTE mode)
    BAND_GREEN_MAX: 35,          // < 35% exposure = still green
    
    // Change Saturation
    TOP_TEAMS_COUNT: 3,          // Show top 3 most saturated teams
} as const;

export const MODE_CONFIG = {
    build: {
        label: 'BUILD Mode',
        description: 'Project Delivery',
        icon: '🏗️',
        statusFilter: ['planned', 'in_progress'],
        availableOverlays: [
            'risk-exposure',
            'external-pressure',
            'footprint-stress',
            'change-saturation'
        ]
    },
    execute: {
        label: 'EXECUTE Mode',
        description: 'Operational Health',
        icon: '⚙️',
        statusFilter: ['active'],
        availableOverlays: [
            'risk-exposure',
            'external-pressure',
            'footprint-stress',
            'trend-warning'
        ]
    }
} as const;
```

---

## Appendix C: Quick Reference Commands

### Development Commands

```bash
# Navigate to frontend
cd /home/mosab/projects/josoorfe/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run specific test file
npm run test EnterpriseDesk.test.tsx

# Type check
npm run type-check

# Lint
npm run lint

# Format code
npm run format
```

### Backend Services

```bash
# Check Graph Server status
systemctl status josoor-graph.service

# Restart Graph Server
sudo systemctl restart josoor-graph.service

# Check Graph Server logs
journalctl -u josoor-graph.service -f

# Health check
curl https://betaBE.aitwintech.com/api/health

# Test graph endpoint
curl "https://betaBE.aitwintech.com/api/graph?nodeLabels=EntityCapability&limit=10"
```

### Key API Endpoints

```bash
# Graph Server (all nodes)
GET https://betaBE.aitwintech.com/api/graph?nodeLabels=EntityCapability,EntityRisk&excludeEmbeddings=true

# Chain queries (External Pressure overlay)
GET https://betaBE.aitwintech.com/api/chains?sourceLabel=EntityCapability&sourceId=1.1.1&targetLabel=SectorPolicyTool

# Change Saturation (when implemented)
POST https://betaBE.aitwintech.com/api/enterprise/change-saturation
Body: {"currentYear": 2026, "currentQuarter": "Q3"}

# MCP Noor Router (for AI agent queries)
POST https://betaBE.aitwintech.com/1/mcp/
```

---

## Appendix D: Overlay Quick Reference Table

| # | Overlay Name | BUILD | EXECUTE | Data Source | Display | Color Logic |
|---|--------------|-------|---------|-------------|---------|-------------|
| 1 | Risk Exposure | ✅ | ✅ | EntityRisk direct | Text + Color | <5% green, 5-15% amber, ≥15% red |
| 2 | External Pressure | ✅ | ✅ | Chain queries | Color only | Binary: urgent=red, ok=green |
| 3 | Footprint Stress | ✅ | ✅ | EntityRisk direct | Text + Color | Range-based: balanced=green, imbalanced=red |
| 4 | Change Saturation | ✅ | ⚪ | ROLE_GAPS + OPERATES | Color only | 3-tier red + dimmed gray |
| 5 | Trend Warning | ⚪ | ✅ | EntityRisk multi-quarter | Color only | Declining while green=red, else none |

**Legend:**
- ✅ = Available and functional
- ⚪ = Disabled or grayed out
- Text = Shows numeric/text label in cell
- Color only = No text, just background color

---

## Appendix E: Comprehensive Troubleshooting Guide

### Data Loading Issues

#### Problem: "Matrix not loading" or "Empty matrix displayed"

**Symptoms:**
- No L1/L2/L3 nodes appear
- Loading spinner indefinitely
- Console shows 200 OK but no data

**Diagnosis Steps:**
1. Check browser console for network errors
2. Inspect `/api/graph` response in Network tab
3. Verify `nodes` array is not empty
4. Check if `nodeLabels=EntityCapability,EntityRisk` is in request

**Solutions:**
```typescript
// Add detailed logging to fetchCapabilityMatrix
console.log('Fetching matrix:', { year, quarter });
const response = await fetch(endpoint);
console.log('Response status:', response.status);
const data = await response.json();
console.log('Nodes fetched:', data.nodes.length);
console.log('Capabilities:', data.nodes.filter(n => n.label === 'EntityCapability').length);
console.log('Risks:', data.nodes.filter(n => n.label === 'EntityRisk').length);
```

**Common Causes:**
- Backend down: Check `systemctl status josoor-graph.service`
- Neo4j connection lost: Restart Neo4j service
- Wrong endpoint URL: Verify `betaBE.aitwintech.com` is accessible
- CORS issues: Check browser console for CORS errors

---

#### Problem: "Hierarchy not building correctly" (L1s show but no L2s or L3s)

**Symptoms:**
- Only L1 nodes visible
- L2/L3 children missing
- `l2.length` is 0 for all L1s

**Diagnosis:**
```typescript
// Add logging to buildHierarchy function
console.log('L1 nodes:', l1Nodes.length);
console.log('L2 nodes:', l2Nodes.length);
console.log('L3 nodes:', l3Nodes.length);

// For each L1, log matching children
l1Nodes.forEach(l1 => {
    const children = l2Nodes.filter(l2 => 
        l2.parent_id === l1.id && 
        extractInteger(l2.parent_year) === extractInteger(l1.year)
    );
    console.log(`L1 ${l1.id} has ${children.length} children`);
});
```

**Solutions:**
1. **Integer extraction issue:**
   ```typescript
   // Verify extractInteger is handling Neo4j integers correctly
   function extractInteger(value: any): number {
       if (typeof value === 'number') return value;
       if (value?.low !== undefined) return value.low;
       console.warn('Unexpected integer format:', value);
       return 0;
   }
   ```

2. **Parent matching issue:**
   ```typescript
   // Ensure exact match on parent_id AND parent_year
   const l2Children = l2Nodes.filter(l2 => {
       const idMatch = l2.parent_id === l1.id;
       const yearMatch = extractInteger(l2.parent_year) === extractInteger(l1.year);
       if (!idMatch || !yearMatch) {
           console.log(`L2 ${l2.id} does not match L1 ${l1.id}:`, { idMatch, yearMatch });
       }
       return idMatch && yearMatch;
   });
   ```

---

#### Problem: "EntityRisk not matching EntityCapability"

**Symptoms:**
- All overlays show "No Data"
- `hasData: false` for all L3s
- Risk fields are null/undefined

**Diagnosis:**
```typescript
// Log matching attempts
const risk = risks.find(r => {
    const idMatch = r.id === capability.id;
    const yearMatch = extractInteger(r.year) === extractInteger(capability.year);
    const quarterMatch = r.quarter === capability.quarter;
    
    console.log(`Matching risk for ${capability.id}:`, {
        capYear: capability.year,
        riskYear: r.year,
        idMatch,
        yearMatch,
        quarterMatch
    });
    
    return idMatch && yearMatch && quarterMatch;
});
```

**Solutions:**
1. **Quarter format mismatch:**
   ```typescript
   // Normalize quarter format
   function normalizeQuarter(q: any): string {
       if (typeof q === 'string') return q.toUpperCase(); // Ensure "Q1", not "q1"
       if (typeof q === 'number') return `Q${q}`;
       return 'Q1'; // Default fallback
   }
   ```

2. **Year format mismatch:**
   ```typescript
   // Always extract integers before comparison
   const yearMatch = extractInteger(r.year) === extractInteger(capability.year);
   ```

---

### Overlay-Specific Issues

#### Problem: "Risk Exposure colors not showing"

**Symptoms:**
- Overlay toggle works but cells stay transparent
- `exposure_percent` is null or undefined

**Diagnosis:**
```typescript
// Check if risk data is enriched
console.log('L3 sample:', matrixData[0]?.l2[0]?.l3[0]);
// Should show: { ..., exposure_percent: number, hasData: true }

// Check color calculation
const color = getRiskExposureColor(l3.exposure_percent);
console.log(`L3 ${l3.id} exposure ${l3.exposure_percent}% -> ${color}`);
```

**Solutions:**
1. **Risk enrichment not called:**
   ```typescript
   // Ensure enrichWithRiskData is called in buildHierarchy
   l3: l3Nodes
       .filter(...)
       .map(l3 => enrichWithRiskData(l3, risks, getMode(l3.status)))
   ```

2. **Mode mismatch:**
   ```typescript
   // Verify mode-specific field is used
   if (mode === 'build') {
       exposure_percent = risk.build_exposure_pct; // Not operate_exposure_pct_effective!
   }
   ```

---

#### Problem: "External Pressure overlay hangs/slow"

**Symptoms:**
- Browser freezes when toggling overlay
- Network tab shows hundreds of pending requests
- Console shows "Too many requests" errors

**Cause:** Making 285+ individual chain requests simultaneously

**Solutions:**

**Option 1: Batch with concurrency limit**
```typescript
async function fetchExternalPressureData(capabilities: L3Capability[], mode: Mode) {
    const BATCH_SIZE = 10;
    const results: Map<string, number> = new Map();
    
    for (let i = 0; i < capabilities.length; i += BATCH_SIZE) {
        const batch = capabilities.slice(i, i + BATCH_SIZE);
        const promises = batch.map(cap => fetchChainCount(cap, mode));
        
        const counts = await Promise.allSettled(promises);
        counts.forEach((result, idx) => {
            if (result.status === 'fulfilled') {
                results.set(batch[idx].id, result.value);
            }
        });
        
        // Progress indicator
        console.log(`External Pressure: ${i + batch.length}/${capabilities.length}`);
    }
    
    return results;
}
```

**Option 2: Backend aggregation endpoint (RECOMMENDED)**
```typescript
// Request all counts in one call
async function fetchExternalPressureBatch(capabilityIds: string[], mode: Mode) {
    const response = await fetch('/api/enterprise/external-pressure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capabilityIds, mode })
    });
    
    return await response.json();
    // Returns: { [capId: string]: count }
}
```

---

#### Problem: "Change Saturation endpoint not found (404)"

**Symptoms:**
- Overlay 4 toggle shows error
- Network tab shows 404 on `/api/enterprise/change-saturation`

**Cause:** Backend endpoint not yet implemented

**Solution:**
```typescript
// Implement backend endpoint first (see Backend Endpoint Specifications section)
// OR gracefully degrade:
try {
    const data = await fetchChangeSaturation(year, quarter);
    setChangeSaturationData(data);
} catch (error) {
    console.warn('Change Saturation endpoint not available:', error);
    // Disable overlay button
    setOverlayAvailability(prev => ({ ...prev, 'change-saturation': false }));
    // Show user notification
    showNotification('Change Saturation overlay temporarily unavailable');
}
```

---

### Performance Issues

#### Problem: "Matrix takes >5 seconds to load"

**Diagnosis:**
```typescript
console.time('Fetch matrix');
const data = await fetchCapabilityMatrix(year, quarter);
console.timeEnd('Fetch matrix');

console.time('Build hierarchy');
const hierarchy = buildHierarchy(capabilities, risks);
console.timeEnd('Build hierarchy');
```

**Solutions:**

1. **Network bottleneck:**
   - Reduce payload size: Always use `excludeEmbeddings=true`
   - Enable compression: Check server sends `Content-Encoding: gzip`
   - Use CDN if available

2. **Client-side processing:**
   ```typescript
   // Memoize expensive operations
   const hierarchy = useMemo(
       () => buildHierarchy(capabilities, risks),
       [capabilities, risks] // Only rebuild when data changes
   );
   
   const filteredData = useMemo(
       () => applyFilters(hierarchy, year, quarter),
       [hierarchy, year, quarter]
   );
   ```

3. **Render optimization:**
   ```typescript
   // Use React.memo for matrix cells
   const L3Cell = React.memo(({ capability, overlay }: L3CellProps) => {
       // Cell rendering logic
   }, (prevProps, nextProps) => {
       // Only re-render if overlay or capability data changed
       return prevProps.overlay === nextProps.overlay &&
              prevProps.capability.id === nextProps.capability.id;
   });
   ```

---

#### Problem: "Overlay toggle lag (>500ms)"

**Cause:** Re-calculating overlay data on every toggle

**Solution:**
```typescript
// Pre-calculate ALL overlay data once, toggle just changes which to display
useEffect(() => {
    const enriched = matrixData.map(l1 => ({
        ...l1,
        l2: l1.l2.map(l2 => ({
            ...l2,
            l3: l3.map(l3 => ({
                ...l3,
                // Pre-calculate all overlays
                riskExposure: calculateRiskExposure(l3, mode),
                externalPressure: externalPressureMap.get(l3.id) ?? null,
                footprintStress: calculateFootprintStress(l3),
                changeSaturation: changeSaturationMap.get(l3.id) ?? null,
                trendWarning: calculateTrendWarning(l3, mode),
            }))
        }))
    }));
    
    setEnrichedData(enriched);
}, [matrixData, mode, externalPressureMap, changeSaturationMap]);

// Toggle just changes display
function getCellColor(l3: L3Capability, overlay: OverlayType): string {
    switch (overlay) {
        case 'risk-exposure': return l3.riskExposure.color;
        case 'external-pressure': return l3.externalPressure?.color ?? 'transparent';
        // ... etc
    }
}
```

---

### Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "No EntityRisk found for capability X" | EntityRisk node missing in graph | Display cell as "No Data", proceed with other overlays |
| "Failed to fetch external pressure data" | Chain endpoint timeout/error | Show error for External Pressure overlay only, others work |
| "Composite key match failed" | Year/quarter mismatch | Verify cumulative filtering applied correctly |
| "Mode-specific field undefined" | Accessing BUILD field in EXECUTE mode | Always check mode before accessing mode-specific fields |
| "Maximum call stack size exceeded" | Recursive hierarchy building issue | Check parent_id/parent_year matching logic |
| "Cannot read property 'id' of undefined" | Capability or risk is null | Add null checks: `capability?.id` |
| "Overlay toggle not working" | Multiple overlays active simultaneously | Enforce single overlay active at a time |
| "Colors not updating" | Memoization cache not invalidated | Add dependencies to useMemo: [data, overlay, mode] |
| "CORS policy blocked" | Backend CORS not configured | Add origin to backend CORS whitelist |
| "Network request failed" | Backend offline or unreachable | Check `systemctl status josoor-graph.service` |
| "Unexpected token < in JSON" | Backend returned HTML error page | Check response.ok before response.json() |
| "Integer object {low: X, high: Y}" | Neo4j integer not converted | Use extractInteger() helper function |

---

## Appendix F: Architectural Decision Records (ADRs)

### ADR-001: Single Overlay Selection Model

**Status:** Accepted  
**Date:** 2026-01-17  
**Deciders:** Product, Engineering

**Context:**
Could allow multiple overlays active simultaneously (e.g., show both Risk Exposure AND External Pressure colors).

**Decision:**
ONLY ONE overlay can be active at a time. User must toggle between overlays.

**Rationale:**
1. **Visual Clarity:** Multiple overlays would create color conflicts/blending
2. **Cognitive Load:** Easier to interpret one metric at a time
3. **Performance:** No need to calculate/render multiple overlay colors simultaneously
4. **User Intent:** User focuses on one strategic question at a time

**Consequences:**
- Simpler UI logic
- Faster rendering
- Clear user mental model
- Cannot directly compare two overlays side-by-side (would need dual-view feature)

---

### ADR-002: Cumulative Year/Quarter Filtering

**Status:** Accepted  
**Date:** 2026-01-17  
**Deciders:** Product, Data Architecture

**Context:**
Could filter to exact year/quarter match (2026 Q3 = only Q3 2026 data) vs cumulative (2026 Q3 = all of 2025 + 2026 Q1-Q3).

**Decision:**
Use CUMULATIVE filtering. "2026 Q3" includes ALL of 2025 + 2026 Q1-Q3.

**Rationale:**
1. **Historical Context:** Capabilities/risks evolve over time, need history
2. **Trend Analysis:** Overlay 5 (Trend Warning) requires multi-quarter history
3. **Complete Picture:** Show full transformation journey, not snapshot
4. **Data Availability:** Some nodes created in earlier quarters still relevant

**Consequences:**
- Larger dataset to process (more nodes)
- Richer context for analysis
- Must clearly communicate "up to Q3" not "only Q3" to users
- Backend/frontend must apply same filtering logic (consistency)

---

### ADR-003: Mode Derived from Capability Status

**Status:** Accepted  
**Date:** 2026-01-17  
**Deciders:** Data Architecture, Engineering

**Context:**
Could store mode as separate field on EntityCapability, or derive from status field.

**Decision:**
DERIVE mode from status field:
- `status = 'planned' | 'in_progress'` → BUILD mode
- `status = 'active'` → EXECUTE mode

**Rationale:**
1. **Single Source of Truth:** Status is already tracked, no need for redundant field
2. **Data Integrity:** No risk of mode/status mismatch
3. **Ontology Compliance:** Enterprise Ontology SST v1.1 defines this mapping

**Consequences:**
- Must map status → mode in every data access
- Cannot have `status = 'active'` in BUILD mode (prevented by design)
- Clear separation: BUILD capabilities are NOT yet ACTIVE

---

### ADR-004: Client-Side Overlay Enrichment (for now)

**Status:** Accepted (with future migration path)  
**Date:** 2026-01-17  
**Deciders:** Engineering

**Context:**
Could calculate overlay data on backend (server-side) vs frontend (client-side).

**Decision:**
Start with CLIENT-SIDE enrichment for Overlays 1, 3, 5. Require BACKEND endpoints for Overlays 2, 4.

**Rationale:**
1. **Overlay 1, 3, 5:** Data already in EntityRisk, simple calculations, no extra queries
2. **Overlay 2:** Requires 285+ chain queries, backend aggregation needed
3. **Overlay 4:** Requires complex team metrics, backend calculation mandatory
4. **Iteration Speed:** Frontend-first allows rapid prototyping
5. **Backend Capacity:** Avoid overloading backend with simple calculations

**Consequences:**
- Faster initial development
- More client-side code/logic
- Potential performance impact for complex overlays (mitigated by memoization)
- Future migration path: Move to backend as optimization

**Future State:**
Create unified `/api/enterprise/matrix-enriched` endpoint that returns fully enriched data with all overlays pre-calculated.

---

### ADR-005: 1:1 EntityRisk to EntityCapability Relationship

**Status:** Accepted  
**Date:** 2026-01-17  
**Deciders:** Data Architecture

**Context:**
Could have N:M relationship (multiple risks per capability) or 1:1.

**Decision:**
Enforce strict 1:1 relationship matched by composite key `(id, year, quarter)`.

**Rationale:**
1. **Simplicity:** No need to aggregate multiple risks
2. **Data Model:** Enterprise Ontology SST v1.1 defines 1:1
3. **Predictability:** Every capability has exactly zero or one matching risk
4. **Performance:** O(1) lookup instead of filtering arrays

**Consequences:**
- Must ensure backend creates exactly one EntityRisk per EntityCapability
- Missing risk = graceful degradation (show "No Data")
- Cannot model "multiple risks for one capability" (requires data model change)

---

### ADR-006: Props-Based Year/Quarter from JosoorShell

**Status:** Accepted  
**Date:** 2026-01-17  
**Deciders:** Frontend Architecture

**Context:**
Could manage year/quarter state inside EnterpriseDesk component vs receive from parent.

**Decision:**
EnterpriseDesk receives `year` and `quarter` as PROPS from JosoorShell parent component.

**Rationale:**
1. **Consistency:** All desks in `/josoor` use same year/quarter state
2. **Single Source of Truth:** JosoorShell manages temporal context
3. **Simplicity:** No prop drilling or context complexity
4. **Reusability:** EnterpriseDesk is pure presentation component

**Consequences:**
- EnterpriseDesk is NOT a standalone route (must be child of JosoorShell)
- Cannot navigate directly to `/josoor/enterprise?year=2026&quarter=Q3`
- Year/quarter changes in JosoorShell auto-propagate to all desks
- Simpler testing (just pass different props)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-17 | Initial comprehensive implementation guide created | System |
| 1.1 | 2026-01-17 | Added backend endpoint specs, step-by-step implementation, troubleshooting, ADRs | System |
| 1.2 | 2026-01-17 | Added AI-Assisted Development Orchestration framework with delegation patterns | System |

---

## 📋 Implementation Summary & Quick Start

### What You Have Now

✅ **Complete Specification** - All 5 overlays fully documented  
✅ **Data Model** - EntityCapability + EntityRisk 1:1 relationship  
✅ **API Endpoints** - Graph Server + Chain endpoints defined  
✅ **Frontend Architecture** - Component structure and data flow  
✅ **Validation Checklist** - Pre-launch data quality checks  
✅ **Troubleshooting Guide** - Solutions to common issues  
✅ **Decision Records** - Architectural rationale documented  

### What Needs to Be Built

#### Phase 1: Core Matrix (Week 1)
- [ ] Create type definitions (`types/enterprise.ts`)
- [ ] Implement service layer (`services/enterpriseService.ts`)
- [ ] Build EnterpriseDesk component
- [ ] Create CapabilityMatrix renderer
- [ ] Add basic styling
- [ ] Test L1/L2/L3 hierarchy display

**Success Criteria:** Matrix displays with year/quarter filtering

#### Phase 2: Overlay 1 - Risk Exposure (Week 2)
- [ ] Enrich L3 capabilities with EntityRisk data
- [ ] Implement color calculation (green/amber/red)
- [ ] Add mode-specific display (BUILD vs EXECUTE)
- [ ] Test with real data

**Success Criteria:** Risk Exposure overlay shows colors correctly

#### Phase 3: Overlay 2 - External Pressure (Week 3)
- [ ] **Backend:** Create `/api/enterprise/external-pressure` batch endpoint
- [ ] Fetch policy/performance counts for all L3s
- [ ] Implement binary color logic
- [ ] Add loading states

**Success Criteria:** External Pressure toggles without performance issues

#### Phase 4: Overlay 3 - Footprint Stress (Week 4)
- [ ] Implement balance calculation (people/process/tools)
- [ ] Add dominant dimension detection
- [ ] Create stress percentage color gradient
- [ ] Test edge cases (balanced high vs balanced low)

**Success Criteria:** Footprint Stress shows imbalances correctly

#### Phase 5: Overlay 4 - Change Saturation (Week 5)
- [ ] **Backend:** Create `/api/enterprise/change-saturation` endpoint
- [ ] Implement team change compression calculation
- [ ] Apply 3-tier red color mapping
- [ ] Dim non-top-3 capabilities

**Success Criteria:** Change Saturation highlights top 3 teams

#### Phase 6: Overlay 5 - Trend Warning (Week 6)
- [ ] Implement multi-quarter health tracking
- [ ] Detect 2+ consecutive declines
- [ ] Apply "green but declining" logic
- [ ] Test with historical data

**Success Criteria:** Trend Warning flags early degradation

#### Phase 7: Polish & Launch (Week 7-8)
- [ ] Add tooltips with overlay-specific details
- [ ] Implement DynamicInsightPanel (aggregated metrics)
- [ ] Add loading states and error handling
- [ ] Run data validation checklist
- [ ] Performance optimization (memoization)
- [ ] Cross-browser testing
- [ ] User acceptance testing
- [ ] Production deployment

**Success Criteria:** All overlays work, <2s load time, no errors

### Critical Path Dependencies

```
Week 1 (Matrix)
    ↓
Week 2 (Overlay 1) ← Can start Overlay 3 in parallel
    ↓
Week 3 (Overlay 2) ← REQUIRES backend endpoint
    ↓
Week 5 (Overlay 4) ← REQUIRES backend endpoint
    ↓
Week 6 (Overlay 5)
    ↓
Week 7-8 (Polish)
```

### Backend Requirements (Must Be Ready)

1. **Graph Server Endpoint:**
   - ✅ `GET /api/graph` - Already working
   - ✅ Returns EntityCapability + EntityRisk
   - ✅ Business IDs in `id` field

2. **Chain Endpoint:**
   - ✅ `GET /api/chains` - Already working
   - ⚠️ May need optimization for batch queries

3. **New Endpoints Required:**
   - ❌ `POST /api/enterprise/external-pressure` - NOT YET IMPLEMENTED
   - ❌ `POST /api/enterprise/change-saturation` - NOT YET IMPLEMENTED

### Data Requirements (Must Be Valid)

Run validation queries from Appendix E before starting:
- [ ] All EntityCapability nodes have matching EntityRisk (1:1)
- [ ] All L2/L3 nodes have valid parents (hierarchy intact)
- [ ] All statuses are 'planned', 'in_progress', or 'active'
- [ ] All EntityRisk nodes have required fields (people_score, etc.)
- [ ] No duplicate nodes (same id, year, quarter)

### Team Coordination

| Role | Responsibilities | Starting Phase |
|------|-----------------|----------------|
| **Frontend Dev** | Implement components, overlays, UI | Phase 1 |
| **Backend Dev** | Create missing endpoints (2, 4) | Phase 3 |
| **Data Engineer** | Validate graph data quality | Before Phase 1 |
| **QA** | Test overlays, edge cases | Phase 2+ |
| **Product Owner** | Validate overlay logic, UAT | Phase 7 |

### Day 1 Checklist

Before writing any code:
1. ✅ Read this entire document (you're here!)
2. ✅ Review supporting documents (overlay spec, ontology, data architecture)
3. ✅ Verify backend endpoints are accessible
4. ✅ Run data validation queries
5. ✅ Set up frontend dev environment
6. ✅ Create feature branch: `feature/enterprise-desk`
7. ✅ Start with Phase 1: Core Matrix

### Success Metrics (Post-Launch)

**Performance:**
- Initial load: <2 seconds
- Overlay toggle: <200ms
- Tooltip render: <50ms

**Data Quality:**
- 1:1 capability-risk match: >95%
- Valid hierarchy: 100%
- Overlay coverage: >90% of capabilities

**User Engagement:**
- Users toggle overlays: >3 per session
- Mode switching (BUILD/EXECUTE): >1 per session
- Year/quarter filtering: >2 per session

**Error Rate:**
- Frontend errors: <0.1% of sessions
- Backend timeouts: <1% of requests
- Data quality warnings: <5% of loads

---

**END OF IMPLEMENTATION GUIDE**

This document is the **PRIMARY AUTHORITY** for Enterprise Desk implementation within the `/josoor` route. All developers must follow these rules to the letter. In case of conflicts with other documents, this guide takes absolute precedence.

**Next Step:** Begin Phase 1 - Core Matrix Display
