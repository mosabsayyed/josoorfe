import { PolicyCategory } from '../components/desks/sector/SectorPolicyClassifier';

// Configuration
// ALIGNMENT FIX: Restored trailing slash per User's working CURL command
const MCP_ENDPOINT = '/4/mcp/'; // Proxied to https://betaBE.aitwintech.com/4/mcp/

interface JsonRpcRequest {
    jsonrpc: '2.0';
    id: number | string;
    method: string;
    params: {
        name: string;
        arguments: Record<string, any>;
    };
}

interface JsonRpcResponse<T = any> {
    jsonrpc: '2.0';
    id: number | string;
    result?: {
        content: Array<{ type: string; text: string }>;
        isError: boolean;
    };
    error?: {
        code: number;
        message: string;
    };
}

/**
 * Call the Neo4j MCP Tool (read_neo4j_cypher)
 * Follows the specific protocol defined in SYSTEM_API_CATALOG_v1.4.md
 */
async function callNeo4jTool(toolName: string, args: Record<string, any>): Promise<any> {
    const requestBody: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
            name: toolName,
            arguments: args
        }
    };

    console.log(`[Neo4jMCP] Calling tool ${toolName}...`, args);

    try {
        const response = await fetch(MCP_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // ALIGNMENT FIX: Restored text/event-stream per User's CURL command
                'Accept': 'application/json, text/event-stream'
            },
            body: JSON.stringify(requestBody)
        });

        console.log(`[Neo4jMCP] Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const rawText = await response.text();
            console.error('[Neo4jMCP] Error Raw Body:', rawText.substring(0, 500));
            throw new Error(`MCP HTTP Error: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();

        // PARSING STRATEGY: Robust for both JSON and SSE
        let result: JsonRpcResponse;

        // 1. Try Direct JSON first (Common for errors or simple responses)
        try {
            const json = JSON.parse(text);
            if (json.jsonrpc) {
                result = json;
            } else {
                throw new Error("Not a JSON-RPC response");
            }
        } catch (e) {
            // 2. Fallback to SSE Parsing (Standard MCP behavior)
            const lines = text.split('\n');
            const dataLine = lines.find(line => line.startsWith('data: '));

            if (!dataLine) {
                console.error('[Neo4jMCP] Failed parse. Raw text:', text.substring(0, 200));
                throw new Error('Invalid MCP response format: No JSON or SSE data found');
            }

            const jsonStr = dataLine.substring(6); // Remove "data: "
            result = JSON.parse(jsonStr);
        }

        if (result.error) {
            throw new Error(`MCP JSON-RPC Error: ${result.error.message}`);
        }

        if (result.result?.isError) {
            const errorContent = result.result.content.map(c => c.text).join('\n');
            throw new Error(`Tool Execution Error: ${errorContent}`);
        }

        const contentText = result.result?.content[0]?.text;
        if (!contentText) return null;

        try {
            return JSON.parse(contentText);
        } catch (e) {
            return contentText;
        }

    } catch (err) {
        console.error('[Neo4jMCP] Request failed details:', err);
        throw err;
    }
}

// --- Policy Tool Risk Data Types ---
export interface PolicyToolRiskRow {
  l1: { id: string; name: string; year: number; level: string } | null;
  l2: { id: string; name: string; year: number; level: string; parent_id: string } | null;
  cap: { id: string; name: string; level: string } | null;
  risk: { build_band: string | null; operate_band: string | null; build_exposure_pct: number | null; expected_delay_days: number | null; likelihood_of_delay: number | null } | null;
  source?: 'build' | 'operate';
}

export interface L2DetailCap {
  capId: string;
  capName: string;
  capLevel: string;
  buildBand: string | null;
}

export interface L1RiskAggregation {
  l1Name: string;
  worstBand: 'red' | 'amber' | 'green' | 'none';
  l2Details: Array<{
    l2Id: string;
    l2Name: string;
    worstBand: string | null;
    caps: L2DetailCap[];
  }>;
}

export interface PolicyToolItem {
    name: string;
    childCount: number;
    category: PolicyCategory;
    effectiveCount: number;
}

// Map L1 Names to Categories
export const L1_CATEGORY_MAP: Record<string, PolicyCategory> = {
    // Enforce
    'Policy Tool for Compliance Rate': 'Enforce',
    'Policy Tool for Environmental Compliance Rate': 'Enforce',
    'Policy Tool for Resource Efficiency': 'Enforce',
    // Incentive
    'Water Human Capital Program': 'Incentive',
    'Water Innovation & R&D': 'Incentive',
    'Water Innovation Ecosystem': 'Incentive',
    'Policy Tool for Employment Generation': 'Incentive',
    'Policy Tool for Investment Agreement Value': 'Incentive',
    // License
    'Water Inspection & Compliance': 'License',
    'Policy Tool for Licensing Coverage': 'License',
    // Services
    'Water Digital Platforms': 'Services',
    'Water Logistics & Service Delivery': 'Services',
    'Policy Tool for Processing Time Reduction': 'Services',
    'Policy Tool for Service Reliability': 'Services',
    'Policy Tool for Customer Satisfaction Rate': 'Services',
    'Policy Tool for Complaint Resolution Rate': 'Services',
    // Regulate
    'Water Monitoring & Regulation': 'Regulate',
    'Policy Tool for GDP Contribution Rate': 'Regulate',
    'Policy Tool for Sustainability Index': 'Regulate',
    // Awareness
    'Policy Tool for Waste Reduction': 'Awareness',
    'Policy Tool for Water Loss Reduction': 'Awareness',
    'Policy Tool for Stakeholder Engagement Rate': 'Awareness'
};

/**
 * Fetch ALL SectorPolicyTool data from 4 sources.
 * Fetches ALL years — filtering by year/quarter is done CLIENT-SIDE.
 *
 * Source 1: sector_value_chain → L1 SectorPolicyTool (governance)
 * Source 2: Direct Cypher via MCP → L2 physical assets (sector/region/coordinates)
 * Source 3: build_oversight → non-physical L1/L2 policy tools + capabilities + risks + projects
 * Source 4: operate_oversight → KPIs + capabilities + risks
 */
interface SectorGraphResult {
  nodes: any[];
  buildChainData: { nodes: any[]; links: any[] };
  operateChainData: { nodes: any[]; links: any[] };
  svcChainData: { nodes: any[]; links: any[] };
}

// Module-level cache: fetch once, reuse on re-mount (navigation back)
let _sectorCache: SectorGraphResult | null = null;
let _sectorCachePromise: Promise<SectorGraphResult> | null = null;

export async function fetchSectorGraphData(): Promise<SectorGraphResult> {
    // Return cached data instantly if available
    if (_sectorCache) {
        console.log('[Neo4jMCP] Returning cached sector data (no re-fetch)');
        return _sectorCache;
    }
    // Deduplicate concurrent calls (e.g. React strict mode double-mount)
    if (_sectorCachePromise) return _sectorCachePromise;

    _sectorCachePromise = _fetchSectorGraphDataInternal();
    try {
        const result = await _sectorCachePromise;
        _sectorCache = result;
        return result;
    } finally {
        _sectorCachePromise = null;
    }
}

/** Force refresh (e.g. after data changes) */
export function invalidateSectorCache() {
    _sectorCache = null;
}

async function _fetchSectorGraphDataInternal(): Promise<SectorGraphResult> {
    const baseUrl = window.location.origin;

    console.log('[Neo4jMCP] Fetching Sector Graph Data from 4 sources...');

    try {
        // SOURCE 2: Direct Cypher → ALL SectorPolicyTool nodes (chains only return a fraction)
        const allPtQuery = `MATCH (n:SectorPolicyTool) RETURN n { .id, .name, .year, .level, .quarter, .status, .sector, .region, .description, .parent_id, .parent_year, .latitude, .longitude, .asset_type, .sub_category, .category, .priority, .rationale, .fiscal_action, .child_count, .tool_type, .impact_target, .delivery_channel, .cost_of_implementation, .capacity_metric, .completion_date, .investment, .domain_id } as node`;
        const directCypherPromise = callNeo4jTool('read_neo4j_cypher', { query: allPtQuery }).catch(err => {
            console.error('[Neo4jMCP] Source 2 (Direct Cypher) failed:', err);
            return [];
        });

        // SOURCE 1 + 3 + 4: Chain queries — ALL in parallel with Source 2
        const [svcResp, buildResp, operateResp, directCypherRaw] = await Promise.all([
            fetch(`${baseUrl}/api/business-chain/sector_value_chain?year=0&excludeEmbeddings=true`),
            fetch(`${baseUrl}/api/business-chain/build_oversight?year=0&excludeEmbeddings=true`),
            fetch(`${baseUrl}/api/business-chain/operate_oversight?year=0&excludeEmbeddings=true`),
            directCypherPromise
        ]);

        if (!svcResp.ok) throw new Error(`sector_value_chain HTTP ${svcResp.status}`);
        if (!buildResp.ok) throw new Error(`build_oversight HTTP ${buildResp.status}`);
        if (!operateResp.ok) throw new Error(`operate_oversight HTTP ${operateResp.status}`);

        const [svcData, buildData, operateData] = await Promise.all([
            svcResp.json(),
            buildResp.json(),
            operateResp.json()
        ]);

        const directCypherNodes = (directCypherRaw?.data || directCypherRaw || []).map((r: any) => r.node || r).filter(Boolean);
        console.log(`[Neo4jMCP] Source 2 (Direct Cypher): ${directCypherNodes.length} SectorPolicyTool nodes`);

        // Extract nodes from chain responses
        // Normalize id to domain_id (short format like "4.0") for frontend consistency
        const getChainNodes = (data: any) => (data.nodes || []).map((n: any) => {
            const props = n.properties || {};
            const { embedding, Embedding, embedding_generated_at, ...clean } = props;
            if (clean.domain_id) clean.id = clean.domain_id;
            return { ...clean, _labels: n.labels };
        });

        const svcNodes = getChainNodes(svcData);
        const buildNodes = getChainNodes(buildData);
        const operateNodes = getChainNodes(operateData);

        console.log(`[Neo4jMCP] Source 1 (sector_value_chain): ${svcNodes.length} nodes`);
        console.log(`[Neo4jMCP] Source 3 (build_oversight): ${buildNodes.length} nodes`);
        console.log(`[Neo4jMCP] Source 4 (operate_oversight): ${operateNodes.length} nodes`);

        // Merge & deduplicate by domain_id+year (domain_id is the original short id like "1.0")
        const uniqueMap = new Map<string, any>();

        // Process chain nodes (have composite id + domain_id from query)
        for (const nodes of [svcNodes, buildNodes, operateNodes]) {
            for (const n of nodes) {
                if (!n.id) continue;
                // Use domain_id for dedup key (matches direct Cypher format)
                const domainId = n.domain_id || n.id;
                const label = (n._labels || [])[0] || '';
                const key = `${label}:${domainId}-${n.year || n.parent_year || ''}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, n);
                }
            }
        }

        // Process L2 physical assets from direct Cypher (have short id, no _labels)
        for (const n of directCypherNodes) {
            if (!n.id) continue;
            // Add _labels for downstream filtering
            if (!n._labels) n._labels = ['SectorPolicyTool'];
            const key = `SectorPolicyTool:${n.id}-${n.year || n.parent_year || ''}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, n);
            }
        }

        const allNodes = Array.from(uniqueMap.values());

        console.log(`[Neo4jMCP] Total unique nodes: ${allNodes.length}`);
        console.log(`[Neo4jMCP] Year distribution:`,
            allNodes.reduce((acc: any, n: any) => {
                const y = String(n.year || n.parent_year || 'unknown');
                acc[y] = (acc[y] || 0) + 1;
                return acc;
            }, {})
        );

        return { nodes: allNodes, buildChainData: buildData, operateChainData: operateData, svcChainData: svcData };

    } catch (error) {
        console.error('[Neo4jMCP] Failed to fetch sector graph data:', error);
        return { nodes: [], buildChainData: { nodes: [], links: [] }, operateChainData: { nodes: [], links: [] }, svcChainData: { nodes: [], links: [] } };
    }
}

/**
 * Extract policy tool risk data from the build_oversight chain response.
 * Replaces direct MCP Cypher — uses chain data already fetched by fetchSectorGraphData.
 *
 * Chain path (build_oversight):
 * EntityCapability(L3) →MONITORED_BY→ EntityRisk(L3)
 * EntityRisk(L2) →PARENT_OF→ EntityRisk(L3)
 * coalesce(riskL2,riskL3) →INFORMS→ SectorPolicyTool(L2)
 * SectorPolicyTool(L1) →PARENT_OF→ SectorPolicyTool(L2)
 */
export function extractPolicyRiskFromChain(chainData: { nodes: any[]; links: any[] }, source?: 'build' | 'operate'): PolicyToolRiskRow[] {
    const { nodes, links } = chainData;

    // 1. Build node map by elementId
    const nodeByElementId = new Map<string, any>();
    for (const n of nodes) {
        const props = n.properties || {};
        nodeByElementId.set(n.elementId, { ...props, _labels: n.labels, _elementId: n.elementId });
    }

    // 2. Parse link elementIds from link.id field
    // Format: "{srcElementId}-{TYPE}-{tgtElementId}"
    const parsedLinks = links.map((l: any) => {
        const parts = l.id.split(`-${l.type}-`);
        return {
            sourceElementId: parts[0],
            targetElementId: parts[1],
            type: l.type,
            sourceId: l.source,
            targetId: l.target
        };
    });

    // 3. Build relationship maps
    const informsLinks = parsedLinks.filter((l: any) => l.type === 'INFORMS');
    const monitoredByLinks = parsedLinks.filter((l: any) => l.type === 'MONITORED_BY');
    const parentOfLinks = parsedLinks.filter((l: any) => l.type === 'PARENT_OF');

    // 4. polToolL2 elementId → risk elementIds (INFORMS: risk → polToolL2)
    //    Only include targets that are SectorPolicyTool nodes (filter out Objectives, Performance, etc.)
    const polL2ToRisks = new Map<string, string[]>();
    for (const l of informsLinks) {
        const targetNode = nodeByElementId.get(l.targetElementId);
        if (!targetNode?._labels?.includes('SectorPolicyTool')) continue;
        if (!polL2ToRisks.has(l.targetElementId)) polL2ToRisks.set(l.targetElementId, []);
        polL2ToRisks.get(l.targetElementId)!.push(l.sourceElementId);
    }

    // 5. Risk L2 → Risk L3 children (PARENT_OF where both EntityRisk)
    const riskL2ToL3 = new Map<string, string[]>();
    for (const l of parentOfLinks) {
        const srcNode = nodeByElementId.get(l.sourceElementId);
        const tgtNode = nodeByElementId.get(l.targetElementId);
        if (srcNode?._labels?.includes('EntityRisk') && tgtNode?._labels?.includes('EntityRisk')) {
            if (!riskL2ToL3.has(l.sourceElementId)) riskL2ToL3.set(l.sourceElementId, []);
            riskL2ToL3.get(l.sourceElementId)!.push(l.targetElementId);
        }
    }

    // 6. Risk → cap map (MONITORED_BY: cap → risk, so target is risk)
    const riskToCaps = new Map<string, string[]>();
    for (const l of monitoredByLinks) {
        if (!riskToCaps.has(l.targetElementId)) riskToCaps.set(l.targetElementId, []);
        riskToCaps.get(l.targetElementId)!.push(l.sourceElementId);
    }

    // 7. polTool L2 → L1 parent (PARENT_OF where both SectorPolicyTool)
    const polL2ToL1 = new Map<string, string>();
    for (const l of parentOfLinks) {
        const srcNode = nodeByElementId.get(l.sourceElementId);
        const tgtNode = nodeByElementId.get(l.targetElementId);
        if (srcNode?._labels?.includes('SectorPolicyTool') && tgtNode?._labels?.includes('SectorPolicyTool')) {
            polL2ToL1.set(l.targetElementId, l.sourceElementId);
        }
    }

    // 8. Build PolicyToolRiskRow[]
    const rows: PolicyToolRiskRow[] = [];

    // Helper: normalize ID for consistent Map keys (8.0 number → "8.0" string)
    const sid = (v: any) => nid(v);

    for (const [polL2ElemId, riskElemIds] of polL2ToRisks) {
        const polL2Node = nodeByElementId.get(polL2ElemId);
        if (!polL2Node) continue;

        const polL1ElemId = polL2ToL1.get(polL2ElemId);
        const polL1Node = polL1ElemId ? nodeByElementId.get(polL1ElemId) : null;

        // Business rule: if L1 has no L2 children, L1 IS the effective L2.
        // When polL2Node IS actually an L1 (no parent), treat it as both L1 and L2.
        const isL1ActingAsL2 = !polL1Node && polL2Node._labels?.includes('SectorPolicyTool') && polL2Node.level === 'L1';
        const effectiveL1 = polL1Node || (isL1ActingAsL2 ? polL2Node : null);

        for (const riskElemId of riskElemIds) {
            const riskNode = nodeByElementId.get(riskElemId);
            if (!riskNode) continue;

            // Find capabilities: direct + via L3 children
            const directCaps = riskToCaps.get(riskElemId) || [];
            const childRiskIds = riskL2ToL3.get(riskElemId) || [];
            const childCaps = childRiskIds.flatMap(childId => riskToCaps.get(childId) || []);
            const allCapIds = [...new Set([...directCaps, ...childCaps])];

            if (allCapIds.length === 0) {
                rows.push({
                    l1: effectiveL1 ? { id: sid(effectiveL1.domain_id || effectiveL1.id), name: effectiveL1.name, year: effectiveL1.year, level: effectiveL1.level } : null,
                    l2: { id: sid(polL2Node.domain_id || polL2Node.id), name: polL2Node.name, year: polL2Node.year, level: polL2Node.level, parent_id: sid(polL2Node.parent_id || effectiveL1?.domain_id || effectiveL1?.id || '') },
                    cap: null,
                    risk: {
                        build_band: riskNode.build_band || null,
                        operate_band: riskNode.operate_band || null,
                        build_exposure_pct: riskNode.build_exposure_pct || null,
                        expected_delay_days: riskNode.expected_delay_days || null,
                        likelihood_of_delay: riskNode.likelihood_of_delay || null
                    },
                    source
                });
            } else {
                for (const capElemId of allCapIds) {
                    const capNode = nodeByElementId.get(capElemId);
                    rows.push({
                        l1: effectiveL1 ? { id: sid(effectiveL1.domain_id || effectiveL1.id), name: effectiveL1.name, year: effectiveL1.year, level: effectiveL1.level } : null,
                        l2: { id: sid(polL2Node.domain_id || polL2Node.id), name: polL2Node.name, year: polL2Node.year, level: polL2Node.level, parent_id: sid(polL2Node.parent_id || effectiveL1?.domain_id || effectiveL1?.id || '') },
                        cap: capNode ? { id: sid(capNode.domain_id || capNode.id), name: capNode.name, level: capNode.level } : null,
                        risk: {
                            build_band: riskNode.build_band || null,
                            operate_band: riskNode.operate_band || null,
                            build_exposure_pct: riskNode.build_exposure_pct || null,
                            expected_delay_days: riskNode.expected_delay_days || null,
                            likelihood_of_delay: riskNode.likelihood_of_delay || null
                        },
                        source
                    });
                }
            }
        }
    }

    // Debug: show what bands exist per source
    const bandSummary = rows.reduce((acc: any, r) => {
        const bb = r.risk?.build_band || 'null';
        const ob = r.risk?.operate_band || 'null';
        const key = `build=${bb}, operate=${ob}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    console.log(`[Neo4jMCP] RISK BANDS (source=${source}): ${JSON.stringify(bandSummary)} — ${rows.length} rows`);
    return rows;
}

/**
 * Map operate_oversight risk to PolicyTools via sector_value_chain.
 *
 * operate_oversight path: EntityRisk →INFORMS→ SectorPerformance(L2) →PARENT_OF→ SectorPerformance(L1) →AGGREGATES_TO→ SectorObjective
 * sector_value_chain path: SectorObjective →REALIZED_VIA→ SectorPolicyTool
 *
 * Cross-chain join on SectorObjective.domain_id (year-agnostic).
 */
export function extractOperateRiskForPolicyTools(
    operateData: { nodes: any[]; links: any[] },
    svcData: { nodes: any[]; links: any[] },
    allPolicyToolNodes: any[] = []
): PolicyToolRiskRow[] {
    // --- OPERATE CHAIN: build node + link maps ---
    const opNodeByElemId = new Map<string, any>();
    for (const n of operateData.nodes) {
        const props = n.properties || {};
        opNodeByElemId.set(n.elementId, { ...props, _labels: n.labels, _elementId: n.elementId });
    }

    const opLinks = operateData.links.map((l: any) => {
        const parts = l.id.split(`-${l.type}-`);
        return { srcElem: parts[0], tgtElem: parts[1], type: l.type };
    });

    // INFORMS: EntityRisk → SectorPerformance
    const riskToPerfLinks = opLinks.filter((l: any) => {
        if (l.type !== 'INFORMS') return false;
        const tgt = opNodeByElemId.get(l.tgtElem);
        return tgt?._labels?.includes('SectorPerformance');
    });

    // PARENT_OF: SectorPerformance(L1) → SectorPerformance(L2)
    // We need reverse: L2 child → L1 parent
    const perfL2toL1 = new Map<string, string>(); // perfL2 elemId → perfL1 elemId
    for (const l of opLinks) {
        if (l.type !== 'PARENT_OF') continue;
        const src = opNodeByElemId.get(l.srcElem);
        const tgt = opNodeByElemId.get(l.tgtElem);
        if (src?._labels?.includes('SectorPerformance') && tgt?._labels?.includes('SectorPerformance')) {
            perfL2toL1.set(l.tgtElem, l.srcElem); // child → parent
        }
    }

    // AGGREGATES_TO: SectorPerformance(L1) → SectorObjective
    const perfL1toObj = new Map<string, string[]>(); // perfL1 elemId → obj elemIds
    for (const l of opLinks) {
        if (l.type !== 'AGGREGATES_TO') continue;
        const src = opNodeByElemId.get(l.srcElem);
        const tgt = opNodeByElemId.get(l.tgtElem);
        if (src?._labels?.includes('SectorPerformance') && tgt?._labels?.includes('SectorObjective')) {
            if (!perfL1toObj.has(l.srcElem)) perfL1toObj.set(l.srcElem, []);
            perfL1toObj.get(l.srcElem)!.push(l.tgtElem);
        }
    }

    // --- SVC CHAIN: SectorObjective → SectorPolicyTool via REALIZED_VIA ---
    const svcNodeByElemId = new Map<string, any>();
    for (const n of svcData.nodes) {
        const props = n.properties || {};
        svcNodeByElemId.set(n.elementId, { ...props, _labels: n.labels, _elementId: n.elementId });
    }

    // Build domain_id → SectorPolicyTool nodes map from SVC
    // REALIZED_VIA: SectorObjective(source) → SectorPolicyTool(target)
    const objDomainIdToPTs = new Map<string, any[]>(); // obj domain_id → PT nodes
    const svcLinks = svcData.links.map((l: any) => {
        const parts = l.id.split(`-${l.type}-`);
        return { srcElem: parts[0], tgtElem: parts[1], type: l.type };
    });

    for (const l of svcLinks) {
        if (l.type !== 'REALIZED_VIA') continue;
        const src = svcNodeByElemId.get(l.srcElem);
        const tgt = svcNodeByElemId.get(l.tgtElem);
        if (src?._labels?.includes('SectorObjective') && tgt?._labels?.includes('SectorPolicyTool')) {
            const objDomId = nid(src.domain_id || src.id);
            if (!objDomainIdToPTs.has(objDomId)) objDomainIdToPTs.set(objDomId, []);
            objDomainIdToPTs.get(objDomId)!.push(tgt);
        }
    }

    // --- Build L1 → L2 children map from allPolicyToolNodes ---
    const l1ToL2Children = new Map<string, any[]>(); // L1 domain_id → L2 nodes
    for (const n of allPolicyToolNodes) {
        if (n.level === 'L2' && n.parent_id) {
            const parentKey = nid(n.parent_id);
            if (!l1ToL2Children.has(parentKey)) l1ToL2Children.set(parentKey, []);
            l1ToL2Children.get(parentKey)!.push(n);
        }
    }
    console.log(`[Neo4jMCP] L1→L2 children map: ${l1ToL2Children.size} L1s with children`);

    // --- CHAIN: risk → perf → obj → PT ---
    const rows: PolicyToolRiskRow[] = [];

    for (const rl of riskToPerfLinks) {
        const riskNode = opNodeByElemId.get(rl.srcElem);
        if (!riskNode) continue;

        const band = riskNode.operate_band || riskNode.build_band || null;
        if (!band) continue; // No risk band → skip

        const perfNode = opNodeByElemId.get(rl.tgtElem);
        if (!perfNode) continue;

        // Get L1 parent: if perfNode is L2, follow PARENT_OF; if L1, use directly
        let perfL1ElemId: string;
        if (perfNode.level === 'L2') {
            const parentElem = perfL2toL1.get(rl.tgtElem);
            if (!parentElem) continue; // orphan L2
            perfL1ElemId = parentElem;
        } else {
            perfL1ElemId = rl.tgtElem; // already L1
        }

        // Get objectives linked to this perfL1
        const objElemIds = perfL1toObj.get(perfL1ElemId) || [];
        if (objElemIds.length === 0) continue;

        for (const objElemId of objElemIds) {
            const objNode = opNodeByElemId.get(objElemId);
            if (!objNode) continue;
            const objDomId = nid(objNode.domain_id || objNode.id);

            // Cross-chain lookup: find PolicyTools connected to this objective
            const ptNodes = objDomainIdToPTs.get(objDomId) || [];
            if (ptNodes.length === 0) continue;

            for (const pt of ptNodes) {
                const l1Id = nid(pt.domain_id || pt.id);

                // Create L1 row
                rows.push({
                    l1: { id: l1Id, name: pt.name, year: pt.year, level: pt.level || 'L1' },
                    l2: null,
                    cap: null,
                    risk: {
                        build_band: null,
                        operate_band: band,
                        build_exposure_pct: null,
                        expected_delay_days: null,
                        likelihood_of_delay: null
                    },
                    source: 'operate'
                });

                // Create L2 rows for ALL children of this L1
                const l2Children = l1ToL2Children.get(l1Id) || [];
                for (const l2 of l2Children) {
                    rows.push({
                        l1: { id: l1Id, name: pt.name, year: pt.year, level: pt.level || 'L1' },
                        l2: { id: nid(l2.domain_id || l2.id), name: l2.name, year: l2.year, level: 'L2', parent_id: l1Id },
                        cap: null,
                        risk: {
                            build_band: null,
                            operate_band: band,
                            build_exposure_pct: null,
                            expected_delay_days: null,
                            likelihood_of_delay: null
                        },
                        source: 'operate'
                    });
                }
            }
        }
    }

    console.log(`[Neo4jMCP] extractOperateRiskForPolicyTools: ${rows.length} rows mapped via 3-hop path`);
    const bandSummary = rows.reduce((acc: any, r) => {
        const ob = r.risk?.operate_band || 'null';
        acc[ob] = (acc[ob] || 0) + 1;
        return acc;
    }, {});
    console.log(`[Neo4jMCP] Operate→PT BANDS: ${JSON.stringify(bandSummary)}`);

    return rows;
}

/**
 * Aggregate risk rows by L1 policy tool ID.
 * Returns worst band per L1 and detail list of L2 children.
 * Uses the band matching each row's source chain (build_band for build, operate_band for operate).
 */
// Normalize ID: "8.0" (string) and 8 (number→"8") must match → canonical "X.Y"
const nid = (v: any): string => {
    if (v == null) return '';
    const s = String(v);
    const n = parseFloat(s);
    if (isNaN(n)) return s;
    return s.includes('.') ? s : n.toFixed(1);
};

export function aggregatePolicyRiskByL1(rows: PolicyToolRiskRow[]): Map<string, L1RiskAggregation> {
    const map = new Map<string, L1RiskAggregation>();

    for (const row of rows) {
        if (!row.l1) continue;
        const l1Id = nid(row.l1.id);

        if (!map.has(l1Id)) {
            map.set(l1Id, { l1Name: row.l1.name, worstBand: 'none', l2Details: [] });
        }
        const agg = map.get(l1Id)!;

        const effectiveBand = row.source === 'operate'
            ? (row.risk?.operate_band || row.risk?.build_band || null)
            : (row.risk?.build_band || row.risk?.operate_band || null);

        // Find or create L2 entry
        if (row.l2) {
            const l2IdStr = nid(row.l2.id);
            let l2Entry = agg.l2Details.find(d => nid(d.l2Id) === l2IdStr);
            if (!l2Entry) {
                l2Entry = { l2Id: l2IdStr, l2Name: row.l2.name, worstBand: null, caps: [] };
                agg.l2Details.push(l2Entry);
            }
            // Update L2 worst band
            const band = effectiveBand?.toLowerCase() || null;
            if (band === 'red') l2Entry.worstBand = 'red';
            else if (band === 'amber' && l2Entry.worstBand !== 'red') l2Entry.worstBand = 'amber';
            else if (band === 'green' && !l2Entry.worstBand) l2Entry.worstBand = 'green';

            // Add cap if not already present
            if (row.cap?.id && !l2Entry.caps.some(c => c.capId === row.cap!.id)) {
                l2Entry.caps.push({
                    capId: row.cap.id,
                    capName: row.cap.name,
                    capLevel: row.cap.level,
                    buildBand: band
                });
            }
        }

        // Update L1 worst band
        if (effectiveBand) {
            const band = effectiveBand.toLowerCase();
            if (band === 'red') agg.worstBand = 'red';
            else if (band === 'amber' && agg.worstBand !== 'red') agg.worstBand = 'amber';
            else if (band === 'green' && agg.worstBand === 'none') agg.worstBand = 'green';
        }
    }

    // Debug: show final L1 risk map
    const mapDebug: Record<string, string> = {};
    map.forEach((v, k) => { mapDebug[k] = `${v.worstBand} (${v.l2Details.length} L2s)`; });
    console.log(`[Neo4jMCP] L1 RISK MAP: ${JSON.stringify(mapDebug)}`);

    return map;
}

/**
 * Aggregate risk by category using L1_CATEGORY_MAP.
 * Returns worst band per category name.
 */
export function aggregatePolicyRiskByCategory(
    l1RiskMap: Map<string, L1RiskAggregation>,
    categoryMap: Record<string, PolicyCategory>
): Record<string, 'red' | 'amber' | 'green' | 'none'> {
    // Default: green (no detected risk). Worst band from L1s overrides.
    const result: Record<string, 'red' | 'amber' | 'green' | 'none'> = {
        'Enforce': 'green', 'Incentive': 'green', 'License': 'green',
        'Services': 'green', 'Regulate': 'green', 'Awareness': 'green'
    };

    for (const [, agg] of l1RiskMap) {
        const category = categoryMap[agg.l1Name] || 'Services';
        const currentBand = result[category] || 'none';
        const newBand = agg.worstBand;

        // Worst band wins: red > amber > green > none
        if (newBand === 'red') {
            result[category] = 'red';
        } else if (newBand === 'amber' && currentBand !== 'red') {
            result[category] = 'amber';
        } else if (newBand === 'green' && currentBand === 'none') {
            result[category] = 'green';
        }
    }

    return result;
}
