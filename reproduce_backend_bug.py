import requests
import json
import sys

# Configuration
BASE_URL = "https://betaBE.aitwintech.com"  # Using correct backend from vite.config.ts
CHAINS_TO_TEST = ["build_oversight", "operate_oversight"]

# Mappings from ExplorerDesk.tsx
CHAIN_MAPPINGS = {
    'build_oversight': {
        'labels': ['EntityRisk', 'EntityCapability', 'SectorPolicyTool'],
        'relationships': ['MONITORED_BY', 'EXECUTES', 'SETS_PRIORITIES', 'INFORMS']
    },
    'operate_oversight': {
        'labels': ['EntityRisk', 'EntityCapability', 'SectorPerformance', 'SectorObjective'],
        'relationships': ['MONITORED_BY', 'REPORTS', 'SETS_TARGETS', 'INFORMS', 'AGGREGATES_TO']
    }
}

def test_chain(chain_name):
    print(f"\n--- Testing Chain: {chain_name} ---")
    
    # 1. Test Specific Endpoint (The Broken One)
    url_specific = f"{BASE_URL}/api/business-chain/{chain_name}?year=2025&analyzeGaps=false&excludeEmbeddings=true"
    print(f"1. Calling Specific Endpoint: {url_specific}")
    try:
        resp_specific = requests.get(url_specific, timeout=10)
        if resp_specific.status_code == 200:
            data_spec = resp_specific.json()
            nodes_spec = len(data_spec.get('nodes', []))
            links_spec = len(data_spec.get('links', []))
            print(f"   RESULT: {nodes_spec} nodes, {links_spec} links")
        else:
            print(f"   FAILED: Status {resp_specific.status_code}")
            data_spec = None
    except Exception as e:
        print(f"   ERROR: {e}")
        data_spec = None

    # 2. Test Generic Endpoint (The Expected Behavior)
    mapping = CHAIN_MAPPINGS[chain_name]
    params = {
        'nodeLabels': ','.join(mapping['labels']),
        'relationships': ','.join(mapping['relationships']),
        'limit': 200,
        'years': '2025', # Note: 'years' plural for generic
        'analyzeGaps': 'false',
        'excludeEmbeddings': 'true'
    }
    url_generic = f"{BASE_URL}/api/graph"
    print(f"2. Calling Generic Endpoint: {url_generic}")
    print(f"   Params: {json.dumps(params)}")
    
    try:
        resp_generic = requests.get(url_generic, params=params, timeout=10)
        if resp_generic.status_code == 200:
            data_gen = resp_generic.json()
            nodes_gen = len(data_gen.get('nodes', []))
            links_gen = len(data_gen.get('links', []))
            print(f"   RESULT: {nodes_gen} nodes, {links_gen} links")
        else:
            print(f"   FAILED: Status {resp_generic.status_code}")
            data_gen = None
    except Exception as e:
        print(f"   ERROR: {e}")
        data_gen = None

    # Comparison
    if data_spec and data_gen:
        diff_nodes = nodes_gen - nodes_spec
        print(f"\nCONCLUSION for {chain_name}:")
        if diff_nodes > 0:
            print(f"❌ BUG CONFIRMED. Specific endpoint missing {diff_nodes} nodes and {len(data_gen.get('links', [])) - len(data_spec.get('links', []))} links compared to Generic API.")
        else:
            print(f"✅ Data matches (or specific has more).")

if __name__ == "__main__":
    for chain in CHAINS_TO_TEST:
        test_chain(chain)
