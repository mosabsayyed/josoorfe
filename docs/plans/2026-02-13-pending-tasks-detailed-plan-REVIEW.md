# DETAILED IMPLEMENTATION PLANS - REVIEW DOCUMENT

**Created:** 2026-02-13
**Status:** AWAITING YOUR REVIEW
**Instructions:** Add your comments in the `📝 YOUR FEEDBACK:` sections below each item

---

## HOW TO REVIEW THIS DOCUMENT

1. **For each section**, read the plan details
2. **Check one box**: ✅ Approved | ⚠️ Needs Changes | ❌ Reject
3. **Add your comments** in the feedback block
4. **Save this file** when done
5. I'll read your feedback and update the plans

**Example:**
```markdown
### 1.2 Some Feature
Details about the feature...

- [ ] ✅ Approved as-is
- [x] ⚠️ Needs changes (see feedback below)
- [ ] ❌ Reject this entirely

📝 YOUR FEEDBACK:
> Change the color from blue to red, and add a tooltip
```

---

# TASK 1: CHAIN QUERY CONSISTENCY

## 1.1 Delete Old Query Files

**Action:** Delete files with hardcoded queries (old way before Supabase)

**Files to delete:**
- `/home/mastersite/development/josoorbe/backend/test_chain_query.py`
- Check & delete if hardcoded: `/home/mastersite/development/josoorfe/frontend/src/components/desks/ChainTestDesk.tsx`
- Check & delete if hardcoded: `/home/mastersite/development/josoorfe/frontend/src/data/canonicalPaths.ts`

**Your approval:**
- [ ] ✅ Approved - delete these files
- [ ] ⚠️ Needs changes (see feedback)
- [ ] ❌ Don't delete these

📝 YOUR FEEDBACK:
>

---

## 1.2 ID Handling - Property ID vs ElementID

**Current understanding:**
- `elementId(n)` = Neo4j internal long string (use for graph links only)
- `properties(n).id` = Display ID with "1.0", "1.1.1" pattern (use for user-facing)

**Query pattern:**
```cypher
RETURN
  properties(n).id AS displayId,      // "1.0", "1.1.1"
  properties(n).name AS displayName,
  elementId(n) AS internalId         // For graph links only
```

**Your approval:**
- [ ] ✅ Correct understanding
- [ ] ⚠️ Partially correct (see feedback)
- [ ] ❌ Wrong approach

📝 YOUR FEEDBACK:
>

---

## 1.3 Year Conversion to Integer

**Current understanding:**
- Year is mixed type in DB (some string, some integer)
- Must convert with `toInteger()` in ALL queries

**Query pattern:**
```cypher
WHERE toInteger(n.year) = toInteger($year)
```

**Your approval:**
- [ ] ✅ Correct approach
- [ ] ⚠️ Needs adjustment (see feedback)
- [ ] ❌ Wrong approach

📝 YOUR FEEDBACK:
>

---

## 1.4 Level Filtering + PARENT_OF Vertical Paths

**Current understanding:**
- All queries include level filters: L1, L2, L3
- Some chains go vertical via PARENT_OF (hierarchy)
- Some chains stay horizontal via domain rels (from ontology.csv)
- Must check: ontology.csv + current Supabase queries + expected explorer levels

**Example with PARENT_OF:**
```cypher
MATCH path = (root:SectorObjective {level:'L1'})
  -[:REALIZED_VIA]->(polL1:SectorPolicyTool {level:'L1'})
  -[:PARENT_OF*0..1]->(polL2:SectorPolicyTool {level:'L2'})  // Vertical
  -[:SETS_PRIORITIES]->(capL2:EntityCapability {level:'L2'})
  -[:PARENT_OF*0..1]->(capL3:EntityCapability {level:'L3'})  // Vertical
WHERE toInteger(root.year) = toInteger($year)
```

**Your approval:**
- [ ] ✅ Correct understanding of levels + PARENT_OF
- [ ] ⚠️ Needs clarification (see feedback)
- [ ] ❌ Wrong approach

📝 YOUR FEEDBACK:
>

---

## 1.5 NO APOC - Use Specific Property Filtering

**Current understanding:**
- Don't use APOC (creates all results then filters - slow)
- Instead: Filter by properties that exist in ALL nodes (id, name, year, level)

**Query pattern:**
```cypher
MATCH (n)
WHERE n.id IS NOT NULL
  AND n.name IS NOT NULL
  AND toInteger(n.year) = toInteger($year)
  AND n.level IN ['L1', 'L2', 'L3']
  AND (n:Label1 OR n:Label2 OR ...)
```

**Your approval:**
- [ ] ✅ Correct approach
- [ ] ⚠️ Needs adjustment (see feedback)
- [ ] ❌ Wrong approach

📝 YOUR FEEDBACK:
>

---

## 1.6 Embedding Exclusion

**Current understanding:**
- ALL queries must exclude `embedding` property
- Method: Return specific properties only, NOT `properties(n)` (which includes everything)

**Query pattern:**
```cypher
RETURN
  elementId(n) AS nId,
  labels(n) AS nLabels,
  {
    id: n.id,
    name: n.name,
    year: n.year,
    level: n.level,
    status: n.status
    // List only specific props - NO embedding
  } AS nProps
```

**Your approval:**
- [ ] ✅ Correct method
- [ ] ⚠️ Different approach needed (see feedback)
- [ ] ❌ Wrong method

📝 YOUR FEEDBACK:
>

---

## 1.7 Diagnostic Query Logic

**Current understanding:**
- Diagnostic = ALL nodes from narrative path + orphans + bastards
- Orphan = node with NO forward connection
- Bastard = node with NO backward connection
- Diagnostic MUST traverse EXACT SAME nodes/rels as narrative
- Diagnostic node count ≥ narrative count (ALWAYS)

**Query pattern:**
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
  {id: n.id, name: n.name} AS nProps,
  r_fwd IS NULL AS is_orphan,
  r_bwd IS NULL AS is_bastard
```

**Your approval:**
- [ ] ✅ Correct diagnostic logic
- [ ] ⚠️ Needs adjustment (see feedback)
- [ ] ❌ Wrong logic

📝 YOUR FEEDBACK:
>

---

## 1.8 3D Graph - Sphere Layout

**Current understanding:**
- NeoGraph should use sphere layout
- DO NOT OVERWRITE existing config
- Only ADD sphere layout parameters

**Implementation:**
```typescript
<ForceGraph3D
  // ... existing props
  forceEngine="d3"
  d3AlphaDecay={0.02}
  cooldownTicks={200}
  // Sphere layout config here
/>
```

**Your approval:**
- [ ] ✅ Correct approach
- [ ] ⚠️ Different layout method (see feedback)
- [ ] ❌ Wrong approach

📝 YOUR FEEDBACK:
>

---

## 1.9 Tooltips - ENRICH Only, Don't Replace

**Current understanding:**
- Existing tooltips are rich with property data
- DO NOT remove or replace existing content
- ONLY add new info (orphan/bastard flags)

**Implementation:**
```typescript
// Find existing tooltip code
const existingTooltip = `... current rich content ...`;

// ADD to it (don't replace):
const enrichedTooltip = existingTooltip + `
  ${node.is_orphan ? '<br/>⚠️ Orphan' : ''}
  ${node.is_bastard ? '<br/>⚠️ Bastard' : ''}
`;
```

**Your approval:**
- [ ] ✅ Correct - enrich only
- [ ] ⚠️ Different approach (see feedback)
- [ ] ❌ Wrong approach

📝 YOUR FEEDBACK:
>

---

## 1.10 Sankey Aggregation

**Current understanding:**
- Already correctly implemented in GraphSankey.tsx
- Groups by (label, displayId, column)
- Shows aggregated count in tooltips
- NO CHANGES NEEDED

**Your approval:**
- [ ] ✅ Confirmed - no changes needed
- [ ] ⚠️ Actually needs changes (see feedback)
- [ ] ❌ Wrong understanding

📝 YOUR FEEDBACK:
>

---

## 1.11 Testing Matrix

**Proposed tests for EACH of 7 chains:**
1. Narrative returns HTTP 200
2. Diagnostic returns HTTP 200
3. Diagnostic node count ≥ narrative count
4. No embedding properties in results
5. IDs follow "1.0" pattern (not long elementId)
6. Orphan nodes exist in diagnostic results
7. Bastard nodes exist in diagnostic results

**Your approval:**
- [ ] ✅ Good test coverage
- [ ] ⚠️ Add/remove tests (see feedback)
- [ ] ❌ Wrong tests

📝 YOUR FEEDBACK:
>

---

# TASK 2: PLANNING LAB

## 2.1 Current Status

**Understanding:**
- NOT clear enough to implement yet
- Need to study in detail before starting
- Two entry points: Sector → DECISION or Capabilities → DECISION
- DECISION = leader-approved intervention
- Then either: inject into flow OR trigger Strategy Annual Refresh

**Your approval:**
- [ ] ✅ Correct - study first, don't implement
- [ ] ⚠️ Clarification needed (see feedback)
- [ ] ❌ Wrong understanding

📝 YOUR FEEDBACK:
>

---

## 2.2 Questions Needed Before Implementation

**Questions to clarify:**
1. What triggers the "DECISION" step? (UI, workflow, approval mechanism?)
2. What data represents "leader approval"? (DB field, status, signature?)
3. "Inject into flow" - what does this mean exactly? (communicate tasks/dates/follow-ups where?)
4. "Strategy Annual Refresh" vs "reset" - what's the difference?
5. Scenario simulation matrix:
   - What are "outputs" vs "outcomes"?
   - What columns/rows?
   - What is editable vs read-only?
6. AI consultation prompt template for "change outcome timing" scenarios?

**Your approval:**
- [ ] ✅ Good questions - will answer separately
- [ ] ⚠️ Add/change questions (see feedback)
- [ ] ❌ Wrong questions

📝 YOUR FEEDBACK:
>

---

## 2.3 Relationship Verification

**Corrected understanding:**
- NO direct relation between Project ↔ Capability
- Actual path (from ontology.csv):
  - Capability → ROLE_GAPS/KNOWLEDGE_GAPS/AUTOMATION_GAPS → OrgUnit/Process/ITSystem
  - OrgUnit/Process/ITSystem → GAPS_SCOPE → Project
  - Project → CLOSE_GAPS → OrgUnit/Process/ITSystem
- Path is: Capability → Gap → Project (2 hops, indirect)

**Your approval:**
- [ ] ✅ Correct relationship understanding
- [ ] ⚠️ Still missing something (see feedback)
- [ ] ❌ Wrong

📝 YOUR FEEDBACK:
>

---

# TASK 3: ENTERPRISE DESK OVERLAYS

## 3.1 Current Status

**Understanding:**
- My previous overlay queries are WRONG (hallucinated)
- Must consult you for CORRECT query logic
- 5 overlays: Risk Exposure, External Pressure, Footprint Stress, Change Saturation, Trend Warning
- Cannot proceed without your guidance on queries

**Your approval:**
- [ ] ✅ Correct - will provide queries when we get there
- [ ] ⚠️ Actually, here are the queries now (see feedback)
- [ ] ❌ Different approach needed

📝 YOUR FEEDBACK:
>

---

## 3.2 What I Need From You (When We Reach This Task)

**For EACH of 5 overlays:**
1. Correct Cypher query
2. Calculation logic (how to compute the overlay value)
3. Color thresholds (green/amber/red at what values?)
4. Tooltip content (what to show on hover)

**Your approval:**
- [ ] ✅ Correct - will provide when we reach this task
- [ ] ⚠️ Different info needed (see feedback)
- [ ] ❌ Wrong approach

📝 YOUR FEEDBACK:
>

---

# TASK 4: RISK UI INTEGRATION

## 4.1 Run Risk Agent (Don't Seed)

**Understanding:**
- Risk properties are calculated by agent, NOT manually seeded
- Agent location: `/home/mastersite/development/josoorbe/backend/scripts/run_risk_agent.py`
- Agent populates: build_exposure_pct, operate_exposure_pct, affecting, link_threshold_met
- Action: Run the agent, verify it worked

**Your approval:**
- [ ] ✅ Correct - run agent, don't seed
- [ ] ⚠️ Agent needs updates first (see feedback)
- [ ] ❌ Wrong approach

📝 YOUR FEEDBACK:
>

---

## 4.2 AI Button Standard

**Understanding:**
- ALWAYS use: AI star icon + "Explain" text
- NO "Suggest Mitigation" button
- NO variations or other button types
- Clicking navigates to chat with prefilled message

**Implementation:**
```typescript
<button className="ai-explain-btn">
  <Star className="ai-icon" />
  Explain
</button>
```

**Your approval:**
- [ ] ✅ Correct button design
- [ ] ⚠️ Slight change needed (see feedback)
- [ ] ❌ Wrong button

📝 YOUR FEEDBACK:
>

---

# TASK 5: PROMPTS

## 5.1 Current Status

**Understanding:**
- Prompts are READY, don't touch them
- Tier 1 with is_active=true are already configured correctly
- My listed changes are NOT needed
- SKIP THIS TASK ENTIRELY

**Your approval:**
- [ ] ✅ Confirmed - skip prompts task
- [ ] ⚠️ Actually need some changes (see feedback)
- [ ] ❌ Wrong - prompts need work

📝 YOUR FEEDBACK:
>

---

# OVERALL TASK PRIORITY

## Recommended Order

1. **Task 1: Chain Query Consistency** - READY to implement
2. **Task 4: Risk UI Integration** - READY to implement (run agent)
3. **Task 2: Planning Lab** - BLOCKED (need your clarification)
4. **Task 3: Enterprise Overlays** - BLOCKED (need your queries)
5. **Task 5: Prompts** - CANCELLED (already done)

**Your approval:**
- [ ] ✅ Good priority order
- [ ] ⚠️ Different order (see feedback)
- [ ] ❌ Wrong order

📝 YOUR FEEDBACK:
>

---

# FINAL SIGN-OFF

## Task 1: Chain Query Consistency
- [ ] ✅ APPROVED - proceed with implementation
- [ ] ⚠️ APPROVED WITH CHANGES (see feedback in sections above)
- [ ] ❌ REJECTED - needs major revision

## Task 2: Planning Lab
- [ ] ✅ APPROVED - approach is correct (will answer questions separately)
- [ ] ⚠️ NEEDS MORE INFO (see feedback)
- [ ] ❌ REJECTED - wrong approach

## Task 3: Enterprise Overlays
- [ ] ✅ APPROVED - consult when we get there
- [ ] ⚠️ HERE ARE THE QUERIES NOW (see feedback)
- [ ] ❌ REJECTED - different approach

## Task 4: Risk UI Integration
- [ ] ✅ APPROVED - proceed
- [ ] ⚠️ APPROVED WITH CHANGES (see feedback)
- [ ] ❌ REJECTED - needs revision

## Task 5: Prompts
- [ ] ✅ CONFIRMED - skip this task
- [ ] ⚠️ ACTUALLY NEEDS WORK (see feedback)
- [ ] ❌ WRONG - this is critical

---

## GENERAL FEEDBACK / QUESTIONS

📝 ADDITIONAL COMMENTS:
> (Add any general feedback, questions, or concerns here)

---

**Once you've reviewed and added your feedback, save this file and let me know. I'll read your comments and update the plans accordingly.**
