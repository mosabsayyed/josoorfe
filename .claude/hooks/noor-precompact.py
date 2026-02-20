#!/usr/bin/env python3
"""
Claude Code PreCompact Hook - NoorMemory Rule Preservation

Fires before context compaction to dump ALL NoorMemory rules to stdout.
These rules get captured in the compaction summary and survive the reset.

Input (stdin): JSON with session_id and trigger
Output (stdout): Formatted list of all NoorMemory rules, sorted by severity
"""

import sys
import json
from neo4j import GraphDatabase


def dump_noor_memory_rules():
    """Query Neo4j for all NoorMemory rules and print to stdout."""

    # Read stdin JSON
    try:
        hook_input = json.loads(sys.stdin.read())
        trigger = hook_input.get('trigger', 'unknown')
    except (json.JSONDecodeError, KeyError):
        trigger = 'unknown'

    # Connect to Neo4j staging database
    try:
        driver = GraphDatabase.driver(
            'bolt://localhost:7688',
            auth=('neo4j', 'stagingpassword')
        )

        with driver.session(database='neo4j') as session:
            # Query ALL NoorMemory rules for josoorfe project
            result = session.run("""
                MATCH (m:NoorMemory)
                WHERE m.project = 'josoorfe'
                RETURN m.type AS type,
                       m.category AS category,
                       m.content AS content,
                       m.severity AS severity,
                       m.created_at AS created_at
                ORDER BY
                    CASE m.severity
                        WHEN 'critical' THEN 0
                        WHEN 'high' THEN 1
                        WHEN 'medium' THEN 2
                        WHEN 'low' THEN 3
                        ELSE 4
                    END,
                    m.created_at DESC
            """)

            rules = list(result)

            if not rules:
                print("PRE-COMPACTION: No NoorMemory rules found for josoorfe project.")
                driver.close()
                return

            # Print header
            print("\n" + "="*80)
            print(f"PRE-COMPACTION MEMORY DUMP (trigger: {trigger})")
            print("All NoorMemory rules — preserve these across context reset:")
            print("="*80 + "\n")

            # Group by severity for better readability
            current_severity = None
            for record in rules:
                severity = (record['severity'] or 'medium').upper()
                rule_type = record['type'] or 'rule'
                category = record['category'] or 'general'
                content = record['content'] or '(no content)'

                # Print severity header when it changes
                if severity != current_severity:
                    if current_severity is not None:
                        print()  # Blank line between severity groups
                    current_severity = severity

                # Format: [SEVERITY] (type/category) content
                print(f"[{severity}] ({rule_type}/{category}) {content}")

            print("\n" + "="*80)
            print(f"Total rules dumped: {len(rules)}")
            print("="*80 + "\n")

        driver.close()

    except Exception as e:
        # Neo4j connection failed - print fallback message
        print("\n" + "="*80)
        print("PRE-COMPACTION: Neo4j unavailable. Ensure MEMORY.md is preserved.")
        print(f"Error: {str(e)}")
        print("="*80 + "\n")


if __name__ == '__main__':
    dump_noor_memory_rules()
    sys.exit(0)
