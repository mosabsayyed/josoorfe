import urllib.request
import json
import ssl

url = "https://betaBE.aitwintech.com/4/mcp/" # Try with trailing slash
headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream" 
}
data = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "read_neo4j_cypher",
        "arguments": {
            "query": "MATCH (n:SectorPolicyTool) RETURN count(n) as count"
        }
    }
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)

print(f"Testing {url}...")
try:
    with urllib.request.urlopen(req, context=ctx) as response:
        print(f"Status: {response.status}")
        print("Response:")
        print(response.read().decode('utf-8')[:500])
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
