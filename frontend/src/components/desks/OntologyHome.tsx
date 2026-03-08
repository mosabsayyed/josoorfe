import './OntologyHome.css';
import { Fragment, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchOntologyRagState, type OntologyRagState, type NodeInstance, type LoadingStep, type LineHealthDetail, type UpstreamRedSource, type LinkedNode, COLUMN_NARRATIVES_AR } from '../../services/ontologyService';
import { chatService } from '../../services/chatService';
import StrategyReportModal from './sector/StrategyReportModal';
import type { Artifact } from '../../types/api';

/*
 * SST Ontology Architecture Diagram
 * Visual layer: landscape.svg (5850×3378) as background + ALLCONN.svg lines inline
 * RAG layer: colored diamond overlays on node top faces + animated connection lines
 */

// SVG coordinate space — old coordinates (5850×3378) mapped via viewBox to new cropped landscape (5838×2581)
// Offset: old content at (15,800) → new content at (3,3), shift = (12, 797)
const VW = 5838;
const VH = 2581;
const VB_X = 12;  // viewBox x offset (maps old coords to new landscape)
const VB_Y = 797; // viewBox y offset

type RagStatus = 'green' | 'amber' | 'red' | 'default';

type LineAnnotation = {
  top?: { en: string; ar: string };
  bottom?: { en: string; ar: string };
  mx: number;
  my: number;
  dx?: number;
  topDy?: number;
  bottomDy?: number;
};

// Node positions in the 5850×3378 coordinate space
// Extracted from landscape.svg rect elements (actual building image positions)
const NODE_POS: Record<string, { x: number; y: number; w: number; h: number }> = {
  sectorObjectives: { x: 244,     y: 1992,  w: 477,  h: 441 },
  policyTools:      { x: 1399,    y: 1206,  w: 477,  h: 441 },
  adminRecords:     { x: 1493,    y: 1663,  w: 288,  h: 197 },
  dataTransactions: { x: 1495,    y: 2672,  w: 288,  h: 197 },
  performance:      { x: 1401,    y: 2890,  w: 477,  h: 441 },
  risks:            { x: 2556,    y: 1936,  w: 476,  h: 439 },
  riskPlans:        { x: 2916,    y: 2654,  w: 202,  h: 170 },
  cultureHealth:    { x: 3883,    y: 1233,  w: 201,  h: 170 },
  capabilities:     { x: 3508,    y: 1936,  w: 476,  h: 439 },
  orgUnits:         { x: 4314,    y: 1513,  w: 239,  h: 194 },
  processes:        { x: 4332,    y: 2019,  w: 239,  h: 194 },
  itSystems:        { x: 4328,    y: 2543,  w: 239,  h: 194 },
  vendors:          { x: 3883,    y: 2965,  w: 202,  h: 170 },
  projects:         { x: 5190,    y: 1945,  w: 477,  h: 441 },
  changeAdoption:   { x: 5510,    y: 2653,  w: 202,  h: 171 },
};

// Which nodes are clickable (have drill-down data)
const CLICKABLE_NODES = new Set(['sectorObjectives', 'policyTools', 'performance', 'risks', 'capabilities', 'orgUnits', 'processes', 'itSystems', 'projects', 'riskPlans', 'cultureHealth', 'vendors', 'changeAdoption', 'adminRecords', 'dataTransactions']);

// Canonical relation diagnostics per visual leg.
// Placements are manually offset from the line midpoint to avoid overlapping
// the line itself, the landscape artwork, and node shapes.
const LINE_LABELS: Record<string, LineAnnotation> = {
  'capabilities->orgUnits':       { top: { en: 'ROLE_GAPS', ar: 'فجوات الأدوار' }, bottom: { en: 'OPERATES', ar: 'تُشغّل' }, mx: 4030, my: 1637, topDy: -50, bottomDy: 22 },
  'capabilities->processes':      { top: { en: 'KNOWLEDGE_GAPS', ar: 'فجوات المعرفة' }, bottom: { en: 'OPERATES', ar: 'تُشغّل' }, mx: 4085, my: 2148, topDy: -50, bottomDy: 22 },
  'capabilities->itSystems':      { top: { en: 'AUTOMATION_GAPS', ar: 'فجوات الأتمتة' }, bottom: { en: 'OPERATES', ar: 'يُشغّل' }, mx: 4030, my: 2679, topDy: -50, bottomDy: 22 },
  'capabilities->risks':          { top: { en: 'MONITORED_BY', ar: 'مراقب بواسطة' }, mx: 3267, my: 2120, topDy: -26 },
  'itSystems->projects':          { top: { en: 'GAPS_SCOPE', ar: 'نطاق الفجوات' }, bottom: { en: 'CLOSE_GAPS', ar: 'سد الفجوات' }, mx: 5040, my: 2679, topDy: -50, bottomDy: 22 },
  'itSystems->vendors':           { top: { en: 'DEPENDS_ON', ar: 'يعتمد على' }, mx: 4280, my: 3093, topDy: -30 },
  'orgUnits->projects':           { top: { en: 'GAPS_SCOPE', ar: 'نطاق الفجوات' }, bottom: { en: 'CLOSE_GAPS', ar: 'سد الفجوات' }, mx: 5040, my: 1637, topDy: -50, bottomDy: 22 },
  'orgUnits->processes':          { top: { en: 'APPLY', ar: 'تطبيق' }, mx: 4434, my: 1952, topDy: -26 },
  'policyTools->adminRecords':    { top: { en: 'REFERS_TO', ar: 'يشير إلى' }, bottom: { en: 'APPLIED_ON', ar: 'مطبق على' }, mx: 1560, my: 1630, dx: -158, topDy: -16, bottomDy: 165 },

  'risks->policyTools':           { top: { en: 'INFORMS', ar: 'يُبلغ' }, mx: 2317, my: 1357, topDy: -26 },
  'projects->changeAdoption':     { top: { en: 'ADOPTION_RISKS', ar: 'مخاطر التبني' }, bottom: { en: 'INCREASE_ADOPTION', ar: 'زيادة التبني' }, mx: 5607, my: 2497, dx: -158, topDy: -50, bottomDy: 22 },
  'processes->projects':          { top: { en: 'GAPS_SCOPE', ar: 'نطاق الفجوات' }, bottom: { en: 'CLOSE_GAPS', ar: 'سد الفجوات' }, mx: 4900, my: 2148, topDy: -50, bottomDy: 22 },
  'sectorObjectives->performance':{ top: { en: 'CASCADED_VIA', ar: 'يتدرج عبر' }, bottom: { en: 'AGGREGATES_TO', ar: 'يتجمع إلى' }, mx: 965, my: 3294, topDy: -50, bottomDy: 22 },
  'sectorObjectives->policyTools':{ top: { en: 'REALIZED_VIA', ar: 'يتحقق عبر' }, bottom: { en: 'GOVERNED_BY', ar: 'محكوم بواسطة' }, mx: 915, my: 1242, topDy: -50, bottomDy: 22 },
  'adminRecords->dataTransactions':{ top: { en: 'TRIGGERS_EVENT', ar: 'ينشئ حدث' }, mx: 1635, my: 2670, dx: -200, topDy: -22 },
  'dataTransactions->performance':{ top: { en: 'MEASURED_BY', ar: 'يقاس بواسطة' }, mx: 1635, my: 2884, dx: -200, topDy: -18 },
  'risks->performance':           { top: { en: 'INFORMS', ar: 'يُبلغ' }, mx: 2317, my: 3056, topDy: -18 },
  'policyTools->capabilities':    { top: { en: 'SETS_PRIORITIES', ar: 'يحدد الأولويات' }, mx: 2800, my: 1208, topDy: -26 },
  'performance->capabilities':    { top: { en: 'SETS_TARGETS', ar: 'يحدد المستهدفات' }, mx: 2800, my: 3280, topDy: -26 },
  'cultureHealth->orgUnits':      { top: { en: 'MONITORS_FOR', ar: 'يراقب' }, mx: 4270, my: 1378, topDy: -28 },
  'processes->itSystems':         { top: { en: 'AUTOMATION', ar: 'أتمتة' }, mx: 4434, my: 2474, topDy: -18 },
  'risks->riskPlans':             { top: { en: 'HAS_PLAN', ar: 'لديه خطة' }, mx: 3017, my: 2560, dx: -120, topDy: -18 },
};

// Node label map for side panel
const NODE_LABELS: Record<string, { en: string; ar: string }> = {
  sectorObjectives: { en: 'Sector Objectives',    ar: 'الأهداف القطاعية' },
  policyTools:      { en: 'Policy Execution Tools',ar: 'أدوات تنفيذ السياسات' },
  adminRecords:     { en: 'Admin Records',         ar: 'السجلات الإدارية' },
  dataTransactions: { en: 'Data Transactions',     ar: 'المعاملات البيانية' },
  performance:      { en: 'Performance',           ar: 'الأداء' },
  risks:            { en: 'Risks',                 ar: 'المخاطر' },
  riskPlans:        { en: 'Risk Plans',            ar: 'خطط المخاطر' },
  cultureHealth:    { en: 'Culture Health',        ar: 'صحة الثقافة' },
  capabilities:     { en: 'Capabilities',          ar: 'القدرات المؤسسية' },
  orgUnits:         { en: 'Org Units',             ar: 'الوحدات التنظيمية' },
  processes:        { en: 'Processes',             ar: 'العمليات' },
  itSystems:        { en: 'IT Systems',            ar: 'أنظمة تقنية المعلومات' },
  vendors:          { en: 'Vendors',               ar: 'الموردون' },
  projects:         { en: 'Projects',              ar: 'المشاريع' },
  changeAdoption:   { en: 'Change Adoption',       ar: 'تبني التغيير' },
};


interface OntologyHomeProps {
  onContinueInChat?: (conversationId: number) => void;
  helpMode?: boolean;
  onHelpToggle?: () => void;
  year?: number | string;
  quarter?: string;
}

export default function OntologyHome({ onContinueInChat, helpMode: helpModeProp, onHelpToggle, year, quarter }: OntologyHomeProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const rtl = lang === 'ar';

  const [ragState, setRagState] = useState<OntologyRagState | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [selectedLine, setSelectedLine] = useState<{ from: string; to: string } | null>(null);
  const [tracePath, setTracePath] = useState<string[]>([]); // drill-down trace stack

  // AI integration state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiHtml, setAiHtml] = useState('');
  const [aiArtifacts, setAiArtifacts] = useState<Artifact[]>([]);
  const [aiConversationId, setAiConversationId] = useState<number | null>(null);
  const [aiTitle, setAiTitle] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [microHelpModeInternal, setMicroHelpModeInternal] = useState(false);
  const microHelpMode = helpModeProp ?? microHelpModeInternal;
  const setMicroHelpMode = onHelpToggle ?? (() => setMicroHelpModeInternal(prev => !prev));
  const [microAnswer, setMicroAnswer] = useState<{ text: string; title: string; scope: 'landscape' | 'block1' | 'item' } | null>(null);

  // Escape key exits micro help mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (microAnswer) { setMicroAnswer(null); return; }
        if (microHelpMode) { if (onHelpToggle) onHelpToggle(); else setMicroHelpModeInternal(false); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [microHelpMode, onHelpToggle]);

  useEffect(() => {
    setRagState(null);
    setSelectedNode(null);
    fetchOntologyRagState(setLoadingSteps)
      .then(state => {
        setRagState(state);
        // Keep tracker visible briefly so user sees final state
        setTimeout(() => setLoadingSteps([]), 1500);
      })
      .catch(err => {
        console.error('[OntologyHome] RAG fetch failed:', err);
        // Don't clear steps — show the error state
      });
  }, [year, quarter]);

  // ── AI Query Builders ──
  const buildExecutiveQuery = useCallback((): string => {
    if (!ragState) return '';
    const ar = lang === 'ar';
    const strip = ragState.stripData || [];
    const period = `${year || 2026} Q${quarter || '1'}`;
    const lines: string[] = [
      ar ? `لوحة المعلومات القطاعية — نظرة عامة` : `SECTOR DASHBOARD — OVERVIEW`,
      ar ? `الفترة: ${period}` : `Period: ${period}`,
      ``,
      ar ? `ملخص الحالة حسب المجال:` : `STATUS SUMMARY BY DOMAIN:`,
    ];
    for (const s of strip) {
      const colName = COLUMN_TITLES[s.column]?.[lang] ?? s.column;
      lines.push(ar
        ? `  ${colName}: ${s.green} على المسار الصحيح | ${s.amber} في خطر | ${s.red} حرج`
        : `  ${colName}: ${s.green} on track | ${s.amber} at risk | ${s.red} critical`);
      if (s.narrative) lines.push(`    ${ar ? 'الملخص' : 'Summary'}: ${s.narrative}`);
    }
    const reds: string[] = [];
    const ambers: string[] = [];
    for (const [nodeType, instances] of Object.entries(ragState.nodeDetails)) {
      const label = NODE_LABELS[nodeType]?.[lang] ?? nodeType;
      for (const inst of instances) {
        const domainId = inst.props.domain_id || inst.id;
        if (inst.rag === 'red' && reds.length < 10) reds.push(`[${domainId}] ${inst.name} (${label})`);
        if (inst.rag === 'amber' && ambers.length < 10) ambers.push(`[${domainId}] ${inst.name} (${label})`);
      }
    }
    lines.push(``, ar ? `بنود حرجة:` : `CRITICAL ITEMS:`, reds.length ? reds.map(r => `  - ${r}`).join('\n') : ar ? '  لا شيء' : '  None');
    lines.push(``, ar ? `بنود في خطر:` : `AT-RISK ITEMS:`, ambers.length ? ambers.map(a => `  - ${a}`).join('\n') : ar ? '  لا شيء' : '  None');
    if (ragState.lineFlowHealth) {
      lines.push(``, ar ? `سلامة سلسلة القيمة:` : `VALUE CHAIN INTEGRITY:`);
      for (const [key, health] of Object.entries(ragState.lineFlowHealth)) {
        lines.push(ar
          ? `  ${key}: ${health.status} (${health.orphans} غير مرتبط، ${health.bastards} روابط مقطوعة)`
          : `  ${key}: ${health.status} (${health.orphans} disconnected, ${health.bastards} broken links)`);
      }
    }
    lines.push(``, ar
      ? `بناءً على هذه البيانات، أعدّ تقريراً تنفيذياً شاملاً عن وضع القطاع: أين تتركز أبرز التعرّضات؟ ما أهم 3 أولويات عاجلة لهذا الربع؟ وما الملخص المناسب لعرضه على الوزير؟`
      : `Based on this data, produce a comprehensive executive report on sector health: where are the biggest exposures? What are the top 3 urgent priorities this quarter? And what is the minister-level summary?`);
    return lines.join('\n');
  }, [ragState, lang, year, quarter]);

  const COLUMN_NODE_MAP: Record<string, string[]> = {
    goals: ['sectorObjectives'],
    sector: ['policyTools', 'adminRecords', 'dataTransactions'],
    health: ['performance', 'risks'],
    capacity: ['capabilities', 'orgUnits', 'processes', 'itSystems'],
    velocity: ['projects', 'changeAdoption', 'cultureHealth', 'vendors'],
  };

  const buildColumnQuery = useCallback((columnKey: string): string => {
    if (!ragState) return '';
    const ar = lang === 'ar';
    const strip = ragState.stripData?.find(s => s.column === columnKey);
    const colName = COLUMN_TITLES[columnKey]?.[lang] ?? columnKey;
    const period = `${year || 2026} Q${quarter || '1'}`;
    const lines: string[] = [
      ar ? `${colName} — تحليل قطاعي` : `${colName.toUpperCase()} — SECTOR ANALYSIS`,
      ar ? `الفترة: ${period}` : `Period: ${period}`,
      ``,
    ];
    if (strip) {
      lines.push(ar ? `توزيع الحالة:` : `STATUS DISTRIBUTION:`);
      lines.push(ar
        ? `  على المسار الصحيح: ${strip.green} | في خطر: ${strip.amber} | حرج: ${strip.red}`
        : `  On Track: ${strip.green} | At Risk: ${strip.amber} | Critical: ${strip.red}`);
      if (strip.narrative) lines.push(`  ${ar ? 'الملخص' : 'Summary'}: ${strip.narrative}`);
    }
    const nodeTypes = COLUMN_NODE_MAP[columnKey] || [];
    const items: string[] = [];
    for (const nt of nodeTypes) {
      const instances = ragState.nodeDetails[nt] || [];
      const label = NODE_LABELS[nt]?.[lang] ?? nt;
      for (const inst of instances) {
        const status = ar
          ? (inst.rag === 'red' ? 'حرج' : inst.rag === 'amber' ? 'في خطر' : 'على المسار الصحيح')
          : (inst.rag === 'red' ? 'CRITICAL' : inst.rag === 'amber' ? 'AT RISK' : 'ON TRACK');
        const domainId = inst.props.domain_id || inst.id;
        items.push(`  - [${domainId}] ${inst.name} (${label}) — ${status}`);
      }
    }
    if (items.length) {
      lines.push(``, ar ? `البنود (${items.length} إجمالي):` : `ITEMS (${items.length} total):`, ...items.slice(0, 30));
      if (items.length > 30) lines.push(ar ? `  ... و ${items.length - 30} أخرى` : `  ... and ${items.length - 30} more`);
    }
    lines.push(``, ar
      ? `بناءً على هذه البيانات، حلّل مجال "${colName}": ما وضعه الحالي؟ ما أبرز التحديات؟ ما التبعيات المؤثرة عليه؟ وما التوصيات القابلة للتنفيذ؟`
      : `Based on this data, analyze "${colName}": what is its current standing? What are the key issues? What dependencies affect it? And what are the actionable recommendations?`);
    return lines.join('\n');
  }, [ragState, lang, year, quarter]);

  const buildMicroQuery = useCallback((target: string, scope: 'landscape' | 'block1' | 'item'): string => {
    if (!ragState) return '';
    const ar = lang === 'ar';
    if (scope === 'landscape') {
      const nodeRag = ragState.nodeRag[target] ?? 'default';
      const count = ragState.nodeDetails[target]?.length ?? 0;
      const instances = ragState.nodeDetails[target] || [];
      const redCount = instances.filter(i => i.rag === 'red').length;
      const amberCount = instances.filter(i => i.rag === 'amber').length;
      const label = NODE_LABELS[target]?.[lang] ?? target;
      return ar
        ? `فئة: ${label} | الحالة: ${nodeRag} | الإجمالي: ${count} | حرج: ${redCount} | في خطر: ${amberCount}`
        : `Category: ${label} | Status: ${nodeRag} | Total: ${count} | Critical: ${redCount} | At Risk: ${amberCount}`;
    }
    if (scope === 'block1') {
      const instances = ragState.nodeDetails[target] || [];
      const top3 = instances.filter(i => i.rag === 'red' || i.rag === 'amber').slice(0, 3);
      const label = NODE_LABELS[target]?.[lang] ?? target;
      const items = top3.map(i => `${i.name}(${i.rag})`).join(', ');
      return ar
        ? `أبرز التحديات في ${label}: ${items}`
        : `Top issues in ${label}: ${items}`;
    }
    // scope === 'item'
    let inst: NodeInstance | undefined;
    for (const insts of Object.values(ragState.nodeDetails)) {
      inst = insts.find(i => i.id === target);
      if (inst) break;
    }
    if (!inst) return ar ? `بند: ${target}` : `Item: ${target}`;
    const upLinks = inst.upstreamNodes.slice(0, 3).map(u => `${u.name}(${u.rag})`).join(', ');
    const downLinks = inst.downstreamNodes.slice(0, 3).map(d => `${d.name}(${d.rag})`).join(', ');
    return ar
      ? `بند: ${inst.name} | المعرّف: ${inst.props.domain_id || inst.id} | الحالة: ${inst.rag} | يعتمد على: ${upLinks || 'لا شيء'} | يؤثر على: ${downLinks || 'لا شيء'}`
      : `Item: ${inst.name} | ID: ${inst.props.domain_id || inst.id} | Status: ${inst.rag} | Depends on: ${upLinks || 'none'} | Affects: ${downLinks || 'none'}`;
  }, [ragState, lang]);

  // Professional column titles (not internal keys)
  const COLUMN_TITLES: Record<string, { en: string; ar: string }> = {
    goals: { en: 'Strategic Goals', ar: 'الأهداف الاستراتيجية' },
    sector: { en: 'Sector Outputs', ar: 'المخرجات القطاعية' },
    health: { en: 'Risk & Compliance', ar: 'المخاطر والامتثال' },
    capacity: { en: 'Organizational Capacity', ar: 'القدرات المؤسسية' },
    velocity: { en: 'Transformation Progress', ar: 'تقدم التحول' },
  };

  const handleOntologyAI = useCallback(async (
    tier: 'executive' | 'column' | 'micro',
    context: string,
    scope?: 'landscape' | 'block1' | 'item'
  ) => {
    const promptKeyMap = { executive: 'ontology_executive' as const, column: 'ontology_column' as const, micro: 'ontology_micro' as const };
    const query = tier === 'executive' ? buildExecutiveQuery()
      : tier === 'column' ? buildColumnQuery(context)
      : buildMicroQuery(context, scope || 'landscape');

    if (!query) return;

    // Exit help mode after a micro click
    if (tier === 'micro') {
      if (onHelpToggle) onHelpToggle(); else setMicroHelpModeInternal(false);
    }

    // Resolve title for micro tooltip
    const microScope = scope || 'landscape';
    let microTitle = '';
    if (tier === 'micro') {
      if (microScope === 'landscape') {
        microTitle = NODE_LABELS[context]?.[lang] ?? context;
      } else if (microScope === 'block1') {
        microTitle = lang === 'ar' ? 'أهم المشكلات' : 'Top Issues';
      } else {
        // single item — find its name
        let itemName = context;
        if (ragState) {
          for (const insts of Object.values(ragState.nodeDetails)) {
            const found = insts.find(i => i.id === context);
            if (found) { itemName = found.name; break; }
          }
        }
        microTitle = itemName;
      }
      setMicroAnswer({ text: lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...', title: microTitle, scope: microScope });
    } else {
      setAiLoading(true);
      const colTitle = COLUMN_TITLES[context]?.[lang] ?? context;
      setAiTitle(tier === 'executive'
        ? (lang === 'ar' ? 'تقرير وضع القطاع' : 'Sector Status Report')
        : colTitle);
      setAiModalOpen(true);
      setAiHtml('');
      setAiArtifacts([]);
    }

    try {
      const response = await chatService.sendMessage({
        query,
        prompt_key: promptKeyMap[tier],
      });

      const answer = response.llm_payload?.answer || response.answer || response.message || '';
      const artifacts = response.llm_payload?.artifacts || response.artifacts || [];

      if (tier === 'micro') {
        const cleanText = answer.replace(/<[^>]+>/g, '');
        setMicroAnswer({ text: cleanText, title: microTitle, scope: microScope });
      } else {
        setAiHtml(answer);
        setAiArtifacts(artifacts);
        if (response.conversation_id) setAiConversationId(response.conversation_id);
      }
    } catch (err: any) {
      const errMsg = `<p style="color:#ef4444">${lang === 'ar' ? 'حدث خطأ' : 'Analysis failed'}: ${err.message || err}</p>`;
      if (tier === 'micro') {
        setMicroAnswer({ text: lang === 'ar' ? 'حدث خطأ' : 'Failed', title: microTitle, scope: microScope });
      } else {
        setAiHtml(errMsg);
      }
    } finally {
      setAiLoading(false);
    }
  }, [buildExecutiveQuery, buildColumnQuery, buildMicroQuery, lang, ragState]);

  const getNodeRag = (key: string): RagStatus => ragState?.nodeRag[key] ?? 'default';

  // Line RAG: precomputed data flow health (orphan node detection)
  const getLineRag = (from: string, to: string): RagStatus => {
    if (!ragState) return 'default';
    return ragState.lineRag[`${from}->${to}`]
      || ragState.lineRag[`${to}->${from}`]
      || 'default';
  };

  const lineClick = (from: string, to: string) => ({
    onClick: () => { setSelectedLine({ from, to }); setSelectedNode(null); },
    style: { cursor: 'pointer' } as React.CSSProperties,
  });

  const getLineOverlayPos = (mx: number, my: number, dx = 0, dy = 0) => {
    const x = (((mx + dx) - VB_X) / VW) * 100;
    const y = (((my + dy) - VB_Y) / VH) * 100;
    const left = rtl ? 100 - x : x;
    return { left: `${left}%`, top: `${y}%` };
  };

  const getNodeBadgePos = (nodeKey: string) => {
    const node = NODE_POS[nodeKey];
    if (!node) return null;

    const isRightHeavy = node.x + node.w / 2 > (VB_X + VW * 0.78);
    const badgeX = node.x + node.w - Math.min(32, node.w * 0.14);
    let badgeY = node.y + Math.min(32, node.h * 0.18);
    if (nodeKey === 'policyTools') badgeY += 200;
    // Move debug pill below the count badge to prevent any horizontal intersection
    return {
      count: getLineOverlayPos(badgeX, badgeY),
      debug: getLineOverlayPos(badgeX, badgeY + 42),
    };
  };

  const getNodeBadgeCount = (nodeKey: string): number => {
    if (!ragState) return 0;
    return ragState.nodeDetails[nodeKey]?.length ?? 0;
  };

  const getNodeDebugText = (nodeKey: string): string | null => {
    if (!ragState) return null;

    let orphanTotal = 0;
    let bastardTotal = 0;
    let hasOutgoing = false;
    let hasIncoming = false;

    for (const detail of Object.values(ragState.lineDetails)) {
      if (detail.from === nodeKey) {
        orphanTotal += detail.orphanCount;
        hasOutgoing = true;
      }
      if (detail.to === nodeKey) {
        bastardTotal += detail.bastardCount;
        hasIncoming = true;
      }
    }

    if (hasOutgoing && hasIncoming) return `O:${orphanTotal} B:${bastardTotal}`;
    if (hasOutgoing) return `O:${orphanTotal}`;
    if (hasIncoming) return `B:${bastardTotal}`;
    return null;
  };

  return (
    <div className="ontology-home" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>

      {/* ── Loading Tracker ── */}
      {loadingSteps.length > 0 && (
        <div className="ont-loading-tracker">
          <div className="ont-loading-title">
            {lang === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}
          </div>
          {loadingSteps.map((step, i) => (
            <div key={i} className={`ont-loading-step ont-loading-step--${step.status}`}>
              <span className="ont-loading-icon">
                {step.status === 'loading' ? '⟳' : step.status === 'done' ? '✓' : '✕'}
              </span>
              <span className="ont-loading-label">{step.label}</span>
              {step.status === 'done' && step.count !== undefined && (
                <span className="ont-loading-count">{step.count} found</span>
              )}
              {step.status === 'error' && (
                <span className="ont-loading-count" style={{ color: 'var(--component-color-danger)' }}>failed</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={`ont-svg-stage ${microHelpMode ? 'ont-help-mode' : ''}`}>

        {/* ── Layer 0: Column Header Strip ── */}
        <div className="ont-header-strip">
          {[
            { key: 'goals',    en: 'Goals',           ar: 'الأهداف',           pct: 15.42, icon: '/att/ontology/header-goals.png' },
            { key: 'sector',   en: 'Sector Outputs',  ar: 'المخرجات القطاعية',  pct: 24.84, icon: '/att/ontology/header-sector-output.png' },
            { key: 'health',   en: 'Health',          ar: 'الصحة',             pct: 14.78, icon: '/att/ontology/header-health.png' },
            { key: 'capacity', en: 'Capacity',        ar: 'القدرات',           pct: 29.17, icon: '/att/ontology/header-capacity.png' },
            { key: 'velocity', en: 'Velocity',        ar: 'سرعة التحول',       pct: 15.79, icon: '/att/ontology/header-velocity.png' },
          ].map((col, i) => (
            <div key={col.key} className="ont-header-col" style={{ flex: `0 0 ${col.pct}%` }}>
              {i > 0 && <span className="ont-header-arrow">{rtl ? '\u2190' : '\u2192'}</span>}
              <img src={col.icon} alt="" style={{ height: 32, marginRight: 6 }} draggable={false} />
              <span className="ont-header-label">{lang === 'ar' ? col.ar : col.en}</span>
            </div>
          ))}
        </div>

        {/* ── Layer 1: KPI Signal Strip (RAG bars with numbers + AI button per column) ── */}
        <div className="ont-strip ont-layer-strip">
          {(ragState?.stripData || []).map(col => {
            const total = col.green + col.amber + col.red;
            return (
              <div key={col.column} className="ont-strip__cell">
                <div className="ont-strip__rag-bar">
                  {total === 0
                    ? <div className="ont-strip__rag-seg ont-strip__rag-seg--empty" style={{ flex: 1 }}><span>—</span></div>
                    : <>
                        {col.green > 0 && <div className="ont-strip__rag-seg ont-strip__rag-seg--green" style={{ flex: col.green }}><span>{col.green}</span></div>}
                        {col.amber > 0 && <div className="ont-strip__rag-seg ont-strip__rag-seg--amber" style={{ flex: col.amber }}><span>{col.amber}</span></div>}
                        {col.red > 0 && <div className="ont-strip__rag-seg ont-strip__rag-seg--red" style={{ flex: col.red }}><span>{col.red}</span></div>}
                      </>
                  }
                </div>
                <button
                  className="ont-ai-strip-btn"
                  onClick={(e) => { e.stopPropagation(); handleOntologyAI('column', col.column); }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 3 }}><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                  {lang === 'ar' ? 'تحليل' : 'Analyze'}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Landscape Container (aspect-ratio wrapper) ── */}
        <div className="ont-landscape-wrap">

        {/* ── Layer 1: Background shapes from Figma export ── */}
        <img
          src={rtl ? '/att/ontology/landscape-ar.svg' : '/att/ontology/landscape-en.svg'}
          className="ont-layer-bg"
          alt="Ontology Architecture Diagram"
          draggable={false}
        />

        {/* ── Layer 2: Connection lines (ALLCONN paths, animated by RAG) ── */}
        <svg
          className="ont-layer-lines"
          viewBox={`${VB_X} ${VB_Y} ${VW} ${VH}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {/* ── ALLCONN connection paths (27 connections from Figma SVG) ── */}

          {/* #1: capabilities → orgUnits (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('capabilities', 'orgUnits')}`} {...lineClick('capabilities', 'orgUnits')}>
            <path d="M3872 2022L3855 2039L3838 2022" />
            <path d="M3854 2037V1645C3854 1640.58 3857.58 1637 3862 1637H4210" />
            <path d="M4193 1654L4210 1637L4193 1620" />
          </g>

          {/* #2: capabilities → processes (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('capabilities', 'processes')}`} {...lineClick('capabilities', 'processes')}>
            <path d="M3977 2165L3960 2148L3977 2131" />
            <path d="M3963 2148H4210" />
            <path d="M4193 2131L4210 2148L4193 2165" />
          </g>

          {/* #3: capabilities → itSystems (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('capabilities', 'itSystems')}`} {...lineClick('capabilities', 'itSystems')}>
            <path d="M3838 2319L3855 2302L3872 2319" />
            <path d="M3854 2305V2671C3854 2675.42 3857.58 2679 3862 2679H4210" />
            <path d="M4193 2662L4210 2679L4193 2696" />
          </g>

          {/* #4: itSystems → projects (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('itSystems', 'projects')}`} {...lineClick('itSystems', 'projects')}>
            <path d="M5408 2377L5425 2360L5442 2377" />
            <path d="M5424 2362V2671C5424 2675.42 5420.42 2679 5416 2679H4661" />
            <path d="M4678 2662L4661 2679L4678 2696" />
          </g>

          {/* #5: orgUnits → projects (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('orgUnits', 'projects')}`} {...lineClick('orgUnits', 'projects')}>
            <path d="M5442 1952L5425 1969L5408 1952" />
            <path d="M5424 1967V1645C5424 1640.58 5420.42 1637 5416 1637H4670" />
            <path d="M4687 1654L4670 1637L4687 1620" />
          </g>

          {/* #8: projects → changeAdoption (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('projects', 'changeAdoption')}`} {...lineClick('projects', 'changeAdoption')}>
            <path d="M5625 2377L5608 2360L5591 2377" />
            <path d="M5607 2362V2633" />
            <path d="M5590 2616L5607 2633L5624 2616" />
          </g>

          {/* #9: processes → projects (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('processes', 'projects')}`} {...lineClick('processes', 'projects')}>
            <path d="M5114 2131L5131 2148L5114 2165" />
            <path d="M5131 2148H4670" />
            <path d="M4687 2131L4670 2148L4687 2165" />
          </g>

          {/* #10: policyTools → adminRecords (dashed, vertical down) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('policyTools', 'adminRecords')}`} {...lineClick('policyTools', 'adminRecords')}>
            <path d="M1633 1844V1932" strokeDasharray="8 8" />
            <path d="M1616 1915L1633 1932L1650 1915" />
            <path d="M1649 1844H1617V1848H1649V1844Z" className="ont-conn-arrow" />
          </g>

          {/* #11: adminRecords → dataTransactions (dashed, vertical down) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('adminRecords', 'dataTransactions')}`} {...lineClick('adminRecords', 'dataTransactions')}>
            <path d="M1634 2569V2654" strokeDasharray="8 8" />
            <path d="M1617 2637L1634 2654L1651 2637" />
            <path d="M1650 2569H1618V2573H1650V2569Z" className="ont-conn-arrow" />
          </g>

          {/* #12: processes → itSystems (solid, vertical) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('processes', 'itSystems')}`} {...lineClick('processes', 'itSystems')}>
            <path d="M4434 2413V2535" />
            <path d="M4417 2518L4434 2535L4451 2518" />
            <path d="M4450 2413H4418V2417H4450V2413Z" className="ont-conn-arrow" />
          </g>

          {/* #13: capabilities → risks (solid, horizontal) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('capabilities', 'risks')}`} {...lineClick('capabilities', 'risks')}>
            <path d="M3488 2148H3046" />
            <path d="M3063 2131L3046 2148L3063 2165" />
            <path d="M3488 2164V2132H3484V2164H3488Z" className="ont-conn-arrow" />
          </g>

          {/* #14: orgUnits → processes (solid, vertical) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('orgUnits', 'processes')}`} {...lineClick('orgUnits', 'processes')}>
            <path d="M4434 1909V1994" />
            <path d="M4417 1977L4434 1994L4451 1977" />
            <path d="M4450 1909H4418V1913H4450V1909Z" className="ont-conn-arrow" />
          </g>

          {/* #15: policyTools → adminRecords (dashed, upper stub) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('policyTools', 'adminRecords')}`} {...lineClick('policyTools', 'adminRecords')}>
            <path d="M1633 1604V1659" strokeDasharray="8 8" />
            <path d="M1616 1642L1633 1659L1650 1642" />
            <path d="M1649 1604H1617V1608H1649V1604Z" className="ont-conn-arrow" />
          </g>

          {/* #16: sectorObjectives → performance (dashed, bottom sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('sectorObjectives', 'performance')}`} {...lineClick('sectorObjectives', 'performance')}>
            <path d="M478 2373V3294C478 3298.42 481.582 3302 486 3302H1451" strokeDasharray="8 8" />
            <path d="M1434 3285L1451 3302L1434 3319" />
            <path d="M462 2373L494 2373L494 2377L462 2377L462 2373Z" className="ont-conn-arrow" />
          </g>

          {/* #18: dataTransactions → performance (solid, vertical) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('dataTransactions', 'performance')}`} {...lineClick('dataTransactions', 'performance')}>
            <path d="M1635 2841V2926" />
            <path d="M1618 2909L1635 2926L1652 2909" />
            <path d="M1651 2841H1619V2845H1651V2841Z" className="ont-conn-arrow" />
          </g>

          {/* #19: sectorObjectives → policyTools (dashed, top sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('sectorObjectives', 'policyTools')}`} {...lineClick('sectorObjectives', 'policyTools')}>
            <path d="M478 2066V1250C478 1245.58 481.582 1242 486 1242H1352" strokeDasharray="8 8" />
            <path d="M1335 1259L1352 1242L1335 1225" />
            <path d="M462 2066L494 2066L494 2062L462 2062L462 2066Z" className="ont-conn-arrow" />
          </g>

          {/* #20: adminRecords → citizen (dashed, right sweep from adminRecords) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('adminRecords', 'dataTransactions')}`} {...lineClick('adminRecords', 'dataTransactions')}>
            <path d="M1781 1760H2029C2033.42 1760 2037 1763.58 2037 1768V1929" strokeDasharray="8 8" />
            <path d="M2020 1912L2037 1929L2054 1912" />
            <path d="M1781 1744L1781 1776L1785 1776L1785 1744L1781 1744Z" className="ont-conn-arrow" />
          </g>

          {/* #21: adminRecords → govEntity (dashed, left sweep from adminRecords) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('adminRecords', 'dataTransactions')}`} {...lineClick('adminRecords', 'dataTransactions')}>
            <path d="M1493 1760H1224C1219.58 1760 1216 1763.58 1216 1768V1925" strokeDasharray="8 8" />
            <path d="M1233 1908L1216 1925L1199 1908" />
            <path d="M1493 1744L1493 1776L1489 1776L1489 1744L1493 1744Z" className="ont-conn-arrow" />
          </g>

          {/* #22: policyTools → dataTransactions (dashed, left sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('policyTools', 'dataTransactions')}`} {...lineClick('policyTools', 'dataTransactions')}>
            <path d="M1216 2586V2749C1216 2753.42 1219.58 2757 1224 2757H1489" strokeDasharray="8 8" />
            <path d="M1472 2740L1489 2757L1472 2774" />
            <path d="M1200 2586L1232 2586L1232 2590L1200 2590L1200 2586Z" className="ont-conn-arrow" />
          </g>

          {/* #23: dataTransactions → performance (dashed, right sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('dataTransactions', 'performance')}`} {...lineClick('dataTransactions', 'performance')}>
            <path d="M2045 2586V2749C2045 2753.42 2041.42 2757 2037 2757H1772" strokeDasharray="8 8" />
            <path d="M1789 2740L1772 2757L1789 2774" />
            <path d="M2061 2586L2029 2586L2029 2590L2061 2590L2061 2586Z" className="ont-conn-arrow" />
          </g>

          {/* #24: risks → policyTools (solid, INFORMS sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('risks', 'policyTools')}`} {...lineClick('risks', 'policyTools')}>
            <path d="M2791 1976V1365C2791 1360.58 2787.42 1357 2783 1357H1843" />
            <path d="M1860 1374L1843 1357L1860 1340" />
            <path d="M2807 1976L2775 1976L2775 1972L2807 1972L2807 1976Z" className="ont-conn-arrow" />
          </g>

          {/* #25: risks → performance (dashed, long sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('risks', 'performance')}`} {...lineClick('risks', 'performance')}>
            <path d="M2791 2362V3048C2791 3052.42 2787.42 3056 2783 3056H1843" strokeDasharray="8 8" />
            <path d="M1860 3039L1843 3056L1860 3073" />
            <path d="M2807 2362L2775 2362L2775 2366L2807 2366L2807 2362Z" className="ont-conn-arrow" />
          </g>

          {/* #26: itSystems → vendors (solid, sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('itSystems', 'vendors')}`} {...lineClick('itSystems', 'vendors')}>
            <path d="M4435 2960V3217C4435 3221.42 4431.42 3225 4427 3225H4123" />
            <path d="M4140 3208L4123 3225L4140 3242" />
            <path d="M4451 2960L4419 2960L4419 2964L4451 2964L4451 2960Z" className="ont-conn-arrow" />
          </g>

          {/* #27: cultureHealth → orgUnits (solid, sweep) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('cultureHealth', 'orgUnits')}`} {...lineClick('cultureHealth', 'orgUnits')}>
            <path d="M4111 1261H4419C4423.42 1261 4427 1264.58 4427 1269V1495" />
            <path d="M4410 1478L4427 1495L4444 1478" />
            <path d="M4111 1245L4111 1277L4115 1277L4115 1245L4111 1245Z" className="ont-conn-arrow" />
          </g>

          {/* #6: policyTools → capabilities (solid) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('policyTools', 'capabilities')}`} {...lineClick('policyTools', 'capabilities')}>
            <path d="M1928 1217L1911 1234L1928 1251" />
            <path d="M1912 1234H3738C3742.42 1234 3746 1237.58 3746 1242V1983" />
            <path d="M3729 1966L3746 1983L3763 1966" />
          </g>

          {/* #7: performance → capabilities (dashed) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('performance', 'capabilities')}`} {...lineClick('performance', 'capabilities')}>
            <path d="M1816 3293L1799 3310L1816 3327" />
            <path d="M1805 3310H3742C3746.42 3310 3750 3306.42 3750 3302V2342" strokeDasharray="8 8" />
            <path d="M3733 2359L3750 2342L3767 2359" />
          </g>

          {/* #28: risks → riskPlans (solid, straight down to riskPlans) */}
          <g className={`ont-conn ont-rel-line--${getLineRag('risks', 'riskPlans')}`} {...lineClick('risks', 'riskPlans')}>
            <path d="M3017 2380V2654" />
            <path d="M3000 2637L3017 2654L3034 2637" />
            <path d="M3033 2380H3001V2384H3033V2380Z" className="ont-conn-arrow" />
          </g>

          {/* RAG overlays per node shape type */}
          {Object.entries(NODE_POS).map(([key, pos]) => {
            const rag = getNodeRag(key);
            const isBuilding = pos.w > 400;
            const isCoin = pos.w < 210;
            const isPlatform = !isBuilding && !isCoin;
            const isAdminPlatform = key === 'adminRecords' || key === 'dataTransactions';

            // Buildings: pre-colored diamond SVGs
            const buildingSrc: Record<string, string> = {
              green: '/att/ontology/rag-green.svg',
              amber: '/att/ontology/rag-yellow.svg',
              red:   '/att/ontology/rag-red.svg',
            };
            // Coins: pre-colored coin SVGs
            const coinSrc: Record<string, string> = {
              green: '/att/ontology/coin-green.svg',
              amber: '/att/ontology/coin-amber.svg',
              red:   '/att/ontology/coin-red.svg',
            };
            // Admin platforms: pre-colored admin SVGs
            const adminSrc: Record<string, string> = {
              green: '/att/ontology/admin-green.svg',
              amber: '/att/ontology/admin-amber.svg',
              red:   '/att/ontology/admin-red.svg',
            };
            // Operations platforms: pre-colored operations SVGs
            const opsSrc: Record<string, string> = {
              green: '/att/ontology/operations-green.svg',
              amber: '/att/ontology/operations-amber.svg',
              red:   '/att/ontology/operations-red.svg',
            };

            // Pick the right image source
            const imgSrc = isBuilding ? buildingSrc[rag]
              : isCoin ? coinSrc[rag]
              : isAdminPlatform ? adminSrc[rag]
              : opsSrc[rag];

            return (
              <g key={key}>
                {/* Buildings (w>400): pre-colored diamond on top face */}
                {isBuilding && imgSrc && (
                  <image
                    href={imgSrc}
                    x={pos.x + pos.w / 2 - 62} y={pos.y + 71}
                    width={124} height={111}
                    className={`ont-node-diamond ont-node-diamond--${rag}`}
                    preserveAspectRatio="xMidYMid meet"
                  />
                )}
                {/* Coins (192×161 SVG): centered in bounding box */}
                {isCoin && imgSrc && (
                  <image
                    href={imgSrc}
                    x={pos.x + (pos.w - 192) / 2} y={pos.y + (pos.h - 161) / 2}
                    width={192} height={161}
                    className={`ont-node-diamond ont-node-diamond--${rag}`}
                    preserveAspectRatio="xMidYMid meet"
                  />
                )}
                {/* Admin platforms: 70% scaled, shifted up */}
                {isPlatform && isAdminPlatform && imgSrc && (() => {
                  const sw = pos.w * 0.7;
                  const sh = pos.h * 0.7;
                  return (
                    <image
                      href={imgSrc}
                      x={pos.x + (pos.w - sw) / 2 - 2} y={pos.y}
                      width={sw} height={sh}
                      className={`ont-node-diamond ont-node-diamond--${rag}`}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  );
                })()}
                {/* Operations platforms: stretch to fill exact landscape rect */}
                {isPlatform && !isAdminPlatform && imgSrc && (
                  <image
                    href={imgSrc}
                    x={pos.x - 7} y={pos.y}
                    width={pos.w + 12} height={pos.h + 12}
                    className={`ont-node-diamond ont-node-diamond--${rag}`}
                    preserveAspectRatio="none"
                  />
                )}
                {/* Click target for drill-down */}
                {CLICKABLE_NODES.has(key) && (
                  <rect
                    x={pos.x} y={pos.y}
                    width={pos.w} height={pos.h}
                    fill="transparent"
                    className={microHelpMode ? 'ont-micro-target' : ''}
                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                    onClick={() => {
                      if (microHelpMode) { handleOntologyAI('micro', key, 'landscape'); return; }
                      setSelectedNode(key); setShowAllIssues(false); setTracePath([]);
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {ragState && Object.entries(LINE_LABELS).map(([key, meta]) => {
          const detail = ragState.lineDetails[key] || ragState.lineDetails[`${key.split('->')[1]}->${key.split('->')[0]}`];
          if (!detail && !key.includes('adminRecords') && !key.includes('dataTransactions')) return null;

          const rag = ragState.lineRag[key] || 'default';
          const topText = meta.top ? (lang === 'ar' ? meta.top.ar : meta.top.en) : null;
          const bottomText = meta.bottom ? (lang === 'ar' ? meta.bottom.ar : meta.bottom.en) : null;
          const dx = meta.dx || 0;
          const className = `ont-line-chip ont-line-chip--${rag}`;

          return (
            <Fragment key={key}>
              {topText && (
                <div
                  className={`${className} ont-line-chip--relation`}
                  style={getLineOverlayPos(meta.mx, meta.my, dx, meta.topDy ?? -28)}
                >
                  {topText}
                </div>
              )}
              {bottomText && (
                <div
                  className={`${className} ont-line-chip--relation ont-line-chip--secondary`}
                  style={getLineOverlayPos(meta.mx, meta.my, dx, meta.bottomDy ?? -2)}
                >
                  {bottomText}
                </div>
              )}
            </Fragment>
          );
        })}

        {ragState && Object.keys(NODE_POS).map((nodeKey) => {
          const badgePos = getNodeBadgePos(nodeKey);
          if (!badgePos) return null;

          const rag = getNodeRag(nodeKey);
          const total = getNodeBadgeCount(nodeKey);

          return (
            <Fragment key={`${nodeKey}-badge`}>
              <div className={`ont-endpoint-badge ont-endpoint-badge--${rag}`} style={badgePos.count}>
                <span className="ont-endpoint-badge__count">{total}</span>
              </div>
            </Fragment>
          );
        })}

        {/* ── Tier 1: AI Report Button ── */}
        {ragState && (
          <button
            className="ont-ai-report-btn"
            onClick={() => handleOntologyAI('executive', '')}
            disabled={aiLoading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
            <span>{lang === 'ar' ? 'تقرير ذكي' : 'AI Report'}</span>
          </button>
        )}

        </div>{/* end ont-landscape-wrap */}

        {/* ── Layer 4: Side Panel ── */}
        {selectedNode && (() => {
          const nodeRag = getNodeRag(selectedNode);
          const nodeLbl = NODE_LABELS[selectedNode]?.[lang as 'en' | 'ar'] ?? selectedNode;
          const instances: NodeInstance[] = ragState?.nodeDetails[selectedNode] || [];
          const ragColors: Record<RagStatus, string> = { red: '#ef4444', amber: '#f59e0b', green: '#22c55e', default: '#64748b' };

          // Triage sort: weighted combination of impact, urgency, and dependencies
          const triageScore = (inst: NodeInstance) =>
            (inst.impact * 0.35) + (inst.urgency * 0.35) + (inst.downstreamNodes.length * 0.3);
          const sortByImpact = (a: NodeInstance, b: NodeInstance) =>
            triageScore(b) - triageScore(a);
          const reds = instances.filter(i => i.rag === 'red').sort(sortByImpact);
          const ambers = instances.filter(i => i.rag === 'amber').sort(sortByImpact);
          const greens = instances.filter(i => i.rag === 'green' || i.rag === 'default');
          const topIssues = [...reds, ...ambers].slice(0, 3);
          const counts = { green: greens.length, amber: ambers.length, red: reds.length, total: instances.length };
          const healthPct = counts.total > 0 ? Math.round((counts.green / counts.total) * 100) : 0;

          // Detect if RAG comes from chain propagation rather than own instances
          const ownWorstRag: RagStatus = counts.red > 0 ? 'red' : counts.amber > 0 ? 'amber' : counts.green > 0 ? 'green' : 'default';
          const isPropagated = nodeRag === 'red' && ownWorstRag !== 'red' || nodeRag === 'amber' && ownWorstRag === 'green';

          // Compute at-risk count for propagated panels
          let propagatedAtRiskCount = 0;
          let propagatedRiskType = '';
          if (isPropagated) {
            const _riskInsts = ragState?.nodeDetails['risks'] || [];
            const _bandKey = selectedNode === 'performance' ? 'operate_band' : 'build_band';
            const _badRiskIds = new Set(_riskInsts
              .filter(r => { const b = (r.props[_bandKey] || '').toLowerCase(); return b === 'red' || b === 'amber'; })
              .map(r => r.id));
            const _thisInsts = ragState?.nodeDetails[selectedNode!] || [];
            propagatedAtRiskCount = _thisInsts.filter(inst =>
              inst.upstreamNodes.some(u => _badRiskIds.has(u.id)) ||
              inst.downstreamNodes.some(d => _badRiskIds.has(d.id))
            ).length;
            propagatedRiskType = selectedNode === 'performance'
              ? (lang === 'ar' ? 'مخاطر تشغيل' : 'operate risks')
              : (lang === 'ar' ? 'مخاطر بناء' : 'build risks');
          }

          // Generate human-readable verdict
          const verdict = (() => {
            if (counts.total === 0) return lang === 'ar' ? 'لا توجد بيانات' : 'No data available';
            if (isPropagated) {
              return lang === 'ar'
                ? `الحالة ناتجة عن ${propagatedRiskType}`
                : `Status caused by ${propagatedRiskType}`;
            }
            if (nodeRag === 'red') return lang === 'ar'
              ? `${counts.red} عنصر يحتاج تدخل فوري من أصل ${counts.total}`
              : `${counts.red} of ${counts.total} need immediate attention`;
            if (nodeRag === 'amber') return lang === 'ar'
              ? `${counts.amber} عنصر في خطر — يحتاج متابعة`
              : `${counts.amber} items at risk — monitor closely`;
            return lang === 'ar'
              ? `${counts.green} من ${counts.total} يعمل بشكل سليم`
              : `${counts.green} of ${counts.total} operating normally`;
          })();

          // Generate "so what" insight
          const insight = (() => {
            if (reds.length === 0) return null;
            const top = reds[0];
            if (top.impact > 0) return lang === 'ar'
              ? `"${top.name}" يؤثر على ${top.impact} مؤشرات أداء — إذا لم يُعالج ستتأثر مخرجات القطاع`
              : `"${top.name}" impacts ${top.impact} downstream KPIs — unresolved, this will cascade across sector outputs`;
            return lang === 'ar'
              ? `"${top.name}" بحاجة لمراجعة عاجلة`
              : `"${top.name}" requires urgent review`;
          })();

          // Human-readable status for each issue
          const getIssueContext = (inst: NodeInstance): string => {
            if (inst.props.execute_status === 'issues') return lang === 'ar' ? 'تشغيل متعطل' : 'Operations disrupted';
            if (inst.props.execute_status === 'at-risk') return lang === 'ar' ? 'أداء متراجع' : 'Performance declining';
            if (inst.props.build_status?.includes('issues')) return lang === 'ar' ? 'تأخر في التنفيذ' : 'Delivery delayed';
            if (inst.props.build_status?.includes('atrisk')) return lang === 'ar' ? 'جدول زمني مهدد' : 'Timeline at risk';
            if (inst.props.actual_value != null && inst.props.target != null) {
              const pct = Math.round((inst.props.actual_value / inst.props.target) * 100);
              return lang === 'ar' ? `${pct}% من المستهدف` : `${pct}% of target`;
            }
            if (inst.props.progress_percentage != null) {
              const pctVal = Math.round(parseFloat(inst.props.progress_percentage) * 100);
              return lang === 'ar' ? `تقدم ${pctVal}%` : `${pctVal}% progress`;
            }
            return inst.rag === 'red' ? (lang === 'ar' ? 'يحتاج تدخل' : 'Needs intervention') : (lang === 'ar' ? 'يحتاج متابعة' : 'Monitor');
          };

          return (
            <div className="ont-panel-overlay">
              <div className="ont-panel-backdrop" onClick={() => setSelectedNode(null)} />
              <div className="ont-panel">
                {/* ── Panel Header ── */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 0 8px 0', marginBottom: 10,
                  borderBottom: '1px solid var(--component-panel-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: ragColors[nodeRag], flexShrink: 0 }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--component-text-primary)' }}>{nodeLbl}</span>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    style={{
                      background: 'var(--component-bg-secondary)', border: '1px solid var(--component-panel-border)',
                      borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--component-text-secondary)', fontSize: 14, cursor: 'pointer', flexShrink: 0,
                    }}
                  >&#x2715;</button>
                </div>

                {/* ── Verdict Banner ── */}
                <div style={{
                  padding: '14px 16px', borderRadius: 10, marginBottom: 16,
                  background: `${ragColors[nodeRag]}12`,
                  borderLeft: `4px solid ${ragColors[nodeRag]}`,
                }}>
                  <div style={{ fontSize: 13, color: 'var(--component-text-primary)', lineHeight: 1.5 }}>
                    {verdict}
                  </div>
                  {isPropagated && (
                    <button
                      onClick={() => setSelectedNode('risks')}
                      style={{ marginTop: 8, background: 'none', border: 'none', color: ragColors[nodeRag], cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0, textDecoration: 'underline' }}
                    >
                      {lang === 'ar' ? 'عرض المخاطر ←' : '→ View Risks'}
                    </button>
                  )}
                </div>

                {/* ── Health Bar ── */}
                {counts.total > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    {isPropagated ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: 'var(--component-text-secondary)' }}>
                          <span>{lang === 'ar' ? 'متأثر' : 'Affected'}</span>
                          <span style={{ fontWeight: 700, color: ragColors[nodeRag] }}>{propagatedAtRiskCount} / {counts.total}</span>
                        </div>
                        <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--component-bg-secondary)' }}>
                          {(counts.total - propagatedAtRiskCount) > 0 && <div style={{ flex: counts.total - propagatedAtRiskCount, background: '#22c55e', transition: 'flex 0.6s' }} />}
                          {propagatedAtRiskCount > 0 && <div style={{ flex: propagatedAtRiskCount, background: ragColors[nodeRag], transition: 'flex 0.6s' }} />}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 3, color: 'var(--component-text-secondary)' }}>
                          <span style={{ color: '#22c55e' }}>{counts.total - propagatedAtRiskCount} {lang === 'ar' ? 'سليم' : 'clear'}</span>
                          <span style={{ color: ragColors[nodeRag] }}>{propagatedAtRiskCount} {lang === 'ar' ? 'متأثر' : 'affected'}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: 'var(--component-text-secondary)' }}>
                          <span>{lang === 'ar' ? 'نسبة السلامة' : 'Health rate'}</span>
                          <span style={{ fontWeight: 700, color: ragColors[nodeRag] }}>{healthPct}%</span>
                        </div>
                        <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--component-bg-secondary)' }}>
                          {counts.green > 0 && <div style={{ flex: counts.green, background: '#22c55e', transition: 'flex 0.6s' }} />}
                          {counts.amber > 0 && <div style={{ flex: counts.amber, background: '#f59e0b', transition: 'flex 0.6s' }} />}
                          {counts.red > 0 && <div style={{ flex: counts.red, background: '#ef4444', transition: 'flex 0.6s' }} />}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 3, color: 'var(--component-text-secondary)' }}>
                          <span>{counts.green} {lang === 'ar' ? 'سليم' : 'healthy'}</span>
                          <span>{counts.amber} {lang === 'ar' ? 'تحت المراقبة' : 'watch'}</span>
                          <span>{counts.red} {lang === 'ar' ? 'حرج' : 'critical'}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── Key Insight ── */}
                {insight && (
                  <div style={{
                    padding: '10px 12px', borderRadius: 8, marginBottom: 16,
                    background: 'var(--component-bg-secondary)',
                    fontSize: 12, lineHeight: 1.6, color: 'var(--component-text-primary)',
                    fontStyle: 'italic',
                  }}>
                    {insight}
                  </div>
                )}

                {/* ── Block 1: Top Issues (standardized for ALL node types) ── */}
                {(() => {
                  const allIssues = [...reds, ...ambers];
                  if (allIssues.length === 0) return null;
                  const top3 = allIssues.slice(0, 3);
                  const rest = allIssues.slice(3);

                  // Get upstream/downstream connections that are red/amber for any item
                  const getUpstreamIssues = (inst: NodeInstance): LinkedNode[] =>
                    [...inst.upstreamNodes, ...inst.downstreamNodes].filter(n => n.rag === 'red' || n.rag === 'amber');

                  const sectionLabel = isPropagated
                    ? (selectedNode === 'performance'
                        ? (lang === 'ar' ? 'عناصر متأثرة بمخاطر التشغيل' : 'Items affected by operate risks')
                        : (lang === 'ar' ? 'عناصر متأثرة بمخاطر البناء' : 'Items affected by build risks'))
                    : (lang === 'ar' ? 'قائمة الأولويات' : 'Priority List');

                  const renderStandardItem = (inst: NodeInstance, idx: number) => {
                    const upstream = getUpstreamIssues(inst);
                    return (
                      <div key={inst.id} data-micro-target="item" data-micro-id={inst.id} className={microHelpMode ? 'ont-micro-target' : ''} onClick={(e) => { if (microHelpMode) { e.stopPropagation(); handleOntologyAI('micro', inst.id, 'item'); } }} style={{
                        padding: '10px 12px', borderRadius: 8,
                        background: `${ragColors[inst.rag]}08`,
                        border: `1px solid ${ragColors[inst.rag]}30`,
                        cursor: microHelpMode ? 'help' : undefined,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                            background: `${ragColors[inst.rag]}20`, color: ragColors[inst.rag],
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700,
                          }}>
                            {idx + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--component-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {inst.name}
                            </div>
                            {inst.props.domain_id && (
                              <div style={{ fontSize: 10, color: 'var(--component-text-secondary)', fontFamily: 'monospace' }}>{inst.props.domain_id}</div>
                            )}
                            <div style={{ fontSize: 11, color: ragColors[inst.rag], marginTop: 2 }}>
                              {getIssueContext(inst)}
                            </div>
                          </div>
                        </div>
                        {upstream.length > 0 && (
                          <div style={{ marginTop: 6, paddingLeft: 32 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-secondary)', marginBottom: 3 }}>
                              {lang === 'ar' ? 'متأثر بـ' : 'Affected by'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {upstream.slice(0, 3).map(n => {
                                const nTypeLbl = NODE_LABELS[n.nodeType]?.[lang as 'en' | 'ar'] ?? n.nodeType;
                                return (
                                  <div key={n.id} style={{ fontSize: 10, color: ragColors[n.rag], display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: ragColors[n.rag], flexShrink: 0 }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</span>
                                    <span style={{ color: 'var(--component-text-secondary)', fontSize: 9, flexShrink: 0 }}>({nTypeLbl})</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div data-micro-target="block1" className={microHelpMode ? 'ont-micro-target' : ''} onClick={() => { if (microHelpMode) { handleOntologyAI('micro', selectedNode, 'block1'); } }} style={{ marginBottom: 16, cursor: microHelpMode ? 'help' : undefined }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{sectionLabel} ({allIssues.length})</span>
                        <button
                          className="ont-ai-strip-btn"
                          style={{ fontSize: 9, padding: '2px 6px' }}
                          onClick={(e) => { e.stopPropagation(); handleOntologyAI('micro', selectedNode, 'block1'); }}
                          disabled={aiLoading}
                          title={lang === 'ar' ? 'تحليل أهم الأولويات' : 'Analyze top priorities'}
                        >✦ {lang === 'ar' ? 'تحليل' : 'Analyze'}</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {top3.map((inst, i) => renderStandardItem(inst, i))}
                      </div>
                      {rest.length > 0 && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowAllIssues(!showAllIssues); }}
                            style={{ width: '100%', marginTop: 8, padding: '6px 0', border: 'none', cursor: 'pointer', background: 'none', fontSize: 11, fontWeight: 600, color: 'var(--component-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                          >
                            <span style={{ transform: showAllIssues ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
                            {showAllIssues ? (lang === 'ar' ? 'إخفاء' : 'Hide') : (lang === 'ar' ? `+${rest.length} عناصر أخرى` : `+${rest.length} more items`)}
                          </button>
                          {showAllIssues && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 250, overflowY: 'auto' }}>
                              {rest.map((inst, i) => renderStandardItem(inst, i + 3))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}
                {selectedNode === 'risks' && ragState?.riskStats && (() => {
                  const rs = ragState.riskStats;
                  const sections = [
                    { key: 'build', label: lang === 'ar' ? 'مخاطر البناء' : 'Build Risks', r: rs.buildRed, a: rs.buildAmber, g: rs.buildGreen },
                    { key: 'operate', label: lang === 'ar' ? 'مخاطر التشغيل' : 'Operate Risks', r: rs.operateRed, a: rs.operateAmber, g: rs.operateGreen },
                  ];
                  return (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      {sections.map(s => {
                        const total = s.r + s.a + s.g;
                        const worst = s.r > 0 ? '#ef4444' : s.a > 0 ? '#f59e0b' : '#22c55e';
                        return (
                          <div key={s.key} style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: 'var(--component-bg-secondary)', borderTop: `3px solid ${worst}` }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--component-text-primary)', marginBottom: 6 }}>{s.label}</div>
                            {total > 0 ? (
                              <>
                                <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                                  {s.g > 0 && <div style={{ flex: s.g, background: '#22c55e' }} />}
                                  {s.a > 0 && <div style={{ flex: s.a, background: '#f59e0b' }} />}
                                  {s.r > 0 && <div style={{ flex: s.r, background: '#ef4444' }} />}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--component-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: '#22c55e' }}>{s.g}</span>
                                  <span style={{ color: '#f59e0b' }}>{s.a}</span>
                                  <span style={{ color: '#ef4444' }}>{s.r}</span>
                                </div>
                              </>
                            ) : (
                              <div style={{ fontSize: 10, color: 'var(--component-text-secondary)' }}>{lang === 'ar' ? 'لا بيانات' : 'No data'}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* ── Block 2: All Items (scrollable) ── */}
                {instances.length > 0 && (
                  <div data-micro-target="block2" style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-secondary)', marginBottom: 8 }}>
                      {lang === 'ar' ? `جميع العناصر (${instances.length})` : `All Items (${instances.length})`}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
                      {instances.map(inst => (
                        <div
                          key={inst.id}
                          data-micro-target="item"
                          data-micro-id={inst.id}
                          className={microHelpMode ? 'ont-micro-target' : ''}
                          onClick={() => { if (microHelpMode) { handleOntologyAI('micro', inst.id, 'item'); } }}
                          style={{
                            padding: '6px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6,
                            background: `${ragColors[inst.rag]}08`,
                            border: `1px solid ${ragColors[inst.rag]}15`,
                            cursor: microHelpMode ? 'help' : undefined,
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ragColors[inst.rag], flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--component-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {inst.name}
                          </span>
                          {inst.props.domain_id && (
                            <span style={{ fontSize: 9, color: 'var(--component-text-secondary)', fontFamily: 'monospace', flexShrink: 0 }}>
                              {inst.props.domain_id}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Summary Stats ── */}
                {counts.total > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    {[
                      { n: counts.total, label: lang === 'ar' ? 'إجمالي' : 'Total', color: 'var(--component-text-primary)' },
                      { n: counts.green, label: lang === 'ar' ? 'سليم' : 'OK', color: '#22c55e' },
                      { n: counts.red + counts.amber, label: lang === 'ar' ? 'يحتاج اهتمام' : 'Attention', color: '#ef4444' },
                    ].map(s => (
                      <div key={s.label} style={{
                        flex: 1, padding: '8px 4px', borderRadius: 8, textAlign: 'center',
                        background: 'var(--component-bg-secondary)',
                      }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.n}</div>
                        <div style={{ fontSize: 10, color: 'var(--component-text-secondary)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── CTA Buttons ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button style={{
                    width: '100%', padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: ragColors[nodeRag], color: '#fff', fontSize: 13, fontWeight: 600,
                    fontFamily: 'var(--component-font-family)',
                  }}>
                    {lang === 'ar' ? 'عرض في مكتب المؤسسة' : 'Investigate in Enterprise Desk'}
                  </button>
                  <button style={{
                    width: '100%', padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
                    background: 'transparent', color: ragColors[nodeRag], fontSize: 13, fontWeight: 600,
                    border: `1px solid ${ragColors[nodeRag]}40`,
                    fontFamily: 'var(--component-font-family)',
                  }}>
                    {lang === 'ar' ? 'استشر المستشار الذكي' : 'Ask AI Advisor'}
                  </button>
                </div>

                {instances.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--component-text-secondary)', textAlign: 'center', padding: 20 }}>
                    {lang === 'ar' ? 'لا توجد بيانات لهذا العنصر' : 'No data available for this node'}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Layer 5: Line Health Panel ── */}
        {selectedLine && (() => {
          const key = `${selectedLine.from}->${selectedLine.to}`;
          const detail: LineHealthDetail | undefined =
            ragState?.lineDetails[key] || ragState?.lineDetails[`${selectedLine.to}->${selectedLine.from}`];
          if (!detail) return null;


          const fromLbl = NODE_LABELS[selectedLine.from]?.[lang as 'en' | 'ar'] ?? selectedLine.from;
          const toLbl = NODE_LABELS[selectedLine.to]?.[lang as 'en' | 'ar'] ?? selectedLine.to;
          const ragColors: Record<RagStatus, string> = { red: '#ef4444', amber: '#f59e0b', green: '#22c55e', default: '#64748b' };
          const healthPct = Math.round(detail.connectivity * 100);
          const brokenTotal = detail.orphanCount + detail.bastardCount;
          const total = detail.fromTotal + detail.toTotal;

          const renderNodeRow = (n: { id: string; name: string }) => (
            <div key={n.id} style={{
              padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8,
              background: '#ef444415', border: '1px solid #ef444430', borderRadius: 6, marginBottom: 4,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--component-text-primary)', flexShrink: 0 }}>{n.id}</span>
              <span style={{ fontSize: 13, color: 'var(--component-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</span>
            </div>
          );

          return (
            <div className="ont-panel-overlay">
              <div className="ont-panel-backdrop" onClick={() => setSelectedLine(null)} />
              <div className="ont-panel">
                <button
                  onClick={() => setSelectedLine(null)}
                  style={{ float: rtl ? 'left' : 'right', background: 'none', border: 'none', color: 'var(--component-text-primary)', fontSize: 20, cursor: 'pointer' }}
                >&#x2715;</button>

                {/* Header */}
                <div style={{
                  padding: '14px 16px', borderRadius: 10, marginBottom: 16,
                  background: `${ragColors[detail.rag]}12`,
                  borderLeft: `4px solid ${ragColors[detail.rag]}`,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: ragColors[detail.rag], marginBottom: 4 }}>
                    {fromLbl} {rtl ? '←' : '→'} {toLbl}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: ragColors[detail.rag] }}>
                    {detail.hasLinks ? `${healthPct}%` : '—'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--component-text-secondary)', marginTop: 2 }}>
                    {lang === 'ar' ? 'صحة الاتصال' : 'Connection Health'}
                  </div>
                </div>

                {/* Health Bar */}
                {detail.hasLinks && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--component-bg-secondary)' }}>
                      <div style={{ width: `${healthPct}%`, height: '100%', background: ragColors[detail.rag], transition: 'width 0.6s' }} />
                    </div>
                  </div>
                )}

                {/* Formula */}
                <div style={{
                  padding: '12px 14px', borderRadius: 8, marginBottom: 16,
                  background: 'var(--component-bg-secondary)', lineHeight: 1.8,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-secondary)', marginBottom: 6 }}>
                    {lang === 'ar' ? 'الحساب' : 'Calculation'}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--component-text-primary)', fontWeight: 600 }}>
                    ({detail.orphanCount} + {detail.bastardCount}) / {total} = {brokenTotal}/{total} = {Math.round((1 - detail.connectivity) * 100)}% {lang === 'ar' ? 'غير مرتبط' : 'unlinked'}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: 'var(--component-text-secondary)' }}>
                    {lang === 'ar'
                      ? `${detail.orphanCount} ${fromLbl} بدون وجهة + ${detail.bastardCount} ${toLbl} بدون مصدر`
                      : `${detail.orphanCount} ${fromLbl} with no destination + ${detail.bastardCount} ${toLbl} with no source`}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'var(--component-text-secondary)' }}>
                    {lang === 'ar'
                      ? '0% = أخضر · ≤15% = أصفر · >15% = أحمر'
                      : '0% = green · ≤15% = amber · >15% = red'}
                  </div>
                </div>

                {/* Group 1: From-side not connected */}
                {detail.disconnectedFrom.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-secondary)', marginBottom: 8 }}>
                      {lang === 'ar'
                        ? `${fromLbl} بدون وجهة (${detail.orphanCount})`
                        : `${fromLbl} not reaching ${toLbl} (${detail.orphanCount})`}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 220, overflowY: 'auto' }}>
                      {detail.disconnectedFrom.map(renderNodeRow)}
                    </div>
                  </div>
                )}

                {/* Group 2: To-side not connected */}
                {detail.disconnectedTo.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-secondary)', marginBottom: 8 }}>
                      {lang === 'ar'
                        ? `${toLbl} بدون مصدر (${detail.bastardCount})`
                        : `${toLbl} not fed by ${fromLbl} (${detail.bastardCount})`}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 220, overflowY: 'auto' }}>
                      {detail.disconnectedTo.map(renderNodeRow)}
                    </div>
                  </div>
                )}

                {/* All connected */}
                {detail.hasLinks && detail.orphanCount === 0 && detail.bastardCount === 0 && (
                  <div style={{
                    padding: '14px 16px', borderRadius: 8,
                    background: '#22c55e12', color: '#22c55e',
                    fontSize: 14, fontWeight: 600, textAlign: 'center',
                  }}>
                    {lang === 'ar' ? 'جميع العناصر مرتبطة بشكل سليم' : 'All elements are properly connected'}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      </div>

      {/* ── AI Report Modal ── */}
      <StrategyReportModal
        isOpen={aiModalOpen}
        onClose={() => { setAiModalOpen(false); setAiHtml(''); setAiArtifacts([]); }}
        htmlContent={aiLoading ? `<div style="text-align:center;padding:40px;color:var(--component-text-secondary)">${lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}</div>` : aiHtml}
        artifacts={aiArtifacts}
        onContinueInChat={() => {
          setAiModalOpen(false);
          if (aiConversationId && onContinueInChat) onContinueInChat(aiConversationId);
        }}
        title={aiTitle}
      />

      {/* ── Micro Help Answer Tooltip ── */}
      {microAnswer && (
        <div className="ont-micro-answer">
          <div className="ont-micro-answer__header">
            <span className="ont-micro-answer__title">{microAnswer.title}</span>
            <button className="ont-micro-answer__close" onClick={() => setMicroAnswer(null)}>&#x2715;</button>
          </div>
          <div className="ont-micro-answer__body">
            {microAnswer.scope === 'block1' && <div className="ont-micro-answer__badge">{lang === 'ar' ? 'أعلى ٣ أولويات' : 'Top 3 Priorities'}</div>}
            {microAnswer.scope === 'item' && <div className="ont-micro-answer__badge ont-micro-answer__badge--item">{lang === 'ar' ? 'تفاصيل العنصر' : 'Item Detail'}</div>}
            <div className="ont-micro-answer__text">{microAnswer.text}</div>
          </div>
        </div>
      )}

      {/* ── AI Loading Overlay ── */}
      {aiLoading && (
        <div className="ont-ai-loading">
          <div className="ont-ai-loading__spinner" />
        </div>
      )}
    </div>
  );
}
