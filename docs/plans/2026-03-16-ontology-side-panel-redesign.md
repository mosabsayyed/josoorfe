# Ontology Side Panel Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the ontology side panel from a flat data dump into a hierarchical, chain-aware panel with correct root-cause tracing and dependency scoring.

**Architecture:** The side panel has two zones: Zone 1 shows top 3 priority RED L3 items scored by urgency × dependency count (where dependency count = Performance/PolicyTool links at L2 via Risk). Zone 2 shows all items in L1→L2→L3 rollup with drill-down. Root cause traces DOWN the chain from item through Capability to OrgUnit/Process/IT, then branching by build (→Projects→Adoption) or operate (→sustainable_operations chain). All node labels use `{id} {name} [{type}]` format. All status labels use business text, never color names.

**Tech Stack:** React 18, TypeScript, CSS variables from `frontend/src/styles/theme.css`

---

## Context

### Key Files
- `frontend/src/services/ontologyService.ts` — data layer, RAG computation, NodeInstance building
- `frontend/src/components/desks/OntologyHome.tsx` — side panel UI (starts ~line 995)
- `frontend/src/components/desks/OntologyHome.css` — styles

### Data Model
- `NodeInstance` (ontologyService.ts:54-67): id, name, rag, rawRag, impact, urgency, priority, props (all Neo4j properties), upstreamNodes, downstreamNodes, upstreamReds, linkedPlans
- `props.level` = "L1" | "L2" | "L3"
- `props.status` = "active" (operate) | "planned" | "in_progress" (build)
- IDs are hierarchical: "1.0" (L1), "1.1" (L2), "1.1.1" (L3)

### Chain Paths (from SST Ontology)
- **Top-down planning:** Objective → PolicyTool → Capability → OrgUnit/Process/IT → Project → ChangeAdoption
- **Bottom-up reporting (operate):** Cap → Risk → Performance → Objective (capability_to_performance)
- **Bottom-up reporting (build):** Cap → Risk → PolicyTool → Objective (capability_to_policy)
- **Entity health:** CultureHealth → OrgUnit → Process → ITSystem → Vendor (sustainable_operations)
- **Sector outputs:** Objective → PolicyTool → AdminRecord → Stakeholders → DataTransaction → Performance → Objective (sector_value_chain)

### Ontology Relationship Rules
- Entity-Entity links at L3 only (MONITORED_BY, ROLE_GAPS, KNOWLEDGE_GAPS, AUTOMATION_GAPS, etc.)
- Sector-Sector links at L1 only
- Domain bridges at L2 only (Risk L2 → Performance L2 via INFORMS, Risk L2 → PolicyTool L2 via INFORMS)
- PARENT_OF connects L1→L2→L3 within same node type
- Capability `status=active` = OPERATE mode, `status=planned/in_progress` = BUILD mode

### Business Status Labels (replace RAG colors)
- red → "Needs Intervention" / "يحتاج تدخل"
- amber → "At Risk" / "في خطر"
- green → "On Track" / "على المسار"
- default → "No Data" / "لا توجد بيانات"

---

## Task 1: Add `level` and `dependencyCount` to NodeInstance

**Files:**
- Modify: `frontend/src/services/ontologyService.ts:54-67` (NodeInstance interface)
- Modify: `frontend/src/services/ontologyService.ts:529-577` (replace computeImpactScores)
- Modify: `frontend/src/services/ontologyService.ts:1579-1634` (NodeInstance building)

**Step 1: Add `level` field to NodeInstance interface**

At ontologyService.ts:54, add `level` to the interface:

```typescript
export interface NodeInstance {
  id: string;
  name: string;
  level: string;          // "L1" | "L2" | "L3"
  rag: RagStatus;
  rawRag: RagStatus;
  impact: number;         // renamed: dependencyCount (Performance/PolicyTool count at L2)
  urgency: number;
  priority: number;
  props: Record<string, any>;
  upstreamReds: UpstreamRedSource[];
  upstreamNodes: LinkedNode[];
  downstreamNodes: LinkedNode[];
  linkedPlans: LinkedPlan[];
}
```

**Step 2: Rewrite computeImpactScores → computeDependencyCount**

Replace the BFS function (ontologyService.ts:529-577) with chain-aware dependency counting:

```typescript
/**
 * Dependency count: for any node, trace UP to its parent L2 Capability,
 * find the corresponding L2 Risk (same ID), then count INFORMS links:
 * - OPERATE cap: count linked SectorPerformance nodes
 * - BUILD cap: count linked SectorPolicyTool nodes
 */
function computeDependencyCount(
  chains: ChainData[],
  nodesByType: Map<string, { props: Record<string, any>; labels: string[]; id: string }[]>
): Map<string, number> {
  // Build L2 Risk → INFORMS target map from chain links
  const riskInformsPerf = new Map<string, Set<string>>();  // risk L2 id → perf ids
  const riskInformsPolicy = new Map<string, Set<string>>(); // risk L2 id → policy ids

  const riskNodes = nodesByType.get('risks') || [];
  const riskL2Ids = new Set(riskNodes.filter(r => r.props.level === 'L2').map(r => r.id));

  for (const chain of chains) {
    for (const link of chain.links) {
      if (link.type !== 'INFORMS') continue;
      if (!riskL2Ids.has(link.start)) continue;

      // Determine target type from chain nodes
      const targetNode = chain.nodes.find(n => n.id === link.end);
      if (!targetNode) continue;

      if (targetNode.labels.includes('SectorPerformance')) {
        if (!riskInformsPerf.has(link.start)) riskInformsPerf.set(link.start, new Set());
        riskInformsPerf.get(link.start)!.add(link.end);
      }
      if (targetNode.labels.includes('SectorPolicyTool')) {
        if (!riskInformsPolicy.has(link.start)) riskInformsPolicy.set(link.start, new Set());
        riskInformsPolicy.get(link.start)!.add(link.end);
      }
    }
  }

  // Build Capability L2 id → is operate/build map
  const capNodes = nodesByType.get('capabilities') || [];
  const capL2Status = new Map<string, string>(); // cap L2 id → status
  for (const c of capNodes) {
    if (c.props.level === 'L2') capL2Status.set(c.id, c.props.status || 'active');
  }

  // For every node: find parent L2 cap ID, find matching L2 risk, count INFORMS targets
  const result = new Map<string, number>();

  const getL2Prefix = (id: string): string => {
    // "1.1.1" → "1.1", "1.1" → "1.1", "1.0" → "1.0"
    const parts = id.split('.');
    if (parts.length >= 3) return parts.slice(0, 2).join('.');
    return id;
  };

  for (const [nodeType, instances] of nodesByType) {
    for (const inst of instances) {
      const l2Id = getL2Prefix(inst.id);
      const capStatus = capL2Status.get(l2Id) || 'active';
      const isOperate = capStatus === 'active';

      const riskL2Id = l2Id; // Risk mirrors Cap ID structure
      const count = isOperate
        ? (riskInformsPerf.get(riskL2Id)?.size || 0)
        : (riskInformsPolicy.get(riskL2Id)?.size || 0);

      result.set(inst.id, count);
    }
  }

  return result;
}
```

**Step 3: Set `level` when building NodeInstance (ontologyService.ts ~line 1619-1632)**

In the NodeInstance construction, add `level`:

```typescript
return {
  id: inst.id,
  name: inst.props.name || inst.props.title || extractLogicalId(inst.id),
  level: inst.props.level || 'L3',  // ADD THIS
  rag,
  rawRag,
  impact,  // now from computeDependencyCount
  urgency,
  priority: ...,
  props: inst.props,
  ...
};
```

**Step 4: Update call site**

Replace `computeImpactScores(chains)` call (~line 1366) with `computeDependencyCount(chains, nodesByType)`. The variable name stays `impactScores` to minimize downstream changes.

**Step 5: Verify**

Refresh the app, open console, click a node type. Verify `impact` values make sense (should be 0-N where N = count of Performance or PolicyTool links).

---

## Task 2: Restructure Side Panel — Zone 1 (Top Priority)

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx:995-1240` (side panel rendering)

**Step 1: Filter and sort top priority items**

Replace the current sorting logic (~line 1001-1010):

```typescript
// Zone 1: Top 3 RED L3 items, sorted by urgency × dependency count
const l3Instances = instances.filter(i => (i.level || i.props.level) === 'L3');
const redL3 = l3Instances.filter(i => i.rag === 'red');
const topPriority = redL3
  .sort((a, b) => (b.urgency * b.impact) - (a.urgency * a.impact))
  .slice(0, 3);
```

**Step 2: Render Zone 1 items with business status text**

Each item shows:
- `{id} {name} [{nodeType}]`
- Business status text (not color): "Needs Intervention", "At Risk", "On Track"
- Urgency score + dependency count
- Root cause trace (Task 4)

Status label helper:
```typescript
const statusLabel = (rag: RagStatus): string => {
  if (rag === 'red') return t('ont_status_needs_intervention');
  if (rag === 'amber') return t('ont_status_at_risk');
  if (rag === 'green') return t('ont_status_on_track');
  return t('ont_status_no_data');
};
```

Add i18n keys:
- `ont_status_needs_intervention`: "Needs Intervention" / "يحتاج تدخل"
- `ont_status_at_risk`: "At Risk" / "في خطر"
- `ont_status_on_track`: "On Track" / "على المسار"
- `ont_status_no_data`: "No Data" / "لا توجد بيانات"

---

## Task 3: Restructure Side Panel — Zone 2 (All Items Rolled Up)

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx` (side panel rendering)

**Step 1: Build L1→L2→L3 hierarchy from flat instances**

```typescript
interface HierarchyNode {
  instance: NodeInstance;
  children: HierarchyNode[];
  worstChildRag: RagStatus;
}

const buildHierarchy = (instances: NodeInstance[]): HierarchyNode[] => {
  const l1s = instances.filter(i => i.level === 'L1').sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const l2s = instances.filter(i => i.level === 'L2');
  const l3s = instances.filter(i => i.level === 'L3');

  const ragRank = (r: RagStatus) => r === 'red' ? 3 : r === 'amber' ? 2 : r === 'green' ? 1 : 0;
  const worstRag = (items: NodeInstance[]): RagStatus => {
    let worst: RagStatus = 'default';
    for (const i of items) if (ragRank(i.rag) > ragRank(worst)) worst = i.rag;
    return worst;
  };

  return l1s.map(l1 => {
    const l1Prefix = l1.id.split('.')[0]; // "1.0" → "1"
    const myL2s = l2s
      .filter(l2 => l2.id.startsWith(l1Prefix + '.') && l2.id.split('.').length === 2)
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    const l2Nodes: HierarchyNode[] = myL2s.map(l2 => {
      const l2Prefix = l2.id; // "1.1"
      const myL3s = l3s
        .filter(l3 => l3.id.startsWith(l2Prefix + '.'))
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      return {
        instance: l2,
        children: myL3s.map(l3 => ({ instance: l3, children: [], worstChildRag: l3.rag })),
        worstChildRag: worstRag(myL3s),
      };
    });

    return {
      instance: l1,
      children: l2Nodes,
      worstChildRag: worstRag([...myL2s, ...l3s.filter(l3 => l3.id.startsWith(l1Prefix + '.'))]),
    };
  });
};
```

**Step 2: Render collapsible hierarchy**

- L1 rows shown by default (collapsed)
- L1 shows: `{id} {name} [{type}]` + rolled-up status (worst child)
- Click L1 → expands to show L2 children
- Click L2 → expands to show L3 children
- L3 items show full detail: status, urgency, dependency count

Use local state for expanded IDs:
```typescript
const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
const toggleExpand = (id: string) => {
  setExpandedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
};
```

**Step 3: All items sorted by ID within each level**

L1 sorted by numeric ID, L2 sorted by numeric ID within parent, L3 sorted by numeric ID within parent. Use `localeCompare` with `{ numeric: true }`.

---

## Task 4: Root Cause Trace

**Files:**
- Modify: `frontend/src/services/ontologyService.ts` — add `rootCause` to NodeInstance
- Modify: `frontend/src/components/desks/OntologyHome.tsx` — render root cause in Zone 1

**Step 1: Add rootCause field to NodeInstance**

```typescript
export interface RootCauseStep {
  id: string;
  name: string;
  nodeType: string;
  rag: RagStatus;
  relationship: string;  // e.g. "MONITORED_BY", "ROLE_GAPS"
}

export interface NodeInstance {
  // ... existing fields ...
  rootCause: RootCauseStep[];  // chain of nodes causing this item's distress
}
```

**Step 2: Compute root cause during NodeInstance building**

For each RED or AMBER L3 item, trace DOWN the chain:

1. Start from current item
2. Follow chain links FORWARD (start→end direction) to find connected nodes
3. Filter to only RED/AMBER connected nodes (the cause)
4. For Capability items: trace to OrgUnit/Process/IT via ROLE_GAPS/KNOWLEDGE_GAPS/AUTOMATION_GAPS
5. Then branch:
   - OPERATE cap (status=active): follow sustainable_operations (OrgUnit→Process→ITSystem→Vendor)
   - BUILD cap (status=planned/in_progress): follow to Projects (GAPS_SCOPE), then ChangeAdoption (ADOPTION_RISKS)
6. Stop when no more RED/AMBER nodes found or chain ends

Use the existing `directDownstream` map (chain forward direction) and filter by RAG status.

**Step 3: Render root cause in Zone 1**

For each top-priority item, show a breadcrumb trail:
```
Root cause: 1.1 National Water Strategy [Capability] → 12.1.1 Regulations [OrgUnit] → 4.6.1 Water Quality Testing [Process]
```

Each step shows `{id} {name} [{type}]` with a colored dot for its status.

---

## Task 5: Replace "Affected by" with Chain-Aware Dependencies

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx:1174-1175` (getUpstreamIssues)

**Step 1: Replace getUpstreamIssues**

Current (wrong — merges all directions + same-type):
```typescript
const getUpstreamIssues = (inst: NodeInstance): LinkedNode[] =>
  [...inst.upstreamNodes, ...inst.downstreamNodes].filter(n => n.rag === 'red' || n.rag === 'amber');
```

Replace with chain-direction-aware version — show only nodes causing distress (downstream in chain = forward direction = `downstreamNodes`), filtered to different types only:

```typescript
const getRootCauseNodes = (inst: NodeInstance): LinkedNode[] =>
  inst.downstreamNodes.filter(n => n.rag === 'red' || n.rag === 'amber');
```

**Step 2: Rename label from "Affected by" to "Root Cause" / "السبب الجذري"**

Update i18n key `ont_affected_by` → add new key `ont_root_cause`.

---

## Task 6: Add i18n Keys

**Files:**
- Modify: `frontend/src/i18n/en.json`
- Modify: `frontend/src/i18n/ar.json`

Add these keys:

| Key | English | Arabic |
|-----|---------|--------|
| `ont_status_needs_intervention` | Needs Intervention | يحتاج تدخل |
| `ont_status_at_risk` | At Risk | في خطر |
| `ont_status_on_track` | On Track | على المسار |
| `ont_status_no_data` | No Data | لا توجد بيانات |
| `ont_root_cause` | Root Cause | السبب الجذري |
| `ont_dependency_count` | Dependency Count | عدد التبعيات |
| `ont_top_priority` | Top Priority | الأولوية القصوى |
| `ont_all_items_hierarchy` | All Items | جميع العناصر |
| `ont_expand` | Expand | توسيع |
| `ont_collapse` | Collapse | طي |

---

## Task 7: Update AI Query Serialization

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx` (serializeItem helper)

**Step 1: Include level and dependency count in serialization**

Update `serializeItem` to include level and dependency count:

```typescript
lines.push(`- ${inst.id} ${inst.name} [${label}] (${inst.level}) — Status: ${statusLabel(inst.rag)} | Dependency Count: ${inst.impact} | Urgency: ${inst.urgency.toFixed(2)}`);
```

**Step 2: Include root cause trace in serialization**

If the item has a root cause chain, serialize it:
```typescript
if (inst.rootCause.length > 0) {
  lines.push(`  Root cause: ${inst.rootCause.map(r => `${r.id} ${r.name} [${r.nodeType}](${statusLabel(r.rag)})`).join(' → ')}`);
}
```

---

## Task 8: Commit and Verify

**Step 1: Verify in browser**
- Open ontology dashboard
- Click a node type (e.g. Risks)
- Zone 1: top 3 RED L3 items with root cause traces
- Zone 2: L1→L2→L3 hierarchy, click to expand
- All labels: `{id} {name} [{type}]`
- All statuses: business text, no color names
- AI buttons: send full data with level, dependency count, root cause

**Step 2: Test both languages**
- Switch to Arabic, verify RTL layout and Arabic status labels

**Step 3: Commit**
```bash
git add frontend/src/services/ontologyService.ts frontend/src/components/desks/OntologyHome.tsx frontend/src/i18n/en.json frontend/src/i18n/ar.json
git commit -m "feat: redesign ontology side panel with hierarchy, root cause tracing, dependency scoring"
```

---

## Dependency Order

```
Task 1 (NodeInstance + dependencyCount)
  → Task 2 (Zone 1 UI)
  → Task 3 (Zone 2 hierarchy)
  → Task 4 (root cause computation)
  → Task 5 (replace affected-by)
  → Task 6 (i18n)
  → Task 7 (AI serialization)
  → Task 8 (verify + commit)
```

Tasks 2, 3, 5, 6 can be parallelized after Task 1 is done.
Task 4 depends on Task 1.
Task 7 depends on Tasks 1 + 4.
Task 8 depends on all.
