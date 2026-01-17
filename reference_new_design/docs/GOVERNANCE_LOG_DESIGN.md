# Governance Log System Design

> **Purpose:** True institutional memory through decision tracking, state feedback, and automated governance agent.  
> **Status:** DESIGN PHASE - No coding until approved

---

## Part 1: Infrastructure

### 1.1 New Node Property: `governance_log`

Every node type gains this JSON property:

```json
{
  "governance_log": {
    "decisions": [],
    "state": [],
    "escalations": []
  }
}
```

### 1.2 Decision Entry Schema

```json
{
  "id": "dec-2024Q4-001",
  "date": "2024-12-15",
  "quarter": "Q4 2024",
  "level": "L1",
  "what": "Prioritize manufacturing FDI over services sector",
  "why": "Vision 2030 industrial targets; Q3 market analysis shows 40% higher ROI in manufacturing; services saturated in GCC region",
  "owner_org_unit_id": "org-board-001",
  "cascaded_from": null,
  "cascaded_to": ["node-id-1", "node-id-2"],
  "status": "active",
  "created_at": "2024-12-15T10:00:00Z"
}
```

**Notes:**
- `owner_org_unit_id`: Links to `EntityOrgUnit` node (not implied - explicit relationship)
- `cascaded_from`: Parent decision ID if inherited
- `cascaded_to`: Child node IDs that received this decision

### 1.3 State Entry Schema

```json
{
  "id": "state-2025Q1-001",
  "date": "2025-01-15",
  "quarter": "Q1 2025",
  "level": "L2",
  "type": "execution",
  "decision_ref": "dec-2024Q4-001",
  "context": "Implementation 30% complete. Procurement cycle delayed vendor selection by 3 weeks. Recovery plan initiated.",
  "owner_org_unit_id": "org-dept-trade-001",
  "next_update_due": "2025-02-01",
  "created_at": "2025-01-15T14:30:00Z"
}
```

**Notes:**
- `type`: "execution" (responding to cascaded decision)
- `decision_ref`: Links to the decision being reported on
- `next_update_due`: When follow-up is expected

### 1.4 Escalation Entry Schema

```json
{
  "id": "esc-2025Q1-001",
  "date": "2025-01-20",
  "quarter": "Q1 2025",
  "level": "L3",
  "issue": "Vendor capacity insufficient for Q2 scale-up",
  "context": "Primary vendor can only deliver 60% of required volume. Secondary vendors quoted 2x budget. Need executive decision on budget increase or scope reduction.",
  "owner_org_unit_id": "org-team-procurement-001",
  "escalated_to_level": "L2",
  "escalated_to_org_unit_id": "org-dept-ops-001",
  "resolution": null,
  "resolved_via_decision": null,
  "status": "open",
  "created_at": "2025-01-20T09:00:00Z"
}
```

**Notes:**
- `resolution`: Filled when resolved at current level
- `resolved_via_decision`: Links to new decision if escalated and resolved at higher level

### 1.5 Finding WHO via EntityOrgUnit

```cypher
// Find owner of a decision/state/escalation
MATCH (node)-[:OPERATES|:ROLE_GAPS|:CLOSE_GAPS*1..3]-(ou:EntityOrgUnit)
WHERE node.id = $node_id
RETURN ou.name AS owner_unit, ou.head_of_unit AS owner_person
```

---

## Part 2: Seed Data

### 2.1 Sample Governance Log Entries

#### L1 Board Decision (SectorObjective)

```json
{
  "node_id": "obj-fdi-2025",
  "node_type": "SectorObjective",
  "node_name": "Increase FDI by 30%",
  "governance_log": {
    "decisions": [
      {
        "id": "dec-2024Q4-001",
        "date": "2024-12-15",
        "quarter": "Q4 2024",
        "level": "L1",
        "what": "Prioritize manufacturing FDI over services",
        "why": "Vision 2030 alignment; 40% higher ROI in manufacturing sector; services market saturated",
        "owner_org_unit_id": "org-board-001",
        "cascaded_from": null,
        "cascaded_to": ["pol-mfg-incentive", "cap-investor-relations"],
        "status": "active"
      }
    ],
    "state": [],
    "escalations": []
  }
}
```

#### L2 State Report (EntityCapability)

```json
{
  "node_id": "cap-investor-relations",
  "node_type": "EntityCapability",
  "node_name": "Investor Relations Management",
  "governance_log": {
    "decisions": [
      {
        "id": "dec-2024Q4-001-cascade",
        "date": "2024-12-16",
        "quarter": "Q4 2024",
        "level": "L1",
        "what": "Prioritize manufacturing FDI over services",
        "why": "Inherited from Board decision",
        "owner_org_unit_id": "org-dept-investment-001",
        "cascaded_from": "dec-2024Q4-001",
        "cascaded_to": ["proj-mfg-roadshow"],
        "status": "active"
      }
    ],
    "state": [
      {
        "id": "state-2025Q1-001",
        "date": "2025-01-15",
        "quarter": "Q1 2025",
        "level": "L2",
        "type": "execution",
        "decision_ref": "dec-2024Q4-001-cascade",
        "context": "Investor roadshow planned for Q2. Target list of 50 manufacturing investors compiled. Collateral being updated.",
        "owner_org_unit_id": "org-dept-investment-001",
        "next_update_due": "2025-02-01"
      }
    ],
    "escalations": []
  }
}
```

#### L3 Escalation (EntityProject)

```json
{
  "node_id": "proj-mfg-roadshow",
  "node_type": "EntityProject",
  "node_name": "Manufacturing Investor Roadshow",
  "governance_log": {
    "decisions": [
      {
        "id": "dec-2024Q4-001-cascade-L3",
        "date": "2024-12-17",
        "quarter": "Q4 2024",
        "level": "L1",
        "what": "Execute manufacturing-focused investor roadshow",
        "why": "Inherited from capability-level decision",
        "owner_org_unit_id": "org-team-events-001",
        "cascaded_from": "dec-2024Q4-001-cascade",
        "cascaded_to": [],
        "status": "active"
      }
    ],
    "state": [
      {
        "id": "state-2025Q1-002",
        "date": "2025-01-25",
        "quarter": "Q1 2025",
        "level": "L3",
        "type": "execution",
        "decision_ref": "dec-2024Q4-001-cascade-L3",
        "context": "Venue booked. Speaker list confirmed. Budget approved.",
        "owner_org_unit_id": "org-team-events-001",
        "next_update_due": "2025-02-15"
      }
    ],
    "escalations": [
      {
        "id": "esc-2025Q1-001",
        "date": "2025-01-28",
        "quarter": "Q1 2025",
        "level": "L3",
        "issue": "Travel budget insufficient for target investor outreach",
        "context": "Original budget covers 30 investor meetings. Target is 50. Need 40% budget increase or reduce target.",
        "owner_org_unit_id": "org-team-events-001",
        "escalated_to_level": "L2",
        "escalated_to_org_unit_id": "org-dept-investment-001",
        "resolution": null,
        "status": "open"
      }
    ]
  }
}
```

---

## Part 3: Governance Agent

### 3.1 Purpose

An automated agent that runs **daily** to:
1. Push open escalations toward resolution before quarterly board
2. Ensure cascaded decisions propagate fully
3. Suggest task breakdowns for stalled items

### 3.2 Agent Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                 DAILY GOVERNANCE AGENT RUN                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. ESCALATION PUSH                                          │
│     ├─ Query: All escalations with status="open"             │
│     ├─ Check: Days since created vs. board meeting date      │
│     ├─ Action: Send reminder to escalated_to owner           │
│     └─ Suggest: "Break this into smaller resolvable items"   │
│                                                              │
│  2. DECISION CASCADE CHECK                                   │
│     ├─ Query: Decisions with empty cascaded_to               │
│     ├─ Check: Child nodes via PARENT_OF that should inherit  │
│     ├─ Action: Create inheritance entries on child nodes     │
│     └─ Flag: Nodes missing mandatory state reports           │
│                                                              │
│  3. STALE STATE DETECTION                                    │
│     ├─ Query: State entries past next_update_due             │
│     ├─ Action: Send reminder to owner_org_unit               │
│     └─ Escalate: If 2+ reminders ignored → auto-escalate     │
│                                                              │
│  4. TASK BREAKDOWN SUGGESTIONS                               │
│     ├─ Input: Open decision or escalation                    │
│     ├─ AI Analysis: What sub-tasks would move this forward?  │
│     └─ Output: Suggested breakdown stored in pending_tasks   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Agent Data Model

```json
{
  "governance_agent_run": {
    "run_id": "run-2025-01-30",
    "run_date": "2025-01-30T06:00:00Z",
    "next_board_date": "2025-03-15",
    "days_to_board": 44,
    "actions_taken": [
      {
        "type": "escalation_reminder",
        "target_node": "proj-mfg-roadshow",
        "escalation_id": "esc-2025Q1-001",
        "sent_to": "org-dept-investment-001",
        "message": "Escalation open for 5 days. Board in 44 days. Please resolve or escalate further."
      },
      {
        "type": "cascade_propagation",
        "source_decision": "dec-2024Q4-001",
        "propagated_to": ["proj-new-initiative"],
        "state_required_from": ["org-team-new-001"]
      },
      {
        "type": "task_breakdown_suggestion",
        "for_item": "esc-2025Q1-001",
        "suggested_tasks": [
          "Review alternative budget sources",
          "Assess if 40 meetings achieves 80% of value",
          "Request emergency budget from reserve fund"
        ]
      }
    ]
  }
}
```

### 3.4 Agent Triggers

| Trigger | Action |
|---------|--------|
| Days to board < 30 | Increase reminder frequency to daily |
| Escalation open > 7 days | Suggest auto-escalate to next level |
| Decision not cascaded after 3 days | Alert and auto-cascade |
| State update overdue > 5 days | Escalate as "reporting gap" |

### 3.5 AI Integration

The agent uses AI for:
1. **Task breakdown**: Analyze decision/escalation text → suggest actionable sub-tasks
2. **Priority scoring**: Which items need attention most urgently?
3. **Pattern matching**: "Similar escalation resolved in Q2 2024 by doing X"

---

## Implementation Phases

### Phase 1: Infrastructure
- [ ] Add `governance_log` property schema to Neo4j
- [ ] Create migration script for existing nodes
- [ ] Document in DATA_ARCHITECTURE.md

### Phase 2: Seed Data
- [ ] Create seed data for 2-3 complete decision chains
- [ ] Include L1→L2→L3 cascade examples
- [ ] Include escalation→resolution→decision cycle

### Phase 3: API Layer
- [ ] CRUD endpoints for decisions, state, escalations
- [ ] Cascade propagation endpoint
- [ ] Query endpoints for governance history

### Phase 4: Governance Agent
- [ ] Daily job scheduler
- [ ] Reminder notification system
- [ ] AI task breakdown integration
- [ ] Agent run logging

### Phase 5: UI Integration
- [ ] Board Meeting decision creation UI
- [ ] State reporting interface
- [ ] Escalation management view
- [ ] Agent dashboard showing pending items

---

## Open Questions

1. **Notification delivery**: Email? In-app? Both?
2. **Board calendar integration**: How do we know board meeting dates?
3. **AI model for breakdowns**: Use existing chat persona or dedicated?
4. **Audit trail**: Keep history of all changes or just current state?
