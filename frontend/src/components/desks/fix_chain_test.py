import re

with open("ChainTestDesk.tsx", "r") as f:
    content = f.read()

# Remove STAGING constants
content = re.sub(r"const STAGING_URL = .*?;\n\s*const STAGING_AUTH = .*?;\n", "", content, flags=re.DOTALL)

# Replace entire queryFn body
pattern = r"queryFn: async \(\) => \{([^}]+\{\) => \{[^}]+transformToGraphData\([^;]+;\n\s*\},"
replacement = "queryFn: async () => {\n            const isDiag = queryType === diagnostic;\n            const API_BASE = process.env.REACT_APP_API_URL || https://betaBE.aitwintech.com;\n            const params = new URLSearchParams({id: L1, year: selectedYear.toString(), analyzeGaps: isDiag.toString()});\n            const response = await fetch(`\${API_BASE}/api/v1/chains/\${selectedChain}?\${params}`);\n            if (!response.ok) throw new Error(`Backend error: \${response.status}`);\n            const result = await response.json();\n            if (result.detail === Neo4j unavailable) throw new Error(Neo4j unavailable);\n            return result.results?.[0] || {nodes: [], relationships: []};\n        },"
content = re.sub(pattern, replacement, content)

with open("ChainTestDesk.tsx.new", "w") as f:
    f.write(content)
print("Fixed ChainTestDesk.tsx.new created")
