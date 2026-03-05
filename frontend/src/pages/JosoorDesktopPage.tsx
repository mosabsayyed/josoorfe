/**
 * JosoorDesktopPage — macOS-style desktop shell (test page)
 * Route: /josoor-desktop
 * Self-contained: delete this file + CSS + 2 lines in App.tsx to revert.
 */
import React, { useState, useEffect, useCallback, memo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { graphService } from '../services/graphService';
import { ChatContainer } from '../components/chat';
import { CanvasManager } from '../components/chat/CanvasManager';
import { chatService } from '../services/chatService';
import * as authService from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';
import type { ConversationSummary, Message as APIMessage } from '../types/api';
// ThemeToggle & LanguageToggle removed — logic inlined into menu items
import type { InterventionContext } from '../components/desks/PlanningDesk';
import './JosoorDesktopPage.css';

// Lazy desk components
const SectorDesk = React.lazy(() => import('../components/desks/SectorDesk').then(m => ({ default: m.SectorDesk })));
const ControlsDesk = React.lazy(() => import('../components/desks/ControlsDesk').then(m => ({ default: m.ControlsDesk })));
const PlanningDesk = React.lazy(() => import('../components/desks/PlanningDesk').then(m => ({ default: m.PlanningDesk })));
const EnterpriseDesk = React.lazy(() => import('../components/desks/EnterpriseDesk').then(m => ({ default: m.EnterpriseDesk })));
const ReportingDesk = React.lazy(() => import('../components/desks/ReportingDesk').then(m => ({ default: m.ReportingDesk })));
const TutorialsDesk = React.lazy(() => import('../components/desks/TutorialsDesk').then(m => ({ default: m.TutorialsDesk })));
const ExplorerDesk = React.lazy(() => import('../components/desks/ExplorerDesk').then(m => ({ default: m.ExplorerDesk })));
const OntologyHome = React.lazy(() => import('../components/desks/OntologyHome'));

const MemoizedCanvasManager = memo(CanvasManager);

// ── Types ──
type DesktopView =
  | 'home' | 'chat'
  | 'sector-desk' | 'enterprise-desk' | 'planning-desk'
  | 'reporting-desk' | 'explorer'
  | 'knowledge' | 'settings' | 'observability';

type MenuItemDef =
  | { type: 'nav'; labelEn: string; labelAr: string; view: DesktopView }
  | { type: 'action'; labelEn: string; labelAr: string; action: string }
  | { type: 'separator' };

interface MenuGroupDef { labelEn: string; labelAr: string; items: MenuItemDef[] }

const TOOLBAR_VIEWS = new Set<DesktopView>([
  'sector-desk', 'enterprise-desk', 'planning-desk', 'explorer', 'reporting-desk', 'chat',
]);

// ── Component ──
export default function JosoorDesktopPage() {
  const { language, setLanguage } = useLanguage();
  const isAr = language === 'ar';
  const navigate = useNavigate();

  // Theme state (mirrors ThemeToggle logic)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { const s = localStorage.getItem('josoor_theme'); if (s === 'light') return 'light'; } catch {}
    return 'dark';
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('josoor_theme', theme); } catch {}
  }, [theme]);

  // View state
  const [activeView, setActiveView] = useState<DesktopView>('home');
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  // User profile
  const [currentUser, setCurrentUser] = useState<any>(() => authService.getUser());
  useEffect(() => {
    const onAuth = () => setCurrentUser(authService.getUser());
    window.addEventListener('storage', onAuth);
    window.addEventListener('josoor_auth_change', onAuth as EventListener);
    return () => {
      window.removeEventListener('storage', onAuth);
      window.removeEventListener('josoor_auth_change', onAuth as EventListener);
    };
  }, []);

  // Temporal controls
  const [year, setYear] = useState('2026');
  const [quarter, setQuarter] = useState('Q1');
  const { data: temporalData } = useQuery({
    queryKey: ['neo4j-years'],
    queryFn: () => graphService.getYears(),
    staleTime: Infinity,
  });
  const availableYears = temporalData?.years?.map(String) || ['2025', '2026', '2027', '2028', '2029'];

  // Chat state
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<APIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasArtifacts, setCanvasArtifacts] = useState<any[]>([]);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [streamingMessage] = useState<APIMessage | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string | null>('general_analysis');
  const [selectedTools, setSelectedTools] = useState<string[]>(['recall_memory', 'recall_vision_memory']);
  const [isPersonaLocked, setIsPersonaLocked] = useState(false);
  const [interventionContext, setInterventionContext] = useState<InterventionContext | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const isGuest = authService.isGuestMode();
      const token = authService.getToken();
      if (isGuest || !token) {
        const guestConvos = authService.getGuestConversations();
        const adapted = (guestConvos || []).map((c: any) => ({
          id: c.id,
          title: c.title || (isAr ? '\u0645\u062D\u0627\u062F\u062B\u0629 \u062C\u062F\u064A\u062F\u0629' : 'New Chat'),
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
        title: c.title || (isAr ? '\u0645\u062D\u0627\u062F\u062B\u0629 \u062C\u062F\u064A\u062F\u0629' : 'New Chat'),
        message_count: Array.isArray(c.messages) ? c.messages.length : (c.message_count || 0),
        created_at: c.created_at || new Date().toISOString(),
        updated_at: c.updated_at || new Date().toISOString(),
      }));
      setConversations(adapted);
    } catch (err) {
      console.error('[JDP] loadConversations error:', err);
    }
  }, [isAr]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    const load = async () => {
      if (!activeConversationId) { setMessages([]); return; }
      setIsLoading(true);
      try {
        if (authService.isGuestMode() || activeConversationId < 0) {
          const guestConvos = authService.getGuestConversations();
          const c = guestConvos.find((x: any) => x.id === activeConversationId);
          if (c) setMessages(c.messages || []);
        } else {
          const data = await chatService.getConversationMessages(activeConversationId);
          setMessages(data.messages || []);
        }
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    load();
  }, [activeConversationId]);

  // Send message
  const handleSendMessage = useCallback(async (messageText: string) => {
    const tempMsg: APIMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
      metadata: {},
    };
    setMessages(prev => [...prev, tempMsg]);
    setIsLoading(true);
    try {
      const toolSuffix = selectedTools.length > 0
        ? `\n\nTools: ${selectedTools.join(', ')}. Use them if relevant.`
        : '';
      const response = await chatService.sendMessage({
        query: messageText + toolSuffix,
        conversation_id: activeConversationId && activeConversationId > 0 ? activeConversationId : undefined,
        ...(selectedPersona && { prompt_key: selectedPersona }),
        language,
      });
      if (selectedPersona && !isPersonaLocked) setIsPersonaLocked(true);
      const answer = response.llm_payload?.answer || response.message || response.answer || '';
      const assistantMsg: APIMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: answer,
        created_at: new Date().toISOString(),
        metadata: response,
      };
      setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), { ...tempMsg, id: Date.now() - 1 }, assistantMsg]);
      if (response.conversation_id) setActiveConversationId(response.conversation_id);
      loadConversations();
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: isAr ? '\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0627\u0644\u0631\u062F' : 'Error getting response', created_at: new Date().toISOString() }]);
    } finally { setIsLoading(false); }
  }, [activeConversationId, selectedTools, selectedPersona, isPersonaLocked, loadConversations, language, isAr]);

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

  const handleOpenArtifact = useCallback((artifact: any) => {
    setCanvasArtifacts([artifact]);
    setIsCanvasOpen(true);
  }, []);

  const handleIntervene = useCallback((ctx: InterventionContext) => {
    setInterventionContext(ctx);
    setActiveView('planning-desk');
  }, []);

  // Reset persona on conversation change
  useEffect(() => {
    setSelectedPersona(null);
    setIsPersonaLocked(false);
    setSelectedTools(['recall_memory', 'recall_vision_memory']);
  }, [activeConversationId]);

  useEffect(() => {
    if (activeView !== 'planning-desk') setInterventionContext(null);
  }, [activeView]);

  // Close menu on outside click
  const closeMenu = useCallback(() => setOpenMenu(null), []);

  // ── Action handler for menu items ──
  const handleMenuAction = useCallback((action: string) => {
    setOpenMenu(null);
    switch (action) {
      case 'print': window.print(); break;
      case 'save': /* TODO */ break;
      case 'export': /* TODO */ break;
      case 'toggle-theme': setTheme(t => t === 'dark' ? 'light' : 'dark'); break;
      case 'toggle-language': setLanguage(language === 'en' ? 'ar' : 'en'); break;
      case 'profile': break;
      case 'logout':
        (async () => { try { await authService.logout(); } catch {} setCurrentUser(null); navigate('/landing'); })();
        break;
    }
  }, [language, setLanguage, navigate]);

  // ── Menu item click (nav or action) ──
  const handleItemClick = useCallback((item: MenuItemDef) => {
    if (item.type === 'nav') {
      setActiveView(item.view);
      setOpenMenu(null);
    } else if (item.type === 'action') {
      handleMenuAction(item.action);
    }
  }, [handleMenuAction]);

  // ── Dynamic menu definitions (need runtime state for toggle labels) ──
  const MENUS: MenuGroupDef[] = [
    {
      labelEn: 'Josoor', labelAr: '\u062C\u0633\u0648\u0631',
      items: [
        { type: 'nav', labelEn: 'Home', labelAr: '\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629', view: 'home' },
        { type: 'separator' },
        { type: 'action', labelEn: `${theme === 'dark' ? '\u2600\uFE0F Light Mode' : '\uD83C\uDF19 Dark Mode'}`, labelAr: `${theme === 'dark' ? '\u2600\uFE0F \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0641\u0627\u062A\u062D' : '\uD83C\uDF19 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u062F\u0627\u0643\u0646'}`, action: 'toggle-theme' },
        { type: 'action', labelEn: language === 'en' ? '\uD83C\uDDF8\uD83C\uDDE6 Arabic' : '\uD83C\uDDEC\uD83C\uDDE7 English', labelAr: language === 'en' ? '\uD83C\uDDF8\uD83C\uDDE6 \u0627\u0644\u0639\u0631\u0628\u064A\u0629' : '\uD83C\uDDEC\uD83C\uDDE7 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629', action: 'toggle-language' },
        { type: 'separator' },
        { type: 'action', labelEn: '\uD83D\uDC64 Profile', labelAr: '\uD83D\uDC64 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A', action: 'profile' },
        { type: 'action', labelEn: '\uD83D\uDEAA Logout', labelAr: '\uD83D\uDEAA \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C', action: 'logout' },
      ],
    },
    {
      labelEn: 'File', labelAr: '\u0645\u0644\u0641',
      items: [
        { type: 'action', labelEn: '\uD83D\uDDA8\uFE0F Print', labelAr: '\uD83D\uDDA8\uFE0F \u0637\u0628\u0627\u0639\u0629', action: 'print' },
        { type: 'action', labelEn: '\uD83D\uDCBE Save', labelAr: '\uD83D\uDCBE \u062D\u0641\u0638', action: 'save' },
        { type: 'action', labelEn: '\uD83D\uDCE5 Export', labelAr: '\uD83D\uDCE5 \u062A\u0635\u062F\u064A\u0631', action: 'export' },
      ],
    },
    {
      labelEn: 'Oversight', labelAr: '\u0627\u0644\u0625\u0634\u0631\u0627\u0641',
      items: [
        { type: 'nav', labelEn: 'Observe', labelAr: '\u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629', view: 'sector-desk' },
        { type: 'nav', labelEn: 'Decide', labelAr: '\u0627\u0644\u0642\u0631\u0627\u0631\u0627\u062A', view: 'enterprise-desk' },
        { type: 'nav', labelEn: 'Deliver', labelAr: '\u0627\u0644\u062A\u0646\u0641\u064A\u0630', view: 'planning-desk' },
      ],
    },
    {
      labelEn: 'Manage', labelAr: '\u0627\u0644\u0625\u062F\u0627\u0631\u0629',
      items: [
        { type: 'nav', labelEn: 'Reporting', labelAr: '\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631', view: 'reporting-desk' },
        { type: 'nav', labelEn: 'Signals', labelAr: '\u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062A', view: 'explorer' },
      ],
    },
    {
      labelEn: 'Refer', labelAr: '\u0627\u0644\u0645\u0631\u062C\u0639',
      items: [
        { type: 'nav', labelEn: 'Tutorials', labelAr: '\u0627\u0644\u062F\u0631\u0648\u0633', view: 'knowledge' },
        { type: 'nav', labelEn: 'Expert Chat', labelAr: '\u0645\u062D\u0627\u062F\u062B\u0629 \u0627\u0644\u062E\u0628\u064A\u0631', view: 'chat' },
      ],
    },
    {
      labelEn: 'Admin', labelAr: '\u0627\u0644\u0625\u062F\u0627\u0631\u0629',
      items: [
        { type: 'nav', labelEn: 'Settings', labelAr: '\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A', view: 'settings' },
        { type: 'nav', labelEn: 'Observability', labelAr: '\u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629', view: 'observability' },
      ],
    },
  ];

  const showToolbar = TOOLBAR_VIEWS.has(activeView);
  const isChatView = activeView === 'chat';

  return (
    <div className="jdp-viewport" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="jdp-window">
        {/* ── Title Bar — clean: traffic lights + title + profile avatar ── */}
        <div className="jdp-titlebar">
          <div className="jdp-traffic-lights">
            <span className="jdp-traffic-dot jdp-dot-close" title={isAr ? 'إغلاق' : 'Close'} onClick={() => navigate('/josoor')} />
            <span className="jdp-traffic-dot jdp-dot-minimize" title={isAr ? 'تصغير' : 'Minimize'} onClick={() => { /* web: no-op */ }} />
            <span className="jdp-traffic-dot jdp-dot-maximize" title={isAr ? 'تكبير' : 'Maximize'} onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else document.documentElement.requestFullscreen().catch(() => {});
            }} />
          </div>
          <div className="jdp-titlebar-center">{isAr ? '\u062C\u0633\u0648\u0631' : 'Josoor'}</div>
          <div className="jdp-titlebar-actions">
            <span className="jdp-profile-avatar" title={currentUser?.user_metadata?.full_name || currentUser?.email || ''}>
              {currentUser?.user_metadata?.full_name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        </div>

        {/* ── Menu Bar ── */}
        <div className="jdp-menubar">
          {MENUS.map((menu, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <button
                className={`jdp-menu-trigger ${idx === 0 ? 'jdp-menu-bold' : ''} ${openMenu === idx ? 'jdp-menu-active' : ''}`}
                onClick={() => setOpenMenu(openMenu === idx ? null : idx)}
                onMouseEnter={() => { if (openMenu !== null) setOpenMenu(idx); }}
              >
                {isAr ? menu.labelAr : menu.labelEn} {idx > 0 ? '\u25BE' : ''}
              </button>
              {openMenu === idx && (
                <div className="jdp-dropdown">
                  {menu.items.map((item, itemIdx) => {
                    if (item.type === 'separator') {
                      return <div key={itemIdx} className="jdp-dropdown-sep" />;
                    }
                    const isActive = item.type === 'nav' && activeView === item.view;
                    const isLogout = item.type === 'action' && item.action === 'logout';
                    return (
                      <button
                        key={itemIdx}
                        className={`jdp-dropdown-item ${isActive ? 'jdp-item-active' : ''}`}
                        style={isLogout ? { color: '#ef4444' } : undefined}
                        onClick={() => handleItemClick(item)}
                      >
                        {isAr ? item.labelAr : item.labelEn}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Home shortcut on right */}
          <div style={{ flex: 1 }} />
          <button
            className={`jdp-menu-trigger ${activeView === 'home' ? 'jdp-menu-active' : ''}`}
            onClick={() => { setActiveView('home'); setOpenMenu(null); }}
          >
            {isAr ? '\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629' : 'Home'}
          </button>
        </div>

        {/* Menu overlay to close dropdowns */}
        {openMenu !== null && <div className="jdp-menu-overlay" onClick={closeMenu} />}

        {/* ── Toolbar (conditional) ── */}
        {showToolbar && (
          <div className="jdp-toolbar">
            <label>{isAr ? '\u0627\u0644\u0633\u0646\u0629' : 'Year'}</label>
            <select value={year} onChange={e => setYear(e.target.value)}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <label>{isAr ? '\u0627\u0644\u0631\u0628\u0639' : 'Quarter'}</label>
            <select value={quarter} onChange={e => setQuarter(e.target.value)}>
              {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
        )}

        {/* ── Content Area ── */}
        <div className="jdp-content">
          {/* Chat conversation sidebar (only in chat view) */}
          {isChatView && (
            <div className="jdp-chat-sidebar">
              <div className="jdp-chat-sidebar-header">
                <span>{isAr ? '\u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0627\u062A' : 'Chats'}</span>
                <button className="jdp-new-chat-btn" onClick={handleNewChat}>
                  {isAr ? '+ \u062C\u062F\u064A\u062F' : '+ New'}
                </button>
              </div>
              <div className="jdp-chat-list">
                {conversations.map(c => (
                  <button
                    key={c.id}
                    className={`jdp-chat-item ${activeConversationId === c.id ? 'jdp-chat-active' : ''}`}
                    onClick={() => handleSelectConversation(c.id)}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="jdp-content-main">
            {isChatView ? (
              <ChatContainer
                conversationId={activeConversationId}
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                language={language}
                onToggleSidebar={() => {}}
                onToggleCanvas={() => setIsCanvasOpen(!isCanvasOpen)}
                streamingMessage={streamingMessage}
                onOpenArtifact={handleOpenArtifact}
                year={year}
                quarter={quarter}
                availableYears={availableYears}
                onYearChange={setYear}
                onQuarterChange={setQuarter}
                title={isAr ? '\u0645\u062D\u0627\u062F\u062B\u0629 \u0627\u0644\u062E\u0628\u064A\u0631' : 'Expert Chat'}
                subtitle=""
                selectedPersona={selectedPersona}
                onPersonaChange={setSelectedPersona}
                isPersonaLocked={isPersonaLocked}
                selectedTools={selectedTools}
                onToolsChange={setSelectedTools}
              />
            ) : (
              <Suspense fallback={<div className="jdp-loading">{isAr ? '\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...' : 'Loading...'}</div>}>
                <div style={{ flex: 1, overflow: activeView === 'home' || activeView === 'reporting-desk' ? 'auto' : 'hidden', height: '100%' }}>
                  {activeView === 'home' && <OntologyHome />}
                  {activeView === 'sector-desk' && (
                    <SectorDesk
                      year={year}
                      quarter={quarter}
                      onNavigateToCapability={(capId: string) => setActiveView('enterprise-desk')}
                      onContinueInChat={(conversationId: number) => {
                        setActiveConversationId(conversationId);
                        setActiveView('chat');
                      }}
                    />
                  )}
                  {activeView === 'enterprise-desk' && (
                    <EnterpriseDesk
                      year={year}
                      quarter={quarter}
                      onIntervene={handleIntervene}
                      onContinueInChat={(id: number) => { setActiveConversationId(id); setActiveView('chat'); }}
                    />
                  )}
                  {activeView === 'planning-desk' && (
                    <PlanningDesk
                      interventionContext={interventionContext}
                      onClearContext={() => setInterventionContext(null)}
                    />
                  )}
                  {activeView === 'reporting-desk' && <ReportingDesk />}
                  {activeView === 'explorer' && <ExplorerDesk year={year} quarter={quarter} />}
                  {activeView === 'knowledge' && <TutorialsDesk />}
                  {activeView === 'settings' && (
                    <div className="jdp-loading">{isAr ? '\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A (\u0642\u0631\u064A\u0628\u0627\u064B)' : 'Settings (Coming Soon)'}</div>
                  )}
                  {activeView === 'observability' && (
                    <div className="jdp-loading">{isAr ? '\u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629 (\u0642\u0631\u064A\u0628\u0627\u064B)' : 'Observability (Coming Soon)'}</div>
                  )}
                </div>
              </Suspense>
            )}
          </div>

          {/* Canvas panel */}
          {isCanvasOpen && (
            <div style={{
              width: '35%',
              borderInlineStart: '1px solid var(--component-panel-border)',
              overflow: 'hidden',
              flexShrink: 0,
              backgroundColor: 'var(--component-bg-secondary)',
            }}>
              <MemoizedCanvasManager
                artifacts={canvasArtifacts}
                isOpen={isCanvasOpen}
                onClose={() => setIsCanvasOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
