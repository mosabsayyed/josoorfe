import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import { chatService } from '../../../services/chatService';
import * as authService from '../../../services/authService';

interface AIExplainButtonProps {
    contextId: string;
    contextTitle: string;
    contextData: any;
    isDark?: boolean;
    style?: React.CSSProperties; // Allow custom positioning
    mode?: 'icon' | 'block'; // 'icon' for header buttons, 'block' for in-panel action
    label?: string; // override default label
}

const styles = {
    iconButton: (isDark: boolean) => ({
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        border: 'none',
        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        transition: 'background 0.2s',
    }),
    blockButton: {
        background: 'rgba(99,102,241,0.1)', 
        border: '1px solid rgba(99,102,241,0.3)', 
        padding: '12px 16px', 
        borderRadius: '6px',
        width: '100%',
        color: '#818CF8',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '0.875rem'
    },
    modal: (isDark: boolean) => ({
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    }),
    modalContent: (isDark: boolean) => ({
        background: isDark ? '#1F2937' : '#FFFFFF',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
    }),
    modalHeader: (isDark: boolean) => ({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`
    }),
    modalTitle: (isDark: boolean) => ({
        fontSize: '1.125rem',
        fontWeight: 600,
        color: isDark ? '#F9FAFB' : '#1F2937',
        margin: 0
    }),
    closeButton: (isDark: boolean) => ({
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: isDark ? '#9CA3AF' : '#6B7280',
        padding: '0 4px'
    }),
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid #374151',
        borderTop: '3px solid #6366F1',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '20px auto'
    },
    continueButton: {
        background: '#6366F1',
        color: '#FFFFFF',
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
        gap: '8px'
    }
};

export const AIExplainButton: React.FC<AIExplainButtonProps> = ({
    contextId,
    contextTitle,
    contextData,
    isDark = true,
    style,
    mode = 'block',
    label = 'Explain with AI'
}) => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<string | null>(null);
    const [chatId, setChatId] = useState<number | null>(null);
    const navigate = useNavigate();

    const handleExplain = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent parent clicks
        setShowModal(true);
        setLoading(true);
        setResponse(null);
        setChatId(null);

        // Ensure session exists
        if (!authService.getToken() && !authService.isGuestMode()) {
            try {
                await authService.startGuestSession();
            } catch (err) {
                console.error("Failed to init guest session", err);
            }
        }

        // Build prompt
        const dataPackage = JSON.stringify(contextData, null, 2);
        const prompt = `## Context Explanation Request
**Topic:** ${contextTitle} (${contextId})

Please analyze the provided data context and explain the key drivers, risks, or insights relevant to this specific item. 
Keep the explanation concise (under 200 words) and actionable.

**Data Package:**
\`\`\`json
${dataPackage}
\`\`\``;

        try {
            // Updated to use chatService.sendMessage which handles Auth correctly
            // Note: chatService.sendMessage wraps this.
            
            const result = await chatService.sendMessage({ 
                query: prompt, 
                conversation_id: undefined // New convo
            });

            // Parse result
            // Similar logic to ChatAppPage response handling
            let content = "";
            let newChatId = result.conversation_id;
            
            if (result.llm_payload) {
                // Native payload
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
            setResponse('Unable to connect to AI Analyst. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        if (chatId) {
            // Navigate with query param
            navigate(`/chat?conversation_id=${chatId}`);
        } else {
            // Fallback navigate
            navigate('/chat');
        }
    };

    return (
        <>
            {mode === 'icon' ? (
                <button 
                    style={{ ...styles.iconButton(isDark), ...style }}
                    onClick={handleExplain}
                    title="Explain with AI"
                >
                    💡
                </button>
            ) : (
                <button 
                    style={{ ...styles.blockButton, ...style }}
                    onClick={handleExplain}
                >
                    <span>✨</span> {label}
                </button>
            )}

            {showModal && (
                <div style={styles.modal(isDark)} onClick={() => !loading && setShowModal(false)}>
                    <div style={styles.modalContent(isDark)} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader(isDark)}>
                            <h3 style={styles.modalTitle(isDark)}>AI Analyst: {contextTitle}</h3>
                            {!loading && (
                                <button style={styles.closeButton(isDark)} onClick={() => setShowModal(false)}>×</button>
                            )}
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={styles.spinner} />
                                <p style={{ color: isDark ? '#9CA3AF' : '#6B7280', marginTop: '16px' }}>
                                    Analyzing context...
                                </p>
                                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : (
                            <>
                                <div style={{ 
                                    color: isDark ? '#E5E7EB' : '#374151', 
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '0.9375rem'
                                }}>
                                    {response}
                                </div>
                                <button style={styles.continueButton} onClick={handleContinue}>
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
