#!/usr/bin/env python3
"""
Generate Cypher statements for KSA Sector Desk Neo4j import
Parses: strategicAssets.ts, template.dataset.json, ksa_master_db.json
Outputs: Complete Cypher CREATE statements with sector value chain loop
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any

# Sector to Pillar mapping
SECTOR_TO_PILLAR = {
    'health': 'society',
    'livability': 'society',
    'water': 'society',
    'culture': 'society',
    'energy': 'economy',
    'industry': 'economy',
    'logistics': 'economy',
    'mining': 'economy',
    'gov': 'nation'
}

# Asset category to sector mapping (from strategicAssets.ts)
CATEGORY_TO_SECTOR = {
    'Industrial City': 'industry',
    'Special Zone': 'industry',
    'Utilities': 'water',  # Can be water or energy based on subCategory
    'Giga Project': 'GIGA',
    'Real Estate': 'GIGA',
    'Industrial': 'industry',
    'Mining': 'mining',
    'Energy': 'energy',
    'Logistics': 'logistics',
    'Infrastructure': 'logistics',
    'Sports': 'GIGA',
    'Entertainment': 'GIGA',
    'Agriculture': 'industry',
    'Food': 'logistics'
}

def parse_strategic_assets(ts_file_path: str) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Parse strategicAssets.ts TypeScript file to extract asset and connection data"""
    with open(ts_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Parse Assets
    assets = []
    match_assets = re.search(r'export const strategicAssets: StrategicAsset\[\] = \[(.*?)\];', content, re.DOTALL)
    if match_assets:
        array_content = match_assets.group(1)
        asset_pattern = r'\{([^}]+)\}'
        for asset_match in re.finditer(asset_pattern, array_content):
            asset_str = asset_match.group(1)
            asset = {}
            for line in asset_str.split(','):
                line = line.strip()
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip()
                    value = value.strip().strip("'\"")
                    if key in ['lat', 'long']:
                        try:
                            asset[key] = float(value)
                        except:
                            asset[key] = value
                    else:
                        asset[key] = value
            if asset.get('id'):
                assets.append(asset)

    # 2. Parse Connections
    connections = []
    match_conns = re.search(r'export const strategicConnections: NetworkConnection\[\] = \[(.*?)\];', content, re.DOTALL)
    if match_conns:
        conn_content = match_conns.group(1)
        conn_pattern = r'\{([^}]+)\}'
        for conn_match in re.finditer(conn_pattern, conn_content):
            conn_str = conn_match.group(1)
            conn = {}
            for line in conn_str.split(','):
                line = line.strip()
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip()
                    value = value.strip().strip("'\"")
                    conn[key] = value
            if conn.get('source') and conn.get('target'):
                # Map TS fields to Generator fields
                connections.append({
                    'from': conn.get('source'),
                    'to': conn.get('target'),
                    'type': (conn.get('type') or 'Transport').lower(),
                    'label': f"{conn.get('type')} Connection"
                })
    
    return assets, connections

# ... (classify_asset_ownership, get_asset_sector, generate_asset_cypher kept same) ...
# I will keep the middle functions but verify if I need to re-output them if I use replace_file_content partial

def main():
    # Paths
    project_root = Path(__file__).parent.parent.parent
    assets_file = project_root / 'frontend/src/components/desks/sector/data/strategicAssets.ts'
    master_db_file = project_root / 'docs/final mapping/ksa_master_db.json'
    output_file = project_root / 'backend/scripts/sector_import.cypher'
    
    print("🚀 Generating Cypher statements for KSA Sector Desk...")
    
    all_cypher = []
    
    # 1. Parse Assets & Connections
    print("\n📦 Processing strategic assets and connections...")
    assets, networks = parse_strategic_assets(str(assets_file))
    print(f"   Found {len(assets)} assets")
    print(f"   Found {len(networks)} network connections")
    
    asset_cypher = generate_asset_cypher(assets)
    all_cypher.extend(asset_cypher)
    
    network_cypher = generate_network_cypher(networks, assets)
    all_cypher.extend(network_cypher)
    
    # 3. Parse and generate sector value chain Cypher
    print("\n🔗 Processing sector value chains...")
    with open(master_db_file, 'r', encoding='utf-8') as f:
        master_db = json.load(f)
    
    for sector_data in master_db.get('sectors', []):
        sector_id = sector_data['id']
        print(f"   - {sector_id}: {sector_data['name']}")
        sector_cypher = generate_sector_value_chain_cypher(sector_data)
        all_cypher.extend(sector_cypher)
    
    # Write output
    print(f"\n💾 Writing Cypher to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("// KSA Sector Desk - Neo4j Import Script\n")
        f.write("// Generated: 2025-01-22\n")
        f.write(f"// Total statements: {len(all_cypher)}\n\n")
        f.write('\n'.join(all_cypher))
    
    print(f"\n✅ Done! Generated {len(all_cypher)} Cypher statements")

if __name__ == '__main__':
    main()
