
import { useState, useEffect, useCallback, memo, useContext, useRef } from "react";
import { useBlocker, useLocation, useNavigate, UNSAFE_DataRouterContext as DataRouterContext, Outlet } from 'react-router-dom';
import { Sidebar, ChatContainer } from "../components/chat";
import { CanvasManager } from "../components/chat/CanvasManager";
import { chatService } from "../services/chatService";
import * as authService from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type {
  ConversationSummary,
  Message as APIMessage,
} from "../types/api";

import TwinKnowledge from '../components/content/TwinKnowledge';
import { TwinKnowledgeRenderer } from '../components/chat/renderers/TwinKnowledgeRenderer';
import PlanYourJourney from '../components/content/PlanYourJourney';
import ProductRoadmap from '../components/content/ProductRoadmap';

import { LANDING_PAGES } from '../data/landingPages';

const MemoizedSidebar = memo(Sidebar);
const MemoizedChatContainer = memo(ChatContainer);
const MemoizedCanvasManager = memo(CanvasManager);

function RouterBlocker() {
  const { user } = useAuth();
  const dataRouterCtx = useContext(DataRouterContext as any);
  const isDataRouter = !!(dataRouterCtx && (dataRouterCtx as any).router);

  const guestHasHistory = !user && authService.isGuestMode() && (authService.getGuestConversations() || []).length > 0;

  if (!isDataRouter) return null;
  return <RouterBlockerInner when={guestHasHistory} />;
}

function RouterBlockerInner({ when }: { when: boolean }) {
  const blocker = useBlocker(when);
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const promptMsg = 'If you leave now you will lose your guest conversation history and artifacts. Are you sure?';
      const proceed = window.confirm(promptMsg);
      if (proceed) {
        setTimeout(() => blocker.proceed(), 0);
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);
  return null;
}

export default function ChatAppPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<APIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasArtifacts, setCanvasArtifacts] = useState<any[]>([]);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [streamingMessage, setStreamingMessage] = useState<APIMessage | null>(null);
  const [initialCanvasIndex, setInitialCanvasIndex] = useState(0);

  // Desks State
  const [year, setYear] = useState('2025');
  const [quarter, setQuarter] = useState('Q4');

  const auth = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPathRef = useRef(location.pathname);
  useEffect(() => { currentPathRef.current = location.pathname; }, [location.pathname]);

  const isDeskMode = location.pathname.includes('/desk');

  const hasAutoSelectedRef = useRef(false);

  // Guest Logic
  useEffect(() => {
    const handler = () => {
      // logic to update guestHasHistory if we were using it in state, 
      // but we used RouterBlocker component for that cleaner separation.
    };
    window.addEventListener('josoor_auth_change', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('josoor_auth_change', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  // Load Conversations
  const loadConversations = useCallback(async () => {
    try {
      if (authService.isGuestMode() || !authService.getToken()) {
        const guestConvos = authService.getGuestConversations();
        const adapted = (guestConvos || []).map((c: any) => ({
          id: c.id,
          title: c.title || 'New Chat',
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
        title: c.title || "New Chat",
        message_count: Array.isArray(c.messages) ? c.messages.length : (c.message_count || 0),
        created_at: c.created_at || new Date().toISOString(),
        updated_at: c.updated_at || new Date().toISOString(),
      }));
      setConversations(adapted);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // UseEffect for initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load Messages
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

  // Handle URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const convoId = params.get('conversation_id');
    if (convoId) {
      const id = parseInt(convoId, 10);
      if (!isNaN(id)) {
        hasAutoSelectedRef.current = true;
        setActiveConversationId(id);
      }
    }
  }, [location.search]);


  // SEND MESSAGE
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

      if (authService.isGuestMode()) {
        // Guest Logic
        const guestConvos = authService.getGuestConversations();
        const c = guestConvos.find((x: any) => x.id === activeConversationId);
        if (c) {
          basics.history = (c.messages || []).map((m: any) => ({ role: m.role, content: m.content }));
        }

        const response = await chatService.sendMessage(basics);
        // Process response...
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
          metadata: response
        };
        setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), { ...tempMsg, id: Date.now() - 1 }, assistantMsg]);
        // Save guest convo
        let convoId = activeConversationId;
        if (!convoId) convoId = -Date.now();
        authService.saveGuestConversation({
          id: convoId!,
          title: messageText.substring(0, 30),
          messages: [...messages, tempMsg, assistantMsg],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        loadConversations();

      } else {
        // Streaming Logic
        await chatService.streamMessage(basics, {
          onChunk: (chunk) => {
            setStreamingMessage(prev => {
              if (!prev) return {
                id: Date.now() + 1,
                role: 'assistant',
                content: chunk,
                created_at: new Date().toISOString(),
                metadata: { isStreaming: true }
              };
              return { ...prev, content: prev.content + chunk };
            });
          },
          onComplete: (fullResponse) => {
            const assistantMsg: APIMessage = {
              id: Date.now() + 1,
              role: 'assistant',
              content: fullResponse.message || fullResponse.answer || "",
              created_at: new Date().toISOString(),
              metadata: fullResponse
            };
            setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), { ...tempMsg, id: Date.now() - 1 }, assistantMsg]);
            setStreamingMessage(null);

            if (fullResponse.artifacts && fullResponse.artifacts.length > 0 && !options?.suppress_canvas_auto_open) {
              setCanvasArtifacts(fullResponse.artifacts);
              setIsCanvasOpen(true);
            }
            if (!activeConversationId && fullResponse.conversation_id) {
              setActiveConversationId(fullResponse.conversation_id);
              loadConversations();
            }
          },
          onError: (err) => {
            setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: 'Error getting response', created_at: new Date().toISOString() }]);
            setStreamingMessage(null);
          }
        });
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId, messages, loadConversations]);

  // Handlers
  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setCanvasArtifacts([]);
    if (location.pathname.includes('/desk')) navigate('/chat');
  }, [location.pathname, navigate]);

  const handleSelectConversation = useCallback((id: number) => {
    setActiveConversationId(id);
    if (location.pathname.includes('/desk')) navigate('/chat');
  }, [location.pathname, navigate]);

  const handleDeleteConversation = useCallback(async (id: number) => {
    if (authService.isGuestMode()) {
      authService.deleteGuestConversation(id);
    } else {
      await chatService.deleteConversation(id);
    }
    if (activeConversationId === id) handleNewChat();
    loadConversations();
  }, [activeConversationId, handleNewChat, loadConversations]);

  const handleQuickAction = (action: any) => {
    // Basic simulation of quick actions
    const actionId = typeof action === 'string' ? action : action.id;
    if (actionId && actionId.endsWith('-desk')) {
      navigate(`/desk/${actionId.replace('-desk', '')}`);
    } else if (typeof action === 'object' && action.command) {
      handleSendMessage(action.command.en || action.command);
    }
  };

  const handleOpenArtifact = useCallback((artifact: any, allArtifacts?: any[]) => {
    const list = allArtifacts && allArtifacts.length > 0 ? allArtifacts : [artifact];
    setCanvasArtifacts(list);
    setInitialCanvasIndex(list.indexOf(artifact) >= 0 ? list.indexOf(artifact) : 0);
    setIsCanvasOpen(true);
  }, []);

  const getDeskTitle = () => {
    if (location.pathname.includes('sector')) return 'Sector Desk';
    if (location.pathname.includes('controls')) return 'Controls Desk';
    if (location.pathname.includes('planning')) return 'Planning Desk';
    if (location.pathname.includes('enterprise')) return 'Enterprise Desk';
    if (location.pathname.includes('reporting')) return 'Reporting Desk';
    return 'JOSOOR Transformation';
  };

  return (
    <div className="app-container" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
      {/* 1. SIDEBAR (Left) */}
      <div
        className={`sidebar-wrapper ${isSidebarOpen ? 'expanded' : 'collapsed'}`}
        style={{
          width: isSidebarOpen ? '260px' : '60px',
          transition: 'width 0.3s ease',
          borderRight: '1px solid var(--border-color)',
          flexShrink: 0
        }}
      >
        <MemoizedSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onQuickAction={handleQuickAction}
          isCollapsed={!isSidebarOpen}
          onRequestToggleCollapse={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>

      {/* 2. MAIN CONTENT (Center) */}
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>

        {isDeskMode ? (
          // DESK MODE - ChatContainer with header + Outlet for desk content
          <MemoizedChatContainer
            conversationId={null}
            messages={[]}
            onSendMessage={() => { }}
            isLoading={false}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onToggleCanvas={() => { }}
            language={language}
            year={year}
            quarter={quarter}
            onYearChange={setYear}
            onQuarterChange={setQuarter}
          >
            <Outlet context={{ year, quarter }} />
          </MemoizedChatContainer>
        ) : (
          // CHAT MODE
          <MemoizedChatContainer
            conversationId={activeConversationId}
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onToggleCanvas={() => setIsCanvasOpen(!isCanvasOpen)}
            streamingMessage={streamingMessage}
            language={language}
            onOpenArtifact={handleOpenArtifact}
            year={year}
            quarter={quarter}
            onYearChange={setYear}
            onQuarterChange={setQuarter}
          />
        )}

      </div>

      {/* 3. CANVAS (Right) */}
      {!isDeskMode && (
        <div
          className={`canvas-wrapper ${isCanvasOpen ? 'open' : 'closed'}`}
          style={{
            width: isCanvasOpen ? '45%' : '0px',
            transition: 'all 0.3s ease',
            borderLeft: isCanvasOpen ? '1px solid var(--border-color)' : 'none',
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <MemoizedCanvasManager
            artifacts={canvasArtifacts}
            isOpen={isCanvasOpen}
            onClose={() => setIsCanvasOpen(false)}
            initialArtifact={canvasArtifacts[initialCanvasIndex] || null}
          />
        </div>
      )}
    </div>
  );
}
