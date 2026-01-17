
import requests
import socket
import time

URLS = [
    ("betaBE", "https://betaBE.aitwintech.com/api"),
    ("IP_148", "http://148.230.105.139:3001/api")
]

CHAIN = "build_oversight"

def check_socket(host, port):
    try:
        sock = socket.create_connection((host, port), timeout=2)
        sock.close()
        return True
    except Exception:
        return False

def resolve_beta():
    try:
        ip = socket.gethostbyname("betaBE.aitwintech.com")
        print(f"betaBE resolves to: {ip}")
    except:
        print("betaBE DNS resolution failed")

print("=== DNS/Connectivity Check ===")
resolve_beta()
print(f"Checking 148.230.105.139:3001: {'OPEN' if check_socket('148.230.105.139', 3001) else 'CLOSED'}")

for name, base_url in URLS:
    print(f"\n=== Testing {name} ({base_url}) ===")
    
    # Narrative
    url_n = f"{base_url}/business-chain/{CHAIN}?year=2025&analyzeGaps=false&excludeEmbeddings=true"
    try:
        t0 = time.time()
        res = requests.get(url_n, timeout=5)
        print(f"GET Narrative: {res.status_code} ({time.time()-t0:.2f}s)")
        if res.status_code == 200:
            data = res.json()
            nodes = data.get("nodes", [])
            links = data.get("links", [])
            print(f"  Nodes: {len(nodes)}, Links: {len(links)}")
        else:
            print(f"  Error: {res.text[:100]}")
    except Exception as e:
        print(f"  Exception: {e}")

    # Diagnostic
    url_d = f"{base_url}/business-chain/{CHAIN}?year=2025&analyzeGaps=true&excludeEmbeddings=true"
    try:
        res = requests.get(url_d, timeout=5)
        print(f"GET Diagnostic: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            nodes = data.get("nodes", [])
            links = data.get("links", [])
            print(f"  Nodes: {len(nodes)}, Links: {len(links)}")
            # Check Status
            crit = len([n for n in nodes if n.get('properties', {}).get('status') == 'critical'])
            print(f"  Critical Nodes: {crit}/{len(nodes)}")
    except Exception as e:
        print(f"  Exception: {e}")
