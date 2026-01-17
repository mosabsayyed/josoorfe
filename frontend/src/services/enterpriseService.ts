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
  'Monitoring and supervision of the water sector': '6.0'
};

/**
 * Extract business ID from node, with fallback strategies:
 * 1. Use properties.id if it matches x.0 pattern
 * 2. Fall back to name matching for L1 nodes
 * 3. For L2/L3, extract from element ID or use sequential fallback
 */
function extractBusinessId(node: NeoGraphNode): string {
  // Check if node has a property that might be the business ID
  // Backend might send it as a separate field or buried in properties
  const possibleId = (node as any).properties?.id || node.id;
  
  // Validate x.0 pattern (L1), x.y pattern (L2), or x.y.z pattern (L3)
  const businessIdPattern = /^\d+\.\d+(\.\d+)?$/;
  if (typeof possibleId === 'string' && businessIdPattern.test(possibleId)) {
    return possibleId;
  }
  
  // Fallback for L1: match by name
  if (node.level === 'L1' && node.name) {
    const mappedId = L1_NAME_TO_BUSINESS_ID[node.name];
    if (mappedId) {
      return mappedId;
    }
  }
  
  // If all else fails, return the element ID (will break hierarchy but at least won't crash)
  console.warn(`[EnterpriseService] Could not extract business ID for node:`, node.name, node.level);
  return node.id;
}

/**
 * Fetch capability matrix from Neo4j
 * Filters by year/quarter and constructs 3-level hierarchy
 */
export async function getCapabilityMatrix(
  year: number | 'all',
  quarter: number | 'all'
): Promise<L1Capability[]> {
  console.log('[EnterpriseService] 📡 Fetching capability matrix at', new Date().toISOString(), { year, quarter });
  
  const params: Record<string, string> = {
    nodeLabels: 'EntityCapability,EntityRisk',
    excludeEmbeddings: 'true'
  };

  // Backend uses 'years' (plural) parameter - always fetch all data, filter client-side
  // ExplorerDesk pattern: params.append('years', year) and params.append('quarter', quarter)

  console.log('[EnterpriseService] 📤 Request params:', params);
  
  const graphData = await graphService.getGraph(params);
  
  console.log('[EnterpriseService] 📥 Response:', {
    nodeCount: graphData.nodes?.length || 0,
    linkCount: graphData.links?.length || 0,
    timestamp: new Date().toISOString()
  });
  
  if (!graphData.nodes || graphData.nodes.length === 0) {
    throw new Error('No capability data returned from Neo4j');
  }
  
  const result = transformNeo4jToMatrix(graphData, year, quarter);
  console.log('[EnterpriseService] ✅ Transformed to matrix:', {
    l1Count: result.length,
    totalL3: result.reduce((sum, l1) => sum + l1.l2.reduce((s, l2) => s + l2.l3.length, 0), 0)
  });
  
  return result;
}

/**
 * Transform flat Neo4j graph data into hierarchical L1→L2→L3 structure
 * Enriches L3 nodes with overlay data from EntityRisk relationships
 */
function transformNeo4jToMatrix(graphData: NeoGraphData, year: number | 'all', quarter: number | 'all'): L1Capability[] {
  // Filter capability nodes for selected period
  // NOTE: Capabilities are CUMULATIVE - selecting 2026 Q3 shows all of 2025 + 2026 Q1-Q3
  // Filter logic: (year < selectedYear) OR (year === selectedYear AND quarter <= selectedQuarter)
  
  const capabilityNodesAll = graphData.nodes.filter(n => n.group === 'EntityCapability');
  const capabilityNodes = capabilityNodesAll.filter(n => {
    const nodeYear = getNeo4jInt(n.year);
    const nodeQuarter = getNeo4jInt(n.quarter);
    
    // Show all if year is 'all'
    if (year === 'all') return true;
    
    // Cumulative filter: show all years up to and including selected year
    if (nodeYear < year) return true;
    if (nodeYear === year) {
      // Cumulative quarter filter: show all quarters up to selected quarter
      return (quarter === 'all' || nodeQuarter <= quarter);
    }
    
    return false; // Exclude future years
  });

  // Extract EntityRisk nodes for overlay enrichment (Overlay 1: Risk Exposure)
  const riskNodesAll = graphData.nodes.filter(n => n.group === 'EntityRisk');
  const riskNodes = riskNodesAll.filter(n => {
    const nodeYear = getNeo4jInt(n.year);
    const nodeQuarter = getNeo4jInt(n.quarter);
    
    // Show all if year is 'all'
    if (year === 'all') return true;
    
    // Cumulative filter: match capability nodes filter
    if (nodeYear < year) return true;
    if (nodeYear === year) {
      return (quarter === 'all' || nodeQuarter <= quarter);
    }
    
    return false;
  });

  // Extract business IDs for risk nodes
  riskNodes.forEach(n => {
    (n as any).businessId = extractBusinessId(n);
  });

  console.log('[EnterpriseService] Filtered capabilities and risks:', {
    totalNodes: graphData.nodes.length,
    capabilityNodes: graphData.nodes.filter(n => n.group === 'EntityCapability').length,
    riskNodes: graphData.nodes.filter(n => n.group === 'EntityRisk').length,
    afterYearQuarterFilter: { capabilities: capabilityNodes.length, risks: riskNodes.length },
    filters: { year, quarter }
  });

  // Separate by level
  const l1Nodes = capabilityNodes.filter(n => n.level === 'L1');
  const l2Nodes = capabilityNodes.filter(n => n.level === 'L2');
  const l3Nodes = capabilityNodes.filter(n => n.level === 'L3');

  // Extract business IDs for L1 (using name mapping)
  l1Nodes.forEach(n => (n as any).businessId = extractBusinessId(n));
  
  // Deduplicate L1 nodes by businessId - keep most recent year/quarter
  const l1ByBusinessId = new Map<string, NeoGraphNode>();
  l1Nodes.forEach(l1 => {
    const bizId = (l1 as any).businessId;
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
  
  console.log('[EnterpriseService] L1 deduplication:', {
    originalCount: l1Nodes.length,
    deduplicatedCount: deduplicatedL1Nodes.length,
    uniqueIds: Array.from(l1ByBusinessId.keys())
  });

  // Generate business IDs for L2 based on parent_id (backend doesn't provide them)
  const l2ByParent = new Map<string, NeoGraphNode[]>();
  l2Nodes.forEach(l2 => {
    const parentKey = l2.parent_id + '_' + getNeo4jInt(l2.parent_year);
    if (!l2ByParent.has(parentKey)) {
      l2ByParent.set(parentKey, []);
    }
    l2ByParent.get(parentKey)!.push(l2);
  });

  // Assign sequential L2 business IDs: parent "1.0" → children "1.1", "1.2", "1.3", etc.
  l2Nodes.forEach(l2 => {
    const parentId = l2.parent_id;
    if (!parentId) {
      console.warn('[EnterpriseService] L2 node missing parent_id:', l2.name);
      (l2 as any).businessId = l2.id; // fallback to element ID
      return;
    }
    
    const parentKey = parentId + '_' + getNeo4jInt(l2.parent_year);
    const siblings = l2ByParent.get(parentKey) || [];
    const index = siblings.indexOf(l2) + 1;
    (l2 as any).businessId = `${parentId.replace('.0', '')}.${index}`;
  });

  // Generate business IDs for L3 based on L2 businessId (L3.parent_id already contains L2 businessId!)
  const l3ByParent = new Map<string, NeoGraphNode[]>();
  l3Nodes.forEach(l3 => {
    const parentKey = l3.parent_id + '_' + getNeo4jInt(l3.parent_year);
    if (!l3ByParent.has(parentKey)) {
      l3ByParent.set(parentKey, []);
    }
    l3ByParent.get(parentKey)!.push(l3);
  });

  // Assign sequential L3 business IDs: parent "1.1" → children "1.1.1", "1.1.2", "1.1.3", etc.
  l3Nodes.forEach(l3 => {
    const parentBusinessId = l3.parent_id; // L3.parent_id IS the L2 business ID
    if (!parentBusinessId) {
      console.warn('[EnterpriseService] L3 node missing parent_id:', l3.name);
      (l3 as any).businessId = l3.id; // fallback to element ID
      return;
    }
    
    const parentKey = parentBusinessId + '_' + getNeo4jInt(l3.parent_year);
    const siblings = l3ByParent.get(parentKey) || [];
    const index = siblings.indexOf(l3) + 1;
    (l3 as any).businessId = `${parentBusinessId}.${index}`;
  });

  console.log('[EnterpriseService] Hierarchy breakdown:', {
    l1Count: deduplicatedL1Nodes.length,
    l2Count: l2Nodes.length,
    l3Count: l3Nodes.length,
    businessIdExtraction: {
      l1_businessId: (deduplicatedL1Nodes[0] as any)?.businessId,
      l1_elementId: deduplicatedL1Nodes[0]?.id,
      l2_businessId: (l2Nodes[0] as any)?.businessId,
      l2_parent_id: l2Nodes[0]?.parent_id,
      shouldMatch: (l2Nodes[0] as any)?.businessId && l2Nodes[0]?.parent_id
    },
    sampleMatches: l2Nodes.slice(0, 3).map(l2 => ({
      l2Name: l2.name,
      parent_id: l2.parent_id,
      matchingL1: deduplicatedL1Nodes.find(l1 => (l1 as any).businessId === l2.parent_id)?.name
    })),
    l3Debug: {
      l3_businessId: (l3Nodes[0] as any)?.businessId,
      l3_parent_id: l3Nodes[0]?.parent_id,
      l3_parent_year: l3Nodes[0]?.parent_year,
      l2_elementId: l2Nodes[0]?.id,
      l3_sample_names: l3Nodes.slice(0, 3).map(n => n.name),
      matchingL2: l2Nodes.find(l2 => l2.id === l3Nodes[0]?.parent_id)?.name
    }
  });

  // Sort L1 nodes by business ID for consistent display order
  const sortedL1Nodes = deduplicatedL1Nodes.sort((a, b) => {
    const aId = (a as any).businessId || a.id;
    const bId = (b as any).businessId || b.id;
    return aId.localeCompare(bId, undefined, { numeric: true });
  });

  // Build hierarchy using parent_id matching (parent_year check REMOVED - year filter applied earlier)
  return sortedL1Nodes.map(l1Node => buildL1(l1Node, l2Nodes, l3Nodes));
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
    quarter: `Q${getNeo4jInt(l3Node.quarter)}` as 'Q1' | 'Q2' | 'Q3' | 'Q4',

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
      `[EnterpriseService] No matching risk found for capability ${l3Cap.id} (${l3Cap.year}/Q${l3Cap.quarter})`
    );
    return;
  }

  console.log(
    `[EnterpriseService] Matched risk for capability ${l3Cap.id}: enriching with mode=${mode}`
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
