#!/usr/bin/env python3
"""
Noor PreToolUse Guard Hook
Blocks Edit/Write/NotebookEdit operations on protected files.
Exit code 2 = BLOCK, exit code 0 = ALLOW
"""

import sys
import json
import os
from pathlib import Path

# Hardcoded protected files (relative to project root)
PROTECTED_FILES = {
    'chain_queries_rows.csv': 'Core ontology data file - modifications require user approval',
    'ontology.txt': 'System ontology definition - modifications require careful review',
    '.env': 'Environment configuration - contains sensitive credentials',
}

# Special case: journal.ipynb only protected from Write, not NotebookEdit
JOURNAL_WRITE_ONLY = {
    'context/journal.ipynb': 'Research journal - use NotebookEdit for structured edits, not Write'
}


def get_project_root():
    """Get project root directory."""
    return Path('/home/mosab/projects/josoorfe')


def check_neo4j_protections(file_path: str) -> tuple[bool, str]:
    """
    Query Neo4j NoorMemory for dynamic file protections.
    Returns (is_protected, reason)
    """
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
                AND m.type = 'rule'
                AND m.category = 'file_protection'
                RETURN m.content AS content, m.keywords AS keywords
            """)

            records = list(result)
            driver.close()

            # Check each protection rule
            for record in records:
                content = record.get('content', '')
                keywords = record.get('keywords', [])

                # Check if file path matches any keywords
                file_name = os.path.basename(file_path)
                file_rel_path = str(Path(file_path).relative_to(get_project_root()))

                for keyword in keywords or []:
                    if keyword in file_name or keyword in file_rel_path:
                        return True, content

            return False, ''

    except Exception as e:
        # Neo4j failure - don't block based on dynamic rules
        print(f"Warning: Neo4j query failed: {e}", file=sys.stderr)
        return False, ''


def is_protected(tool_name: str, file_path: str) -> tuple[bool, str]:
    """
    Check if file is protected.
    Returns (is_protected, reason)
    """
    project_root = get_project_root()

    try:
        # Normalize to relative path
        if file_path.startswith(str(project_root)):
            rel_path = str(Path(file_path).relative_to(project_root))
        else:
            rel_path = file_path
    except ValueError:
        # Not under project root - allow
        return False, ''

    file_name = os.path.basename(file_path)

    # Check hardcoded protections
    if file_name in PROTECTED_FILES:
        return True, PROTECTED_FILES[file_name]

    # Check journal.ipynb special case
    if rel_path in JOURNAL_WRITE_ONLY:
        if tool_name == 'Write':
            return True, JOURNAL_WRITE_ONLY[rel_path]
        # NotebookEdit is allowed
        return False, ''

    # Check Neo4j dynamic protections
    return check_neo4j_protections(file_path)


def main():
    """Main hook entry point."""
    try:
        # Read stdin JSON
        hook_input = json.load(sys.stdin)
        tool_name = hook_input.get('tool_name', '')
        tool_input = hook_input.get('tool_input', {})

        # Only process file edit tools
        if tool_name not in ['Edit', 'Write', 'NotebookEdit']:
            sys.exit(0)

        # Extract file path
        file_path = tool_input.get('file_path', '') or tool_input.get('notebook_path', '')

        if not file_path:
            # No file path - allow
            sys.exit(0)

        # Check if protected
        protected, reason = is_protected(tool_name, file_path)

        if protected:
            file_name = os.path.basename(file_path)
            print(f"BLOCKED: {file_name} is protected. Reason: {reason}", file=sys.stderr)
            sys.exit(2)

        # Not protected - allow
        sys.exit(0)

    except Exception as e:
        # On error, allow through (fail open)
        print(f"Hook error: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == '__main__':
    main()
