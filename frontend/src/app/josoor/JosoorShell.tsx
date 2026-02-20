import React, { useState, useEffect, useCallback, memo, useContext, useRef, Suspense } from "react";
import { useLocation, useNavigate, UNSAFE_DataRouterContext as DataRouterContext, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { graphService } from '../../services/graphService';
import { Sidebar, ChatContainer } from "../../components/chat";
import { CanvasManager } from "../../components/chat/CanvasManager";
import { chatService } from "../../services/chatService";
import * as authService from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import type {
    ConversationSummary,
    Message as APIMessage,
} from "../../types/api";

const SectorDesk = React.lazy(() => import('../../components/desks/SectorDesk').then(m => ({ default: m.SectorDesk })));
const ControlsDesk = React.lazy(() => import('../../components/desks/ControlsDesk').then(m => ({ default: m.ControlsDesk })));
const PlanningDesk = React.lazy(() => import('../../components/desks/PlanningDesk').then(m => ({ default: m.PlanningDesk })));
const EnterpriseDesk = React.lazy(() => import('../../components/desks/EnterpriseDesk').then(m => ({ default: m.EnterpriseDesk })));
const ReportingDesk = React.lazy(() => import('../../components/desks/ReportingDesk').then(m => ({ default: m.ReportingDesk })));
const TutorialsDesk = React.lazy(() => import('../../components/desks/TutorialsDesk').then(m => ({ default: m.TutorialsDesk })));
const ExplorerDesk = React.lazy(() => import('../../components/desks/ExplorerDesk').then(m => ({ default: m.ExplorerDesk })));
const SettingsDesk = React.lazy(() => import('./views/admin/Settings'));
const ObservabilityDesk = React.lazy(() => import('./views/admin/Observability'));
const ProviderManagement = React.lazy(() => import('../../pages/admin/ProviderManagement').then(m => ({ default: m.ProviderManagement })));
const ABTesting = React.lazy(() => import('../../pages/admin/ABTesting').then(m => ({ default: m.ABTesting })));
const MonitoringDashboard = React.lazy(() => import('../../pages/admin/MonitoringDashboard').then(m => ({ default: m.MonitoringDashboard })));

const MemoizedSidebar = memo(Sidebar);
const MemoizedCanvasManager = memo(CanvasManager);

export type JosoorView =
    | 'chat'
    | 'sector-desk'
    | 'controls-desk'
    | 'planning-desk'
    | 'enterprise-desk'
    | 'reporting-desk'
    | 'knowledge'
    | 'roadmap'
    | 'explorer'
    | 'settings'
    | 'providers'
    | 'ab-testing'
    | 'monitoring'
    | 'observability';

export default function JosoorShell() {
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<APIMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [canvasArtifacts, setCanvasArtifacts] = useState<any[]>([]);
    const [isCanvasOpen, setIsCanvasOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [streamingMessage, setStreamingMessage] = useState<APIMessage | null>(null);

    // Active View State
    const [activeView, setActiveView] = useState<JosoorView>('sector-desk');

    useEffect(() => {
        console.log('JosoorShell activeView changed to:', activeView);
    }, [activeView]);

    // Desks State
    const [year, setYear] = useState('2025');
    const [quarter, setQuarter] = useState('Q4');

    // Fetch dynamic temporal data
    const { data: temporalData } = useQuery({
        queryKey: ['neo4j-years'],
        queryFn: () => graphService.getYears(),
        staleTime: Infinity
    });


    const auth = useAuth();
    const { language } = useLanguage();
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    // Load Conversations (Copied from ChatAppPage)
    const loadConversations = useCallback(async () => {
        try {
            const isGuest = authService.isGuestMode();
            const token = authService.getToken();
            console.log('[loadConversations] guest:', isGuest, 'token:', token ? 'yes' : 'no');
            if (isGuest || !token) {
                const guestConvos = authService.getGuestConversations();
                console.log('[loadConversations] guest convos:', guestConvos?.length || 0);
                const adapted = (guestConvos || []).map((c: any) => ({
                    id: c.id,
                    title: c.title || t('josoor.common.newChat'),
                    message_count: (c.messages || []).length,
                    created_at: c.created_at || new Date().toISOString(),
                    updated_at: c.updated_at || new Date().toISOString(),
                    _isGuest: true,
                }));
                setConversations(adapted as any);
                return;
            }

            console.log('[loadConversations] fetching from API...');
            const data = await chatService.getConversations();
            console.log('[loadConversations] API response:', data);
            const adapted = (data.conversations || []).map((c: any) => ({
                ...c,
                title: c.title || t('josoor.common.newChat'),
                message_count: Array.isArray(c.messages) ? c.messages.length : (c.message_count || 0),
                created_at: c.created_at || new Date().toISOString(),
                updated_at: c.updated_at || new Date().toISOString(),
            }));
            console.log('[loadConversations] adapted:', adapted.length, 'conversations');
            setConversations(adapted);
        } catch (err) {
            console.error('[loadConversations] ERROR:', err);
        }
    }, [t]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // Load Messages (Copied from ChatAppPage)
    useEffect(() => {
        const loadMessages = async () => {
            if (!activeConversationId) {
                setMessages([]);
                return;
            }
            setIsLoading(true);
            try {
                if (authService.isGuestMode() || activeConversationId < 0) {
                    const guestConvos = authService.getGuestConversations();
                    const c = guestConvos.find((x: any) => x.id === activeConversationId);
                    if (c) {
                        setMessages(c.messages || []);
                    }
                } else {
                    const data = await chatService.getConversationMessages(activeConversationId);
                    setMessages(data.messages || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadMessages();
    }, [activeConversationId]);

    // Handle Send Message (Copied from ChatAppPage)
    const handleSendMessage = useCallback(async (messageText: string, options?: { push_to_graph_server?: boolean; suppress_canvas_auto_open?: boolean }) => {
        const tempId = `temp-${Date.now()}`;
        const tempMsg: APIMessage = {
            id: parseInt(tempId) || Date.now(),
            role: 'user',
            content: messageText,
            created_at: new Date().toISOString(),
            metadata: {}
        };

        setMessages(prev => [...prev, tempMsg]);
        setIsLoading(true);

        try {
            const basics: any = {
                query: messageText,
                conversation_id: activeConversationId && activeConversationId > 0 ? activeConversationId : undefined,
                push_to_graph_server: options?.push_to_graph_server
            };

            const response = await chatService.sendMessage(basics);
            let answer = response.llm_payload?.answer || response.message || response.answer || "";
            const assistantMsg: APIMessage = {
                id: Date.now(),
                role: 'assistant',
                content: answer,
                created_at: new Date().toISOString(),
                metadata: response
            };
            setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), { ...tempMsg, id: Date.now() - 1 }, assistantMsg]);
            if (response.conversation_id) {
                setActiveConversationId(response.conversation_id);
            }
            loadConversations();
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: t('josoor.shell.errorGettingResponse'), created_at: new Date().toISOString() }]);
        } finally {
            setIsLoading(false);
        }
    }, [activeConversationId, loadConversations, t]);

    const handleNewChat = useCallback(() => {
        setActiveConversationId(null);
        setMessages([]);
        setCanvasArtifacts([]);
        setActiveView('chat');
    }, []);

    const handleSelectConversation = useCallback((id: number) => {
        setActiveConversationId(id);
        setActiveView('chat');
    }, []);

    const handleDeleteConversation = useCallback(async (id: number) => {
        if (authService.isGuestMode()) {
            authService.deleteGuestConversation(id);
        } else {
            await chatService.deleteConversation(id);
        }
        if (activeConversationId === id) handleNewChat();
        loadConversations();
    }, [activeConversationId, handleNewChat, loadConversations]);

    const handleOpenArtifact = useCallback((artifact: any) => {
        setCanvasArtifacts([artifact]);
        setIsCanvasOpen(true);
    }, []);

    // Sync title/subtitle based on activeView
    const getHeaderMeta = () => {
        switch (activeView) {
            case 'sector-desk': return { title: t('josoor.shell.sectorDesk'), subtitle: t('josoor.shell.sectorDeskSub') };
            case 'controls-desk': return { title: t('josoor.shell.controlsDesk'), subtitle: t('josoor.shell.controlsDeskSub') };
            case 'planning-desk': return { title: t('josoor.shell.planningDesk'), subtitle: t('josoor.shell.planningDeskSub') };
            case 'enterprise-desk': return { title: t('josoor.shell.enterpriseDesk'), subtitle: t('josoor.shell.enterpriseDeskSub') };
            case 'reporting-desk': return { title: t('josoor.shell.reportingDesk'), subtitle: t('josoor.shell.reportingDeskSub') };
            case 'knowledge': return { title: t('josoor.shell.tutorials'), subtitle: t('josoor.shell.tutorialsSub') };
            case 'roadmap': return { title: t('josoor.shell.roadmap'), subtitle: t('josoor.shell.roadmapSub') };
            case 'explorer': return { title: t('josoor.shell.explorer'), subtitle: t('josoor.shell.explorerSub') };
            case 'providers': return { title: t('josoor.shell.providers'), subtitle: t('josoor.shell.providersSub') };
            case 'ab-testing': return { title: t('josoor.shell.abTesting'), subtitle: t('josoor.shell.abTestingSub') };
            case 'monitoring': return { title: t('josoor.shell.monitoring'), subtitle: t('josoor.shell.monitoringSub') };
            case 'observability': return { title: t('josoor.shell.observability'), subtitle: '' };
            default: return { title: t('josoor.shell.graphChat'), subtitle: '' };
        }
    };

    const { title, subtitle } = getHeaderMeta();

    return (
        <div className="josoor-shell" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
            {/* 1. SIDEBAR (Left) - Using original Sidebar component */}
            <div
                style={{
                    width: isSidebarOpen ? '240px' : '50px',
                    transition: 'width 0.3s ease',
                    borderInlineEnd: '1px solid var(--border-color)',
                    flexShrink: 0
                }}
            >
                <MemoizedSidebar
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    onNewChat={handleNewChat}
                    onSelectConversation={handleSelectConversation}
                    onDeleteConversation={handleDeleteConversation}
                    onQuickAction={(action) => {
                        console.log('JosoorShell received QuickAction:', action);
                        // Map quick actions to shell views if needed
                        if (typeof action === 'string') {
                            setActiveView(action as any);
                        } else {
                            setActiveView(action.id as any);
                        }
                    }}
                    isCollapsed={!isSidebarOpen}
                    onRequestToggleCollapse={() => setIsSidebarOpen(!isSidebarOpen)}
                    activeView={activeView}
                />
            </div>

            {/* 2. MAIN CONTENT (Center) */}
            <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
                <ChatContainer
                    conversationId={activeConversationId}
                    messages={activeView === 'chat' ? messages : []}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    onToggleCanvas={() => setIsCanvasOpen(!isCanvasOpen)}
                    streamingMessage={streamingMessage}
                    language={language}
                    onOpenArtifact={handleOpenArtifact}
                    year={year}
                    quarter={quarter}
                    availableYears={temporalData?.years?.map(String) || ['2025', '2026', '2027', '2028', '2029']}
                    onYearChange={setYear}
                    onQuarterChange={setQuarter}
                    title={title}
                    subtitle={subtitle}
                >
                    {activeView !== 'chat' && (
                        <div style={{ flex: 1, height: '100%', overflow: ['settings', 'providers', 'ab-testing', 'monitoring', 'observability'].includes(activeView) ? 'auto' : 'hidden' }}>
                            <Suspense fallback={<div style={{ padding: '2rem', color: 'white' }}>{t('josoor.common.loadingView')}</div>}>
                                {activeView === 'sector-desk' && <SectorDesk year={year} quarter={quarter} />}
                                {activeView === 'controls-desk' && <ControlsDesk />}
                                {activeView === 'planning-desk' && <PlanningDesk />}
                                {activeView === 'enterprise-desk' && <EnterpriseDesk year={year} quarter={quarter} />}
                                {activeView === 'reporting-desk' && <ReportingDesk />}
                                {activeView === 'knowledge' && <TutorialsDesk />}
                                {activeView === 'roadmap' && <div className="p-10 text-xl" style={{ color: 'white' }}>{t('josoor.shell.roadmapComingSoon')}</div>}
                                {activeView === 'explorer' && <ExplorerDesk year={year} quarter={quarter} />}
                                {activeView === 'settings' && <SettingsDesk />}
                                {activeView === 'providers' && <ProviderManagement />}
                                {activeView === 'ab-testing' && <ABTesting />}
                                {activeView === 'monitoring' && <MonitoringDashboard />}
                                {activeView === 'observability' && <ObservabilityDesk />}
                            </Suspense>
                        </div>
                    )}
                </ChatContainer>
            </div>

            {/* 3. CANVAS (Right) */}
            {
                isCanvasOpen && (
                    <div
                        style={{
                            width: '35%',
                            transition: 'all 0.3s ease',
                            borderLeft: '1px solid var(--border-color)',
                            overflow: 'hidden',
                            flexShrink: 0,
                            backgroundColor: 'var(--bg-secondary)'
                        }}
                    >
                        <MemoizedCanvasManager
                            artifacts={canvasArtifacts}
                            isOpen={isCanvasOpen}
                            onClose={() => setIsCanvasOpen(false)}
                        />
                    </div>
                )
            }
        </div >
    );
}
