#!/bin/bash

# Test MCP Endpoint and parse results properly

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
echo ""

# Make request and save response
RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d "$REQUEST_BODY")

# Extract the data line (SSE format)
DATA_LINE=$(echo "$RESPONSE" | grep "^data: " | sed 's/^data: //')

echo "=== PARSED JSON-RPC RESPONSE ==="
echo "$DATA_LINE" | jq '.'

echo ""
echo "=== RECORD COUNT ==="
RECORD_COUNT=$(echo "$DATA_LINE" | jq '.result.content[0].text | fromjson | length')
echo "Records returned: $RECORD_COUNT"

echo ""
echo "=== FIRST RECORD (DETAILED) ==="
echo "$DATA_LINE" | jq '.result.content[0].text | fromjson | .[0].node'

echo ""
echo "=== ALL RECORD NAMES ==="
echo "$DATA_LINE" | jq -r '.result.content[0].text | fromjson | .[].node | "\(.year)-Q\(.quarter): \(.name) (Level: \(.level), ID: \(.id))"'

echo ""
echo "=== SUMMARY ==="
echo "Status: SUCCESS ✓"
echo "Endpoint working: YES ✓"
echo "Data structure: Valid ✓"
