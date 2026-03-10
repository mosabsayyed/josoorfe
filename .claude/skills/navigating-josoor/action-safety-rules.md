# Action Safety Rules

These rules are learned from past mistakes. Follow them on every action.

## File Operations (Write / Edit / cp / mv)

- `ls -la <target>` — does it already exist?
- If exists: STOP. Tell Mosab. Never overwrite without asking.
- Re-read user's message: am I touching the RIGHT file?
- If 1% unsure which file they mean: ASK. Don't guess.

## Reading Files (when user says "show me")

- Paste content INLINE in response text. Tool output is NOT visible to user.
- Never say "already shown above." Paste again. Every time.

## Deleting (rm / delete / wipe)

- After deletion: `ls -la <target>` to confirm it's gone.
- If it comes back: investigate WHY before re-deleting.
- After "wipe everything": search whole disk for remnants (systemd, caches, configs).

## Process Management (kill / stop / restart)

- Use the service's OWN stop command first (e.g. `openclaw gateway stop`).
- Check systemd: `systemctl status <name>`. If managed, use `systemctl restart`.
- Never raw-kill a systemd-managed process.
- Check for duplicates: system-level AND user-level services.
- After restart: `ss -tlnp | grep <port>` + `ps aux | grep <name>`.

## Installing / Updating / Configuring

- Read docs FIRST. Don't guess command names, env vars, or config keys.
- Use the tool's own update command (e.g. `openclaw update`, NOT `npm install -g`).
- After install: verify it works (port bound? API key set? service healthy?).

## Explanations and Status Claims

- Don't fabricate. "I don't know" > invented narrative.
- Don't speculate as fact. "I think X" is fine. "X happened" when guessing = LIE.
- Don't reassure without verifying. Read the file before saying "it's fine."

## User-Provided Values (tokens, passwords, paths)

- Use it EXACTLY. Don't substitute, improve, or second-guess.

## Failure Protocol

- If something fails twice: STOP. Ask Mosab. Don't try a third variation.

## Working Services

- Don't rewrite working services. Verify first. Minimal changes only.

## Git Operations

- NEVER `git pull` when user asks for specific files.
- Check `git status` for uncommitted work BEFORE any git operation.
- Use `git fetch` + `git checkout origin/<branch> -- <path>` for specific files.
- "Pull the X" means ONLY X, not everything.

## Always

- Never modify running services without explicit user request.
- Never change model preferences without explicit approval.
- Never delete context_id/history as a "fix" — study root cause.
- Never use `--no-verify` or skip hooks without user asking.
- Before any commit: only stage specific files, not `git add -A`.
