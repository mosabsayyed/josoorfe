import urllib.request
import json
import csv
import sys

# Configuration
ENDPOINT = "https://betaBE.aitwintech.com/4/mcp/"
QUERY = "MATCH (n:SectorPolicyTool) RETURN n { .*, embedding: null, vector: null, description_embedding: null }"
OUTPUT_FILE = "sector_policy_tools_dump.csv"

def fetch_data():
    print(f"Fetching data from {ENDPOINT}...")
    
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "read_neo4j_cypher",
            "arguments": {
                "query": QUERY
            }
        }
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(ENDPOINT, data=data, method='POST')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Accept', 'application/json, text/event-stream')

    try:
        with urllib.request.urlopen(req) as response:
            # Parse SSE Line (assuming first data line is the payload)
            for line in response:
                if line:
                    decoded_line = line.decode('utf-8').strip()
                    if decoded_line.startswith("data: "):
                        json_str = decoded_line[6:] # Strip "data: "
                        return json.loads(json_str)
                    
        print("Error: No data line found in response")
        return None
        
    except Exception as e:
        print(f"Request Failed: {e}")
        return None

def process_and_save_csv(response_json):
    if not response_json or 'result' not in response_json:
        print("Invalid JSON response structure")
        return

    content_list = response_json['result']['content']
    if not content_list:
        print("No content found")
        return

    # The content text is a stringified JSON array of rows
    try:
        raw_text = content_list[0]['text']
        rows = json.loads(raw_text) # List of objects like {"n": {...}}
    except Exception as e:
        print(f"Failed to parse content text: {e}")
        return

    print(f"Processing {len(rows)} records...")

    # Extract all unique keys for CSV header
    all_keys = set()
    flattened_rows = []

    for row in rows:
        node = row.get('n', {})
        # Flatten keys
        flat_node = {}
        for k, v in node.items():
            if isinstance(v, (dict, list)):
                flat_node[k] = json.dumps(v) # Stringify complex objects
            else:
                flat_node[k] = v
            all_keys.add(k)
        flattened_rows.append(flat_node)

    # Sort keys for consistent column order
    fieldnames = sorted(list(all_keys))

    # Write CSV
    print(f"Writing to {OUTPUT_FILE}...")
    try:
        with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
            writer.writeheader()
            for row in flattened_rows:
                writer.writerow(row)
        print("Success!")
    except Exception as e:
        print(f"Failed to write CSV: {e}")

if __name__ == "__main__":
    data = fetch_data()
    process_and_save_csv(data)
