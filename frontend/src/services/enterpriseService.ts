/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JOSOOR ENTERPRISE CAPABILITY SERVICE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * DATA MODEL - AUTHORITATIVE SPECIFICATION:
 * 
 * PRIMARY KEY:
 *   - Composite: (id + year) uniquely identifies each capability node
 * 
 * CORE PROPERTIES:
 *   - id: Business identifier (e.g., "1.0", "1.1", "1.1.1") - NOT Neo4j element ID
 *   - year: Integer (e.g., 2025) - Neo4j returns as {low, high} object
 *   - quarter: Integer 1-4 or string "1"-"4" - Neo4j returns as {low, high} object
 *   - level: String "L1" | "L2" | "L3" - determines hierarchy level
 * 
 * HIERARCHY (L2/L3 only - L1 has NO parent):
 *   - parent_id: Business ID of parent node
 *   - parent_year: Year of parent node
 *   - Matching Rule: Child(parent_id + parent_year) = Parent(id + year)
 *   - NOTE: No parent_quarter property exists
 * 
 * NEO4J SPECIFICS:
 *   - Integer properties: {low: number, high: number}
 *   - Use getNeo4jInt() to extract actual values
 *   - Element IDs (e.g., "4:eae8d877-...") are internal - ignore them
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { L1Capability, L2Capability, L3Capability } from '../types/enterprise';
import { graphService } from './graphService';

// Backend response format: nodes have properties directly on them
// Numeric fields are Neo4j Integer objects: {low: number, high: number}
interface NeoGraphNode {
  id: string;              // Business ID (e.g., "1.0", "1.1.1")
  businessId?: string;     // May contain the real business ID (6.0, 1.0, etc.)
  group: string;           // Node type: "EntityCapability", "EntityRisk", etc.
  label: string;           // Display name
  name: string;
  level: string;           // "L1", "L2", "L3"
  year: { low: number; high: number } | number;
  quarter: { low: number; high: number } | number;
  status?: string;
  description?: string;
  parent_id?: string;      // L2/L3 only - references parent's business ID
  parent_year?: { low: number; high: number } | number;  // L2/L3 only
  maturity_level?: { low: number; high: number } | number;
  target_maturity_level?: string | number;

  // EntityRisk specific fields
  expected_delay_days?: { low: number; high: number } | number;
  delay_days?: { low: number; high: number } | number;
  likelihood_of_delay?: number;
  operational_health_score?: number;
  people_score?: number;
  process_score?: number;
  tools_score?: number;
  risk_exposure_pct?: number;

  // Visualization fields
  color?: string;
  val?: number;

  // Catch-all for any other fields
  [key: string]: any;
}

interface NeoGraphLink {
  source: string;
  target: string;
  type: string;
  properties?: Record<string, any>;
}

interface NeoGraphData {
  nodes: NeoGraphNode[];
  links: NeoGraphLink[];
}

// Helper to extract number from Neo4j Integer
function getNeo4jInt(val: { low: number; high: number } | number | undefined): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  return val.low;
}

// ═══════════════════════════════════════════════════════════════════════════
// MCP CYPHER ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

const MCP_ENDPOINT = '/4/mcp/'; // Proxied to https://betaBE.aitwintech.com/4/mcp/

/**
 * Execute a read-only Cypher query via MCP endpoint.
 * Returns parsed JSON array of rows.
 */
async function runCypher(query: string): Promise<any[]> {
  const body = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: 'read_neo4j_cypher',
      arguments: { query }
    }
  };

  const response = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`MCP HTTP Error: ${response.status}`);
  }

  const text = await response.text();

  // Parse SSE or JSON response
  let result: any;
  try {
    result = JSON.parse(text);
  } catch {
    const dataLine = text.split('\n').find(l => l.startsWith('data: '));
    if (!dataLine) throw new Error('Invalid MCP response format');
    result = JSON.parse(dataLine.substring(6));
  }

  if (result.error) throw new Error(`MCP Error: ${result.error.message}`);
  if (result.result?.isError) {
    throw new Error(`Cypher Error: ${result.result.content.map((c: any) => c.text).join('\n')}`);
  }

  const contentText = result.result?.content?.[0]?.text;
  if (!contentText) return [];

  return JSON.parse(contentText);
}

// ═══════════════════════════════════════════════════════════════════════════
// CUMULATIVE YEAR/QUARTER FILTER
// From ENTERPRISE_DESK_IMPLEMENTATION_GUIDE.md (line 962-997)
// "2026 Q3" = All of 2025 + 2026 Q1 + 2026 Q2 + 2026 Q3
// ═══════════════════════════════════════════════════════════════════════════

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

function matchesCumulativeFilter(
  nodeYear: number,
  nodeQuarter: number | string,
  filterYear: number | 'all',
  filterQuarter: number | 'all'
): boolean {
  if (filterYear === 'all') return true;

  // Include all years before filter year
  if (nodeYear < filterYear) return true;

  // Same year — check quarter
  if (nodeYear === filterYear) {
    if (filterQuarter === 'all') return true;
    // Normalize quarter to index (Q1=0, Q2=1, etc.)
    const nodeQIdx = typeof nodeQuarter === 'string'
      ? QUARTERS.indexOf(nodeQuarter)
      : (nodeQuarter - 1);
    const filterQIdx = typeof filterQuarter === 'string'
      ? QUARTERS.indexOf(filterQuarter as string)
      : ((filterQuarter as number) - 1);
    return nodeQIdx <= filterQIdx;
  }

  // Future years excluded
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// FETCH ENTERPRISE DATA VIA MCP CYPHER
// Step 1: Base MAP — ALL EntityCapability nodes (direct Cypher)
// Step 2: Risk overlay — ALL EntityRisk nodes, matched 1:1 by (id, year, quarter)
// Step 3: Cumulative filter client-side, dedup by business ID
// ═══════════════════════════════════════════════════════════════════════════

// Raw data cache — fetched ONCE, reused across year/quarter changes
interface RawEnterpriseData {
  caps: any[];           // ALL EntityCapability from MCP Cypher
  risks: any[];          // ALL EntityRisk from MCP Cypher
  chainIntegrated: any;  // integrated_oversight chain response {nodes, links}
  chainBuild: any;       // build_oversight chain response {nodes, links}
}

let _rawDataCache: RawEnterpriseData | null = null;
let _rawDataPromise: Promise<RawEnterpriseData> | null = null;

/**
 * Fetch ALL EntityCapability + EntityRisk from DB + chain data from graph server.
 * Called ONCE, cached in memory. Year/quarter changes don't trigger refetch.
 */
async function fetchAllEnterpriseData(): Promise<RawEnterpriseData> {
  // Return cached data if available
  if (_rawDataCache) return _rawDataCache;
  // Deduplicate concurrent calls
  if (_rawDataPromise) return _rawDataPromise;

  _rawDataPromise = (async () => {
    console.log('[EnterpriseService] Fetching ALL data via MCP Cypher + chains (one-time)');

    const [capRows, riskRows, chainIntegrated, chainBuild] = await Promise.all([
      runCypher(`
        MATCH (c:EntityCapability)
        RETURN c { .id, .name, .level, .year, .quarter, .status, .description,
                   .parent_id, .parent_year, .maturity_level, .target_maturity_level } AS cap
      `),
      runCypher(`
        MATCH (r:EntityRisk)
        RETURN r { .id, .name, .year, .quarter, .level,
                   .build_band, .operate_band, .build_exposure_pct,
                   .operate_exposure_pct_effective, .expected_delay_days,
                   .delay_days, .likelihood_of_delay, .operational_health_pct,
                   .people_score, .process_score, .tools_score,
                   .threshold_green, .threshold_amber, .risk_category, .risk_status,
                   .prev_operational_health_pct, .prev2_operational_health_pct,
                   .operate_trend_flag } AS risk
      `),
      graphService.getBusinessChain('integrated_oversight', { excludeEmbeddings: 'true' }),
      graphService.getBusinessChain('build_oversight', { excludeEmbeddings: 'true' })
    ]);

    const caps = capRows.map((r: any) => r.cap);
    const risks = riskRows.map((r: any) => r.risk);
    console.log(`[EnterpriseService] Fetched: ${caps.length} caps, ${risks.length} risks, integrated: ${chainIntegrated?.nodes?.length || 0} nodes, build: ${chainBuild?.nodes?.length || 0} nodes`);

    _rawDataCache = { caps, risks, chainIntegrated, chainBuild };
    _rawDataPromise = null;
    return _rawDataCache;
  })();

  return _rawDataPromise;
}

/** Invalidate cache (e.g. after data write) */
export function invalidateEnterpriseCache(): void {
  _rawDataCache = null;
  _rawDataPromise = null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CHAIN EXTRACTION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract typed nodes from a chain response, keyed by nId for link resolution.
 */
function extractChainNodes(chainData: { nodes: any[]; links: any[] }) {
  const byLabel = new Map<string, Map<string, any>>(); // label -> nId -> props
  const nIdToBizId = new Map<string, string>(); // nId -> business ID (for caps)

  for (const n of chainData.nodes) {
    const props = n.nProps || n.properties || {};
    const labels: string[] = n.nLabels || n.labels || [];
    const nId = String(n.nId ?? n.id ?? '');
    const primaryLabel = labels.find(l => l !== 'Resource') || labels[0] || 'Unknown';

    if (!byLabel.has(primaryLabel)) byLabel.set(primaryLabel, new Map());
    byLabel.get(primaryLabel)!.set(nId, props);

    if (primaryLabel === 'EntityCapability') {
      nIdToBizId.set(nId, props.id || nId);
    }
  }

  return { byLabel, nIdToBizId, links: chainData.links || [] };
}

/**
 * Resolve chain links: find all links of a given type,
 * map source/target nIds to the extracted node maps.
 * Returns array of { sourceBizId, targetProps } pairs.
 */
function resolveChainLinks(
  chain: ReturnType<typeof extractChainNodes>,
  linkType: string,
  sourceLabel: string,
  targetLabel: string
): { sourceBizId: string; targetProps: any }[] {
  const results: { sourceBizId: string; targetProps: any }[] = [];
  const sourceNodes = chain.byLabel.get(sourceLabel);
  const targetNodes = chain.byLabel.get(targetLabel);
  if (!sourceNodes || !targetNodes) return results;

  for (const link of chain.links) {
    const rType = link.rType ?? link.type ?? '';
    if (rType !== linkType) continue;

    const srcNid = String(link.sourceId ?? link.source ?? '');
    const tgtNid = String(link.targetId ?? link.target ?? '');

    // Source is the "from" node, target is the "to" node
    const sourceBizId = chain.nIdToBizId.get(srcNid);
    const targetProps = targetNodes.get(tgtNid);

    if (sourceBizId && targetProps) {
      results.push({ sourceBizId, targetProps });
    }

    // Also check reverse direction (chains may have either direction)
    const revSourceBizId = chain.nIdToBizId.get(tgtNid);
    const revTargetProps = targetNodes.get(srcNid);
    if (!sourceBizId && revSourceBizId && revTargetProps) {
      results.push({ sourceBizId: revSourceBizId, targetProps: revTargetProps });
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// FILTER + BUILD GRAPH
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply cumulative filter + dedup + risk matching + chain overlay attachment.
 * Pure function — no DB call. Runs instantly on year/quarter change.
 */
function filterAndBuildGraph(raw: RawEnterpriseData, year: number | 'all', quarter: number | 'all'): NeoGraphData {
  // Step 1: Cumulative filter
  const filteredCaps = raw.caps
    .filter((c: any) => matchesCumulativeFilter(c.year, c.quarter, year, quarter));
  const filteredRisks = raw.risks
    .filter((r: any) => matchesCumulativeFilter(r.year, r.quarter, year, quarter));

  console.log(`[EnterpriseService] Filter year=${year} q=${quarter}: ${filteredCaps.length} caps, ${filteredRisks.length} risks`);

  // Step 2: Dedup caps by business ID — keep most recent year/quarter within window
  const capByBizId = new Map<string, any>();
  for (const c of filteredCaps) {
    const existing = capByBizId.get(c.id);
    if (!existing) {
      capByBizId.set(c.id, c);
    } else {
      if (c.year > existing.year || (c.year === existing.year && c.quarter > existing.quarter)) {
        capByBizId.set(c.id, c);
      }
    }
  }

  // Step 3: Build risk index by composite key (id + year + quarter)
  const riskByKey = new Map<string, any>();
  for (const r of filteredRisks) {
    riskByKey.set(`${r.id}_${r.year}_${r.quarter}`, r);
  }

  // Step 4: Convert to NeoGraphNode format and attach risk 1:1
  const nodes: NeoGraphNode[] = [];
  capByBizId.forEach((c) => {
    const node: NeoGraphNode = {
      id: c.id,
      businessId: c.id,
      group: 'EntityCapability',
      label: c.name || c.id,
      name: c.name || c.id,
      level: c.level || '',
      year: c.year,
      quarter: c.quarter,
      status: c.status,
      description: c.description,
      parent_id: c.parent_id,
      parent_year: c.parent_year,
      maturity_level: c.maturity_level,
      target_maturity_level: c.target_maturity_level,
    };

    const risk = riskByKey.get(`${c.id}_${c.year}_${c.quarter}`);
    if (risk) {
      (node as any).risk = risk;
    }

    nodes.push(node);
  });

  // Step 5: Extract chain data
  const intChain = raw.chainIntegrated?.nodes ? extractChainNodes(raw.chainIntegrated) : null;
  const buildChain = raw.chainBuild?.nodes ? extractChainNodes(raw.chainBuild) : null;

  // Step 6: Attach overlay data from chains to capability nodes
  const nodeByBizId = new Map<string, NeoGraphNode>();
  for (const node of nodes) {
    nodeByBizId.set(node.id, node);
  }

  const activeChains = [intChain, buildChain].filter(Boolean) as ReturnType<typeof extractChainNodes>[];

  // Risk via MONITORED_BY (from both chains) - SUPPLEMENTS composite key matching
  for (const chain of activeChains) {
    const riskLinks = resolveChainLinks(chain, 'MONITORED_BY', 'EntityCapability', 'EntityRisk');
    for (const { sourceBizId, targetProps } of riskLinks) {
      const node = nodeByBizId.get(sourceBizId);
      if (node && !(node as any).risk) {
        (node as any).risk = targetProps;
      }
    }
  }

  // Projects from build_oversight (CLOSE_GAPS)
  if (buildChain) {
    const projectLinks = resolveChainLinks(buildChain, 'CLOSE_GAPS', 'EntityCapability', 'EntityProject');
    for (const { sourceBizId, targetProps } of projectLinks) {
      const node = nodeByBizId.get(sourceBizId);
      if (node) {
        if (!(node as any).linkedProjects) (node as any).linkedProjects = [];
        (node as any).linkedProjects.push(targetProps);
      }
    }
  }

  // Operating entities from integrated_oversight (ROLE_GAPS, KNOWLEDGE_GAPS, AUTOMATION_GAPS)
  for (const linkType of ['ROLE_GAPS', 'KNOWLEDGE_GAPS', 'AUTOMATION_GAPS']) {
    for (const entityLabel of ['EntityOrgUnit', 'EntityProcess', 'EntityITSystem']) {
      for (const chain of activeChains) {
        const entLinks = resolveChainLinks(chain, linkType, 'EntityCapability', entityLabel);
        for (const { sourceBizId, targetProps } of entLinks) {
          const node = nodeByBizId.get(sourceBizId);
          if (node) {
            if (!(node as any).operatingEntities) (node as any).operatingEntities = [];
            const enriched = { ...targetProps, type: entityLabel.replace('Entity', '') };
            const existing = (node as any).operatingEntities;
            if (!existing.find((e: any) => e.id === enriched.id)) {
              existing.push(enriched);
            }
          }
        }
      }
    }
  }

  // Performance targets from chains (INFORMS + SETS_TARGETS)
  for (const chain of activeChains) {
    const perfLinks = resolveChainLinks(chain, 'INFORMS', 'EntityCapability', 'SectorPerformance');
    for (const { sourceBizId, targetProps } of perfLinks) {
      const node = nodeByBizId.get(sourceBizId);
      if (node) {
        if (!(node as any).performanceTargets) (node as any).performanceTargets = [];
        if (!(node as any).performanceTargets.find((p: any) => p.id === targetProps.id)) {
          (node as any).performanceTargets.push(targetProps);
        }
      }
    }
    const setsLinks = resolveChainLinks(chain, 'SETS_TARGETS', 'EntityCapability', 'SectorPerformance');
    for (const { sourceBizId, targetProps } of setsLinks) {
      const node = nodeByBizId.get(sourceBizId);
      if (node) {
        if (!(node as any).performanceTargets) (node as any).performanceTargets = [];
        if (!(node as any).performanceTargets.find((p: any) => p.id === targetProps.id)) {
          (node as any).performanceTargets.push(targetProps);
        }
      }
    }
  }

  // Policy tools from chains (SETS_PRIORITIES + INFORMS)
  for (const chain of activeChains) {
    for (const linkType of ['SETS_PRIORITIES', 'INFORMS']) {
      const polLinks = resolveChainLinks(chain, linkType, 'EntityCapability', 'SectorPolicyTool');
      for (const { sourceBizId, targetProps } of polLinks) {
        const node = nodeByBizId.get(sourceBizId);
        if (node) {
          if (!(node as any).policyTools) (node as any).policyTools = [];
          if (!(node as any).policyTools.find((p: any) => p.id === targetProps.id)) {
            (node as any).policyTools.push(targetProps);
          }
        }
      }
    }
  }

  // Objectives from chains (GOVERNED_BY + AGGREGATES_TO)
  for (const chain of activeChains) {
    const objLinks = resolveChainLinks(chain, 'GOVERNED_BY', 'EntityCapability', 'SectorObjective');
    for (const { sourceBizId, targetProps } of objLinks) {
      const node = nodeByBizId.get(sourceBizId);
      if (node) {
        if (!(node as any).objectives) (node as any).objectives = [];
        if (!(node as any).objectives.find((o: any) => o.id === targetProps.id)) {
          (node as any).objectives.push(targetProps);
        }
      }
    }
    const aggLinks = resolveChainLinks(chain, 'AGGREGATES_TO', 'EntityCapability', 'SectorObjective');
    for (const { sourceBizId, targetProps } of aggLinks) {
      const node = nodeByBizId.get(sourceBizId);
      if (node) {
        if (!(node as any).objectives) (node as any).objectives = [];
        if (!(node as any).objectives.find((o: any) => o.id === targetProps.id)) {
          (node as any).objectives.push(targetProps);
        }
      }
    }
  }

  const l1Count = nodes.filter(n => n.level === 'L1').length;
  const l2Count = nodes.filter(n => n.level === 'L2').length;
  const l3Count = nodes.filter(n => n.level === 'L3').length;
  const withRisk = nodes.filter(n => (n as any).risk).length;
  const withProjects = nodes.filter(n => (n as any).linkedProjects?.length > 0).length;
  const withEntities = nodes.filter(n => (n as any).operatingEntities?.length > 0).length;
  console.log(`[EnterpriseService] Result: ${nodes.length} caps (L1:${l1Count}, L2:${l2Count}, L3:${l3Count}), risk: ${withRisk}, projects: ${withProjects}, entities: ${withEntities}`);

  return { nodes, links: [] };
}

export async function getCapabilityMatrix(
  year: number | 'all',
  quarter: number | 'all'
): Promise<L1Capability[]> {
  // Step 1: Fetch all data (cached — only hits DB on first call)
  const raw = await fetchAllEnterpriseData();

  // Step 2: Filter + dedup + risk match (pure function, instant)
  const graphData = filterAndBuildGraph(raw, year, quarter);

  if (!graphData.nodes || graphData.nodes.length === 0) {
    console.warn('[EnterpriseService] No data found, returning empty.');
    return [];
  }

  return transformNeo4jToMatrix(graphData, year, quarter);
}

/**
 * Transform flat Neo4j graph data into hierarchical L1→L2→L3 structure
 * Risk data is now nested in each capability node via MONITORED_BY relationship
 */
function transformNeo4jToMatrix(graphData: NeoGraphData, year: number | 'all', quarter: number | 'all'): L1Capability[] {
  // Cumulative year/quarter filtering already applied in fetchEnterpriseViaCypher
  // Dedup by business ID also already done — nodes are ready for hierarchy building
  const capabilityNodes = graphData.nodes;

  if (!capabilityNodes || capabilityNodes.length === 0) {
    console.warn('[EnterpriseService] No capability nodes to transform');
    return [];
  }

  // Separate by level using business ID pattern
  const l1Nodes = capabilityNodes.filter(n => n.level === 'L1' || /^\d+\.0$/.test(n.businessId || n.id));
  const l2Nodes = capabilityNodes.filter(n => n.level === 'L2' || /^\d+\.\d+$/.test(n.businessId || n.id));
  const l3Nodes = capabilityNodes.filter(n => n.level === 'L3' || /^\d+\.\d+\.\d+$/.test(n.businessId || n.id));

  console.log('[EnterpriseService] Hierarchy breakdown:', {
    total: capabilityNodes.length,
    l1: l1Nodes.length,
    l2: l2Nodes.length,
    l3: l3Nodes.length,
    yearFilter: year === 'all' ? 'all' : `<= ${year}`
  });

  // ══════════════════════════════════════════════════════════════════════════
  // LEVEL 1: DEDUPLICATION
  // ══════════════════════════════════════════════════════════════════════════

  // Deduplicate L1 nodes by businessId - keep most recent year/quarter
  const l1ByBusinessId = new Map<string, NeoGraphNode>();
  l1Nodes.forEach(l1 => {
    const bizId = (l1 as any).businessId;
    if (!bizId) return; // Should not happen with new Cypher

    const existing = l1ByBusinessId.get(bizId);

    if (!existing) {
      l1ByBusinessId.set(bizId, l1);
      return;
    }

    // Compare year/quarter to keep most recent
    const l1Year = getNeo4jInt(l1.year);
    const l1Quarter = getNeo4jInt(l1.quarter);
    const existingYear = getNeo4jInt(existing.year);
    const existingQuarter = getNeo4jInt(existing.quarter);

    if (l1Year > existingYear || (l1Year === existingYear && l1Quarter > existingQuarter)) {
      l1ByBusinessId.set(bizId, l1);
    }
  });

  const deduplicatedL1Nodes = Array.from(l1ByBusinessId.values());

  // ══════════════════════════════════════════════════════════════════════════
  // LEVEL 2: DIRECT LINKING & DEDUPLICATION
  // ══════════════════════════════════════════════════════════════════════════

  // Set businessId from ID field directly (from Cypher)
  l2Nodes.forEach(l2 => {
    if (l2.id) {
      (l2 as any).businessId = l2.id;
    } else {
      console.warn('[EnterpriseService] L2 Node missing ID from Cypher:', l2);
    }
  });

  // Deduplicate L2s
  // Key: ParentBusinessID + L2Name (Stable across years)
  // We strictly use parent_id from Cypher which is now the Business ID (e.g. 1.0)
  const l2ByIdentity = new Map<string, NeoGraphNode>();
  l2Nodes.forEach(l2 => {
    if (!l2.parent_id) {
      console.warn('[EnterpriseService] Orphan L2 (no parent_id):', l2.name || l2.id);
      return;
    }

    const identityKey = `${l2.parent_id}_${l2.name} `;
    const existing = l2ByIdentity.get(identityKey);

    if (!existing) {
      l2ByIdentity.set(identityKey, l2);
      return;
    }

    const l2Year = getNeo4jInt(l2.year);
    const l2Quarter = getNeo4jInt(l2.quarter);
    const existingYear = getNeo4jInt(existing.year);
    const existingQuarter = getNeo4jInt(existing.quarter);

    if (l2Year > existingYear || (l2Year === existingYear && l2Quarter > existingQuarter)) {
      l2ByIdentity.set(identityKey, l2);
    }
  });

  const deduplicatedL2Nodes = Array.from(l2ByIdentity.values());

  // ══════════════════════════════════════════════════════════════════════════
  // LEVEL 3: DIRECT LINKING & DEDUPLICATION
  // ══════════════════════════════════════════════════════════════════════════

  // Set businessId from ID field directly
  l3Nodes.forEach(l3 => {
    if (l3.id) {
      (l3 as any).businessId = l3.id;
    } else {
      console.warn('[EnterpriseService] L3 Node missing ID from Cypher:', l3);
    }
  });

  // Deduplicate L3s
  const l3ByIdentity = new Map<string, NeoGraphNode>();
  l3Nodes.forEach(l3 => {
    if (!l3.parent_id) {
      // console.warn('[EnterpriseService] Orphan L3 (no parent_id):', l3.name); 
      // Optional: verbose logging off to avoid spam if purely data issue
      return;
    }

    const identityKey = `${l3.parent_id}_${l3.name} `;
    const existing = l3ByIdentity.get(identityKey);

    if (!existing) {
      l3ByIdentity.set(identityKey, l3);
      return;
    }

    const l3Year = getNeo4jInt(l3.year);
    const l3Quarter = getNeo4jInt(l3.quarter); const existingYear = getNeo4jInt(existing.year);
    const existingQuarter = getNeo4jInt(existing.quarter);

    if (l3Year > existingYear || (l3Year === existingYear && l3Quarter > existingQuarter)) {
      l3ByIdentity.set(identityKey, l3);
    }
  });

  const deduplicatedL3Nodes = Array.from(l3ByIdentity.values());

  console.log('[EnterpriseService] Hierarchy Rebuild Complete:', {
    l1: deduplicatedL1Nodes.length,
    l2: deduplicatedL2Nodes.length,
    l3: deduplicatedL3Nodes.length
  });

  // Sort L1 nodes by business ID for consistent display order
  const sortedL1Nodes = deduplicatedL1Nodes.sort((a, b) => {
    const aId = (a as any).businessId || a.id;
    const bId = (b as any).businessId || b.id;
    return aId.localeCompare(bId, undefined, { numeric: true });
  });

  // Build hierarchy using DEDUPLICATED nodes
  // Note: l2Nodes and l3Nodes passed to build functions must be the DEDUPLICATED lists
  // But wait, buildL1 filters by parent_id. 
  // Since we updated parent_id on the *original* nodes (l2Nodes array members), and deduplicatedL2Nodes contains references to those same objects,
  // we can use deduplicatedL2Nodes.

  // Risk data is now nested in each capability node (no separate risk array)
  return sortedL1Nodes.map(l1Node => buildL1(l1Node, deduplicatedL2Nodes, deduplicatedL3Nodes));
}

/**
 * Build L1 capability with all L2/L3 children using parent_id + parent_year matching
 * Per data model: Child(parent_id + parent_year) = Parent(businessId + year)
 */
function buildL1(
  l1Node: NeoGraphNode,
  l2Nodes: NeoGraphNode[],
  l3Nodes: NeoGraphNode[]
): L1Capability {
  const l1BusinessId = (l1Node as any).businessId || l1Node.id;

  // Find L2 children: L2.parent_id === L1.businessId
  // NOTE: parent_year matching REMOVED - year filter already applied to capability nodes
  const l2Children = l2Nodes.filter(l2 =>
    l2.parent_id === l1BusinessId
  );

  return {
    id: l1BusinessId,
    name: l1Node.name || 'Unnamed L1',
    description: l1Node.description || '',
    maturity_level: calculateL1Maturity(l2Children, l3Nodes),
    target_maturity_level: calculateL1TargetMaturity(l2Children, l3Nodes),
    l2: l2Children.map(l2Node => buildL2(l2Node, l3Nodes))
  };
}

/**
 * Build L2 capability with all L3 children using parent_id + parent_year matching
 * NOTE: L3.parent_id contains L2 BUSINESS ID (not element ID), so match by businessId
 */
function buildL2(l2Node: NeoGraphNode, l3Nodes: NeoGraphNode[]): L2Capability {
  const l2BusinessId = (l2Node as any).businessId || l2Node.id;

  // Find L3 children: L3.parent_id === L2.businessId
  // NOTE: parent_year matching REMOVED - year filter already applied to capability nodes
  const l3Children = l3Nodes.filter(l3 =>
    l3.parent_id === l2BusinessId
  );

  // R9: Collect upward chain data from L2 node
  const policyTools = ((l2Node as any).policyTools || []).filter((p: any) => p != null);
  const performanceTargets = ((l2Node as any).performanceTargets || []).filter((p: any) => p != null);
  const objectives = ((l2Node as any).objectives || []).filter((o: any) => o != null);
  // Deduplicate objectives by id
  const uniqueObjectives = objectives.filter((o: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === o.id) === i);

  const l3Caps = l3Children.map(l3Node => buildL3(l3Node));

  return {
    id: l2BusinessId,
    name: l2Node.name || 'Unnamed L2',
    description: l2Node.description || '',
    maturity_level: calculateL2Maturity(l3Children),
    target_maturity_level: calculateL2TargetMaturity(l3Children),
    l3: l3Caps,
    upwardChain: (policyTools.length > 0 || performanceTargets.length > 0 || uniqueObjectives.length > 0) ? {
      policyTools,
      performanceTargets,
      objectives: uniqueObjectives
    } : undefined,
    rawL2Node: l2Node as any
  };
}

/**
 * Build L3 capability with risk data from nested MONITORED_BY relationship
 * Risk bands (Green/Amber/Red) from EntityRisk now determine build/execute status
 */
function buildL3(l3Node: NeoGraphNode): L3Capability {
  const l3BusinessId = (l3Node as any).businessId || l3Node.id;

  // Determine mode from status
  const mode = l3Node.status === 'active' ? 'execute' : 'build';

  // Base capability
  const l3Cap: L3Capability = {
    id: l3BusinessId,
    name: l3Node.name || 'Unnamed L3',
    status: deriveStatus(l3Node.status),
    maturity_level: getNeo4jInt(l3Node.maturity_level) || 1,
    target_maturity_level: typeof l3Node.target_maturity_level === 'string'
      ? parseInt(l3Node.target_maturity_level)
      : getNeo4jInt(l3Node.target_maturity_level) || 5,
    staff_gap: 0,
    tools_gap: 0,
    docs_complete: 75,
    team_health: 75,
    change_adoption: 75,
    mode,
    year: getNeo4jInt(l3Node.year),
    quarter: `Q${getNeo4jInt(l3Node.quarter)}` as 'Q1' | 'Q2' | 'Q3' | 'Q4'
  };

  // Store raw capability properties for detail panel (exclude internal fields)
  const { risk: _risk, embedding: _emb, vector: _vec, elementId: _eid, linkedProjects: _lp, operatingEntities: _oe, performanceTargets: _pt, policyTools: _pol, ...capProps } = l3Node as any;
  l3Cap.rawCapability = capProps;
  // Store linked data from initial query (no extra DB calls needed)
  l3Cap.rawCapability.linkedProjects = (l3Node as any).linkedProjects || [];
  l3Cap.rawCapability.operatingEntities = (l3Node as any).operatingEntities || [];
  l3Cap.rawCapability.performanceTargets = (l3Node as any).performanceTargets || [];
  l3Cap.rawCapability.policyTools = (l3Node as any).policyTools || [];

  // R4: Late detection — compare latest project end_date vs PolicyTool end_date
  const policyTools = (l3Node as any).policyTools || [];
  const linkedProjects = (l3Node as any).linkedProjects || [];
  if (l3Cap.mode === 'build' && policyTools.length > 0 && linkedProjects.length > 0) {
    // "Due by" = PolicyTool end_date (the mandate deadline)
    const policyDates = policyTools
      .filter((p: any) => p.end_date)
      .map((p: any) => new Date(p.end_date).getTime());
    const dueBy = policyDates.length > 0 ? Math.min(...policyDates) : null;

    // "Planned by" = latest project end_date (when work will actually finish)
    const projectDates = linkedProjects
      .filter((p: any) => p.end_date && p.status !== 'complete' && p.status !== 'completed')
      .map((p: any) => new Date(p.end_date).getTime());
    const plannedBy = projectDates.length > 0 ? Math.max(...projectDates) : null;

    if (dueBy && plannedBy) {
      const deltaMs = plannedBy - dueBy;
      const deltaDays = Math.round(deltaMs / (1000 * 60 * 60 * 24));
      l3Cap.rawCapability.dueByDate = new Date(dueBy).toISOString().split('T')[0];
      l3Cap.rawCapability.plannedByDate = new Date(plannedBy).toISOString().split('T')[0];
      l3Cap.rawCapability.lateByDays = deltaDays > 0 ? deltaDays : 0;
      l3Cap.rawCapability.isLate = deltaDays > 0;
      // Severity bands: 0% on time, <=5% slight, >5% significant (of total duration)
      const policyStartDates = policyTools
        .filter((p: any) => p.start_date)
        .map((p: any) => new Date(p.start_date).getTime());
      const earliestStart = policyStartDates.length > 0 ? Math.min(...policyStartDates) : dueBy;
      const totalDuration = plannedBy - earliestStart;
      if (totalDuration > 0 && deltaDays > 0) {
        const delayPct = (deltaDays / (totalDuration / (1000 * 60 * 60 * 24))) * 100;
        l3Cap.rawCapability.delaySeverity = delayPct <= 5 ? 'slight' : 'significant';
      }
    }
  }

  // Enrich with risk data from nested object (if present)
  if (l3Node.risk) {
    enrichWithRiskData(l3Cap, l3Node.risk, mode);
    calculateOverlayFields(l3Cap, mode);
    // Store raw risk for detail panel display
    l3Cap.rawRisk = l3Node.risk;
  }

  // Derive build/execute status from risk bands (SST v1.2 thresholds: Green≤35%, Amber≤65%, Red>65%)
  const risk = l3Node.risk;
  if (risk) {
    if (mode === 'build') {
      const band = risk.build_band?.toLowerCase();
      if (band === 'red') {
        l3Cap.build_status = 'in-progress-issues';
      } else if (band === 'amber') {
        l3Cap.build_status = 'in-progress-atrisk';
      } else {
        l3Cap.build_status = 'in-progress-ontrack';
      }
    } else if (mode === 'execute') {
      const band = risk.operate_band?.toLowerCase();
      if (band === 'red') {
        l3Cap.execute_status = 'issues';
      } else if (band === 'amber') {
        l3Cap.execute_status = 'at-risk';
      } else {
        l3Cap.execute_status = 'ontrack';
      }
    }
  } else {
    // No risk data — leave build_status/execute_status undefined
    // The raw DB status (cap.status) will be shown instead
    if (mode === 'build') {
      l3Cap.build_status = 'not-due';
    }
    // Do NOT set execute_status — no risk data means we can't derive ontrack/at-risk/issues
  }

  return l3Cap;
}

/**
 * Derive status from Neo4j status string
 */
function deriveStatus(neoStatus: string): 'active' | 'pending' | 'at-risk' {
  if (neoStatus === 'active') return 'active';
  if (neoStatus === 'in_progress' || neoStatus === 'in-progress') return 'active';
  if (neoStatus === 'at_risk' || neoStatus === 'at-risk') return 'at-risk';
  return 'pending';
}


/**
 * Enrich L3 capability with EntityRisk data from nested object
 * Risk is now joined via MONITORED_BY relationship (SST v1.2 § 5.8)
 * 
 * MODE-AWARE FIELD MAPPING:
 *   BUILD mode: exposure_percent, expected_delay_days, likelihood_of_delay
 *   EXECUTE mode: operational health scores, exposure_trend (computed)
 */
function enrichWithRiskData(
  l3Cap: any,
  risk: any,
  mode: 'build' | 'execute' | null
): void {
  if (!risk) return;

  // Helper to normalize Neo4j Integer objects
  const normalizeInt = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && 'low' in val) return val.low;
    return parseInt(String(val)) || 0;
  };

  // Step 1: Always populate raw scores (used by multiple overlays)
  l3Cap.people_score = risk.people_score;
  l3Cap.process_score = risk.process_score;
  l3Cap.tools_score = risk.tools_score;
  l3Cap.likelihood_of_delay = risk.likelihood_of_delay;

  // expected_delay_days = likelihood_of_delay × delay_days (SST v1.2 § 5.9)
  l3Cap.expected_delay_days = Math.round(normalizeInt(risk.expected_delay_days) || 0);
  l3Cap._raw_delay_days = normalizeInt(risk.delay_days);

  // operational_health_pct from DB (already 0-100 scale per SST v1.2)
  if (risk.operational_health_pct != null) {
    l3Cap.operational_health_score = risk.operational_health_pct;
  }

  // Exposure percentages from risk engine output
  if (mode === 'build') {
    l3Cap.exposure_percent = risk.build_exposure_pct;
  } else if (mode === 'execute') {
    l3Cap.exposure_percent = risk.operate_exposure_pct_effective;
  }

  // Per-node thresholds from DB (Enterprise_Ontology_SST_v1.2 Section 5.4):
  // Override default band_green_max_pct=35 / band_amber_max_pct=65 if populated
  if (risk.threshold_green != null) {
    l3Cap._threshold_green = risk.threshold_green;
    l3Cap._threshold_amber = risk.threshold_amber;
  }
}

/**
 * Calculate derived overlay fields from raw risk data
 * Applies formulas from RISK_LOGIC_SPEC.md and ENTERPRISE_DESK_OVERLAY_SPECIFICATION.md
 */
function calculateOverlayFields(l3Cap: any, mode: 'build' | 'execute' | null): void {
  // ── Overlay 1: Risk Exposure ──
  // Spec: BUILD → build_exposure_pct = clamp01(risk_score / red_delay_days) × 100
  //        EXECUTE → operate_exposure = 100 - operational_health_pct

  const RED_DELAY_DAYS = 72; // from RISK_LOGIC_SPEC.md

  if (mode === 'build') {
    // risk_score = expected_delay_days = likelihood_of_delay × delay_days (already stored)
    const expectedDelay = l3Cap.expected_delay_days || 0;
    l3Cap.exposure_percent = Math.min(100, Math.max(0, (expectedDelay / RED_DELAY_DAYS) * 100));
  } else if (mode === 'execute') {
    // operational_health_score is already converted to 0-100 in enrichWithRiskData
    const healthPct = l3Cap.operational_health_score;
    if (healthPct != null) {
      l3Cap.exposure_percent = Math.max(0, 100 - healthPct);
    }
  }

  // ── Overlay 3: Footprint Stress (imbalance across People/Process/Tools) ──
  // Spec: range / 4 × 100, where 4 is max possible range on 1-5 scale
  const ps = l3Cap.people_score;
  const prs = l3Cap.process_score;
  const ts = l3Cap.tools_score;

  if (ps != null && prs != null && ts != null) {
    const maxScore = Math.max(ps, prs, ts);
    const minScore = Math.min(ps, prs, ts);
    const range = maxScore - minScore;
    const stressPct = (range / 4) * 100; // 4 = max possible range (5-1)

    const mean = (ps + prs + ts) / 3;
    l3Cap.org_gap = stressPct; // Use stress_pct for color intensity
    l3Cap.process_gap = stressPct;
    l3Cap.it_gap = stressPct;

    // Identify which dimension is the outlier (for display label)
    const orgGap = Math.abs(ps - mean);
    const processGap = Math.abs(prs - mean);
    const itGap = Math.abs(ts - mean);

    // Store individual gaps for tooltip display
    l3Cap._stress_dominant = orgGap >= processGap && orgGap >= itGap ? 'O' :
      processGap >= orgGap && processGap >= itGap ? 'P' : 'T';
    l3Cap._stress_severity = Math.ceil(range);
  }
}

/**
 * Calculate L1 maturity as average of all L3 descendants
 * Per data model: L3 -> L2 via parent_id, L2 -> L1 via parent_id
 */
function calculateL1Maturity(l2Children: NeoGraphNode[], l3Nodes: NeoGraphNode[]): number {
  if (l2Children.length === 0) return 3;

  // Get all L3 descendants: find L3s whose parent_id matches any L2 child's id
  const l2Ids = new Set(l2Children.map(l2 => l2.id));
  const l2Years = new Map(l2Children.map(l2 => [l2.id, getNeo4jInt(l2.year)]));

  const allMaturities = l3Nodes
    .filter(l3 => l2Ids.has(l3.parent_id) && getNeo4jInt(l3.parent_year) === l2Years.get(l3.parent_id))
    .map(l3 => getNeo4jInt(l3.maturity_level) || 3);

  return allMaturities.length > 0 ? Math.round(allMaturities.reduce((a, b) => a + b) / allMaturities.length) : 3;
}

/**
 * Calculate L1 target maturity as average of all L3 descendants
 */
function calculateL1TargetMaturity(l2Children: NeoGraphNode[], l3Nodes: NeoGraphNode[]): number {
  if (l2Children.length === 0) return 5;

  // Get all L3 descendants: find L3s whose parent_id matches any L2 child's id
  const l2Ids = new Set(l2Children.map(l2 => l2.id));
  const l2Years = new Map(l2Children.map(l2 => [l2.id, getNeo4jInt(l2.year)]));

  const allTargets = l3Nodes
    .filter(l3 => l2Ids.has(l3.parent_id) && getNeo4jInt(l3.parent_year) === l2Years.get(l3.parent_id))
    .map(l3 => typeof l3.target_maturity_level === 'string' ? parseInt(l3.target_maturity_level) : getNeo4jInt(l3.target_maturity_level) || 5);

  return allTargets.length > 0 ? Math.round(allTargets.reduce((a, b) => a + b) / allTargets.length) : 5;
}

/**
 * Calculate L2 maturity as average of L3 children
 */
function calculateL2Maturity(l3Nodes: NeoGraphNode[]): number {
  if (l3Nodes.length === 0) return 3;
  const maturities = l3Nodes.map(l3 => getNeo4jInt(l3.maturity_level) || 3);
  return Math.round(maturities.reduce((a, b) => a + b) / maturities.length);
}

/**
 * Calculate L2 target maturity as average of L3 children
 */
function calculateL2TargetMaturity(l3Nodes: NeoGraphNode[]): number {
  if (l3Nodes.length === 0) return 5;
  const targets = l3Nodes.map(l3 => typeof l3.target_maturity_level === 'string' ? parseInt(l3.target_maturity_level) : getNeo4jInt(l3.target_maturity_level) || 5);
  return Math.round(targets.reduce((a, b) => a + b) / targets.length);
}

