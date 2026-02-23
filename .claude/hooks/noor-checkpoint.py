#!/usr/bin/env python3
"""
UserPromptSubmit hook (MCP-first, server-agnostic).
Injects exact Noor Memory MCP call names with current prompt query.
"""

import json
import sys


def main():
    prompt = ''
    try:
        payload = json.loads(sys.stdin.read() or '{}')
        prompt = (payload.get('prompt') or '').strip()
    except Exception:
        pass

    if not prompt:
        return
    safe_prompt = prompt.replace('"', "'")

    print('NOOR MEMORY CHECKPOINT — Use exact noor-memory MCP calls:')
    print(f"- mcp_noor-memory_search_memories(query=\"{safe_prompt}\")")
    print('- mcp_noor-memory_find_memories_by_name(names=[...])')
    print('- mcp_noor-memory_add_observations(...)')


if __name__ == '__main__':
    main()
