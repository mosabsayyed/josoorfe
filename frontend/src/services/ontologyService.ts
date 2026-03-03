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

export interface OntologyRagState {
  nodeRag: Record<string, RagStatus>;
  lineRag: Record<string, RagStatus>;
  lineWeight: Record<string, LineWeight>;
  stripData: StripColumn[];
}

export interface StripColumn {
  column: string;
  total: number;
  green: number;
  amber: number;
  red: number;
  priorityReds: number;
}

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

const IMPACT_THRESHOLD = 3;

async function fetchChain(name: string): Promise<ChainData> {
  const year = new Date().getFullYear();
  // properties_mode=common skips embeddings — fast response (~2-3s vs 11s+)
  const url = `/api/v1/chains/${name}?year=${year}&properties_mode=common`;
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

/** Call /1/mcp/ read_neo4j_cypher and return parsed rows */
async function runCypher(cypher: string): Promise<any[]> {
  try {
    const res = await fetch('/1/mcp/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: { name: 'read_neo4j_cypher', arguments: { cypher_query: cypher } },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const raw = await res.text();
    const lines = raw.split('\n').filter(l => l.startsWith('data:'));
    const jsonStr = lines.length > 0 ? lines[lines.length - 1].replace(/^data:\s*/, '') : raw;
    const parsed = JSON.parse(jsonStr);
    const content = parsed?.result?.content?.[0]?.text;
    return content ? JSON.parse(content) : [];
  } catch {
    return [];
  }
}

/** Fetch status fields for capabilities and performance nodes directly from Neo4j */
async function fetchStatusMap(year: number): Promise<Record<string, Record<string, any>>> {
  const [capRows, perfRows] = await Promise.all([
    runCypher(`MATCH (c:EntityCapability {year: ${year}})
      WHERE c.execute_status IS NOT NULL OR c.build_status IS NOT NULL
      RETURN c.id AS id, c.execute_status AS execute_status,
             c.build_status AS build_status, c.dependency_count AS dependency_count
      LIMIT 500`),
    runCypher(`MATCH (p:SectorPerformance {year: ${year}})
      WHERE p.actual_value IS NOT NULL
      RETURN p.id AS id, p.actual_value AS actual_value, p.target AS target LIMIT 300`),
  ]);
  const map: Record<string, Record<string, any>> = {};
  for (const row of [...capRows, ...perfRows]) {
    if (row.id) map[row.id] = row;
  }
  return map;
}

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

function getNodeInstanceRag(props: Record<string, any>, labels: string[]): RagStatus {
  if (labels.includes('EntityCapability')) {
    // Prefer execute_status (OPERATE) if present — status field may be absent from chain response
    const es = props.execute_status;
    if (es === 'issues') return 'red';
    if (es === 'at-risk') return 'amber';
    if (es === 'ontrack') return 'green';
    // Fall back to build_status (BUILD)
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
 * Chain API uses composite IDs: "EntityCapability:4.1.1:2026"
 * Cypher queries return short IDs: "4.1.1"
 * Extract the short logical ID for statusMap lookup.
 */
function extractLogicalId(chainId: string): string {
  const parts = chainId.split(':');
  // Composite format ends with a 4-digit year
  if (parts.length >= 3 && /^\d{4}$/.test(parts[parts.length - 1])) {
    return parts.slice(1, -1).join(':');
  }
  return chainId;
}

export async function fetchOntologyRagState(): Promise<OntologyRagState> {
  const year = new Date().getFullYear();
  const [svc, bo, oo, statusMap] = await Promise.all([
    fetchChain('sector_value_chain').catch(() => ({ nodes: [], links: [] })),
    fetchChain('change_to_capability').catch(() => ({ nodes: [], links: [] })),
    fetchChain('capability_to_performance').catch(() => ({ nodes: [], links: [] })),
    fetchStatusMap(year).catch(() => ({})),
  ]);

  const chains = [svc, bo, oo];
  const impactScores = computeImpactScores(chains);

  const nodesByType = new Map<string, { props: Record<string, any>; labels: string[]; id: string }[]>();
  for (const chain of chains) {
    for (const n of chain.nodes) {
      const label = n.labels.find(l => LABEL_TO_NODE_KEY[l]);
      if (!label) continue;
      const key = LABEL_TO_NODE_KEY[label];
      if (!nodesByType.has(key)) nodesByType.set(key, []);
      const logicalId = extractLogicalId(n.id);
      const enriched = { ...n.properties, ...(statusMap[logicalId] || {}) };
      nodesByType.get(key)!.push({ props: enriched, labels: n.labels, id: n.id });
    }
  }

  const nodeRag = aggregateNodeRag(nodesByType, impactScores);

  const lineRag: Record<string, RagStatus> = {};
  const lineWeight: Record<string, LineWeight> = {};

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
