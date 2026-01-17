#!/bin/bash
OUT="api_test_results.log"
echo "### JOSOOR API v1.3 Validation Log ###" > $OUT
echo "Timestamp: $(date)" >> $OUT
echo -e "\n--- 1. Graph Health & Metadata ---" >> $OUT
curl -s "https://betaBE.aitwintech.com/api/neo4j/health" >> $OUT
echo -e "\n" >> $OUT
curl -s "https://betaBE.aitwintech.com/api/neo4j/years" >> $OUT
echo -e "\n" >> $OUT
echo -n "Schema Labels (count): " >> $OUT
curl -s "https://betaBE.aitwintech.com/api/neo4j/schema" | jq '.labels | length' >> $OUT

echo -e "\n--- 2. Core Graph Data ---" >> $OUT
echo -n "Graph (SectorObjective, 2025): " >> $OUT
curl -s "https://betaBE.aitwintech.com/api/graph?nodeLabels=SectorObjective&years=2025" | jq -c '{nodes: (.nodes | length), links: (.links | length)}' >> $OUT

echo -e "\n--- 3. Business Chains ---" >> $OUT
CHAINS=("sector_value_chain" "integrated_oversight" "sustainable_operations" "aggregate")
for chain in "${CHAINS[@]}"; do
    echo -n "Chain $chain: " >> $OUT
    curl -s "https://betaBE.aitwintech.com/api/business-chain/$chain?year=2025" | jq -c '{nodes: (.nodes | length), links: (.links | length)}' >> $OUT
done

echo -e "\n--- 4. Graph Utilities ---" >> $OUT
echo -n "Stats: " >> $OUT
curl -s "https://betaBE.aitwintech.com/api/domain-graph/stats" | jq -c '.' >> $OUT
echo -n "Counts: " >> $OUT
curl -s "https://betaBE.aitwintech.com/api/business-chain/counts" | jq -c '.' >> $OUT
echo -n "Integrity: " >> $OUT
curl -s "https://betaBE.aitwintech.com/api/business-chain/integrity" | jq -c '.' >> $OUT

echo -e "\n--- 5. Tabular Data (Port 8008) ---" >> $OUT
echo -n "Dashboard Keys: " >> $OUT
curl -s "https://betaBE.aitwintech.com/api/v1/dashboard/dashboard-data" | jq -c 'keys' >> $OUT
echo -n "Outcomes Keys: " >> $OUT
curl -s "https://betaBE.aitwintech.com/api/v1/dashboard/outcomes-data" | jq -c 'keys' >> $OUT
echo -n "Investment (first item): " >> $OUT
curl -s "https://betaBE.aitwintech.com/api/v1/dashboard/investment-initiatives" | jq -c '.[0] | {initiative_name, budget}' >> $OUT

echo -e "\n--- 6. Chat API ---" >> $OUT
echo -n "Conversations Status: " >> $OUT
curl -s -o /dev/null -w "%{http_code}" "https://betaBE.aitwintech.com/api/v1/chat/conversations" >> $OUT
echo -e "\n" >> $OUT
