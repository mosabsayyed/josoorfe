#!/bin/bash
BASE="https://betaBE.aitwintech.com/api"
OUT="complete_api_validation.md"

echo "# JOSOOR API v1.3 Complete Validation Report" > $OUT
echo "**Generated:** $(date)" >> $OUT
echo "" >> $OUT

test_endpoint() {
    local section=$1
    local name=$2
    local url=$3
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
    status=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    # Parse JSON if possible
    if echo "$body" | jq . >/dev/null 2>&1; then
        nodes=$(echo "$body" | jq '.nodes | length' 2>/dev/null || echo "n/a")
        links=$(echo "$body" | jq '.links | length' 2>/dev/null || echo "n/a")
        keys=$(echo "$body" | jq -c 'keys' 2>/dev/null | head -c 100)
        echo "| $name | \`$status\` | ✅ Valid JSON | nodes: $nodes, links: $links |" >> $OUT
    else
        echo "| $name | \`$status\` | ❌ Invalid/Empty | - |" >> $OUT
    fi
}

# Section 2.1: Core Graph Data
echo "## 2.1 Core Graph Data (\`/graph\`)" >> $OUT
echo "" >> $OUT
echo "| Test Case | Status | Validation | Details |" >> $OUT
echo "|-----------|--------|------------|---------|" >> $OUT

test_endpoint "2.1" "Single Label" "$BASE/graph?nodeLabels=SectorObjective"
test_endpoint "2.1" "Multi Label" "$BASE/graph?nodeLabels=SectorObjective,EntityCapability"
test_endpoint "2.1" "With Year" "$BASE/graph?nodeLabels=SectorObjective&years=2025"
test_endpoint "2.1" "With Years (Multi)" "$BASE/graph?nodeLabels=SectorObjective&years=2025,2026"
test_endpoint "2.1" "With Relationships" "$BASE/graph?nodeLabels=SectorObjective&relationships=REALIZED_VIA"
test_endpoint "2.1" "Analyze Gaps" "$BASE/graph?nodeLabels=SectorObjective&analyzeGaps=true"
test_endpoint "2.1" "Empty (No Labels)" "$BASE/graph"

echo "" >> $OUT

# Section 2.2: Business Chains
echo "## 2.2 Verified Business Chains (\`/business-chain/*\`)" >> $OUT
echo "" >> $OUT
echo "| Chain | Status | Validation | Details |" >> $OUT
echo "|-------|--------|------------|---------|" >> $OUT

CHAINS=("sector_value_chain" "setting_strategic_initiatives" "setting_strategic_priorities" "build_oversight" "operate_oversight" "sustainable_operations" "integrated_oversight" "aggregate")

for chain in "${CHAINS[@]}"; do
    test_endpoint "2.2" "$chain (default)" "$BASE/business-chain/$chain"
    test_endpoint "2.2" "$chain (year=2025)" "$BASE/business-chain/$chain?year=2025"
    test_endpoint "2.2" "$chain (diagnostic)" "$BASE/business-chain/$chain?analyzeGaps=true"
done

echo "" >> $OUT

# Section 2.3: Graph Utilities
echo "## 2.3 Graph Utilities" >> $OUT
echo "" >> $OUT
echo "| Endpoint | Status | Validation | Details |" >> $OUT
echo "|----------|--------|------------|---------|" >> $OUT

test_endpoint "2.3" "/neo4j/health" "$BASE/neo4j/health"
test_endpoint "2.3" "/neo4j/schema" "$BASE/neo4j/schema"
test_endpoint "2.3" "/neo4j/years" "$BASE/neo4j/years"
test_endpoint "2.3" "/neo4j/properties" "$BASE/neo4j/properties"
test_endpoint "2.3" "/business-chain/counts" "$BASE/business-chain/counts"
test_endpoint "2.3" "/business-chain/integrity" "$BASE/business-chain/integrity"
test_endpoint "2.3" "/domain-graph/stats" "$BASE/domain-graph/stats"

echo "" >> $OUT
echo "---" >> $OUT
echo "**Test Complete**" >> $OUT

