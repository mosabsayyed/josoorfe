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


def check_dynamic_protections(file_path: str) -> tuple[bool, str]:
    """Server-agnostic mode: no dynamic DB protections in hook."""
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

    # Dynamic protections disabled in MCP-only mode
    return check_dynamic_protections(file_path)


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
