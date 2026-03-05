# Graph Explorer — Multi-Layout & Table View Design

**Date:** 2026-03-01
**Status:** Approved
**Scope:** Enhance Graph Explorer with multiple layout options and tabular format

---

## Problem

The Graph Explorer currently only supports a Fibonacci sphere layout for 3D visualization. Users need to navigate the database for three purposes: exploring relationships, finding specific nodes, and understanding ontology structure. A single layout cannot serve all three effectively.

## Solution

Extend NeoGraph with a layout engine supporting 5 graph layouts + 1 table view, while preserving the existing Sankey chain visualization.

---

## Layout Modes

### 1. Sphere (existing, unchanged)
- Fibonacci sphere with `fx/fy/fz` pinning
- `radius = Math.max(200, nodeCount * 3)`
- Default for Custom Selection queries

### 2. Force-Directed (new)
- Remove `fx/fy/fz` pins, let `react-force-graph`'s d3-force simulation run
- `cooldownTicks: 200`, `d3AlphaDecay: 0.02` for stable convergence
- Best for exploring relationship clusters and connection density

### 3. Hierarchical (new)
- Two sub-modes (user toggle):
  - **PARENT_OF**: Tree layout following L1→L2→L3 hierarchy
  - **Chain Order**: Layout following business chain traversal path
- Y-axis = depth level, X-axis = sibling spread, Z-axis = type grouping (3D)
- Nodes pinned via `fx/fy/fz`
- Best for understanding structure and parent-child relationships

### 4. Circular (new)
- Concentric rings by level: L1 at center, L2 middle ring, L3 outer ring
- Nodes evenly distributed around each ring, grouped by type
- Nodes pinned via `fx/fy/fz`
- Best for seeing the overall shape and balance of the ontology

### 5. Sankey (existing, unchanged)
- Only available when a Business Chain is selected (needs CANONICAL_PATHS)
- Default viz mode when chain is selected
- Grayed out / hidden for Custom Selection queries

### 6. Table (new)
- **Tab 1 — Node List**: Flat table with columns: Name, Type (color badge), Level, Year, Status, Key Properties (expandable). Sortable by any column, search filter, click row → Node Details panel
- **Tab 2 — Adjacency Matrix**: Rows = source nodes, Columns = target nodes, Cells = relationship type/count, color intensity by connection count, hover tooltip, grouped by node type

---

## Mode Availability

| Mode | Custom Selection | Business Chain |
|------|-----------------|----------------|
| Sphere | Yes (default) | Yes |
| Force | Yes | Yes |
| Hierarchy | Yes | Yes |
| Circular | Yes | Yes |
| Sankey | No (disabled) | Yes (default) |
| Table | Yes | Yes |

---

## UI: Mode Selector Toolbar

Replaces the current `3d | sankey` toggle in ExplorerDesk with a segmented button group:

```
[ Sphere | Force | Hierarchy | Circular | Sankey | Table ]
```

**Sub-controls (contextual):**
- All graph modes: 3D/2D toggle (moved from inside NeoGraph to toolbar)
- Hierarchy mode: PARENT_OF / Chain toggle
- Table mode: Node List / Adjacency Matrix tabs

**Styling:** CSS variables (no Tailwind), active segment = accent color.

---

## Architecture

### Layout Engine (`graphLayouts.ts`)

Pure functions that compute node positions:

```ts
type LayoutMode = 'sphere' | 'force' | 'hierarchical' | 'circular';
type HierarchySource = 'parent_of' | 'chain';

computeSphereLayout(nodes, links)     → nodes with fx/fy/fz
computeHierarchicalLayout(nodes, links, source: HierarchySource) → nodes with fx/fy/fz
computeCircularLayout(nodes, links)   → nodes with fx/fy/fz
// Force: no computation needed — remove fx/fy/fz, let simulation run
```

### NeoGraph Changes

- New prop: `layoutMode: LayoutMode`, `hierarchySource?: HierarchySource`
- Refactor existing `useMemo` to call `computeLayout()` based on mode
- For force mode: clear `fx/fy/fz` and configure simulation params
- Remove internal 3D/2D toggle button (moves to parent ExplorerDesk)

### ExplorerDesk Changes

- Replace viz mode state from `'3d' | 'sankey'` → full `VizMode` type
- Add mode selector toolbar component
- Pass `layoutMode` + `hierarchySource` to NeoGraph
- Render `<GraphTable>` when table mode selected
- 3D/2D toggle in toolbar (applies to all graph modes)

### New Component: GraphTable

- Props: same `data: {nodes, links}` as NeoGraph
- Reuses `NodeDetailsPanel` from ExplorerDesk for row click
- Virtual scrolling for large datasets
- Tab switching between Node List and Adjacency Matrix

---

## File Changes

| File | Action |
|------|--------|
| `frontend/src/components/dashboards/NeoGraph.tsx` | Modify — add layoutMode prop, refactor position useMemo |
| `frontend/src/components/dashboards/graphLayouts.ts` | **Create** — pure layout computation functions |
| `frontend/src/components/dashboards/GraphTable.tsx` | **Create** — tabular view component |
| `frontend/src/components/dashboards/GraphTable.css` | **Create** — table styles |
| `frontend/src/components/desks/ExplorerDesk.tsx` | Modify — mode selector, pass layoutMode, render table |
| `frontend/src/components/desks/ExplorerDesk.css` | Modify — toolbar styles |

No backend changes. No API changes. Same data, different rendering.

---

## Verification

1. Load Graph Explorer, select "Custom Selection" with multiple node types
2. Switch through all 5 graph layouts — each should render same nodes in different arrangement
3. Select a Business Chain — Sankey should be default, other layouts available
4. Switch to Table view — Node List should show all nodes, sortable/filterable
5. Switch to Adjacency Matrix tab — relationships visible as grid
6. Click a node in any view — Node Details panel should open
7. 3D/2D toggle should work for all graph layouts
8. Hierarchy mode — toggle between PARENT_OF and Chain sources
