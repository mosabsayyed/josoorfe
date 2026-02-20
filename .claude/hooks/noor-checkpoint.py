#!/usr/bin/env python3
"""
Noor Memory Pre-Action Checkpoint Hook
Runs on every UserPromptSubmit. Queries NoorMemory nodes in Neo4j
for rules/decisions relevant to the user's message. Injects matches
into context so the AI sees them before responding.
"""
import sys
import json
import re

def extract_keywords(text):
    """Extract meaningful words from user message."""
    text = text.lower()
    # Split on non-alphanumeric
    words = re.findall(r'[a-z_]{3,}', text)
    # Remove common stop words
    stops = {'the','and','for','are','but','not','you','all','can','had','her',
             'was','one','our','out','has','have','this','that','with','from',
             'they','been','said','each','which','their','will','other','about',
             'many','then','them','these','some','would','make','like','into',
             'could','time','very','when','come','made','after','back','only',
             'just','also','know','take','than','here','what','does','let','how',
             'its','too','use','way','look','did','get','got'}
    return [w for w in set(words) if w not in stops]

def query_neo4j(keywords):
    """Query NoorMemory nodes matching any keywords."""
    try:
        from neo4j import GraphDatabase
        driver = GraphDatabase.driver(
            'bolt://localhost:7688',
            auth=('neo4j', 'stagingpassword')
        )
        with driver.session(database='neo4j') as session:
            result = session.run("""
                MATCH (m:NoorMemory)
                WHERE m.project = 'josoorfe'
                AND ANY(k IN m.keywords WHERE ANY(w IN $words WHERE k CONTAINS w OR w CONTAINS k))
                RETURN m.type AS type, m.category AS category,
                       m.content AS content, m.severity AS severity
                ORDER BY
                    CASE m.severity
                        WHEN 'critical' THEN 0
                        WHEN 'high' THEN 1
                        WHEN 'medium' THEN 2
                        ELSE 3
                    END
                LIMIT 5
            """, {"words": keywords})

            memories = []
            for record in result:
                memories.append({
                    "type": record["type"],
                    "severity": record["severity"],
                    "content": record["content"]
                })
        driver.close()
        return memories
    except Exception as e:
        # Fail silently — don't block the user
        return []

def main():
    try:
        input_data = json.loads(sys.stdin.read())
        prompt = input_data.get("prompt", "")
    except:
        sys.exit(0)

    if not prompt or len(prompt) < 3:
        sys.exit(0)

    keywords = extract_keywords(prompt)
    if not keywords:
        sys.exit(0)

    memories = query_neo4j(keywords)
    if not memories:
        sys.exit(0)

    # Format output for injection
    lines = ["NOOR MEMORY CHECKPOINT — Relevant rules for this message:"]
    for m in memories:
        severity_tag = f"[{m['severity'].upper()}]" if m['severity'] else ""
        lines.append(f"  {severity_tag} ({m['type']}) {m['content']}")

    print("\n".join(lines))

if __name__ == "__main__":
    main()
