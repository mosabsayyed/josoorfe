#!/usr/bin/env python3
"""Fix quarter comparison in Supabase queries - remove toString() wrapper"""
from supabase import create_client

supabase = create_client(
    "https://ojlfhkrobyqmifqbgcyw.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbGZoa3JvYnlxbWlmcWJnY3l3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU1NjA1NiwiZXhwIjoyMDY1MTMyMDU2fQ.E5c7DVo3djUpQ4sZQ92N-K9Vh5kGP_wheSnDpUBs7Q4"  # SERVICE_ROLE_KEY
)

# Fetch current queries
queries_to_fix = [
    '1d481ab0-bb2a-4e2c-b955-ef2f4f3b783d',  # sector_value_chain v3
    '1a7d8264-5cca-4796-bc10-86b40c04b04e',  # setting_strategic_priorities v3
]

for qid in queries_to_fix:
    resp = supabase.table('chain_queries').select('chain_id,version,narrative_query,diagnostic_query').eq('id', qid).execute()
    row = resp.data[0]
    
    print(f"\n{'='*60}")
    print(f"Processing: {row['chain_id']} v{row['version']}")
    print(f"{'='*60}")
    
    # Fix narrative query
    narr_old = row['narrative_query']
    narr_new = narr_old.replace(
        "root.quarter = toString($quarter) OR \n       root.quarter = replace(toString($quarter), 'Q', '')",
        "root.quarter = $quarter"
    )
    
    # Fix diagnostic query  
    diag_old = row['diagnostic_query']
    diag_new = diag_old.replace(
        "root.quarter = toString($quarter) OR \n       root.quarter = replace(toString($quarter), 'Q', '')",
        "root.quarter = $quarter"
    )
    
    print(f"Narrative: {'CHANGED' if narr_new != narr_old else 'NO CHANGE'}")
    print(f"Diagnostic: {'CHANGED' if diag_new != diag_old else 'NO CHANGE'}")
    
    if narr_new != narr_old or diag_new != diag_old:
        # Update in database
        update_resp = supabase.table('chain_queries').update({
            'narrative_query': narr_new,
            'diagnostic_query': diag_new
        }).eq('id', qid).execute()
        
        print(f"✅ Updated in Supabase")
    else:
        print(f"⚠️  No changes needed")

print("\n" + "="*60)
print("✅ All queries fixed!")
print("="*60)
