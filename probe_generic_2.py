
import requests
import time
import json

BASE_URL = "https://betaBE.aitwintech.com/api"

print("=== Generic Graph Probe (Narrative) ===")

def check_generic_narrative():
    # Construct Generic Query (Narrative)
    params = {
        "nodeLabels": "EntityRisk,EntityCapability",
        "relationships": "MONITORED_BY",
        "limit": 500,
        "years": "2025",
        "analyzeGaps": "false",  # Narrative
        "excludeEmbeddings": "true"
    }
    
    qs = "&".join([f"{k}={v}" for k,v in params.items()])
    url = f"{BASE_URL}/graph?{qs}"
    
    print(f"\nFetching Generic (Narrative): {url}")
    try:
        res = requests.get(url, timeout=25)
        if res.status_code == 200:
            data = res.json()
            nodes = data.get("nodes", [])
            links = data.get("links", [])
            print(f"  Nodes: {len(nodes)}, Links: {len(links)}")
        else:
            print(f"  Error: {res.status_code}")
    except Exception as e:
        print(f"  Exception: {type(e).__name__}")

check_generic_narrative()
