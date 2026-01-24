
import requests
import time
import json

BASE_URL = "https://betaBE.aitwintech.com/api"

print("=== Generic Graph Probe ===")

def check_generic():
    # Construct Generic Query
    params = {
        "nodeLabels": "EntityRisk,EntityCapability",
        "relationships": "MONITORED_BY",
        "limit": 500,
        "years": "2025",
        "analyzeGaps": "true",
        "excludeEmbeddings": "true"
    }
    
    # Form manually to ensure correct format
    qs = "&".join([f"{k}={v}" for k,v in params.items()])
    url = f"{BASE_URL}/graph?{qs}"
    
    print(f"\nFetching Generic Graph: {url}")
    try:
        t0 = time.time()
        res = requests.get(url, timeout=25)
        if res.status_code == 200:
            data = res.json()
            nodes = data.get("nodes", [])
            links = data.get("links", [])
            print(f"  Nodes: {len(nodes)}, Links: {len(links)}")
            
            # Analyze Types
            types = {}
            for n in nodes:
                lbl = n.get('labels', ['Unknown'])[0]
                types[lbl] = types.get(lbl, 0) + 1
            print(f"  Types: {json.dumps(types)}")
            
        else:
            print(f"  Error: {res.status_code} {res.text[:100]}")
    except Exception as e:
        print(f"  Exception: {type(e).__name__} {str(e)}")

check_generic()
