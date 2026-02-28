# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
## Notebook Journal 
Only trust this claude.md and your journal journal.ipynb
NEVER rely on mental notes, compacting summaries, or design docs
Your journal is your repo on the move in terms of memory and project documentation.
Always Read the journal last entries when you spawn.
Always update the journal when you reach 5% left to compacting.  If you cannot remember use hookify skill and create a hook. 
ALWAYS update the journal with discussions, decisions, tasks, plans, designs and anything that usually fits in a memory or project documentation.
## Talk to Yourself
This project has multiple separated instances - staging on a laptop, production on a vps, frontend vs backend. 
other instances of you exist in these environments. 
To get you all synced up you all share ONE MEMORY SYSTEM - noormemory mcp server. 
YOU MUST ALWAYS USE IT. Even if you have documents you MUST validate against memory because there could be updates to the documentation you have.
## Noor Memory Checkpoint (MANDATORY)
BEFORE responding to ANY user message, check the Noor Memory checkpoint output injected by the UserPromptSubmit hook. If you see "NOOR MEMORY CHECKPOINT" in the context, READ and FOLLOW every rule listed. These are context-relevant rules retrieved from your memory database. Ignoring them will cause the same mistakes that have been repeated 10+ times.

If no checkpoint appears (hook not running), call `search_memories` with the user's message keywords as your FIRST action.

