#!/usr/bin/env python3
"""
Upload modified business chain queries from CSV to Supabase.
Updates existing records in business_chains_queries table.
"""
import os
import csv
import sys
from supabase import create_client, Client

# Supabase credentials from environment
SUPABASE_URL = os.getenv('REACT_APP_SUPABASE_URL')
SUPABASE_KEY = os.getenv('REACT_APP_SUPABASE_ANON_KEY')  # or SERVICE_ROLE_KEY for full access

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY must be set")
    print("   Check frontend/.env or root .env file")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Read CSV and upload modified queries
CSV_FILE = 'chain_queries_rows.csv'
MODIFIED_IDS = [
    '1d481ab0-bb2a-4e2c-b955-ef2f4f3b783d',  # sector_value_chain v3
    '1a7d8264-5cca-4796-bc10-86b40c04b04e',  # setting_strategic_priorities v3
]

def upload_queries():
    """Upload modified queries from CSV to Supabase"""
    print(f"📁 Reading {CSV_FILE}...")
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"✅ Found {len(rows)} total rows in CSV")
    
    # Filter only modified rows
    modified_rows = [r for r in rows if r['id'] in MODIFIED_IDS]
    print(f"🎯 Found {len(modified_rows)} modified queries to upload")
    
    for row in modified_rows:
        query_id = row['id']
        chain_id = row['chain_id']
        version = row['version']
        
        print(f"\n📤 Uploading: {chain_id} v{version} ({query_id[:8]}...)")
        
        # Prepare data for update
        data = {
            'narrative_query': row['narrative_query'],
            'diagnostic_query': row['diagnostic_query'],
            'description': row['description'],
            'is_active': row['is_active'] == 'true',
        }
        
        try:
            # Update the record
            response = supabase.table('chain_queries') \
                .update(data) \
                .eq('id', query_id) \
                .execute()
            
            if response.data:
                print(f"   ✅ Successfully updated {chain_id} v{version}")
            else:
                print(f"   ⚠️  No rows updated for {query_id}")
        
        except Exception as e:
            print(f"   ❌ ERROR updating {chain_id}: {e}")
            return False
    
    print("\n" + "="*60)
    print("✅ All modified queries uploaded to Supabase!")
    print("="*60)
    return True

if __name__ == '__main__':
    success = upload_queries()
    sys.exit(0 if success else 1)
