#!/usr/bin/env python3
"""
Direct Import of KSA Sector Desk data to Neo4j
Reads credentials from frontend/.env and executes sector_import.cypher
"""

import os
import time
from pathlib import Path

# Try to import neo4j, giving instructions if missing
try:
    from neo4j import GraphDatabase
except ImportError:
    print("❌ 'neo4j' python driver not found.")
    print("Please install it: pip install neo4j")
    exit(1)

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
FRONTEND_ENV = PROJECT_ROOT / 'frontend/.env'
CYPHER_FILE = Path(__file__).parent / "sector_import.cypher"

def load_env_credentials():
    """Manually parse .env file for Neo4j credentials"""
    creds = {}
    if not FRONTEND_ENV.exists():
        print(f"❌ Error: {FRONTEND_ENV} not found")
        return None
    
    print(f"📖 Reading credentials from {FRONTEND_ENV}...")
    with open(FRONTEND_ENV, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                key = key.strip()
                val = val.strip()
                if key.startswith('NEO4J'):
                    creds[key] = val
    return creds

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

def main():
    print("🚀 KSA Sector Desk - Direct Neo4j Import")
    
    # 1. Get Credentials
    creds = load_env_credentials()
    if not creds:
        return 1
    
    uri = creds.get('NEO4J_AURA_URI')
    user = creds.get('NEO4J_AURA_USERNAME')
    password = creds.get('NEO4J_AURA_PASSWORD')
    
    if not all([uri, user, password]):
        print("❌ Missing Neo4j credentials in .env")
        print(f"Found: {list(creds.keys())}")
        return 1
        
    print(f"🔌 Connecting to {uri} as {user}...")
    
    # 2. Connect
    driver = None
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        driver.verify_connectivity()
        print("✅ Connected successfully!")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return 1
    
    # 3. Read Cypher
    if not CYPHER_FILE.exists():
        print(f"❌ Error: {CYPHER_FILE} not found!")
        return 1
    
    statements = read_cypher_statements(CYPHER_FILE)
    print(f"📊 Total statements to execute: {len(statements)}")
    
    # 4. Execute
    success_count = 0
    failed_count = 0
    
    with driver.session() as session:
        for i, stmt in enumerate(statements, 1):
            try:
                # Print progress every 10
                if i % 10 == 0:
                    print(f"   Processing {i}/{len(statements)}...")
                    
                session.run(stmt)
                success_count += 1
            except Exception as e:
                print(f"❌ Error in statement {i}:")
                print(stmt[:100] + "...")
                print(f"Reason: {e}")
                failed_count += 1
    
    driver.close()
    
    # Summary
    print("\n" + "="*60)
    print(f"✅ Executed: {success_count}")
    print(f"❌ Failed:   {failed_count}")
    print("="*60)
    
    if failed_count == 0:
        print("\n🎉 Import completed successfully!")
        return 0
    else:
        print("\n⚠️  Completed with errors.")
        return 1

if __name__ == '__main__':
    exit(main())
