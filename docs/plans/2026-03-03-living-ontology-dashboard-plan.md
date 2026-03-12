# Living Ontology Dashboard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the static OntologyHome into a living dashboard with animated RAG relationship lines, impact-weighted node coloring, KPI signal strip, and click-to-detail side panels.

**Architecture:** OntologyHome.tsx fetches chain data via REST `/api/v1/chains/{name}`, computes impact scores (upstream fan-out), derives RAG states for nodes and lines, renders animated SVG paths with CSS animations, and shows an aggregate KPI strip. Click opens a side panel reusing CapabilityDetailPanel.

**Tech Stack:** React 19, TypeScript, SVG paths (already in component), CSS animations (`stroke-dashoffset`), REST chain API (already used in enterpriseService.ts), CSS `filter: hue-rotate()` for node tinting.

**Design Doc:** `docs/plans/2026-03-03-living-ontology-dashboard-design.md`

---

## Phase 1: Fix Figma Alignment + Header Update

### Task 1: Update header label "Capacity"

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx:44-46` (labels object)
- Modify: `frontend/src/components/desks/OntologyHome.tsx:328` (Header render)
- Modify: `frontend/src/i18n/en.json` (add `josoor.capacity`)
- Modify: `frontend/src/i18n/ar.json` (add `josoor.capacity`)

**Step 1: Update the L labels object**

In OntologyHome.tsx, change:
```typescript
// Line 45 — change the 4th column from "health" reuse to its own label
health:       { en: 'Health',               ar: 'الصحة' },
capacity:     { en: 'Capacity',             ar: 'القدرة الاستيعابية' },
```

**Step 2: Update the Header render for column 4**

```typescript
// Line 328 — change from L.health to L.capacity
<Header x={3165} y={169} w={1705} h={230} label={L.capacity} iconKind="enterprise" />
```

**Step 3: Add i18n keys**

In `en.json` under `josoor`:
```json
"capacity": "Capacity",
"capacitySub": "Enterprise health & maturity"
```

In `ar.json` under `josoor`:
```json
"capacity": "القدرة الاستيعابية",
"capacitySub": "صحة المؤسسة والنضج"
```

**Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: 0 errors in OntologyHome.tsx

**Step 5: Commit**

```bash
git add frontend/src/components/desks/OntologyHome.tsx frontend/src/i18n/en.json frontend/src/i18n/ar.json
git commit -m "feat(ontology): rename column 4 header to Capacity"
```

---

## Phase 2: Animated Line Styles (RAG CSS)

### Task 2: Add RAG line CSS classes and animations

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.css:74-94` (relation line styles)

**Step 1: Replace static `.ont-rel-line` with RAG variants**

Replace the existing `.ont-rel-line` and `.ont-rel-arrow` rules (lines 83-94) with:

```css
/* ── Ontology relation lines — RAG states ── */
.ont-rel-line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 0.18;
}

/* GREEN: dotted + fast marching animation = healthy flow */
.ont-rel-line--green {
  stroke: var(--component-color-success);
  stroke-dasharray: 0.6 0.3;
  animation: ont-line-march 1s linear infinite;
  opacity: 0.85;
}

/* AMBER: dotted + slow animation = degrading */
.ont-rel-line--amber {
  stroke: var(--component-color-warning);
  stroke-dasharray: 0.6 0.3;
  animation: ont-line-march 3s linear infinite;
  opacity: 0.9;
}

/* RED: solid + no animation = broken / dead */
.ont-rel-line--red {
  stroke: var(--component-color-danger);
  stroke-dasharray: none;
  animation: none;
  opacity: 0.95;
}

/* Default (no data yet) — muted static */
.ont-rel-line--default {
  stroke: var(--component-panel-border);
  stroke-dasharray: 0.4 0.3;
  animation: none;
  opacity: 0.5;
}

@keyframes ont-line-march {
  to { stroke-dashoffset: -0.9; }
}

/* Line thickness modifier classes */
.ont-rel-line--thin  { stroke-width: 0.14; }
.ont-rel-line--med   { stroke-width: 0.22; }
.ont-rel-line--thick { stroke-width: 0.32; }

/* Arrow markers per RAG */
.ont-rel-arrow--green  { fill: var(--component-color-success); }
.ont-rel-arrow--amber  { fill: var(--component-color-warning); }
.ont-rel-arrow--red    { fill: var(--component-color-danger); }
.ont-rel-arrow--default { fill: var(--component-panel-border); }
```

**Step 2: Verify CSS loads**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -5`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/components/desks/OntologyHome.css
git commit -m "feat(ontology): add RAG animation CSS for relationship lines"
```

---

### Task 3: Apply RAG classes to SVG lines in TSX

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx:339-367` (SVG rendering section)

**Step 1: Add RAG state type and default state**

At the top of the component (after the `const V = '?v=2';` line), add:

```typescript
type RagStatus = 'green' | 'amber' | 'red' | 'default';

// Placeholder — will be replaced by chain-data-driven logic in Phase 2
const getLineRag = (_from: string, _to: string): RagStatus => 'default';
const getLineWeight = (_from: string, _to: string): 'thin' | 'med' | 'thick' => 'med';
```

**Step 2: Update SVG defs to include RAG-colored markers**

Replace the single `<defs>` block with:

```tsx
<defs>
  {(['green', 'amber', 'red', 'default'] as const).map(rag => (
    <marker key={rag} id={`ont-arrow-${rag}`} viewBox="0 0 10 10" refX="8" refY="5"
      markerWidth="4" markerHeight="4" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" className={`ont-rel-arrow--${rag}`} />
    </marker>
  ))}
</defs>
```

**Step 3: Update the path rendering to use RAG classes**

Replace the existing `renderedLines.map(...)` with:

```tsx
{renderedLines.map((relation) => {
  const fromNode = relationNodes[relation.from];
  const toNode = relationNodes[relation.to];
  const c1x = cx(fromNode.x, fromNode.w);
  const c1y = cy(fromNode.y, fromNode.h);
  const c2x = cx(toNode.x, toNode.w);
  const c2y = cy(toNode.y, toNode.h);
  const s = anchorPoint(fromNode, c2x, c2y);
  const e = anchorPoint(toNode, c1x, c1y);
  const mx = ((s.x + e.x) / 2) + (relation.laneX ?? 0);
  const path = `M ${s.x} ${s.y} L ${mx} ${s.y} L ${mx} ${e.y} L ${e.x} ${e.y}`;
  const rag = getLineRag(relation.from, relation.to);
  const weight = getLineWeight(relation.from, relation.to);
  return (
    <g key={`${relation.from}-${relation.to}`}>
      <path
        d={path}
        className={`ont-rel-line ont-rel-line--${rag} ont-rel-line--${weight}`}
        markerStart={relation.bidirectional ? `url(#ont-arrow-${rag})` : undefined}
        markerEnd={`url(#ont-arrow-${rag})`}
      />
    </g>
  );
})}
```

**Step 4: Verify TypeScript compiles and lines render**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: 0 errors. Lines should render as muted dotted (default state).

**Step 5: Commit**

```bash
git add frontend/src/components/desks/OntologyHome.tsx
git commit -m "feat(ontology): wire RAG classes to SVG relationship lines"
```

---

## Phase 3: Node RAG Tinting (CSS Filters)

### Task 4: Add CSS filter classes for node tinting

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.css` (add at end)

**Step 1: Add node RAG tint classes**

Append to OntologyHome.css:

```css
/* ── Node RAG tinting via CSS filter ── */
/* Applied to .ont-img wrapping the node image */

/* Green: shift gold (hue ~45°) toward green (hue ~140°) */
.ont-node--green img {
  filter: hue-rotate(65deg) saturate(1.4) brightness(1.05);
}

/* Amber: keep close to gold, slight shift toward orange */
.ont-node--amber img {
  filter: hue-rotate(-15deg) saturate(1.6) brightness(1.0);
}

/* Red: shift gold toward red (hue ~0°) */
.ont-node--red img {
  filter: hue-rotate(-40deg) saturate(2.0) brightness(0.9);
}

/* Default: original gold, no filter */
.ont-node--default img {
  filter: none;
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/desks/OntologyHome.css
git commit -m "feat(ontology): add CSS filter classes for node RAG tinting"
```

---

### Task 5: Apply RAG tint class to node images in TSX

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx` (Img function + node renders)

**Step 1: Add node RAG resolver placeholder**

Near the `getLineRag` placeholder, add:

```typescript
// Placeholder — will be replaced by chain-data-driven logic
const getNodeRag = (_nodeKey: string): RagStatus => 'default';
```

**Step 2: Update the `Img` component to accept optional RAG class**

```typescript
function Img({ x, y, w, h, src, alt = '', nodeKey }: {
  x: number; y: number; w: number; h: number; src: string; alt?: string; nodeKey?: string;
}) {
  const ragClass = nodeKey ? `ont-node--${getNodeRag(nodeKey)}` : '';
  return (
    <Box x={x} y={y} w={w} h={h} className={`ont-img ${ragClass}`}>
      <img src={src} alt={alt} style={rtl ? { transform: 'scaleX(-1)' } : undefined} />
    </Box>
  );
}
```

**Step 3: Add `nodeKey` prop to each Img usage**

For every `<Img ...>` call, add the matching nodeKey. Examples:

```typescript
<Img x={183} y={1944} w={477} h={441} src={A.sectorObj} alt="Sector Objectives" nodeKey="sectorObjectives" />
<Img x={1343} y={1249} w={477} h={441} src={A.sectorObj} alt="Policy Tools" nodeKey="policyTools" />
<Img x={2496} y={1944} w={477} h={441} src={A.sectorObj} alt="Risks" nodeKey="risks" />
<Img x={3448} y={1944} w={477} h={441} src={A.sectorObj} alt="Capabilities" nodeKey="capabilities" />
// ... and so on for all ~18 node images
```

Use the keys from the `relationNodes` object as nodeKey values (they already match).

**Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: 0 errors

**Step 5: Commit**

```bash
git add frontend/src/components/desks/OntologyHome.tsx
git commit -m "feat(ontology): wire RAG tint classes to node images"
```

---

## Phase 4: Chain Data Fetching + Impact Scoring

### Task 6: Create ontology data service

**Files:**
- Create: `frontend/src/services/ontologyService.ts`

This service fetches chain data and computes impact scores. It reuses the same REST pattern as `enterpriseService.ts:runChainOnce`.

**Step 1: Write the service**

```typescript
/**
 * Ontology Dashboard Data Service
 * Fetches chain data via REST and computes impact-weighted RAG status per node type.
 */

export type RagStatus = 'green' | 'amber' | 'red' | 'default';
export type LineWeight = 'thin' | 'med' | 'thick';

interface ChainNode {
  id: string;
  labels: string[];
  properties: Record<string, any>;
}

interface ChainLink {
  type: string;
  start: string;
  end: string;
}

interface ChainData {
  nodes: ChainNode[];
  links: ChainLink[];
}

// Map of ontology node type → aggregated RAG
export interface OntologyRagState {
  nodeRag: Record<string, RagStatus>;       // keyed by relationNodes key (e.g. "capabilities")
  lineRag: Record<string, RagStatus>;       // keyed by "from->to" (e.g. "capabilities->risks")
  lineWeight: Record<string, LineWeight>;   // keyed by "from->to"
  stripData: StripColumn[];
}

export interface StripColumn {
  column: string;          // "goals" | "sector" | "health" | "capacity" | "velocity"
  total: number;           // total nodes in this column
  green: number;
  amber: number;
  red: number;
  priorityReds: number;    // red + high impact (upstream fan-out > threshold)
}

// Node type label → ontology node key mapping
const LABEL_TO_NODE_KEY: Record<string, string> = {
  SectorObjective: 'sectorObjectives',
  SectorPolicyTool: 'policyTools',
  SectorPerformance: 'performance',
  SectorAdminRecord: 'adminRecords',
  SectorDataTransaction: 'dataTransactions',
  SectorBusiness: 'businessUp',
  SectorCitizen: 'citizen',
  SectorGovEntity: 'govEntity',
  EntityCapability: 'capabilities',
  EntityRisk: 'risks',
  EntityOrgUnit: 'orgUnits',
  EntityProcess: 'processes',
  EntityITSystem: 'itSystems',
  EntityVendor: 'vendors',
  EntityProject: 'projects',
  EntityChangeAdoption: 'changeAdoption',
  EntityCultureHealth: 'cultureHealth',
};

// Node key → column mapping
const NODE_TO_COLUMN: Record<string, string> = {
  sectorObjectives: 'goals',
  policyTools: 'sector', adminRecords: 'sector', citizen: 'sector',
  govEntity: 'sector', businessUp: 'sector', businessMid: 'sector',
  businessDown: 'sector', dataTransactions: 'sector', performance: 'sector',
  risks: 'health', riskPlans: 'health',
  capabilities: 'capacity', orgUnits: 'capacity', processes: 'capacity',
  itSystems: 'capacity', vendors: 'capacity', cultureHealth: 'capacity',
  projects: 'velocity', changeAdoption: 'velocity',
};

// Impact threshold — nodes with upstream fan-out above this make aggregates RED
const IMPACT_THRESHOLD = 3;

async function fetchChain(name: string): Promise<ChainData> {
  const url = `/api/v1/chains/${name}?year=0`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Chain ${name}: HTTP ${res.status}`);
  const data = await res.json();
  const envelope = data.results?.[0] || {};
  return {
    nodes: (envelope.nodes || []).map((n: any) => ({
      id: n.id || n.properties?.id || '',
      labels: n.labels || [],
      properties: n.properties || {},
    })),
    links: (envelope.relationships || []).map((r: any) => ({
      type: r.type || '',
      start: String(r.start ?? ''),
      end: String(r.end ?? ''),
    })),
  };
}

/**
 * Compute upstream fan-out for each node: how many unique KPIs + Objectives
 * would be affected if this node fails. Traverse upward through links.
 */
function computeImpactScores(chains: ChainData[]): Map<string, number> {
  // Build adjacency: nodeId → set of upstream nodeIds
  const upstreamOf = new Map<string, Set<string>>();
  const nodeLabels = new Map<string, string[]>(); // id → labels

  for (const chain of chains) {
    for (const n of chain.nodes) {
      if (!nodeLabels.has(n.id)) nodeLabels.set(n.id, n.labels);
    }
    for (const link of chain.links) {
      // link goes start → end. "Upstream" means: what does this node feed INTO.
      // For impact: if node X has link X→Y, then Y depends on X.
      // We want: for each node, count how many SectorPerformance/SectorObjective are reachable upstream.
      if (!upstreamOf.has(link.start)) upstreamOf.set(link.start, new Set());
      upstreamOf.get(link.start)!.add(link.end);
    }
  }

  // BFS from each node upward, count KPI/Objective hits
  const impactCache = new Map<string, number>();
  const kpiLabels = new Set(['SectorPerformance', 'SectorObjective']);

  function bfsImpact(startId: string): number {
    if (impactCache.has(startId)) return impactCache.get(startId)!;
    const visited = new Set<string>();
    const queue = [startId];
    let impact = 0;
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const labels = nodeLabels.get(current) || [];
      if (labels.some(l => kpiLabels.has(l)) && current !== startId) {
        impact++;
      }
      const neighbors = upstreamOf.get(current);
      if (neighbors) {
        for (const n of neighbors) {
          if (!visited.has(n)) queue.push(n);
        }
      }
    }
    impactCache.set(startId, impact);
    return impact;
  }

  // Compute for all nodes
  for (const chain of chains) {
    for (const n of chain.nodes) {
      bfsImpact(n.id);
    }
  }

  return impactCache;
}

/**
 * Determine RAG status for an individual node based on its properties.
 */
function getNodeInstanceRag(props: Record<string, any>, labels: string[]): RagStatus {
  // EntityCapability: use build_status / execute_status
  if (labels.includes('EntityCapability')) {
    const status = props.status;
    if (status === 'active') {
      // OPERATE mode
      const es = props.execute_status;
      if (es === 'issues') return 'red';
      if (es === 'at-risk') return 'amber';
      return 'green';
    } else {
      // BUILD mode
      const bs = props.build_status;
      if (bs === 'in-progress-issues') return 'red';
      if (bs === 'in-progress-atrisk') return 'amber';
      if (bs === 'in-progress-ontrack') return 'green';
      return 'default'; // not-due, planned
    }
  }

  // EntityRisk: use build_band / operate_band
  if (labels.includes('EntityRisk')) {
    const band = props.build_band || props.operate_band;
    if (band === 'Red' || band === 'red') return 'red';
    if (band === 'Amber' || band === 'amber') return 'amber';
    if (band === 'Green' || band === 'green') return 'green';
    return 'default';
  }

  // SectorPerformance: use actual_value / target (90/70 thresholds)
  if (labels.includes('SectorPerformance')) {
    const actual = parseFloat(props.actual_value);
    const target = parseFloat(props.target);
    if (!isNaN(actual) && !isNaN(target) && target > 0) {
      const pct = (actual / target) * 100;
      if (pct >= 90) return 'green';
      if (pct >= 70) return 'amber';
      return 'red';
    }
    return 'default';
  }

  // EntityProject: use actual_progress_pct vs planned_progress_pct
  if (labels.includes('EntityProject')) {
    const actual = parseFloat(props.actual_progress_pct);
    const planned = parseFloat(props.planned_progress_pct);
    if (!isNaN(actual) && !isNaN(planned) && planned > 0) {
      const ratio = actual / planned;
      if (ratio >= 0.9) return 'green';
      if (ratio >= 0.7) return 'amber';
      return 'red';
    }
    return 'default';
  }

  return 'default';
}

/**
 * Aggregate individual node RAG statuses into ontology-level node RAG.
 * Rule: node_color = highest-impact red child.
 * - If ANY child is red AND impact > threshold → RED
 * - If ANY child is red AND impact ≤ threshold → AMBER
 * - If no reds → GREEN (if any data) or DEFAULT
 */
function aggregateNodeRag(
  nodesByType: Map<string, { props: Record<string, any>; labels: string[]; id: string }[]>,
  impactScores: Map<string, number>,
): Record<string, RagStatus> {
  const result: Record<string, RagStatus> = {};

  for (const [nodeKey, instances] of nodesByType) {
    if (instances.length === 0) {
      result[nodeKey] = 'default';
      continue;
    }

    let hasHighImpactRed = false;
    let hasAnyRed = false;
    let hasAmber = false;
    let hasGreen = false;

    for (const inst of instances) {
      const rag = getNodeInstanceRag(inst.props, inst.labels);
      const impact = impactScores.get(inst.id) || 0;

      if (rag === 'red') {
        hasAnyRed = true;
        if (impact > IMPACT_THRESHOLD) hasHighImpactRed = true;
      } else if (rag === 'amber') {
        hasAmber = true;
      } else if (rag === 'green') {
        hasGreen = true;
      }
    }

    if (hasHighImpactRed) result[nodeKey] = 'red';
    else if (hasAnyRed || hasAmber) result[nodeKey] = 'amber';
    else if (hasGreen) result[nodeKey] = 'green';
    else result[nodeKey] = 'default';
  }

  return result;
}

/**
 * Derive line RAG: worst-impact status of the downstream node.
 */
function deriveLineRag(
  nodeRag: Record<string, RagStatus>,
): Record<string, RagStatus> {
  const result: Record<string, RagStatus> = {};
  // Line color = worse of the two endpoints
  const priority: Record<RagStatus, number> = { red: 3, amber: 2, green: 1, default: 0 };
  return result;
}

/**
 * Main entry: fetch chains, compute everything, return OntologyRagState.
 */
export async function fetchOntologyRagState(): Promise<OntologyRagState> {
  // Fetch the 3 most relevant chains in parallel
  const [svc, bo, oo] = await Promise.all([
    fetchChain('sector_value_chain').catch(() => ({ nodes: [], links: [] })),
    fetchChain('build_oversight').catch(() => ({ nodes: [], links: [] })),
    fetchChain('operate_oversight').catch(() => ({ nodes: [], links: [] })),
  ]);

  const chains = [svc, bo, oo];

  // 1. Compute impact scores
  const impactScores = computeImpactScores(chains);

  // 2. Group nodes by ontology node key
  const nodesByType = new Map<string, { props: Record<string, any>; labels: string[]; id: string }[]>();
  for (const chain of chains) {
    for (const n of chain.nodes) {
      const label = n.labels.find(l => LABEL_TO_NODE_KEY[l]);
      if (!label) continue;
      const key = LABEL_TO_NODE_KEY[label];
      if (!nodesByType.has(key)) nodesByType.set(key, []);
      nodesByType.get(key)!.push({ props: n.properties, labels: n.labels, id: n.id });
    }
  }

  // 3. Aggregate RAG per ontology node
  const nodeRag = aggregateNodeRag(nodesByType, impactScores);

  // 4. Derive line RAG (worst of two endpoint nodes)
  const lineRag: Record<string, RagStatus> = {};
  const lineWeight: Record<string, LineWeight> = {};
  const ragPriority: Record<RagStatus, number> = { red: 3, amber: 2, green: 1, default: 0 };

  // For each relation, line color = worst of from/to node RAG
  // Line weight based on max impact score among nodes in the downstream type
  for (const [nodeKey, instances] of nodesByType) {
    const maxImpact = Math.max(0, ...instances.map(i => impactScores.get(i.id) || 0));
    // Store for later weight calc
    (nodesByType as any).__maxImpact = (nodesByType as any).__maxImpact || {};
    (nodesByType as any).__maxImpact[nodeKey] = maxImpact;
  }

  // We'll compute line RAG/weight in the component using the nodeRag map
  // since we know the from/to keys there

  // 5. Compute strip data
  const columns = ['goals', 'sector', 'health', 'capacity', 'velocity'];
  const stripData: StripColumn[] = columns.map(col => {
    const nodeKeys = Object.entries(NODE_TO_COLUMN)
      .filter(([, c]) => c === col)
      .map(([k]) => k);

    let total = 0, green = 0, amber = 0, red = 0, priorityReds = 0;

    for (const key of nodeKeys) {
      const instances = nodesByType.get(key) || [];
      for (const inst of instances) {
        total++;
        const rag = getNodeInstanceRag(inst.props, inst.labels);
        const impact = impactScores.get(inst.id) || 0;
        if (rag === 'green') green++;
        else if (rag === 'amber') amber++;
        else if (rag === 'red') {
          red++;
          if (impact > IMPACT_THRESHOLD) priorityReds++;
        }
      }
    }

    return { column: col, total, green, amber, red, priorityReds };
  });

  return { nodeRag, lineRag, lineWeight, stripData };
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: 0 errors

**Step 3: Commit**

```bash
git add frontend/src/services/ontologyService.ts
git commit -m "feat(ontology): create ontologyService with chain fetch + impact scoring"
```

---

### Task 7: Wire ontologyService into OntologyHome component

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx`

**Step 1: Add imports and state**

At the top of the file, add:

```typescript
import { useState, useEffect } from 'react';
import { fetchOntologyRagState, type OntologyRagState, type RagStatus } from '../../services/ontologyService';
```

**Step 2: Add state + fetch inside the component**

Inside the `OntologyHome` function, after `const rtl = ...`:

```typescript
const [ragState, setRagState] = useState<OntologyRagState | null>(null);

useEffect(() => {
  fetchOntologyRagState()
    .then(setRagState)
    .catch(err => console.warn('[OntologyHome] RAG fetch failed, using defaults:', err));
}, []);
```

**Step 3: Replace placeholder functions with real ones**

Replace the `getLineRag`, `getLineWeight`, and `getNodeRag` placeholders with:

```typescript
const getLineRag = (from: string, to: string): RagStatus => {
  if (!ragState) return 'default';
  const fromRag = ragState.nodeRag[from] || 'default';
  const toRag = ragState.nodeRag[to] || 'default';
  const priority: Record<RagStatus, number> = { red: 3, amber: 2, green: 1, default: 0 };
  return priority[fromRag] >= priority[toRag] ? fromRag : toRag;
};

const getLineWeight = (from: string, to: string): 'thin' | 'med' | 'thick' => {
  if (!ragState) return 'med';
  const key = `${from}->${to}`;
  return ragState.lineWeight[key] || 'med';
};

const getNodeRag = (nodeKey: string): RagStatus => {
  if (!ragState) return 'default';
  return ragState.nodeRag[nodeKey] || 'default';
};
```

**Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: 0 errors

**Step 5: Commit**

```bash
git add frontend/src/components/desks/OntologyHome.tsx
git commit -m "feat(ontology): wire chain data into node RAG + line RAG"
```

---

## Phase 5: KPI Signal Strip

### Task 8: Add signal strip component + CSS

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx` (add strip section)
- Modify: `frontend/src/components/desks/OntologyHome.css` (add strip styles)

**Step 1: Add strip CSS**

Append to OntologyHome.css:

```css
/* ── KPI Signal Strip ── */
.ont-strip {
  position: absolute;
  display: flex;
  gap: 2px;
}

.ont-strip__cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 4px;
  background: color-mix(in srgb, var(--component-panel-bg) 85%, transparent);
  border: 1px solid var(--component-panel-border);
  border-radius: 4px;
}

.ont-strip__bar {
  width: 80%;
  height: 6px;
  border-radius: 3px;
  display: flex;
  overflow: hidden;
  background: var(--component-bg-secondary);
}

.ont-strip__bar-seg {
  height: 100%;
  transition: width 0.6s ease;
}

.ont-strip__bar-seg--green  { background: var(--component-color-success); }
.ont-strip__bar-seg--amber  { background: var(--component-color-warning); }
.ont-strip__bar-seg--red    { background: var(--component-color-danger); }

.ont-strip__count {
  font-family: var(--component-font-family);
  font-size: clamp(8px, 1vw, 13px);
  font-weight: 600;
  color: var(--component-text-primary);
}

.ont-strip__count--clear {
  color: var(--component-color-success);
}

.ont-strip__count--alert {
  color: var(--component-color-danger);
}

[lang="ar"] .ont-strip__count {
  font-family: var(--component-font-family-ar);
}
```

**Step 2: Add strip rendering in TSX**

In OntologyHome.tsx, between the CATEGORY HEADERS section and the COLUMN BACKGROUNDS section, add:

```tsx
{/* ═══ KPI SIGNAL STRIP ═══ */}
<Box x={0} y={430} w={5833} h={350} className="ont-strip">
  {(ragState?.stripData || []).map(col => {
    const total = col.green + col.amber + col.red || 1;
    const gPct = (col.green / total) * 100;
    const aPct = (col.amber / total) * 100;
    const rPct = (col.red / total) * 100;
    const labels: Record<string, { clear: string; alert: string }> = {
      goals:    { clear: rtl ? 'سليم' : 'clear', alert: rtl ? 'أولوية' : 'priority' },
      sector:   { clear: rtl ? 'سليم' : 'clear', alert: rtl ? 'أولوية' : 'priority' },
      health:   { clear: rtl ? 'سليم' : 'clear', alert: rtl ? 'عالي الأثر' : 'high-impact' },
      capacity: { clear: rtl ? 'سليم' : 'clear', alert: rtl ? 'حرج' : 'critical' },
      velocity: { clear: rtl ? 'سليم' : 'clear', alert: rtl ? 'معطل' : 'blocked' },
    };
    const lbl = labels[col.column] || labels.goals;
    return (
      <div key={col.column} className="ont-strip__cell">
        <div className="ont-strip__bar">
          {gPct > 0 && <div className="ont-strip__bar-seg ont-strip__bar-seg--green" style={{ width: `${gPct}%` }} />}
          {aPct > 0 && <div className="ont-strip__bar-seg ont-strip__bar-seg--amber" style={{ width: `${aPct}%` }} />}
          {rPct > 0 && <div className="ont-strip__bar-seg ont-strip__bar-seg--red" style={{ width: `${rPct}%` }} />}
        </div>
        <span className={`ont-strip__count ${col.priorityReds > 0 ? 'ont-strip__count--alert' : 'ont-strip__count--clear'}`}>
          {col.priorityReds > 0 ? `${col.priorityReds} ${lbl.alert}` : lbl.clear}
        </span>
      </div>
    );
  })}
</Box>
```

**Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: 0 errors

**Step 4: Commit**

```bash
git add frontend/src/components/desks/OntologyHome.tsx frontend/src/components/desks/OntologyHome.css
git commit -m "feat(ontology): add KPI signal strip with RAG micro-bars"
```

---

## Phase 6: Click → Side Panel

### Task 9: Add click handler to nodes, open side panel

**Files:**
- Modify: `frontend/src/components/desks/OntologyHome.tsx` (click handler + panel import)
- Modify: `frontend/src/components/desks/OntologyHome.css` (clickable cursor)

**Step 1: Add clickable CSS**

Append to OntologyHome.css:

```css
/* ── Clickable nodes ── */
.ont-img--clickable {
  cursor: pointer;
  transition: filter 0.2s ease;
}

.ont-img--clickable:hover {
  filter: brightness(1.15);
}

/* ── Side panel overlay ── */
.ont-panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}

.ont-panel-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}

.ont-panel {
  position: relative;
  width: min(480px, 90vw);
  height: 100%;
  background: var(--component-panel-bg);
  border-left: 1px solid var(--component-panel-border);
  overflow-y: auto;
  padding: 16px;
  z-index: 1;
}

[dir="rtl"] .ont-panel-overlay {
  justify-content: flex-start;
}

[dir="rtl"] .ont-panel {
  border-left: none;
  border-right: 1px solid var(--component-panel-border);
}
```

**Step 2: Add state and handler in TSX**

Inside OntologyHome, after ragState:

```typescript
const [selectedNode, setSelectedNode] = useState<string | null>(null);
```

**Step 3: Update Img to be clickable for main nodes**

Add an `onClick` prop:

```typescript
function Img({ x, y, w, h, src, alt = '', nodeKey, clickable = false }: {
  x: number; y: number; w: number; h: number; src: string; alt?: string;
  nodeKey?: string; clickable?: boolean;
}) {
  const ragClass = nodeKey ? `ont-node--${getNodeRag(nodeKey)}` : '';
  const clickClass = clickable ? 'ont-img--clickable' : '';
  return (
    <Box x={x} y={y} w={w} h={h} className={`ont-img ${ragClass} ${clickClass}`}>
      <img
        src={src} alt={alt}
        style={rtl ? { transform: 'scaleX(-1)' } : undefined}
        onClick={clickable && nodeKey ? () => setSelectedNode(nodeKey) : undefined}
      />
    </Box>
  );
}
```

Add `clickable` to the major nodes: capabilities, risks, projects, orgUnits, processes, itSystems.

**Step 4: Add panel overlay at end of JSX (before closing `</div>`)**

```tsx
{selectedNode && (
  <div className="ont-panel-overlay">
    <div className="ont-panel-backdrop" onClick={() => setSelectedNode(null)} />
    <div className="ont-panel">
      <button onClick={() => setSelectedNode(null)} style={{
        float: rtl ? 'left' : 'right', background: 'none', border: 'none',
        color: 'var(--component-text-primary)', fontSize: 20, cursor: 'pointer',
      }}>✕</button>
      <h3 style={{ color: 'var(--component-text-accent)', fontFamily: 'var(--component-font-family)', margin: '0 0 12px' }}>
        {t(L[selectedNode as keyof typeof L] || L.capabilities)}
      </h3>
      <p style={{ color: 'var(--component-text-secondary)', fontFamily: 'var(--component-font-family)', fontSize: 14 }}>
        {rtl ? 'التفاصيل قريباً — سيتم ربطها بلوحة القدرات المؤسسية' : 'Detail panel coming — will connect to CapabilityDetailPanel'}
      </p>
    </div>
  </div>
)}
```

NOTE: Full CapabilityDetailPanel integration is a separate task. This establishes the click → panel pattern. The panel content will be wired to CapabilityDetailPanel once the data context is passed through.

**Step 5: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: 0 errors

**Step 6: Commit**

```bash
git add frontend/src/components/desks/OntologyHome.tsx frontend/src/components/desks/OntologyHome.css
git commit -m "feat(ontology): add click-to-panel interaction on nodes"
```

---

## Task Summary

| # | Task | Phase | Files | Key Action |
|---|------|-------|-------|------------|
| 1 | Header "Capacity" | 1 | OntologyHome.tsx, i18n | Label update |
| 2 | RAG line CSS | 2 | OntologyHome.css | Animation keyframes + RAG classes |
| 3 | Wire RAG to SVG | 2 | OntologyHome.tsx | Dynamic class application |
| 4 | Node tint CSS | 3 | OntologyHome.css | CSS filter hue-rotate classes |
| 5 | Wire tint to nodes | 3 | OntologyHome.tsx | nodeKey prop + RAG class |
| 6 | ontologyService | 4 | NEW ontologyService.ts | Chain fetch + impact scoring |
| 7 | Wire service to component | 4 | OntologyHome.tsx | useEffect fetch + state |
| 8 | KPI signal strip | 5 | OntologyHome.tsx/css | Strip component + CSS |
| 9 | Click → side panel | 6 | OntologyHome.tsx/css | Click handler + overlay panel |

**Estimated commits:** 9 (one per task)
**All data from existing REST endpoints — no backend changes.**
