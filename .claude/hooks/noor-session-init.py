#!/usr/bin/env python3
"""
SessionStart hook (MCP-first, server-agnostic).
Injects a reminder to use Noor Memory MCP tools directly.
"""

import json
import sys


def main():
    source = 'unknown'
    try:
        payload = json.loads(sys.stdin.read() or '{}')
        source = payload.get('source', 'unknown')
    except Exception:
        pass

    print(f"NOOR SESSION INIT ({source})")
    print("Use exact noor-memory MCP call names:")
    print("- mcp_noor-memory_search_memories(query=\"<user intent>\")")
    print("- mcp_noor-memory_find_memories_by_name(names=[...])")
    print("- mcp_noor-memory_read_graph()")


if __name__ == '__main__':
    main()
