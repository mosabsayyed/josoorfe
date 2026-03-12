#!/bin/bash
# DevChat Watcher — polls Supabase for new messages and types into Claude Code via tmux
# Usage: bash .claude/hooks/devchat-watcher.sh [tmux-session-name]
#
# Prerequisites:
#   1. Run Claude Code inside tmux: tmux new -s claude
#   2. Start this watcher in another terminal: bash .claude/hooks/devchat-watcher.sh claude
#   3. The watcher will type "check DevChat and respond" into the tmux session when new messages arrive

TMUX_SESSION="${1:-claude}"
POLL_INTERVAL=10
SUPABASE_URL="https://ojlfhkrobyqmifqbgcyw.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbGZoa3JvYnlxbWlmcWJnY3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NTYwNTYsImV4cCI6MjA2NTEzMjA1Nn0.Y6swVK-tGI0lqpFJ4pgUGD6NaEj-sQIizTvYL2Cf4nY"
LAST_CHECK_FILE="/tmp/.devchat_watcher_last_check"
MY_ID="claude-frontend"

echo "╔══════════════════════════════════════╗"
echo "║       DevChat Watcher Started        ║"
echo "║  tmux session: $TMUX_SESSION              ║"
echo "║  polling every ${POLL_INTERVAL}s               ║"
echo "║  Ctrl+C to stop                      ║"
echo "╚══════════════════════════════════════╝"

# Verify tmux session exists
if ! tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
  echo "ERROR: tmux session '$TMUX_SESSION' not found."
  echo "Start Claude Code in tmux first: tmux new -s $TMUX_SESSION"
  exit 1
fi

# Initialize last check to now
date -u '+%Y-%m-%dT%H:%M:%S' > "$LAST_CHECK_FILE"
echo "Watching for new messages..."

while true; do
  sleep "$POLL_INTERVAL"

  LAST_CHECK=$(cat "$LAST_CHECK_FILE" 2>/dev/null)
  if [ -z "$LAST_CHECK" ]; then
    LAST_CHECK=$(date -u -d '1 minute ago' '+%Y-%m-%dT%H:%M:%S')
  fi

  # Query for new messages NOT from this Claude instance
  RESPONSE=$(curl -s -m 5 \
    "${SUPABASE_URL}/rest/v1/dev_chat_messages?channel=eq.general&created_at=gt.${LAST_CHECK}&sender_id=neq.${MY_ID}&order=created_at.asc&limit=10" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Accept: application/json" 2>/dev/null)

  # Skip if empty or error
  if [ -z "$RESPONSE" ] || [ "$RESPONSE" = "[]" ]; then
    continue
  fi

  # Count and display
  MSG_COUNT=$(python3 -c "import json; print(len(json.loads('''$RESPONSE''')))" 2>/dev/null)

  if [ -z "$MSG_COUNT" ] || [ "$MSG_COUNT" = "0" ]; then
    continue
  fi

  # Show what was found
  echo ""
  echo "$(date '+%H:%M:%S') — $MSG_COUNT new message(s) detected!"
  python3 -c "
import json
msgs = json.loads('''$RESPONSE''')
for m in msgs:
    print(f\"  [{m['sender_id']}]: {m['content'][:80]}\")
" 2>/dev/null

  # Update last check to latest message timestamp
  LATEST=$(python3 -c "
import json
msgs = json.loads('''$RESPONSE''')
print(msgs[-1]['created_at'])
" 2>/dev/null)
  if [ -n "$LATEST" ]; then
    echo "$LATEST" > "$LAST_CHECK_FILE"
  fi

  # Check if Claude is busy (look for active processes in tmux pane)
  # Send the message to Claude Code via tmux
  echo "  → Sending to Claude Code in tmux session '$TMUX_SESSION'..."
  tmux send-keys -t "$TMUX_SESSION" "new DevChat messages arrived — check DevChat and respond to them" Enter

  # Wait a bit longer after sending to let Claude process
  echo "  → Waiting 30s for Claude to process..."
  sleep 30
done
