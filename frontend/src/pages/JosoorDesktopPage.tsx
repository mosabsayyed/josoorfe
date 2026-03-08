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
import { fetchChainCached, injectChainCache } from '../services/chainsService';
import { fetchSectorGraphData } from '../services/neo4jMcpService';
import * as authService from '../services/authService';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
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
const ObservabilityDesk = React.lazy(() => import('../app/josoor/views/admin/Observability'));
const CalendarDesk = React.lazy(() => import('../components/desks/CalendarDesk').then(m => ({ default: m.CalendarDesk })));

// ── Boot sequence chains to preload ──
const PRELOAD_CHAINS = [
  'sector_value_chain',
  'capability_to_performance',
  'capability_to_policy',
  'change_to_capability',
  'sustainable_operations',
  'setting_strategic_initiatives',
  'setting_strategic_priorities',
];

const MemoizedCanvasManager = memo(CanvasManager);

// ── App definitions ──
interface AppDef {
  id: string;
  i18nKey: string; // key under desktop.* in i18n
  icon: string;
  iconType: 'img' | 'emoji';
  color: string;
  defaultWidth: number;
  defaultHeight: number;
}

// Main apps (top-left grid) — "Start Here" first
const MAIN_APPS: AppDef[] = [
  { id: 'home', i18nKey: 'startHere', icon: '/icons/ontology.svg', iconType: 'img', color: '', defaultWidth: 1000, defaultHeight: 700 },
  { id: 'observe', i18nKey: 'observe', icon: '/icons/observe.svg', iconType: 'img', color: '', defaultWidth: 1000, defaultHeight: 700 },
  { id: 'decide', i18nKey: 'decide', icon: '/icons/decide.svg', iconType: 'img', color: '', defaultWidth: 1000, defaultHeight: 700 },
  { id: 'deliver', i18nKey: 'deliver', icon: '/icons/deliver.svg', iconType: 'img', color: '', defaultWidth: 1000, defaultHeight: 700 },
  { id: 'reporting', i18nKey: 'reporting', icon: '/icons/reporting.svg', iconType: 'img', color: '', defaultWidth: 1000, defaultHeight: 700 },
  { id: 'signals', i18nKey: 'signals', icon: '/icons/signals.svg', iconType: 'img', color: '', defaultWidth: 1000, defaultHeight: 700 },
  { id: 'chat', i18nKey: 'chat', icon: '/icons/chatexpert.svg', iconType: 'img', color: '', defaultWidth: 900, defaultHeight: 650 },
  { id: 'tutorials', i18nKey: 'tutorials', icon: '/icons/tutorial.svg', iconType: 'img', color: '', defaultWidth: 900, defaultHeight: 650 },
  { id: 'folder', i18nKey: 'documents', icon: '/att/ontology/FOLDER.svg', iconType: 'img', color: '', defaultWidth: 700, defaultHeight: 500 },
];

// Utility apps (top-right vertical column)
const UTILITY_APPS: AppDef[] = [
  { id: 'settings', i18nKey: 'settings', icon: '/icons/Setting.svg', iconType: 'img', color: '', defaultWidth: 600, defaultHeight: 500 },
  { id: 'observability', i18nKey: 'observability', icon: '/icons/observability.svg', iconType: 'img', color: '', defaultWidth: 1000, defaultHeight: 700 },
  { id: 'calendar', i18nKey: 'calendar', icon: '/icons/calendar.svg', iconType: 'img', color: '', defaultWidth: 520, defaultHeight: 500 },
];

const APPS: AppDef[] = [...MAIN_APPS, ...UTILITY_APPS];

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
  const { language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const isAr = language === 'ar';

  const [windows, setWindows] = useState<WindowState[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  // Temporal controls (shared across apps) — persist in localStorage
  const [year, setYear] = useState(() => localStorage.getItem('jos-year') || '2026');
  const [quarter, setQuarter] = useState(() => localStorage.getItem('jos-quarter') || 'Q1');

  // Persist year/quarter changes
  useEffect(() => { localStorage.setItem('jos-year', year); }, [year]);
  useEffect(() => { localStorage.setItem('jos-quarter', quarter); }, [quarter]);

  // Restore theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('jos-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      document.documentElement.style.colorScheme = savedTheme;
    }
  }, []);
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
  const [helpMode, setHelpMode] = useState(false);

  // ── Desktop icon positions (draggable) ──
  const ICON_W = 120;
  const ICON_H = 130;
  const PAD_X = 32;
  const PAD_Y = 24;

  const buildDefaultPositions = useCallback(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    // Main apps: grid from top-left, flowing top-to-bottom then left-to-right
    const cols = Math.floor((window.innerWidth - PAD_X * 2 - 200) / ICON_W); // reserve space for utility column
    MAIN_APPS.forEach((app, i) => {
      const col = Math.floor(i / Math.max(1, Math.floor((window.innerHeight - 58 - PAD_Y * 2) / ICON_H)));
      const row = i % Math.max(1, Math.floor((window.innerHeight - 58 - PAD_Y * 2) / ICON_H));
      positions[app.id] = { x: PAD_X + col * ICON_W, y: PAD_Y + row * ICON_H };
    });
    // Utility apps: top-right, vertical stack
    const rightX = window.innerWidth - PAD_X - ICON_W;
    UTILITY_APPS.forEach((app, i) => {
      positions[app.id] = { x: rightX, y: PAD_Y + i * ICON_H };
    });
    return positions;
  }, []);

  const [iconPositions, setIconPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    try {
      const saved = localStorage.getItem('jos-icon-positions');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return buildDefaultPositions();
  });

  // Persist icon positions
  useEffect(() => {
    localStorage.setItem('jos-icon-positions', JSON.stringify(iconPositions));
  }, [iconPositions]);

  const handleIconDragStart = useCallback((e: React.MouseEvent, appId: string) => {
    e.preventDefault();
    const pos = iconPositions[appId] || { x: 0, y: 0 };
    const startX = e.clientX;
    const startY = e.clientY;
    let dragging = false;

    const handleMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      // Dead-zone: only start dragging after 5px movement
      if (!dragging && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      dragging = true;
      const newX = Math.max(0, Math.min(window.innerWidth - ICON_W, pos.x + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 58 - ICON_H, pos.y + dy));
      setIconPositions(prev => ({ ...prev, [appId]: { x: newX, y: newY } }));
    };
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [iconPositions]);

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

  // Close profile menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Taskbar actions (print/save target the focused window) ──
  const handlePrint = useCallback(() => {
    if (!focusedWindowId) return;
    const el = document.querySelector(`[data-window-id="${focusedWindowId}"]`) as HTMLElement;
    if (!el) return;
    // Mark this window for print isolation
    el.classList.add('jos-print-target');
    document.body.classList.add('jos-printing');
    window.print();
    el.classList.remove('jos-print-target');
    document.body.classList.remove('jos-printing');
  }, [focusedWindowId]);

  // Save PDF — uses browser print dialog (user picks "Save as PDF")
  // This handles full content, nested scrolls, pagination natively
  const handleExportPDF = handlePrint;

  const handleLogout = useCallback(async () => {
    setShowProfileMenu(false);
    try { await logout(); } catch { }
    window.location.href = '/landing';
  }, [logout]);

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

      // Preload RiskPlan relation via direct Cypher
      try {
        addLine('[DATA]   ↳ risk_plans (HAS_PLAN)...');
        const mcpRes = await fetch('/1/mcp/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: Date.now(), method: 'tools/call',
            params: { name: 'read_neo4j_cypher', arguments: {
              cypher_query: `MATCH (r:EntityRisk)-[:HAS_PLAN]->(p:RiskPlan) RETURN r.id AS risk_id, r.name AS risk_name, r.status AS risk_status, r.build_band AS risk_build_band, r.operate_band AS risk_operate_band, p.id AS plan_id, p.name AS plan_name, p.status AS plan_status, p.sponsor AS plan_sponsor LIMIT 5000`
            }}
          }),
        });
        if (mcpRes.ok) {
          const text = await mcpRes.text();
          let parsed: any;
          try { parsed = JSON.parse(text); } catch {
            const dataLine = text.split('\n').find((l: string) => l.startsWith('data: '));
            parsed = dataLine ? JSON.parse(dataLine.substring(6)) : null;
          }
          const rows = parsed?.result?.content?.[0]?.text ? JSON.parse(parsed.result.content[0].text) : [];
          const nodes: any[] = [];
          const relationships: any[] = [];
          const seenNodes = new Set<string>();
          console.log('[RiskPlan preload] raw rows:', rows.length, 'sample:', rows[0]);
          for (const row of (Array.isArray(rows) ? rows : [])) {
            const riskId = row.risk_id || '';
            const planId = row.plan_id || '';
            if (riskId && !seenNodes.has(`risk:${riskId}`)) {
              seenNodes.add(`risk:${riskId}`);
              nodes.push({ id: riskId, labels: ['EntityRisk'], properties: { domain_id: riskId, name: row.risk_name, status: row.risk_status, build_band: row.risk_build_band, operate_band: row.risk_operate_band } });
            }
            if (planId && !seenNodes.has(`plan:${planId}`)) {
              seenNodes.add(`plan:${planId}`);
              nodes.push({ id: planId, labels: ['RiskPlan'], properties: { domain_id: planId, name: row.plan_name, status: row.plan_status, progress: row.plan_progress, sponsor: row.plan_sponsor } });
            }
            if (riskId && planId) {
              relationships.push({ start: riskId, end: planId, type: 'HAS_PLAN' });
            }
          }
          injectChainCache('risk_plans', { nodes, relationships });
          addLine(`[DATA]   ✓ risk_plans — ${nodes.length} nodes, ${relationships.length} rels`);
        }
      } catch (e: any) {
        addLine(`[DATA]   ✗ risk_plans — ${e.message || 'offline'}`);
      }

      // Preload Sector Desk data (2 Cypher + 3 chains → cached)
      try {
        addLine('[DATA]   ↳ sector_graph_data...');
        const sectorResult = await fetchSectorGraphData();
        addLine(`[DATA]   ✓ sector_graph — ${sectorResult.nodes.length} nodes`);
      } catch (e: any) {
        addLine(`[DATA]   ✗ sector_graph — ${e.message || 'offline'}`);
      }

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
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight - 58, // Leave room for bottom taskbar
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
        return <OntologyHome helpMode={helpMode} onHelpToggle={() => setHelpMode(prev => !prev)} onContinueInChat={(id: number) => { setActiveConversationId(id); openApp('chat'); }} year={year} quarter={quarter} />;
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
      case 'folder':
        return (
          <div style={{ padding: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignContent: 'flex-start' }}>
            {[
              { name: isAr ? 'تقرير الأداء' : 'Performance Report', icon: '/att/ontology/REPORT.svg' },
              { name: isAr ? 'تقرير المخاطر' : 'Risk Report', icon: '/att/ontology/REPORT.svg' },
              { name: isAr ? 'تقرير القدرات' : 'Capability Report', icon: '/att/ontology/REPORT.svg' },
              { name: isAr ? 'تقرير المشاريع' : 'Projects Report', icon: '/att/ontology/REPORT.svg' },
              { name: isAr ? 'تقرير الامتثال' : 'Compliance Report', icon: '/att/ontology/REPORT.svg' },
            ].map(file => (
              <div key={file.name} style={{ width: 90, textAlign: 'center', cursor: 'pointer' }}>
                <img src={file.icon} alt="" style={{ width: 48, height: 48, opacity: 0.9 }} />
                <div style={{ fontSize: 11, color: '#e6edf3', marginTop: 4, wordBreak: 'break-word' }}>{file.name}</div>
              </div>
            ))}
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
      <div className="jos-desktop jos-boot-screen" dir="ltr">
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

      {/* (Taskbar is rendered at bottom) */}

      {/* Desktop icons area */}
      <div className="jos-icon-area" onClick={handleDesktopClick}>
        {APPS.map(app => {
          const pos = iconPositions[app.id] || { x: 0, y: 0 };
          return (
            <div
              key={app.id}
              className={`jos-icon ${selectedIcon === app.id ? 'jos-icon-selected' : ''}`}
              style={{ position: 'absolute', left: pos.x, top: pos.y }}
              onClick={(e) => { e.stopPropagation(); setSelectedIcon(app.id); }}
              onDoubleClick={() => handleIconDoubleClick(app.id)}
              onMouseDown={(e) => handleIconDragStart(e, app.id)}
            >
              {app.iconType === 'img' ? (
                <img className="jos-icon-img" src={app.icon} alt={t(`josoor.desktop.${app.i18nKey}`)} />
              ) : (
                <div className="jos-icon-svg" style={{ background: app.color }}>{app.icon}</div>
              )}
              <span className="jos-icon-label">{t(`josoor.desktop.${app.i18nKey}`)}</span>
            </div>
          );
        })}
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
            helpMode={helpMode}
            onHelpToggle={() => setHelpMode(prev => !prev)}
          >
            <Suspense fallback={<div className="jos-app-loading"><div className="jos-spinner" />{isAr ? 'جاري التحميل...' : 'Loading...'}</div>}>
              {renderAppContent(win.appId)}
            </Suspense>
          </OSWindow>
        );
      })}

      {/* Bottom taskbar (Windows-style) */}
      <div className="jos-taskbar">
        {/* Left: Actions */}
        <div className="jos-taskbar-left">
          <button className="jos-taskbar-action" onClick={handlePrint} title={isAr ? 'طباعة' : 'Print'}><img className="jos-taskbar-action-icon" src="/icons/print.svg" alt="Print" /></button>
          <button className="jos-taskbar-action" onClick={handleExportPDF} title={isAr ? 'حفظ PDF' : 'Save PDF'}><img className="jos-taskbar-action-icon" src="/icons/save.svg" alt="Save" /></button>
          <span className="jos-taskbar-sep" />
          <button
            className="jos-taskbar-action jos-taskbar-lang"
            onClick={() => setLanguage(isAr ? 'en' : 'ar')}
            title={isAr ? 'English' : 'العربية'}
          >{isAr ? 'EN' : 'ع'}</button>
          <button
            className="jos-taskbar-action"
            onClick={() => {
              const root = document.documentElement;
              const current = root.getAttribute('data-theme');
              const next = current === 'light' ? 'dark' : 'light';
              root.setAttribute('data-theme', next);
              root.style.colorScheme = next;
              localStorage.setItem('jos-theme', next);
            }}
            title={isAr ? 'تبديل السمة' : 'Toggle Theme'}
          >🌓</button>
        </div>

        {/* Center: Running apps */}
        <div className="jos-taskbar-apps">
          {windows.map(win => {
            const app = APPS.find(a => a.id === win.appId);
            if (!app) return null;
            return (
              <button
                key={win.id}
                className={`jos-taskbar-app ${focusedWindowId === win.id ? 'jos-taskbar-app-active' : ''} ${win.isMinimized ? 'jos-taskbar-app-minimized' : ''}`}
                onClick={() => openApp(app.id)}
                title={t(`josoor.desktop.${app.i18nKey}`)}
              >
                {app.iconType === 'img' ? (
                  <img className="jos-taskbar-app-icon" src={app.icon} alt="" />
                ) : (
                  <span className="jos-taskbar-app-emoji">{app.icon}</span>
                )}
                <span className="jos-taskbar-app-label">{t(`josoor.desktop.${app.i18nKey}`)}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Brand, temporal, clock, profile */}
        <div className="jos-taskbar-right">
          <span className="jos-taskbar-brand">{isAr ? 'جسور' : 'Josoor'}</span>
          <span className="jos-taskbar-sep" />
          <span className="jos-taskbar-temporal" onClick={() => openApp('calendar')}>
            {year} · {quarter}
          </span>
          <span className="jos-taskbar-sep" />
          <span className="jos-taskbar-clock">{clock}</span>
          <div className="jos-taskbar-profile-wrap" ref={profileMenuRef}>
            <button
              className="jos-taskbar-profile-btn"
              onClick={() => setShowProfileMenu(p => !p)}
            >
              <span className="jos-taskbar-avatar">
                {(user?.email || 'G')[0].toUpperCase()}
              </span>
            </button>
            {showProfileMenu && (
              <div className="jos-taskbar-profile-menu">
                <div className="jos-taskbar-profile-email">
                  {user?.email || (isAr ? 'ضيف' : 'Guest')}
                </div>
                <div className="jos-taskbar-profile-divider" />
                <button className="jos-taskbar-profile-item" onClick={() => { setShowProfileMenu(false); openApp('settings'); }}>
                  {isAr ? 'الإعدادات' : 'Settings'}
                </button>
                <button className="jos-taskbar-profile-item jos-taskbar-profile-logout" onClick={handleLogout}>
                  {isAr ? 'تسجيل الخروج' : 'Log Out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
  titleBarExtra?: React.ReactNode;
  helpMode?: boolean;
  onHelpToggle?: () => void;
}

function OSWindow({ win, app, isAr, isFocused, onClose, onMinimize, onMaximize, onFocus, onMove, onResize, children, titleBarExtra, helpMode, onHelpToggle }: OSWindowProps) {
  const { t } = useTranslation();
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
      onMove(dragRef.current.origX + dx, Math.max(0, dragRef.current.origY + dy));
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
      if (d.includes('n')) { newH = Math.max(300, resizeRef.current.origH - dy); newY = Math.max(0, resizeRef.current.origY + dy); }

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
      data-window-id={win.id}
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
          {t(`josoor.desktop.${app.i18nKey}`)}
        </span>
        {/* Extra title bar buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }} onMouseDown={e => e.stopPropagation()}>
          {titleBarExtra}
          <button
            className={`jos-help-btn ${helpMode ? 'jos-help-btn--active' : ''}`}
            onClick={onHelpToggle}
            title={isAr ? 'مساعدة' : 'Help'}
          >
            ?
          </button>
        </div>
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
