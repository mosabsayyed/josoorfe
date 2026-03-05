/**
 * JosoorDesktopPage — Full OS-style desktop experience
 * Route: /josoor-desktop
 * Features: Desktop icons, draggable/resizable windows, dock, minimize/maximize/close
 */
import React, { useState, useCallback, useRef, useEffect, Suspense, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { graphService } from '../services/graphService';
import { ChatContainer } from '../components/chat';
import { CanvasManager } from '../components/chat/CanvasManager';
import { chatService } from '../services/chatService';
import { fetchChainCached } from '../services/chainsService';
import * as authService from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';
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
const SettingsDesk = React.lazy(() => import('../app/josoor/views/admin/Settings'));
const ObservabilityDesk = React.lazy(() => import('../app/josoor/views/admin/ObservabilityDashboard'));
const CalendarDesk = React.lazy(() => import('../components/desks/CalendarDesk').then(m => ({ default: m.CalendarDesk })));

// ── Boot sequence chains to preload ──
const PRELOAD_CHAINS = [
  'sector_value_chain',
  'capability_to_performance',
  'capability_to_policy',
  'setting_strategic_initiatives',
];

const MemoizedCanvasManager = memo(CanvasManager);

// ── App definitions ──
interface AppDef {
  id: string;
  labelEn: string;
  labelAr: string;
  icon: string; // path or emoji
  iconType: 'img' | 'emoji';
  color: string; // gradient background for emoji icons
  defaultWidth: number;
  defaultHeight: number;
}

const APPS: AppDef[] = [
  { id: 'observe', labelEn: 'Observe', labelAr: 'المراقبة', icon: '/icons/dbgraph.png', iconType: 'img', color: '', defaultWidth: 1000, defaultHeight: 700 },
  { id: 'decide', labelEn: 'Decide', labelAr: 'القرارات', icon: '/icons/approach.png', iconType: 'img', color: '', defaultWidth: 1000, defaultHeight: 700 },
  { id: 'deliver', labelEn: 'Deliver', labelAr: 'التنفيذ', icon: '/icons/architecture.png', iconType: 'img', color: '', defaultWidth: 1000, defaultHeight: 700 },
  { id: 'reporting', labelEn: 'Reporting', labelAr: 'التقارير', icon: '/icons/reports.png', iconType: 'img', color: '', defaultWidth: 1000, defaultHeight: 700 },
  { id: 'signals', labelEn: 'Signals', labelAr: 'الإشارات', icon: '/icons/twin.png', iconType: 'img', color: '', defaultWidth: 1000, defaultHeight: 700 },
  { id: 'chat', labelEn: 'Expert Chat', labelAr: 'محادثة الخبير', icon: '/icons/expertchat.png', iconType: 'img', color: '', defaultWidth: 900, defaultHeight: 650 },
  { id: 'tutorials', labelEn: 'Tutorials', labelAr: 'الدروس', icon: '/icons/demo.png', iconType: 'img', color: '', defaultWidth: 900, defaultHeight: 650 },
  { id: 'home', labelEn: 'Ontology', labelAr: 'الأنطولوجيا', icon: '/icons/agenticAI.png', iconType: 'img', color: '', defaultWidth: 1000, defaultHeight: 700 },
  { id: 'settings', labelEn: 'Settings', labelAr: 'الإعدادات', icon: '/icons/adminsetting.png', iconType: 'img', color: '', defaultWidth: 600, defaultHeight: 500 },
  { id: 'observability', labelEn: 'Observability', labelAr: 'المراقبة', icon: '/icons/observability.png', iconType: 'img', color: '', defaultWidth: 1000, defaultHeight: 700 },
  { id: 'calendar', labelEn: 'Calendar', labelAr: 'التقويم', icon: '📅', iconType: 'emoji', color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', defaultWidth: 520, defaultHeight: 500 },
];

// ── Window state ──
interface WindowState {
  id: string;
  appId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  prevBounds?: { x: number; y: number; width: number; height: number };
}

let nextZIndex = 100;
let windowCounter = 0;

function getStaggeredPosition(idx: number): { x: number; y: number } {
  const baseX = 80 + (idx % 8) * 30;
  const baseY = 60 + (idx % 8) * 30;
  return { x: baseX, y: baseY };
}

// ── Component ──
export default function JosoorDesktopPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [windows, setWindows] = useState<WindowState[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  // Temporal controls (shared across apps)
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

  // Clock
  const [clock, setClock] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [isAr]);

  // ── Boot sequence ──
  const [isBooting, setIsBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [bootProgress, setBootProgress] = useState(0);

  useEffect(() => {
    if (!isBooting) return;
    let cancelled = false;

    const addLine = (line: string) => {
      if (cancelled) return;
      setBootLines(prev => [...prev, line]);
    };

    const run = async () => {
      addLine('[BIOS] JosoorOS v3.4.0 — Industrial Intelligence Platform');
      addLine('[BIOS] Initializing kernel modules...');
      await new Promise(r => setTimeout(r, 300));

      addLine('[SYS]  Loading display drivers... OK');
      addLine('[SYS]  Mounting secure filesystem... OK');
      await new Promise(r => setTimeout(r, 200));
      if (cancelled) return;
      setBootProgress(15);

      addLine('[NET]  Establishing API gateway connection...');
      await new Promise(r => setTimeout(r, 250));
      addLine('[NET]  Connected to betaBE.aitwintech.com ✓');
      if (cancelled) return;
      setBootProgress(25);

      addLine('[AUTH] Verifying session credentials...');
      await new Promise(r => setTimeout(r, 200));
      const isGuest = authService.isGuestMode();
      addLine(`[AUTH] Mode: ${isGuest ? 'Guest' : 'Authenticated'} ✓`);
      if (cancelled) return;
      setBootProgress(35);

      addLine('[DATA] Pre-loading chain knowledge graph data...');
      await new Promise(r => setTimeout(r, 150));

      // Preload chains in parallel
      const chainResults = await Promise.allSettled(
        PRELOAD_CHAINS.map(async (chain) => {
          addLine(`[DATA]   ↳ ${chain}...`);
          try {
            const data = await fetchChainCached(chain, 0);
            addLine(`[DATA]   ✓ ${chain} — ${data.nodes.length} nodes, ${data.relationships.length} rels`);
            return { chain, ok: true, nodes: data.nodes.length };
          } catch {
            addLine(`[DATA]   ✗ ${chain} — offline (will retry on demand)`);
            return { chain, ok: false, nodes: 0 };
          }
        })
      );
      if (cancelled) return;
      setBootProgress(70);

      const loaded = chainResults.filter(r => r.status === 'fulfilled' && (r.value as any).ok).length;
      addLine(`[DATA] Chain cache ready: ${loaded}/${PRELOAD_CHAINS.length} chains loaded`);
      await new Promise(r => setTimeout(r, 200));

      addLine('[GPU]  Initializing visualization engine... OK');
      if (cancelled) return;
      setBootProgress(85);
      await new Promise(r => setTimeout(r, 200));

      addLine('[MCP]  MCP router endpoints configured ✓');
      addLine('[I18N] Language pack loaded: ' + (isAr ? 'Arabic (ar)' : 'English (en)'));
      if (cancelled) return;
      setBootProgress(95);
      await new Promise(r => setTimeout(r, 200));

      addLine('');
      addLine('[READY] All systems operational. Welcome to JosoorOS.');
      if (cancelled) return;
      setBootProgress(100);
      await new Promise(r => setTimeout(r, 600));

      if (!cancelled) setIsBooting(false);
    };

    run();
    return () => { cancelled = true; };
  }, [isBooting, isAr]);

  // ── Chat logic ──
  const loadConversations = useCallback(async () => {
    try {
      const isGuest = authService.isGuestMode();
      const token = authService.getToken();
      if (isGuest || !token) {
        const guestConvos = authService.getGuestConversations();
        setConversations((guestConvos || []).map((c: any) => ({
          id: c.id, title: c.title || (isAr ? 'محادثة جديدة' : 'New Chat'),
          message_count: (c.messages || []).length,
          created_at: c.created_at || new Date().toISOString(),
          updated_at: c.updated_at || new Date().toISOString(), _isGuest: true,
        })) as any);
        return;
      }
      const data = await chatService.getConversations();
      setConversations((data.conversations || []).map((c: any) => ({
        ...c, title: c.title || (isAr ? 'محادثة جديدة' : 'New Chat'),
        message_count: Array.isArray(c.messages) ? c.messages.length : (c.message_count || 0),
        created_at: c.created_at || new Date().toISOString(),
        updated_at: c.updated_at || new Date().toISOString(),
      })));
    } catch (err) { console.error('[JOS] loadConversations error:', err); }
  }, [isAr]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

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

  const handleSendMessage = useCallback(async (messageText: string) => {
    const tempMsg: APIMessage = { id: Date.now(), role: 'user', content: messageText, created_at: new Date().toISOString(), metadata: {} };
    setMessages(prev => [...prev, tempMsg]);
    setIsLoading(true);
    try {
      const toolSuffix = selectedTools.length > 0 ? `\n\nTools: ${selectedTools.join(', ')}. Use them if relevant.` : '';
      const response = await chatService.sendMessage({
        query: messageText + toolSuffix,
        conversation_id: activeConversationId && activeConversationId > 0 ? activeConversationId : undefined,
        ...(selectedPersona && { prompt_key: selectedPersona }), language,
      });
      if (selectedPersona && !isPersonaLocked) setIsPersonaLocked(true);
      const answer = response.llm_payload?.answer || response.message || response.answer || '';
      const assistantMsg: APIMessage = { id: Date.now() + 1, role: 'assistant', content: answer, created_at: new Date().toISOString(), metadata: response };
      setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), { ...tempMsg, id: Date.now() - 1 }, assistantMsg]);
      if (response.conversation_id) setActiveConversationId(response.conversation_id);
      loadConversations();
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: isAr ? 'خطأ في الحصول على الرد' : 'Error getting response', created_at: new Date().toISOString() }]);
    } finally { setIsLoading(false); }
  }, [activeConversationId, selectedTools, selectedPersona, isPersonaLocked, loadConversations, language, isAr]);

  const handleOpenArtifact = useCallback((artifact: any) => { setCanvasArtifacts([artifact]); setIsCanvasOpen(true); }, []);

  useEffect(() => { setSelectedPersona(null); setIsPersonaLocked(false); setSelectedTools(['recall_memory', 'recall_vision_memory']); }, [activeConversationId]);

  // ── Window Management ──
  const openApp = useCallback((appId: string) => {
    // If window for this app already exists, focus it
    setWindows(prev => {
      const existing = prev.find(w => w.appId === appId && !w.isMinimized);
      if (existing) {
        const z = ++nextZIndex;
        setFocusedWindowId(existing.id);
        return prev.map(w => w.id === existing.id ? { ...w, zIndex: z } : w);
      }
      // If minimized, restore it
      const minimized = prev.find(w => w.appId === appId && w.isMinimized);
      if (minimized) {
        const z = ++nextZIndex;
        setFocusedWindowId(minimized.id);
        return prev.map(w => w.id === minimized.id ? { ...w, isMinimized: false, zIndex: z } : w);
      }
      // Open new window
      const app = APPS.find(a => a.id === appId);
      if (!app) return prev;
      const pos = getStaggeredPosition(windowCounter++);
      const z = ++nextZIndex;
      const id = `win-${appId}-${Date.now()}`;
      setFocusedWindowId(id);
      return [...prev, {
        id, appId, x: pos.x, y: pos.y,
        width: app.defaultWidth, height: app.defaultHeight,
        zIndex: z, isMinimized: false, isMaximized: false,
      }];
    });
    setSelectedIcon(null);
  }, []);

  const handleIntervene = useCallback((ctx: InterventionContext) => { setInterventionContext(ctx); openApp('deliver'); }, [openApp]);

  const closeWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
    setFocusedWindowId(prev => prev === windowId ? null : prev);
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w => w.id === windowId ? { ...w, isMinimized: true } : w));
    setFocusedWindowId(prev => prev === windowId ? null : prev);
  }, []);

  const maximizeWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w => {
      if (w.id !== windowId) return w;
      if (w.isMaximized) {
        // Restore
        return { ...w, isMaximized: false, ...(w.prevBounds || {}) };
      }
      // Maximize
      return {
        ...w, isMaximized: true,
        prevBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
        x: 0, y: 28, // Below top bar
        width: window.innerWidth,
        height: window.innerHeight - 28 - 70, // Leave room for dock
      };
    }));
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    const z = ++nextZIndex;
    setFocusedWindowId(windowId);
    setWindows(prev => prev.map(w => w.id === windowId ? { ...w, zIndex: z } : w));
  }, []);

  // Click on desktop background clears selection
  const handleDesktopClick = useCallback(() => {
    setSelectedIcon(null);
  }, []);

  // Double click on icon
  const handleIconDoubleClick = useCallback((appId: string) => {
    openApp(appId);
  }, [openApp]);

  // ── Render app content inside a window ──
  const renderAppContent = useCallback((appId: string) => {
    switch (appId) {
      case 'home':
        return <OntologyHome />;
      case 'observe':
        return (
          <SectorDesk
            year={year} quarter={quarter}
            onNavigateToCapability={() => openApp('decide')}
            onContinueInChat={(id: number) => { setActiveConversationId(id); openApp('chat'); }}
          />
        );
      case 'decide':
        return (
          <EnterpriseDesk
            year={year} quarter={quarter}
            onIntervene={handleIntervene}
            onContinueInChat={(id: number) => { setActiveConversationId(id); openApp('chat'); }}
          />
        );
      case 'deliver':
        return (
          <PlanningDesk
            interventionContext={interventionContext}
            onClearContext={() => setInterventionContext(null)}
          />
        );
      case 'reporting':
        return <ReportingDesk />;
      case 'signals':
        return <ExplorerDesk year={year} quarter={quarter} />;
      case 'tutorials':
        return <TutorialsDesk />;
      case 'chat':
        return (
          <div style={{ display: 'flex', height: '100%' }}>
            {/* Chat sidebar */}
            <div style={{
              width: 200, flexShrink: 0,
              borderInlineEnd: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(13,17,23,0.5)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              <div style={{
                padding: '10px 12px', fontSize: 12, fontWeight: 600,
                color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>{isAr ? 'المحادثات' : 'Chats'}</span>
                <button onClick={() => { setActiveConversationId(null); setMessages([]); }} style={{
                  background: '#388bfd', color: '#fff', border: 'none', borderRadius: 4,
                  padding: '2px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 600,
                }}>{isAr ? '+ جديد' : '+ New'}</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                {conversations.map(c => (
                  <button key={c.id} onClick={() => setActiveConversationId(c.id)} style={{
                    display: 'block', width: '100%', padding: '8px 12px',
                    background: activeConversationId === c.id ? 'rgba(56,139,253,0.15)' : 'transparent',
                    border: 'none', color: activeConversationId === c.id ? '#58a6ff' : '#e6edf3',
                    fontSize: 12, textAlign: 'start', cursor: 'pointer',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'inherit',
                  }}>{c.title}</button>
                ))}
              </div>
            </div>
            {/* Chat main */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                year={year} quarter={quarter}
                availableYears={availableYears}
                onYearChange={setYear} onQuarterChange={setQuarter}
                title={isAr ? 'محادثة الخبير' : 'Expert Chat'}
                subtitle=""
                selectedPersona={selectedPersona}
                onPersonaChange={setSelectedPersona}
                isPersonaLocked={isPersonaLocked}
                selectedTools={selectedTools}
                onToolsChange={setSelectedTools}
              />
            </div>
          </div>
        );
      case 'settings':
        return <SettingsDesk />;
      case 'observability':
        return <ObservabilityDesk />;
      case 'calendar':
        return (
          <CalendarDesk
            year={year}
            quarter={quarter}
            availableYears={availableYears}
            onYearChange={setYear}
            onQuarterChange={setQuarter}
          />
        );
      default:
        return null;
    }
  }, [year, quarter, isAr, handleIntervene, interventionContext, openApp, conversations, activeConversationId, messages, handleSendMessage, isLoading, language, isCanvasOpen, streamingMessage, handleOpenArtifact, availableYears, selectedPersona, isPersonaLocked, selectedTools]);

  // ── Boot screen ──
  if (isBooting) {
    return (
      <div className="jos-desktop jos-boot-screen" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="jos-boot-logo-bg">
          <img src="/icons/josoor.png" alt="" className="jos-boot-logo-img" />
        </div>
        <div className="jos-boot-content">
          <div className="jos-boot-terminal">
            {bootLines.map((line, i) => (
              <div key={i} className={`jos-boot-line ${line === '' ? 'jos-boot-line-empty' : ''} ${line.includes('✓') || line.includes('OK') ? 'jos-boot-line-ok' : ''} ${line.includes('✗') ? 'jos-boot-line-err' : ''} ${line.includes('[READY]') ? 'jos-boot-line-ready' : ''}`}>
                {line}
              </div>
            ))}
            <span className="jos-boot-cursor">_</span>
          </div>
          <div className="jos-boot-progress-bar">
            <div className="jos-boot-progress-fill" style={{ width: `${bootProgress}%` }} />
          </div>
          <div className="jos-boot-progress-label">{bootProgress}%</div>
        </div>
      </div>
    );
  }

  return (
    <div className="jos-desktop" dir={isAr ? 'rtl' : 'ltr'} ref={desktopRef}>
      {/* Wallpaper with logo */}
      <div className="jos-wallpaper">
        <img src="/icons/josoor.png" alt="" className="jos-wallpaper-logo" />
      </div>

      {/* Top bar */}
      <div className="jos-topbar">
        <div className="jos-topbar-left">
          <span className="jos-topbar-logo">Josoor</span>
        </div>
        <div className="jos-topbar-right">
          <span>{clock}</span>
        </div>
      </div>

      {/* Desktop icons area */}
      <div className="jos-icon-area" onClick={handleDesktopClick}>
        {APPS.map(app => (
          <div
            key={app.id}
            className={`jos-icon ${selectedIcon === app.id ? 'jos-icon-selected' : ''}`}
            onClick={(e) => { e.stopPropagation(); setSelectedIcon(app.id); }}
            onDoubleClick={() => handleIconDoubleClick(app.id)}
          >
            {app.iconType === 'img' ? (
              <img className="jos-icon-img" src={app.icon} alt={app.labelEn} />
            ) : (
              <div className="jos-icon-svg" style={{ background: app.color }}>{app.icon}</div>
            )}
            <span className="jos-icon-label">{isAr ? app.labelAr : app.labelEn}</span>
          </div>
        ))}
      </div>

      {/* Windows */}
      {windows.map(win => {
        if (win.isMinimized) return null;
        const app = APPS.find(a => a.id === win.appId);
        if (!app) return null;
        return (
          <OSWindow
            key={win.id}
            win={win}
            app={app}
            isAr={isAr}
            isFocused={focusedWindowId === win.id}
            onClose={() => closeWindow(win.id)}
            onMinimize={() => minimizeWindow(win.id)}
            onMaximize={() => maximizeWindow(win.id)}
            onFocus={() => focusWindow(win.id)}
            onMove={(x, y) => setWindows(prev => prev.map(w => w.id === win.id ? { ...w, x, y } : w))}
            onResize={(width, height, x, y) => setWindows(prev => prev.map(w => w.id === win.id ? { ...w, width, height, x: x ?? w.x, y: y ?? w.y } : w))}
          >
            <Suspense fallback={<div className="jos-app-loading"><div className="jos-spinner" />{isAr ? 'جاري التحميل...' : 'Loading...'}</div>}>
              {renderAppContent(win.appId)}
            </Suspense>
          </OSWindow>
        );
      })}

      {/* Dock — only shows running apps */}
      {windows.length > 0 && (
        <div className="jos-dock">
          {windows.map(win => {
            const app = APPS.find(a => a.id === win.appId);
            if (!app) return null;
            return (
              <div key={win.id} className={`jos-dock-item ${focusedWindowId === win.id ? 'jos-dock-item-active' : ''}`} onClick={() => openApp(app.id)}>
                <div className="jos-dock-tooltip">{isAr ? app.labelAr : app.labelEn}</div>
                {app.iconType === 'img' ? (
                  <img className="jos-dock-icon" src={app.icon} alt={app.labelEn} />
                ) : (
                  <div className="jos-dock-icon-svg" style={{ background: app.color }}>{app.icon}</div>
                )}
                <div className={`jos-dock-indicator ${!win.isMinimized ? 'jos-dock-indicator-active' : ''}`} />
              </div>
            );
          })}
        </div>
      )}

      {/* Canvas panel (for chat artifacts) */}
      {isCanvasOpen && (
        <div style={{
          position: 'fixed', right: 0, top: 28, bottom: 0, width: '35%',
          zIndex: 99990, background: 'var(--bg-secondary, #161b22)',
          borderInlineStart: '1px solid rgba(255,255,255,0.1)',
        }}>
          <MemoizedCanvasManager
            artifacts={canvasArtifacts}
            isOpen={isCanvasOpen}
            onClose={() => setIsCanvasOpen(false)}
          />
        </div>
      )}
    </div>
  );
}


// ── OSWindow: Draggable, resizable window component ──
interface OSWindowProps {
  win: WindowState;
  app: AppDef;
  isAr: boolean;
  isFocused: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number, x?: number, y?: number) => void;
  children: React.ReactNode;
}

function OSWindow({ win, app, isAr, isFocused, onClose, onMinimize, onMaximize, onFocus, onMove, onResize, children }: OSWindowProps) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number; origX: number; origY: number; dir: string } | null>(null);

  // Drag
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (win.isMaximized) return;
    e.preventDefault();
    onFocus();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: win.x, origY: win.y };

    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      onMove(dragRef.current.origX + dx, Math.max(28, dragRef.current.origY + dy));
    };
    const handleUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [win.x, win.y, win.isMaximized, onFocus, onMove]);

  // Resize
  const handleResizeStart = useCallback((e: React.MouseEvent, dir: string) => {
    if (win.isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: win.width, origH: win.height, origX: win.x, origY: win.y, dir };

    const handleMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const dx = ev.clientX - resizeRef.current.startX;
      const dy = ev.clientY - resizeRef.current.startY;
      const d = resizeRef.current.dir;
      let newW = resizeRef.current.origW;
      let newH = resizeRef.current.origH;
      let newX: number | undefined;
      let newY: number | undefined;

      if (d.includes('e')) newW = Math.max(400, resizeRef.current.origW + dx);
      if (d.includes('w')) { newW = Math.max(400, resizeRef.current.origW - dx); newX = resizeRef.current.origX + dx; }
      if (d.includes('s')) newH = Math.max(300, resizeRef.current.origH + dy);
      if (d.includes('n')) { newH = Math.max(300, resizeRef.current.origH - dy); newY = Math.max(28, resizeRef.current.origY + dy); }

      onResize(newW, newH, newX, newY);
    };
    const handleUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [win.width, win.height, win.x, win.y, win.isMaximized, onFocus, onResize]);

  return (
    <div
      className={`jos-window ${isFocused ? 'jos-window-focused' : ''} ${win.isMaximized ? 'jos-window-maximized' : ''}`}
      style={{
        left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex,
      }}
      onMouseDown={onFocus}
    >
      {/* Title bar */}
      <div className="jos-window-titlebar" onMouseDown={handleDragStart} onDoubleClick={onMaximize}>
        <div className="jos-window-controls" onMouseDown={e => e.stopPropagation()}>
          <button className="jos-window-dot jos-dot-close" onClick={onClose} title="Close">&times;</button>
          <button className="jos-window-dot jos-dot-minimize" onClick={onMinimize} title="Minimize">&minus;</button>
          <button className="jos-window-dot jos-dot-maximize" onClick={onMaximize} title={win.isMaximized ? 'Restore' : 'Maximize'}>&#9723;</button>
        </div>
        <span className="jos-window-title">
          {app.iconType === 'img' && <img className="jos-window-title-icon" src={app.icon} alt="" />}
          {isAr ? app.labelAr : app.labelEn}
        </span>
        {/* Spacer to balance the traffic lights */}
        <div style={{ width: 52 }} />
      </div>

      {/* Content */}
      <div className="jos-window-body">
        {children}
      </div>

      {/* Resize handles (only when not maximized) */}
      {!win.isMaximized && (
        <>
          <div className="jos-resize-handle jos-resize-n" onMouseDown={e => handleResizeStart(e, 'n')} />
          <div className="jos-resize-handle jos-resize-s" onMouseDown={e => handleResizeStart(e, 's')} />
          <div className="jos-resize-handle jos-resize-e" onMouseDown={e => handleResizeStart(e, 'e')} />
          <div className="jos-resize-handle jos-resize-w" onMouseDown={e => handleResizeStart(e, 'w')} />
          <div className="jos-resize-handle jos-resize-ne" onMouseDown={e => handleResizeStart(e, 'ne')} />
          <div className="jos-resize-handle jos-resize-nw" onMouseDown={e => handleResizeStart(e, 'nw')} />
          <div className="jos-resize-handle jos-resize-se" onMouseDown={e => handleResizeStart(e, 'se')} />
          <div className="jos-resize-handle jos-resize-sw" onMouseDown={e => handleResizeStart(e, 'sw')} />
        </>
      )}
    </div>
  );
}
