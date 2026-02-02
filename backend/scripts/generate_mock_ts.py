
import csv
import json
from pathlib import Path

def clean_key(key):
    return key.lower().replace(' ', '_').replace('/', '_').replace('-', '_')

def load_csv_data(filepath):
    data = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    return data

def map_category_to_sector(category):
    cat = category.lower()
    if 'mining' in cat: return 'mining'
    if 'water' in cat: return 'water'
    if 'energy' in cat: return 'energy'
    if 'industrial' in cat or 'industry' in cat or 'special zone' in cat: return 'industry'
    if 'logistics' in cat or 'transport' in cat or 'infrastructure' in cat or 'aviation' in cat: return 'logistics'
    if 'giga' in cat or 'real estate' in cat or 'sports' in cat or 'entertainment' in cat or 'tourism' in cat: return 'giga'
    return 'default'

def main():
    nodes = []
    
    # L1
    l1_file = Path('/home/mosab/projects/josoorfe/Aggregated asset.csv')
    if l1_file.exists():
        l1_data = load_csv_data(l1_file)
        for i, row in enumerate(l1_data):
            # L1 Node
            category = row.get('Category', 'Other')
            node = {
                'id': f"L1-{i+1:03d}",
                'labels': ['SectorPolicyTools'],
                'name': row.get('Asset Name', ''),
                'sector': map_category_to_sector(category), # Mapped Sector
                'category': category,
                'sub_category': row.get('Sub-Category', ''),
                'status': row.get('Status', 'Active'),
                'region': row.get('Region', ''),
                'description': row.get('Description', ''),
                'investment': row.get('Investment', ''),
                'merged_count': int(row.get('Merged Asset Count', 0) or 0),
                'level': 'L1',
                'type': 'Cluster',
                'lat': 0.0,
                'lng': 0.0
            }
            try:
                if row.get('Latitude') and row.get('Longitude'):
                    node['lat'] = float(row.get('Latitude'))
                    node['lng'] = float(row.get('Longitude'))
                    node['latitude'] = node['lat']
                    node['longitude'] = node['lng']
            except: pass
            nodes.append(node)

    # L2
    l2_file = Path('/home/mosab/projects/josoorfe/saudi_assets_long.csv')
    if l2_file.exists():
        l2_data = load_csv_data(l2_file)
        for row in l2_data:
            node_id = row.get('id', '')
            if not node_id: continue
            
            node = {
                'id': node_id,
                'labels': ['SectorPolicyTools'],
                'name': row.get('name', ''),
                'sector': map_category_to_sector(row.get('category', 'Other')),
                'category': row.get('category', ''),
                'sub_category': row.get('subCategory', ''),
                'status': row.get('status', 'Active'),
                'region': row.get('region', ''),
                'description': row.get('description', ''),
                'capacity': row.get('capacity', ''),
                'investment': row.get('investment', ''),
                'priority': row.get('priority', ''),
                'fiscal_action': row.get('fiscalAction', ''),
                'rationale': row.get('rationale', ''),
                'level': 'L2',
                'type': 'Asset',
                'lat': 0.0,
                'lng': 0.0
            }
            try:
                 lat = row.get('lat') or row.get('latitude')
                 lng = row.get('long') or row.get('longitude')
                 if lat and lng:
                    node['lat'] = float(lat)
                    node['lng'] = float(lng)
                    node['latitude'] = node['lat']
                    node['longitude'] = node['lng']
            except: pass
            nodes.append(node)

    # Write TS File
    ts_content = f"""
// Auto-generated Mock Data for Sector Policy Tools
export const SECTOR_POLICY_MOCK_DATA = {json.dumps(nodes, indent=2)};
"""
    
    out_file = Path('/home/mosab/projects/josoorfe/frontend/src/components/desks/sector/data/SectorPolicyMock.ts')
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    
    print(f"Generated {len(nodes)} mock nodes at {out_file}")

if __name__ == "__main__":
    main()
