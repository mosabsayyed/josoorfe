import requests
import json

# URL from API Catalog v1.4 (Endpoint 2 - Graph Server)
# Catalog says base URL is https://betaBE.aitwintech.com/api, but local is localhost:3001
# URL from API Catalog v1.4 (Endpoint 2 - Graph Server)
GRAPH_URL = "https://betaBE.aitwintech.com/api/graph"

# Params: nodeLabels=SectorGovEntity,SectorBusiness (Broader search)
params = {
    "nodeLabels": "SectorGovEntity,SectorBusiness",
    # "years": "2025" 
}

try:
    print(f"Sending request to {GRAPH_URL} with params {params}...")
    response = requests.get(GRAPH_URL, params=params)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Nodes found: {len(data.get('nodes', []))}")
        print(f"Links found: {len(data.get('links', []))}")
        
        if data.get('nodes'):
            print("\nSample Node 1:")
            print(json.dumps(data['nodes'][0], indent=2))
        
        if data.get('links'):
            print("\nSample Link 1:")
            print(json.dumps(data['links'][0], indent=2))

        # Analyze Nodes (FLAT STRUCTURE)
        nodes = data.get('nodes', [])
        if nodes:
            # Check distinct labels/sectors
            sectors = set(n.get('sector') for n in nodes)
            print(f"Sectors found: {sectors}")
            
            # Check for Energy specifically
            energy_nodes = [n for n in nodes if n.get('sector') == 'energy']
            print(f"Energy nodes found: {len(energy_nodes)}")
            
            # Check for Connections
            connection_nodes = [n for n in nodes if n.get('asset_type') == 'Network Connection']
            print(f"Network Connection nodes found: {len(connection_nodes)}")
            
            if connection_nodes:
                print("Sample Connection Node:")
                print(json.dumps(connection_nodes[0], indent=2))
            
    else:
        print(f"Error response: {response.text}")

except Exception as e:
    print(f"❌ Error: {e}")
