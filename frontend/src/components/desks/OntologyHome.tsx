import './OntologyHome.css';
import { Fragment, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchOntologyRagState, type OntologyRagState, type NodeInstance, type LoadingStep, type LineHealthDetail, type UpstreamRedSource, type LinkedNode } from '../../services/ontologyService';
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
  topKey?: string;
  bottomKey?: string;
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
  'capabilities->orgUnits':       { topKey: 'ont_line_role_gaps', bottomKey: 'ont_line_operates', mx: 4030, my: 1637, topDy: -50, bottomDy: 22 },
  'capabilities->processes':      { topKey: 'ont_line_knowledge_gaps', bottomKey: 'ont_line_operates_2', mx: 4085, my: 2148, topDy: -50, bottomDy: 22 },
  'capabilities->itSystems':      { topKey: 'ont_line_automation_gaps', bottomKey: 'ont_line_operates_3', mx: 4030, my: 2679, topDy: -50, bottomDy: 22 },
  'capabilities->risks':          { topKey: 'ont_line_monitored_by', mx: 3267, my: 2120, topDy: -26 },
  'itSystems->projects':          { topKey: 'ont_line_gaps_scope', bottomKey: 'ont_line_close_gaps', mx: 5040, my: 2679, topDy: -50, bottomDy: 22 },
  'itSystems->vendors':           { topKey: 'ont_line_depends_on', mx: 4280, my: 3093, topDy: -30 },
  'orgUnits->projects':           { topKey: 'ont_line_gaps_scope', bottomKey: 'ont_line_close_gaps', mx: 5040, my: 1637, topDy: -50, bottomDy: 22 },
  'orgUnits->processes':          { topKey: 'ont_line_apply', mx: 4434, my: 1952, topDy: -26 },
  'policyTools->adminRecords':    { topKey: 'ont_line_refers_to', bottomKey: 'ont_line_applied_on', mx: 1560, my: 1630, dx: -158, topDy: -16, bottomDy: 165 },

  'risks->policyTools':           { topKey: 'ont_line_informs', mx: 2317, my: 1357, topDy: -26 },
  'projects->changeAdoption':     { topKey: 'ont_line_adoption_risks', bottomKey: 'ont_line_increase_adoption', mx: 5607, my: 2497, dx: -158, topDy: -50, bottomDy: 22 },
  'processes->projects':          { topKey: 'ont_line_gaps_scope', bottomKey: 'ont_line_close_gaps', mx: 4900, my: 2148, topDy: -50, bottomDy: 22 },
  'sectorObjectives->performance':{ topKey: 'ont_line_cascaded_via', bottomKey: 'ont_line_aggregates_to', mx: 965, my: 3294, topDy: -50, bottomDy: 22 },
  'sectorObjectives->policyTools':{ topKey: 'ont_line_realized_via', bottomKey: 'ont_line_governed_by', mx: 915, my: 1242, topDy: -50, bottomDy: 22 },
  'adminRecords->dataTransactions':{ topKey: 'ont_line_triggers_event', mx: 1635, my: 2670, dx: -200, topDy: -22 },
  'dataTransactions->performance':{ topKey: 'ont_line_measured_by', mx: 1635, my: 2884, dx: -200, topDy: -18 },
  'risks->performance':           { topKey: 'ont_line_informs', mx: 2317, my: 3056, topDy: -18 },
  'policyTools->capabilities':    { topKey: 'ont_line_sets_priorities', mx: 2800, my: 1208, topDy: -26 },
  'performance->capabilities':    { topKey: 'ont_line_sets_targets', mx: 2800, my: 3280, topDy: -26 },
  'cultureHealth->orgUnits':      { topKey: 'ont_line_monitors_for', mx: 4270, my: 1378, topDy: -28 },
  'processes->itSystems':         { topKey: 'ont_line_automation', mx: 4434, my: 2474, topDy: -18 },
  'risks->riskPlans':             { topKey: 'ont_line_has_plan', mx: 3017, my: 2560, dx: -120, topDy: -18 },
};

// Node label map for side panel — maps to i18n keys (ont_node_*)
const NODE_LABEL_KEYS: Record<string, string> = {
  sectorObjectives: 'ont_node_sectorObjectives',
  policyTools:      'ont_node_policyTools',
  adminRecords:     'ont_node_adminRecords',
  dataTransactions: 'ont_node_dataTransactions',
  performance:      'ont_node_performance',
  risks:            'ont_node_risks',
  riskPlans:        'ont_node_riskPlans',
  cultureHealth:    'ont_node_cultureHealth',
  capabilities:     'ont_node_capabilities',
  orgUnits:         'ont_node_orgUnits',
  processes:        'ont_node_processes',
  itSystems:        'ont_node_itSystems',
  vendors:          'ont_node_vendors',
  projects:         'ont_node_projects',
  changeAdoption:   'ont_node_changeAdoption',
};


interface OntologyHomeProps {
  onContinueInChat?: (conversationId: number) => void;
  year?: number | string;
  quarter?: string;
}

export default function OntologyHome({ onContinueInChat, year, quarter }: OntologyHomeProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const rtl = lang === 'ar';

  const [ragState, setRagState] = useState<OntologyRagState | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [_loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
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
  const [microAnswer, setMicroAnswer] = useState<{
    title: string;
    scope: 'landscape' | 'block1' | 'item';
    sections: { key: string; label: string; text: string; color: string }[];
    loading?: boolean;
  } | null>(null);

  // Escape key exits micro help mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (microAnswer) { setMicroAnswer(null); return; }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [microAnswer]);

  useEffect(() => {
    setRagState(null);
    setSelectedNode(null);
    fetchOntologyRagState(setLoadingSteps, year, quarter)
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

  // ── Serialization helpers ──

  // Serialize all relevant props from a node (skip noise like embeddings, internal IDs)
  const serializeProps = (props: Record<string, any>): string => {
    const skip = new Set(['embedding', 'vector', 'id', 'name', 'title', 'year', 'quarter', 'level']);
    const parts: string[] = [];
    for (const [k, v] of Object.entries(props)) {
      if (skip.has(k) || v == null || v === '' || v === 'null') continue;
      parts.push(`${k}: ${v}`);
    }
    return parts.join(' | ');
  };

  // Serialize a single NodeInstance with ALL data
  const serializeItem = (inst: NodeInstance, label: string): string => {
    const lines: string[] = [];
    const propsStr = serializeProps(inst.props);
    lines.push(`- ${inst.id} ${inst.name} [${label}] — Status: ${inst.rag}${inst.rawRag !== inst.rag ? ` (raw: ${inst.rawRag})` : ''} | Impact: ${inst.impact.toFixed(1)} | Urgency: ${inst.urgency.toFixed(2)}`);
    if (propsStr) lines.push(`  Properties: ${propsStr}`);
    if (inst.upstreamNodes.length > 0) {
      lines.push(`  Depends on: ${inst.upstreamNodes.map(u => `${u.id} ${u.name} [${u.nodeType}](${u.rag})`).join(', ')}`);
    }
    if (inst.downstreamNodes.length > 0) {
      lines.push(`  Affects: ${inst.downstreamNodes.map(d => `${d.id} ${d.name} [${d.nodeType}](${d.rag})`).join(', ')}`);
    }
    if (inst.upstreamReds.length > 0) {
      lines.push(`  Cascading reds from: ${inst.upstreamReds.map(r => `${r.id} ${r.name} [${r.nodeType}]`).join(', ')}`);
    }
    if (inst.linkedPlans.length > 0) {
      lines.push(`  Mitigation plans: ${inst.linkedPlans.map(p => `${p.name}(${p.status}, ${p.isOnTrack ? 'on-track' : 'off-track'})`).join(', ')}`);
    }
    return lines.join('\n');
  };

  // Serialize all items for a node type
  const serializeNodeType = (nodeType: string, instances: NodeInstance[]): string => {
    const label = NODE_LABEL_KEYS[nodeType] ? t(NODE_LABEL_KEYS[nodeType]) : nodeType;
    if (instances.length === 0) return `\n${label}: (none)`;
    const lines: string[] = [`\n${label} (${instances.length} total):`];
    for (const inst of instances) {
      lines.push(serializeItem(inst, label));
    }
    return lines.join('\n');
  };

  // ── AI Query Builders ──

  const COLUMN_NODE_MAP: Record<string, string[]> = {
    goals: ['sectorObjectives'],
    sector: ['policyTools', 'adminRecords', 'dataTransactions'],
    health: ['performance', 'risks'],
    capacity: ['capabilities', 'orgUnits', 'processes', 'itSystems'],
    velocity: ['projects', 'changeAdoption', 'cultureHealth', 'vendors'],
  };

  const buildExecutiveQuery = useCallback((): string => {
    if (!ragState) return '';
    const period = `${year || 2026} Q${quarter || '1'}`;
    const lines: string[] = [
      `SECTOR ONTOLOGY — FULL DATA SNAPSHOT`,
      `Period: ${period}`,
      ``,
      `═══ DOMAIN SUMMARY ═══`,
    ];

    // Strip data per column
    for (const s of ragState.stripData || []) {
      const colName = COLUMN_TITLE_KEYS[s.column] ? t(COLUMN_TITLE_KEYS[s.column]) : s.column;
      lines.push(`${colName}: ${s.green} on-track | ${s.amber} at-risk | ${s.red} critical (total: ${s.total})`);
      if (s.narrative) lines.push(`  Summary: ${s.narrative}`);
    }

    // Risk stats
    if (ragState.riskStats) {
      const rs = ragState.riskStats;
      lines.push(``, `═══ RISK BREAKDOWN ═══`);
      lines.push(`BUILD risks: ${rs.buildRed} red | ${rs.buildAmber} amber | ${rs.buildGreen} green`);
      lines.push(`OPERATE risks: ${rs.operateRed} red | ${rs.operateAmber} amber | ${rs.operateGreen} green`);
      lines.push(`Total risks: ${rs.total}`);
    }

    // Chain health
    if (ragState.lineDetails) {
      lines.push(``, `═══ VALUE CHAIN INTEGRITY ═══`);
      for (const [key, h] of Object.entries(ragState.lineDetails)) {
        lines.push(`${key}: ${h.rag} | connectivity: ${(h.connectivity * 100).toFixed(0)}% | links: ${h.linkCount} | orphans: ${h.orphanCount} | broken: ${h.bastardCount}`);
        if (h.disconnectedFrom.length > 0) lines.push(`  Disconnected sources: ${h.disconnectedFrom.map(d => d.name).join(', ')}`);
        if (h.disconnectedTo.length > 0) lines.push(`  Disconnected targets: ${h.disconnectedTo.map(d => d.name).join(', ')}`);
      }
    }

    // ALL items by type with ALL properties
    lines.push(``, `═══ COMPLETE ITEM DATA ═══`);
    for (const [nodeType, instances] of Object.entries(ragState.nodeDetails)) {
      lines.push(serializeNodeType(nodeType, instances));
    }

    lines.push(``, t('ont_executive_prompt'));
    return lines.join('\n');
  }, [ragState, t, year, quarter]);

  const buildColumnQuery = useCallback((columnKey: string): string => {
    if (!ragState) return '';
    const strip = ragState.stripData?.find(s => s.column === columnKey);
    const colName = COLUMN_TITLE_KEYS[columnKey] ? t(COLUMN_TITLE_KEYS[columnKey]) : columnKey;
    const period = `${year || 2026} Q${quarter || '1'}`;
    const lines: string[] = [
      `${colName} — FULL DOMAIN DATA`,
      `Period: ${period}`,
      ``,
    ];

    if (strip) {
      lines.push(`Status distribution: ${strip.green} on-track | ${strip.amber} at-risk | ${strip.red} critical (total: ${strip.total})`);
      if (strip.narrative) lines.push(`Summary: ${strip.narrative}`);
    }

    // ALL items in this column with ALL properties
    const nodeTypes = COLUMN_NODE_MAP[columnKey] || [];
    lines.push(``, `═══ ALL ITEMS ═══`);
    for (const nt of nodeTypes) {
      const instances = ragState.nodeDetails[nt] || [];
      lines.push(serializeNodeType(nt, instances));
    }

    // Related chain health for this column
    if (ragState.lineDetails) {
      const relevantChains: Record<string, string[]> = {
        goals: ['setting_strategic_initiatives', 'setting_strategic_priorities', 'sector_value_chain'],
        sector: ['sector_value_chain'],
        health: ['capability_to_policy', 'capability_to_performance'],
        capacity: ['setting_strategic_initiatives', 'setting_strategic_priorities', 'change_to_capability', 'sustainable_operations'],
        velocity: ['setting_strategic_initiatives', 'change_to_capability', 'sustainable_operations'],
      };
      const chains = relevantChains[columnKey] || [];
      if (chains.length > 0) {
        lines.push(``, `═══ RELATED CHAIN HEALTH ═══`);
        for (const key of chains) {
          const h = ragState.lineDetails[key];
          if (h) {
            lines.push(`${key}: ${h.rag} | connectivity: ${(h.connectivity * 100).toFixed(0)}% | orphans: ${h.orphanCount} | broken: ${h.bastardCount}`);
          }
        }
      }
    }

    lines.push(``, t('ont_column_prompt', { colName }));
    return lines.join('\n');
  }, [ragState, t, year, quarter]);

  const buildMicroQuery = useCallback((target: string, scope: 'landscape' | 'block1' | 'item'): string => {
    if (!ragState) return '';

    if (scope === 'landscape') {
      const instances = ragState.nodeDetails[target] || [];
      const label = NODE_LABEL_KEYS[target] ? t(NODE_LABEL_KEYS[target]) : target;
      const lines: string[] = [
        `${label} — FULL CATEGORY DATA`,
        `Overall status: ${ragState.nodeRag[target] ?? 'default'} | Total: ${instances.length} | Red: ${instances.filter(i => i.rag === 'red').length} | Amber: ${instances.filter(i => i.rag === 'amber').length} | Green: ${instances.filter(i => i.rag === 'green').length}`,
        ``,
        `═══ ALL ITEMS ═══`,
      ];
      for (const inst of instances) {
        lines.push(serializeItem(inst, label));
      }
      lines.push(``, t('ont_micro_landscape_prompt', { label }));
      return lines.join('\n');
    }

    if (scope === 'block1') {
      const instances = ragState.nodeDetails[target] || [];
      const issues = instances.filter(i => i.rag === 'red' || i.rag === 'amber');
      const label = NODE_LABEL_KEYS[target] ? t(NODE_LABEL_KEYS[target]) : target;
      const lines: string[] = [
        `${label} — TOP ISSUES (${issues.length} red/amber items)`,
        ``,
      ];
      for (const inst of issues) {
        lines.push(serializeItem(inst, label));
      }
      lines.push(``, t('ont_micro_block1_prompt'));
      return lines.join('\n');
    }

    // scope === 'item'
    let inst: NodeInstance | undefined;
    let instType = '';
    for (const [nodeType, insts] of Object.entries(ragState.nodeDetails)) {
      inst = insts.find(i => i.id === target);
      if (inst) { instType = nodeType; break; }
    }
    if (!inst) return `Item ${target} not found in current data.`;
    const label = NODE_LABEL_KEYS[instType] ? t(NODE_LABEL_KEYS[instType]) : instType;
    const lines: string[] = [
      `${inst.name} — FULL ITEM DATA`,
      ``,
      serializeItem(inst, label),
    ];
    lines.push(``, t('ont_micro_item_prompt', { name: inst.name }));
    return lines.join('\n');
  }, [ragState, t]);

  // Professional column titles (not internal keys) — maps to i18n keys (ont_col_*)
  const COLUMN_TITLE_KEYS: Record<string, string> = {
    goals: 'ont_col_goals',
    sector: 'ont_col_sector',
    health: 'ont_col_health',
    capacity: 'ont_col_capacity',
    velocity: 'ont_col_velocity',
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


    // Resolve title for micro tooltip
    const microScope = scope || 'landscape';
    let microTitle = '';
    if (tier === 'micro') {
      if (microScope === 'landscape') {
        microTitle = NODE_LABEL_KEYS[context] ? t(NODE_LABEL_KEYS[context]) : context;
      } else if (microScope === 'block1') {
        microTitle = t('ont_top_issues');
      } else {
        // single item — find its id + name + type
        let itemName = context;
        if (ragState) {
          for (const [nodeType, insts] of Object.entries(ragState.nodeDetails)) {
            const found = insts.find(i => i.id === context);
            if (found) {
              const typeLbl = NODE_LABEL_KEYS[nodeType] ? t(NODE_LABEL_KEYS[nodeType]) : nodeType;
              itemName = `${found.id} ${found.name} [${typeLbl}]`;
              break;
            }
          }
        }
        microTitle = itemName;
      }
      setMicroAnswer({ title: microTitle, scope: microScope, sections: [], loading: true });
    } else {
      setAiLoading(true);
      const colTitle = COLUMN_TITLE_KEYS[context] ? t(COLUMN_TITLE_KEYS[context]) : context;
      setAiTitle(tier === 'executive'
        ? t('ont_sector_status_report')
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
        // Strip HTML to plain text for parsing
        const plain = answer.replace(/<[^>]+>/g, '').trim();
        // Parse [KEY] sections from LLM response
        const sectionColors: Record<string, string> = {
          WHY: '#f59e0b', CAUSE: '#f59e0b', DIAGNOSIS: '#f59e0b',
          IMPACT: '#ef4444', RISK: '#ef4444', DOWNSTREAM: '#ef4444',
          ACTION: '#22c55e', FIX: '#22c55e', NEXT: '#22c55e',
          PATTERN: '#8b5cf6', LINK: '#8b5cf6', CONNECTION: '#8b5cf6',
          PRIORITY: '#3b82f6', SEQUENCE: '#3b82f6', ORDER: '#3b82f6',
          STATUS: '#60a5fa', HEALTH: '#60a5fa',
        };
        const sectionRegex = /\[([A-Z]+)\]\s*/g;
        const parts = plain.split(sectionRegex).filter(Boolean);
        const sections: { key: string; label: string; text: string; color: string }[] = [];
        for (let i = 0; i < parts.length - 1; i += 2) {
          const key = parts[i].trim().toUpperCase();
          const text = parts[i + 1].trim();
          if (text) {
            sections.push({
              key,
              label: key.charAt(0) + key.slice(1).toLowerCase(),
              text,
              color: sectionColors[key] || '#60a5fa',
            });
          }
        }
        // Fallback: if LLM didn't use [KEY] format, show as single insight card
        if (sections.length === 0 && plain) {
          sections.push({ key: 'INSIGHT', label: 'Insight', text: plain, color: '#60a5fa' });
        }
        setMicroAnswer({ title: microTitle, scope: microScope, sections });
      } else {
        setAiHtml(answer);
        setAiArtifacts(artifacts);
        if (response.conversation_id) setAiConversationId(response.conversation_id);
      }
    } catch (err: any) {
      const errMsg = `<p style="color:#ef4444">${t('ont_analysis_failed')}: ${err.message || err}</p>`;
      if (tier === 'micro') {
        setMicroAnswer({ title: microTitle, scope: microScope, sections: [{ key: 'ERROR', label: 'Error', text: t('ont_micro_failed'), color: '#ef4444' }] });
      } else {
        setAiHtml(errMsg);
      }
    } finally {
      setAiLoading(false);
    }
  }, [buildExecutiveQuery, buildColumnQuery, buildMicroQuery, t, ragState]);

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

      {/* ── Loading Tracker (paused) ── */}
      {/* {loadingSteps.length > 0 && (
        <div className="ont-loading-tracker">
          <div className="ont-loading-title">
            {t('ont_loading_data')}
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
      )} */}

      <div className="ont-svg-stage">

        {/* ── Layer 0: Column Header Strip ── */}
        <div className="ont-header-strip">
          {[
            { key: 'goals',    i18nKey: 'ont_header_goals',    pct: 15.42, icon: '/att/ontology/header-goals.png' },
            { key: 'sector',   i18nKey: 'ont_header_sector',   pct: 24.84, icon: '/att/ontology/header-sector-output.png' },
            { key: 'health',   i18nKey: 'ont_header_health',   pct: 14.78, icon: '/att/ontology/header-health.png' },
            { key: 'capacity', i18nKey: 'ont_header_capacity', pct: 29.17, icon: '/att/ontology/header-capacity.png' },
            { key: 'velocity', i18nKey: 'ont_header_velocity', pct: 15.79, icon: '/att/ontology/header-velocity.png' },
          ].map((col, i) => (
            <div key={col.key} className="ont-header-col" style={{ flex: `0 0 ${col.pct}%` }}>
              {i > 0 && <span className="ont-header-arrow">{rtl ? '\u2190' : '\u2192'}</span>}
              <img src={col.icon} alt="" style={{ height: 32, marginRight: 6 }} draggable={false} />
              <span className="ont-header-label">{t(col.i18nKey)}</span>
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
                  {t('ont_analyze')}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Landscape Container (aspect-ratio wrapper) ── */}
        <div className="ont-landscape-wrap">

        {/* ── Layer 1: Background shapes from Figma export ── */}
        <img
          src={rtl ? '/att/ontology/landscape-ar.jpg' : '/att/ontology/landscape-en.jpg'}
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
                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                    onClick={() => {
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
          const topText = meta.topKey ? t(meta.topKey) : null;
          const bottomText = meta.bottomKey ? t(meta.bottomKey) : null;
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
            <span>{t('ont_ai_report')}</span>
          </button>
        )}

        </div>{/* end ont-landscape-wrap */}

        {/* ── Layer 4: Side Panel ── */}
        {selectedNode && (() => {
          const nodeRag = getNodeRag(selectedNode);
          const nodeLbl = NODE_LABEL_KEYS[selectedNode] ? t(NODE_LABEL_KEYS[selectedNode]) : selectedNode;
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
              ? t('ont_operate_risks')
              : t('ont_build_risks');
          }

          // Generate human-readable verdict
          const verdict = (() => {
            if (counts.total === 0) return t('ont_no_data_available');
            if (isPropagated) {
              return t('ont_status_caused_by', { riskType: propagatedRiskType });
            }
            if (nodeRag === 'red') return t('ont_needs_attention', { count: counts.red, total: counts.total });
            if (nodeRag === 'amber') return t('ont_items_at_risk', { count: counts.amber });
            return t('ont_operating_normally', { green: counts.green, total: counts.total });
          })();

          // Generate "so what" insight
          const insight = (() => {
            if (reds.length === 0) return null;
            const top = reds[0];
            if (top.impact > 0) return t('ont_impact_cascade', { name: top.name, impact: top.impact });
            return t('ont_urgent_review', { name: top.name });
          })();

          // Human-readable status for each issue
          const getIssueContext = (inst: NodeInstance): string => {
            if (inst.props.execute_status === 'issues') return t('ont_operations_disrupted');
            if (inst.props.execute_status === 'at-risk') return t('ont_performance_declining');
            if (inst.props.build_status?.includes('issues')) return t('ont_delivery_delayed');
            if (inst.props.build_status?.includes('atrisk')) return t('ont_timeline_at_risk');
            if (inst.props.actual_value != null && inst.props.target != null) {
              const pct = Math.round((inst.props.actual_value / inst.props.target) * 100);
              return t('ont_pct_of_target', { pct });
            }
            if (inst.props.progress_percentage != null) {
              const pctVal = Math.round(parseFloat(inst.props.progress_percentage) * 100);
              return t('ont_pct_progress', { pct: pctVal });
            }
            return inst.rag === 'red' ? t('ont_needs_intervention') : t('ont_monitor');
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
                      {t('ont_view_risks')}
                    </button>
                  )}
                </div>

                {/* ── Health Bar ── */}
                {counts.total > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    {isPropagated ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: 'var(--component-text-secondary)' }}>
                          <span>{t('ont_affected')}</span>
                          <span style={{ fontWeight: 700, color: ragColors[nodeRag] }}>{propagatedAtRiskCount} / {counts.total}</span>
                        </div>
                        <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--component-bg-secondary)' }}>
                          {(counts.total - propagatedAtRiskCount) > 0 && <div style={{ flex: counts.total - propagatedAtRiskCount, background: '#22c55e', transition: 'flex 0.6s' }} />}
                          {propagatedAtRiskCount > 0 && <div style={{ flex: propagatedAtRiskCount, background: ragColors[nodeRag], transition: 'flex 0.6s' }} />}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 3, color: 'var(--component-text-secondary)' }}>
                          <span style={{ color: '#22c55e' }}>{counts.total - propagatedAtRiskCount} {t('ont_clear')}</span>
                          <span style={{ color: ragColors[nodeRag] }}>{propagatedAtRiskCount} {t('ont_affected_lower')}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: 'var(--component-text-secondary)' }}>
                          <span>{t('ont_health_rate')}</span>
                          <span style={{ fontWeight: 700, color: ragColors[nodeRag] }}>{healthPct}%</span>
                        </div>
                        <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--component-bg-secondary)' }}>
                          {counts.green > 0 && <div style={{ flex: counts.green, background: '#22c55e', transition: 'flex 0.6s' }} />}
                          {counts.amber > 0 && <div style={{ flex: counts.amber, background: '#f59e0b', transition: 'flex 0.6s' }} />}
                          {counts.red > 0 && <div style={{ flex: counts.red, background: '#ef4444', transition: 'flex 0.6s' }} />}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 3, color: 'var(--component-text-secondary)' }}>
                          <span>{counts.green} {t('ont_healthy')}</span>
                          <span>{counts.amber} {t('ont_watch')}</span>
                          <span>{counts.red} {t('ont_critical')}</span>
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
                        ? t('ont_items_affected_operate')
                        : t('ont_items_affected_build'))
                    : t('ont_priority_list');

                  const renderStandardItem = (inst: NodeInstance, idx: number) => {
                    const upstream = getUpstreamIssues(inst);
                    return (
                      <div key={inst.id} style={{
                        padding: '10px 12px', borderRadius: 8,
                        background: `${ragColors[inst.rag]}08`,
                        border: `1px solid ${ragColors[inst.rag]}30`,
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
                              {inst.id && <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--component-text-secondary)', marginInlineEnd: 4 }}>{inst.id}</span>}
                              {inst.name}
                              <span style={{ fontSize: 10, color: 'var(--component-text-secondary)', marginInlineStart: 4 }}>[{nodeLbl}]</span>
                            </div>
                            <div style={{ fontSize: 11, color: ragColors[inst.rag], marginTop: 2 }}>
                              {getIssueContext(inst)}
                            </div>
                          </div>
                        </div>
                        {upstream.length > 0 && (
                          <div style={{ marginTop: 6, paddingLeft: 32 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-secondary)', marginBottom: 3 }}>
                              {t('ont_affected_by')}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {upstream.slice(0, 3).map(n => {
                                const nTypeLbl = NODE_LABEL_KEYS[n.nodeType] ? t(NODE_LABEL_KEYS[n.nodeType]) : n.nodeType;
                                return (
                                  <div key={n.id} style={{ fontSize: 10, color: ragColors[n.rag], display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: ragColors[n.rag], flexShrink: 0 }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.id} {n.name}</span>
                                    <span style={{ color: 'var(--component-text-secondary)', fontSize: 9, flexShrink: 0 }}>[{nTypeLbl}]</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <button
                          className="ont-ai-strip-btn"
                          style={{ fontSize: 9, padding: '2px 6px', marginTop: 6, alignSelf: 'flex-start', marginLeft: 32 }}
                          onClick={(e) => { e.stopPropagation(); handleOntologyAI('micro', inst.id, 'item'); }}
                          disabled={aiLoading}
                          title={t('josoor.common.summarize')}
                        >✦ {t('josoor.common.summarize')}</button>
                      </div>
                    );
                  };

                  return (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{sectionLabel} ({allIssues.length})</span>
                        <button
                          className="ont-ai-strip-btn"
                          style={{ fontSize: 9, padding: '2px 6px' }}
                          onClick={(e) => { e.stopPropagation(); handleOntologyAI('micro', selectedNode, 'block1'); }}
                          disabled={aiLoading}
                          title={t('ont_analyze_top_priorities')}
                        >✦ {t('ont_analyze')}</button>
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
                            {showAllIssues ? t('ont_hide') : t('ont_more_items', { count: rest.length })}
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
                    { key: 'build', label: t('ont_build_risks_label'), r: rs.buildRed, a: rs.buildAmber, g: rs.buildGreen },
                    { key: 'operate', label: t('ont_operate_risks_label'), r: rs.operateRed, a: rs.operateAmber, g: rs.operateGreen },
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
                              <div style={{ fontSize: 10, color: 'var(--component-text-secondary)' }}>{t('ont_no_data')}</div>
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
                      {t('ont_all_items', { count: instances.length })}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
                      {instances.map(inst => (
                        <div
                          key={inst.id}
                          style={{
                            padding: '6px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6,
                            background: `${ragColors[inst.rag]}08`,
                            border: `1px solid ${ragColors[inst.rag]}15`,
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ragColors[inst.rag], flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--component-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--component-text-secondary)', marginInlineEnd: 3 }}>{inst.id}</span>
                            {inst.name}
                            <span style={{ fontSize: 9, color: 'var(--component-text-secondary)', marginInlineStart: 3 }}>[{nodeLbl}]</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Summary Stats ── */}
                {counts.total > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    {[
                      { n: counts.total, label: t('ont_total'), color: 'var(--component-text-primary)' },
                      { n: counts.green, label: t('ont_ok'), color: '#22c55e' },
                      { n: counts.red + counts.amber, label: t('ont_attention'), color: '#ef4444' },
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


                {instances.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--component-text-secondary)', textAlign: 'center', padding: 20 }}>
                    {t('ont_no_data_for_node')}
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


          const fromLbl = NODE_LABEL_KEYS[selectedLine.from] ? t(NODE_LABEL_KEYS[selectedLine.from]) : selectedLine.from;
          const toLbl = NODE_LABEL_KEYS[selectedLine.to] ? t(NODE_LABEL_KEYS[selectedLine.to]) : selectedLine.to;
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
                    {t('ont_connection_health')}
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
                    {t('ont_calculation')}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--component-text-primary)', fontWeight: 600 }}>
                    ({detail.orphanCount} + {detail.bastardCount}) / {total} = {brokenTotal}/{total} = {Math.round((1 - detail.connectivity) * 100)}% {t('ont_unlinked')}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: 'var(--component-text-secondary)' }}>
                    {t('ont_from_no_dest', { count: detail.orphanCount, fromLbl, bastards: detail.bastardCount, toLbl })}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'var(--component-text-secondary)' }}>
                    {t('ont_threshold_rule')}
                  </div>
                </div>

                {/* Group 1: From-side not connected */}
                {detail.disconnectedFrom.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--component-text-secondary)', marginBottom: 8 }}>
                      {t('ont_from_not_reaching', { fromLbl, toLbl, count: detail.orphanCount })}
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
                      {t('ont_to_not_fed', { toLbl, fromLbl, count: detail.bastardCount })}
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
                    {t('ont_all_connected')}
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
        htmlContent={aiLoading ? `<div style="text-align:center;padding:40px;color:var(--component-text-secondary)">${t('ont_analyzing')}</div>` : aiHtml}
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
            {microAnswer.loading ? (
              <div className="ont-micro-answer__loading">
                <div className="ont-micro-answer__spinner" />
                <span>{t('ont_analyzing')}</span>
              </div>
            ) : (
              <div className="ont-micro-answer__cards">
                {microAnswer.sections.map((sec, i) => (
                  <div key={i} className="ont-micro-card" style={{ borderLeftColor: sec.color }}>
                    <div className="ont-micro-card__label" style={{ color: sec.color }}>{sec.label}</div>
                    <div className="ont-micro-card__text">{sec.text}</div>
                  </div>
                ))}
              </div>
            )}
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
