"""
Structure capacity data on SectorPolicyTool nodes.
Parses free-text capacity strings into structured fields:
  - capacity_value (float): numeric value
  - capacity_unit (string): unit of measurement
  - capacity_raw (string): original string preserved

Run via: python3 backend/scripts/structure_capacity_data.py
Requires: MCP Neo4j write endpoint on port 8080
"""
import re
import json
import requests

MCP_WRITE_URL = "http://127.0.0.1:8080/mcp/tools/write_neo4j_cypher/call"
MCP_READ_URL = "http://127.0.0.1:8080/mcp/tools/read_neo4j_cypher/call"


def read_cypher(query: str):
    resp = requests.post(MCP_READ_URL, json={"query": query, "params": {}})
    resp.raise_for_status()
    data = resp.json()
    # Parse MCP response
    if isinstance(data, dict) and "content" in data:
        text = data["content"][0]["text"] if data["content"] else "[]"
        return json.loads(text)
    return data


def write_cypher(query: str, params: dict = None):
    resp = requests.post(MCP_WRITE_URL, json={"query": query, "params": params or {}})
    resp.raise_for_status()
    return resp.json()


def parse_capacity(raw: str) -> dict:
    """Parse a free-text capacity string into {value, unit}."""
    if not raw:
        return {"value": None, "unit": None}

    cleaned = raw.lower().strip()
    cleaned = re.sub(r'[,~><+]', '', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned)

    # No digits = purely descriptive (e.g. "Clean Industry Hub", "Gold Ore")
    if not re.search(r'\d', cleaned):
        return {"value": None, "unit": raw.strip()}

    # Multiplier suffixes
    def get_multiplier(suffix):
        s = (suffix or '').lower()
        if s == 'm': return 1_000_000
        if s == 'k': return 1_000
        if s == 'g': return 1_000_000_000
        if s == 'b': return 1_000_000_000
        return 1

    # Water: "2.9M m3/day", "600k m3/day", "2.5M m3 Storage"
    m = re.search(r'(\d+\.?\d*)\s*([mk])?\s*m[3³]', cleaned)
    if m:
        val = float(m.group(1)) * get_multiplier(m.group(2))
        unit = "m3/day" if "day" in cleaned or "/" in cleaned else "m3"
        return {"value": val, "unit": unit}

    # Power GW: "3.6 GW"
    m = re.search(r'(\d+\.?\d*)\s*gw', cleaned)
    if m:
        return {"value": float(m.group(1)) * 1000, "unit": "MW"}

    # Power MW: "3927 MW", "4000 MW"
    m = re.search(r'(\d+\.?\d*)\s*mw', cleaned)
    if m:
        return {"value": float(m.group(1)), "unit": "MW"}

    # Barrels: "400k bpd"
    m = re.search(r'(\d+\.?\d*)\s*([mk])?\s*bpd', cleaned)
    if m:
        return {"value": float(m.group(1)) * get_multiplier(m.group(2)), "unit": "bpd"}

    # Vehicles: "155k Vehicles/yr"
    m = re.search(r'(\d+\.?\d*)\s*([mk])?\s*vehicle', cleaned)
    if m:
        return {"value": float(m.group(1)) * get_multiplier(m.group(2)), "unit": "vehicles/yr"}

    # Passengers: "3m Pax", "0.5m Pax"
    m = re.search(r'(\d+\.?\d*)\s*([mk])?\s*pax', cleaned)
    if m:
        return {"value": float(m.group(1)) * get_multiplier(m.group(2)), "unit": "passengers"}

    # Homes: "30k Homes"
    m = re.search(r'(\d+\.?\d*)\s*([mk])?\s*home', cleaned)
    if m:
        return {"value": float(m.group(1)) * get_multiplier(m.group(2)), "unit": "homes"}

    # Hotel Keys: "3000 Hotel Keys"
    m = re.search(r'(\d+\.?\d*)\s*([mk])?\s*(hotel\s*)?keys?', cleaned)
    if m:
        return {"value": float(m.group(1)) * get_multiplier(m.group(2)), "unit": "hotel_keys"}

    # Seats: "92760 seats"
    m = re.search(r'(\d+\.?\d*)\s*([mk])?\s*seats?', cleaned)
    if m:
        return {"value": float(m.group(1)) * get_multiplier(m.group(2)), "unit": "seats"}

    # Area sq km: "440 sq km", ">1000 sq km"
    m = re.search(r'(\d+\.?\d*)\s*([mk])?\s*(?:sq\s*)?km', cleaned)
    if m:
        return {"value": float(m.group(1)) * get_multiplier(m.group(2)), "unit": "sq_km"}

    # Area m2: "40000 m2", "64000 m2"
    m = re.search(r'(\d+\.?\d*)\s*([mk])?\s*m[2²]', cleaned)
    if m:
        return {"value": float(m.group(1)) * get_multiplier(m.group(2)), "unit": "m2"}

    # Tonnes: "10000 MT Daily", "25M tonnes ore"
    m = re.search(r'(\d+\.?\d*)\s*([mk])?\s*(?:mt|tonne|ton)', cleaned)
    if m:
        val = float(m.group(1)) * get_multiplier(m.group(2))
        unit = "mt/day" if "daily" in cleaned or "day" in cleaned else "mt"
        return {"value": val, "unit": unit}

    # Generic number with suffix: "1000 km2"
    m = re.search(r'(\d+\.?\d*)\s*([mkgb])?\b', cleaned)
    if m and float(m.group(1)) > 0:
        return {"value": float(m.group(1)) * get_multiplier(m.group(2)), "unit": "numeric"}

    return {"value": None, "unit": raw.strip()}


def main():
    print("=== Structure Capacity Data on SectorPolicyTool Nodes ===\n")

    # 1. Read all nodes with capacity field
    nodes = read_cypher("""
        MATCH (n:SectorPolicyTool)
        WHERE n.capacity IS NOT NULL AND n.capacity <> ''
        RETURN n.id AS id, n.name AS name, n.capacity AS capacity, n.year AS year
        ORDER BY n.id
    """)

    print(f"Found {len(nodes)} nodes with capacity field\n")

    # 2. Parse and preview
    updates = []
    failures = []
    for node in nodes:
        raw = node.get("capacity", "")
        parsed = parse_capacity(raw)
        updates.append({
            "id": node["id"],
            "year": node.get("year"),
            "name": node.get("name"),
            "raw": raw,
            "value": parsed["value"],
            "unit": parsed["unit"]
        })
        if parsed["value"] is None:
            failures.append(f"  {node['id']} ({node.get('name')}): '{raw}' → descriptive only")

    # Stats
    numeric = [u for u in updates if u["value"] is not None]
    descriptive = [u for u in updates if u["value"] is None]
    print(f"Parsed: {len(numeric)} numeric, {len(descriptive)} descriptive\n")

    if failures:
        print(f"Descriptive (no numeric value):")
        for f in failures[:20]:
            print(f)
        if len(failures) > 20:
            print(f"  ... and {len(failures) - 20} more")
        print()

    # Show sample numeric parses
    print("Sample numeric parses:")
    for u in numeric[:15]:
        print(f"  {u['id']} ({u['name']}): '{u['raw']}' → {u['value']} {u['unit']}")
    print()

    # 3. Write structured fields back to Neo4j
    confirm = input("Write to Neo4j? (yes/no): ").strip().lower()
    if confirm != "yes":
        print("Aborted.")
        return

    success = 0
    for u in updates:
        try:
            if u["value"] is not None:
                write_cypher(f"""
                    MATCH (n:SectorPolicyTool {{id: '{u["id"]}'}})
                    WHERE n.year = {u["year"]}
                    SET n.capacity_value = {u["value"]},
                        n.capacity_unit = '{u["unit"]}',
                        n.capacity_raw = n.capacity
                """)
            else:
                # Descriptive only — write unit as description, value as null/0
                safe_unit = u["unit"].replace("'", "\\'") if u["unit"] else ""
                write_cypher(f"""
                    MATCH (n:SectorPolicyTool {{id: '{u["id"]}'}})
                    WHERE n.year = {u["year"]}
                    SET n.capacity_value = 0,
                        n.capacity_unit = '{safe_unit}',
                        n.capacity_raw = n.capacity
                """)
            success += 1
        except Exception as e:
            print(f"  ERROR writing {u['id']}: {e}")

    print(f"\nDone. Updated {success}/{len(updates)} nodes.")
    print("Fields written: capacity_value (float), capacity_unit (string), capacity_raw (original)")


if __name__ == "__main__":
    main()
