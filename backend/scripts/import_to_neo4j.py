#!/usr/bin/env python3
"""
Import KSA Sector Desk data to Neo4j via betaBE API
Reads sector_import.cypher and sends batches to Neo4j
"""

import requests
import time
from pathlib import Path

# Configuration
BACKEND_URL = "https://betaBE.aitwintech.com"
NEO4J_ENDPOINT = f"{BACKEND_URL}/api/neo4j/query"  # Adjust if different
CYPHER_FILE = Path(__file__).parent / "sector_import_fixed.cypher"
BATCH_SIZE = 50  # Import in batches to avoid timeouts

def read_cypher_statements(file_path):
    """Read and parse Cypher file into individual CREATE statements"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by CREATE statements
    statements = []
    current_statement = []
    
    for line in content.split('\n'):
        line = line.strip()
        
        # Skip comments and empty lines
        if not line or line.startswith('//'):
            continue
        
        current_statement.append(line)
        
        # End of statement (either standalone relationship or closing brace)
        if line.startswith('CREATE (') and line.endswith(')') and '->' in line:
            # Relationship statement (single line)
            statements.append(' '.join(current_statement))
            current_statement = []
        elif line == '})':
            # End of node creation
            statements.append('\n'.join(current_statement))
            current_statement = []
    
    return statements

def execute_cypher_batch(statements, batch_num, total_batches):
    """Execute a batch of Cypher statements"""
    print(f"\n📦 Batch {batch_num}/{total_batches}: {len(statements)} statements")
    
    # Combine statements into a single query
    query = '\n'.join(statements)
    
    try:
        response = requests.post(
            NEO4J_ENDPOINT,
            json={"query": query},
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Success: {result}")
            return True
        else:
            print(f"   ❌ Error {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Request failed: {e}")
        return False

def main():
    print("🚀 KSA Sector Desk - Neo4j Import via betaBE")
    print(f"📄 Reading Cypher from: {CYPHER_FILE}")
    
    if not CYPHER_FILE.exists():
        print(f"❌ Error: {CYPHER_FILE} not found!")
        print("Run generate_sector_cypher.py first.")
        return 1
    
    # Read statements
    statements = read_cypher_statements(CYPHER_FILE)
    print(f"📊 Total statements: {len(statements)}")
    
    # Calculate batches
    num_batches = (len(statements) + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"📦 Batches: {num_batches} (size: {BATCH_SIZE})")
    
    # Execute in batches
    success_count = 0
    failed_count = 0
    
    for i in range(num_batches):
        start_idx = i * BATCH_SIZE
        end_idx = min((i + 1) * BATCH_SIZE, len(statements))
        batch = statements[start_idx:end_idx]
        
        if execute_cypher_batch(batch, i + 1, num_batches):
            success_count += len(batch)
        else:
            failed_count += len(batch)
            # Continue with next batch even if one fails
        
        # Rate limiting
        if i < num_batches - 1:
            time.sleep(1)
    
    # Summary
    print("\n" + "="*60)
    print(f"✅ Success: {success_count} statements")
    print(f"❌ Failed: {failed_count} statements")
    print(f"📊 Total: {len(statements)} statements")
    print("="*60)
    
    if failed_count == 0:
        print("\n🎉 Import completed successfully!")
        print("\nNext steps:")
        print("1. Verify in Neo4j Browser: MATCH (n) RETURN labels(n), count(*)")
        print("2. Check sector nodes: MATCH (n) WHERE n.sector IS NOT NULL RETURN n.sector, labels(n), count(*)")
        return 0
    else:
        print("\n⚠️  Some statements failed. Check errors above.")
        return 1

if __name__ == '__main__':
    exit(main())
