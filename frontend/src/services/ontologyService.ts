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
  level: string;          // "L1" | "L2" | "L3"
  rag: RagStatus;
  rawRag: RagStatus;      // original RAG before mitigation
  impact: number;         // dependencyCount: Performance/PolicyTool links at L2 via Risk
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
  linkCount: number;
  orphanCount: number;
  bastardCount: number;
  hasLinks: boolean;
  disconnectedFrom: { id: string; name: string }[];
  disconnectedTo: { id: string; name: string }[];
}

export interface RiskStats {
  buildRed: number; buildAmber: number; buildGreen: number;
  operateRed: number; operateAmber: number; operateGreen: number;
  total: number;
}

export interface OntologyRagState {
  nodeRag: Record<string, RagStatus>;
  lineRag: Record<string, RagStatus>;
  lineWeight: Record<string, LineWeight>;
  lineDetails: Record<string, LineHealthDetail>;
  stripData: StripColumn[];
  nodeDetails: Record<string, NodeInstance[]>;
  riskStats: RiskStats;
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
  RiskPlan: 'riskPlans',
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

type VisualLegStep = {
  relationTypes: string[];
  fromTypes: string[];
  toTypes: string[];
  fromLevels?: string[];
  toLevels?: string[];
};

type VisualLegPattern = {
  startSide: 'from' | 'to';
  steps: VisualLegStep[];
};

type VisualLegSpec = {
  from: string;
  to: string;
  fromLevels?: string[];
  toLevels?: string[];
  patterns: VisualLegPattern[];
  buildModeOnly?: 'from' | 'to';  // restrict this side to nodes in CLOSE_GAPS/GAPS_SCOPE rels
};

const SECTOR_STAKEHOLDER_KEYS = ['businessUp', 'citizen', 'govEntity'];

// CONNECTION_PAIRS: All valid ontology-based connections with their canonical levels
// Generated from 7 canonical chains in clean ontology (2026-03-07)
// Format: 'from->to' => { fromLevels: [L1|L2|L3], toLevels: [L1|L2|L3], fromLabel, toLabel, direction }
const CONNECTION_PAIRS: Record<string, { fromLevels: string[]; toLevels: string[]; direction: string }> = {
  // L3 Entity-Entity pairs (change_to_capability, sustainable_operations chains)
  'capabilities->orgUnits': { fromLevels: ['L3'], toLevels: ['L3'], direction: 'ROLE_GAPS←OPERATES' },
  'capabilities->processes': { fromLevels: ['L3'], toLevels: ['L3'], direction: 'KNOWLEDGE_GAPS←OPERATES' },
  'capabilities->itSystems': { fromLevels: ['L3'], toLevels: ['L3'], direction: 'AUTOMATION_GAPS←OPERATES' },
  'capabilities->risks': { fromLevels: ['L3'], toLevels: ['L3'], direction: 'MONITORED_BY' },
  'orgUnits->projects': { fromLevels: ['L3'], toLevels: ['L3'], direction: 'GAPS_SCOPE←CLOSE_GAPS' },
  'orgUnits->processes': { fromLevels: ['L3'], toLevels: ['L3'], direction: 'APPLY' },
  'processes->itSystems': { fromLevels: ['L3'], toLevels: ['L3'], direction: 'AUTOMATION' },
  'itSystems->projects': { fromLevels: ['L3'], toLevels: ['L3'], direction: 'GAPS_SCOPE←CLOSE_GAPS' },
  'itSystems->vendors': { fromLevels: ['L3'], toLevels: ['L3'], direction: 'DEPENDS_ON' },
  'projects->changeAdoption': { fromLevels: ['L3'], toLevels: ['L3'], direction: 'ADOPTION_RISKS←INCREASE_ADOPTION' },
  'projects->processes': { fromLevels: ['L3'], toLevels: ['L3'], direction: 'CLOSE_GAPS←GAPS_SCOPE' },
  'cultureHealth->orgUnits': { fromLevels: ['L3'], toLevels: ['L3'], direction: 'MONITORS_FOR' },
  'risks->riskPlans': { fromLevels: ['L3'], toLevels: ['L3'], direction: 'HAS_PLAN' },

  // L2 Bridge pairs (capability_to_policy, capability_to_performance)
  'risks->policyTools': { fromLevels: ['L2'], toLevels: ['L2'], direction: 'INFORMS' },
  'risks->performance': { fromLevels: ['L2'], toLevels: ['L2'], direction: 'INFORMS' },
  'policyTools->capabilities': { fromLevels: ['L2'], toLevels: ['L2'], direction: 'SETS_PRIORITIES' },
  'performance->capabilities': { fromLevels: ['L2'], toLevels: ['L2'], direction: 'SETS_TARGETS' },

  // L1 Sector pairs (sector_value_chain + chain junctions)
  'sectorObjectives->policyTools': { fromLevels: ['L1'], toLevels: ['L1'], direction: 'REALIZED_VIA←GOVERNED_BY' },
  'sectorObjectives->performance': { fromLevels: ['L1'], toLevels: ['L1'], direction: 'CASCADED_VIA←AGGREGATES_TO' },
  'policyTools->adminRecords': { fromLevels: ['L1'], toLevels: ['L1'], direction: 'REFERS_TO' },
  'adminRecords->dataTransactions': { fromLevels: ['L1'], toLevels: ['L1'], direction: 'APPLIED_ON→stakeholder→TRIGGERS_EVENT' },
  'dataTransactions->performance': { fromLevels: ['L1'], toLevels: ['L1'], direction: 'MEASURED_BY' },
  'policyTools->dataTransactions': { fromLevels: ['L1'], toLevels: ['L1'], direction: 'REFERS_TO→adminRecords→stakeholder→TRIGGERS_EVENT' },
};

// CONNECTION_LEVELS: Quick lookup for per-pair level info
const CONNECTION_LEVELS = Object.entries(CONNECTION_PAIRS).reduce((acc, [key, value]) => {
  acc[key] = { fromLevels: value.fromLevels, toLevels: value.toLevels };
  return acc;
}, {} as Record<string, { fromLevels: string[]; toLevels: string[] }>);

// Canonical ontology-imposed legs for the visual dashboard.
// REBUILT 2026-03-07: Pairs extracted STRICTLY from 7 canonical chains.
// Every relation type and direction comes from chain definitions ONLY.
// All 23 ontology relationship types mapped to visual legs with correct levels and directions.
const VISUAL_LEG_SPECS: VisualLegSpec[] = [
  // ────────────────────────────────────────────────────────────────────
  // L1 SECTOR PAIRS (sector_value_chain)
  // ────────────────────────────────────────────────────────────────────
  {
    from: 'sectorObjectives',
    to: 'policyTools',
    fromLevels: ['L1'],
    toLevels: ['L1'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['REALIZED_VIA'], fromTypes: ['sectorObjectives'], toTypes: ['policyTools'], fromLevels: ['L1'], toLevels: ['L1'] }] },
      { startSide: 'to', steps: [{ relationTypes: ['GOVERNED_BY'], fromTypes: ['policyTools'], toTypes: ['sectorObjectives'], fromLevels: ['L1'], toLevels: ['L1'] }] },
    ],
  },
  {
    from: 'policyTools',
    to: 'adminRecords',
    fromLevels: ['L1'],
    toLevels: ['L1'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['REFERS_TO'], fromTypes: ['policyTools'], toTypes: ['adminRecords'], fromLevels: ['L1'], toLevels: ['L1'] }] },
    ],
  },
  {
    from: 'adminRecords',
    to: 'dataTransactions',
    fromLevels: ['L1'],
    toLevels: ['L1'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['APPLIED_ON'], fromTypes: ['adminRecords'], toTypes: ['businessUp', 'citizen', 'govEntity'], fromLevels: ['L1'], toLevels: ['L1'] }, { relationTypes: ['TRIGGERS_EVENT'], fromTypes: ['businessUp', 'citizen', 'govEntity'], toTypes: ['dataTransactions'], fromLevels: ['L1'], toLevels: ['L1'] }] },
    ],
  },
  {
    from: 'adminRecords',
    to: 'businessUp',
    fromLevels: ['L1'],
    toLevels: ['L1'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['APPLIED_ON'], fromTypes: ['adminRecords'], toTypes: ['businessUp'], fromLevels: ['L1'], toLevels: ['L1'] }] },
    ],
  },
  {
    from: 'adminRecords',
    to: 'citizen',
    fromLevels: ['L1'],
    toLevels: ['L1'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['APPLIED_ON'], fromTypes: ['adminRecords'], toTypes: ['citizen'], fromLevels: ['L1'], toLevels: ['L1'] }] },
    ],
  },
  {
    from: 'adminRecords',
    to: 'govEntity',
    fromLevels: ['L1'],
    toLevels: ['L1'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['APPLIED_ON'], fromTypes: ['adminRecords'], toTypes: ['govEntity'], fromLevels: ['L1'], toLevels: ['L1'] }] },
    ],
  },
  {
    from: 'businessUp',
    to: 'dataTransactions',
    fromLevels: ['L1'],
    toLevels: ['L1'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['TRIGGERS_EVENT'], fromTypes: ['businessUp'], toTypes: ['dataTransactions'], fromLevels: ['L1'], toLevels: ['L1'] }] },
    ],
  },
  {
    from: 'citizen',
    to: 'dataTransactions',
    fromLevels: ['L1'],
    toLevels: ['L1'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['TRIGGERS_EVENT'], fromTypes: ['citizen'], toTypes: ['dataTransactions'], fromLevels: ['L1'], toLevels: ['L1'] }] },
    ],
  },
  {
    from: 'govEntity',
    to: 'dataTransactions',
    fromLevels: ['L1'],
    toLevels: ['L1'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['TRIGGERS_EVENT'], fromTypes: ['govEntity'], toTypes: ['dataTransactions'], fromLevels: ['L1'], toLevels: ['L1'] }] },
    ],
  },
  {
    from: 'dataTransactions',
    to: 'performance',
    fromLevels: ['L1'],
    toLevels: ['L1'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['MEASURED_BY'], fromTypes: ['dataTransactions'], toTypes: ['performance'], fromLevels: ['L1'], toLevels: ['L1'] }] },
    ],
  },
  {
    from: 'sectorObjectives',
    to: 'performance',
    fromLevels: ['L1'],
    toLevels: ['L1'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['CASCADED_VIA'], fromTypes: ['sectorObjectives'], toTypes: ['performance'], fromLevels: ['L1'], toLevels: ['L1'] }] },
      { startSide: 'to', steps: [{ relationTypes: ['AGGREGATES_TO'], fromTypes: ['performance'], toTypes: ['sectorObjectives'], fromLevels: ['L1'], toLevels: ['L1'] }] },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // L2 BRIDGE PAIRS (setting_strategic_initiatives, capability_to_policy, capability_to_performance)
  // ────────────────────────────────────────────────────────────────────
  {
    from: 'risks',
    to: 'policyTools',
    fromLevels: ['L2'],
    toLevels: ['L2'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['INFORMS'], fromTypes: ['risks'], toTypes: ['policyTools'], fromLevels: ['L2'], toLevels: ['L2'] }] },
    ],
  },
  {
    from: 'risks',
    to: 'performance',
    fromLevels: ['L2'],
    toLevels: ['L2'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['INFORMS'], fromTypes: ['risks'], toTypes: ['performance'], fromLevels: ['L2'], toLevels: ['L2'] }] },
    ],
  },
  {
    from: 'policyTools',
    to: 'capabilities',
    fromLevels: ['L2'],
    toLevels: ['L2'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['SETS_PRIORITIES'], fromTypes: ['policyTools'], toTypes: ['capabilities'], fromLevels: ['L2'], toLevels: ['L2'] }] },
    ],
  },
  {
    from: 'performance',
    to: 'capabilities',
    fromLevels: ['L2'],
    toLevels: ['L2'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['SETS_TARGETS'], fromTypes: ['performance'], toTypes: ['capabilities'], fromLevels: ['L2'], toLevels: ['L2'] }] },
    ],
  },
  // ────────────────────────────────────────────────────────────────────
  // L3 ENTITY PAIRS (change_to_capability, sustainable_operations)
  // ────────────────────────────────────────────────────────────────────
  {
    from: 'capabilities',
    to: 'orgUnits',
    fromLevels: ['L3'],
    toLevels: ['L3'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['ROLE_GAPS'], fromTypes: ['capabilities'], toTypes: ['orgUnits'], fromLevels: ['L3'], toLevels: ['L3'] }] },
      { startSide: 'to', steps: [{ relationTypes: ['OPERATES'], fromTypes: ['orgUnits'], toTypes: ['capabilities'], fromLevels: ['L3'], toLevels: ['L3'] }] },
    ],
  },
  {
    from: 'capabilities',
    to: 'processes',
    fromLevels: ['L3'],
    toLevels: ['L3'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['KNOWLEDGE_GAPS'], fromTypes: ['capabilities'], toTypes: ['processes'], fromLevels: ['L3'], toLevels: ['L3'] }] },
    ],
  },
  {
    from: 'capabilities',
    to: 'itSystems',
    fromLevels: ['L3'],
    toLevels: ['L3'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['AUTOMATION_GAPS'], fromTypes: ['capabilities'], toTypes: ['itSystems'], fromLevels: ['L3'], toLevels: ['L3'] }] },
    ],
  },
  {
    from: 'capabilities',
    to: 'risks',
    fromLevels: ['L3'],
    toLevels: ['L3'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['MONITORED_BY'], fromTypes: ['capabilities'], toTypes: ['risks'], fromLevels: ['L3'], toLevels: ['L3'] }] },
    ],
  },
  {
    from: 'orgUnits',
    to: 'processes',
    fromLevels: ['L3'],
    toLevels: ['L3'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['APPLY'], fromTypes: ['orgUnits'], toTypes: ['processes'], fromLevels: ['L3'], toLevels: ['L3'] }] },
    ],
  },
  {
    from: 'processes',
    to: 'itSystems',
    fromLevels: ['L3'],
    toLevels: ['L3'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['AUTOMATION'], fromTypes: ['processes'], toTypes: ['itSystems'], fromLevels: ['L3'], toLevels: ['L3'] }] },
    ],
  },
  {
    from: 'itSystems',
    to: 'vendors',
    fromLevels: ['L3'],
    toLevels: ['L3'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['DEPENDS_ON'], fromTypes: ['itSystems'], toTypes: ['vendors'], fromLevels: ['L3'], toLevels: ['L3'] }] },
    ],
  },
  {
    from: 'cultureHealth',
    to: 'orgUnits',
    fromLevels: ['L3'],
    toLevels: ['L3'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['MONITORS_FOR'], fromTypes: ['cultureHealth'], toTypes: ['orgUnits'], fromLevels: ['L3'], toLevels: ['L3'] }] },
    ],
  },
  {
    from: 'orgUnits',
    to: 'projects',
    fromLevels: ['L3'],
    toLevels: ['L3'],
    buildModeOnly: 'from',
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['GAPS_SCOPE'], fromTypes: ['orgUnits'], toTypes: ['projects'], fromLevels: ['L3'], toLevels: ['L3'] }] },
      { startSide: 'to', steps: [{ relationTypes: ['CLOSE_GAPS'], fromTypes: ['projects'], toTypes: ['orgUnits'], fromLevels: ['L3'], toLevels: ['L3'] }] },
    ],
  },
  {
    from: 'processes',
    to: 'projects',
    fromLevels: ['L3'],
    toLevels: ['L3'],
    buildModeOnly: 'from',
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['GAPS_SCOPE'], fromTypes: ['processes'], toTypes: ['projects'], fromLevels: ['L3'], toLevels: ['L3'] }] },
      { startSide: 'to', steps: [{ relationTypes: ['CLOSE_GAPS'], fromTypes: ['projects'], toTypes: ['processes'], fromLevels: ['L3'], toLevels: ['L3'] }] },
    ],
  },
  {
    from: 'itSystems',
    to: 'projects',
    fromLevels: ['L3'],
    toLevels: ['L3'],
    buildModeOnly: 'from',
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['GAPS_SCOPE'], fromTypes: ['itSystems'], toTypes: ['projects'], fromLevels: ['L3'], toLevels: ['L3'] }] },
      { startSide: 'to', steps: [{ relationTypes: ['CLOSE_GAPS'], fromTypes: ['projects'], toTypes: ['itSystems'], fromLevels: ['L3'], toLevels: ['L3'] }] },
    ],
  },
  {
    from: 'projects',
    to: 'changeAdoption',
    fromLevels: ['L3'],
    toLevels: ['L3'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['ADOPTION_RISKS'], fromTypes: ['projects'], toTypes: ['changeAdoption'], fromLevels: ['L3'], toLevels: ['L3'] }] },
      { startSide: 'to', steps: [{ relationTypes: ['INCREASE_ADOPTION'], fromTypes: ['changeAdoption'], toTypes: ['projects'], fromLevels: ['L3'], toLevels: ['L3'] }] },
    ],
  },
  {
    from: 'risks',
    to: 'riskPlans',
    fromLevels: ['L3'],
    toLevels: ['L3'],
    patterns: [
      { startSide: 'from', steps: [{ relationTypes: ['HAS_PLAN'], fromTypes: ['risks'], toTypes: ['riskPlans'], fromLevels: ['L3'], toLevels: ['L3'] }] },
    ],
  },
];

// Priority rules (absolute, no normalization):
// High priority = red status + (impacts ≥1 KPI AND urgency ≥0.5) OR (urgency ≥0.7)
// Low priority = red status but low impact AND low urgency

// ── Data Fetching ──

async function fetchChain(name: string, year: number, quarter?: string | null): Promise<ChainData> {
  const raw = await fetchChainCached(name, year, quarter);
  return parseChainEnvelope(raw);
}

/** Parse chain envelope into ChainData — handles both API formats */
function parseChainEnvelope(envelope: any): ChainData {
  const rawNodes: any[] = envelope.nodes || [];
  const rawLinks: any[] = envelope.relationships || envelope.links || [];

  const nodes = rawNodes.map((n: any) => {
    const { embedding, ...props } = n.properties || {};
    return {
      id: String(n.id ?? ''),
      labels: n.labels || [],
      properties: props,
    };
  });

  const links = rawLinks.map((r: any) => ({
    type: r.type || '',
    start: String(r.start ?? r.source ?? ''),
    end: String(r.end ?? r.target ?? ''),
  }));

  return { nodes, links };
}

// All data comes from chain API responses — no direct Cypher/graph-server calls

// ── Dependency Count (chain-aware: Risk INFORMS Performance/PolicyTool at L2) ──

/**
 * Dependency count: for any node, trace UP to its parent L2 Capability,
 * find the corresponding L2 Risk (same ID), then count INFORMS links:
 * - OPERATE cap (status=active): count linked SectorPerformance nodes
 * - BUILD cap (status=planned/in_progress): count linked SectorPolicyTool nodes
 */
function computeDependencyCount(
  chains: ChainData[],
  nodesByType: Map<string, { props: Record<string, any>; labels: string[]; id: string }[]>
): Map<string, number> {
  // Build L2 Risk → INFORMS target map from chain links
  const riskInformsPerf = new Map<string, Set<string>>();   // risk L2 id → perf ids
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

  for (const [, instances] of nodesByType) {
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
    if (props.status === 'complete') return 'green';
    const progress = parseFloat(props.progress_percentage);
    if (!isNaN(progress) && props.end_date) {
      const start = new Date(props.start_date || props.end_date).getTime();
      const end = new Date(props.end_date).getTime();
      const now = Date.now();
      const elapsed = Math.max(0, Math.min(1, (now - start) / (end - start || 1)));
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
    if (gap === 1 || gap === '1') return 'amber';
    if (gap === 0 || gap === '0') return 'green';
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

  // RiskPlan: status + progress
  if (labels.includes('RiskPlan')) {
    const status = props.status;
    const progress = parseFloat(props.progress);
    if (status === 'completed' || status === 'closed') return 'green';
    if (status === 'overdue' || status === 'failed') return 'red';
    if (!isNaN(progress)) {
      if (progress >= 80) return 'green';
      if (progress >= 40) return 'amber';
      return 'red';
    }
    if (status === 'active' || status === 'in_progress') return 'amber';
    return 'amber'; // plan exists = under monitoring
  }

  // EntityVendor: performance_rating or sla_compliance
  if (labels.includes('EntityVendor')) {
    const rating = parseFloat(props.performance_rating || props.sla_compliance);
    if (!isNaN(rating)) {
      if (rating >= 0.9) return 'green';
      if (rating >= 0.7) return 'amber';
      return 'red';
    }
    const status = props.status || props.vendor_status;
    if (status === 'active' || status === 'compliant') return 'green';
    if (status === 'warning' || status === 'review') return 'amber';
    if (status === 'critical' || status === 'non-compliant') return 'red';
    return 'amber'; // vendor exists = at minimum amber (needs monitoring)
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
    return 'amber'; // change adoption exists = needs monitoring
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
    return 'amber'; // culture health exists = needs monitoring
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

  // SectorAdminRecord: status = Published (green), Draft (amber), else red
  if (labels.includes('SectorAdminRecord')) {
    const status = (props.status || '').toLowerCase();
    if (status === 'published' || status === 'active' || status === 'approved') return 'green';
    if (status === 'draft' || status === 'review' || status === 'pending') return 'amber';
    if (status) return 'red';
    return 'amber';
  }

  // SectorDataTransaction: status-based
  if (labels.includes('SectorDataTransaction')) {
    const status = (props.status || '').toLowerCase();
    if (status === 'active' || status === 'operational' || status === 'published') return 'green';
    if (status === 'draft' || status === 'pending' || status === 'planned') return 'amber';
    if (status) return 'red';
    return 'amber';
  }

  // SectorGovEntity
  if (labels.includes('SectorGovEntity')) {
    const status = (props.status || '').toLowerCase();
    if (status === 'active' || status === 'operational') return 'green';
    if (status) return 'amber';
    return 'green';
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

  // Compute build-only and operate-only risk aggregates
  const riskInstances = nodesByType.get('risks') || [];
  const buildRiskRag: RagStatus = (() => {
    let worst: RagStatus = 'default';
    for (const r of riskInstances) {
      const band = r.props.build_band;
      if (!band) continue;
      const rag: RagStatus = (band === 'Red' || band === 'red') ? 'red' : (band === 'Amber' || band === 'amber') ? 'amber' : (band === 'Green' || band === 'green') ? 'green' : 'default';
      if (ragRank[rag] > ragRank[worst]) worst = rag;
    }
    return worst;
  })();
  const operateRiskRag: RagStatus = (() => {
    let worst: RagStatus = 'default';
    for (const r of riskInstances) {
      const band = r.props.operate_band;
      if (!band) continue;
      const rag: RagStatus = (band === 'Red' || band === 'red') ? 'red' : (band === 'Amber' || band === 'amber') ? 'amber' : (band === 'Green' || band === 'green') ? 'green' : 'default';
      if (ragRank[rag] > ragRank[worst]) worst = rag;
    }
    return worst;
  })();

  const propagate = (source: string, target: string, overrideSourceRag?: RagStatus) => {
    const srcStatus = overrideSourceRag ?? result[source];
    if (!srcStatus || srcStatus === 'green' || srcStatus === 'default') return;
    const tgtStatus = result[target] || 'default';
    if (ragRank[srcStatus] > ragRank[tgtStatus]) {
      result[target] = srcStatus;
    }
  };

  // Build chain (bottom → top):
  //   projects → capabilities → risks(build) → policyTools → sectorObjectives
  //   projects → capabilities → risks(operate) → performance → sectorObjectives
  //   changeAdoption → capabilities (then continues up via the paths above)
  const chainPairs: { source: string; target: string; overrideRag?: RagStatus }[] = [
    { source: 'projects', target: 'capabilities' },
    { source: 'changeAdoption', target: 'capabilities' },
    { source: 'orgUnits', target: 'capabilities' },
    { source: 'processes', target: 'capabilities' },
    { source: 'itSystems', target: 'capabilities' },
    { source: 'vendors', target: 'capabilities' },
    { source: 'cultureHealth', target: 'capabilities' },
    { source: 'capabilities', target: 'risks' },
    // policyTools only affected by BUILD risks
    { source: 'risks', target: 'policyTools', overrideRag: buildRiskRag },
    // performance only affected by OPERATE risks
    { source: 'risks', target: 'performance', overrideRag: operateRiskRag },
    { source: 'policyTools', target: 'sectorObjectives' },
    { source: 'performance', target: 'sectorObjectives' },
  ];

  // Propagate bottom-up: iterate in order so lower-level statuses flow upward
  for (const { source, target, overrideRag } of chainPairs) {
    propagate(source, target, overrideRag);
  }

  return result;
}

// ── Line Flow Health (orphan + bastard detection per leg) ──
//
// For each CONNECTION_PAIR [fromType, toType] we check the chain links
// that connect a fromType-node to a toType-node (in either direction).
//
// Orphan  = a from-node where the chain path STOPS — it has no link to
//           any to-node on this leg. Dead end.
// Bastard = a to-node that appears on the chain path and proceeds onward,
//           but has no link FROM any from-node — it appears out of nowhere.
//
// brokenPct = (orphans + bastards) / (fromTotal + toTotal)
//   0%       → green (dotted, animated)
//   1–15%    → amber (dotted, slow)
//   >15%     → red   (solid)

function computeLineFlowHealth(
  chains: ChainData[],
  nodesByType: Map<string, { props: Record<string, any>; labels: string[]; id: string }[]>,
): { lineRag: Record<string, RagStatus>; lineDetails: Record<string, LineHealthDetail> } {
  const lineRag: Record<string, RagStatus> = {};
  const lineDetails: Record<string, LineHealthDetail> = {};

  // Build nodeIdToLevel from ALL chain nodes (not year-filtered).
  // Level lookup must cover nodes that may be filtered out of nodesByType by year,
  // because their IDs still appear as link endpoints in relAdj.
  // Key includes label because id alone is NOT unique across types.
  const nodeIdToLevel = new Map<string, string | null>();
  for (const chain of chains) {
    for (const n of chain.nodes) {
      const label = n.labels[0] || '';
      const levelKey = `${label}:${n.id}`;
      if (nodeIdToLevel.has(levelKey)) continue;
      const p = n.properties;
      const raw = p?.level ?? p?.ontology_level ?? p?.node_level ?? p?.layer;
      nodeIdToLevel.set(levelKey, typeof raw === 'string' && raw.trim() ? raw.trim().toUpperCase() : null);
    }
  }

  // Build relation adjacency from ALL chain links.
  // relAdj[relType][label:sourceId] = Set<label:targetIds>
  const relAdj = new Map<string, Map<string, Set<string>>>();
  for (const chain of chains) {
    for (const link of chain.links) {
      if (!relAdj.has(link.type)) relAdj.set(link.type, new Map());
      const bySource = relAdj.get(link.type)!;
      if (!bySource.has(link.start)) bySource.set(link.start, new Set());
      bySource.get(link.start)!.add(link.end);
    }
  }

  const matchLevel = (node: { id: string; labels: string[] }, levels?: string[]): boolean => {
    if (!levels || levels.length === 0) return true;
    const label = node.labels[0] || '';
    const lv = nodeIdToLevel.get(`${label}:${node.id}`);
    return !!lv && levels.includes(lv);
  };

  // DIAGNOSTIC: sample one spec to expose ID/level format in console
  {
    const sampleNodes = nodesByType.get('capabilities') || [];
    const sampleChainNode = chains[0]?.nodes[0];
    const sampleLink = chains[0]?.links[0];
    console.log('[DIAG] capabilities node sample:', sampleNodes[0]);
    console.log('[DIAG] chain node raw sample:', sampleChainNode, '→ id type:', typeof sampleChainNode?.id);
    console.log('[DIAG] chain link sample:', sampleLink, '→ start type:', typeof sampleLink?.start);
    console.log('[DIAG] nodeIdToLevel sample entries:', [...nodeIdToLevel.entries()].slice(0, 3));
    console.log('[DIAG] relAdj keys (relation types):', [...relAdj.keys()]);
    const capIds = sampleNodes.slice(0, 2).map(n => n.id);
    console.log('[DIAG] capabilities node IDs sample:', capIds);
    if (capIds.length > 0) {
      const monitoredBy = relAdj.get('MONITORED_BY');
      console.log('[DIAG] MONITORED_BY sources sample:', monitoredBy ? [...monitoredBy.keys()].slice(0, 3) : 'NOT FOUND');
      console.log('[DIAG] MONITORED_BY from cap[0]:', monitoredBy?.get(capIds[0]));
    }
  }

  // policyTool IDs >= 16.0 are physical assets (industrial cities, power plants, giga projects)
  // not policy instruments — exclude them from line RAG computations
  const isAssetPolicyTool = (type: string, n: { id: string }) =>
    type === 'policyTools' && parseFloat(n.id) >= 16.0;

  // Build mode: IT/Process/Org nodes that are targets of CLOSE_GAPS from projects
  // Only these should be counted in project-related line RAGs
  const buildModeIds = new Set<string>();
  const closeGaps = relAdj.get('CLOSE_GAPS');
  if (closeGaps) {
    for (const targets of closeGaps.values()) {
      for (const t of targets) buildModeIds.add(t);
    }
  }

  for (const spec of VISUAL_LEG_SPECS) {
    // fromNodes and toNodes: year-filtered nodes of correct type and level, excluding asset policyTools
    let fromNodes = (nodesByType.get(spec.from) || []).filter(n => matchLevel(n, spec.fromLevels) && !isAssetPolicyTool(spec.from, n));
    let toNodes   = (nodesByType.get(spec.to)   || []).filter(n => matchLevel(n, spec.toLevels) && !isAssetPolicyTool(spec.to, n));

    // For build-mode specs: restrict the flagged side to only nodes in CLOSE_GAPS relationships
    if (spec.buildModeOnly === 'from') {
      fromNodes = fromNodes.filter(n => buildModeIds.has(n.id));
    } else if (spec.buildModeOnly === 'to') {
      toNodes = toNodes.filter(n => buildModeIds.has(n.id));
    }

    const key = `${spec.from}->${spec.to}`;
    const totalNodes = fromNodes.length + toNodes.length;

    if (totalNodes === 0) {
      const rawFrom = nodesByType.get(spec.from) || [];
      const rawTo = nodesByType.get(spec.to) || [];
      console.log(`[LINE-SKIP] ${key}: 0 nodes after level filter. raw ${spec.from}=${rawFrom.length}, raw ${spec.to}=${rawTo.length}, fromLevels=${spec.fromLevels}, toLevels=${spec.toLevels}`);
      if (rawFrom.length > 0) console.log(`[LINE-SKIP] ${key}: sample ${spec.from} level=`, nodeIdToLevel.get(`${rawFrom[0].labels[0] || ''}:${rawFrom[0].id}`));
      if (rawTo.length > 0) console.log(`[LINE-SKIP] ${key}: sample ${spec.to} level=`, nodeIdToLevel.get(`${rawTo[0].labels[0] || ''}:${rawTo[0].id}`));
      lineRag[key] = 'default';
      lineDetails[key] = { from: spec.from, to: spec.to, rag: 'default', connectivity: 0, fromTotal: 0, fromConnected: 0, toTotal: 0, toConnected: 0, linkCount: 0, orphanCount: 0, bastardCount: 0, hasLinks: false, disconnectedFrom: [], disconnectedTo: [] };
      continue;
    }

    // node.id is the short string id (e.g. "1.0"). Unique within a type+year bucket.
    const fromIds = new Set(fromNodes.map(n => n.id));
    const toIds   = new Set(toNodes.map(n => n.id));

    const connectedFrom = new Set<string>();
    const connectedTo   = new Set<string>();

    for (const pattern of spec.patterns) {
      const step = pattern.steps[0];
      if (!step) continue;

      if (pattern.startSide === 'from') {
        for (const fromId of fromIds) {
          for (const relType of step.relationTypes) {
            for (const targetId of (relAdj.get(relType)?.get(fromId) ?? [])) {
              if (toIds.has(targetId)) {
                connectedFrom.add(fromId);
                connectedTo.add(targetId);
              }
            }
          }
        }
      } else {
        for (const toId of toIds) {
          for (const relType of step.relationTypes) {
            for (const targetId of (relAdj.get(relType)?.get(toId) ?? [])) {
              if (fromIds.has(targetId)) {
                connectedTo.add(toId);
                connectedFrom.add(targetId);
              }
            }
          }
        }
      }
    }

    const disFrom = fromNodes.filter(n => !connectedFrom.has(n.id));
    const disTo   = toNodes.filter(n => !connectedTo.has(n.id));
    const orphanCount  = disFrom.length;
    const bastardCount = disTo.length;
    const brokenCount  = orphanCount + bastardCount;
    const brokenPct    = brokenCount / totalNodes;

    const rag: RagStatus = brokenPct === 0 ? 'green' : brokenPct <= 0.25 ? 'amber' : 'red';

    console.log(`[LINE] ${key}: from=${fromNodes.length} unlinked=${orphanCount}, to=${toNodes.length} unlinked=${bastardCount} (${(brokenPct * 100).toFixed(1)}%) → ${rag}`);

    lineRag[key] = rag;
    lineDetails[key] = {
      from: spec.from,
      to: spec.to,
      rag,
      connectivity: 1 - brokenPct,
      fromTotal: fromNodes.length,
      fromConnected: fromNodes.length - orphanCount,
      toTotal: toNodes.length,
      toConnected: toNodes.length - bastardCount,
      linkCount: connectedFrom.size,
      orphanCount,
      bastardCount,
      hasLinks: connectedFrom.size > 0,
      disconnectedFrom: disFrom.map(n => ({ id: n.id, name: n.props.name || '' })),
      disconnectedTo: disTo.map(n => ({ id: n.id, name: n.props.name || '' })),
    };
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

function extractLogicalId(id: string): string {
  // node.id is already the short string (e.g. "1.0") — no splitting needed
  return id;
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
  overrideYear?: number | string,
  overrideQuarter?: string,
): Promise<OntologyRagState> {
  const storedYear = typeof window !== 'undefined' ? localStorage.getItem('jos-year') : null;
  const storedQuarter = typeof window !== 'undefined' ? localStorage.getItem('jos-quarter') : null;
  const year = overrideYear ? parseInt(String(overrideYear), 10) : (storedYear ? parseInt(storedYear, 10) : new Date().getFullYear());
  const quarter = overrideQuarter && overrideQuarter !== 'all' ? overrideQuarter : (storedQuarter && storedQuarter !== 'all' ? storedQuarter : null);

  // Track loading steps for real-time UI feedback
  const steps: LoadingStep[] = [
    { label: 'Projects & Change Adoption', status: 'loading' },
    { label: 'Policy & Risk Chains', status: 'loading' },
    { label: 'Performance Chains', status: 'loading' },
    { label: 'Sector Value Chain', status: 'loading' },
    { label: 'Sustainable Operations', status: 'loading' },
    { label: 'Strategic Initiatives', status: 'loading' },
    { label: 'Strategic Priorities', status: 'loading' },
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

  // Always fetch with year=0 (all data) to hit the boot cache.
  // Year/quarter filtering happens locally in the nodesByType filter below.
  const safeChain = (name: string, idx: number) =>
    tracked(idx, () => fetchChain(name, 0, null)).catch(() => ({ nodes: [] as ChainNode[], links: [] as ChainLink[] }));

  // All reads from centralized cache (preloaded by JosoorDesktopPage at OS boot)
  const [changeToCap, capToPolicy, capToPerf, sectorChain, sustainOps, stratInit, stratPriorities, riskPlans] = await Promise.all([
    safeChain('change_to_capability', 0),
    safeChain('capability_to_policy', 1),
    safeChain('capability_to_performance', 2),
    safeChain('sector_value_chain', 3),
    safeChain('sustainable_operations', 4),
    safeChain('setting_strategic_initiatives', 5),
    safeChain('setting_strategic_priorities', 6),
    safeChain('risk_plans', 7),
  ]);

  const chains = [changeToCap, capToPolicy, capToPerf, sectorChain, sustainOps, stratInit, stratPriorities, riskPlans];
  const totalNodes = chains.reduce((s, c) => s + c.nodes.length, 0);
  console.log('[OntologyService] All cache reads complete. Total nodes:', totalNodes, 'per chain:', chains.map(c => c.nodes.length));
  // DEBUG: ID format comparison
  for (const c of chains) {
    if (c.nodes.length > 0 && c.links.length > 0) {
      console.log('[ID-CHECK] node.id sample:', c.nodes[0].id, typeof c.nodes[0].id, '| link.start sample:', c.links[0].start, typeof c.links[0].start);
      break;
    }
  }

  // Diagnostic: log what node types each chain returned
  const chainNames = ['change_to_capability', 'capability_to_policy', 'capability_to_performance', 'sector_value_chain', 'sustainable_operations', 'setting_strategic_initiatives', 'setting_strategic_priorities'];
  for (const [i, chain] of chains.entries()) {
    const labelCounts: Record<string, number> = {};
    for (const n of chain.nodes) {
      const lbl = n.labels[0] || 'unknown';
      labelCounts[lbl] = (labelCounts[lbl] || 0) + 1;
    }
    console.log(`[OntologyService] ${chainNames[i]}: ${chain.nodes.length} nodes, ${chain.links.length} links`, labelCounts);
  }

  // 1. (Impact scores computed after nodesByType is built — see below)

  // 2. Group all selected-slice nodes by type (deduplicated)
  const allNodesByType = new Map<string, { props: Record<string, any>; labels: string[]; id: string }[]>();
  const seenIds = new Set<string>();

  for (const chain of chains) {
    for (const n of chain.nodes) {
      const label = n.labels.find(l => LABEL_TO_NODE_KEY[l]);
      if (!label) continue;
      const key = LABEL_TO_NODE_KEY[label];

      // Key by label+id+year — id alone is NOT unique across types (e.g. cap "1.0" vs risk "1.0")
      const yearKey = `${label}:${n.id}:${n.properties.year ?? 'x'}`;
      if (seenIds.has(yearKey)) continue;
      seenIds.add(yearKey);
      if (!allNodesByType.has(key)) allNodesByType.set(key, []);

      const enriched = { ...n.properties };
      allNodesByType.get(key)!.push({ props: enriched, labels: n.labels, id: n.id });
    }
  }

  // 2b. Year + quarter filtered subset — used for node RAG, line math, and panel display
  console.log('[FILTER] year =', year, '| quarter =', quarter);
  const allTypeCounts: Record<string, number> = {};
  for (const [k, v] of allNodesByType) allTypeCounts[k] = v.length;
  console.log('[FILTER] allNodesByType counts BEFORE filter:', allTypeCounts);
  // Sample a node to see its year/quarter props
  const sampleEntry = [...allNodesByType.entries()][0];
  if (sampleEntry) {
    const sn = sampleEntry[1][0];
    console.log('[FILTER] sample node:', sampleEntry[0], '| id:', sn.id, '| year:', sn.props.year, typeof sn.props.year, '| quarter:', sn.props.quarter, typeof sn.props.quarter);
  }

  // Normalize quarter: localStorage stores 'Q1', nodes store 4 (numeric)
  const quarterNum = quarter ? parseInt(quarter.replace(/\D/g, ''), 10) || null : null;

  // Cumulative node types: once a node appears in year X, it persists in all future years
  // unless a newer version (same base ID) exists. Dedup by base ID keeping most recent.
  // Measurement nodes: exact year/quarter match only.
  // All node types are cumulative: carry forward until replaced by a newer version.
  // Include all with year <= selected, dedup by base ID keeping most recent.
  // RiskPlan has no year/quarter — always passes through.
  const CUMULATIVE_TYPES = new Set([
    'capabilities', 'policyTools', 'orgUnits', 'itSystems', 'processes',
    'sectorObjectives', 'performance', 'risks', 'projects',
    'changeAdoption', 'cultureHealth', 'vendors',
    'adminRecords', 'dataTransactions', 'riskPlans',
  ]);

  // node.id is the short string id (e.g. "1.0"). Dedup key for cumulative = n.id (within type bucket).
  const nodesByType = new Map<string, { props: Record<string, any>; labels: string[]; id: string }[]>();
  for (const [key, nodes] of allNodesByType) {
    const isCumulative = CUMULATIVE_TYPES.has(key);

    if (isCumulative) {
      // Step 1: include all nodes with year <= selected (and quarter within same year)
      const inWindow = nodes.filter(n => {
        const nodeYear = typeof n.props.year === 'object' ? n.props.year?.low : n.props.year;
        const nq = n.props.quarter ?? null;
        const nodeQ = typeof nq === 'number' ? nq : (typeof nq === 'string' ? parseInt(nq.replace(/\D/g, ''), 10) || null : null);
        if (!nodeYear || !year) return true;
        if (Number(nodeYear) < year) return true;
        if (Number(nodeYear) === year) {
          if (!quarterNum || !nodeQ) return true;
          return nodeQ <= quarterNum;
        }
        return false;
      });
      // Step 2: dedup by id — keep the most recent year/quarter version (id is already short, unique within type)
      const byBaseId = new Map<string, { props: Record<string, any>; labels: string[]; id: string }>();
      for (const n of inWindow) {
        const existing = byBaseId.get(n.id);
        if (!existing) {
          byBaseId.set(n.id, n);
        } else {
          const nYear = typeof n.props.year === 'object' ? n.props.year?.low : (n.props.year ?? 0);
          const eYear = typeof existing.props.year === 'object' ? existing.props.year?.low : (existing.props.year ?? 0);
          const nQ = typeof n.props.quarter === 'number' ? n.props.quarter : parseInt(String(n.props.quarter ?? '0').replace(/\D/g, ''), 10) || 0;
          const eQ = typeof existing.props.quarter === 'number' ? existing.props.quarter : parseInt(String(existing.props.quarter ?? '0').replace(/\D/g, ''), 10) || 0;
          if (Number(nYear) > Number(eYear) || (Number(nYear) === Number(eYear) && nQ > eQ)) {
            byBaseId.set(n.id, n);
          }
        }
      }
      const deduped = Array.from(byBaseId.values());
      if (deduped.length > 0) nodesByType.set(key, deduped);
    } else {
      // Exact year/quarter match for measurement nodes
      const filtered = nodes.filter(n => {
        const nodeYear = typeof n.props.year === 'object' ? n.props.year?.low : n.props.year;
        const nq = n.props.quarter ?? null;
        const nodeQ = typeof nq === 'number' ? nq : (typeof nq === 'string' ? parseInt(nq.replace(/\D/g, ''), 10) || null : null);
        const yearOk = !nodeYear || !year || Number(nodeYear) === year;
        const quarterOk = !quarterNum || !nodeQ || nodeQ === quarterNum;
        return yearOk && quarterOk;
      });
      if (filtered.length > 0) nodesByType.set(key, filtered);
    }
  }

  // DIAGNOSTIC: cap vs risk mismatch check
  {
    const capNodes = nodesByType.get('capabilities') || [];
    const riskNodes = nodesByType.get('risks') || [];
    const capIds = new Set(capNodes.map(n => n.id));
    const riskIds = new Set(riskNodes.map(n => n.id));
    const capsWithoutRisk = [...capIds].filter(id => !riskIds.has(id));
    const risksWithoutCap = [...riskIds].filter(id => !capIds.has(id));
    console.log(`[DIAG] caps=${capIds.size} risks=${riskIds.size} capsWithoutRisk=${capsWithoutRisk.length}:`, capsWithoutRisk, `risksWithoutCap=${risksWithoutCap.length}:`, risksWithoutCap);
    // Show levels for missing
    const capLevels = capsWithoutRisk.map(id => { const n = capNodes.find(c => c.id === id); return `${id}(${n?.props?.level || '?'})`; });
    const riskLevels = risksWithoutCap.map(id => { const n = riskNodes.find(r => r.id === id); return `${id}(${n?.props?.level || '?'})`; });
    console.log(`[DIAG] capsWithoutRisk levels:`, capLevels, 'risksWithoutCap levels:', riskLevels);
    // Check allNodesByType before filtering
    const allCapIds = new Set((allNodesByType.get('capabilities') || []).map(n => n.id));
    const allRiskIds = new Set((allNodesByType.get('risks') || []).map(n => n.id));
    const allCapsNoRisk = [...allCapIds].filter(id => !allRiskIds.has(id));
    console.log(`[DIAG] ALL (pre-filter) caps=${allCapIds.size} risks=${allRiskIds.size} capsWithoutRisk=${allCapsNoRisk.length}:`, allCapsNoRisk);
    // Show risk level distribution
    const riskByLevel: Record<string, number> = {};
    for (const n of riskNodes) { const lv = n.props?.level || 'none'; riskByLevel[lv] = (riskByLevel[lv] || 0) + 1; }
    console.log(`[DIAG] risk level distribution:`, riskByLevel);
    // Show ALL policyTool nodes with id, name, level
    const ptNodes = nodesByType.get('policyTools') || [];
    console.log(`[DIAG] policyTools count=${ptNodes.length}`);
    for (const pt of ptNodes) {
      console.log(`[DIAG] policyTool id=${pt.id} level=${pt.props?.level} name=${pt.props?.name}`);
    }
  }

  // 1b. Impact scores (dependency count via Risk INFORMS chain — requires nodesByType)
  const impactScores = computeDependencyCount(chains, nodesByType);

  // Find max impact for normalization
  let maxImpact = 0;
  for (const score of impactScores.values()) {
    if (score > maxImpact) maxImpact = score;
  }

  // 3. Downstream exposure: which nodes have upstream reds cascading into them
  const downstreamExposure = computeDownstreamExposure(chains, nodesByType, impactScores);

  // 4. Building color: own RAG + upstream cascade
  const nodeRag = aggregateNodeRag(nodesByType, impactScores, downstreamExposure);

  // 4b. Line color: data flow health for the selected slice only
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

      // Skip self-references
      if (businessFrom === businessTo) continue;
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

      // Direct downstream linked nodes (I affect these) — exclude same-type
      const targets = directDownstream.get(inst.id);
      const downstreamNodes: LinkedNode[] = [];
      if (targets) {
        for (const targetId of targets) {
          const info = nodeInfoById.get(targetId);
          if (info && info.nodeType !== nodeKey) downstreamNodes.push({ id: targetId, ...info });
        }
      }
      downstreamNodes.sort(sortLinked);

      // Direct upstream linked nodes (these affect me) — exclude same-type
      const sources = directUpstream.get(inst.id);
      const upstreamNodes: LinkedNode[] = [];
      if (sources) {
        for (const srcId of sources) {
          const info = nodeInfoById.get(srcId);
          if (info && info.nodeType !== nodeKey) upstreamNodes.push({ id: srcId, ...info });
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
        level: inst.props.level || 'L3',
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

  // Compute risk stats split by build/operate
  const riskStats: RiskStats = { buildRed: 0, buildAmber: 0, buildGreen: 0, operateRed: 0, operateAmber: 0, operateGreen: 0, total: 0 };
  const allRiskInstances = nodesByType.get('risks') || [];
  for (const r of allRiskInstances) {
    riskStats.total++;
    const bb = (r.props.build_band || '').toLowerCase();
    if (bb === 'red') riskStats.buildRed++;
    else if (bb === 'amber') riskStats.buildAmber++;
    else if (bb === 'green') riskStats.buildGreen++;
    const ob = (r.props.operate_band || '').toLowerCase();
    if (ob === 'red') riskStats.operateRed++;
    else if (ob === 'amber') riskStats.operateAmber++;
    else if (ob === 'green') riskStats.operateGreen++;
  }

  return { nodeRag, lineRag, lineWeight, lineDetails, stripData, nodeDetails, riskStats };
}

export { COLUMN_NARRATIVES_AR };
