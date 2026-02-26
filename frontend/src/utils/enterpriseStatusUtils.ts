import type { L1Capability, L2Capability, L3Capability } from '../data/capabilityData';

// Status aggregation: Calculate parent status from children
// Priority: issues > at-risk > ontrack > planned > not-due
export function aggregateStatus(
  children: L3Capability[],
  isL3Dimmed: (l3: L3Capability) => boolean
): { mode: 'build' | 'execute'; status: string } {
  const activeChildren = children.filter(l3 => !isL3Dimmed(l3));
  
  if (activeChildren.length === 0) {
    // If all children are filtered out, use first child's mode
    return { mode: children[0]?.mode || 'execute', status: 'not-due' };
  }

  // Count statuses
  let issuesCount = 0;
  let atRiskCount = 0;
  let ontrackCount = 0;
  let plannedCount = 0;
  let notDueCount = 0;
  let buildModeCount = 0;
  let executeModeCount = 0;

  activeChildren.forEach(l3 => {
    if (l3.mode === 'build') {
      buildModeCount++;
      if (l3.build_status === 'in-progress-issues') issuesCount++;
      else if (l3.build_status === 'in-progress-atrisk') atRiskCount++;
      else if (l3.build_status === 'in-progress-ontrack') ontrackCount++;
      else if (l3.build_status === 'planned') plannedCount++;
      else if (l3.build_status === 'not-due') notDueCount++;
    } else {
      executeModeCount++;
      if (l3.execute_status === 'issues') issuesCount++;
      else if (l3.execute_status === 'at-risk') atRiskCount++;
      else if (l3.execute_status === 'ontrack') ontrackCount++;
    }
  });

  // Determine mode: if ANY child is operational, parent is operational
  const mode: 'build' | 'execute' = executeModeCount > 0 ? 'execute' : 'build';

  // Worst-case rollup: any single bad child escalates the parent
  if (issuesCount > 0) {
    return { mode, status: 'issues' };
  } else if (atRiskCount > 0) {
    return { mode, status: 'at-risk' };
  } else if (ontrackCount > 0) {
    return { mode, status: 'ontrack' };
  } else if (plannedCount > 0) {
    return { mode, status: 'planned' };
  } else {
    return { mode, status: 'not-due' };
  }
}

// Get status color for L3
// BUILD: color from build_status (ETL-written on capability node)
// OPERATE: color from execute_status (ETL-written on capability node)
export function getL3StatusColor(l3: L3Capability): string {
  if (l3.mode === 'build') {
    switch (l3.build_status) {
      case 'in-progress-issues': return '#ef4444';
      case 'in-progress-atrisk': return '#f59e0b';
      case 'in-progress-ontrack': return '#10b981';
      default: return '#475569'; // not-due, planned
    }
  }
  // OPERATE
  switch (l3.execute_status) {
    case 'issues': return '#ef4444';
    case 'at-risk': return '#f59e0b';
    case 'ontrack': return '#10b981';
    default: return '#475569'; // not-due
  }
}

// Get status color for L2 (aggregated from L3)
export function getL2StatusColor(
  l2: L2Capability,
  isL3Dimmed: (l3: L3Capability) => boolean
): string {
  const aggregated = aggregateStatus(l2.l3, isL3Dimmed);
  
  if (aggregated.status === 'not-due') return '#475569';
  else if (aggregated.status === 'planned') return '#475569';
  else if (aggregated.status === 'ontrack') return '#10b981';
  else if (aggregated.status === 'at-risk') return '#f59e0b';
  else if (aggregated.status === 'issues') return '#ef4444';

  return '#475569';
}

// Get status color for L1 (aggregated from L2)
export function getL1StatusColor(
  l1: L1Capability,
  isL3Dimmed: (l3: L3Capability) => boolean
): string {
  // Aggregate all L3s under this L1
  const allL3s: L3Capability[] = [];
  l1.l2.forEach(l2 => {
    allL3s.push(...l2.l3);
  });
  
  const aggregated = aggregateStatus(allL3s, isL3Dimmed);
  
  if (aggregated.status === 'not-due') return '#475569';
  else if (aggregated.status === 'planned') return '#475569';
  else if (aggregated.status === 'ontrack') return '#10b981';
  else if (aggregated.status === 'at-risk') return '#f59e0b';
  else if (aggregated.status === 'issues') return '#ef4444';

  return '#475569';
}

// Get status label
export function getStatusLabel(l3: L3Capability): string {
  if (l3.mode === 'build') {
    switch (l3.build_status) {
      case 'not-due': return 'not due';
      case 'planned': return 'planned';
      case 'in-progress-ontrack': return 'ontrack';
      case 'in-progress-atrisk': return 'at risk';
      case 'in-progress-issues': return 'issues';
      default: return l3.status || 'pending';
    }
  } else {
    switch (l3.execute_status) {
      case 'ontrack': return 'ontrack';
      case 'at-risk': return 'at risk';
      case 'issues': return 'issues';
      default: return l3.status || 'active';
    }
  }
}
