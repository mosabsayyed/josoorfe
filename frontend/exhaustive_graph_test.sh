#!/bin/bash
BASE_URL="https://betaBE.aitwintech.com/api"
OUT="exhaustive_api_results.json"
echo "[" > $OUT

check_endpoint() {
    local name=$1
    local path=$2
    shift 2
    local params=$@
    local full_url="${BASE_URL}${path}${params}"
    
    echo "Testing: $name ($full_url)"
    
    response=$(curl -s -w "\n%{http_code}" "$full_url")
    http_status=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    # Validation
    is_json=false
    if echo "$body" | jq . >/dev/null 2>&1; then
        is_json=true
        node_count=$(echo "$body" | jq '.nodes | length' 2>/dev/null || echo "null")
        link_count=$(echo "$body" | jq '.links | length' 2>/dev/null || echo "null")
    else
        node_count="n/a"
        link_count="n/a"
    fi

    # Append to JSON
    cat << EOT >> $OUT
    {
        "name": "$name",
        "url": "$full_url",
        "status": "$http_status",
        "is_json": $is_json,
        "nodes": $node_count,
        "links": $link_count
    },
EOT
}

# 2.1 Core Graph
check_endpoint "Core: Label Only" "/graph" "?nodeLabels=SectorObjective"
check_endpoint "Core: Multi Label" "/graph" "?nodeLabels=SectorObjective,EntityCapability"
check_endpoint "Core: Year Filter" "/graph" "?nodeLabels=SectorObjective&years=2025"
check_endpoint "Core: Analyze Gaps" "/graph" "?nodeLabels=SectorObjective&analyzeGaps=true"

# 2.2 Business Chains
CHAINS=("sector_value_chain" "setting_strategic_initiatives" "setting_strategic_priorities" "build_oversight" "operate_oversight" "sustainable_operations" "integrated_oversight" "aggregate")
for chain in "${CHAINS[@]}"; do
    check_endpoint "Chain: $chain" "/business-chain/$chain" ""
    check_endpoint "Chain: $chain (2025)" "/business-chain/$chain" "?year=2025"
    check_endpoint "Chain: $chain (Diagnostic)" "/business-chain/$chain" "?analyzeGaps=true"
done

# 2.3 Utilities
check_endpoint "Health" "/neo4j/health" ""
check_endpoint "Schema" "/neo4j/schema" ""
check_endpoint "Years" "/neo4j/years" ""
check_endpoint "Counts" "/business-chain/counts" ""
check_endpoint "Integrity" "/business-chain/integrity" ""
check_endpoint "Stats" "/domain-graph/stats" ""
check_endpoint "SSE Stream" "/summary-stream" ""

# Close JSON
sed -i '$ s/,$//' $OUT
echo "]" >> $OUT

echo "Verification Complete. Results saved to $OUT"
jq . $OUT
