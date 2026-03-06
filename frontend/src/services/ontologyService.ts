/**
 * Ontology Dashboard Data Service
 * Fetches chain data via shared cache (chainsService) and computes:
 * - Impact × urgency weighted RAG per node type (building color)
 * - Data flow health per connection (line color)
 * - Story-driven strip narrative per column
 * - Per-instance detail for intelligent side panel
 */

import { fetchChainCached } from './chainsService';

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

export interface UpstreamRedSource {
  id: string;
  name: string;
  nodeType: string;      // e.g. 'risks', 'capabilities'
  rag: RagStatus;
  urgency: number;
}

export interface LinkedNode {
  id: string;
  name: string;
  nodeType: string;
  rag: RagStatus;
}

export interface LinkedPlan {
  id: string;
  name: string;
  status: string;         // on-track, delayed, overdue, etc.
  isOnTrack: boolean;
}

export interface NodeInstance {
  id: string;
  name: string;
  rag: RagStatus;
  rawRag: RagStatus;      // original RAG before mitigation
  impact: number;
  urgency: number;        // 0-1 scale: 0=not urgent, 1=urgent NOW
  priority: number;       // impact × urgency
  props: Record<string, any>;
  upstreamReds: UpstreamRedSource[];  // red nodes cascading INTO this one
  upstreamNodes: LinkedNode[];        // ALL nodes that feed INTO this one (direct links)
  downstreamNodes: LinkedNode[];      // ALL nodes this one feeds INTO (direct links)
  linkedPlans: LinkedPlan[];          // mitigation/intervention plans (RiskPlan)
}

export interface LineHealthDetail {
  from: string;
  to: string;
  rag: RagStatus;
  connectivity: number;
  fromTotal: number;
  fromConnected: number;
  toTotal: number;
  toConnected: number;
  hasLinks: boolean;
}

export interface OntologyRagState {
  nodeRag: Record<string, RagStatus>;
  lineRag: Record<string, RagStatus>;
  lineWeight: Record<string, LineWeight>;
  lineDetails: Record<string, LineHealthDetail>;
  stripData: StripColumn[];
  nodeDetails: Record<string, NodeInstance[]>;
}

export interface StripColumn {
  column: string;
  total: number;
  green: number;
  amber: number;
  red: number;
  priorityReds: number;
  narrative: string;
}

// ── Mappings ──

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

const NODE_TO_COLUMN: Record<string, string> = {
  sectorObjectives: 'goals',
  policyTools: 'sector', adminRecords: 'sector', citizen: 'sector',
  govEntity: 'sector', business: 'sector',
  resources: 'sector', infrastructure: 'sector', regulatory: 'sector',
  businessUp: 'sector', businessMid: 'sector', businessDown: 'sector',
  remote: 'sector', agricultural: 'sector', urban: 'sector',
  dataTransactions: 'sector', performance: 'sector',
  risks: 'health', riskPlans: 'health',
  capabilities: 'capacity', orgUnits: 'capacity', processes: 'capacity',
  itSystems: 'capacity', vendors: 'capacity', cultureHealth: 'capacity',
  projects: 'velocity', changeAdoption: 'velocity',
};

// Connection pairs for line flow health (from 27 ALLCONN connections, deduplicated)
const CONNECTION_PAIRS: [string, string][] = [
  ['capabilities', 'orgUnits'],
  ['capabilities', 'processes'],
  ['capabilities', 'itSystems'],
  ['capabilities', 'risks'],
  ['itSystems', 'projects'],
  ['itSystems', 'vendors'],
  ['orgUnits', 'projects'],
  ['orgUnits', 'processes'],
  ['policyTools', 'capabilities'],
  ['policyTools', 'adminRecords'],
  ['policyTools', 'dataTransactions'],
  ['policyTools', 'risks'],
  ['performance', 'capabilities'],
  ['projects', 'changeAdoption'],
  ['projects', 'processes'],
  ['sectorObjectives', 'performance'],
  ['sectorObjectives', 'policyTools'],
  ['adminRecords', 'dataTransactions'],
  ['adminRecords', 'policyTools'],
  ['dataTransactions', 'performance'],
  ['riskPlans', 'risks'],
  ['risks', 'performance'],
  ['cultureHealth', 'orgUnits'],
];

// Priority rules (absolute, no normalization):
// High priority = red status + (impacts ≥1 KPI AND urgency ≥0.5) OR (urgency ≥0.7)
// Low priority = red status but low impact AND low urgency

// ── Data Fetching ──

async function fetchChain(name: string): Promise<ChainData> {
  const raw = await fetchChainCached(name, 0);
  return parseChainEnvelope(raw);
}

/** Parse chain envelope into ChainData — handles both API formats */
function parseChainEnvelope(envelope: any): ChainData {
  const rawNodes: any[] = envelope.nodes || [];
  const rawLinks: any[] = envelope.relationships || envelope.links || [];
  return {
    nodes: rawNodes.map((n: any) => {
      const { embedding, ...props } = n.properties || {};
      return {
        id: n.id || props.id || props.domain_id || '',
        labels: n.labels || [],
        properties: props,
      };
    }),
    links: rawLinks.map((r: any) => ({
      type: r.type || '',
      start: String(r.start ?? r.source ?? r.sourceId ?? ''),
      end: String(r.end ?? r.target ?? r.targetId ?? ''),
    })),
  };
}

// All data comes from chain API responses — no direct Cypher/graph-server calls

// ── Impact Scoring (upstream fan-out) ──

function computeImpactScores(chains: ChainData[]): Map<string, number> {
  const upstreamOf = new Map<string, Set<string>>();
  const nodeLabels = new Map<string, string[]>();

  for (const chain of chains) {
    for (const n of chain.nodes) {
      if (!nodeLabels.has(n.id)) nodeLabels.set(n.id, n.labels);
    }
    for (const link of chain.links) {
      if (!upstreamOf.has(link.start)) upstreamOf.set(link.start, new Set());
      upstreamOf.get(link.start)!.add(link.end);
    }
  }

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

  for (const chain of chains) {
    for (const n of chain.nodes) {
      bfsImpact(n.id);
    }
  }

  return impactCache;
}

// ── Urgency Scoring ──

/** Compute urgency 0-1: how soon does this problem need attention? */
function computeUrgency(props: Record<string, any>, labels: string[]): number {
  // OPERATE capabilities with issues → urgent NOW (it's running and broken)
  if (labels.includes('EntityCapability')) {
    if (props.status === 'active' && props.execute_status === 'issues') return 1.0;
    if (props.status === 'active' && props.execute_status === 'at-risk') return 0.7;
    // BUILD: urgency from deadline proximity
    if (props.end_date) {
      const daysLeft = (new Date(props.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysLeft <= 0) return 1.0;     // overdue
      if (daysLeft <= 90) return 0.8;    // this quarter
      if (daysLeft <= 180) return 0.4;   // next quarter
      return 0.1;                         // far future
    }
    return 0.3; // BUILD with no date → moderate default
  }

  // Risks are always assessed in present tense
  if (labels.includes('EntityRisk')) {
    const band = props.build_band || props.operate_band;
    if (band === 'Red' || band === 'red') return 0.9;
    if (band === 'Amber' || band === 'amber') return 0.5;
    return 0.2;
  }

  // Performance KPIs are measured now
  if (labels.includes('SectorPerformance')) {
    const actual = parseFloat(props.actual_value);
    const target = parseFloat(props.target);
    if (!isNaN(actual) && !isNaN(target) && target > 0) {
      const pct = actual / target;
      if (pct < 0.5) return 1.0;   // severely off
      if (pct < 0.7) return 0.8;   // significantly off
      return 0.5;                    // slightly off
    }
    return 0.3;
  }

  // Projects: urgency from deadline + progress gap
  if (labels.includes('EntityProject')) {
    if (props.status === 'complete') return 0.0; // done, no urgency
    const progress = parseFloat(props.progress_percentage);
    if (props.end_date) {
      const daysLeft = (new Date(props.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysLeft <= 0) return 1.0; // overdue
      if (daysLeft <= 90 && !isNaN(progress) && progress < 0.7) return 0.9; // due soon + behind
      if (daysLeft <= 90) return 0.7;
      if (daysLeft <= 180) return 0.4;
      return 0.2;
    }
    return 0.3;
  }

  // OrgUnit: urgency from gap
  if (labels.includes('EntityOrgUnit')) {
    const gap = props.gap;
    if (gap === 1 || gap === '1') return 0.6;  // has gap = moderate urgency
    return 0.2;
  }

  // Process: urgency from trend + actual vs target
  if (labels.includes('EntityProcess')) {
    const trend = props.trend;
    if (trend === 'declining') return 0.8;
    const actual = parseFloat(props.actual);
    const target = parseFloat(props.target);
    if (!isNaN(actual) && !isNaN(target) && target > 0 && (actual / target) < 0.7) return 0.7;
    if (trend === 'stable') return 0.4;
    return 0.2;
  }

  // ITSystem: developing = moderate, planned = low
  if (labels.includes('EntityITSystem')) {
    if (props.status === 'developing') return 0.4;
    return 0.2;
  }

  return 0.3; // default moderate urgency
}

// ── Per-Instance RAG ──

export function getNodeInstanceRag(props: Record<string, any>, labels: string[]): RagStatus {
  if (labels.includes('EntityCapability')) {
    const es = props.execute_status;
    if (es === 'issues') return 'red';
    if (es === 'at-risk') return 'amber';
    if (es === 'ontrack') return 'green';
    const bs = props.build_status;
    if (bs === 'in-progress-issues') return 'red';
    if (bs === 'in-progress-atrisk') return 'amber';
    if (bs === 'in-progress-ontrack') return 'green';
    return 'default';
  }

  if (labels.includes('EntityRisk')) {
    const band = props.build_band || props.operate_band;
    if (band === 'Red' || band === 'red') return 'red';
    if (band === 'Amber' || band === 'amber') return 'amber';
    if (band === 'Green' || band === 'green') return 'green';
    return 'default';
  }

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

  if (labels.includes('EntityProject')) {
    // status = 'complete' → green, otherwise check progress vs deadline
    if (props.status === 'complete') return 'green';
    const progress = parseFloat(props.progress_percentage);
    if (!isNaN(progress) && props.end_date) {
      // Calculate expected progress based on timeline
      const start = new Date(props.start_date || props.end_date).getTime();
      const end = new Date(props.end_date).getTime();
      const now = Date.now();
      const elapsed = Math.max(0, Math.min(1, (now - start) / (end - start || 1)));
      // Compare actual progress to expected (elapsed time fraction)
      if (elapsed > 0) {
        const ratio = progress / elapsed;
        if (ratio >= 0.9) return 'green';
        if (ratio >= 0.7) return 'amber';
        return 'red';
      }
    }
    if (!isNaN(progress)) {
      if (progress >= 0.9) return 'green';
      if (progress >= 0.5) return 'amber';
      return 'red';
    }
    return 'default';
  }

  // EntityOrgUnit: gap = 0 (no gap, green) or 1 (has gap, amber/red)
  if (labels.includes('EntityOrgUnit')) {
    const gap = props.gap;
    if (gap === 1 || gap === '1') return 'amber';  // has a gap
    if (gap === 0 || gap === '0') return 'green';   // no gap
    return 'default';
  }

  // EntityProcess: actual vs target metrics + trend
  if (labels.includes('EntityProcess')) {
    const actual = parseFloat(props.actual);
    const target = parseFloat(props.target);
    if (!isNaN(actual) && !isNaN(target) && target > 0) {
      const pct = (actual / target) * 100;
      if (pct >= 90) return 'green';
      if (pct >= 70) return 'amber';
      return 'red';
    }
    const trend = props.trend;
    if (trend === 'declining') return 'red';
    if (trend === 'stable') return 'amber';
    if (trend === 'improving') return 'green';
    return 'default';
  }

  // EntityITSystem: status = active (green), developing (amber), planned (default)
  // criticality is importance NOT health — don't use for RAG
  if (labels.includes('EntityITSystem')) {
    const status = props.status || props.operational_status;
    if (status === 'active') return 'green';
    if (status === 'developing') return 'amber';
    if (status === 'planned') return 'default';
    return 'default';
  }

  // EntityChangeAdoption: adoption_score vs resistance_score
  if (labels.includes('EntityChangeAdoption')) {
    const adoption = parseFloat(props.adoption_score);
    const resistance = parseFloat(props.resistance_score);
    if (!isNaN(adoption)) {
      if (adoption >= 0.8) return 'green';
      if (adoption >= 0.5) return 'amber';
      return 'red';
    }
    if (!isNaN(resistance)) {
      if (resistance >= 0.7) return 'red';
      if (resistance >= 0.4) return 'amber';
      return 'green';
    }
    return 'default';
  }

  // EntityCultureHealth: survey_score + trend
  if (labels.includes('EntityCultureHealth')) {
    const score = parseFloat(props.survey_score);
    const target = parseFloat(props.target);
    if (!isNaN(score) && !isNaN(target) && target > 0) {
      const pct = (score / target) * 100;
      if (pct >= 90) return 'green';
      if (pct >= 70) return 'amber';
      return 'red';
    }
    const trend = props.trend;
    if (trend === 'declining') return 'red';
    if (trend === 'stable') return 'amber';
    if (trend === 'improving') return 'green';
    return 'default';
  }

  // SectorObjective: if it exists in the chain, it's active
  if (labels.includes('SectorObjective')) {
    const status = props.status || props.achievement_status;
    if (status === 'red' || status === 'off-track') return 'red';
    if (status === 'amber' || status === 'at-risk') return 'amber';
    if (status === 'green' || status === 'on-track') return 'green';
    return 'green'; // exists in chain = active
  }

  // SectorPolicyTool: same logic
  if (labels.includes('SectorPolicyTool')) {
    const status = props.status || props.execution_status;
    if (status === 'red' || status === 'issues') return 'red';
    if (status === 'amber' || status === 'at-risk') return 'amber';
    if (status === 'green' || status === 'on-track') return 'green';
    return 'green'; // exists in chain = active
  }

  return 'default';
}

// ── Downstream Exposure (reverse cascade) ──
// For each node, find which high-priority red nodes feed INTO it
function computeDownstreamExposure(
  chains: ChainData[],
  nodesByType: Map<string, { props: Record<string, any>; labels: string[]; id: string }[]>,
  impactScores: Map<string, number>,
): Map<string, UpstreamRedSource[]> {
  // Build reverse adjacency: downstream → set of upstream nodes
  const downstreamOf = new Map<string, Set<string>>();
  for (const chain of chains) {
    for (const link of chain.links) {
      if (!downstreamOf.has(link.end)) downstreamOf.set(link.end, new Set());
      downstreamOf.get(link.end)!.add(link.start);
    }
  }

  // Build lookup for all node instances by ID
  const nodeById = new Map<string, { props: Record<string, any>; labels: string[]; id: string; nodeType: string }>();
  for (const [nodeType, instances] of nodesByType) {
    for (const inst of instances) {
      nodeById.set(inst.id, { ...inst, nodeType });
    }
  }

  // Find all high-priority red node IDs with their details
  const highPriorityRedDetails = new Map<string, UpstreamRedSource>();
  for (const [nodeType, instances] of nodesByType) {
    for (const inst of instances) {
      const rag = getNodeInstanceRag(inst.props, inst.labels);
      if (rag === 'red') {
        const impact = impactScores.get(inst.id) || 0;
        const urgency = computeUrgency(inst.props, inst.labels);
        if ((impact >= 1 && urgency >= 0.5) || urgency >= 0.7) {
          highPriorityRedDetails.set(inst.id, {
            id: inst.id,
            name: inst.props.name || inst.props.title || inst.id,
            nodeType,
            rag: 'red',
            urgency,
          });
        }
      }
    }
  }

  // For each node, BFS backwards to find which high-priority reds feed into it
  const exposure = new Map<string, UpstreamRedSource[]>();
  const allNodeIds = new Set<string>();
  for (const [, instances] of nodesByType) {
    for (const inst of instances) allNodeIds.add(inst.id);
  }

  for (const nodeId of allNodeIds) {
    const visited = new Set<string>();
    const queue = [nodeId];
    const sources: UpstreamRedSource[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const redDetail = highPriorityRedDetails.get(current);
      if (redDetail && current !== nodeId) sources.push(redDetail);
      const parents = downstreamOf.get(current);
      if (parents) {
        for (const p of parents) {
          if (!visited.has(p)) queue.push(p);
        }
      }
    }
    if (sources.length > 0) exposure.set(nodeId, sources);
  }

  return exposure;
}

// ── Building Color Aggregation (impact × urgency) ──

function aggregateNodeRag(
  nodesByType: Map<string, { props: Record<string, any>; labels: string[]; id: string }[]>,
  impactScores: Map<string, number>,
  downstreamExposure: Map<string, UpstreamRedSource[]>,
): Record<string, RagStatus> {
  const result: Record<string, RagStatus> = {};

  for (const [nodeKey, instances] of nodesByType) {
    if (instances.length === 0) {
      result[nodeKey] = 'default';
      continue;
    }

    let hasHighPriorityRed = false;
    let hasLowPriorityRed = false;
    let hasAmber = false;
    let hasGreen = false;
    let hasUpstreamExposure = false;

    for (const inst of instances) {
      const rag = getNodeInstanceRag(inst.props, inst.labels);
      if (rag === 'red') {
        const impact = impactScores.get(inst.id) || 0;
        const urgency = computeUrgency(inst.props, inst.labels);

        if (impact >= 1 && urgency >= 0.5) hasHighPriorityRed = true;
        else if (urgency >= 0.7) hasHighPriorityRed = true;
        else hasLowPriorityRed = true;
      } else if (rag === 'amber') hasAmber = true;
      else if (rag === 'green') hasGreen = true;

      // Check if this node has high-priority red nodes feeding into it
      if (downstreamExposure.has(inst.id) && downstreamExposure.get(inst.id)!.length > 0) hasUpstreamExposure = true;
    }

    if (hasHighPriorityRed) result[nodeKey] = 'red';
    else if (hasUpstreamExposure) result[nodeKey] = 'amber'; // cascade: upstream reds affect this building
    else if (hasLowPriorityRed || hasAmber) result[nodeKey] = 'amber';
    else if (hasGreen) result[nodeKey] = 'green';
    else result[nodeKey] = 'default';
  }

  // ── Bottom-up RAG chain propagation ──
  // RED propagates up, AMBER propagates up only onto GREEN, GREEN does not propagate.
  // Both build and operate chains are processed.

  const ragRank: Record<string, number> = { red: 3, amber: 2, green: 1, default: 0 };

  const propagate = (source: string, target: string) => {
    const srcStatus = result[source];
    if (!srcStatus || srcStatus === 'green' || srcStatus === 'default') return;
    const tgtStatus = result[target] || 'default';
    if (ragRank[srcStatus] > ragRank[tgtStatus]) {
      result[target] = srcStatus;
    }
  };

  // Build chain (bottom → top):
  //   projects → capabilities → risks → policyTools → sectorObjectives
  //   projects → capabilities → risks → performance → sectorObjectives
  //   changeAdoption → capabilities (then continues up via the paths above)
  const buildChainPairs: [string, string][] = [
    ['projects', 'capabilities'],
    ['changeAdoption', 'capabilities'],
    ['capabilities', 'risks'],
    ['risks', 'policyTools'],
    ['risks', 'performance'],
    ['policyTools', 'sectorObjectives'],
    ['performance', 'sectorObjectives'],
  ];

  // Operate chain (bottom → top):
  //   orgUnits → capabilities → risks → policyTools → sectorObjectives
  //   processes → capabilities → risks → performance → sectorObjectives
  //   itSystems → capabilities → risks → policyTools → sectorObjectives
  //   vendors → capabilities → risks → performance → sectorObjectives
  //   cultureHealth → capabilities (then continues up via the paths above)
  const operateChainPairs: [string, string][] = [
    ['orgUnits', 'capabilities'],
    ['processes', 'capabilities'],
    ['itSystems', 'capabilities'],
    ['vendors', 'capabilities'],
    ['cultureHealth', 'capabilities'],
    ['capabilities', 'risks'],
    ['risks', 'policyTools'],
    ['risks', 'performance'],
    ['policyTools', 'sectorObjectives'],
    ['performance', 'sectorObjectives'],
  ];

  // Collect unique pairs from both chains (order matters — bottom-up)
  const allPairs: [string, string][] = [];
  const seen = new Set<string>();
  for (const pair of [...buildChainPairs, ...operateChainPairs]) {
    const key = `${pair[0]}->${pair[1]}`;
    if (!seen.has(key)) {
      seen.add(key);
      allPairs.push(pair);
    }
  }

  // Propagate bottom-up: iterate in order so lower-level statuses flow upward
  for (const [source, target] of allPairs) {
    propagate(source, target);
  }

  return result;
}

// ── Line Flow Health (orphan node detection) ──

function computeLineFlowHealth(
  chains: ChainData[],
  nodesByType: Map<string, { props: Record<string, any>; labels: string[]; id: string }[]>,
): { lineRag: Record<string, RagStatus>; lineDetails: Record<string, LineHealthDetail> } {
  const lineRag: Record<string, RagStatus> = {};
  const lineDetails: Record<string, LineHealthDetail> = {};

  for (const [fromKey, toKey] of CONNECTION_PAIRS) {
    const fromNodes = new Set((nodesByType.get(fromKey) || []).map(n => n.id));
    const toNodes = new Set((nodesByType.get(toKey) || []).map(n => n.id));

    const key = `${fromKey}->${toKey}`;

    if (fromNodes.size === 0 && toNodes.size === 0) {
      lineRag[key] = 'default';
      lineDetails[key] = { from: fromKey, to: toKey, rag: 'default', connectivity: 0, fromTotal: 0, fromConnected: 0, toTotal: 0, toConnected: 0, hasLinks: false };
      continue;
    }

    // Count nodes connected via chain links (both directions)
    const connectedFrom = new Set<string>();
    const connectedTo = new Set<string>();
    let hasAnyLinks = false;
    for (const chain of chains) {
      for (const link of chain.links) {
        if (fromNodes.has(link.start) && toNodes.has(link.end)) {
          connectedFrom.add(link.start);
          connectedTo.add(link.end);
          hasAnyLinks = true;
        }
        if (fromNodes.has(link.end) && toNodes.has(link.start)) {
          connectedFrom.add(link.end);
          connectedTo.add(link.start);
          hasAnyLinks = true;
        }
      }
    }

    // No chain links exist between these types — treat as fully broken
    if (!hasAnyLinks) {
      lineRag[key] = 'red';
      lineDetails[key] = { from: fromKey, to: toKey, rag: 'red', connectivity: 0, fromTotal: fromNodes.size, fromConnected: 0, toTotal: toNodes.size, toConnected: 0, hasLinks: false };
      continue;
    }

    // Broken relations: % of nodes that SHOULD have a link but DON'T
    // Use the larger side as the expected total
    const totalExpected = Math.max(fromNodes.size, toNodes.size);
    const totalConnected = Math.max(connectedFrom.size, connectedTo.size);
    const brokenPct = totalExpected > 0 ? 1 - (totalConnected / totalExpected) : 0;
    const connectivity = 1 - brokenPct;

    let rag: RagStatus;
    if (brokenPct === 0) rag = 'green';        // 0% broken → all relations intact
    else if (brokenPct <= 0.15) rag = 'amber';  // ≤15% broken → partial issues
    else rag = 'red';                            // >15% broken → significant breakage

    lineRag[key] = rag;
    lineDetails[key] = { from: fromKey, to: toKey, rag, connectivity, fromTotal: fromNodes.size, fromConnected: connectedFrom.size, toTotal: toNodes.size, toConnected: connectedTo.size, hasLinks: true };
  }

  return { lineRag, lineDetails };
}

// ── Strip Narrative ──

const COLUMN_NARRATIVES: Record<string, { good: string; bad: (n: number) => string }> = {
  goals:    { good: 'Priorities on track',        bad: n => `${n} objectives at risk` },
  sector:   { good: 'Sector delivery healthy',    bad: n => `${n} KPIs need attention` },
  health:   { good: 'Risk exposure managed',      bad: n => `${n} high-impact risks` },
  capacity: { good: 'Enterprise capacity stable',  bad: n => `${n} critical capabilities` },
  velocity: { good: 'Transformation on pace',      bad: n => `${n} blocked projects` },
};

const COLUMN_NARRATIVES_AR: Record<string, { good: string; bad: (n: number) => string }> = {
  goals:    { good: 'الأولويات في المسار',          bad: n => `${n} أهداف في خطر` },
  sector:   { good: 'التنفيذ القطاعي سليم',        bad: n => `${n} مؤشرات تحتاج متابعة` },
  health:   { good: 'المخاطر تحت السيطرة',          bad: n => `${n} مخاطر عالية الأثر` },
  capacity: { good: 'القدرات المؤسسية مستقرة',      bad: n => `${n} قدرات حرجة` },
  velocity: { good: 'التحول في وتيرة جيدة',         bad: n => `${n} مشاريع معطلة` },
};

// ── Helpers ──

function extractLogicalId(chainId: string): string {
  const parts = chainId.split(':');
  if (parts.length >= 3 && /^\d{4}$/.test(parts[parts.length - 1])) {
    return parts.slice(1, -1).join(':');
  }
  return chainId;
}

// ── RiskPlan Helpers ──

function buildLinkedPlan(rp: { props: Record<string, any>; id: string }): LinkedPlan {
  const status = rp.props.status || rp.props.plan_status || 'unknown';
  const progress = parseFloat(rp.props.progress_percentage);
  const endDate = rp.props.end_date ? new Date(rp.props.end_date) : null;
  const isOverdue = endDate ? endDate.getTime() < Date.now() : false;

  // On-track = status is active/in-progress AND not overdue AND progress isn't stalled
  const activeStatuses = ['active', 'in-progress', 'on-track', 'approved', 'in_progress'];
  const isActive = activeStatuses.includes(status.toLowerCase().replace(/[\s_-]+/g, '-'));
  const isOnTrack = isActive && !isOverdue && (!isNaN(progress) ? progress > 0.2 : true);

  return {
    id: rp.id,
    name: rp.props.name || rp.props.title || rp.id,
    status: isOverdue ? 'overdue' : status,
    isOnTrack,
  };
}

// ── Main Entry ──

export type LoadingStep = { label: string; status: 'loading' | 'done' | 'error'; count?: number };

export async function fetchOntologyRagState(
  onProgress?: (steps: LoadingStep[]) => void,
): Promise<OntologyRagState> {
  const year = new Date().getFullYear();

  // Track loading steps for real-time UI feedback
  const steps: LoadingStep[] = [
    { label: 'Projects & Change Adoption', status: 'loading' },
    { label: 'Policy & Risk Chains', status: 'loading' },
    { label: 'Performance Chains', status: 'loading' },
    { label: 'Sector Value Chain', status: 'loading' },
  ];
  const emit = () => onProgress?.([...steps]);
  emit();

  const tracked = async <T>(index: number, fn: () => Promise<T>): Promise<T> => {
    try {
      const result = await fn();
      const r = result as any;
      const count = r?.nodes?.length ?? (Array.isArray(r) ? r.length : undefined);
      steps[index] = { ...steps[index], status: 'done', count: count ?? 0 };
      emit();
      return result;
    } catch (err: any) {
      console.warn(`[OntologyService] Step ${steps[index].label} failed:`, err.message);
      steps[index] = { ...steps[index], status: 'error', count: undefined };
      emit();
      throw err;
    }
  };

  const safeChain = (name: string, idx: number) =>
    tracked(idx, () => fetchChain(name)).catch(() => ({ nodes: [] as ChainNode[], links: [] as ChainLink[] }));

  // Parallel chain fetches — all 4 fire at once
  const [changeToCap, capToPolicy, capToPerf, sectorChain] = await Promise.all([
    safeChain('change_to_capability', 0),
    safeChain('capability_to_policy', 1),
    safeChain('capability_to_performance', 2),
    safeChain('sector_value_chain', 3),
  ]);

  const chains = [changeToCap, capToPolicy, capToPerf, sectorChain];
  const totalNodes = chains.reduce((s, c) => s + c.nodes.length, 0);
  console.log('[OntologyService] All fetches complete. Total nodes:', totalNodes, 'per chain:', chains.map(c => c.nodes.length));

  // Diagnostic: log what node types each chain returned
  for (const [i, chain] of chains.entries()) {
    const labelCounts: Record<string, number> = {};
    for (const n of chain.nodes) {
      const lbl = n.labels[0] || 'unknown';
      labelCounts[lbl] = (labelCounts[lbl] || 0) + 1;
    }
    const names = ['change_to_capability', 'capability_to_policy', 'capability_to_performance', 'sector_value_chain'];
    console.log(`[OntologyService] ${names[i]}: ${chain.nodes.length} nodes, ${chain.links.length} links`, labelCounts);
  }

  // 1. Impact scores (upstream fan-out)
  const impactScores = computeImpactScores(chains);

  // Find max impact for normalization
  let maxImpact = 0;
  for (const score of impactScores.values()) {
    if (score > maxImpact) maxImpact = score;
  }

  // 2. Group nodes by type — DEDUPLICATE by ID, FILTER to current year
  const nodesByType = new Map<string, { props: Record<string, any>; labels: string[]; id: string }[]>();
  const seenIds = new Set<string>();

  for (const chain of chains) {
    for (const n of chain.nodes) {
      if (seenIds.has(n.id)) continue;
      seenIds.add(n.id);

      // Filter to current year (nodes have year as integer property)
      const nodeYear = typeof n.properties.year === 'object' ? n.properties.year?.low : n.properties.year;
      if (nodeYear && nodeYear !== year) continue;

      const label = n.labels.find(l => LABEL_TO_NODE_KEY[l]);
      if (!label) continue;
      const key = LABEL_TO_NODE_KEY[label];
      if (!nodesByType.has(key)) nodesByType.set(key, []);

      const enriched = { ...n.properties };
      nodesByType.get(key)!.push({ props: enriched, labels: n.labels, id: n.id });
    }
  }

  // 3. Downstream exposure: which nodes have upstream reds cascading into them
  const downstreamExposure = computeDownstreamExposure(chains, nodesByType, impactScores);

  // 4. Building color: own RAG + upstream cascade
  const nodeRag = aggregateNodeRag(nodesByType, impactScores, downstreamExposure);

  // 4. Line color: data flow health (orphan detection)
  const { lineRag, lineDetails } = computeLineFlowHealth(chains, nodesByType);

  // 5. Line weight (placeholder — could be based on relationship count)
  const lineWeight: Record<string, LineWeight> = {};

  // 6. Build BOTH adjacency directions: downstream (I affect) + upstream (affects me)
  // Some relationship types have Neo4j direction OPPOSITE to business causality.
  // E.g., Cap -[:AUTOMATION_GAPS]-> ITSystem means "Cap depends on IT" — IT is upstream.
  const FLIPPED_RELS = new Set([
    'AUTOMATION_GAPS',   // Cap→IT but IT enables Cap
    'ROLE_GAPS',         // Cap→OrgUnit but OrgUnit enables Cap
    'KNOWLEDGE_GAPS',    // Cap→Process but Process enables Cap
    'MONITORED_BY',      // Cap→Risk but Risk monitors Cap
    'GAPS_SCOPE',        // Entity→Project but Project builds Entity
  ]);

  const directDownstream = new Map<string, Set<string>>();
  const directUpstream = new Map<string, Set<string>>();
  for (const chain of chains) {
    for (const link of chain.links) {
      const flipped = FLIPPED_RELS.has(link.type);
      const businessFrom = flipped ? link.end : link.start;  // provider/enabler
      const businessTo = flipped ? link.start : link.end;     // dependent/consumer

      if (!directDownstream.has(businessFrom)) directDownstream.set(businessFrom, new Set());
      directDownstream.get(businessFrom)!.add(businessTo);
      if (!directUpstream.has(businessTo)) directUpstream.set(businessTo, new Set());
      directUpstream.get(businessTo)!.add(businessFrom);
    }
  }

  // 6b. Build risk → RiskPlan map (plans that mitigate risks)
  // RiskPlan nodes link TO Risk nodes via chain links
  const riskToPlans = new Map<string, LinkedPlan[]>();
  const riskPlanInstances = nodesByType.get('riskPlans') || [];
  const riskPlanById = new Map<string, { props: Record<string, any>; labels: string[]; id: string }>();
  for (const rp of riskPlanInstances) riskPlanById.set(rp.id, rp);

  // Scan all chain links: if a RiskPlan links to a Risk, record it
  for (const chain of chains) {
    for (const link of chain.links) {
      // Check both directions: riskPlan→risk or risk→riskPlan
      const rpStart = riskPlanById.get(link.start);
      const rpEnd = riskPlanById.get(link.end);
      const riskInstances = nodesByType.get('risks') || [];
      const riskIds = new Set(riskInstances.map(r => r.id));

      if (rpStart && riskIds.has(link.end)) {
        // RiskPlan → Risk
        const plan = buildLinkedPlan(rpStart);
        if (!riskToPlans.has(link.end)) riskToPlans.set(link.end, []);
        riskToPlans.get(link.end)!.push(plan);
      } else if (rpEnd && riskIds.has(link.start)) {
        // Risk → RiskPlan
        const plan = buildLinkedPlan(rpEnd);
        if (!riskToPlans.has(link.start)) riskToPlans.set(link.start, []);
        riskToPlans.get(link.start)!.push(plan);
      }
    }
  }

  // Lookup: nodeId → { name, nodeType, rag }
  const nodeInfoById = new Map<string, { name: string; nodeType: string; rag: RagStatus }>();
  for (const [nodeType, instances] of nodesByType) {
    for (const inst of instances) {
      nodeInfoById.set(inst.id, {
        name: inst.props.name || inst.props.title || extractLogicalId(inst.id),
        nodeType,
        rag: getNodeInstanceRag(inst.props, inst.labels),
      });
    }
  }

  // 7. Per-node instance details for side panel
  const nodeDetails: Record<string, NodeInstance[]> = {};
  for (const [nodeKey, instances] of nodesByType) {
    nodeDetails[nodeKey] = instances.map(inst => {
      const rawRag = getNodeInstanceRag(inst.props, inst.labels);
      const impact = impactScores.get(inst.id) || 0;
      const urgency = computeUrgency(inst.props, inst.labels);

      // Sort linked nodes: reds first, then ambers, then greens/default
      const ragOrder = (r: RagStatus) => r === 'red' ? 0 : r === 'amber' ? 1 : 2;
      const sortLinked = (a: LinkedNode, b: LinkedNode) => ragOrder(a.rag) - ragOrder(b.rag);

      // Direct downstream linked nodes (I affect these)
      const targets = directDownstream.get(inst.id);
      const downstreamNodes: LinkedNode[] = [];
      if (targets) {
        for (const targetId of targets) {
          const info = nodeInfoById.get(targetId);
          if (info) downstreamNodes.push({ id: targetId, ...info });
        }
      }
      downstreamNodes.sort(sortLinked);

      // Direct upstream linked nodes (these affect me)
      const sources = directUpstream.get(inst.id);
      const upstreamNodes: LinkedNode[] = [];
      if (sources) {
        for (const srcId of sources) {
          const info = nodeInfoById.get(srcId);
          if (info) upstreamNodes.push({ id: srcId, ...info });
        }
      }
      upstreamNodes.sort(sortLinked);

      // Linked mitigation plans (only for risks)
      const linkedPlans = riskToPlans.get(inst.id) || [];

      // Mitigate: red risk with an on-track plan downgrades to amber
      let rag = rawRag;
      if (rag === 'red' && linkedPlans.length > 0 && linkedPlans.some(p => p.isOnTrack)) {
        rag = 'amber';
      }

      return {
        id: inst.id,
        name: inst.props.name || inst.props.title || extractLogicalId(inst.id),
        rag,
        rawRag,
        impact,
        urgency,
        priority: (impact >= 1 && urgency >= 0.5) || urgency >= 0.7 ? 1.0 : urgency * 0.5,
        props: inst.props,
        upstreamReds: downstreamExposure.get(inst.id) || [],
        upstreamNodes,
        downstreamNodes,
        linkedPlans,
      };
    });
  }

  // 7. Strip data with narrative
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
        if (rag === 'green') green++;
        else if (rag === 'amber') amber++;
        else if (rag === 'red') {
          red++;
          const impact = impactScores.get(inst.id) || 0;
          const urgency = computeUrgency(inst.props, inst.labels);
          if ((impact >= 1 && urgency >= 0.5) || urgency >= 0.7) priorityReds++;
        }
      }
    }

    const narr = COLUMN_NARRATIVES[col] || COLUMN_NARRATIVES.goals;
    const narrative = priorityReds > 0 ? narr.bad(priorityReds) : narr.good;

    return { column: col, total, green, amber, red, priorityReds, narrative };
  });

  // Diagnostic: final building colors and instance counts
  const typeCounts: Record<string, number> = {};
  for (const [k, v] of nodesByType) typeCounts[k] = v.length;
  console.log('[OntologyService] nodesByType counts:', typeCounts);
  console.log('[OntologyService] nodeRag (building colors):', nodeRag);
  console.log('[OntologyService] lineRag sample:', Object.entries(lineRag).slice(0, 5));

  return { nodeRag, lineRag, lineWeight, lineDetails, stripData, nodeDetails };
}

export { COLUMN_NARRATIVES_AR };
