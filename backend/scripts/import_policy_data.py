
import os
import csv
import json
import requests
from pathlib import Path

# Configuration
# Using the backend proxy as discovered in import_to_neo4j.py
NEO4J_ENDPOINT = "https://betaBE.aitwintech.com/api/neo4j/query"

def run_query(query):
    # The backend endpoint expects 'query' key, not 'statements'
    payload = {"query": query}
    try:
        response = requests.post(
            NEO4J_ENDPOINT, 
            json=payload, 
            headers={"Content-Type": "application/json"}, 
            timeout=60
        )
        if response.status_code != 200:
            print(f"Error {response.status_code}: {response.text}")
            return None
        return response.json()
    except Exception as e:
        print(f"Connection Error: {e}")
        return None

def load_csv_data(filepath):
    data = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    return data

def main():
    print("🚀 Starting Sector Policy Tools Import via BetaBE Proxy...")

    # 1. Clear existing nodes
    print("🧹 Clearing old SectorPolicyTools nodes...")
    run_query("MATCH (n:SectorPolicyTools) DETACH DELETE n")

    # 2. Ingest L1 (Aggregated Assets)
    l1_file = Path('/home/mosab/projects/josoorfe/Aggregated asset.csv')
    if not l1_file.exists():
        print(f"❌ File not found: {l1_file}")
        return

    print(f"📦 Processing L1: {l1_file.name}")
    l1_data = load_csv_data(l1_file)
    
    for i, row in enumerate(l1_data):
        # Generate ID since L1 doesn't have one
        node_id = f"L1-{i+1:03d}"
        
        # Clean properties
        props = {
            'id': node_id,
            'name': row.get('Asset Name', ''),
            'category': row.get('Category', ''),
            'sub_category': row.get('Sub-Category', ''),
            'status': row.get('Status', ''),
            'region': row.get('Region', ''),
            'description': row.get('Description', ''),
            'investment': row.get('Investment', ''),
            'merged_count': int(row.get('Merged Asset Count', 0) or 0),
            'level': 'L1',
            'type': 'Cluster'
        }
        
        # Handle Coords
        try:
            if row.get('Latitude') and row.get('Longitude'):
                props['latitude'] = float(row.get('Latitude'))
                props['longitude'] = float(row.get('Longitude'))
            else:
                 props['latitude'] = 0.0
                 props['longitude'] = 0.0
        except ValueError:
            print(f"⚠️ Invalid coords for {props['name']}")
            continue

        # Cypher Query
        query = f"""
        CREATE (n:SectorPolicyTools {{
            id: '{props['id']}',
            name: '{props['name']}',
            category: '{props['category']}',
            sub_category: '{props['sub_category']}',
            status: '{props['status']}',
            region: '{props['region']}',
            description: '{props['description']}',
            investment: '{props['investment']}',
            merged_count: {props['merged_count']},
            level: 'L1',
            type: 'Cluster',
            latitude: {props['latitude']},
            longitude: {props['longitude']}
        }})
        """
        # Note: Using f-string for simple properties to match import_to_neo4j pattern 
        # (Parameter support might be limited in the proxy)
        run_query(query)
        print(f"   Created L1: {props['name']}")

    # 3. Ingest L2 (Detailed Assets)
    l2_file = Path('/home/mosab/projects/josoorfe/saudi_assets_long.csv')
    if not l2_file.exists():
        print(f"❌ File not found: {l2_file}")
        return

    print(f"\n📦 Processing L2: {l2_file.name}")
    l2_data = load_csv_data(l2_file)

    for row in l2_data:
        # L2 has ID column
        node_id = row.get('id', '')
        if not node_id: continue

        props = {
            'id': node_id,
            'name': row.get('name', ''),
            'category': row.get('category', ''),
            'sub_category': row.get('subCategory', ''),
            'status': row.get('status', ''),
            'region': row.get('region', ''),
            'description': row.get('description', ''),
            'capacity': row.get('capacity', ''),
            'investment': row.get('investment', ''),
            'priority': row.get('priority', ''),
            'fiscal_action': row.get('fiscalAction', ''),
            'rationale': row.get('rationale', ''),
            'level': 'L2',
            'type': 'Asset'
        }

        # Handle Coords
        try:
             lat = row.get('lat') or row.get('latitude')
             lng = row.get('long') or row.get('longitude')
             if lat and lng:
                props['latitude'] = float(lat)
                props['longitude'] = float(lng)
             else:
                props['latitude'] = 0.0
                props['longitude'] = 0.0
        except ValueError:
             print(f"⚠️ Invalid coords for {props['name']}")
             continue
        
        # Cypher Query for L2
        # Escaping quotes in description/rational if needed
        desc = props['description'].replace("'", "\\'")
        rat = props['rationale'].replace("'", "\\'")
        name = props['name'].replace("'", "\\'")

        query = f"""
        CREATE (n:SectorPolicyTools {{
            id: '{props['id']}',
            name: '{name}',
            category: '{props['category']}',
            sub_category: '{props['sub_category']}',
            status: '{props['status']}',
            region: '{props['region']}',
            description: '{desc}',
            capacity: '{props['capacity']}',
            investment: '{props['investment']}',
            priority: '{props['priority']}',
            fiscal_action: '{props['fiscal_action']}',
            rationale: '{rat}',
            level: 'L2',
            type: 'Asset',
            latitude: {props['latitude']},
            longitude: {props['longitude']}
        }})
        """
        run_query(query)
        # print(f"   Created L2: {props['name']}")

    print("\n✅ Import Complete.")

if __name__ == "__main__":
    main()
