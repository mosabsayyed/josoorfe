import re
from pathlib import Path

# Fixes from Frontend
LOCATION_FIXES = {
    'jubail': (49.66, 27.01),
    'jubail desalination': (49.66, 27.01),
    'jubail ind. city': (49.60, 27.05),
    'ras al khair': (49.16, 26.54),
    'ras al khair plant': (49.16, 26.54),
    'yanbu': (38.06, 24.09),
    'yanbu desalination': (38.06, 24.09),
    'yanbu ind. city': (38.20, 23.95),
    'shuaibah plant': (39.53, 20.67),
    'shuqaiq plant': (42.06, 17.70),
    'al-kharj ind. city': (47.33, 24.15),
    'neom hydrogen': (35.2, 28.1),
    'king abdulaziz port (dammam)': (50.17, 26.50),
    'riyadh dry port': (46.73, 24.64),
    'waad al shamal': (38.8, 31.7),
    'jeddah islamic port': (39.16, 21.48),
    'king abdullah port': (39.15, 22.5),
    'taif': (40.41, 21.27),
    'riyadh': (46.7, 24.7),
    'hail': (41.7, 27.5),
    'madinah': (39.6, 24.5),
    'makkah': (39.8, 21.4),
    'asir': (42.5, 18.2),
    'al jawf': (40.2, 30.0),
    'jeddah': (39.2, 21.5),
    'dammam': (50.1, 26.4)
}

def get_coords(name):
    key = name.lower().strip()
    # Direct match
    if key in LOCATION_FIXES:
        return LOCATION_FIXES[key]
    # Fuzzy match
    for k, v in LOCATION_FIXES.items():
        if k in key:
            return v
    return (0.0, 0.0)

def fix_cypher():
    base_dir = Path(__file__).parent
    input_file = base_dir / 'sector_import.cypher'
    output_file = base_dir / 'sector_import_fixed.cypher'

    print(f"Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find NetworkConnection blocks
    # Looking for:
    # CREATE (...:NetworkConnection {
    #   ...
    #   source_asset_name: '...',
    #   ...
    #   source_lat: 0,
    #   source_long: 0,
    #   dest_lat: 0,
    #   dest_long: 0,
    #   ...
    # })
    
    # We will iterate line by line to be safer with state
    lines = content.split('\n')
    new_lines = []
    
    current_source = None
    current_dest = None
    in_connection = False
    
    for line in lines:
        if 'NetworkConnection' in line and 'CREATE' in line:
            in_connection = True
            current_source = None
            current_dest = None
        
        if in_connection:
            # key extraction
            if 'source_asset_name:' in line:
                val = line.split(':')[1].strip().strip("',")
                current_source = val
            if 'destination_asset_name:' in line:
                val = line.split(':')[1].strip().strip("',")
                current_dest = val
            
            # Replacement time
            if 'source_lat:' in line and current_source:
                c = get_coords(current_source)
                line = f"  source_lat: {c[1]},"
            if 'source_long:' in line and current_source:
                c = get_coords(current_source)
                line = f"  source_long: {c[0]},"
                
            if 'dest_lat:' in line and current_dest:
                c = get_coords(current_dest)
                line = f"  dest_lat: {c[1]},"
            if 'dest_long:' in line and current_dest:
                c = get_coords(current_dest)
                line = f"  dest_long: {c[0]},"

        if line.strip() == '})':
            in_connection = False
        
        new_lines.append(line)

    print(f"Writing {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
    
    print("Done. Ready to import.")

if __name__ == '__main__':
    fix_cypher()
