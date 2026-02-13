# FINAL IMPLEMENTATION PLAN
**Created:** 2026-02-13
**Status:** APPROVED - Ready to execute
**Based on:** User feedback from 2026-02-13-FEEDBACK-FORM.txt

---

## TASK EXECUTION ORDER

1. **Task 1: Chain Query Consistency** - READY ✅
2. **Task 4: Risk UI Integration** - READY (analyze script first) ⚠️
3. **Task 2: Planning Lab** - BLOCKED (need answer to Q7) 🚫
4. **Task 3: Enterprise Overlays** - BLOCKED (need risk agent to run) 🚫
5. **Task 5: AI Button Prompts** - NEW (create & store in Supabase) 📝

---

# TASK 1: CHAIN QUERY CONSISTENCY

## Implementation Steps

### 1.1 Delete Old Query Files
**Action:** Delete files with hardcoded queries (pre-Supabase)

**Files to check and delete:**
```bash
# Definitely delete
/home/mastersite/development/josoorbe/backend/test_chain_query.py

# Check if hardcoded, then delete
frontend/src/components/desks/ChainTestDesk.tsx
frontend/src/data/canonicalPaths.ts
```

**Verification:**
- Grep for hardcoded Cypher queries in these files
- If found, delete the file
- Commit with message: "Remove legacy hardcoded chain queries"

---

### 1.2 Standardize Query Patterns - ID Handling
**Rule:** Use `properties(n).id` for display, `elementId(n)` for graph links only

**Pattern for ALL queries:**
```cypher
RETURN
  properties(n).id AS displayId,      // "1.0", "1.1.1" pattern
  properties(n).name AS displayName,
  elementId(n) AS internalId          // For graph links only
```

**Files to update:**
- Supabase `chain_queries` table (all 7 chains × 2 types = 14 queries)
- Verify: Check results in Explorer - IDs should show "1.0" pattern, not long strings

---

### 1.3 Standardize Query Patterns - Year Conversion
**Rule:** ALWAYS use `toInteger()` for year comparisons

**Pattern for ALL queries:**
```cypher
WHERE toInteger(n.year) = toInteger($year)
```

**Why:** Year is mixed type in DB (some string, some integer)

**Files to update:**
- Supabase `chain_queries` table (all 14 queries)
- Verify: Test with year=2025 and year="2025" - both should work

---

### 1.4 Standardize Query Patterns - Level Filtering + PARENT_OF
**Rule:** All queries filter by L1, L2, L3 levels + vertical PARENT_OF paths

**Pattern:**
```cypher
MATCH path = (root:SectorObjective {level:'L1'})
  -[:REALIZED_VIA]->(polL1:SectorPolicyTool {level:'L1'})
  -[:PARENT_OF*0..1]->(polL2:SectorPolicyTool {level:'L2'})  // Vertical
  -[:SETS_PRIORITIES]->(capL2:EntityCapability {level:'L2'})
  -[:PARENT_OF*0..1]->(capL3:EntityCapability {level:'L3'})  // Vertical
WHERE toInteger(root.year) = toInteger($year)
```

**Cross-check:**
- Verify against `ontology.csv` for correct relationship types
- Some chains go vertical (PARENT_OF), some stay horizontal (domain rels)

**Files to update:**
- Supabase `chain_queries` table (verify all 14 queries have correct level filters)

---

### 1.5 Standardize Query Patterns - NO APOC
**Rule:** Filter by specific properties that exist in ALL nodes, not APOC

**Pattern:**
```cypher
MATCH (n)
WHERE n.id IS NOT NULL
  AND n.name IS NOT NULL
  AND toInteger(n.year) = toInteger($year)
  AND n.level IN ['L1', 'L2', 'L3']
  AND (n:Label1 OR n:Label2 OR ...)
```

**Why:** APOC creates all results then filters (slow, OOM risk)

**Files to check:**
- Supabase `chain_queries` - remove any `apoc.*` functions
- Replace with property filters

---

### 1.6 Standardize Query Patterns - Embedding Exclusion
**Rule:** Return ALL properties EXCEPT embeddings

**UPDATED Pattern (per user feedback):**
```cypher
RETURN
  elementId(n) AS nId,
  labels(n) AS nLabels,
  {
    id: n.id,
    name: n.name,
    year: n.year,
    level: n.level,
    status: n.status,
    // Add ALL other properties that exist
    // (dynamically exclude only 'embedding')
  } AS nProps
```

**User feedback:** "this will require returning all props except embeddings."

**Implementation approach:**
- For tooltips to be rich, we need ALL properties
- Options:
  1. List every known property explicitly (brittle)
  2. Use `properties(n)` but strip `embedding` in backend (better)
  3. Neo4j query: `{x in keys(n) WHERE x <> 'embedding' | x: n[x]}`

**Recommended:** Option 3 (Neo4j map comprehension)

**Files to update:**
- Supabase `chain_queries` table (all 14 queries)
- Backend response handler (verify embedding is excluded)

---

### 1.7 Diagnostic Query Logic
**Rule:** Diagnostic = narrative nodes + orphans + bastards

**Pattern:**
```cypher
// Get ALL nodes that belong to this chain
MATCH (n)
WHERE (n:Label1 OR n:Label2 OR ...)  // Same labels as narrative
  AND toInteger(n.year) = toInteger($year)
  AND n.level IN ['L1', 'L2', 'L3']  // Same levels as narrative

// Check forward connections
OPTIONAL MATCH (n)-[r_fwd]->(m)
WHERE type(r_fwd) IN ['REL1', 'REL2', ...]  // Same rels as narrative
  AND (m:Label1 OR m:Label2 OR ...)

// Check backward connections
OPTIONAL MATCH (n)<-[r_bwd]-(p)
WHERE type(r_bwd) IN ['REL1', 'REL2', ...]

RETURN
  elementId(n) AS nId,
  labels(n) AS nLabels,
  {x in keys(n) WHERE x <> 'embedding' | x: n[x]} AS nProps,
  r_fwd IS NULL AS is_orphan,
  r_bwd IS NULL AS is_bastard
```

**Critical invariant:** Diagnostic count ≥ narrative count (ALWAYS)

**Files to update:**
- Supabase `chain_queries` table (all 7 diagnostic queries)
- Verify: Compare diagnostic vs narrative counts for each chain

---

### 1.8 3D Graph - Sphere Layout
**Action:** Add sphere layout to NeoGraph.tsx

**File:** `frontend/src/components/dashboards/NeoGraph.tsx`

**Changes:**
```typescript
<ForceGraph3D
  // ... existing props (DO NOT OVERWRITE)
  forceEngine="d3"
  d3AlphaDecay={0.02}
  cooldownTicks={200}
  d3VelocityDecay={0.3}
  // Sphere layout force
  d3Force={{
    charge: { strength: -120 },
    center: { strength: 0.1 },
    collision: { radius: 5, strength: 0.5 }
  }}
/>
```

**Verification:**
- Load any chain in Explorer
- Switch to 3D view
- Nodes should distribute in sphere shape (not flat plane)

---

### 1.9 Tooltips - Enrich Only, Don't Replace
**Action:** Add orphan/bastard flags to EXISTING tooltips

**User feedback:** "this will require returning all props except embeddings."

**File:** `frontend/src/components/dashboards/NeoGraph.tsx`

**Changes:**
```typescript
// Find existing nodeLabel or nodeTooltip function
const existingTooltip = (node) => {
  // ... existing rich content with ALL properties ...
  return `
    <div class="node-tooltip">
      <strong>${node.nProps.name}</strong>
      <br/>ID: ${node.nProps.id}
      <br/>Level: ${node.nProps.level}
      ${Object.entries(node.nProps)
        .filter(([key]) => !['embedding'].includes(key))
        .map(([key, val]) => `<br/>${key}: ${val}`)
        .join('')}
      ${node.is_orphan ? '<br/><span style="color: orange;">⚠️ Orphan (no forward connection)</span>' : ''}
      ${node.is_bastard ? '<br/><span style="color: red;">⚠️ Bastard (no backward connection)</span>' : ''}
    </div>
  `;
};
```

**Critical:** DO NOT replace existing tooltip content, only ADD to it

**Verification:**
- Load diagnostic query in Explorer
- Hover over nodes
- Tooltip should show ALL properties + orphan/bastard flags

---

### 1.10 Sankey Aggregation - Enhanced
**Action:** Show first 3 nodes + link to popup with all nodes

**User feedback:** "not only aggregate count - try to find more useful info. like for instance first 3 nodes (id,name) and link to show all nodes in small popup"

**File:** `frontend/src/components/desks/GraphSankey.tsx`

**Current behavior:**
- Groups by (label, displayId, column)
- Shows count in tooltip

**New behavior:**
- Show first 3 nodes: `1.1 NodeName, 1.2 OtherNode, 1.3 ThirdNode`
- Show `+ 7 more` if count > 3
- Clicking opens modal/popup with full list

**Changes:**
```typescript
// Aggregation logic (already exists)
const aggregatedNodes = groupBy(nodes, (n) => `${n.label}-${n.displayId}-${n.column}`);

// Enhanced tooltip
const sankeyNodeTooltip = (d) => {
  const nodes = aggregatedNodes[d.id];
  const first3 = nodes.slice(0, 3).map(n => `${n.id} ${n.name}`).join('<br/>');
  const remaining = nodes.length - 3;

  return `
    <strong>${d.label}</strong>
    <br/>${nodes.length} nodes:
    <br/>${first3}
    ${remaining > 0 ? `<br/><a href="#" onclick="showAllNodes('${d.id}')">+ ${remaining} more</a>` : ''}
  `;
};

// Add modal handler
const showAllNodes = (groupId) => {
  const nodes = aggregatedNodes[groupId];
  // Open modal with full list
  setModalContent({
    title: `All ${nodes.length} nodes`,
    nodes: nodes.map(n => ({ id: n.id, name: n.name }))
  });
  setModalOpen(true);
};
```

**Verification:**
- Load any chain in Explorer (Sankey view)
- Hover over aggregated node
- Should see first 3 nodes + link to see all
- Click link → modal opens with full list

---

### 1.11 Testing Matrix
**Action:** Test all 7 chains × 7 tests = 49 test cases

**Test script location:** Create new file `backend/scripts/test_chain_consistency.py`

**Tests for EACH chain:**
1. Narrative returns HTTP 200
2. Diagnostic returns HTTP 200
3. Diagnostic node count ≥ narrative count
4. No embedding properties in results
5. IDs follow "1.0" pattern (not long elementId)
6. Orphan nodes exist in diagnostic results
7. Bastard nodes exist in diagnostic results

**Chains:**
- build_oversight
- operate_oversight
- sector_value_chain
- setting_strategic_priorities
- setting_strategic_initiatives
- sustainable_operations
- integrated_oversight

**Expected baseline (from TASK_DIAGNOSTIC_AND_LIMIT.md):**
| Chain | Narrative Nodes | Narrative Links |
|-------|----------------|-----------------|
| build_oversight | 193 | 182 |
| operate_oversight | 25 | 25 |
| sector_value_chain | 15 | 23 |
| setting_strategic_priorities | 23 | 22 |
| setting_strategic_initiatives | 19 | 18 |
| sustainable_operations | 28 | 35 |
| integrated_oversight | 88 | 100 |

**Test implementation:**
```python
import requests
import pytest

CHAINS = [
    "build_oversight", "operate_oversight", "sector_value_chain",
    "setting_strategic_priorities", "setting_strategic_initiatives",
    "sustainable_operations", "integrated_oversight"
]

API_BASE = "https://betaBE.aitwintech.com"
YEAR = 2025

@pytest.mark.parametrize("chain", CHAINS)
def test_narrative_returns_200(chain):
    url = f"{API_BASE}/api/business-chain/{chain}?year={YEAR}&diagnostic=false"
    response = requests.get(url)
    assert response.status_code == 200

@pytest.mark.parametrize("chain", CHAINS)
def test_diagnostic_returns_200(chain):
    url = f"{API_BASE}/api/business-chain/{chain}?year={YEAR}&diagnostic=true"
    response = requests.get(url)
    assert response.status_code == 200

@pytest.mark.parametrize("chain", CHAINS)
def test_diagnostic_count_gte_narrative(chain):
    narr_url = f"{API_BASE}/api/business-chain/{chain}?year={YEAR}&diagnostic=false"
    diag_url = f"{API_BASE}/api/business-chain/{chain}?year={YEAR}&diagnostic=true"

    narr = requests.get(narr_url).json()
    diag = requests.get(diag_url).json()

    assert len(diag['nodes']) >= len(narr['nodes'])

@pytest.mark.parametrize("chain", CHAINS)
def test_no_embedding_in_results(chain):
    url = f"{API_BASE}/api/business-chain/{chain}?year={YEAR}&diagnostic=false"
    response = requests.get(url).json()

    for node in response['nodes']:
        assert 'embedding' not in node.get('nProps', {})

@pytest.mark.parametrize("chain", CHAINS)
def test_ids_follow_pattern(chain):
    url = f"{API_BASE}/api/business-chain/{chain}?year={YEAR}&diagnostic=false"
    response = requests.get(url).json()

    for node in response['nodes']:
        display_id = node.get('nProps', {}).get('id')
        # Should match pattern like "1.0", "1.1.1", etc.
        assert display_id and '.' in display_id
        assert len(node.get('nId', '')) > 10  # elementId is long

@pytest.mark.parametrize("chain", CHAINS)
def test_orphan_nodes_exist(chain):
    url = f"{API_BASE}/api/business-chain/{chain}?year={YEAR}&diagnostic=true"
    response = requests.get(url).json()

    orphans = [n for n in response['nodes'] if n.get('is_orphan')]
    # Not all chains will have orphans, but diagnostic should flag them
    assert 'is_orphan' in response['nodes'][0]

@pytest.mark.parametrize("chain", CHAINS)
def test_bastard_nodes_exist(chain):
    url = f"{API_BASE}/api/business-chain/{chain}?year={YEAR}&diagnostic=true"
    response = requests.get(url).json()

    bastards = [n for n in response['nodes'] if n.get('is_bastard')]
    # Not all chains will have bastards, but diagnostic should flag them
    assert 'is_bastard' in response['nodes'][0]
```

**Execution:**
```bash
cd /home/mastersite/development/josoorbe/backend/scripts
pytest test_chain_consistency.py -v
```

**Verification:**
- All 49 tests should pass
- Record any failures for investigation
- Document in `CHAIN_TEST_RESULTS.md`

---

## Task 1 Summary
- **Estimated time:** 4-6 hours
- **Files modified:**
  - Supabase `chain_queries` table (14 queries)
  - `frontend/src/components/dashboards/NeoGraph.tsx`
  - `frontend/src/components/desks/GraphSankey.tsx`
  - `backend/scripts/test_chain_consistency.py` (new)
- **Verification:** 49 tests pass
- **Dependencies:** None (ready to start)

---

# TASK 2: PLANNING LAB

## Status: BLOCKED ⛔
**Reason:** Need answer to question 7 before implementation

## Clarifications from User Feedback

### Entry Points and Flows

**Path A: Intervention Planning**
```
Sector Dashboard → Red KPI → AI Explain button → Options → Leader selects → DECISION
                                                                              ↓
                                                                   Intervention Planning
OR

Capability View → Red status → AI Explain button → Options → Leader selects → DECISION
                                                                                  ↓
                                                                       Intervention Planning
```

**Path B: Annual Planning**
```
Direct navigation → Annual Planning → Refresh mode
  (No AI Explain, no DECISION - just regular annual refresh)
```

**Path C: Scenario Simulation**
```
Planning Lab → Scenario Simulation
  → Matrix of outputs/outcomes (pre-populated with current plan)
  → User asks: "What if I want outcome X delivered 2 months earlier?"
  → AI responds with feasibility + required changes
```

### Key Concepts from User Feedback

**1. DECISION Trigger**
> "An AI Explain button on a KPI or asset or any value with red status where ai gives options and leaders select one"

**2. Leader Approval Data**
> "whatever was in the corrective plan suggested by the ai. in general any plan must have a stakeholder owner, clear output deliverables, clear dates, clear hard end date, clear dependencies and new risks/issues"

**Plan schema:**
- Stakeholder owner
- Clear output deliverables
- Clear dates
- Clear hard end date
- Clear dependencies
- New risks/issues

**3. "Inject into flow"**
> "Meaning it becomes part of the follow ups by attaching it to the node that had the problem and continues to be red until the actions change its reality"

**Implementation:**
- Attach intervention plan to the problem node in the graph
- Node stays red until completion
- Track as part of follow-ups

**4. Refresh vs Reset**
> "refresh is the usual check end of year on how did we do and tweak a few things to stay on course. reset means take the plan and throw in the garbage coz we doing it all from scratch"

**5. Outcomes vs Outputs**
> "layer one has outcomes (improve health of citizens) and layer 2 outputs (10 new hospitals in the following specialities.). to make it easier, outcomes is the national lagging kpis then the operational kpis"

- **Outcomes** = National lagging KPIs (strategic goals)
- **Outputs** = Operational KPIs (tactical deliverables)

**6. AI Consultation Prompt**
> "it was in one of the older versions hard coded in the tsx"

**Action:** Find and extract prompt from old Planning Lab implementation

### BLOCKING QUESTION 7

> "What are the steps to create the plan, how deep should it go, where do we store it in the graph?"

**Need to clarify:**
1. **Steps to create plan:**
   - What is the workflow? (AI generates draft → leader reviews → approves?)
   - What inputs are required?
   - What validation happens?

2. **How deep:**
   - Just high-level objectives? (Outcomes + Outputs)
   - Or detailed tasks with sub-tasks?
   - How many levels?

3. **Where to store in graph:**
   - New node type? (e.g., `:InterventionPlan`, `:AnnualPlan`)
   - What properties?
   - What relationships? (e.g., `ADDRESSES_ISSUE`, `OWNED_BY`)
   - Example structure?

**Cannot proceed with implementation until this is answered.**

---

## Task 2 Summary
- **Status:** BLOCKED
- **Next step:** User must answer Question 7
- **Files to investigate:**
  - Old Planning Lab tsx (find hardcoded prompt)
  - Supabase prompts table (check for planning personas)
- **Estimated time:** TBD (depends on complexity of answer)

---

# TASK 3: ENTERPRISE DESK OVERLAYS

## Status: BLOCKED ⛔
**Reason:** Risk agent must run first

## User Feedback

> "Actually alot of what is in the tooltips is there and ready, but ofcourse we need the risk agent to run. There is also a design doc on the whole risk agent and calculations that explains it"

## Action Items

### 3.1 Find Risk Agent Design Doc
**User says:** "There is also a design doc on the whole risk agent and calculations"

**Search locations:**
- `/home/mastersite/development/josoorbe/docs/`
- `/home/mastersite/development/josoorfe/docs/`
- Grep for "risk agent", "risk calculation", "overlay"

**Once found:**
- Read design doc
- Understand calculation formulas
- Extract query logic for 5 overlays

### 3.2 Wait for Risk Agent to Populate Data
**Dependency:** Task 4.1 must complete first (run risk agent)

**Once risk agent runs:**
- Properties will be populated: `build_exposure_pct`, `operate_exposure_pct`, `affecting`, `link_threshold_met`
- Overlays can query these properties

### 3.3 Implement 5 Overlays
**Overlays:**
1. Risk Exposure
2. External Pressure
3. Footprint Stress
4. Change Saturation
5. Trend Warning

**File:** `frontend/src/components/desks/enterprise/CapabilityMatrix.tsx`

**User says:** Tooltips already have most data ready

**Implementation:**
- Read properties from nodes (populated by risk agent)
- Apply color thresholds (from design doc)
- Tooltips show detailed info (already implemented)

---

## Task 3 Summary
- **Status:** BLOCKED (waiting for Task 4.1)
- **Next step:** Find risk agent design doc, read it
- **Then:** Implement overlays after risk agent runs
- **Estimated time:** 2-3 hours (once unblocked)

---

# TASK 4: RISK UI INTEGRATION

## 4.1 Analyze Risk Agent Script (CRITICAL ⚠️)

**User feedback:** "just be careful we NEVER tested it so you need to analyze the script first!"

**File:** `/home/mastersite/development/josoorbe/backend/scripts/run_risk_agent.py`

### Analysis Checklist

**BEFORE RUNNING:**
1. Read entire script
2. Understand what it does:
   - What Neo4j queries does it run?
   - What properties does it update?
   - What formulas does it use?
   - Does it delete or overwrite data?
3. Check for potential issues:
   - Memory leaks?
   - Infinite loops?
   - Destructive operations?
   - Missing error handling?
4. Verify safety:
   - Does it only UPDATE properties (not delete nodes)?
   - Does it have rollback capability?
   - Can it be run multiple times safely?
5. Test plan:
   - Run on dev/staging first (if available)
   - OR run with `--dry-run` flag (if exists)
   - OR add dry-run mode to script
   - Verify output before committing

### Properties to Populate

**Expected outputs:**
- `build_exposure_pct` (float, 0-100)
- `operate_exposure_pct` (float, 0-100)
- `affecting` (list of node IDs)
- `link_threshold_met` (boolean)

**Node types:**
- Check which node types get these properties
- Verify against schema

### Execution Plan

**Step 1: Analyze**
```bash
# Read the script
cat /home/mastersite/development/josoorbe/backend/scripts/run_risk_agent.py

# Check dependencies
grep -r "import" run_risk_agent.py

# Check Neo4j connection
grep -r "neo4j" run_risk_agent.py
```

**Step 2: Add dry-run mode (if missing)**
```python
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--dry-run', action='store_true', help='Print changes without committing')
args = parser.parse_args()

# Before any tx.commit()
if args.dry_run:
    print(f"Would update: {node_id} with {properties}")
    continue
else:
    tx.commit()
```

**Step 3: Test run**
```bash
cd /home/mastersite/development/josoorbe/backend/scripts
python run_risk_agent.py --dry-run

# Check output - does it look correct?
# If yes, run for real
python run_risk_agent.py
```

**Step 4: Verify**
```cypher
// Check if properties were populated
MATCH (n)
WHERE n.build_exposure_pct IS NOT NULL
RETURN labels(n), count(n), avg(n.build_exposure_pct)

MATCH (n)
WHERE n.operate_exposure_pct IS NOT NULL
RETURN labels(n), count(n), avg(n.operate_exposure_pct)
```

---

## 4.2 AI Button Standard - UPDATED ⚠️

**User feedback:**
> "Maybe we dont add text, just a unique icon button so eyes catch it.
> We have multiple personas in the tier1 prompts so they need to be added depending on the case.
> The prompts need to be written and put in supabase, no more hardcoding"

### Implementation Changes

**Visual:**
```typescript
// NO TEXT - icon only
<button className="ai-explain-btn" onClick={handleAIExplain}>
  <Star className="ai-icon" />  {/* Unique icon that catches the eye */}
</button>

// Style to make it stand out
.ai-explain-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 50%;
  padding: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  transition: transform 0.2s;
}

.ai-explain-btn:hover {
  transform: scale(1.1);
}

.ai-icon {
  color: white;
  width: 20px;
  height: 20px;
}
```

**Prompt Selection:**
```typescript
const handleAIExplain = (context: {type: string, nodeId: string, value: any}) => {
  // Determine persona based on context
  const persona = getPersonaForContext(context);

  // Fetch prompt from Supabase (NOT hardcoded)
  const prompt = await fetchPromptFromSupabase(persona, context);

  // Navigate to chat with prefilled message
  navigate('/chat', {
    state: {
      prefillMessage: prompt,
      context: context
    }
  });
};

const getPersonaForContext = (context: {type: string}) => {
  // Map context type to persona from tier1 prompts
  const personaMap = {
    'risk': 'risk_advisor',
    'capability': 'capability_expert',
    'sector': 'sector_strategist',
    'project': 'project_manager',
    'kpi': 'performance_analyst'
  };

  return personaMap[context.type] || 'default';
};
```

**Database Schema:**
```sql
-- New table for AI button prompts
CREATE TABLE ai_button_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona TEXT NOT NULL,  -- 'risk_advisor', 'capability_expert', etc.
  context_type TEXT NOT NULL,  -- 'risk', 'capability', 'sector', etc.
  prompt_template TEXT NOT NULL,  -- Template with placeholders
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example row
INSERT INTO ai_button_prompts (persona, context_type, prompt_template) VALUES
('risk_advisor', 'risk', 'Analyze the risk exposure for {node_name} (ID: {node_id}) which shows {value}% exposure. What are the top 3 mitigation strategies?');
```

**Files to modify:**
- **Backend:** Add API endpoint `/api/prompts/:persona/:contextType`
- **Frontend:**
  - `src/components/common/AIExplainButton.tsx` (new component)
  - Update all desks to use new button component
  - Remove hardcoded prompts

**Integration points:**
- RiskDesk KPI cards → `context.type = 'risk'`
- CapabilityMatrix overlays → `context.type = 'capability'`
- SectorDesk red status → `context.type = 'sector'`
- ProjectDesk issues → `context.type = 'project'`

---

## Task 4 Summary
- **4.1 Status:** READY (but analyze first!)
- **4.2 Status:** READY (new requirements from feedback)
- **Estimated time:**
  - 4.1: 2-3 hours (analysis + careful execution)
  - 4.2: 3-4 hours (create prompts table, API, component, integrate)
- **Dependencies:** None (can start immediately after Task 1)

---

# TASK 5: AI BUTTON PROMPTS (NEW)

## Status: NEW ✨
**User feedback:** "We need EXTRA prompts as in the point before this. dont confuse with existing."

## Clarification
- **Existing tier1 prompts:** Already in Supabase, don't touch
- **NEW prompts needed:** For AI Explain buttons (Task 4.2)
- **Storage:** Supabase (no hardcoding)

## Implementation

### 5.1 Create Prompts Table (see Task 4.2 schema)

### 5.2 Define Personas
**Based on tier1 prompts (reference only):**
- Risk Advisor
- Capability Expert
- Sector Strategist
- Project Manager
- Performance Analyst

**Map to contexts:**
- Red KPI → Performance Analyst
- Risk exposure → Risk Advisor
- Capability gaps → Capability Expert
- Sector objectives → Sector Strategist
- Project issues → Project Manager

### 5.3 Write Prompt Templates
**Format:** Use placeholders for dynamic data

**Example templates:**

```markdown
**Risk Advisor - Risk Exposure**
"Analyze the risk exposure for {node_name} (ID: {node_id}) which currently shows {exposure_pct}% exposure in {domain}.

Context:
- Affecting: {affecting_count} downstream nodes
- Threshold met: {threshold_met}

Please provide:
1. Root cause analysis
2. Top 3 mitigation strategies
3. Estimated impact if unaddressed
4. Recommended timeline for action"

**Capability Expert - Capability Gap**
"Review the capability gap for {node_name} (ID: {node_id}) showing {gap_type} gap with status {status}.

Context:
- Level: {level}
- Linked to: {linked_entities}

Please provide:
1. Gap severity assessment
2. Required interventions
3. Resource requirements
4. Suggested owner and timeline"

**Performance Analyst - Red KPI**
"Analyze the KPI {kpi_name} (ID: {node_id}) currently showing RED status with value {current_value} (target: {target_value}).

Context:
- Trend: {trend}
- Last updated: {last_update}

Please provide:
1. Root cause hypothesis
2. Corrective action options (3-5 options)
3. Expected impact of each option
4. Recommended course of action"

**Sector Strategist - Sector Objective**
"Review the sector objective {node_name} (ID: {node_id}) with current status {status}.

Context:
- Year: {year}
- Level: {level}
- Connected policies: {policy_count}

Please provide:
1. Progress assessment
2. Blockers and dependencies
3. Strategic recommendations
4. Alignment with national priorities"

**Project Manager - Project Issue**
"Assess the project {node_name} (ID: {node_id}) showing issue: {issue_description}.

Context:
- Status: {status}
- Owner: {owner}
- Dependencies: {dependencies}

Please provide:
1. Issue classification
2. Resolution options
3. Timeline and resource requirements
4. Escalation recommendation if needed"
```

### 5.4 Populate Supabase
**Script:** `backend/scripts/seed_ai_button_prompts.py`

```python
import os
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

prompts = [
    {
        "persona": "risk_advisor",
        "context_type": "risk",
        "prompt_template": """Analyze the risk exposure for {node_name} (ID: {node_id})...""",
        "is_active": True
    },
    {
        "persona": "capability_expert",
        "context_type": "capability",
        "prompt_template": """Review the capability gap for {node_name}...""",
        "is_active": True
    },
    # ... add all prompts
]

for prompt in prompts:
    supabase.table("ai_button_prompts").insert(prompt).execute()

print(f"Seeded {len(prompts)} AI button prompts")
```

### 5.5 Create API Endpoint
**File:** `backend/app/api/routes/prompts.py`

```python
from fastapi import APIRouter, HTTPException
from app.services.supabase_client import supabase

router = APIRouter()

@router.get("/prompts/{persona}/{context_type}")
async def get_prompt(persona: str, context_type: str):
    """Fetch AI button prompt template"""
    result = supabase.table("ai_button_prompts").select("*").eq("persona", persona).eq("context_type", context_type).eq("is_active", True).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Prompt not found")

    return result.data[0]

@router.post("/prompts/{persona}/{context_type}/render")
async def render_prompt(persona: str, context_type: str, context: dict):
    """Render prompt template with context data"""
    result = supabase.table("ai_button_prompts").select("prompt_template").eq("persona", persona).eq("context_type", context_type).eq("is_active", True).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Prompt not found")

    template = result.data[0]["prompt_template"]

    # Replace placeholders with context values
    rendered = template.format(**context)

    return {"prompt": rendered}
```

### 5.6 Frontend Integration (see Task 4.2)

---

## Task 5 Summary
- **Status:** NEW (from user feedback)
- **Estimated time:** 3-4 hours
- **Files to create:**
  - `backend/scripts/seed_ai_button_prompts.py`
  - `backend/app/api/routes/prompts.py`
  - Supabase table migration
- **Dependencies:** None (can be done in parallel with Task 4)

---

# FINAL EXECUTION PLAN

## Recommended Order
1. **Task 1: Chain Query Consistency** - Start immediately ✅
2. **Task 4.1: Analyze Risk Agent** - Run after Task 1 ⚠️
3. **Task 5: Create AI Button Prompts** - Parallel with Task 4.1 📝
4. **Task 4.2: Implement AI Button** - After Task 5 completes 🎨
5. **Task 3: Enterprise Overlays** - After Task 4.1 completes 🚫
6. **Task 2: Planning Lab** - After user answers Q7 🚫

## Parallel Execution
- Task 1 and Task 5 can run in parallel (no dependencies)
- Task 4.1 and Task 4.2 can overlap partially (component can be built while script runs)

## Estimated Total Time
- Task 1: 4-6 hours
- Task 4.1: 2-3 hours
- Task 5: 3-4 hours
- Task 4.2: 3-4 hours
- Task 3: 2-3 hours (once unblocked)
- Task 2: TBD (blocked)

**Total for ready tasks:** 16-21 hours

---

# CRITICAL NOTES

⚠️ **NEVER TESTED:** Risk agent has never been run - analyze thoroughly first!

⚠️ **NO ASSUMPTIONS:** All queries follow ontology.csv - verify relationships

⚠️ **USER APPROVAL REQUIRED:** Planning Lab design needs Q7 answered

⚠️ **DESIGN DOC EXISTS:** Find risk agent design doc before implementing overlays

⚠️ **SUPABASE ONLY:** No hardcoded prompts - all in database

---

**Ready to proceed with Task 1?**
