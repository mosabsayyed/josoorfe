import re
from collections import Counter

FILE = 'frontend/src/components/desks/sector/data/strategicAssets.ts'

def count_assets():
    with open(FILE, 'r') as f:
        content = f.read()
    
    # Regex to find individual asset blocks
    # { id: '...', name: '...', category: '...', ... }
    # We look for category: '...'
    
    categories = []
    
    # Rough parsing
    lines = content.split('\n')
    for line in lines:
        if "category: '" in line:
            parts = line.split("category: '")
            if len(parts) > 1:
                cat = parts[1].split("'")[0]
                categories.append(cat)
    
    c = Counter(categories)
    
    # Mapping to Gov vs Business (Hypothesis to be confirmed by user rules or my deduction)
    # Gov: Industrial City, Special Zone, Utilities, Infrastructure, Mining, Energy, Logistics, Agriculture
    # Business: Giga Project, Real Estate, Industrial (Factories), Sports, Entertainment, Food
    
    GOV_CATS = ['Industrial City', 'Special Zone', 'Utilities', 'Infrastructure', 'Mining', 'Energy', 'Logistics', 'Agriculture', 'Investor Tool']
    BUS_CATS = ['Giga Project', 'Real Estate', 'Industrial', 'Sports', 'Entertainment', 'Food']
    
    gov_count = 0
    bus_count = 0
    
    print("--- RAW COUNTS ---")
    for cat, count in c.items():
        print(f"{cat}: {count}")
        if cat in GOV_CATS:
            gov_count += count
        elif cat in BUS_CATS:
            bus_count += count
        else:
            print(f"WARNING: Unclassified category: {cat}")

    print("\n--- CLASSIFIED ---")
    print(f"SectorGovEntity (Approx): {gov_count}")
    print(f"SectorBusiness (Approx): {bus_count}")
    print(f"Total: {sum(c.values())}")

count_assets()
