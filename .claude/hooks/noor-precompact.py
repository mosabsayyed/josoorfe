#!/usr/bin/env python3
"""
PreCompact hook (MCP-first, server-agnostic).
Reminds to persist critical context via Noor Memory MCP tools.
"""

import json
import sys


def main():
    trigger = 'unknown'
    try:
        payload = json.loads(sys.stdin.read() or '{}')
        trigger = payload.get('trigger', 'unknown')
    except Exception:
        pass

    print(f"NOOR PRE-COMPACT ({trigger})")
    print('Persist session context with exact noor-memory MCP calls before reset:')
    print('- mcp_noor-memory_create_entities(...)')
    print('- mcp_noor-memory_add_observations(...)')
    print('- mcp_noor-memory_create_relations(...)')
    print('- mcp_noor-memory_read_graph() to verify snapshot')


if __name__ == '__main__':
    main()
