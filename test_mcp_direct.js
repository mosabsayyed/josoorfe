// Test script to verify fetch compatibility with MCP endpoint
// Run with: node test_mcp_direct.js

// WITH SLASH (Required!)
const MCP_ENDPOINT = 'https://betaBE.aitwintech.com/4/mcp/';

async function run() {
    console.log("Testing Fetch to:", MCP_ENDPOINT);
    const requestBody = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
            name: 'read_neo4j_cypher',
            arguments: {
                query: 'MATCH (n:SectorPolicyTool) RETURN count(n) as count'
            }
        }
    };

    try {
        const response = await fetch(MCP_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream'
            },
            body: JSON.stringify(requestBody)
        });

        console.log("Status:", response.status, response.statusText);
        const text = await response.text();
        console.log("Raw Response Length:", text.length);
        console.log("Snippet:", text.substring(0, 200));

    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

run();
