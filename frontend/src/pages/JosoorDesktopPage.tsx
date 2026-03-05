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
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import type { ConversationSummary, Message as APIMessage } from '../types/api';
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

interface MenuItem { labelEn: string; labelAr: string; view: DesktopView }
interface MenuGroup { labelEn: string; labelAr: string; items: MenuItem[] }

const MENUS: MenuGroup[] = [
  {
    labelEn: 'Oversight', labelAr: 'الإشراف',
    items: [
      { labelEn: 'Observe', labelAr: 'المراقبة', view: 'sector-desk' },
      { labelEn: 'Decide', labelAr: 'القرارات', view: 'enterprise-desk' },
      { labelEn: 'Deliver', labelAr: 'التنفيذ', view: 'planning-desk' },
    ],
  },
  {
    labelEn: 'Manage', labelAr: 'الإدارة',
    items: [
      { labelEn: 'Reporting', labelAr: 'التقارير', view: 'reporting-desk' },
      { labelEn: 'Signals', labelAr: 'الإشارات', view: 'explorer' },
    ],
  },
  {
    labelEn: 'Refer', labelAr: 'المرجع',
    items: [
      { labelEn: 'Tutorials', labelAr: 'الدروس', view: 'knowledge' },
      { labelEn: 'Expert Chat', labelAr: 'محادثة الخبير', view: 'chat' },
    ],
  },
  {
    labelEn: 'Admin', labelAr: 'الإدارة',
    items: [
      { labelEn: 'Settings', labelAr: 'الإعدادات', view: 'settings' },
      { labelEn: 'Observability', labelAr: 'المراقبة', view: 'observability' },
    ],
  },
];

const TOOLBAR_VIEWS = new Set<DesktopView>([
  'sector-desk', 'enterprise-desk', 'planning-desk', 'explorer', 'reporting-desk', 'chat',
]);

// ── Component ──
export default function JosoorDesktopPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const navigate = useNavigate();

  // View state
  const [activeView, setActiveView] = useState<DesktopView>('home');
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

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
          title: c.title || (isAr ? 'محادثة جديدة' : 'New Chat'),
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
        title: c.title || (isAr ? 'محادثة جديدة' : 'New Chat'),
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
      setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: isAr ? 'خطأ في الحصول على الرد' : 'Error getting response', created_at: new Date().toISOString() }]);
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

  // ── Menu item click ──
  const handleMenuItemClick = useCallback((view: DesktopView) => {
    setActiveView(view);
    setOpenMenu(null);
  }, []);

  const showToolbar = TOOLBAR_VIEWS.has(activeView);
  const isChatView = activeView === 'chat';

  return (
    <div className="jdp-viewport" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="jdp-window">
        {/* ── Title Bar ── */}
        <div className="jdp-titlebar">
          <div className="jdp-traffic-lights">
            <span className="jdp-traffic-dot jdp-dot-close" />
            <span className="jdp-traffic-dot jdp-dot-minimize" />
            <span className="jdp-traffic-dot jdp-dot-maximize" />
          </div>
          <div className="jdp-titlebar-center">Josoor</div>
          <div className="jdp-titlebar-actions">
            {/* Print / Save / Export */}
            <button className="jdp-action-btn" title={isAr ? 'طباعة' : 'Print'} onClick={() => window.print()}>
              🖨️
            </button>
            <button className="jdp-action-btn" title={isAr ? 'حفظ' : 'Save'}>
              💾
            </button>
            <button className="jdp-action-btn" title={isAr ? 'تصدير' : 'Export'}>
              📥
            </button>
            <div className="jdp-titlebar-divider" />
            <ThemeToggle />
            <LanguageToggle />
            <div className="jdp-titlebar-divider" />
            {/* Profile */}
            <div style={{ position: 'relative' }}>
              <button className="jdp-profile-trigger" onClick={() => setProfileOpen(!profileOpen)}>
                <span className="jdp-profile-avatar">
                  {currentUser?.user_metadata?.full_name?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || '?'}
                </span>
                <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser?.user_metadata?.full_name || currentUser?.email || (isAr ? 'ضيف' : 'Guest')}
                </span>
              </button>
              {profileOpen && (
                <>
                  <div className="jdp-menu-overlay" onClick={() => setProfileOpen(false)} />
                  <div className="jdp-profile-dropdown">
                    {currentUser && (
                      <div className="jdp-profile-info">
                        <p className="jdp-profile-info-name">{currentUser?.user_metadata?.full_name || (isAr ? 'الحساب' : 'Account')}</p>
                        <p className="jdp-profile-info-email">{currentUser?.email}</p>
                      </div>
                    )}
                    <button className="jdp-dropdown-item" onClick={() => { setProfileOpen(false); }}>
                      👤 {isAr ? 'الملف الشخصي' : 'Profile'}
                    </button>
                    <button className="jdp-dropdown-item" onClick={() => { setProfileOpen(false); setActiveView('settings' as DesktopView); }}>
                      ⚙️ {isAr ? 'الإعدادات' : 'Settings'}
                    </button>
                    <div className="jdp-dropdown-sep" />
                    <button className="jdp-dropdown-item" style={{ color: '#ef4444' }} onClick={async () => {
                      try { await authService.logout(); } catch {}
                      setCurrentUser(null);
                      setProfileOpen(false);
                      navigate('/landing');
                    }}>
                      🚪 {isAr ? 'تسجيل الخروج' : 'Logout'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Menu Bar ── */}
        <div className="jdp-menubar">
          {/* App name (bold) — goes to Home */}
          <button
            className={`jdp-menu-trigger jdp-menu-bold ${activeView === 'home' ? 'jdp-menu-active' : ''}`}
            onClick={() => { setActiveView('home'); setOpenMenu(null); }}
          >
            Josoor
          </button>

          {MENUS.map((menu, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <button
                className={`jdp-menu-trigger ${openMenu === idx ? 'jdp-menu-active' : ''}`}
                onClick={() => setOpenMenu(openMenu === idx ? null : idx)}
                onMouseEnter={() => { if (openMenu !== null) setOpenMenu(idx); }}
              >
                {isAr ? menu.labelAr : menu.labelEn} ▾
              </button>
              {openMenu === idx && (
                <div className="jdp-dropdown">
                  {menu.items.map((item) => (
                    <button
                      key={item.view}
                      className={`jdp-dropdown-item ${activeView === item.view ? 'jdp-item-active' : ''}`}
                      onClick={() => handleMenuItemClick(item.view)}
                    >
                      {isAr ? item.labelAr : item.labelEn}
                    </button>
                  ))}
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
            {isAr ? 'الرئيسية' : 'Home'}
          </button>
        </div>

        {/* Menu overlay to close dropdowns */}
        {openMenu !== null && <div className="jdp-menu-overlay" onClick={closeMenu} />}

        {/* ── Toolbar (conditional) ── */}
        {showToolbar && (
          <div className="jdp-toolbar">
            <label>{isAr ? 'السنة' : 'Year'}</label>
            <select value={year} onChange={e => setYear(e.target.value)}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <label>{isAr ? 'الربع' : 'Quarter'}</label>
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
                <span>{isAr ? 'المحادثات' : 'Chats'}</span>
                <button className="jdp-new-chat-btn" onClick={handleNewChat}>
                  {isAr ? '+ جديد' : '+ New'}
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
              /* Chat mode — render ChatContainer directly */
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
                title={isAr ? 'محادثة الخبير' : 'Expert Chat'}
                subtitle=""
                selectedPersona={selectedPersona}
                onPersonaChange={setSelectedPersona}
                isPersonaLocked={isPersonaLocked}
                selectedTools={selectedTools}
                onToolsChange={setSelectedTools}
              />
            ) : (
              /* Desk mode — render the active view */
              <Suspense fallback={<div className="jdp-loading">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>}>
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
                    <div className="jdp-loading">{isAr ? 'الإعدادات (قريباً)' : 'Settings (Coming Soon)'}</div>
                  )}
                  {activeView === 'observability' && (
                    <div className="jdp-loading">{isAr ? 'المراقبة (قريباً)' : 'Observability (Coming Soon)'}</div>
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
