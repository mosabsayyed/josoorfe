#!/usr/bin/env python3
"""
Backend Test - Using the CORRECT production backend (betaBE.aitwintech.com)
"""
import json
import requests

PROD_URL = "https://betaBE.aitwintech.com/api"

def test_chain(chain_key: str):
    """Fetch and analyze a business chain from the PRODUCTION backend."""
    # Per api_validation_v1_3.md: analyzeGaps=true is REQUIRED
    url = f"{PROD_URL}/business-chain/{chain_key}?analyzeGaps=true&year=2025"
    print(f"[1] Testing: GET {url}")
    
    try:
        response = requests.get(url, timeout=15)
        print(f"[2] Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"[ERROR] Non-200 status")
            print(f"[Response]: {response.text[:500]}")
            return
        
        data = response.json()
        
        # Analyze Response Structure
        print(f"\n[3] Response Structure:")
        print(f"    - Top-level keys: {list(data.keys())}")
        
        nodes = data.get('nodes', [])
        links = data.get('links', [])
        metadata = data.get('metadata', {})
        
        print(f"    - Nodes count: {len(nodes)}")
        print(f"    - Links count: {len(links)}")
        print(f"    - Metadata present: {bool(metadata)}")
        
        # Analyze Nodes
        print(f"\n[4] Nodes by Label:")
        label_counts = {}
        for n in nodes:
            labels = n.get('nLabels', n.get('labels', []))
            for label in labels:
                label_counts[label] = label_counts.get(label, 0) + 1
        
        for label, count in sorted(label_counts.items()):
            print(f"    - {label}: {count}")
        
        # Analyze Links
        print(f"\n[5] Links by Type:")
        rel_counts = {}
        for l in links:
            rel_type = l.get('rType', l.get('type', 'UNKNOWN'))
            rel_counts[rel_type] = rel_counts.get(rel_type, 0) + 1
        
        for rel, count in sorted(rel_counts.items()):
            print(f"    - {rel}: {count}")
        
        # Check for canonicalPath in metadata
        print(f"\n[6] Metadata canonicalPath:")
        canonical_path = metadata.get('canonicalPath', [])
        if canonical_path:
            for i, step in enumerate(canonical_path):
                print(f"    Step {i}: {step}")
        else:
            print("    [WARNING] No canonicalPath in metadata!")
        
        print("\n✅ Backend is reachable and returning valid data!")
        
    except requests.exceptions.ConnectionError as e:
        print(f"[ERROR] Connection failed: {e}")
    except Exception as e:
        print(f"[ERROR] {type(e).__name__}: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("Testing 'setting_strategic_initiatives' chain")
    print("=" * 60)
    test_chain("setting_strategic_initiatives")
