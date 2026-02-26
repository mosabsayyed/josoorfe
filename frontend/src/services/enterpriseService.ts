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
// graphService import removed — Enterprise Desk now uses MCP router exclusively
// (Architecture Rule: ARCHITECTURE_API_Usage_Rules)

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
// MCP ROUTER — SINGLE DATA SOURCE (Architecture Rule: ARCHITECTURE_API_Usage_Rules)
// All chain queries, Cypher queries, and data fetching go through MCP router.
// Graph Server (port 3001) is ONLY for 3D visualization rendering.
// ═══════════════════════════════════════════════════════════════════════════

const MCP_ENDPOINT = '/1/mcp/'; // Noor MCP router (port 8201) — chains + cypher

/**
 * Call an MCP tool on /1/mcp/ (Noor) and return the parsed content.
 */
async function callMcpTool(toolName: string, args: Record<string, any>): Promise<any> {
  const endpoint = MCP_ENDPOINT;
  const body = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: { name: toolName, arguments: args }
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout per call

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) throw new Error(`MCP HTTP Error: ${response.status}`);

  // Server sends connection: close — response.text() works.
  // DO NOT use streaming reader (response.body.getReader()) — Vite proxy buffers SSE
  // responses and the reader hangs indefinitely.
  const text = await response.text();
  let result: any;
  try {
    result = JSON.parse(text);
  } catch {
    // SSE format: "event: message\ndata: {JSON}\n\n"
    const dataLine = text.split('\n').find(l => l.startsWith('data: '));
    if (!dataLine) throw new Error(`Invalid MCP response: ${text.substring(0, 200)}`);
    result = JSON.parse(dataLine.substring(6));
  }

  if (result.error) throw new Error(`MCP Error: ${result.error.message}`);
  if (result.result?.isError) {
    throw new Error(`MCP Tool Error: ${result.result.content.map((c: any) => c.text).join('\n')}`);
  }

  const contentText = result.result?.content?.[0]?.text;
  if (!contentText) {
    console.warn(`[EnterpriseService] callMcpTool(${toolName}): no content text`);
    return null;
  }

  return JSON.parse(contentText);
}


/**
 * Execute a read-only Cypher query via /1/mcp/ read_neo4j_cypher.
 * Single call with LIMIT 5000 — no pagination needed.
 */
async function runCypher(query: string): Promise<any[]> {
  const fullQuery = `${query}\nLIMIT 5000`;
  const result = await callMcpTool('read_neo4j_cypher', { cypher_query: fullQuery });
  const rows = Array.isArray(result) ? result : [];
  console.log(`[EnterpriseService] runCypher: ${rows.length} rows`);
  return rows;
}

/**
 * Execute an MCP chain tool with pagination. Fetches ALL pages and merges
 * nodes + relationships into a single {nodes, links} graph structure.
 *
 * Chain tools return: { results: [{nodes, relationships}], total_count, page, page_size, has_more }
 * We convert to: { nodes: [...], links: [...] } for compatibility with parseChain().
 */
/**
 * Chain response format (from ARCHITECTURE_MCP_Endpoints_Ground_Truth):
 *   { results: [{nId, nLabels, nProps, rType, rProps, sourceId, targetId}, ...],
 *     total_count, page, page_size, has_more }
 *
 * Each row is a traversal step: node (nId/nLabels/nProps) + relationship (rType/sourceId/targetId).
 * We split rows into unique nodes and links.
 */
async function runChainOnce(chainName: string, args: Record<string, any> = {}): Promise<{ nodes: any[]; links: any[] }> {
  const year = args.year ?? 0;
  const url = `/api/v1/chains/${chainName}?year=${year}`;
  console.log(`[EnterpriseService] chain GET ${url}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
  if (!response.ok) throw new Error(`Chain HTTP ${response.status}: ${chainName}`);

  const data = await response.json();
  // REST format: { results: [{ nodes: [{id, labels, properties}], relationships: [{type, start, end, properties}] }], count, ... }
  const envelope = data.results?.[0] || {};
  const rawNodes: any[] = envelope.nodes || [];
  const rawLinks: any[] = envelope.relationships || [];

  const nodes: any[] = [];
  const links: any[] = [];
  const seenNodeIds = new Set<string>();
  const seenLinkKeys = new Set<string>();

  for (const n of rawNodes) {
    const props = n.properties || {};
    const nId = n.id || props.id || props.domain_id || '';
    const labels = n.labels || [];
    if (nId && !seenNodeIds.has(nId)) {
      seenNodeIds.add(nId);
      nodes.push({ nId, nLabels: labels, nProps: props, id: nId, labels, properties: props });
    }
  }

  for (const r of rawLinks) {
    const rType = r.type || '';
    const sourceId = String(r.start ?? '');
    const targetId = String(r.end ?? '');
    if (rType && sourceId && targetId) {
      const linkKey = `${sourceId}_${rType}_${targetId}`;
      if (!seenLinkKeys.has(linkKey)) {
        seenLinkKeys.add(linkKey);
        links.push({ source: sourceId, target: targetId, type: rType, rType, sourceId, targetId, rProps: r.properties || {}, value: 1 });
      }
    }
  }

  console.log(`[EnterpriseService] ${chainName}: ${nodes.length} nodes, ${links.length} links (count=${data.count || 0})`);
  return { nodes, links };
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
  caps: any[];           // ALL EntityCapability — extracted from chains
  risks: any[];          // ALL EntityRisk — extracted from chains
  chainChangeToCap: any;    // change_to_capability chain {nodes, links}
  chainCapToPolicy: any;    // capability_to_policy chain {nodes, links}
  chainCapToPerf: any;      // capability_to_performance chain {nodes, links}
  processMetrics: any[]; // EntityProcess metrics — extracted from chains
  l2Kpis: any[];         // L2 KPIs — extracted from chains
}

/**
 * Extract EntityCapability, EntityRisk, EntityProcess, SectorPerformance
 * from chain node data. Replaces 4 direct Cypher queries.
 *
 * Chain node format: { nId, nLabels: ["EntityCapability"], nProps: { domain_id, name, ... } }
 * Chain link format: { sourceId, targetId, rType: "KNOWLEDGE_GAPS" }
 *
 * Output formats match what filterAndBuildGraph() expects:
 *   caps: flat array with { id, name, level, year, quarter, ... }
 *   risks: flat array with { id, name, year, quarter, build_band, ... }
 *   processMetrics: array of { cap_id, cap_year, proc: { id, name, actual, target, ... } }
 *   l2Kpis: array of { perf_id, perf_year, kpi: { ... }, inputs: [...] }
 */
function extractEntitiesFromChains(chains: Array<{ nodes: any[]; links: any[] }>): {
  caps: any[];
  risks: any[];
  processMetrics: any[];
  l2Kpis: any[];
} {
  // Deduplicate across chains by composite nId
  const capMap = new Map<string, any>();
  const riskMap = new Map<string, any>();
  const processMap = new Map<string, any>();  // nId → props
  const perfMap = new Map<string, any>();     // nId → props

  // Build global link index for relationship traversal
  const knowledgeGapsLinks: Array<{ source: string; target: string }> = [];
  const feedsIntoLinks: Array<{ source: string; target: string }> = [];

  for (const chain of chains) {
    if (!chain?.nodes) continue;

    // Extract nodes by label
    for (const n of chain.nodes) {
      const labels: string[] = n.nLabels || n.labels || [];
      const props = n.nProps || n.properties || {};
      const nId = String(n.nId ?? n.id ?? '');
      const label = labels.find(l => l !== 'Resource') || labels[0] || '';

      // Convert chain nProps (domain_id based) to the flat format filterAndBuildGraph expects
      // Chain props have domain_id as business ID; Cypher rows had .id as business ID
      const domainId = props.domain_id || nId.split(':')[1] || '';
      const yearRaw = props.year;
      const year = typeof yearRaw === 'object' && yearRaw?.low != null ? yearRaw.low : Number(yearRaw) || 0;
      const quarterRaw = props.quarter;
      const quarter = typeof quarterRaw === 'object' && quarterRaw?.low != null ? quarterRaw.low : Number(quarterRaw) || 0;

      if (label === 'EntityCapability') {
        const key = `${domainId}_${year}_${quarter}`;
        if (!capMap.has(key)) {
          capMap.set(key, {
            id: domainId,
            name: props.name || '',
            level: props.level || '',
            year,
            quarter,
            status: props.status || '',
            description: props.description || '',
            parent_id: props.parent_id || '',
            parent_year: typeof props.parent_year === 'object' ? props.parent_year?.low : Number(props.parent_year) || 0,
            maturity_level: typeof props.maturity_level === 'object' ? props.maturity_level?.low : Number(props.maturity_level) || 0,
            target_maturity_level: props.target_maturity_level,
            // ETL-computed fields
            build_status: props.build_status,
            execute_status: props.execute_status,
            kpi_achievement_pct: props.kpi_achievement_pct,
            build_exposure_pct: props.build_exposure_pct,
            regression_risk_pct: props.regression_risk_pct,
            people_score: props.people_score,
            tools_score: props.tools_score,
            process_score: props.process_score,
            dependency_count: typeof props.dependency_count === 'object' ? props.dependency_count?.low : props.dependency_count,
            exposure_normalized: props.exposure_normalized,
            _compositeId: nId,
          });
        }
      } else if (label === 'EntityRisk') {
        const key = `${domainId}_${year}_${quarter}`;
        if (!riskMap.has(key)) {
          riskMap.set(key, {
            id: domainId,
            name: props.name || '',
            year,
            quarter,
            level: props.level || '',
            build_band: props.build_band,
            operate_band: props.operate_band,
            build_exposure_pct: props.build_exposure_pct,
            operate_exposure_pct_effective: props.operate_exposure_pct_effective,
            expected_delay_days: typeof props.expected_delay_days === 'object' ? props.expected_delay_days?.low : props.expected_delay_days,
            delay_days: typeof props.delay_days === 'object' ? props.delay_days?.low : props.delay_days,
            likelihood_of_delay: props.likelihood_of_delay,
            operational_health_pct: props.operational_health_pct,
            people_score: props.people_score,
            process_score: props.process_score,
            tools_score: props.tools_score,
            threshold_green: props.threshold_green,
            threshold_amber: props.threshold_amber,
            risk_category: props.risk_category,
            risk_status: props.risk_status,
            prev_operational_health_pct: props.prev_operational_health_pct,
            prev2_operational_health_pct: props.prev2_operational_health_pct,
            operate_trend_flag: props.operate_trend_flag,
          });
        }
      } else if (label === 'EntityProcess') {
        if (!processMap.has(nId)) {
          processMap.set(nId, {
            _compositeId: nId,
            id: domainId,
            name: props.name || '',
            year,
            metric_name: props.metric_name,
            actual: props.actual,
            target: props.target,
            baseline: props.baseline,
            unit: props.unit,
            metric_type: props.metric_type,
            indicator_type: props.indicator_type,
            trend: props.trend,
            aggregation_method: props.aggregation_method,
            level: props.level || '',
          });
        }
      } else if (label === 'SectorPerformance') {
        if (!perfMap.has(nId)) {
          perfMap.set(nId, {
            _compositeId: nId,
            id: domainId,
            domain_id: domainId,
            name: props.name || '',
            year,
            actual_value: props.actual_value,
            target: props.target,
            unit: props.unit,
            formula_description: props.formula_description,
            level: props.level || '',
          });
        }
      }
    }

    // Collect relationship links for traversal
    for (const link of (chain.links || [])) {
      const rType = link.rType || link.type || '';
      const src = String(link.sourceId ?? link.source ?? '');
      const tgt = String(link.targetId ?? link.target ?? '');
      if (rType === 'KNOWLEDGE_GAPS') {
        knowledgeGapsLinks.push({ source: src, target: tgt });
      } else if (rType === 'FEEDS_INTO') {
        feedsIntoLinks.push({ source: src, target: tgt });
      }
    }
  }

  const caps = Array.from(capMap.values());
  const risks = Array.from(riskMap.values());

  // Build processMetrics: follow KNOWLEDGE_GAPS links from EntityCapability → EntityProcess
  // Format: { cap_id, cap_year, proc: { id, name, actual, target, ... } }
  const processMetrics: any[] = [];
  // Index caps by compositeId for fast lookup
  const capByCompositeId = new Map<string, any>();
  for (const c of caps) {
    if (c._compositeId) capByCompositeId.set(c._compositeId, c);
  }

  for (const link of knowledgeGapsLinks) {
    // Cap → Process (source=cap, target=process)
    const capNode = capByCompositeId.get(link.source);
    const procNode = processMap.get(link.target);
    if (capNode && procNode && capNode.level === procNode.level && procNode.metric_name) {
      processMetrics.push({
        cap_id: capNode.id,
        cap_year: capNode.year,
        proc: {
          id: procNode.id,
          name: procNode.name,
          year: procNode.year,
          metric_name: procNode.metric_name,
          actual: procNode.actual,
          target: procNode.target,
          baseline: procNode.baseline,
          unit: procNode.unit,
          metric_type: procNode.metric_type,
          indicator_type: procNode.indicator_type,
          trend: procNode.trend,
          aggregation_method: procNode.aggregation_method,
        },
      });
    }
    // Also check reverse direction (target=cap, source=process)
    const capNodeRev = capByCompositeId.get(link.target);
    const procNodeRev = processMap.get(link.source);
    if (capNodeRev && procNodeRev && capNodeRev.level === procNodeRev.level && procNodeRev.metric_name) {
      processMetrics.push({
        cap_id: capNodeRev.id,
        cap_year: capNodeRev.year,
        proc: {
          id: procNodeRev.id,
          name: procNodeRev.name,
          year: procNodeRev.year,
          metric_name: procNodeRev.metric_name,
          actual: procNodeRev.actual,
          target: procNodeRev.target,
          baseline: procNodeRev.baseline,
          unit: procNodeRev.unit,
          metric_type: procNodeRev.metric_type,
          indicator_type: procNodeRev.indicator_type,
          trend: procNodeRev.trend,
          aggregation_method: procNodeRev.aggregation_method,
        },
      });
    }
  }

  // Build l2Kpis: follow KNOWLEDGE_GAPS → FEEDS_INTO to find Process → SectorPerformance
  // Format: { perf_id, perf_year, kpi: { ... }, inputs: [...] }
  // First, build Process → SectorPerformance map via FEEDS_INTO
  const procToPerf = new Map<string, string[]>(); // processCompositeId → perfCompositeIds
  for (const link of feedsIntoLinks) {
    const procNode = processMap.get(link.source);
    const perfNode = perfMap.get(link.target);
    if (procNode && perfNode) {
      if (!procToPerf.has(link.source)) procToPerf.set(link.source, []);
      procToPerf.get(link.source)!.push(link.target);
    }
    // Reverse check
    const procNodeRev = processMap.get(link.target);
    const perfNodeRev = perfMap.get(link.source);
    if (procNodeRev && perfNodeRev) {
      if (!procToPerf.has(link.target)) procToPerf.set(link.target, []);
      procToPerf.get(link.target)!.push(link.source);
    }
  }

  // Group by SectorPerformance: for each perf node, collect all contributing processes + their cap
  const l2KpiAgg = new Map<string, { kpi: any; inputs: any[] }>();
  for (const pm of processMetrics) {
    // Find the process composite ID
    const procEntries = Array.from(processMap.entries());
    const procEntry = procEntries.find(([, p]) => p.id === pm.proc.id && p.year === pm.proc.year);
    if (!procEntry) continue;
    const [procCompositeId] = procEntry;
    const perfIds = procToPerf.get(procCompositeId) || [];
    for (const perfCompositeId of perfIds) {
      const perf = perfMap.get(perfCompositeId);
      if (!perf || perf.level !== 'L2') continue;
      // Year matching: process year must match perf year, and cap year must match process year
      if (perf.year && pm.proc.year && perf.year !== pm.proc.year) continue;
      if (pm.cap_year && pm.proc.year && pm.cap_year !== pm.proc.year) continue;

      const key = `${perf.id}_${perf.year}`;
      if (!l2KpiAgg.has(key)) {
        l2KpiAgg.set(key, {
          kpi: {
            id: perf.id,
            domain_id: perf.domain_id,
            name: perf.name,
            year: perf.year,
            actual_value: perf.actual_value,
            target: perf.target,
            unit: perf.unit,
            formula_description: perf.formula_description,
          },
          inputs: [],
        });
      }
      const entry = l2KpiAgg.get(key)!;
      if (!entry.inputs.find((i: any) => i.id === pm.proc.id && i.cap_id === pm.cap_id)) {
        entry.inputs.push({
          id: pm.proc.id,
          year: pm.proc.year,
          metric_name: pm.proc.metric_name,
          actual: pm.proc.actual,
          target: pm.proc.target,
          unit: pm.proc.unit,
          metric_type: pm.proc.metric_type,
          cap_id: pm.cap_id,
          cap_name: '', // Not critical — was available from Cypher but not used downstream
        });
      }
    }
  }

  const l2Kpis = Array.from(l2KpiAgg.values()).map(entry => ({
    perf_id: entry.kpi.id,
    perf_year: entry.kpi.year,
    kpi: entry.kpi,
    inputs: entry.inputs,
  }));

  return { caps, risks, processMetrics, l2Kpis };
}

let _rawDataCache: RawEnterpriseData | null = null;
let _rawDataPromise: Promise<RawEnterpriseData> | null = null;

/**
 * Parse Cypher rows into flat caps + risks arrays.
 */
function parseCypherRows(capsRisksRows: any[]): { caps: any[]; risks: any[] } {
  const caps: any[] = [];
  const risks: any[] = [];
  const seenCaps = new Set<string>();
  const seenRisks = new Set<string>();

  for (const row of capsRisksRows) {
    const c = row.cap;
    if (!c) continue;
    const domainId = c.domain_id || c.id || '';
    const year = typeof c.year === 'object' && c.year?.low != null ? c.year.low : Number(c.year) || 0;
    const quarter = typeof c.quarter === 'object' && c.quarter?.low != null ? c.quarter.low : Number(c.quarter) || 0;
    const capKey = `${domainId}_${year}_${quarter}`;

    if (!seenCaps.has(capKey)) {
      seenCaps.add(capKey);
      caps.push({
        id: domainId,
        name: c.name || '',
        level: c.level || '',
        year,
        quarter,
        status: c.status || '',
        description: c.description || '',
        parent_id: c.parent_id || '',
        parent_year: typeof c.parent_year === 'object' ? c.parent_year?.low : Number(c.parent_year) || 0,
        maturity_level: typeof c.maturity_level === 'object' ? c.maturity_level?.low : Number(c.maturity_level) || 0,
        target_maturity_level: c.target_maturity_level,
        // ETL-written fields — pass through to buildL3()
        build_status: c.build_status,
        execute_status: c.execute_status,
        kpi_achievement_pct: c.kpi_achievement_pct,
        build_exposure_pct: c.build_exposure_pct,
        regression_risk_pct: c.regression_risk_pct,
        people_score: c.people_score,
        tools_score: c.tools_score,
        process_score: c.process_score,
        dependency_count: c.dependency_count,
      });
    }

    const r = row.risk;
    if (!r) continue;
    const rDomainId = r.domain_id || r.id || '';
    const rYear = typeof r.year === 'object' && r.year?.low != null ? r.year.low : Number(r.year) || 0;
    const rQuarter = typeof r.quarter === 'object' && r.quarter?.low != null ? r.quarter.low : Number(r.quarter) || 0;
    const riskKey = `${rDomainId}_${rYear}_${rQuarter}`;

    if (!seenRisks.has(riskKey)) {
      seenRisks.add(riskKey);
      risks.push({
        id: rDomainId,
        name: r.name || '',
        year: rYear,
        quarter: rQuarter,
        level: r.level || '',
        build_band: r.build_band,
        operate_band: r.operate_band,
        build_exposure_pct: r.build_exposure_pct,
        operate_exposure_pct_effective: r.operate_exposure_pct_effective,
        expected_delay_days: typeof r.expected_delay_days === 'object' ? r.expected_delay_days?.low : r.expected_delay_days,
        delay_days: typeof r.delay_days === 'object' ? r.delay_days?.low : r.delay_days,
        likelihood_of_delay: r.likelihood_of_delay,
        operational_health_pct: r.operational_health_pct,
        people_score: r.people_score,
        process_score: r.process_score,
        tools_score: r.tools_score,
        threshold_green: r.threshold_green,
        threshold_amber: r.threshold_amber,
        risk_category: r.risk_category,
        risk_status: r.risk_status,
        prev_operational_health_pct: r.prev_operational_health_pct,
        prev2_operational_health_pct: r.prev2_operational_health_pct,
        operate_trend_flag: r.operate_trend_flag,
      });
    }
  }

  return { caps, risks };
}

/**
 * Fetch ALL enterprise data from 3 chains — single shot, no Cypher queries.
 *
 * Chains:
 *   1. change_to_capability — ChangeAdoption → Project → Gap → Capability
 *   2. capability_to_policy — Capability → Risk → PolicyTool → Objective
 *   3. capability_to_performance — Capability → Risk → Performance → Objective
 *
 * All node properties (ETL fields, scores, statuses) come from chain node properties.
 */

async function fetchAllEnterpriseData(): Promise<RawEnterpriseData> {
  if (_rawDataCache) return _rawDataCache;
  if (_rawDataPromise) return _rawDataPromise;

  _rawDataPromise = (async () => {
    console.log('[EnterpriseService] ONE-SHOT: 3 chains...');

    const safeChain = (name: string) =>
      runChainOnce(name, { year: 0 }).catch(err => {
        console.error(`[EnterpriseService] ${name} FAILED:`, err.message);
        return { nodes: [], links: [] };
      });

    // Sequential to avoid connection pool issues
    const chainChangeToCap = await safeChain('change_to_capability');
    const chainCapToPolicy = await safeChain('capability_to_policy');
    const chainCapToPerf = await safeChain('capability_to_performance');

    // Extract all entities from chains
    const extracted = extractEntitiesFromChains([chainChangeToCap, chainCapToPolicy, chainCapToPerf]);

    console.log(`[EnterpriseService] ALL DONE: changeToCap=${chainChangeToCap.nodes.length}, capToPolicy=${chainCapToPolicy.nodes.length}, capToPerf=${chainCapToPerf.nodes.length}`);
    console.log(`[EnterpriseService] Extracted: ${extracted.caps.length} caps, ${extracted.risks.length} risks, ${extracted.processMetrics.length} metrics, ${extracted.l2Kpis.length} KPIs`);

    _rawDataCache = {
      caps: extracted.caps,
      risks: extracted.risks,
      chainChangeToCap, chainCapToPolicy, chainCapToPerf,
      processMetrics: extracted.processMetrics,
      l2Kpis: extracted.l2Kpis,
    };

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
// CHAIN EXTRACTION — domain_id based, multi-hop graph traversal
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Chain node format:
 *   id: "EntityCapability:2.1.1:2025" (composite)
 *   labels: ["EntityCapability"]
 *   properties: { id: "EntityCapability:2.1.1:2025", domain_id: "2.1.1", name: "...", ... }
 * Chain link format:
 *   source: "EntityCapability:2.1.1:2025", target: "EntityRisk:2.1.1:2025", type: "MONITORED_BY"
 *
 * Topology is MULTI-HOP (not all entities link directly to caps):
 *   change_to_capability: ChangeAdoption→Project→Gap→Capability
 *   capability_to_policy: Capability→Risk→PolicyTool→Objective
 *   capability_to_performance: Capability→Risk→Performance→Objective
 *
 * Strategy: build undirected adjacency graph, BFS from each cap to find all
 * reachable entities, then associate by domain_id match or graph proximity.
 */
interface ChainNode {
  compositeId: string;   // e.g. "EntityCapability:2.1.1:2025"
  label: string;         // e.g. "EntityCapability"
  domainId: string;      // e.g. "2.1.1" (business ID)
  props: any;            // all properties
}

interface ChainResult {
  nodeById: Map<string, ChainNode>;  // compositeId -> ChainNode
  adjacency: Map<string, Set<string>>; // undirected adjacency (compositeId -> neighbors)
  capNodes: ChainNode[];  // EntityCapability nodes only
}

function parseChain(chainData: { nodes: any[]; links: any[] }): ChainResult {
  const nodeById = new Map<string, ChainNode>();
  const adjacency = new Map<string, Set<string>>();
  const capNodes: ChainNode[] = [];

  for (const n of chainData.nodes) {
    const props = n.nProps || n.properties || {};
    const labels: string[] = n.nLabels || n.labels || [];
    const compositeId = String(n.nId ?? n.id ?? '');
    const label = labels.find(l => l !== 'Resource') || labels[0] || 'Unknown';
    const domainId = props.domain_id || compositeId.split(':')[1] || '';

    const cn: ChainNode = { compositeId, label, domainId, props };
    nodeById.set(compositeId, cn);
    if (label === 'EntityCapability') capNodes.push(cn);
  }

  // Build undirected adjacency
  for (const link of (chainData.links || [])) {
    const src = String(link.sourceId ?? link.source ?? '');
    const tgt = String(link.targetId ?? link.target ?? '');
    if (!adjacency.has(src)) adjacency.set(src, new Set());
    if (!adjacency.has(tgt)) adjacency.set(tgt, new Set());
    adjacency.get(src)!.add(tgt);
    adjacency.get(tgt)!.add(src);
  }

  return { nodeById, adjacency, capNodes };
}

/**
 * Follow specific link from a node. Returns all neighbor composite IDs
 * connected via the given link type (either direction).
 */
function followLink(chain: ChainResult, fromId: string, linkType: string): string[] {
  const results: string[] = [];
  const neighbors = chain.adjacency.get(fromId);
  if (!neighbors) return results;

  // Check actual links for type match
  for (const link of chain.links) {
    const rType = link.rType ?? link.type ?? '';
    if (rType !== linkType) continue;
    const src = String(link.sourceId ?? link.source ?? '');
    const tgt = String(link.targetId ?? link.target ?? '');
    if (src === fromId) results.push(tgt);
    if (tgt === fromId) results.push(src);
  }
  return results;
}

/**
 * Get node props by composite ID, only if it matches expected label.
 * Ensures year from composite ID (e.g. "EntityProject:1.1.1:2025") is in props.
 */
function getNodeIfLabel(chain: ChainResult, compositeId: string, label: string): any | null {
  const node = chain.nodeById.get(compositeId);
  if (!node || node.label !== label) return null;
  const props = node.props;
  // Extract year from composite ID if not already in props
  if (props && !props.year) {
    const parts = compositeId.split(':');
    const lastPart = parts[parts.length - 1];
    const parsed = parseInt(lastPart, 10);
    if (parsed >= 2020 && parsed <= 2040) {
      props.year = parsed;
    }
  }
  return props;
}

/**
 * For each EntityCapability in the chain, follow SPECIFIC link paths to find
 * related entities. No blind BFS — each entity type has a known path.
 *
 * Direct (1 hop from cap):
 *   Cap → ROLE_GAPS → OrgUnit
 *   Cap → KNOWLEDGE_GAPS → Process
 *   Cap → AUTOMATION_GAPS → ITSystem
 *   Cap ↔ MONITORED_BY ↔ Risk
 *   PolicyTool → SETS_PRIORITIES → Cap (reversed)
 *
 * 2 hops (through risk or ITSystem):
 *   Cap → Risk → INFORMS → Performance
 *   Cap → Risk → INFORMS → PolicyTool
 *   Cap → ITSystem ← CLOSE_GAPS ← Project
 *
 * 3 hops (through risk → policyTool):
 *   Cap → Risk → PolicyTool → GOVERNED_BY → Objective
 */
function extractChainOverlays(chainData: { nodes: any[]; links: any[] }): Map<string, any> {
  const chain = parseChain(chainData);
  const overlayByCapId = new Map<string, any>();

  // Pre-index links by type for faster lookup
  const linksByType = new Map<string, { src: string; tgt: string }[]>();
  for (const link of (chainData.links || [])) {
    const rType = link.rType ?? link.type ?? '';
    if (!linksByType.has(rType)) linksByType.set(rType, []);
    const src = String(link.sourceId ?? link.source ?? '');
    const tgt = String(link.targetId ?? link.target ?? '');
    linksByType.get(rType)!.push({ src, tgt });
  }

  /** Find neighbors of `fromId` via `linkType` (either direction) */
  function neighbors(fromId: string, linkType: string): string[] {
    const links = linksByType.get(linkType) || [];
    const result: string[] = [];
    for (const { src, tgt } of links) {
      if (src === fromId) result.push(tgt);
      if (tgt === fromId) result.push(src);
    }
    return result;
  }

  for (const cap of chain.capNodes) {
    const overlay: any = {};
    const capId = cap.compositeId;

    // ── 1-hop: Risk (MONITORED_BY) ──
    const riskIds = neighbors(capId, 'MONITORED_BY');
    for (const rid of riskIds) {
      const riskProps = getNodeIfLabel(chain, rid, 'EntityRisk');
      if (riskProps && (riskProps.domain_id || '') === cap.domainId) {
        overlay.risk = riskProps;
        break;
      }
    }
    // Fallback: take first risk if domain_id didn't match
    if (!overlay.risk && riskIds.length > 0) {
      const riskProps = getNodeIfLabel(chain, riskIds[0], 'EntityRisk');
      if (riskProps) overlay.risk = riskProps;
    }

    // ── 1-hop: OrgUnit (ROLE_GAPS) ──
    const orgIds = neighbors(capId, 'ROLE_GAPS');
    const orgs: any[] = [];
    for (const oid of orgIds) {
      const p = getNodeIfLabel(chain, oid, 'EntityOrgUnit');
      if (p) orgs.push({ ...p, type: 'OrgUnit' });
    }

    // ── 1-hop: Process (KNOWLEDGE_GAPS) ──
    const procIds = neighbors(capId, 'KNOWLEDGE_GAPS');
    const procs: any[] = [];
    for (const pid of procIds) {
      const p = getNodeIfLabel(chain, pid, 'EntityProcess');
      if (p) procs.push({ ...p, type: 'Process' });
    }

    // ── 1-hop: ITSystem (AUTOMATION_GAPS) ──
    const itIds = neighbors(capId, 'AUTOMATION_GAPS');
    const its: any[] = [];
    for (const iid of itIds) {
      const p = getNodeIfLabel(chain, iid, 'EntityITSystem');
      if (p) its.push({ ...p, type: 'ITSystem' });
    }

    const entities = [...orgs, ...procs, ...its];
    if (entities.length > 0) overlay.operatingEntities = entities;

    // ── 1-hop reversed: PolicyTool → SETS_PRIORITIES → Cap ──
    const polDirectIds = neighbors(capId, 'SETS_PRIORITIES');
    const policyTools: any[] = [];
    for (const pid of polDirectIds) {
      const p = getNodeIfLabel(chain, pid, 'SectorPolicyTool');
      if (p) policyTools.push(p);
    }

    // ── 2-hop: Cap → Risk → INFORMS → Performance/PolicyTool ──
    // Also check Risk L2 parents: Cap → Risk(L3) ← PARENT_OF ← Risk(L2) → INFORMS
    // (capability_to_performance/capability_to_policy have INFORMS on L2 risk, not L3)
    const allRiskIds = new Set(riskIds);
    for (const rid of riskIds) {
      const riskNode = chain.nodeById.get(rid);
      if (!riskNode || riskNode.label !== 'EntityRisk') continue;
      // Find L2 risk parents via PARENT_OF (parent → child, so parent is neighbor)
      const parentIds = neighbors(rid, 'PARENT_OF');
      for (const pid of parentIds) {
        const parentNode = chain.nodeById.get(pid);
        if (parentNode?.label === 'EntityRisk') allRiskIds.add(pid);
      }
    }

    for (const rid of allRiskIds) {
      const riskNode = chain.nodeById.get(rid);
      if (!riskNode || riskNode.label !== 'EntityRisk') continue;

      const informsIds = neighbors(rid, 'INFORMS');
      for (const iid of informsIds) {
        const perfProps = getNodeIfLabel(chain, iid, 'SectorPerformance');
        if (perfProps) {
          if (!overlay.performanceTargets) overlay.performanceTargets = [];
          if (!overlay.performanceTargets.find((p: any) => p.domain_id === perfProps.domain_id)) {
            overlay.performanceTargets.push(perfProps);
          }
        }
        const polProps = getNodeIfLabel(chain, iid, 'SectorPolicyTool');
        if (polProps && !policyTools.find((p: any) => p.domain_id === polProps.domain_id)) {
          policyTools.push(polProps);
        }
      }
    }

    if (policyTools.length > 0) overlay.policyTools = policyTools;

    // ── 2-hop: Cap → Entity ← CLOSE_GAPS ← Project ──
    // Projects link through ALL three entity types, not just ITSystem
    // The entity type determines the pillar: OrgUnit=People, Process=Process, ITSystem=Tools
    const projects: any[] = [];
    const addProjectsFromEntity = (entityIds: string[], pillar: string) => {
      for (const eid of entityIds) {
        const closeGapsIds = neighbors(eid, 'CLOSE_GAPS');
        for (const pid of closeGapsIds) {
          const projProps = getNodeIfLabel(chain, pid, 'EntityProject');
          if (projProps && !projects.find((p: any) => p.domain_id === projProps.domain_id && p._pillar === pillar)) {
            projects.push({ ...projProps, _pillar: pillar });
          }
        }
      }
    };
    addProjectsFromEntity(orgIds, 'People');
    addProjectsFromEntity(procIds, 'Process');
    addProjectsFromEntity(itIds, 'Tools');
    if (projects.length > 0) overlay.linkedProjects = projects;

    // ── 3-hop: Cap → Risk → PolicyTool → GOVERNED_BY → Objective ──
    const objectives: any[] = [];
    for (const pol of policyTools) {
      const polNode = Array.from(chain.nodeById.values()).find(
        n => n.label === 'SectorPolicyTool' && n.domainId === pol.domain_id
      );
      if (!polNode) continue;

      const govIds = neighbors(polNode.compositeId, 'GOVERNED_BY');
      for (const gid of govIds) {
        const objProps = getNodeIfLabel(chain, gid, 'SectorObjective');
        if (objProps && !objectives.find((o: any) => o.domain_id === objProps.domain_id)) {
          objectives.push(objProps);
        }
      }
    }

    // ── operate path: Performance → (L1 parent) → AGGREGATES_TO → Objective ──
    if (overlay.performanceTargets) {
      for (const perf of overlay.performanceTargets) {
        // Find the composite ID of this performance node
        const perfNode = Array.from(chain.nodeById.values()).find(
          n => n.label === 'SectorPerformance' && n.domainId === perf.domain_id
        );
        if (!perfNode) continue;

        // Check AGGREGATES_TO directly and via L1 parent
        const perfIds = [perfNode.compositeId];
        const parentIds = neighbors(perfNode.compositeId, 'PARENT_OF');
        for (const pid of parentIds) {
          const pNode = chain.nodeById.get(pid);
          if (pNode?.label === 'SectorPerformance') perfIds.push(pid);
        }

        for (const pid of perfIds) {
          const aggIds = neighbors(pid, 'AGGREGATES_TO');
          for (const aid of aggIds) {
            const objProps = getNodeIfLabel(chain, aid, 'SectorObjective');
            if (objProps && !objectives.find((o: any) => o.domain_id === objProps.domain_id)) {
              objectives.push(objProps);
            }
          }
        }
      }
    }

    if (objectives.length > 0) overlay.objectives = objectives;

    // Key by domainId + year so each year gets its own overlay
    const capYear = cap.props?.year;
    const overlayKey = capYear ? `${cap.domainId}__${capYear}` : cap.domainId;
    overlayByCapId.set(overlayKey, overlay);
  }

  return overlayByCapId;
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

    // Pass through ETL-written fields
    (node as any).build_status = c.build_status;
    (node as any).execute_status = c.execute_status;
    (node as any).kpi_achievement_pct = c.kpi_achievement_pct;
    (node as any).build_exposure_pct = c.build_exposure_pct;
    (node as any).regression_risk_pct = c.regression_risk_pct;
    (node as any).people_score = c.people_score;
    (node as any).tools_score = c.tools_score;
    (node as any).process_score = c.process_score;
    (node as any).dependency_count = c.dependency_count;

    const risk = riskByKey.get(`${c.id}_${c.year}_${c.quarter}`);
    if (risk) {
      (node as any).risk = risk;
    }

    nodes.push(node);
  });

  // Step 5: Extract chain overlays via BFS (domain_id based, multi-hop)
  const nodeByBizId = new Map<string, NeoGraphNode>();
  for (const node of nodes) {
    nodeByBizId.set(node.id, node);
  }

  const chainDatasets = [raw.chainChangeToCap, raw.chainCapToPolicy, raw.chainCapToPerf].filter(d => d?.nodes);
  for (const chainData of chainDatasets) {
    const overlays = extractChainOverlays(chainData);

    for (const [overlayKey, overlay] of overlays) {
      // overlayKey is "domainId__year" or just "domainId"
      const parts = overlayKey.split('__');
      const capDomainId = parts[0];
      const overlayYear = parts[1] ? parseInt(parts[1], 10) : null;
      const node = nodeByBizId.get(capDomainId);
      if (!node) continue;
      // Only attach overlay if its year matches the node's year
      if (overlayYear && node.year && overlayYear !== node.year) continue;

      // Risk — supplement composite key match
      if (overlay.risk && !(node as any).risk) {
        (node as any).risk = overlay.risk;
      }

      // Projects — merge, dedup by domain_id, filter by year
      if (overlay.linkedProjects) {
        if (!(node as any).linkedProjects) (node as any).linkedProjects = [];
        for (const p of overlay.linkedProjects) {
          // Only attach projects matching the capability's year (or if no year set)
          if (p.year && node.year && p.year !== node.year) continue;
          if (!(node as any).linkedProjects.find((x: any) => x.domain_id === p.domain_id)) {
            (node as any).linkedProjects.push(p);
          }
        }
      }

      // Operating entities — merge, dedup by domain_id+type
      if (overlay.operatingEntities) {
        if (!(node as any).operatingEntities) (node as any).operatingEntities = [];
        for (const e of overlay.operatingEntities) {
          if (!(node as any).operatingEntities.find((x: any) => x.domain_id === e.domain_id && x.type === e.type)) {
            (node as any).operatingEntities.push(e);
          }
        }
      }

      // Performance targets — merge, dedup by domain_id
      if (overlay.performanceTargets) {
        if (!(node as any).performanceTargets) (node as any).performanceTargets = [];
        for (const p of overlay.performanceTargets) {
          if (!(node as any).performanceTargets.find((x: any) => x.domain_id === p.domain_id)) {
            (node as any).performanceTargets.push(p);
          }
        }
      }

      // Policy tools — merge, dedup by domain_id
      if (overlay.policyTools) {
        if (!(node as any).policyTools) (node as any).policyTools = [];
        for (const p of overlay.policyTools) {
          if (!(node as any).policyTools.find((x: any) => x.domain_id === p.domain_id)) {
            (node as any).policyTools.push(p);
          }
        }
      }

      // Objectives — merge, dedup by domain_id
      if (overlay.objectives) {
        if (!(node as any).objectives) (node as any).objectives = [];
        for (const o of overlay.objectives) {
          if (!(node as any).objectives.find((x: any) => x.domain_id === o.domain_id)) {
            (node as any).objectives.push(o);
          }
        }
      }
    }
  }

  // Step 6: Attach process metrics from direct Cypher query
  // Match by cap_id AND year — only attach the process for the node's year, dedup by process ID
  for (const pm of (raw.processMetrics || [])) {
    const capId = pm.cap_id;
    const capYear = pm.cap_year;
    const proc = pm.proc;
    if (!capId || !proc) continue;
    const node = nodeByBizId.get(capId);
    if (!node) continue;
    // Only attach if capability year matches the node's year
    if (capYear != null && node.year != null && capYear !== node.year) continue;
    // Only attach if process year matches the node's year
    if (proc.year != null && node.year != null && proc.year !== node.year) continue;
    if (!(node as any).processMetrics) (node as any).processMetrics = [];
    // Dedup: don't add same process ID twice
    if ((node as any).processMetrics.find((existing: any) => existing.id === proc.id)) continue;
    (node as any).processMetrics.push(proc);
  }

  // Step 7: Attach L2 KPI data (FEEDS_INTO path) — keyed by perf_id + year
  const l2KpiMap = new Map<string, { kpi: any; inputs: any[] }>();
  for (const row of (raw.l2Kpis || [])) {
    const perfId = row.perf_id || row.kpi?.id;
    const perfYear = row.perf_year || row.kpi?.year;
    if (!perfId) continue;
    const key = `${perfId}_${perfYear || ''}`;
    if (!l2KpiMap.has(key)) {
      l2KpiMap.set(key, { kpi: row.kpi, inputs: row.inputs || [] });
    } else {
      // Merge inputs from multiple rows
      const existing = l2KpiMap.get(key)!;
      for (const inp of (row.inputs || [])) {
        if (!existing.inputs.find((i: any) => i.id === inp.id && i.cap_id === inp.cap_id)) {
          existing.inputs.push(inp);
        }
      }
    }
  }
  // Attach to nodes — match by process ID AND year
  for (const node of nodes) {
    const nodeYear = node.year;
    const procMetrics = (node as any).processMetrics || [];
    for (const pm of procMetrics) {
      for (const [key, data] of l2KpiMap) {
        const kpiYear = data.kpi?.year;
        // Only attach KPIs from the same year as the capability node
        if (kpiYear != null && nodeYear != null && kpiYear !== nodeYear) continue;
        if (data.inputs.find((inp: any) => inp.id === pm.id)) {
          if (!(node as any).l2Kpis) (node as any).l2Kpis = [];
          if (!(node as any).l2Kpis.find((k: any) => (k.kpi.id || k.kpi.domain_id) === (data.kpi.id || data.kpi.domain_id) && k.kpi.year === kpiYear)) {
            (node as any).l2Kpis.push(data);
          }
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
  const withProcessMetrics = nodes.filter(n => (n as any).processMetrics?.length > 0).length;
  console.log(`[EnterpriseService] Result: ${nodes.length} caps (L1:${l1Count}, L2:${l2Count}, L3:${l3Count}), risk: ${withRisk}, projects: ${withProjects}, entities: ${withEntities}, processMetrics: ${withProcessMetrics}`);

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

  // R9: Collect upward chain data from L2 node + aggregate from L3 children
  const policyTools = [...((l2Node as any).policyTools || []).filter((p: any) => p != null)];
  const performanceTargets = [...((l2Node as any).performanceTargets || []).filter((p: any) => p != null)];
  const objectives = [...((l2Node as any).objectives || []).filter((o: any) => o != null)];

  // Aggregate overlay data from L3 children (chain overlays attach to L3, not L2)
  for (const l3 of l3Children) {
    for (const pt of ((l3 as any).policyTools || [])) {
      if (pt && !policyTools.find((p: any) => p.domain_id === pt.domain_id)) policyTools.push(pt);
    }
    for (const perf of ((l3 as any).performanceTargets || [])) {
      if (perf && !performanceTargets.find((p: any) => p.domain_id === perf.domain_id)) performanceTargets.push(perf);
    }
    for (const obj of ((l3 as any).objectives || [])) {
      if (obj && !objectives.find((o: any) => o.domain_id === obj.domain_id)) objectives.push(obj);
    }
  }

  // Deduplicate objectives by id
  const uniqueObjectives = objectives.filter((o: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === o.id || x.domain_id === o.domain_id) === i);

  const l3Caps = l3Children.map(l3Node => buildL3(l3Node));

  return {
    id: l2BusinessId,
    name: l2Node.name || 'Unnamed L2',
    description: l2Node.description || '',
    maturity_level: calculateL2Maturity(l3Children),
    target_maturity_level: calculateL2TargetMaturity(l3Children),
    kpi_achievement_pct: (l2Node as any).kpi_achievement_pct != null ? Number((l2Node as any).kpi_achievement_pct) : undefined,
    execute_status: (l2Node as any).execute_status,
    build_status: (l2Node as any).build_status,
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

  // DIAGNOSTIC: Log first 3 L3 nodes to see raw data from Neo4j
  if (!(buildL3 as any)._logCount) (buildL3 as any)._logCount = 0;
  if ((buildL3 as any)._logCount < 3) {
    (buildL3 as any)._logCount++;
    const n = l3Node as any;
    console.log(`[buildL3 RAW #${(buildL3 as any)._logCount}] id=${n.id} status=${n.status} build_status=${n.build_status} execute_status=${n.execute_status} kpi_achievement_pct=${n.kpi_achievement_pct} build_exposure_pct=${n.build_exposure_pct} people_score=${n.people_score} tools_score=${n.tools_score} process_score=${n.process_score} dependency_count=${n.dependency_count} maturity_level=${n.maturity_level} target_maturity_level=${n.target_maturity_level} risk=`, n.risk ? { build_band: n.risk.build_band, operate_band: n.risk.operate_band } : 'none');
  }

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
    mode,
    build_status: (l3Node as any).build_status,
    execute_status: (l3Node as any).execute_status,
    kpi_achievement_pct: (l3Node as any).kpi_achievement_pct != null ? Number((l3Node as any).kpi_achievement_pct) : undefined,
    build_exposure_pct: (l3Node as any).build_exposure_pct != null ? Number((l3Node as any).build_exposure_pct) : undefined,
    people_score: (l3Node as any).people_score != null ? Number((l3Node as any).people_score) : undefined,
    process_score: (l3Node as any).process_score != null ? Number((l3Node as any).process_score) : undefined,
    tools_score: (l3Node as any).tools_score != null ? Number((l3Node as any).tools_score) : undefined,
    year: getNeo4jInt(l3Node.year),
    quarter: `Q${getNeo4jInt(l3Node.quarter)}` as 'Q1' | 'Q2' | 'Q3' | 'Q4'
  };

  // Store raw capability properties for detail panel (exclude internal fields)
  const { risk: _risk, embedding: _emb, vector: _vec, elementId: _eid, linkedProjects: _lp, operatingEntities: _oe, performanceTargets: _pt, policyTools: _pol, objectives: _obj, ...capProps } = l3Node as any;
  l3Cap.rawCapability = capProps;
  // Store linked data from initial query (no extra DB calls needed)
  l3Cap.rawCapability.linkedProjects = (l3Node as any).linkedProjects || [];
  l3Cap.rawCapability.operatingEntities = (l3Node as any).operatingEntities || [];
  // NOTE: performanceTargets, policyTools, objectives are NOT attached to L3 rawCapability
  // They come from chain traversal and produce garbage data at L3 level.
  // They are only meaningful at L2 level (attached via buildL2 upwardChain).
  l3Cap.rawCapability.processMetrics = (l3Node as any).processMetrics || [];
  l3Cap.rawCapability.l2Kpis = (l3Node as any).l2Kpis || [];

  // Dependency count from ETL — no fallback
  const nodeDepCount = (l3Node as any).dependency_count;
  l3Cap.dependency_count = nodeDepCount != null
    ? (typeof nodeDepCount === 'object' && 'low' in nodeDepCount ? nodeDepCount.low : Number(nodeDepCount))
    : 0;

  // Exposure normalized (0-100) — importance for heatmaps
  l3Cap.exposure_normalized = (l3Node as any).exposure_normalized != null
    ? getNeo4jInt((l3Node as any).exposure_normalized)
    : undefined;

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

  // Store raw risk for detail panel's collapsible section
  if (l3Node.risk) {
    l3Cap.rawRisk = l3Node.risk;
  }

  // KPI achievement (must be set before strip status computation)
  l3Cap.kpi_achievement_pct = (l3Node as any).kpi_achievement_pct != null
    ? getNeo4jInt((l3Node as any).kpi_achievement_pct)
    : undefined;

  // Design Doc 6.3: Strip Is a Stored Value. Read it. Period.
  // ETL writes build_status / execute_status. If null → undefined (no strip shown).
  if (mode === 'build') {
    l3Cap.build_status = (l3Node as any).build_status || undefined;
  } else {
    l3Cap.execute_status = (l3Node as any).execute_status || undefined;
  }

  // Dimension scores: capability node first, then risk node fallback
  const risk = (l3Node as any).risk;
  l3Cap.people_score = (l3Node as any).people_score != null
    ? getNeo4jInt((l3Node as any).people_score)
    : (risk?.people_score != null ? getNeo4jInt(risk.people_score) : undefined);
  l3Cap.tools_score = (l3Node as any).tools_score != null
    ? getNeo4jInt((l3Node as any).tools_score)
    : (risk?.tools_score != null ? getNeo4jInt(risk.tools_score) : undefined);
  l3Cap.process_score = (l3Node as any).process_score != null
    ? getNeo4jInt((l3Node as any).process_score)
    : (risk?.process_score != null ? getNeo4jInt(risk.process_score) : undefined);

  // Exposure
  l3Cap.exposure_percent = mode === 'build'
    ? (getNeo4jInt((l3Node as any).build_exposure_pct) || getNeo4jInt(risk?.build_exposure_pct))
    : (getNeo4jInt((l3Node as any).regression_risk_pct) || getNeo4jInt(risk?.operate_exposure_pct_effective));

  return l3Cap;
}

/**
 * Derive status from Neo4j status string
 */
function deriveStatus(neoStatus: string): 'active' | 'pending' | 'at-risk' {
  if (neoStatus === 'active') return 'active';
  if (neoStatus === 'in_progress' || neoStatus === 'in-progress' || neoStatus === 'in progress') return 'active';
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

