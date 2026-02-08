#!/bin/bash

# Test MCP Endpoint via Vite Proxy (localhost:3000)
# This simulates what the browser does

MCP_ENDPOINT="http://localhost:3000/4/mcp/"

REQUEST_BODY='{
  "jsonrpc": "2.0",
  "id": '$(date +%s)',
  "method": "tools/call",
  "params": {
    "name": "read_neo4j_cypher",
    "arguments": {
      "query": "MATCH (n:SectorPolicyTool) RETURN n { .*, embedding: null, vector: null, description_embedding: null } as node LIMIT 5"
    }
  }
}'

echo "=== Testing MCP Endpoint via Vite Proxy ==="
echo "Endpoint: $MCP_ENDPOINT"
echo "Request Body: $REQUEST_BODY"
echo ""
echo "=== Response ==="

curl -X POST "$MCP_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d "$REQUEST_BODY" \
  -v 2>&1 | tee /tmp/mcp_test_output.txt

echo ""
echo ""
echo "=== Analysis ==="

# Extract status code
STATUS=$(grep "< HTTP" /tmp/mcp_test_output.txt | awk '{print $3}')
echo "Status Code: $STATUS"

# Check for data in response
if grep -q "node" /tmp/mcp_test_output.txt; then
  echo "✓ Response contains node data"
  
  # Try to pretty print the JSON
  echo ""
  echo "=== Parsed Response ==="
  grep -A 1000 "{" /tmp/mcp_test_output.txt | tail -n +2 | jq '.' 2>/dev/null || echo "Could not parse JSON"
else
  echo "✗ No node data in response"
fi
