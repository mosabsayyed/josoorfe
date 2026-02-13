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

def get_query(chain_id):
    print(f"--- {chain_id} ---")
    try:
        response = supabase.table("chain_queries").select("diagnostic_query, narrative_query").eq("chain_id", chain_id).execute()
        if response.data:
            print(f"DIAGNOSTIC:\n{response.data[0]['diagnostic_query']}\n")
            print(f"NARRATIVE:\n{response.data[0]['narrative_query']}\n")
        else:
            print("Not found.")
    except Exception as e:
        print(f"Error: {e}")

print("Fetching queries for comparison...")
get_query('build_oversight')
get_query('sector_value_chain')
