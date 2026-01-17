
import requests
import json
import sys

# URL from external setup
BASE_URL = "https://betaBE.aitwintech.com/api"

def inspect_chain(chain, mode="Diagnostic"):
    analyze_gaps = "true" if mode == "Diagnostic" else "false"
    url = f"{BASE_URL}/business-chain/{chain}?year=2025&analyzeGaps={analyze_gaps}&excludeEmbeddings=true"
    
    print(f"Fetching {chain} ({mode})...")
    try:
        res = requests.get(url, timeout=30)
        res.raise_for_status()
        data = res.json()
        
        nodes = data.get("nodes", [])
        links = data.get("links", [])
        
        print(f"Nodes: {len(nodes)}, Links: {len(links)}")
        
        if nodes:
            print("\n--- Node Sample (First 2) ---")
            for n in nodes[:2]:
                print(json.dumps(n, indent=2))
                
            # Check for 'status' in properties
            critical_nodes = [n for n in nodes if n.get('properties', {}).get('status') == 'critical']
            print(f"\nCritical Nodes Count: {len(critical_nodes)}")
            if critical_nodes:
                print("Sample Critical Node:")
                print(json.dumps(critical_nodes[0], indent=2))
        else:
            print("No nodes returned.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_chain("build_oversight", "Diagnostic")
