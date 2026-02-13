import os
from supabase import create_client, Client

url = "https://ojlfhkrobyqmifqbgcyw.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbGZoa3JvYnlxbWlmcWJnY3l3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU1NjA1NiwiZXhwIjoyMDY1MTMyMDU2fQ.E5c7DVo3djUpQ4sZQ92N-K9Vh5kGP_wheSnDpUBs7Q4"
supabase: Client = create_client(url, key)

def update_chain(chain_id, old_limit, new_limit_var):
    print(f"Updating {chain_id}...")
    try:
        # Fetch current query
        response = supabase.table("chain_queries").select("diagnostic_query").eq("chain_id", chain_id).execute()
        if not response.data:
            print(f"❌ {chain_id} not found.")
            return

        current_query = response.data[0]['diagnostic_query']
        print(f"Current query for {chain_id} (END): ...{current_query[-200:]}") # Print end of query
        
        if "LIMIT" in current_query:
             print(f"⚠️ {chain_id}: Query already has a LIMIT clause. Manual check required.")
             # print(current_query[-200:])
             return

        new_query = current_query + f"\nLIMIT toInteger({new_limit_var})"
        
        # Update
        update_response = supabase.table("chain_queries").update({"diagnostic_query": new_query}).eq("chain_id", chain_id).execute()
        print(f"✅ {chain_id} updated successfully (Appended LIMIT).")

    except Exception as e:
        print(f"❌ Error updating {chain_id}: {e}")

# Build Oversight
update_chain('build_oversight', 25, '$hopLimit')

# Others
standard_chains = [
    'operate_oversight',
    'sector_value_chain',
    'setting_strategic_priorities',
    'setting_strategic_initiatives',
    'sustainable_operations',
    'integrated_oversight'
]

for chain in standard_chains:
    update_chain(chain, 200, '$limit')
