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
    const l1 = nodes.filter(n => (n.properties?.level || n.nProps?.level) === 'L1');
    if (l1.length > 0) roots.push(...l1);
    else if (nodes.length > 0) roots.push(nodes[0]);
  }

  // Build tree: compute subtree leaf count for each node (bottom-up)
  const visited = new Set<string>();
  const depthMap = new Map<string, number>();
  const leafCount = new Map<string, number>(); // how many leaf-slots this subtree needs

  function computeLeafCount(id: string, depth: number): number {
    if (visited.has(id)) return 0;
    visited.add(id);
    depthMap.set(id, depth);
    const kids = (children.get(id) || []).filter(k => !visited.has(k));
    if (kids.length === 0) {
      leafCount.set(id, 1);
      return 1;
    }
    let total = 0;
    for (const kid of kids) {
      total += computeLeafCount(kid, depth + 1);
    }
    leafCount.set(id, total);
    return total;
  }

  for (const root of roots) {
    computeLeafCount(root.id, 0);
  }

  // Handle orphans (unvisited nodes)
  const maxDepth = depthMap.size > 0 ? Math.max(...Array.from(depthMap.values())) : 0;
  for (const n of nodes) {
    if (!visited.has(n.id)) {
      depthMap.set(n.id, maxDepth + 1);
      leafCount.set(n.id, 1);
    }
  }

  // Position nodes: each node centered over its children
  const xSpacing = 80;
  const ySpacing = 150;
  const posMap = new Map<string, { x: number; y: number }>();

  function positionSubtree(id: string, xStart: number, depth: number): void {
    const width = (leafCount.get(id) || 1) * xSpacing;
    const xCenter = xStart + width / 2;
    posMap.set(id, { x: xCenter, y: depth * ySpacing });

    const kids = (children.get(id) || []).filter(k => depthMap.get(k) === depth + 1);
    let cursor = xStart;
    for (const kid of kids) {
      const kidWidth = (leafCount.get(kid) || 1) * xSpacing;
      positionSubtree(kid, cursor, depth + 1);
      cursor += kidWidth;
    }
  }

  // Position each root tree side by side
  let globalCursor = 0;
  for (const root of roots) {
    positionSubtree(root.id, globalCursor, 0);
    globalCursor += (leafCount.get(root.id) || 1) * xSpacing + xSpacing; // gap between trees
  }

  // Position orphans
  const orphans = nodes.filter(n => !posMap.has(n.id));
  orphans.forEach((n, i) => {
    posMap.set(n.id, { x: globalCursor + i * xSpacing, y: (maxDepth + 1) * ySpacing });
  });

  // Center the whole layout around origin
  const allPositions = Array.from(posMap.values());
  const xMin = Math.min(...allPositions.map(p => p.x));
  const xMax = Math.max(...allPositions.map(p => p.x));
  const yMin = Math.min(...allPositions.map(p => p.y));
  const yMax = Math.max(...allPositions.map(p => p.y));
  const xOffset = (xMin + xMax) / 2;
  const yOffset = (yMin + yMax) / 2;

  const result = nodes.map(n => {
    const pos = posMap.get(n.id) || { x: 0, y: 0 };
    return {
      ...n,
      fx: pos.x - xOffset,
      fy: pos.y - yOffset,
      fz: 0,
    };
  });

  attachNodeSize(result, relCount);
  return result;
}

/** Circular — concentric rings by level (L1 center, L2 middle, L3 outer) */
export function computeCircularLayout(nodes: LayoutNode[], links: LayoutLink[]): LayoutNode[] {
  const relCount = countRelations(nodes, links);

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
