import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../../services/chatService';
import * as authService from '../../../services/authService';
import { Search } from 'lucide-react';

interface TraceProps {
  contextId: string;
  contextTitle: string;
  contextData: any;
  isDark?: boolean;
  style?: React.CSSProperties;
  mode?: 'icon' | 'block';
}

export const Trace: React.FC<TraceProps> = ({
  contextId,
  contextTitle,
  contextData,
  isDark = true,
  style,
  mode = 'icon',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [chatId, setChatId] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleTrace = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
    setLoading(true);
    setResponse(null);
    setChatId(null);

    if (!authService.getToken() && !authService.isGuestMode()) {
      try {
        await authService.startGuestSession();
      } catch (err) {
        console.error("Failed to init guest session", err);
      }
    }

    const dataPackage = JSON.stringify(contextData, null, 2);
    const prompt = `## Trace Analysis Request
**Topic:** ${contextTitle} (${contextId})

Please analyze the provided data context and explain the key drivers, risks, or insights relevant to this specific item. 
Keep the explanation concise (under 200 words) and actionable.

**Data Package:**
\`\`\`json
${dataPackage}
\`\`\``;

    try {
      const result = await chatService.sendMessage({ 
        query: prompt, 
        conversation_id: undefined
      });

      let content = "";
      let newChatId = result.conversation_id;
      
      if (result.llm_payload) {
        const p = result.llm_payload;
        content = p.answer || p.message || p.thought || JSON.stringify(p);
      } else if (result.message) {
        content = result.message;
      } else if ((result as any).response) {
        content = (result as any).response;
      } else {
        content = "Analysis complete. Click continue to view details.";
      }

      setResponse(content);
      if (newChatId) setChatId(newChatId);
    } catch (error) {
      console.error(error);
      setResponse('Unable to connect to Trace analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (chatId) {
      navigate(`/main/chat?conversation_id=${chatId}`);
    } else {
      navigate('/main/chat');
    }
  };

  const iconButtonStyle: React.CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
    ...style,
  };

  const blockButtonStyle: React.CSSProperties = {
    background: 'rgba(244, 187, 48, 0.1)',
    border: '1px solid var(--color-gold)',
    padding: '10px 16px',
    borderRadius: '6px',
    color: 'var(--color-gold)',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '0.875rem',
    ...style,
  };

  return (
    <>
      {mode === 'icon' ? (
        <button 
          style={iconButtonStyle}
          onClick={handleTrace}
          title="Trace"
        >
          <Search size={14} color={isDark ? 'var(--component-text-accent)' : '#D97706'} />
        </button>
      ) : (
        <button 
          style={blockButtonStyle}
          onClick={handleTrace}
        >
          <Search size={16} /> Trace
        </button>
      )}

      {showModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }} 
          onClick={() => !loading && setShowModal(false)}
        >
          <div 
            style={{
              background: 'var(--component-panel-bg)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              border: '1px solid var(--component-panel-border)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--component-panel-border)',
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                Trace: {contextTitle}
              </h3>
              {!loading && (
                <button 
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '0 4px',
                  }} 
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid var(--component-panel-border)',
                  borderTop: '3px solid var(--color-gold)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '20px auto',
                }} />
                <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
                  Tracing context...
                </p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <>
                <div style={{ 
                  color: 'var(--text-primary)', 
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.9375rem',
                }}>
                  {response}
                </div>
                <button 
                  style={{
                    background: 'var(--color-gold)',
                    color: '#000',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '20px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }} 
                  onClick={handleContinue}
                >
                  Continue Discussion in Chat →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Trace;
