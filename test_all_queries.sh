#!/bin/bash
echo "============================================================"
echo "Testing All Modified Queries"
echo "============================================================"

echo -e "\n1️⃣  sector_value_chain - Narrative (analyzeGaps=false)"
curl -s "http://localhost:3001/api/business-chain/sector_value_chain?year=2028&quarter=4&analyzeGaps=false&excludeEmbeddings=true" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'   ✅ Nodes: {len(d[\"nodes\"])}, Links: {len(d[\"links\"])}')"

echo -e "\n2️⃣  sector_value_chain - Diagnostic (analyzeGaps=true)"
curl -s "http://localhost:3001/api/business-chain/sector_value_chain?year=2028&quarter=4&analyzeGaps=true&excludeEmbeddings=true" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'   ✅ Nodes: {len(d[\"nodes\"])}, Links: {len(d[\"links\"])}')"

echo -e "\n3️⃣  setting_strategic_priorities - Narrative"
curl -s "http://localhost:3001/api/business-chain/setting_strategic_priorities?year=2028&quarter=4&analyzeGaps=false&excludeEmbeddings=true" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'   ✅ Nodes: {len(d[\"nodes\"])}, Links: {len(d[\"links\"])}')"

echo -e "\n4️⃣  setting_strategic_priorities - Diagnostic"
curl -s "http://localhost:3001/api/business-chain/setting_strategic_priorities?year=2028&quarter=4&analyzeGaps=true&excludeEmbeddings=true" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'   ✅ Nodes: {len(d[\"nodes\"])}, Links: {len(d[\"links\"])}')"

echo -e "\n============================================================"
echo "✅ All Query Tests Complete"
echo "============================================================"
