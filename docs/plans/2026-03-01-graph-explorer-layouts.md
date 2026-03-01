# Graph Explorer Multi-Layout & Table View — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 4 new visualization modes (Force-Directed, Hierarchical, Circular, Table) to the Graph Explorer, keeping the existing Sphere and Sankey modes.

**Architecture:** Extract layout computation into a pure-function module (`graphLayouts.ts`). NeoGraph accepts a `layoutMode` prop and delegates position computation. ExplorerDesk owns the mode selector toolbar. Table view reuses/enhances the existing `GraphDataTable` component with sorting, filtering, and an adjacency matrix tab.

**Tech Stack:** React 19, TypeScript, react-force-graph-3d@1.29.0, three.js@0.182.0, CSS variables (no Tailwind)

---

### Task 1: Create Layout Engine (`graphLayouts.ts`)

**Files:**
- Create: `frontend/src/components/dashboards/graphLayouts.ts`

**Step 1: Create the layout types and sphere layout function**

Extract the existing Fibonacci sphere logic from `NeoGraph.tsx` lines 122-157 into a standalone pure function.

```ts
// frontend/src/components/dashboards/graphLayouts.ts

export type LayoutMode = 'sphere' | 'force' | 'hierarchical' | 'circular';
export type HierarchySource = 'parent_of' | 'chain';

export interface LayoutNode {
  id: string;
  labels?: string[];
  label?: string;
  properties?: Record<string, any>;
  nProps?: Record<string, any>;
  fx?: number;
  fy?: number;
  fz?: number;
  _val?: number;
  [key: string]: any;
}

export interface LayoutLink {
  source: string | object;
  target: string | object;
  type?: string;
  rType?: string;
  [key: string]: any;
}

/** Count relations per node for sizing */
function countRelations(nodes: LayoutNode[], links: LayoutLink[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const l of links) {
    const src = typeof l.source === 'object' ? (l.source as any).id : l.source;
    const tgt = typeof l.target === 'object' ? (l.target as any).id : l.target;
    counts[src] = (counts[src] || 0) + 1;
    counts[tgt] = (counts[tgt] || 0) + 1;
  }
  return counts;
}

/** Attach _val (node size) based on relation count */
function attachNodeSize(nodes: LayoutNode[], relCount: Record<string, number>): void {
  for (const n of nodes) {
    const count = relCount[n.id] || 1;
    n._val = Math.max(2, Math.min(20, count * 2));
  }
}

/** Fibonacci sphere — existing algorithm, extracted */
export function computeSphereLayout(nodes: LayoutNode[], links: LayoutLink[]): LayoutNode[] {
  const relCount = countRelations(nodes, links);
  const nodeCount = nodes.length;
  const radius = Math.max(200, nodeCount * 3);
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  const result = nodes.map((n, i) => {
    const theta = Math.acos(1 - 2 * (i + 0.5) / nodeCount);
    const phi = 2 * Math.PI * i / goldenRatio;
    return {
      ...n,
      fx: radius * Math.sin(theta) * Math.cos(phi),
      fy: radius * Math.sin(theta) * Math.sin(phi),
      fz: radius * Math.cos(theta),
    };
  });
  attachNodeSize(result, relCount);
  return result;
}

/** Force-directed — remove all pinning, let simulation run */
export function computeForceLayout(nodes: LayoutNode[], links: LayoutLink[]): LayoutNode[] {
  const relCount = countRelations(nodes, links);
  const result = nodes.map(n => {
    const { fx, fy, fz, ...rest } = n;
    return { ...rest } as LayoutNode;
  });
  attachNodeSize(result, relCount);
  return result;
}

/** Hierarchical — tree layout by PARENT_OF edges or chain traversal order */
export function computeHierarchicalLayout(
  nodes: LayoutNode[],
  links: LayoutLink[],
  source: HierarchySource = 'parent_of'
): LayoutNode[] {
  const relCount = countRelations(nodes, links);
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Build parent→children adjacency from PARENT_OF links
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();

  if (source === 'parent_of') {
    for (const l of links) {
      const src = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const tgt = typeof l.target === 'object' ? (l.target as any).id : l.target;
      const relType = l.type || l.rType || '';
      if (relType === 'PARENT_OF') {
        if (!children.has(src)) children.set(src, []);
        children.get(src)!.push(tgt);
        hasParent.add(tgt);
      }
    }
  } else {
    // Chain order: use link order as traversal
    for (const l of links) {
      const src = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const tgt = typeof l.target === 'object' ? (l.target as any).id : l.target;
      if (!children.has(src)) children.set(src, []);
      children.get(src)!.push(tgt);
      hasParent.add(tgt);
    }
  }

  // Find roots (nodes with no parent)
  const roots = nodes.filter(n => !hasParent.has(n.id));
  if (roots.length === 0) {
    // Fallback: use level property
    const l1 = nodes.filter(n => (n.properties?.level || n.nProps?.level) === 'L1');
    if (l1.length > 0) roots.push(...l1);
    else roots.push(nodes[0]); // last resort
  }

  // BFS to assign depth + position
  const depthMap = new Map<string, number>();
  const depthBuckets = new Map<number, string[]>();
  const queue: string[] = roots.map(r => r.id);
  roots.forEach(r => depthMap.set(r.id, 0));

  while (queue.length > 0) {
    const id = queue.shift()!;
    const depth = depthMap.get(id)!;
    if (!depthBuckets.has(depth)) depthBuckets.set(depth, []);
    depthBuckets.get(depth)!.push(id);

    const kids = children.get(id) || [];
    for (const kid of kids) {
      if (!depthMap.has(kid)) {
        depthMap.set(kid, depth + 1);
        queue.push(kid);
      }
    }
  }

  // Place unvisited nodes at max depth + 1
  const maxDepth = Math.max(0, ...Array.from(depthBuckets.keys()));
  for (const n of nodes) {
    if (!depthMap.has(n.id)) {
      const d = maxDepth + 1;
      depthMap.set(n.id, d);
      if (!depthBuckets.has(d)) depthBuckets.set(d, []);
      depthBuckets.get(d)!.push(n.id);
    }
  }

  // Compute positions: Y = depth * spacing, X = spread within depth
  const ySpacing = 120;
  const allDepths = Array.from(depthBuckets.keys()).sort((a, b) => a - b);
  const totalHeight = allDepths.length * ySpacing;

  const result = nodes.map(n => {
    const depth = depthMap.get(n.id) ?? 0;
    const bucket = depthBuckets.get(depth) || [n.id];
    const idx = bucket.indexOf(n.id);
    const count = bucket.length;
    const xSpacing = Math.max(60, 800 / Math.max(count, 1));

    return {
      ...n,
      fx: (idx - (count - 1) / 2) * xSpacing,
      fy: depth * ySpacing - totalHeight / 2,
      fz: 0,
    };
  });

  attachNodeSize(result, relCount);
  return result;
}

/** Circular — concentric rings by level (L1 center, L2 middle, L3 outer) */
export function computeCircularLayout(nodes: LayoutNode[], links: LayoutLink[]): LayoutNode[] {
  const relCount = countRelations(nodes, links);

  // Group by level
  const groups: Record<string, LayoutNode[]> = { L1: [], L2: [], L3: [], other: [] };
  for (const n of nodes) {
    const level = n.properties?.level || n.nProps?.level || '';
    if (level === 'L1') groups.L1.push(n);
    else if (level === 'L2') groups.L2.push(n);
    else if (level === 'L3') groups.L3.push(n);
    else groups.other.push(n);
  }

  const rings = [
    { nodes: groups.L1, radius: 100 },
    { nodes: groups.L2, radius: 350 },
    { nodes: groups.L3, radius: 650 },
    { nodes: groups.other, radius: 900 },
  ].filter(r => r.nodes.length > 0);

  const result: LayoutNode[] = [];
  for (const ring of rings) {
    const count = ring.nodes.length;
    ring.nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / count;
      result.push({
        ...n,
        fx: ring.radius * Math.cos(angle),
        fy: ring.radius * Math.sin(angle),
        fz: 0,
      });
    });
  }

  attachNodeSize(result, relCount);
  return result;
}

/** Main dispatcher */
export function computeLayout(
  nodes: LayoutNode[],
  links: LayoutLink[],
  mode: LayoutMode,
  hierarchySource?: HierarchySource
): LayoutNode[] {
  switch (mode) {
    case 'sphere': return computeSphereLayout(nodes, links);
    case 'force': return computeForceLayout(nodes, links);
    case 'hierarchical': return computeHierarchicalLayout(nodes, links, hierarchySource || 'parent_of');
    case 'circular': return computeCircularLayout(nodes, links);
    default: return computeSphereLayout(nodes, links);
  }
}
```

**Step 2: Verify file compiles**

Run: `cd frontend && npx tsc --noEmit src/components/dashboards/graphLayouts.ts 2>&1 | head -20`
Expected: No errors (or only unrelated project-wide errors)

**Step 3: Commit**

```bash
git add frontend/src/components/dashboards/graphLayouts.ts
git commit -m "feat(explorer): add layout engine with sphere, force, hierarchical, circular modes"
```

---

### Task 2: Refactor NeoGraph to use Layout Engine

**Files:**
- Modify: `frontend/src/components/dashboards/NeoGraph.tsx`

**Step 1: Add layoutMode prop and import layout engine**

At the top of `NeoGraph.tsx`, add import and update the props interface:

```ts
import { LayoutMode, HierarchySource, computeLayout } from './graphLayouts';
```

Update `NeoGraphProps` — add these two props:

```ts
  layoutMode?: LayoutMode;
  hierarchySource?: HierarchySource;
```

Add them to the destructured props with defaults:

```ts
  layoutMode = 'sphere',
  hierarchySource = 'parent_of',
```

**Step 2: Replace the useMemo Fibonacci logic**

Replace the existing `graphData` useMemo (lines 122-157) with:

```ts
  const graphData = React.useMemo(() => {
    if (!data || !data.nodes) return { nodes: [], links: [] };

    const links = data.links ? data.links.map(l => ({ ...l })) : [];
    const nodes = computeLayout(
      data.nodes.map(n => ({ ...n })),
      links,
      layoutMode,
      hierarchySource
    );

    return { nodes, links };
  }, [data, layoutMode, hierarchySource]);
```

**Step 3: Configure force simulation params based on layout mode**

Update `commonProps` to vary by layout mode. After the existing `commonProps` object, add conditional overrides:

```ts
  // Force-directed needs longer simulation and specific forces
  const forceProps = layoutMode === 'force' ? {
    cooldownTicks: 200,
    d3AlphaDecay: 0.02,
    d3VelocityDecay: 0.3,
  } : {
    cooldownTicks: 100,
  };
```

Then spread `forceProps` into the ForceGraph component:

```ts
  is3D ? <ForceGraph3D {...commonProps} {...forceProps} /> : <ForceGraph2D {...commonProps} {...forceProps} />
```

**Step 4: Remove the internal 3D/2D toggle button**

Delete the `<div className="viz-controls-overlay">` block (lines 201-209). The 3D/2D toggle moves to ExplorerDesk toolbar. BUT keep the `is3D` state and the conditional rendering — just expose it as a prop instead:

Add to props interface:
```ts
  is3D?: boolean;
```

Add default: `is3D: is3DProp = true`

Remove the `useState` for `is3D` and use the prop directly. Rename internal references from `is3D` to `is3DProp`.

**Step 5: Verify the app compiles and sphere layout still works**

Run: `cd frontend && npm run build 2>&1 | tail -20`
Expected: Build succeeds. Graph Explorer with sphere layout works unchanged.

**Step 6: Commit**

```bash
git add frontend/src/components/dashboards/NeoGraph.tsx
git commit -m "refactor(explorer): NeoGraph uses layout engine, accepts layoutMode prop"
```

---

### Task 3: Update ExplorerDesk with Mode Selector Toolbar

**Files:**
- Modify: `frontend/src/components/desks/ExplorerDesk.tsx`
- Modify: `frontend/src/components/desks/ExplorerFilters.tsx`
- Modify: `frontend/src/components/desks/ExplorerDesk.css`

**Step 1: Update vizMode type and state**

In `ExplorerDesk.tsx`, replace:

```ts
const [vizMode, setVizMode] = useState<'3d' | 'sankey'>('3d');
```

With:

```ts
import { LayoutMode } from '../dashboards/graphLayouts';

type VizMode = LayoutMode | 'sankey' | 'table';
const [vizMode, setVizMode] = useState<VizMode>('sphere');
const [is3D, setIs3D] = useState(true);
const [hierarchySource, setHierarchySource] = useState<'parent_of' | 'chain'>('parent_of');
```

**Step 2: Update ExplorerFilters props type**

In `ExplorerFilters.tsx`, update the `vizMode` prop type from `'3d' | 'sankey'` to `string` (or import the VizMode type). Update the mode toggle buttons section (around line 244-257) to render the full set of modes:

```tsx
<div className="mode-toggle-group">
  {(['sphere', 'force', 'hierarchical', 'circular', 'sankey', 'table'] as const).map(mode => {
    const disabled = mode === 'sankey' && !selectedChain;
    const labels: Record<string, string> = {
      sphere: t('josoor.explorerFilters.sphere'),
      force: t('josoor.explorerFilters.force'),
      hierarchical: t('josoor.explorerFilters.hierarchy'),
      circular: t('josoor.explorerFilters.circular'),
      sankey: t('josoor.explorerFilters.sankeyFlow'),
      table: t('josoor.explorerFilters.table'),
    };
    return (
      <button
        key={mode}
        className={`btn-reset mode-toggle-btn ${vizMode === mode ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && onVizModeChange(mode)}
        disabled={disabled}
        title={disabled ? t('josoor.explorerFilters.requiresChain') : ''}
      >
        {labels[mode] || mode}
      </button>
    );
  })}
</div>
```

**Step 3: Add 3D/2D toggle and hierarchy sub-controls to ExplorerFilters**

Below the mode-toggle-group, add contextual sub-controls:

```tsx
{/* 3D/2D toggle — visible for all graph modes */}
{!['sankey', 'table'].includes(vizMode) && (
  <div className="mode-sub-controls">
    <label className="mode-toggle-label">{t('josoor.explorerFilters.dimension')}</label>
    <div className="mode-toggle-group">
      <button className={`btn-reset mode-toggle-btn ${is3D ? 'active' : ''}`} onClick={() => onIs3DChange(true)}>3D</button>
      <button className={`btn-reset mode-toggle-btn ${!is3D ? 'active' : ''}`} onClick={() => onIs3DChange(false)}>2D</button>
    </div>
  </div>
)}

{/* Hierarchy source — only for hierarchical mode */}
{vizMode === 'hierarchical' && (
  <div className="mode-sub-controls">
    <label className="mode-toggle-label">{t('josoor.explorerFilters.hierarchySource')}</label>
    <div className="mode-toggle-group">
      <button className={`btn-reset mode-toggle-btn ${hierarchySource === 'parent_of' ? 'active' : ''}`}
        onClick={() => onHierarchySourceChange('parent_of')}>
        {t('josoor.explorerFilters.parentOf')}
      </button>
      <button className={`btn-reset mode-toggle-btn ${hierarchySource === 'chain' ? 'active' : ''}`}
        onClick={() => onHierarchySourceChange('chain')}>
        {t('josoor.explorerFilters.chainOrder')}
      </button>
    </div>
  </div>
)}
```

Add the new props to ExplorerFilters props interface:
```ts
  is3D: boolean;
  hierarchySource: 'parent_of' | 'chain';
  onIs3DChange: (v: boolean) => void;
  onHierarchySourceChange: (v: 'parent_of' | 'chain') => void;
```

**Step 4: Update ExplorerDesk rendering logic**

Replace the visualization rendering block (lines 524-554) with:

```tsx
{/* Graph Layouts (sphere, force, hierarchical, circular) */}
{displayData && ['sphere', 'force', 'hierarchical', 'circular'].includes(vizMode) && (
  <NeoGraph
    data={displayData}
    isDark={isDark}
    language="en"
    year={year}
    quarter={quarter}
    legendConfig={LEGEND_CONFIG}
    nodeColor={getNodeColor}
    onNodeClick={setSelectedNode}
    layoutMode={vizMode as LayoutMode}
    hierarchySource={hierarchySource}
    is3D={is3D}
  />
)}

{/* Sankey */}
{displayData && vizMode === 'sankey' && hasCanonicalPath && (
  <GraphSankey
    data={displayData}
    isDark={isDark}
    chain={selectedChain}
    metadata={displayData.metadata}
    isDiagnostic={queryType === 'diagnostic'}
  />
)}
{displayData && vizMode === 'sankey' && !hasCanonicalPath && (
  <div className="status-overlay-container">
    <div className="empty-state-container">
      <p className="text-2xl font-light">{t('josoor.explorer.sankeyNotAvailable')}</p>
      <p className="text-sm">{t('josoor.explorer.branchingStructure')}</p>
    </div>
  </div>
)}

{/* Table View */}
{displayData && vizMode === 'table' && (
  <GraphDataTable
    data={displayData}
    isDark={isDark}
    onNodeClick={setSelectedNode}
  />
)}
```

**Step 5: Set default viz mode based on chain selection**

When chain selection changes, auto-set vizMode:

```ts
const handleChainChange = (chain: string | null) => {
  setSelectedChain(chain);
  if (chain && CHAIN_MAPPINGS[chain]) {
    setSelectedLabels(CHAIN_MAPPINGS[chain].labels);
    setSelectedRelationships(CHAIN_MAPPINGS[chain].relationships);
    // Default to sankey when chain is selected (if has canonical path)
    if (CANONICAL_PATHS[chain]?.steps?.length > 0) {
      setVizMode('sankey');
    }
  } else {
    // Custom selection defaults to sphere
    if (vizMode === 'sankey') setVizMode('sphere');
  }
};
```

**Step 6: Add CSS for mode selector**

In `ExplorerDesk.css`, add styles for the expanded mode toggle group. The `.mode-toggle-group` already exists — it may need adjustment for 6 buttons instead of 2:

```css
.mode-toggle-group {
  display: flex;
  gap: 2px;
  background: var(--surface-secondary, #1a1a2e);
  border-radius: 6px;
  padding: 2px;
  flex-wrap: wrap;
}

.mode-toggle-btn {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 4px;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.mode-toggle-btn.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.mode-sub-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.mode-toggle-label {
  font-size: 11px;
  opacity: 0.7;
  white-space: nowrap;
}
```

**Step 7: Verify build + all modes render**

Run: `cd frontend && npm run build 2>&1 | tail -20`
Expected: Build succeeds

**Step 8: Commit**

```bash
git add frontend/src/components/desks/ExplorerDesk.tsx frontend/src/components/desks/ExplorerFilters.tsx frontend/src/components/desks/ExplorerDesk.css
git commit -m "feat(explorer): mode selector toolbar with sphere/force/hierarchy/circular/sankey/table"
```

---

### Task 4: Enhance GraphDataTable with Sorting, Filtering, and Adjacency Matrix

**Files:**
- Modify: `frontend/src/components/desks/GraphDataTable.tsx`

**Step 1: Add sorting and filtering to the Node List tab**

Enhance `GraphDataTable` with:
- `onNodeClick` prop for row click → Node Details panel
- Search input filtering by name/type
- Sortable column headers (click to sort asc/desc)
- Level and Type columns with color badges
- Two tabs: "Node List" and "Adjacency Matrix"

```tsx
// frontend/src/components/desks/GraphDataTable.tsx
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface GraphDataTableProps {
  data: { nodes: any[]; links: any[] };
  isDark: boolean;
  onNodeClick?: (node: any) => void;
}

type SortKey = 'name' | 'type' | 'level' | 'year' | 'status';
type SortDir = 'asc' | 'desc';

const LABEL_COLORS: Record<string, string> = {
  SectorObjective: '#3b82f6', SectorPolicyTool: '#8b5cf6', SectorAdminRecord: '#06b6d4',
  SectorBusiness: '#f59e0b', SectorCitizen: '#10b981', SectorGovEntity: '#ef4444',
  SectorDataTransaction: '#ec4899', SectorPerformance: '#f97316',
  EntityCapability: '#6366f1', EntityOrgUnit: '#14b8a6', EntityProcess: '#a855f7',
  EntityITSystem: '#0ea5e9', EntityProject: '#84cc16', EntityChangeAdoption: '#e879f9',
  EntityRisk: '#f43f5e', EntityCultureHealth: '#22d3ee', EntityVendor: '#fb923c',
};

export function GraphDataTable({ data, isDark, onNodeClick }: GraphDataTableProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'nodes' | 'matrix'>('nodes');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  if (!data || (!data.nodes.length && !data.links.length)) return null;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const getField = (node: any, key: SortKey): string => {
    const props = node.properties || node.nProps || {};
    switch (key) {
      case 'name': return node.name || props.name || '';
      case 'type': return node.labels?.[0] || node.label || '';
      case 'level': return props.level || '';
      case 'year': return String(props.year || '');
      case 'status': return props.status || '';
    }
  };

  // Filter + sort
  const filteredNodes = useMemo(() => {
    let result = data.nodes;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(n => {
        const name = (n.name || n.properties?.name || '').toLowerCase();
        const type = (n.labels?.[0] || n.label || '').toLowerCase();
        return name.includes(q) || type.includes(q);
      });
    }
    return result.sort((a, b) => {
      const aVal = getField(a, sortKey).toLowerCase();
      const bVal = getField(b, sortKey).toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data.nodes, search, sortKey, sortDir]);

  const sortIndicator = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  return (
    <div className="graph-table-container" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tab bar */}
      <div className="graph-table-tabs" style={{ display: 'flex', gap: '2px', padding: '8px 12px', borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}` }}>
        <button className={`btn-reset mode-toggle-btn ${activeTab === 'nodes' ? 'active' : ''}`} onClick={() => setActiveTab('nodes')}>
          {t('josoor.explorer.table.nodeList', 'Node List')} ({data.nodes.length})
        </button>
        <button className={`btn-reset mode-toggle-btn ${activeTab === 'matrix' ? 'active' : ''}`} onClick={() => setActiveTab('matrix')}>
          {t('josoor.explorer.table.adjacencyMatrix', 'Adjacency Matrix')}
        </button>
      </div>

      {activeTab === 'nodes' && (
        <>
          {/* Search */}
          <div style={{ padding: '8px 12px' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('josoor.explorer.table.searchPlaceholder', 'Search nodes...')}
              style={{
                width: '100%', padding: '6px 10px', fontSize: '12px',
                borderRadius: '4px', border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                backgroundColor: isDark ? '#1f2937' : '#fff',
                color: isDark ? '#f9fafb' : '#111827',
              }}
            />
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: isDark ? '#d1d5db' : '#374151' }}>
              <thead>
                <tr>
                  {(['name', 'type', 'level', 'year', 'status'] as SortKey[]).map(key => (
                    <th key={key} onClick={() => handleSort(key)} style={{
                      textAlign: 'left', padding: '8px', cursor: 'pointer', userSelect: 'none',
                      borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      position: 'sticky', top: 0,
                    }}>
                      {t(`josoor.explorer.table.${key}`, key.charAt(0).toUpperCase() + key.slice(1))}{sortIndicator(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredNodes.map((n, i) => {
                  const type = n.labels?.[0] || n.label || '';
                  const props = n.properties || n.nProps || {};
                  return (
                    <tr key={n.id || i}
                      onClick={() => onNodeClick?.(n)}
                      style={{
                        cursor: onNodeClick ? 'pointer' : 'default',
                        backgroundColor: i % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                      }}
                    >
                      <td style={{ padding: '6px 8px', borderBottom: `1px solid ${isDark ? '#1f2937' : '#f3f4f6'}` }}>
                        {n.name || props.name || n.id}
                      </td>
                      <td style={{ padding: '6px 8px', borderBottom: `1px solid ${isDark ? '#1f2937' : '#f3f4f6'}` }}>
                        <span style={{
                          display: 'inline-block', padding: '1px 6px', borderRadius: '3px', fontSize: '10px',
                          backgroundColor: (LABEL_COLORS[type] || '#6b7280') + '22',
                          color: LABEL_COLORS[type] || '#6b7280', fontWeight: 600,
                        }}>{type}</span>
                      </td>
                      <td style={{ padding: '6px 8px', borderBottom: `1px solid ${isDark ? '#1f2937' : '#f3f4f6'}` }}>{props.level || ''}</td>
                      <td style={{ padding: '6px 8px', borderBottom: `1px solid ${isDark ? '#1f2937' : '#f3f4f6'}` }}>{props.year || ''}</td>
                      <td style={{ padding: '6px 8px', borderBottom: `1px solid ${isDark ? '#1f2937' : '#f3f4f6'}` }}>{props.status || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'matrix' && (
        <AdjacencyMatrix data={data} isDark={isDark} />
      )}
    </div>
  );
}

/** Adjacency Matrix sub-component */
function AdjacencyMatrix({ data, isDark }: { data: { nodes: any[]; links: any[] }; isDark: boolean }) {
  const { t } = useTranslation();

  // Group nodes by type for readable ordering
  const sortedNodes = useMemo(() => {
    return [...data.nodes].sort((a, b) => {
      const aType = a.labels?.[0] || a.label || '';
      const bType = b.labels?.[0] || b.label || '';
      if (aType !== bType) return aType.localeCompare(bType);
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [data.nodes]);

  // Build adjacency map: sourceId → targetId → relTypes[]
  const adjacency = useMemo(() => {
    const map = new Map<string, Map<string, string[]>>();
    for (const l of data.links) {
      const src = typeof l.source === 'object' ? l.source.id : l.source;
      const tgt = typeof l.target === 'object' ? l.target.id : l.target;
      const relType = l.type || l.rType || '?';
      if (!map.has(src)) map.set(src, new Map());
      const inner = map.get(src)!;
      if (!inner.has(tgt)) inner.set(tgt, []);
      inner.get(tgt)!.push(relType);
    }
    return map;
  }, [data.links]);

  // Limit to first 50 nodes for performance
  const displayNodes = sortedNodes.slice(0, 50);
  const truncated = sortedNodes.length > 50;

  const cellSize = 24;
  const headerHeight = 120;
  const labelWidth = 160;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
      {truncated && (
        <p style={{ fontSize: '11px', opacity: 0.6, marginBottom: '8px' }}>
          {t('josoor.explorer.table.matrixTruncated', `Showing first 50 of ${sortedNodes.length} nodes`)}
        </p>
      )}
      <div style={{ position: 'relative', minWidth: labelWidth + displayNodes.length * cellSize }}>
        {/* Column headers (rotated) */}
        <div style={{ display: 'flex', marginLeft: labelWidth, height: headerHeight }}>
          {displayNodes.map((n, i) => (
            <div key={n.id || i} style={{
              width: cellSize, position: 'relative',
            }}>
              <span style={{
                position: 'absolute', bottom: 0, left: '50%',
                transform: 'rotate(-60deg) translateX(-50%)',
                transformOrigin: 'bottom left',
                fontSize: '9px', whiteSpace: 'nowrap',
                color: isDark ? '#9ca3af' : '#6b7280',
                maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {(n.name || n.id || '').slice(0, 20)}
              </span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {displayNodes.map((rowNode, ri) => (
          <div key={rowNode.id || ri} style={{ display: 'flex', height: cellSize }}>
            {/* Row label */}
            <div style={{
              width: labelWidth, fontSize: '9px', padding: '2px 4px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              color: isDark ? '#d1d5db' : '#374151', lineHeight: `${cellSize}px`,
            }}>
              {(rowNode.name || rowNode.id || '').slice(0, 25)}
            </div>
            {/* Cells */}
            {displayNodes.map((colNode, ci) => {
              const rels = adjacency.get(rowNode.id)?.get(colNode.id) || [];
              const count = rels.length;
              const bg = count === 0
                ? 'transparent'
                : isDark
                  ? `rgba(244, 187, 48, ${Math.min(0.1 + count * 0.15, 0.8)})`
                  : `rgba(59, 130, 246, ${Math.min(0.1 + count * 0.15, 0.8)})`;

              return (
                <div key={`${ri}-${ci}`} title={rels.length > 0 ? `${rowNode.name} → ${colNode.name}: ${rels.join(', ')}` : ''} style={{
                  width: cellSize, height: cellSize,
                  backgroundColor: bg,
                  border: `0.5px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
                  fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: count > 0 ? (isDark ? '#fff' : '#fff') : 'transparent',
                }}>
                  {count > 0 ? count : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd frontend && npm run build 2>&1 | tail -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/components/desks/GraphDataTable.tsx
git commit -m "feat(explorer): enhanced GraphDataTable with sorting, filtering, adjacency matrix"
```

---

### Task 5: Add i18n Keys

**Files:**
- Modify: `frontend/src/i18n/en.json`

**Step 1: Add translation keys**

Add these keys under `josoor.explorerFilters`:

```json
"sphere": "Sphere",
"force": "Force",
"hierarchy": "Hierarchy",
"circular": "Circular",
"table": "Table",
"dimension": "Dimension",
"hierarchySource": "Hierarchy By",
"parentOf": "Level Tree",
"chainOrder": "Chain Order",
"requiresChain": "Select a Business Chain first"
```

Add under `josoor.explorer.table`:

```json
"nodeList": "Node List",
"adjacencyMatrix": "Adjacency Matrix",
"searchPlaceholder": "Search nodes...",
"name": "Name",
"type": "Type",
"level": "Level",
"year": "Year",
"status": "Status",
"matrixTruncated": "Showing first 50 of {{total}} nodes"
```

**Step 2: Commit**

```bash
git add frontend/src/i18n/en.json
git commit -m "feat(explorer): add i18n keys for layout modes and table view"
```

---

### Task 6: Manual Verification

**Step 1:** Start frontend dev server: `cd frontend && npm run dev`

**Step 2:** Open Graph Explorer at `/josoor`, click "Explorer" in sidebar

**Step 3:** Test each mode with Custom Selection:
- Select a few node types (e.g., EntityCapability, EntityRisk, SectorObjective)
- Click "Fetch Live Graph"
- Switch through: Sphere → Force → Hierarchy → Circular → Table
- Verify Sankey is disabled (grayed out) without a chain
- Toggle 3D/2D in each graph mode
- In Hierarchy mode, toggle PARENT_OF / Chain Order

**Step 4:** Test with Business Chain:
- Select "sector_value_chain" chain
- Verify Sankey is auto-selected as default
- Switch to other modes and back to Sankey
- Verify all layouts work with chain data

**Step 5:** Test Table view:
- Switch to Table mode
- Search for a node name — verify filtering works
- Click column headers — verify sorting works
- Click a row — verify Node Details panel opens
- Switch to Adjacency Matrix tab — verify grid renders with hover tooltips

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat(explorer): complete multi-layout Graph Explorer with table view"
```
