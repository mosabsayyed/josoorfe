import os
try:
    from supabase import create_client, Client
except ImportError:
    print("supabase module not installed. Please run this with the venv python.")
    exit(1)

url = "https://ojlfhkrobyqmifqbgcyw.supabase.co"
# Using the key found in .env previously
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbGZoa3JvYnlxbWlmcWJnY3l3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU1NjA1NiwiZXhwIjoyMDY1MTMyMDU2fQ.E5c7DVo3djUpQ4sZQ92N-K9Vh5kGP_wheSnDpUBs7Q4"
supabase: Client = create_client(url, key)

chain_id = 'build_oversight'

# NARRATIVE: Strict full path
narrative_query = """
MATCH (root:SectorObjective)
WHERE ($year = 0 OR toInteger(root.year) = toInteger($year))
  AND ($quarter IS NULL OR root.quarter = $quarter)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
MATCH path = (root)-[:REALIZED_VIA]->(pol:SectorPolicyTool)
  -[:ENABLES_CAPABILITY]->(cap:EntityCapability)
  -[:DELIVERED_BY]->(proj:EntityProject)
UNWIND nodes(path) AS n
UNWIND relationships(path) AS r
WITH DISTINCT n, r
RETURN
  elementId(n) as nId,
  labels(n) as nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) as nProps,
  type(r) as rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding']) as rProps,
  CASE WHEN r IS NOT NULL THEN elementId(startNode(r)) ELSE null END as sourceId,
  CASE WHEN r IS NOT NULL THEN elementId(endNode(r)) ELSE null END as targetId
"""

# DIAGNOSTIC: Partial paths (OPTIONAL MATCH) to identify breakage
diagnostic_query = """
MATCH (root:SectorObjective)
WHERE ($year = 0 OR toInteger(root.year) = toInteger($year))
  AND ($quarter IS NULL OR root.quarter = $quarter)
  AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
OPTIONAL MATCH p1 = (root)-[:REALIZED_VIA]->(pol:SectorPolicyTool)
OPTIONAL MATCH p2 = (pol)-[:ENABLES_CAPABILITY]->(cap:EntityCapability)
OPTIONAL MATCH p3 = (cap)-[:DELIVERED_BY]->(proj:EntityProject)
WITH root, collect(p1) + collect(p2) + collect(p3) AS paths
UNWIND (CASE WHEN size(paths) = 0 THEN [null] ELSE paths END) AS p
UNWIND (CASE WHEN p IS NULL THEN [root] ELSE nodes(p) END) AS n
UNWIND (CASE WHEN p IS NULL THEN [] ELSE relationships(p) END) AS r
WITH DISTINCT n, r
WHERE n IS NOT NULL
RETURN
  elementId(n) as nId,
  labels(n) as nLabels,
  apoc.map.removeKeys(properties(n), ['embedding', 'Embedding', 'embedding_generated_at']) as nProps,
  type(r) as rType,
  apoc.map.removeKeys(properties(r), ['embedding', 'Embedding']) as rProps,
  CASE WHEN r IS NOT NULL THEN elementId(startNode(r)) ELSE null END as sourceId,
  CASE WHEN r IS NOT NULL THEN elementId(endNode(r)) ELSE null END as targetId
"""

print(f"Updating {chain_id}...")
try:
    response = supabase.table("chain_queries").update({
        "narrative_query": narrative_query,
        "diagnostic_query": diagnostic_query
    }).eq("chain_id", chain_id).execute()
    print(f"✅ {chain_id} updated successfully.")
except Exception as e:
    print(f"❌ Error updating {chain_id}: {e}")
