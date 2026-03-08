#!/usr/bin/env python3
"""
PreCompact hook — reminds Claude to save context, then allows compaction.
Exit 0 = ALLOW (always). Never blocks.
"""

import sys


def main():
    print(
        "PRE-COMPACT REMINDER: Before compaction completes, ensure you have:\n"
        "1. Called mcp__noor-memory__add_observations to save key session facts\n"
        "2. Updated context/journal.ipynb with session summary via NotebookEdit\n"
        "Compaction proceeding."
    )
    sys.exit(0)


if __name__ == "__main__":
    main()
