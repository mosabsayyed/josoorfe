#!/usr/bin/env python3
"""
PreCompact hook — BLOCKS compaction until journal is updated.
Exit code 2 = BLOCK. Stderr message shown to AI.
Exit code 0 = ALLOW (only after journal update confirmed).

Strategy: Always block on first attempt. The AI must update the journal,
then the user can manually trigger compact again.
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

    # Always block with instructions — force the AI to update journal
    print(
        "COMPACTION BLOCKED — JOURNAL UPDATE REQUIRED\n"
        "\n"
        "CLAUDE.md line 9: 'Always update the journal when you reach 5% left to compacting.'\n"
        "\n"
        "You MUST do ALL of these BEFORE compaction can proceed:\n"
        "\n"
        "1. NotebookEdit context/journal.ipynb — update current task entry with:\n"
        "   - What was done this session\n"
        "   - Decisions made\n"
        "   - Files changed\n"
        "   - Current state + what's pending\n"
        "\n"
        "2. mcp_noor-memory_add_observations — save key session facts\n"
        "\n"
        "3. Tell the user: 'Journal updated. You can now run /compact.'\n"
        "\n"
        "DO NOT SKIP THIS. The user has been burned 10+ times by lost context.",
        file=sys.stderr
    )
    sys.exit(2)


if __name__ == '__main__':
    main()
