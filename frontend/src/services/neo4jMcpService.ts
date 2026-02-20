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
}

export async function fetchSectorGraphData(): Promise<SectorGraphResult> {
    const baseUrl = window.location.origin;

    console.log('[Neo4jMCP] Fetching Sector Graph Data from 4 sources...');

    try {
        // SOURCE 1 + 3 + 4: Chain queries (parallel)
        const [svcResp, buildResp, operateResp] = await Promise.all([
            fetch(`${baseUrl}/api/business-chain/sector_value_chain?year=0&excludeEmbeddings=true`),
            fetch(`${baseUrl}/api/business-chain/build_oversight?year=0&excludeEmbeddings=true`),
            fetch(`${baseUrl}/api/business-chain/operate_oversight?year=0&excludeEmbeddings=true`)
        ]);

        if (!svcResp.ok) throw new Error(`sector_value_chain HTTP ${svcResp.status}`);
        if (!buildResp.ok) throw new Error(`build_oversight HTTP ${buildResp.status}`);
        if (!operateResp.ok) throw new Error(`operate_oversight HTTP ${operateResp.status}`);

        const [svcData, buildData, operateData] = await Promise.all([
            svcResp.json(),
            buildResp.json(),
            operateResp.json()
        ]);

        // SOURCE 2: Direct Cypher → ALL SectorPolicyTool nodes (chains only return a fraction)
        // Neo4j has 434 SectorPolicyTool nodes; chains return ~7. Direct query gets them all.
        const allPtQuery = `MATCH (n:SectorPolicyTool) RETURN n { .*, embedding: null, vector: null, description_embedding: null } as node`;
        let directCypherNodes: any[] = [];
        try {
            const ptResult = await callNeo4jTool('read_neo4j_cypher', { query: allPtQuery });
            directCypherNodes = (ptResult?.data || ptResult || []).map((r: any) => r.node || r).filter(Boolean);
            console.log(`[Neo4jMCP] Source 2 (Direct Cypher): ${directCypherNodes.length} SectorPolicyTool nodes (all L1+L2, physical+policy)`);
        } catch (err) {
            console.error('[Neo4jMCP] Source 2 (Direct Cypher) failed:', err);
        }

        // Extract nodes from chain responses
        const getChainNodes = (data: any) => (data.nodes || []).map((n: any) => {
            const props = n.properties || {};
            const { embedding, Embedding, embedding_generated_at, ...clean } = props;
            return { ...clean, _labels: n.labels };
        });

        const svcNodes = getChainNodes(svcData);
        const buildNodes = getChainNodes(buildData);
        const operateNodes = getChainNodes(operateData);

        console.log(`[Neo4jMCP] Source 1 (sector_value_chain): ${svcNodes.length} nodes`);
        console.log(`[Neo4jMCP] Source 3 (build_oversight): ${buildNodes.length} nodes`);
        console.log(`[Neo4jMCP] Source 4 (operate_oversight): ${operateNodes.length} nodes`);

        // Merge & deduplicate by id+year
        const uniqueMap = new Map<string, any>();

        // Process chain nodes
        for (const nodes of [svcNodes, buildNodes, operateNodes]) {
            for (const n of nodes) {
                if (!n.id) continue;
                const key = `${n.id}-${n.year || n.parent_year || ''}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, n);
                }
            }
        }

        // Process L2 physical assets from direct Cypher
        for (const n of directCypherNodes) {
            if (!n.id) continue;
            const key = `${n.id}-${n.year || n.parent_year || ''}`;
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

        return { nodes: allNodes, buildChainData: buildData };

    } catch (error) {
        console.error('[Neo4jMCP] Failed to fetch sector graph data:', error);
        return { nodes: [], buildChainData: { nodes: [], links: [] } };
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
export function extractPolicyRiskFromChain(chainData: { nodes: any[]; links: any[] }): PolicyToolRiskRow[] {
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
    const polL2ToRisks = new Map<string, string[]>();
    for (const l of informsLinks) {
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

    for (const [polL2ElemId, riskElemIds] of polL2ToRisks) {
        const polL2Node = nodeByElementId.get(polL2ElemId);
        if (!polL2Node) continue;

        const polL1ElemId = polL2ToL1.get(polL2ElemId);
        const polL1Node = polL1ElemId ? nodeByElementId.get(polL1ElemId) : null;

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
                    l1: polL1Node ? { id: polL1Node.id, name: polL1Node.name, year: polL1Node.year, level: polL1Node.level } : null,
                    l2: { id: polL2Node.id, name: polL2Node.name, year: polL2Node.year, level: polL2Node.level, parent_id: polL2Node.parent_id || polL1Node?.id || '' },
                    cap: null,
                    risk: {
                        build_band: riskNode.build_band || null,
                        operate_band: riskNode.operate_band || null,
                        build_exposure_pct: riskNode.build_exposure_pct || null,
                        expected_delay_days: riskNode.expected_delay_days || null,
                        likelihood_of_delay: riskNode.likelihood_of_delay || null
                    }
                });
            } else {
                for (const capElemId of allCapIds) {
                    const capNode = nodeByElementId.get(capElemId);
                    rows.push({
                        l1: polL1Node ? { id: polL1Node.id, name: polL1Node.name, year: polL1Node.year, level: polL1Node.level } : null,
                        l2: { id: polL2Node.id, name: polL2Node.name, year: polL2Node.year, level: polL2Node.level, parent_id: polL2Node.parent_id || polL1Node?.id || '' },
                        cap: capNode ? { id: capNode.id, name: capNode.name, level: capNode.level } : null,
                        risk: {
                            build_band: riskNode.build_band || null,
                            operate_band: riskNode.operate_band || null,
                            build_exposure_pct: riskNode.build_exposure_pct || null,
                            expected_delay_days: riskNode.expected_delay_days || null,
                            likelihood_of_delay: riskNode.likelihood_of_delay || null
                        }
                    });
                }
            }
        }
    }

    console.log(`[Neo4jMCP] Extracted ${rows.length} policy risk rows from chain data (${informsLinks.length} INFORMS, ${monitoredByLinks.length} MONITORED_BY)`);
    return rows;
}

/**
 * Aggregate risk rows by L1 policy tool ID.
 * Returns worst band per L1 and detail list of L2 children.
 * Uses build_band as primary; falls back to operate_band if build_band is absent.
 */
export function aggregatePolicyRiskByL1(rows: PolicyToolRiskRow[]): Map<string, L1RiskAggregation> {
    const map = new Map<string, L1RiskAggregation>();

    for (const row of rows) {
        if (!row.l1) continue;
        const l1Id = row.l1.id;

        if (!map.has(l1Id)) {
            map.set(l1Id, { l1Name: row.l1.name, worstBand: 'none', l2Details: [] });
        }
        const agg = map.get(l1Id)!;

        const effectiveBand = row.risk?.build_band || row.risk?.operate_band || null;

        // Find or create L2 entry
        if (row.l2) {
            let l2Entry = agg.l2Details.find(d => d.l2Id === row.l2!.id);
            if (!l2Entry) {
                l2Entry = { l2Id: row.l2.id, l2Name: row.l2.name, worstBand: null, caps: [] };
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
    const result: Record<string, 'red' | 'amber' | 'green' | 'none'> = {
        'Enforce': 'none', 'Incentive': 'none', 'License': 'none',
        'Services': 'none', 'Regulate': 'none', 'Awareness': 'none'
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
