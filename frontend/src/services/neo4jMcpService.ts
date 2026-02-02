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

export interface PolicyToolItem {
    name: string;
    childCount: number;
    category: PolicyCategory;
    effectiveCount: number;
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
            // console.log('[Neo4jMCP] Direct JSON parse failed, trying SSE...'); // Reduce noise
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
 * Fetch ALL SectorPolicyTool data (Nodes Only)
 * Uses parent_id for hierarchy reconstruction on client.
 * Excludes embeddings.
 * Filtering by year/quarter is done CLIENT-SIDE in the component.
 */
export async function fetchSectorGraphData(targetYear?: string): Promise<any[]> {
    // 1. Fetch Nodes (Exclude large embeddings)
    // DO NOT MODIFY QUERY - Fetching raw dataset
    const nodesQuery = `MATCH (n:SectorPolicyTool) RETURN n { .*, embedding: null, vector: null, description_embedding: null } as node`;

    console.log('[Neo4jMCP] Starting Fetch Sector Graph Data...', { targetYear });

    try {
        const result = await callNeo4jTool('read_neo4j_cypher', { query: nodesQuery });

        const rows = result || [];

        let nodes: any[] = [];
        if (Array.isArray(rows)) {
            nodes = rows.map((row: any) => row.node || row.n).filter(Boolean);
        }

        // DEDUPLICATION FIX: Use ID + YEAR to allow multi-year snapshots
        const uniqueNodesMap = new Map<string, any>();

        nodes.forEach((node: any) => {
            if (!node.id) return;
            // Key = ID + Year (or Parent Year) to allow same asset in diff years
            const nodeYear = String(node.year || node.parent_year || '');
            const uniqueKey = `${node.id}-${nodeYear}`;

            if (!uniqueNodesMap.has(uniqueKey)) {
                uniqueNodesMap.set(uniqueKey, node);
            }
        });

        let uniqueNodes = Array.from(uniqueNodesMap.values());

        // UPSTREAM FILTERING: filter by year if provided
        if (targetYear) {
            console.log(`[Neo4jMCP] Filtering upstream for year: ${targetYear}`);
            uniqueNodes = uniqueNodes.filter((n: any) => {
                const ny = String(n.year || n.parent_year || '');
                return ny === targetYear;
            });
        }

        console.log(`[Neo4jMCP] Fetched ${nodes.length} nodes. Deduplicated/Filtered to ${uniqueNodes.length} unique assets.`);
        return uniqueNodes;

    } catch (error) {
        console.error('[Neo4jMCP] Failed to fetch sector graph data. See above logs for details.');
        return [];
    }
}
