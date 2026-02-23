# Backend Spec: RiskPlan Endpoint

## Overview
When a user commits an intervention plan from the Planning Desk, the frontend sends the plan data to be persisted as RiskPlan nodes in Neo4j (L1/L2/L3), attached to the originating risk.

## Endpoints

### POST /api/neo4j/risk-plan
Create a new RiskPlan with deliverables and tasks.

**Request:**
```json
{
  "riskId": "RISK_water_supply_disruption",
  "plan": {
    "name": "Water Supply Disruption Mitigation Plan",
    "sponsor": "Director of Operations",
    "deliverables": [
      {
        "id": "D1",
        "name": "Emergency Response Protocol",
        "start_date": "2026-03-01",
        "end_date": "2026-06-30",
        "tasks": [
          {
            "id": "T1.1",
            "name": "Draft emergency procedures",
            "owner": "Safety Manager",
            "start_date": "2026-03-01",
            "end_date": "2026-04-15",
            "depends_on": []
          },
          {
            "id": "T1.2",
            "name": "Train field teams",
            "owner": "HR Lead",
            "start_date": "2026-04-16",
            "end_date": "2026-06-30",
            "depends_on": ["T1.1"]
          }
        ]
      }
    ]
  }
}
```

**Response (201):**
```json
{
  "planId": "RP_RISK_water_supply_disruption_2026-02-22T103000"
}
```

### GET /api/neo4j/risk-plan/:riskId
Fetch existing plan for a risk. Returns 404 if none exists.

**Response (200):**
```json
{
  "plan": {
    "name": "...",
    "sponsor": "...",
    "deliverables": [...]
  }
}
```

## Neo4j Node Structure

### Labels
- **L1** = `RiskPlan:L1` (the plan itself / sponsor level)
- **L2** = `RiskPlan:L2` (deliverables)
- **L3** = `RiskPlan:L3` (tasks)

### Relationships
- `(Risk)-[:HAS_PLAN]->(RiskPlan:L1)`
- `(RiskPlan:L1)-[:HAS_DELIVERABLE]->(RiskPlan:L2)`
- `(RiskPlan:L2)-[:HAS_TASK]->(RiskPlan:L3)`
- `(RiskPlan:L3)-[:BLOCKS]->(RiskPlan:L3)` (task dependencies)

### Cypher — Create

```cypher
// 1. Match the risk, create L1
MATCH (r {id: $riskId})
CREATE (p:RiskPlan:L1 {
  id: 'RP_' + $riskId + '_' + toString(datetime()),
  name: $planName,
  sponsor: $planSponsor,
  status: 'Draft',
  created_at: datetime()
})
CREATE (r)-[:HAS_PLAN]->(p)
WITH p

// 2. Create L2 deliverables
UNWIND $deliverables AS del
CREATE (d:RiskPlan:L2 {
  id: del.id,
  name: del.name,
  start_date: date(del.start_date),
  end_date: date(del.end_date)
})
CREATE (p)-[:HAS_DELIVERABLE]->(d)
WITH d, del

// 3. Create L3 tasks
UNWIND del.tasks AS task
CREATE (t:RiskPlan:L3 {
  id: task.id,
  name: task.name,
  owner: task.owner,
  start_date: date(task.start_date),
  end_date: date(task.end_date)
})
CREATE (d)-[:HAS_TASK]->(t)
WITH t, task

// 4. Create dependency links
UNWIND task.depends_on AS depId
MATCH (dep:RiskPlan:L3 {id: depId})
CREATE (dep)-[:BLOCKS]->(t)
```

### Cypher — Read

```cypher
MATCH (r {id: $riskId})-[:HAS_PLAN]->(p:RiskPlan:L1)
OPTIONAL MATCH (p)-[:HAS_DELIVERABLE]->(d:RiskPlan:L2)
OPTIONAL MATCH (d)-[:HAS_TASK]->(t:RiskPlan:L3)
OPTIONAL MATCH (dep:RiskPlan:L3)-[:BLOCKS]->(t)
RETURN p, collect(DISTINCT d) AS deliverables, collect(DISTINCT {task: t, dep: dep.id}) AS tasks
```

## Frontend
- `planningService.ts` already calls `POST /api/neo4j/risk-plan` and `GET /api/neo4j/risk-plan/:riskId`
- On success, plan stays visible with a green "Plan committed" banner
- On failure, error is shown to the user
