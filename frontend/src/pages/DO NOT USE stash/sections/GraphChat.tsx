import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

const mockMessages: Message[] = [
  { id: 1, role: 'assistant', content: 'Hello! I am Noor, your knowledge graph expert. I can help you explore and understand the enterprise transformation data. What would you like to know?' },
];

export const GraphChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages(prev => [
      ...prev,
      { id: Date.now(), role: 'user', content: input },
    ]);
    setInput('');

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'I understand your question about the knowledge graph. Let me analyze the relevant nodes and relationships to provide insights. Based on the current data, I can see several key patterns emerging from your transformation initiatives.',
        },
      ]);
    }, 1000);
  };

  return (
    <div id="graph-chat" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
      <div style={{
        backgroundColor: 'var(--component-panel-bg)',
        border: '1px solid var(--component-panel-border)',
        borderRadius: '8px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--component-panel-border)' }}>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', margin: 0 }}>
            Graph Chat
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
            Expert agent grounded with the knowledge graph
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: msg.role === 'user' ? 'var(--component-color-success)' : 'var(--color-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {msg.role === 'user' ? (
                  <User size={18} color="#fff" />
                ) : (
                  <Bot size={18} color="#000" />
                )}
              </div>
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: msg.role === 'user' ? 'var(--component-color-success)' : 'var(--component-bg-secondary)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
              }}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--component-panel-border)',
          display: 'flex',
          gap: '12px',
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about the knowledge graph..."
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: 'var(--component-bg-secondary)',
              border: '1px solid var(--component-panel-border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            style={{
              padding: '12px 20px',
              backgroundColor: 'var(--color-gold)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraphChat;
