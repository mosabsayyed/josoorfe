#!/usr/bin/env python3
"""
Claude Code SessionStart Hook - NoorMemory Rules Loader
Fires on ALL session starts (startup, resume, compact)
Loads critical and high severity rules from Neo4j NoorMemory
"""

import sys
import json
from neo4j import GraphDatabase

# Neo4j connection config
NEO4J_URI = 'bolt://localhost:7688'
NEO4J_USER = 'neo4j'
NEO4J_PASSWORD = 'stagingpassword'
NEO4J_DATABASE = 'neo4j'
PROJECT = 'josoorfe'

def load_critical_rules():
    """Query Neo4j for critical and high severity rules"""
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

        query = """
        MATCH (m:NoorMemory)
        WHERE m.project = $project
        AND m.severity IN ['critical', 'high']
        RETURN m.type AS type, m.category AS category,
               m.content AS content, m.severity AS severity
        ORDER BY
            CASE m.severity
                WHEN 'critical' THEN 0
                WHEN 'high' THEN 1
                ELSE 2
            END
        """

        with driver.session(database=NEO4J_DATABASE) as session:
            result = session.run(query, project=PROJECT)
            rules = [record.data() for record in result]

        driver.close()
        return rules, None

    except Exception as e:
        return None, str(e)

def format_rules_output(rules, source):
    """Format rules as plain text for context injection"""
    output_lines = []

    # Header with source context
    if source == "compact":
        output_lines.append("POST-COMPACTION: Context was compressed. Rules reloaded from NoorMemory.")
        output_lines.append("")

    output_lines.append(f"NOOR SESSION INIT — Loading all critical rules ({source}):")
    output_lines.append("")

    # Group by severity
    critical_rules = [r for r in rules if r['severity'] == 'critical']
    high_rules = [r for r in rules if r['severity'] == 'high']

    if critical_rules:
        output_lines.append("=== CRITICAL RULES ===")
        for rule in critical_rules:
            rule_type = rule.get('type', 'rule')
            category = rule.get('category', '')
            content = rule.get('content', '').strip()
            category_prefix = f" ({category})" if category else ""
            output_lines.append(f"  [CRITICAL]{category_prefix} ({rule_type}) {content}")
        output_lines.append("")

    if high_rules:
        output_lines.append("=== HIGH RULES ===")
        for rule in high_rules:
            rule_type = rule.get('type', 'rule')
            category = rule.get('category', '')
            content = rule.get('content', '').strip()
            category_prefix = f" ({category})" if category else ""
            output_lines.append(f"  [HIGH]{category_prefix} ({rule_type}) {content}")
        output_lines.append("")

    if not critical_rules and not high_rules:
        output_lines.append("  No critical or high severity rules found.")
        output_lines.append("")

    return "\n".join(output_lines)

def main():
    """Main hook entry point"""
    try:
        # Read stdin JSON
        stdin_data = sys.stdin.read()
        hook_input = json.loads(stdin_data) if stdin_data.strip() else {}

        # Extract source (startup/resume/compact)
        source = hook_input.get('source', 'unknown')

        # Load rules from Neo4j
        rules, error = load_critical_rules()

        if error:
            # Fallback if Neo4j is down
            print("NOOR SESSION INIT — Neo4j unavailable. Read MEMORY.md and context/journal.ipynb manually.")
            sys.exit(0)

        # Format and output rules
        output = format_rules_output(rules, source)
        print(output)

        sys.exit(0)

    except Exception as e:
        # Never block session start - print fallback and exit cleanly
        print(f"NOOR SESSION INIT — Error loading rules: {e}")
        print("Fallback: Read MEMORY.md and context/journal.ipynb manually.")
        sys.exit(0)

if __name__ == '__main__':
    main()
