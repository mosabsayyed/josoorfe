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

export interface L1RiskAggregation {
  l1Name: string;
  worstBand: 'red' | 'amber' | 'green' | 'none';
  l2Details: Array<{ l2Id: string; l2Name: string; capId: string; capName: string; buildBand: string | null }>;
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
export async function fetchSectorGraphData(): Promise<any[]> {
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

        return allNodes;

    } catch (error) {
        console.error('[Neo4jMCP] Failed to fetch sector graph data:', error);
        return [];
    }
}

/**
 * Fetch risk data for policy tools using direct Cypher via MCP.
 *
 * DB has 363 INFORMS edges (Risk → PolicyTool). Chain APIs only return ~1.
 * Direct Cypher gets ALL risk→policy connections with bands.
 *
 * Query: Risk(L2) -[:INFORMS]-> PolicyTool(L2) <-[:PARENT_OF]- PolicyTool(L1)
 *        + optional Cap via Risk(L2) <-[:PARENT_OF]- Risk(L3) <-[:MONITORED_BY]- Cap
 */
export async function fetchPolicyToolRiskData(year?: string | number): Promise<PolicyToolRiskRow[]> {
    console.log(`[Neo4jMCP] Fetching policy tool risk data via direct Cypher (MCP)...`);

    try {
        // Single query: get all Risk→INFORMS→PolicyTool(L2) with parent L1 and linked Cap
        const query = `
            MATCH (risk:EntityRisk {level: 'L2'})-[:INFORMS]->(ptL2:SectorPolicyTool {level: 'L2'})
            OPTIONAL MATCH (ptL1:SectorPolicyTool {level: 'L1'})-[:PARENT_OF]->(ptL2)
            WHERE ptL1.year = ptL2.year
            OPTIONAL MATCH (risk)<-[:PARENT_OF]-(riskL3:EntityRisk {level: 'L3'})<-[:MONITORED_BY]-(cap:EntityCapability)
            WHERE cap.year = risk.year
            RETURN DISTINCT
                ptL1 { .id, .name, .year, .level } as l1,
                ptL2 { .id, .name, .year, .level, .parent_id } as l2,
                risk { .id, .build_band, .operate_band, .build_exposure_pct, .expected_delay_days, .likelihood_of_delay } as risk,
                cap { .id, .name, .level } as cap
        `;

        const result = await callNeo4jTool('read_neo4j_cypher', { query });
        const data = result?.data || result || [];

        const rows: PolicyToolRiskRow[] = [];
        const l1sUsed = new Set<string>();

        for (const row of data) {
            const l1 = row.l1 || null;
            const l2 = row.l2 || null;
            const risk = row.risk || null;
            const cap = row.cap || null;

            if (l1) l1sUsed.add(`${l1.id}-${l1.year}`);

            rows.push({
                l1: l1 ? { id: l1.id, name: l1.name, year: l1.year, level: l1.level } : null,
                l2: l2 ? { id: l2.id, name: l2.name, year: l2.year, level: l2.level, parent_id: l2.parent_id || l1?.id || '' } : null,
                cap: cap ? { id: cap.id, name: cap.name, level: cap.level } : null,
                risk: risk ? {
                    build_band: risk.build_band || null,
                    operate_band: risk.operate_band || null,
                    build_exposure_pct: risk.build_exposure_pct || null,
                    expected_delay_days: risk.expected_delay_days || null,
                    likelihood_of_delay: risk.likelihood_of_delay || null
                } : null
            });
        }

        console.log(`[Neo4jMCP] Policy risk data: ${rows.length} rows from direct Cypher (DB has 363 INFORMS edges)`);
        return rows;
    } catch (error) {
        console.error('[Neo4jMCP] Failed to fetch policy tool risk data:', error);
        return [];
    }
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

        // Effective band: build_band primary, operate_band fallback
        const effectiveBand = row.risk?.build_band || row.risk?.operate_band || null;

        // Add L2 detail if present and not already added
        if (row.l2 && !agg.l2Details.some(d => d.l2Id === row.l2!.id)) {
            agg.l2Details.push({
                l2Id: row.l2.id,
                l2Name: row.l2.name,
                capId: row.cap?.id || '',
                capName: row.cap?.name || '',
                buildBand: effectiveBand ? effectiveBand.toLowerCase() : null
            });
        }

        // Update worst band
        if (effectiveBand) {
            const band = effectiveBand.toLowerCase();
            if (band === 'red') {
                agg.worstBand = 'red';
            } else if (band === 'amber' && agg.worstBand !== 'red') {
                agg.worstBand = 'amber';
            } else if (band === 'green' && agg.worstBand === 'none') {
                agg.worstBand = 'green';
            }
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
