import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { UnifiedSidebar } from './UnifiedSidebar';
import { UnifiedHeader } from './UnifiedHeader';
import { useLanguage } from '../../contexts/LanguageContext';
import { Sidebar } from '../chat/Sidebar';
import { ChatContainer } from '../chat/ChatContainer';
import { chatService } from '../../services/chatService';
import * as authService from '../../services/authService';
import type { ConversationSummary, Message as APIMessage } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';

export const MainLayout: React.FC = () => {
    const { t } = useTranslation();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [year, setYear] = useState('2029');
    const [quarter, setQuarter] = useState('All');
    const { isRTL, language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();

    // CHAT STATE
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<APIMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(true);
    const [isChatContainerOpen, setIsChatContainerOpen] = useState(true);

    // Determine title based on current path
    const getTitle = () => {
        if (location.pathname.includes('sector')) return t('josoor.layout.sectorDesk');
        if (location.pathname.includes('controls')) return t('josoor.layout.controlsDesk');
        if (location.pathname.includes('planning')) return t('josoor.layout.planningDesk');
        if (location.pathname.includes('enterprise')) return t('josoor.layout.enterpriseDesk');
        if (location.pathname.includes('reporting')) return t('josoor.layout.reportingDesk');
        return t('josoor.layout.josoorTransformation');
    };

    // Load Conversations
    const loadConversations = useCallback(async () => {
        try {
            if (authService.isGuestMode() || !authService.getToken()) {
                const guestConvos = authService.getGuestConversations();
                const adapted = (guestConvos || []).map((c: any) => ({
                    id: c.id,
                    title: c.title || t('josoor.layout.newChat'),
                    message_count: (c.messages || []).length,
                    created_at: c.created_at || new Date().toISOString(),
                    updated_at: c.updated_at || new Date().toISOString(),
                    _isGuest: true,
                }));
                setConversations(adapted as any);
                return;
            }
            const data = await chatService.getConversations();
            const adapted = (data.conversations || []).map((c: any) => ({
                ...c,
                title: c.title || t('josoor.layout.newChat'),
                message_count: Array.isArray(c.messages) ? c.messages.length : (c.message_count || 0),
                created_at: c.created_at || new Date().toISOString(),
                updated_at: c.updated_at || new Date().toISOString(),
            }));
            setConversations(adapted);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        loadConversations();

        const handleRefresh = () => loadConversations();
        window.addEventListener('josoor_conversation_update', handleRefresh);

        return () => {
            window.removeEventListener('josoor_conversation_update', handleRefresh);
        };
    }, [auth.user, loadConversations]);

    // Load Messages
    useEffect(() => {
        const loadMessages = async () => {
            if (!activeConversationId) {
                setMessages([]);
                return;
            }
            try {
                if (authService.isGuestMode() || activeConversationId < 0) { // Assuming guest IDs are negative/handled
                    const guestConvos = authService.getGuestConversations();
                    const c = guestConvos.find((x: any) => x.id === activeConversationId);
                    if (c) setMessages(c.messages || []);
                    return;
                }
                const data = await chatService.getConversationMessages(activeConversationId);
                setMessages(data.messages || []);
            } catch (error) {
                console.error(error);
            }
        };
        loadMessages();
    }, [activeConversationId]);

    // Handle Send Message
    const handleSendMessage = useCallback(async (text: string) => {
        const tempId = `temp-${Date.now()}`;
        const tempMsg: APIMessage = {
            id: Number(tempId) || Date.now(), // fuzzy match type
            role: 'user',
            content: text,
            created_at: new Date().toISOString(),
            metadata: {}
        } as any;

        setMessages(prev => [...prev, tempMsg]);
        setIsLoading(true);

        try {
            const basics: any = { query: text, conversation_id: activeConversationId ?? undefined };
            // Guest Logic Simplified
            if (authService.isGuestMode()) {
                const guestConvos = authService.getGuestConversations();
                const c = guestConvos.find((x: any) => x.id === activeConversationId);
                if (c) basics.history = (c.messages || []).map((m: any) => ({ role: m.role, content: m.content }));
            }

            const response = await chatService.sendMessage(basics);

            // Extract answer
            let answer = response.message || response.answer || "";
            if (response.llm_payload) {
                try {
                    const payload = typeof response.llm_payload === 'string' ? JSON.parse(response.llm_payload) : response.llm_payload;
                    answer = payload.answer || payload.message || answer;
                } catch (e) { }
            }

            const assistantMsg: APIMessage = {
                id: Date.now(),
                role: 'assistant',
                content: answer,
                created_at: new Date().toISOString(),
                metadata: { ...response }
            } as any;

            setMessages(prev => [...prev.filter(m => m !== tempMsg), { ...tempMsg, id: Date.now() - 1000 } as any, assistantMsg]); // replace temp? simplified.

            // Update conversation list if new
            if (!activeConversationId && response.conversation_id) {
                setActiveConversationId(response.conversation_id);
                loadConversations();
            }

        } catch (error) {
            console.error(error);
            const errorMsg: APIMessage = { id: Date.now(), role: 'assistant', content: t('josoor.layout.errorSendingMessage'), created_at: new Date().toISOString() } as any;
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    }, [activeConversationId, loadConversations]);

    return (
        <div className="main-layout" style={{
            display: 'flex',
            height: '100vh',
            backgroundColor: 'var(--canvas-page-bg)',
            color: 'var(--text-primary)',
            overflow: 'hidden'
        }}>

            {/* 1. App Navigation */}
            <UnifiedSidebar
                isCollapsed={isSidebarCollapsed}
                onRequestToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                onNewChat={() => { setActiveConversationId(null); setMessages([]); }}
                activeDesk={location.pathname}
                onNavigate={(path) => navigate(path)}
            />

            {/* 2. Chat History Sidebar (Collapsible) */}
            <div style={{
                width: isChatSidebarOpen ? '260px' : '0px',
                transition: 'width 0.3s ease',
                overflow: 'hidden',
                borderRight: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                backgroundColor: 'var(--sidebar-bg, #0B0F19)'
            }}>
                <Sidebar
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    onNewChat={() => { setActiveConversationId(null); setMessages([]); }}
                    onSelectConversation={setActiveConversationId}
                    onDeleteConversation={async (id) => { await chatService.deleteConversation(id); loadConversations(); }}
                    onQuickAction={() => { }} // Placeholder
                    isCollapsed={false}
                />
            </div>

            {/* 3. Chat Interface (Collapsible) */}
            <div style={{
                width: isChatContainerOpen ? '400px' : '0px',
                transition: 'width 0.3s ease',
                borderRight: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ flex: 1, minHeight: 0 }}>
                    <ChatContainer
                        conversationId={activeConversationId}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        isLoading={isLoading}
                        language={language}
                        onToggleSidebar={() => setIsChatSidebarOpen(!isChatSidebarOpen)}
                        onToggleCanvas={() => setIsChatContainerOpen(!isChatContainerOpen)} // Using this to collapse itself?
                    />
                </div>
            </div>

            {/* 4. Main Content Area (Canvas/Desk) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <UnifiedHeader
                    year={year}
                    quarter={quarter}
                    onYearChange={setYear}
                    onQuarterChange={setQuarter}
                    title={getTitle()}
                    subtitle={t('josoor.layout.executiveControlTower')}
                />

                <main style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '0', // Full width for map
                    position: 'relative'
                }}>
                    <div style={{
                        maxWidth: '100%',
                        margin: '0 auto',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Outlet context={{ year, quarter }} />
                    </div>
                </main>
            </div>
        </div>
    );
};
