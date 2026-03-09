import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getRecentMessages, sendMessage, subscribeToMessages, type DevChatMessage } from '../../services/devChatService';
import './DevChatPanel.css';

const SENDER_LABELS: Record<string, string> = {
  'claude-frontend': 'Frontend Claude',
  'claude-backend': 'Backend Claude',
  'mosab': 'Mosab',
  'system': 'System',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function DevChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DevChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const [meetingActive, setMeetingActive] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  // Load initial messages + subscribe
  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      try {
        const msgs = await getRecentMessages('general', 100);
        setMessages(msgs);
        // Check if a meeting is currently active
        const lastSystem = [...msgs].reverse().find(m => m.sender_type === 'system');
        if (lastSystem && lastSystem.content.toLowerCase().includes('meeting started')) {
          setMeetingActive(true);
        }
      } catch (e) {
        console.error('DevChat: failed to load messages', e);
      }
    })();

    unsub = subscribeToMessages('general', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (!openRef.current) setUnread(u => u + 1);
      // Track meeting state
      if (msg.sender_type === 'system') {
        if (msg.content.toLowerCase().includes('meeting started')) setMeetingActive(true);
        if (msg.content.toLowerCase().includes('meeting finished')) setMeetingActive(false);
      }
    });

    // Fallback poll every 5s in case Realtime doesn't connect
    const poll = setInterval(async () => {
      try {
        const msgs = await getRecentMessages('general', 100);
        setMessages(prev => {
          if (msgs.length !== prev.length) return msgs;
          return prev;
        });
      } catch (_) { /* silent */ }
    }, 5000);

    return () => { if (unsub) unsub(); clearInterval(poll); };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setUnread(0);
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      const msg = await sendMessage('mosab', 'human', text);
      // Optimistically add if Realtime didn't already
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    } catch (e) {
      console.error('DevChat: send failed', e);
    }
    setSending(false);
  }, [input, sending]);

  const handleStartMeeting = useCallback(async () => {
    try {
      await sendMessage('system', 'system', 'Meeting started by Mosab');
    } catch (e) {
      console.error('DevChat: meeting start failed', e);
    }
  }, []);

  const handleEndMeeting = useCallback(async () => {
    try {
      await sendMessage('system', 'system', 'Meeting finished');
    } catch (e) {
      console.error('DevChat: meeting end failed', e);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <>
      {/* FAB */}
      <button className="devchat-fab" onClick={open ? () => setOpen(false) : handleOpen} title="DevChat">
        {open ? '✕' : '💬'}
        {!open && unread > 0 && <span className="devchat-fab__badge">{unread}</span>}
      </button>

      {/* Panel */}
      {open && (
        <div className="devchat-panel">
          {/* Header */}
          <div className="devchat-header">
            <span className="devchat-header__title">DevChat</span>
            {!meetingActive ? (
              <button className="devchat-header__btn" onClick={handleStartMeeting}>Start Meeting</button>
            ) : (
              <button className="devchat-header__btn devchat-header__btn--end" onClick={handleEndMeeting}>End Meeting</button>
            )}
            <button className="devchat-header__close" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="devchat-messages">
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--component-text-secondary)', fontSize: 12, padding: 24 }}>
                No messages yet. Start the conversation.
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`devchat-msg ${msg.sender_type === 'system' ? 'devchat-msg--system' : ''}`}>
                {msg.sender_type !== 'system' && (
                  <div className="devchat-msg__header">
                    <span className={`devchat-msg__dot devchat-msg__dot--${msg.sender_id}`} />
                    <span className="devchat-msg__sender">{SENDER_LABELS[msg.sender_id] || msg.sender_id}</span>
                    <span className="devchat-msg__time">{formatTime(msg.created_at)}</span>
                  </div>
                )}
                <div className="devchat-msg__content">{msg.content}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="devchat-input">
            <input
              className="devchat-input__field"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="devchat-input__send" onClick={handleSend} disabled={!input.trim() || sending}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
