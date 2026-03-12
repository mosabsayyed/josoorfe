#!/bin/bash
# DevChat auto-check: queries Supabase for recent messages
# Runs as a PreToolUse hook so Claude sees new messages automatically
# Only updates timestamp AFTER successfully showing messages

SUPABASE_URL="https://ojlfhkrobyqmifqbgcyw.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbGZoa3JvYnlxbWlmcWJnY3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NTYwNTYsImV4cCI6MjA2NTEzMjA1Nn0.Y6swVK-tGI0lqpFJ4pgUGD6NaEj-sQIizTvYL2Cf4nY"
LAST_CHECK_FILE="/tmp/.devchat_last_check"
THROTTLE_FILE="/tmp/.devchat_throttle"

# Throttle: don't check more than once per 30 seconds
if [ -f "$THROTTLE_FILE" ]; then
  LAST_RUN=$(cat "$THROTTLE_FILE" 2>/dev/null)
  NOW=$(date +%s)
  DIFF=$((NOW - LAST_RUN))
  if [ "$DIFF" -lt 30 ]; then
    exit 0
  fi
fi
date +%s > "$THROTTLE_FILE"

# Get last check timestamp (default: 10 minutes ago)
if [ -f "$LAST_CHECK_FILE" ]; then
  LAST_CHECK=$(cat "$LAST_CHECK_FILE")
else
  LAST_CHECK=$(date -u -d '10 minutes ago' '+%Y-%m-%dT%H:%M:%S' 2>/dev/null || date -u -v-10M '+%Y-%m-%dT%H:%M:%S')
fi

# Query for new messages (not from claude-frontend, since those are ours)
RESPONSE=$(curl -s -m 4 \
  "${SUPABASE_URL}/rest/v1/dev_chat_messages?channel=eq.general&created_at=gt.${LAST_CHECK}&sender_id=neq.claude-frontend&order=created_at.asc&limit=10" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Accept: application/json" 2>/dev/null)

# Check if we got messages
if [ -z "$RESPONSE" ] || [ "$RESPONSE" = "[]" ]; then
  exit 0
fi

# Parse and count
RESULT=$(python3 -c "
import sys, json
msgs = json.loads('''$RESPONSE''')
if not msgs:
    sys.exit(1)
print(f'DEVCHAT_NEW_MESSAGES: {len(msgs)} new message(s) in DevChat:')
for m in msgs:
    sender = m.get('sender_id', '?')
    content = m.get('content', '')
    time = m.get('created_at', '')[:19]
    print(f'  [{time}] {sender}: {content}')
# Print the latest timestamp for updating
print(f'__LATEST__:{msgs[-1][\"created_at\"]}')
" 2>/dev/null)

if [ -z "$RESULT" ]; then
  exit 0
fi

# Extract latest timestamp and update last check
LATEST=$(echo "$RESULT" | grep '__LATEST__:' | sed 's/__LATEST__://')
if [ -n "$LATEST" ]; then
  echo "$LATEST" > "$LAST_CHECK_FILE"
fi

# Output messages (without the __LATEST__ line)
echo "$RESULT" | grep -v '__LATEST__'
