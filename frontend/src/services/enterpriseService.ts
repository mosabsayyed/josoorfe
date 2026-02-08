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

import { graphService } from './graphService';
import type { L1Capability, L2Capability, L3Capability } from '../types/enterprise';

// Backend response format: nodes have properties directly on them
// Numeric fields are Neo4j Integer objects: {low: number, high: number}
interface NeoGraphNode {
  id: string;              // WARNING: Backend puts elementId here, NOT business ID!
  elementId?: string;      // Neo4j element ID (4:...)
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

/**
 * L1 Business ID Fallback Mapping
 * Used when backend doesn't provide proper business ID in x.0 format
 */
const L1_NAME_TO_BUSINESS_ID: Record<string, string> = {
  'Sector Strategies, Policies': '1.0',
  'Strategic enablement of the water sector': '2.0',
  'Security management/ planning': '3.0',
  'Water sector regulation': '4.0',
  'Water Sector Development': '5.0',  // ← ADDED: Was missing, causing 5.0 branch absence
  'Monitoring and supervision of the water sector': '6.0'
};

/**
 * Extract business ID from node, with fallback strategies:
 * 1. Use properties.id if it matches x.0 pattern
 * 2. Fall back to name matching for L1 nodes (case-insensitive)
 * 3. For L2/L3, extract from element ID or use sequential fallback
 */

// Build a normalized (lowercase, trimmed) lookup map for case-insensitive matching
const L1_NAME_NORMALIZED_MAP: Map<string, string> = new Map(
  Object.entries(L1_NAME_TO_BUSINESS_ID).map(([name, id]) => [name.toLowerCase().trim(), id])
);

function extractBusinessId(node: NeoGraphNode): string {
  // Check if node has a property that might be the business ID
  // Backend might send it as a separate field or buried in properties
  const possibleId = (node as any).properties?.id || node.id;

  // Validate x.0 pattern (L1), x.y pattern (L2), or x.y.z pattern (L3)
  // Validate x.0 pattern (L1), x.y pattern (L2), or x.y.z pattern (L3)
  const businessIdPattern = /^\d+\.\d+(\.\d+)?$/;



  if (typeof possibleId === 'string' && businessIdPattern.test(possibleId)) {
    return possibleId;
  }

  // Fallback for L1: match by name (case-insensitive, trimmed)
  if (node.level === 'L1' && node.name) {
    const normalizedName = node.name.toLowerCase().trim();
    const mappedId = L1_NAME_NORMALIZED_MAP.get(normalizedName);
    if (mappedId) {
      return mappedId;
    }
    // Log unmapped L1 names for debugging
    console.warn(`[EnterpriseService] L1 node name not in mapping:`, node.name, '(normalized:', normalizedName + ')');


  }

  // If all else fails, return the element ID (will break hierarchy but at least won't crash)
  console.warn(`[EnterpriseService] Could not extract business ID for node:`, node.name, node.level);
  return node.id;
}

/**
 * Fetch capability matrix from Neo4j
 * Filters by year/quarter and constructs 3-level hierarchy
 */
/**
 * Fetch capability matrix using Direct Cypher via MCP (Port 8080)
 * This bypasses the generic /api/graph endpoint to:
 * 1. Exclude heavy embedding vectors
 * 2. execute precise cumulative filtering server-side
 * 3. Ensure "Rogue" internal IDs are cleaner
 */
async function fetchEnterpriseViaCypher(year: number | 'all', quarter: number | 'all'): Promise<NeoGraphData> {
  // MCP4 endpoint - uses Vite proxy to avoid CORS
  const endpoint = '/4/mcp/';

  // Construct Year/Quarter filters for Cypher
  // Logic: logical_year <= target_year
  const yearClause = year === 'all' ? '1=1' : `l.year <= ${year}`;

  // Note: Quarter logic is complex in cumulative queries if we want partial years.
  // For simplicity and correctness, we fetch all nodes up to the target year
  // and let the granular filter logic in transformNeo4jToMatrix handle exact quarter cutoffs,
  // OR we can rely on the fact that 'year' property in nodes usually implies full year presence unless 'quarter' restricts it.

  // Cypher Query:
  // 1. Match L1, L2, L3 nodes
  // 2. Filter by year (cumulative)
  // 3. Return explicit properties (NO EMBEDDINGS)
  // 4. Use COALESCE to prioritize businessId

  // SIMPLIFIED QUERY: Get ALL EntityCapability nodes with ALL properties
  // Years are accumulative: capabilities from previous years persist
  const yearFilter = year === 'all' ? '' : `WHERE cap.year <= ${year}`;

  const cypherQuery = `
    MATCH (cap:EntityCapability)
    ${yearFilter}
    RETURN cap {
      .*,
      embedding: null,
      vector: null,
      elementId: elementId(cap),
      businessId: cap.id
    } as capability
    ORDER BY cap.level, cap.id
  `;

  console.log('[EnterpriseService] 🚀 Executing Cypher via MCP:', { endpoint, year, querySnippet: cypherQuery.substring(0, 100) });

  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream' // Required by MCP
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token} `;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'read_neo4j_cypher',
        arguments: {
          query: cypherQuery
        }
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[EnterpriseService] MCP Call Failed:', response.status, text);
    throw new Error(`MCP Call Failed: ${response.status} `);
  }

  // Parse SSE-wrapped JSON-RPC response
  // Format: data: {"jsonrpc":"2.0","result":{...}}
  const text = await response.text();
  const lines = text.split('\n');
  const dataLine = lines.find(line => line.startsWith('data: '));

  if (!dataLine) {
    // Try to parse as raw JSON error
    try {
      const rawJson = JSON.parse(text);
      if (rawJson.error) {
        console.error('[EnterpriseService] MCP Returned Raw Error:', rawJson.error);
        throw new Error(`MCP Error: ${rawJson.error.message} `);
      }
    } catch (e) {
      // ignore
    }
    console.error('[EnterpriseService] Invalid SSE response format. Raw text:', text.substring(0, 500));
    console.log('[EnterpriseService] DEBUG: Full Raw Response:', text);
    throw new Error('Invalid SSE response from MCP');
  }

  const jsonRpc = JSON.parse(dataLine.substring(6));

  if (jsonRpc.error) {
    console.error('[EnterpriseService] JSON-RPC Error:', jsonRpc.error);
    throw new Error(`Cypher Execution Error: ${jsonRpc.error.message} `);
  }

  // Check tool execution error status
  if (jsonRpc.result?.isError) {
    const errorContent = jsonRpc.result.content?.[0]?.text;
    console.error('[EnterpriseService] Tool Logic Error:', errorContent);
    throw new Error(`Tool Execution Failed: ${errorContent} `);
  }

  // Tool result structure: result.content[0].text is a JSON string containing "data" array
  const innerContent = jsonRpc.result?.content?.[0]?.text;

  if (!innerContent) {
    console.warn('[EnterpriseService] Empty content from tool execution');
    return { nodes: [], links: [] };
  }

  // Parse the inner Cypher result
  // Structure: { data: [ { l1: {...}, l2: {...}, l3: {...}, risk: {...} }, ... ] }
  let cypherData;
  try {
    cypherData = JSON.parse(innerContent);
  } catch (e) {
    console.warn('[EnterpriseService] Failed to parse inner Cypher result:', innerContent);
    return { nodes: [], links: [] };
  }

  // Check if cypherData is directly the array (which happens with raw JSON response from some inputs)
  let rows = [];
  if (Array.isArray(cypherData)) {
    rows = cypherData;
  } else if (cypherData && Array.isArray(cypherData.data)) {
    rows = cypherData.data;
  } else {
    // If it's an error object, throw it
    if (cypherData?.code) {
      throw new Error(`Cypher Error ${cypherData.code}: ${cypherData.message} `);
    }
    console.error('[EnterpriseService] Unexpected Cypher response structure:', cypherData);
    return { nodes: [], links: [] };
  }

  // Transform simplified Cypher response to node array
  const nodes = rows.map((row: any) => {
    const cap = row.capability;
    if (!cap) return null;

    // Ensure businessId is set correctly (use cap.id which is the business ID like "1.0", "1.1", etc.)
    return {
      ...cap,
      id: cap.businessId || cap.id,
      businessId: cap.businessId || cap.id,
      group: 'EntityCapability',
      label: cap.name || cap.id,
      name: cap.name || cap.id
    };
  }).filter(Boolean) as NeoGraphNode[];

  console.log(`[EnterpriseService] ✅ Fetched ${nodes.length} capability nodes (year filter: ${year === 'all' ? 'all' : '<=' + year})`);

  return { nodes, links: [] };
}

export async function getCapabilityMatrix(
  year: number | 'all',
  quarter: number | 'all'
): Promise<L1Capability[]> {
  // Use new MCP Cypher fetcher
  const graphData = await fetchEnterpriseViaCypher(year, quarter);

  if (!graphData.nodes || graphData.nodes.length === 0) {
    console.warn('[EnterpriseService] No data found, returning empty.');
    return [];
  }

  const result = transformNeo4jToMatrix(graphData, year, quarter);
  return result;
}

/**
 * Transform flat Neo4j graph data into hierarchical L1→L2→L3 structure
 * Enriches L3 nodes with overlay data from EntityRisk relationships
 */
function transformNeo4jToMatrix(graphData: NeoGraphData, year: number | 'all', quarter: number | 'all'): L1Capability[] {
  // All nodes are already EntityCapability (from simplified query)
  // Year filter already applied in Cypher query (accumulative)
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

  return {
    id: l2BusinessId,
    name: l2Node.name || 'Unnamed L2',
    description: l2Node.description || '',
    maturity_level: calculateL2Maturity(l3Children),
    target_maturity_level: calculateL2TargetMaturity(l3Children),
    l3: l3Children.map(l3Node => buildL3(l3Node))
  };
}

/**
 * Build L3 capability (overlays removed for now - focus on core hierarchy)
 */
function buildL3(l3Node: NeoGraphNode): L3Capability {
  const l3BusinessId = (l3Node as any).businessId || l3Node.id;

  // Determine mode from status
  const mode = l3Node.status === 'active' ? 'execute' : 'build';

  // Base capability
  return {
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
    quarter: `Q${getNeo4jInt(l3Node.quarter)} ` as 'Q1' | 'Q2' | 'Q3' | 'Q4',

    // Build vs Execute status
    ...(mode === 'build' && { build_status: deriveBuildStatus(l3Node.status) }),
    ...(mode === 'execute' && { execute_status: deriveExecuteStatus(l3Node.status) })
  };
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
 * Derive build status from capability status
 */
function deriveBuildStatus(neoStatus: string): 'not-due' | 'planned' | 'in-progress-ontrack' | 'in-progress-atrisk' | 'in-progress-issues' {
  if (neoStatus === 'planned') return 'planned';
  if (neoStatus === 'in_progress' || neoStatus === 'in-progress') {
    return 'in-progress-ontrack'; // Could check EntityRisk for atrisk/issues
  }
  return 'planned';
}

/**
 * Derive execute status from capability status
 */
function deriveExecuteStatus(neoStatus: string): 'ontrack' | 'at-risk' | 'issues' {
  if (neoStatus === 'at_risk' || neoStatus === 'at-risk') return 'at-risk';
  return 'ontrack';
}

/**
 * Enrich L3 capability with EntityRisk data
 * 
 * MATCHING RULE (CRITICAL):
 * EntityRisk matches EntityCapability via COMPOSITE KEY:
 *   - risk.businessId === capability.id (business ID like "1.1.1")
 *   - risk.year === capability.year
 *   - risk.quarter === capability.quarter
 * 
 * Do NOT match by Neo4j elementId, name, or array position.
 * 
 * MODE-AWARE FIELD MAPPING:
 *   BUILD mode: exposure_percent, expected_delay_days, likelihood_of_delay
 *   EXECUTE mode: operational health scores, exposure_trend (computed)
 */
function enrichWithRiskData(
  l3Cap: any,
  riskNodes: NeoGraphNode[],
  mode: 'build' | 'execute' | null
): void {
  // Step 1: Find matching risk using composite key
  // Business ID + year + quarter must all match
  const matchingRisk = riskNodes.find(risk => {
    // Use businessId if available, otherwise fall back to id
    const riskBusinessId = (risk as any).businessId || risk.id;

    return (
      riskBusinessId === l3Cap.id &&
      getNeo4jInt(risk.year) === l3Cap.year &&
      getNeo4jInt(risk.quarter) === getNeo4jInt(l3Cap.quarter?.replace('Q', ''))
    );
  });

  if (!matchingRisk) {
    // No matching risk data - gracefully skip enrichment
    console.log(
      `[EnterpriseService] No matching risk found for capability ${l3Cap.id}(${l3Cap.year} / Q${l3Cap.quarter})`
    );
    return;
  }

  console.log(
    `[EnterpriseService] Matched risk for capability ${l3Cap.id}: enriching with mode = ${mode} `
  );

  // Step 2: Populate mode-specific fields

  if (mode === 'build') {
    // BUILD MODE: Delay/exposure during implementation phase
    l3Cap.exposure_percent = matchingRisk.build_exposure_pct;
    l3Cap.expected_delay_days = getNeo4jInt(matchingRisk.expected_delay_days);
    l3Cap.likelihood_of_delay = matchingRisk.likelihood_of_delay;
  } else if (mode === 'execute') {
    // EXECUTE MODE: Operational health and performance metrics
    l3Cap.exposure_percent = matchingRisk.operate_exposure_pct_effective;
    l3Cap.operational_health_score = matchingRisk.operational_health_score;
    l3Cap.people_score = matchingRisk.people_score;
    l3Cap.process_score = matchingRisk.process_score;
    l3Cap.tools_score = matchingRisk.tools_score;

    // Calculate exposure trend from health percentage progression
    const current = matchingRisk.current_operational_health_pct || 0;
    const prev = matchingRisk.prev_operational_health_pct || 0;
    const prev2 = matchingRisk.prev2_operational_health_pct || 0;

    if (current > prev && prev > prev2) {
      l3Cap.exposure_trend = 'improving';
    } else if (current < prev && prev < prev2) {
      l3Cap.exposure_trend = 'declining';
    } else {
      l3Cap.exposure_trend = 'stable';
    }
  }
}

/**
 * Convert 1-5 risk score to 0-100 gap percentage
 * Score: 5 = perfect (0% gap), 1 = critical (100% gap)
 */
function convertScoreToGap(score: number | undefined): number {
  if (!score) return 0;
  const clamped = Math.max(1, Math.min(5, score));
  return ((5 - clamped) / 4) * 100;
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
