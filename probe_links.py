
import requests
import time

URLS = [
    ("betaBE", "https://betaBE.aitwintech.com/api"),
    ("IP_148_8008", "http://148.230.105.139:8008/api")
]

CHAINS = ["sector_value_chain", "build_oversight"]

print("=== Link Validity Probe ===")

for name, base_url in URLS:
    print(f"\n>>> Source: {name} ({base_url})")
    
    for chain in CHAINS:
        print(f"  --- Chain: {chain} ---")
        
        # Test Both Modes
        for mode, gap in [("Narrative", "false"), ("Diagnostic", "true")]:
            url = f"{base_url}/business-chain/{chain}?year=2025&analyzeGaps={gap}&excludeEmbeddings=true"
            try:
                t0 = time.time()
                res = requests.get(url, timeout=10)
                dur = time.time() - t0
                
                if res.status_code == 200:
                    try:
                        data = res.json()
                        nodes = len(data.get("nodes", []))
                        links = len(data.get("links", []))
                        print(f"    [{mode}] 200 OK ({dur:.2f}s) -> Nodes: {nodes}, Links: {links}")
                    except ValueError:
                         print(f"    [{mode}] 200 OK ({dur:.2f}s) -> INVALID JSON")
                else:
                    print(f"    [{mode}] {res.status_code} ({dur:.2f}s)")
            except Exception as e:
                print(f"    [{mode}] Error: {type(e).__name__}")

