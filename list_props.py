
import json

try:
    with open('backend_response_v2.json', 'r') as f:
        data = json.load(f)

    nodes = data.get('nodes', [])
    
    # Track all keys and example values
    prop_stats = {}

    for node in nodes:
        # Only check rendered nodes (Gov/Business with coords)
        # Actually user asked "what are the other props available?", implies for these visible nodes.
        if (node.get('latitude') or node.get('lat')):
            for k, v in node.items():
                if v and str(v).lower() != 'nan':
                    if k not in prop_stats:
                        prop_stats[k] = {'count': 0, 'example': v}
                    prop_stats[k]['count'] += 1

    print("STATS_START")
    print("\n--- AVAILABLE PROPERTIES (Visible Nodes) ---")
    print(f"{'PROPERTY':<25} | {'COUNT':<5} | {'EXAMPLE VALUE'}")
    print("-" * 60)
    
    for k, stat in sorted(prop_stats.items(), key=lambda x: x[1]['count'], reverse=True):
        val_str = str(stat['example'])
        if len(val_str) > 30: val_str = val_str[:27] + "..."
        print(f"{k:<25} | {stat['count']:<5} | {val_str}")

    print("STATS_END")

except Exception as e:
    print(f"Error: {e}")
