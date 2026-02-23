#!/usr/bin/env python3
"""
Noor Post-Edit Hook for Claude Code
Fires AFTER Edit/Write operations to remind about documentation updates.
"""

import sys
import json
import os

def main():
    try:
        # Read stdin JSON
        stdin_data = sys.stdin.read()
        if not stdin_data:
            return

        hook_data = json.loads(stdin_data)
        tool_name = hook_data.get("tool_name", "")
        tool_input = hook_data.get("tool_input", {})

        # Extract file path
        file_path = tool_input.get("file_path", "")
        if not file_path:
            return

        # Get just the filename for brevity
        filename = os.path.basename(file_path)

        # Print reminder to stdout
        print(f"\nNOOR POST-EDIT: Modified {filename}")
        print("Record change using exact MCP call names:")
        print("- mcp_noor-memory_add_observations(...)")
        print("- mcp_noor-memory_create_entities(...) when new concept appears")
        print("RULE #0 REMINDER: update context/journal.ipynb and MEMORY.md\n")

    except Exception:
        # Silently fail - PostToolUse hooks are informational only
        pass

if __name__ == "__main__":
    main()
