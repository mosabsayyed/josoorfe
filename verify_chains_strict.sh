#!/bin/bash

BASE_URL="https://betaBE.aitwintech.com/api"
CHAINS=(
    "sector_value_chain"
    "setting_strategic_initiatives"
    "setting_strategic_priorities"
    "build_oversight"
    "operate_oversight"
    "sustainable_operations"
    "integrated_oversight"
    "aggregate"
)

echo "Strict Chain Verification Started at $(date)"
echo "Base URL: $BASE_URL"
echo "----------------------------------------"

for chain in "${CHAINS[@]}"; do
    echo "Testing Chain: $chain"
    
    # Test Narrative (analyzeGaps=false)
    # Using --max-time 15 to allow slower endpoints but fail if hung
    RESP_N=$(curl -s --max-time 15 -o /dev/null -w "%{http_code}" "$BASE_URL/business-chain/$chain?year=2025&analyzeGaps=false&excludeEmbeddings=true")
    if [ "$RESP_N" == "200" ]; then
        COUNT_N=$(curl -s --max-time 15 "$BASE_URL/business-chain/$chain?year=2025&analyzeGaps=false&excludeEmbeddings=true" | jq '.nodes | length')
        echo "    MODE: Narrative  | Status: 200 OK | Nodes: $COUNT_N"
    else
        echo "    MODE: Narrative  | Status: FAIL ($RESP_N)"
    fi

    # Test Diagnostic (analyzeGaps=true)
    RESP_D=$(curl -s --max-time 15 -o /dev/null -w "%{http_code}" "$BASE_URL/business-chain/$chain?year=2025&analyzeGaps=true&excludeEmbeddings=true")
    if [ "$RESP_D" == "200" ]; then
        COUNT_D=$(curl -s --max-time 15 "$BASE_URL/business-chain/$chain?year=2025&analyzeGaps=true&excludeEmbeddings=true" | jq '.nodes | length')
        echo "    MODE: Diagnostic | Status: 200 OK | Nodes: $COUNT_D"
    else
        echo "    MODE: Diagnostic | Status: FAIL ($RESP_D)"
    fi
    echo "----------------------------------------"
done
