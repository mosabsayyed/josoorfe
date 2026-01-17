
import requests
import time
import json

BASE_URL = "https://betaBE.aitwintech.com/api"

print("=== Deep Probe ===")

def check(chain, exclude_emb):
    url = f"{BASE_URL}/business-chain/{chain}?year=2025&analyzeGaps=true&excludeEmbeddings={str(exclude_emb).lower()}"
    print(f"\nScanning {chain} (excludeEmbeddings={exclude_emb})...")
    try:
        t0 = time.time()
        res = requests.get(url, timeout=25)
        if res.status_code == 200:
            data = res.json()
            nodes = data.get("nodes", [])
            links = data.get("links", [])
            print(f"  Nodes: {len(nodes)}, Links: {len(links)}")
            
            # Analyze Node Types
            types = {}
            for n in nodes:
                lbl = n.get('labels', ['Unknown'])[0]
                types[lbl] = types.get(lbl, 0) + 1
            print(f"  Types: {json.dumps(types)}")
        else:
            print(f"  Error: {res.status_code}")
    except Exception as e:
        print(f"  Exception: {type(e).__name__}")

check("setting_strategic_initiatives", True)
check("build_oversight", False)
check("build_oversight", True)
